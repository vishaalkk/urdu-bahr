/* Build data/others_extended.json ("More Poets") from data/sources/others_rekhta.md.
   The source has, per ghazal, a header line then three blocks in the order Urdu, Devanagari, Roman, all copied from Rekhta
   (https://www.rekhta.org). Urdu and Devanagari are kept as given. The Roman is converted to Pritchett's style: Rekhta's Roman is
   typed through the app's own romanToAscii (which reads Rekhta's spellings), then rendered by Sean Pue's diacritics parser, so
   the toggle reads like every other collection. Needs the built index.html (npm run build) and the source file, which is kept
   local (gitignored): put the Rekhta text at data/sources/others_rekhta.md, then run: node scripts/build_others.js */
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const GHAZALS = [   // header line number in the source (1-based) -> poet and the engine's meter number for the ghazal
  { head: 1, poet: 'Faiz Ahmed Faiz', meters: [34] },
  { head: 70, poet: 'Dagh Dehlvi', meters: [5] },
  { head: 158, poet: 'Dagh Dehlvi', meters: [30] },
  { head: 280, poet: 'Jigar Moradabadi', meters: [7] },
  { head: 488, poet: 'Firaq Gorakhpuri', meters: [27] },
  { head: 637, poet: 'Hasrat Mohani', meters: [10] }
];
const lines = fs.readFileSync(path.join(root, 'data/sources/others_rekhta.md'), 'utf8').split('\n');
const script = l => /[؀-ۿ]/.test(l) ? 'ur' : /[ऀ-ॿ]/.test(l) ? 'hi' : /[A-Za-z]/.test(l) ? 'ro' : null;
const vc = new VirtualConsole(); vc.on('jsdomError', () => {});
const dom = new JSDOM(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), { runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, url: 'http://localhost/index.html#/scan' });
setTimeout(() => {
  const w = dom.window, out = [];
  GHAZALS.forEach((g, k) => {
    const end = k + 1 < GHAZALS.length ? GHAZALS[k + 1].head - 1 : lines.length;
    const d = { ur: [], hi: [], ro: [] };
    lines.slice(g.head, end).forEach(l => { const s = script(l); if (s && l.trim()) d[s].push(l.trim()); });
    if (d.ur.length !== d.hi.length || d.ur.length !== d.ro.length || d.ur.length % 2) throw new Error('ghazal ' + (k + 1) + ': ' + d.ur.length + '/' + d.hi.length + '/' + d.ro.length + ' lines');
    const rows = d.ur.map((ur, i) => {
      const clean = d.ro[i].replace(/['’‘]/g, '');
      const ascii = w.romanToAscii(clean);
      let ro = '', back = ''; try { ro = w.p_di.parse(ascii); back = w.p_ur.parse(ascii); } catch (e) {}
      const flat = s => s.normalize('NFC').replace(/[\u064B-\u065F\u0670\u0651\u0654\u0614]/g, '').replace(/[يى]/g, 'ی').replace(/[ۂۀ]/g, 'ہ').replace(/\s+/g, ' ').trim();
      /* verified: the Urdu rebuilt from this ascii equals the Urdu Rekhta gives, so its spelling can feed the word map */
      const row = { ascii, ur, hi: d.hi[i].replace(/['’‘]/g, ''), ro: ro || clean };
      if (flat(back) === flat(ur)) row.verified = true;
      return row;
    });
    out.push({ id: k + 1, poet: g.poet, source: 'Rekhta', meters: g.meters, lines_count: rows.length, lines: rows });
  });
  fs.writeFileSync(path.join(root, 'data/others_extended.json'), JSON.stringify(out, null, 1) + '\n');
  console.log('wrote data/others_extended.json:', out.map(o => o.poet + ' ' + o.lines_count + ' (' + o.lines.filter(l => l.verified).length + ' verified)').join(', '));
  process.exit();
}, 1500);
