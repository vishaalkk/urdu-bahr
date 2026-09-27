/* ================= STANDALONE RHYTHM TIMELINE WIDGET ================= */
/**
 * rhythmRoll.js — standalone rhythm timeline ("piano-roll") widget for Urdu meter (baḥr).
 *
 * Vanilla ES module. No dependencies, no network requests, no external fonts.
 * Renders a horizontal strip of syllable blocks — width proportional to metrical
 * duration — grouped into feet (afāʿīl) with foot names underneath, an optional
 * caesura marker, a host-driven playhead, and an optional editable / compare-to-meter
 * mode.
 *
 * Usage:
 *   import { mountRhythmRoll } from './rhythmRoll.js';
 *   const roll = mountRhythmRoll(containerEl, {
 *     syllables: [{text:'دل', weight:'l'}, {text:'کا', weight:'s'}, ...],
 *     feet: [[0,3],[4,7],[8,11],[12,15]],
 *     caesura: undefined,
 *     bpm: 76,
 *     editable: true,
 *     onChange(syllables) { ... },
 *     onPlay({syllables, feet, bpm}) { ... }   // host owns actual audio
 *   });
 *   roll.setPlayhead(1.24);      // seconds, driven by the host's audio clock
 *   roll.highlight(3);           // discrete step flash (e.g. per-note callback)
 *   roll.setTarget(['l','s','l','l', ...]);  // compare overlay, or null to clear
 *
 * See README.md in this folder for the full API and integration notes.
 */

/* ---------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------- */

// Relative duration, in abstract "units", per metrical weight. A long syllable
// (=) is twice a short one (–); a flexible syllable (x) is rendered midway and
// is itself editable into 'l' or 's'.
const WEIGHT_UNITS = { l: 2, s: 1, x: 1.5 };
const WEIGHT_LABEL = { l: 'long', s: 'short', x: 'flexible' };
const WEIGHT_GLYPH = { l: '=', s: '–', x: '×' }; // = , – , ×
const WEIGHT_CYCLE = { l: 's', s: 'x', x: 'l' };

// Pixel width of one duration unit at the default (unzoomed) scale.
const UNIT_PX = 28;
// Gap between syllable blocks within a foot, and extra gap between feet.
const BLOCK_GAP_PX = 3;
const FOOT_GAP_PX = 14;

// Classical afāʿīl (foot) names, keyed by their weight pattern (l/s only —
// a foot containing an unresolved 'x' falls back to a glyph string instead
// of a name, same as the pattern is genuinely ambiguous until resolved).
// This is standard Arabic-Persian-Urdu prosodic nomenclature, not specific
// to any one edition.
const FOOT_NAMES = {
  lll: 'mafʿūlun', llsl: 'mustafʿilun', lls: 'mafʿūl', ll: 'faʿlun',
  lsll: 'fāʿilātun', lsls: 'fāʿilāt', lsl: 'fāʿilun', lssl: 'muftaʿilun',
  ls: 'faʿl', l: 'faʿ',
  slll: 'mafāʿīlun', slls: 'mafāʿīl', sll: 'faʿūlun', slsl: 'mufāʿilun',
  sls: 'faʿūl', sl: 'faʿal',
  ssll: 'faʿilātun', sslsl: 'mutafāʿilun', ssls: 'faʿilātu', ssl: 'faʿilun',
};

let stylesInjected = false;

/* ---------------------------------------------------------------------------
 * Styles (injected once; scoped under .rhythm-roll)
 * ------------------------------------------------------------------------- */

function ensureStyles() {
  if (stylesInjected) return;
  stylesInjected = true;
  const css = `
.rhythm-roll{
  --rr-fg: var(--fg, #231c2e);
  --rr-bg: var(--bg, #F4ECDD);
  --rr-muted: var(--muted, #766d88);
  --rr-accent: var(--accent, #B27414);
  --rr-rule: var(--rule, rgba(35,28,46,.22));
  --rr-long: var(--long, #B27414);
  --rr-short: var(--short, #11836f);
  --rr-mismatch: var(--rr-mismatch-color, #b3352c);
  color: var(--rr-fg);
  background: var(--rr-bg);
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif;
  border: 1px solid var(--rr-rule);
  border-radius: 10px;
  padding: 10px 12px 12px;
  box-sizing: border-box;
  max-width: 100%;
}
.rhythm-roll *{ box-sizing: border-box; }
.rr-head{
  display: flex; align-items: center; gap: 10px; margin-bottom: 8px; flex-wrap: wrap;
}
.rr-playbtn{
  display: inline-flex; align-items: center; justify-content: center;
  width: 30px; height: 30px; border-radius: 999px; border: 1px solid var(--rr-rule);
  background: transparent; color: var(--rr-accent); cursor: pointer; font-size: 13px;
  flex: 0 0 auto; line-height: 1;
}
.rr-playbtn:hover{ background: var(--rr-rule); }
.rr-playbtn:focus-visible, .rr-block:focus-visible, .rr-clear:focus-visible{
  outline: 2px solid var(--rr-accent); outline-offset: 2px;
}
.rr-bpm{ font-size: 12px; color: var(--rr-muted); white-space: nowrap; }
.rr-compare{
  display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--rr-muted);
  border: 1px dashed var(--rr-rule); border-radius: 999px; padding: 2px 4px 2px 10px; margin-left: auto;
}
.rr-clear{
  border: none; background: transparent; color: var(--rr-muted); cursor: pointer;
  width: 18px; height: 18px; border-radius: 999px; font-size: 12px; line-height: 1;
}
.rr-clear:hover{ background: var(--rr-rule); color: var(--rr-fg); }
.rr-scroll{
  overflow-x: auto; overflow-y: hidden; -webkit-overflow-scrolling: touch;
  padding-bottom: 4px;
}
.rr-track{
  position: relative; display: inline-flex; align-items: flex-start; gap: ${FOOT_GAP_PX}px;
  min-height: 74px; padding-top: 4px;
}
.rr-foot{ display: flex; flex-direction: column; align-items: stretch; flex: 0 0 auto; }
.rr-blocks{ display: flex; gap: ${BLOCK_GAP_PX}px; align-items: flex-end; }
.rr-footname{
  margin-top: 6px; text-align: center; font-size: 11px; letter-spacing: .01em;
  color: var(--rr-muted); white-space: nowrap; font-variant-ligatures: none;
}
.rr-block{
  position: relative; height: 40px; border-radius: 6px; border: 1px solid transparent;
  display: flex; align-items: center; justify-content: center; overflow: hidden;
  font-size: 14px; padding: 0 2px; cursor: default;
  /* Theme-aware block text color: adheres to theme onGold */
  color: var(--onGold, #1a1526);
  font-family: 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif;
}
.rr-block[data-w="l"]{ background: var(--rr-long); }
.rr-block[data-w="s"]{ background: var(--rr-short); }
.rr-block[data-w="x"]{
  background: repeating-linear-gradient(45deg,
    var(--rr-long) 0 6px, var(--rr-short) 6px 12px);
}
.rhythm-roll[data-editable="true"] .rr-block{ cursor: pointer; }
.rhythm-roll[data-editable="true"] .rr-block:hover{ filter: brightness(1.08); }
.rr-block.rr-current{ box-shadow: 0 0 0 2px var(--rr-bg), 0 0 0 4px var(--rr-accent); transform: translateY(-2px); }
.rr-block.rr-mismatch{ border-color: var(--rr-mismatch); box-shadow: inset 0 0 0 2px var(--rr-mismatch); }
.rr-caesura{
  position: absolute; top: 4px; bottom: 22px; width: 0; border-left: 1.5px dashed var(--rr-muted);
  display: flex; align-items: flex-start; justify-content: center; pointer-events: none;
}
.rr-caesura::after{
  content: '//'; position: absolute; top: -16px; left: 50%; transform: translateX(-50%);
  font-size: 11px; color: var(--rr-muted); background: var(--rr-bg); padding: 0 2px;
}
.rr-playhead{
  position: absolute; top: 0; bottom: 22px; width: 2px; background: var(--rr-accent);
  pointer-events: none; transform: translateX(-1px); transition: transform .05s linear;
  opacity: 0;
}
.rr-playhead.rr-on{ opacity: .9; }
.rr-sr-only{
  position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0);
}
@media (max-width: 480px){
  .rr-block{ height: 34px; font-size: 12px; }
  .rr-footname{ font-size: 10px; }
}
`;
  const tag = document.createElement('style');
  tag.id = 'rhythm-roll-styles';
  tag.textContent = css;
  document.head.appendChild(tag);
}

/* ---------------------------------------------------------------------------
 * Small helpers
 * ------------------------------------------------------------------------- */

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function footPatternKey(syllables, range) {
  let key = '';
  for (let i = range[0]; i <= range[1]; i++) {
    const w = syllables[i].weight;
    if (w !== 'l' && w !== 's') return null; // unresolved 'x' -> no name lookup
    key += w;
  }
  return key;
}

function footGlyphs(syllables, range) {
  let out = '';
  for (let i = range[0]; i <= range[1]; i++) out += WEIGHT_GLYPH[syllables[i].weight] || '?';
  return out;
}

/* ---------------------------------------------------------------------------
 * mountRhythmRoll
 * ------------------------------------------------------------------------- */

function mountRhythmRoll(container, opts) {
  if (!container) throw new Error('mountRhythmRoll: container is required');
  opts = opts || {};
  ensureStyles();

  const state = {
    syllables: (opts.syllables || []).map((s) => ({ text: s.text, weight: s.weight })),
    feet: (opts.feet && opts.feet.length ? opts.feet : [[0, Math.max(0, (opts.syllables || []).length - 1)]]),
    caesura: (typeof opts.caesura === 'number') ? opts.caesura : null,
    bpm: opts.bpm || 80,
    editable: !!opts.editable,
    onChange: typeof opts.onChange === 'function' ? opts.onChange : null,
    onPlay: typeof opts.onPlay === 'function' ? opts.onPlay : null,
    target: null,       // array of 'l'|'s'|'x' aligned to syllables, or null
    focusIndex: 0,
    currentIndex: null,
    timeline: [],        // [{start,end,left,width}] in seconds / px, built after each render
  };

  const root = document.createElement('div');
  root.className = 'rhythm-roll';
  root.setAttribute('role', 'group');
  container.innerHTML = '';
  container.appendChild(root);

  let blockEls = [];
  let playheadEl = null;
  let trackEl = null;
  let scrollEl = null;

  function totalUnits() {
    return state.syllables.reduce((a, s) => a + (WEIGHT_UNITS[s.weight] || 1), 0);
  }

  function secPerUnit() {
    // 1 unit == a short syllable's beat-half; a long (2 units) == one quarter
    // note at `bpm`. So: secondsPerUnit = (60 / bpm) / 2.
    return 30 / Math.max(1, state.bpm);
  }

  function render() {
    const priorScroll = scrollEl ? scrollEl.scrollLeft : 0;
    const priorFocus = document.activeElement && blockEls.indexOf(document.activeElement);
    const hadFocus = priorFocus != null && priorFocus >= 0;

    root.setAttribute('data-editable', String(state.editable));
    root.setAttribute('aria-label', `Rhythm roll, ${state.syllables.length} syllables${state.bpm ? `, ${state.bpm} beats per minute` : ''}`);
    root.innerHTML = '';

    // -- header: play button + bpm + compare badge --
    const head = document.createElement('div');
    head.className = 'rr-head';

    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.className = 'rr-playbtn';
    playBtn.setAttribute('aria-label', 'Play rhythm');
    playBtn.textContent = '▶';
    playBtn.addEventListener('click', () => {
      if (state.onPlay) {
        state.onPlay({
          syllables: state.syllables.map((s) => ({ text: s.text, weight: s.weight })),
          feet: state.feet.map((f) => f.slice()),
          bpm: state.bpm,
        });
      }
    });
    head.appendChild(playBtn);

    const bpmLabel = document.createElement('span');
    bpmLabel.className = 'rr-bpm';
    bpmLabel.textContent = `${state.bpm} bpm`;
    head.appendChild(bpmLabel);

    if (state.target) {
      const badge = document.createElement('span');
      badge.className = 'rr-compare';
      badge.appendChild(document.createTextNode('comparing to meter'));
      const clearBtn = document.createElement('button');
      clearBtn.type = 'button';
      clearBtn.className = 'rr-clear';
      clearBtn.setAttribute('aria-label', 'Clear meter comparison');
      clearBtn.textContent = '×';
      clearBtn.addEventListener('click', () => api.setTarget(null));
      badge.appendChild(clearBtn);
      head.appendChild(badge);
    }
    root.appendChild(head);

    // -- scroll wrapper + track --
    scrollEl = document.createElement('div');
    scrollEl.className = 'rr-scroll';
    trackEl = document.createElement('div');
    trackEl.className = 'rr-track';
    scrollEl.appendChild(trackEl);
    root.appendChild(scrollEl);

    blockEls = [];

    state.feet.forEach((range) => {
      const footEl = document.createElement('div');
      footEl.className = 'rr-foot';
      const blocksEl = document.createElement('div');
      blocksEl.className = 'rr-blocks';

      for (let i = range[0]; i <= range[1] && i < state.syllables.length; i++) {
        blocksEl.appendChild(buildBlock(i));
      }
      footEl.appendChild(blocksEl);

      const nameEl = document.createElement('div');
      nameEl.className = 'rr-footname';
      const key = footPatternKey(state.syllables, range);
      nameEl.textContent = (key && FOOT_NAMES[key]) || footGlyphs(state.syllables, range);
      footEl.appendChild(nameEl);

      trackEl.appendChild(footEl);
    });

    // -- caesura marker (measured against the block it precedes) --
    if (state.caesura != null && state.caesura > 0 && state.caesura < blockEls.length) {
      const marker = document.createElement('div');
      marker.className = 'rr-caesura';
      trackEl.appendChild(marker);
      const target = blockEls[state.caesura];
      const left = target.offsetLeft - FOOT_GAP_PX / 2;
      marker.style.left = `${left}px`;
    }

    // -- playhead --
    playheadEl = document.createElement('div');
    playheadEl.className = 'rr-playhead';
    trackEl.appendChild(playheadEl);

    // -- restore scroll / focus --
    scrollEl.scrollLeft = priorScroll;
    if (hadFocus && state.editable) {
      const idx = clamp(state.focusIndex, 0, blockEls.length - 1);
      if (blockEls[idx]) blockEls[idx].focus();
    }
    updateTabIndexes();
    buildTimeline();
    applyCurrentHighlight();
  }

  function buildBlock(i) {
    const s = state.syllables[i];
    const units = WEIGHT_UNITS[s.weight] || 1;
    const el = document.createElement(state.editable ? 'button' : 'div');
    el.className = 'rr-block';
    el.dataset.w = s.weight;
    el.dataset.idx = String(i);
    el.style.width = `${units * UNIT_PX}px`;
    el.textContent = s.text;
    if (state.editable) {
      el.type = 'button';
      el.tabIndex = i === state.focusIndex ? 0 : -1;
      el.addEventListener('click', () => toggleWeight(i));
    } else {
      el.setAttribute('role', 'img');
      el.tabIndex = i === state.focusIndex ? 0 : -1;
    }
    el.addEventListener('focus', () => { state.focusIndex = i; });
    el.addEventListener('keydown', (ev) => handleKey(ev, i));
    updateBlockAria(el, i);
    blockEls.push(el);
    return el;
  }

  function updateBlockAria(el, i) {
    const s = state.syllables[i];
    let label = `syllable ${s.text}, ${WEIGHT_LABEL[s.weight] || s.weight}`;
    if (state.target) {
      const t = state.target[i];
      const mismatch = t && s.weight !== 'x' && t !== 'x' && t !== s.weight;
      label += mismatch ? `, mismatch — meter expects ${WEIGHT_LABEL[t] || t}` : ', matches meter';
      el.classList.toggle('rr-mismatch', !!mismatch);
    } else {
      el.classList.remove('rr-mismatch');
    }
    if (state.editable) label += '; press space or enter to change';
    el.setAttribute('aria-label', label);
  }

  function updateTabIndexes() {
    blockEls.forEach((el, i) => { el.tabIndex = i === state.focusIndex ? 0 : -1; });
  }

  function toggleWeight(i) {
    const s = state.syllables[i];
    s.weight = WEIGHT_CYCLE[s.weight] || 'l';
    state.focusIndex = i;
    render();
    if (state.onChange) state.onChange(state.syllables.map((x) => ({ text: x.text, weight: x.weight })));
  }

  function handleKey(ev, i) {
    if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') {
      ev.preventDefault();
      const dir = ev.key === 'ArrowRight' ? 1 : -1;
      const next = clamp(i + dir, 0, blockEls.length - 1);
      state.focusIndex = next;
      updateTabIndexes();
      blockEls[next].focus();
    } else if (ev.key === 'Home') {
      ev.preventDefault();
      state.focusIndex = 0; updateTabIndexes(); blockEls[0].focus();
    } else if (ev.key === 'End') {
      ev.preventDefault();
      const last = blockEls.length - 1;
      state.focusIndex = last; updateTabIndexes(); blockEls[last].focus();
    } else if (state.editable && (ev.key === ' ' || ev.key === 'Enter')) {
      ev.preventDefault();
      toggleWeight(i);
    }
  }

  // Build the seconds->pixel timeline table from real, measured DOM offsets
  // (so gaps between feet / the caesura marker are naturally accounted for),
  // while timing itself stays purely unit-based.
  function buildTimeline() {
    const spu = secPerUnit();
    let t = 0;
    state.timeline = state.syllables.map((s, i) => {
      const units = WEIGHT_UNITS[s.weight] || 1;
      const start = t;
      const end = t + units * spu;
      t = end;
      const el = blockEls[i];
      return { start, end, left: el ? el.offsetLeft : 0, width: el ? el.offsetWidth : 0 };
    });
  }

  function applyCurrentHighlight() {
    blockEls.forEach((el, i) => el.classList.toggle('rr-current', i === state.currentIndex));
  }

  /* ------------------------------- public API ------------------------------ */

  const api = {
    setPlayhead(timeSeconds) {
      if (!playheadEl || !state.timeline.length) return;
      const total = state.timeline.length ? state.timeline[state.timeline.length - 1].end : 0;
      const t = clamp(timeSeconds, 0, total);
      let idx = state.timeline.findIndex((row) => t < row.end);
      if (idx === -1) idx = state.timeline.length - 1;
      const row = state.timeline[idx];
      const span = Math.max(1e-6, row.end - row.start);
      const frac = clamp((t - row.start) / span, 0, 1);
      const px = row.left + frac * row.width;
      playheadEl.style.transform = `translateX(${px}px)`;
      playheadEl.classList.add('rr-on');
      if (state.currentIndex !== idx) {
        state.currentIndex = idx;
        applyCurrentHighlight();
      }
    },

    highlight(i) {
      if (i == null || i < 0) {
        state.currentIndex = null;
        applyCurrentHighlight();
        if (playheadEl) playheadEl.classList.remove('rr-on');
        return;
      }
      state.currentIndex = clamp(i, 0, state.syllables.length - 1);
      applyCurrentHighlight();
      const row = state.timeline[state.currentIndex];
      if (row && playheadEl) {
        playheadEl.style.transform = `translateX(${row.left}px)`;
        playheadEl.classList.add('rr-on');
      }
    },

    setTarget(pattern) {
      state.target = pattern && pattern.length ? pattern : null;
      render();
    },

    setSyllables(syllables) {
      state.syllables = (syllables || []).map((s) => ({ text: s.text, weight: s.weight }));
      state.focusIndex = 0;
      state.currentIndex = null;
      render();
    },

    setFeet(feet) {
      state.feet = feet && feet.length ? feet : [[0, Math.max(0, state.syllables.length - 1)]];
      render();
    },

    setBpm(bpm) {
      state.bpm = bpm || 80;
      buildTimeline();
    },

    setEditable(editable) {
      state.editable = !!editable;
      render();
    },

    getSyllables() {
      return state.syllables.map((s) => ({ text: s.text, weight: s.weight }));
    },

    destroy() {
      container.innerHTML = '';
    },
  };

  // Re-measure the timeline (pixel offsets only — timing is unit-based and
  // doesn't change) when the container is resized, e.g. rotating a phone or
  // resizing a desktop window, so the playhead stays aligned.
  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(() => buildTimeline());
    ro.observe(root);
  }

  render();
  return api;
}

window.mountRhythmRoll = mountRhythmRoll;


/* Key normalizer for cross-script verse matching */
function normVerseKey(str) {
  if(!str) return '';
  return str.toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640\u200C\u200D]/g, '')
    .replace(/[،۔؟!,.;:?"'«»()\[\]\-–—/]/g, '')
    .replace(/[آأإٱ]/g, 'ا')
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[هۀۂە]/g, 'ہ')
    .replace(/[āá]/g, 'aa')
    .replace(/[īí]/g, 'ii')
    .replace(/[ūú]/g, 'uu')
    .replace(/[ñṅ]/g, 'n')
    .replace(/[ṭ]/g, 't')
    .replace(/[ḍ]/g, 'd')
    .replace(/[ṛ]/g, 'r')
    .replace(/[ṣ]/g, 's')
    .replace(/[żẕž]/g, 'z')
    .replace(/[z̤]/g, 'z')
    .replace(/[t̤]/g, 't')
    .replace(/[ḥ]/g, 'h')
    .replace(/[ʿʽ‘']/g, '')
    .replace(/[ʾ’]/g, '')
    .replace(/kh/g, 'x')
    .replace(/\bhua\b/g, 'huaa')
    .replace(/\bkya\b/g, 'kyaa')
    .replace(/\bdava\b/g, 'davaa')
    .replace(/\s+/g, ' ')
    .trim();
}

/* Universal indexed dictionary of all classical verses across all 4 scripts */
const KNOWN_VERSES = {};
function registerKnownVerse(obj) {
  if(!obj) return;
  const entry = {
    ur: obj.ur || '',
    hi: obj.hi || '',
    ro: obj.ro || '',
    ascii: obj.ascii || ''
  };
  ['ur', 'hi', 'ro', 'ascii'].forEach(k => {
    if(obj[k]) {
      const nk = normVerseKey(obj[k]);
      if(nk) KNOWN_VERSES[nk] = entry;
    }
  });
}

// Index all exercises lines (226 lines across 24 ghazals)
EXERCISES_DATA.forEach(ex => {
  if(ex.lines) ex.lines.forEach(l => registerKnownVerse(l));
});

// Index the extended Ghalib corpus too, so Scan/Compose use its verified
// ur/hi/ro instead of regenerating (lossy) transliteration for these lines.
GHALIB_EXT_DATA.forEach(g => {
  if(g.lines) g.lines.forEach(l => registerKnownVerse(l));
});

// Index the extended Mir corpus too, for the same reason as the Ghalib block above.
MIR_EXT_DATA.forEach(g => {
  if(g.lines) g.lines.forEach(l => registerKnownVerse(l));
});

// Index all family famous verses (25 verses across 12 families)
function indexFamsVerses() {
  try {
    const list = (typeof window !== 'undefined' && window.FAMS) ? window.FAMS : null;
    if(list) {
      list.forEach(f => {
        if(f.gz) {
          f.gz.forEach(g => {
            registerKnownVerse({ ur: g.ur, hi: g.hi, ro: g.ro, ascii: g.ascii });
            if(g.ascii2) registerKnownVerse({ ur: g.ur2, hi: g.hi2, ro: g.ro2, ascii: g.ascii2 });
          });
        }
      });
    }
  } catch(e){}
}

/* Transliteration helpers for novel/arbitrary inputs */
function devToAscii(str) {
  if(!str) return '';
  str = str.normalize('NFC');
  const nuktaMap = { 'क़':'q','ख़':';x','ग़':';g','ज़':'z','ड़':';r','ढ़':';rh','फ़':'f' };
  const consMap = {
    'क':'k','ख':'kh','ग':'g','घ':'gh','ङ':'n',
    'च':'ch','छ':'chh','ज':'j','झ':'jh','ञ':'n',
    'ट':';t','ठ':';th','ड':';d','ढ':';dh','ण':'n',
    'त':'t','थ':'th','द':'d','ध':'dh','न':'n',
    'प':'p','फ':'ph','ब':'b','भ':'bh','म':'m',
    'य':'y','र':'r','ल':'l','व':'v',
    'श':'sh','ष':'sh','स':'s','ह':'h'
  };
  const vowelMap = { 'अ':'a','आ':'aa','इ':'i','ई':'ii','उ':'u','ऊ':'uu','ए':'e','ऐ':'ai','ओ':'o','औ':'au' };
  const matraMap = { 'ा':'aa','ि':'i','ी':'ii','ु':'u','ू':'uu','े':'e','ै':'ai','ो':'o','ौ':'au' };
  let s = str;
  for(const [k, v] of Object.entries(nuktaMap)) s = s.split(k).join(v);
  let out = '';
  for(let i = 0; i < s.length; i++) {
    const ch = s[i];
    const nextCh = s[i + 1] || '';
    if(consMap[ch]) {
      const c = consMap[ch];
      if(nextCh === '्') { out += c; i++; }
      else if(matraMap[nextCh]) { out += c + matraMap[nextCh]; i++; }
      else { out += c; }
    } else if(vowelMap[ch]) {
      out += vowelMap[ch];
    } else if(ch === 'ं' || ch === 'ँ') {
      out += ';n';
    } else if(ch === 'ः') {
      out += 'h';
    } else {
      out += ch;
    }
  }
  return out;
}

function romanToAscii(str) {
  if(!str) return '';
  let s = str.toLowerCase();
  s = s.replace(/\bhua\b/g, 'hu))aa')
       .replace(/\bkya\b/g, 'kyaa')
       .replace(/\bdava\b/g, 'davaa')
       .replace(/\baaxir\b/g, 'aa;xir')
       .replace(/\bnaadaan\b/g, 'naadaa;n')
       .replace(/ā/g, 'aa')
       .replace(/ī/g, 'ii')
       .replace(/ū/g, 'uu')
       .replace(/ñ/g, ';n')
       .replace(/ġh|ġ/g, ';g')
       .replace(/ḳh|ḳ/g, ';x')
       .replace(/ṭ/g, ';t')
       .replace(/ḍ/g, ';d')
       .replace(/ṛ/g, ';r')
       .replace(/ṣ/g, '.s')
       .replace(/ż|ẕ/g, ';z')
       .replace(/z̤/g, ':z')
       .replace(/t̤/g, ':t')
       .replace(/ḥ/g, ';h')
       .replace(/ʿ/g, '((')
       .replace(/[’ʾ']/g, '))')
       .replace(/u([aā])/g, 'u))$1');
  return s;
}

function urduToDevanagari(str) {
  if(!str) return '';
  str = str.normalize('NFC');
  const multiMap = [
    [/بھ/g, 'भ'], [/پھ/g, 'फ'], [/تھ/g, 'थ'], [/ٹھ/g, 'ठ'], [/جھ/g, 'झ'], [/چھ/g, 'छ'],
    [/دھ/g, 'ध'], [/ڈھ/g, 'ढ'], [/کھ/g, 'ख'], [/گھ/g, 'घ'], [/ڑھ/g, 'ढ़'],
    [/کیا/g, 'क्या'], [/کیوں/g, 'क्यों'], [/ہے/g, 'है'], [/ہیں/g, 'हैं'], [/تھے/g, 'थे'],
    [/تھی/g, 'थी'], [/تھا/g, 'था'], [/مجھ/g, 'मुझ'], [/تجھ/g, 'तुझ'], [/کچھ/g, 'कुछ'],
    [/دلِ/g, 'दिल-ए'], [/ہوا/g, 'हुआ'], [/دوا/g, 'दवा'], [/ناداں/g, 'नादाँ'], [/تجھے/g, 'तुझे']
  ];
  let s = str;
  multiMap.sort((a, b) => b[0].source.length - a[0].source.length);
  multiMap.forEach(([re, rep]) => { s = s.replace(re, rep); });
  const singleMap = {
    'آ': 'आ', 'ا': 'ा', 'ب': 'ब', 'پ': 'प', 'ت': 'त', 'ٹ': 'ट', 'ث': 'स',
    'ج': 'ज', 'چ': 'च', 'ح': 'ह', 'خ': 'ख़', 'د': 'द', 'ڈ': 'ड', 'ذ': 'ज़',
    'ر': 'र', 'ڑ': 'ड़', 'ز': 'ज़', 'ژ': 'झ़', 'س': 'स', 'ش': 'श', 'ص': 'स',
    'ض': 'ज़', 'ط': 'त', 'ظ': 'ज़', 'ع': '', 'غ': 'ग़', 'ف': 'फ़', 'ق': 'क़',
    'ک': 'क', 'گ': 'ग', 'ل': 'ल', 'م': 'म', 'ن': 'न', 'ں': 'ँ', 'و': 'ो',
    'ہ': 'ह', 'ۂ': 'ह-ए', 'ھ': 'ह', 'ء': '', 'ی': 'ी', 'ے': 'े', 'ۓ': 'ए',
    'ِ': '-ए-', 'ُ': 'ु', 'َ': ''
  };
  let out = '';
  for(let i = 0; i < s.length; i++) {
    const ch = s[i];
    if(singleMap[ch] !== undefined) {
      if(ch === 'ا' && (i === 0 || /\s/.test(s[i - 1]))) out += 'अ';
      else out += singleMap[ch];
    } else {
      out += ch;
    }
  }
  return out;
}

function urduToRoman(str) {
  if(!str) return '';
  str = str.normalize('NFC');
  const multiMap = [
    [/بھ/g, 'bh'], [/پھ/g, 'ph'], [/تھ/g, 'th'], [/ٹھ/g, 'ṭh'], [/جھ/g, 'jh'], [/چھ/g, 'chh'],
    [/دھ/g, 'dh'], [/ڈھ/g, 'ḍh'], [/کھ/g, 'kh'], [/گھ/g, 'gh'], [/ڑھ/g, 'ṛh'],
    [/کیا/g, 'kyā'], [/کیوں/g, 'kyūñ'], [/ہے/g, 'hai'], [/ہیں/g, 'haiñ'], [/تھے/g, 'the'],
    [/تھی/g, 'thī'], [/تھا/g, 'thā'], [/مجھ/g, 'mujh'], [/تجھ/g, 'tujh'], [/کچھ/g, 'kuchh'],
    [/دلِ/g, 'dil-e'], [/ہوا/g, 'huʾā'], [/دوا/g, 'davā'], [/ناداں/g, 'nādāñ'], [/تجھے/g, 'tujhe']
  ];
  let s = str;
  multiMap.sort((a, b) => b[0].source.length - a[0].source.length);
  multiMap.forEach(([re, rep]) => { s = s.replace(re, rep); });
  const singleMap = {
    'آ': 'ā', 'ا': 'ā', 'ب': 'b', 'پ': 'p', 'ت': 't', 'ٹ': 'ṭ', 'ث': 's̱',
    'ج': 'j', 'چ': 'ch', 'ح': 'ḥ', 'خ': 'ḳh', 'د': 'd', 'ڈ': 'ḍ', 'ذ': 'ẕ',
    'ر': 'r', 'ڑ': 'ṛ', 'ز': 'z', 'ژ': 'zh', 'س': 's', 'ش': 'sh', 'ص': 'ṣ',
    'ض': 'ż', 'ط': 't̤', 'ظ': 'z̤', 'ع': 'ʿ', 'غ': 'ġh', 'ف': 'f', 'ق': 'q',
    'ک': 'k', 'گ': 'g', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ں': 'ñ', 'و': 'o',
    'ہ': 'h', 'ۂ': 'h-e', 'ھ': 'h', 'ء': '’', 'ی': 'ī', 'ے': 'e', 'ۓ': '’e',
    'ِ': '-e', 'ُ': 'u', 'َ': 'a'
  };
  let out = '';
  for(let i = 0; i < s.length; i++) {
    const ch = s[i];
    if(singleMap[ch] !== undefined) {
      if(ch === 'ا' && (i === 0 || /\s/.test(s[i - 1]))) out += 'a';
      else out += singleMap[ch];
    } else {
      out += ch;
    }
  }
  return out;
}

function getLineDisplay(lineObj, script) {
  if(!lineObj) return '';
  const approxBadge = ' <span class="pill faint tiny" style="font-size:10.5px;padding:2px 6px;margin-inline-start:6px;vertical-align:middle;font-weight:normal;" title="Urdu script does not write short vowels; transliteration is approximate">approximate</span>';
  if(typeof lineObj === 'string') {
    const nk = normVerseKey(lineObj);
    if(KNOWN_VERSES[nk]) return getLineDisplay(KNOWN_VERSES[nk], script);
    if(script === 'ur') return lineObj;
    if(script === 'hi') return urduToDevanagari(lineObj) + approxBadge;
    if(script === 'ro') return urduToRoman(lineObj) + approxBadge;
    return lineObj;
  }
  const isNovelUr = lineObj.isApprox;
  if(script === 'ascii') return (lineObj.ascii || lineObj.ro || lineObj.ur || '') + (isNovelUr ? approxBadge : '');
  if(script === 'hi') return (lineObj.hi || urduToDevanagari(lineObj.ur) || lineObj.ascii || '') + (isNovelUr || (!lineObj.hi && lineObj.ur) ? approxBadge : '');
  if(script === 'ro') return (lineObj.ro || urduToRoman(lineObj.ur) || lineObj.ascii || '') + (isNovelUr || (!lineObj.ro && lineObj.ur) ? approxBadge : '');
  return lineObj.ur || lineObj.ascii || '';
}
window.getLineDisplay = getLineDisplay;

function translitText(str, script) {
  if(!str) return '';
  if(!script || script === 'ur') return str;
  if(script === 'hi') return (typeof urduToDevanagari === 'function') ? urduToDevanagari(str) : str;
  if(script === 'ro') return (typeof urduToRoman === 'function') ? urduToRoman(str) : str;
  if(script === 'ascii') return (typeof romanToAscii === 'function') ? romanToAscii((typeof urduToRoman === 'function') ? urduToRoman(str) : str) : str;
  return str;
}
window.translitText = translitText;

