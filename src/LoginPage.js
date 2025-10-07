// src/LoginPage.js
import React, { useState } from "react";
import { db } from "./firebase"; 
import { doc, getDoc } from "firebase/firestore";
import "./App.css";

export default function LoginPage({ setUser }) {
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!code.trim() || !password.trim()) {
      setError("Vul code en wachtwoord in.");
      return;
    }

    try {
      console.log("🔎 Inloggen gestart met code:", code.trim(), "en wachtwoord:", password);

      const docRef = doc(db, "codes", code.trim());
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        console.warn("⚠️ Geen document gevonden voor code:", code.trim());
        setError("Code niet gevonden.");
        return;
      }

      const data = docSnap.data();
      console.log("✅ Firestore document gevonden:", data);

      // wachtwoord vergelijken als string
      if (String(data.password) !== String(password)) {
        console.warn("❌ Wachtwoord mismatch. Ingevoerd:", password, "Uit Firestore:", data.password);
        setError("Wachtwoord klopt niet.");
        return;
      }

      // login succesvol
      console.log("🎉 Login succesvol voor gebruiker:", data.name);

      const userData = {
        code: code.trim(),
        name: data.name || "(geen naam)",
        isAdmin: data.isAdmin || false,
      };

      const expiresAt = Date.now() + 10 * 60 * 1000;
      localStorage.setItem("user", JSON.stringify({ user: userData, expiresAt }));

      setUser(userData);
      setCode("");
      setPassword("");
    } catch (err) {
      console.error("💥 Login fout:", err);
      setError("Er is iets misgegaan. Probeer opnieuw.");
    }
  };

  return (
    <div className="app-main">
      <div className="login-box">
        <img src="/dominos-logo.png" alt="Domino's Logo" className="login-logo" />
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleLogin} className="login-form">
          <input
            type="text"
            placeholder="Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <input
            type="password"
            placeholder="Wachtwoord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Inloggen</button>
        </form>
      </div>
    </div>
  );
}
