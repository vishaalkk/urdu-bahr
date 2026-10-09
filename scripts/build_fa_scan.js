// data/fa_scan.json: what the Persian scansion engine (ScanFa) adds to a copy of the engine.
//   lex:    Persian readings the engine lacks, add-only: from Sufinama's Roman (scripts/lib_fa_scan.js buildScanLex), then the
//           verb forms (lib_fa_verbs.js) and Steingass's dictionary (lib_fa_steingass.js) for words still misread
//   verbs:  the generated verb forms, for the iẓāfat guess (src/js/05-translit-helpers.js faIzafatSlots)
//   meters: Ganjoor's Persian meters no Urdu meter covers (300+ verses, or one Ganjoor files a ghazal of ours under; the rubāʿī
//           meter is already the engine's R1-R12)
// Used by scripts/build_app.py (window.ScanFa), scripts/scan_sufinama.js and tests/benchmark_fa.js (loadFaEngine).
//   node scripts/build_fa_scan.js
const fs = require('fs'), path = require('path');
const { loadEngine } = require('./lib_scan');
const F = require('./lib_fa_scan');
const root = path.join(__dirname, '..');
const { Scan, ctx } = loadEngine();
const ghazals = JSON.parse(fs.readFileSync(path.join(root, 'data/sufinama_ghazals.json'), 'utf8'));
const persian = JSON.parse(fs.readFileSync(path.join(root, 'data/persian_meters.json'), 'utf8'));
const lex = F.buildScanLex(Scan, ghazals);
/* + verb forms (scripts/lib_fa_verbs.js) the engine misreads and Sufinama never showed */
Object.assign(lex, require('./lib_fa_verbs').verbLex(Scan, lex, F.romanWeights, F.rankReadings));
/* + Steingass's classical pronunciations (scripts/lib_fa_steingass.js, data/fa_steingass.tsv) for the words still misread */
const nBefore = Object.keys(lex).length;
Object.assign(lex, require('./lib_fa_steingass').steingassLex(Scan, ctx, lex, F.romanWeights, F.rankReadings));
console.log(`${Object.keys(lex).length - nBefore} readings from Steingass`);
/* + any rarer Persian-only meter Ganjoor files one of our ghazals under (its sure matches, 3+ lines, as build_poets.py takes them) */
const gold = JSON.parse(fs.readFileSync(path.join(root, 'tests/data/persian_gold.json'), 'utf8'));
const attested = new Set(gold.filter(g => g.ganjoor && g.ganjoor.hits >= 3 && g.ganjoor.metre_id).map(g => g.ganjoor.metre_id));
const persianRows = F.persianMeterRows(persian.filter(m => !/رباعی/.test(m.name)), 300, attested);
/* + contracted rows (F.contractionRows) for the Urdu meters and the Persian-only ones */
const meters = persianRows.concat(F.contractionRows(Scan.METERS.filter(m => m.kind !== 'rubai' && m.id !== 'H' && m.raw).map(m => [m.id, m.raw]).concat(persianRows)));
/* + the verb forms as the Persian text prep spells them, for the iẓāfat guess (faIzafatSlots: no iẓāfat on or before a verb) */
const verbs = [...new Set(require('./lib_fa_verbs').verbForms().map(([u]) => ctx.faScanSpelling(u)).filter(u => !/\s/.test(u)))].sort();
fs.writeFileSync(path.join(root, 'data/fa_scan.json'), JSON.stringify({ meters, lex, verbs }, null, 0).replace(/\],"/g, '],\n"') + '\n');
console.log(`${Object.keys(lex).length} Persian readings, ${persianRows.length} Persian meters + ${meters.length - persianRows.length} contracted rows -> data/fa_scan.json`);
