/* Resilience: special constructions (grafting 3.1, iẓāfat 3.2, o 3.3, al 3.4) typed sloppily (missing space, extra ZWNJ,
   missing zer, attached و ...) must never throw and must still yield candidate readings in both engines.
   Throwing = failure (exit 1). "Only reads it as something else" is reported as a GAP but does not fail.
   node tests/handbook_resilience.js [-v] */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const blocks = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi).map(b => b.replace(/<\/?script[^>]*>/gi, ''));
const el = id => ({ id, classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } }, addEventListener(){}, querySelectorAll: () => [], querySelector: () => null, textContent: '', innerHTML: '', style: {}, dataset: {} });
const store = {};
const ctx = { window: {}, console: { log(){}, warn(){}, error(){} }, setTimeout: () => 1, clearTimeout(){}, setInterval(){}, clearInterval(){},
  document: { getElementById: id => store[id] || (store[id] = el(id)), querySelectorAll: () => [], querySelector: () => el('q'), addEventListener(){}, documentElement: el('html'), body: el('body') },
  localStorage: { getItem: () => null, setItem(){}, removeItem(){} }, location: { hash: '', search: '' }, history: { replaceState(){} }, AudioContext: function(){ return {}; } };
ctx.window = ctx; ctx.self = ctx; vm.createContext(ctx);
blocks.forEach(code => { try { vm.runInContext(code, ctx); } catch (e) {} });
const Scan = ctx.Scan, E = require('../engine-lab/engine.js');
const Z = '‌', ZER = 'ِ';
/* [construction, label, production input, engine-lab input, wanted pattern (handbook), expected to be read as joined?] */
const CASES = [
  ['iz', 'consonant, zer', 'ملکِ', 'mulk-e', '= x'], ['iz', 'consonant, no zer', 'ملک', 'mulk', '= -'], ['iz', 'consonant, ZWNJ before zer', 'ملک' + Z + ZER, 'mulk-e', '= x'],
  ['iz', 'consonant, no hyphen', 'ملک', 'mulke', '= x'], ['iz', 'alif, hamza-ye', 'وفائے', 'vafaa-e', '- = x'], ['iz', 'alif, zer', 'وفاِ', 'vafaa-e', '- = x'], ['iz', 'alif, ZWNJ', 'وفا' + Z + 'ئے', 'vafaa-e', '- = x'],
  ['iz', 'ii, zer', 'شوخیِ', 'sho;xii-e', '= - x'], ['iz', 'ii, hamza', 'شوخیٔ', 'sho;xii-e', '= - x'], ['iz', 'ii, ye-hamza-e', 'شوخیئے', 'sho;xii-e', '= - x'], ['iz', 'ii, no mark', 'شوخی', 'sho;xii', '= - x'],
  ['o', 'consonant, spaced', 'دین و دل', 'diin-o-dil', '= x ='], ['o', 'consonant, attached', 'دینو دل', 'diino dil', '= x ='], ['o', 'consonant, ZWNJ', 'دین' + Z + 'و دل', 'diin-o-dil', '= x ='],
  ['o', 'consonant, hyphens', 'دین-و-دل', 'diin-o-dil', '= x ='], ['o', 'trailing o only', 'خط و', 'xa:t-o', '- x'], ['o', 'after alif', 'وفا و', 'vafaa-o', '- = -'], ['o', 'no o written', 'دین دل', 'diin dil', '= x ='],
  ['al', 'spaced', 'عالم الغیب', '((aalam ul-;Gaib', '= - = = -'], ['al', 'attached', 'عالمالغیب', '((aalam ul;Gaib', '= - = = -'], ['al', 'al detached', 'عالم ال غیب', '((aalam ul ;Gaib', '= - = = -'],
  ['al', 'ZWNJ', 'عالم' + Z + 'الغیب', '((aalam ul-;Gaib', '= - = = -'], ['al', 'two-consonant first word', 'رب الرحیم', 'rabb ul-ra;hiim', '= = - = -'], ['al', 'vowel + al', 'فی الحال', 'fii al-;haal', '= = -'],
  ['graft', 'spaced', 'آخر اس', 'aa;xir is', '= - ='], ['graft', 'no space', 'آخراس', 'aa;xiris', '= - ='], ['graft', 'ZWNJ', 'آخر' + Z + 'اس', 'aa;xir is', '= - ='], ['graft', 'double space', 'آخر  اس', 'aa;xir  is', '= - ='],
  ['graft', 'three words', 'کافر ان اصنام', 'kaafir in a.snaam', '= - - = = -'], ['graft', 'tab between', 'آپ\tاگر', 'aap\tagar', '= - ='],
];
const sym = { l: '=', s: '-', x: 'x' };
const pats = (units, n, pick) => { const out = []; const go = (i, acc) => { if (out.length > 3000) return; if (i >= n) { out.push(acc.join(' ')); return; } for (const u of units[i]) for (const s of pick(u)) go(u.to + 1, acc.concat(s)); }; go(0, []); return out; };
const ok = (c, w) => { const a = c.split(' '), b = w.split(' '); return a.length === b.length && a.every((x, i) => x === b[i] || x === 'x' || b[i] === 'x'); };
let thrown = 0, gaps = 0;
for (const [con, label, ur, ae, want] of CASES) {
  const res = { prod: null, lab: null };
  try {
    const words = Scan.tokenize(ur); const units = words.length ? Scan.buildUnits(words) : [];
    const c = pats(units, words.length, u => u.opts.map(o => o.syl.map(s => sym[s.w]).join(' ')));
    Scan.scanLine(ur);
    res.prod = c.length ? (c.some(x => ok(x, want)) ? 'ok' : 'other') : 'none';
  } catch (e) { res.prod = 'THROW ' + e.message; thrown++; }
  try {
    const { words } = E.asciiWords(ae); const units = words.length ? E.buildUnits(words) : [];
    const c = pats(units, words.length, u => u.readings.map(r => r.syl.map(s => sym[s.w]).join(' ')));
    E.scanLine(ae);
    res.lab = c.length ? (c.some(x => ok(x, want)) ? 'ok' : 'other') : 'none';
  } catch (e) { res.lab = 'THROW ' + e.message; thrown++; }
  if (res.prod !== 'ok' || res.lab !== 'ok') { gaps++; console.log(`GAP  ${con.padEnd(5)} ${label.padEnd(28)} prod ${res.prod.padEnd(6)} lab ${res.lab}   (want ${want})`); }
}
console.log(`resilience: ${CASES.length} variants, ${thrown} throw(s), ${gaps} with a gap (candidates exist but the handbook reading is not among them, or none)`);
process.exit(thrown ? 1 : 0);
