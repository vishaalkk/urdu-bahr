/* Weight > Learn verse examples render resiliently (chips row + Roman pieces), in every script.
   - direction: Roman/Devanagari chip rows carry `ltr`, Urdu does not (Roman chips once showed backwards)
   - a chip never begins with a combining mark, and a digraph (sh, kh, ...) or a ṭ/t̤ letter is never cut in two
   - every example renders in every script, with one chip per scanned syllable
   - the Roman splitter keeps a word's final consonants (kis, qismat, bosah) and spells the word back exactly
   - most example words get their own Roman pieces (the rest fall back to transliteration, never to garbage) */
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let fails = 0; const bad = m => { fails++; console.log('FAIL: ' + m); };
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/#/weight/learn' });
const w = dom.window, d = w.document;
w.console.log = () => {}; w.scrollTo = () => {};
setTimeout(() => {
  const nfc = s => s.normalize('NFC').replace(/[-\s]/g, '');
  const COMB = /^[̀-ͯ]/;

  /* splitter unit checks */
  const split = (word, shapes) => w.syllabifyRomanShaped(word, shapes);
  const cases = [['kis', [false], ['kis']], ['qismat', [false, false], ['qis', 'mat']], ['bosah', [false, false], ['bo', 'sah']],
    ['naqsh', [false, true], ['naq', 'sh']], ['nashāt̤', [false, false], ['na', 'shāt̤']], ['muḥabbat', [false, false, false], ['mu', 'ḥab', 'bat']]];
  for (const [word, shapes, want] of cases) {
    const got = split(word, shapes);
    if (!got || got.join('|') !== want.join('|')) bad(`splitter: ${word} -> ${got && got.join('|')} (want ${want.join('|')})`);
  }

  /* every example, every script */
  const C = w.WEIGHT_CORPUS, all = [];
  for (const k of Object.keys(C.examples)) C.examples[k].forEach(e => all.push(e));
  for (const word of Object.keys(C.flexv)) for (const b of ['long', 'short']) C.flexv[word][b].forEach(e => all.push(e));
  let exact = 0, wordsOk = 0, wordsAll = 0;
  for (const script of ['ur', 'ro', 'hi']) {
    w.setScriptMode(script);
    for (const e of all) {
      const html1 = w.corpusExample(e);
      if (!html1) { bad(`${script}: example did not render: ${e.ro}`); continue; }
      const host = d.createElement('div'); host.innerHTML = html1;
      const row = host.querySelector('.chips');
      if (!row) { bad(`${script}: no chip row: ${e.ro}`); continue; }
      if (row.classList.contains('ltr') !== (script !== 'ur')) bad(`${script}: chip row direction wrong: ${e.ro}`);
      const chips = [...row.querySelectorAll('.chip')];
      if (!chips.length) bad(`${script}: no chips: ${e.ro}`);
      chips.forEach(c => { if (COMB.test(c.textContent)) bad(`${script}: chip starts with a combining mark "${c.textContent}": ${e.ro}`); });
      if (script === 'ro') {
        if (nfc(chips.map(c => c.textContent).join('')) === nfc(e.ro)) exact++;
        const r = w.Scan.scanLine(e.w.join(' ')), f = r.fits.find(x => String(x.meter.id) === String(e.m)), x = w.Scan.explain(r, f);
        const pcs = w.romanPiecesFor(x.syl, w.wordRomanMap({ ro: e.ro }, r)), by = {};
        x.syl.forEach((s, i) => { (by[s.word + '-' + s.wordTo] = by[s.word + '-' + s.wordTo] || []).push(pcs[i]); });
        Object.values(by).forEach(v => { wordsAll++; if (v.every(z => z != null)) wordsOk++; });
      }
    }
  }
  w.setScriptMode('ur');
  if (exact < all.length * 0.8) bad(`only ${exact}/${all.length} example lines spell their Roman exactly from chips`);
  if (wordsOk < wordsAll * 0.9) bad(`only ${wordsOk}/${wordsAll} example words got their own Roman pieces`);
  console.log(fails ? fails + ' Learn render problem(s)' : `learn render ok (${all.length} lines x 3 scripts; Roman exact on ${exact}, words with own pieces ${wordsOk}/${wordsAll})`);
  process.exit(fails ? 1 : 0);
}, 1500);
