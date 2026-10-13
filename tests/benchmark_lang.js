// Which language a line is (detectScanLang: Persian lines scan on ScanFa, are written in Fārsī orthography, read the Persian word
// list). Gold: the line language data/poets_extended.json carries (a line's or its ghazal's lang 'fa'; else Urdu), on the odd
// ghazals of each collection (the even ones are left for mining word lists, scripts/build_lang_words.js, so nothing is memorised).
//   roman.fa / roman.ur   Persian / Urdu lines typed in Roman without diacritics, recognised as such
//   urdu.fa / urdu.ur     the same lines in Urdu script
// Floors: tests/lang_baseline.json; a fall fails the run, a rise is recorded with --update (never lowers a floor).
// Run: node tests/benchmark_lang.js [--update] [--misses=N]
const fs = require('fs'), path = require('path');
const { loadPage } = require('./lib_page');
const { checkFloors } = require('./lib_bench');
const BASE_FILE = path.join(__dirname, 'lang_baseline.json');
const MISSES = +((process.argv.find(a => a.startsWith('--misses=')) || '').split('=')[1] || 0);
const { run } = loadPage();
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'poets_extended.json'), 'utf8')).ghazals;
/* (not lib_bench's typedRoman: the line keeps its letters' shapes for detectScanLang, only marks and ʿ ʾ go) */
const typed = ro => ro.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[ʿʾ’']/g, '');

const lines = [];
Object.values(data).forEach(col => col.forEach((g, gi) => {
    if (gi % 2 === 0) return;   // even ghazals: for mining
    g.lines.forEach(l => { if (l.ro && l.ur) lines.push({ fa: (l.lang || g.lang) === 'fa', ro: typed(l.ro), ur: l.ur }); });
}));
const res = run(`(${JSON.stringify(lines.map(l => [l.ro, l.ur]))}).map(function (p) { return [detectScanLang(p[0]), detectScanLang(p[1])]; })`);
const c = { 'roman.fa': [0, 0], 'roman.ur': [0, 0], 'urdu.fa': [0, 0], 'urdu.ur': [0, 0] };
const miss = [];
lines.forEach((l, i) => {
    const want = l.fa ? 'fa' : 'ur';
    [['roman', res[i][0], l.ro], ['urdu', res[i][1], l.ur]].forEach(([k, got, text]) => {
        const cell = c[k + '.' + want];
        cell[1]++; cell[0] += got === want;
        if (got !== want && miss.length < MISSES) miss.push(`${k} ${want}→${got}: ${text}`);
    });
});
const now = { n: lines.length };
Object.entries(c).forEach(([k, [ok, n]]) => { now[k] = Math.round(10000 * ok / n) / 100; });
const KEYS = Object.keys(c);
console.log(`line language, ${lines.length} held-out lines: ` + KEYS.map(k => `${k} ${now[k]}% (${c[k][1]})`).join(', '));
miss.forEach(m => console.log('  ' + m));
process.exit(checkFloors(BASE_FILE, now, KEYS));
