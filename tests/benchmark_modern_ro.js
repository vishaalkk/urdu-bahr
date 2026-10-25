// Modern Roman style (trStyleRo, src/js/24-transcribe.js) against real typing: Dakshina's romanized sentences (Roark et al. 2020,
// CC BY-SA 4.0), word by word. A word of the sentence that Pritchett's word map knows is rendered in Classical Roman (her
// spelling, asciiToScripts) and through the Modern style; it counts if Modern gives exactly what the native speaker typed.
// Words count as often as people use them. Homographs (اس: us / is) miss in every style alike: the floor is relative.
//   modern     Modern's Roman = the typed word
//   classical  Classical's Roman with its marks folded off (ā → a, ḥ → h, ʿ dropped) = the typed word: the old style's best case
// Data: tests/data/dakshina_ur_test_lines.tsv (committed); --split=dev reads the dev sentences (local, source_data/dakshina), for
// tuning the rules without looking at the test. Floors: tests/modern_ro_baseline.json; a fall fails, --update raises them.
// Run: node tests/benchmark_modern_ro.js [--update] [--split=dev] [--misses=N]
const fs = require('fs'), path = require('path');
const { loadPage } = require('./lib_page');
const { urNorm, checkFloors } = require('./lib_bench');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=').slice(1).join('=') : d; };
const SPLIT = arg('split', 'test'), MISSES = +arg('misses', 0);
let lines;
if (SPLIT === 'test') {
  lines = fs.readFileSync(path.join(__dirname, 'data', 'dakshina_ur_test_lines.tsv'), 'utf8').split('\n').map(l => l.split('\t'));
} else {
  const dir = path.join(__dirname, '..', 'source_data', 'dakshina', 'dakshina_dataset_v1.0', 'ur', 'romanized');
  const nat = fs.readFileSync(path.join(dir, `ur.romanized.rejoined.${SPLIT}.native.txt`), 'utf8').split('\n');
  const rom = fs.readFileSync(path.join(dir, `ur.romanized.rejoined.${SPLIT}.roman.txt`), 'utf8').split('\n');
  lines = nat.map((u, i) => [u, rom[i]]);
}
const { run } = loadPage();
const J = JSON.stringify;
const known = new Map();
run(`(function () { return Object.keys(WORD_ASCII_MAP).map(function (u) { return [u, WORD_ASCII_MAP[u]]; }); })()`)
  .forEach(([u, a]) => { const k = urNorm(u); if (k && !known.has(k) && !/[\s-]/.test(a)) known.set(k, a); });
const tok = s => String(s || '').split(/\s+/).map(w => w.replace(/^[^\p{L}]+|[^\p{L}']+$/gu, '')).filter(Boolean);
const pairs = [];
for (const [ur, ro] of lines) {
  if (!ur || !ro) continue;
  const U = tok(ur), R = tok(ro);
  if (U.length !== R.length) continue;
  U.forEach((u, i) => { const a = known.get(urNorm(u)); if (a && /^[a-z']+$/i.test(R[i])) pairs.push({ a, t: R[i].toLowerCase() }); });
}
const asc = [...new Set(pairs.map(p => p.a))];
const outs = run(`(function (as) {
  var keep = TR.style, r = as.map(function (a) {
    var ro = asciiToScripts(a).ro || '';
    TR.style = 'modern'; var m = trStyleRo(ro); TR.style = keep;
    return [ro, m];
  });
  return r; })(${J(asc)})`);
const ren = new Map(asc.map((a, i) => [a, outs[i]]));
const fold = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[ʿʾ']/g, '').toLowerCase();
let n = 0, mod = 0, cla = 0;
const miss = new Map();
for (const p of pairs) {
  const [ro, m] = ren.get(p.a);
  n++;
  if (m.toLowerCase() === p.t) mod++;
  else { const k = ro + ' → ' + m; const e = miss.get(k) || { n: 0, t: new Map() }; e.n++; e.t.set(p.t, (e.t.get(p.t) || 0) + 1); miss.set(k, e); }
  if (fold(ro) === p.t) cla++;
}
const pct = x => +(100 * x / Math.max(1, n)).toFixed(2);
const res = { modern: pct(mod), classical: pct(cla) };
console.log(`Modern Roman vs typed (${SPLIT}, ${n} words of known words): modern ${res.modern}%  classical-folded ${res.classical}%`);
if (MISSES) [...miss].sort((x, y) => y[1].n - x[1].n).slice(0, MISSES).forEach(([k, e]) =>
  console.log('  ' + e.n + '\t' + k + '\ttyped: ' + [...e.t].sort((x, y) => y[1] - x[1]).slice(0, 3).map(([t, c]) => t + ' ' + c).join(', ')));
if (SPLIT === 'test') process.exitCode = checkFloors(path.join(__dirname, 'modern_ro_baseline.json'), { n, modern: res.modern }, ['modern']);
