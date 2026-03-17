import { Link } from "react-router-dom";
import "../styles/pages/Dashboard.css";
import "../styles/components/Card.css";

// Search Icon (Magnifying Glass) for Lost & Found
const SearchIcon = () => (
    <svg
        className="card-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#1c1c1c"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
    </svg>
);

// Chat Icon for Concerns & Feedback
const ChatIcon = () => (
    <svg
        className="card-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#1c1c1c"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
);

// Robot Icon for Policies
const RobotIcon = () => (
    <svg
        className="card-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#1c1c1c"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <circle cx="12" cy="5" r="2" />
        <path d="M12 7v4" />
        <line x1="8" y1="16" x2="8" y2="16" />
        <line x1="16" y1="16" x2="16" y2="16" />
    </svg>
);


export default function Dashboard({ user }) {
    return (
        <div className="dashboard-wrapper">
            <header className="dashboard-header">
                <h1 className="dashboard-title">Welcome to PROJECT OMNI</h1>
                <p className="dashboard-subtitle">
                    Your one place for student concerns, lost items, and school policies.
                </p>
            </header>

            <div className="cards-grid">
                <Link to="/policies" className="card">
                    <RobotIcon />
                    <h2 className="card-title">Ask School Policies</h2>
                    <p className="card-text">
                        Get quick answers from the student handbook.
                    </p>
                </Link>

                <Link to="/lost-found" className="card">
                    <SearchIcon />
                    <h2 className="card-title">Lost and Found</h2>
                    <p className="card-text">
                        Report or search for lost items.
                    </p>
                </Link>

                <Link to="/concerns" className="card">
                    <ChatIcon />
                    <h2 className="card-title">Concerns and Feedback</h2>
                    <p className="card-text">
                        Share concerns or suggestions with the school.
                    </p>
                </Link>
            </div>
        </div>
    );
}
