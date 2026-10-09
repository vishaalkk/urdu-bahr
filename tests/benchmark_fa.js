/* Persian benchmark: the shipped Persian ghazals (data/poets_extended.json, lang "fa") scanned by the built engine with
   their Roman's hints (rekhtaScanText), and the shipped ghazal meters checked against Ganjoor's editors
   (tests/data/persian_gold.json, scripts/match_ganjoor.py). Fails if a score drops below tests/benchmark_fa_baseline.json;
   record improvements with `node tests/benchmark_fa.js --update` (never lowers a floor). Ghalib/Mir: tests/benchmark.js.

   Scores (Persian lines only; an Urdu girah inside Persian kalaam is left out), for two sets: core = the first 102 ghazals
   (tests/data/persian_core_urls.json: Jami, Bu Ali, Khusrau and the first top-100 intake), so new, harder kalaam can never
   hide a regression there; all = every Persian ghazal shipped.
     *.cost0         best regular-meter fit costs 0
     *.fit2          best regular-meter fit costs ≤ 2
     *.own2          the ghazal's own meter fits the line at ≤ 2 (a mustazād ghazal's line also as meter + tail; a line that misses
                     also without a sung refrain: faMustazadScan, faRefrainVariants, as the reader scans it)
     gold.meter      shipped ghazal meter = Ganjoor's (where Ganjoor's meter is one of ours), sure matches only
     ganjoor.meter   independent: 240 well-known ghazals of Hafiz, Saadi, Rumi and Jami straight from Ganjoor in Iranian spelling
                     (those Sufinama lists as sung first, then the most recited on Ganjoor; Arabic ghazals left out)
                     (tests/data/ganjoor_testset.json, scripts/build_fa_testset.py), through faScanText and ScanFa:
                     the ghazal's meter = Ganjoor's, where Ganjoor's meter is one of ours
     ganjoor.own2    their lines that fit Ganjoor's meter at cost ≤ 2, as Ganjoor prints them (zer and iẓāfat marked)
     ganjoor.own2_plain  the same lines with every mark stripped: what people usually paste
     translit.word   held out: a Persian word list learned WITHOUT six poets (Hafiz, Rumi, Saadi, ʿIrāqī, Bedil, Fard Phulwarwi)
                     gives their words the Roman Sufinama gives them (the app's faWordScripts, letter map when unknown)
   And always: no Persian ghazal or line is given the Hindi meter. */
const fs = require('fs'), path = require('path');
const { loadEngine } = require('../scripts/lib_scan');
const ROOT = path.join(__dirname, '..');
const UPDATE = process.argv.includes('--update');
/* --quick (npm test): the core set only, no all.* and no Ganjoor line check (those take ~10 minutes; run the full benchmark,
   `npm run bench:fa`, before changing the Persian engine or its data) */
const QUICK = process.argv.includes('--quick');
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
  if (QUICK && !CORE.has(g.url)) continue;
  const own = new Set((g.meters || []).flatMap(m => [String(m), ...(PAIRED.get(String(m)) || [])]));
  const xl = new Set(g.xl || []);
  /* own meter, as the reader scans the line (scanCorpusLine): in a mustazād ghazal (faMustazadGhazal, on the reader's text) a
     line also as meter + tail, and a line that misses its meter also without a sung refrain */
  const mz = (g.meters || []).length && ctx.faMustazadGhazal(Scan, g.lines.filter((l, i) => !xl.has(i) && l.ur).map(l => ctx.faProsodyText(ctx.rekhtaScanText(l.ur, l.ro || ''))), g.meters.map(String));
  const ownIn = t => (Scan.scanLine(t).fits || []).concat(mz ? ctx.faMustazadScan(Scan, t, own).fits : []).some(f => own.has(String(f.meter.id)) && f.c <= 2);
  g.lines.forEach((l, i) => {
    if (xl.has(i) || !l.ur) return;
    const text = ctx.rekhtaScanText(l.ur, l.ro || '');
    const fits = (Scan.scanLine(text).fits || []).filter(f => f.meter.id !== 'H');
    const best = fits.length ? fits[0].c : Infinity;
    const ownFit = fits.some(f => own.has(String(f.meter.id)) && f.c <= 2) || (mz && ownIn(text)) || ctx.faRefrainVariants(text).some(ownIn);
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
const { mine, finalize, withVerbs, pairsOf, romanNorm } = require('../scripts/lib_fa_lexicon');
const HELD_OUT = new Set(['hafiz', 'rumi', 'saadi', 'iraqi', 'bedil', 'fard_phulwarwi']);
const train = [], test = [];
for (const [k, gs] of Object.entries(poets.ghazals)) for (const g of gs) {
  if (g.lang !== 'fa') continue;
  const xl = new Set(g.xl || []);
  const g2 = { url: g.url, lang: 'fa', lines: g.lines.filter((_, i) => !xl.has(i)) };
  (HELD_OUT.has(k) ? test : train).push(g2);
}
ctx.setFaLexicon(withVerbs(finalize(mine(train))));   // as the app: + the generated verb forms (poet-independent)
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

/* the independent set: Ganjoor's text, Ganjoor's meter, nothing from our pipeline */
const { scanGhazal } = require('../scripts/lib_scan');
const FAE = require('../scripts/lib_fa_scan').loadFaEngine();
const testset = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/ganjoor_testset.json'), 'utf8'));
let gRight = 0, gJudged = 0, gLines = 0, gOwn = 0, gOwnPlain = 0;
const gMiss = {};
// Ganjoor's editors mark iẓāfat and many short vowels (محبتِ, سراپردهٔ); text pasted from elsewhere usually has none
const unmarked = l => l.replace(/[\u064B-\u0655]/g, '').replace(/ۀ/g, 'ه');
/* with liaison and the iẓāfats Persian grammar allows (up to three; faIzafatSlots),
   stopping as soon as the ghazal's own meter fits */
const fitsOwn = (line, fam) => {
  const text = FAE.ctx.faProsodyText(FAE.ctx.faScanText(line));
  try { return FAE.ctx.faScanFits(FAE.Scan, text, { guessIzafat: true, target: fam }).some(f => fam.has(String(f.meter.id)) && f.c <= 2); }
  catch (e) { return false; }
};
testset.forEach((t, i) => {
  const m = faMeters.get(t.metre_id);
  const want = (m && m.urdu.length ? m.urdu : (FAE.Scan.METERS.some(x => x.id === 'F' + t.metre_id) ? ['F' + t.metre_id] : [])).map(String);
  if (!want.length) return;
  const fam = new Set(want.flatMap(w => [w, ...(PAIRED.get(w) || [])]));
  const g = { url: t.url, lang: 'fa', lines: t.lines.map(l => ({ ur: FAE.ctx.faScanText(l), ro: '' })) };
  const s = scanGhazal(g, i, FAE, { assignAlways: true, lang: true });
  gJudged++;
  if (s.meters.map(String).some(x => fam.has(x))) gRight++;
  else { const k = `${t.rhythm.split('(')[0].trim()} → ${s.meters.join('/') || 'none'}`; gMiss[k] = (gMiss[k] || 0) + 1; }
  if (!QUICK) t.lines.forEach(l => {
    gLines++;
    if (fitsOwn(l, fam)) gOwn++;
    if (fitsOwn(unmarked(l), fam)) gOwnPlain++;
  });
});
console.log(`ganjoor: ${gJudged} ghazals judged (${testset.length - gJudged} in a meter we do not have), ${gLines} lines`);
Object.entries(gMiss).sort((a, b) => b[1] - a[1]).slice(0, 8).forEach(([k, n]) => console.log(`    ganjoor miss ×${n}: ${k}`));

const scores = {};
for (const [set, t] of Object.entries(tally)) if (!(QUICK && set === 'all')) Object.assign(scores, { [set + '.cost0']: pct(t.c0, t.n), [set + '.fit2']: pct(t.f2, t.n), [set + '.own2']: pct(t.o2, t.n) });
scores['gold.meter'] = pct(right, judged);
scores['translit.word'] = pct(tOk, tw);
scores['ganjoor.meter'] = pct(gRight, gJudged);
if (!QUICK) { scores['ganjoor.own2'] = pct(gOwn, gLines); scores['ganjoor.own2_plain'] = pct(gOwnPlain, gLines); }
const n = tally.all.n;
const base = fs.existsSync(BASE_FILE) ? JSON.parse(fs.readFileSync(BASE_FILE, 'utf8')) : {};
console.log(`persian${QUICK ? ' --quick (core set only)' : ''} (${n} lines, ${byUrl.size} ghazals; gold ${judged} ghazals + ${persianOnly} in a Persian-only meter)`);
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
  const next = Object.assign({}, base);   // a --quick run raises only what it measured
  for (const [k, v] of Object.entries(scores)) next[k] = Math.max(v, base[k] === undefined ? -Infinity : base[k]);
  fs.writeFileSync(BASE_FILE, JSON.stringify(next, null, 2) + '\n');
  console.log('BENCHMARK_FA: floor written to tests/benchmark_fa_baseline.json');
  process.exit(0);
}
if (fails) { console.log(`BENCHMARK_FA: ${fails} regression(s)`); process.exit(1); }
console.log(`BENCHMARK_FA: no regressions${better ? ` (${better} improved — run with --update to raise the floor)` : ''}`);
