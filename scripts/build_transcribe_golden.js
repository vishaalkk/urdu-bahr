// Freezes what the hand-written exceptions produce today into tests/data/transcribe_golden.json, the spec that any general
// replacement (an inflection generator, dictionary homographs) must still meet before an exception is deleted:
//   words   every CASUAL_ALIAS key, OBL_NOUN_MAP key, inflection-rule example and Transcribe regression word → its Urdu, Roman
//           and Devanagari as Transcribe gives them now (trBuild), and the Urdu Scan gives it (lineScripts, no dictionary)
//   offers  every HOMOPHONES key → every alternative it offers now (trCands, any tag): the pairs it must keep offering
//   todo    known-wrong words with the right Urdu: the test reports them, and fails once one is right so it gets promoted
// Re-run only deliberately (it rewrites the spec) and read the diff:  node scripts/build_transcribe_golden.js
const fs = require('fs'), path = require('path');
const { loadPage } = require('../tests/lib_page');
const root = path.join(__dirname, '..');
const OUT = path.join(root, 'tests/data/transcribe_golden.json');
const { run } = loadPage({ withDict: true });
const J = JSON.stringify;

const helpers = fs.readFileSync(path.join(root, 'src/js/05-translit-helpers.js'), 'utf8');
const transcribe = fs.readFileSync(path.join(root, 'src/js/24-transcribe.js'), 'utf8');
const between = (s, a, b) => { const i = s.indexOf(a); return s.slice(i, s.indexOf(b, i)); };

const alias = run('Object.keys(CASUAL_ALIAS)');
const oblNouns = [...between(helpers, 'const OBL_NOUN_MAP', '};').matchAll(/(\w+):/g)].map(m => m[1]);
const homBlock = between(transcribe, 'var HOMOPHONES = {', "if (HOMOPHONES[plain]");
const homKeys = new Set([
    ...[...between(homBlock, '{', '};').matchAll(/^\s+(\w+): \[/gm)].map(m => m[1]),
    ...[...homBlock.matchAll(/\['(\w+)','(\w+)','/g)].flatMap(m => [m[1], m[2]]),
    ...[...homBlock.matchAll(/HOMOPHONES\.(\w+) =/g)].map(m => m[1])
]);
// the examples named in tryUrMorphDecompose / tryFaDecompose comments, and the words the Transcribe regression tests pin
const ruleExamples = ('duayein hawayein sadayein duaon hawaon basaaunga sajaaoonga banaaunga aaungaa basaayenge aayenge jaayenge ' +
    'basaayega aayega jaayega khaayega basaaun banaaoon aaun jaaoon basaayein aaein jaayein basaaye dikhaaye sunaaye basaayi ' +
    'dikhaayi sunaayi aaiye jaaiye bataaiye aaiyega soonga roonga dhoonga soyega royega dekhoonga boloonga rokoonga bhejoonga ' +
    'kijiye kijiyega dijiye lijiyega naalaaiqam naadaan bedaar dilam dastam').split(' ');
const pinned = 'gaye aaye naye koyi gada ham rahguzaron baich bech mail sair kahat main lab gul fikar ishq faida kismat'.split(' ')
    // words that left the todo list: once right, they stay right
    .concat('murjhaye larzaye uthaye padhoonga larkiyan tasveeren muhabbaten huyein huyen basaaye basaayi duaon'.split(' '))
    // words that had an alias until the typed-word scorer (casualCands) read them: the scorer must keep giving what the alias gave
    .concat(('yeh woh voh buad buwad hua kya dava naadaan aaxir nahin mein main hai hain hun hoon gayin gayi gayee aae aayi ' +
        'aayee aaii aayein aayen laaye laae laayi laayee laayein laayen paaye paae paayi paayee paayein paayen khaaye ' +
        'khaae khaayi khaayee khaayein khaayen gaayein gaayen royi royee dhoye soye khoye huye huyi huyee nayi nayee ' +
        'jaaye jaye koyi bataaye bataye dikhaaye dikhaye dikhaayi dikhayi dikhaayee sunaaye sunaye sunaayi sunayi ' +
        'sunaayee banaaye banaye banaayi banayi banaayee lagaaye lagaye lagaayi lagayi lagaayee bulaye bulaaye bulayi ' +
        'bulaayi chalaye chalaaye chalayi chalaayi jalaye jalaaye jalayi jalaayi milaye milaaye milayi milaayi samaayi ' +
        'samayi padi pada pade baDi baDa chhod chhoD chhoda chhoDa chhode chhoDe chhodi chhoDi ghadi ghaDi bichhad ' +
        'bichhaD daud dauda dauD chadh chadha chaDh chaDha badh badha baDh baDha uda uD uDa faida jaag baich daikh ' +
        'bhaid paish').split(' '));

const old = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
const todo = old.todo || {};
const words = {};
for (const w of [...new Set([...alias, ...oblNouns, ...ruleExamples, ...pinned])].sort()) {
    if (todo[w]) continue;
    const line = run(`trBuild(${J(w)}).lines[0]`);
    if (!line || !line.words.length) continue;
    const scan = run(`lineScripts(${J(w)}, { skipKnown: true })`) || {};   // Scan's path: no dictionary
    words[w] = { ur: line.out.ur, ro: line.out.ro, hi: line.out.hi, tier: line.words[0].tier, scan: scan.ur || '' };
}
/* the offers are frozen once recorded (the HOMOPHONES table they came from is gone: Transcribe derives its alternatives from the
   dictionary now); only keys not yet recorded are added */
const offers = Object.assign({}, old.offers || {});
for (const w of [...homKeys].sort()) {
    if (offers[w]) continue;
    const c = run(`(function(){ var p = trBuild(${J(w)}).lines[0].words[0].pieces[0]; return trCands(p, p.def, 'ur'); })()`);
    const h = c.map(x => x.ur + ' ' + x.ro);   // whatever list a pair arrives from (homophone, list, loose, persian, lexicon)
    if (h.length) offers[w] = h;
}
fs.writeFileSync(OUT, JSON.stringify({ words, offers, todo }, null, 1) + '\n');
console.log(`${Object.keys(words).length} words, ${Object.keys(offers).length} homophone keys, ${Object.keys(todo).length} todo -> ${path.relative(root, OUT)}`);
