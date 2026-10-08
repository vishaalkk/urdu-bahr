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

function loadEngine(extraLex = '') {   // extraLex: lex(...) lines to try out, spliced in before the syllabifier
    const html = fs.readFileSync(process.env.URDU_BAHR_HTML || path.join(root, 'index.html'), 'utf8');   // env override: score against another build
    const a = html.indexOf("(function(root){\n'use strict';\n\n/* ---------- meters");
    const e = html.indexOf('})(this);', a) + '})(this);'.length;
    const mod = { exports: {} };
    let src = html.slice(a, e);
    if (extraLex) {
        const at = src.indexOf('/* ---------- syllabify a letter string');
        src = src.slice(0, at) + extraLex + '\n' + src.slice(at);
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
    const lines = (g.lines || []).map((l, li) => {
        let fits;
        try { fits = Scan.scanLine(ctx.rekhtaScanText(l.ur, l.ro)).fits || []; }
        catch (e) { fits = []; console.warn(`scanGhazal: the engine cannot read line ${li + 1} of ${g.url || g.id}: ${e.message}`); }
        if (opts.lang && lineLangs[li] === 'fa') fits = fits.filter(f => f.meter.id !== 'H');
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
        });
    });
    const nVoting = fitCost.length;
    /* A ghazal has one bahr. Paired meters (meters.json `paired`, e.g. 14/15 = maqtūʿ vs mahzūf ending) are one
       bahr, so they count as one family. The ghazal's meter is the family that FITS the most lines (every fit, not
       just each line's single cheapest one, which flips between overlapping meters); ties go to more top-fit votes,
       then lower mean cost. `meters` lists the family members that fit at least one line. */
    const familyOf = k => new Set([k, ...(PAIRED.get(k) || [])]);
    const seenIds = new Set(fitCost.flatMap(m => [...m.keys()]));
    const cands = [...seenIds].map(k => {
        const fam = familyOf(k);
        let cover = 0, costSum = 0;
        fitCost.forEach(m => { const hit = [...fam].filter(x => m.has(x)); if (hit.length) { cover++; costSum += Math.min(...hit.map(x => m.get(x))); } });
        const members = [...fam].filter(x => seenIds.has(x)).sort();
        return { key: members.join('+'), members, cover, mean: cover ? costSum / cover : Infinity, top: members.reduce((t, x) => t + (votes.get(x) || 0), 0) };
    });
    const uniq = [...new Map(cands.map(c => [c.key, c])).values()]
        .sort((x, y) => y.cover - x.cover || y.top - x.top || x.mean - y.mean);
    const best = uniq[0] || { members: [], cover: 0, top: 0 };
    const share = nVoting ? best.cover / nVoting : 0;
    const topShare = nVoting ? Math.max(0, ...uniq.map(c => c.top)) / nVoting : 0;
    const [topKey, topVotes] = [...votes.entries()].sort((x, y) => y[1] - x[1])[0] || [null, 0];
    return {
        id: g.id || (idx + 1),
        poet: g.poet,
        url: g.url || '',
        meters: (share >= CONFIDENT_SHARE || (opts.assignAlways && best.cover > 0)) ? best.members.map(k => idType.get(k)) : [],
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

module.exports = { root, loadEngine, scanGhazal, normalizeAscii, hintedUrdu, addTashdid, lineLang, PAIRED };
