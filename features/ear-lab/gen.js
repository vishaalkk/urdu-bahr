/* Fills template.html (the ear-lab mockup) with data from the real app (jsdom over the built index.html), so
   every syllable, weight, foot and afāʿīl label is the scanner's.
   Usage, from the repo root: node features/ear-lab/gen.js . features/ear-lab/rhythm_mockup.html */
const path = require('path');
const fs = require('fs');
const repo = path.resolve(process.argv[2] || '.');
const { JSDOM, VirtualConsole } = require(path.join(repo, 'node_modules/jsdom'));
const HTML = fs.readFileSync(path.join(repo, 'index.html'), 'utf8');

const VERSE_SPECS = [
  { label: 'Ghalib (Khafīf: Dil-e Nādāñ)', poet: 'Ghalib', direct: { ur: 'دلِ ناداں تجھے ہوا کیا ہے', ro: 'dil-e nādāñ tujhe huā kyā hai', hi: 'दिल-ए नादाँ तुझे हुआ क्या है' },
    second: { ur: 'آخر اس درد کی دوا کیا ہے', ro: 'āḳhir is dard kī davā kyā hai', hi: 'आख़िर इस दर्द की दवा क्या है' }, matla: true, radif: ['kyā', 'hai'] },
  { label: 'Ghalib (Hazaj: Hazāroñ Ḳhvāhisheñ)', poet: 'Ghalib', find: 'ہزاروں خواہشیں ایسی' },
  { label: 'Ghalib (Hazaj: Nah Thā Kuchh To)', poet: 'Ghalib', find: 'نہ تھا کچھ تو خدا' },
  { label: 'Mir (Hindi meter: Ultī Ho Gaʾīñ)', poet: 'Mir', find: 'الٹی ہو گئیں سب' }
];
const FORK_SPECS = [
  { fam: 'Khafīf', feel: 'Lilting', poet: 'Ghalib', direct: VERSE_SPECS[0].direct },
  { fam: 'Hazaj', feel: 'Rolling wave', poet: 'Ghalib', find: 'ہزاروں خواہشیں ایسی' },
  { fam: 'Ramal', feel: 'Swaying', poet: 'Ghalib', find: 'نقش فریادی ہے' }
];
const POOL_PER_METER = 15;
let seed = 7;
const rand = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };

const dom = new JSDOM(HTML, { runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: new VirtualConsole(), url: 'http://localhost/index.html#/home' });
setTimeout(() => {
  const w = dom.window;
  const meters = JSON.parse(fs.readFileSync(path.join(repo, 'data/meters.json'), 'utf8')).standard;
  const pools = { Ghalib: w.eval('GHALIB_EXT_DATA'), Mir: w.eval('MIR_EXT_DATA') };
  const findLine = spec => { if (spec.direct) return { line: spec.direct, ref: spec.poet };
    for (const g of pools[spec.poet]) { const l = g.lines.find(x => (x.ur || '').includes(spec.find)); if (l) return { line: l, ref: spec.poet + ' ' + g.id }; } };

  function scan(line, ref) {
    const r = w.Scan.scanLine(line.ur), fit = r.fits[0]; if (!fit) return null;
    const e = w.Scan.explain(r, fit), ro = w.romanOverridesFor(e.syl, r, { ro: line.ro }) || [];
    const syl = e.syl.map((s, i) => ({ ur: s.text, ro: ro[i] != null ? ro[i] : w.translitText(s.text, 'ro'), w: s.resolved, nat: s.native, word: s.word, fs: s.fsyl === '+' ? '' : (s.fsyl || '') }));
    syl.forEach((s, i) => { if (s.ro === 'h' && syl[i + 1] && /^u/.test(syl[i + 1].ro)) { s.ro = 'hu'; syl[i + 1].ro = syl[i + 1].ro.slice(1); } });
    if (syl.some(s => !s.ro)) return null;
    const seq = syl.map(s => s.w), id = String(fit.meter.id);
    /* a limp is proven only if the matcher accepts the intact line and accepts no meter for the flipped one
       (Mir's Hindi meter is not in Scan.matchWeights, so it gets no limps) */
    const verified = w.Scan.matchWeights(seq.filter(x => x !== 'c')).some(m => String(m.meter.id) === id);
    const limpable = [];
    if (verified) syl.forEach((s, i) => {
      if (s.nat === 'x' || s.w === 'c' || i === 0 || i === syl.length - 1) return;
      const t = seq.slice(); t[i] = t[i] === 'l' ? 's' : 'l';
      if (!w.Scan.matchWeights(t.filter(x => x !== 'c')).length) limpable.push(i);
    });
    const m = meters.find(x => String(x.id) === id) || {};
    return { ref, meterId: id, cost: fit.c, meterName: (m.name || (id === 'H' ? 'Hindi meter (Mir)' : '')).replace(/x/g, 'ḳh')   /* meters.json spells ḳh as x (xafīf) */, pattern: m.pattern || '',
      urdu: line.ur, translit: line.ro, deva: line.hi, syl, feet: e.feet.map(f => ({ name: f.name, ur: f.ur, idx: f.idx, cae: !!f.cae })), limpable };
  }

  /* the couplet around a verse: its partner misra, which is first, whether it is the matla, and the rhyme hook
     (qāfiya + radīf) as the index of the first hook syllable in each line. The radīf is the words every second line of
     the ghazal ends with; the qāfiya is the word before it. */
  const words = ro => ro.toLowerCase().replace(/[^\p{L}\p{M}\s-]/gu, '').split(/\s+/).filter(Boolean);
  function commonTail(lists) { let n = 0; while (lists.every(l => l.length > n) && lists.every(l => l[l.length - 1 - n] === lists[0][lists[0].length - 1 - n])) n++; return lists[0].slice(lists[0].length - n); }
  function hookFrom(sc, nWords) {   /* first syllable of the last nWords scanner words */
    const ids = [...new Set(sc.syl.map(s => s.word))]; const keep = new Set(ids.slice(-nWords)); return sc.syl.findIndex(s => keep.has(s.word));
  }
  function couplet(spec) {
    if (spec.direct) {
      const a = scan(spec.direct, spec.poet), b = scan(spec.second, spec.poet), n = spec.radif.length + 1;
      return { first: a, second: b, matla: !!spec.matla, radif: spec.radif, hook: [spec.matla ? hookFrom(a, n) : -1, hookFrom(b, n)] };
    }
    for (const g of pools[spec.poet]) {
      const i = g.lines.findIndex(x => (x.ur || '').includes(spec.find)); if (i < 0) continue;
      const j = i % 2 ? i - 1 : i + 1, first = Math.min(i, j), ref = spec.poet + ' ' + g.id;
      const seconds = g.lines.filter((x, k) => k % 2 === 1 && x.ro).map(x => words(x.ro));
      const radif = seconds.length > 1 ? commonTail(seconds) : [];
      const a = scan(g.lines[first], ref), b = scan(g.lines[first + 1], ref), n = radif.length + 1, matla = first === 0;
      return { first: a, second: b, matla, radif, hook: [matla ? hookFrom(a, n) : -1, hookFrom(b, n)], isSecond: i % 2 === 1 };
    }
  }
  const verses = VERSE_SPECS.map(s => {
    const c = couplet(s), main = c.isSecond ? c.second : c.first;
    return Object.assign({ label: s.label }, c.first, { second: c.second, matla: c.matla, radif: c.radif, hook: c.hook });
  });
  const forks = FORK_SPECS.map(s => { const { line, ref } = findLine(s); return Object.assign({ fam: s.fam, feel: s.feel }, scan(line, ref)); });

  /* spot-the-limp pool: the verses themselves (when provable) plus clean corpus lines in khafīf, hazaj and ramal */
  const want = new Set(['14', '26', '10']), byMeter = {};
  for (const [poet, arr] of Object.entries(pools)) for (const g of arr) for (const l of g.lines) {
    if (!l.ur || !l.ro) continue;
    let s; try { s = scan(l, poet + ' ' + g.id); } catch (e) { continue; }
    if (!s || !want.has(s.meterId) || s.cost > 0 || s.limpable.length < 2) continue;
    (byMeter[s.meterId] = byMeter[s.meterId] || []).push(s);
  }
  const limpPool = verses.filter(v => v.limpable.length);
  Object.values(byMeter).forEach(list => {
    for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
    limpPool.push(...list.slice(0, POOL_PER_METER));
  });
  [...verses, ...verses.map(v => v.second), ...forks, ...limpPool].forEach(x => { delete x.cost; });

  verses.forEach(v => console.log('verse', v.meterId, v.meterName, '| limps', v.limpable.length, '| matla', v.matla, '| radif', v.radif.join(' '),
    '| hook', v.hook.join(','), '|', v.translit, '/', v.second.translit, '| 2nd meter', v.second.meterId));
  forks.forEach(v => console.log('fork', v.fam, v.meterId, v.meterName));
  console.log('limp pool', limpPool.length);

  const audio = fs.readFileSync(path.join(repo, 'src/js/15-audio.js'), 'utf8');
  const pack = k => audio.match(new RegExp('const ' + k + '=(\\{.*?\\});\\n'))[1];
  const tpl = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');
  const html = tpl.replace('/*@@VERSES@@*/', () => JSON.stringify(verses)).replace('/*@@FORKS@@*/', () => JSON.stringify(forks))
    .replace('/*@@LIMPS@@*/', () => JSON.stringify(limpPool))
    .replace('/*@@VOICEPACK@@*/', () => pack('VOICEPACK')).replace('/*@@TABLAPACK@@*/', () => pack('TABLAPACK'));
  fs.writeFileSync(process.argv[3], html);
  console.log('wrote', process.argv[3], (html.length / 1024 | 0) + 'KB');
  w.close();
}, 2000);
