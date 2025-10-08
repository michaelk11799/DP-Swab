// src/components/PersoneelPage.js
import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  doc,
} from "firebase/firestore";
import "./PersoneelPage.css";

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
    if (!fromStore || !toStore || !name || !hours || !date) return;

    await addDoc(collection(db, "personeel"), {
      fromStore,
      toStore,
      name,
      hours: parseFloat(hours),
      date,
      user: user?.name || "Onbekend", // zelfde als in VoorraadPage
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
        <form className="personeel-form" onSubmit={handleSubmit}>
          <select value={fromStore} onChange={(e) => setFromStore(e.target.value)}>
            <option value="">Van winkel</option>
            {stores.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={toStore} onChange={(e) => setToStore(e.target.value)}>
            <option value="">Naar winkel</option>
            {stores.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input
            type="text"
            placeholder="Naam medewerker"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
                <tr><td colSpan="7">Nog geen gegevens ingevoerd.</td></tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id}>
                    <td data-label="Van winkel">{entry.fromStore}</td>
                    <td data-label="Naar winkel">{entry.toStore}</td>
                    <td data-label="Naam">{entry.name}</td>
                    <td data-label="Uren">{entry.hours}</td>
                    <td data-label="Datum">{entry.date}</td>
                    <td data-label="Ingevuld door">{entry.user}</td>
                    <td data-label="Acties">
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
