import { useState, useRef, useEffect } from "react";
import omniLogo from "../assets/OMNI-LOGO.svg";
import "../styles/components/AskPoliciesChat.css";

const SendIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
);

export default function AskPoliciesChat() {
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: "Hello! I am OMNI, your school policy assistant. How can I help you today?",
            sender: "omni",
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const historyRef = useRef(null);

    const suggestions = [
        "What is the attendance policy?",
        "How to report a bullying incident?",
        "School dress code guidelines",
        "Campus operating hours"
    ];

    // Auto-scroll to bottom
    useEffect(() => {
        if (historyRef.current) {
            historyRef.current.scrollTop = historyRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const sendMessage = (text) => {
        const userMsg = {
            id: Date.now(),
            text: text,
            sender: "user",
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);

        // Simulate OMNI response
        setTimeout(() => {
            const omniMsg = {
                id: Date.now() + 1,
                text: "I'm currently in high-speed training and will eventually be able to pull exact answers from the student handbook for you. Stay tuned!",
                sender: "omni",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, omniMsg]);
            setIsTyping(false);
        }, 1500);
    };

    const handleSend = () => {
        if (!inputValue.trim()) return;
        sendMessage(inputValue);
        setInputValue("");
    };

    const handleChipClick = (msg) => {
        sendMessage(msg);
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") handleSend();
    };

    return (
        <div className="omni-chat-wrapper">
            <div className="omni-chat-history" ref={historyRef}>
                {messages.map((msg) => (
                    <div key={msg.id} className={`chat-message-container ${msg.sender}`}>
                        {msg.sender === "omni" && (
                            <div className="omni-bubble-logo">
                                <img src={omniLogo} alt="OMNI" />
                            </div>
                        )}
                        <div className={`chat-message ${msg.sender}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="typing-indicator-container">
                        <div className="omni-bubble-logo">
                            <img src={omniLogo} alt="OMNI" />
                        </div>
                        <div className="typing-indicator">
                            <div className="typing-dot"></div>
                            <div className="typing-dot"></div>
                            <div className="typing-dot"></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Suggestion Chips */}
            {!inputValue && !isTyping && (
                <div className="omni-suggestions-container">
                    {suggestions.map((s, idx) => (
                        <button key={idx} className="omni-chip" onClick={() => handleChipClick(s)}>
                            {s}
                        </button>
                    ))}
                </div>
            )}

            <div className="omni-chat-input-area">
                <input
                    type="text"
                    className="omni-input"
                    placeholder="Ask about school policies..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                />
                <button className="omni-send-btn" onClick={handleSend}>
                    <SendIcon />
                </button>
            </div>
        </div>
    );
}
