// migrateReturned.js
import { db } from "./firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";

async function migrateReturned() {
  const voorraadRef = collection(db, "voorraad");
  const snapshot = await getDocs(voorraadRef);

  for (const d of snapshot.docs) {
    const data = d.data();

    // alleen als er nog een "returned" veld bestaat
    if (data.hasOwnProperty("returned")) {
      const actie = "Terugbrengen";
      const status = data.returned ? "Ja" : "Nee";

      await updateDoc(doc(db, "voorraad", d.id), {
        actie,
        status,
      });

      console.log(`Doc ${d.id} bijgewerkt → actie=${actie}, status=${status}`);
    }
  }

  console.log("Migratie klaar ✅");
}

migrateReturned();
