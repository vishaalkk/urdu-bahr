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

/* Platts (1884) scholarly Roman -> Pritchett ASCII conversion */
function plattsToAscii(ro) {
    if (!ro) return '';
    let s = ro.trim().toLowerCase();
    s = s.replace(/k[̱_]h[̱_]|ḵẖ|k͟h/g, ';x').replace(/g[̱_]h[̱_]|g̱ẖ|g͟h/g, ';g');
    s = s.replace(/ḵ/g, ';x').replace(/ġ/g, ';g');
    s = s.replace(/ćh/g, 'chh').replace(/ć/g, 'ch');
    s = s.replace(/ś|ṣh/g, 'sh').replace(/ṣ/g, '.s');
    s = s.replace(/ż|ẕ/g, ';z').replace(/ẓ/g, '.z');
    s = s.replace(/z̤/g, ':z').replace(/t̤/g, ':t').replace(/ṭ/g, ';t').replace(/ḍ/g, ';d').replace(/ṛ/g, ';r');
    s = s.replace(/ḥ/g, ';h').replace(/s̱|ṡ/g, ';s');
    s = s.replace(/ā/g, 'aa').replace(/ī/g, 'ii').replace(/ū/g, 'uu');
    s = s.replace(/[ñn̐ṅṉ]/g, ';n');
    s = s.replace(/[ʻ‘ʿ]/g, '((').replace(/[ʼ’ʾ]/g, '))');
    s = s.replace(/w/g, 'v');
    return s;
}

const plattsFile = path.join(root, 'data/ur_platts.tsv');
const plattsMap = new Map();
if (fs.existsSync(plattsFile)) {
    const lines = fs.readFileSync(plattsFile, 'utf8').split('\n').slice(1);
    for (const l of lines) {
        const parts = l.split('\t');
        if (parts.length < 5) continue;
        const [ur, hi, ro, origin] = parts;
        if (!ur || !ro || ur.includes(' ') || ro.includes(' ') || ro.includes('-')) continue;
        const k = key1(ro);
        if (!k || k.length < 2) continue;
        const asc = plattsToAscii(ro);
        if (!asc) continue;
        if (!plattsMap.has(k)) plattsMap.set(k, { ur: norm(ur), asc, origin });
    }
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
        const p = plattsMap.get(k);
        if (p && p.ur === ur) {
            run(`ROMAN_FALLBACK[${JSON.stringify(k)}] = ${JSON.stringify(p.asc)}`);
            const got = norm((run(`lineScripts(${JSON.stringify(w.typed)}, { skipKnown: true })`) || {}).ur || '');
            if (got === ur) { result[k] = p.asc; keptPlatts++; matched = true; }
        }
    }
    run(`delete ROMAN_FALLBACK[${JSON.stringify(k)}]`);
}

// Add high-value classical Persian and Arabic words from Platts not already in result (budget-capped)
let keptPlattsClassical = 0;
for (const [k, p] of plattsMap) {
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

