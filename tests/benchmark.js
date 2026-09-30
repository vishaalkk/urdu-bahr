/* Fran Pritchett's Ghalib and Mir are the standard. This benchmark measures the app
   against her transcriptions (data/ghalib_extended.json, data/mir_extended.json: her
   ASCII → Urdu/Devanagari/Roman via Sean Pue's parsers, and her meter for every ghazal)
   and fails if ANY score drops below tests/benchmark_baseline.json. Improvements are
   reported; record them with `node tests/benchmark.js --update` (never lowers a floor).

   Scores, per corpus:
     meter.top1 / meter.top3   engine's meter for each line = her meter for the ghazal
     verbatim.roman / .hindi   her own line, typed as she spells it, shows her exact Roman / Devanagari
     typed.romanWord / .hindiWord / .romanLine
                               her line typed WITHOUT diacritics (how people type Urdu), bypassing the
                               verbatim-verse lookup: word accuracy / exact lines of the fallback path
   Run: node tests/benchmark.js [--update] [--quick] [--misses=N] */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const UPDATE = process.argv.includes('--update'), QUICK = process.argv.includes('--quick');
const MISSES = +((process.argv.find(a => a.startsWith('--misses=')) || '').split('=')[1] || 0);   // print N examples of each miss kind
const BASE_FILE = path.join(__dirname, 'benchmark_baseline.json');
const TOL = 0.05;                                   // percentage points of noise we accept

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const blocks = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi).map(b => b.replace(/<\/?script[^>]*>/gi, ''));
const el = id => ({ id, classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } }, addEventListener(){}, querySelectorAll: () => [], querySelector: () => null, textContent: '', innerHTML: '', value: '', style: {}, setAttribute(){}, getAttribute(){ return null; } });
const store = {};
const ctx = { window: {}, console: { log(){}, warn(){}, error(){} }, setTimeout: () => 1, clearTimeout(){}, setInterval(){}, clearInterval(){},
  document: { getElementById: id => store[id] || (store[id] = el(id)), querySelectorAll: () => [], querySelector: () => el('q'), addEventListener(){}, documentElement: el('html'), body: el('body') },
  localStorage: { getItem: () => null, setItem(){}, removeItem(){} }, location: { hash: '', search: '' }, history: { replaceState(){} }, AudioContext: function(){ return {}; } };
ctx.window = ctx; ctx.self = ctx;
vm.createContext(ctx);
blocks.forEach(code => { try { vm.runInContext(code, ctx); } catch (e) { /* UI boot needs a real DOM; the pieces we use are defined */ } });
const Scan = ctx.Scan, lineScripts = ctx.lineScripts;
if (!Scan || typeof lineScripts !== 'function' || !ctx.window.p_di) { console.error('benchmark: engine / lineScripts / parsers not loaded — run npm run build'); process.exit(2); }

const strip = s => s.normalize('NFC').replace(/[ً-ٰٟ]/g, '');   // typed Urdu: no harakat, tashdīd, or izāfat zer
const words = s => (s || '').replace(/[،۔؟!?,.;:"«»()]/g, ' ').trim().split(/\s+/).filter(Boolean);
const pct = (a, b) => b ? +(100 * a / b).toFixed(2) : 0;

function run(name, file) {
  let ghazals = JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
  if (QUICK) ghazals = ghazals.filter((_, i) => i % 10 === 0);
  const n = { lines: 0, m1: 0, m3: 0, mLines: 0, vr: 0, vh: 0, tw: 0, twOk: 0, thOk: 0, tl: 0 };
  for (const g of ghazals) {
    const want = new Set((g.meters || []).map(String));
    for (const l of g.lines) {
      n.lines++;
      if (want.size) {
        n.mLines++;
        const fits = Scan.scanLine(l.ur).fits || [];
        if (fits[0] && want.has(String(fits[0].meter.id))) n.m1++;
        if (fits.slice(0, 3).some(f => want.has(String(f.meter.id)))) n.m3++;
      }
      const v = lineScripts(l.ur);
      if (v && v.ro === l.ro) n.vr++;
      else if (MISSES && (n.vShown = (n.vShown || 0) + 1) <= MISSES) console.log(`  [${name} verbatim] ${l.ur}\n     want ${l.ro}\n     got  ${v && v.ro}${v && v.isApprox ? ' (approx)' : ''}`);
      if (v && v.hi === l.hi) n.vh++;
      const t = lineScripts(strip(l.ur), { skipKnown: true }) || {};
      const tr = words(t.ro), wr = words(l.ro), th = words(t.hi), wh = words(l.hi);
      n.tw += wr.length;
      wr.forEach((w, i) => { if (tr[i] === w) n.twOk++; });
      wh.forEach((w, i) => { if (th[i] === w) n.thOk++; });
      if (t.ro === l.ro) n.tl++;
      else if (MISSES && (n.tShown = (n.tShown || 0) + 1) <= MISSES) console.log(`  [${name} typed] ${strip(l.ur)}\n     want ${l.ro}\n     got  ${t.ro}`);
    }
  }
  return { lines: n.lines,
    'meter.top1': pct(n.m1, n.mLines), 'meter.top3': pct(n.m3, n.mLines),
    'verbatim.roman': pct(n.vr, n.lines), 'verbatim.hindi': pct(n.vh, n.lines),
    'typed.romanWord': pct(n.twOk, n.tw), 'typed.hindiWord': pct(n.thOk, n.tw), 'typed.romanLine': pct(n.tl, n.lines) };
}

/* Held-out report (never gated, never in the baseline): corpora the engine's rules and lexicon were
   NOT tuned on. A change that lifts Ghalib/Mir but drops these is probably fitting one poet's vocabulary. */
function heldOut() {
  const normPat = p => (p || '').replace(/\/\//g, '/').replace(/\s+/g, ' ').trim();
  const byPat = {}; (Scan.METERS || []).forEach(m => { if (m.raw) (byPat[normPat(m.raw)] = byPat[normPat(m.raw)] || []).push(String(m.id)); });
  const sets = [];
  const rd = f => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
  sets.push(['handbook', rd('data/exercises_verified.json').map(g => ({ want: new Set((g.meters || []).map(String)), lines: g.lines }))]);
  sets.push(['iqbal', rd('data/iqbal_corpus.json').map(g => ({ want: new Set(byPat[normPat(g.meter)] || []), lines: g.lines }))]);
  sets.push(['urdupoetry', rd('data/urdupoetry_verses.json').map(g => ({ want: new Set((g.meters || []).map(String)), lines: g.lines }))]);
  console.log('held-out (report only, not gated)');
  for (const [name, gs] of sets) {
    let n = 0, m1 = 0, m3 = 0;
    for (const g of gs) { if (!g.want.size) continue; for (const l of g.lines) { if (!l.ur || words(l.ur).length < 3) continue; /* <3 words = speaker label, not verse */ n++; const fits = Scan.scanLine(l.ur).fits || []; if (fits[0] && g.want.has(String(fits[0].meter.id))) m1++; if (fits.slice(0, 3).some(f => g.want.has(String(f.meter.id)))) m3++; } }
    console.log(`  ${name.padEnd(11)} ${String(n).padStart(4)} lines   top1 ${pct(m1, n).toFixed(2).padStart(6)}%   top3 ${pct(m3, n).toFixed(2).padStart(6)}%`);
  }
}

/* Typed-Roman accuracy with the word map REBUILT WITHOUT the corpus being scored (report only, not gated).
   WORD_ASCII_MAP is built from these same lines, so the gated typed.* scores partly measure memorized spellings;
   this shows what a word map that has never seen the poet gives. Same construction as scripts/build_app.py. */
function leaveOneOut() {
  const rd = f => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
  const corp = { handbook: rd('data/exercises_verified.json'), ghalib: rd('data/ghalib_extended.json'), mir: rd('data/mir_extended.json'),
    iqbal: rd('data/iqbal_corpus.json').filter(p => p.lines && p.lines[0] && typeof p.lines[0] === 'object') };
  const splitHy = toks => { const out = []; for (const t of toks) t.split('-').forEach((p, i) => { if (i && (p === 'e' || p === 'ye') && out.length) out[out.length - 1] += '-' + p; else if (p) out.push(p); }); return out; };
  const buildMap = names => {
    const freq = new Map();
    for (const nm of names) for (const g of corp[nm]) for (const l of g.lines) {
      const uw = l.ur.split(/\s+/).filter(Boolean); let aw = l.ascii.split(/\s+/).filter(Boolean);
      if (uw.length !== aw.length) aw = splitHy(aw);
      if (uw.length !== aw.length) continue;
      uw.forEach((u, i) => { const k = u + '\u0000' + aw[i]; freq.set(k, (freq.get(k) || 0) + 1); });
    }
    const best = new Map();
    for (const [k, c] of freq) { const [u, a] = k.split('\u0000'); if (!best.has(u) || c > best.get(u)[1]) best.set(u, [a, c]); }
    const m = {}; for (const [u, [a]] of best) m[u] = a; return m;
  };
  const MAP = require('vm').runInContext('WORD_ASCII_MAP', ctx), full = Object.assign({}, MAP);
  const setMap = m => { for (const k of Object.keys(MAP)) delete MAP[k]; Object.assign(MAP, m); require('vm').runInContext('_wordAsciiNorm = null', ctx); };
  const score = (name, gs, step) => { let tw = 0, ok = 0, ln = 0, lo = 0;
    gs.forEach((g, gi) => { if (gi % step) return; for (const l of g.lines) { if (!l.ur || !l.ro) continue; const t = lineScripts(strip(l.ur), { skipKnown: true }) || {};
      const tr = words(t.ro), wr = words(l.ro); tw += wr.length; wr.forEach((w, i) => { if (tr[i] === w) ok++; }); ln++; if (t.ro === l.ro) lo++; } });
    return [pct(ok, tw), pct(lo, ln)]; };
  console.log('typed Roman, word map WITH vs WITHOUT the scored corpus (report only; ghalib/mir every 5th ghazal)');
  try {
    for (const nm of Object.keys(corp)) {
      const step = (nm === 'ghalib' || nm === 'mir') ? 5 : 1;
      setMap(full); const w = score(nm, corp[nm], step);
      setMap(buildMap(Object.keys(corp).filter(k => k !== nm))); const wo = score(nm, corp[nm], step);
      let iz = null;
      if (require('vm').runInContext("typeof HYP_TAU", ctx) !== 'undefined') { require('vm').runInContext('HYP_TAU = 0.5', ctx); iz = score(nm, corp[nm], step); require('vm').runInContext('HYP_TAU = null', ctx); }
      console.log(`  ${nm.padEnd(9)} word ${w[0].toFixed(1).padStart(5)}% -> ${wo[0].toFixed(1).padStart(5)}%${iz ? ' (learned iz ' + iz[0].toFixed(1) + '%)' : ''}    line ${w[1].toFixed(1).padStart(5)}% -> ${wo[1].toFixed(1).padStart(5)}%${iz ? ' (learned iz ' + iz[1].toFixed(1) + '%)' : ''}`);
    }
  } finally { setMap(full); }
}

const t0 = Date.now();
const res = { ghalib: run('ghalib', 'data/ghalib_extended.json'), mir: run('mir', 'data/mir_extended.json') };
const base = fs.existsSync(BASE_FILE) ? JSON.parse(fs.readFileSync(BASE_FILE, 'utf8')) : null;
let fails = 0, better = 0;
for (const [corpus, r] of Object.entries(res)) {
  console.log(`${corpus} (${r.lines} lines)`);
  for (const [k, v] of Object.entries(r)) {
    if (k === 'lines') continue;
    const b = base && base[corpus] && base[corpus][k];
    let mark = ' ';
    if (!QUICK && b != null) { if (v < b - TOL) { mark = '✗'; fails++; } else if (v > b + TOL) { mark = '↑'; better++; } else mark = '✓'; }
    console.log(`  ${mark} ${k.padEnd(16)} ${v.toFixed(2).padStart(6)}%${b != null ? `   (floor ${b.toFixed(2)})` : ''}`);
  }
}
try { heldOut(); } catch (e) { console.log('held-out report skipped: ' + e.message); }
if (!QUICK) { try { leaveOneOut(); } catch (e) { console.log('leave-one-out report skipped: ' + e.message); } }
console.log(`(${((Date.now() - t0) / 1000).toFixed(1)}s)`);
if (QUICK) { console.log('BENCHMARK: quick sample — not compared to the floor'); process.exit(0); }
if (UPDATE || !base) {
  const next = {};
  for (const [c, r] of Object.entries(res)) { next[c] = {}; for (const [k, v] of Object.entries(r)) next[c][k] = k === 'lines' ? v : Math.max(v, (base && base[c] && base[c][k]) || 0); }
  if (fails && UPDATE) { console.log(`BENCHMARK: ${fails} score(s) regressed — floor NOT updated`); process.exit(1); }
  fs.writeFileSync(BASE_FILE, JSON.stringify(next, null, 2) + '\n');
  console.log('BENCHMARK: floor written to tests/benchmark_baseline.json');
  process.exit(0);
}
if (fails) { console.log(`BENCHMARK: ${fails} score(s) fell below Fran's-corpus floor`); process.exit(1); }
console.log(`BENCHMARK: no regressions${better ? ` (${better} improved — run with --update to raise the floor)` : ''}`);
