// Builds data/roman_fallback.json: the typed-Roman fallback word list (ROMAN_FALLBACK in the app), VERIFIED.
//
// Pritchett's ASCII writes what Urdu spells but Roman hides: a silent v (خوش = ;xvush), a final h (زندہ = zindah). So a letter map of
// Rekhta's Roman is not enough. For each (Roman word, Urdu word) pair the poets give, this tries a few spellings and keeps the first
// that the app's real pipeline (lineScripts) turns back into that exact Urdu word; a word no spelling rescues is left out.
// Only keys Pritchett's ROMAN_CASUAL_MAP[1] lacks are kept, so it fills gaps and never overrides her. Needs a built index.html.
//
//   node scripts/build_roman_fallback.js [--exclude jaun,faraz,parveen] [--out file]      (default out: data/roman_fallback.json)
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');
const { root, loadEngine } = require('./lib_scan');

const argv = process.argv.slice(2);
const opt = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const exclude = opt('--exclude', '');
const out = opt('--out', path.join(root, 'data/roman_fallback.json'));

const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'roman-pairs-')), 'roman_pairs.json');   // one per run: the benchmarks build theirs side by side
execFileSync('python3', [path.join(root, 'scripts/roman_fallback.py'), '--exclude', exclude, '--out', tmp], { stdio: 'ignore' });
const pairs = JSON.parse(fs.readFileSync(tmp, 'utf8'));

const { ctx } = loadEngine();
ctx.console = { log() {}, warn() {}, error() {} };   // the Pue parser logs every character it cannot read
const run = c => vm.runInContext(c, ctx);
run('Object.keys(ROMAN_FALLBACK).forEach(k => delete ROMAN_FALLBACK[k])');   // verify without any existing fallback
/* and without the hand-written aliases: an alias answers before the fallback, so a spelling checked under it is never really read
   (pade = pa;De, پڈے, was kept because the alias pade = pa;Re gave پڑے), and the scorer reads every fallback spelling for other
   typed words too */
run('Object.keys(CASUAL_ALIAS).forEach(k => delete CASUAL_ALIAS[k])');
/* the scorer's index is built now, from Pritchett's list alone: built at the first check below, it would keep that check's trial
   spelling as a poets' word for the rest of the run */
run('casualIndexReset(); casualIndex();');
const fran1 = run('ROMAN_CASUAL_MAP[1]');
const norm = w => w.normalize('NFC').replace(/[ً-ٰٟـّٔؔ‌‍]/g, '').replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/[ۂۀ]/g, 'ہ').replace(/[^ء-ۿ]/g, '');
const key1 = w => run(`casualKey(${JSON.stringify(w)}, 1)`);

/* spellings to try for a word, base first: a final h (zindah), a silent v before u/o (xvush), both */
function candidates(base) {
    const set = new Set([base]);
    const withH = /a$/.test(base) ? [base + 'h'] : [];
    const withV = [];
    for (let i = 1; i < base.length; i++) {
        if (/[uo]/.test(base[i]) && !/[aeiou;)(.:]/.test(base[i - 1])) withV.push(base.slice(0, i) + 'v' + base.slice(i));
        if (/[uo]/.test(base[i]) && /[uo]/.test(base[i + 1] || '')) break;
    }
    withH.forEach(c => set.add(c)); withV.forEach(c => set.add(c));
    withV.forEach(v => withH.forEach(h => set.add(v + 'h')));
    return [...set];
}

// per loose key: the Urdu word the poets use most for it
const byKey = new Map();
for (const [typed, base, ur, n] of pairs) {
    const k = key1(typed);
    if (fran1[k]) continue;
    const e = byKey.get(k) || { total: 0, words: new Map() };
    e.total += n;
    const w = e.words.get(norm(ur)) || { n: 0, typed, base };
    w.n += n;
    e.words.set(norm(ur), w);
    byKey.set(k, e);
}

/* Platts (1884) scholarly Roman -> the ASCII scheme: the app's own converter (scholarRoToAscii, src/js/05-translit-helpers.js) */
const plattsToAscii = ro => ctx.scholarRoToAscii(ro);

/* Platts' headwords from the dictionary bundle (data/dictionary_bundle.json.gz, the same file the Transcribe drawer reads), in page
   order. A key keeps all its headwords (nila: نيله nīla, indigo juice, and نيلا nīlā, blue): a Rekhta word takes the one spelled
   as it is, a classical addition the first */
const plattsMap = new Map();
const bundleFile = path.join(root, 'data/dictionary_bundle.json.gz');
if (fs.existsSync(bundleFile)) {
    const platts = JSON.parse(require('zlib').gunzipSync(fs.readFileSync(bundleFile))).filter(e => e.dict === 'Platts');
    platts.map((e, i) => [e, i]).sort((a, b) => (a[0].page - b[0].page) || (a[1] - b[1])).forEach(([{ ur, ro, origin }]) => {
        if (!ur || !ro || ur.includes(' ') || ro.includes(' ') || ro.includes('-')) return;
        const k = key1(ro);
        if (!k || k.length < 2) return;
        const asc = plattsToAscii(ro);
        if (!asc) return;
        if (!plattsMap.has(k)) plattsMap.set(k, []);
        if (!plattsMap.get(k).some(x => x.ur === norm(ur))) plattsMap.get(k).push({ ur: norm(ur), asc, origin });
    });
}

const result = {};
let tried = 0, kept = 0, keptPlatts = 0;
for (const [k, e] of byKey) {
    const [ur, w] = [...e.words.entries()].sort((a, b) => b[1].n - a[1].n)[0];
    let matched = false;
    if (e.total >= 2) {
        tried++;
        for (const cand of candidates(w.base)) {
            run(`ROMAN_FALLBACK[${JSON.stringify(k)}] = ${JSON.stringify(cand)}`);
            const got = norm((run(`lineScripts(${JSON.stringify(w.typed)}, { skipKnown: true })`) || {}).ur || '');
            if (got === ur) { result[k] = cand; kept++; matched = true; break; }
        }
    }
    if (!matched) {
        const p = (plattsMap.get(k) || []).find(x => x.ur === ur);
        if (p) {
            run(`ROMAN_FALLBACK[${JSON.stringify(k)}] = ${JSON.stringify(p.asc)}`);
            const got = norm((run(`lineScripts(${JSON.stringify(w.typed)}, { skipKnown: true })`) || {}).ur || '');
            if (got === ur) { result[k] = p.asc; keptPlatts++; matched = true; }
        }
    }
    run(`delete ROMAN_FALLBACK[${JSON.stringify(k)}]`);
}

// Add high-value classical Persian and Arabic words from Platts not already in result (budget-capped)
let keptPlattsClassical = 0;
for (const [k, [p]] of plattsMap) {
    if (Object.keys(result).length >= 3600) break;
    if (fran1[k] || result[k]) continue;
    if (p.origin === 'P' || p.origin === 'A') {
        run(`ROMAN_FALLBACK[${JSON.stringify(k)}] = ${JSON.stringify(p.asc)}`);
        const got = norm((run(`lineScripts(${JSON.stringify(k)}, { skipKnown: true })`) || {}).ur || '');
        if (got === p.ur) {
            result[k] = p.asc;
            keptPlattsClassical++;
        }
    }
    run(`delete ROMAN_FALLBACK[${JSON.stringify(k)}]`);
}

fs.writeFileSync(out, JSON.stringify(result) + '\n');
console.log(`${kept} base verified (${(100 * kept / tried).toFixed(0)}%), ${keptPlatts} rescued by Platts in Rekhta, ${keptPlattsClassical} classical Platts entries added (${Object.keys(result).length} total) -> ${out}`);

