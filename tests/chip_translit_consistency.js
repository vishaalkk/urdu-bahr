// Regression guard: the syllable chips shown under a scanned verse must convert
// each Urdu fragment to Roman/Devanagari the SAME way the whole line does.
//
// This exists because of a real bug: an earlier version tried to reconstruct
// each syllable's Roman text by slicing the (correct) whole-word Roman spelling
// proportionally by character count. Words with an iẓāfat ("-e"/"-i", which adds
// Roman letters with no corresponding Urdu letter) broke that slicing, producing
// confidently-wrong output (duplicated/dropped letters) while the line above it
// showed the correct text — a worse failure than an honest approximation, because
// it looked right at a glance.
//
// The fix: chips convert each syllable's own Urdu fragment independently, with
// the exact same per-character map used for whole-line conversion. That makes
// "join the syllables' conversions" and "convert the whole line" the same
// operation, decomposed differently — so they should closely agree. This test
// measures that agreement and fails if it drops much below what the current
// (simple, letter-by-letter) approach actually achieves.
//
// Run: node tests/chip_translit_consistency.js

const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
const code0 = scripts[0].replace(/<\/?script[^>]*>/gi, '');
const code1 = scripts[1].replace(/<\/?script[^>]*>/gi, '');

const domStore = {};
function makeElement(id) {
  return { id, classList: { add(){}, remove(){}, toggle(){} }, addEventListener(){}, querySelectorAll:()=>[], querySelector:()=>null, textContent:'', innerHTML:'', value:'', style:{} };
}
const ctx = {
  window: {}, document: { getElementById:(id)=>{ if(!domStore[id]) domStore[id]=makeElement(id); return domStore[id]; }, querySelectorAll:()=>[], querySelector:(s)=>makeElement(s), addEventListener(){} },
  $: (id) => { if(!domStore[id]) domStore[id]=makeElement(id); return domStore[id]; },
  console, setTimeout: (fn)=>{ fn(); return 1; }, clearTimeout(){}, setInterval(){}, clearInterval(){},
  AudioContext: function(){ return {}; }, localStorage: { getItem:()=>null, setItem(){}, removeItem(){} },
};
vm.createContext(ctx);
vm.runInContext(code0, ctx);
vm.runInContext(code1, ctx);

function editDistance(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({length: m+1}, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
    dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}
function similarity(a, b) {
  if (!a && !b) return 1;
  const d = editDistance(a, b);
  return 1 - d / Math.max(a.length, b.length, 1);
}

function collectLines(limit) {
  const out = [];
  for (const file of ['exercises_verified.json', 'ghalib_extended.json', 'mir_extended.json']) {
    const p = path.join(root, 'data', file);
    if (!fs.existsSync(p)) continue;
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    for (const g of data) {
      for (const l of (g.lines || [])) {
        if (l.ur) out.push(l.ur);
        if (out.length >= limit) return out;
      }
    }
  }
  return out;
}

const SAMPLE = 300;
const lines = collectLines(SAMPLE);
let total = 0, scored = 0, sumSim = 0, worst = [];

for (const ur of lines) {
  let r, f;
  try { r = ctx.Scan.scanLine(ur); f = r.fits && r.fits[0]; } catch (e) { continue; }
  if (!f) continue;
  let e;
  try { e = ctx.Scan.explain(r, f); } catch (err) { continue; }
  total++;
  for (const script of ['ro', 'hi']) {
    const whole = script === 'ro' ? ctx.urduToRoman(ur) : ctx.urduToDevanagari(ur);
    let joined = '';
    e.syl.forEach((s, idx) => {
      if (idx > 0 && s.word !== e.syl[idx-1].word) joined += ' ';
      if (s.text && s.text !== '·') joined += ctx.translitText(s.text, script);
    });
    const sim = similarity(whole, joined);
    scored++; sumSim += sim;
    if (sim < 0.7) worst.push({ ur, script, whole, joined, sim: sim.toFixed(2) });
  }
}

const avg = scored ? (sumSim / scored) : 0;
console.log(`lines scanned: ${total}, script comparisons: ${scored}`);
console.log(`mean whole-line vs joined-chip similarity: ${avg.toFixed(4)}`);
if (worst.length) {
  console.log(`${worst.length} comparisons below 0.70 similarity, worst 5:`);
  worst.sort((a, b) => a.sim - b.sim).slice(0, 5).forEach(w =>
    console.log(`  [${w.script}] ${w.sim}  whole="${w.whole}"  chips="${w.joined}"`));
}

const THRESHOLD = 0.85;
if (avg < THRESHOLD) {
  console.error(`FAIL: mean similarity ${avg.toFixed(4)} is below the ${THRESHOLD} floor — chip-level`);
  console.error(`transliteration has likely diverged from whole-line transliteration again.`);
  process.exit(1);
}
console.log(`PASS: chip-level and whole-line transliteration stay consistent (>= ${THRESHOLD}).`);
