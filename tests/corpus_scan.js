// Corpus regression: scans all 226 exercise lines with the engine embedded in index.html.
// Run: node tests/corpus_scan.js   (exits 1 if top-1 accuracy < 93%)
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const a = html.indexOf("(function(root){\n'use strict';\n\n/* ---------- meters");
const e = html.indexOf('})(this);', a) + '})(this);'.length;
const mod = { exports: {} };
vm.runInNewContext(html.slice(a, e), { module: mod, console });
const Scan = mod.exports;
const ex = require(path.join(root, 'data/exercises_verified.json'));

let total = 0, top1 = 0, top3 = 0, hindiTotal=0, hindiOk=0;
const fails = [];

for (const g of ex) {
  const expected = new Set(g.meters.map(String)); // could be [26], [14,15] paired, ["H"]
  for (const line of g.lines) {
    total++;
    const res = Scan.scanLine(line.ur);
    const fits = res.fits || [];
    const detectedTop1 = fits[0] ? String(fits[0].meter.id) : null;
    const top3ids = fits.slice(0,3).map(f=>String(f.meter.id));

    const isHindi = expected.has('H');
    if (isHindi) hindiTotal++;

    let match1 = detectedTop1 && expected.has(detectedTop1);
    let match3 = top3ids.some(id=>expected.has(id));
    if (match1) top1++;
    if (match3) top3++;
    if (isHindi && detectedTop1==='H') hindiOk++;

    if (!match3) {
      fails.push({
        ghazal: g.id, poet: g.poet, expected: [...expected],
        line: line.ur, ascii: line.ascii,
        top3: fits.slice(0,3).map(f=>({id:f.meter.id, c:+f.c.toFixed(2)})),
        nFits: fits.length
      });
    }
  }
}

console.log('=== SCANSION ACCURACY ===');
console.log('total lines:', total);
console.log('top1 exact meter id match:', top1, (100*top1/total).toFixed(1)+'%');
console.log('top3 meter id match:', top3, (100*top3/total).toFixed(1)+'%');
console.log('Hindi-meter lines:', hindiTotal, 'correctly flagged as H (top1):', hindiOk);
console.log('failures (not in top3):', fails.length);
console.log();
console.log('=== FAILURE DETAIL (first 40) ===');
fails.slice(0,40).forEach(f=>{
  console.log(`Ghazal ${f.ghazal} (${f.poet}) expected=${JSON.stringify(f.expected)} nFits=${f.nFits}`);
  console.log('  line:', f.ascii);
  console.log('  top3:', JSON.stringify(f.top3));
});

// per-ghazal breakdown
console.log();
console.log('=== PER-GHAZAL TOP1 ACCURACY ===');
for (const g of ex) {
  const expected = new Set(g.meters.map(String));
  let ok=0;
  for (const line of g.lines) {
    const res = Scan.scanLine(line.ur);
    const top1 = res.fits[0] ? String(res.fits[0].meter.id) : null;
    if (top1 && expected.has(top1)) ok++;
  }
  console.log(`Ghazal ${g.id} (${g.poet}, expects ${JSON.stringify(g.meters)}): ${ok}/${g.lines.length} top1 correct`);
}
if (top1 / total < 0.93) { console.error('FAIL: top-1 accuracy below 93%'); process.exit(1); }
