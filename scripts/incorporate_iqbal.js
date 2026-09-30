// Adds Urdu / Devanagari / Roman forms (Sean Pue's parsers, from the built index.html)
// and the app's meter id to every line of data/iqbal_corpus.json (scraped by
// scripts/scrape_iqbal.py from Frances Pritchett's Iqbal pages). build_app.py then
// folds these words into WORD_ASCII_MAP.  Run: npm run build && node scripts/incorporate_iqbal.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

// ---- 1. Load the app's transliteration parsers (p_ur, p_hi, p_di) and the
// scansion engine (Scan) out of the built index.html, the same way
// tests/chip_translit_consistency.js and tests/corpus_scan.js do. ----------

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const scriptBlocks = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
if (!scriptBlocks || scriptBlocks.length < 2) {
  throw new Error('Expected 2 inline <script> blocks in index.html — run `npm run build` first.');
}
const code0 = scriptBlocks[0].replace(/<\/?script[^>]*>/gi, ''); // PUE parsers + engine
const code1 = scriptBlocks[1].replace(/<\/?script[^>]*>/gi, ''); // everything else (incl. Scan)

// Minimal fake DOM, enough for the parser/engine code to load without throwing.
const domStore = {};
function makeElement(id) {
  return {
    id, classList: { add(){}, remove(){}, toggle(){} }, addEventListener(){},
    querySelectorAll: () => [], querySelector: () => null,
    textContent: '', innerHTML: '', value: '', style: {},
  };
}
const ctx = {
  window: {},
  document: {
    getElementById: (id) => { if (!domStore[id]) domStore[id] = makeElement(id); return domStore[id]; },
    querySelectorAll: () => [], querySelector: (s) => makeElement(s), addEventListener(){},
  },
  $: (id) => { if (!domStore[id]) domStore[id] = makeElement(id); return domStore[id]; },
  console, setTimeout: (fn) => { fn(); return 1; }, clearTimeout(){}, setInterval(){}, clearInterval(){},
  AudioContext: function () { return {}; }, localStorage: { getItem: () => null, setItem(){}, removeItem(){} },
};
vm.createContext(ctx);
vm.runInContext(code0, ctx);
vm.runInContext(code1, ctx);
const p_ur = ctx.window.p_ur, p_hi = ctx.window.p_hi, p_di = ctx.window.p_di, Scan = ctx.Scan;
if (!p_ur || !p_hi || !p_di || !Scan) throw new Error('parsers/engine not found — run `npm run build` first.');

const file = path.join(ROOT, 'data/iqbal_corpus.json');
const poems = JSON.parse(fs.readFileSync(file, 'utf8'));
const pat = s => (s || '').replace(/\s+/g, ' ').replace(/\s*\/\/\s*/g, ' / ').trim();
let lines = 0, scanned = 0, withMeter = 0;
for (const p of poems) {
  const m = p.meter ? Scan.METERS.find(x => pat(x.raw) === pat(p.meter)) : null;
  p.meters = m ? [m.id] : [];
  if (m) withMeter++;
  p.lines = p.lines.map(l => {
    const ascii = typeof l === 'string' ? l : l.ascii;
    const ur = p_ur.parse(ascii), hi = p_hi.parse(ascii), ro = p_di.parse(ascii);
    lines++;
    if (m) { const f = Scan.scanLine(ur).fits; if (f.some(x => x.meter.id === m.id)) scanned++; }
    return { ascii, ur, hi, ro };
  });
}
fs.writeFileSync(file, JSON.stringify(poems, null, 1));
console.log(`${poems.length} poems, ${lines} lines; meter identified for ${withMeter} poems; engine finds that meter for ${scanned} of their lines`);
