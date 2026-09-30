/* Learn rule likelihoods from lines of KNOWN meter (hard EM / Viterbi training).

   For every training line, scan it restricted to its gold meter(s); in the best path count
   every choice-rule decision (including the default option, so opportunities are counted)
   and the resolution (short / long) of every flexible syllable. Re-estimate, repeat.

   node learn.js ghalib        -> params/learned.ghalib.json   (train on Ghalib only)
   node learn.js mir           -> params/learned.mir.json
   node learn.js all           -> params/learned.all.json + evidence written into rules.json
   Options: --iter N (default 3) */
'use strict';
const fs = require('fs'), path = require('path');
const E = require('./engine.js');
const C = require('./lib/corpus.js');

function trainSets(name){ return name === 'all' ? ['ghalib', 'mir'] : [name]; }

function emptyCounts(){ return { choice:{}, weight:{}, word:{}, meter:{}, lines:0, explained:0, unexplained:[], byCorpus:{} }; }
function bump(o, k, f, n){ o[k] = o[k] || {}; o[k][f] = (o[k][f] || 0) + (n || 1); }

function collect(counts, corpusName, line, gold){
  const res = E.scanLine(line.ascii, { meters: [...gold] });
  counts.lines++;
  const f = res.fits[0];
  if(!f){ counts.unexplained.push(line.ascii); return; }
  counts.explained++;
  counts.meter[String(f.id)] = (counts.meter[String(f.id)] || 0) + 1;
  const bc = counts.byCorpus[corpusName] = counts.byCorpus[corpusName] || { choice:{}, weight:{} };
  const addChoice = (id, key, opt) => {
    const r = E.params().rule(id);
    const lk = r && r.likelihood || {};
    const kk = lk.keyed ? (key || '*') : '*';
    counts.choice[id] = counts.choice[id] || {}; bump(counts.choice[id], kk, opt);
    bc.choice[id] = bc.choice[id] || {}; bump(bc.choice[id], kk, opt);
    if(kk !== '*'){ bump(counts.choice[id], '*', opt); bump(bc.choice[id], '*', opt); }
    else if(key){ counts.choice[id]['@' + key] = counts.choice[id]['@' + key] || {}; counts.choice[id]['@' + key][opt] = (counts.choice[id]['@' + key][opt] || 0) + 1; }
  };
  const ex = E.explain(res, f);
  ex.decisions.forEach(d => addChoice(d.id, d.key, d.opt));
  /* cheat syllables (6.1) */
  if(f.meter.kind !== 'hindi'){
    if(f.meter.cheatFinal) addChoice('M6.1-cheat-final', null, f.variant.end ? 'used' : 'not');
    if(f.meter.cheatCae) addChoice('M6.1-cheat-caesura', null, f.variant.cae ? 'used' : 'not');
  } else {
    const last = ex.syl[ex.syl.length - 1];
    addChoice('M6.1-cheat-final', null, last && last.resolved === 'c' ? 'used' : 'not');
    addChoice('M6.2-hindi-length', null, String(f.M));
    hindiCounts(ex.syl.map(s => s.resolved), addChoice);
  }
  /* flexible syllables: how each one was used in a line of known meter */
  for(const s of ex.syl){
    if(s.native !== 'x' || s.resolved === 'c') continue;
    const fl = { id: s.rule, key: s.flexKey };
    const sh = s.resolved === 's' ? 's' : 'l';
    counts.weight[fl.id] = counts.weight[fl.id] || {};
    bump(counts.weight[fl.id], '*', sh); if(fl.key != null) bump(counts.weight[fl.id], fl.key, sh);
    bc.weight[fl.id] = bc.weight[fl.id] || {}; bump(bc.weight[fl.id], '*', sh); if(fl.key != null) bump(bc.weight[fl.id], fl.key, sh);
  }
  /* per-word evidence for flexible syllables (needs the word key from the path) */
  for(const step of f.path){
    const r = step.u.readings[step.ri];
    r.syl.forEach((s, k) => {
      if(s.w !== 'x' || !s.flex || !s.flex.word) return;
      const resolved = step.res ? step.res[k] : f.seq[step.pos + k];
      if(resolved === 'c' || resolved === 'x') return;
      bump(counts.word, s.flex.id + '|' + s.flex.word, resolved === 's' ? 's' : 'l');
    });
  }
}
/* 6.2: classify each short pair in a Hindi-meter scansion */
function hindiCounts(res, add){
  let m = 0, st = 0;
  for(const t of res){
    if(t === 'c') continue;
    if(t === 'l'){ if(st === 1){ add('M6.2-hindi-syncopation', null, 'used'); st = 2; } m += 2; continue; }
    if(st === 0){ const slot = m / 2 + 1; const on = m % 2 === 0 && slot % 2 === 0 && slot !== 8 && slot !== 16; add('M6.2-hindi-russell', null, on ? 'on-model' : 'off-model'); st = 1; }
    else { if(st === 1) add('M6.2-hindi-syncopation', null, 'not'); st = 0; }
    m += 1;
  }
}

function toParams(counts){
  /* weight tables in the {s,l} shape lib/params.js reads */
  const weight = {};
  for(const [id, t] of Object.entries(counts.weight)){ weight[id] = {}; for(const [k, v] of Object.entries(t)) weight[id][k] = { s: v.s || 0, l: v.l || 0 }; }
  const word = {};
  for(const [k, v] of Object.entries(counts.word)) word[k] = { s: v.s || 0, l: v.l || 0 };
  return { choice: counts.choice, weight, word, meter: counts.meter };
}

function train(name, iters, opts){
  opts = opts || {};
  let learned = null;
  let counts;
  for(let it = 0; it < iters; it++){
    E.useParams(learned, opts.paramOpts);
    counts = emptyCounts();
    for(const cn of trainSets(name)) for(const g of C.load(cn)) for(const l of g.lines) collect(counts, cn, l, g.gold);
    learned = toParams(counts);
    if(!opts.quiet) console.log(`[${name}] iter ${it + 1}: ${counts.explained}/${counts.lines} lines explained under gold meter`);
  }
  learned._meta = { trained_on: trainSets(name), iterations: iters, lines: counts.lines, explained: counts.explained,
    unexplained_sample: counts.unexplained.slice(0, 50), byCorpus: counts.byCorpus, date: new Date().toISOString().slice(0, 10) };
  return learned;
}

/* evidence block written into rules.json (from the 'all' model) */
function writeEvidence(learned){
  const p = path.join(__dirname, 'rules.json');
  const doc = JSON.parse(fs.readFileSync(p, 'utf8'));
  const scale = [[0.005,'no longer taken'],[0.01,'virtually never'],[0.02,'very rare'],[0.05,'rare'],[0.15,'once in a while'],[0.25,'sometimes'],[0.3,'less than half'],[0.5,'often'],[0.8,'usually'],[0.95,'almost always'],[1,'always']];
  const word = p => { let best = scale[0]; for(const s of scale) if(Math.abs(Math.log((s[0] || 1e-3)) - Math.log(Math.max(p, 1e-3))) < Math.abs(Math.log(best[0] || 1e-3) - Math.log(Math.max(p, 1e-3)))) best = s; return best[1]; };
  const BC = learned._meta.byCorpus;
  for(const r of doc.rules){
    const lk = r.likelihood || {};
    delete r.evidence;
    if(lk.type === 'weight'){
      const t = learned.weight[r.id]; if(!t || !t['*']) { r.evidence = { opportunities:0, note:'no case in the corpora' }; continue; }
      const all = t['*'], n = all.s + all.l;
      const byKey = {}; for(const [k, v] of Object.entries(t)) if(k !== '*') byKey[k] = { n: v.s + v.l, short: v.s, rate: +(v.s / Math.max(1, v.s + v.l)).toFixed(3) };
      const byCorpus = {}; for(const [cn, b] of Object.entries(BC)) if(b.weight[r.id] && b.weight[r.id]['*']){ const v = b.weight[r.id]['*']; byCorpus[cn] = { n: v.s + v.l, short: v.s, rate: +(v.s / Math.max(1, v.s + v.l)).toFixed(3) }; }
      r.evidence = { measure:'P(used short)', opportunities:n, short:all.s, long:all.l, rate:+(all.s / n).toFixed(3), in_words: word(all.s / n), byKey, byCorpus };
    } else if(lk.type === 'choice'){
      const t = learned.choice[r.id]; if(!t || !t['*']) { r.evidence = { opportunities:0, note:'no case in the corpora' }; continue; }
      const all = t['*'], n = Object.values(all).reduce((a, b) => a + b, 0);
      const rates = {}; for(const [o, c] of Object.entries(all)) rates[o] = +(c / n).toFixed(3);
      const byKey = {}; for(const [k, v] of Object.entries(t)) if(k !== '*'){ const nn = Object.values(v).reduce((a, b) => a + b, 0); byKey[k.replace(/^@/, '')] = Object.assign({ n: nn }, v); }
      const byCorpus = {}; for(const [cn, b] of Object.entries(BC)) if(b.choice[r.id] && b.choice[r.id]['*']){ const v = b.choice[r.id]['*']; byCorpus[cn] = Object.assign({ n: Object.values(v).reduce((a, x) => a + x, 0) }, v); }
      const inWords = {}; for(const [o, v] of Object.entries(rates)) inWords[o] = word(v);
      r.evidence = { measure:'option counts in best gold-meter parses', opportunities:n, counts:all, rates, in_words: inWords, byKey, byCorpus };
    }
  }
  doc._evidence_meta = { source:'learn.js all (Ghalib 234 + Mir labelled ghazals)', lines: learned._meta.lines, explained: learned._meta.explained, date: learned._meta.date };
  fs.writeFileSync(p, JSON.stringify(doc, null, 1));
}

if(require.main === module){
  const name = process.argv[2] || 'all';
  const ii = process.argv.indexOf('--iter'), iters = ii > 0 ? +process.argv[ii + 1] : 3;
  const learned = train(name, iters);
  fs.mkdirSync(path.join(__dirname, 'params'), { recursive:true });
  fs.writeFileSync(path.join(__dirname, 'params', `learned.${name}.json`), JSON.stringify(learned, null, 1));
  if(name === 'all') writeEvidence(learned);
  console.log('wrote params/learned.' + name + '.json');
}
module.exports = { train, collect, toParams };
