import { useEffect, useState } from "react";
import { db } from "../firebase/firebaseConfig";
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, writeBatch } from "firebase/firestore";
import "../styles/pages/Notifications.css";

const ConcernIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

const CommentIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
);

const CheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const TrashIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);

const ClockIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

const BellIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
);

export default function Notifications({ user }) {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "notifications"),
            where("recipientId", "==", user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const sortedData = data.sort((a, b) => {
                const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                return timeB - timeA;
            });
            setNotifications(sortedData);
        }, (error) => {
            console.error("Notifications Listener Error:", error);
        });

        return () => unsubscribe();
    }, [user]);

    const handleMarkAllRead = async () => {
        const unread = notifications.filter(n => !n.read);
        if (unread.length === 0) return;

        const batch = writeBatch(db);
        unread.forEach(n => {
            const docRef = doc(db, "notifications", n.id);
            batch.update(docRef, { read: true });
        });

        try {
            await batch.commit();
        } catch (error) {
            console.error("Failed to mark all as read:", error);
        }
    };

    const handleClearRead = async () => {
        const readNotifications = notifications.filter(n => n.read);
        if (readNotifications.length === 0) {
            alert("No read notifications to clear.");
            return;
        }

        if (!window.confirm("Delete all read notifications?")) return;

        const batch = writeBatch(db);
        readNotifications.forEach(n => {
            const docRef = doc(db, "notifications", n.id);
            batch.delete(docRef);
        });

        try {
            await batch.commit();
        } catch (error) {
            console.error("Failed to clear read notifications:", error);
        }
    };

    const formatTime = (createdAt) => {
        if (!createdAt) return "Just now";
        const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return "Just now";
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="notifications-wrapper">
            <header className="notifications-header">
                <h1 className="notifications-title">Notifications</h1>
                {notifications.length > 0 && (
                    <div className="notifications-actions">
                        <button onClick={handleMarkAllRead} className="action-btn btn-mark-read" disabled={!notifications.some(n => !n.read)}>
                            <CheckIcon /> Mark all as read
                        </button>
                        <button onClick={handleClearRead} className="action-btn btn-clear">
                            <TrashIcon /> Clear read
                        </button>
                    </div>
                )}
            </header>

            {notifications.length === 0 ? (
                <div className="empty-notifications">
                    <div className="empty-icon">
                        <BellIcon />
                    </div>
                    <h3 className="empty-title">All caught up!</h3>
                    <p className="empty-text">No notifications yet. Comments on your posts will appear here.</p>
                </div>
            ) : (
                <ul className="notifications-list">
                    {notifications.map((n) => (
                        <li 
                            key={n.id} 
                            className={`notification-card ${n.read ? "" : "unread"}`}
                            onClick={() => !n.read && updateDoc(doc(db, "notifications", n.id), { read: true })}
                        >
                            <div className={`notification-icon-container ${n.type === 'concern' ? 'icon-concern' : 'icon-comment'}`}>
                                {n.type === 'concern' ? <ConcernIcon /> : <CommentIcon />}
                            </div>
                            <div className="notification-content">
                                <p className="notification-message">{n.message}</p>
                                <div className="notification-meta">
                                    <span className="notification-time">
                                        <ClockIcon /> {formatTime(n.createdAt)}
                                    </span>
                                    {!n.read && <span className="unread-badge">New</span>}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
