/* Builds taal.html (tabla thekas under real lines) from taal_template.html: couplets scanned by the real app
   (jsdom over the built index.html), the tabla strokes in ./tabla (see tabla/SOURCES.md) and the app's da / dum voice.
   Usage, from the repo root:
     node features/ear-lab/taal_gen.js . features/ear-lab/taal.html features/ear-lab/taal_view.html */
const path = require('path');
const fs = require('fs');
const repo = path.resolve(process.argv[2] || '.');
const { JSDOM, VirtualConsole } = require(path.join(repo, 'node_modules/jsdom'));
const HTML = fs.readFileSync(path.join(repo, 'index.html'), 'utf8');

/* one couplet per meter family; `find` picks a known line, otherwise the first clean couplet in that meter */
const SPECS = [
  { meters: ['14', '15'], poet: 'Ghalib', ref: 'Ghalib', direct: [
    { ur: 'دلِ ناداں تجھے ہوا کیا ہے', ro: 'dil-e nādāñ tujhe huā kyā hai' }, { ur: 'آخر اس درد کی دوا کیا ہے', ro: 'āḳhir is dard kī davā kyā hai' }] },
  { meters: ['26'], poet: 'Ghalib', find: 'ہزاروں خواہشیں ایسی' },
  { meters: ['10'], poet: 'Ghalib', find: 'نقش فریادی ہے' },
  { meters: ['18', '19'], poet: 'Ghalib' },
  { meters: ['33', '34'], poet: 'Ghalib' },
  { meters: ['5', '8'], poet: 'Ghalib' },
  { meters: ['28'], poet: 'Mir' },
  { meters: ['H'], poet: 'Mir', find: 'الٹی ہو گئیں سب' }
];

const dom = new JSDOM(HTML, { runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: new VirtualConsole(), url: 'http://localhost/index.html#/home' });
setTimeout(() => {
  const w = dom.window;
  const meters = JSON.parse(fs.readFileSync(path.join(repo, 'data/meters.json'), 'utf8')).standard;
  const pools = { Ghalib: w.eval('GHALIB_EXT_DATA'), Mir: w.eval('MIR_EXT_DATA') };

  function scan(line) {
    if (!line || !line.ur || !line.ro) return null;
    const r = w.Scan.scanLine(line.ur), fit = r.fits[0]; if (!fit) return null;
    const e = w.Scan.explain(r, fit), ro = w.romanOverridesFor(e.syl, r, { ro: line.ro }) || [];
    const syl = e.syl.map((s, i) => ({ ro: ro[i] != null ? ro[i] : w.translitText(s.text, 'ro'), w: s.resolved }));
    syl.forEach((s, i) => { if (s.ro === 'h' && syl[i + 1] && /^u/.test(syl[i + 1].ro)) { s.ro = 'hu'; syl[i + 1].ro = syl[i + 1].ro.slice(1); } });
    if (syl.some(s => !s.ro)) return null;
    /* the app's own scan row (chips, weight underlines, foot names) in each script */
    const chips = {};
    ['ur', 'hi', 'ro'].forEach(cs => { w.eval(`currentScript = '${cs}'`); chips[cs] = w.chipRowHTML(e.syl, e.feet, { r, ro: line.ro }); });
    const hi = line.hi || w.translitText(line.ur, 'hi');
    return { id: String(fit.meter.id), cost: fit.c, ur: line.ur, ro: line.ro, hi, syl, chips,
      feet: e.feet.map(f => ({ name: f.name, ro: f.ro, ur: f.ur, idx: f.idx, cae: !!f.cae })) };
  }

  const couplets = [];
  for (const spec of SPECS) {
    let found = spec.direct ? { ref: spec.ref, lines: spec.direct.map(scan) } : null;
    for (const g of found ? [] : pools[spec.poet]) {
      for (let i = 0; i + 1 < g.lines.length && !found; i += 2) {
        if (spec.find && !(g.lines[i].ur || '').includes(spec.find) && !(g.lines[i + 1].ur || '').includes(spec.find)) continue;
        let a, b; try { a = scan(g.lines[i]); b = scan(g.lines[i + 1]); } catch (e) { continue; }
        if (!a || !b || !spec.meters.includes(a.id) || !spec.meters.includes(b.id)) continue;
        if (!spec.find && (a.cost > 0 || b.cost > 0)) continue;
        found = { ref: spec.poet + ' ' + g.id, lines: [a, b] };
      }
      if (found) break;
    }
    if (!found) { console.log('no couplet for', spec.meters.join('/')); continue; }
    const id = found.lines[0].id, m = meters.find(x => String(x.id) === id) || {};
    found.meterId = id;
    found.meterName = (m.name || (id === 'H' ? 'Hindi meter (Mir)' : '')).replace(/x/g, 'ḳh');   /* meters.json spells ḳh as x */
    found.pattern = m.pattern || '';
    found.lines.forEach(l => { delete l.cost; delete l.id; });
    couplets.push(found);
    console.log(id.padEnd(3), found.ref.padEnd(12), found.lines.map(l => l.ro).join(' / '));
  }

  const audio = fs.readFileSync(path.join(repo, 'src/js/15-audio.js'), 'utf8');
  const voice = audio.match(/const VOICEPACK=(\{.*?\});\n/)[1];
  const dir = path.join(repo, 'data/tabla'), strokes = {};
  fs.readdirSync(dir).filter(f => f.endsWith('.mp3')).sort().forEach(f => { strokes[f.slice(0, -4)] = fs.readFileSync(path.join(dir, f)).toString('base64'); });

  w.eval(`currentScript = 'ur'`);
  const legend = w.legendHTML('');
  /* the lab page (taal.html) and, with a third argument, the in-app mockup (taal_view.html) */
  const build = (tplName, outFile) => {
    const tpl = fs.readFileSync(path.join(__dirname, tplName), 'utf8');
    const html = tpl.replace('/*@@COUPLETS@@*/', () => JSON.stringify(couplets)).replace('/*@@STROKES@@*/', () => JSON.stringify(strokes))
    .replace('/*@@VOICEPACK@@*/', () => voice)
    .replace('/*@@ENGINE@@*/', () => fs.readFileSync(path.join(__dirname, 'taal_engine.js'), 'utf8'))
    .replace('/*@@LEGEND@@*/', () => JSON.stringify(legend));
    fs.writeFileSync(outFile, html);
    console.log('wrote', outFile, (html.length / 1024 | 0) + 'KB,', Object.keys(strokes).length, 'strokes'); };
  build('taal_template.html', process.argv[3]);
  if (process.argv[4]) build('taal_view_template.html', process.argv[4]);
  w.close();
}, 2000);
