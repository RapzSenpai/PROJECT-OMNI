import AskPoliciesChat from "../components/AskPoliciesChat";
import "../styles/pages/Concerns.css";

export default function Policies() {
    return (
        <div className="concerns-wrapper" style={{ paddingTop: "40px" }}>
            <header className="concerns-header" style={{ marginBottom: "32px" }}>
                <h1 className="concerns-title" style={{ fontSize: "2.5rem", fontWeight: "800", color: "#1c1c1c", marginBottom: "8px" }}>
                    OMNI CHATBOT
                </h1>
                <p className="concerns-subtitle" style={{ fontSize: "1.1rem", color: "#666" }}>
                    Related to documents in the handbook only
                </p>
            </header>
            <AskPoliciesChat />
        </div>
    );
}