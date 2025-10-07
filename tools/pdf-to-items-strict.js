// tools/pdf-to-items-strict.js
// Leest content.pdf en maakt src/data/items.js met {category, items[]} structuur.
// Categorie-koppen worden streng herkend, "inch" (") en backslashes worden ge-escaped.

const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

// Verwachte locaties (script staat in /tools)
const PDF_PATH = path.resolve(__dirname, '..', 'content.pdf');
const OUT_DIR  = path.resolve(__dirname, '..', 'src', 'data');
const OUT_PATH = path.join(OUT_DIR, 'items.js');

// Alleen deze koppen tellen als categorie (uppercase varianten):
const HEADING_ALIASES = {
  'WALK-IN COOLER': 'Walk-in Cooler',
  'WALK IN COOLER': 'Walk-in Cooler',
  'WALK-IN-COOLER': 'Walk-in Cooler',

  'VOORRAAD': 'Voorraad',
  'DRY STORAGE': 'Voorraad',
  'STORAGE': 'Voorraad',

  'DRANKEN': 'Dranken',
  'DRINKS': 'Dranken',

  'VRIEZER': 'Vriezer',
  'FREEZER': 'Vriezer',

  'SUPPLIES': 'Supplies',
  'SUPPLY': 'Supplies'
};

function isHeading(line) {
  const t = line.trim().toUpperCase();
  return HEADING_ALIASES[t] !== undefined;
}
function normalizeHeading(line) {
  return HEADING_ALIASES[line.trim().toUpperCase()];
}
function esc(str) {
  // escape backslash en dubbele quote, zodat 7", 10", etc. veilig zijn
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

(async () => {
  try {
    if (!fs.existsSync(PDF_PATH)) {
      console.error('❌ PDF niet gevonden op:', PDF_PATH);
      process.exit(1);
    }

    const dataBuffer = fs.readFileSync(PDF_PATH);
    const { text } = await pdfParse(dataBuffer);

    // Split alle regels, normaliseer whitespace
    const lines = text
      .split(/\r?\n/)
      .map(l => l.replace(/\s+/g, ' ').trim())
      .filter(Boolean);

    const groups = [];
    let cur = null;

    // Regels die soms als losse rommel uit de PDF komen (enkelvoudig woord),
    // willen we overslaan als ze *alleen* dat woord bevatten:
    const throwawaySingleWords = new Set([
      'Gram','gram','Zak','zak','Stuk','stuk','Tray','tray',
      'Doos','doos','Bundel','bundel','Bak','bak','Pak','pak','Fles','fles',
      'Emmer','emmer'
    ]);

    for (const raw of lines) {
      if (isHeading(raw)) {
        if (cur && cur.items.length) groups.push(cur);
        cur = { category: normalizeHeading(raw), items: [] };
        continue;
      }

      if (!cur) continue; // negeer alles vóór eerste herkende heading

      // sla regels over die *alleen* één van bovenstaande woorden zijn
      if (throwawaySingleWords.has(raw)) continue;

      // voeg toe als item
      cur.items.push(esc(raw));
    }

    if (cur && cur.items.length) groups.push(cur);

    // zorg dat src/data bestaat
    fs.mkdirSync(OUT_DIR, { recursive: true });

    const js = `// ⚠️ automatisch gegenereerd uit content.pdf — run tools/pdf-to-items-strict.js om te vernieuwen
const items = ${JSON.stringify(groups, null, 2)};

export default items;
`;
    fs.writeFileSync(OUT_PATH, js, 'utf8');

    console.log(`✅ Klaar: ${OUT_PATH}`);
    console.log(`📦 Categorieën gevonden: ${groups.length}`);
    for (const g of groups) console.log(` - ${g.category}: ${g.items.length} items`);
  } catch (err) {
    console.error('❌ Fout tijdens converteren:', err);
    process.exit(1);
  }
})();
