// Learns how people type Urdu sounds in casual Roman, for the typed-word scorer (typingCost, src/js/05-translit-helpers.js).
// Data: Google's Dakshina dataset (Roark et al. 2020, CC BY-SA 4.0), Urdu words romanized by native speakers, train split only.
// Each romanization of a word the app's lists know (so its sounds are known: asciiSounds of its ASCII) is aligned to those sounds
// with the scorer's own alignment, and the counts of how each sound was typed (in its context: last in the word, before h, a
// doubled consonant) become costs, -log P, re-aligned with the new costs a few times (hard EM). Insertions are learned the same way.
// Out: data/typing_costs.json (read by the build into TYPING_COSTS). Local data, not in git:
//   source_data/dakshina/dakshina_dataset_v1.0/ur (the Urdu folder of https://storage.googleapis.com/gresearch/dakshina/dakshina_dataset_v1.0.tar)
//   node scripts/learn_typing.js [--iters=4] [--out=data/typing_costs.json]
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const { loadPage } = require('../tests/lib_page');
const { urNorm } = require('../tests/lib_bench');
const argv = process.argv.slice(2);
const arg = (k, d) => { const a = argv.find(x => x.startsWith('--' + k + '=')); if (a) return a.split('=').slice(1).join('='); const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const ITERS = +arg('iters', 4), OUT = arg('out', path.join(root, 'data/typing_costs.json'));
const SRC = path.join(root, 'source_data/dakshina/dakshina_dataset_v1.0/ur/lexicons/ur.translit.sampled.train.tsv');
if (!fs.existsSync(SRC)) { console.error('no Dakshina data at ' + SRC); process.exit(2); }
const { ctx: page, run } = loadPage();
const J = JSON.stringify;

/* the words the lists know, Urdu → ASCII (the commonest spelling): Pritchett's word map, her spellings, the poets' list */
const known = new Map();
run(`(function () {
  var out = [];
  Object.keys(WORD_ASCII_MAP).forEach(function (u) { out.push([u, WORD_ASCII_MAP[u], 9]); });
  Object.keys(ASCII_FREQ).forEach(function (a) { out.push([asciiToScripts(a).ur || '', a, ASCII_FREQ[a]]); });
  Object.keys(ROMAN_FALLBACK).forEach(function (k) { out.push([asciiToScripts(ROMAN_FALLBACK[k]).ur || '', ROMAN_FALLBACK[k], 1]); });
  return out; })()`).forEach(([u, a, n]) => {
  const k = urNorm(u);
  if (!k || /[\s-]/.test(a)) return;
  const had = known.get(k);
  if (!had || n > had.n) known.set(k, { a, n });
});
const pairs = [];
for (const line of fs.readFileSync(SRC, 'utf8').split('\n')) {
  const [ur, ro, cnt] = line.split('\t');
  if (!ur || !ro || !/^[a-z']+$/i.test(ro)) continue;
  if (/[\u064B-\u0652\u06C2]/.test(ur)) continue;   // a word with its vowel marks or iẓāfat written (آہِ typed aahi): the marks are not in its sounds
  const k = known.get(urNorm(ur));
  if (k) pairs.push({ T: ro.toLowerCase(), C: run(`asciiSounds(${J(k.a)})`), n: +cnt || 1 });
}
console.log(`${pairs.length} romanizations of ${new Set(pairs.map(p => p.C.join(''))).size} known words`);

const VOWEL = new Set(['a', 'ā', 'i', 'ī', 'u', 'ū', 'e', 'ai', 'o', 'au']);
/* the contexts the app scores in (soundContext, letterContext in src/js/05-translit-helpers.js): one definition for both */
const ctx = (C, j) => page.soundContext(C, j);
const insCtx = (T, i) => page.letterContext(T, i);

/* the starting costs: the hand-written table and drop / add rules (SOUND_TYPED, soundDropped, letterAdded) */
const init = run('SOUND_TYPED');
let cost = { real: {}, ins: {} };   // real[ctxKey][typed] = cost ('' = dropped); ins[insKey] = cost
const BASE = 1.2, ADD = 1;           // an unlisted letter for a sound; an unlisted added letter
function realCost(key, c, str) {
  const t = cost.real[key] || cost.real[c];
  if (t && t[str] != null) return t[str];
  if (key !== c && cost.real[c] && cost.real[c][str] != null) return cost.real[c][str] + 0.1;
  return str === '' ? (VOWEL.has(c) ? 0.9 : 1) : (str.length === 1 ? BASE : Infinity);
}
function insCost(key, ch) { return cost.ins[key] != null ? cost.ins[key] : cost.ins[ch] != null ? cost.ins[ch] + 0.1 : ADD; }
function seedFromPage() {
  Object.keys(init).forEach(c => { cost.real[c] = {}; init[c].forEach(([s, w]) => { cost.real[c][s] = w; }); });
  // drops and adds as the page prices them, read off a few contexts
  const drop = run(`(function(){ var o = {}; Object.keys(SOUND_TYPED).forEach(function (c) { o[c] = soundDropped(['b', c, 'b'], 1); o[c + '#'] = soundDropped(['b', c], 1); }); o['h̥#'] = 0.1; o['ʿ'] = 0; o['ʾ'] = 0; return o; })()`);
  Object.keys(drop).forEach(k => { const c = k.replace(/#$/, ''); (cost.real[k] = cost.real[k] || {})[''] = drop[k]; if (!cost.real[c]) cost.real[c] = {}; });
}
seedFromPage();

/* the cheapest alignment of sounds C to letters T under the current costs: its operations */
function align(T, C) {
  const n = T.length, m = C.length, W = n + 1, dp = new Float64Array((m + 1) * W).fill(Infinity), bp = new Array((m + 1) * W);
  dp[0] = 0;
  const cands = (key, c) => {
    const s = new Set(['']);
    [cost.real[key], cost.real[c]].forEach(t => t && Object.keys(t).forEach(x => s.add(x)));
    return [...s];
  };
  for (let j = 0; j <= m; j++) for (let i = 0; i <= n; i++) {
    const d = dp[j * W + i];
    if (d === Infinity) continue;
    if (i < n) { const k = insCtx(T, i), w = d + insCost(k, T[i]); if (w < dp[j * W + i + 1]) { dp[j * W + i + 1] = w; bp[j * W + i + 1] = ['ins', k, T[i]]; } }
    if (j === m) continue;
    const c = C[j], key = ctx(C, j), strs = cands(key, c);
    if (i < n && !strs.includes(T[i])) strs.push(T[i]);   // another letter for this sound
    for (const str of strs) {
      if (str && !T.startsWith(str, i)) continue;
      const w = d + realCost(key, c, str), at = (j + 1) * W + i + str.length;
      if (w < dp[at]) { dp[at] = w; bp[at] = ['real', key, c, str, j, i]; }
    }
  }
  const ops = [];
  for (let j = m, i = n; j > 0 || i > 0;) {
    const b = bp[j * W + i];
    if (!b) return null;
    ops.push(b);
    if (b[0] === 'ins') i--; else { j--; i -= b[3].length; }
  }
  return { cost: dp[m * W + n], ops };
}

/* counts → costs: -log of the smoothed share of each spelling of a sound in its context, backing off to the sound's own shares */
const SCALE = 1 / Math.log(20);   // a spelling one time in 20 costs 1 (the hand table's unit: "another letter")
for (let it = 0; it < ITERS; it++) {
  const real = {}, realTot = {}, base = {}, baseTot = {}, ins = {}, insTot = { n: 0 }, slots = {};
  let total = 0;
  for (const p of pairs) {
    const a = align(p.T, p.C);
    if (!a) continue;
    total += a.cost * p.n;
    a.ops.forEach(o => {
      if (o[0] === 'ins') { ins[o[1]] = (ins[o[1]] || 0) + p.n; ins[o[2]] = (ins[o[2]] || 0) + p.n; return; }
      const [, key, c, str] = o;
      ((real[key] = real[key] || {})[str] = (real[key][str] || 0) + p.n); realTot[key] = (realTot[key] || 0) + p.n;
      ((base[c] = base[c] || {})[str] = (base[c][str] || 0) + p.n); baseTot[c] = (baseTot[c] || 0) + p.n;
    });
    /* how often a letter could have been added: every typed letter is a chance */
    for (let i = 0; i < p.T.length; i++) { const k = insCtx(p.T, i); slots[k] = (slots[k] || 0) + p.n; slots[p.T[i]] = (slots[p.T[i]] || 0) + p.n; }
  }
  const next = { real: {}, ins: {} }, A = 2;   // pseudo-counts toward the sound's own shares
  Object.keys(base).forEach(c => {
    next.real[c] = {};
    Object.keys(base[c]).forEach(s => { if (base[c][s] >= 3) next.real[c][s] = Math.max(0, -Math.log((base[c][s] + 0.5) / (baseTot[c] + 1)) * SCALE); });
  });
  Object.keys(real).forEach(k => {
    const c = k.replace(/(#|>h|=)$/, '').replace(/<ḳh$/, '');
    if (k === c) return;
    next.real[k] = {};
    Object.keys(real[k]).forEach(s => {
      if (real[k][s] < 3) return;
      const prior = (base[c] && base[c][s] || 0) / (baseTot[c] || 1);
      next.real[k][s] = Math.max(0, -Math.log((real[k][s] + A * prior + 0.5) / (realTot[k] + A + 1)) * SCALE);
    });
  });
  Object.keys(ins).forEach(k => { if (ins[k] >= 3) next.ins[k] = Math.max(0, -Math.log((ins[k] + 0.5) / (slots[k] + 1)) * SCALE); });
  console.log(`iteration ${it + 1}: alignment cost ${(total / pairs.reduce((s, p) => s + p.n, 0)).toFixed(3)} per word`);
  cost = next;
}
const round = o => { const r = {}; Object.keys(o).sort().forEach(k => { r[k] = typeof o[k] === 'object' ? round(o[k]) : Math.round(o[k] * 100) / 100; }); return r; };
fs.writeFileSync(OUT, JSON.stringify({ source: 'Dakshina v1.0 ur train (Roark et al. 2020, CC BY-SA 4.0)', pairs: pairs.length, real: round(cost.real), ins: round(cost.ins) }) + '\n');
console.log('-> ' + path.relative(root, OUT), (fs.statSync(OUT).size / 1024).toFixed(1) + ' KB');
