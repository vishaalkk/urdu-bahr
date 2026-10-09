// Steingass's pronunciations for the Persian engine (ScanFa). data/fa_steingass.tsv (scripts/import_steingass.py) gives each
// headword's classical Roman; it is turned into the Roman romanWeights reads, and where none of the engine's readings of the
// word has those weights, the reading is added at the cost of the engine's best (rankReadings), as the verb forms are. Add-only:
// a word Sufinama's Roman already taught (`known`) is left alone, and the engine's own readings stay.
'use strict';
const fs = require('fs'), path = require('path');

const V = 'aeiouāīūēō';
/* Steingass's transliteration → the Roman romanWeights reads */
function steingassRoman(ro) {
    let s = String(ro || '').normalize('NFD')
        .replace(/ḵẖ/g, 'ḳh').replace(/g̱ẖ/g, 'ġh').replace(/ṯẖ/g, 's')   // ḵẖ, g̱ẖ, s̱ẖ
        .replace(/[̱̤̣]/g, '').normalize('NFC')   // t̤, s̤, ḥ, ṣ…: the dot only tells letters apart
        .replace(/ẖ/g, 'h').replace(/ẕ/g, 'z').replace(/ḵ/g, 'k').replace(/ṃ/g, 'm').replace(/ṇ/g, 'n').replace(/ẉ/g, 'w')
        .replace(/á/g, 'ā').replace(/ĕ/g, 'i').replace(/î/g, 'ī').replace(/ü/g, 'u').replace(/ˌ/g, '');
    return s.replace(/[‘’ʿʾ']/g, 'q')   // ʿain and hamza are consonants (ibtiyāʿ ib-ti-yāʿ)
        .replace(/ḳhv(?=[aā])/g, 'ḳh')   // ḳhvāb, ḳhvud: the v is written, not said
        .replace(/([tdpbjkgr])h/g, '$1ḥ')   // as-hal, at-har: two consonants, not an aspirate
        .replace(new RegExp(`([āīū])n(?![${V}])`, 'g'), '$1ñ')   // n after a long vowel is not scanned (jān, as in Urdu)
        .replace(/(.)\1$/, '$1')   // a final double consonant counts once (asharr)
        .replace(new RegExp(`aw(?![${V}])`, 'g'), 'au').replace(new RegExp(`ay(?![${V}])`, 'g'), 'ai').replace(/w/g, 'v');
}

/* consonant skeletons: the Persian headword and its Roman must spell the same consonants (the scraped pages misalign a few) */
const SKEL_FA = { 'ب': 'b', 'پ': 'p', 'ت': 't', 'ط': 't', 'ة': 't', 'ث': 's', 'س': 's', 'ص': 's', 'ج': 'j', 'چ': 'c', 'خ': 'x',
    'د': 'd', 'ذ': 'z', 'ز': 'z', 'ض': 'z', 'ظ': 'z', 'ژ': 'z', 'ر': 'r', 'ش': 'S', 'غ': 'g', 'ف': 'f', 'ق': 'q', 'ک': 'k',
    'ك': 'k', 'گ': 'g', 'ل': 'l', 'م': 'm', 'ن': 'n' };
const skelFa = w => [...w].map(c => SKEL_FA[c] || '').join('').replace(/(.)\1+/g, '$1');
const skelRo = r => r.replace(/q/g, '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/kh/g, 'x').replace(/gh/g, 'g').replace(/sh/g, 'S').replace(/ch/g, 'c').replace(/zh/g, 'z')
    .replace(/[^a-zS]/g, '').replace(/[aeiouyvwh]/g, '').replace(/(.)\1+/g, '$1');

/* {engine key: options} for Steingass headwords the engine and `known` do not already read right */
function steingassLex(Scan, ctx, known, romanWeights, rankReadings) {
    const file = path.join(__dirname, '..', 'data', 'fa_steingass.tsv');
    if (!fs.existsSync(file)) return {};
    const lex = {};
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
        const [fa, ro] = line.split('\t');
        if (!fa || !ro) continue;
        const r = steingassRoman(ro);
        if (skelFa(fa) !== skelRo(r)) continue;
        const ws = romanWeights(r);
        const u = ctx.faScanSpelling(fa);   // spelling only: a lone word is not a line end
        if (!ws || /\s/.test(u)) continue;
        let key;
        try { key = Scan.scanWord(u).key; } catch (e) { continue; }
        if (known[key]) continue;
        if (lex[key]) {   // a homograph: its reading joins the first one's
            if (!lex[key].some(o => o.w.join() === ws.join())) lex[key].push({ w: ws, c: lex[key][lex[key].length - 1].c });
            continue;
        }
        const ranked = rankReadings(Scan, u, ws);
        if (ranked) lex[key] = ranked;
    }
    return lex;
}

module.exports = { steingassRoman, steingassLex };
