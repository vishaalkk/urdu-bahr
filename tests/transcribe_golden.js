// The spec the hand-written transliteration exceptions add up to (tests/data/transcribe_golden.json, frozen by
// scripts/build_transcribe_golden.js). A general rule that replaces an exception must still give these:
//   words   typed word → Urdu, Roman, Devanagari as Transcribe gives them (trBuild), and the Urdu Scan gives (lineScripts)
//   offers  a homophone key → the classical pairs its alternatives must keep offering
//   todo    known-wrong words with the right Urdu: listed, not failed; one that comes out right fails the run, so it is moved
//           into `words` (re-run the builder) and cannot silently break again
//   aliases every CASUAL_ALIAS entry is still needed: one whose word comes out the same without it (Transcribe and Scan) is what the
//           typed-word scorer (casualCands) already gives, so the run fails until it is deleted
// Run: node tests/transcribe_golden.js [-v]
const fs = require('fs'), path = require('path');
const { loadPage } = require('./lib_page');
const { foldNasal: hiFold } = require('./lib_bench');
const { run } = loadPage({ withDict: true });
const J = JSON.stringify;
const VERBOSE = process.argv.includes('-v');
const G = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'transcribe_golden.json'), 'utf8'));

let bad = 0;
const fail = m => { bad++; console.log('FAIL: ' + m); };
for (const [w, want] of Object.entries(G.words)) {
    const line = run(`trBuild(${J(w)}).lines[0]`);
    const got = { ur: line.out.ur, ro: line.out.ro, hi: line.out.hi };
    /* Pue's Devanagari parser writes ं or ँ for the same nasal depending on what it parsed before: the two count as one */
    const diff = ['ur', 'ro', 'hi'].filter(k => k === 'hi' ? hiFold(got[k]) !== hiFold(want[k]) : got[k] !== want[k]);
    if (want.scan != null) {   // Scan's own path (no dictionary) must give it too
        const scan = (run(`lineScripts(${J(w)}, { skipKnown: true })`) || {}).ur || '';
        if (scan !== want.scan) diff.push('scan'), got.scan = scan;
    }
    if (diff.length) fail(`${w}: ${diff.map(k => `${k} ${want[k]} → ${got[k]}`).join(', ')}`);
}
for (const [w, want] of Object.entries(G.offers)) {
    /* an offer is its Urdu (NFC) and its Roman as typed (dal = dall, the Roman a dictionary prints for the same word) */
    const key = x => { const [u, ...r] = x.split(' '); return u.normalize('NFC') + ' ' + run(`casualKey(${J(r.join(' '))}, 0)`); };
    const c = run(`(function(){ var p = trBuild(${J(w)}).lines[0].words[0].pieces[0]; return trCands(p, p.def, 'ur'); })()`).map(x => key(x.ur + ' ' + x.ro));
    const miss = want.filter(x => !c.includes(key(x)));
    if (miss.length) fail(`${w} no longer offers ${miss.join(', ')}`);
}
let open = 0;
for (const [w, want] of Object.entries(G.todo)) {
    const fold = u => String(u || '').normalize('NFC').replace(/[\u064B-\u0653\u0670]/g, '');   // optional marks (tashdid, zabar)
    const got = run(`trBuild(${J(w)}).lines[0].out.ur`);
    if (fold(got) === fold(want)) fail(`${w} now gives ${want}: move it from todo into words (node scripts/build_transcribe_golden.js)`);
    else { open++; if (VERBOSE) console.log(`  todo ${w}: ${got} (want ${want})`); }
}
const aliases = run('Object.keys(CASUAL_ALIAS)');
const redundant = aliases.filter(k => {
    const want = G.words[k];
    if (!want) return false;
    run(`var __alias = CASUAL_ALIAS[${J(k)}]; delete CASUAL_ALIAS[${J(k)}];`);
    const line = run(`trBuild(${J(k)}).lines[0]`), scan = (run(`lineScripts(${J(k)}, { skipKnown: true })`) || {}).ur || '';
    run(`CASUAL_ALIAS[${J(k)}] = __alias;`);
    return line.out.ur === want.ur && line.out.ro === want.ro && hiFold(line.out.hi) === hiFold(want.hi) && (want.scan == null || scan === want.scan);
});
if (redundant.length) fail(`aliases the scorer already gives (delete them from CASUAL_ALIAS): ${redundant.join(', ')}`);
const unpinned = aliases.filter(k => !G.words[k] && !G.todo[k]);
if (unpinned.length) fail(`aliases with no golden row (node scripts/build_transcribe_golden.js): ${unpinned.join(', ')}`);
const n = Object.keys(G.words).length, h = Object.keys(G.offers).length;
console.log(bad ? `${bad} FAILED` : `transcribe golden: ${n} words, ${h} homophone keys hold; ${open} known-wrong still open; ${aliases.length} aliases, each still needed`);
process.exit(bad ? 1 : 0);
