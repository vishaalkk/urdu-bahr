// Precision of the drawer's dictionary lookup on inflected forms: tests/data/lemma_gold.json pairs a form (دیکھتا, آنکھوں,
// زمانے, گئے …) with the dictionary word(s) it belongs to. benchmark_dictionary.js counts whether ANY entry comes back; this one
// asks whether the RIGHT one does, and how high.
//   top1   the first entry is the right word (what the drawer opens on)
//   top3   the right word is among the first three readings
// Floors: tests/lemma_baseline.json; a fall fails the run, a rise is recorded with --update (never lowers a floor).
// Run: node tests/benchmark_lemma.js [--update] [-v]
const fs = require('fs'), path = require('path');
const { loadPage } = require('./lib_page');
const { checkFloors } = require('./lib_bench');
const BASE_FILE = path.join(__dirname, 'lemma_baseline.json');
const VERBOSE = process.argv.includes('-v');
const { run } = loadPage({ withDict: true });
const J = JSON.stringify;
const { pairs } = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'lemma_gold.json'), 'utf8'));

let top1 = 0, top3 = 0;
const miss = [];
for (const [form, lemmas] of pairs) {
    const keys = [...new Set(run(`DICT_STORE.lookup(${J(form)}).map(e => dictKeyUr(e.ur))`))].slice(0, 3);   // distinct words, as the drawer's reading pills group them
    const want = lemmas.map(l => run(`dictKeyUr(${J(l)})`));
    const at = keys.findIndex(k => want.includes(k));
    if (at === 0) top1++;
    if (at >= 0) top3++;
    if (at !== 0) miss.push(`${form} → ${lemmas[0]}: ${at < 0 ? 'not in top 3' : 'rank ' + (at + 1)} [${keys.join(' ')}]`);
}
const pct = a => Math.round(10000 * a / pairs.length) / 100;
const now = { top1: pct(top1), top3: pct(top3), n: pairs.length };
console.log(`dictionary word of an inflected form, ${pairs.length} gold pairs: first reading ${now.top1}%, in the first three ${now.top3}%`);
if (VERBOSE) miss.forEach(m => console.log('  ' + m));
const KEYS = ['top1', 'top3'];
process.exit(checkFloors(BASE_FILE, now, KEYS, { onFail: () => miss.forEach(m => console.log('  ' + m)) }));
