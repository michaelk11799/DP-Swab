// src/components/AdminPage.js
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import "./AdminPage.css";

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      setUsers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !code) return;
    await addDoc(collection(db, "users"), { name, code });
    setName("");
    setCode("");
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "users", id));
  };

  return (
    <div className="admin-container">
      <div className="admin-box">
        <h2>Adminbeheer</h2>

        <form className="admin-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Naam"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button type="submit">Toevoegen</button>
        </form>

        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Naam</th>
                <th>Code</th>
                <th>Acties</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan="3">Nog geen gebruikers.</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td data-label="Naam">{u.name}</td>
                    <td data-label="Code">{u.code}</td>
                    <td data-label="Acties">
                      <button onClick={() => handleDelete(u.id)}>Verwijderen</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
