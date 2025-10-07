// src/App.js
import React, { useState, useEffect } from "react";
import LoginPage from "./LoginPage";
import VoorraadPage from "./components/VoorraadPage";
import PersoneelPage from "./components/PersoneelPage";
import AdminPage from "./components/AdminPage";
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom";
import "./App.css";

export default function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) return null;

    const parsed = JSON.parse(savedUser);
    if (Date.now() > parsed.expiresAt) {
      localStorage.removeItem("user");
      return null;
    }
    return parsed.user;
  });

  // auto-logout na verlopen tijd
  useEffect(() => {
    if (!user) return;

    const saved = JSON.parse(localStorage.getItem("user"));
    if (!saved) return;

    const timeLeft = saved.expiresAt - Date.now();

    const timer = setTimeout(() => {
      setUser(null);
      localStorage.removeItem("user");
      alert("Je sessie is verlopen. Log opnieuw in.");
    }, timeLeft);

    return () => clearTimeout(timer);
  }, [user]);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  // Als geen gebruiker is ingelogd → toon login
  if (!user) return <LoginPage setUser={setUser} />;

  return (
    <Router>
      <main className="app-main">
        <div className="page-container">
          {/* Dashboard links */}
          <div className="dashboard-box">
            <img src="/dominos-logo.png" alt="Domino's Logo" className="dashboard-logo" />
            <h1>Welkom, {user.name}!</h1>
            <p>Je bent {user.isAdmin ? "admin" : "medewerker"}.</p>

            <div className="nav-buttons">
              <Link to="/voorraad" className="nav-btn">Voorraad</Link>
              <Link to="/personeel" className="nav-btn">Personeel</Link>
              {user.isAdmin && <Link to="/admin" className="nav-btn">Admin</Link>}
              <button onClick={handleLogout} className="nav-btn logout-btn">Uitloggen</button>
            </div>
          </div>

          {/* Content rechts */}
          <div className="content-box">
            <Routes>
              <Route path="/" element={<Navigate to="/voorraad" replace />} />
              <Route path="/voorraad" element={<VoorraadPage user={user} />} />
              <Route path="/personeel" element={<PersoneelPage user={user} />} />
              {user.isAdmin && <Route path="/admin" element={<AdminPage user={user} />} />}
            </Routes>
          </div>
        </div>
      </main>
    </Router>
  );
}
