/* ================= GHAZALS LIBRARY & READER MODULE (§5.7, §5.8) ================= */
let ghazalShownCount = 30;
let curReaderCol = null;
let curReaderId = null;
let curReaderItem = null;

/* Universal search (round 2): while the box has a query, results merge all
   three collections; the collection segmented buttons then act as a filter
   on those merged results instead of switching which corpus is browsed.
   'all' = no filter. Reset to 'all' whenever the search box is cleared. */
let searchCollectionFilter = 'all';
let ghazalSearchDebounce = null;

// Scans are shown by default; only an explicit "Hide all scans" turns them off.
let showAllScans = true;
try {
  showAllScans = (sessionStorage.getItem('bahr_reader_scans') !== 'false');
} catch (e) {
  showAllScans = true;
}

/* Handbook items store meter id(s) under `meters` (array); Ghalib/Mir extended
   corpora also use `meters`. Some older call sites assumed `m`/`meter`, which is
   why rows showed "#undefined". Always resolve through this helper. */
function mListOf(item) {
  if (!item) return [];
  const src = Array.isArray(item.meters) ? item.meters
    : (Array.isArray(item.m) ? item.m : [item.meter != null ? item.meter : item.m]);
  return src.filter(x => x !== undefined && x !== null && x !== '');
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getLangDir(cs) {
  if (cs === 'ur') return 'lang="ur" dir="rtl"';
  if (cs === 'hi') return 'lang="hi"';
  return 'lang="ur-Latn" dir="ltr"';
}

/* ================= UNIVERSAL SEARCH (round 2 G-search) =================
   One normalizer for Urdu, Devanagari and Roman text, poet names, and
   ghazal numbers, so a single query box can match across all of them and
   across all three collections at once. Diacritic-insensitive on both
   sides: Urdu combining marks/tatweel/ZWNJ are stripped, and Roman text is
   NFD-decomposed so ā/ī/ū/ṭ/ḍ/ṇ/ṣ/ẕ/ḥ/ḳ/ñ all fold to their plain letter
   (which also makes "ḳh" == "kh"); ʿ/ʾ/ʽ/' are dropped outright since they
   don't correspond to a plain-key letter at all. This is deliberately
   separate from normVerseKey() (05-translit-helpers.js) — that one matches
   whole verses across scripts exactly for the corpus dedup/lookup index;
   this one only needs to be forgiving enough for a human typing a search. */
function searchNorm(str) {
  if (!str) return '';
  let s = String(str).toLowerCase();
  s = s.replace(/[ً-ٰٟـ​-‏]/g, '');   // Urdu diacritics, madda, tatweel, ZW*
  s = s.normalize('NFD').replace(/[̀-ͯ]/g, '');           // ā→a, ṭ→t, ñ→n, ḳ→k, …
  s = s.replace(/[ʿʾʽ`'’‘]/g, '');                                   // ayn/hamza marks, apostrophes
  s = s.replace(/[،۔؟!,.;:?"«»()\[\]{}\-–—/]/g, ' ');
  return s.replace(/\s+/g, ' ').trim();
}

/* GHALIB_EXT_DATA/MIR_EXT_DATA only carry the poet's name in Roman ("Ghalib",
   "Mir"); add the Urdu/Devanagari spellings so a search in those scripts can
   find the poet too. Handbook items already carry each ghazal's own
   (Roman-only) poet name, which we index as-is. */
const POET_NAMES = {
  ghalib: ['Ghalib', 'غالب', 'ग़ालिब'],
  mir: ['Mir', 'میر', 'मीर']
};

let GHAZAL_SEARCH_INDEX = null; // built lazily on first search; { col, id, hay } rows
function buildGhazalSearchIndex() {
  const cols = [
    ['handbook', (typeof EXERCISES_DATA !== 'undefined' && Array.isArray(EXERCISES_DATA)) ? EXERCISES_DATA : []],
    ['ghalib', (typeof GHALIB_EXT_DATA !== 'undefined' && Array.isArray(GHALIB_EXT_DATA)) ? GHALIB_EXT_DATA : []],
    ['mir', (typeof MIR_EXT_DATA !== 'undefined' && Array.isArray(MIR_EXT_DATA)) ? MIR_EXT_DATA : []]
  ];
  const idx = [];
  cols.forEach(([col, corpus]) => {
    const poetNames = col === 'handbook' ? null : POET_NAMES[col];
    corpus.forEach(item => {
      const l1 = (item.lines && item.lines[0]) || null;
      const fields = poetNames ? poetNames.slice() : [item.poet || ''];
      fields.push(String(item.id));
      if (l1) fields.push(l1.ur || '', l1.hi || '', l1.ro || '', l1.ascii || '');
      idx.push({ col, id: String(item.id), hay: searchNorm(fields.filter(Boolean).join(' ')) });
    });
  });
  GHAZAL_SEARCH_INDEX = idx;
}
window.buildGhazalSearchIndex = buildGhazalSearchIndex;

/* -> { handbook: Set<id>, ghalib: Set<id>, mir: Set<id> } or null for an empty query.
   All query words must appear (substring) in a row's haystack — good enough for
   short poet-name / first-line / number queries without needing real tokenization. */
function searchGhazalIndex(q) {
  const nq = searchNorm(q);
  if (!nq) return null;
  if (!GHAZAL_SEARCH_INDEX) buildGhazalSearchIndex();
  const terms = nq.split(' ').filter(Boolean);
  const out = { handbook: new Set(), ghalib: new Set(), mir: new Set() };
  GHAZAL_SEARCH_INDEX.forEach(rec => {
    if (terms.every(t => rec.hay.indexOf(t) !== -1)) out[rec.col].add(rec.id);
  });
  return out;
}
window.searchGhazalIndex = searchGhazalIndex;

/* The famous misra for a meter, in the current script, plus its poet — for
   the reader header's "Same bahr as …" reference line. Reads the FAMS/
   famOfMeter globals (owned by the Player & Meter agent's data file) but
   doesn't modify them. */
function meterFamousLine(mId) {
  if (!mId || typeof famOfMeter === 'undefined') return null;
  const fam = famOfMeter[Number(mId)] || famOfMeter[String(mId)];
  if (!fam || !fam.gz || !fam.gz[0]) return null;
  const g = fam.gz[0];
  const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
  const text = (typeof getLineDisplay === 'function') ? getLineDisplay(g, cs) : (g[cs] || g.ur || '');
  return text ? { text, poet: g.p || '' } : null;
}

/* PB-compatible "line" for a bare pattern string (no verse) — lets the
   reader header's ▶ go through the shared pbToggle controller (round 2 G1)
   without a real Scan.explain() result. Same technique as rawPbLine() in
   21-learn.js; requested as a formal pbTogglePattern() helper in
   15-audio.js so every "play the pattern only" button can share it — see
   final report. */
function readerPatternLine(raw, host) {
  if (typeof Scan === 'undefined' || !Scan.parseRaw) return null;
  const toks = Scan.parseRaw(raw).filter(t => t === 'l' || t === 's' || t === 'x' || t === 'c');
  return { e: { syl: toks.map(t => ({ resolved: t })) }, nodes: host ? [...host.querySelectorAll('.blk')] : null, groups: null };
}

function toggleReaderPatternPlay(mId, btn) {
  if (typeof pbToggle !== 'function') return;
  const info = (typeof meterLabelInfo === 'function') ? meterLabelInfo(mId) : null;
  if (!info || !info.pattern) return;
  const host = btn.closest('.reader-header-comp');
  const patHost = host ? host.querySelector('.reader-header-pattern') : null;
  pbToggle('reader-pattern:' + mId, btn, () => {
    const line = readerPatternLine(info.pattern, patHost);
    return line ? [line] : null;
  });
}
window.toggleReaderPatternPlay = toggleReaderPatternPlay;

/* Reader header (§5.8 / round 2): meter number + name as the title, its
   pattern centred underneath, and — clearly marked as a reference, not this
   ghazal's own line — the famous misra for the bahr. Built here rather than
   via renderMeterLabel() (18b-meter-label.js) because that component shows
   the famous misra as the PRIMARY line, which reads as though it were this
   ghazal's own first line. */
function renderGhazalReaderHeader(mId) {
  if (!mId) return '';
  const info = (typeof meterLabelInfo === 'function') ? meterLabelInfo(mId) : null;
  if (!info) return '';
  const canPlay = !!info.pattern;
  const patternHtml = (info.pattern && typeof feetStrip === 'function') ? feetStrip(info.pattern) : '';
  const numHtml = `<span class="mono">${escapeHtml(info.number)}</span>`;
  const titleHtml = info.name ? `${numHtml} · ${escapeHtml(info.name)}` : numHtml;
  const famous = meterFamousLine(mId);
  const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
  const misraScriptCls = cs === 'ur' ? 'urdu' : (cs === 'hi' ? 'deva' : 'roman');
  const refHtml = famous
    ? `<div class="reader-header-ref faint small">Same bahr as <span class="reader-header-misra ${misraScriptCls}">${escapeHtml(famous.text)}</span>${famous.poet ? ' – ' + escapeHtml(famous.poet) : ''}</div>`
    : '';
  return `
    <div class="reader-header-comp">
      <div class="row reader-header-title-row">
        ${canPlay ? `<span class="play sm" role="button" tabindex="0" data-label="Play meter pattern" aria-label="Play meter pattern" onclick="toggleReaderPatternPlay('${info.id}', this)">▶︎</span>` : ''}
        <span class="reader-header-title">${titleHtml}</span>
      </div>
      <div class="reader-header-pattern">${patternHtml}</div>
      ${refHtml}
    </div>
  `;
}
window.renderGhazalReaderHeader = renderGhazalReaderHeader;

/* Fran Pritchett's own number for a ghazal (Ghalib: our id is hers; Mir: ours is sequential,
   hers is source_id, e.g. 0006 → 6). Handbook exercises have none. */
function franNum(col, item) {
  if (!item) return null;
  if (col === 'ghalib') return item.id;
  if (col === 'mir') { const n = parseInt(item.source_id, 10); return isNaN(n) ? item.id : n; }
  return null;
}
window.franNum = franNum;
/* her number as a link to her page for that ghazal (new tab); doesn't open our reader.
   opts.bare (round 3): inside a single-collection list the group header already
   carries the collection, so the row just needs "12 ↗" — no "Ghalib"/"Mir" prefix.
   Keep the full "Ghalib 12 ↗" form (the default) wherever rows from different
   collections mix (search results) and in the reader title. */
function franLinkHTML(col, item, opts) {
  const n = franNum(col, item);
  if (n == null) return '';
  const who = col === 'ghalib' ? 'Ghalib' : 'Mir';
  const bare = !!(opts && opts.bare);
  const label = bare ? String(n) : `${who} ${n}`;
  const title = `Frances Pritchett's page for ${who} ${n}`;
  return item.url
    ? `<a class="fran-link" href="${escapeHtml(item.url)}" target="_blank" rel="noopener" onclick="event.stopPropagation()" title="${escapeHtml(title)}">${label}<span class="ext" aria-hidden="true">↗</span></a>`
    : label;
}
window.franLinkHTML = franLinkHTML;
/* ================= GROUP BY METER (round 3) =================
   Lists group rows by their ghazal's meter — the group header carries the
   meter identity (famous misra + pattern + count) so rows themselves no
   longer repeat the meter name/number. A paired meter (mListOf -> [18, 19])
   groups under the FIRST id, since that's the bahr the ghazal is filed
   under everywhere else (meter filter, franLinkHTML, etc). `rows` can be
   plain corpus items (Handbook/Ghalib/Mir lists) or {col, item} pairs
   (universal search, which mixes collections in one group). */
function buildMeterGroups(rows, getMeterId, getSortId) {
  const map = new Map();
  rows.forEach(r => {
    const key = String(getMeterId(r) || '');
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(r);
  });
  const groups = [...map.entries()].map(([key, its]) => {
    its.sort((a, b) => String(getSortId(a)).localeCompare(String(getSortId(b)), undefined, { numeric: true }));
    return { key, rows: its };
  });
  // Largest group first; ties broken by meter id so ordering is stable.
  groups.sort((a, b) => b.rows.length - a.rows.length || a.key.localeCompare(b.key, undefined, { numeric: true }));
  return groups;
}

function meterGroupHeaderHTML(key, count, open) {
  const info = (key && typeof meterLabelInfo === 'function') ? meterLabelInfo(key) : null;
  const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
  let verseHtml = '';
  if (info && info.verse) {
    const text = (typeof getLineDisplay === 'function') ? getLineDisplay(info.verse, cs) : (info.verse[cs] || info.verse.ur);
    if (text) {
      const scriptCls = cs === 'ur' ? 'urdu' : (cs === 'hi' ? 'deva' : 'roman');
      const langDir = (typeof getLangDir === 'function') ? getLangDir(cs) : '';
      // the group is named after a famous verse in this bahr — often by another poet than this collection's
      verseHtml = `<div class="meter-group-label">Bahr of</div><div class="meter-group-verse ${scriptCls}" ${langDir}>${escapeHtml(text)}</div>` +
        (info.verse.poet ? `<div class="meter-group-poet">– ${escapeHtml(info.verse.poet)}</div>` : '');
    }
  }
  if (!verseHtml) {
    const label = (info && info.name) ? info.name : (key ? '#' + key : 'Unfiled');
    verseHtml = `<div class="meter-group-verse faint">${escapeHtml(label)}</div>`;
  }
  const patternHtml = (info && info.pattern && typeof feetStrip === 'function') ? feetStrip(info.pattern) : '';
  return `
    <div class="meter-group-head${open ? ' open' : ''}" role="button" tabindex="0" aria-expanded="${open ? 'true' : 'false'}"
         onclick="toggleMeterGroup('${escapeHtml(key)}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleMeterGroup('${escapeHtml(key)}')}">
      <div class="meter-group-title">${verseHtml}</div>
      ${patternHtml ? `<div class="meter-group-pattern">${patternHtml}</div>` : ''}
      <div class="meter-group-count faint tiny">${count} ghazal${count === 1 ? '' : 's'} <span class="meter-group-chev" aria-hidden="true">${open ? '▴' : '▾'}</span></div>
    </div>
  `;
}

/* Renders as many whole/partial groups as fit in `shownCount` rows (largest
   groups first, per buildMeterGroups), so "Show N more" always continues
   from exactly where the last render left off — including mid-group. */
/* Every meter group is listed up front as one collapsed line; tap to open its ghazals.
   A search or meter filter (or a single group) opens everything that matches. */
const openMeterGroups = new Set();
function toggleMeterGroup(key) {
  if (openMeterGroups.has(key)) openMeterGroups.delete(key); else openMeterGroups.add(key);
  if (typeof renderGhazalsList === 'function') renderGhazalsList();
}
window.toggleMeterGroup = toggleMeterGroup;
/* #/ghazals/<col>?meter=15 (e.g. from Meter › Look up): open that meter's group and bring it into view.
   Paired meters are grouped under the first of the pair. */
const METER_PAIR_HEAD = { 15: 14, 17: 16, 19: 18, 34: 33 };
function openMeterGroupFor(id) {
  const key = String(METER_PAIR_HEAD[id] || id);
  openMeterGroups.add(key);
  if (typeof renderGhazalsList === 'function') renderGhazalsList();
  // each collection's list has its own groups (the hidden ones too), so scroll to the visible one
  if (typeof setTimeout === 'function') setTimeout(() => {
    const el = [...document.querySelectorAll('[data-mgroup="' + key + '"]')].find(n => n.offsetParent !== null || n.getClientRects().length);
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, 80);
}
window.openMeterGroupFor = openMeterGroupFor;
function renderGroupedRows(groups, shownCount, rowRenderer) {
  const mf = $('ghazalMeterFilter');
  const filtering = !!(($('ghazalSearchInput') && $('ghazalSearchInput').value.trim()) || (mf && mf.value && mf.value !== 'all'));
  let html = '';
  groups.forEach(g => {
    const open = filtering || groups.length === 1 || openMeterGroups.has(g.key);
    html += `<div class="meter-group${open ? ' open' : ''}" data-mgroup="${escapeHtml(g.key)}">` + meterGroupHeaderHTML(g.key, g.rows.length, open);
    if (open) html += `<div class="meter-group-rows">${g.rows.map((r, i) => rowRenderer(r, i, g.rows.length)).join('')}</div>`;
    html += `</div>`;
  });
  const totalRows = groups.reduce((s, g) => s + g.rows.length, 0);
  return { html, shownRows: totalRows, totalRows };   // no "show more": groups are the pagination
}

function getGhazalNavLabel(col, item) {
  if (!item) return '';
  if (col === 'handbook') return item.poet || 'Handbook';
  const n = franNum(col, item);
  if (col === 'ghalib') return `Ghalib ${n}`;
  if (col === 'mir') return `Mir ${n}`;
  return `${col} ${item.id}`;
}

function updateCollectionCounts() {
  const hLen = (typeof EXERCISES_DATA !== 'undefined' && Array.isArray(EXERCISES_DATA)) ? EXERCISES_DATA.length : 24;
  const gLen = (typeof GHALIB_EXT_DATA !== 'undefined' && Array.isArray(GHALIB_EXT_DATA)) ? GHALIB_EXT_DATA.length : 234;
  const mLen = (typeof MIR_EXT_DATA !== 'undefined' && Array.isArray(MIR_EXT_DATA)) ? MIR_EXT_DATA.length : 429;
  const bH = $('colBtnHandbook');
  const bG = $('colBtnGhalib');
  const bM = $('colBtnMir');
  if (bH) bH.textContent = 'Handbook';
  if (bG) bG.textContent = 'Ghalib';
  if (bM) bM.textContent = 'Mir';
  const counts = { handbook: hLen, ghalib: gLen, mir: mLen };
  const col = (typeof activeCollection !== 'undefined') ? activeCollection : 'handbook';
  if ($('ghazalCollectionCount')) $('ghazalCollectionCount').textContent = (counts[col] || hLen) + ' ghazals';
}

function populateGhazalMeterFilter(col) {
  const sel = $('ghazalMeterFilter');
  if (!sel) return;

  const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
  let corpus = [];
  if (col === 'handbook') corpus = (typeof EXERCISES_DATA !== 'undefined') ? EXERCISES_DATA : [];
  else if (col === 'ghalib') corpus = (typeof GHALIB_EXT_DATA !== 'undefined') ? GHALIB_EXT_DATA : [];
  else if (col === 'mir') corpus = (typeof MIR_EXT_DATA !== 'undefined') ? MIR_EXT_DATA : [];

  const meterCounts = {};
  corpus.forEach(item => {
    const dedup = [...new Set(mListOf(item).map(x => String(x)))];
    dedup.forEach(id => {
      meterCounts[id] = (meterCounts[id] || 0) + 1;
    });
  });

  const sortedIds = Object.keys(meterCounts).sort((a, b) => {
    if (meterCounts[b] !== meterCounts[a]) return meterCounts[b] - meterCounts[a];
    return a.localeCompare(b, undefined, { numeric: true });
  });

  const currentVal = sel.value;
  let optsHtml = `<option value="all">All meters (${corpus.length})</option>`;
  sortedIds.forEach(id => {
    let preview = '';
    const info = (typeof meterLabelInfo === 'function') ? meterLabelInfo(id) : null;
    if (info && info.verse) {
      const vText = (typeof getLineDisplay === 'function') ? getLineDisplay(info.verse, cs) : (info.verse[cs] || info.verse.ur);
      preview = vText ? (vText.slice(0, 28) + (vText.length > 28 ? '…' : '')) : (info.pattern || '');
    } else if (info && info.pattern) {
      preview = info.pattern;
    }
    const label = preview ? `${preview} — #${id} (${meterCounts[id]})` : `Meter #${id} (${meterCounts[id]})`;
    optsHtml += `<option value="${id}">${label}</option>`;
  });

  sel.innerHTML = optsHtml;
  if (currentVal && (currentVal === 'all' || sortedIds.includes(currentVal))) {
    sel.value = currentVal;
  } else {
    sel.value = 'all';
  }
}

function onGhazalFilterChange() {
  ghazalShownCount = 30;
  renderGhazalsList();
}
window.onGhazalFilterChange = onGhazalFilterChange;

function onGhazalSearch() {
  ghazalShownCount = 30;
  clearTimeout(ghazalSearchDebounce);
  ghazalSearchDebounce = setTimeout(() => {
    const q = ($('ghazalSearchInput') && $('ghazalSearchInput').value.trim()) || '';
    if (!q) searchCollectionFilter = 'all';
    renderGhazalsList();
    // shareable: the address bar carries the search
    if (typeof setHashQuiet === 'function') setHashQuiet(q ? '/ghazals?q=' + encodeURIComponent(q) : '/ghazals/' + (typeof activeCollection !== 'undefined' ? activeCollection : 'handbook'));
  }, 150);
}
window.onGhazalSearch = onGhazalSearch;

/* Highlight the segmented buttons for whichever meaning currently applies:
   collection switch (normal browsing) or result filter (search active). */
function syncCollectionButtons() {
  const searchActive = !!($('ghazalSearchInput') && $('ghazalSearchInput').value.trim());
  const on = searchActive ? searchCollectionFilter : activeCollection;
  const btns = { handbook: 'colBtnHandbook', ghalib: 'colBtnGhalib', mir: 'colBtnMir' };
  Object.keys(btns).forEach(k => {
    const el = $(btns[k]);
    if (el) el.classList.toggle('on', k === on);
  });
}

function switchCollection(col) {
  if (typeof closeGhazalReader === 'function') closeGhazalReader();   // on mobile the reader covers the tabs
  const searchActive = !!($('ghazalSearchInput') && $('ghazalSearchInput').value.trim());
  if (searchActive) {
    // While a query is active, the segmented control filters the merged
    // cross-collection results instead of switching pages; click the same
    // one again to go back to "all collections".
    searchCollectionFilter = (searchCollectionFilter === col) ? 'all' : col;
    syncCollectionButtons();
    renderGhazalsList();
    return;
  }

  activeCollection = col;
  searchCollectionFilter = 'all';
  syncCollectionButtons();
  if (typeof setHashQuiet === 'function') setHashQuiet(`/ghazals/${col}`);

  const descs = {
    'handbook': 'The handbook\'s exercise ghazals, with Frances Pritchett\'s notes. <a class="fran-link" href="https://franpritchett.com/00ghalib/meterbk/10_ex_01_06.html" target="_blank" rel="noopener">Her exercises<span class="ext">↗</span></a> · <a class="fran-link" href="https://franpritchett.com/00ghalib/meterbk/11_exnotes.html" target="_blank" rel="noopener">answers &amp; notes<span class="ext">↗</span></a>',
    'ghalib': "Ghalib's divan, scanned and meter-checked by the engine.",
    'mir': "Mir Taqi Mir, scanned and meter-checked by the engine."
  };
  if ($('colDesc')) $('colDesc').innerHTML = descs[col] || '';   // descriptions may carry links (trusted, static)

  const eyebrowCounts = {
    handbook: (typeof EXERCISES_DATA !== 'undefined' && Array.isArray(EXERCISES_DATA)) ? EXERCISES_DATA.length : 24,
    ghalib: (typeof GHALIB_EXT_DATA !== 'undefined' && Array.isArray(GHALIB_EXT_DATA)) ? GHALIB_EXT_DATA.length : 234,
    mir: (typeof MIR_EXT_DATA !== 'undefined' && Array.isArray(MIR_EXT_DATA)) ? MIR_EXT_DATA.length : 429
  };
  if ($('ghazalEyebrow')) $('ghazalEyebrow').textContent = '';   // the collection switch already says which one; shown only for search results
  if ($('ghazalCollectionCount')) $('ghazalCollectionCount').textContent = eyebrowCounts[col] + ' ghazals';

  const cHandbook = $('handbookExContainer');
  const cGhalib = $('ghalibContainer');
  const cMir = $('mirContainer');

  if (cHandbook) { cHandbook.classList.toggle('hidden', col !== 'handbook'); cHandbook.style.display = ''; }
  if (cGhalib) { cGhalib.classList.toggle('hidden', col !== 'ghalib'); cGhalib.style.display = ''; }
  if (cMir) { cMir.classList.toggle('hidden', col !== 'mir'); cMir.style.display = ''; }

  ghazalShownCount = 30;
  populateGhazalMeterFilter(col);
  renderGhazalsList();
}
window.switchCollection = switchCollection;

function renderZeroResults(col, selFilter, searchQ) {
  const colNames = { handbook: 'Handbook', ghalib: 'Ghalib', mir: 'Mir' };
  const colName = colNames[col] || col;

  let msg = '';
  let suggestionsHtml = '';

  if (selFilter !== 'all') {
    msg = `No ${colName.toLowerCase()} ghazals in this meter.`;
    const otherCols = ['handbook', 'ghalib', 'mir'].filter(c => c !== col);
    const suggestions = [];

    otherCols.forEach(otherCol => {
      let corpus = [];
      if (otherCol === 'handbook') corpus = (typeof EXERCISES_DATA !== 'undefined') ? EXERCISES_DATA : [];
      else if (otherCol === 'ghalib') corpus = (typeof GHALIB_EXT_DATA !== 'undefined') ? GHALIB_EXT_DATA : [];
      else if (otherCol === 'mir') corpus = (typeof MIR_EXT_DATA !== 'undefined') ? MIR_EXT_DATA : [];

      const count = corpus.filter(item => {
        const mList = mListOf(item).map(String);
        return mList.includes(selFilter);
      }).length;

      if (count > 0) {
        suggestions.push({
          col: otherCol,
          name: colNames[otherCol],
          count: count
        });
      }
    });

    if (suggestions.length > 0) {
      suggestionsHtml = `<div class="zero-suggestions">` + suggestions.map(s => {
        return `<a href="#/ghazals/${s.col}?meter=${selFilter}">${s.name} has ${s.count} ›</a>`;
      }).join('') + `</div>`;
    }
  } else if (searchQ) {
    msg = `No ${colName.toLowerCase()} ghazals match “${escapeHtml(searchQ)}”.`;
  } else {
    msg = `No ${colName.toLowerCase()} ghazals found.`;
  }

  return `
    <div class="zero-state">
      <p>${msg}</p>
      ${suggestionsHtml}
    </div>
  `;
}

function getFilteredGhazals(col) {
  const selVal = $('ghazalMeterFilter') ? $('ghazalMeterFilter').value : 'all';
  const selFilter = (selVal && selVal.trim()) ? selVal.trim() : 'all';
  const searchQ = $('ghazalSearchInput') ? $('ghazalSearchInput').value.trim() : '';
  // Universal search (searchGhazalIndex) covers all scripts + poet + number,
  // diacritic-insensitively; the list views normally don't reach this branch
  // with a query (renderGhazalsList routes those to the merged results
  // instead), but keep it correct for direct callers (e.g. reader prev/next).
  const searchIds = searchQ ? searchGhazalIndex(searchQ) : null;

  if (col === 'handbook') {
    if (typeof EXERCISES_DATA === 'undefined') return [];
    return EXERCISES_DATA.filter(ex => {
      if (selFilter !== 'all') {
        const mList = mListOf(ex).map(String);
        if (!mList.includes(selFilter)) return false;
      }
      if (searchIds && !searchIds.handbook.has(String(ex.id))) return false;
      return true;
    });
  } else {
    const corpus = (col === 'ghalib') ? ((typeof GHALIB_EXT_DATA !== 'undefined') ? GHALIB_EXT_DATA : []) : ((typeof MIR_EXT_DATA !== 'undefined') ? MIR_EXT_DATA : []);
    return corpus.filter(g => {
      if (selFilter !== 'all') {
        const mList = mListOf(g).map(String);
        if (!mList.includes(selFilter)) return false;
      }
      if (searchIds && !searchIds[col].has(String(g.id))) return false;
      return true;
    });
  }
}

function renderGhazalsList() {
  updateCollectionCounts();

  // If reader is currently active, re-render it (e.g. on script change)
  const rView = $('ghazalReaderView');
  if (curReaderCol && curReaderId && rView && !rView.classList.contains('hidden') && rView.style.display !== 'none') {
    openGhazalReader(curReaderCol, curReaderId);
    return;
  }

  const q = $('ghazalSearchInput') ? $('ghazalSearchInput').value.trim() : '';
  if (q) {
    renderUniversalSearchResults(q);
    return;
  }

  const uHost = $('ghazalUniversalResults');
  if (uHost) { uHost.classList.add('hidden'); uHost.style.display = 'none'; }
  const cHandbook = $('handbookExContainer'), cGhalib = $('ghalibContainer'), cMir = $('mirContainer');
  if (cHandbook) { cHandbook.classList.toggle('hidden', activeCollection !== 'handbook'); cHandbook.style.display = ''; }
  if (cGhalib) { cGhalib.classList.toggle('hidden', activeCollection !== 'ghalib'); cGhalib.style.display = ''; }
  if (cMir) { cMir.classList.toggle('hidden', activeCollection !== 'mir'); cMir.style.display = ''; }

  if (activeCollection === 'handbook') {
    renderHandbookList();
  } else if (activeCollection === 'ghalib') {
    renderCorpusList('ghalib');
  } else if (activeCollection === 'mir') {
    renderCorpusList('mir');
  }
}
window.renderGhazalsList = renderGhazalsList;

/* Merged, tagged results across Handbook/Ghalib/Mir for the universal
   search box; searchCollectionFilter (driven by the segmented control)
   narrows this to one collection. */
function renderUniversalSearchResults(q) {
  const uHost = $('ghazalUniversalResults');
  const cHandbook = $('handbookExContainer'), cGhalib = $('ghalibContainer'), cMir = $('mirContainer');
  [cHandbook, cGhalib, cMir].forEach(el => { if (el) { el.classList.add('hidden'); el.style.display = 'none'; } });
  if (!uHost) return;
  uHost.classList.remove('hidden');
  uHost.style.display = 'block';
  syncCollectionButtons();

  const idx = searchGhazalIndex(q);
  const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
  const langDir = getLangDir(cs);
  const colNames = { handbook: 'Handbook', ghalib: 'Ghalib', mir: 'Mir' };
  const cols = (searchCollectionFilter === 'all') ? ['handbook', 'ghalib', 'mir'] : [searchCollectionFilter];

  const rows = [];
  if (idx) {
    cols.forEach(col => {
      const ids = idx[col];
      if (!ids || !ids.size) return;
      const corpus = col === 'handbook' ? ((typeof EXERCISES_DATA !== 'undefined') ? EXERCISES_DATA : [])
        : col === 'ghalib' ? ((typeof GHALIB_EXT_DATA !== 'undefined') ? GHALIB_EXT_DATA : [])
        : ((typeof MIR_EXT_DATA !== 'undefined') ? MIR_EXT_DATA : []);
      corpus.forEach(item => { if (ids.has(String(item.id))) rows.push({ col, item }); });
    });
  }

  if ($('ghazalEyebrow')) {
    const scope = searchCollectionFilter !== 'all' ? colNames[searchCollectionFilter] : 'All collections';
    $('ghazalEyebrow').textContent = `${scope} · ${rows.length} match${rows.length === 1 ? '' : 'es'}`;
  }

  if (!rows.length) {
    const where = searchCollectionFilter !== 'all' ? ` in ${colNames[searchCollectionFilter]}` : '';
    uHost.innerHTML = `<div class="zero-state"><p>No ghazals match &ldquo;${escapeHtml(q)}&rdquo;${where}.</p></div>`;
    return;
  }

  const groups = buildMeterGroups(rows, r => mListOf(r.item)[0], r => r.item.id);
  const { html, shownRows, totalRows } = renderGroupedRows(groups, ghazalShownCount, (r, i, arrLen) => {
    const { col, item } = r;
    const l1 = item.lines && item.lines[0];
    const disp1 = l1 ? ((typeof getLineDisplay === 'function') ? getLineDisplay(l1, cs) : (l1[cs] || l1.ur)) : '';
    const who = col === 'handbook' ? (item.poet || 'Handbook') : colNames[col];
    return `
      <div class="vrow" role="link" tabindex="0" onclick="navigate('/ghazals/${col}/${item.id}')">
        <span class="vnum">${col === 'handbook' ? escapeHtml(getGhazalNavLabel(col, item)) : franLinkHTML(col, item)}</span>
        <div class="vtext">
          <div class="vline" ${langDir}>${disp1}</div>
          <div class="vmeta">
            <span class="search-result-col">${colNames[col]}</span>
            <span>·</span>
            <span>${escapeHtml(who)}</span>
          </div>
        </div>
        <div class="vact"><span class="chevron">›</span></div>
      </div>
      ${i < arrLen - 1 ? '<div class="vrule"></div>' : ''}
    `;
  });
  uHost.innerHTML = html;

  const moreBtn = $('ghazalUniversalMore');
  if (moreBtn) {
    if (totalRows > shownRows) {
      moreBtn.classList.remove('hidden');
      moreBtn.style.display = 'inline-flex';
      moreBtn.textContent = `Show 30 more (${totalRows - shownRows} remaining)`;
      moreBtn.onclick = () => { ghazalShownCount += 30; renderUniversalSearchResults(q); };
    } else {
      moreBtn.classList.add('hidden');
      moreBtn.style.display = 'none';
    }
  }
}
window.renderUniversalSearchResults = renderUniversalSearchResults;

function renderHandbookList() {
  const container = $('exDetailView');
  const chips = $('exPoetChips');
  if (!container) return;
  if (chips) { chips.classList.add('hidden'); chips.style.display = 'none'; }

  const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
  const langDir = getLangDir(cs);
  const selFilter = $('ghazalMeterFilter') ? $('ghazalMeterFilter').value : 'all';
  const searchQ = $('ghazalSearchInput') ? $('ghazalSearchInput').value.toLowerCase().trim() : '';

  const filtered = getFilteredGhazals('handbook');

  if (!filtered.length) {
    container.innerHTML = renderZeroResults('handbook', selFilter, searchQ);
    return;
  }

  // Only 24 exercises total — small enough to group and show in full,
  // no "load more" needed.
  const groups = buildMeterGroups(filtered, ex => mListOf(ex)[0], ex => ex.id);
  const { html } = renderGroupedRows(groups, filtered.length, (ex, idx, arrLen) => {
    const l1 = ex.lines && ex.lines[0];
    const disp1 = l1 ? ((typeof getLineDisplay === 'function') ? getLineDisplay(l1, cs) : (l1[cs] || l1.ur)) : '';

    return `
      <div class="vrow" role="link" tabindex="0" onclick="navigate('/ghazals/handbook/${ex.id}')">
        <span class="vnum vpoet">${escapeHtml(ex.poet || 'Handbook')}</span>
        <div class="vtext">
          <div class="vline" ${langDir}>${disp1}</div>
        </div>
        <div class="vact">
          <span class="chevron">›</span>
        </div>
      </div>
      ${idx < arrLen - 1 ? '<div class="vrule"></div>' : ''}
    `;
  });
  container.innerHTML = html;
}
window.renderHandbookList = renderHandbookList;

function renderCorpusList(col) {
  const listEl = $(col === 'ghalib' ? 'ghalibExtList' : 'mirExtList');
  const moreBtn = $(col === 'ghalib' ? 'ghalibExtMore' : 'mirExtMore');
  if (!listEl) return;

  const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
  const langDir = getLangDir(cs);
  const selFilter = $('ghazalMeterFilter') ? $('ghazalMeterFilter').value : 'all';
  const searchQ = $('ghazalSearchInput') ? $('ghazalSearchInput').value.toLowerCase().trim() : '';

  const filtered = getFilteredGhazals(col);

  if (!filtered.length) {
    listEl.innerHTML = renderZeroResults(col, selFilter, searchQ);
    if (moreBtn) { moreBtn.classList.add('hidden'); moreBtn.style.display = 'none'; }
    return;
  }

  const groups = buildMeterGroups(filtered, g => mListOf(g)[0], g => g.id);
  const { html, shownRows, totalRows } = renderGroupedRows(groups, ghazalShownCount, (g, gi, arrLen) => {
    const l1 = g.lines && g.lines[0];
    const disp1 = l1 ? ((typeof getLineDisplay === 'function') ? getLineDisplay(l1, cs) : (l1[cs] || l1.ur)) : '';
    // Single-collection list: the group header already carries the meter,
    // and the collection is obvious from the tab, so the row is just her
    // number (bare, e.g. "12 ↗") — no "Ghalib"/"Mir" prefix (round 3).
    return `
      <div class="vrow" role="link" tabindex="0" onclick="navigate('/ghazals/${col}/${g.id}')">
        <span class="vnum">${franLinkHTML(col, g, { bare: true }) || escapeHtml('#' + g.id)}</span>
        <div class="vtext">
          <div class="vline" ${langDir}>${disp1}</div>
        </div>
        <div class="vact">
          <span class="chevron">›</span>
        </div>
      </div>
      ${gi < arrLen - 1 ? '<div class="vrule"></div>' : ''}
    `;
  });
  listEl.innerHTML = html;

  if (moreBtn) {
    if (totalRows > shownRows) {
      moreBtn.classList.remove('hidden');
      moreBtn.style.display = 'inline-flex';
      moreBtn.textContent = `Show 30 more (${totalRows - shownRows} remaining)`;
      moreBtn.onclick = () => {
        ghazalShownCount += 30;
        renderCorpusList(col);
      };
    } else {
      moreBtn.classList.add('hidden');
      moreBtn.style.display = 'none';
    }
  }
}
window.renderCorpusList = renderCorpusList;

function showMoreGhalibExt() {
  ghazalShownCount += 30;
  renderCorpusList('ghalib');
}
window.showMoreGhalibExt = showMoreGhalibExt;

function showMoreMirExt() {
  ghazalShownCount += 30;
  renderCorpusList('mir');
}
window.showMoreMirExt = showMoreMirExt;

function showMoreUniversal() {
  ghazalShownCount += 30;
  const q = $('ghazalSearchInput') ? $('ghazalSearchInput').value.trim() : '';
  renderUniversalSearchResults(q);
}
window.showMoreUniversal = showMoreUniversal;

/* ================= IN-PLACE GHAZAL READER (§5.8) ================= */

function openGhazalReader(col, id) {
  curReaderCol = col;
  curReaderId = id;

  const rView = $('ghazalReaderView');
  const lView = $('ghazalListView');
  if (rView) {
    rView.classList.remove('hidden');
    rView.style.display = 'block';
  }
  if (lView) {
    lView.classList.add('hidden');
    lView.style.display = 'none';
  }

  let item = null;
  if (col === 'handbook' && typeof EXERCISES_DATA !== 'undefined') item = EXERCISES_DATA.find(x => String(x.id) === String(id));
  else if (col === 'ghalib' && typeof GHALIB_EXT_DATA !== 'undefined') item = GHALIB_EXT_DATA.find(x => String(x.id) === String(id));
  else if (col === 'mir' && typeof MIR_EXT_DATA !== 'undefined') item = MIR_EXT_DATA.find(x => String(x.id) === String(id));

  curReaderItem = item;
  if (!item) return;

  const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
  const langDir = getLangDir(cs);

  // Title & Header
  const titleEl = $('readerTitle');
  if (titleEl) {
    if (col === 'handbook') {
      titleEl.textContent = item.poet || 'Handbook';
    } else {
      titleEl.innerHTML = franLinkHTML(col, item) || escapeHtml(getGhazalNavLabel(col, item));
    }
  }

  const mId = mListOf(item)[0];
  const rHeader = $('readerHeader');
  if (rHeader) rHeader.innerHTML = renderGhazalReaderHeader(mId);

  // Intro note (Handbook only per §5.8)
  const introDiv = $('readerIntroNote');
  if (introDiv) {
    const introNote = (col === 'handbook' && item.notes && item.notes.intro) ? item.notes.intro : '';
    if (introNote) {
      introDiv.classList.remove('hidden');
      introDiv.style.display = 'block';
      introDiv.innerHTML = `<strong>Pritchett's note:</strong> <span>${escapeHtml(introNote)}</span>`;
    } else {
      introDiv.classList.add('hidden');
      introDiv.style.display = 'none';
      introDiv.innerHTML = '';
    }
  }

  // Couplets host
  const coupletsHost = $('readerCouplets');
  if (!coupletsHost) return;

  const lines = item.lines || [];
  const cCount = Math.floor(lines.length / 2);
  const hasExtra = (lines.length % 2 === 1);

  let cHtml = `
    <div class="row reader-actions">
      <button class="btn ghost sm" id="btnToggleAllScans" onclick="toggleReaderAllScans()">${showAllScans ? 'Hide all scans' : 'Show all scans'}</button>
      <button class="btn link sm faint" onclick="editCurrentInScan('${col}', '${item.id}')">Edit in Scan ›</button>
    </div>
    ${(typeof legendHTML === 'function') ? legendHTML('legend-sticky') : ''}
  `;

  for (let c = 0; c < cCount; c++) {
    const l1 = lines[2 * c];
    const l2 = lines[2 * c + 1];
    if (!l1 || !l2) continue;
    const vNum = c + 1;
    const disp1 = (typeof getLineDisplay === 'function') ? getLineDisplay(l1, cs) : (l1[cs] || l1.ur);
    const disp2 = (typeof getLineDisplay === 'function') ? getLineDisplay(l2, cs) : (l2[cs] || l2.ur);
    const vNote = (col === 'handbook' && item.notes && item.notes.verses && item.notes.verses[vNum]) ? item.notes.verses[vNum] : '';

    cHtml += `
      <div class="card couplet-card">
        <div class="row couplet-head">
          <span class="vnum">Couplet ${vNum}</span>
          <div class="row couplet-acts">
            <span class="play sm" role="button" tabindex="0" aria-label="Play couplet" data-label="Play couplet" data-pb="reader:${c}" onclick="playReaderCoupletByIndex(${c}, null, this)">▶︎</span>
            ${practiceLineBtn(l1, l2, item)}
            <button class="btn ghost sm" onclick="toggleCoupletScan(${c})">Scan</button>
          </div>
        </div>
        <div class="cbox-verse">
          <div class="vline-lg" ${langDir}>${disp1}</div>
          <div class="vline-lg" ${langDir}>${disp2}</div>
        </div>

        <div id="coupletScanBox_${c}" class="couplet-scan-box ${showAllScans ? '' : 'hidden'}">
          <div id="misraScan_${c}_1"></div>
          <div id="misraScan_${c}_2" class="misra-scan-second"></div>
        </div>

        ${vNote ? `
          <div class="note couplet-note">
            <strong>Pritchett's note (verse ${vNum}):</strong>
            <span>${escapeHtml(vNote)}</span>
          </div>
        ` : ''}
      </div>
    `;
  }

  if (hasExtra) {
    const extraLine = lines[lines.length - 1];
    const dispExtra = (typeof getLineDisplay === 'function') ? getLineDisplay(extraLine, cs) : (extraLine[cs] || extraLine.ur);
    cHtml += `
      <div class="card couplet-card">
        <div class="row couplet-head">
          <span class="vnum">Line ${lines.length}</span>
        </div>
        <div class="cbox-verse"><div class="vline-lg" ${langDir}>${dispExtra}</div></div>
      </div>
    `;
  }

  // Footer nav with Prev / Next ghazal links (§5.8)
  let filtered = getFilteredGhazals(col);
  let curIdx = filtered.findIndex(x => String(x.id) === String(id));
  if (curIdx === -1) {
    filtered = (col === 'handbook') ? ((typeof EXERCISES_DATA !== 'undefined') ? EXERCISES_DATA : []) : ((col === 'ghalib') ? ((typeof GHALIB_EXT_DATA !== 'undefined') ? GHALIB_EXT_DATA : []) : ((typeof MIR_EXT_DATA !== 'undefined') ? MIR_EXT_DATA : []));
    curIdx = filtered.findIndex(x => String(x.id) === String(id));
  }
  const prevGhazal = (curIdx > 0) ? filtered[curIdx - 1] : null;
  const nextGhazal = (curIdx >= 0 && curIdx < filtered.length - 1) ? filtered[curIdx + 1] : null;

  cHtml += `
    <div class="reader-footer-nav row">
      ${prevGhazal ? `<button class="btn ghost sm" onclick="navigate('/ghazals/${col}/${prevGhazal.id}')">← ${getGhazalNavLabel(col, prevGhazal)}</button>` : '<span></span>'}
      <button class="btn link sm faint" onclick="editCurrentInScan('${col}', '${item.id}')">Edit in Scan ›</button>
      ${nextGhazal ? `<button class="btn ghost sm" onclick="navigate('/ghazals/${col}/${nextGhazal.id}')">${getGhazalNavLabel(col, nextGhazal)} →</button>` : '<span></span>'}
    </div>
  `;

  coupletsHost.innerHTML = cHtml;

  // Render scans if showAllScans is true
  if (showAllScans) {
    for (let c = 0; c < cCount; c++) {
      populateCoupletScan(lines[2 * c], lines[2 * c + 1], c, mListOf(item));
    }
  }
}
window.openGhazalReader = openGhazalReader;

/* "Practice" button for a couplet: opens the tapper on its first line that can be tapped out; nothing if neither can */
function practiceLineBtn(l1, l2, item) {
  if (typeof prPracticable !== 'function') return '';
  const m = (typeof drMetersOf === 'function' && item) ? drMetersOf(item)[0] : null;   // the ghazal's own baḥr
  const ur = [l1, l2].map(l => l && l.ur).find(u => u && prPracticable(u, m));
  return ur ? `<a class="btn ghost sm" href="${prLinkFor(ur, m)}" title="Tap this line's rhythm yourself">Practice</a>` : '';
}

function closeGhazalReader() {
  curReaderCol = null;
  curReaderId = null;
  curReaderItem = null;

  const rView = $('ghazalReaderView');
  const lView = $('ghazalListView');
  if (rView) {
    rView.classList.add('hidden');
    rView.style.display = 'none';
  }
  if (lView) {
    lView.classList.remove('hidden');
    lView.style.display = 'block';
  }
}
window.closeGhazalReader = closeGhazalReader;

function toggleCoupletScan(c) {
  const box = $(`coupletScanBox_${c}`);
  if (!box) return;
  const isHidden = box.classList.contains('hidden') || box.style.display === 'none';
  box.classList.toggle('hidden', !isHidden);
  box.style.display = '';
  if (isHidden) {
    const lines = getCurrentReaderLines();
    if (lines && lines[2 * c] && lines[2 * c + 1]) {
      populateCoupletScan(lines[2 * c], lines[2 * c + 1], c, mListOf(curReaderItem));
    }
  }
}
window.toggleCoupletScan = toggleCoupletScan;

function toggleReaderAllScans() {
  showAllScans = !showAllScans;
  try {
    sessionStorage.setItem('bahr_reader_scans', showAllScans ? 'true' : 'false');
  } catch (e) {}

  const btn = $('btnToggleAllScans');
  if (btn) btn.textContent = showAllScans ? 'Hide all scans' : 'Show all scans';

  document.querySelectorAll('.couplet-scan-box').forEach(box => {
    box.classList.toggle('hidden', !showAllScans);
    box.style.display = '';
  });

  if (showAllScans) {
    const lines = getCurrentReaderLines();
    if (lines) {
      const cCount = Math.floor(lines.length / 2);
      for (let c = 0; c < cCount; c++) {
        if (lines[2 * c] && lines[2 * c + 1]) {
          populateCoupletScan(lines[2 * c], lines[2 * c + 1], c, mListOf(curReaderItem));
        }
      }
    }
  }
}
window.toggleReaderAllScans = toggleReaderAllScans;

function populateCoupletScan(line1, line2, c, meters) {
  const b1 = $(`misraScan_${c}_1`);
  const b2 = $(`misraScan_${c}_2`);
  const txt = l => (l && typeof l === 'object') ? l.ur : l;
  const obj = l => (l && typeof l === 'object') ? l : null;
  // `meters` is the ghazal's own bahr (from mListOf(item)), e.g. [18,19] for a
  // paired meter. renderLineScan then scans each line only against those
  // meters, instead of whatever the scanner would otherwise guess best.
  if (b1 && typeof renderLineScan === 'function') renderLineScan(txt(line1), b1, obj(line1), meters);
  if (b2 && typeof renderLineScan === 'function') renderLineScan(txt(line2), b2, obj(line2), meters);
}
window.populateCoupletScan = populateCoupletScan;

function getCurrentReaderLines() {
  if (curReaderItem && curReaderItem.lines) {
    return curReaderItem.lines;
  }
  const { parts } = (typeof parseHash === 'function') ? parseHash() : { parts: [] };
  const col = parts[1] || 'handbook';
  const id = parts[2];
  let item = null;
  if (col === 'handbook' && typeof EXERCISES_DATA !== 'undefined') item = EXERCISES_DATA.find(x => String(x.id) === String(id));
  else if (col === 'ghalib' && typeof GHALIB_EXT_DATA !== 'undefined') item = GHALIB_EXT_DATA.find(x => String(x.id) === String(id));
  else if (col === 'mir' && typeof MIR_EXT_DATA !== 'undefined') item = MIR_EXT_DATA.find(x => String(x.id) === String(id));
  return item ? item.lines : null;
}

function playReaderCoupletByIndex(c, start, btn) {
  const lines = getCurrentReaderLines();
  if (!lines || !lines[2 * c] || !lines[2 * c + 1]) return;
  btn = btn || document.querySelector(`[data-pb="reader:${c}"]`);
  const key = 'reader:' + (curReaderItem ? curReaderItem.id : '') + ':' + c;
  pbToggle(key, btn, () => {
    // Playback highlights the scan chips, so make sure they're rendered and visible.
    const box = $(`coupletScanBox_${c}`);
    if (box && box.classList.contains('hidden')) toggleCoupletScan(c);
    else if (box && !box.querySelector('.chip')) populateCoupletScan(lines[2 * c], lines[2 * c + 1], c);
    if (typeof A !== 'undefined' && A.ensure && !A.ensure()) return null;
    if (typeof Scan === 'undefined' || !Scan.scanLine) return null;
    // Play back the fit in the ghazal's own bahr (never the scanner's best
    // guess), matching what populateCoupletScan renders above.
    const meters = mListOf(curReaderItem).map(String);
    const out = [];
    [1, 2].forEach(k => {
      const r = Scan.scanLine(lines[2 * c + k - 1].ur);
      const f = meters.length
        ? r.fits.filter(x => meters.includes(String(x.meter.id))).sort((a, b) => a.c - b.c)[0]
        : r.fits[0];
      if (f) out.push(Object.assign({ e: Scan.explain(r, f) }, pbNodes($(`misraScan_${c}_${k}`))));
    });
    return out;
  }, start);
}
window.playReaderCoupletByIndex = playReaderCoupletByIndex;

/* "ghalib/21" -> that ghazal's Urdu lines joined for the Scan box, or null. Lets Scan carry a short link (#/scan?g=ghalib/21)
   instead of the whole text percent-encoded. */
function ghazalScanText(ref) {
  const [col, id] = String(ref || '').split('/');
  const data = col === 'handbook' ? (typeof EXERCISES_DATA !== 'undefined' ? EXERCISES_DATA : null)
    : col === 'ghalib' ? (typeof GHALIB_EXT_DATA !== 'undefined' ? GHALIB_EXT_DATA : null)
    : col === 'mir' ? (typeof MIR_EXT_DATA !== 'undefined' ? MIR_EXT_DATA : null) : null;
  const item = data && data.find(x => String(x.id) === String(id));
  return item && item.lines ? item.lines.map(l => (l.ur || '').trim()).filter(Boolean).join('\n') : null;
}
window.ghazalScanText = ghazalScanText;

function editCurrentInScan(col, id) {
  const lines = getCurrentReaderLines();
  if (!lines) return;
  scanGhazalRef = col + '/' + id;   // runScan keeps the address short while the text is still this ghazal
  if (typeof navigate === 'function') {
    navigate('/scan');
  } else if (typeof go === 'function') {
    go('scan');
  }
  const txt = lines.map(l => l.ur).join('\n');
  if ($('scanIn')) $('scanIn').value = txt;
  if ($('studioInput')) $('studioInput').value = txt;
  if (typeof runScan === 'function') runScan();
}
window.editCurrentInScan = editCurrentInScan;

function renderExercises() {
  renderGhazalsList();
}
window.renderExercises = renderExercises;

function renderGhalibExt() {
  renderGhazalsList();
}
window.renderGhalibExt = renderGhalibExt;

function renderMirExt() {
  renderGhazalsList();
}
window.renderMirExt = renderMirExt;
