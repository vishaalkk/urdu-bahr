/* ================= STANDALONE METER FAMILY MAP WIDGET ================= */
/**
 * meterMap.js
 * -----------------------------------------------------------------------
 * A standalone, dependency-free ES module that renders an interactive
 * "meter family map": the ten classical Arabic-Persian prosodic families
 * (+ any extra families present in the data, + rubāʻī, + Mir's Hindi
 * meter) fanned out into their individual meters, with special dashed
 * links drawn between classically "paired" meters (e.g. #14 <-> #15).
 *
 * No CDN, no framework, no fetch: the caller supplies the meters array
 * (already parsed from data/meters.json) and an optional pair list.
 *
 * Usage:
 *   import { mountMeterMap } from './meterMap.js';
 *   const handle = mountMeterMap(container, {
 *     meters,                 // array — see "Meter object shape" below
 *     pairs,                  // optional [[idA, idB], ...] — defaults to []
 *     onSelect(meter) {},      // called on click / Enter on a meter node
 *     playMeter(meter) {},     // optional, called alongside onSelect
 *   });
 *   handle.update({ meters, pairs });   // re-render with new data
 *   handle.destroy();                   // tear down listeners + DOM
 *
 * See README.md in this folder for the full API and CSS variable list.
 * -----------------------------------------------------------------------
 */

// ---------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------

// Canonical display order for the classical families (matches the
// handbook's Chapter 6 ordering). Any family present in the data but not
// listed here (e.g. a stray "kāmil" meter) is appended at the end, before
// the non-Arabic groups (rubāʻī, Hindi).
// NB: these must be the *exact* keys normalizeKey() derives from the real
// data/meters.json `name` spellings (confirmed against the live dataset),
// not idealized canonical spellings — a mismatch here silently drops a
// family into the unordered fallback bucket further down.
const FAMILY_ORDER = [
  'hazaj', 'rajaz', 'ramal', 'xafif', 'muzari',
  'munsarih', 'mujtas', 'sari', 'mutaqarib', 'mutadarik',
];

// Normalized-key -> canonical label. Keys are produced by normalizeKey()
// (diacritics stripped, lowercased), so multiple spellings map to one
// canonical family name.
const FAMILY_LABELS = {
  hazaj: 'Hazaj',
  rajaz: 'Rajaz',
  ramal: 'Ramal',
  khafif: 'Khafif',
  xafif: 'Khafif',
  muzari: 'Muzāriʻ',
  munsarih: 'Munsarih',
  mujtass: 'Mujtass',
  mujtas: 'Mujtass',
  sarii: 'Sariʻ',
  sari: 'Sariʻ',
  mutaqarib: 'Mutaqārib',
  mutadarak: 'Mutadārak',
  mutadarik: 'Mutadārak',
  kamil: 'Kāmil',
};

const RUBAI_FAMILY_KEY = 'rubai';
const HINDI_FAMILY_KEY = 'hindi';
const FAMILY_LABELS_EXTRA = {
  [RUBAI_FAMILY_KEY]: 'Rubāʻī',
  [HINDI_FAMILY_KEY]: "Hindi meter (Mir)",
};

const NARROW_BREAKPOINT = 640; // px — below this, use the stacked layout

const SVG_NS = 'http://www.w3.org/2000/svg';

// ---------------------------------------------------------------------
// Small utilities
// ---------------------------------------------------------------------

function normalizeKey(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritics
    .replace(/[ʻʼʿʾ]/g, '')          // strip ayn/hamza-style marks
    .replace(/[^a-z]/gi, '')
    .toLowerCase();
}

function collapseWhitespace(str) {
  return String(str || '').replace(/\s+/g, ' ').trim();
}

/**
 * Derive a canonical family key + label from a meter's name, e.g.
 * "hazaj musaddas axram ashtar mahzūf" -> { key: 'hazaj', label: 'Hazaj' }.
 * Falls back to a synthesized "Other" bucket keyed by the raw first word,
 * rather than dropping the meter, since we never want to lose a meter
 * silently.
 */
function deriveFamily(meter) {
  if (meter.family) {
    const key = normalizeKey(meter.family);
    return { key, label: meter.family };
  }
  const firstWord = collapseWhitespace(meter.name).split(' ')[0] || '';
  const key = normalizeKey(firstWord);
  const label = FAMILY_LABELS[key] || (firstWord ? firstWord : 'Other');
  return { key: key || 'other', label };
}

/**
 * Parse a meter's long/short pattern string into syllables grouped by
 * feet. Tolerant of the source data's inconsistent spacing (e.g. meter
 * #1's "/=" with no space) by stripping all whitespace first and walking
 * character by character.
 *
 * Symbols observed in data/meters.json:
 *   '='  long syllable
 *   '-'  short syllable
 *   '/'  foot boundary (a run of 2+ marks a caesura, matching the
 *        source's "//" notation)
 *   '*'  a flag on the syllable immediately before it. Its precise
 *        prosodic meaning isn't documented in the JSON; we surface it
 *        visually as a "flagged" syllable rather than guessing further.
 *
 * Returns { syllables: [{weight, flagged}], feet: [{indices, caesuraAfter}] }
 */
function parsePattern(pattern) {
  const syllables = [];
  const feet = [];
  let current = [];
  const s = String(pattern || '').replace(/\s+/g, '');
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (ch === '=' || ch === '-') {
      const weight = ch === '=' ? 'long' : 'short';
      let flagged = false;
      if (s[i + 1] === '*') {
        flagged = true;
        i++;
      }
      syllables.push({ weight, flagged });
      current.push(syllables.length - 1);
      i++;
    } else if (ch === '/') {
      let j = i;
      while (s[j] === '/') j++;
      const isCaesura = j - i >= 2;
      if (current.length) {
        feet.push({ indices: current, caesuraAfter: isCaesura });
        current = [];
      } else if (feet.length) {
        feet[feet.length - 1].caesuraAfter = feet[feet.length - 1].caesuraAfter || isCaesura;
      }
      i = j;
    } else {
      i++; // skip anything unrecognized rather than throwing
    }
  }
  if (current.length) feet.push({ indices: current, caesuraAfter: false });
  return { syllables, feet };
}

// ---------------------------------------------------------------------
// Model construction
// ---------------------------------------------------------------------

/**
 * Normalize the caller's meters array + pairs list into an internal
 * model: families (in display order) each containing their meter
 * wrappers, plus a flat id -> wrapper index and a de-duplicated,
 * symmetric list of pair edges.
 */
function buildModel(meters, pairsInput) {
  const meterIndex = new Map();
  const familiesByKey = new Map();

  for (const raw of meters || []) {
    const id = raw.id;
    if (id === undefined || id === null) continue;

    let familyKey, familyLabel;
    if (raw.group === 'rubai') {
      familyKey = RUBAI_FAMILY_KEY;
      familyLabel = FAMILY_LABELS_EXTRA[RUBAI_FAMILY_KEY];
    } else if (raw.group === 'hindi') {
      familyKey = HINDI_FAMILY_KEY;
      familyLabel = FAMILY_LABELS_EXTRA[HINDI_FAMILY_KEY];
    } else {
      const f = deriveFamily(raw);
      familyKey = f.key;
      familyLabel = f.label;
    }

    const displayName = collapseWhitespace(raw.name) || String(id);
    const parsed = raw.pattern ? parsePattern(raw.pattern) : { syllables: [], feet: [] };

    const wrapper = {
      raw,
      id,
      displayName,
      rawName: raw.raw_name ? collapseWhitespace(raw.raw_name) : '',
      familyKey,
      familyLabel,
      caesura: !!raw.caesura,
      notes: raw.notes ? collapseWhitespace(raw.notes) : '',
      description: raw.description ? collapseWhitespace(raw.description) : '',
      feetOptions: Array.isArray(raw.feet) ? raw.feet : null, // Hindi meter's alt. foot shapes
      parsed,
      pairedWith: new Set(Array.isArray(raw.paired) ? raw.paired : []),
    };

    meterIndex.set(id, wrapper);

    if (!familiesByKey.has(familyKey)) {
      familiesByKey.set(familyKey, { key: familyKey, label: familyLabel, meters: [] });
    }
    familiesByKey.get(familyKey).meters.push(wrapper);
  }

  // Merge in the explicit pairs list (authoritative) symmetrically.
  const pairEdges = [];
  const seenPairs = new Set();
  const addPair = (a, b) => {
    if (!meterIndex.has(a) || !meterIndex.has(b)) return;
    const k = a < b ? `${a}|${b}` : `${b}|${a}`;
    if (seenPairs.has(k)) return;
    seenPairs.add(k);
    pairEdges.push([a, b]);
    meterIndex.get(a).pairedWith.add(b);
    meterIndex.get(b).pairedWith.add(a);
  };
  for (const [a, b] of pairsInput || []) addPair(a, b);
  for (const wrapper of meterIndex.values()) {
    for (const otherId of wrapper.pairedWith) addPair(wrapper.id, otherId);
  }

  // Order families: classical order first, then any unrecognized Arabic
  // family (e.g. "kāmil") in first-seen order, then rubāʻī, then Hindi.
  const orderedKeys = [];
  for (const key of FAMILY_ORDER) if (familiesByKey.has(key)) orderedKeys.push(key);
  for (const key of familiesByKey.keys()) {
    if (key === RUBAI_FAMILY_KEY || key === HINDI_FAMILY_KEY) continue;
    if (!orderedKeys.includes(key)) orderedKeys.push(key);
  }
  if (familiesByKey.has(RUBAI_FAMILY_KEY)) orderedKeys.push(RUBAI_FAMILY_KEY);
  if (familiesByKey.has(HINDI_FAMILY_KEY)) orderedKeys.push(HINDI_FAMILY_KEY);

  const families = orderedKeys.map((key) => familiesByKey.get(key));
  // Stable sort meters within a family by id (numeric ids sort naturally;
  // rubāʻī ids like "R2" sort lexicographically, which matches source order).
  for (const fam of families) {
    fam.meters.sort((a, b) => (a.id > b.id ? 1 : a.id < b.id ? -1 : 0));
  }

  return { families, meterIndex, pairEdges };
}

// ---------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------

/**
 * Radial cluster layout for wide containers: families sit on an inner
 * ring, their meters fan out on an outer ring within the family's
 * angular sector (sector width proportional to meter count).
 */
function layoutRadial(model, width, height) {
  const cx = width / 2;
  const cy = height / 2;
  const innerR = Math.min(width, height) * 0.2;
  const outerR = Math.min(width, height) * 0.42;

  const totalWeight = model.families.reduce((sum, f) => sum + f.meters.length + 1, 0);
  let angle = -Math.PI / 2; // start at the top, go clockwise
  const positions = new Map(); // id -> {x, y}
  const familyPositions = new Map(); // key -> {x, y, angle}

  for (const fam of model.families) {
    const sector = ((fam.meters.length + 1) / totalWeight) * Math.PI * 2;
    const midAngle = angle + sector / 2;
    const hx = cx + innerR * Math.cos(midAngle);
    const hy = cy + innerR * Math.sin(midAngle);
    familyPositions.set(fam.key, { x: hx, y: hy, angle: midAngle });

    const n = fam.meters.length;
    const leafSpread = Math.min(sector * 0.92, n > 1 ? sector : sector * 0.3);
    const start = midAngle - leafSpread / 2;
    fam.meters.forEach((m, i) => {
      const a = n > 1 ? start + (leafSpread * i) / (n - 1) : midAngle;
      positions.set(m.id, {
        x: cx + outerR * Math.cos(a),
        y: cy + outerR * Math.sin(a),
      });
    });

    angle += sector;
  }

  return { mode: 'radial', width, height, positions, familyPositions };
}

/**
 * Stacked-band layout for narrow containers: one horizontal band per
 * family, meters placed left-to-right within the band. If a band's
 * content is wider than the viewport, the module's wrapper scrolls that
 * overflow horizontally rather than the page.
 */
function layoutStacked(model, width) {
  const bandHeight = 76;
  const hubX = 54;
  const leafStartX = 128;
  const leafGap = 56;
  const positions = new Map();
  const familyPositions = new Map();

  let y = bandHeight / 2;
  let maxContentWidth = width;

  for (const fam of model.families) {
    familyPositions.set(fam.key, { x: hubX, y, angle: 0 });
    fam.meters.forEach((m, i) => {
      const x = leafStartX + i * leafGap;
      positions.set(m.id, { x, y });
      maxContentWidth = Math.max(maxContentWidth, x + leafGap);
    });
    y += bandHeight;
  }

  return {
    mode: 'stacked',
    width: maxContentWidth,
    height: y,
    positions,
    familyPositions,
  };
}

// ---------------------------------------------------------------------
// Styles (injected once per document)
// ---------------------------------------------------------------------

const STYLE_MARKER_ATTR = 'data-meter-map-styles';

function ensureStylesInjected() {
  if (document.querySelector(`style[${STYLE_MARKER_ATTR}]`)) return;
  const style = document.createElement('style');
  style.setAttribute(STYLE_MARKER_ATTR, '');
  style.textContent = `
.mm-root {
  --mm-fg: var(--fg, #ECE3D0);
  --mm-bg: var(--bg, #161320);
  --mm-muted: var(--muted, #a79db3);
  --mm-accent: var(--accent, #E6A93C);
  --mm-rule: var(--rule, rgba(236, 227, 208, .16));
  --mm-long: var(--long, #52CBB6);
  --mm-short: var(--short, #E87AA0);
  position: relative;
  font-family: inherit;
  color: var(--mm-fg);
  min-height: 320px;
}
.mm-scroll {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
}
.mm-svg { display: block; }
.mm-svg text { fill: var(--mm-fg); user-select: none; }
.mm-edge { stroke: var(--mm-rule); stroke-width: 1; fill: none; }
.mm-edge-pair {
  stroke: var(--mm-accent);
  stroke-width: 1.5;
  stroke-dasharray: 4 3;
  fill: none;
  opacity: .85;
}
.mm-hub circle { fill: var(--mm-bg); stroke: var(--mm-muted); stroke-width: 1.25; }
.mm-hub text { font-size: 12px; letter-spacing: .02em; }
.mm-hub .mm-count { fill: var(--mm-muted); font-size: 9.5px; }
.mm-leaf circle { fill: var(--mm-bg); stroke: var(--mm-muted); stroke-width: 1; }
.mm-leaf text { font-size: 9.5px; text-anchor: middle; dominant-baseline: central; }
.mm-node { cursor: pointer; outline: none; }
.mm-node:focus .mm-focus-ring { opacity: 1; }
.mm-focus-ring {
  fill: none;
  stroke: var(--mm-accent);
  stroke-width: 1.75;
  opacity: 0;
  transition: opacity .12s ease;
}
.mm-node.mm-active .mm-leaf-circle,
.mm-node.mm-active circle.mm-hub-circle { stroke: var(--mm-accent); stroke-width: 1.75; }
.mm-node.mm-dimmed { opacity: .28; }
.mm-node.mm-paired .mm-leaf-circle { stroke: var(--mm-accent); }
.mm-legend {
  display: flex; flex-wrap: wrap; gap: 14px;
  font-size: 11.5px; color: var(--mm-muted);
  padding: 6px 2px 10px;
  border-top: 1px solid var(--mm-rule);
  margin-top: 4px;
}
.mm-legend span { display: inline-flex; align-items: center; gap: 5px; }
.mm-legend .mm-swatch { width: 14px; height: 8px; display: inline-block; border-radius: 1px; }
.mm-legend .mm-line { width: 18px; height: 0; border-top: 1px solid var(--mm-muted); display: inline-block; }
.mm-legend .mm-line-dash { border-top: 1.5px dashed var(--mm-accent); }
.mm-detail {
  border-top: 1px solid var(--mm-rule);
  padding: 12px 2px 2px;
  min-height: 92px;
}
.mm-detail .mm-detail-empty { color: var(--mm-muted); font-size: 13px; }
.mm-detail-name { font-size: 15px; font-weight: 600; margin: 0 0 2px; }
.mm-detail-raw { font-size: 12px; color: var(--mm-muted); font-family: var(--mono, ui-monospace, monospace); margin: 0 0 8px; }
.mm-detail-pattern { display: flex; align-items: center; gap: 3px; margin: 6px 0 8px; flex-wrap: wrap; }
.mm-blk { display: inline-block; height: 14px; border-radius: 2px; position: relative; }
.mm-blk-long { width: 20px; background: var(--mm-long); }
.mm-blk-short { width: 11px; background: var(--mm-short); }
.mm-blk-flagged::after {
  content: '';
  position: absolute; top: -4px; left: 50%; width: 3px; height: 3px;
  background: var(--mm-accent); border-radius: 50%; transform: translateX(-50%);
}
.mm-foot-gap { width: 6px; }
.mm-caesura { width: 1px; height: 18px; background: var(--mm-rule); margin: 0 3px; }
.mm-detail-meta { font-size: 12.5px; color: var(--mm-muted); line-height: 1.5; }
.mm-detail-meta strong { color: var(--mm-fg); font-weight: 600; }
.mm-pair-link {
  background: none; border: none; padding: 0; margin: 0 2px;
  color: var(--mm-accent); font-size: inherit; text-decoration: underline;
  cursor: pointer; font-family: inherit;
}
.mm-sr-only {
  position: absolute; width: 1px; height: 1px; overflow: hidden;
  clip: rect(0 0 0 0); white-space: nowrap;
}
`;
  document.head.appendChild(style);
}

// ---------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------

function svgEl(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs || {})) el.setAttribute(k, v);
  return el;
}

function edgePath(x1, y1, x2, y2, mode) {
  if (mode === 'stacked') {
    const midX = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
  }
  return `M ${x1} ${y1} L ${x2} ${y2}`;
}

function pairEdgePath(x1, y1, x2, y2) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 - 14;
  return `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
}

/**
 * Renders the block-row visualization of a meter's long/short pattern,
 * grouped by feet, into a detail-panel container element.
 */
function renderPatternRow(container, wrapper) {
  container.innerHTML = '';
  if (wrapper.feetOptions) {
    // Mir's Hindi meter: several alternative foot shapes rather than one
    // fixed sequence — show each option on its own row.
    wrapper.feetOptions.forEach((foot) => {
      const row = document.createElement('div');
      row.className = 'mm-detail-pattern';
      const parsed = parsePattern(foot);
      appendSyllableBlocks(row, parsed);
      container.appendChild(row);
    });
    return;
  }
  const row = document.createElement('div');
  row.className = 'mm-detail-pattern';
  appendSyllableBlocks(row, wrapper.parsed);
  container.appendChild(row);
}

function appendSyllableBlocks(row, parsed) {
  parsed.feet.forEach((foot, fi) => {
    if (fi > 0) {
      const gap = document.createElement('span');
      gap.className = 'mm-foot-gap';
      row.appendChild(gap);
    }
    foot.indices.forEach((si) => {
      const syl = parsed.syllables[si];
      const blk = document.createElement('span');
      blk.className = `mm-blk ${syl.weight === 'long' ? 'mm-blk-long' : 'mm-blk-short'}${syl.flagged ? ' mm-blk-flagged' : ''}`;
      blk.title = syl.weight === 'long' ? 'long syllable' : 'short syllable';
      row.appendChild(blk);
    });
    if (foot.caesuraAfter) {
      const cae = document.createElement('span');
      cae.className = 'mm-caesura';
      cae.title = 'caesura';
      row.appendChild(cae);
    }
  });
}

/**
 * mountMeterMap(container, options) -> { destroy(), update(options) }
 *
 * options:
 *   meters      array of meter objects (see README for shape)
 *   pairs       optional [[idA, idB], ...] pair list (merged with any
 *               per-meter `paired` arrays already in `meters`)
 *   onSelect    (meter) => void — called on click/Enter on a meter node,
 *               receives the original object from the `meters` array
 *   playMeter   optional (meter) => void — called alongside onSelect
 */
function mountMeterMap(container, options) {
  ensureStylesInjected();

  let opts = options || {};
  let model = buildModel(opts.meters, opts.pairs);
  let layout = null;
  let activeId = null; // currently hovered/focused meter id
  let focusIndex = 0; // index into navOrder for roving tabindex

  const root = document.createElement('div');
  root.className = 'mm-root';
  root.setAttribute('role', 'group');
  root.setAttribute('aria-label', 'Meter family map');

  const scroller = document.createElement('div');
  scroller.className = 'mm-scroll';
  root.appendChild(scroller);

  const svg = svgEl('svg', { class: 'mm-svg', role: 'tree', 'aria-label': 'Meter families and their meters' });
  scroller.appendChild(svg);

  const legend = document.createElement('div');
  legend.className = 'mm-legend';
  legend.innerHTML = `
    <span><span class="mm-swatch" style="background:var(--mm-long)"></span> long syllable</span>
    <span><span class="mm-swatch" style="background:var(--mm-short)"></span> short syllable</span>
    <span><span class="mm-line"></span> family membership</span>
    <span><span class="mm-line mm-line-dash"></span> paired meters</span>
  `;
  root.appendChild(legend);

  const detail = document.createElement('div');
  detail.className = 'mm-detail';
  detail.setAttribute('aria-live', 'polite');
  root.appendChild(detail);

  container.innerHTML = '';
  container.appendChild(root);

  // -- navigation order: hub, then its meters, per family, in order -----
  let navOrder = [];
  function computeNavOrder() {
    navOrder = [];
    for (const fam of model.families) {
      navOrder.push({ type: 'family', key: fam.key });
      for (const m of fam.meters) navOrder.push({ type: 'meter', id: m.id });
    }
  }

  function renderEmptyDetail() {
    detail.innerHTML = '<p class="mm-detail-empty">Hover, or tab in and press Enter, to inspect a meter’s feet and long/short pattern.</p>';
  }

  function renderDetail(wrapper) {
    detail.innerHTML = '';
    const name = document.createElement('p');
    name.className = 'mm-detail-name';
    name.textContent = `#${wrapper.id} · ${wrapper.displayName}`;
    detail.appendChild(name);

    if (wrapper.rawName) {
      const raw = document.createElement('p');
      raw.className = 'mm-detail-raw';
      raw.textContent = wrapper.rawName;
      detail.appendChild(raw);
    }

    renderPatternRow(detail, wrapper);

    const meta = document.createElement('p');
    meta.className = 'mm-detail-meta';
    const familyLabelStrong = document.createElement('strong');
    familyLabelStrong.textContent = 'Family:';
    meta.appendChild(familyLabelStrong);
    meta.appendChild(document.createTextNode(` ${wrapper.familyLabel}`));
    if (wrapper.caesura) meta.appendChild(document.createTextNode(' · has caesura'));
    detail.appendChild(meta);

    if (wrapper.pairedWith.size) {
      const pairP = document.createElement('p');
      pairP.className = 'mm-detail-meta';
      pairP.appendChild(document.createTextNode('Paired with: '));
      let first = true;
      for (const otherId of wrapper.pairedWith) {
        const other = model.meterIndex.get(otherId);
        if (!other) continue;
        if (!first) pairP.appendChild(document.createTextNode(', '));
        first = false;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'mm-pair-link';
        btn.textContent = `#${other.id} ${other.displayName}`;
        btn.addEventListener('click', () => focusMeterById(other.id));
        pairP.appendChild(btn);
      }
      detail.appendChild(pairP);
    }

    if (wrapper.description) {
      const desc = document.createElement('p');
      desc.className = 'mm-detail-meta';
      desc.textContent = wrapper.description;
      detail.appendChild(desc);
    }
    if (wrapper.notes) {
      const notes = document.createElement('p');
      notes.className = 'mm-detail-meta';
      notes.textContent = wrapper.notes;
      detail.appendChild(notes);
    }
  }

  function setActive(id) {
    activeId = id;
    svg.querySelectorAll('.mm-node').forEach((el) => {
      const nodeId = el.getAttribute('data-meter-id');
      const isTarget = nodeId !== null && String(nodeId) === String(id);
      el.classList.toggle('mm-active', isTarget);
    });
    if (id === null) {
      renderEmptyDetail();
      svg.querySelectorAll('.mm-node').forEach((el) => el.classList.remove('mm-dimmed', 'mm-paired'));
      return;
    }
    const wrapper = model.meterIndex.get(id);
    if (!wrapper) return;
    renderDetail(wrapper);
    svg.querySelectorAll('.mm-node[data-meter-id]').forEach((el) => {
      const nodeId = el.getAttribute('data-meter-id');
      const isSelf = String(nodeId) === String(id);
      const isSameFamily = el.getAttribute('data-family') === wrapper.familyKey;
      const isPaired = wrapper.pairedWith.has(coerceId(nodeId, wrapper.id));
      el.classList.toggle('mm-paired', isPaired);
      el.classList.toggle('mm-dimmed', !isSelf && !isSameFamily && !isPaired);
    });
    svg.querySelectorAll('.mm-hub').forEach((el) => {
      el.classList.toggle('mm-dimmed', el.getAttribute('data-family') !== wrapper.familyKey);
    });
  }

  // ids on rubāʻī meters are strings ("R2"); coerce comparison ids to
  // match the type of the reference id we already know is correct.
  function coerceId(rawAttrValue, sampleId) {
    if (typeof sampleId === 'number') {
      const n = Number(rawAttrValue);
      return Number.isNaN(n) ? rawAttrValue : n;
    }
    return rawAttrValue;
  }

  function focusMeterById(id) {
    const idx = navOrder.findIndex((n) => n.type === 'meter' && String(n.id) === String(id));
    if (idx === -1) return;
    setFocusIndex(idx);
    const el = svg.querySelector(`.mm-node[data-meter-id="${cssEscape(String(id))}"]`);
    if (el) el.focus();
  }

  function cssEscape(s) {
    return String(s).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  }

  function setFocusIndex(idx) {
    const prev = svg.querySelector('[tabindex="0"]');
    if (prev) prev.setAttribute('tabindex', '-1');
    focusIndex = Math.max(0, Math.min(idx, navOrder.length - 1));
    const entry = navOrder[focusIndex];
    if (!entry) return;
    const selector = entry.type === 'family'
      ? `.mm-hub[data-family="${cssEscape(entry.key)}"]`
      : `.mm-node[data-meter-id="${cssEscape(String(entry.id))}"]`;
    const el = svg.querySelector(selector);
    if (el) el.setAttribute('tabindex', '0');
  }

  function handleKeydown(e) {
    const key = e.key;
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' '].includes(key)) return;
    e.preventDefault();
    if (key === 'Home') { setFocusIndex(0); focusCurrent(); return; }
    if (key === 'End') { setFocusIndex(navOrder.length - 1); focusCurrent(); return; }
    if (key === 'ArrowRight' || key === 'ArrowDown') { setFocusIndex(focusIndex + 1); focusCurrent(); return; }
    if (key === 'ArrowLeft' || key === 'ArrowUp') { setFocusIndex(focusIndex - 1); focusCurrent(); return; }
    if (key === 'Enter' || key === ' ') {
      const entry = navOrder[focusIndex];
      if (entry && entry.type === 'meter') activateMeter(entry.id);
      if (entry && entry.type === 'family') {
        const firstMeterIdx = navOrder.findIndex((n, i) => i > focusIndex && n.type === 'meter');
        const familyEndIdx = navOrder.findIndex((n, i) => i > focusIndex && n.type === 'family');
        if (firstMeterIdx !== -1 && (familyEndIdx === -1 || firstMeterIdx < familyEndIdx)) {
          setFocusIndex(firstMeterIdx);
          focusCurrent();
        }
      }
    }
  }

  function focusCurrent() {
    const entry = navOrder[focusIndex];
    if (!entry) return;
    const selector = entry.type === 'family'
      ? `.mm-hub[data-family="${cssEscape(entry.key)}"]`
      : `.mm-node[data-meter-id="${cssEscape(String(entry.id))}"]`;
    const el = svg.querySelector(selector);
    if (el) {
      el.focus();
      if (entry.type === 'meter') setActive(entry.id);
      else setActive(null);
    }
  }

  function activateMeter(id) {
    const wrapper = model.meterIndex.get(id);
    if (!wrapper) return;
    if (typeof opts.onSelect === 'function') opts.onSelect(wrapper.raw);
    if (typeof opts.playMeter === 'function') opts.playMeter(wrapper.raw);
  }

  function renderGraph() {
    const width = container.clientWidth || 640;
    const isNarrow = width < NARROW_BREAKPOINT;
    layout = isNarrow ? layoutStacked(model, width) : layoutRadial(model, Math.max(width, 480), Math.max(420, width * 0.72));

    svg.innerHTML = '';
    computeNavOrder();

    if (isNarrow) {
      svg.setAttribute('width', String(layout.width));
      svg.setAttribute('height', String(layout.height));
      svg.removeAttribute('viewBox');
      scroller.style.overflowX = 'auto';
    } else {
      svg.setAttribute('viewBox', `0 0 ${layout.width} ${layout.height}`);
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', Math.max(420, width * 0.72));
      scroller.style.overflowX = 'hidden';
    }

    const edgeLayer = svgEl('g', { class: 'mm-edges' });
    const pairLayer = svgEl('g', { class: 'mm-pair-edges' });
    const nodeLayer = svgEl('g', { class: 'mm-nodes' });
    svg.appendChild(edgeLayer);
    svg.appendChild(pairLayer);
    svg.appendChild(nodeLayer);

    // Family -> meter structural edges.
    for (const fam of model.families) {
      const fp = layout.familyPositions.get(fam.key);
      for (const m of fam.meters) {
        const mp = layout.positions.get(m.id);
        if (!fp || !mp) continue;
        edgeLayer.appendChild(svgEl('path', {
          class: 'mm-edge',
          d: edgePath(fp.x, fp.y, mp.x, mp.y, layout.mode),
        }));
      }
    }

    // Paired-meter edges (distinct dashed links).
    for (const [a, b] of model.pairEdges) {
      const pa = layout.positions.get(a);
      const pb = layout.positions.get(b);
      if (!pa || !pb) continue;
      pairLayer.appendChild(svgEl('path', {
        class: 'mm-edge-pair',
        d: pairEdgePath(pa.x, pa.y, pb.x, pb.y),
      }));
    }

    // Family hub nodes.
    for (const fam of model.families) {
      const fp = layout.familyPositions.get(fam.key);
      if (!fp) continue;
      const g = svgEl('g', {
        class: 'mm-node mm-hub',
        'data-family': fam.key,
        tabindex: '-1',
        role: 'treeitem',
        'aria-expanded': 'true',
        'aria-label': `${fam.label} family, ${fam.meters.length} meter${fam.meters.length === 1 ? '' : 's'}`,
        transform: `translate(${fp.x}, ${fp.y})`,
      });
      g.appendChild(svgEl('circle', { class: 'mm-hub-circle', r: 22 }));
      g.appendChild(svgEl('circle', { class: 'mm-focus-ring', r: 27 }));
      const label = svgEl('text', { x: 0, y: -1, 'text-anchor': 'middle' });
      label.textContent = fam.label;
      const count = svgEl('text', { class: 'mm-count', x: 0, y: 11, 'text-anchor': 'middle' });
      count.textContent = `(${fam.meters.length})`;
      g.appendChild(label);
      g.appendChild(count);
      g.addEventListener('mouseenter', () => setActive(null));
      g.addEventListener('focus', () => setActive(null));
      g.addEventListener('keydown', handleKeydown);
      nodeLayer.appendChild(g);
    }

    // Meter leaf nodes.
    for (const fam of model.families) {
      for (const m of fam.meters) {
        const mp = layout.positions.get(m.id);
        if (!mp) continue;
        const g = svgEl('g', {
          class: 'mm-node mm-leaf',
          'data-meter-id': String(m.id),
          'data-family': fam.key,
          tabindex: '-1',
          role: 'treeitem',
          'aria-label': `Meter ${m.id}, ${m.displayName}${m.pairedWith.size ? `, paired with meter ${[...m.pairedWith].join(', ')}` : ''}`,
          transform: `translate(${mp.x}, ${mp.y})`,
        });
        g.appendChild(svgEl('circle', { class: 'mm-leaf-circle', r: 14 }));
        g.appendChild(svgEl('circle', { class: 'mm-focus-ring', r: 18 }));
        const label = svgEl('text', { x: 0, y: 0 });
        label.textContent = String(m.id);
        g.appendChild(label);
        g.addEventListener('mouseenter', () => setActive(m.id));
        g.addEventListener('mouseleave', () => { if (document.activeElement !== g) setActive(null); });
        g.addEventListener('focus', () => setActive(m.id));
        g.addEventListener('blur', () => setActive(null));
        g.addEventListener('click', () => activateMeter(m.id));
        g.addEventListener('keydown', handleKeydown);
        nodeLayer.appendChild(g);
      }
    }

    setFocusIndex(focusIndex);
    if (activeId !== null) setActive(activeId);
  }

  renderEmptyDetail();
  renderGraph();

  // -- responsive re-layout on breakpoint crossing -----------------------
  let lastWasNarrow = container.clientWidth < NARROW_BREAKPOINT;
  let rafPending = false;
  function handleResize() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      const nowNarrow = container.clientWidth < NARROW_BREAKPOINT;
      if (nowNarrow !== lastWasNarrow || layout === null) {
        lastWasNarrow = nowNarrow;
        renderGraph();
      } else if (!nowNarrow) {
        // Radial mode scales continuously with viewBox; a full re-render
        // keeps the arcs proportioned as the container's aspect ratio changes.
        renderGraph();
      }
    });
  }

  let resizeObserver = null;
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
  } else {
    window.addEventListener('resize', handleResize);
  }

  return {
    destroy() {
      if (resizeObserver) resizeObserver.disconnect();
      else window.removeEventListener('resize', handleResize);
      container.innerHTML = '';
    },
    update(newOptions) {
      opts = { ...opts, ...newOptions };
      model = buildModel(opts.meters, opts.pairs);
      activeId = null;
      focusIndex = 0;
      renderEmptyDetail();
      renderGraph();
    },
  };
}

window.mountMeterMap = mountMeterMap;


