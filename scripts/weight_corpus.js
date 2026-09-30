/* Corpus evidence for Weight > Learn. Scans every Ghalib and Mir line with the engine embedded in index.html,
   keeps the lines whose top-1 fit is Pritchett's own meter for that ghazal (so the reading is not a stretch),
   and records (a) how often each across-word construction and each flexible word resolved which way, and
   (b) a few short lines where exactly one construction fires, as worked examples.
   Writes src/js/20b-weight-corpus.js (GENERATED; commit it). Run after `npm run build`, then build again:
       node scripts/weight_corpus.js && npm run build */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const blocks = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi).map(b => b.replace(/<\/?script[^>]*>/gi, ''));
const el = id => ({ id, classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } }, addEventListener(){}, querySelectorAll: () => [], querySelector: () => null, textContent: '', innerHTML: '', value: '', style: {}, setAttribute(){}, getAttribute(){ return null; } });
const store = {};
const ctx = { window: {}, console: { log(){}, warn(){}, error(){} }, setTimeout: () => 1, clearTimeout(){}, setInterval(){}, clearInterval(){},
  document: { getElementById: id => store[id] || (store[id] = el(id)), querySelectorAll: () => [], querySelector: () => el('q'), addEventListener(){}, documentElement: el('html'), body: el('body') },
  localStorage: { getItem: () => null, setItem(){}, removeItem(){} }, location: { hash: '', search: '' }, history: { replaceState(){} }, AudioContext: function(){ return {}; } };
ctx.window = ctx; ctx.self = ctx; vm.createContext(ctx);
blocks.forEach(code => { try { vm.runInContext(code, ctx); } catch (e) {} });
const Scan = ctx.Scan;
const get = n => vm.runInContext(n, ctx);
const FLEX = get('FLEX');

const bare = s => s.normalize('NFC').replace(/[ً-ٰۖ-ۭ]/g, '');
const fam = { iz: { lines: 0, hits: 0 }, o: { lines: 0, hits: 0 }, graft: { lines: 0, hits: 0 }, al: { lines: 0, hits: 0 } };
const graftPairs = { offered: 0, taken: 0 };
const words = {};                                   /* per FLEX word: [long, short] resolutions in matched lines */
const aur = { single: 0, two: 0 };
const fin = { long: 0, short: 0 }, mid = { long: 0, short: 0 };
const cand = { iz: [], o: [], graft: [], al: [] };
let total = 0, matched = 0;

for (const [file, poet] of [['ghalib_extended', 'Ghalib'], ['mir_extended', 'Mir']]) {
  const G = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', file + '.json'), 'utf8'));
  for (const g of G) {
    const want = new Set((g.meters || []).map(String));
    if (!want.size) continue;
    for (const l of g.lines) {
      total++;
      const r = Scan.scanLine(l.ur), f = (r.fits || [])[0];
      if (!f || !f.seq || !want.has(String(f.meter.id))) continue;
      matched++;
      const seen = { iz: 0, o: 0, graft: 0, al: 0 };
      /* pairs that meet the spelling condition (first ends in a consonant, second starts with alif/madd) */
      r.words.forEach((a, i) => { const b = r.words[i + 1], la = a.letters[a.letters.length - 1];
        if (b && !a.suffix && la && !/^(ا|AA|و|ی|ے|ں|ہ|ھ|ء|ئ)$/.test(la) && (b.letters[0] === 'ا' || b.letters[0] === 'AA')) graftPairs.offered++; });
      for (const st of f.path) {
        const o = st.u.opts[st.oi], n = o.n || '', w0 = r.words[st.u.from] || {};
        if (/al-construction/.test(n)) seen.al++;
        else if (st.u.graft) { seen.graft++; if (st.u.to === st.u.from + 1) graftPairs.taken++; }
        else if (o.syl.some(s => s.suf === 'iz')) seen.iz++;
        else if (o.syl.some(s => s.suf === 'o')) seen.o++;
        if (st.u.graft) continue;
        if (o.syl.length === 1) {
          const key = bare(w0.raw || '');
          if (FLEX.some(x => x[0] === key)) (words[key] = words[key] || [0, 0])[f.seq[st.pos] === 's' ? 1 : 0]++;
        }
        if (/^aur as a single long/.test(n)) aur.single++;
        else if (bare(w0.raw || '') === 'اور') aur.two++;
        if (o.syl.length > 1) o.syl.forEach((s, k) => {
          if (s.w !== 'x' || s.suf) return;
          const wt = f.seq[st.pos + k] === 's' ? 'short' : 'long';
          (k === o.syl.length - 1 ? fin : mid)[wt]++;
        });
      }
      for (const k of Object.keys(seen)) if (seen[k]) { fam[k].lines++; fam[k].hits += seen[k]; }
      /* a worked example: short Ghalib line, exactly one construction on it, word indices line up with the text */
      const ks = Object.keys(seen).filter(k => seen[k]);
      /* a standalone و ("o") is one token of the text but part of the preceding word for the engine */
      const toks = []; l.ur.trim().split(/\s+/).forEach(t => { if (t === 'و' && toks.length) toks[toks.length - 1] += ' و'; else toks.push(t); });
      if (ks.length === 1 && seen[ks[0]] === 1 && toks.length === r.words.length && toks.length <= 9 && l.ro) {
        const PLAIN = { iz: 'iẓāfat joins final consonant', o: 'o joins final consonant', graft: 'word-grafting', al: 'al-construction (3.4)' };
        const st = f.path.find(s => { const o = s.u.opts[s.oi]; return s.u.graft || /al-construction/.test(o.n || '') || o.syl.some(x => x.suf); });
        if (st && st.u.opts[st.oi].n === PLAIN[ks[0]])
          cand[ks[0]].push({ g: poet + (g.id || g.ghazal_num), poet, gz: g.id || g.ghazal_num, url: g.url || '', w: toks, ur: l.ur, ro: l.ro, hi: [st.u.from, st.u.to],
            m: f.meter.id, len: toks.length });
      }
    }
  }
}

/* pick two per family: shortest, from different ghazals, preferring a named (noted) reading */
const pick = arr => {
  const used = new Set(), out = [];
  arr.sort((a, b) => (a.poet === 'Ghalib' ? 0 : 1) - (b.poet === 'Ghalib' ? 0 : 1) || a.len - b.len || a.w.join(' ').length - b.w.join(' ').length);
  for (const c of arr) { if (used.has(c.g)) continue; used.add(c.g); out.push(c); if (out.length === 2) break; }
  return out;
};
const examples = {};
for (const k of Object.keys(cand)) examples[k] = pick(cand[k]).map(c => ({ poet: c.poet, gz: c.gz, url: c.url, w: c.w, ro: c.ro, hi: c.hi, m: c.m }));

/* Well-known Ghalib lines, found by a snippet of their text (diacritics ignored). Each must actually show the
   construction in the app's top-1 reading in Pritchett's meter, or it is dropped. Falls back to the automatic picks
   above when a family has none. tag: iz | o | graft | al | aur1 (aur as one long) | aur2 (aur as = -) */
const CURATED = {
  iz: ['نقش فریادی ہے کس کی', 'وصال یار ہوتا'],
  graft: ['ہر ایک بات پہ کہتے ہو', 'سخن ور بہت اچ'],
  o: ['بنتی نہیں ہے بادہ و ساغر', 'در و دیوار سے ٹپکے'],
  al: ['ہر بو الہوس نے'],
  aur2: ['لڑتے ہیں اور ہاتھ میں', 'فرق جینے اور مرنے'],
  aur1: ['بوسہ دیتے نہیں اور', 'ہم بیاباں میں ہیں اور']
};
const stepTag = (r, st) => { const o = st.u.opts[st.oi], n = o.n || '';
  if (/al-construction/.test(n)) return 'al';
  if (bare((r.words[st.u.from] || {}).raw || '') === 'اور' && !st.u.graft) return /^aur as a single long/.test(n) ? 'aur1' : 'aur2';
  if (st.u.graft) return 'graft';
  if (o.syl.some(x => x.suf === 'iz')) return 'iz';
  if (o.syl.some(x => x.suf === 'o')) return 'o';
  return ''; };
const famous = {};
{
  const G = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'ghalib_extended.json'), 'utf8'));
  for (const [tag, snippets] of Object.entries(CURATED)) {
    famous[tag] = [];
    for (const sn of snippets) {
      let got = null;
      for (const g of G) {
        const want = new Set((g.meters || []).map(String));
        for (const l of g.lines) {
          if (got || !bare(l.ur).includes(bare(sn))) continue;
          const r = Scan.scanLine(l.ur), f = (r.fits || [])[0];
          if (!f || !f.seq || !want.has(String(f.meter.id))) continue;
          const st = f.path.find(x => stepTag(r, x) === tag);
          const toks = []; l.ur.trim().split(/\s+/).forEach(t => { if (t === 'و' && toks.length) toks[toks.length - 1] += ' و'; else toks.push(t); });
          if (st && toks.length === r.words.length) got = { poet: 'Ghalib', gz: g.id || g.ghazal_num, url: g.url || '', w: toks, ro: l.ro, hi: [st.u.from, st.u.to], m: f.meter.id };
        }
        if (got) break;
      }
      if (got) famous[tag].push(got); else console.log('NOT FOUND / not reading as ' + tag + ': ' + sn);
    }
  }
}
for (const k of ['iz', 'graft', 'o', 'al']) if (famous[k] && famous[k].length) examples[k] = famous[k];
examples.aur1 = famous.aur1 || []; examples.aur2 = famous.aur2 || [];

/* Flexible words in well-known lines: the same word long in one verse and short in another. */
const POPULAR = ['دل ناداں تجھے', 'ہزاروں خواہشیں', 'بازیچہ', 'وصال یار', 'عشق نے غالب', 'رگوں میں دوڑتے', 'ہوئی مدت', 'آہ کو چاہیے', 'کوئی امید', 'بس کہ دشوار',
  'درد منت', 'محبت میں نہیں ہے فرق', 'سخن ور', 'جنت کی حقیقت', 'ہر ایک بات', 'وہ آئے گھر', 'خدا کی قدرت', 'کتنے شیریں', 'قطرہ دریا', 'غالب برا نہ مان',
  'نہ تھا کچھ', 'دائم پڑا ہوا', 'نقش فریادی', 'یہ نہ تھی', 'ہم کو معلوم', 'رو میں ہے رخش', 'نکلنا خلد سے', 'ہوس کو ہے نشاط', 'دیکھنا تقریر', 'پھر مجھے دیدہ',
  'آگہی دام', 'لڑتے ہیں اور', 'ہم بیاباں', 'بوسہ دیتے', 'در و دیوار سے', 'بنتی نہیں ہے بادہ'];
const flexv = {};
{
  const G = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'ghalib_extended.json'), 'utf8'));
  for (const W of ['ہے', 'میں']) {
    const buckets = { long: [], short: [] };
    for (const g of G) {
      const want = new Set((g.meters || []).map(String));
      for (const l of g.lines) {
        if (!POPULAR.some(sn => bare(l.ur).includes(bare(sn)))) continue;
        const r = Scan.scanLine(l.ur), f = (r.fits || [])[0];
        if (!f || !f.seq || !want.has(String(f.meter.id))) continue;
        const toks = []; l.ur.trim().split(/\s+/).forEach(t => { if (t === 'و' && toks.length) toks[toks.length - 1] += ' و'; else toks.push(t); });
        if (toks.length !== r.words.length) continue;
        const hits = f.path.filter(st => !st.u.graft && bare(r.words[st.u.from].raw) === W && st.u.opts[st.oi].syl.length === 1);
        if (hits.length !== 1) continue;
        const st = hits[0], b = f.seq[st.pos] === 's' ? 'short' : 'long';
        buckets[b].push({ poet: 'Ghalib', gz: g.id || g.ghazal_num, url: g.url || '', w: toks, ro: l.ro, hi: [st.u.from, st.u.from], m: f.meter.id, len: toks.length });
      }
    }
    flexv[W] = {};
    for (const b of ['long', 'short']) flexv[W][b] = pick(buckets[b]).slice(0, 2).map(c => ({ poet: c.poet, gz: c.gz, url: c.url, w: c.w, ro: c.ro, hi: c.hi, m: c.m }));
  }
}

const rows = Object.entries(words).map(([w, [L, S]]) => [w, L, S]).sort((a, b) => (b[1] + b[2]) - (a[1] + a[2]));
const out = { corpus: { lines: total, matched }, fam, graftPairs, flex: rows, aur, finalFlex: fin, midFlex: mid, examples, flexv };
const js = '/* GENERATED by scripts/weight_corpus.js; do not edit. Corpus evidence for Weight > Learn: Ghalib + Mir lines whose top-1\n   fit is Pritchett\'s own meter. Counts are of the app\'s scan of those lines, not her scansion. */\nvar WEIGHT_CORPUS = ' + JSON.stringify(out) + ';\n';
fs.writeFileSync(path.join(ROOT, 'src/js/20b-weight-corpus.js'), js);
console.log(JSON.stringify({ corpus: out.corpus, fam, graftPairs, aur, finalFlex: fin, midFlex: mid }, null, 1));
console.log(rows.slice(0, 30).map(r => r.join(' ')).join('\n'));
console.log(JSON.stringify(examples, null, 1));
