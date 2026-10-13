// One Urdu spelling, two words that casual typing cannot tell apart (بیچ bech / bīch, میل mail / mel, سیر sair / ser, ملک mulk /
// milk): Platts' Devanagari separates them. For every such pair in Platts where both words are spelled the same by the app's
// parsers and the spelling is one the verified corpora use, type one reading without diacritics and ask whether Transcribe's
// alternatives (trCands) offer the other.
//   offered   share of readings whose partner is offered
// Floors: tests/readings_baseline.json; a fall fails the run, a rise is recorded with --update (never lowers a floor).
// Run: node tests/benchmark_readings.js [--update] [-v]
const fs = require('fs'), path = require('path');
const { loadPage } = require('./lib_page');
const { checkFloors } = require('./lib_bench');
const BASE_FILE = path.join(__dirname, 'readings_baseline.json');
const VERBOSE = process.argv.includes('-v');
const { run } = loadPage({ withDict: true });

/* the pairs, built in the page: spellings the corpora use whose Platts readings fold to the same casual key (o~u, e~i, ai~e) but
   differ in Devanagari */
const pairs = run(`(function () {
  var groups = new Map(), lax = function (r) { return casualKey(String(r).replace(/ai/g, 'e').replace(/au/g, 'o'), 2); };
  DICT_STORE.entries.forEach(function (e) {
    if (e.dict !== 'Platts' || !e.hi || /[\\s-]/.test(e.ro)) return;
    var k = dictKeyUr(e.ur), g = groups.get(k);
    if (!g) groups.set(k, g = []);
    g.push(e);
  });
  var out = [];
  groups.forEach(function (g) {
    if (g.length < 2) return;
    var rs = [];
    g.forEach(function (e) {
      var sc = DICT_STORE.spelled(e.ro, e.ur);
      if (sc && sc.hi && !rs.some(function (r) { return r.hi.replace(/\\u0901/g, '\\u0902') === sc.hi.replace(/\\u0901/g, '\\u0902'); })) rs.push(sc);
    });
    if (rs.length < 2 || !wordAscii(rs[0].ur)) return;
    for (var i = 0; i < rs.length; i++) for (var j = 0; j < rs.length; j++)
      if (i !== j && lax(rs[i].ro) === lax(rs[j].ro)) out.push([rs[i].ro, rs[j].ur, rs[j].ro]);
  });
  return out.sort();
})()`);
let ok = 0;
const miss = [];
for (const [typedRo, ur, ro] of pairs) {
    const typed = typedRo.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[ʿʾʻʼ]/g, '').toLowerCase();
    const offered = run(`(function(){ var w = trBuild(${JSON.stringify(typed)}).lines[0].words[0]; if (!w) return false;
      return trCands(w.pieces[0], w.pieces[0].def, 'ur').some(function (c) { return dictKeyUr(c.ur) === dictKeyUr(${JSON.stringify(ur)}) && casualKey(c.ro, 0) === casualKey(${JSON.stringify(ro)}, 0); }); })()`);
    if (offered) ok++; else miss.push(`${typed} → ${ur} ${ro}`);
}
const now = { offered: Math.round(10000 * ok / pairs.length) / 100, n: pairs.length };
console.log(`same spelling, other reading: ${pairs.length} pairs from Platts, partner offered ${now.offered}%`);
if (VERBOSE) console.log('  ' + miss.join(' · '));
process.exit(checkFloors(BASE_FILE, now, ['offered']));
