// Persian verb forms for the Persian engine (ScanFa): a verb written as one word with its prefix and ending (بنماید be-namāyad,
// نداند na-dānad, مشکن ma-shikan, نپیچم na-pīcham) is a word the engine has never seen, and its letter guess loses the short
// prefix vowel. Generated here from the common classical verbs (present and past stems; stem list checked against the
// University of Texas Persian verb pages), in Urdu script as Sufinama writes Persian, with classical lengths: the prefixes
// be-, na-, ma- short; mī- is written as its own word (می) and so is not generated. Used by scripts/build_fa_scan.js:
// add-only, where neither the engine nor the readings learned from Sufinama already give the Roman's lengths.
'use strict';

/* [present stem, its Roman, past stem, its Roman]; a present stem ending in a vowel takes ی before a vowel ending (نمای) */
const VERBS = [
    ['کن', 'kun', 'کرد', 'kard'], ['شو', 'shav', 'شد', 'shud'], ['دہ', 'deh', 'داد', 'dād'], ['دار', 'dār', 'داشت', 'dāsht'],
    ['رو', 'rav', 'رفت', 'raft'], ['گو', 'gū', 'گفت', 'guft'], ['بین', 'bīn', 'دید', 'dīd'], ['نما', 'namā', 'نمود', 'namūd'],
    ['دان', 'dān', 'دانست', 'dānist'], ['توان', 'tavān', 'توانست', 'tavānist'], ['خواہ', 'ḳhāh', 'خواست', 'ḳhāst'],
    ['سوز', 'sūz', 'سوخت', 'sūḳht'], ['ساز', 'sāz', 'ساخت', 'sāḳht'], ['بند', 'band', 'بست', 'bast'],
    ['نشین', 'nishīn', 'نشست', 'nishast'], ['گیر', 'gīr', 'گرفت', 'girift'], ['بر', 'bar', 'برد', 'burd'],
    ['آور', 'āvar', 'آورد', 'āvard'], ['زن', 'zan', 'زد', 'zad'], ['کش', 'kush', 'کشت', 'kusht'], ['نہ', 'neh', 'نہاد', 'nihād'],
    ['رس', 'ras', 'رسید', 'rasīd'], ['پرس', 'purs', 'پرسید', 'pursīd'], ['گرد', 'gard', 'گشت', 'gasht'],
    ['نوش', 'nūsh', 'نوشید', 'nūshīd'], ['پیچ', 'pīch', 'پیچید', 'pīchīd'], ['افگن', 'afgan', 'افگند', 'afgand'],
    ['شکن', 'shikan', 'شکست', 'shikast'], ['یاب', 'yāb', 'یافت', 'yāft'], ['جو', 'jū', 'جست', 'just'],
    ['پوش', 'pūsh', 'پوشید', 'pūshīd'], ['خند', 'ḳhand', 'خندید', 'ḳhandīd'], ['ریز', 'rīz', 'ریخت', 'rīḳht'],
    ['مان', 'mān', 'ماند', 'mānd'], ['ران', 'rān', 'راند', 'rānd'], ['گذار', 'guzār', 'گذاشت', 'guzāsht'],
    ['فرما', 'farmā', 'فرمود', 'farmūd'], ['گشا', 'gushā', 'گشاد', 'gushād'], ['ربا', 'rubā', 'ربود', 'rubūd'],
    ['کشا', 'kushā', 'کشاد', 'kushād'], ['نال', 'nāl', 'نالید', 'nālīd'], ['باش', 'bāsh', 'بود', 'būd'],
    ['میر', 'mīr', 'مرد', 'murd'], ['پذیر', 'pazīr', 'پذیرفت', 'pazīruft'], ['سپار', 'supār', 'سپرد', 'supurd'],
    ['فروش', 'furūsh', 'فروخت', 'furūḳht'], ['خر', 'ḳhar', 'خرید', 'ḳharīd'], ['شناس', 'shinās', 'شناخت', 'shināḳht'],
    ['ترس', 'tars', 'ترسید', 'tarsīd'], ['بخش', 'baḳhsh', 'بخشید', 'baḳhshīd'], ['پرور', 'parvar', 'پرورد', 'parvard'],
    ['آموز', 'āmoz', 'آموخت', 'āmoḳht'], ['افروز', 'afroz', 'افروخت', 'afroḳht'], ['دوز', 'doz', 'دوخت', 'doḳht'],
    ['کوش', 'kosh', 'کوشید', 'koshīd'], ['خسپ', 'ḳhusp', 'خفت', 'ḳhuft'], ['گریز', 'gurez', 'گریخت', 'gureḳht'],
    ['آمیز', 'āmez', 'آمیخت', 'āmeḳht'], ['انداز', 'andāz', 'انداخت', 'andāḳht'], ['افت', 'uft', 'افتاد', 'uftād'],
];
const PRESENT_ENDINGS = [['', ''], ['م', 'am'], ['ی', 'ī'], ['د', 'ad'], ['یم', 'īm'], ['ید', 'īd'], ['ند', 'and']];
const PAST_ENDINGS = [['', ''], ['م', 'am'], ['ی', 'ī'], ['یم', 'īm'], ['ید', 'īd'], ['ند', 'and']];
const VOWEL_ENDINGS = { 'م': ['یم', 'yam'], 'ی': ['ئی', 'ī'], 'د': ['ید', 'yad'], 'یم': ['ئیم', 'īm'], 'ید': ['ئید', 'īd'], 'ند': ['یند', 'yand'] };
const PREFIXES = [['', ''], ['ب', 'ba-'], ['ن', 'na-'], ['م', 'ma-']];   // Sufinama's spelling: ba-deh, na-dehī, ma-shikan

/* -> [[urdu word, roman]] */
function verbForms() {
    const out = [];
    for (const [pu, pr, su, sr] of VERBS) {
        const vowelStem = /[او]$/.test(pu) && !/^(رو|شو)$/.test(pu);   // نما gushā: -yad; رو shav, دہ deh: consonant (rav-ad, deh-ad)
        for (const [xu, xr] of PREFIXES) {
            for (const [eu, er] of PRESENT_ENDINGS) {
                if (xu === 'م' && eu) continue;   // ma- is the imperative only
                let [u, r] = [eu, er];
                if (eu && vowelStem) [u, r] = VOWEL_ENDINGS[eu];
                out.push([xu + pu + u, xr + pr + r]);
            }
            if (xu === 'ب' || xu === 'م') continue;   // the past takes na- only
            for (const [eu, er] of PAST_ENDINGS) out.push([xu + su + eu, xr + sr + er]);
        }
    }
    return out.filter(([u]) => u.length > 1);
}

/* the generated verbs' clean Roman → Devanagari (only this alphabet: no general Roman converter exists, and Sufinama's own
   Devanagari for words it shows always wins over this) */
const DV_CONS = [['ḳh', 'ख़'], ['sh', 'श'], ['ch', 'च'], ['zh', 'झ़'], ['gh', 'ग़'], ['b', 'ब'], ['p', 'प'], ['t', 'त'], ['j', 'ज'],
    ['d', 'द'], ['r', 'र'], ['z', 'ज़'], ['s', 'स'], ['f', 'फ़'], ['q', 'क़'], ['k', 'क'], ['g', 'ग'], ['l', 'ल'], ['m', 'म'],
    ['n', 'न'], ['v', 'व'], ['h', 'ह'], ['y', 'य']];
const DV_VOW = [['ā', 'आ', 'ा'], ['ī', 'ई', 'ी'], ['ū', 'ऊ', 'ू'], ['e', 'ए', 'े'], ['o', 'ओ', 'ो'], ['a', 'अ', ''], ['i', 'इ', 'ि'], ['u', 'उ', 'ु']];
function toDevanagari(ro) {
    let s = ro.replace(/-/g, ''), out = '', prevCons = false;
    while (s) {
        const v = DV_VOW.find(([r]) => s.startsWith(r));
        if (v) { out += prevCons ? v[2] : v[1]; prevCons = false; s = s.slice(v[0].length); continue; }
        const c = DV_CONS.find(([r]) => s.startsWith(r));
        if (!c) return '';
        if (prevCons) out += '्';
        out += c[1]; prevCons = true; s = s.slice(c[0].length);
    }
    return out;
}

/* {engine key: options} for the generated forms the engine and `known` (learned readings) do not already read right */
function verbLex(Scan, known, romanWeights, rankReadings) {
    const lex = {};
    for (const [u, r] of verbForms()) {
        let key;
        try { key = Scan.scanWord(u).key; } catch (e) { continue; }
        if (known[key] || lex[key]) continue;
        const ws = romanWeights(r);
        if (!ws) continue;
        let ranked = rankReadings(Scan, u, ws);
        if (!ranked) {
            /* the engine has the verb's reading, but maybe only at a cost (رود: rūd "river" first, ravad "goes" at 2): a verb
               form is certain, so its reading costs 0 and the others keep theirs */
            const opts = Scan.scanWord(u).opts.map(o => ({ w: o.syl.map(x => x.w), c: +o.c.toFixed(2) }));
            const hit = opts.find(o => o.w.length === ws.length && o.w.every((w, i) => w === 'x' || w === ws[i]));
            if (!hit || hit.c === 0) continue;
            hit.c = 0;
            ranked = opts;
        }
        lex[key] = ranked;
    }
    return lex;
}

module.exports = { VERBS, verbForms, verbLex, toDevanagari };
