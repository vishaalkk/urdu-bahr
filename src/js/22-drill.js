/* ================= SHARED DRILL ENGINE (round 2, G3) =================
   One engine, mounted into both Weight › Drill and Meter › Drill by
   mountDrill('weight'|'meter'). Generates fresh questions on the fly from
   the word bank (GLOSSARY_DATA) and the three verse corpora (EXERCISES_DATA /
   GHALIB_EXT_DATA / MIR_EXT_DATA) via the scanner (Scan.scanLine/explain),
   confident scans only (verdictOf(fit.c)[0]==='ok', i.e. cost <= 2.5).
   Reuses the *ideas* in 21-learn.js (wdNext/fxNext) and 17-ear.js
   (iomNew/wtNew/renderWeak) but not their code or DOM ids — those stay in
   place, unlinked. Every ▶ here is pattern-only playback (no real-line audio
   yet), routed through pbTogglePattern when the Player agent adds it; see
   drPlayToggle()'s fallback and the final report. */

var DR = { weight: null, meter: null };

var DR_TYPES = {
  weight: [
    { key: 'weigh', label: 'Weigh the word' },
    { key: 'flexfixed', label: 'Flexible or fixed' },
    { key: 'izafat', label: 'Iẓāfat' },
    { key: 'grafting', label: 'Grafting' },
    { key: 'ojoin', label: "'O' joins" }
  ],
  meter: [
    { key: 'bahr', label: 'Which bahr' },
    { key: 'limping', label: 'In the bahr, or limping?' },
    { key: 'foot', label: 'Which foot' },
    { key: 'ghazal', label: 'Which ghazal' }
  ]
};
var DR_SOURCES = [
  { key: 'handbook', label: 'Handbook' },
  { key: 'ghalib', label: 'Ghalib' },
  { key: 'mir', label: 'Mir' }
];

/* ---------- small utilities ---------- */
function drSym(w) { return w === 'l' ? '=' : w === 's' ? '–' : w === 'x' ? 'x' : '·'; }
function drPatText(seq) { return seq.map(drSym).join(' '); }
function drShuffle(a) { return a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]); }
function drPick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function drEsc(s) {
  if (typeof escapeHtml === 'function') return escapeHtml(s);
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function drLabelForSource(k) { return k === 'handbook' ? 'Handbook' : k === 'ghalib' ? 'Ghalib' : k === 'mir' ? 'Mir' : k; }
function drCapFirst(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
function drRawFromSeq(seq) { return seq.map(w => w === 'l' ? '=' : w === 's' ? '-' : w === 'x' ? 'x' : '-').join(' '); }

function drFlipOne(seq) {
  const t = seq.slice();
  const i = Math.floor(Math.random() * t.length);
  t[i] = t[i] === 'l' ? 's' : (t[i] === 's' ? 'l' : (Math.random() < 0.5 ? 'l' : 's'));
  return t;
}
function drDistractors(correct, n) {
  const out = [], seen = new Set([correct.join('|')]);
  for (let tries = 0; out.length < n && tries < 30; tries++) {
    const d = drFlipOne(correct), k = d.join('|');
    if (!seen.has(k)) { seen.add(k); out.push(d); }
  }
  return out;
}

function drCorpusFor(key) {
  if (key === 'handbook') return (typeof EXERCISES_DATA !== 'undefined' && Array.isArray(EXERCISES_DATA)) ? EXERCISES_DATA : [];
  if (key === 'ghalib') return (typeof GHALIB_EXT_DATA !== 'undefined' && Array.isArray(GHALIB_EXT_DATA)) ? GHALIB_EXT_DATA : [];
  if (key === 'mir') return (typeof MIR_EXT_DATA !== 'undefined' && Array.isArray(MIR_EXT_DATA)) ? MIR_EXT_DATA : [];
  return [];
}
function drActiveSources(tab) {
  const st = DR[tab], keys = DR_SOURCES.map(x => x.key);
  if (!st || !st.sources || st.sources.has('all') || !st.sources.size) return keys;
  return keys.filter(k => st.sources.has(k));
}
function drActiveTypes(tab) {
  const st = DR[tab], keys = DR_TYPES[tab].map(x => x.key);
  if (!st || !st.types || st.types.has('all') || !st.types.size) return keys;
  return keys.filter(k => st.types.has(k));
}

/* sample one confident-scan (cost <= 2.5) real line from the chosen sources.
   Lazy: a handful of random line + Scan.scanLine tries, never the whole corpus. */
function drSample(sources) {
  for (let tries = 0; tries < 25; tries++) {
    const src = drPick(sources);
    const corpus = drCorpusFor(src);
    if (!corpus.length) continue;
    const item = drPick(corpus);
    if (!item.lines || !item.lines.length) continue;
    const line = drPick(item.lines);
    if (!line || !line.ur) continue;
    let res, fit;
    try { res = Scan.scanLine(line.ur); fit = res.fits && res.fits[0]; } catch (e) { continue; }
    if (!fit || typeof verdictOf !== 'function' || verdictOf(fit.c)[0] !== 'ok') continue;
    return { source: src, item, line, res, fit };
  }
  return null;
}

/* group a real Scan.explain() syllable list back into the per-word/per-graft
   "steps" the engine scored, and match each scanner note to its segment (by
   the exact raw phrase text explain() already put on the note). */
function drNoteSegments(res, exp) {
  const segs = [];
  let i = 0;
  while (i < exp.syl.length) {
    const s = exp.syl[i]; let j = i;
    while (j < exp.syl.length && exp.syl[j].word === s.word && exp.syl[j].wordTo === s.wordTo) j++;
    segs.push({ from: s.word, to: s.wordTo, syl: exp.syl.slice(i, j) });
    i = j;
  }
  const wordsRaw = res.words.map(w => w.raw);
  const out = [];
  (exp.notes || []).forEach(n => {
    const seg = segs.find(sg => !sg._used && wordsRaw.slice(sg.from, sg.to + 1).join(' ') === n.word);
    if (seg) { seg._used = true; out.push({ seg, note: n.note, phrase: n.word }); }
  });
  return out;
}

function drParseWt(wt) {
  return String(wt).split(',').map(p => p.replace(/[()]/g, '').trim()).filter(Boolean)
    .map(p => p.split(/\s+/).map(sym => sym === '=' ? 'l' : (sym === '-' ? 's' : 'x')));
}

/* ---------- WEIGHT question generators ---------- */
function drGenWeigh() {
  if (typeof GLOSSARY_DATA === 'undefined' || !GLOSSARY_DATA.length) return null;
  for (let tries = 0; tries < 15; tries++) {
    const item = drPick(GLOSSARY_DATA);
    const pats = drParseWt(item.wt);
    const correct = pats[0];
    if (!correct || correct.length < 2 || correct.length > 4) continue;   // one syllable is too easy
    const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
    const wordDisp = (typeof getDictWordDisplay === 'function') ? getDictWordDisplay(item, cs) : (item.ascii || item.syl || '');
    const distractors = drDistractors(correct, 2);
    const choices = drShuffle([correct, ...distractors]);
    return {
      type: 'weigh', source: 'handbook',
      playSeq: null,
      promptHTML: `<div class="dr-word ${cs === 'ur' ? 'urdu' : (cs === 'hi' ? 'deva' : '')}">${drEsc(wordDisp)}</div>` +
        (item.mean ? `<p class="dr-mean">${drEsc(item.mean.replace(/^"|"$/g, ''))}</p>` : '') + `<p class="dr-ask">Pick its long–short pattern.</p>`,
      choices: choices.map(c => ({ html: drPatHTML(c), seq: c })),
      correctIndex: choices.findIndex(c => c === correct),
      answerSeqs: [correct],
      reason: `This is how it scans.`
    };
  }
  return null;
}

function drGenFlexFixed() {
  if (typeof GLOSSARY_DATA === 'undefined' || !GLOSSARY_DATA.length) return null;
  for (let tries = 0; tries < 15; tries++) {
    const item = drPick(GLOSSARY_DATA);
    const pats = drParseWt(item.wt);
    if (!pats.length) continue;
    const flexible = pats.some(p => p.includes('x'));
    const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
    const wordDisp = (typeof getDictWordDisplay === 'function') ? getDictWordDisplay(item, cs) : (item.ascii || item.syl || '');
    const opts = [{ html: '<span class="dr-opt"><b>Flexible</b><span>a syllable can be read long or short</span></span>', val: true },
                  { html: '<span class="dr-opt"><b>Fixed</b><span>always the same long–short pattern</span></span>', val: false }];
    return {
      type: 'flexfixed', source: 'handbook',
      playSeq: null,
      promptHTML: `<div class="dr-word ${cs === 'ur' ? 'urdu' : (cs === 'hi' ? 'deva' : '')}">${drEsc(wordDisp)}</div>` +
        (item.mean ? `<p class="dr-mean">${drEsc(item.mean.replace(/^"|"$/g, ''))}</p>` : '') + `<p class="dr-ask">Can its weight bend to fit the meter?</p>`,
      answerSeqs: pats.slice(0, 3),
      choices: opts,
      correctIndex: opts.findIndex(o => o.val === flexible),
      reason: flexible ? (pats.length > 1 ? 'Flexible — these are its readings:' : 'Flexible — the rose syllable can be read long or short:') : 'Fixed — always this pattern:'
    };
  }
  return null;
}

function drGenNoteType(sources, matcher) {
  for (let tries = 0; tries < 20; tries++) {
    const s = drSample(sources);
    if (!s) continue;
    let exp;
    try { exp = Scan.explain(s.res, s.fit); } catch (e) { continue; }
    const withNotes = drNoteSegments(s.res, exp);
    const hit = withNotes.find(w => matcher(w.note));
    if (!hit) continue;
    const correct = hit.seg.syl.map(x => x.resolved);
    if (!correct.length) continue;
    const distractors = drDistractors(correct, 2);
    const choices = drShuffle([correct, ...distractors]);
    const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
    const phraseDisp = cs === 'ur' ? hit.phrase : (typeof translitText === 'function' ? translitText(hit.phrase, cs) : hit.phrase);
    return {
      type: 'note', source: s.source,
      playSeq: null, revealSyl: hit.seg.syl,
      promptHTML: `<div class="dr-word ${cs === 'ur' ? 'urdu' : (cs === 'hi' ? 'deva' : '')}">${drEsc(phraseDisp)}</div><p class="dr-ask">How is this read in the line?</p>`,
      choices: choices.map(c => ({ html: drPatHTML(c), seq: c })),
      correctIndex: choices.findIndex(c => c === correct),
      answerSeqs: [correct],
      reason: drCapFirst(hit.note) + '.'
    };
  }
  return null;
}

/* ---------- METER question generators ---------- */
function drFamText(f) {
  const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
  const g = f.gz && f.gz[0];
  const verse = g ? ((typeof getLineDisplay === 'function') ? getLineDisplay(g, cs) : (g[cs] || g.ur)) : '';
  return verse || f.pattern || String(f.id);
}

function drGenBahr(sources) {
  if (typeof FAMS === 'undefined' || typeof famOfMeter === 'undefined') return null;
  for (let tries = 0; tries < 20; tries++) {
    const s = drSample(sources);
    if (!s) continue;
    const fam = famOfMeter[s.fit.meter.id] || famOfMeter[String(s.fit.meter.id)];
    if (!fam) continue;
    const pool = FAMS.filter(f => !f.hindi && f.id !== fam.id);
    if (pool.length < 2) continue;
    const opts = drShuffle([fam, ...drShuffle(pool).slice(0, 3)]).slice(0, Math.min(4, pool.length + 1));
    let exp; try { exp = Scan.explain(s.res, s.fit); } catch (e) { continue; }
    return {
      type: 'bahr', source: s.source,
      playSeq: exp.syl.map(x => x.resolved),
      promptHTML: `<p class="dim small">Listen, then name the bahr.</p>`,
      choices: opts.map(f => ({ html: `<span class="dr-verse ${(typeof currentScript !== 'undefined' && currentScript === 'ur') ? 'urdu' : ''}">${drEsc(drFamText(f))}</span>`, fam: f })),
      correctIndex: opts.findIndex(f => f.id === fam.id),
      reason: `Same bahr as “${drEsc(drFamText(fam))}”.`
    };
  }
  return null;
}

function drGenGhazal(sources) {
  const pool = [];
  sources.forEach(src => drCorpusFor(src).forEach(item => { if (item.lines && item.lines.length) pool.push({ src, item }); }));
  if (pool.length < 3) return null;
  for (let tries = 0; tries < 20; tries++) {
    const s = drSample(sources);
    if (!s) continue;
    // distractors must be in a different meter, or the pattern alone can't decide the answer
    const mid = String(s.fit.meter.id);
    const metersOf = it => { const m = it.meters || it.m || it.meter; return (Array.isArray(m) ? m : [m]).map(String); };
    const distractors = drShuffle(pool.filter(p => !(p.item === s.item && p.src === s.source) && !metersOf(p.item).includes(mid))).slice(0, 2);
    if (distractors.length < 2) continue;
    let exp; try { exp = Scan.explain(s.res, s.fit); } catch (e) { continue; }
    const optsRaw = drShuffle([
      { item: s.item, src: s.source, line: s.line },
      ...distractors.map(d => ({ item: d.item, src: d.src, line: drPick(d.item.lines) }))
    ]);
    const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
    const isRtl = cs === 'ur';
    return {
      type: 'ghazal', source: s.source,
      playSeq: exp.syl.map(x => x.resolved),
      promptHTML: `<p class="dim small">Only the pattern plays. Which verse rides on it?</p>`,
      choices: optsRaw.map(o => {
        const txt = o.line[cs] || o.line.ur;
        return {
          html: `<span class="dr-verse ${isRtl ? 'urdu' : (cs === 'hi' ? 'deva' : '')}">${drEsc(txt)}</span>` +
                `<span class="tiny faint dr-choice-meta"> — ${drEsc(o.item.poet || drLabelForSource(o.src))}</span>`,
          match: o
        };
      }),
      correctIndex: optsRaw.findIndex(o => o.item === s.item && o.src === s.source),
      reason: `“${drEsc(s.line[cs] || s.line.ur)}” — ${drEsc(s.item.poet || drLabelForSource(s.source))}.`
    };
  }
  return null;
}

function drGenLimping(sources) {
  for (let tries = 0; tries < 15; tries++) {
    const s = drSample(sources);
    if (!s) continue;
    let exp; try { exp = Scan.explain(s.res, s.fit); } catch (e) { continue; }
    const base = exp.syl.map(x => x.resolved);
    if (base.length < 4) continue;
    let seq, inBahr, why;
    if (Math.random() < 0.5) { seq = base.slice(); inBahr = true; why = 'it is in true bahr'; }
    else {
      let got = null, reason = '';
      for (let k = 0; k < 20 && !got; k++) {
        const t = base.slice();
        const idxs = t.map((v, i) => i).filter(i => t[i] !== 'c');
        if (!idxs.length) break;
        const i = drPick(idxs), mode = Math.floor(Math.random() * 3);
        if (mode === 0 && t.length > 3) { t.splice(i, 1); reason = 'a syllable was dropped'; }
        else if (mode === 1) { t.splice(i, 0, Math.random() < 0.5 ? 'l' : 's'); reason = 'a syllable was added'; }
        else { t[i] = t[i] === 'l' ? 's' : (t[i] === 's' ? 'l' : t[i]); reason = 'a long and a short were swapped'; }
        const clean = t.filter(x => x !== 'c');
        if (!Scan.matchWeights(clean).length) got = t;
      }
      if (!got) continue;
      seq = got; inBahr = false; why = reason;
    }
    return {
      type: 'limping', source: s.source,
      playSeq: seq,
      promptHTML: `<p class="dim small">A line is sung. Judge by ear: in the bahr, or limping?</p>`,
      choices: [{ html: 'In ✓', val: true }, { html: 'Limping ✗', val: false }],
      correctIndex: inBahr ? 0 : 1,
      reason: inBahr ? 'In the true bahr.' : (why + '.')
    };
  }
  return null;
}

function drGenFoot(sources) {
  for (let tries = 0; tries < 15; tries++) {
    const s = drSample(sources);
    if (!s) continue;
    let exp; try { exp = Scan.explain(s.res, s.fit); } catch (e) { continue; }
    const feet = (exp.feet || []).filter(Boolean);
    if (feet.length < 2) continue;
    const fi = Math.floor(Math.random() * feet.length);
    const foot = feet[fi];
    const idxs = foot.idx.filter(i => !exp.syl[i].cheat);
    if (!idxs.length) continue;
    const seq = exp.syl.map(x => x.resolved);
    const i = drPick(idxs), orig = seq[i];
    seq[i] = orig === 'l' ? 's' : (orig === 's' ? 'l' : (Math.random() < 0.5 ? 'l' : 's'));
    const label = foot.name ? `Foot ${fi + 1} (${foot.name})` : `Foot ${fi + 1}`;
    return {
      type: 'foot', source: s.source,
      playSeq: seq,
      promptHTML: `<p class="dim small">One foot has changed. Which one?</p>`,
      choices: feet.map((F, k) => ({ html: F.name ? `Foot ${k + 1} <span class="dim tiny">(${drEsc(F.name)})</span>` : `Foot ${k + 1}`, idx: k })),
      correctIndex: fi,
      reason: `${label} — a ${orig === 'l' ? 'long became short' : (orig === 's' ? 'short became long' : 'syllable changed')}.`
    };
  }
  return null;
}

/* ---------- dispatcher ---------- */
function drGenerate(tab) {
  const sources = drActiveSources(tab), types = drActiveTypes(tab);
  if (!types.length || !sources.length) return null;
  for (let attempt = 0; attempt < 12; attempt++) {
    const type = drPick(types);
    let q = null;
    if (tab === 'weight') {
      if (type === 'weigh') q = drGenWeigh();
      else if (type === 'flexfixed') q = drGenFlexFixed();
      else if (type === 'izafat') q = drGenNoteType(sources, n => /iẓāfat/i.test(n));
      else if (type === 'grafting') q = drGenNoteType(sources, n => /grafting/i.test(n));
      else if (type === 'ojoin') q = drGenNoteType(sources, n => /^o joins/i.test(n));
    } else {
      if (type === 'bahr') q = drGenBahr(sources);
      else if (type === 'limping') q = drGenLimping(sources);
      else if (type === 'foot') q = drGenFoot(sources);
      else if (type === 'ghazal') q = drGenGhazal(sources);
    }
    if (q) {
      q.kind = type;
      const t = (DR_TYPES[tab] || []).find(x => x.key === type);
      q.label = DR_QUESTION[type] || (t ? t.label : '');
      return q;
    }
  }
  return null;
}
/* the question each type asks, shown as the card's heading */
var DR_QUESTION = {
  weigh: 'Weigh the word', flexfixed: 'Flexible or fixed?', izafat: 'Iẓāfat — how is it read?',
  grafting: 'Grafting — how is it read?', ojoin: "'O' joining — how is it read?",
  bahr: 'Which bahr is this?', limping: 'In the bahr, or limping?', foot: 'Which foot changed?', ghazal: 'Which verse rides on this?'
};
/* a weight pattern as the same coloured bars used everywhere else */
function drPatHTML(seq) { return `<span class="dr-pat">${(typeof strip === 'function') ? strip(seq) : drPatText(seq)}</span>`; }

/* ---------- mount / render / interact ---------- */
function drDefaultState() { return { types: new Set(['all']), sources: new Set(['all']), correct: 0, attempted: 0, current: null }; }

function drShellHTML(tab) {
  return `<div class="dr-root">
    <div class="dr-filters">
      <div class="dr-filter-row"><span class="eyebrow">Question types</span><div class="dr-chips" data-kind="type" data-tab="${tab}"></div></div>
      <div class="dr-filter-row"><span class="eyebrow">Source</span><div class="dr-chips" data-kind="source" data-tab="${tab}"></div></div>
    </div>
    <div class="card dr-card">
      <div class="dr-card-head">
        <span class="dr-qlabel" id="dr-${tab}-qlabel"></span>
        <span class="dr-head-right"><span class="eyebrow dr-tag" id="dr-${tab}-tag"></span><span class="mono tiny dr-score" id="dr-${tab}-score">0 / 0</span></span>
      </div>
      ${(typeof legendHTML === 'function') ? legendHTML('dr-legend') : ''}
      <div class="dr-prompt" id="dr-${tab}-prompt"></div>
      <div class="dr-strip" id="dr-${tab}-strip"></div>
      <div class="dr-choices" id="dr-${tab}-choices"></div>
      <div class="fb dr-fb" id="dr-${tab}-fb"></div>
    </div>
  </div>`;
}

function drChipsHTML(tab, kind, items) {
  const state = DR[tab] || drDefaultState();
  const sel = kind === 'type' ? state.types : state.sources;
  const allOn = sel.has('all');
  let h = `<button type="button" class="chipbtn ${allOn ? 'on' : ''}" onclick="drFilterClick('${tab}','${kind}','all')">All</button>`;
  h += items.map(it => `<button type="button" class="chipbtn ${!allOn && sel.has(it.key) ? 'on' : ''}" onclick="drFilterClick('${tab}','${kind}','${it.key}')">${drEsc(it.label)}</button>`).join('');
  return h;
}
function drRenderFilterChips(tab) {
  const panel = $(tab === 'weight' ? 'weightPanelDrill' : 'meterPanelDrill');
  if (!panel) return;
  const typeHost = panel.querySelector('.dr-chips[data-kind="type"]');
  const srcHost = panel.querySelector('.dr-chips[data-kind="source"]');
  if (typeHost) typeHost.innerHTML = drChipsHTML(tab, 'type', DR_TYPES[tab]);
  if (srcHost) srcHost.innerHTML = drChipsHTML(tab, 'source', DR_SOURCES);
}
function drFilterClick(tab, kind, key) {
  if (!DR[tab]) DR[tab] = drDefaultState();
  const sel = kind === 'type' ? DR[tab].types : DR[tab].sources;
  if (key === 'all') { sel.clear(); sel.add('all'); }
  else {
    sel.delete('all');
    if (sel.has(key)) sel.delete(key); else sel.add(key);
    if (!sel.size) sel.add('all');
  }
  drRenderFilterChips(tab);
  drNext(tab);
}
window.drFilterClick = drFilterClick;

function drRenderQuestion(tab) {
  const st = DR[tab]; if (!st) return;
  const q = st.current;
  const tagEl = $('dr-' + tab + '-tag'), promptEl = $('dr-' + tab + '-prompt'), stripEl = $('dr-' + tab + '-strip'),
        choicesEl = $('dr-' + tab + '-choices'), fbEl = $('dr-' + tab + '-fb'), scoreEl = $('dr-' + tab + '-score');
  if (scoreEl) scoreEl.textContent = st.correct + ' / ' + st.attempted;
  if (!q) {
    if (tagEl) tagEl.textContent = '';
    if (promptEl) promptEl.innerHTML = '<p class="dim small">No questions available for this filter yet — try a different source or type.</p>';
    if (stripEl) stripEl.innerHTML = '';
    if (choicesEl) choicesEl.innerHTML = '';
    if (fbEl) { fbEl.innerHTML = ''; fbEl.className = 'fb dr-fb'; }
    return;
  }
  if (tagEl) tagEl.textContent = drLabelForSource(q.source);
  const qlEl = $('dr-' + tab + '-qlabel'); if (qlEl) qlEl.textContent = q.label || '';
  if (promptEl) promptEl.innerHTML = (q.playSeq ? `<button type="button" class="play dr-play" aria-label="Listen" data-label="Listen" onclick="drPlayToggle('${tab}',this)">▶︎</button>` : '') + `<div class="dr-stage">${q.promptHTML || ''}</div>`;
  if (stripEl) stripEl.innerHTML = q.playSeq ? strip(q.answered ? q.playSeq : q.playSeq.map(() => 'c')) : '';
  if (choicesEl) {
    choicesEl.innerHTML = q.choices.map((c, i) => `<button type="button" class="dr-choice" data-idx="${i}" ${q.answered ? 'disabled' : ''} onclick="drAnswer('${tab}',${i})">${c.html}</button>`).join('');
    if (q.answered) {
      const btns = [...choicesEl.querySelectorAll('.dr-choice')];
      btns.forEach((b, i) => {
        if (i === q.correctIndex) b.classList.add('ans-ok');
        if (i === q.chosenIndex && i !== q.correctIndex) b.classList.add('ans-no');
      });
    }
  }
  if (fbEl) {
    if (q.answered) {
      const ok = q.chosenIndex === q.correctIndex;
      if (q.revealSyl && !q.revealHTML && typeof chipsHTML === 'function') {
        q.revealHTML = `<div class="chips dr-reveal">${chipsHTML(q.revealSyl, null, null)}</div>`;
      }
      fbEl.className = 'fb dr-fb ' + (ok ? 'ok' : 'no');
      const ans = (q.answerSeqs || []).map((sq, k) => `<div class="dr-answer"><button type="button" class="play sm dr-ans-play" aria-label="Hear it" data-label="Hear it" onclick="drAnswerPlay('${tab}',${k},this)">▶︎</button><span class="dr-ans-strip" id="dr-${tab}-ans-${k}">${drPatHTML(sq)}</span></div>`).join('');
      fbEl.innerHTML = `<div class="fb-text">${ok ? '✓ Right' : '✗ Not quite'} — ${q.reason}</div>` +
        ans + (q.revealHTML || '') +
        `<button type="button" class="btn gold sm fb-next-btn" id="dr-${tab}-next" onclick="drNext('${tab}')">Next ▸</button>`;
    } else {
      fbEl.className = 'fb dr-fb'; fbEl.innerHTML = '';
    }
  }
}

function drAnswer(tab, idx) {
  const st = DR[tab], q = st && st.current;
  if (!q || q.answered) return;
  q.answered = true; q.chosenIndex = idx;
  st.attempted++;
  if (idx === q.correctIndex) st.correct++;
  drRenderQuestion(tab);
  const nb = $('dr-' + tab + '-next'); if (nb) nb.focus();
  // hear the right answer: its bars light up as it plays (meter questions replay what they played)
  const first = typeof document !== 'undefined' && document.querySelector ? document.querySelector('#dr-' + tab + '-fb .dr-ans-play') : null;
  if (first) drAnswerPlay(tab, 0, first);
  else if (q.playSeq) { const pb = document.querySelector && document.querySelector('#dr-' + tab + '-prompt .dr-play'); if (pb) drPlayToggle(tab, pb); }
}
window.drAnswer = drAnswer;

function drAnswerPlay(tab, k, btn) {
  const q = DR[tab] && DR[tab].current; if (!q || !q.answerSeqs || !q.answerSeqs[k]) return;
  const host = $('dr-' + tab + '-ans-' + k);
  if (typeof pbTogglePattern === 'function') pbTogglePattern('drill-ans:' + tab + ':' + k, btn, drRawFromSeq(q.answerSeqs[k]), host ? [...host.querySelectorAll('.blk')] : null);
}
window.drAnswerPlay = drAnswerPlay;

function drNext(tab) {
  if (!DR[tab]) DR[tab] = drDefaultState();
  DR[tab].current = drGenerate(tab);
  drRenderQuestion(tab);
}
window.drNext = drNext;

/* pattern-only playback. Prefers pbTogglePattern(key, btn, raw, blkNodes) — the
   PB-integrated wrapper the Player agent is asked to add in 15-audio.js (G1) —
   and falls back to a plain play()/stopAll() toggle otherwise (play() itself
   still calls pbDetach() so it correctly stops any other PB-driven playback). */
function drPlayToggle(tab, btn) {
  const st = DR[tab], q = st && st.current;
  if (!q || !q.playSeq) return;
  const host = $('dr-' + tab + '-strip');
  if (typeof pbTogglePattern === 'function') {
    pbTogglePattern('drill:' + tab, btn, drRawFromSeq(q.playSeq), host ? [...host.querySelectorAll('.blk')] : null);
    return;
  }
  if (typeof play !== 'function') return;
  if (btn.classList.contains('playing')) {
    if (typeof stopAll === 'function') stopAll();
    btn.classList.remove('playing'); btn.textContent = '▶︎';
    return;
  }
  if (typeof document !== 'undefined' && typeof document.querySelectorAll === 'function') {
    document.querySelectorAll('.dr-play.playing').forEach(b => { b.classList.remove('playing'); b.textContent = '▶︎'; });
  }
  btn.classList.add('playing'); btn.textContent = '❚❚';
  const nodes = host ? [...host.querySelectorAll('.blk')] : [];
  play(q.playSeq, {
    onStep: nodes.length ? litter(nodes) : undefined,
    onEnd: () => { btn.classList.remove('playing'); btn.textContent = '▶︎'; }
  });
}
window.drPlayToggle = drPlayToggle;

/* All app scripts run as one block, and the router can call mountDrill() (hoisted) on a
   direct drill URL before this file's data above is initialised. Defer until it is. */
var drReady;   // undefined until the end of this file runs
function mountDrill(tab) {
  if (!drReady) { const q = (window.__drPending = window.__drPending || []); if (q.indexOf(tab) === -1) q.push(tab); return; }
  const panel = $(tab === 'weight' ? 'weightPanelDrill' : 'meterPanelDrill');
  if (!panel) return;
  let root = panel.querySelector('.dr-root');
  if (!root) {
    panel.innerHTML = drShellHTML(tab);
    drRenderFilterChips(tab);
  }
  if (!DR[tab]) { DR[tab] = drDefaultState(); drNext(tab); }
  else if (!DR[tab].current) drNext(tab);
  else drRenderQuestion(tab);
}
window.mountDrill = mountDrill;

/* keyboard: 1-4 answer the current question, Enter = Next */
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
  document.addEventListener('keydown', ev => {
    if (ev.defaultPrevented) return;
    const tgt = ev.target;
    if (tgt && tgt.tagName && /^(INPUT|TEXTAREA|SELECT)$/.test(tgt.tagName)) return;
    ['weight', 'meter'].forEach(tab => {
      const panel = $(tab === 'weight' ? 'weightPanelDrill' : 'meterPanelDrill');
      const st = DR[tab];
      if (!panel || panel.style.display === 'none' || !st || !st.current) return;
      const q = st.current;
      if (!q.answered && /^[1-4]$/.test(ev.key)) {
        const idx = +ev.key - 1;
        if (idx < q.choices.length) { drAnswer(tab, idx); ev.preventDefault(); }
      } else if (q.answered && ev.key === 'Enter') {
        drNext(tab); ev.preventDefault();
      }
    });
  });
}

/* self-mount fallback: this file loads after 21-learn.js's initial
   handleRoute() call (manifest order), so if the page loads directly on a
   drill route, mountDrill didn't exist yet the first time 02-store.js's
   showWeightSubtab/showMeterSubtab tried to call it. Pick up here. */
drReady = true;
(window.__drPending || []).splice(0).forEach(tab => mountDrill(tab));
['weight', 'meter'].forEach(tab => {
  const panel = $(tab === 'weight' ? 'weightPanelDrill' : 'meterPanelDrill');
  if (panel && panel.style && panel.style.display === 'block') mountDrill(tab);
});
