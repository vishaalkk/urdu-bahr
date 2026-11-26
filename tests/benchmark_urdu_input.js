// Urdu script in → Roman and Devanagari out, on Rekhta poets the word lists never saw (Jaun, Faraz, Parveen), as pasted from
// Rekhta. The other held-out benchmarks go the other way (typed Roman → Urdu); benchmark.js typed.* reads Urdu → Roman but on
// Ghalib and Mir, whose words the word map was built from. The poets' fallback list is swapped for one built without the test
// poets, so nothing is memorised. Two paths:
//   scan.*        Scan's reading of a pasted line (lineScripts; Scan never loads the dictionary)
//   tr.*          Transcribe's (trBuild, with the Platts + Steingass dictionary loaded, as after the drawer has opened once)
//   roman / devanagari   words whose Roman (roFold) / Devanagari (hiFold) is Rekhta's, on lines with as many words as Rekhta's
//   unlisted      the Roman of the words Pritchett's word map does not know (what the fallbacks read)
//   caught        (tr) share of words that are NOT a silent error (a wrong Roman Transcribe does not underline)
// Floors: tests/urdu_input_baseline.json; a fall fails the run, a rise is recorded with --update (never lowers a floor).
// Run: node tests/benchmark_urdu_input.js [--update] [--misses=N]
const fs = require('fs'), path = require('path'), os = require('os');
const { execFileSync } = require('child_process');
const { loadPage } = require('./lib_page');
const { roFold, hiFold, checkFloors } = require('./lib_bench');
const root = path.join(__dirname, '..');
const BASE_FILE = path.join(__dirname, 'urdu_input_baseline.json');
const POETS = ['jaun', 'faraz', 'parveen'];
const MISSES = +((process.argv.find(a => a.startsWith('--misses=')) || '').split('=')[1] || 0);
const J = JSON.stringify;

const fb = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'ur-bench-')), 'fallback.json');
execFileSync('node', [path.join(root, 'scripts/build_roman_fallback.js'), '--exclude', POETS.join(','), '--out', fb], { stdio: 'ignore' });
const FB = fs.readFileSync(fb, 'utf8');
const swapFallback = run => run(`Object.keys(ROMAN_FALLBACK).forEach(k => delete ROMAN_FALLBACK[k]); Object.assign(ROMAN_FALLBACK, ${FB});
    _poetsByUr = null;`);   // the poets' list read backwards (poetsUrduIndex) is rebuilt from the held-out list

const data = JSON.parse(fs.readFileSync(path.join(root, 'data/poets_extended.json'), 'utf8')).ghazals;
const lines = [];
for (const p of POETS) for (const g of data[p]) for (const l of g.lines) if (l.ur && l.ro) lines.push(l);

function score(name, outs, listed, flags) {
    let n = 0, ok = 0, un = 0, unOk = 0, hiN = 0, hiOk = 0, right = 0, wrong = 0, silent = 0;
    const miss = [];
    lines.forEach((l, i) => {
        const o = outs[i] || {};
        const wr = l.ro.split(/\s+/).map(roFold).filter(Boolean), gr = String(o.ro || '').split(/\s+/).map(roFold).filter(Boolean);
        const ws = l.ur.split(/\s+/).filter(Boolean);
        if (wr.length && wr.length === gr.length) wr.forEach((w, k) => {
            const good = gr[k] === w;
            n++; ok += good;
            const unlisted = ws.length === wr.length && !listed[i][k];
            if (unlisted) { un++; unOk += good; }
            if (flags && flags[i] && flags[i].length === wr.length) { if (good) right++; else { wrong++; silent += !flags[i][k]; } }
            if (!good && unlisted && miss.length < MISSES) miss.push(`${ws[k]}: ${String(o.ro).split(/\s+/)[k]} ≠ ${l.ro.split(/\s+/)[k]}`);
        });
        const wh = (l.hi || '').split(/\s+/).map(hiFold).filter(Boolean), gh = String(o.hi || '').split(/\s+/).map(hiFold).filter(Boolean);
        if (wh.length && wh.length === gh.length) wh.forEach((w, k) => { hiN++; hiOk += gh[k] === w; });
    });
    const pct = (a, d) => Math.round(10000 * a / d) / 100;
    const r = { [name + '.roman']: pct(ok, n), [name + '.unlisted']: pct(unOk, un), [name + '.devanagari']: pct(hiOk, hiN) };
    if (flags) r[name + '.caught'] = pct(right + wrong - silent, right + wrong);
    console.log(`  ${name}: ${n} words, Roman ${r[name + '.roman']}%, words the word map lacks (${un}) ${r[name + '.unlisted']}%, ` +
        `Devanagari ${r[name + '.devanagari']}%` + (flags ? `, not a silent error ${r[name + '.caught']}%` : ''));
    if (miss.length) console.log('    ' + miss.join(' · '));
    return r;
}

/* Scan: the page without the dictionary */
const scanPage = loadPage();
swapFallback(scanPage.run);
const listedOf = run => run(`${J(lines.map(l => l.ur))}.map(u => u.split(/\\s+/).filter(Boolean).map(w => !!wordAscii(w, /[\\u064B-\\u065F\\u0670]/.test(w))))`);
const listed = listedOf(scanPage.run);
const scanOuts = scanPage.run(`${J(lines.map(l => l.ur))}.map(u => { const o = lineScripts(u, { skipKnown: true }) || {}; return { ro: o.ro, hi: o.hi }; })`);

/* Transcribe: with the dictionary */
const trPage = loadPage({ withDict: true });
swapFallback(trPage.run);
const trOuts = [], trFlags = [];
const BATCH = 40;
for (let b = 0; b < lines.length; b += BATCH) {
    const res = trPage.run(`trBuild(${J(lines.slice(b, b + BATCH).map(l => l.ur).join('\n'))}).lines.map(L => ({ ro: L.out.ro, hi: L.out.hi,
        flags: (L.words || []).filter(w => !w.plain).map(w => !!w.needsCheck) }))`);
    res.forEach(o => { trOuts.push(o); trFlags.push(o.flags); });
}

console.log(`Urdu script in, held-out poets (${lines.length} lines)`);
const now = Object.assign({ n: lines.length }, score('scan', scanOuts, listed), score('tr', trOuts, listed, trFlags));
const KEYS = Object.keys(now).filter(k => k !== 'n');
process.exit(checkFloors(BASE_FILE, now, KEYS));
