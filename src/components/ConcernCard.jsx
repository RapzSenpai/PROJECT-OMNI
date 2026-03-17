import { useState, useEffect, useCallback } from "react";
import { db } from "../firebase/firebaseConfig";
import { doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import { updateConcern, deleteConcern, getConcernComments, addConcernComment, deleteConcernComment } from "../services/concernService";

export default function ConcernCard({ concern, refreshSubmissions, currentUser }) {
    const [editing, setEditing] = useState(false);
    const [editType, setEditType] = useState(concern.type);
    const [editDescription, setEditDescription] = useState(concern.description);
    const [editImage, setEditImage] = useState(null);
    const [imageRemoved, setImageRemoved] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [showMenu, setShowMenu] = useState(false);

    // Comments State
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [showComments, setShowComments] = useState(false);
    const [loadingComments, setLoadingComments] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);

    const isAdmin = currentUser?.role === "admin" || currentUser?.isAdmin === true;
    const isStaff = currentUser?.role === "staff";
    const isOwner = concern.userId === currentUser?.uid;

    const canEdit = isAdmin || isOwner;
    const canDelete = isAdmin || isStaff || isOwner;

    const loadComments = useCallback(async () => {
        try {
            const data = await getConcernComments(concern.id);
            setComments(data);
        } catch (e) {
            console.error("Load comments failed:", e);
        }
    }, [concern.id]);

    useEffect(() => {
        loadComments();
    }, [loadComments]);

    const handlePostComment = async (e) => {
        if (e) e.preventDefault();
        if (!newComment.trim()) return;

        try {
            await addConcernComment(concern.id, newComment, currentUser, concern.userId);
            setNewComment("");
            loadComments();
        } catch (e) {
            console.error("Post comment failed:", e);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm("Are you sure you want to delete this comment?")) return;
        try {
            await deleteConcernComment(concern.id, commentId);
            loadComments();
        } catch (e) {
            console.error("Failed to delete comment:", e);
        }
    };

    // Sort: Admin/Staff first, then chronological (newest first)
    const sortedComments = [...comments].sort((a, b) => {
        const rolePriority = { admin: 0, staff: 1, user: 2 };
        const priorityA = rolePriority[a.role] ?? 2;
        const priorityB = rolePriority[b.role] ?? 2;

        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }

        const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return tB - tA; // Newest first
    });

    // Toggle menu
    const toggleMenu = (e) => {
        e.stopPropagation();
        setShowMenu(!showMenu);
    };

    // Close menu on click outside
    useEffect(() => {
        const handleClickOutside = () => setShowMenu(false);
        if (showMenu) {
            window.addEventListener("click", handleClickOutside);
        }
        return () => window.removeEventListener("click", handleClickOutside);
    }, [showMenu]);

    const uploadImage = async () => {
        if (!editImage) return null;
        const formData = new FormData();
        formData.append("file", editImage);
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

    const saveEdit = async () => {
        if (!editType || !editDescription) return;

        setUploading(true);
        let imageUrl = concern.imageUrl;

        if (imageRemoved) {
            imageUrl = null;
        } else if (editImage) {
            imageUrl = await uploadImage();
        }

        const updatedData = { type: editType, description: editDescription, imageUrl };

        try {
            await updateConcern(concern.id, updatedData);
            setEditing(false);
            setUploading(false);
            setEditImage(null);
            setImageRemoved(false);

            if (refreshSubmissions) {
                refreshSubmissions((prev) =>
                    prev.map((c) => (c.id === concern.id ? { ...c, ...updatedData } : c))
                );
            }
        } catch (error) {
            console.error("Failed to update concern", error);
            setUploading(false);
        }
    };


    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this?")) return;
        await deleteConcern(concern.id);
        if (refreshSubmissions) {
            refreshSubmissions((prev) => prev.filter((c) => c.id !== concern.id));
        }
        setShowMenu(false);
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return "Just now";
        const date = timestamp.toMillis ? new Date(timestamp.toMillis()) : new Date(timestamp);
        return date.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }) + " — " + date.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const TypeIcon = ({ type }) => {
        const commonProps = {
            width: 16,
            height: 16,
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: 2,
            strokeLinecap: "round",
            strokeLinejoin: "round",
            style: { display: "inline-block", verticalAlign: "middle" }
        };

        if (type === "Concern") {
            return (
                <svg {...commonProps}>
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
            );
        } else {
            return (
                <svg {...commonProps}>
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
            );
        }
    };

    const StatusIcon = ({ status }) => {
        const commonProps = {
            width: 16,
            height: 16,
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: 3,
            strokeLinecap: "round",
            strokeLinejoin: "round",
            style: { display: "inline-block", verticalAlign: "middle" }
        };

        if (status === "responded") {
            return (
                <svg {...commonProps}>
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            );
        } else {
            return (
                <svg {...commonProps}>
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                </svg>
            );
        }
    };

    const AvatarIcon = () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#adb5bd' }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
    );

    const CameraIcon = () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
    );

    const SendIcon = () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
    );

    const CommentIcon = () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
    );

    const formatRelativeTime = (timestamp) => {
        if (!timestamp) return "just now";
        const date = timestamp.toMillis ? new Date(timestamp.toMillis()) : new Date(timestamp);
        const now = new Date();
        const diff = Math.max(0, now - date);
        const diffInSeconds = Math.floor(diff / 1000);
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        const diffInHours = Math.floor(diffInMinutes / 60);
        const diffInDays = Math.floor(diffInHours / 24);

        if (diffInSeconds < 60) return "just now";
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInHours < 24) return `${diffInHours}h ago`;
        if (diffInDays < 30) return `${diffInDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <>
            {showImageModal && concern.imageUrl && (
                <div className="lf-modal-overlay" onClick={() => setShowImageModal(false)}>
                    <div className="lf-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="lf-modal-close" onClick={() => setShowImageModal(false)}>×</button>
                        <img src={concern.imageUrl} alt="Concern" className="lf-modal-image" />
                    </div>
                </div>
            )}
            <li className="feed-card lf-card">
                <div className="lf-card-row row-1">
                    <div className="lf-title-container">
                        <h3 className="concern-author-name">
                            {concern.anonymous ? "Anonymous" : (concern.userName || concern.userEmail || "Anonymous")}
                        </h3>
                        {concern.role && (concern.role === 'admin' || concern.role === 'staff') && (
                            <span className={`comment-role-tag ${concern.role}`} style={{ marginTop: 0, marginLeft: 0 }}>
                                {concern.role}
                            </span>
                        )}
                        <span className={`status-badge-new ${concern.type?.toLowerCase() === "concern" ? "unclaimed" : "claimed"}`}>
                            {concern.type}
                        </span>
                    </div>
                    <div className="card-menu-container">
                        {(canEdit || canDelete) && !editing && (
                            <>
                                <button className="menu-button" onClick={toggleMenu} title="Options">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
                                </button>
                                <div className={`menu-dropdown ${showMenu ? 'show' : ''}`}>
                                    {canEdit && (
                                        <button className="menu-item" onClick={() => { setEditing(true); setShowMenu(false); }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                            Edit Post
                                        </button>
                                    )}
                                    {canDelete && (
                                        <button className="menu-item delete" onClick={handleDelete}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                                            Delete Post
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="lf-card-row row-3">
                    <div className="lf-meta-block">
                        <span className="concern-meta-time">
                            {formatRelativeTime(concern.createdAt)}
                        </span>
                        {concern.visibility === "private" && (
                            <>
                                <span className="lf-meta-divider">•</span>
                                <span className="lf-meta-item" style={{ color: '#d12c2c', fontWeight: 600 }}>Private</span>
                            </>
                        )}
                    </div>
                </div>

                {editing ? (
                    <div className="edit-form" style={{ backgroundColor: '#f8f9fa', padding: 16, borderRadius: 8, marginTop: 8 }}>
                        <select
                            className="form-select"
                            value={editType}
                            onChange={(e) => setEditType(e.target.value)}
                            disabled={uploading}
                            style={{ marginBottom: 12, padding: '10px 14px' }}
                        >
                            <option value="Concern">Concern</option>
                            <option value="Feedback">Feedback</option>
                        </select>
                        <textarea
                            className="form-textarea"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            disabled={uploading}
                            style={{ marginBottom: 12, minHeight: 120 }}
                        />

                        <div className="edit-image-section" style={{ marginBottom: 16 }}>
                            <label className="form-label" style={{ fontSize: '0.85rem' }}>Attached Photo</label>
                            {(concern.imageUrl && !imageRemoved) ? (
                                <div style={{ position: 'relative', display: 'inline-block', marginTop: 8 }}>
                                    <img
                                        src={concern.imageUrl}
                                        alt="Preview"
                                        style={{ width: '100%', maxWidth: 200, borderRadius: 8, border: '1px solid #dee2e6' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setImageRemoved(true)}
                                        style={{
                                            position: 'absolute',
                                            top: -8,
                                            right: -8,
                                            backgroundColor: '#d12c2c',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: 20,
                                            height: 20,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '12px'
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <div style={{ marginTop: 8 }}>
                                    <input
                                        type="file"
                                        id={`edit-image-${concern.id}`}
                                        accept="image/*"
                                        onChange={(e) => {
                                            if (e.target.files[0]) {
                                                setEditImage(e.target.files[0]);
                                                setImageRemoved(false);
                                            }
                                        }}
                                        disabled={uploading}
                                        style={{ display: 'none' }}
                                    />
                                    <label
                                        htmlFor={`edit-image-${concern.id}`}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            padding: '8px 14px',
                                            backgroundColor: '#fff',
                                            border: '1px solid #dee2e6',
                                            borderRadius: 6,
                                            cursor: uploading ? 'not-allowed' : 'pointer',
                                            fontSize: '0.85rem',
                                            color: '#495057'
                                        }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                                        {editImage ? editImage.name : "Replace Photo"}
                                    </label>
                                    {editImage && (
                                        <button
                                            onClick={() => setEditImage(null)}
                                            style={{ marginLeft: 10, background: 'none', border: 'none', color: '#d12c2c', fontSize: '0.85rem', cursor: 'pointer' }}
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: 10 }}>
                            <button className="form-submit-btn" onClick={saveEdit} disabled={uploading} style={{ padding: '10px 20px', width: 'auto' }}>
                                {uploading ? "Saving..." : "Save Changes"}
                            </button>
                            <button
                                className="form-submit-btn"
                                onClick={() => {
                                    setEditing(false);
                                    setEditImage(null);
                                    setImageRemoved(false);
                                }}
                                disabled={uploading}
                                style={{ padding: '10px 20px', width: 'auto', backgroundColor: '#e9ecef', color: '#495057' }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <p className="feed-card-body">{concern.description}</p>

                        {concern.imageUrl && (
                            <div className="mb-4">
                                <button
                                    className="lf-see-image-btn"
                                    onClick={() => setShowImageModal(true)}
                                >
                                    <CameraIcon />
                                    See Image
                                </button>
                            </div>
                        )}

                        {/* Comment Feed Section */}
                        <div className="comment-section">
                            <button
                                className="comments-toggle"
                                onClick={() => setShowComments(!showComments)}
                            >
                                <CommentIcon />
                                <span>Comments ({comments.length})</span>
                            </button>

                            <div className={`comments-container ${showComments ? "show" : ""}`}>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {sortedComments.map(c => {
                                        const isOfficial = c.role === 'admin' || c.role === 'staff';
                                        return (
                                            <div key={c.id} className="comment-item">
                                                <div className="comment-header">
                                                    <div className="comment-meta">
                                                        <span className="comment-user">
                                                            {c.userName && c.userName !== "Anonymous" ? c.userName : (c.userEmail || "Anonymous")}
                                                        </span>
                                                        <span className="comment-time">
                                                            {formatRelativeTime(c.createdAt)}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        {(isAdmin || currentUser?.uid === c.userId) && (
                                                            <button
                                                                onClick={() => handleDeleteComment(c.id)}
                                                                className="lf-comment-delete-btn"
                                                                style={{ marginBottom: '2px' }}
                                                                title="Delete Comment"
                                                            >
                                                                Delete
                                                            </button>
                                                        )}
                                                        {isOfficial && (
                                                            <span className={`comment-role-tag ${c.role}`}>
                                                                {c.role}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#495057' }}>{c.comment}</p>
                                            </div>
                                        );
                                    })}
                                </div>

                                {currentUser && (
                                    <form onSubmit={handlePostComment} className="comment-input-group">
                                        <input
                                            type="text"
                                            placeholder="Add a comment..."
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            className="comment-input"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newComment.trim()}
                                            className="comment-post-btn"
                                        >
                                            <SendIcon />
                                            Post
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </li>
        </>
    );
};
