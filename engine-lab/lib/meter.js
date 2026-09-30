/* Meter layer: the 37 meters of handbook 6.1, the 12 rubāʿī forms of 6.3, and Mir's
   Hindi meter (6.2), matched against word readings by dynamic programming.
   Every allowance used in a match is a rule id: M6.1-cheat-final, M6.1-cheat-caesura,
   M6.1-anceps (x in the pattern), M6.2-*. */
'use strict';
const { cost } = require('./prosody.js');

const METERS_RAW = [
 [1,"= = = / = - = / - = ="],[2,"= = / - = = // = = / - = ="],[3,"= = - = / = = - = / = = - = / = = - ="],
 [4,"= = - / = - = = // = = - / = - = ="],[5,"= = - / = - = - / - = = - / = - ="],
 [6,"= = / - - = / = = / = = / = = / - - = / = = / = ="],[7,"= = - / - = = = // = = - / - = = ="],
 [8,"= = - / - = = - / - = = - / - = ="],[9,"= = - / - = - = / - = ="],[10,"= - = = / = - = = / = - = = / = - ="],
 [11,"= - = = / = - = = / = - ="],[12,"= - = / = - = / = - = / = - = / = - = / = - = / = - = / = - ="],
 [13,"= - = / = - = / = - = / ="],[14,"x - = = / - = - = / = ="],[15,"x - = = / - = - = / - - ="],
 [16,"x - = = / - - = = / = ="],[17,"x - = = / - - = = / - - ="],[18,"x - = = / - - = = / - - = = / = ="],
 [19,"x - = = / - - = = / - - = = / - - ="],[20,"= - = / - = = = // = - = / - = = ="],[21,"= - = / - = - = // = - = / - = - ="],
 [22,"= - - = / = - = // = - - = / = - ="],[23,"= - - = / = - = - / = - - = / ="],[24,"= - - = / = - - = / = - ="],
 [25,"= - - = / - = - = // = - - = / - = - ="],[26,"- = = = / - = = = / - = = = / - = = ="],[27,"- = = = / - = = = / - = ="],
 [28,"- = = / - = = / - = = / - = ="],[29,"- = = / - = = / - = = / - ="],[30,"- = - / = = / - = - / = = / - = - / = = / - = - / = ="],
 [31,"- = - / = = / - = - / = = / - = - / = ="],[32,"- = - = / - = - = / - = - = / - = - ="],[33,"- = - = / - - = = / - = - = / = ="],
 [34,"- = - = / - - = = / - = - = / - - ="],[35,"- = - = / - - = = / - = - = / - - = ="],[36,"- - = - / = - = = // - - = - / = - = ="],
 [37,"- - = - = / - - = - = / - - = - = / - - = - ="]
];
const RUBAI_RAW = [
 ["R1","= = - / - = = - / - = = - / - ="],["R2","= = - / - = = - / - = = = / ="],["R3","= = - / - = - = / - = = = / ="],
 ["R4","= = - / - = - = / - = = - / - ="],["R5","= = = / = - = / - = = - / - ="],["R6","= = = / = - = / - = = = / ="],
 ["R7","= = - / - = = = / = = = / ="],["R8","= = - / - = = = / = = - / - ="],["R9","= = = / = = = / = = - / - ="],
 ["R10","= = = / = = = / = = = / ="],["R11","= = = / = = - / - = = = / ="],["R12","= = = / = = - / - = = - / - ="]
];
const CAESURA_CHEAT = new Set([2,4,7,20,21,22,25,36]);     /* 6.1 */
const PAIRS = [[1,9],[14,15],[16,17],[18,19],[33,34]];      /* 6.1 */

function parse(raw){
  const seq = [], feet = [[]]; let cae = -1;
  raw.trim().split(/\s+/).forEach(p => {
    if(p === '//'){ cae = seq.length; feet.push([]); }
    else if(p === '/') feet.push([]);
    else { const t = p === '=' ? 'l' : p === '-' ? 's' : 'x'; seq.push(t); feet[feet.length-1].push(t); }
  });
  return { seq, cae, feet };
}
function build(id, raw, kind){
  const { seq, cae, feet } = parse(raw);
  const m = { id, raw, seq, cae, feet, kind: kind || 'regular' };
  m.cheatFinal = id !== 26;                      /* 6.1: all meters except #26 */
  m.cheatCae = CAESURA_CHEAT.has(id) && cae > 0;
  const vars = [{ seq: seq.slice(), end:false, cae:false }];
  if(m.cheatFinal) vars.push({ seq: seq.concat(['c']), end:true, cae:false });
  if(m.cheatCae) vars.slice().forEach(v => { const s = v.seq.slice(); s.splice(cae, 0, 'c'); vars.push({ seq:s, end:v.end, cae:true }); });
  m.vars = vars;
  return m;
}
const METERS = METERS_RAW.map(([n, r]) => build(n, r)).concat(RUBAI_RAW.map(([n, r]) => build(n, r, 'rubai')));

/* cost of resolving one syllable to a target weight; Infinity if impossible (1.5) */
function sylCost(s, t, P){
  if(t === 'x') return 0;
  if(s.w === t) return 0;
  if(s.w === 'x'){ const p = P.pShort(s.flex); return t === 's' ? cost(p) : cost(1 - p); }
  return Infinity;
}

function matchRegular(units, n, m, P){
  let best = null;
  const pcf = P.choice('M6.1-cheat-final', 'used'), pcc = P.choice('M6.1-cheat-caesura', 'used');
  for(const v of m.vars){
    let vc = 0;
    if(m.cheatFinal) vc += cost(v.end ? pcf : 1 - pcf);
    if(m.cheatCae) vc += cost(v.cae ? pcc : 1 - pcc);
    const seq = v.seq, L = seq.length, memo = new Map();
    const f = (i, pos) => {
      if(i === n) return pos === L ? { c:0, path:[] } : null;
      if(pos >= L) return null;
      const key = i * 64 + pos; if(memo.has(key)) return memo.get(key);
      let b = null;
      for(const u of units[i]){
        for(let ri = 0; ri < u.readings.length; ri++){
          const r = u.readings[ri], sy = r.syl, k0 = sy.length;
          if(pos + k0 > L) continue;
          let c = r.cost + u.cost, ok = true;
          for(let k = 0; k < k0; k++){
            const t = seq[pos + k];
            if(t === 'c'){ if(k !== k0 - 1 || !sy[k].cheat){ ok = false; break; } continue; }
            const sc = sylCost(sy[k], t, P); if(sc === Infinity){ ok = false; break; } c += sc;
          }
          if(!ok) continue;
          if(b && c >= b.c) continue;
          const rest = f(u.to + 1, pos + k0); if(!rest) continue;
          if(!b || c + rest.c < b.c) b = { c: c + rest.c, path: [{ u, ri, pos }].concat(rest.path) };
        }
      }
      memo.set(key, b); return b;
    };
    const r = f(0, 0);
    if(r && (!best || r.c + vc < best.c)) best = { c: r.c + vc, path: r.path, seq, variant: v };
  }
  return best;
}

/* ---------- 6.2 Mir's Hindi meter: moraic; long = 2, short = 1 half-beats ---------- */
function matchHindi(units, n, P){
  let best = null;
  const lens = [[30,'15'],[28,'14'],[32,'16']];
  const pOn = P.choice('M6.2-hindi-russell', 'on-model'), pSync = P.choice('M6.2-hindi-syncopation', 'used');
  const pcf = P.choice('M6.1-cheat-final', 'used');
  for(const [M, lab] of lens){
    const lenCost = cost(P.choice('M6.2-hindi-length', lab));
    const memo = new Map();
    /* state: m (half-beats so far), st 0 free | 1 one short open | 2 short+long open; ls: last resolved short */
    const f = (i, m, st, ls) => {
      if(i === n) return (m === M && st === 0 && !ls) ? { c:0, path:[] } : null;
      const key = ((i * 40 + m) * 3 + st) * 2 + ls; if(memo.has(key)) return memo.get(key);
      let b = null;
      for(const u of units[i]) for(let ri = 0; ri < u.readings.length; ri++){
        const r = u.readings[ri];
        let states = [{ m, st, ls, c: r.cost + u.cost, res: [] }];
        const lastUnit = u.to === n - 1;
        for(let k = 0; k < r.syl.length && states.length; k++){
          const s = r.syl[k], nx = [];
          const lastSyl = lastUnit && k === r.syl.length - 1;
          for(const A of states){
            if(s.w !== 's'){                                   /* read long */
              const c = A.c + sylCost(s, 'l', P);
              if(A.st === 0) nx.push({ m: A.m + 2, st: 0, ls: 0, c, res: A.res.concat('l') });
              else if(A.st === 1) nx.push({ m: A.m + 2, st: 2, ls: 0, c: c + cost(pSync), res: A.res.concat('l') });
            }
            if(s.w !== 'l'){                                   /* read short */
              let c = A.c + sylCost(s, 's', P);
              if(A.st === 0){
                const slot = A.m / 2 + 1;                          /* 1-based long slot the pair starts in */
                const on = A.m % 2 === 0 && slot % 2 === 0 && slot !== 8 && slot !== 16;
                nx.push({ m: A.m + 1, st: 1, ls: 1, c: c + cost(on ? pOn : 1 - pOn), res: A.res.concat('s') });
              } else nx.push({ m: A.m + 1, st: 0, ls: 1, c: c + (A.st === 1 ? cost(1 - pSync) * 0 : 0), res: A.res.concat('s') });
            }
            if(lastSyl && s.cheat && A.m === M && A.st === 0 && !A.ls) nx.push({ m: A.m, st: 0, ls: 0, c: A.c + cost(pcf), res: A.res.concat('c') });
          }
          states = nx.filter(A => A.m <= M);
          if(states.length > 24){ states.sort((x, y) => x.c - y.c); states.length = 24; }
        }
        for(const A of states){
          if(b && A.c >= b.c) continue;
          const rest = f(u.to + 1, A.m, A.st, A.ls); if(!rest) continue;
          if(!b || A.c + rest.c < b.c) b = { c: A.c + rest.c, path: [{ u, ri, res: A.res }].concat(rest.path) };
        }
      }
      memo.set(key, b); return b;
    };
    const r = f(0, 0, 0, 0);
    if(r){ const c = r.c + lenCost; if(!best || c < best.c) best = { c, path: r.path, M: M / 2 }; }
  }
  return best;
}

module.exports = { METERS, PAIRS, matchRegular, matchHindi, sylCost, parse };
