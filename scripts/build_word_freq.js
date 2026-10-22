// How common each Urdu word is, for the typed-word scorer's ties (casualTieWins, src/js/05-translit-helpers.js): Pritchett's counts
// are Ghalib's and Mir's (آنا beats انا, حذر stands for hazar). Two sources, each as a share of its words, averaged:
//   the Urdu lines of the Rekhta poets (data/poets_extended.json) WITHOUT the test poets (jaun, faraz, parveen), so the benchmarks
//   stay blind; alone, their 118k words pull modern words to poetic ones (khan: خواں);
//   Makhzan's word counts (6.3M words of edited modern Urdu prose; Zeerak Ahmed et al., github.com/zeerakahmed/makhzan, /stats under
//   the MIT license), local: source_data/makhzan/wordFrequency.json = .../makhzan/master/stats/wordFrequency
// (Urdu Wikipedia from Dakshina did no better than Makhzan.) Kept as a log2 band of uses per 10M words, and only for words the
// scorer can confuse: the Urdu of a spelling in its index that shares a key or a skeleton with a spelling of another word.
// Out: data/word_freq.json ({band: "word word …"}), read by the build into WORD_FREQ.
//   node scripts/build_word_freq.js [--out data/word_freq.json]
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const { loadPage } = require('../tests/lib_page');
const argv = process.argv.slice(2), oi = argv.indexOf('--out');
const OUT = oi >= 0 ? argv[oi + 1] : path.join(root, 'data/word_freq.json');
const TEST_POETS = new Set(['jaun', 'faraz', 'parveen']);
const MAKHZAN = path.join(root, 'source_data/makhzan/wordFrequency.json');
if (!fs.existsSync(MAKHZAN)) { console.error('no Makhzan word counts at ' + MAKHZAN); process.exit(2); }
const { ctx: page, run } = loadPage();

const count = new Map(), prose = new Map();
let total = 0, proseTotal = 0;
const mk = JSON.parse(fs.readFileSync(MAKHZAN, 'utf8'));
Object.keys(mk).forEach(w => { const k = page.wordFreqKey(w); if (k) { prose.set(k, (prose.get(k) || 0) + mk[w]); proseTotal += mk[w]; } });
const data = JSON.parse(fs.readFileSync(path.join(root, 'data/poets_extended.json'), 'utf8')).ghazals;
Object.keys(data).filter(p => !TEST_POETS.has(p)).forEach(p => data[p].forEach(g => {
  if (g.lang === 'fa') return;
  g.lines.forEach(l => {
    if (!l.ur || l.lang === 'fa') return;
    l.ur.split(/\s+/).forEach(w => { const k = page.wordFreqKey(w); if (k) { count.set(k, (count.get(k) || 0) + 1); total++; } });
  });
}));

/* the Urdu spellings the scorer can confuse: groups of its index (lax key, skeleton) holding more than one Urdu word */
const want = new Set(run(`(function () { var idx = casualIndex(), out = [];
  [idx.byKey, idx.bySkel].forEach(function (m) { m.forEach(function (arr) {
    var u = {}; arr.forEach(function (e) { u[wordFreqKey(asciiToScripts(e.a).ur || '')] = 1; });
    var ks = Object.keys(u).filter(Boolean); if (ks.length > 1) out.push.apply(out, ks); }); });
  return out; })()`));

const bands = {};
want.forEach(k => {
  const rate = ((count.get(k) || 0) / total + (prose.get(k) || 0) / proseTotal) / 2, b = Math.floor(Math.log2(1 + rate * 1e7));
  if (b > 0) (bands[b] ||= []).push(k);
});
const out = { source: 'Rekhta poets without jaun, faraz, parveen; Makhzan word counts (github.com/zeerakahmed/makhzan /stats, MIT License per its README); log2 of uses per 10M words', bands: {} };
Object.keys(bands).forEach(b => { out.bands[b] = bands[b].sort().join(' '); });
fs.writeFileSync(OUT, JSON.stringify(out) + '\n');
console.log(`poets ${total} words, Makhzan ${proseTotal}; ${Object.values(bands).flat().length} of ${want.size} confusable words -> ${path.relative(root, OUT)}`, (fs.statSync(OUT).size / 1024).toFixed(1) + ' KB');
