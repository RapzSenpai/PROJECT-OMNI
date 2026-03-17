import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import ConcernForm from "../components/ConcernForm";
import ConcernCard from "../components/ConcernCard";
import "../styles/pages/Concerns.css";
import "../styles/pages/lost-found.css";

export default function Concerns({ user }) {
    const isAdmin = user?.role === "admin" || user?.isAdmin === true;
    const isStaff = user?.role === "staff";

    // Determine initial tab
    const [tab, setTab] = useState(() => {
        if (isAdmin || isStaff) return "publicFeed";
        return "submit";
    });

    const [concerns, setConcerns] = useState([]);
    const [selectedFilter, setSelectedFilter] = useState("all");

    // Reset filter when tab changes
    useEffect(() => {
        setSelectedFilter("all");
    }, [tab]);

    useEffect(() => {
        if (tab === "submit") {
            setConcerns([]);
            return;
        }

        let q;
        if (tab === "publicFeed") {
            q = query(
                collection(db, "concerns"),
                where("visibility", "==", "public")
            );
        } else if (tab === "privateFeed" && (isAdmin || isStaff)) {
            q = query(
                collection(db, "concerns"),
                where("visibility", "==", "private")
            );
        } else if (tab === "mySubmissions" && user) {
            q = query(
                collection(db, "concerns"),
                where("userId", "==", user.uid)
            );
        }

        if (!q) return;

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const now = Date.now();
            const data = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => {
                    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : now;
                    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : now;
                    return timeB - timeA;
                });
            setConcerns(data);
        }, (error) => {
            console.error("Error fetching concerns:", error);
        });

        return () => unsubscribe();
    }, [tab, user]);

    const filteredConcerns = concerns.filter(c => {
        if (selectedFilter === "all") return true;
        return c.type?.toLowerCase() === selectedFilter.toLowerCase();
    });

    return (
        <div className="concerns-wrapper">
            <header className="concerns-header">
                <h1 className="concerns-title">Concerns & Feedback</h1>
                <p className="concerns-subtitle">
                    Share your thoughts, report issues, or submit suggestions to improve the school experience.
                </p>
            </header>

            <nav className="tabs-container">
                {!(isAdmin || isStaff) && (
                    <button
                        className={`tab-button ${tab === "submit" ? "active" : ""}`}
                        onClick={() => setTab("submit")}
                    >
                        Submit Concern
                    </button>
                )}
                <button
                    className={`tab-button ${tab === "publicFeed" ? "active" : ""}`}
                    onClick={() => setTab("publicFeed")}
                >
                    Public Feed
                </button>
                {(isAdmin || isStaff) && (
                    <button
                        className={`tab-button ${tab === "privateFeed" ? "active" : ""}`}
                        onClick={() => setTab("privateFeed")}
                    >
                        Private Feed
                    </button>
                )}
                {!(isAdmin || isStaff) && (
                    <button
                        className={`tab-button ${tab === "mySubmissions" ? "active" : ""}`}
                        onClick={() => setTab("mySubmissions")}
                    >
                        My Submissions
                    </button>
                )}
            </nav>

            <main className="concerns-section">
                {tab === "submit" ? (
                    <ConcernForm
                        user={user}
                        onSubmitted={() => setTab("mySubmissions")}
                    />
                ) : (
                    <div className="feed-container">
                        <div className="feed-filter-container">
                            <div className="feed-filter">
                                <button
                                    className={`feed-filter-button ${selectedFilter === "all" ? "active" : ""}`}
                                    onClick={() => setSelectedFilter("all")}
                                >
                                    All
                                </button>
                                <button
                                    className={`feed-filter-button ${selectedFilter === "concern" ? "active" : ""}`}
                                    onClick={() => setSelectedFilter("concern")}
                                >
                                    Concern
                                </button>
                                <button
                                    className={`feed-filter-button ${selectedFilter === "feedback" ? "active" : ""}`}
                                    onClick={() => setSelectedFilter("feedback")}
                                >
                                    Feedback
                                </button>
                            </div>
                        </div>

                        {filteredConcerns.length === 0 ? (
                            <div className="empty-state-card">
                                <div className="empty-state-icon">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <line x1="16" y1="13" x2="8" y2="13" />
                                        <line x1="16" y1="17" x2="8" y2="17" />
                                        <polyline points="10 9 9 9 8 9" />
                                    </svg>
                                </div>
                                <p className="empty-state-text">
                                    {selectedFilter !== "all"
                                        ? `No ${selectedFilter}s found.`
                                        : (tab === "publicFeed" ? "No concerns submitted yet." : "No submissions yet.")
                                    }
                                </p>
                            </div>
                        ) : (
                            <ul className="feed-list">
                                {filteredConcerns.map(c => (
                                    <ConcernCard
                                        key={c.id}
                                        concern={c}
                                        currentUser={user}
                                        refreshSubmissions={(updateFn) =>
                                            setConcerns(prev => (updateFn ? updateFn(prev) : prev))
                                        }
                                    />
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
