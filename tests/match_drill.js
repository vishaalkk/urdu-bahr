/* Match Baḥr drill (Meter › Drill). Run after `npm run build`: node tests/match_drill.js
   Generates many questions from the built app and checks the exercise's contract:
   3-4 candidates, exactly one sharing the anchor's meter, distractors in other families,
   all by poets other than the anchor's; then drives the DOM (answer, script switch, Next). */
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs'), path = require('path');
const HTML = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let failures = 0;
const check = (c, m) => { if (!c) { failures++; console.log('  ✗ ' + m); } };
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const errors = [];
  const vc = new VirtualConsole(); vc.on('jsdomError', e => { if (!/Not implemented|scrollTo/.test(e.message)) errors.push(e.message.split('\n')[0]); });
  const dom = new JSDOM(HTML, { runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, url: 'http://localhost/index.html#/meter/drill' });
  const w = dom.window; w.scrollTo = () => {};
  await wait(400);
  const N = 25; let made = 0, sizes = new Set();
  w.DR.meter.types = new Set(['match']); w.DR.meter.sources = new Set(['all']);
  for (let i = 0; i < N; i++) {
    const q = w.drGenerate('meter');
    if (!q || q.type !== 'match') { check(false, 'question ' + i + ' was not a match question'); continue; }
    made++; sizes.add(q.cands.length);
    check(q.cands.length >= 3 && q.cands.length <= 4, 'candidate count ' + q.cands.length);
    const mid = String(w.Scan.scanLine(q.anchor.lines[0].line.ur).fits[0].meter.id);
    const aPoet = w.drPoetKey(q.anchor.item, q.anchor.src);
    const poets = new Set([aPoet]);
    let same = 0;
    q.cands.forEach((c, k) => {
      const cm = String(w.Scan.scanLine(c.line.ur).fits[0].meter.id);
      const pk = w.drPoetKey(c.item, c.src);
      check(!poets.has(pk), 'poet repeated or equals anchor: ' + pk); poets.add(pk);
      if (cm === mid) { same++; check(k === q.correctIndex, 'matching candidate is the marked answer'); }
      else check(w.eval('famOfMeter')[cm] !== w.eval('famOfMeter')[mid],'distractor shares the anchor family');
    });
    check(same === 1, 'exactly one candidate shares the anchor meter (got ' + same + ')');
  }
  check(made === N, 'generated ' + made + '/' + N);
  console.log('  candidate sizes seen: ' + [...sizes].join(','));

  // DOM: render, one Listen per candidate + anchor, answer right, switch script, Next
  w.drNext('meter');
  const $ = s => w.document.querySelector(s);
  const q = w.DR.meter.current;
  check(q && q.type === 'match', 'DOM question is a match question');
  check(/same rhythm/.test($('#dr-meter-prompt').textContent), 'prompt asks about the same rhythm');
  check($('#dr-meter-prompt .dr-play'), 'anchor Listen button');
  check(w.document.querySelectorAll('#dr-meter-choices .dr-cand-play').length === q.cands.length, 'a Listen button per candidate');
  w.setScriptMode('ro');
  await wait(20);
  check(!/[؀-ۿ]/.test($('#dr-meter-choices').textContent), 'candidates re-render out of Urdu script on switch');
  w.setScriptMode('ur');
  w.drAnswer('meter', (q.correctIndex + 1) % q.cands.length);
  check(/Not quite/.test($('#dr-meter-fb').textContent), 'wrong answer shows a hint');
  check(!$('#dr-meter-fb .dr-shared') === false, 'shared strip revealed');
  w.drNext('meter');
  const q2 = w.DR.meter.current;
  w.drAnswer('meter', q2.correctIndex);
  check(/Right/.test($('#dr-meter-fb').textContent) && /baḥr of/.test($('#dr-meter-fb').textContent), 'right answer reveals the baḥr family');
  check(errors.length === 0, 'no script errors: ' + errors.slice(0, 3).join(' | '));
  console.log(failures ? failures + ' failure(s)' : 'match drill OK');
  process.exit(failures ? 1 : 0);
})();
