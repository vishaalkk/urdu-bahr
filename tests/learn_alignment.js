/* Learn pages vs the handbook (docs/reviews/30-learn-alignment.md).
   1. Every rule card / drill item / legend entry names a rule id from engine-lab/rules.json (or is flagged `app`),
      and that id lives in the handbook section the card cites. Static cards in src/body/weight.html and meter.html
      (marked data-rule-card) must carry a visible "Handbook §" link to franpritchett.com.
   2. Worked examples: unjoined patterns are re-run through the engine (tests/learn_examples.js); joined patterns
      must appear among the handbook's own examples for that section (tests/data/handbook_examples.json).
   3. Copyright guard: no run of 8 consecutive words of card text may occur in data/handbook_verbatim.json
      (local-only file; the check is skipped when it is absent, e.g. in CI). */
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const rules = Object.fromEntries(require('../engine-lab/rules.json').rules.map(r => [r.id, r]));
const hbEx = require('./data/handbook_examples.json').examples;
const blocks = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi).map(b => b.replace(/<\/?script[^>]*>/gi, ''));
const el = id => ({ id, classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } }, addEventListener(){}, querySelectorAll: () => [], querySelector: () => null, textContent: '', innerHTML: '', style: {}, dataset: {} });
const store = {};
const ctx = { window: {}, console: { log(){}, warn(){}, error(){} }, setTimeout: () => 1, clearTimeout(){}, setInterval(){}, clearInterval(){},
  document: { getElementById: id => store[id] || (store[id] = el(id)), querySelectorAll: () => [], querySelector: () => el('q'), addEventListener(){}, documentElement: el('html'), body: el('body') },
  localStorage: { getItem: () => null, setItem(){}, removeItem(){} }, location: { hash: '', search: '' }, history: { replaceState(){} }, AudioContext: function(){ return {}; } };
ctx.window = ctx; ctx.self = ctx; vm.createContext(ctx);
blocks.forEach(code => { try { vm.runInContext(code, ctx); } catch (e) {} });
const get = n => vm.runInContext(n, ctx);
let fails = 0; const bad = m => { fails++; console.log('FAIL: ' + m); };
const ruleSec = get('ruleSec');

/* a rule id is valid when it exists in rules.json and its section field mentions the cited section */
function checkRule(where, rule, sec) {
  const r = rules[rule];
  if (!r) return bad(`${where}: unknown rule id "${rule}"`);
  const s = sec || ruleSec(rule);
  if (!s) return bad(`${where}: rule "${rule}" gives no handbook section`);
  const secs = String(r.section).split(/[ ,()]+/).filter(x => /^\d+(\.\d+)?$/.test(x));
  if (!secs.includes(s)) bad(`${where}: cites §${s} but rules.json puts ${rule} in §${secs.join(', ')}`);
}
function checkCard(where, c) {
  if (c.app) return;                                               /* the app's own grouping or notation: no handbook rule to cite */
  if (!c.rule) return bad(`${where}: no rule id and not flagged app`);
  checkRule(where, c.rule, c.sec);
}

const texts = [];                                                  /* every prose string, for the copyright guard */
const CONSTR = get('CONSTR'), SPECIAL = get('SPECIAL_SYLL'), WORDS = get('WORDS'), FLEX = get('FLEX'), LEGEND = get('LEGEND_ITEMS'), FAM_RULES = get('FAM_RULES');
let cards = 0;
for (const c of CONSTR) {
  cards++; checkCard('CONSTR "' + c.t + '"', c); texts.push(c.d);
  /* joined pattern must be one the handbook prints for this section (or the documented fan/khat "x x" advice) */
  const sec = c.sec || ruleSec(c.rule);
  const printed = new Set(hbEx.filter(e => e.section === sec).map(e => e.pattern));
  for (const e of c.ex) {
    const after = e[3].replace(/\s+/g, ' ');
    if (!printed.has(after) && !(c.rule === 'F3.2-cc-tashdid' && after === 'x x'))
      bad(`CONSTR "${c.t}" ${e[1]}: joined pattern "${after}" is not printed in handbook §${sec} (${[...printed].join(' | ')})`);
  }
}
for (const c of SPECIAL) { cards++; checkCard('SPECIAL_SYLL "' + c.t + '"', c); texts.push(c.d, c.note || ''); }
WORDS.forEach(w => { cards++; checkRule('WORDS ' + w[1], w[3]); });
FLEX.forEach(f => { cards++; checkRule('FLEX ' + f[0], f[2]); });
for (const l of LEGEND) { cards++; checkCard('LEGEND ' + l.body.replace(/<[^>]+>/g, ' ').trim(), l); texts.push(l.tip); }
for (const [f, r] of Object.entries(FAM_RULES)) checkRule('FAM_RULES ' + f, r);
const groups = get('FAM_GROUPS');
for (const g of groups) { cards++; texts.push(g.explainer); }

/* static cards */
for (const f of ['weight.html', 'meter.html', 'home.html']) {
  const src = fs.readFileSync(path.join(root, 'src', 'body', f), 'utf8');
  texts.push(src.replace(/<[^>]+>/g, ' '));
  for (const m of src.matchAll(/data-rule="([^"]+)"/g)) checkRule(f + ' link', m[1], null);
  for (const m of src.matchAll(/class="hb-ref"[^>]*href="([^"]+)"/g)) if (!/^https:\/\/franpritchett\.com\/00ghalib\/meterbk\/\d\d_\w+\.html/.test(m[1])) bad(f + ': bad handbook link ' + m[1]);
  const chunks = src.split('data-rule-card').slice(1);
  chunks.forEach((ch, i) => {
    cards++;
    const body = ch.split(/data-rule-card|class="go-deeper/)[0];
    if (!/class="hb-ref"[^>]*data-rule="[^"]+"|data-rule="[^"]+"[^>]*class="hb-ref"/.test(body)) bad(`${f}: static rule card #${i + 1} has no Handbook citation`);
    if (!/Handbook (&sect;|§|ch\.)/.test(body)) bad(`${f}: static rule card #${i + 1} lacks a visible "Handbook §" reference`);
  });
}
const wsrc = fs.readFileSync(path.join(root, 'src', 'body', 'weight.html'), 'utf8');
/* credit lives in the site footer and each tab's "Go deeper" links, not in a banner atop every tab */
if (!/Pritchett/.test(fs.readFileSync(path.join(root, 'src', 'body', 'footer.html'), 'utf8'))) bad('footer.html: Handbook credit missing');
if (!/franpritchett\.com\/00ghalib\/meterbk/.test(wsrc)) bad('weight.html: no Handbook links');
if (!/franpritchett\.com\/00ghalib\/meterbk\/05_feet/.test(fs.readFileSync(path.join(root, 'src', 'js', '17-ear.js'), 'utf8'))) bad('Feet lesson: no ch. 5 link');
/* rendered cards carry their citation */
const rendered = get('CONSTR').map((c, i) => c.app ? null : get('hbRef')(c.rule, c.sec));
rendered.forEach((r, i) => { if (r !== null && !/Handbook §\d/.test(r)) bad('CONSTR card ' + i + ' renders without a citation'); });

/* engine check on unjoined patterns / stated weights */
try { cp.execFileSync('node', [path.join(__dirname, 'learn_examples.js')], { stdio: 'pipe' }); } catch (e) { bad('learn_examples.js failed:\n' + String(e.stdout)); }

/* copyright guard */
const vf = path.join(root, 'data', 'handbook_verbatim.json');
let guard = 'skipped (data/handbook_verbatim.json absent)';
if (fs.existsSync(vf)) {
  const words = s => s.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').toLowerCase().split(/[^a-z0-9À-ɏ]+/).filter(Boolean);
  const book = JSON.parse(fs.readFileSync(vf, 'utf8')).map(c => words(c.html_content));
  const N = 8, grams = new Set();
  for (const w of book) for (let i = 0; i + N <= w.length; i++) grams.add(w.slice(i, i + N).join(' '));
  let hits = 0;
  for (const t of texts) { const w = words(t); for (let i = 0; i + N <= w.length; i++) if (grams.has(w.slice(i, i + N).join(' '))) { hits++; bad('8-word run copied from the handbook: "' + w.slice(i, i + N).join(' ') + '"'); break; } }
  guard = hits ? hits + ' hit(s)' : 'clean (' + texts.length + ' texts vs ' + grams.size + ' handbook 8-grams)';
}
console.log('copyright guard: ' + guard);
if (fails) { console.log(fails + ' Learn alignment problem(s)'); process.exit(1); }
console.log('learn alignment ok (' + cards + ' cards/items cited)');
