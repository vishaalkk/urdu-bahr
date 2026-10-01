// Finds Urdu words whose tashdid is written in the Roman (jannat) but not in the Urdu (جنت), across the Rekhta
// corpora, and prints the lex(...) lines that give the engine their doubled reading. Review the output, then
// paste it into the unwritten-tashdid block of src/js/01-engine.js.
//   node scripts/find_tashdid_words.js [--min 3] [--out file.js]
// A word qualifies when the Roman doubles a consonant in >=80% of its aligned occurrences and a clean
// letter-for-letter site is found. Words already in the lexicon, word-final geminates (ḥaqq, rabb: the engine
// notes say an extra overlong reading made scans worse) and words whose Urdu already writes both letters are skipped.
const fs = require('fs');
const path = require('path');
const { root, loadEngine, addTashdid } = require('./lib_scan');

const argv = process.argv.slice(2);
const opt = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const MIN = Number(opt('--min', 3));
const NON_LATIN = /[؀-ۿऀ-ॿ]/;
const MARKS = /[ً-ٰٟـ‌‍ّؔ]/g;

const engineSrc = fs.readFileSync(path.join(root, 'src/js/01-engine.js'), 'utf8');
const inLexicon = new Set([...engineSrc.matchAll(/lex\('([^']+)'/g)].flatMap(m => m[1].split(' ')));

const files = fs.readdirSync(path.join(root, 'data/poets')).filter(f => f.endsWith('.json')).map(f => path.join(root, 'data/poets', f))
    .concat(path.join(root, 'data/faiz_verses.json'));
const seen = new Map();   // plain Urdu word -> { n, dbl, forms: Map(doubledForm -> count), roman: Map }
for (const f of files) for (const g of JSON.parse(fs.readFileSync(f, 'utf8'))) for (const l of g.lines) {
    if (!l.ro || NON_LATIN.test(l.ro)) continue;
    const uw = l.ur.replace(/ؔ/g, '').split(/\s+/).filter(Boolean);
    const parts = [];
    l.ro.replace(/\s+e(?=\s|$)/g, '-e').split(/\s+/).filter(Boolean).forEach(tok =>
        tok.split('-').forEach((p, i) => { if (i > 0 && /^(e|ye)$/i.test(p) && parts.length) parts[parts.length - 1].iz = true; else if (p) parts.push({ ro: p }); }));
    if (parts.length !== uw.length) continue;
    uw.forEach((w, i) => {
        const key = w.normalize('NFC').replace(MARKS, '');
        if (key.length < 3 || parts[i].iz) return;
        const e = seen.get(key) || { n: 0, dbl: 0, forms: new Map(), roman: new Map() };
        e.n++;
        const doubled = addTashdid(key, parts[i].ro);
        if (doubled !== key) {
            e.dbl++;
            e.forms.set(doubled, (e.forms.get(doubled) || 0) + 1);
            e.roman.set(parts[i].ro, (e.roman.get(parts[i].ro) || 0) + 1);
        }
        seen.set(key, e);
    });
}

/* The Roman says how the word is actually pronounced, so it gives the ONE reading that costs 0 (the engine's own
   letter splits tie at cost 0 and flip meters on ties). Weight of a syllable: long vowel (ā ī ū e o ai au) = l; short
   vowel closed by a consonant = l, else s. A geminate puts one consonant on each side of the syllable break.
   '.' + a/i/u is an ʿain consonant, '.' + anything else is a hamza and is ignored. A word-final long vowel is flexible (x). */
function romanWeights(ro) {
    const w = ro.toLowerCase().replace(/[-'’‘ʾ]/g, '');
    const toks = [];   // {v: 'long'|'short'} for a vowel nucleus, {c: true} for a consonant
    for (let i = 0; i < w.length; i++) {
        const c = w[i];
        if (c === '.') { if (/[aiu]/.test(w[i + 1] || '')) toks.push({ c: true }); continue; }
        if (c === 'ñ') continue;
        if (c === 'ā' || c === 'ī' || c === 'ū' || c === 'e' || c === 'o') toks.push({ v: 'long' });
        else if ((c === 'a' && w[i + 1] === 'i') || (c === 'a' && w[i + 1] === 'u')) { toks.push({ v: 'long' }); i++; }
        else if (c === 'a' || c === 'i' || c === 'u') toks.push({ v: 'short' });
        else if (/[a-zḳġṭḍṛṣżẓṡḥ]/.test(c)) { if (w[i + 1] === 'h' && /[bcdgjkpstṭḍṛḳġ]/.test(c)) i++; toks.push({ c: true }); }
    }
    const out = [];
    for (let i = 0; i < toks.length; i++) {
        if (!toks[i].v) continue;
        let j = i + 1, cons = 0;
        while (j < toks.length && !toks[j].v) { cons++; j++; }
        const atEnd = j >= toks.length;
        const closed = atEnd ? cons >= 1 : cons >= 2;
        out.push(toks[i].v === 'long' ? (atEnd && cons === 0 ? 'x' : 'l') : closed ? 'l' : 's');
    }
    return out;
}
const sameWeights = (a, b) => a.length === b.length && a.every((x, i) => x === b[i] || x === 'x' || b[i] === 'x');

const { Scan } = loadEngine();
const top = m => [...m.entries()].sort((a, b) => b[1] - a[1])[0];
const entries = [];
for (const [key, e] of seen) {
    if (e.dbl < MIN || e.dbl / e.n < 0.8 || inLexicon.has(key)) continue;
    const [form] = top(e.forms);
    const letters = [...form.replace(/ّ/g, '')];
    const at = [...form].indexOf('ّ');
    if (at === form.length - 1) continue;      // shadda on the last letter: a word-final geminate
    const dbl = Scan.scanWord(form).opts, raw = Scan.scanWord(key).opts;
    const intended = romanWeights(top(e.roman)[0]);
    const best = new Map();
    const add = (ws, c) => { const k = ws.join(','); if (!best.has(k) || best.get(k).c > c) best.set(k, { w: ws, c: +c.toFixed(1) }); };
    add(intended, 0);
    dbl.forEach(o => { const ws = o.syl.map(x => x.w); add(ws, sameWeights(ws, intended) ? 0 : o.c + 0.6); });
    raw.forEach(o => add(o.syl.map(x => x.w), o.c + 0.6));
    const rows = [...best.values()].sort((a, b) => a.c - b.c).slice(0, 4);
    entries.push({ key, form, n: e.n, dbl: e.dbl, roman: top(e.roman)[0], rows });
}
entries.sort((a, b) => b.dbl - a.dbl);
const line = x => `lex('${x.key}',[${x.rows.map(r => `{w:[${r.w.map(w => `'${w}'`).join(',')}],c:${r.c}}`).join(',')}]);   /* ${x.roman} x${x.dbl} */`;
const out = entries.map(line).join('\n');
if (opt('--out')) fs.writeFileSync(opt('--out'), out + '\n'); else console.log(out);
console.error(`${entries.length} candidate words (min ${MIN} occurrences)`);
