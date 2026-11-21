// data/ganjoor_lines.json: Ganjoor's text of a Persian line, for the lines that miss their ghazal's meter in Sufinama's text
// and fit it in Ganjoor's. {sufinama url: {line index: Ganjoor's line}}.
//   For each Persian ghazal matched on Ganjoor (tests/data/persian_gold.json, three or more lines; its `fa` pairs our lines
//   with theirs), every line is read as the reader reads it (faCorpusScan, src/js/05-translit-helpers.js). A line that misses
//   the meter is read again in Ganjoor's words by the same function (opts.alt); it is kept only if that fits the ghazal's own
//   meter. Nothing replaces our text: scripts/build_poets.py ships these as `gv`, the reader scans them and says so.
// Reads data/poets_extended.json for the shipped meters, so the order is:
//   node scripts/build_ganjoor_lines.js && python3 scripts/build_poets.py && npm run build
'use strict';
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const { ctx } = require('./lib_scan').loadEngine();
const { Scan } = require('./lib_fa_scan').loadFaEngine();
const poets = JSON.parse(fs.readFileSync(path.join(root, 'data/poets_extended.json'), 'utf8'));
const gold = new Map(JSON.parse(fs.readFileSync(path.join(root, 'tests/data/persian_gold.json'), 'utf8'))
  .filter(g => g.ganjoor && g.ganjoor.hits >= 3 && g.fa).map(g => [g.url, g]));
const PAIRED = new Map(JSON.parse(fs.readFileSync(path.join(root, 'data/meters.json'), 'utf8')).standard.map(m => [String(m.id), m.paired.map(String)]));
const fold = s => ctx.faScanSpelling(String(s || '')).replace(/[ً-ٕ]/g, '').replace(/ں/g, 'ن').replace(/ۂ/g, 'ہ').replace(/[^ء-ۓ]/g, '');
const out = {};
let missed = 0, kept = 0;
for (const gs of Object.values(poets.ghazals)) for (const g of gs) {
  const G = g.lang === 'fa' && gold.get(g.url);
  if (!G || !(g.meters || []).length) continue;
  const own = [...new Set(g.meters.flatMap(m => [String(m), ...(PAIRED.get(String(m)) || [])]))];
  const xl = new Set(g.xl || []);
  const mz = ctx.faMustazadGhazal(Scan, g.lines.filter((l, i) => !xl.has(i) && l.ur).map(l => ctx.faProsodyText(ctx.rekhtaScanText(l.ur, l.ro || ''))), g.meters.map(String));
  const fits = r => r.fits.some(f => own.includes(String(f.meter.id)) && f.c <= 2);
  g.lines.forEach((l, i) => {
    const alt = G.fa[i];
    if (xl.has(i) || !l.ur || !alt || fold(alt) === fold(l.ur)) return;
    const text = ctx.faProsodyText(ctx.urPluralHa(ctx.rekhtaScanText(l.ur, l.ro || '')));
    const read = o => { try { return ctx.faCorpusScan(Scan, text, l.ro || '', own, () => (mz ? own : null), o); } catch (e) { return null; } };
    const r = read(null);
    if (r && fits(r)) return;
    missed++;
    const r2 = read({ alt });
    if (r2 && r2.gv && fits(r2)) { (out[g.url] = out[g.url] || {})[i] = alt; kept++; }
  });
}
const sorted = {};
Object.keys(out).sort().forEach(k => { sorted[k] = out[k]; });
fs.writeFileSync(path.join(root, 'data/ganjoor_lines.json'), JSON.stringify(sorted, null, 1) + '\n');
console.log(`${missed} lines miss their meter in our text where Ganjoor's differs; ${kept} fit in Ganjoor's (${Object.keys(sorted).length} ghazals) -> data/ganjoor_lines.json`);
