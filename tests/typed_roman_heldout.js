// Typed Roman → the right Urdu word (and Rekhta's Roman and Devanagari for it), on Rekhta poets the word lists never saw (Jaun, Faraz, Parveen typed without diacritics):
// the shared path Scan and Transcribe both read (casualPiece). The neighbour table and the poets' fallback list are rebuilt
// without the test poets, so the score measures generalisation, not memory. Floors: tests/typed_roman_baseline.json; a fall
// fails the run, a rise is recorded with --update (never lowers a floor).
// Run: node tests/typed_roman_heldout.js [--update]
const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const { checkFloors } = require('./lib_bench');
const root = path.join(__dirname, '..');
const BASE_FILE = path.join(__dirname, 'typed_roman_baseline.json');
const POETS = 'jaun,faraz,parveen';

/* the neighbour table mined without the test poets is committed: it is built from the Rekhta scans (data/poets_scanned/, local
   only), which CI does not have. Rebuild it when scripts/build_collocations.py changes:
     uv run python scripts/build_collocations.py --exclude jaun,faraz,parveen --out tests/data/collocations_heldout.json */
const table = path.join(__dirname, 'data', 'collocations_heldout.json');
const out = execFileSync('node', [path.join(root, 'scripts/casual_roman_eval.js'), table, POETS, '--json'], { encoding: 'utf8', maxBuffer: 1 << 26 });
const r = JSON.parse(out.split('\n').find(l => l.startsWith('JSON ')).slice(5)).neighbours;
const pct = (a, b) => Math.round(10000 * a / b) / 100;
const now = { words: pct(r.ok, r.n), several: pct(r.ambOk, r.amb), inflected: pct(r.infOk, r.inf), roman: pct(r.roOk, r.roN), devanagari: pct(r.hiOk, r.hiN), n: r.n };
const KEYS = ['words', 'several', 'inflected', 'roman', 'devanagari'];
console.log(`typed Roman, held-out poets (${now.n} words): right Urdu word ${now.words}%, words with several spellings ${now.several}%, ` +
    `inflected words ${now.inflected}%, Roman ${now.roman}%, Devanagari ${now.devanagari}%`);
process.exit(checkFloors(BASE_FILE, now, KEYS));
