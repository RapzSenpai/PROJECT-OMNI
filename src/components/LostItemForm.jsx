import React, { useState } from "react";
import { addLostItem } from "../services/lostFoundService";
import { auth } from "../firebase/firebaseConfig";

const LostItemForm = ({ onItemAdded, onCancel, type = "lost", user }) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleImageChange = (e) => {
        if (e.target.files[0]) setImage(e.target.files[0]);
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
        if (!title.trim() || !description.trim()) return alert("Title and Description are required.");
        if (!user) return alert("You must be logged in to post.");

        setUploading(true);
        const imageUrl = await uploadImage();

        const itemData = {
            title,
            description,
            imageUrl,
            type, // "lost" or "found"
            ownerId: user.uid,
            ownerName: user.fullName || user.displayName || user.email,
        };

        try {
            await addLostItem(itemData);
            setTitle("");
            setDescription("");
            setImage(null);
            setUploading(false);
            onItemAdded(); // Refresh the list
            onCancel(); // Close form
        } catch (err) {
            console.error("Failed to add item", err);
            alert("Something went wrong!");
            setUploading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="lf-form-card">
            <div className="lf-form-header">
                <h3 className="lf-form-title">
                    {type === "lost" ? "Report a Lost Item" : "Report a Found Item"}
                </h3>
                {onCancel && (
                    <button type="button" onClick={onCancel} className="lf-form-close-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                )}
            </div>

            {type === "lost" && (
                <div className="lf-warning-box">
                    <strong>REMINDER:</strong>
                    If you found an item, please bring it to the Lost & Found Office.<br />
                    Only the Lost & Found staff are permitted to post found items.
                </div>
            )}

            <div className="space-y-4">
                <div className="lf-form-group">
                    <label className="lf-form-label">Item Title</label>
                    <input
                        type="text"
                        placeholder="e.g., Red Wallet"
                        className="lf-form-input"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                    />
                </div>

                <div className="lf-form-group">
                    <label className="lf-form-label">Description</label>
                    <textarea
                        placeholder="Provide details like location lost, distinct features..."
                        className="lf-form-textarea"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                    />
                </div>

                <div className="lf-form-group">
                    <label className="lf-form-label">Attach Photo (Optional)</label>
                    <div className="lf-image-upload-wrapper">
                        <input
                            type="file"
                            id="lost-item-image"
                            accept="image/*"
                            onChange={handleImageChange}
                            disabled={uploading}
                            style={{ display: 'none' }}
                        />
                        <label
                            htmlFor="lost-item-image"
                            className="lf-image-upload-label"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                            {image ? image.name : "Choose Photo"}
                        </label>
                        {image && !uploading && (
                            <button
                                type="button"
                                onClick={() => setImage(null)}
                                className="lf-image-remove-btn"
                            >
                                Remove
                            </button>
                        )}
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={uploading}
                        className="form-submit-btn !w-full"
                    >
                        {uploading ? "Posting..." : (type === "lost" ? "Post Lost Item" : "Post Found Item")}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default LostItemForm;
