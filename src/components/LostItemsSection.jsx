import React, { useState, useEffect } from "react";
import LostItemForm from "./LostItemForm";
import LostItemCard from "./LostItemCard";

const LostItemsSection = ({ items, onRefresh, user }) => {
    const [isFormExpanded, setIsFormExpanded] = useState(false);
    const [filter, setFilter] = useState("all"); // all | claimed | unclaimed
    const filteredItems = (items || []).filter(item => {
        if (!item || item.type !== "lost") return false;
        const statusMatch = filter === "all" || item.status === filter;
        return statusMatch;
    });

    const SearchIcon = () => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    );

    const PackageIcon = () => (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="empty-state-icon">
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <path d="m3.3 7 8.7 5 8.7-5" />
            <path d="M12 22V12" />
        </svg>
    );

    return (
        <div className="flex flex-col h-full">
            <div className="feed-filter-container !justify-center">
                <div className="feed-filter">
                    <button
                        className={`feed-filter-button ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >All Status</button>
                    <button
                        className={`feed-filter-button ${filter === 'unclaimed' ? 'active' : ''}`}
                        onClick={() => setFilter('unclaimed')}
                    >Unclaimed</button>
                    <button
                        className={`feed-filter-button ${filter === 'claimed' ? 'active' : ''}`}
                        onClick={() => setFilter('claimed')}
                    >Claimed</button>
                </div>
            </div>

            {isFormExpanded ? (
                <LostItemForm
                    onItemAdded={onRefresh}
                    onCancel={() => setIsFormExpanded(false)}
                    type="lost"
                    user={user}
                />
            ) : (
                <div
                    onClick={() => setIsFormExpanded(true)}
                    className="lf-post-trigger flex items-center justify-center gap-3"
                >
                    <SearchIcon />
                    <span>What did you lose? Click here to report.</span>
                </div>
            )}

            <div className="flex-1 overflow-y-auto pr-2">
                {filteredItems.length === 0 ? (
                    <div className="feed-container">
                        <div className="empty-state-card">
                            <PackageIcon />
                            <p className="empty-state-text mb-4">No lost items yet.</p>
                        </div>
                    </div>
                ) : (
                    filteredItems.map(item => (
                        <LostItemCard key={item.id} item={item} refreshItems={onRefresh} user={user} />
                    ))
                )}
            </div>
        </div>
    );
};

export default LostItemsSection;
