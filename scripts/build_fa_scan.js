// data/fa_scan.json: what the Persian scansion engine (ScanFa) adds to a copy of the engine.
//   lex:    Persian readings the engine lacks (scripts/lib_fa_scan.js buildScanLex: from Sufinama's Roman, add-only)
//   meters: Ganjoor's Persian meters no Urdu meter covers (300+ verses; the rubāʿī meter is already the engine's R1-R12)
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
const meters = F.persianMeterRows(persian.filter(m => !/رباعی/.test(m.name)));
fs.writeFileSync(path.join(root, 'data/fa_scan.json'), JSON.stringify({ meters, lex }, null, 0).replace(/\],"/g, '],\n"') + '\n');
console.log(`${Object.keys(lex).length} Persian readings, ${meters.length} Persian meters -> data/fa_scan.json`);
