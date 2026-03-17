import { useState } from "react";
import { addConcern } from "../services/concernService";

export default function ConcernForm({ user, onSubmitted }) {
    const [type, setType] = useState("");
    const [description, setDescription] = useState("");
    const [anonymous, setAnonymous] = useState(false);
    const [visibility, setVisibility] = useState("public");
    const [image, setImage] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState("");

    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            setImage(e.target.files[0]);
        }
    };

    const uploadImage = async () => {
        if (!image) return null;
        const formData = new FormData();
        formData.append("file", image);
        formData.append("upload_preset", import.meta.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET);

        try {
            const cloudName = import.meta.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
            const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            return data.secure_url;
        } catch (err) {
            console.error("Cloudinary upload failed", err);
            return null;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!type || !description) {
            setMessage("Please fill all fields.");
            return;
        }

        setUploading(true);
        setMessage("Submitting...");

        try {
            const imageUrl = await uploadImage();

            await addConcern({
                userId: user.uid, // ALWAYS store owner
                userName: anonymous ? "Anonymous" : user.fullName || user.displayName || user.email,
                userEmail: user.email, // Store email for metadata
                type,
                description,
                anonymous,
                visibility,
                imageUrl,
                status: "pending",
                adminReply: "",
            });

            setMessage(`${type} submitted!`);
            setType("");
            setDescription("");
            setAnonymous(false);
            setVisibility("public");
            setImage(null);
            setUploading(false);

            if (onSubmitted) onSubmitted();
        } catch (error) {
            setMessage("Failed to submit.");
            console.error(error);
            setUploading(false);
        }
    };

    return (
        <div className="concern-form-card">
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="form-label">Type</label>
                    <div style={{ position: 'relative' }}>
                        <select
                            className="form-select"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            disabled={uploading}
                            required
                        >
                            <option value="">Select Category</option>
                            <option value="Concern">⚠️ Concern</option>
                            <option value="Feedback">💡 Feedback</option>
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                        className="form-textarea"
                        placeholder="Describe your thoughts or report an issue..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={uploading}
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Attach Photo (Optional)</label>
                    <div className="image-upload-wrapper" style={{ marginTop: 8 }}>
                        <input
                            type="file"
                            id="concern-image"
                            accept="image/*"
                            onChange={handleImageChange}
                            disabled={uploading}
                            style={{ display: 'none' }}
                        />
                        <label
                            htmlFor="concern-image"
                            className="image-upload-label"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '10px 16px',
                                backgroundColor: '#f8f9fa',
                                border: '1px solid #dee2e6',
                                borderRadius: 8,
                                cursor: uploading ? 'not-allowed' : 'pointer',
                                fontSize: '0.9rem',
                                color: '#495057',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                            {image ? image.name : "Choose Photo"}
                        </label>
                        {image && !uploading && (
                            <button
                                type="button"
                                onClick={() => setImage(null)}
                                style={{
                                    marginLeft: 10,
                                    background: 'none',
                                    border: 'none',
                                    color: '#d12c2c',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Remove
                            </button>
                        )}
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Visibility</label>
                    <div className="radio-group">
                        <label className="radio-item">
                            <input
                                type="radio"
                                name="visibility"
                                value="public"
                                checked={visibility === "public"}
                                onChange={(e) => setVisibility(e.target.value)}
                                disabled={uploading}
                            />
                            Public (Everyone can see)
                        </label>
                        <label className="radio-item">
                            <input
                                type="radio"
                                name="visibility"
                                value="private"
                                checked={visibility === "private"}
                                onChange={(e) => setVisibility(e.target.value)}
                                disabled={uploading}
                            />
                            Private (Only staff can see)
                        </label>
                    </div>
                </div>

                <div className="form-group">
                    <label className="checkbox-item">
                        <input
                            type="checkbox"
                            checked={anonymous}
                            onChange={() => setAnonymous(!anonymous)}
                            disabled={uploading}
                        />
                        Submit Anonymously
                    </label>
                </div>

                <button type="submit" className="form-submit-btn" disabled={uploading}>
                    {uploading ? "Submitting..." : `Submit ${type || 'Submission'}`}
                </button>

                {message && (
                    <p style={{
                        marginTop: 15,
                        textAlign: 'center',
                        color: message.includes('failed') ? '#d12c2c' : '#28a745',
                        fontWeight: '600'
                    }}>
                        {message}
                    </p>
                )}
            </form>
        </div>
    );
}
