import { useState } from "react";
import { auth } from "../firebase/firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import logo from "../assets/OMNI-LOGO.svg";
import "../styles/pages/Login.css";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        try {
            await signInWithEmailAndPassword(auth, email, password);
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
                        <h1>Log Into Project OMNI</h1>
                        <form className="auth-form" onSubmit={handleLogin}>
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
                                placeholder="Enter your password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                            <button type="submit" className="auth-button">Login</button>
                        </form>
                        {error && <p className="auth-error">{error}</p>}
                        <p className="auth-link">
                            Don't have an account? <Link to="/register">Sign Up</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
