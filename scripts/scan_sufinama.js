// Scans data/sufinama_ghazals.json (scripts/import_sufinama.py) through the real engine -> data/sufinama_scanned.json,
// which build_poets.py ships. Both files are local (gitignored), like the Rekhta scrape and scan folders.
//   node scripts/scan_sufinama.js            # Persian-aware (see lib_scan.js scanGhazal: lang)
//   node scripts/scan_sufinama.js --legacy   # the pre-Persian scan, for comparison
const fs = require('fs');
const path = require('path');
const { root, loadEngine, scanGhazal } = require('./lib_scan');

const SRC = path.join(root, 'data/sufinama_ghazals.json');
const OUT = path.join(root, 'data/sufinama_scanned.json');
const legacy = process.argv.includes('--legacy');
const out = process.argv.find(a => a.startsWith('--out='));

const PERSIAN = c => ['jami', 'bu_ali', 'khusrau_persian'].includes(c) || /^fa_/.test(c);   // as import_sufinama.py
// Arabic presentation forms (one Sufinama page uses them) are not the engine's letters: fold them as build_poets.py does
const fold = s => (s || '').replace(/[\ufb50-\ufdff\ufe70-\ufeff]/g, c => c.normalize('NFKC'));
const L = require('./lib_fa_lexicon');
const ghazals = JSON.parse(fs.readFileSync(SRC, 'utf8')).map(g => Object.assign({}, g, {
    lang: g.lang || (PERSIAN(g.category) ? 'fa' : 'ur'),
    lines: g.lines.map(l => Object.assign({}, l, { ur: fold(l.ur) }))
}));
const eng = loadEngine();

/* Roman repair (Persian kalaam only): Sufinama's Roman is fixed where its own Urdu and Devanagari agree against it, a dropped
   particle (āmada qatl → āmada ba-qatl) or a word the Devanagari and the Persian word list (built from the OTHER ghazals) both
   spell differently. A repair is kept only if the line scans at least as well in the ghazal's meter. Report:
   data/sufinama_repairs.json; repaired lines are listed per ghazal as `rf`. */
const repairs = [];
if (!legacy) {
    const persian = ghazals.filter(L.PERSIAN);
    const all = L.mine(persian);
    const { PAIRED } = require('./lib_scan');
    persian.forEach((g, gi) => {
        /* the word list without this ghazal's own words */
        const own = L.mine([g]), others = {};
        Object.keys(own).forEach(k => {
            const e = all[k], o = own[k], ro = {};
            Object.entries(e.ro).forEach(([r, n]) => { const m = n - (o.ro[r] || 0); if (m > 0) ro[r] = m; });
            if (Object.keys(ro).length) others[k] = { ro, hi: e.hi, by: {} };
        });
        const lexOthers = L.finalizeWithShare(others);
        const first = scanGhazal(g, gi, eng, { assignAlways: true, lang: true });
        const fam = new Set(first.meters.map(String).flatMap(m => [m, ...(PAIRED.get(m) || [])]));
        const ownCost = (ur, ro) => {
            try { const f = (eng.Scan.scanLine(eng.ctx.rekhtaScanText(ur, ro)).fits || []).filter(x => fam.has(String(x.meter.id))); return f.length ? Math.min(...f.map(x => x.c)) : Infinity; }
            catch (e) { return Infinity; }
        };
        g.lines.forEach((l, li) => {
            if (L.PERSIAN(g) && l.ro && require('./lib_scan').lineLang(l.ro, 'fa') !== 'fa') return;
            const fix = L.repairLine(l, lexOthers);
            if (!fix || fix.ro === l.ro) return;
            const before = ownCost(l.ur, l.ro), after = ownCost(l.ur, fix.ro);
            if (after > before) return;
            repairs.push({ url: g.url, line: li, from: l.ro, to: fix.ro, why: fix.why, cost: [before, after] });
            l.ro = fix.ro;
            (g.rf = g.rf || []).push(li);
        });
    });
    fs.writeFileSync(path.join(root, 'data/sufinama_repairs.json'), JSON.stringify(repairs, null, 1));
}

const scanned = ghazals.map((g, i) => {
    const s = scanGhazal(g, i, eng, legacy ? { assignAlways: true } : { assignAlways: true, lang: true });
    return legacy ? Object.assign(s, { category: g.category }) : Object.assign({ category: g.category, lang: g.lang }, g.rf ? { rf: g.rf } : {}, s);
});
fs.writeFileSync(out ? out.slice(6) : OUT, JSON.stringify(scanned, null, 2));
const n = scanned.reduce((t, g) => t + g.lines.length, 0);
console.log(`${scanned.length} ghazals, ${n} lines -> ${out ? out.slice(6) : OUT}${legacy ? '' : `; ${repairs.length} Roman repairs (data/sufinama_repairs.json)`}`);
