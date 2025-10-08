// src/components/VoorraadPage.js
import React, { useMemo, useState, useEffect, useRef } from "react";
import rawGroups from "../data/items";
import "./VoorraadPage.css";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

function cleanLabel(s) {
  if (!s) return "";
  let t = String(s).trim();
  if (/^(inventory|count sheet|begin date|team member|page|pulse|version|store|location)/i.test(t)) return "";
  t = t.replace(/\s*-\s*\d{4,6}\b/g, "");
  t = t.replace(/\b[a-zA-Z]*DPD\b/g, "");
  if (/^(zak|gram|stuk|tray|doos|bundel|bak|pak|fles|emmer)$/i.test(t)) return "";
  t = t.replace(/\s{2,}/g, " ").trim();
  return t;
}

function buildCleanGroups(groups) {
  const collator = new Intl.Collator("nl", { sensitivity: "base" });
  const out = [];
  for (const g of groups || []) {
    const cat = (g?.category || "").trim();
    if (!cat) continue;
    const seen = new Set();
    const cleaned = [];
    for (const raw of g?.items || []) {
      const c = cleanLabel(raw);
      if (!c || c.length < 2) continue;
      const key = c.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      cleaned.push(c);
    }
    cleaned.sort((a, b) => collator.compare(a, b));
    if (cleaned.length) out.push({ category: cat, items: cleaned });
  }
  return out;
}

export default function VoorraadPage({ user }) {
  const scrollerRef = useRef(null);

  const stores = ["Nieuwerkerk", "Krimpen", "Capelle", "Zevenkamp"];
  const [fromStore, setFromStore] = useState("");
  const [toStore, setToStore] = useState("");
  const [item, setItem] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState([]);

  const quantityOptions = useMemo(() => {
    const arr = [];
    for (let i = 0.5; i <= 25; i += 0.5) arr.push(Number(i.toFixed(1)));
    return arr;
  }, []);

  const units = ["Stuk", "Zak", "Doos", "Tray", "Emmer"];
  const cleanGroups = useMemo(() => buildCleanGroups(rawGroups), []);

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return cleanGroups;
    const s = search.toLowerCase();
    return cleanGroups
      .map((g) => ({
        category: g.category,
        items: g.items.filter((it) => it.toLowerCase().includes(s)),
      }))
      .filter((g) => g.items.length > 0);
  }, [cleanGroups, search]);

  useEffect(() => {
    const voorraadRef = collection(db, "voorraad");
    const q = query(voorraadRef, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEntries(data);
    });
    return () => unsub();
  }, []);

  // Fix iOS Safari: make sure the scroller starts fully left
  useEffect(() => {
    if (scrollerRef.current) scrollerRef.current.scrollLeft = 0;
  }, [entries.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fromStore || !toStore || !item || !quantity || !unit) {
      alert("Vul alle velden in!");
      return;
    }
    await addDoc(collection(db, "voorraad"), {
      fromStore,
      toStore,
      item,
      quantity: parseFloat(quantity),
      unit,
      user: user?.name || "Onbekend",
      returned: false,
      createdAt: serverTimestamp(),
    });
    setFromStore("");
    setToStore("");
    setItem("");
    setQuantity("");
    setUnit("");
    setSearch("");
    if (scrollerRef.current) scrollerRef.current.scrollLeft = 0;
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "voorraad", id));
  };

  const toggleReturned = async (entry) => {
    await updateDoc(doc(db, "voorraad", entry.id), {
      returned: !entry.returned,
    });
  };

  return (
    <div className="voorraad-container">
      <div className="voorraad-box">
        <h2>Voorraadbeheer</h2>

        <form className="voorraad-form" onSubmit={handleSubmit}>
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
            placeholder="Zoek item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ minWidth: 180 }}
          />
          <select value={item} onChange={(e) => setItem(e.target.value)} style={{ minWidth: 260 }}>
            <option value="">Kies item</option>
            {filteredGroups.length === 0 && <option disabled>Geen items gevonden</option>}
            {filteredGroups.map((group, gi) => (
              <optgroup key={gi} label={group.category}>
                {group.items.map((it, ii) => (
                  <option key={`${gi}-${ii}`} value={it}>{it}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <select value={quantity} onChange={(e) => setQuantity(e.target.value)}>
            <option value="">Aantal</option>
            {quantityOptions.map((q) => <option key={q} value={q}>{q}</option>)}
          </select>
          <select value={unit} onChange={(e) => setUnit(e.target.value)}>
            <option value="">Eenheid</option>
            {units.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
          <button type="submit">Opslaan</button>
        </form>

        <div
          className="table-responsive"
          ref={scrollerRef}
          dir="ltr"
          aria-label="Scroll horizontaal om alle kolommen te zien"
        >
          <table className="voorraad-table">
            <thead>
              <tr>
                <th>Uitgeleend van</th>
                <th>Aan</th>
                <th>Item</th>
                <th>Aantal</th>
                <th>Eenheid</th>
                <th>Door</th>
                <th>Teruggebracht?</th>
                <th>Acties</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr><td colSpan="8">Nog geen transacties ingevoerd.</td></tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id}>
                    <td data-label="Uitgeleend van">{entry.fromStore}</td>
                    <td data-label="Aan">{entry.toStore}</td>
                    <td data-label="Item">{entry.item}</td>
                    <td data-label="Aantal">{entry.quantity}</td>
                    <td data-label="Eenheid">{entry.unit}</td>
                    <td data-label="Door">{entry.user}</td>
                    <td data-label="Teruggebracht?">
                      <input
                        type="checkbox"
                        checked={entry.returned}
                        onChange={() => toggleReturned(entry)}
                      />
                    </td>
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
