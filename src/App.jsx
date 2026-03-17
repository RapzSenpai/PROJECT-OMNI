import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { auth, db } from "./firebase/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import Navbar from "./components/Navbar";
import Notifications from "./components/Notifications";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import LostFound from "./pages/LostFound";
import Concerns from "./pages/Concerns";
import Policies from "./pages/Policies";
import Profile from "./pages/Profile";


// 🔹 Protected Route Component: Only for logged-in users
function Protected({ user, children }) {
  if (!user) return <Navigate to="/login" />;
  return children;
}

// 🔹 Guest Route Component: Only for logged-out users (Login/Register)
function GuestRoute({ user, children }) {
  if (user) return <Navigate to="/dashboard" />;
  return children;
}

function App() {
  const [user, setUser] = useState(null); // track logged-in user
  const [loading, setLoading] = useState(true); // optional, wait for Firebase

  useEffect(() => {
    let unsubscribeSnapshot = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (unsubscribeSnapshot) unsubscribeSnapshot();

      if (currentUser) {
        // Real-time listener for user metadata (roles)
        unsubscribeSnapshot = onSnapshot(doc(db, "users", currentUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            setUser({ ...currentUser, ...docSnap.data() });
          } else {
            setUser(currentUser);
          }
          setLoading(false);
        }, (err) => {
          console.error("User snapshot error:", err);
          setUser(currentUser);
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'Roboto, sans-serif' }}>
      Loading...
    </div>
  );

  return (
    <BrowserRouter>
      {/* Navbar manages its own visibility based on user prop */}
      <Navbar user={user} />

      <Routes>
        {/* PUBLIC / GUEST ONLY */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/login"
          element={
            <GuestRoute user={user}>
              <Login />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute user={user}>
              <Register />
            </GuestRoute>
          }
        />

        {/* PROTECTED */}
        <Route
          path="/dashboard"
          element={
            <Protected user={user}>
              <Dashboard user={user} />
            </Protected>
          }
        />
        <Route
          path="/lost-found"
          element={
            <Protected user={user}>
              <LostFound user={user} />
            </Protected>
          }
        />
        <Route
          path="/concerns"
          element={
            <Protected user={user}>
              <Concerns user={user} />
            </Protected>
          }
        />
        <Route
          path="/policies"
          element={
            <Protected user={user}>
              <Policies user={user} />
            </Protected>
          }
        />
        <Route
          path="/notifications"
          element={
            <Protected user={user}>
              <Notifications user={user} />
            </Protected>
          }
        />
        <Route
          path="/profile"
          element={
            <Protected user={user}>
              <Profile user={user} />
            </Protected>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
