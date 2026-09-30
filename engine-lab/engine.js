/* Prosody Engine Lab -- a rule-based, citable scanner for Urdu verse.

   const E = require('./engine-lab/engine.js');
   E.scanLine('naqsh faryaadii hai kis kii sho;xii-e ta;hriir kaa')        // Pritchett-ASCII
   E.scanLine('نقش فریادی ہے کس کی شوخیِ تحریر کا', {script:'ur'})         // Urdu script
   E.explain(res, res.fits[0])   // syllables, weights, and the rule behind each decision
   E.useParams('params/learned.all.json')   // corpus-learned likelihoods (default: handbook priors)

   Layers: transcription (lib/ascii.js, lib/urdu.js) -> prosody (lib/prosody.js) -> meter
   (lib/meter.js). Every decision carries a rule id from rules.json. */
'use strict';
const path = require('path'), fs = require('fs');
const A = require('./lib/ascii.js');
const Pr = require('./lib/prosody.js');
const Mt = require('./lib/meter.js');
const { Params, BY_ID } = require('./lib/params.js');

let P = new Params(null);
Pr.setParams(P);
let urdu = null;                                  /* lazily loaded Urdu-script front end */

function useParams(fileOrObj, opts){
  const L = typeof fileOrObj === 'string' ? JSON.parse(fs.readFileSync(path.resolve(__dirname, fileOrObj), 'utf8')) : fileOrObj;
  P = new Params(L, opts); Pr.setParams(P); if(urdu) urdu.setParams(P);
  return P;
}
function params(){ return P; }

/* ---------- words ---------- */
function asciiWords(line){
  const cl = A.cleanLine(line);
  const ws = A.splitLine(cl.text).map(w => {
    const pw = A.parseWord(w.ascii);
    return Object.assign(w, { word: w.ascii, items: pw.items, fired: pw.fired, origin: pw.origin, alts: null });
  });
  return { words: ws.filter(w => w.items.length), clean: cl };
}

/* ---------- units: each word alone, plus grafted chains of up to 3 (3.1) ---------- */
function buildUnits(words, overrides){
  const units = [];
  const n = words.length;
  const readingsOf = w => {
    const alts = w.alts || [{ w, cost:0, dec:[] }];     /* transcription hypotheses (Urdu input) */
    const out = [];
    for(const a of alts){
      for(const r of Pr.wordReadings(a.w)) out.push(Object.assign({}, r, { cost: r.cost + a.cost, dec: a.dec.concat(r.dec), hyp: a }));
    }
    return out.sort((x, y) => x.cost - y.cost).slice(0, 24);
  };
  for(let i = 0; i < n; i++){
    const ov = overrides && overrides[i] || {};
    let rs = readingsOf(words[i]);
    if(ov.reading != null && rs[ov.reading]) rs = [rs[ov.reading]];
    const u = [{ from:i, to:i, readings: rs, cost:0, graft:null }];
    /* grafting, 3.1: a chain i..j where every joint is graftable */
    let chain = [words[i]], hyps = [{ w: words[i], cost:0, dec:[] }];
    for(let j = i + 1; j < Math.min(n, i + 3) && !(ov.noGraft); j++){
      const a = words[j-1], b = words[j];
      const nh = [];
      for(const h of hyps){
        for(const bh of (b.alts || [{ w:b, cost:0, dec:[] }])){
          const rule = Pr.graftCheck(h.w, bh.w); if(!rule) continue;
          const merged = { word: h.w.word + '_' + bh.w.word, items: Pr.graftItems(h.w, bh.w, rule), iz: bh.w.iz, conjO: bh.w.conjO, article: bh.w.article, origin: bh.w.origin };
          nh.push({ w: merged, cost: h.cost + bh.cost + Pr.cost(P.choice(rule, 'graft')), dec: h.dec.concat(bh.dec, [{ id: rule, opt:'graft', joint: j }]) });
        }
      }
      if(!nh.length) break;
      hyps = nh;
      const rs2 = [];
      for(const h of hyps) for(const r of Pr.wordReadings(h.w)) rs2.push(Object.assign({}, r, { cost: r.cost + h.cost, dec: h.dec.concat(r.dec) }));
      if(rs2.length) u.push({ from:i, to:j, readings: rs2.sort((x, y) => x.cost - y.cost).slice(0, 16), cost:0, graft:true });
    }
    units.push(u);
  }
  /* the cost of NOT grafting a graftable joint is charged on every unit whose right edge is that joint */
  for(let i = 0; i < n; i++) for(const u of units[i]){
    if(u.to + 1 >= n) continue;
    const rule = anyGraft(words[u.to], words[u.to+1]);
    if(rule){ u.cost += Pr.cost(P.choice(rule, 'no')); u.noGraft = [{ id: rule, joint: u.to + 1 }]; }
  }
  return units;
}
function anyGraft(a, b){
  for(const ah of (a.alts || [{ w:a }])) for(const bh of (b.alts || [{ w:b }])){ const r = Pr.graftCheck(ah.w, bh.w); if(r) return r; }
  return null;
}

/* ---------- scan ---------- */
function meterPriorCost(m){
  const mode = P.opts.meterPrior || 'handbook';
  if(mode === 'learned'){ const p = P.meterPrior(m.id); if(p) return Pr.cost(p); }
  if(m.kind === 'rubai') return Pr.cost(0.02);     /* 6.3: rubāʿī meters belong to the quatrain genre */
  return 0;
}
function scanWords(words, opts){
  opts = opts || {};
  const n = words.length;
  if(!n) return { words, fits:[], units:[] };
  const units = buildUnits(words, opts.overrides);
  const fits = [];
  const only = opts.meters ? new Set(opts.meters.map(String)) : null;
  for(const m of Mt.METERS){
    if(only && !only.has(String(m.id))) continue;
    const r = Mt.matchRegular(units, n, m, P);
    if(r) fits.push({ meter:m, id:m.id, c: r.c + meterPriorCost(m), path:r.path, seq:r.seq, variant:r.variant });
  }
  if(!only || only.has('H')){
    const h = Mt.matchHindi(units, n, P);
    if(h) fits.push({ meter:{ id:'H', kind:'hindi', raw:'Hindi' }, id:'H', c: h.c + meterPriorCost({ id:'H' }), path:h.path, M:h.M });
  }
  fits.sort((a, b) => a.c - b.c);
  return { words, fits, units };
}
function scanLine(line, opts){
  opts = opts || {};
  if(opts.script === 'ur' || (!opts.script && /[؀-ۿ]/.test(line))){
    if(!urdu){ urdu = require('./lib/urdu.js'); urdu.setParams(P); }
    const words = urdu.urduWords(line, opts);
    return Object.assign(scanWords(words, opts), { script:'ur' });
  }
  const { words, clean } = asciiWords(line);
  return Object.assign(scanWords(words, opts), { script:'ascii', clean });
}

/* ---------- explanation: per syllable weight + rule; per word the choices made ---------- */
function explain(res, fit){
  const syl = [], decisions = [];
  for(const step of fit.path){
    const r = step.u.readings[step.ri];
    const wtxt = res.words.slice(step.u.from, step.u.to + 1).map(w => w.word).join(' ');
    r.dec.forEach(d => decisions.push({ word: wtxt, id: d.id, opt: d.opt, key: d.key, section: sec(d.id) }));
    (step.u.noGraft || []).forEach(g => decisions.push({ word: wtxt, id: g.id, opt:'no', section: sec(g.id) }));
    r.syl.forEach((s, k) => {
      let res1;
      if(step.res) res1 = step.res[k];
      else { const t = fit.seq[step.pos + k]; res1 = t === 'c' ? 'c' : t === 'x' ? (s.w === 'x' ? 'l' : s.w) : t; }
      const why = s.flex ? s.flex.id : (res1 === 'c' ? 'M6.1-cheat-final' : 'S1.5-weight');
      syl.push({ text: s.text, native: s.w, resolved: res1, word: step.u.from, wordTo: step.u.to, graft: !!step.u.graft,
        rule: why, section: sec(why), pShort: s.w === 'x' ? +P.pShort(s.flex).toFixed(3) : null, flexKey: s.flex ? s.flex.key : null });
    });
  }
  return { syl, decisions, pattern: syl.map(s => s.resolved === 'l' ? '=' : s.resolved === 's' ? '-' : '(-)').join(' ') };
}
function sec(id){ const r = BY_ID.get(id); return r ? r.section : null; }

/* word-level readings without a meter (for the learner panel) */
function wordReadings(asciiWord, flags){
  const pw = A.parseWord(asciiWord);
  const w = Object.assign({ word: asciiWord, items: pw.items, origin: pw.origin, iz:false, conjO:false, article:null }, flags || {});
  return Pr.wordReadings(w).map(r => ({ pattern: r.syl.map(s => s.w === 'l' ? '=' : s.w === 's' ? '-' : 'x').join(' '),
    split: r.syl.map(s => s.text).join('-'), cost: +r.cost.toFixed(3), dec: r.dec, syl: r.syl }));
}

module.exports = { scanLine, scanWords, asciiWords, buildUnits, explain, wordReadings, useParams, params, METERS: Mt.METERS, PAIRS: Mt.PAIRS, RULES: require('./rules.json').rules };
