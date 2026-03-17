import { db } from "../firebase/firebaseConfig";
import {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    deleteDoc,
} from "firebase/firestore";

// ☁️ Cloudinary Configuration (Loaded from .env via REACT_APP_ prefix)
// Accessing via import.meta.env is the standard for Vite projects.
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_CLOUD_NAME = import.meta.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
// Note: REACT_APP_CLOUDINARY_API_SECRET is available in .env but not exposed to the client by default for security.
// For direct client-side uploads, we primarily use the cloud name and upload preset.

const lostItemsCol = collection(db, "lost_items");

// Add lost item
export const addLostItem = async ({ title, description, ownerId, ownerName, type, category, imageUrl }) => {
    return await addDoc(lostItemsCol, {
        title,
        description,
        type: type || "lost", // "lost" or "found"
        category: category || "Other",
        status: "unclaimed", // Both lost and found items start as unclaimed now
        imageUrl: imageUrl || null,
        ownerId,
        ownerName,
        createdAt: serverTimestamp(),
    });
};

// Get all lost items, newest first
export const getLostItems = async () => {
    const q = query(lostItemsCol, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Get items of current user
export const getUserLostItems = async (userId) => {
    const q = query(
        lostItemsCol,
        where("ownerId", "==", userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Update status (mark as claimed)
export const markAsClaimed = async (itemId) => {
    const docRef = doc(lostItemsCol, itemId);
    await updateDoc(docRef, {
        status: "claimed",
        updatedAt: serverTimestamp(),
        claimedAt: serverTimestamp(),
        claimedBy: "admin"
    });
};

// Add comment to item
export const addComment = async (itemId, comment, user, itemOwnerId, itemTitle) => {
    // 1️⃣ Add the comment
    const commentsCol = collection(db, "lost_items", itemId, "comments");
    const isAdmin = user?.role === "admin" || user?.isAdmin === true;
    const isStaff = user?.role === "staff";
    const userRole = isAdmin ? "admin" : (isStaff ? "staff" : "user");

    await addDoc(commentsCol, {
        comment,
        createdAt: serverTimestamp(),
        userId: user?.uid || null,
        userName: user?.fullName || user?.displayName || user?.email || "Anonymous",
        userRole: userRole,
    });

    // 2️⃣ Create notification
    if (itemOwnerId && itemOwnerId !== user?.uid) {
        let notificationMessage = `${user?.fullName || user?.displayName || user?.email} commented on your lost item "${itemTitle}"`;

        const isAdmin = user?.role === "admin" || user?.isAdmin === true;
        const isStaff = user?.role === "staff";

        if (isAdmin) {
            notificationMessage = `Admin commented on your post`;
        } else if (isStaff) {
            notificationMessage = `Staff commented on your post`;
        }

        const notificationsCol = collection(db, "notifications");
        await addDoc(notificationsCol, {
            recipientId: itemOwnerId,
            message: notificationMessage,
            read: false,
            createdAt: serverTimestamp(),
        });
    }
};

// Get comments for an item
export const getComments = async (itemId) => {
    const commentsCol = collection(db, "lost_items", itemId, "comments");
    const snapshot = await getDocs(commentsCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Delete a comment
export const deleteComment = async (itemId, commentId) => {
    const commentRef = doc(db, "lost_items", itemId, "comments", commentId);
    await deleteDoc(commentRef);
};

// Update lost item (staff/admin version)
export const updateLostItem = async (itemId, updatedData) => {
    const itemRef = doc(lostItemsCol, itemId);
    await updateDoc(itemRef, {
        ...updatedData,
        updatedAt: serverTimestamp(),
    });
};

// Update lost item (restricted user version)
export const updateLostItemByUser = async (itemId, { title, description, imageUrl }) => {
    const itemRef = doc(lostItemsCol, itemId);
    const updateData = { title, description };
    if (imageUrl) updateData.imageUrl = imageUrl;

    await updateDoc(itemRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
    });
};

// Delete lost item
export const deleteLostItem = async (itemId) => {
    const itemRef = doc(lostItemsCol, itemId);
    await deleteDoc(itemRef);
};
