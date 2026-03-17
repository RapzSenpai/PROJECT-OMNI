import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import LostFound from "./pages/LostFound";
import Concerns from "./pages/Concerns";
import Policies from "./pages/Policies";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <App />
);
