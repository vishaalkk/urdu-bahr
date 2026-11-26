// One-off repair (2026-11-26) of the Devanagari stored in the shipped corpora, after the ʿain patch to the Devanagari parser
// (pritchett_scripts/ghalib.js): a word that opens with ʿain and a vowel was stored as a bare vowel sign or without its vowel
// (((ishq िश्क़, ((ajab जब). Each such word's Devanagari is parsed again from its ASCII; nothing else in a line changes, and the
// files are edited as text so their layout is kept. Rerunning it changes nothing. Run after `npm run build`:
//   node scripts/fix_hi_ain.js [--dry]
const fs = require('fs'), path = require('path');
const { loadPage } = require('../tests/lib_page');
const root = path.join(__dirname, '..');
const FILES = ['ghalib_extended', 'mir_extended', 'exercises_verified', 'iqbal_corpus', 'others_extended'];
const AIN = /(^|-)\(\([aeiou]/;
const { run } = loadPage();
const parse = a => run(`window.p_hi.parse(${JSON.stringify(a)})`);

for (const name of FILES) {
    const file = path.join(root, 'data', name + '.json');
    let text = fs.readFileSync(file, 'utf8');
    const swaps = new Map();
    for (const g of JSON.parse(text)) for (const l of (g.lines || [])) {
        if (!l || typeof l !== 'object' || typeof l.ascii !== 'string' || typeof l.hi !== 'string') continue;
        const aw = l.ascii.split(' '), hw = l.hi.split(' ');
        if (aw.length !== hw.length || !aw.some(w => AIN.test(w))) continue;
        const next = hw.map((h, k) => AIN.test(aw[k]) ? parse(aw[k]) : h).join(' ');
        if (next !== l.hi) swaps.set(l.hi, next);
    }
    let n = 0;
    swaps.forEach((to, from) => {
        const a = '"hi": ' + JSON.stringify(from), b = '"hi": ' + JSON.stringify(to);
        const parts = text.split(a); n += parts.length - 1; text = parts.join(b);
    });
    console.log(`${name}: ${swaps.size} lines, ${n} fields`);
    if (!process.argv.includes('--dry')) fs.writeFileSync(file, text);
}
