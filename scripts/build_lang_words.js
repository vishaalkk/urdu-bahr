// Mines data/lang_words.json: how much one word says a line is Persian rather than Urdu, from the line languages
// data/poets_extended.json carries (a line's or its ghazal's lang 'fa'; else Urdu), on the EVEN ghazals of each collection only
// (tests/benchmark_lang.js scores the odd ones). Two tables, for typed Roman (no diacritics) and for Urdu script:
//   word → its log-odds of Persian over Urdu (natural log, one decimal), kept when seen often enough and telling enough.
// detectScanLang (src/js/05-translit-helpers.js) sums a line's weights.   Run: node scripts/build_lang_words.js [--out file]
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data/poets_extended.json'), 'utf8')).ghazals;
const MIN_COUNT = 6, MIN_WEIGHT = 1.2, MAX_WORDS = 150;   // per script and side

/* the same folds detectScanLang applies to a line before it looks words up */
const roTokens = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[ʿʾ’'‘.]/g, '').split(/[^a-z]+/).filter(w => w.length > 1);
const urTokens = s => s.normalize('NFC').replace(/[ً-ٰٟـ]/g, '').split(/[\s،۔؟!‌]+/).filter(Boolean);

const count = { ro: [new Map(), new Map()], ur: [new Map(), new Map()] }, lines = [0, 0];
Object.values(data).forEach(col => col.forEach((g, gi) => {
    if (gi % 2 === 1) return;
    g.lines.forEach(l => {
        if (!l.ro || !l.ur) return;
        const fa = (l.lang || g.lang) === 'fa' ? 1 : 0;
        lines[fa]++;
        [['ro', roTokens(l.ro)], ['ur', urTokens(l.ur)]].forEach(([k, toks]) =>
            new Set(toks).forEach(w => count[k][fa].set(w, (count[k][fa].get(w) || 0) + 1)));
    });
}));
const out = {};
for (const k of ['ro', 'ur']) {
    const [ur, fa] = count[k], words = new Set([...ur.keys(), ...fa.keys()]), scored = [];
    words.forEach(w => {
        const nf = fa.get(w) || 0, nu = ur.get(w) || 0;
        if (nf + nu < MIN_COUNT) return;
        const weight = Math.log(((nf + 0.5) / lines[1]) / ((nu + 0.5) / lines[0]));   // per-line rates, so the corpus sizes cancel
        if (Math.abs(weight) >= MIN_WEIGHT) scored.push([w, Math.round(weight * 10) / 10, nf + nu]);
    });
    const side = s => scored.filter(x => Math.sign(x[1]) === s).sort((a, b) => b[2] * Math.abs(b[1]) - a[2] * Math.abs(a[1])).slice(0, MAX_WORDS);
    out[k] = Object.fromEntries([...side(1), ...side(-1)].map(([w, wt]) => [w, wt]));
}
out.prior = Math.round(10 * Math.log(lines[1] / lines[0])) / 10;
const outArg = process.argv.indexOf('--out'), file = outArg > 0 ? process.argv[outArg + 1] : path.join(root, 'data/lang_words.json');   // --out: elsewhere (tests/derived_data.js)
fs.writeFileSync(file, JSON.stringify(out) + '\n');
console.log(`${lines[1]} Persian / ${lines[0]} Urdu lines mined: ${Object.keys(out.ro).length} Roman words, ${Object.keys(out.ur).length} Urdu-script words -> ${path.relative(root, file)}`);
