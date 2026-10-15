// Real casual typing: Google's Dakshina dataset (Roark et al. 2020, "Processing South Asian Languages Written in the Latin Script:
// the Dakshina Dataset", CC BY-SA 4.0), Urdu words romanized by native speakers. Each romanization goes through Scan's path
// (lineScripts, no dictionary) and counts if the right Urdu word comes out.
//   all     every romanization (Dakshina's words come from Wikipedia: many names and modern terms no list of ours has)
//   known   romanizations of words the app's lists have (Pritchett's corpora, the poets' list): a miss here is the engine's
// The test split is committed (tests/data/dakshina_ur_test.tsv); scripts/learn_typing.js learns only from the train split, kept
// locally with dev (source_data/dakshina). Floors: tests/dakshina_baseline.json; a fall fails, --update raises them.
// Run: node tests/benchmark_dakshina.js [--update] [--split=dev] [--misses=N] [--known]
const fs = require('fs'), path = require('path');
const { loadPage } = require('./lib_page');
const { urNorm, checkFloors } = require('./lib_bench');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=').slice(1).join('=') : d; };
const SPLIT = arg('split', 'test'), MISSES = +arg('misses', 0), ONLY_KNOWN = process.argv.includes('--known');
const file = SPLIT === 'test' ? path.join(__dirname, 'data', 'dakshina_ur_test.tsv')
  : path.join(__dirname, '..', 'source_data', 'dakshina', 'dakshina_dataset_v1.0', 'ur', 'lexicons', `ur.translit.sampled.${SPLIT}.tsv`);
const { run } = loadPage();
const J = JSON.stringify;
const known = new Set(run(`(function () {
  var out = Object.keys(WORD_ASCII_MAP);
  Object.keys(ASCII_FREQ).concat(Object.keys(ROMAN_FALLBACK).map(function (k) { return ROMAN_FALLBACK[k]; })).forEach(function (a) { out.push(asciiToScripts(a).ur || ''); });
  return out; })()`).map(urNorm));
const rows = fs.readFileSync(file, 'utf8').split('\n').map(l => l.split('\t')).filter(r => r[0] && r[1] && /^[a-z']+$/i.test(r[1]));
const typed = [...new Set(rows.map(r => r[1].toLowerCase()))];
const outs = run(`(${J(typed)}).map(function (t) { return (lineScripts(t, { skipKnown: true }) || {}).ur || ''; })`);
const got = new Map(typed.map((t, i) => [t, urNorm(outs[i])]));
let n = 0, ok = 0, kn = 0, knOk = 0;
const miss = [];
for (const [ur, ro] of rows) {
  const want = urNorm(ur), isKnown = known.has(want), g = got.get(ro.toLowerCase()), good = g === want;
  n++; ok += good;
  if (isKnown) { kn++; knOk += good; }
  if (!good && miss.length < MISSES && (!ONLY_KNOWN || isKnown)) miss.push(`${ro} → ${g} (want ${want}${isKnown ? '' : ', no list has it'})`);
}
const pct = (a, b) => Math.round(10000 * a / b) / 100;
const now = { all: pct(ok, n), known: pct(knOk, kn), n };
console.log(`Dakshina ${SPLIT} (${n} romanizations by native speakers): right Urdu word ${now.all}%, of words the lists know (${kn}) ${now.known}%`);
miss.forEach(m => console.log('  ' + m));
process.exit(SPLIT === 'test' ? checkFloors(path.join(__dirname, 'dakshina_baseline.json'), now, ['all', 'known']) : 0);
