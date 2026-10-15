// Real casual typing: Google's Dakshina dataset (Roark et al. 2020, CC BY-SA 4.0), Urdu words romanized by native speakers. Each
// typed romanization goes through Scan's path (lineScripts, no dictionary) and is scored by whether the right Urdu word comes out.
// "known" = the Urdu word is one the app's word lists have (Pritchett's corpora or the poets' list), so a miss is the engine's,
// not the vocabulary's (Dakshina's words come from Wikipedia: names, places, modern terms).
// Data (local, not in git): source_data/dakshina/dakshina_dataset_v1.0/ur (the Urdu folder of
// https://storage.googleapis.com/gresearch/dakshina/dakshina_dataset_v1.0.tar).
//   node scripts/dakshina_eval.js [--split=test|dev|train] [--misses=N] [--known]
const fs = require('fs'), path = require('path');
const { loadPage } = require('../tests/lib_page');
const { urNorm } = require('../tests/lib_bench');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=').slice(1).join('=') : d; };
const SPLIT = arg('split', 'test'), MISSES = +arg('misses', 0), ONLY_KNOWN = process.argv.includes('--known');
const DIR = path.join(__dirname, '..', 'source_data', 'dakshina', 'dakshina_dataset_v1.0', 'ur', 'lexicons');
const file = path.join(DIR, `ur.translit.sampled.${SPLIT}.tsv`);
if (!fs.existsSync(file)) { console.error('no Dakshina data at ' + DIR); process.exit(2); }
const { run } = loadPage();
const J = JSON.stringify;
if (process.env.PATCH) run(fs.readFileSync(process.env.PATCH, 'utf8'));

/* the Urdu words the app's lists know */
const known = new Set(run(`(function () {
  var out = Object.keys(WORD_ASCII_MAP);
  Object.keys(ASCII_FREQ).concat(Object.keys(ROMAN_FALLBACK).map(function (k) { return ROMAN_FALLBACK[k]; })).forEach(function (a) { out.push(asciiToScripts(a).ur || ''); });
  return out; })()`).map(urNorm));

const rows = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map(l => l.split('\t'))
  .filter(r => r[0] && r[1] && /^[a-z']+$/i.test(r[1]));
const typed = [...new Set(rows.map(r => r[1].toLowerCase()))];
const got = new Map();
const outs = run(`(${J(typed)}).map(function (t) { return (lineScripts(t, { skipKnown: true }) || {}).ur || ''; })`);
typed.forEach((t, i) => got.set(t, urNorm(outs[i])));
const stat = () => ({ n: 0, ok: 0, w: 0, wok: 0 });
const all = stat(), kn = stat(), miss = [];
for (const [ur, ro, cnt] of rows) {
  const want = urNorm(ur), isKnown = known.has(want), g = got.get(ro.toLowerCase()), good = g === want, c = +cnt || 1;
  for (const s of isKnown ? [all, kn] : [all]) { s.n++; s.ok += good; s.w += c; s.wok += good * c; }
  if (!good && MISSES && miss.length < MISSES && (!ONLY_KNOWN || isKnown)) miss.push(`${ro} → ${g} (want ${want}${isKnown ? '' : ', not in the lists'})`);
}
const pct = (a, b) => (100 * a / b).toFixed(2) + '%';
console.log(`Dakshina ${SPLIT}: ${all.n} romanizations; right Urdu ${pct(all.ok, all.n)} (by use ${pct(all.wok, all.w)}); ` +
  `of words the lists know (${kn.n}): ${pct(kn.ok, kn.n)} (by use ${pct(kn.wok, kn.w)})`);
if (process.argv.includes('--json')) console.log('JSON ' + J({ all: all.ok / all.n, known: kn.ok / kn.n, n: all.n, nKnown: kn.n }));
miss.forEach(m => console.log('  ' + m));
