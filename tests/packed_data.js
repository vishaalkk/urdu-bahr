/* The verse collections ship packed (scripts/pack_verses.py: a word dictionary plus id lines) and the app unpacks them at load. This
   checks the whole route end to end: what the BUILT app holds must equal the source data, ghazal by ghazal and line by line, for
   the Rekhta poets (data/poets_extended.json), Ghalib (data/ghalib_extended.json) and Mir (data/mir_extended.json); and the poet
   collection must be sound (poets listed, ids unique, every line has its scripts, Rekhta links well formed).
   Run after `npm run build`: node tests/packed_data.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
let failures = 0;
const check = (c, m) => { if (!c) { failures++; console.log('  ✗ ' + m); } };

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const blocks = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi).map(b => b.replace(/<\/?script[^>]*>/gi, ''));
const el = id => ({ id, classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } }, addEventListener(){}, querySelectorAll: () => [], querySelector: () => null, textContent: '', innerHTML: '', value: '', style: {}, setAttribute(){}, getAttribute(){ return null; } });
const store = {};
const ctx = { window: {}, console: { log(){}, warn(){}, error(){} }, setTimeout: () => 1, clearTimeout(){}, setInterval(){}, clearInterval(){},
  document: { getElementById: id => store[id] || (store[id] = el(id)), querySelectorAll: () => [], querySelector: () => el('q'), addEventListener(){}, documentElement: el('html'), body: el('body') },
  localStorage: { getItem: () => null, setItem(){}, removeItem(){} }, location: { hash: '', search: '' }, history: { replaceState(){} }, AudioContext: function(){ return {}; } };
ctx.window = ctx; ctx.self = ctx;
vm.createContext(ctx);
blocks.forEach(code => { try { vm.runInContext(code, ctx); } catch (e) { /* UI boot needs a real DOM; the data is defined first */ } });

const src = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/poets_extended.json'), 'utf8'));
const app = vm.runInContext('POETS_DATA', ctx);
check(app && app.ghazals && app.poets, 'POETS_DATA is not loaded in the built app');

if (app && app.ghazals) {
  const keys = Object.keys(src.ghazals);
  check(JSON.stringify(Object.keys(app.ghazals).sort()) === JSON.stringify(keys.slice().sort()), 'poet keys differ');
  check(JSON.stringify(app.poets) === JSON.stringify(src.poets), 'poet list differs');
  check(JSON.stringify(app.legacy) === JSON.stringify(src.legacy), 'legacy redirects differ');
  let lines = 0, bad = 0;
  keys.forEach(k => {
    const a = app.ghazals[k] || [], s = src.ghazals[k];
    check(a.length === s.length, k + ': ' + a.length + ' ghazals in the app, ' + s.length + ' in the data');
    const ids = new Set();
    s.forEach((g, gi) => {
      const x = a[gi]; if (!x) return;
      ['id', 'url', 'n', 'verified'].forEach(f => { if (x[f] !== g[f]) { bad++; check(false, `${k} #${g.id}: ${f} differs`); } });
      if (JSON.stringify(x.meters) !== JSON.stringify(g.meters)) { bad++; check(false, `${k} #${g.id}: meters differ`); }
      check(!ids.has(g.id), `${k}: duplicate id ${g.id}`); ids.add(g.id);
      check(!g.url || /^https:\/\/(www\.)?(rekhta\.org\/ghazals\/|urdushahkar\.org\/|sufinama\.org\/)/.test(g.url), `${k} #${g.id}: odd link ${g.url}`);
      check(g.n === g.lines.length && g.n % 2 === 0, `${k} #${g.id}: ${g.lines.length} lines (n=${g.n})`);
      g.lines.forEach((l, li) => {
        lines++;
        const y = x.lines[li] || {};
        ['ur', 'hi', 'ro', 'ascii'].forEach(f => { if ((y[f] || '') !== (l[f] || '')) { bad++; if (bad < 6) check(false, `${k} #${g.id} line ${li + 1}: ${f} differs: ${JSON.stringify(y[f])} vs ${JSON.stringify(l[f])}`); } });
        check(l.ur, `${k} #${g.id} line ${li + 1}: missing Urdu`);
        // a Roman or Devanagari column that holds Urdu script would show Urdu in the wrong script mode (Rekhta's Iqbal pages do this)
        check(!/[\u0600-\u06FF]/.test(l.hi || '') && !/[\u0600-\u06FF]/.test(l.ro || ''), `${k} #${g.id} line ${li + 1}: Urdu script in the Roman or Devanagari column`);
      });
    });
  });
  check(bad === 0, bad + ' field(s) differ between the built app and data/poets_extended.json');
  check(lines > 17000, 'only ' + lines + ' lines');
  console.log(`  poets: ${lines} lines in ${keys.length} poets, identical to data/poets_extended.json`);
}

/* Ghalib and Mir: Pritchett's four fields per line */
const FRAN = ['ur', 'hi', 'ro', 'ascii'];
[['GHALIB_EXT_DATA', 'ghalib_extended.json', false], ['MIR_EXT_DATA', 'mir_extended.json', true]].forEach(([varName, file, isMir]) => {
  const got = vm.runInContext(varName, ctx), want = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', file), 'utf8'));
  check(Array.isArray(got) && got.length === want.length, `${varName}: ${got && got.length} ghazals in the app, ${want.length} in the data`);
  let n = 0, bad = 0;
  want.forEach((g, gi) => {
    const x = got[gi]; if (!x) return;
    const meta = { id: g.id, url: g.url || '', label: g.meter_label, n: g.lines_count };
    if (isMir) meta.source_id = g.source_id || '';
    Object.keys(meta).forEach(f => { if (x[f] !== meta[f]) { bad++; check(false, `${varName} #${g.id}: ${f} ${JSON.stringify(x[f])} vs ${JSON.stringify(meta[f])}`); } });
    if (JSON.stringify(x.meters) !== JSON.stringify(g.meters)) { bad++; check(false, `${varName} #${g.id}: meters differ`); }
    check(x.lines.length === g.lines.length, `${varName} #${g.id}: ${x.lines.length} lines vs ${g.lines.length}`);
    g.lines.forEach((l, li) => {
      n++;
      FRAN.forEach(f => { if (((x.lines[li] || {})[f] || '') !== (l[f] || '')) { bad++; if (bad < 6) check(false, `${varName} #${g.id} line ${li + 1}: ${f} differs`); } });
    });
  });
  check(bad === 0, `${varName}: ${bad} field(s) differ from data/${file}`);
  console.log(`  ${isMir ? 'mir' : 'ghalib'}: ${n} lines, identical to data/${file}`);
});
check((html.match(/"dict":\[/g) || []).length === 3, 'expected three packed dictionaries (poets, Ghalib, Mir) in the built page');
console.log(failures ? failures + ' failure(s)' : 'packed data OK');
process.exit(failures ? 1 : 0);
