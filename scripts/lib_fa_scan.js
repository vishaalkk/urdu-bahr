// Persian readings for the scansion engine. From Sufinama's Roman (which writes the vowels) each Persian word gets its syllable
// weights; the engine's own readings of the word are then ranked so the one matching the Roman comes first (cost 0) and the
// others stay available at a small cost. The result is a set of engine lex() lines, spliced into a SECOND copy of the engine
// (ScanFa, scripts/build_app.py) that scans Persian only; the engine source and the Urdu engine are untouched.
'use strict';
const { splitWords, PERSIAN } = require('./lib_fa_lexicon');

/* Roman (Sufinama spelling) → weights. Long vowel or closed syllable = l, open short = s; a consonant left over at the end of a
   syllable that already closed (jān, dast, dōst) is an extra short, as in Urdu ʿarūz (handbook 2.3, 4.2); a nasal ñ is not counted. */
const LONG = /^(aa|ā|ii|ī|uu|ū|ai|au|e|ē|o|ō)/;
const SHORT = /^(a|i|u)/;
const CONS2 = /^(ḳh|kh|ġh|gh|sh|ch|zh|th|ph|bh|dh|jh|ṭh|ḍh|ṛh)/;
function romanWeights(word) {
    let s = String(word || '').toLowerCase().normalize('NFC').replace(/['’‘ʿʾ"]/g, '').replace(/\./g, '');
    if (!s || /[^a-zāīūēōḳġṭḍṛñṣẓḥ-]/.test(s)) return null;
    s = s.replace(/-/g, '');
    const units = [];   // V (long/short) or C
    while (s) {
        let m;
        if ((m = s.match(LONG))) { units.push('L'); s = s.slice(m[0].length); }
        else if ((m = s.match(SHORT))) { units.push('S'); s = s.slice(m[0].length); }
        else if (s[0] === 'ñ') { s = s.slice(1); }   // nasal: not scanned
        else if ((m = s.match(CONS2))) { units.push('C'); s = s.slice(m[0].length); }
        else { units.push('C'); s = s.slice(1); }
    }
    const out = [];
    let i = 0;
    while (i < units.length && units[i] === 'C') i++;   // onset
    if (i === units.length) return null;
    while (i < units.length) {
        const v = units[i++];
        let codas = 0;
        while (i < units.length && units[i] === 'C') { codas++; i++; }
        const last = i >= units.length;
        const keep = last ? codas : Math.max(0, codas - 1);   // between vowels, the last consonant starts the next syllable
        if (v === 'L') { out.push('l'); if (keep >= 1) out.push('s'); }
        else if (keep === 0) out.push('s');
        else { out.push('l'); if (keep >= 2) out.push('s'); }
    }
    return out;
}

const fits = (want, have) => want.length === have.length && want.every((w, i) => have[i] === 'x' || have[i] === w);

/* engine readings of a word ranked by the Roman: -> lex option list [{w, c}] or null when the engine already prefers it */
function rankReadings(Scan, word, romanWs) {
    let opts;
    try { opts = Scan.scanWord(word).opts; } catch (e) { return null; }
    if (!opts || !opts.length) return null;
    const list = opts.map(o => ({ w: o.syl.map(s => s.w), c: o.c }));
    const best = Math.min(...list.map(o => o.c));
    /* the engine's readings stay exactly as they are (their flexibility is what meter needs); a Persian reading is only ADDED
       when none of them matches the Roman at all, at the cost of the engine's best */
    if (list.some(o => fits(romanWs, o.w))) return null;
    const out = list.map(o => ({ w: o.w, c: +o.c.toFixed(2) }));
    out.push({ w: romanWs, c: +best.toFixed(2) });
    return out;
}

/* {engine key: options} from Persian Sufinama ghazals (word pairs where Urdu and Roman split alike) */
function buildScanLex(Scan, ghazals) {
    const votes = {};   // key -> {weights string: count}, word -> a sample spelling
    for (const g of ghazals.filter(PERSIAN)) for (const l of g.lines || []) {
        if (!l.ur || !l.ro || /[؀-ۿऀ-ॿ]/.test(l.ro)) continue;
        const u = l.ur.split(/\s+/).filter(Boolean), r = splitWords(l.ro);
        if (u.length !== r.length) continue;
        u.forEach((w, i) => {
            if (/[ِّ]/.test(w)) return;   // written iẓāfat / tashdīd: the engine reads those itself
            const ws = romanWeights(r[i].w);
            if (!ws) return;
            let key;
            try { key = Scan.scanWord(w).key; } catch (e) { return; }
            const v = votes[key] || (votes[key] = { n: {}, word: w });
            const k = ws.join('');
            v.n[k] = (v.n[k] || 0) + 1;
        });
    }
    const lex = {};
    Object.entries(votes).forEach(([key, v]) => {
        const [ws, n] = Object.entries(v.n).sort((a, b) => b[1] - a[1])[0];
        const total = Object.values(v.n).reduce((a, b) => a + b, 0);
        if (n / total < 0.6) return;   // the poets disagree: leave the word to the engine
        const ranked = rankReadings(Scan, v.word, ws.split(''));
        if (ranked) lex[key] = ranked;
    });
    return lex;
}

/* engine lex() lines for a {key: options} table */
function lexLines(lex) {
    return Object.entries(lex).map(([k, opts]) => `lex(${JSON.stringify(k)},${JSON.stringify(opts)});`).join('\n');
}

/* Ganjoor's Persian meters that no Urdu meter covers (data/persian_meters.json, 300+ verses), as engine meter rows. Id 'F' +
   Ganjoor id. A makhbūn line may open with fāʿilātun, so a leading – – = = opens with x (as Urdu meters 14-19 do). */
function persianMeterRows(persianMeters, min = 300) {
    return persianMeters.filter(m => !m.urdu.length && m.verses >= min).map(m => {
        let p = [...m.pattern].map(c => c === '=' ? '=' : '-');
        if (m.pattern.startsWith('--==')) p[0] = 'x';
        return ['F' + m.gid, p.join(' ')];
    });
}

/* the Persian engine (ScanFa) for node: the app's engine with data/fa_scan.json spliced in, as scripts/build_app.py builds it */
function loadFaEngine() {
    const fs = require('fs'), path = require('path');
    const { loadEngine } = require('./lib_scan');
    const fa = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data/fa_scan.json'), 'utf8'));
    return loadEngine(lexLines(fa.lex), fa.meters);
}

module.exports = { romanWeights, rankReadings, buildScanLex, lexLines, persianMeterRows, loadFaEngine };
