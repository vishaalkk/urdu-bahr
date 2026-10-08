/* Persian benchmark: the shipped Persian ghazals (data/poets_extended.json, lang "fa") scanned by the built engine with
   their Roman's hints (rekhtaScanText), and the shipped ghazal meters checked against Ganjoor's editors
   (tests/data/persian_gold.json, scripts/match_ganjoor.py). Fails if a score drops below tests/benchmark_fa_baseline.json;
   record improvements with `node tests/benchmark_fa.js --update` (never lowers a floor). Ghalib/Mir: tests/benchmark.js.

   Scores (Persian lines only; an Urdu girah inside Persian kalaam is left out), for two sets: core = the first 102 ghazals
   (tests/data/persian_core_urls.json: Jami, Bu Ali, Khusrau and the first top-100 intake), so new, harder kalaam can never
   hide a regression there; all = every Persian ghazal shipped.
     *.cost0         best regular-meter fit costs 0
     *.fit2          best regular-meter fit costs ≤ 2
     *.own2          the ghazal's own meter fits the line at ≤ 2
     gold.meter      shipped ghazal meter = Ganjoor's (where Ganjoor's meter is one of ours), sure matches only
     translit.word   held out: a Persian word list learned WITHOUT six poets (Hafiz, Rumi, Saadi, ʿIrāqī, Bedil, Fard Phulwarwi)
                     gives their words the Roman Sufinama gives them (the app's faWordScripts, letter map when unknown)
   And always: no Persian ghazal or line is given the Hindi meter. */
const fs = require('fs'), path = require('path');
const { loadEngine } = require('../scripts/lib_scan');
const ROOT = path.join(__dirname, '..');
const UPDATE = process.argv.includes('--update');
const BASE_FILE = path.join(__dirname, 'benchmark_fa_baseline.json');
const TOL = 0.05;

const { Scan: ScanUr, ctx } = loadEngine();
/* Persian lines are scored on the Persian engine (ScanFa), as the app scans them */
const { Scan } = require('../scripts/lib_fa_scan').loadFaEngine();
const poets = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/poets_extended.json'), 'utf8'));
const gold = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/persian_gold.json'), 'utf8'))
  .filter(g => g.ganjoor && g.ganjoor.hits >= 3 && g.ganjoor.metre_id);
/* where Ganjoor's meter belongs to a larger poem the ghazal sits in, the reason is recorded here */
const OVERRIDE = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/persian_gold_overrides.json'), 'utf8'));
const faMeters = new Map(JSON.parse(fs.readFileSync(path.join(ROOT, 'data/persian_meters.json'), 'utf8')).map(m => [m.gid, m]));
const PAIRED = new Map(JSON.parse(fs.readFileSync(path.join(ROOT, 'data/meters.json'), 'utf8')).standard.map(m => [String(m.id), m.paired.map(String)]));
const pct = (a, b) => b ? +(100 * a / b).toFixed(2) : 0;

const CORE = new Set(JSON.parse(fs.readFileSync(path.join(__dirname, 'data/persian_core_urls.json'), 'utf8')));
const tally = { core: { n: 0, c0: 0, f2: 0, o2: 0 }, all: { n: 0, c0: 0, f2: 0, o2: 0 } };
let hindi = 0;
const byUrl = new Map();
for (const gs of Object.values(poets.ghazals)) for (const g of gs) {
  if (g.lang !== 'fa') continue;
  byUrl.set(g.url, g);
  if ((g.meters || []).map(String).includes('H')) hindi++;
  const own = new Set((g.meters || []).flatMap(m => [String(m), ...(PAIRED.get(String(m)) || [])]));
  const xl = new Set(g.xl || []);
  g.lines.forEach((l, i) => {
    if (xl.has(i) || !l.ur) return;
    const fits = (Scan.scanLine(ctx.rekhtaScanText(l.ur, l.ro || '')).fits || []).filter(f => f.meter.id !== 'H');
    const best = fits.length ? fits[0].c : Infinity;
    const ownFit = fits.some(f => own.has(String(f.meter.id)) && f.c <= 2);
    [tally.all].concat(CORE.has(g.url) ? [tally.core] : []).forEach(t => {
      t.n++; if (best === 0) t.c0++; if (best <= 2) t.f2++; if (ownFit) t.o2++;
    });
  });
}
let right = 0, judged = 0, persianOnly = 0;
const wrong = [];
for (const g of gold) {
  const m = faMeters.get(g.ganjoor.metre_id), shipped = byUrl.get(g.url);
  if (!shipped) continue;
  /* Ganjoor's meter as one of ours: an Urdu meter, or the Persian engine's F<Ganjoor id> */
  const want = (OVERRIDE[g.url] ? OVERRIDE[g.url].meter : (m && m.urdu.length ? m.urdu : (Scan.METERS.some(x => x.id === 'F' + g.ganjoor.metre_id) ? ['F' + g.ganjoor.metre_id] : []))).map(String);
  if (!want.length) { persianOnly++; continue; }
  judged++;
  const got = (shipped.meters || []).map(String);
  if (got.some(x => want.includes(x))) right++; else wrong.push(`${g.url.split('/').pop()}: Ganjoor ${want} / shipped ${got}`);
}

/* held-out transliteration: learn the Persian word list from every Persian ghazal except six poets', score those six */
const { mine, finalize, pairsOf, romanNorm } = require('../scripts/lib_fa_lexicon');
const HELD_OUT = new Set(['hafiz', 'rumi', 'saadi', 'iraqi', 'bedil', 'fard_phulwarwi']);
const train = [], test = [];
for (const [k, gs] of Object.entries(poets.ghazals)) for (const g of gs) {
  if (g.lang !== 'fa') continue;
  const xl = new Set(g.xl || []);
  const g2 = { url: g.url, lang: 'fa', lines: g.lines.filter((_, i) => !xl.has(i)) };
  (HELD_OUT.has(k) ? test : train).push(g2);
}
ctx.setFaLexicon(finalize(mine(train)));
let tw = 0, tOk = 0, tBase = 0;
for (const g of test) for (const p of pairsOf(g)) {
  const w = p.key;
  const fa = ctx.faWordScripts(w);
  tw++;
  if (romanNorm(fa ? fa.ro : ctx.urduToRoman(w)) === romanNorm(p.ro)) tOk++;
  if (romanNorm(ctx.urduToRoman(w)) === romanNorm(p.ro)) tBase++;
}
ctx.setFaLexicon(null);
console.log(`translit: ${tw} held-out words; the Urdu letter map alone gets ${pct(tBase, tw).toFixed(1)}%`);

const scores = {};
for (const [set, t] of Object.entries(tally)) Object.assign(scores, { [set + '.cost0']: pct(t.c0, t.n), [set + '.fit2']: pct(t.f2, t.n), [set + '.own2']: pct(t.o2, t.n) });
scores['gold.meter'] = pct(right, judged);
scores['translit.word'] = pct(tOk, tw);
const n = tally.all.n;
const base = fs.existsSync(BASE_FILE) ? JSON.parse(fs.readFileSync(BASE_FILE, 'utf8')) : {};
console.log(`persian (${n} lines, ${byUrl.size} ghazals; gold ${judged} ghazals + ${persianOnly} in a Persian-only meter)`);
let fails = 0, better = 0;
for (const [k, v] of Object.entries(scores)) {
  const floor = base[k];
  const bad = floor !== undefined && v < floor - TOL;
  if (bad) fails++; else if (floor === undefined || v > floor + TOL) better++;
  console.log(`  ${bad ? '✗' : '✓'} ${k.padEnd(12)} ${v.toFixed(2).padStart(6)}%   (floor ${floor === undefined ? '—' : floor.toFixed(2)})`);
}
wrong.forEach(w => console.log('    gold miss: ' + w));
if (hindi) { console.log(`  ✗ ${hindi} Persian ghazal(s) shipped with the Hindi meter`); fails++; }
if (UPDATE) {
  if (fails) { console.log(`BENCHMARK_FA: ${fails} regressed — floor NOT updated`); process.exit(1); }
  const next = {};
  for (const [k, v] of Object.entries(scores)) next[k] = Math.max(v, base[k] === undefined ? -Infinity : base[k]);
  fs.writeFileSync(BASE_FILE, JSON.stringify(next, null, 2) + '\n');
  console.log('BENCHMARK_FA: floor written to tests/benchmark_fa_baseline.json');
  process.exit(0);
}
if (fails) { console.log(`BENCHMARK_FA: ${fails} regression(s)`); process.exit(1); }
console.log(`BENCHMARK_FA: no regressions${better ? ` (${better} improved — run with --update to raise the floor)` : ''}`);
