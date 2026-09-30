/* Parameters: handbook priors from rules.json, optionally overridden by corpus-learned
   estimates (params/*.json, written by learn.js).

   choice(id, opt, key): P(option) for a choice rule; strict single-option rules = 1.
   pShort(flex): P(a flexible syllable is used short), with backoff
     word (if seen >= MIN_WORD times) -> rule|key (>= MIN_KEY) -> rule -> handbook prior. */
'use strict';
const RULES = require('../rules.json').rules;
const BY_ID = new Map(RULES.map(r => [r.id, r]));
const MIN_WORD = 8, MIN_KEY = 5;

class Params {
  constructor(learned, opts){
    this.L = learned || null;          /* {choice:{id:{key:{opt:count}}}, weight:{id:{key:{s,l}}, word:{w:{s,l}}}, meter:{...}} */
    this.opts = Object.assign({ smoothing: 2 }, opts || {});
    this.unknown = new Set();
  }
  rule(id){ return BY_ID.get(id); }
  priorChoice(id, opt, key){
    const r = BY_ID.get(id);
    if(!r){ this.unknown.add(id); return 1; }
    const lk = r.likelihood || {};
    if(lk.type === 'strict' || !lk.type) return 1;
    if(lk.keyed){ const t = lk.keyed[key] || Object.values(lk.keyed)[0]; return t[opt] != null ? t[opt] : 0.05; }
    if(lk.options){ const o = lk.options[opt]; return o ? o.prior : 0.05; }
    return 1;
  }
  choice(id, opt, key){
    const prior = this.priorChoice(id, opt, key);
    if(prior === 1 || !this.L || !this.L.choice || !this.L.choice[id]) return prior;
    const r = BY_ID.get(id); const lk = r && r.likelihood || {};
    const optNames = lk.keyed ? Object.keys(lk.keyed[key] || Object.values(lk.keyed)[0]) : Object.keys(lk.options || {});
    const tab = this.L.choice[id];
    const kk = lk.keyed ? (key || '*') : '*';
    const counts = tab[kk] || {};
    const a = this.opts.smoothing;
    let tot = 0; for(const o of optNames) tot += (counts[o] || 0);
    const pr = o => this.priorChoice(id, o, key);
    return ((counts[opt] || 0) + a * pr(opt)) / (tot + a);
  }
  pShort(flex){
    if(!flex) return 0.5;
    const r = BY_ID.get(flex.id);
    if(!r) this.unknown.add(flex.id);
    const prior = r && r.likelihood && r.likelihood.prior_short != null ? r.likelihood.prior_short : 0.5;
    if(!this.L || !this.L.weight) return prior;
    const a = this.opts.smoothing;
    const W = this.L.weight[flex.id] || null;
    let base = prior;
    if(W){
      const all = W['*'];
      if(all && all.s + all.l > 0) base = (all.s + a * prior) / (all.s + all.l + a);
      const k = W[flex.key];
      if(k && k.s + k.l >= MIN_KEY) base = (k.s + a * base) / (k.s + k.l + a);
    }
    if(flex.word && this.L.word){
      const w = this.L.word[flex.id + '|' + flex.word];
      if(w && w.s + w.l >= MIN_WORD) base = (w.s + a * base) / (w.s + w.l + a);
    }
    return Math.min(0.995, Math.max(0.005, base));
  }
  meterPrior(id){
    if(!this.L || !this.L.meter) return null;
    const M = this.L.meter, a = 1;
    const tot = Object.values(M).reduce((x, y) => x + y, 0);
    const n = 38;
    return ((M[String(id)] || 0) + a) / (tot + a * n);
  }
}
module.exports = { Params, RULES, BY_ID };
