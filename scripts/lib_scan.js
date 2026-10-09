// Shared by scan_poets.js and scan_faiz.js: loads the scansion engine and Roman helpers out of
// the built index.html (no engine edits) and scans one Rekhta ghazal.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const METERS = JSON.parse(fs.readFileSync(path.join(root, 'data/meters.json'), 'utf8')).standard;
const PAIRED = new Map(METERS.map(m => [String(m.id), m.paired.map(String)]));
const COST_MAX = 5.0;           // a line "scans" when its best fit costs no more than this
const CONFIDENT_SHARE = 0.7;    // a ghazal gets a meter only if its meter family fits at least this share of its lines

/* extraLex: lex(...) lines to try out, spliced in before the syllabifier; extraMeters: [[id, raw], ...] rows appended to
   METERS_RAW (the Persian engine ScanFa: scripts/lib_fa_scan.js faEngineParts) */
function loadEngine(extraLex = '', extraMeters = null) {
    const html = fs.readFileSync(process.env.URDU_BAHR_HTML || path.join(root, 'index.html'), 'utf8');   // env override: score against another build
    const a = html.indexOf("(function(root){\n'use strict';\n\n/* ---------- meters");
    const e = html.indexOf('})(this);', a) + '})(this);'.length;
    const mod = { exports: {} };
    let src = html.slice(a, e);
    if (extraLex) {
        const at = src.indexOf('/* ---------- syllabify a letter string');
        src = src.slice(0, at) + extraLex + '\n' + src.slice(at);
    }
    if (extraMeters && extraMeters.length) {
        const end = src.indexOf('\n];\nconst RUBAI_RAW');
        src = src.slice(0, end) + ',\n ' + extraMeters.map(r => JSON.stringify(r)).join(',') + src.slice(end);
    }
    /* the app's engine also reads the learned iẓāfat / o hypotheses (src/js/01b-hypothesis-costs.js) from its global */
    const hyp = html.match(/var HYP_COSTS = \{[^\n]*\};?/);
    vm.runInNewContext((hyp ? hyp[0] + '\n' : '') + src, { module: mod, console });

    const ctx = {
        window: {},
        document: { getElementById: () => ({}), querySelectorAll: () => [], querySelector: () => null, addEventListener: () => {} },
        $: () => ({}),
        console,
        setTimeout: fn => fn(), clearTimeout: () => {}, setInterval: () => {}, clearInterval: () => {},
        localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} }
    };
    const scripts = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];
    vm.createContext(ctx);
    scripts.slice(0, 2).forEach(s => {
        try { vm.runInContext(s.replace(/<\/?script[^>]*>/gi, ''), ctx); } catch (err) {}
    });
    return { Scan: mod.exports, ctx };
}

/* romanToAscii writes the marks lower-case (;n ;g ;t ;d ;r); the verified corpora (Ghalib, Mir, exercises)
   use ;N ;G ;T ;D ;R. Rekhta's ñ before g/j/d/k/t/ch is plain n there (rañg, chāñd, sañg). Mixing the
   two conventions makes every such word look ambiguous to anything that mines spellings. */
function normalizeAscii(a) {
    return a
        .replace(/;n(?=g|j|d|k|t|ch)/g, 'n')
        .replace(/;n/g, ';N')
        .replace(/;g/g, ';G')
        .replace(/;t/g, ';T')
        .replace(/;d/g, ';D')
        .replace(/;r/g, ';R');
}

const NON_LATIN = /[؀-ۿऀ-ॿ]/;

function asciiFor(ctx, ro) {
    if (!ro || NON_LATIN.test(ro)) return '';   // some Rekhta pages carry Urdu script in the Roman column
    try { return normalizeAscii(ctx.romanToAscii(ro.replace(/['’‘]/g, ''))); } catch (e) { return ''; }
}

/* Rekhta's Urdu is unvocalised, so izafat, unwritten tashdid and the pen-name sign are hidden from the engine; the Roman
   says them. The logic (rekhtaScanText, rkAddTashdid) lives in src/js/05-translit-helpers.js, the same code the reader runs,
   and is read from the built index.html here. */
let _app = null;
const app = () => (_app = _app || loadEngine().ctx);
const hintedUrdu = (ur, ro) => app().rekhtaScanText(ur, ro);
const addTashdid = (uw, rw) => app().rkAddTashdid(uw, rw);

/* Language of one line, from its Roman (Sufinama/Rekhta spelling, with macrons): Persian qawwali carries Urdu
   girah lines and Urdu kalaam quotes Persian. `fallback` is the collection's language; a line switches only when its
   own marker words clearly say so. Urdu kī/kā (long) are genitives; Persian ki (short) is "that". */
const UR_MARK = new Set(('hai haiñ hain meñ meñ kā kī se ne ko thā thī the nahīñ nahiñ kyā kyuuñ kyoñ merā merī mere terā terī tere ' +
    'apnā apnī apne huā hue gayā ga.e ga.ī kar karo hotā hotī ho.e jab tab ab bhī hī koī kuchh vo voh ye yeh').split(' '));
const FA_MARK = new Set(('ast nīst niist hast az rā ze za chu chuuñ chūñ ū īñ iiñ āñ aañ mī namī kun kunad kunam kardam kard shud ' +
    'shudam shavad bāshad bāshī bāsham dāram dārad dārī gasht gashta yak hama che chi chīst chiist kujā chirā ' +
    'bīñ bīnam guftam guftā shumā īñjā āñjā ham-chu hamchu bī be-').split(' '));
function lineLang(ro, fallback = 'ur') {
    const toks = String(ro || '').toLowerCase().replace(/['’‘"]/g, '').split(/[\s-]+/).filter(Boolean);
    let u = 0, f = 0;
    toks.forEach(t => { if (UR_MARK.has(t)) u++; if (FA_MARK.has(t)) f++; });
    if (fallback === 'fa') return (u >= 2 && u > f) ? 'ur' : 'fa';
    return (f >= 2 && f > u) ? 'fa' : 'ur';
}

/* Mustazād: a line of a meter plus an added phrase made of the meter's first and last feet (hazaj #8 + mafʿūlu faʿūlun:
   "har lahza ba-shakle but-e-'ayyār bar āmad / dil burd-o-nihāñ shud"). The scan is the app's (src/js/05-translit-helpers.js
   faMustazadScan: head fits a meter at ≤ 2, tail exactly its first + last foot), over every meter and every split, as the
   ghazal meter vote has always taken it (`loose`). -> {meter, c (head + tail), split (words in the head)} or null */
function mustazadFit(Scan, text, ctx = app()) {
    let r;
    try { r = ctx.faMustazadScan(Scan, text, null, { loose: true }); } catch (e) { return null; }
    const f = r.fits[0];
    return f ? { meter: f.meter, c: f.c, split: f.mustazad } : null;
}

/* opts.assignAlways: give the ghazal its best meter family even below CONFIDENT_SHARE (the Sufinama collections were
   built this way; `scan_pass_rate` still says how sure it is). */
function scanGhazal(g, idx, { Scan, ctx }, opts = {}) {
    const votes = new Map();    // meter id (as string) -> lines whose single best fit it is
    const idType = new Map();   // string -> original id (number, or 'H' / 'R1' ...)
    const fitCost = [];         // per line: Map(meter id -> cost) of every fit within COST_MAX
    /* opts.lang: Persian-aware. Each line is tagged `lang`; a Persian line never takes the Hindi meter ('H' is
       Urdu/Hindi only), and in Persian kalaam only its Persian lines vote on the meter (girah lines don't). */
    const gLang = g.lang || 'ur';
    const lineLangs = (g.lines || []).map(l => opts.lang ? lineLang(l.ro, gLang) : gLang);
    const texts = [], wholeFits = [];   // per line: the text scanned and its fits as a whole line (before any mustazād reading)
    const lines = (g.lines || []).map((l, li) => {
        let fits;
        const text = (opts.lang && lineLangs[li] === 'fa' && ctx.faProsodyText) ? ctx.faProsodyText(ctx.rekhtaScanText(l.ur, l.ro)) : ctx.rekhtaScanText(l.ur, l.ro);
        try { fits = (opts.lang && lineLangs[li] === 'fa' && ctx.faScanFits) ? ctx.faScanFits(Scan, text) : (Scan.scanLine(text).fits || []); }
        catch (e) { fits = []; console.warn(`scanGhazal: the engine cannot read line ${li + 1} of ${g.url || g.id}: ${e.message}`); }
        if (opts.lang && lineLangs[li] === 'fa') fits = fits.filter(f => f.meter.id !== 'H');
        texts[li] = text; wholeFits[li] = fits;
        let mustazad = null;
        if (opts.lang && gLang === 'fa' && !(fits[0] && fits[0].c <= COST_MAX)) {   // Persian kalaam only
            mustazad = mustazadFit(Scan, text, ctx);
            if (mustazad) fits = [{ meter: mustazad.meter, c: mustazad.c }];
        }
        /* an Urdu girah inside Persian kalaam may be in another meter; a macaronic Urdu/Hindavi ghazal (Khusrau's
           Zehāl-e miskīn) alternates languages in one meter, so there every line votes */
        const voting = !opts.lang || gLang !== 'fa' || lineLangs[li] === gLang;
        const top = fits[0] || null;
        const scanned = !!top && top.c <= COST_MAX;
        const all = new Map();
        if (voting) fits.filter(f => f.c <= COST_MAX).forEach(f => { all.set(String(f.meter.id), f.c); idType.set(String(f.meter.id), f.meter.id); });
        if (voting) fitCost.push(all);
        if (scanned && voting) votes.set(String(top.meter.id), (votes.get(String(top.meter.id)) || 0) + 1);
        return Object.assign(opts.lang ? { lang: lineLangs[li] } : {}, {
            ur: l.ur,
            hi: l.hi,
            ro: NON_LATIN.test(l.ro || '') ? '' : l.ro,
            ascii: asciiFor(ctx, l.ro),
            meter_id: top ? top.meter.id : null,
            cost: top ? Number(top.c.toFixed(2)) : null,
            scanned
        }, mustazad ? { mustazad: mustazad.split } : {});
    });
    const nVoting = fitCost.length;
    /* A ghazal has one bahr. Paired meters (meters.json `paired`, e.g. 14/15 = maqtūʿ vs mahzūf ending) are one
       bahr, so they count as one family. The ghazal's meter is the family that FITS the most lines (every fit, not
       just each line's single cheapest one, which flips between overlapping meters); ties go to more top-fit votes,
       then lower mean cost. `meters` lists the family members that fit at least one line. */
    const seenIds = new Set(fitCost.flatMap(m => [...m.keys()]));
    /* Persian kalaam: a rubāʿī (four lines) mixes the rubāʿī patterns, so there R1–R12 are one family. Only there: grouped,
       the flexible rubāʿī patterns would soak up lines of an ordinary ghazal (the Ganjoor test set showed it). */
    const faG = opts.lang && gLang === 'fa';
    const rubai = [...seenIds].filter(k => /^R\d+$/.test(k));
    const isRubai = faG && (g.lines || []).length === 4;
    const familyOf = k => (isRubai && /^R\d+$/.test(k)) ? new Set(rubai) : new Set([k, ...(PAIRED.get(k) || [])]);
    const cands = [...seenIds].map(k => {
        const fam = familyOf(k);
        let cover = 0, costSum = 0;
        fitCost.forEach(m => { const hit = [...fam].filter(x => m.has(x)); if (hit.length) { cover++; costSum += Math.min(...hit.map(x => m.get(x))); } });
        const members = [...fam].filter(x => seenIds.has(x)).sort();
        return { key: members.join('+'), members, cover, mean: cover ? costSum / cover : Infinity, top: members.reduce((t, x) => t + (votes.get(x) || 0), 0) };
    });
    const uniq = [...new Map(cands.map(c => [c.key, c])).values()]
        /* on equal cover an Urdu meter beats a Persian-only one (F…), which is often the same rhythm with the final overlong
           syllable counted as two (F55 = #11 + one long, F31 = #9 + one long) */
        .sort((x, y) => y.cover - x.cover || (faG ? (x.key.startsWith('F') - y.key.startsWith('F')) : 0) || y.top - x.top || x.mean - y.mean);
    const best = uniq[0] || { members: [], cover: 0, top: 0 };
    const share = nVoting ? best.cover / nVoting : 0;
    const topShare = nVoting ? Math.max(0, ...uniq.map(c => c.top)) / nVoting : 0;
    const [topKey, topVotes] = [...votes.entries()].sort((x, y) => y[1] - x[1])[0] || [null, 0];
    const meters = (share >= CONFIDENT_SHARE || (opts.assignAlways && best.cover > 0)) ? best.members.map(k => idType.get(k)) : [];
    /* Persian kalaam, once its meter is known (the vote above is untouched), its lines as the app's reader scans them
       (scanCorpusLine): a mustazād ghazal (ctx.faMustazadGhazal, the reader's rule) has each Persian line that misses its meter
       as a whole scanned as meter + tail; a line that still misses, without a sung refrain (ctx.faScanFits `refrain`). Such a line
       then reports that fit. */
    let mustazadGhazal = false;
    if (faG && meters.length && ctx.faMustazadGhazal) {
        const fa = lines.map((_, li) => lineLangs[li] === 'fa');
        mustazadGhazal = ctx.faMustazadGhazal(Scan, texts.filter((_, li) => fa[li]), meters.map(String));
        const fam = new Set(meters.map(String).flatMap(k => [k, ...(PAIRED.get(k) || [])]));
        const report = (ln, f, extra) => Object.assign(ln, { meter_id: f.meter.id, cost: Number(f.c.toFixed(2)), scanned: f.c <= COST_MAX }, extra);
        lines.forEach((ln, li) => {
            if (!fa[li] || wholeFits[li].some(f => fam.has(String(f.meter.id)) && f.c <= 2)) return;
            let f = null;
            try { f = ctx.faScanFits(Scan, texts[li], Object.assign({ target: fam, refrain: true }, mustazadGhazal ? { mustazad: fam } : {})).find(x => fam.has(String(x.meter.id)) && x.c <= 2); } catch (e) {}
            if (f && (f.mustazad || f.refrain)) report(ln, f, f.refrain ? { refrain: f.refrain } : { mustazad: f.mustazad });
        });
    }
    return {
        id: g.id || (idx + 1),
        poet: g.poet,
        url: g.url || '',
        meters,
        ...(mustazadGhazal ? { mustazad: true } : {}),
        lines_count: lines.length,
        scan_pass_rate: Number(share.toFixed(2)),   // share of lines the ghazal's meter family fits
        meter_consensus: {
            top_meter_id: topKey === null ? null : idType.get(topKey),
            consensus_votes: topVotes,
            total_lines: nVoting,
            vote_breakdown: Object.fromEntries(votes),
            top_fit_share: Number(topShare.toFixed(2))   // the old rule: share of lines whose single best fit is in the family
        },
        lines
    };
}

module.exports = { root, loadEngine, scanGhazal, normalizeAscii, hintedUrdu, addTashdid, lineLang, PAIRED, mustazadFit };
