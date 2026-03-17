import React, { useState } from "react";
import { updateLostItemByUser } from "../services/lostFoundService";
import { auth } from "../firebase/firebaseConfig";

const LostItemEditForm = ({ item, onSave, onCancel }) => {
    const [title, setTitle] = useState(item.title);
    const [description, setDescription] = useState(item.description);
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

        setUploading(true);
        let imageUrl = item.imageUrl;

        // If a new image is selected, upload it
        if (image) {
            const newUrl = await uploadImage();
            if (newUrl) imageUrl = newUrl;
        }

        try {
            await updateLostItemByUser(item.id, { title, description, imageUrl });
            setUploading(false);
            onSave(); // Refresh the list and close edit mode
        } catch (err) {
            console.error("Update failed", err);
            alert("Failed to update item.");
            setUploading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="py-2">
            <div className="lf-form-header border-b pb-3 mb-6">
                <h4 className="lf-form-title flex items-center gap-2">
                    <span className="w-2 h-2 bg-black rounded-full"></span>
                    Edit Item Report
                </h4>
                {onCancel && (
                    <button type="button" onClick={onCancel} className="lf-form-close-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                )}
            </div>

            <div className="space-y-4">
                <div className="lf-form-group">
                    <label className="lf-form-label">Item Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="lf-form-input"
                        placeholder="e.g. Red Wallet"
                    />
                </div>

                <div className="lf-form-group">
                    <label className="lf-form-label">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="lf-form-textarea"
                        placeholder="Provide details about the item..."
                    />
                </div>

                <div className="lf-form-group">
                    <label className="lf-form-label">Replace Photo (Optional)</label>
                    <div className="lf-image-upload-wrapper">
                        <input
                            type="file"
                            id="edit-item-image"
                            accept="image/*"
                            onChange={handleImageChange}
                            disabled={uploading}
                            style={{ display: 'none' }}
                        />
                        <label
                            htmlFor="edit-item-image"
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
                        {item.imageUrl && !image && (
                            <p className="text-[10px] text-gray-400 italic">Existing image will be kept.</p>
                        )}
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={uploading}
                        className="form-submit-btn !w-full"
                    >
                        {uploading ? "Updating..." : "Save Changes"}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default LostItemEditForm;
