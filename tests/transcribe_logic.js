// Transcribe (#/lab/transcribe, src/js/24-transcribe.js): the pure logic, run on the built page.
//   - a typed line comes out as Scan's own pipeline (lineScripts) reads it: Transcribe adds review, never a second reading
//   - a word's tier is the one casualRomanLine's own chain reports (casualPiece), so the two cannot drift
//   - corrections and the Persian list change only the words they name
//
// Run: node tests/transcribe_logic.js
const fs = require('fs'), path = require('path'), vm = require('vm');
// the whole built page, run with a DOM stub rich enough that its top level (script mode, router) runs to the end
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const scripts = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
const domStore = {};
const elBase = id => ({ id, classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, querySelectorAll: () => [], querySelector: () => null,
    textContent: '', innerHTML: '', value: '', style: {}, children: [], dataset: {} });
const makeElement = id => new Proxy(elBase(id), { get: (t, k) => (k in t || typeof k === 'symbol') ? t[k] : () => null, set: (t, k, v) => { t[k] = v; return true; } });   // any method it is asked for is a no-op
const el = id => domStore[id] || (domStore[id] = makeElement(id));
const ctx = {
    window: {}, document: { getElementById: el, querySelectorAll: () => [], querySelector: s => makeElement(s), addEventListener() {}, documentElement: makeElement('html') },
    $: el, console: { log() {}, warn() {}, error() {} }, setTimeout: fn => { fn(); return 1; }, clearTimeout() {}, setInterval() {}, clearInterval() {},
    AudioContext: function () { return {}; }, localStorage: { getItem: () => null, setItem() {}, removeItem() {} }
};   // (the Pue parsers log every character they cannot read: console is muted)
vm.createContext(ctx);
scripts.slice(0, 2).forEach(s => vm.runInContext(s.replace(/<\/?script[^>]*>/gi, ''), ctx));
const run = c => vm.runInContext(c, ctx);
const J = JSON.stringify;
let bad = 0;
const ok = (c, m) => { if (!c) { bad++; console.log('FAIL: ' + m); } };
const build = (t, o) => run(`trBuild(${J(t)}, ${J(o || {})})`);

// 1. same reading as Scan for typed lines
const LINES = ['dil-e nadan tujhe hua kya hai', 'aakhir is dard ki dava kya hai', 'hum hain mushtaaq aur vo bezaar', 'ya ilaahi ye maajra kya hai',
    'dard o gham ki baat', 'tu kuja o man kuja', 'ishq par zor nahin hai ye vo aatish ghalib'];
let same = 0;
LINES.forEach(l => {
    const want = run(`lineScripts(${J(l)}, { skipKnown: true })`), got = build(l).lines[0];
    if (got.verified || (got.out.ro === want.ro && got.out.ur === want.ur && got.out.hi === want.hi)) same++;
    else console.log('  differs from Scan:', l, '\n    scan :', want.ro, '|', want.ur, '\n    here :', got.out.ro, '|', got.out.ur);
});
ok(same === LINES.length, `Transcribe agrees with Scan on ${same}/${LINES.length} lines`);

// 2. tiers come from casualPiece
const pc = (w, i, h) => run(`casualPiece(${J(w)}, ${i}, ${h}, '', '')`).tier;
ok(pc('ishq', 0, false) === 'known', 'ishq is known');
ok(pc('makhfiya', 0, false) === 'guess', 'makhfiya is a guess');
ok(pc('ʿālam', 0, false) === 'typed', 'a marked word is typed');
ok(pc('e', 1, true) === 'conn', 'e after a hyphen is a joiner');
const m1 = build('raazdaar-e-kunto makhfiya');
ok(m1.lines[0].words.length === 2, 'two words');
ok(m1.lines[0].words[0].pieces.length === 3, 'a hyphenated word keeps its pieces: ' + m1.lines[0].words[0].pieces.map(p => p.src));
ok(m1.stats.words === 2, 'stats count words');

// 3. a standalone o / e joins its neighbours, as Scan's pipeline does
ok(build('dard o gham ki baat').lines[0].words.length === 3, 'dard o gham is one word');
ok(build('dil e nadan').lines[0].words.length === 2, 'dil e is one word');

// 4. punctuation stays out of the lookup and comes back
const m4 = build('ishq, gham.');
ok(/^ʿishq,/.test(m4.lines[0].out.ro) && /ġham\.$/.test(m4.lines[0].out.ro), 'punctuation kept: ' + m4.lines[0].out.ro);
ok(m4.lines[0].words[0].tier !== 'guess', 'a comma does not turn a known word into a guess');
ok(m4.lines[0].out.ur.includes('،'), 'Urdu comma');

// 5. corrections apply to every occurrence of a spelling, and only those
const base = build('makhfiya hai\nmakhfiya');
const fixed = build('makhfiya hai\nmakhfiya', { choices: { makhfiya: { t: 'a', a: 'makhfii;yaa' } } });
ok(fixed.lines[0].words[0].tier === 'you' && fixed.lines[1].words[0].tier === 'you', 'correction applies on both lines');
ok(fixed.lines[0].words[1].out.ro === base.lines[0].words[1].out.ro, 'other words are untouched');
ok(fixed.lines[0].words[0].out.ro !== base.lines[0].words[0].out.ro, 'the corrected word changed');

// 6. the Persian list fills a word the Urdu lists do not know
const g = build('kunto').lines[0].words[0];
ok(g.tier === 'persian' && /kunto/.test(g.out.ro), 'Persian list fills a word the Urdu lists lack: ' + g.tier + ' ' + g.out.ro);
ok(build('aalam').lines[0].words[0].tier === 'known', 'Urdu list answers first');
ok(run(`trFaRo('kHurshīdam', 'خورشیدم')`) === 'ḳhurshīdam', 'Persian spellings use Pritchett marks');
ok(run(`trFaRo('shā.ir', 'شاعر')`) === 'shāʿir' && run(`trFaRo('jā.e', 'جائے')`) === 'jāʾe', 'dots become ʿ or ʾ by the Urdu spelling');

// 7. candidates: the reading now first, no duplicates
const cands = run(`(function(){ var m = trBuild('makhfiya'); var p = m.lines[0].words[0].pieces[0]; return trCands(p, p.def); })()`);
ok(cands.length >= 2 && cands[0].isDefault, 'default candidate first');
ok(new Set(cands.map(x => x.ro)).size === cands.length, 'candidates are distinct');

// 8. Urdu-script input
const m5 = build('دل ناداں تجھے ہوا کیا ہے');
ok(m5.lines[0].words.length === 6 && m5.lines[0].out.ur === 'دل ناداں تجھے ہوا کیا ہے', 'Urdu script kept as typed');
ok(/dil/.test(m5.lines[0].out.ro), 'Urdu script gets a Roman reading: ' + m5.lines[0].out.ro);

// 8b. Fārsī script out: Urdu letters in Persian orthography; Persian script in reads with the Persian list and splits at ZWNJ
ok(build('دل ناداں').lines[0].out.fa === 'دل نادان', 'Fārsī output: ں → ن: ' + build('دل ناداں').lines[0].out.fa);
ok(!/[ہےں]/.test(build('dil hai').lines[0].out.fa), 'Roman in, Fārsī out has no Urdu-only letters: ' + build('dil hai').lines[0].out.fa);
const zw = build('دل\u200cها').lines[0].words[0];
ok(zw.pieces.length === 2 && zw.out.ur.includes('\u200c'), 'a ZWNJ compound keeps two pieces and the joiner');
ok(build('کجا').lines[0].out.ro === 'kujā', 'Persian script in → Roman: ' + build('کجا').lines[0].out.ro);
ok(build('tū').lines[0].out.ur === 'تو' && build('tū').lines[0].out.hi.length > 0, 'diacritic Roman in → Urdu and Devanagari');

// 10. Classical alif maqsura: kubra -> کبریٰ, and Arabic script برزخ کبریٰ -> barzaḳh kubrā
const bKubra = build('barzakh kubra');
ok(bKubra.lines[0].out.ur === 'برزخ کبریٰ', 'kubra gets alif maqsura: ' + bKubra.lines[0].out.ur);
const bAr = build('برزخ کبریٰ');
ok(/barzaḳh\s+kubrā/.test(bAr.lines[0].out.ro), 'Arabic script کبریٰ reads as kubrā: ' + bAr.lines[0].out.ro);
ok(!/kbrīā/.test(bAr.lines[0].out.ro) && !/कबरीा/.test(bAr.lines[0].out.hi), 'no broken kbrīā or double matra in Devanagari');

// 11. Persian context and suffix decomposition: tū kujā-o-man kujā zikrat kujā
const bFa = build('tū kujā-o-man kujā zikrat kujā');
ok(bFa.lines[0].out.ur === 'تو کجا و من کجا ذکرت کجا', 'Farsi verse properly resolved: ' + bFa.lines[0].out.ur);
ok(bFa.stats.guess === 0, 'no guesses in verified Persian verse: ' + JSON.stringify(bFa.stats));
const zik = bFa.lines[0].words[3];
ok(zik.tier === 'persian' && zik.out.ur === 'ذکرت', 'zikrat decomposed to ذکرت with tier persian: ' + zik.tier + ' ' + zik.out.ur);
const pMan = bFa.lines[0].words[1].pieces[2];
const cMan = run(`trCands(${J(pMan)}, ${J(pMan.def)}, 'fa')`);
ok(cMan[0].ur === 'من' && !cMan.some(c => c.ur === 'ماں'), 'Persian context suppresses Urdu ماں for man');
const pKuja = bFa.lines[0].words[1].pieces[0];
const cKuja = run(`trCands(${J(pKuja)}, ${J(pKuja.def)}, 'fa')`);
// 12. Candidate deduplication and compound piece filtering
const mAql = build('Aql awwal');
const pAql = mAql.lines[0].words[0].pieces[0];
const cAql = run(`trCands(${J(pAql)}, ${J(pAql.def)}, 'ur')`);
ok(cAql.length === 1 && cAql[0].ur === 'عقل', 'Aql has single deduplicated candidate: ' + cAql.map(c => c.ro));

// man in Persian does not suggest maan
ok(cMan.length === 1 && cMan[0].ur === 'من', 'man in Persian matches only من, no maan: ' + cMan.map(c => c.ro));

// compound word with one ambiguous piece only shows the piece with choices
const mShah = build('allâh allâh nisbat-e shah-o-gadā');
const wShah = mShah.lines[0].words[3];
const edShah = run(`trEditHtml(${J(wShah)}, 'ur')`);
ok(edShah.includes('shah') && !edShah.includes('tr-edit-src">gadā'), 'compound edit drawer shows ambiguous shah and omits unambiguous gada: ' + edShah);

// 13. Intelligent Underlines: unambiguous words are clean; words with choices are flagged
ok(!mAql.lines[0].words[0].needsCheck && !mAql.lines[0].words[1].needsCheck, 'Aql and awwal have no underline at rest');
ok(!mShah.lines[0].words[2].needsCheck, 'nisbat-e has no underline at rest');
ok(wShah.needsCheck, 'shah-o-gadā is flagged because shah has choices');
const htmlAql = run(`trWordHtml(${J(mAql.lines[0].words[0])}, 0, 0, 'ro')`);
ok(!htmlAql.includes('tr-t-choice') && !htmlAql.includes('tr-t-guess'), 'Aql button has no underline class at rest: ' + htmlAql);

// 14. Circumflex and casual aliases
ok(mShah.lines[0].out.ro.includes('allâh') && !mShah.lines[0].out.ro.includes('allh'), 'allâh preserves circumflex and is not mangled to allh: ' + mShah.lines[0].out.ro);
const mHum = build('hum padi');
ok(mHum.lines[0].out.ur === 'ہم پڑی' && mHum.lines[0].words[0].tier === 'known', 'casual aliases hum and padi resolved: ' + mHum.lines[0].out.ur);

// 15. Persian morphological compound decomposition (prefix + stem + enclitic copula/suffix)
const mGarchiFa = build('Garchi man naalaaiqam lekin huzoor', { lang: 'fa' });
ok(mGarchiFa.lines[0].out.fa === 'گرچه من نالایقم لیکن حضور', 'Garchi verse in Persian: ' + mGarchiFa.lines[0].out.fa);
ok(mGarchiFa.lines[0].out.ro.includes('nā-lāyiq-am'), 'hyphenated morphemes in Roman: ' + mGarchiFa.lines[0].out.ro);
const wNa = mGarchiFa.lines[0].words[2];
ok(wNa.tier === 'persian', 'naalaaiqam resolved as persian tier: ' + wNa.tier);
const mGarchiUr = build('Garchi man naalaaiqam lekin huzoor');
ok(mGarchiUr.lines[0].out.ur === 'گرچہ من نالائقم لیکن حضور', 'Garchi verse in Urdu: ' + mGarchiUr.lines[0].out.ur);

console.log(bad ? `${bad} FAILED` : 'transcribe logic: all checks passed');
process.exit(bad ? 1 : 0);
