// Does the neighbour table help typed Roman? Typing the Roman of held-out Rekhta poets WITHOUT diacritics, run each line through the
// app (lineScripts) and score every word by whether it comes out as the right URDU word: what a user sees. Comparing spellings
// would count bhi/bhī as a miss although both are بھی.
//
//   uv run python scripts/build_collocations.py --exclude jaun,faraz,parveen --out /tmp/heldout.json
//   node scripts/casual_roman_eval.js /tmp/heldout.json jaun,faraz,parveen
//
// The table must be mined WITHOUT the test poets, or the score only measures memory. ROMAN_CASUAL_MAP (the app's own word map) is
// built from Pritchett's corpora only, so the Rekhta poets are unseen by it too. `typed.*` in tests/benchmark.js cannot judge this:
// it types Urdu and reads Roman, the other direction.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { root, loadEngine } = require('./lib_scan');

const tablePath = process.argv[2];
const poets = (process.argv[3] || 'jaun,faraz,parveen').split(',');
const { ctx } = loadEngine();
ctx.console = { log() {}, warn() {}, error() {} };   // the Pue parser logs every character it cannot read
const run = code => vm.runInContext(code, ctx);

const data = JSON.parse(fs.readFileSync(root + '/data/poets_extended.json', 'utf8')).ghazals;
const typed = ro => ro.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ñ/g, 'n').replace(/[ḍṭṛḳġṣẓżḥ]/gi, c => c.normalize('NFD')[0]);
const urNorm = w => w.normalize('NFC').replace(/[\u064B-\u065F\u0670\u0640\u0651\u0654\u0614\u200C\u200D]/g, '').replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/[ۂۀ]/g, 'ہ').replace(/[^\u0621-\u06FF]/g, '');
const urWords = s => s.split(/\s+/).map(urNorm).filter(Boolean);

function score(label) {
    let n = 0, ok = 0, amb = 0, ambOk = 0, lines = 0, skipped = 0;
    for (const p of poets) for (const g of data[p]) for (const l of g.lines) {
        if (!l.ro) continue;
        const want = urWords(l.ur);
        const got = urWords((run(`lineScripts(${JSON.stringify(typed(l.ro))}, { skipKnown: true })`) || {}).ur || '');
        if (!want.length || want.length !== got.length) { skipped++; continue; }
        lines++;
        const rw = l.ro.split(/\s+/);
        want.forEach((w, i) => {
            const good = got[i] === w;
            n++; ok += good;
            const k1 = rw.length === want.length ? run(`casualKey(${JSON.stringify(rw[i].split('-')[0])}, 1)`) : null;
            if (k1 && SPLIT.has(k1)) { amb++; ambOk += good; }
        });
    }
    console.log(`${label.padEnd(24)} words ${n}  right Urdu word ${(100 * ok / n).toFixed(2)}%   on words with several spellings (${amb}): ${(100 * ambOk / amb).toFixed(2)}%   (${lines} lines, ${skipped} unaligned/skipped)`);
    return { ok, ambOk, n, amb };
}

// the keys that have more than one strict spelling in Pritchett's corpora: where a neighbour could matter
const SPLIT = new Set();
{
    const map1 = run('ROMAN_CASUAL_MAP')[1], map0 = run('ROMAN_CASUAL_MAP')[0];
    const byLoose = {};
    Object.keys(map0).forEach(k0 => { const k1 = run(`casualKey(${JSON.stringify(k0)}, 1)`); (byLoose[k1] = byLoose[k1] || new Set()).add(k0); });
    Object.entries(byLoose).forEach(([k1, s]) => { if (s.size > 1) SPLIT.add(k1); });
}

// hold the test poets out of the typed-Roman fallback word list too: rebuild (and re-verify) it without them and swap it in
{
    const { execFileSync } = require('child_process'), os = require('os');
    const out = path.join(os.tmpdir(), 'fallback_heldout.json');
    execFileSync('node', [path.join(root, 'scripts/build_roman_fallback.js'), '--exclude', poets.join(','), '--out', out], { stdio: 'ignore' });
    run(`Object.keys(ROMAN_FALLBACK).forEach(k => delete ROMAN_FALLBACK[k]); Object.assign(ROMAN_FALLBACK, ${fs.readFileSync(out, 'utf8')});`);
}
run(`COLLOCATIONS.L1 = {}; COLLOCATIONS.R1 = {};`);
const a = score('no neighbour table');
const table = JSON.parse(fs.readFileSync(tablePath, 'utf8'));
run(`Object.assign(COLLOCATIONS.L1, ${JSON.stringify(table.L1)}); Object.assign(COLLOCATIONS.R1, ${JSON.stringify(table.R1)});`);
const b = score('with neighbour table');
console.log(`net words: ${b.ok - a.ok >= 0 ? '+' : ''}${b.ok - a.ok} overall, ${b.ambOk - a.ambOk >= 0 ? '+' : ''}${b.ambOk - a.ambOk} on multi-spelling words`);
