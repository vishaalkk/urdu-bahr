// Offline scansion of every Rekhta poet in data/poets/*.json -> data/poets_scanned/<slug>_scanned.json,
// plus data/faiz_verses.json -> data/faiz_scanned.json.
// Needs a built index.html (the engine is read from it, never edited). Usage: node scripts/scan_poets.js
const fs = require('fs');
const path = require('path');
const { root, loadEngine, scanGhazal } = require('./lib_scan');

const poetsDir = path.join(root, 'data/poets');
const outDir = path.join(root, 'data/poets_scanned');
fs.mkdirSync(outDir, { recursive: true });

const engine = loadEngine();
const jobs = fs.readdirSync(poetsDir).filter(f => f.endsWith('.json')).sort().map(f => ({
    slug: f.replace('.json', ''), src: path.join(poetsDir, f), dest: path.join(outDir, f.replace('.json', '_scanned.json')) }));
jobs.push({ slug: 'faiz', src: path.join(root, 'data/faiz_verses.json'), dest: path.join(root, 'data/faiz_scanned.json'), poet: 'Faiz Ahmed Faiz' });
let total = 0, scanned = 0, confident = 0, ghazals = 0;

jobs.forEach(({ slug, src: srcPath, dest, poet }) => {
    const src = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
    const out = src.map((g, i) => scanGhazal(poet ? { ...g, poet } : g, i, engine));
    fs.writeFileSync(dest, JSON.stringify(out, null, 2) + '\n', 'utf8');
    const lines = out.flatMap(g => g.lines);
    const ok = lines.filter(l => l.scanned).length;
    const conf = out.filter(g => g.meters.length).length;
    console.log(`${slug.padEnd(14)} ${String(out.length).padStart(4)} ghazals  ${String(lines.length).padStart(5)} lines  ${(100 * ok / lines.length).toFixed(1)}% scanned  ${conf} with a confident meter`);
    total += lines.length; scanned += ok; confident += conf; ghazals += out.length;
});
console.log(`TOTAL ${ghazals} ghazals, ${total} lines, ${(100 * scanned / total).toFixed(1)}% scanned, ${confident} ghazals with a confident meter`);
