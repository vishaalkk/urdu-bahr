/* Logic test for the Practice Editor (src/js/23-practice.js): engine-driven syllables/feet,
   correct taps close feet, wrong taps are rejected with a hint. Run: node tests/practice_logic.js */
const path = require('path');
global.Scan = require(path.join(__dirname, '..', 'src/js/01-engine.js'));
const PR = require(path.join(__dirname, '..', 'src/js/23-practice.js'));
const ex = require(path.join(__dirname, '..', 'data/exercises_verified.json'));
let fails = 0; const t = (c, m) => { if (!c) { fails++; console.log('  x ' + m); } };

let built = 0, tried = 0, flexSeen = 0;
for (const g of ex) for (const l of g.lines) {
  tried++;
  const P = PR.prBuild(l.ur); if (!P) continue; built++;
  const S = P.e.syl, feet = PR.prFootsOf(P);
  t(feet.reduce((n, f) => n + f.idx.length, 0) === S.length, 'feet cover all syllables: ' + l.ur);
  let closedCount = 0;
  for (let i = 0; i < S.length; i++) {
    const wrong = S[i].resolved === 'l' ? 's' : 'l';
    if (S[i].native !== 'x') {
      const r = PR.prApply(P, wrong);
      t(!r.ok && r.hint && r.at === i && P.marks.length === i, 'wrong tap rejected with hint');
    } else flexSeen++;
    const r = PR.prApply(P, S[i].resolved);
    t(r.ok, 'right tap accepted');
    if (r.closed) closedCount++;
    t(!!r.done === (i === S.length - 1), 'done only at end');
  }
  t(closedCount === feet.length, 'every foot closes exactly once');
  PR.prUndo(P); t(!P.done && P.marks.length === S.length - 1, 'backspace steps back');
}
t(built > 100, 'built ' + built + ' of ' + tried + ' lines (expected > 100)');
console.log(built + '/' + tried + ' lines usable, flex syllables exercised ' + flexSeen);
console.log(fails ? fails + ' failure(s)' : 'practice logic ok');
process.exit(fails ? 1 : 0);
