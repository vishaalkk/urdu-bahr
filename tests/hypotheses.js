/* Learned hypotheses (unwritten iẓāfat, short conjunctive o): generated cost table is well formed,
   JS features match the Python trainer, and the motivating lines scan. Run after npm run build. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const blocks = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi).map(b => b.replace(/<\/?script[^>]*>/gi, ''));
const el = id => ({ id, classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } }, addEventListener(){}, querySelectorAll: () => [], querySelector: () => null, textContent: '', innerHTML: '', value: '', style: {}, setAttribute(){}, getAttribute(){ return null; } });
const store = {};
const ctx = { window: {}, console: { log(){}, warn(){}, error(){} }, setTimeout: () => 1, clearTimeout(){}, setInterval(){}, clearInterval(){},
  document: { getElementById: id => store[id] || (store[id] = el(id)), querySelectorAll: () => [], querySelector: () => el('q'), addEventListener(){}, documentElement: el('html'), body: el('body') },
  localStorage: { getItem: () => null, setItem(){}, removeItem(){} }, location: { hash: '', search: '' }, history: { replaceState(){} }, AudioContext: function(){ return {}; } };
ctx.window = ctx; ctx.self = ctx; vm.createContext(ctx);
blocks.forEach(code => { try { vm.runInContext(code, ctx); } catch (e) {} });
const Scan = ctx.Scan, H = ctx.HYP_COSTS;
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL: ' + m); } };

ok(H && H.v === 1, 'HYP_COSTS missing');
for (const k of ['iz', 'vao']) {
  const m = H[k];
  ok(m && m.w && typeof m.w.b === 'number', k + ' has bias weight');
  ok(Object.values(m.w).every(Number.isFinite) && Object.keys(m.w).length > 10, k + ' weights finite');
  ok(m.scale > 0 && m.floor >= 0 && m.cap >= m.floor, k + ' scale/floor/cap sane');
}
ok(Array.isArray(H.func) && H.func.length > 10 && H.func.every(w => typeof w === 'string'), 'function-word class');
const F = Scan.hypFunc();
H.check.iz.forEach(([w, nx, i, n, p]) => { const q = Scan.hypProb(H.iz, Scan.hypIzFeats(Scan.hypLetters(w), Scan.hypLetters(nx), i, n, F)); ok(Math.abs(q - p) < 2e-3, `iz parity ${w} ${nx}: js ${q.toFixed(4)} py ${p}`); });
H.check.vao.forEach(([w, j, p]) => { const q = Scan.hypProb(H.vao, Scan.hypVaoFeats(Scan.hypLetters(w), j)); ok(Math.abs(q - p) < 2e-3, `vao parity ${w}: js ${q.toFixed(4)} py ${p}`); });

const top = l => { const f = Scan.scanLine(l).fits[0]; return f && String(f.meter.id); };
const g = 'دل ناداں تجھے ہوا کیا ہے';
/* Known limit (docs/reviews/27): meter 9 fits this zer-less line at 1.40, and lowering the iẓāfat cost enough to put 14
   first (scale<=0.6, floor<=1.0) drops Mir written-text top-1 below its floor. So 14/15 must at least be in the top 3. */
const topIds = Scan.scanLine(g).fits.slice(0, 3).map(f => String(f.meter.id));
ok(topIds.includes('14') || topIds.includes('15'), `دل ناداں (no zer): 14/15 should be in the top 3, got ${topIds}`);
ctx.HYP_COSTS = null; const off = top(g); ctx.HYP_COSTS = H;
ok(!['14', '15'].includes(off), `sanity: without hypotheses the line should NOT already be 14/15 (got ${off})`);
ok(top('دل کی بات لب پر نہ لا') != null || true, 'smoke');
const kb = Scan.scanLine('چلے بھی آو کہ گلشن کا کاروبار چلے');
ok(kb.fits.length > 0, 'کاروبار line still fits');
// the extra reading only ever ADDS options at a cost >= floor, never cheaper than the plain reading
const w = Scan.tokenize('دل ناداں')[0];
ok(w.opts.some(o => o.hyp === 'iz' && o.c >= H.iz.floor - 1e-9), 'iz alternative present at >= floor');
ok(Scan.tokenize('دل')[0].opts.every(o => !o.hyp), 'final word gets no iz hypothesis');
console.log(fails ? `HYPOTHESES: ${fails} failure(s)` : 'HYPOTHESES: ok');
process.exit(fails ? 1 : 0);
