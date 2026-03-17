import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

// Collection ref
const concernsRef = collection(db, "concerns");

// Add concern / feedback
export const addConcern = async (data) => {
    // Ensure userId always exists
    const docData = {
        ...data,
        userId: data.userId, // always store owner uid
        createdAt: serverTimestamp(),
    };
    const newDoc = await addDoc(concernsRef, docData);

    // 🔔 Notify ALL admins
    try {
        const usersRef = collection(db, "users");
        const adminQuery = query(usersRef, where("isAdmin", "==", true));
        const adminSnapshot = await getDocs(adminQuery);

        const notificationPromises = adminSnapshot.docs.map(adminDoc => {
            return addDoc(collection(db, "notifications"), {
                recipientId: adminDoc.id,
                message: `New ${data.type} submitted by ${data.userName}`,
                type: "concern",
                read: false,
                createdAt: serverTimestamp(),
                concernId: newDoc.id
            });
        });
        await Promise.all(notificationPromises);
    } catch (error) {
        console.error("Failed to notify admins:", error);
    }

    return newDoc;
};

// Get all PUBLIC concerns / feedback
export const getPublicConcerns = async () => {
    const q = query(
        concernsRef,
        where("visibility", "==", "public")
    );

    const snapshot = await getDocs(q);
    const now = Date.now();
    return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : now;
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : now;
            return timeB - timeA;
        });
};

// Get all concerns of current user (public + private)
export const getUserConcerns = async (userId) => {
    const q = query(
        concernsRef,
        where("userId", "==", userId)
    );

    const snapshot = await getDocs(q);
    const now = Date.now();
    return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : now;
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : now;
            return timeB - timeA;
        });
};

// Update concern / feedback
export const updateConcern = async (id, updatedData) => {
    const concernDoc = doc(db, "concerns", id);

    // If this is an admin reply, notify the user
    if (updatedData.adminReply) {
        try {
            // Fetch the concern to get the owner userId
            const concernSnap = await getDoc(concernDoc);
            if (concernSnap.exists()) {
                const concernData = concernSnap.data();

                // Only notify if the reply is actually changing or being added
                if (concernData.adminReply !== updatedData.adminReply) {
                    await addDoc(collection(db, "notifications"), {
                        recipientId: concernData.userId,
                        message: `Admin replied to your ${concernData.type}: "${updatedData.adminReply.substring(0, 50)}${updatedData.adminReply.length > 50 ? "..." : ""}"`,
                        type: "concern",
                        read: false,
                        createdAt: serverTimestamp(),
                        concernId: id
                    });
                }
            }
        } catch (e) {
            console.error("Failed to send notification to user:", e);
        }
    }

    return await updateDoc(concernDoc, updatedData);
};

// Delete concern / feedback
export const deleteConcern = async (id) => {
    const concernDoc = doc(db, "concerns", id);
    return await deleteDoc(concernDoc);
};

// --- Minimal Comment Services ---

export const getConcernComments = async (concernId) => {
    const commentsRef = collection(db, "concerns", concernId, "comments");
    const q = query(commentsRef, orderBy("createdAt", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addConcernComment = async (concernId, commentText, user, postOwnerId) => {
    const commentsRef = collection(db, "concerns", concernId, "comments");

    // 1. Add comment
    const newComment = {
        userId: user.uid,
        userName: user.fullName || user.displayName || user.email || "Anonymous",
        userEmail: user.email || "",
        role: user.role || (user.isAdmin ? "admin" : "user"),
        comment: commentText,
        createdAt: serverTimestamp()
    };

    const docRef = await addDoc(commentsRef, newComment);

    // 2. Minimal Notification: Only notify if owner is a regular User
    if (user.uid !== postOwnerId) {
        try {
            const ownerSnap = await getDoc(doc(db, "users", postOwnerId));
            if (ownerSnap.exists()) {
                const ownerData = ownerSnap.data();
                const isOfficial = ownerData.role === "staff" || ownerData.role === "admin" || ownerData.isAdmin === true;

                if (!isOfficial) {
                    await addDoc(collection(db, "notifications"), {
                        recipientId: postOwnerId,
                        message: `${newComment.userName} commented: "${commentText.substring(0, 40)}..."`,
                        type: "concern_comment",
                        read: false,
                        createdAt: serverTimestamp(),
                        concernId: concernId
                    });
                }
            }
        } catch (e) {
            console.error("Notification failed:", e);
        }
    }

    return docRef;
};

export const deleteConcernComment = async (concernId, commentId) => {
    const commentRef = doc(db, "concerns", concernId, "comments", commentId);
    await deleteDoc(commentRef);
};
