/* The Weight > Learn page states word weights and "before" patterns by hand (src/js/21-learn.js).
   This runs each of them through the engine so the page can't drift from it.
   WORDS/FLEX: the engine must offer the stated weights. CONSTR: the unjoined ("before") pattern of every
   example built from separate words must equal the engine's plain scan of those words (after-patterns are
   the handbook's joined readings, covered by tests/handbook_examples.js when present). */
const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const blocks = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi).map(b => b.replace(/<\/?script[^>]*>/gi, ''));
const el = id => ({ id, classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } }, addEventListener(){}, querySelectorAll: () => [], querySelector: () => null, textContent: '', innerHTML: '', style: {}, dataset: {} });
const store = {};
const ctx = { window: {}, console: { log(){}, warn(){}, error(){} }, setTimeout: () => 1, clearTimeout(){}, setInterval(){}, clearInterval(){},
  document: { getElementById: id => store[id] || (store[id] = el(id)), querySelectorAll: () => [], querySelector: () => el('q'), addEventListener(){}, documentElement: el('html'), body: el('body') },
  localStorage: { getItem: () => null, setItem(){}, removeItem(){} }, location: { hash: '', search: '' }, history: { replaceState(){} }, AudioContext: function(){ return {}; } };
ctx.window = ctx; ctx.self = ctx; vm.createContext(ctx);
blocks.forEach(code => { try { vm.runInContext(code, ctx); } catch (e) {} });
const Scan = ctx.Scan, get = n => vm.runInContext(n, ctx);
let fails = 0; const bad = m => { fails++; console.log('FAIL: ' + m); };
const wt = o => o.syl.map(s => s.w).join('');
const optsOf = w => (Scan.scanWord(w).opts || []).map(wt);

for (const [u, r, exp] of get('WORDS')) { const e = exp.join(''); if (!optsOf(u.split(/\s+/)[0]).includes(e)) bad(`WORDS ${u} (${r}) states ${e}, engine offers ${optsOf(u.split(/\s+/)[0]).join(' | ')}`); }
for (const [u, e] of get('FLEX')) { const o = optsOf(u); if (!o.some(x => x === e || x[0] === e)) bad(`FLEX ${u} states ${e}, engine offers ${o.join(' | ')}`); }
for (const c of get('CONSTR')) for (const ex of c.ex) {
  const [ur, , before] = ex;
  if (/[←/]/.test(ur)) continue;                                   /* single-word transformations, not separate words */
  const ws = ur.split(/\s+/).filter(Boolean); if (ws.length < 2) continue;
  if (!before) continue;                                           /* only the joined reading is shown */
  /* the stated plain reading must be reachable from the engine's per-word options (the handbook's normal reading is
     not always the engine's cheapest, e.g. agar) */
  const norm = o => wt(o).replace(/l/g, '=').replace(/s/g, '-').replace(/x/g, '=');
  const optsPer = ws.map(w => (Scan.scanWord(w).opts || []).map(norm));
  const reach = optsPer.reduce((acc, os) => acc.flatMap(a => os.map(o => a + o)), ['']);
  const want = before.replace(/\s+/g, '').replace(/x/g, '=');
  if (!reach.includes(want)) bad(`CONSTR "${c.t}" ${ur}: page says before ${before}, engine's plain readings are ${[...new Set(reach)].join(' | ')}`);
}
if (fails) { console.log(fails + ' Learn example(s) disagree with the engine'); process.exit(1); }
console.log('learn examples ok');
