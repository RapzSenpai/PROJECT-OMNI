import React, { useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { auth, db } from "../firebase/firebaseConfig";
import { signOut } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import logo from "../assets/logo.png";
import "../styles/components/Navbar.css";

function Navbar({ user }) {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const isAdmin = user?.role === "admin" || user?.isAdmin === true;

    React.useEffect(() => {
        if (!user) {
            setUnreadCount(0);
            return;
        }

        const q = query(
            collection(db, "notifications"),
            where("recipientId", "==", user.uid),
            where("read", "==", false)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setUnreadCount(snapshot.size);
        });

        return () => unsubscribe();
    }, [user]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate("/login");
            setIsMenuOpen(false);
        } catch (err) {
            console.error("Logout failed", err);
            alert("Failed to logout. Try again.");
        }
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    };
    const location = useLocation();

    // Do not show navbar on login and register pages
    if (location.pathname === "/login" || location.pathname === "/register") {
        return null;
    }

    return (
        <nav className="navbar">
            <Link to="/" className="navbar-brand-container" onClick={closeMenu}>
                <img src={logo} alt="Logo" className="logo-img" />
                <span className="brand-text">PROJECT OMNI</span>
            </Link>

            <button
                className={`hamburger ${isMenuOpen ? "open" : ""}`}
                onClick={toggleMenu}
                aria-label="Toggle navigation menu"
                aria-expanded={isMenuOpen}
            >
                <span className="bar"></span>
                <span className="bar"></span>
                <span className="bar"></span>
            </button>

            <div className={`nav-links-right ${isMenuOpen ? "mobile-open" : ""}`}>
                {user ? (
                    <>
                        {isAdmin && (
                            <NavLink to="/admin" className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")} onClick={closeMenu}>
                                Admin
                            </NavLink>
                        )}
                        <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")} onClick={closeMenu}>
                            Dashboard
                        </NavLink>
                        <NavLink to="/notifications" className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")} onClick={closeMenu}>
                            Notifications
                            {unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
                        </NavLink>
                        <NavLink to="/profile" className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")} onClick={closeMenu}>
                            Profile
                        </NavLink>
                        <button onClick={handleLogout} className="logout-btn">
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <NavLink to="/login" className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")} onClick={closeMenu}>
                            Login
                        </NavLink>
                        <NavLink to="/register" className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")} onClick={closeMenu}>
                            Register
                        </NavLink>
                    </>
                )}
            </div>
        </nav>
    );
}

export default Navbar;
