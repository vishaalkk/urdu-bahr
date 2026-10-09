// data/fa_scan.json: what the Persian scansion engine (ScanFa) adds to a copy of the engine.
//   lex:    Persian readings the engine lacks (scripts/lib_fa_scan.js buildScanLex: from Sufinama's Roman, add-only)
//   meters: Ganjoor's Persian meters no Urdu meter covers (300+ verses, or one Ganjoor files a ghazal of ours under; the rubāʿī
//           meter is already the engine's R1-R12)
// Used by scripts/build_app.py (window.ScanFa), scripts/scan_sufinama.js and tests/benchmark_fa.js (loadFaEngine).
//   node scripts/build_fa_scan.js
const fs = require('fs'), path = require('path');
const { loadEngine } = require('./lib_scan');
const F = require('./lib_fa_scan');
const root = path.join(__dirname, '..');
const { Scan } = loadEngine();
const ghazals = JSON.parse(fs.readFileSync(path.join(root, 'data/sufinama_ghazals.json'), 'utf8'));
const persian = JSON.parse(fs.readFileSync(path.join(root, 'data/persian_meters.json'), 'utf8'));
const lex = F.buildScanLex(Scan, ghazals);
/* + verb forms (scripts/lib_fa_verbs.js) the engine misreads and Sufinama never showed */
Object.assign(lex, require('./lib_fa_verbs').verbLex(Scan, lex, F.romanWeights, F.rankReadings));
/* + any rarer Persian-only meter Ganjoor files one of our ghazals under (its sure matches, 3+ lines, as build_poets.py takes them) */
const gold = JSON.parse(fs.readFileSync(path.join(root, 'tests/data/persian_gold.json'), 'utf8'));
const attested = new Set(gold.filter(g => g.ganjoor && g.ganjoor.hits >= 3 && g.ganjoor.metre_id).map(g => g.ganjoor.metre_id));
const persianRows = F.persianMeterRows(persian.filter(m => !/رباعی/.test(m.name)), 300, attested);
/* + contracted rows (F.contractionRows) for the Urdu meters and the Persian-only ones */
const meters = persianRows.concat(F.contractionRows(Scan.METERS.filter(m => m.kind !== 'rubai' && m.id !== 'H' && m.raw).map(m => [m.id, m.raw]).concat(persianRows)));
fs.writeFileSync(path.join(root, 'data/fa_scan.json'), JSON.stringify({ meters, lex }, null, 0).replace(/\],"/g, '],\n"') + '\n');
console.log(`${Object.keys(lex).length} Persian readings, ${persianRows.length} Persian meters + ${meters.length - persianRows.length} contracted rows -> data/fa_scan.json`);
