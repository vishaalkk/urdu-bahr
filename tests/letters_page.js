// The Letters page (#/letters, src/js/25-letters.js) and the letters it documents, run on the built page.
//   - each example, read as written by the Transliterator, gives the Roman the page shows (written from its ASCII by the same
//     parsers); a row marked `guess` (a vowel no letter writes) checks only its own letter
//   - the example's ASCII writes the spelling shown (marks and a final ھ / ہ aside: Pue writes neither)
//   - Punjabi ṇ ḷ and Saraiki's implosives in every direction (Shahmukhi, Roman with ALA-LC marks or IPA, Devanagari), the
//     Arabic spellings, and Devanagari read with Hindi's inherent a
//
// Run: node tests/letters_page.js
const { run } = require('./lib_page').loadPage();
const J = JSON.stringify;
let bad = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { bad++; console.log('FAIL: ' + m); } };
const out = t => run(`trBuild(${J(t)}).lines[0].out`);
const fold = u => String(u || '').normalize('NFC').replace(/[ً-ْٰ]/g, '').replace(/ھ$/, 'ہ');

// 1. the page's own rows
const groups = run('letterGroups()');
groups.forEach(g => g.rows.forEach(r => {
    const [glyph, , ro, , , ex, xa, , guess] = r;
    const want = run(`asciiToScripts(${J(xa)})`), got = out(ex);
    if (guess) {
        const letter = ro.split(/[ ,(]/)[0];
        ok(got.ro.includes(letter), `${g.id} ${glyph}: ${ex} reads with ${letter} (got ${got.ro})`);
    } else ok(got.ro === want.ro, `${g.id} ${glyph}: ${ex} reads ${want.ro} as the page says (got ${got.ro})`);
    if (['urdu', 'aspirates', 'punjabi', 'saraiki'].includes(g.id))
        ok(fold(want.ur) === fold(ex), `${g.id} ${glyph}: ${xa} is written ${ex} (got ${want.ur})`);
    ok(!/[؀-ۿݐ-ݿࢠ-ࣿ]/.test(got.ro), `${g.id} ${glyph}: no Arabic letter left in the Roman of ${ex} (${got.ro})`);
}));
const html = run('lettersHtml()');
groups.forEach(g => ok(html.includes(`id="lt-${g.id}"`), `the page has the ${g.id} group`));
ok(!/style="/.test(html), 'the page has no inline style');
ok(!/<section/.test(html), 'no <section> inside the page: the router hides every section when the route changes');

// 2. Punjabi and Saraiki letters, Shahmukhi in
[['پاݨی', 'pāṇī', 'पाणी'], ['پاڻی', 'pāṇī', 'पाणी'], ['کاݪا', 'kāḷā', 'काळा'], ['ٻال', 'b̤āl', 'ॿाल'], ['ڄم', 'j̈am', 'ॼम'],
 ['ڳالھ', 'g̈ālh', 'ॻाल्ह'], ['ݙر', 'd̤ar', 'ॾर'], ['ڏر', 'd̤ar', 'ॾर']].forEach(([u, ro, hi]) => {
    const o = out(u);
    ok(o.ro === ro && o.hi === hi, `${u} → ${ro} / ${hi} (got ${o.ro} / ${o.hi})`);
});
ok(run(`urduWordReading('پاݨی').tier`) === 'guess', 'پاݨی is read by its letters, not looked up as پای');
ok(out('پاݨی').fa === 'پانی', 'Fārsī writes ݨ as ن: ' + out('پاݨی').fa);
ok(out('ہووݨ،').ro.indexOf('ݨ') < 0, 'ݨ before an Urdu comma is still read: ' + out('ہووݨ،').ro);
ok(out('پاݨا ݪ').ur === 'پاݨا ݪ', 'Shahmukhi is kept as written');

// 3. typed Roman: ALA-LC marks and IPA
[['pāṇī', 'پاݨی', 'पाणी'], ['kāḷā', 'کاݪا', 'काळा'], ['b̤āl', 'ٻال', 'ॿाल'], ['ɓāl', 'ٻال', 'ॿाल'], ['j̈am', 'ڄم', 'ॼम'], ['ʄam', 'ڄم', 'ॼम'],
 ['d̤and', 'ݙند', 'ॾंद'], ['ɗand', 'ݙند', 'ॾंद'], ['g̈ālh', 'ڳالہ', 'ॻाल्ह'], ['ɠālh', 'ڳالہ', 'ॻाल्ह']].forEach(([ro, ur, hi]) => {
    const o = out(ro);
    ok(o.ur === ur && o.hi === hi, `${ro} → ${ur} / ${hi} (got ${o.ur} / ${o.hi})`);
});
ok(run(`romanToAscii('g̱h')`) !== '.gh', 'g̱h (Platts’ غ) is not read as an implosive');
ok(run(`trModernWord('pāṇī')`) === 'pani' && run(`trModernWord('g̈ālh')`) === 'gaalh', 'Modern Roman drops the marks');

// 4. Devanagari in: Punjabi and Sindhi letters, and ण stays n (Hindi गुण is Urdu گن)
[['ॿाल', 'ٻال'], ['ॼम', 'ڄم'], ['ॾंद', 'ݙند'], ['ॻाल', 'ڳال'], ['काळा', 'کاݪا'], ['गुण', 'گن'], ['पाणी', 'پانی']].forEach(([hi, ur]) => {
    const o = out(hi);
    ok(o.ur === ur, `${hi} → ${ur} (got ${o.ur})`);
});

// 5. the parsers: a doubled new letter takes tashdid / a halant
const sc = a => run(`asciiToScripts(${J(a)})`);
ok(sc('pa.n.naa').ur === 'پݨّا' && sc('pa.n.naa').hi === 'पण्णा' && sc('pa.n.naa').ro === 'paṇṇā', 'ṇṇ: ' + J(sc('pa.n.naa')));
ok(sc('paanii').ur === 'پانی' && sc('paanii').hi === 'पानी', 'plain n is untouched');

// 6. Arabic spellings
[['صلاة', 'ṣalāt'], ['زکوٰۃ', 'zakāt'], ['رحمة', 'raḥmat'], ['ٱلْحَمْدُ', 'alḥamdu'], ['أحمد', 'aḥmad'], ['إسلام', 'islām'],
 ['رَحْمَةٌ', 'raḥmatun'], ['رَحْمَةٍ', 'raḥmatin'], ['هُدَى', 'hudā'], ['آمَنُوا', 'āmanū']].forEach(([u, ro]) => {
    const o = out(u);
    ok(o.ro === ro, `${u} → ${ro} (got ${o.ro})`);
});

// 7. Devanagari: Hindi's inherent a, and the signs Urdu does not write
[['कमल', 'kamal'], ['नैनन', 'nainan'], ['मोहब्बत', 'mohabbat'], ['समझना', 'samajhnā'], ['लड़की', 'laṛkī'], ['ज्ञान', 'gyān'],
 ['दुःख', 'dukh'], ['कृष्ण', 'krishn'], ['ऋतु', 'ritu'], ['रंग', 'rang'], ['किंतु', 'kintu'], ['आँख', 'āñkh'], ['कहाँ', 'kahāñ'],
 ['ॐ', 'om'], ['सोऽहम्', 'soham'], ['ग़ज़ल', 'ġhazal']].forEach(([hi, ro]) => {
    const got = run(`asciiToScripts(devToAscii(${J(hi)})).ro`);
    ok(got === ro, `${hi} → ${ro} (got ${got})`);
});

console.log(bad ? `letters page: ${bad} of ${n} checks FAILED` : `letters page: all ${n} checks passed`);
process.exit(bad ? 1 : 0);
