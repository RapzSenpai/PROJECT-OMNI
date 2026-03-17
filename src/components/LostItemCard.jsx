import React, { useEffect, useState } from "react";
import LostItemEditForm from "./LostItemEditForm";
import {
    markAsClaimed,
    getComments,
    addComment,
    updateLostItem,
    deleteLostItem,
    deleteComment
} from "../services/lostFoundService";
import { auth, db } from "../firebase/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

const formatRelativeTime = (date) => {
    if (!date) return "just now";
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

const LostItemCard = ({ item, refreshItems, user }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);

    const isAdmin = user?.role === "admin" || user?.isAdmin === true;
    const isStaff = user?.role === "staff";
    const isOwner = user && user.uid === item?.ownerId;

    const canEdit = isOwner || isAdmin;
    const canDelete = isAdmin || isOwner;
    const canMarkClaimed = isAdmin || isStaff;
    const canDeleteComment = isAdmin;

    // Load comments
    const loadComments = async () => {
        const data = await getComments(item.id);
        const sortedData = [...data].sort((a, b) => {
            const rolePriority = { admin: 0, staff: 1, user: 2 };
            const priorityA = rolePriority[a.userRole] ?? 2;
            const priorityB = rolePriority[b.userRole] ?? 2;

            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }
            // Secondary sort: Newest first
            const timeA = a.createdAt?.toDate ? a.createdAt.toDate() : 0;
            const timeB = b.createdAt?.toDate ? b.createdAt.toDate() : 0;
            return timeB - timeA;
        });
        setComments(sortedData);
    };

    useEffect(() => {
        loadComments();
    }, [item.id]);

    // Close menu on click outside
    useEffect(() => {
        const handleClickOutside = () => setShowMenu(false);
        if (showMenu) {
            window.addEventListener("click", handleClickOutside);
        }
        return () => window.removeEventListener("click", handleClickOutside);
    }, [showMenu]);

    const handleMarkClaimed = async () => {
        const confirmClaim = window.confirm("Are you sure you want to mark this item as claimed?");
        if (!confirmClaim) return;

        try {
            await markAsClaimed(item.id);
            alert("Item marked as claimed!");
            refreshItems();
        } catch (err) {
            console.error("Failed to mark as claimed", err);
            alert("Update failed.");
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        if (!user) return alert("You must be logged in to comment!");
        await addComment(item.id, newComment, user, item.ownerId, item.title);
        setNewComment("");
        loadComments();
    };

    const handleDelete = async () => {
        const confirmDelete = window.confirm("Are you sure you want to delete this item?");
        if (!confirmDelete) return;

        try {
            await deleteLostItem(item.id);
            alert("Item deleted!");
            refreshItems();
        } catch (err) {
            console.error("Delete failed", err);
            alert("Failed to delete item.");
        }
    };

    const handleDeleteComment = async (commentId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this comment?");
        if (!confirmDelete) return;

        try {
            await deleteComment(item.id, commentId);
            loadComments();
        } catch (err) {
            console.error("Failed to delete comment", err);
            alert("Failed to delete comment.");
        }
    };

    const uploadImage = async () => {
        if (!editImage) return currentImageUrl;
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
            return currentImageUrl;
        }
    };

    const handleSaveEdit = async () => {
        setUploading(true);
        try {
            const finalImageUrl = await uploadImage();

            await updateLostItem(item.id, {
                title: editTitle,
                description: editDescription,
                status: editStatus,
                category: editCategory,
                imageUrl: finalImageUrl
            });
            setIsEditing(false);
            setUploading(false);
            refreshItems();
        } catch (err) {
            console.error("Save failed", err);
            alert("Failed to save changes.");
            setUploading(false);
        }
    };

    const CommentIcon = () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
    );

    const MenuIcon = () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
    );

    const EditIcon = () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
    );

    const TrashIcon = () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
    );

    const CheckIcon = () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
    );

    const getDisplayName = (nameOrEmail) => {
        if (!nameOrEmail) return "Anonymous";
        if (nameOrEmail.includes("@")) {
            return nameOrEmail.split("@")[0];
        }
        return nameOrEmail;
    };

    const CameraIcon = () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
    );

    const SendIcon = () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
    );

    return (
        <>
            {showImageModal && (
                <div className="lf-modal-overlay" onClick={() => setShowImageModal(false)}>
                    <div className="lf-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="lf-modal-close" onClick={() => setShowImageModal(false)}>×</button>
                        <img src={item.imageUrl} alt={item.title} className="lf-modal-image" />
                    </div>
                </div>
            )}
            <div className={`feed-card lf-card`}>
                {/* Row 1: Title and Menu */}
                <div className="lf-card-row row-1">
                    <div className="lf-title-container">
                        <h3 className="lf-card-title">{item?.title || "Untitled"}</h3>
                        <span className={`status-badge-new ${item?.status === "unclaimed" ? "unclaimed" : "claimed"}`}>
                            {item?.status === "unclaimed" ? "Unclaimed" : "Claimed"}
                        </span>
                    </div>
                    <div className="card-menu-container">
                        {(canEdit || canDelete || (canMarkClaimed && item.status === 'unclaimed')) && !isEditing && (
                            <>
                                <button className="menu-button" onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} title="Options">
                                    <MenuIcon />
                                </button>
                                <div className={`menu-dropdown ${showMenu ? 'show' : ''}`}>
                                    {canMarkClaimed && item.status === "unclaimed" && (
                                        <button className="menu-item" onClick={handleMarkClaimed}>
                                            <CheckIcon />
                                            Mark as Claimed
                                        </button>
                                    )}
                                    {canEdit && (
                                        <button className="menu-item" onClick={() => { setIsEditing(true); setShowMenu(false); }}>
                                            <EditIcon />
                                            Edit Post
                                        </button>
                                    )}
                                    {canDelete && (
                                        <button className="menu-item delete" onClick={handleDelete}>
                                            <TrashIcon />
                                            Delete Post
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>


                {/* Row 3: Meta info (Name and Relative Time) */}
                <div className="lf-card-row row-3">
                    <div className="lf-meta-block">
                        <span className="lf-meta-item">
                            Posted by <span className="font-semibold text-gray-700">{getDisplayName(item?.ownerName)}</span>
                        </span>
                        <span className="lf-meta-divider">•</span>
                        <span className="lf-meta-item">
                            {formatRelativeTime(item?.createdAt?.toDate ? item.createdAt.toDate() : null)}
                        </span>
                    </div>
                </div>

                {isEditing ? (
                    <div className={`lf-comments-container show !max-height-none`}>
                        <LostItemEditForm
                            item={item}
                            onSave={() => {
                                setIsEditing(false);
                                refreshItems();
                            }}
                            onCancel={() => setIsEditing(false)}
                        />
                    </div>
                ) : (
                    <>
                        <p className="lf-description !mb-4 text-gray-800 leading-relaxed">{item.description}</p>

                        {item.imageUrl && (
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

                        <div className="lf-comments-section">
                            <button
                                className="lf-comments-toggle"
                                onClick={() => setShowComments(!showComments)}
                            >
                                <CommentIcon />
                                <span>Comments ({comments.length})</span>
                            </button>

                            <div className={`lf-comments-container ${showComments ? "show" : ""}`}>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    {comments.length === 0 ? (
                                        <p className="text-xs text-gray-400 italic">No comments yet...</p>
                                    ) : (
                                        comments.map((c) => (
                                            <div key={c.id} className="lf-comment-item">
                                                <div className="lf-comment-header">
                                                    <div className="lf-comment-meta">
                                                        <span className="lf-comment-user">{getDisplayName(c.userName)}</span>
                                                        <span className="lf-comment-time">{formatRelativeTime(c.createdAt?.toDate ? c.createdAt.toDate() : null)}</span>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        {canDeleteComment && (
                                                            <button
                                                                onClick={() => handleDeleteComment(c.id)}
                                                                className="lf-comment-delete-btn"
                                                                title="Delete Comment"
                                                            >
                                                                Delete
                                                            </button>
                                                        )}
                                                        {c.userRole && c.userRole !== 'user' && (
                                                            <span className={`lf-comment-role-tag ${c.userRole}`}>
                                                                {c.userRole.charAt(0).toUpperCase() + c.userRole.slice(1)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="lf-comment-text">{c.comment}</p>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="lf-comment-input-group">
                                    <input
                                        type="text"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Type a comment..."
                                        className="lf-comment-input"
                                    />
                                    <button className="lf-comment-post-btn" onClick={handleAddComment}>
                                        <SendIcon />
                                        Post
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
};
export default LostItemCard;
