import React, { useEffect, useState } from "react";
import LostItemsSection from "../components/LostItemsSection";
import FoundItemsSection from "../components/FoundItemsSection";
import { getLostItems } from "../services/lostFoundService";
import { auth } from "../firebase/firebaseConfig";
import { useNavigate } from "react-router-dom";
import "../styles/pages/Concerns.css"; // Shared component styles
import "../styles/pages/lost-found.css";

const LostFound = ({ user }) => {
    const [items, setItems] = useState([]);
    const [activeTab, setActiveTab] = useState("lost"); // lost | found
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) navigate("/login");
        loadItems();
    }, [user]);

    const loadItems = async () => {
        const data = await getLostItems();
        setItems(data);
    };

    return (
        <div className="lf-page-container">
            <div className="lf-header">
                <h1 className="lf-title">Lost & Found</h1>
                <p className="lf-subtitle">Community log for tracking lost and found belongings.</p>
            </div>

            {/* Tabs Header */}
            <div className="tabs-container">
                <button
                    className={`tab-button ${activeTab === "lost" ? "active" : ""}`}
                    onClick={() => setActiveTab("lost")}
                >
                    Lost Items
                </button>
                <button
                    className={`tab-button ${activeTab === "found" ? "active" : ""}`}
                    onClick={() => setActiveTab("found")}
                >
                    Found Items
                </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col pt-4">
                {activeTab === "lost" ? (
                    <LostItemsSection items={items} onRefresh={loadItems} user={user} />
                ) : (
                    <FoundItemsSection items={items} onRefresh={loadItems} user={user} />
                )}
            </div>
        </div>
    );
};

export default LostFound;
