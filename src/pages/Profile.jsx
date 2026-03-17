import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase/firebaseConfig";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import "../styles/pages/Profile.css";

const ProfileIcon = () => (
    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const ConcernIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    </svg>
);

const BoxIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
    </svg>
);

const SettingsIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
);

export default function Profile({ user }) {
    const [stats, setStats] = useState({ concerns: 0, items: 0 });
    const [recentConcerns, setRecentConcerns] = useState([]);
    const [recentItems, setRecentItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        // 1. Real-time concerns listener
        const concernsQuery = query(
            collection(db, "concerns"),
            where("userId", "==", user.uid)
        );

        const unsubscribeConcerns = onSnapshot(concernsQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const sorted = data.sort((a, b) => {
                const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                return timeB - timeA;
            });
            setStats(prev => ({ ...prev, concerns: data.length }));
            setRecentConcerns(sorted.slice(0, 3));
            setLoading(false);
        });

        // 2. Real-time lost/found items listener
        const itemsQuery = query(
            collection(db, "lost_items"),
            where("ownerId", "==", user.uid)
        );

        const unsubscribeItems = onSnapshot(itemsQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const sorted = data.sort((a, b) => {
                const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                return timeB - timeA;
            });
            setStats(prev => ({ ...prev, items: data.length }));
            setRecentItems(sorted.slice(0, 3));
        });

        return () => {
            unsubscribeConcerns();
            unsubscribeItems();
        };
    }, [user]);

    if (!user) return <div className="profile-wrapper"><p>Please log in to view your profile.</p></div>;

    const daysWithOmni = user.metadata?.createdAt
        ? Math.floor((new Date() - new Date(parseInt(user.metadata.createdAt))) / (1000 * 60 * 60 * 24))
        : 0;

    return (
        <div className="profile-wrapper">
            {/* Header Section */}
            <header className="profile-header-card">
                <div className="profile-avatar-container">
                    <ProfileIcon />
                </div>
                <div className="profile-info">
                    <h1>{user.fullName || "User Profile"}</h1>
                    <p className="profile-email">{user.email}</p>
                    <span className="profile-role-tag">{user.role || "User"}</span>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="profile-stats-grid">
                <div className="stat-card">
                    <span className="stat-value">{stats.concerns}</span>
                    <span className="stat-label">Concerns Submitted</span>
                </div>
                <div className="stat-card">
                    <span className="stat-value">{stats.items}</span>
                    <span className="stat-label">Items Reported</span>
                </div>
                <div className="stat-card">
                    <span className="stat-value">{daysWithOmni || 1}</span>
                    <span className="stat-label">Days with OMNI</span>
                </div>
            </div>

            {/* Modular Content Sections */}
            <div className="profile-content-sections">
                {/* Recent Concerns */}
                <div className="content-block">
                    <h2 className="block-title">
                        <ConcernIcon /> Recent Concerns
                    </h2>
                    <div className="activity-list">
                        {recentConcerns.length > 0 ? (
                            recentConcerns.map(c => (
                                <Link to="/concerns" key={c.id} className="activity-item">
                                    <span className="activity-type">{c.type}</span>
                                    <span className="activity-text">{c.description}</span>
                                </Link>
                            ))
                        ) : (
                            <p className="empty-activity">No concerns submitted yet.</p>
                        )}
                    </div>
                </div>

                {/* Recent Items */}
                <div className="content-block">
                    <h2 className="block-title">
                        <BoxIcon /> Lost & Found Feed
                    </h2>
                    <div className="activity-list">
                        {recentItems.length > 0 ? (
                            recentItems.map(i => (
                                <Link to="/lost-found" key={i.id} className="activity-item">
                                    <span className="activity-type">{i.type === 'lost' ? 'Lost Item' : 'Found Item'}</span>
                                    <span className="activity-text">{i.title}</span>
                                </Link>
                            ))
                        ) : (
                            <p className="empty-activity">No items reported yet.</p>
                        )}
                    </div>
                </div>

                {/* Settings Block */}
                <div className="content-block">
                    <h2 className="block-title">
                        <SettingsIcon /> Account Settings
                    </h2>
                    <p style={{ color: "#868e96", fontSize: "0.95rem", lineHeight: "1.6" }}>
                        Profile customization and security settings are coming soon. Stay tuned for updates!
                    </p>
                </div>
            </div>
        </div>
    );
}
