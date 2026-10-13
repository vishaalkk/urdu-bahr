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

// 16. g <-> gh cross suggestions and morphological decomposition preservation
const cG = run(`(function(){ var m = trBuild('gareebaan'); var p = m.lines[0].words[0].pieces[0]; return trCands(p, p.def); })()`);
ok(cG.some(c => c.ur === 'غریباں'), 'gareebaan offers gh-alternate ġharībāñ: ' + cG.map(c => c.ro));
const cGh = run(`(function(){ var m = trBuild('ghareebaan'); var p = m.lines[0].words[0].pieces[0]; return trCands(p, p.def); })()`);
ok(cGh.some(c => c.ur === 'گریباں'), 'ghareebaan offers g-alternate garebāñ: ' + cGh.map(c => c.ro));
const cBashar = run(`(function(){ var m = trBuild('bashar'); var p = m.lines[0].words[0].pieces[0]; return trCands(p, p.def); })()`);
const cDecomp = cBashar.find(c => c.ro === 'ba-sharʿ');
ok(cDecomp && cDecomp.fixed && cDecomp.fixed.decomp && cDecomp.fixed.decomp.stemUr === 'شرع', 'ba-shar candidate preserves decomp with stemUr شرع');

// 17. Scan lineScripts parity and generalized phonetic confusions
const scNa = run(`lineScripts('naalaaiqam')`);
ok(scNa.ur === 'نالائقم' && scNa.ro === 'nālāʾiqam', 'Scan lineScripts resolves naalaaiqam to نالائقم: ' + scNa.ur);
const scNaLaiq = run(`lineScripts('na-laiq')`);
ok(scNaLaiq.ur === 'نا لائق' && scNaLaiq.ro === 'nā-lāʾiq', 'Scan lineScripts resolves na-laiq to نا لائق: ' + scNaLaiq.ur);
const scFaida = run(`lineScripts('faida')`);
ok(scFaida.ur === 'فائدہ' && scFaida.ro === 'fāʾidah', 'Scan lineScripts resolves faida to فائدہ: ' + scFaida.ur);

const cKis = run(`(function(){ var m = trBuild('kismat'); var p = m.lines[0].words[0].pieces[0]; return trCands(p, p.def); })()`);
ok(cKis.some(c => c.ur === 'قسمت'), 'kismat offers k<->q alternate qismat (قسمت): ' + cKis.map(c => c.ro));
const cIshk = run(`(function(){ var m = trBuild('ishk'); var p = m.lines[0].words[0].pieces[0]; return trCands(p, p.def); })()`);
ok(cIshk.some(c => c.ur === 'عشق'), 'ishk offers k<->q alternate ʿishq (عشق): ' + cIshk.map(c => c.ro));

// 18. Compound dictionary definition lookup and morphology banner
const zlib = require('zlib');
const rawDict = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(__dirname, '..', 'data', 'dictionary_bundle.json.gz'))));
run(`DICT_STORE.initEntries(${J(rawDict)}); DICT_STORE.status = 'ready';`);
const dHtml = run(`(function(){ var m = trBuild('naalaaiqam'); var w = m.lines[0].words[0]; return trDictSectionHtml(w, w.pieces[0]); })()`);
ok(dHtml.includes('Improper, unsuitable, unfit, unworthy'), 'naalaaiqam shows Steingass definition for na-laiq, not just laiq: ' + dHtml);
ok(dHtml.includes('nā (prefix) + lāʾiq (لائق) + -am (suffix)'), 'naalaaiqam shows complete morphology breakdown: ' + dHtml);
// 19. Persian hast-am transliteration (ہستم / هستم, not ہست عام) and dictionary lookup
const scHast = run(`lineScripts('hast-am')`);
ok(scHast.ur === 'ہستم', 'Scan lineScripts resolves hast-am to ہستم: ' + scHast.ur);
const bHast = build('hast-am');
ok(bHast.lines[0].out.ur === 'ہستم' && !bHast.lines[0].out.ur.includes('عام'), 'hast-am transliterates to ہستم without عام: ' + bHast.lines[0].out.ur);
const bHastFa = build('hast-am', { lang: 'fa' });
ok(bHastFa.lines[0].out.fa === 'هستم', 'hast-am in Persian script transliterates to هستم: ' + bHastFa.lines[0].out.fa);
const dHast = run(`(function(){ var w = trBuild('hast-am').lines[0].words[0]; return trDictSectionHtml(w, w.pieces[0]); })()`);
ok(dHast.includes('Existence, being'), 'hast-am shows Steingass Persian definition for hast: ' + dHast);
ok(dHast.includes('hast (ہست) + -am (suffix)'), 'hast-am shows morphology banner: ' + dHast);

// 20. Persian -ee / -i / -ī conjugations (farmooda-ee, farmuda-i) and stem dictionary definition
const bFarm = build('farmooda-ee');
ok(bFarm.lines[0].out.ur === 'فرمودہ‌ئی', 'farmooda-ee transliterates to فرمودہ‌ئی: ' + bFarm.lines[0].out.ur);
const bFarmFa = build('farmooda-ee', { lang: 'fa' });
ok(bFarmFa.lines[0].out.fa === 'فرموده‌ای', 'farmooda-ee in Persian script transliterates to فرموده‌ای: ' + bFarmFa.lines[0].out.fa);
const bFarmI = build('farmuda-i');
ok(bFarmI.lines[0].out.ur === 'فرمودہ‌ئی', 'farmuda-i transliterates to فرمودہ‌ئی: ' + bFarmI.lines[0].out.ur);
const dFarm = run(`(function(){ var w = trBuild('farmooda-ee').lines[0].words[0]; return trDictSectionHtml(w, w.pieces[0]); })()`);
ok(dFarm.includes('Ordered, commanded; said'), 'farmooda-ee shows Steingass definition for farmuda, not -i: ' + dFarm);
ok(!dFarm.includes('first letter of the Arabic'), 'farmooda-ee does not show Alif definition: ' + dFarm);
ok(dFarm.includes('farmūda (فرمودہ) + -ī (suffix)'), 'farmooda-ee shows morphology breakdown: ' + dFarm);
const dFarmI = run(`(function(){ var w = trBuild('farmuda-i').lines[0].words[0]; return trDictSectionHtml(w, w.pieces[0]); })()`);
ok(dFarmI.includes('Ordered, commanded; said'), 'farmuda-i shows Steingass definition for farmuda, not -i: ' + dFarmI);
ok(!dFarmI.includes('first letter of the Arabic'), 'farmuda-i does not show Alif definition: ' + dFarmI);

// 21. Compound dictionary lookup & interactive multi-word tabs (jamal-e-yak)
const bJamal = build('jamal-e-yak');
ok(bJamal.lines[0].out.ur === 'جمالِ یک', 'jamal-e-yak transliterates with space to جمالِ یک: ' + bJamal.lines[0].out.ur);
const bJamalFa = build('jamal-e-yak', { lang: 'fa' });
ok(bJamalFa.lines[0].out.fa === 'جمالِ یک', 'jamal-e-yak in Persian mode transliterates to جمالِ یک: ' + bJamalFa.lines[0].out.fa);
run(`TR.dictTarget = null;`);
const wJamal = bJamal.lines[0].words[0];
const dJamal = run(`(function(){ var w = trBuild('jamal-e-yak').lines[0].words[0]; return trDictSectionHtml(w, w.pieces[0]); })()`);
ok(dJamal.includes('Beauty') || dJamal.includes('beauty'), 'jamal-e-yak defaults to headword jamal: ' + dJamal);
ok(dJamal.includes('tr-dict-tabs'), 'jamal-e-yak has interactive multi-word tabs: ' + dJamal);
ok(dJamal.includes('جمال (jamāl)') && dJamal.includes('یک (yak)'), 'tabs include both jamal and yak: ' + dJamal);
// Switch tab to piece 2 (yak)
run(`TR.dictTarget = '2';`);
const dYak = run(`(function(){ var w = trBuild('jamal-e-yak').lines[0].words[0]; return trDictSectionHtml(w, w.pieces[0]); })()`);
ok(dYak.includes('One, everyone') || dYak.includes('one'), 'switching to yak tab shows yak definition: ' + dYak);
run(`TR.dictTarget = null;`);

// 22. Conjunction compounds: dard-o-gham
const bDard = build('dard-o-gham');
ok(bDard.lines[0].out.ur === 'درد و غم', 'dard-o-gham transliterates to درد و غم: ' + bDard.lines[0].out.ur);
ok(bDard.lines[0].out.fa === 'درد و غم', 'dard-o-gham in Farsi transliterates to درد و غم: ' + bDard.lines[0].out.fa);
const scDard = run(`lineScripts('dard-o-gham')`);
ok(scDard.ur === 'درد و غم', 'Scan lineScripts resolves dard-o-gham to درد و غم: ' + scDard.ur);

// 23. Ba variations across scripts: ba, bah, baa, bā
const bBaKhuda = build('ba-khuda');
ok(bBaKhuda.lines[0].out.ur === 'با خدا' || bBaKhuda.lines[0].out.ur === 'بہ خدا', 'ba-khuda resolves: ' + bBaKhuda.lines[0].out.ur);
const bBahKhuda = build('bah-khuda');
ok(bBahKhuda.lines[0].out.ur === 'بہ خدا', 'bah-khuda resolves to بہ خدا: ' + bBahKhuda.lines[0].out.ur);
const bBaaKhuda = build('baa-khuda');
ok(bBaaKhuda.lines[0].out.ur === 'با خدا', 'baa-khuda resolves to با خدا: ' + bBaaKhuda.lines[0].out.ur);
const bManBaFa = build('man ba-khuda guftam', { lang: 'fa' });
ok(bManBaFa.lines[0].out.fa === 'من به خدا گفتم', 'man ba-khuda guftam in Persian has proper spaces: ' + bManBaFa.lines[0].out.fa);

// 24. Ba candidate alternatives across all inputs
['ba', 'bah', 'baa'].forEach(bWord => {
  const cands = run(`(function(){ var m = trBuild(${J(bWord)}); var p = m.lines[0].words[0].pieces[0]; return trCands(p, p.def, 'fa'); })()`);
  ok(cands.some(c => c.ur === 'به' || c.ur === 'بہ') && cands.some(c => c.ur === 'با'), bWord + ' offers both ba (به) and bā (با) candidates: ' + cands.map(c => c.ro + ':' + c.ur));
});

// 25. harchand transliteration and dictionary lookup (har-ćand)
const bHarchand = build('harchand');
ok(bHarchand.lines[0].out.ur === 'ہر چند', 'harchand transliterates to ہر چند: ' + bHarchand.lines[0].out.ur);
const bHarChand = build('har-chand');
ok(bHarChand.lines[0].out.ur === 'ہر چند', 'har-chand transliterates to ہر چند: ' + bHarChand.lines[0].out.ur);
const dHarchand = run(`(function(){ var w = trBuild('harchand').lines[0].words[0]; return trDictSectionHtml(w, w.pieces[0]); })()`);
ok(dHarchand.includes('har-ćand') || dHarchand.includes('har chand') || dHarchand.includes('How much soever') || dHarchand.includes('See s.v. har'), 'harchand finds Platts har-ćand entry: ' + dHarchand);

// 26. Casual Roman guttural vowel fronting: tehreer -> taḥrīr, tehqeeq -> taḥqīq, mehfil -> maḥfil, rehmat -> raḥmat, shehar -> shahr
const bTehreer = build('tehreer');
ok(bTehreer.lines[0].out.ur === 'تحریر', 'tehreer transliterates to تحریر: ' + bTehreer.lines[0].out.ur);
ok(bTehreer.lines[0].words[0].pieces[0].tier === 'known', 'tehreer is tier known: ' + bTehreer.lines[0].words[0].pieces[0].tier);
const bTehqeeq = build('tehqeeq');
ok(bTehqeeq.lines[0].out.ur === 'تحقیق', 'tehqeeq transliterates to تحقیق: ' + bTehqeeq.lines[0].out.ur);
const bMehfil = build('mehfil');
ok(bMehfil.lines[0].out.ur === 'محفل', 'mehfil transliterates to محفل: ' + bMehfil.lines[0].out.ur);
const bRehmat = build('rehmat');
ok(bRehmat.lines[0].out.ur === 'رحمت', 'rehmat transliterates to رحمت: ' + bRehmat.lines[0].out.ur);
const bShehar = build('shehar');
ok(bShehar.lines[0].out.ur === 'شہر', 'shehar transliterates to شہر: ' + bShehar.lines[0].out.ur);

// 27. aap dictionary lookup: substantive Hindi pronoun precedes Sanskrit water stub
const dAap = run(`(function(){ var w = trBuild('aap').lines[0].words[0]; return trDictSectionHtml(w, w.pieces[0]); })()`);
ok(dAap.includes('Self, himself, oneself') || dAap.includes('Self'), 'aap displays pronoun definition: ' + dAap);

// 28. ab transliteration and dictionary lookup: retains short vowel and Hindi "now" definition
const bAbFa = build('ab', { lang: 'fa' });
ok(bAbFa.lines[0].out.ur === 'اب' && bAbFa.lines[0].out.fa === 'اب', 'ab in Persian mode stays اب, not āb (آب): ' + bAbFa.lines[0].out.fa);
const dAb = run(`(function(){ var w = trBuild('ab').lines[0].words[0]; return trDictSectionHtml(w, w.pieces[0]); })()`);
ok(dAb.includes('Now, presently') || dAb.includes('Now'), 'ab displays "Now" definition: ' + dAb);

// 29. Urdu vowel-stem future verb morphology (basaaungaa, sajaaoonga, chhuraaoonga)
const bBasa = build('basaaungaa');
ok(bBasa.lines[0].out.ur.includes('بسا') && bBasa.lines[0].out.ur.includes('گا'), 'basaaungaa transliterates to بساؤں گا: ' + bBasa.lines[0].out.ur);
ok(!bBasa.lines[0].out.ur.includes('بسانگا'), 'basaaungaa does not produce incorrect بسانگا: ' + bBasa.lines[0].out.ur);
const bSaja = build('sajaaoonga');
ok(bSaja.lines[0].out.ur.includes('سجا') && bSaja.lines[0].out.ur.includes('گا'), 'sajaaoonga transliterates to سجاؤں گا: ' + bSaja.lines[0].out.ur);
const bChhura = build('chhuraaoonga');
ok(bChhura.lines[0].out.ur.includes('چھڑ') && bChhura.lines[0].out.ur.includes('گا'), 'chhuraaoonga transliterates to چھڑاؤں گا: ' + bChhura.lines[0].out.ur);

// 30. samt (سمت) dictionary lookup: prioritizes direction (Arabic/Persian samt) over Sanskrit sam-mat
const dSamt = run(`(function(){ var w = trBuild('samt').lines[0].words[0]; return trDictSectionHtml(w, w.pieces[0]); })()`);
ok(dSamt.includes('direction') || dSamt.includes('Course, road, way') || dSamt.includes('Travelling'), 'samt displays direction definition: ' + dSamt);
ok(!dSamt.includes('Of one mind, of the same opinion'), 'samt does not display Sanskrit sam-mat first: ' + dSamt);

// 31. Heteronym readings selector in Transcribe dictionary drawer
ok(dSamt.includes('tr-reading-pill'), 'samt drawer renders selectable reading pills: ' + dSamt);
const dMulk = run(`(function(){ var w = trBuild('mulk').lines[0].words[0]; return trDictSectionHtml(w, w.pieces[0]); })()`);
ok(dMulk.includes('tr-reading-pill'), 'mulk drawer renders selectable reading pills: ' + dMulk);

// 32. Classical homophones candidate suggestions
const wSada = build('sada').lines[0].words[0];
const cSada = run(`(function(){ var w = trBuild('sada').lines[0].words[0]; return trCands(w.pieces[0], w.pieces[0].def, 'ur'); })()`);
ok(cSada.some(c => c.ur === 'صدا') && cSada.some(c => c.ur === 'سدا'), 'sada offers both صدا and سدا: ' + cSada.map(c => c.ur));

const cAam = run(`(function(){ var w = trBuild('aam').lines[0].words[0]; return trCands(w.pieces[0], w.pieces[0].def, 'ur'); })()`);
ok(cAam.some(c => c.ur === 'عام') && cAam.some(c => c.ur === 'آم'), 'aam offers both عام and آم: ' + cAam.map(c => c.ur));

const cNazar = run(`(function(){ var w = trBuild('nazar').lines[0].words[0]; return trCands(w.pieces[0], w.pieces[0].def, 'ur'); })()`);
ok(cNazar.some(c => c.ur === 'نظر') && cNazar.some(c => c.ur === 'نذر'), 'nazar offers both نظر and نذر: ' + cNazar.map(c => c.ur));

// 33. Extended verbal and nominal morphology
const bSo = build('soongaa');
ok(bSo.lines[0].out.ur.includes('سو') && bSo.lines[0].out.ur.includes('گا'), 'soongaa transliterates to سوؤں گا: ' + bSo.lines[0].out.ur);
const bKijiye = build('kijiye');
ok(bKijiye.lines[0].out.ur === 'کیجیے', 'kijiye transliterates to کیجیے: ' + bKijiye.lines[0].out.ur);
const bDoston = build('doston');
ok(bDoston.lines[0].out.ur === 'دوستوں', 'doston transliterates to دوستوں: ' + bDoston.lines[0].out.ur);

// 34. Hindi homographs & vowel pairs: jag (جگ, world) vs jaag (جاگ, wake)
const bJag = build('jag');
ok(bJag.lines[0].out.ur === 'جگ', 'jag transliterates to Hindi/Urdu جگ: ' + bJag.lines[0].out.ur);
const cJag = run(`(function(){ var w = trBuild('jag').lines[0].words[0]; return trCands(w.pieces[0], w.pieces[0].def, 'ur'); })()`);
ok(cJag.some(c => c.ur === 'جگ') && cJag.some(c => c.ur === 'جاگ'), 'jag offers both جگ and جاگ: ' + cJag.map(c => c.ur));

const bJaag = build('jaag');
ok(bJaag.lines[0].out.ur === 'جاگ', 'jaag transliterates to جاگ: ' + bJaag.lines[0].out.ur);
const cJaag = run(`(function(){ var w = trBuild('jaag').lines[0].words[0]; return trCands(w.pieces[0], w.pieces[0].def, 'ur'); })()`);
ok(cJaag.some(c => c.ur === 'جاگ') && cJaag.some(c => c.ur === 'جگ'), 'jaag offers both جاگ and جگ: ' + cJaag.map(c => c.ur));

// 35. nazr deduplicated candidates & durud options
const cNazr = run(`(function(){ var w = trBuild('nazr').lines[0].words[0]; return trCands(w.pieces[0], w.pieces[0].def, 'ur'); })()`);
ok(cNazr.length === 2 && cNazr[0].ur === 'نذر' && cNazr[1].ur === 'نظر', 'nazr has exactly two distinct options (no duplicate نذر): ' + cNazr.map(c => c.ur));

const cDurud = run(`(function(){ var w = trBuild('durūd-o-salām').lines[0].words[0]; return trCands(w.pieces[0], w.pieces[0].def, 'ur'); })()`);
ok(cDurud.length >= 2 && cDurud.some(c => c.ro === 'darūd'), 'durud offers both durūd and darūd: ' + cDurud.map(c => c.ro));

// 36. main/mein nūn-ghunna & sarkar-e-do compound dictionary lookup
const bMain = build('main');
ok(bMain.lines[0].out.ur === 'میں', 'main transliterates with nūn ghunna to میں: ' + bMain.lines[0].out.ur);
const cMain = run(`(function(){ var w = trBuild('main').lines[0].words[0]; return trCands(w.pieces[0], w.pieces[0].def, 'ur'); })()`);
ok(cMain.some(c => c.ur === 'میں') && cMain.some(c => c.ur === 'مین'), 'main offers both میں and مین: ' + cMain.map(c => c.ur));

const lkSarkar = run(`(function(){ return DICT_STORE.lookup('sarkar-e-do'); })()`);
ok(lkSarkar.some(e => e.ur === 'سرکار') && lkSarkar.some(e => e.ur === 'دو'), 'sarkar-e-do compound lookup returns entries for sarkar and do');

// 37. Scalable dynamic candidate discovery from DICT_STORE for untracked words
const cLab = run(`(function(){ var w = trBuild('lab').lines[0].words[0]; return trCands(w.pieces[0], w.pieces[0].def, 'ur'); })()`);
ok(cLab.some(c => c.ur === 'لب') && cLab.some(c => c.ur === 'لاب'), 'lab dynamically discovers candidates لب and لاب from DICT_STORE: ' + cLab.map(c => c.ur));

const cGul = run(`(function(){ var w = trBuild('gul').lines[0].words[0]; return trCands(w.pieces[0], w.pieces[0].def, 'ur'); })()`);
ok(cGul.some(c => c.ur === 'گل'), 'gul dynamically discovers candidate گل from DICT_STORE: ' + cGul.map(c => c.ur));

const cFikar = run(`(function(){ var w = trBuild('fikar').lines[0].words[0]; return trCands(w.pieces[0], w.pieces[0].def, 'ur'); })()`);
ok(cFikar.some(c => c.ur === 'فکر'), 'fikar dynamically discovers candidate فکر via syncopation from DICT_STORE: ' + cFikar.map(c => c.ur));

// 38. Hindi verbal participles (kahat, chalat) not hijacked by Persian -at clitic
const bKahat = build('kahat');
ok(bKahat.lines[0].out.ur === 'کہت' && bKahat.lines[0].out.hi === 'कहत', 'kahat transliterates to کہت / कहत (not Persian کاہت): ' + bKahat.lines[0].out.ur);
const lkKahat = run(`DICT_STORE.lookup('kahat')`);
ok(lkKahat.some(e => e.ur === 'کہنا'), 'kahat dictionary lookup resolves to infinitive کہنا (kahnā): ' + (lkKahat[0] && lkKahat[0].ur));
const lkKahatUr = run(`DICT_STORE.lookup('کہت')`);
ok(lkKahatUr.some(e => e.ur === 'کہنا'), 'کہت dictionary lookup resolves to infinitive کہنا (kahnā): ' + (lkKahatUr[0] && lkKahatUr[0].ur));

// 39. Compound tab labeling and oblique noun fallback (but-khaane, khaane -> khana)
const dButKhaane = run(`(function(){ var w = trBuild('but-khaane').lines[0].words[0]; return trDictSectionHtml(w, w.pieces[0]); })()`);
ok(dButKhaane.includes('بت خانے (but-ḳhāne)') || dButKhaane.includes('بت خانے'), 'but-khaane whole tab labels the full compound: ' + dButKhaane);

const dWhole = run(`(function(){ var w = trBuild('but-khaane').lines[0].words[0]; TR.dictTarget = 'whole'; return trDictSectionHtml(w, w.pieces[0]); })()`);
ok(dWhole.includes('بتخانه') && dWhole.includes('idol temple'), 'but-khaane whole lookup resolves to but-khāna: ' + dWhole);

const lkKhaane = run(`DICT_STORE.lookup('خانے')`);
ok(lkKhaane.some(e => e.ur === 'خانه' || e.ur === 'خانہ'), 'خانے oblique lookup resolves to singular خانہ (ḵẖāna): ' + (lkKhaane[0] && lkKhaane[0].ur));

// 40. Hamza vs yeh in vowel-stem verbs and common vocabulary (gaye, aaye, laaye, naye, chaaye, koyi)
const bGaye = build('gaye');
ok(bGaye.lines[0].out.ur === 'گئے', 'gaye transliterates to standard گئے: ' + bGaye.lines[0].out.ur);
const cGaye = run(`(function(){ var w = trBuild('gaye').lines[0].words[0]; return trCands(w.pieces[0], w.pieces[0].def, 'ur'); })()`);
ok(cGaye.some(c => c.ur === 'گئے') && cGaye.some(c => c.ur === 'گیے'), 'gaye candidate list offers both standard گئے and alternate گیے: ' + cGaye.map(c => c.ur));

const bAaye = build('aaye');
ok(bAaye.lines[0].out.ur === 'آئے' || bAaye.lines[0].out.ur === 'آئے', 'aaye transliterates to aaye with hamza: ' + bAaye.lines[0].out.ur);

const bNaye = build('naye');
ok(bNaye.lines[0].out.ur === 'نئے', 'naye transliterates to نئے: ' + bNaye.lines[0].out.ur);

const bKoyi = build('koyi');
ok(bKoyi.lines[0].out.ur === 'کوئی', 'koyi transliterates to کوئی: ' + bKoyi.lines[0].out.ur);

// 41. Transcribe dictionary reading matching and ranking (gada -> gadā beggar)
const dGada = run(`(function(){ var w = trBuild('har gada yaad-e-sultan bu\\'ad').lines[0].words[1]; return trDictSectionHtml(w, w.pieces[0]); })()`);
ok(dGada.includes('beggar') || dGada.includes('Poor, indigent'), 'gada defaults to gadā beggar definition: ' + dGada.slice(0, 100));

console.log(bad ? `${bad} FAILED` : 'transcribe logic: all checks passed');
process.exit(bad ? 1 : 0);





