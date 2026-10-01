/* ================= EAR & METER TAB (§5.5, §6.8) ================= */
let earCur = store.get('earCur', 'dilenadan');

function bestGhazalLinkForMeter(mId) {
  if (!mId) return { link: '#/ghazals', count: 0, bestColl: 'ghalib' };
  const idStr = String(mId);
  let hb = 0, gh = 0, mr = 0, ot = 0;
  if (typeof EXERCISES_DATA !== 'undefined' && Array.isArray(EXERCISES_DATA)) {
    EXERCISES_DATA.forEach(e => {
      const em = e.meters || e.m; const match = Array.isArray(em) ? em.some(x => String(x) === idStr) : String(em) === idStr;
      if (match) hb++;
    });
  }
  if (typeof GHALIB_EXT_DATA !== 'undefined' && Array.isArray(GHALIB_EXT_DATA)) {
    GHALIB_EXT_DATA.forEach(e => {
      const match = Array.isArray(e.meters) ? e.meters.some(x => String(x) === idStr) : String(e.meter || e.m) === idStr;
      if (match) gh++;
    });
  }
  if (typeof MIR_EXT_DATA !== 'undefined' && Array.isArray(MIR_EXT_DATA)) {
    MIR_EXT_DATA.forEach(e => {
      const match = Array.isArray(e.meters) ? e.meters.some(x => String(x) === idStr) : String(e.meter || e.m) === idStr;
      if (match) mr++;
    });
  }
  let bestPoet = { key: null, n: 0 };
  poetCollections().forEach(([key, items]) => {
    const n = items.filter(e => Array.isArray(e.meters) && e.meters.some(x => String(x) === idStr)).length;
    ot += n;
    if (n > bestPoet.n) bestPoet = { key, n };
  });
  const total = hb + gh + mr + ot;
  let bestColl = 'ghalib';
  let bestCount = gh;
  if (bestPoet.n > bestCount) { bestColl = bestPoet.key; bestCount = bestPoet.n; }
  if (mr > bestCount) {
    bestColl = 'mir';
    bestCount = mr;
  }
  if (hb > bestCount) {
    bestColl = 'handbook';
    bestCount = hb;
  }
  return {
    link: `#/ghazals/${bestColl}?meter=${mId}`,
    count: total,
    bestColl
  };
}

/* Two groups: counting bahrs repeat one cell (f.cell is set); shape bahrs are a
   fixed contour with no clean repeat (everything else). §Round3 "Meter › Learn". */
/* which handbook rule each family's allowance note (and the meter list itself) rests on */
const FAM_RULES = { dilenadan: 'M6.1-anceps', hazaron: 'M6.1-cheat-final', yihnathi: 'M6.1-cheat-caesura', nuktachin: 'M6.1-anceps', harek: 'M6.1-pairs', milne: 'M6.1-cheat-caesura', ulti: 'M6.2-hindi-length' };
const FAM_GROUPS = [
  { key: 'counting', title: 'Counting bahrs', explainer: '<b class="t L">● Counting bahr</b> — one cell repeated; "3 or 4 feet" just means how many times, with the last often clipped. Count the pulses.', app: true, test: f => !!f.cell },
  { key: 'shape', title: 'Shape bahrs', explainer: '<b class="t S">◆ Shape bahr</b> — one fixed contour, no clean repeat. Don\'t dissect it; hold it as a melody.', app: true, test: f => !f.cell }
];

function famRowHTML(f) {
    const isExpanded = (f.id === earCur);
    const mId = (f.meters && f.meters.length) ? f.meters[0] : (f.hindi ? 'H' : null);
    // same header as Meter › Look up: ▶ (pattern), famous couplet, pattern + feet, name
    const cps0 = (typeof coupletsForMeter === 'function' && mId != null) ? coupletsForMeter(mId, 2) : [];
    const meterLabelHtml = (typeof renderMeterLabel === 'function') ? renderMeterLabel(mId, { size: 'sm', play: true, couplet: cps0[0] || null }) : '';
    const matchInfo = bestGhazalLinkForMeter(mId);

    let h = `<div class="fam-row card ${isExpanded ? 'expanded' : ''}" id="fam-${f.id}">`;
    h += `<div class="fam-header" onclick="toggleFamExpand('${f.id}', event)">`;
    h += `<div class="fam-label-wrap">${meterLabelHtml}</div>`;
    h += `<button class="icon-btn fam-toggle-btn" aria-label="${isExpanded ? 'Collapse' : 'Expand'}">${isExpanded ? '▴' : '▾'}</button>`;
    h += `</div>`;

    if (isExpanded) {
      h += `<div class="fam-details">`;

      // 1. Counting bahrs: the repeated cell (the full pattern + feet is already in the header)
      if (f.cell && typeof feetStrip === 'function') {
        h += `<div class="fam-section-label">The cell (${f.reps}×)</div>`;
        h += `<div class="fam-strip-wrap">${feetStrip(f.cell)}</div>`;
      }

      // 2. Famous couplets: same couplet boxes as Look up (words light up; scan behind a toggle)
      if (mId != null && typeof meterCoupletsHTML === 'function') h += meterCoupletsHTML(mId, 'fm');

      // 3. Allowance note (§5.5)
      if (f.pair) {
        h += `<div class="fam-allowance">Allowance note: ${f.pair} ${hbRef(FAM_RULES[f.id] || 'M6.1-pairs', f.hindi ? '6.2' : '6.1')}</div>`;
      }

      // 4. Variant meters in fam.meters (§5.5)
      const variants = (f.meters || []).filter(m => String(m) !== String(mId));
      if (variants.length > 0 && typeof renderMeterLabel === 'function') {
        h += `<div class="fam-variants-wrap">`;
        h += `<div class="fam-section-label">Variant meters in this family:</div>`;
        variants.forEach(vId => {
          h += renderMeterLabel(vId, { size: 'sm', play: true });
        });
        h += `</div>`;
      }

      // 5. Ghazals in this bahr link (§5.5)
      if (matchInfo.count > 0) {
        h += `<div class="fam-action-row">`;
        h += `<a href="${matchInfo.link}" class="small btn link">${matchInfo.count} ghazals in this bahr ›</a>`;
        h += `</div>`;
      }

      h += `</div>`;
    }

    h += `</div>`;
    return h;
}

/* ================= FEET LESSON (Meter › Learn, Handbook ch. 5) =================
   syllables have weight → certain weights make a foot (rukn) → certain feet make a bahr.
   Foot names, syllables and patterns come from the engine's FEET table, so the lesson can't drift from the scanner. */
const FEET_CORE = [
  { pat: '- = =',   ur: 'فعولن',   meter: 'Mutaqārib', note: 'short, long, long' },
  { pat: '= - = =', ur: 'فاعلاتن', meter: 'Ramal',     note: 'long, short, long, long' },
  { pat: '- = = =', ur: 'مفاعیلن', meter: 'Hazaj',     note: 'short, then three longs' },
  { pat: '= = - =', ur: 'مستفعلن', meter: 'Rajaz',     note: 'two longs, short, long' }
];
const FEET_DEMO_UR = 'ہزاروں خواہشیں ایسی کہ ہر خواہش پہ دم نکلے';
const HB_FEET = 'https://franpritchett.com/00ghalib/meterbk/05_feet.html';

function feetLessonHTML() {
  const cards = FEET_CORE.map((f, i) => {
    const fp = Scan.patternFeet(f.pat)[0];
    const cells = fp.ro.map((syl, k) => { const t = fp.toks[k]; return `<span class="sc ${t}"><span class="sc-t">${syl}</span><span class="sc-w">${t === 'l' ? '= dum' : '&ndash; da'}</span></span>`; }).join('');
    return `<div class="foot-card" id="footCard${i}">
      <div class="foot-card-head">
        <span class="fn foot-card-ro">${fp.ro.join('·')}</span>
        <span class="foot-card-tag tiny">&#9733; sālim</span>
      </div>
      <div class="urdu ur-always foot-card-ur">${f.ur}</div>
      <div class="tiny dim">Base foot of Baḥr-e ${f.meter} &middot; ${fp.toks.reduce((n, t) => n + (t === 'l' ? 2 : 1), 0)} mātrās</div>
      <div class="sc-row">${cells}</div>
      <p class="small foot-card-pat"><b>Pattern:</b> ${fp.toks.map(t => `<span class="pg ${t}">${t === 'l' ? '=' : '&ndash;'}</span>`).join(' ')} &mdash; ${f.note}.</p>
      <button class="btn link foot-card-play" aria-label="Listen to ${fp.ro.join('')}" onclick="feetPlay(${i},this)">&#9654;&#xFE0E; Listen</button>
    </div>`;
  }).join('');
  return `
  <h2 class="section-title">Syllables, feet, bahr</h2>
  <ol class="feet-ladder small">
    <li><b>A word has syllables.</b> Each one has a weight: long (<span class="pg l">=</span>) or short (<span class="pg s">&ndash;</span>).</li>
    <li><b>Certain weights add up to a foot</b> (<i>rukn</i>, plural <i>arkān</i>). A foot is a short fixed pattern, like a bar of music.</li>
    <li><b>Certain feet make a bahr.</b> A line (miṣraʿ) is two to four feet, and the bahr is the feet it repeats.</li>
  </ol>
  <h3 class="group-title">Feet have names that sound like themselves</h3>
  <p class="small dim group-lead">Classical prosodists named each foot with a coined word built on the Arabic root <i>f-ʿ-l</i> (&ldquo;to do&rdquo;), and each name scans as the foot it names. Say <i>fa&middot;ʿū&middot;lun</i>: <i>fa</i> is one letter and short, <i>ʿū</i> and <i>lun</i> are two letters each and long. That is <span class="pg s">&ndash;</span> <span class="pg l">=</span> <span class="pg l">=</span>. The names are called <i>afāʿīl</i>.</p>
  <p class="small dim">Four feet you will meet again and again. Press <b>Listen</b> and each syllable lights as it is sung.</p>
  <div class="foot-grid">${cards}</div>
  <h3 class="group-title">Sālim and muzāḥaf feet</h3>
  <p class="small dim group-lead">The <i>afāʿīl</i> are of two kinds: a small number of original or <i>sālim</i> (sound) ones, namely mafāʿīlun, fāʿilātun, mustafʿilun, fāʿilun, faʿūlun and mutafāʿilun, and a large number of variant or <i>muzāḥaf</i> forms derived from these by shortening, dropping or joining a syllable. When a line of poetry can be divided into feet in more than one way, the best division is considered to be the one that relies more on original afāʿīl and less on variants. Some muzāḥaf feet share a name with another, as <i>faʿlun</i> (= =) and <i>faʿilun</i> (&ndash; &ndash; =), so the meter decides which one a line uses.</p>
  <h3 class="group-title">Feet run across words</h3>
  <p class="small dim group-lead">A foot doesn&rsquo;t stop where a word does. Here is one line cut into its feet; play it and watch each foot light up.</p>
  <div class="home-example">
    <div class="home-example-head">
      <span class="home-example-verse urdu" id="feetDemoVerse"></span>
      <button class="play" id="feetDemoPlay" aria-label="Play" onclick="feetDemoPlay(this)">▶︎</button>
    </div>
    <div id="feetDemoScan"></div>
  </div>
  <div class="go-deeper card small"><span class="go-deeper-tag mono tiny">Go deeper</span>
    <p class="go-deeper-links"><a class="hb-ref" data-rule="M6.1-pairs" href="${HB_FEET}" target="_blank" rel="noopener">Pritchett, ch. 5 &mdash; Metrical Feet &#8599;</a></p></div>`;
}
function renderFeetLesson() {
  const host = $('feetLesson');
  if (!host || typeof Scan === 'undefined' || typeof strip !== 'function') return;
  host.innerHTML = feetLessonHTML();
  const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
  const v = $('feetDemoVerse');
  if (v) {
    v.className = 'home-example-verse ' + (cs === 'ur' ? 'urdu' : (cs === 'hi' ? 'deva' : 'mono'));
    if (typeof v.setAttribute === 'function') v.setAttribute('dir', cs === 'ur' ? 'rtl' : 'ltr');
    v.innerHTML = (typeof getLineDisplay === 'function') ? getLineDisplay(FEET_DEMO_UR, cs) : FEET_DEMO_UR;
  }
  if (typeof renderLineScan === 'function') renderLineScan(FEET_DEMO_UR, $('feetDemoScan'));
}
function feetPlay(i, btn) {
  const f = FEET_CORE[i]; if (!f || typeof pbTogglePattern !== 'function') return;
  const card = btn.closest('.foot-card');
  pbTogglePattern('foot:' + i, btn, f.pat, card ? [...card.querySelectorAll('.sc')] : null);
}
function feetDemoPlay(btn) {
  const host = $('feetDemoScan');
  if (!host || typeof pbToggle !== 'function') return;
  pbToggle('feet:demo', btn, () => {
    const r = Scan.scanLine(FEET_DEMO_UR), fit = r.fits[0];
    if (!fit) return null;
    return [Object.assign({ e: Scan.explain(r, fit) }, pbNodes(host))];
  });
}
window.renderFeetLesson = renderFeetLesson; window.feetPlay = feetPlay; window.feetDemoPlay = feetDemoPlay;

function renderEarFams() {
  const host = $('earFams');
  if (!host) return;
  const legendHost = $('meterLearnLegend');
  if (legendHost && typeof legendHTML === 'function') legendHost.innerHTML = legendHTML('legend-sticky');

  host.innerHTML = FAM_GROUPS.map(grp => {
    const fams = FAMS.filter(grp.test);
    if (!fams.length) return '';
    let h = `<h2 class="section-title fam-group-title">${grp.title}</h2>`;
    h += `<p class="small dim fam-group-explainer">${grp.explainer}</p>`;
    h += fams.map(famRowHTML).join('');
    return h;
  }).join('');
}

function toggleFamExpand(id, e) {
  if (e && e.target && e.target.closest('.play')) return;
  if (earCur === id) {
    earCur = null;
    store.set('earCur', null);
    renderEarFams();
    if (typeof setHashQuiet === 'function') setHashQuiet('/meter/buhur');
  } else {
    earCur = id;
    store.set('earCur', id);
    renderEarFams();
    if (typeof setHashQuiet === 'function') setHashQuiet('/meter/buhur?open=' + id);
  }
}

function earPick(id) {
  earCur = id;
  store.set('earCur', id);
  renderEarFams();
}

function famPulse(f) {
  return sylls(Scan.parseRaw(f.pattern)).map(t => t === 'x' ? 'l' : t);
}

function earSing(gi, which, btn) {
  const f = FAMS.find(x => x.id === earCur);
  if (!f || !f.gz || !f.gz[gi]) return;
  const g = f.gz[gi];
  const host = $('earSing' + gi);
  if (!host) return;
  const verseText = (which === 2 && g.ur2) ? g.ur2 : g.ur;
  if (typeof singAlong === 'function') {
    singAlong('earsing:' + f.id + ':' + gi + ':' + which, verseText, f, host, btn);
  }
}

/* ================= ADAPTIVE DRILL STATS ================= */
const stats = store.get('stats', {});
function stat(id, ok) {
  const s = stats[id] || (stats[id] = { h: 0, m: 0 });
  ok ? s.h++ : s.m++;
  store.set('stats', stats);
  renderWeak();
}

function pickFam(pool) {
  const w = pool.map(f => {
    const s = stats[f.id] || { h: 0, m: 0 };
    return 1 + 3 * (s.m / (s.h + s.m + 1));
  });
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) {
    r -= w[i];
    if (r <= 0) return pool[i];
  }
  return pool[0];
}

function renderWeak() {
  const host = $('weakCard');
  if (!host) return;
  const arr = FAMS.map(f => ({ f, s: stats[f.id] || { h: 0, m: 0 } }))
                  .filter(x => x.s.h + x.s.m > 0)
                  .sort((a, b) => (b.s.m / (b.s.h + b.s.m)) - (a.s.m / (a.s.h + a.s.m)));
  const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
  const isRtl = (cs === 'ur');

  if (!arr.length) {
    host.innerHTML = '<span class="dim tiny">Your results will show here; drills adapt toward the bahrs you miss.</span>';
    return;
  }

  let h = `<div class="small"><b>Your ear so far</b> — drills lean toward the bahrs you miss.</div>`;
  h += `<div class="weak-list">`;
  h += arr.slice(0, 5).map(x => {
    const disp = (typeof getLineDisplay === 'function') ? getLineDisplay(famLabel(x.f), cs) : famLabel(x.f).ur;
    return `<div class="weak-row"><span class="weak-name ${isRtl ? 'urdu' : (cs === 'hi' ? 'deva' : '')}">${disp}</span><span class="mono tiny dim">${x.s.h}✓ ${x.s.m}✗</span></div>`;
  }).join('');
  h += `</div>`;
  host.innerHTML = h;
}

/* ================= DRILL 1: IN OR LIMPING (§6.8) ================= */
let iom = null, iomS = 0, iomT = 0;
function iomNew() {
  const pool = FAMS.filter(x => !x.hindi);
  const f = pickFam(pool);
  const base = famPulse(f);
  if (Math.random() < 0.5) {
    iom = { seq: base, inM: true, f, why: 'the line is in true bahr' };
  } else {
    let got = null, why = '';
    for (let k = 0; k < 20 && !got; k++) {
      const t = base.slice(), m = Math.floor(Math.random() * 3), i = Math.floor(Math.random() * t.length);
      if (m === 0) { t.splice(i, 1); why = 'a syllable was dropped'; }
      else if (m === 1) { t.splice(i, 0, Math.random() < .5 ? 'l' : 's'); why = 'a syllable was added'; }
      else { t[i] = t[i] === 'l' ? 's' : 'l'; why = 'a long and a short were swapped'; }
      let run = 0, three = false;
      t.forEach(x => { run = (x === 's') ? run + 1 : 0; if (run >= 3) three = true; });
      if (!Scan.matchWeights(t).length || three) got = t;
    }
    iom = got ? { seq: got, inM: false, f, why } : { seq: base, inM: true, f, why: 'the line is in true bahr' };
  }
  if ($('iomStrip')) $('iomStrip').innerHTML = '';
  if ($('iomFb')) { $('iomFb').innerHTML = ''; $('iomFb').className = 'fb'; }
  ['iomBtnIn', 'iomBtnLimp'].forEach(id => {
    const el = $(id);
    if (el) {
      el.disabled = false;
      el.classList.remove('ans-ok', 'ans-no');
    }
  });
}

function iomPlay() {
  if (!iom) iomNew();
  if ($('iomStrip')) $('iomStrip').innerHTML = strip(iom.seq.map(() => 'c'));
  play(iom.seq, { onStep: litter([...($('iomStrip') ? $('iomStrip').querySelectorAll('.blk') : [])]) });
}

function iomAns(g) {
  if (!iom) return;
  iomT++;
  const ok = (g === iom.inM);
  if (ok) iomS++;
  stat(iom.f.id, ok);

  ['iomBtnIn', 'iomBtnLimp'].forEach(id => {
    const el = $(id);
    if (el) el.disabled = true;
  });
  const chosenBtn = g ? $('iomBtnIn') : $('iomBtnLimp');
  if (chosenBtn) {
    chosenBtn.classList.add(ok ? 'ans-ok' : 'ans-no');
  }

  const fb = $('iomFb');
  if (fb) {
    fb.className = 'fb ' + (ok ? 'ok' : 'no');
    const reason = ok ? (iom.inM ? 'in the true meter.' : iom.why + '.') : (iom.inM ? 'it is actually in true bahr.' : iom.why + '.');
    fb.innerHTML = `<div class="fb-text">${ok ? '✓ Right' : '✗ Not quite'} — ${reason}</div><button class="btn gold sm fb-next-btn" id="iomNextBtn" onclick="iomNew()">Next ▸</button>`;
    const nb = $('iomNextBtn');
    if (nb) nb.focus();
  }
  if ($('iomStrip')) $('iomStrip').innerHTML = strip(iom.seq);
  if ($('iomScore')) $('iomScore').textContent = iomS + ' / ' + iomT;
}

/* ================= DRILL 2: WHICH GHAZAL (§6.8) ================= */
let wt = null, wtS = 0, wtT = 0;
function wtNew() {
  const pool = FAMS.filter(f => !f.hindi);
  const f = pickFam(pool);
  const others = pool.filter(x => x.id !== f.id).sort(() => Math.random() - .5).slice(0, 2);
  const opts = [f, ...others].sort(() => Math.random() - .5);
  wt = { f, opts };
  const host = $('wtChoices');
  if (host) {
    const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
    const isRtl = (cs === 'ur');
    host.innerHTML = opts.map(o => {
      const g = o.gz[Math.floor(Math.random() * o.gz.length)];
      const vText = (typeof getLineDisplay === 'function') ? getLineDisplay(g, cs) : (g[cs] || g.ur);
      return `<button class="btn ghost drill-choice-btn ${isRtl ? 'urdu-choice' : ''}" id="wtOpt_${o.id}" onclick="wtAns('${o.id}')">
        <span class="drill-choice-verse ${isRtl ? 'urdu' : (cs === 'hi' ? 'deva' : '')}">${vText}</span>
        <span class="tiny faint">${g.p}</span>
      </button>`;
    }).join('');
  }
  if ($('wtFb')) { $('wtFb').innerHTML = ''; $('wtFb').className = 'fb'; }
}

function wtPlay() {
  if (!wt) wtNew();
  if (wt && wt.f) playPat(wt.f.pattern);
}

function wtAns(id) {
  if (!wt) return;
  wtT++;
  const ok = (id === wt.f.id);
  if (ok) wtS++;
  stat(wt.f.id, ok);

  if (wt.opts) {
    wt.opts.forEach(o => {
      const btn = $('wtOpt_' + o.id);
      if (btn) btn.disabled = true;
    });
  }
  const chosen = $('wtOpt_' + id);
  if (chosen) {
    chosen.classList.add(ok ? 'ans-ok' : 'ans-no');
  }

  const fb = $('wtFb');
  if (fb) {
    fb.className = 'fb ' + (ok ? 'ok' : 'no');
    const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
    const vAns = (typeof getLineDisplay === 'function') ? getLineDisplay(famLabel(wt.f), cs) : famLabel(wt.f).ur;
    fb.innerHTML = `<div class="fb-text">${ok ? '✓ Right' : '✗ Not quite'} — Bahr was “${vAns}”.</div><button class="btn gold sm fb-next-btn" id="wtNextBtn" onclick="wtNew()">Next ▸</button>`;
    const nb = $('wtNextBtn');
    if (nb) nb.focus();
  }
  if ($('wtScore')) $('wtScore').textContent = wtS + ' / ' + wtT;
}

window.renderEarFams = renderEarFams;
window.toggleFamExpand = toggleFamExpand;
window.earPick = earPick;
window.earSing = earSing;
window.iomNew = iomNew;
window.iomPlay = iomPlay;
window.iomAns = iomAns;
window.wtNew = wtNew;
window.wtPlay = wtPlay;
window.wtAns = wtAns;
window.renderWeak = renderWeak;
window.bestGhazalLinkForMeter = bestGhazalLinkForMeter;
