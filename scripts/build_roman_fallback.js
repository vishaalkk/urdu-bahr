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

const tmp = path.join(os.tmpdir(), 'roman_pairs.json');
execFileSync('python3', [path.join(root, 'scripts/roman_fallback.py'), '--exclude', exclude, '--out', tmp], { stdio: 'ignore' });
const pairs = JSON.parse(fs.readFileSync(tmp, 'utf8'));

const { ctx } = loadEngine();
ctx.console = { log() {}, warn() {}, error() {} };   // the Pue parser logs every character it cannot read
const run = c => vm.runInContext(c, ctx);
run('Object.keys(ROMAN_FALLBACK).forEach(k => delete ROMAN_FALLBACK[k])');   // verify without any existing fallback
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
const result = {};
let tried = 0, kept = 0;
for (const [k, e] of byKey) {
    if (e.total < 2) continue;
    const [ur, w] = [...e.words.entries()].sort((a, b) => b[1].n - a[1].n)[0];
    tried++;
    for (const cand of candidates(w.base)) {
        run(`ROMAN_FALLBACK[${JSON.stringify(k)}] = ${JSON.stringify(cand)}`);
        const got = norm((run(`lineScripts(${JSON.stringify(w.typed)}, { skipKnown: true })`) || {}).ur || '');
        if (got === ur) { result[k] = cand; kept++; break; }
    }
    run(`delete ROMAN_FALLBACK[${JSON.stringify(k)}]`);
}
fs.writeFileSync(out, JSON.stringify(result) + '\n');
console.log(`${kept} verified of ${tried} gap words tried (${(100 * kept / tried).toFixed(0)}%) -> ${out}`);
