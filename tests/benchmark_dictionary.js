// The Transcribe drawer's dictionary lookup (DICT_STORE.lookup over Platts + Steingass) on real words: every distinct Urdu word
// of the held-out Rekhta poets (Jaun, Faraz, Parveen), looked up by its Urdu spelling and by the Roman a reader types for it.
//   found       some entry comes back (the word itself, or its singular / infinitive / a compound's parts)
//   headword    the first entry is the word itself (folded): no fallback was needed
//   inflected   found, for the plural / oblique / verb forms only: what an inflection analyzer must keep or raise
//   typed       found from the typed Roman (no diacritics) alone
// Floors: tests/dictionary_baseline.json; a fall fails the run, a rise is recorded with --update (never lowers a floor).
// Run: node tests/benchmark_dictionary.js [--update] [--misses=N]
const fs = require('fs'), path = require('path');
const { loadPage } = require('./lib_page');
const { INFLECTED, checkFloors } = require('./lib_bench');
const root = path.join(__dirname, '..');
const BASE_FILE = path.join(__dirname, 'dictionary_baseline.json');
const MISSES = +((process.argv.find(a => a.startsWith('--misses=')) || '').split('=')[1] || 0);
const { run } = loadPage({ withDict: true });
const J = JSON.stringify;

const data = JSON.parse(fs.readFileSync(path.join(root, 'data/poets_extended.json'), 'utf8')).ghazals;
/* (not lib_bench's folds: a word is looked up as Rekhta spelled it, letter forms and all, and typed Roman as one run of letters) */
const urNorm = w => w.normalize('NFC').replace(/[ً-ٰٟـّٔؔ‌‍]/g, '').replace(/[^ء-ۿ]/g, '');
const typed = ro => ro.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z]/g, '').toLowerCase();
const FUNCTION = new Set('کی کا کے کو سے نے میں پر ہے ہیں تھا تھی تھے نہ نہیں بھی ہی تو اور کہ یہ وہ جو اب جب تب کیا ہو ہوں'.split(' '));

// distinct words with the typed Roman they were written as (word-aligned lines only)
const words = new Map();
for (const p of ['jaun', 'faraz', 'parveen']) for (const g of data[p]) for (const l of g.lines) {
    if (!l.ro) continue;
    const u = l.ur.split(/\s+/).map(urNorm).filter(Boolean), r = l.ro.split(/\s+/);
    if (u.length !== r.length) continue;
    u.forEach((w, i) => { if (w.length > 1 && !FUNCTION.has(w) && !words.has(w)) words.set(w, typed(r[i])); });
}
let n = 0, found = 0, head = 0, inf = 0, infFound = 0, typedN = 0, typedFound = 0;
const miss = [];
for (const [w, t] of words) {
    const hits = run(`DICT_STORE.lookup(${J(w)})`);
    n++;
    if (hits.length) { found++; if (run(`dictFoldUr(${J(hits[0].ur)}).replace(/[\\s\\u200c-]/g, '') === dictFoldUr(${J(w)})`)) head++; }
    else if (miss.length < MISSES) miss.push(w + ' (' + t + ')');
    if (INFLECTED.test(w)) { inf++; infFound += hits.length > 0; }
    if (t.length > 1) { typedN++; typedFound += run(`DICT_STORE.lookup(${J(t)}).length`) > 0; }
}
const pct = (a, b) => Math.round(10000 * a / b) / 100;
const now = { found: pct(found, n), headword: pct(head, n), inflected: pct(infFound, inf), typed: pct(typedFound, typedN), n };
const KEYS = ['found', 'headword', 'inflected', 'typed'];
console.log(`dictionary lookup, ${n} held-out words (${inf} inflected): found ${now.found}%, headword ${now.headword}%, inflected ${now.inflected}%, from typed Roman ${now.typed}%`);
if (miss.length) console.log('  not found: ' + miss.join(' · '));
process.exit(checkFloors(BASE_FILE, now, KEYS));
