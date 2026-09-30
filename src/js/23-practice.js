/* ================= BAHR PRACTICE EDITOR (1/2 syllable tapper) =================
   Ear-first: the learner sees a real verse line split into syllables (by the real
   scanner) and presses 1 (short, "da") or 2 (long, "dum") for each. A completed
   foot groups, lights up and plays; a weight that contradicts the engine's reading
   gets a soft low chime and a plain-language hint (and is not placed). Foot names and
   the baḥr name are withheld until the whole line is placed.
   Pure logic (prBuild / prJudge / prHint / prFootsOf) needs only the global `Scan`
   and is unit-tested in tests/practice_logic.js; the DOM part is guarded. */

var PR_LONGV = /[اآویےى]/;   /* ا آ و ی ے ى */

/* Build a practice item from an Urdu line, or null if the scan is not confident/simple enough. */
function prBuild(ur, strict) {
  var res, fit, e;
  try { res = Scan.scanLine(ur); fit = res.fits && res.fits[0]; } catch (err) { return null; }
  if (!fit || !fit.seq || fit.c > 2.5) return null;
  var alt = (typeof fitAmbiguity === 'function') ? fitAmbiguity(res) : [];
  if (strict && alt.length) return null;   /* one line that fits two families can't be settled without the rest of the ghazal */
  try { e = Scan.explain(res, fit); } catch (err2) { return null; }
  var syl = e.syl;
  if (!e.feet || !e.feet.length || syl.length < 6 || syl.length > 24) return null;
  for (var i = 0; i < syl.length; i++) {
    if (syl[i].resolved !== 'l' && syl[i].resolved !== 's') return null;   /* skip extrametrical 'cheat' syllables */
    if (syl[i].cheat || syl[i].foot == null) return null;
  }
  return { ur: ur, res: res, fit: fit, e: e, alt: alt, marks: [], miss: {}, done: false };
}

/* Plain-language reason a weight is wrong. `want` is the engine's weight, 'l' or 's'. */
function prHint(s, want) {
  if (want === 'l') {
    return PR_LONGV.test(s.text || '')
      ? 'This syllable holds a long vowel, so it lasts two beats. Try 2.'
      : 'This syllable is closed in by a consonant, which makes it long. Try 2.';
  }
  return 'This syllable has a short vowel with nothing closing it, so it is quick. Try 1.';
}

/* Judge a tap for syllable i. Flexible syllables (e.g. a final vowel) accept either weight. */
function prJudge(P, i, tap) {
  var s = P.e.syl[i];
  if (tap === s.resolved) return { ok: true };
  if (s.native === 'x') return { ok: true, flex: true, note: 'This one can be said either way; in this line the rhythm reads it as ' + (s.resolved === 'l' ? 'long (2).' : 'short (1).') };
  return { ok: false, hint: prHint(s, s.resolved) };
}

/* index ranges of each foot: [{fi, idx:[..], last}] in line order */
function prFootsOf(P) {
  var out = [];
  P.e.feet.forEach(function (F, fi) { if (F && F.idx && F.idx.length) out.push({ fi: fi, idx: F.idx, last: F.idx[F.idx.length - 1] }); });
  return out;
}

/* Apply one tap to the state. Returns {ok, hint?, note?, closed?:foot, done?}. */
function prApply(P, tap) {
  if (P.done) return { ok: true, done: true };
  var i = P.marks.length, j = prJudge(P, i, tap);
  if (!j.ok) { P.miss[i] = (P.miss[i] || 0) + 1; return { ok: false, hint: j.hint, at: i }; }
  P.marks.push(tap);
  var r = { ok: true, flex: !!j.flex, note: j.note };
  var foot = prFootsOf(P).filter(function (f) { return f.last === i; })[0];
  if (foot) r.closed = foot;
  if (P.marks.length === P.e.syl.length) { P.done = true; r.done = true; }
  return r;
}
function prUndo(P) { if (P.marks.length) { P.marks.pop(); P.done = false; return true; } return false; }
function prMistakes(P) { var n = 0; for (var k in P.miss) n += P.miss[k]; return n; }
function prFirstTry(P) { var n = 0; for (var i = 0; i < P.e.syl.length; i++) if (!P.miss[i]) n++; return n; }

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { prBuild: prBuild, prHint: prHint, prJudge: prJudge, prFootsOf: prFootsOf, prApply: prApply, prUndo: prUndo, prMistakes: prMistakes, prFirstTry: prFirstTry };
}

/* ---------------- DOM / audio part ---------------- */
var PRS = { P: null, timer: null, clashAt: -1 };

function prCorpusLines() {
  var out = [];
  [typeof EXERCISES_DATA !== 'undefined' ? EXERCISES_DATA : null,
   typeof GHALIB_EXT_DATA !== 'undefined' ? GHALIB_EXT_DATA : null,
   typeof MIR_EXT_DATA !== 'undefined' ? MIR_EXT_DATA : null].forEach(function (d) {
    if (Array.isArray(d)) d.forEach(function (g) { (g.lines || []).forEach(function (l) { if (l && l.ur) out.push(l.ur); }); });
  });
  return out;
}
function prPickItem() {
  var all = prCorpusLines();
  for (var t = 0; t < 60 && all.length; t++) {
    var P = prBuild(all[Math.floor(Math.random() * all.length)], t < 40);   /* first 40 tries: unambiguous lines only */
    if (P) return P;
  }
  return null;
}
function prScript() { return (typeof currentScript !== 'undefined') ? currentScript : 'ur'; }
function prSylText(s) {
  var cs = prScript();
  if (cs === 'ur' || !s.text || s.text === '·') return s.text;
  return typeof translitText === 'function' ? translitText(s.text, cs) : s.text;
}
function prLineText(P) {
  var cs = prScript();
  return cs === 'ur' || typeof translitText !== 'function' ? P.ur : translitText(P.ur, cs);
}
function prEsc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function prChime() {
  if (typeof A === 'undefined' || !A.ensure()) return;
  var c = A.ctx, t = c.currentTime + 0.01;
  [196, 147].forEach(function (f, k) {
    var o = c.createOscillator(), g = c.createGain(), s = t + k * 0.12;
    o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, s); g.gain.linearRampToValueAtTime(0.11, s + 0.02); g.gain.exponentialRampToValueAtTime(0.0005, s + 0.5);
    o.connect(g); g.connect(A.out); o.start(s); o.stop(s + 0.55);
  });
}

function prChipHTML(P, i) {
  var s = P.e.syl[i], m = P.marks[i], cs = prScript();
  var cls = ['chip', m || '', s.last ? 'wend' : '', cs === 'hi' ? 'deva' : (cs !== 'ur' ? 'roman' : ''),
    (!P.done && P.marks.length === i && PRS.clashAt !== i) ? 'cur' : '', PRS.clashAt === i ? 'clash' : ''].join(' ').replace(/\s+/g, ' ').trim();
  return '<span class="cw"><span class="' + cls + '" data-i="' + i + '">' + prEsc(prSylText(s)) + '</span><span class="fs pr-mark">' + (m === 'l' ? '=' : m === 's' ? '–' : '&nbsp;') + '</span></span>';
}
/* completed feet are grouped (.fgrp); the rest stay a flat run of syllables. No foot names here. */
function prChipsHTML(P) {
  var n = P.marks.length, out = '';
  P.e.feet.forEach(function (F, fi) {
    if (!F || !F.idx) return;
    var chips = F.idx.map(function (i) { return prChipHTML(P, i); }).join('');
    var closed = F.idx[F.idx.length - 1] < n;
    out += closed ? '<span class="fgrp pr-closed" data-f="' + fi + '"><span class="fchips">' + chips + '</span></span>' : chips;
  });
  return '<div class="chips ' + (prScript() === 'ur' ? '' : 'ltr') + '">' + out + '</div>';
}

function prRender() {
  var P = PRS.P; if (!P || typeof document === 'undefined') return;
  var L = document.getElementById('practiceLine'), C = document.getElementById('practiceChips');
  if (L) L.textContent = prLineText(P);
  if (C) C.innerHTML = prChipsHTML(P);
  var back = document.getElementById('prBack'); if (back) back.disabled = !P.marks.length;
  ['prShort', 'prLong'].forEach(function (id) { var b = document.getElementById(id); if (b) b.disabled = P.done; });
}
function prSetHint(msg, kind) {
  var h = document.getElementById('practiceHint'); if (!h) return;
  h.className = 'pr-hint' + (kind ? ' ' + kind : ''); h.innerHTML = msg || '&nbsp;';
}
function prClearTimer() { if (PRS.timer) { clearTimeout(PRS.timer); PRS.timer = null; } }

function prPlayFoot(foot) {
  var P = PRS.P, seq = foot.idx.map(function (i) { return P.marks[i]; });
  var chips = foot.idx.map(function (i) { return document.querySelector('#practiceChips .chip[data-i="' + i + '"]'); });
  var grp = document.querySelector('#practiceChips .fgrp[data-f="' + foot.fi + '"]');
  if (grp) grp.classList.add('litf');
  play(seq, { feet: seq.map(function () { return 0; }), cadence: false,
    onStep: function (k) { chips.forEach(function (n) { if (n) n.classList.remove('lit'); }); if (chips[k]) chips[k].classList.add('lit'); },
    onEnd: function () { chips.forEach(function (n) { if (n) n.classList.remove('lit'); }); if (grp) setTimeout(function () { grp.classList.remove('litf'); }, 500); } });
}

function prPress(tap) {
  var P = PRS.P; if (!P || P.done) return;
  prClearTimer();
  var r = prApply(P, tap);
  if (!r.ok) {
    prChime(); PRS.clashAt = r.at; prRender(); prSetHint(prEsc(r.hint), 'warn');
    setTimeout(function () { if (PRS.clashAt === r.at) { PRS.clashAt = -1; prRender(); } }, 650);
    return;
  }
  PRS.clashAt = -1;
  if (typeof play === 'function') play([tap], { cadence: false });          /* immediate da / dum */
  prSetHint(r.note ? prEsc(r.note) : (r.closed && !r.done ? 'That foot is complete. Listen.' : ''), r.note ? '' : (r.closed ? 'ok' : ''));
  prRender();
  if (r.closed) {
    var foot = r.closed;
    PRS.timer = setTimeout(function () { PRS.timer = null; if (PRS.P === P) { prRender(); prPlayFoot(foot); } }, 420);
  }
  if (r.done) prReveal();
}
function prBack() {
  var P = PRS.P; if (!P) return;
  prClearTimer();
  if (prUndo(P)) { PRS.clashAt = -1; var rv = document.getElementById('practiceReveal'); if (rv) rv.innerHTML = ''; prSetHint(''); prRender(); }
}

function prReveal() {
  var P = PRS.P, host = document.getElementById('practiceReveal'); if (!host) return;
  var total = P.e.syl.length, ft = prFirstTry(P);
  var fam = (typeof famOfMeter !== 'undefined') ? famOfMeter[P.fit.meter.id] : null;
  var info = (typeof meterLabelInfo === 'function') ? meterLabelInfo(P.fit.meter) : null;
  var famVerse = fam && typeof famLabel === 'function' && typeof getLineDisplay === 'function' ? getLineDisplay(famLabel(fam), prScript()) : '';
  var nFlex = P.e.syl.filter(function (x) { return x.native === 'x'; }).length;
  var msg = prMistakes(P) === 0 ? 'Every syllable heard correctly. Lovely.' : ft + ' of ' + total + ' syllables on the first try. Each one you corrected is your ear learning.';
  var chipsFull = (typeof chipsHTML === 'function') ? '<div class="chips ' + (prScript() === 'ur' ? '' : 'ltr') + '" id="prRevChips">' + chipsHTML(P.e.syl, P.e.feet) + '</div>' : '';
  host.innerHTML = '<p class="pr-score">' + prEsc(msg) + '</p>' + chipsFull +
    (famVerse ? '<p class="pr-bahr">Same rhythm as the famous verse <span class="pr-fam ' + (prScript() === 'ur' ? 'urdu' : '') + '">' + famVerse + '</span></p>' : '') +
    '<p class="pr-tech dim small">' + (info && info.name ? 'Technical name: <i>' + prEsc(info.name) + '</i>' : 'A classical rhythm') + '</p>' +
    (P.alt && P.alt.length ? '<p class="pr-flexnote dim small">Heads up: this line on its own also fits ' + P.alt.slice(0, 2).map(function (f) { var i = (typeof meterLabelInfo === 'function') ? meterLabelInfo(f.meter) : null; return prEsc(i && i.name ? i.name : 'meter ' + f.meter.id); }).join(' and ') + '. Because some syllables are flexible, a poet\'s other lines in the same ghazal are what settle the meter.</p>' : '') +
    (nFlex ? '<p class="pr-flexnote dim small">' + nFlex + ' of ' + total + ' syllables are <b>flexible</b> (purple underline): the meter lets them be said long or short, so either tap was fine. Which one they take here is set by the rhythm of the whole line; the rest are fixed.</p>' : '') +
    '<div class="row"><button class="btn gold sm" onclick="prHearAll()">&#9654;&#xFE0E; Hear the whole line</button><button class="btn sm" onclick="prNew()">Next line &#9656;</button></div>';
  prSetHint('The foot names are revealed below.', 'ok');
}
function prHearAll() {
  var P = PRS.P, box = document.getElementById('prRevChips'); if (!P || !box || typeof playEx !== 'function') return;
  var nodes = [].slice.call(box.querySelectorAll('.chip')).sort(function (a, b) { return a.dataset.i - b.dataset.i; });
  playEx(P.e, nodes, [].slice.call(box.querySelectorAll('.fgrp')));
}

function prNew() {
  prClearTimer(); if (typeof stopAll === 'function') stopAll();
  PRS.clashAt = -1;
  var host = document.getElementById('practiceReveal'); if (host) host.innerHTML = '';
  PRS.P = prPickItem();
  if (!PRS.P) { var L = document.getElementById('practiceLine'); if (L) L.textContent = 'No line available.'; return; }
  prSetHint('Ready. Say the first syllable, then press 1 or 2.');
  prRender();
}
/* function declarations are hoisted across the whole bundle, so the router can call this before
   `var PRS` above has run: bail out then (the self-mount at the bottom picks the route up). */
function mountPractice() { if (!PRS) return; if (!PRS.P) prNew(); else prRender(); }

if (typeof document !== 'undefined') {
  document.addEventListener('keydown', function (ev) {
    var sec = document.getElementById('practice-section');
    if (!sec || !sec.classList || !sec.classList.contains('on') || sec.style.display === 'none') return;
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    var t = ev.target && ev.target.tagName;
    if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return;
    if (ev.key === '1') { ev.preventDefault(); prPress('s'); }
    else if (ev.key === '2') { ev.preventDefault(); prPress('l'); }
    else if (ev.key === 'Backspace') { ev.preventDefault(); prBack(); }
  });
}

/* self-mount: this file loads after 21-learn.js's initial handleRoute(), so a direct
   load of #/lab/practice reaches mountPractice before it exists. Pick up here. */
if (typeof document !== 'undefined') {
  var prSec = document.getElementById('practice-section');
  if (prSec && prSec.classList && typeof prSec.classList.contains === 'function' && prSec.classList.contains('on')) mountPractice();
}
