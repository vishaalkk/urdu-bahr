/* Checks both engines against the worked scansions of the Pritchett/Khaliq Urdu Meter handbook.
   Data: tests/data/handbook_examples.json (facts only: word, printed pattern, section id).

     node tests/handbook_examples.js            summary; exit 1 on a failure not listed in tests/data/handbook_known_failures.json
     node tests/handbook_examples.js -v         list every failing example (expected vs actual)
     node tests/handbook_examples.js --json     machine-readable per-example results (used for docs/reviews/29)

   Two engines:
     lab   engine-lab (Pritchett-ASCII in; rules.json ids) -- readings enumerated from buildUnits
     prod  index.html (Urdu in) -- Scan.tokenize + Scan.buildUnits, loaded like tests/learn_examples.js
   Per example and engine we report
     top1  the cheapest reading (for grafting rows: the cheapest reading of the wanted kind, joined or unjoined)
     any   whether some reading matches (what an OPTION must satisfy)
   A reading matches when it has the same length and every slot agrees; handbook x accepts anything, an engine x accepts
   anything ("covered" instead of "exact"). A row passes when some reading matches (any); top1 is reported as a ranking column. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'handbook_examples.json'), 'utf8'));
const KF_FILE = path.join(__dirname, 'data', 'handbook_known_failures.json');
const KNOWN = fs.existsSync(KF_FILE) ? JSON.parse(fs.readFileSync(KF_FILE, 'utf8')) : { lab: [], prod: [], meters: [] };

/* ---------- production engine ---------- */
function loadProd() {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const blocks = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi).map(b => b.replace(/<\/?script[^>]*>/gi, ''));
  const el = id => ({ id, classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } }, addEventListener(){}, querySelectorAll: () => [], querySelector: () => null, textContent: '', innerHTML: '', style: {}, dataset: {} });
  const store = {};
  const ctx = { window: {}, console: { log(){}, warn(){}, error(){} }, setTimeout: () => 1, clearTimeout(){}, setInterval(){}, clearInterval(){},
    document: { getElementById: id => store[id] || (store[id] = el(id)), querySelectorAll: () => [], querySelector: () => el('q'), addEventListener(){}, documentElement: el('html'), body: el('body') },
    localStorage: { getItem: () => null, setItem(){}, removeItem(){} }, location: { hash: '', search: '' }, history: { replaceState(){} }, AudioContext: function(){ return {}; } };
  ctx.window = ctx; ctx.self = ctx; vm.createContext(ctx);
  blocks.forEach(code => { try { vm.runInContext(code, ctx); } catch (e) {} });
  return { Scan: ctx.Scan, get: n => vm.runInContext(n, ctx) };
}
const P = loadProd(), Scan = P.Scan;

/* ---------- engine-lab ---------- */
const E = require(path.join(root, 'engine-lab', 'engine.js'));
const SYM = { l: '=', s: '-', x: 'x' };

/* all readings of a phrase: [{pat:'= - x', cost, graft}], cheapest first */
function enumerate(units, n, pick) {
  const out = [];
  const go = (i, syl, cost, graft, ids) => {
    if (out.length > 6000) return;
    if (i >= n) { out.push({ pat: syl.join(' '), cost, graft, ids }); return; }
    for (const u of units[i]) for (const r of pick(u)) go(u.to + 1, syl.concat(r.syl.map(s => SYM[s.w] || '?')), cost + r.cost + (u.cost || 0), graft || !!u.graft, ids.concat((r.dec || []).map(d => d.id)));
  };
  go(0, [], 0, false, []);
  out.sort((a, b) => a.cost - b.cost);
  const seen = new Set();
  return out.filter(r => { const k = r.pat + '|' + r.graft; if (seen.has(k)) return false; seen.add(k); return true; });
}
function labReadings(ex) {
  let ae = ex.ae, trailingO = false;
  if (/-o$/.test(ae) && ae.split('-').length === 2) { trailingO = true; ae = ae.replace(/-o$/, ''); }
  const { words } = E.asciiWords(ae);
  if (!words.length) return [];
  if (trailingO) words[words.length - 1].conjO = true;
  const units = E.buildUnits(words);
  return enumerate(units, words.length, u => u.readings);
}
function prodReadings(ur) {
  const words = Scan.tokenize(ur);
  if (!words.length) return [];
  const units = Scan.buildUnits(words);
  return enumerate(units, words.length, u => u.opts.map(o => ({ syl: o.syl, cost: o.c })));
}

/* compare a candidate to the handbook pattern */
function cmp(cand, hb) {
  const a = cand.split(' '), b = hb.split(' ');
  if (a.length !== b.length) return null;
  let exact = true;
  for (let i = 0; i < a.length; i++) {
    if (a[i] === b[i]) continue;
    if (b[i] === 'x' || a[i] === 'x') { exact = false; continue; }
    return null;
  }
  return exact ? 'exact' : 'covered';
}
const rank = { exact: 2, covered: 1 };
function judge(ex, cands) {
  const want = ex.joined === false ? (r => !r.graft) : ex.joined === true && ex.section === '3.1' ? (r => r.graft) : (() => true);
  const pool = cands.filter(want);
  const hits = pool.map(r => ({ r, m: cmp(r.pat, ex.pattern) })).filter(h => h.m);
  const top = pool[0], top1 = top ? cmp(top.pat, ex.pattern) : null;
  const any = hits.length ? hits.reduce((b, h) => rank[h.m] > rank[b] ? h.m : b, 'covered') : null;
  const pass = !!any;   /* reachable: the meter can pick it. top1 is the ranking, reported separately */
  const shown = hits.length ? hits[0].r : top;
  return { pass, rules: shown ? [...new Set(shown.ids || [])] : [], top1, top1ok: !!top1, any, got: pool.slice(0, 4).map(r => r.pat), n: pool.length, exact: ex.kind === 'default' ? top1 === 'exact' : any === 'exact' };
}

const results = [];
for (const ex of DATA.examples) {
  const row = { id: ex.id, section: ex.section, ascii: ex.ascii, pattern: ex.pattern, kind: ex.kind, joined: ex.joined };
  for (const [eng, fn] of [['lab', () => labReadings(ex)], ['prod', () => prodReadings(ex.ur)]]) {
    try { row[eng] = judge(ex, fn()); } catch (e) { row[eng] = { pass: false, error: String(e.message || e), got: [], n: 0 }; }
  }
  results.push(row);
}

/* ---------- meters, rubai forms, afaail vs the meter tables ---------- */
const norm = s => s.replace(/[\s*]+/g, '').replace(/x/g, '=');   /* anceps first syllable of #14-19 printed = with a star */
const labM = new Map(E.METERS.map(m => [String(m.id), m.raw]));
const prodM = new Map(Scan.METERS.map(m => [String(m.id), m.raw]));
const meterRows = [];
for (const m of DATA.meters) {
  const id = String(m.id);
  for (const [eng, tab] of [['lab', labM], ['prod', prodM]]) {
    const got = tab.get(id);
    meterRows.push({ id: 'M' + id, eng, want: m.pattern, got: got || null, pass: !!got && norm(got) === norm(m.pattern) });
  }
}
for (const m of DATA.rubai) {
  const id = 'R' + m.id;
  for (const [eng, tab] of [['lab', labM], ['prod', prodM]]) {
    const got = tab.get(id);
    meterRows.push({ id, eng, want: m.pattern, got: got || null, pass: !!got && norm(got) === norm(m.pattern) });
  }
}
const FEET = Scan.FEET, feetKey = p => p.split(' ').map(c => c === '=' ? 'l' : 's').join('');
for (const a of DATA.afail) meterRows.push({ id: 'F:' + a.name, eng: 'prod', want: a.pattern, got: FEET[feetKey(a.pattern)] ? FEET[feetKey(a.pattern)][1] : null, pass: !!FEET[feetKey(a.pattern)] });

/* ---------- Learn page: every CONSTR after-pattern must equal the handbook's pattern for that phrase ---------- */
const learnRows = [];
try {
  const idx = new Map();
  DATA.examples.filter(e => e.joined === true).forEach(e => idx.set(e.ur.replace(/\s+/g, ' ').replace(/ِ/g, ''), e));
  for (const c of P.get('CONSTR')) for (const ex of c.ex) {
    const ur = ex[0]; if (/[←/]/.test(ur)) continue;
    const key = ur.replace(/\s+/g, ' ').replace(/ِ/g, '');
    const hb = idx.get(key); if (!hb) continue;
    const after = ex[3].replace(/\s+/g, ' ').trim();
    learnRows.push({ id: 'learn:' + c.t + ':' + ur, want: hb.pattern, got: after, pass: cmp(after, hb.pattern) !== null });
  }
} catch (e) { learnRows.push({ id: 'learn', pass: false, got: String(e) }); }

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ results, meterRows, learnRows }));
  process.exit(0);
}

/* ---------- report ---------- */
const bySec = {};
for (const r of results) {
  const s = bySec[r.section] = bySec[r.section] || { n: 0, d: 0 };
  s.n++; if (r.kind === 'default') s.d++;
  for (const e of ['lab', 'prod']) { s[e] = (s[e] || 0) + (r[e].pass ? 1 : 0); s[e + 'T'] = (s[e + 'T'] || 0) + (r.kind === 'default' && r[e].top1ok ? 1 : 0); }
}
console.log('section   n  defaults | lab: reachable  top1(defaults) | prod: reachable  top1(defaults)');
for (const k of Object.keys(bySec).sort((a, b) => parseFloat(a) - parseFloat(b))) {
  const s = bySec[k];
  console.log(k.padEnd(7), String(s.n).padStart(3), String(s.d).padStart(6), '   |', String(s.lab).padStart(8), String(s.labT).padStart(10), '      |', String(s.prod).padStart(8), String(s.prodT).padStart(10));
}
const tot = e => results.filter(r => r[e].pass).length;
const totT = e => results.filter(r => r.kind === 'default' && r[e].top1ok).length;
console.log(`TOTAL ${results.length} (${results.filter(r => r.kind === 'default').length} default): lab reachable ${tot('lab')}, top1 ${totT('lab')}; prod reachable ${tot('prod')}, top1 ${totT('prod')}`);
const mp = e => meterRows.filter(r => r.eng === e && r.id[0] !== 'F');
console.log(`meter tables: lab ${mp('lab').filter(r => r.pass).length}/${mp('lab').length}, prod ${mp('prod').filter(r => r.pass).length}/${mp('prod').length}; afaail known to prod ${meterRows.filter(r => r.id[0] === 'F' && r.pass).length}/${DATA.afail.length}`);
console.log(`Learn after-patterns vs handbook: ${learnRows.filter(r => r.pass).length}/${learnRows.length}`);

let unexpected = 0;
const fails = [];
for (const r of results) for (const e of ['lab', 'prod']) if (!r[e].pass) {
  const known = (KNOWN[e] || []).includes(r.id);
  if (!known) unexpected++;
  fails.push(`${known ? 'known ' : 'NEW   '}${e.padEnd(4)} ${r.id} ${r.ascii} [${r.kind}${r.joined === null ? '' : r.joined ? ', joined' : ', unjoined'}] want ${r.pattern} | got ${r[e].error ? 'ERROR ' + r[e].error : (r[e].got.join(' ; ') || 'nothing')}`);
}
for (const r of meterRows.filter(r => !r.pass && r.id[0] !== 'F')) { const known = (KNOWN.meters || []).includes(r.eng + ':' + r.id); if (!known) unexpected++; fails.push(`${known ? 'known ' : 'NEW   '}${r.eng.padEnd(4)} ${r.id} table: handbook ${r.want} | ours ${r.got}`); }
for (const r of learnRows.filter(r => !r.pass)) { unexpected++; fails.push(`NEW   learn ${r.id}: handbook ${r.want} | page ${r.got}`); }
const fixed = [];
for (const e of ['lab', 'prod']) for (const id of KNOWN[e] || []) { const r = results.find(x => x.id === id); if (r && r[e].pass) fixed.push(e + ' ' + id); }
if (process.argv.includes('-v')) fails.forEach(f => console.log(f)); else fails.filter(f => f.startsWith('NEW')).forEach(f => console.log(f));
if (process.argv.includes('-t')) for (const r of results) for (const e of ['lab', 'prod']) if (r.kind === 'default' && r[e].pass && !r[e].top1ok) console.log(`top1  ${e.padEnd(4)} ${r.id} ${r.ascii} [${r.joined === null ? '' : r.joined ? 'joined' : 'unjoined'}] want ${r.pattern} | best ${r[e].got.join(' ; ')}`);
if (fixed.length) console.log('now passing, remove from handbook_known_failures.json: ' + fixed.join(', '));
if (unexpected) { console.log(unexpected + ' failure(s) not in the known-failures list'); process.exit(1); }
console.log('handbook examples ok (known failures tolerated: ' + fails.filter(f => f.startsWith('known')).length + ')');
