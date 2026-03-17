import React, { useState, useEffect } from "react";
import LostItemForm from "./LostItemForm";
import FoundItemCard from "./FoundItemCard";
import { auth, db } from "../firebase/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

const FoundItemsSection = ({ items, onRefresh, user }) => {
    const [filter, setFilter] = useState("all"); // all | claimed | unclaimed
    const [isFormExpanded, setIsFormExpanded] = useState(false);

    const canManageFound = user?.role === "admin" || user?.role === "staff";

    const filteredItems = (items || []).filter(item => {
        if (!item || item.type !== "found") return false;
        const statusMatch = filter === "all" || item.status === filter;
        return statusMatch;
    });

    const PlusIcon = () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
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
            {/* Admin/Staff Found Item Posting */}
            {canManageFound && (
                isFormExpanded ? (
                    <LostItemForm
                        onItemAdded={onRefresh}
                        onCancel={() => setIsFormExpanded(false)}
                        type="found"
                        user={user}
                    />
                ) : (
                    <div
                        onClick={() => setIsFormExpanded(true)}
                        className="lf-post-trigger flex items-center justify-center"
                    >
                        <PlusIcon />
                        <span>Post Found Item.</span>
                    </div>
                )
            )}

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



            <div className="flex-1 overflow-y-auto pr-2">
                {filteredItems.length === 0 ? (
                    <div className="feed-container">
                        <div className="empty-state-card">
                            <PackageIcon />
                            <p className="empty-state-text">No found items match this filter.</p>
                        </div>
                    </div>
                ) : (
                    filteredItems.map(item => (
                        <FoundItemCard key={item.id} item={item} refreshItems={onRefresh} user={user} />
                    ))
                )}
            </div>
        </div>
    );
};

export default FoundItemsSection;
