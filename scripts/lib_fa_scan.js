// Persian readings for the scansion engine. From Sufinama's Roman (which writes the vowels) each Persian word gets its syllable
// weights; the engine's own readings of the word are then ranked so the one matching the Roman comes first (cost 0) and the
// others stay available at a small cost. The result is a set of engine lex() lines, spliced into a SECOND copy of the engine
// (ScanFa, scripts/build_app.py) that scans Persian only; the engine source and the Urdu engine are untouched.
'use strict';
const { splitWords, PERSIAN, linePairs } = require('./lib_fa_lexicon');

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
        linePairs(l).forEach(([w, r]) => {
            if (/[ِّ]/.test(w)) return;   // written iẓāfat / tashdīd: the engine reads those itself
            const ws = romanWeights(r.w);
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
        const total = Object.values(v.n).reduce((a, b) => a + b, 0);
        /* every reading the poets give the word a fair share of (a word can scan two ways: barā-e / barāy-e); dropping the
           word when they split lost good readings */
        const shares = Object.entries(v.n).filter(([, n]) => n / total >= 0.3).map(([ws]) => ws.split(''));
        let ranked = null;
        for (const ws of shares) {
            const r = rankReadings(Scan, v.word, ws);
            if (!r) continue;
            if (!ranked) ranked = r;
            else if (!ranked.some(o => fits(ws, o.w))) ranked.push(r[r.length - 1]);
        }
        if (ranked) lex[key] = ranked;
    });
    /* ke (کہ) and be (بہ) may be long (persianlanguageonline ʿarūz part 1; Mahdavi Mazdeh 2019, rule 3): the engine knows them
       short only. Short stays the default (cost 0), long costs 1 */
    /* و (o, va) between words: short by default, long at a small cost (Mahdavi Mazdeh 2019 rule 3); the Urdu engine charges
       2.5 for either, which suits Urdu (where it joins the word before) but not Persian (rūze vo gol) */
    lex['و'] = [{ w: ['s'], c: 0 }, { w: ['l'], c: 0.5 }];
    for (const p of ['کہ', 'بہ']) {
        const opts = lex[p] || [{ w: ['s'], c: 0 }];
        if (!opts.some(o => o.w.join('') === 'l')) opts.push({ w: ['l'], c: 1 });
        lex[p] = opts;
    }
    return lex;
}

/* engine lex() lines for a {key: options} table */
function lexLines(lex) {
    return Object.entries(lex).map(([k, opts]) => `lex(${JSON.stringify(k)},${JSON.stringify(opts)});`).join('\n');
}

/* Ganjoor's Persian meters that no Urdu meter covers (data/persian_meters.json, 300+ verses), as engine meter rows. Id 'F' +
   Ganjoor id. A makhbūn line may open with fāʿilātun, so a leading – – = = opens with x (as Urdu meters 14-19 do).
   attested (Ganjoor ids): rarer meters kept all the same, because Ganjoor files a ghazal of ours under them (build_fa_scan.js:
   the sure matches of tests/data/persian_gold.json; Rumi's "zahe ʿishq zahe ʿishq", hazaj makfūf, 175 verses). */
function persianMeterRows(persianMeters, min = 300, attested = new Set()) {
    return persianMeters.filter(m => !m.urdu.length && (m.verses >= min || attested.has(m.gid))).map(m => {
        let p = [...m.pattern].map(c => c === '=' ? '=' : '-');
        if (m.pattern.startsWith('--==')) p[0] = 'x';
        return ['F' + m.gid, p.join(' ')];
    });
}

/* Contraction (Mahdavi Mazdeh 2019, ch. 4.7: LL → H, the metron HLLH or LLHH sung as HHH; Rumi's rajaz often does it): for
   each meter with a muftaʿilun (= - - =) or faʿilātun (- - = =) foot, one extra row per such foot sung as three longs, under
   the meter's own id (so labels and votes are unchanged). Never the last foot: a line's ending stays strict. ScanFa only. */
function contractionRows(rows) {
    const out = [];
    for (const [id, raw] of rows) {
        const parts = raw.split(/\s+(\/\/?)\s+/);   // feet and their separators, in order
        const feet = parts.filter((_, i) => i % 2 === 0);
        feet.forEach((f, k) => {
            if (k === feet.length - 1 || !/^(= - - =|- - = =)$/.test(f)) return;
            const p = parts.slice();
            p[2 * k] = '= = =';
            out.push([id, p.join(' ')]);
        });
    }
    return out;
}

/* the Persian engine (ScanFa) for node: the app's engine with data/fa_scan.json spliced in, as scripts/build_app.py builds it */
function loadFaEngine() {
    const fs = require('fs'), path = require('path');
    const { loadEngine } = require('./lib_scan');
    const fa = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data/fa_scan.json'), 'utf8'));
    return loadEngine(lexLines(fa.lex), fa.meters);
}

module.exports = { romanWeights, rankReadings, buildScanLex, lexLines, persianMeterRows, contractionRows, loadFaEngine };
