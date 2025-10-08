// src/components/PersoneelPage.js
import React, { useState, useEffect } from "react";
import "./PersoneelPage.css";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";

export default function PersoneelPage({ user }) {
  const stores = ["Nieuwerkerk", "Krimpen", "Capelle", "Zevenkamp"];
  const [fromStore, setFromStore] = useState("");
  const [toStore, setToStore] = useState("");
  const [name, setName] = useState("");
  const [hours, setHours] = useState("");
  const [date, setDate] = useState("");
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    const personeelRef = collection(db, "personeel");
    const q = query(personeelRef, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEntries(data);
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fromStore || !toStore || !name || !hours || !date) {
      alert("Vul alle velden in!");
      return;
    }
    await addDoc(collection(db, "personeel"), {
      fromStore,
      toStore,
      name,
      hours: parseFloat(hours),
      date,
      user: user?.name || "Onbekend",
      createdAt: serverTimestamp(),
    });
    setFromStore("");
    setToStore("");
    setName("");
    setHours("");
    setDate("");
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "personeel", id));
  };

  return (
    <div className="personeel-container">
      <div className="personeel-box">
        <h2>Personeelbeheer</h2>

        {/* Formulier */}
        <form className="personeel-form" onSubmit={handleSubmit}>
          <select value={fromStore} onChange={(e) => setFromStore(e.target.value)}>
            <option value="">Van winkel</option>
            {stores.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select value={toStore} onChange={(e) => setToStore(e.target.value)}>
            <option value="">Naar winkel</option>
            {stores.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Naam medewerker"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ minWidth: 180 }}
          />
          <input
            type="number"
            placeholder="Aantal uur"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button type="submit">Opslaan</button>
        </form>

        {/* Tabel */}
        <div className="table-responsive">
          <table className="personeel-table">
            <thead>
              <tr>
                <th>Van winkel</th>
                <th>Naar winkel</th>
                <th>Naam</th>
                <th>Uren</th>
                <th>Datum</th>
                <th>Ingevuld door</th>
                <th>Acties</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan="7">Nog geen gegevens ingevoerd.</td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.fromStore}</td>
                    <td>{entry.toStore}</td>
                    <td>{entry.name}</td>
                    <td>{entry.hours}</td>
                    <td>{entry.date}</td>
                    <td>{entry.user}</td>
                    <td>
                      <button onClick={() => handleDelete(entry.id)}>Verwijderen</button>
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
