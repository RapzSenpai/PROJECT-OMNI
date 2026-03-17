import { useState } from "react";
import { auth, db } from "../firebase/firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import logo from "../assets/OMNI-LOGO.svg";
import "../styles/pages/Register.css";

export default function Register() {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Save to Firestore
            await setDoc(doc(db, "users", user.uid), {
                fullName: fullName,
                email: user.email,
                role: "user",
            });

            navigate("/dashboard");
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-split-wrapper">
                {/* Left Side: Branding */}
                <div className="auth-branding-section">
                    <img src={logo} alt="Project OMNI Logo" className="auth-branding-logo" />
                    <h1 className="auth-branding-title">Project OMNI</h1>
                    <p className="auth-branding-subtitle">A Unified AI-Powered Campus Support Platform</p>
                </div>

                {/* Right Side: Form Card */}
                <div className="auth-form-section">
                    <div className="auth-container">
                        <h1>Create an Account</h1>
                        <form className="auth-form" onSubmit={handleRegister}>
                            <input
                                type="text"
                                className="auth-input"
                                placeholder="Enter your full name"
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                required
                            />
                            <input
                                type="email"
                                className="auth-input"
                                placeholder="Enter your email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                            <input
                                type="password"
                                className="auth-input"
                                placeholder="Create a password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                            <button type="submit" className="auth-button">Register</button>
                        </form>
                        {error && <p className="auth-error">{error}</p>}
                        <p className="auth-link">
                            Already have an account? <Link to="/login">Log In</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
