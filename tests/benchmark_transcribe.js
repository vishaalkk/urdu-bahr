// Transcribe's own output (trBuild, with the Platts + Steingass dictionary loaded, as after the drawer has opened once) on
// Rekhta poets the word lists never saw: Jaun, Faraz, Parveen typed without diacritics. typed_roman_heldout.js scores Scan's
// path (lineScripts); this scores what Transcribe adds on top of it (the regular forms of dictionary words, the review).
// The poets' fallback list and the neighbour table are swapped for ones built without the test poets, so nothing is memorised.
//   words / inflected / roman / devanagari   as in typed_roman_heldout.js
//   caught      share of all words that are NOT a silent error (a wrong Urdu word Transcribe does not mark for review)
//   calm        share of all words that are right AND unmarked: a right word should not nag
//   (both over all words, so fixing easy errors does not make the remaining ones look worse)
// --no-forms: without the dictionary's regular forms (DICT_STORE.formsFor), to compare against the earlier behaviour
// Floors: tests/transcribe_baseline.json; a fall fails the run, a rise is recorded with --update (never lowers a floor).
// Run: node tests/benchmark_transcribe.js [--update] [--misses=N [--silent]]
const fs = require('fs'), path = require('path'), os = require('os');
const { execFileSync } = require('child_process');
const { loadPage } = require('./lib_page');
const { typedRoman: typed, urNorm, roFold, hiFold, INFLECTED, checkFloors } = require('./lib_bench');
const root = path.join(__dirname, '..');
const BASE_FILE = path.join(__dirname, 'transcribe_baseline.json');
const POETS = ['jaun', 'faraz', 'parveen'];
const MISSES = +((process.argv.find(a => a.startsWith('--misses=')) || '').split('=')[1] || 0);
const SILENT = process.argv.includes('--silent');   // with --misses: only the wrong words left unmarked
const { run } = loadPage({ withDict: true });
const J = JSON.stringify;
if (process.argv.includes('--no-forms')) run('DICT_STORE.formsFor = function () { return []; };');

const fb = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'tr-bench-')), 'fallback.json');
execFileSync('node', [path.join(root, 'scripts/build_roman_fallback.js'), '--exclude', POETS.join(','), '--out', fb], { stdio: 'ignore' });
run(`Object.keys(ROMAN_FALLBACK).forEach(k => delete ROMAN_FALLBACK[k]); Object.assign(ROMAN_FALLBACK, ${fs.readFileSync(fb, 'utf8')});`);
const colloc = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'collocations_heldout.json'), 'utf8'));
run(`COLLOCATIONS.L1 = ${J(colloc.L1)}; COLLOCATIONS.R1 = ${J(colloc.R1)};`);

const data = JSON.parse(fs.readFileSync(path.join(root, 'data/poets_extended.json'), 'utf8')).ghazals;

let n = 0, ok = 0, inf = 0, infOk = 0, roN = 0, roOk = 0, hiN = 0, hiOk = 0, wrong = 0, wrongFlag = 0, right = 0, rightQuiet = 0;
const miss = [];
const lines = [];
for (const p of POETS) for (const g of data[p]) for (const l of g.lines) if (l.ro) lines.push(l);
const BATCH = 40;   // trBuild takes a whole text; a batch of lines per call
for (let b = 0; b < lines.length; b += BATCH) {
    const batch = lines.slice(b, b + BATCH);
    const res = run(`trBuild(${J(batch.map(l => typed(l.ro)).join('\n'))}).lines.map(L => ({ ur: L.out.ur, ro: L.out.ro, hi: L.out.hi,
        flags: (L.words || []).filter(w => !w.plain).map(w => !!w.needsCheck), src: (L.words || []).filter(w => !w.plain).map(w => w.src) }))`);
    batch.forEach((l, i) => {
        const o = res[i];
        const want = l.ur.split(/\s+/).map(urNorm).filter(Boolean), got = (o.ur || '').split(/\s+/).map(urNorm).filter(Boolean);
        const wr = l.ro.split(/\s+/).map(roFold).filter(Boolean), gr = (o.ro || '').split(/\s+/).map(roFold).filter(Boolean);
        if (wr.length && wr.length === gr.length) wr.forEach((w, k) => { roN++; roOk += gr[k] === w; });
        const wh = (l.hi || '').split(/\s+/).map(hiFold).filter(Boolean), gh = (o.hi || '').split(/\s+/).map(hiFold).filter(Boolean);
        if (wh.length && wh.length === gh.length) wh.forEach((w, k) => { hiN++; hiOk += gh[k] === w; });
        if (!want.length || want.length !== got.length) return;
        const aligned = o.flags.length === want.length;
        want.forEach((w, k) => {
            const good = got[k] === w;
            n++; ok += good;
            if (INFLECTED.test(w)) { inf++; infOk += good; }
            if (aligned) {
                if (good) { right++; rightQuiet += !o.flags[k]; } else { wrong++; wrongFlag += o.flags[k]; }
            }
            if (!good && miss.length < MISSES && (!SILENT || (aligned && !o.flags[k]))) miss.push(`${o.src[k] || '?'}: ${got[k]} ≠ ${w}`);
        });
    });
}
const pct = (a, d) => Math.round(10000 * a / d) / 100;
const now = { words: pct(ok, n), inflected: pct(infOk, inf), roman: pct(roOk, roN), devanagari: pct(hiOk, hiN),
    caught: pct((right + wrong) - (wrong - wrongFlag), right + wrong), calm: pct(rightQuiet, right + wrong), n };
const KEYS = ['words', 'inflected', 'roman', 'devanagari', 'caught', 'calm'];
console.log(`Transcribe, held-out poets (${n} words): right Urdu word ${now.words}%, inflected ${now.inflected}%, Roman ${now.roman}%, ` +
    `Devanagari ${now.devanagari}%; not a silent error ${now.caught}%, right and unmarked ${now.calm}%`);
if (miss.length) console.log('  ' + miss.join(' · '));
process.exit(checkFloors(BASE_FILE, now, KEYS, { readOnly: process.argv.includes('--no-forms') }));
