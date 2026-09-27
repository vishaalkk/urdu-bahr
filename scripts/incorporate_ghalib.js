// Incorporate the 49 Ghalib ghazals present in data/ghalib_full_corpus.json
// (Frances Pritchett's site, 234 ghazals total) but missing from
// data/ghalib_extended.json (185 ghazals, the corpus the app actually ships).
//
// Rule (per user directive): the meter label printed at the top of each
// Pritchett page is definitive for the WHOLE ghazal — never the scanner's
// own guess. So `meters` is set from `meter_label` via METER_LABEL_MAP below,
// which is exactly the mapping already implied by the 185 existing entries.
//
// For every one of the 234 ghazals we recompute ur/hi/ro from the ascii text
// using the app's own embedded Sean Pue parsers (extracted from the built
// index.html — see scripts/build_app.py for how those parsers are normally
// invoked: `p_ur.parse`, `p_hi.parse`, and the diacritics parser `p_di.parse`
// for `ro`). For the 185 ghazals already in ghalib_extended.json we only use
// that recomputation to CHECK: their existing `lines` are kept byte-for-byte
// (they've been reviewed; don't churn them), and we just confirm the stored
// `meters` still matches METER_LABEL_MAP, reporting any disagreement.
//
// Run: node scripts/incorporate_ghalib.js
// (Re-run safely any time; it's a pure function of the two input JSON files
// and index.html, and always writes the full merged, sorted 234.)

'use strict';
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

const p_ur = ctx.window.p_ur, p_hi = ctx.window.p_hi, p_di = ctx.window.p_di;
const Scan = ctx.Scan;
if (!p_ur || !p_hi || !p_di) throw new Error('p_ur/p_hi/p_di not found on window after loading index.html scripts.');
if (!Scan || typeof Scan.scanLine !== 'function') throw new Error('Scan.scanLine not found after loading index.html scripts.');

// ---- 2. The definitive meter_label -> app meter id(s) mapping, exactly as
// implied by the 185 ghazals already reviewed and shipped. ----------------

const METER_LABEL_MAP = {
  G1: [10], G2: [26], G3: [5], G4: [20], G5: [18, 19], G6: [36], G7: [27],
  G8: [14, 15], G9: [33, 34], G10: [4], G11: [16, 17], G12: [28], G13: [8],
  G14: [11], G15: [25], G16: [35], G17: [23], G18: [7], G19: [9, 1],
};

// ---- 3. Load the source data. --------------------------------------------

const fullCorpusPath = path.join(ROOT, 'data', 'ghalib_full_corpus.json');
const extendedPath = path.join(ROOT, 'data', 'ghalib_extended.json');
const fullCorpus = JSON.parse(fs.readFileSync(fullCorpusPath, 'utf8'));
const existing = JSON.parse(fs.readFileSync(extendedPath, 'utf8'));
const existingById = new Map(existing.map((g) => [g.id, g]));

console.log(`Full corpus: ${fullCorpus.length} ghazals. Existing extended corpus: ${existing.length} ghazals.`);

// ---- 4. Build the merged, per-ghazal report. -----------------------------

function scanRates(lines, meterIds) {
  // lines: [{ur, ...}]; meterIds: e.g. [18, 19]
  const wanted = new Set(meterIds.map(String));
  let pass = 0, top1 = 0;
  for (const l of lines) {
    const r = Scan.scanLine(l.ur);
    const inMeterFits = r.fits.filter((f) => wanted.has(String(f.meter.id)) && f.c <= 5);
    if (inMeterFits.length) pass++;
    if (r.fits[0] && wanted.has(String(r.fits[0].meter.id))) top1++;
  }
  const n = lines.length || 1;
  return { scan_pass_rate: pass / n, scan_top1_rate: top1 / n };
}

const merged = [];
const newGhazalReports = [];
const labelDisagreements = [];
let roMatchTotal = 0, roMatchOk = 0;

for (const fc of fullCorpus) {
  const id = fc.ghazal_num;
  const meterIds = METER_LABEL_MAP[fc.meter_label];
  if (!meterIds) throw new Error(`Ghazal ${id}: unknown meter_label ${fc.meter_label}`);

  const already = existingById.get(id);
  if (already) {
    // Keep the reviewed entry's `lines` (and everything else) untouched.
    // Only check that its stored `meters` agrees with the definitive mapping.
    if (JSON.stringify(already.meters) !== JSON.stringify(meterIds)) {
      labelDisagreements.push({ id, meter_label: fc.meter_label, stored: already.meters, expected: meterIds });
    }
    if (already.meter_label !== fc.meter_label) {
      labelDisagreements.push({ id, kind: 'meter_label mismatch', stored: already.meter_label, expected: fc.meter_label });
    }
    // Reproduction check for `ro`, over the already-reviewed lines, purely
    // for the report (does not change anything).
    for (const l of already.lines) {
      roMatchTotal++;
      if (p_di.parse(l.ascii) === l.ro) roMatchOk++;
    }
    merged.push(already);
    continue;
  }

  // New ghazal: build the entry from scratch, in the same shape.
  const lines = fc.lines.map((ascii) => ({
    ascii,
    ur: p_ur.parse(ascii),
    hi: p_hi.parse(ascii),
    ro: p_di.parse(ascii),
  }));
  const { scan_pass_rate, scan_top1_rate } = scanRates(lines, meterIds);

  const entry = {
    id,
    poet: 'Ghalib',
    meter_label: fc.meter_label,
    meters: meterIds,
    url: fc.url,
    lines_count: lines.length,
    scan_pass_rate,
    lines,
    notes: {},
    scan_top1_rate,
    couplets_count: Math.floor(lines.length / 2),
  };
  merged.push(entry);
  newGhazalReports.push({ id, meter_label: fc.meter_label, meters: meterIds, lines_count: lines.length, scan_pass_rate, scan_top1_rate });
}

merged.sort((a, b) => a.id - b.id);

// ---- 5. Write back, matching the existing file's formatting. -------------

const out = JSON.stringify(merged, null, 2);
fs.writeFileSync(extendedPath, out);

// ---- 6. Report. -----------------------------------------------------------

console.log(`\nWrote ${merged.length} ghazals to ${path.relative(ROOT, extendedPath)} (${newGhazalReports.length} new).`);

console.log('\n=== meter_label / meters disagreements on the 185 previously-existing ghazals ===');
console.log(labelDisagreements.length ? JSON.stringify(labelDisagreements, null, 2) : '(none)');

console.log(`\n=== ro reproduction on the 185 previously-existing ghazals ===`);
console.log(`${roMatchOk} / ${roMatchTotal} lines match exactly (${(100 * roMatchOk / roMatchTotal).toFixed(2)}%)`);

console.log('\n=== new ghazals: scan_pass_rate in their definitive meter ===');
newGhazalReports
  .sort((a, b) => a.id - b.id)
  .forEach((r) => console.log(`  Ghazal ${r.id} (${r.meter_label} -> [${r.meters.join(',')}]): pass=${r.scan_pass_rate.toFixed(3)} top1=${r.scan_top1_rate.toFixed(3)} (${r.lines_count} lines)`));

const low = newGhazalReports.filter((r) => r.scan_pass_rate < 0.8);
console.log(`\n=== new ghazals with scan_pass_rate < 0.8 (${low.length}) ===`);
console.log(low.length ? JSON.stringify(low, null, 2) : '(none)');
