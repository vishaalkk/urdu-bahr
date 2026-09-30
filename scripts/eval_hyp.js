/* Meter top-1 per corpus with the learned hypotheses OFF vs ON, on the text as written and with every mark
   stripped (how people type). Usage: node scripts/eval_hyp.js [--quick]. Needs a fresh build (index.html). */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..'), QUICK = process.argv.includes('--quick');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const blocks = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi).map(b => b.replace(/<\/?script[^>]*>/gi, ''));
const el = id => ({ id, classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } }, addEventListener(){}, querySelectorAll: () => [], querySelector: () => null, textContent: '', innerHTML: '', value: '', style: {}, setAttribute(){}, getAttribute(){ return null; } });
const store = {};
const ctx = { window: {}, console: { log(){}, warn(){}, error(){} }, setTimeout: () => 1, clearTimeout(){}, setInterval(){}, clearInterval(){},
  document: { getElementById: id => store[id] || (store[id] = el(id)), querySelectorAll: () => [], querySelector: () => el('q'), addEventListener(){}, documentElement: el('html'), body: el('body') },
  localStorage: { getItem: () => null, setItem(){}, removeItem(){} }, location: { hash: '', search: '' }, history: { replaceState(){} }, AudioContext: function(){ return {}; } };
ctx.window = ctx; ctx.self = ctx; vm.createContext(ctx);
blocks.forEach(code => { try { vm.runInContext(code, ctx); } catch (e) {} });
const Scan = ctx.Scan, HYP = ctx.HYP_COSTS;
if (!HYP) { console.error('HYP_COSTS missing: run learn_hypotheses.py --export and build'); process.exit(2); }
for (const k of ['iz', 'vao']) { const a = process.argv.find(x => x.startsWith('--' + k + '=')); if (a) { const [scale, floor, cap] = a.split('=')[1].split(',').map(Number); Object.assign(HYP[k], { scale, floor, cap }); } }   // --iz=scale,floor,cap
const strip = s => s.normalize('NFC').replace(/[ً-ّٰٟ]/g, '').replace(/[ۂۀ]/g, 'ہ');
const normPat = p => (p || '').replace(/\/\//g, '/').replace(/\s+/g, ' ').trim();
const byPat = {}; Scan.METERS.forEach(m => { if (m.raw) (byPat[normPat(m.raw)] = byPat[normPat(m.raw)] || []).push(String(m.id)); });
const rd = f => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
const sets = { ghalib: rd('data/ghalib_extended.json'), mir: rd('data/mir_extended.json'), handbook: rd('data/exercises_verified.json'),
  iqbal: rd('data/iqbal_corpus.json').map(g => Object.assign({}, g, { meters: byPat[normPat(g.meter)] || [] })), urdupoetry: rd('data/urdupoetry_verses.json') };
function top1(gs, tf) {
  let n = 0, ok = 0;
  gs.forEach((g, gi) => { if (QUICK && gi % 8) return; const want = new Set((g.meters || []).map(String)); if (!want.size) return;
    for (const l of g.lines) { if (!l.ur) continue; n++; const f = (Scan.scanLine(tf(l.ur)).fits || [])[0]; if (f && want.has(String(f.meter.id))) ok++; } });
  return [n, ok];
}
const DIFF = (process.argv.find(x => x.startsWith('--diff=')) || '').split('=')[1];   // --diff=handbook[:strip]: print lines whose top-1 flips
if (DIFF) { const [nm, mode] = DIFF.split(':'), tf = mode === 'strip' ? strip : s => s;
  for (const g of sets[nm]) { const want = new Set((g.meters || []).map(String)); for (const l of g.lines) { if (!l.ur) continue;
    const r = [null, HYP].map(h => { ctx.HYP_COSTS = h; const f = (Scan.scanLine(tf(l.ur)).fits || [])[0]; return [f && want.has(String(f.meter.id)), f && f.meter.id, f && +f.c.toFixed(2)]; });
    if (r[0][0] !== r[1][0]) console.log(r[0][0] ? 'LOST ' : 'GAINED', 'want', [...want].join('/'), 'off', r[0][1], r[0][2], 'on', r[1][1], r[1][2], l.ur); } }
  process.exit(0); }
const pct =([n, k]) => (n ? (100 * k / n).toFixed(2) : '-').padStart(6);
console.log('corpus       lines |  written: off     on  |  stripped: off     on');
for (const [name, gs] of Object.entries(sets)) {
  const r = {};
  for (const mode of ['off', 'on']) { ctx.HYP_COSTS = mode === 'on' ? HYP : null; r[mode + 'W'] = top1(gs, s => s); r[mode + 'S'] = top1(gs, strip); }
  console.log(`${name.padEnd(11)} ${String(r.offW[0]).padStart(5)} |         ${pct(r.offW)} ${pct(r.onW)}  |           ${pct(r.offS)} ${pct(r.onS)}`);
}
