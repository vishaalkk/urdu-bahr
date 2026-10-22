// Real casual typing: Google's Dakshina dataset (Roark et al. 2020, "Processing South Asian Languages Written in the Latin Script:
// the Dakshina Dataset", CC BY-SA 4.0), Urdu words romanized by native speakers. Each romanization goes through Scan's path
// (lineScripts, no dictionary) and counts if the right Urdu word comes out.
//   all     every romanization (Dakshina's words come from Wikipedia: many names and modern terms no list of ours has)
//   known   romanizations of words the app's lists have (Pritchett's corpora, the poets' list): a miss here is the engine's
//   lines, linesKnown   the same over whole typed sentences (tests/data/dakshina_ur_test_lines.tsv: the first 1500 of Dakshina's
//           romanized test sentences with as many words in both scripts), word by word: the word list counts each word once, a
//           rare one as much as a common one; sentences count words as often as people use them
// The test split is committed (tests/data/dakshina_ur_test.tsv); scripts/learn_typing.js learns only from the train split, kept
// locally with dev (source_data/dakshina). Floors: tests/dakshina_baseline.json; a fall fails, --update raises them.
// Run: node tests/benchmark_dakshina.js [--update] [--split=dev] [--misses=N] [--known]   (--split=dev: the dev sentences, local)
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
/* whole sentences: punctuation off both sides, a word pair kept where the Urdu has letters */
const ROM = path.join(__dirname, '..', 'source_data', 'dakshina', 'dakshina_dataset_v1.0', 'ur', 'romanized', 'ur.romanized.rejoined.');
const sents = SPLIT === 'test' ? fs.readFileSync(path.join(__dirname, 'data', 'dakshina_ur_test_lines.tsv'), 'utf8').split('\n').filter(Boolean).map(l => l.split('\t'))
  : (() => { const a = fs.readFileSync(ROM + SPLIT + '.native.txt', 'utf8').split('\n'), b = fs.readFileSync(ROM + SPLIT + '.roman.txt', 'utf8').split('\n');
      return a.map((x, i) => [x.trim(), (b[i] || '').trim()]).filter(([x, y]) => x && x.split(/\s+/).length === y.split(/\s+/).length).slice(0, 1500); })();
const pairs = sents.map(([ur, ro]) => {
  const u = ur.split(/\s+/).map(urNorm), r = ro.split(/\s+/).map(w => w.replace(/[^a-z']/gi, '').replace(/^'+|'+$/g, ''));
  return u.map((w, k) => [w, r[k]]).filter(([w, t]) => w && t);
});
const sOut = run(`(${J(pairs.map(p => p.map(x => x[1]).join(' ')))}).map(function (t) { return (lineScripts(t, { skipKnown: true }) || {}).ur || ''; })`);
let ln = 0, lok = 0, lkn = 0, lknOk = 0;
pairs.forEach((p, i) => {
  const g = sOut[i].split(/\s+/).map(urNorm).filter(Boolean);
  if (g.length !== p.length) return;
  p.forEach(([w], k) => { const good = g[k] === w; ln++; lok += good; if (known.has(w)) { lkn++; lknOk += good; } });
});
const pct = (a, b) => Math.round(10000 * a / b) / 100;
const now = { all: pct(ok, n), known: pct(knOk, kn), lines: pct(lok, ln), linesKnown: pct(lknOk, lkn), n };
console.log(`Dakshina ${SPLIT} (${n} romanizations by native speakers): right Urdu word ${now.all}%, of words the lists know (${kn}) ${now.known}%`);
console.log(`  in typed sentences (${ln} words): ${now.lines}%, of words the lists know (${lkn}) ${now.linesKnown}%`);
miss.forEach(m => console.log('  ' + m));
process.exit(SPLIT === 'test' ? checkFloors(path.join(__dirname, 'dakshina_baseline.json'), now, ['all', 'known', 'lines', 'linesKnown']) : 0);
