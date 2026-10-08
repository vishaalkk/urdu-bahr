// Persian word list from Sufinama's three scripts: each Urdu-script word with the Roman and Devanagari Sufinama gives it.
// Shared by scripts/build_fa_lexicon.js (the shipped data/fa_lexicon.json), tests/benchmark_fa.js (held-out score)
// and scripts/scan_sufinama.js (Roman repair). The key folding must stay identical to faKey in src/js/05-translit-helpers.js.
'use strict';

/* one spelling per word whatever the orthography: no vowel marks or joiners, Iranian and Urdu letter forms folded */
function faKey(w) {
    return String(w || '').normalize('NFC')
        .replace(/[ﭐ-﷿ﹰ-﻿]/g, c => c.normalize('NFKC'))
        .replace(/[ً-ٰٟـ‌‍ؐ-ؚٔ]/g, '')
        .replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/[هۂۀة]/g, 'ہ').replace(/ں/g, 'ن')
        .replace(/[^ء-ۓ]/g, '');
}

/* a Roman or Devanagari line -> its words, the iẓāfat -e / -ए folded into the word before it (as pack_verses.py does) */
const IZ = new Set(['e', 'ye', 'ए', 'ये', 'ए', 'ऐ']);
function splitWords(s) {
    const out = [];
    String(s || '').replace(/['’‘"]/g, '').replace(/\s+([eए])(?=\s|$)/g, '-$1').split(/\s+/).filter(Boolean).forEach(tok =>
        tok.split('-').forEach((p, i) => {
            if (i > 0 && IZ.has(p.toLowerCase()) && out.length) out[out.length - 1].iz = true;
            else if (p) out.push({ w: p, iz: false });
        }));
    return out;
}

const PERSIAN = g => g.lang === 'fa' || /^fa_|^(jami|bu_ali|khusrau_persian)$/.test(g.category || '');

/* word pairs from the lines whose Urdu, Roman (and Devanagari, when it lines up too) split into the same number of words:
   the reliable part. -> [{key, ro, hi}] */
function pairsOf(ghazal) {
    const out = [];
    for (const l of ghazal.lines || []) {
        if (!l.ur || !l.ro || /[؀-ۿऀ-ॿ]/.test(l.ro)) continue;
        const u = l.ur.split(/\s+/).filter(Boolean), r = splitWords(l.ro), h = splitWords(l.hi);
        if (u.length !== r.length) continue;
        u.forEach((w, i) => {
            const key = faKey(w);
            if (key) out.push({ key, ro: r[i].w, hi: h.length === u.length ? h[i].w : '' });
        });
    }
    return out;
}

/* counts: {key: {ro: {spelling: n}, hi: {spelling: n}, by: {ghazal url: n}}} over the given ghazals */
function mine(ghazals) {
    const lex = {};
    for (const g of ghazals) for (const p of pairsOf(g)) {
        const e = lex[p.key] || (lex[p.key] = { ro: {}, hi: {}, by: {} });
        e.ro[p.ro] = (e.ro[p.ro] || 0) + 1;
        if (p.hi) e.hi[p.hi] = (e.hi[p.hi] || 0) + 1;
        e.by[g.url] = (e.by[g.url] || 0) + 1;
    }
    return lex;
}

const top = c => Object.entries(c || {}).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];

/* the shipped form: {key: [roman, devanagari, times seen]} */
function finalize(lex) {
    const out = {};
    Object.keys(lex).sort().forEach(k => {
        const r = top(lex[k].ro), h = top(lex[k].hi);
        out[k] = [r[0], h ? h[0] : '', Object.values(lex[k].ro).reduce((a, b) => a + b, 0)];
    });
    return out;
}

/* for comparing Roman spellings: case, diacritics, apostrophes and doubled letters don't count */
function romanNorm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '')
        .replace(/(.)\1+/g, '$1');
}

module.exports = { faKey, splitWords, pairsOf, mine, finalize, romanNorm, PERSIAN };

/* ---- Roman repair (scripts/scan_sufinama.js) ----
   A coarse sound skeleton that Roman and Devanagari spellings of one word share: consonants by sound class, long vowels
   kept, short vowels dropped (Devanagari rarely writes them). Two scripts agreeing on it while the Roman disagrees is the
   signal for a repair. */
const DEVA = { 'क': 'k', 'ख': 'k', 'ग': 'g', 'घ': 'g', 'च': 'c', 'छ': 'c', 'ज': 'j', 'झ': 'j', 'ट': 't', 'ठ': 't', 'ड': 'd', 'ढ': 'd',
    'ण': 'n', 'त': 't', 'थ': 't', 'द': 'd', 'ध': 'd', 'न': 'n', 'प': 'p', 'फ': 'f', 'ब': 'b', 'भ': 'b', 'म': 'm', 'य': 'y', 'र': 'r',
    'ल': 'l', 'व': 'v', 'श': 'S', 'ष': 'S', 'स': 's', 'ह': 'h', 'क़': 'q', 'ख़': 'x', 'ग़': 'g', 'ज़': 'z', 'फ़': 'f', 'ड़': 'r', 'ढ़': 'r',
    'ा': 'A', 'आ': 'A', 'ी': 'I', 'ई': 'I', 'ू': 'U', 'ऊ': 'U', 'े': 'E', 'ए': 'E', 'ै': 'E', 'ऐ': 'E', 'ो': 'O', 'ओ': 'O', 'ौ': 'O', 'औ': 'O',
    'ं': 'n', 'ँ': 'n' };
const NUKTA = { 'क': 'q', 'ख': 'x', 'ग': 'g', 'ज': 'z', 'ड': 'r', 'ढ': 'r', 'फ': 'f' };   // क़ ख़ ग़ ज़ ड़ ढ़ फ़ (letter + U+093C)
function devaSkel(h) {
    const c = [...String(h || '').normalize('NFD')], out = [];
    for (let i = 0; i < c.length; i++) {
        if (c[i + 1] === '\u093c' && NUKTA[c[i]]) { out.push(NUKTA[c[i]]); i++; continue; }
        out.push(DEVA[c[i]] || '');
    }
    return out.join('').replace(/(.)\1+/g, '$1');
}
function romanSkel(r) {
    let s = String(r || '').toLowerCase().normalize('NFC')
        .replace(/ḳh|kh/g, 'x').replace(/ġh|gh/g, 'g').replace(/sh/g, 'S').replace(/chh|ch/g, 'c').replace(/zh/g, 'z')
        .replace(/([bdgjkpt])h/g, '$1').replace(/ā|aa/g, 'A').replace(/ī|ii/g, 'I').replace(/ū|uu/g, 'U').replace(/ai|ei/g, 'E')
        .replace(/au/g, 'O').replace(/ñ/g, 'n');
    s = s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/e/g, 'E').replace(/o/g, 'O').replace(/w/g, 'v')
        .replace(/[aiu]/g, '').replace(/[^a-zA-Z]/g, '').replace(/[A-Z]/g, c => c);
    return s.replace(/(.)\1+/g, '$1');
}

function skelSim(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return 1 - d[a.length][b.length] / Math.max(a.length, b.length, 1);
}

/* the particles a Roman line sometimes drops, with Sufinama's spelling; a -joined one is written ba-qatl */
const PARTICLES = { 'بہ': ['ba', true], 'ب': ['ba', true], 'ز': ['za', true], 'کہ': ['ki', false], 'نہ': ['na', false], 'از': ['az', false],
    'در': ['dar', false], 'بر': ['bar', false], 'با': ['bā', false] };

/* the parts of a Roman line with their offsets (an iẓāfat -e stays with its word) */
function romanParts(ro) {
    const out = [], re = /[^\s-]+/g;
    let m;
    while ((m = re.exec(ro))) {
        if (/^(e|ye)$/i.test(m[0]) && out.length) continue;
        out.push({ w: m[0], at: m.index });
    }
    return out;
}

/* candidate repairs for one line: -> {ro, why} or null.
   lexOthers: finalize(mine(every Persian ghazal but this one)), so a line never vouches for itself. */
function repairLine(line, lexOthers) {
    const ur = (line.ur || '').split(/\s+/).filter(Boolean), ro = line.ro || '', hi = splitWords(line.hi);
    if (!ur.length || !ro || /[؀-ۿऀ-ॿ]/.test(ro)) return null;
    const parts = romanParts(ro.replace(/['’‘"]/g, ' '));
    const sk = w => romanSkel(w);
    /* (a) a dropped particle: Urdu and Devanagari have one more word than the Roman, and taking out exactly one particle
       makes the rest line up word for word */
    if (ur.length === parts.length + 1 && hi.length === ur.length) {
        const fits = [];
        ur.forEach((w, j) => {
            const p = PARTICLES[w];
            if (!p || romanSkel(p[0]) !== devaSkel(hi[j].w).replace(/E$/, '')) return;
            const rest = ur.filter((_, i) => i !== j), restHi = hi.filter((_, i) => i !== j);
            const ok = rest.every((u, i) => { const rs = sk(parts[i].w); return rs && (devaSkel(restHi[i].w) === rs || rs.length > 1 && devaSkel(restHi[i].w).startsWith(rs.slice(0, 2))); });
            if (ok) fits.push([j, p]);
        });
        if (fits.length === 1) {
            const [j, [r, joined]] = fits[0];
            const at = j < parts.length ? parts[j].at : ro.length;
            const ins = joined && j < parts.length ? r + '-' : (j < parts.length ? r + ' ' : ' ' + r);
            return { ro: ro.slice(0, at) + ins + ro.slice(at), why: `dropped ${ur[j]} (${r}): Urdu and Devanagari have it` };
        }
        return null;
    }
    /* (b) a misspelt word: Devanagari and the word list (from other ghazals, seen 3+ times, 80%+ of the time) agree on a
       spelling the Roman does not have */
    if (ur.length !== parts.length || hi.length !== ur.length) return null;
    let out = ro, shift = 0;
    const why = [];
    ur.forEach((w, i) => {
        if (w === 'و') return;   // va / o: both right, a matter of style
        const e = lexOthers[faKey(w)];
        if (!e || e[2] < 3 || !e[3] || e[3] < 0.8) return;
        const want = e[0], have = parts[i].w;
        if (romanNorm(want) === romanNorm(have)) return;
        const d = devaSkel(hi[i].w);
        if (!d || d !== romanSkel(want) || d === romanSkel(have)) return;
        if (skelSim(romanSkel(want), romanSkel(have)) < 0.5) return;   // a misspelling, not another word (guards misalignment)
        const at = parts[i].at + shift;
        out = out.slice(0, at) + want + out.slice(at + have.length);
        shift += want.length - have.length;
        why.push(`${have} → ${want}`);
    });
    return why.length ? { ro: out, why: why.join(', ') } : null;
}

/* finalize with the share of the top spelling: {key: [roman, devanagari, seen, share]} */
function finalizeWithShare(lex) {
    const out = finalize(lex);
    Object.keys(out).forEach(k => { const n = out[k][2]; out[k].push(n ? (lex[k].ro[out[k][0]] || 0) / n : 0); });
    return out;
}

module.exports.devaSkel = devaSkel;
module.exports.romanSkel = romanSkel;
module.exports.repairLine = repairLine;
module.exports.finalizeWithShare = finalizeWithShare;
