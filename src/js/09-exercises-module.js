/* ================= GHAZALS LIBRARY & READER MODULE (§5.7, §5.8) ================= */
let ghazalShownCount = 30;
let curReaderCol = null;
let curReaderId = null;
let curReaderItem = null;

// Scans are shown by default; only an explicit "Hide all scans" turns them off.
let showAllScans = true;
try {
  showAllScans = (sessionStorage.getItem('bahr_reader_scans') !== 'false');
} catch (e) {
  showAllScans = true;
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

function getGhazalNavLabel(col, item) {
  if (!item) return '';
  if (col === 'handbook') return `Ex. ${item.id}`;
  if (col === 'ghalib') return `Ghalib ${item.id}`;
  if (col === 'mir') return `Mir ${item.id}`;
  return `${col} ${item.id}`;
}

function updateCollectionCounts() {
  const hLen = (typeof EXERCISES_DATA !== 'undefined' && Array.isArray(EXERCISES_DATA)) ? EXERCISES_DATA.length : 24;
  const gLen = (typeof GHALIB_EXT_DATA !== 'undefined' && Array.isArray(GHALIB_EXT_DATA)) ? GHALIB_EXT_DATA.length : 185;
  const mLen = (typeof MIR_EXT_DATA !== 'undefined' && Array.isArray(MIR_EXT_DATA)) ? MIR_EXT_DATA.length : 429;
  const bH = $('colBtnHandbook');
  const bG = $('colBtnGhalib');
  const bM = $('colBtnMir');
  if (bH) bH.textContent = `Handbook ${hLen}`;
  if (bG) bG.textContent = `Ghalib ${gLen}`;
  if (bM) bM.textContent = `Mir ${mLen}`;
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
    const mList = Array.isArray(item.meters) ? item.meters : (Array.isArray(item.m) ? item.m : [item.meter || item.m]);
    const dedup = [...new Set(mList.filter(Boolean).map(x => String(x)))];
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
  renderGhazalsList();
}
window.onGhazalSearch = onGhazalSearch;

function switchCollection(col) {
  activeCollection = col;
  const btns = {
    'handbook': 'colBtnHandbook',
    'ghalib': 'colBtnGhalib',
    'mir': 'colBtnMir'
  };
  Object.keys(btns).forEach(k => {
    const el = $(btns[k]);
    if (el) el.classList.toggle('on', k === col);
  });

  const descs = {
    'handbook': "The handbook's exercise ghazals, with Frances Pritchett's notes.",
    'ghalib': "Ghalib's divan, scanned and meter-checked by the engine.",
    'mir': "Mir Taqi Mir, scanned and meter-checked by the engine."
  };
  if ($('colDesc')) $('colDesc').textContent = descs[col] || '';

  const eyebrowNames = { handbook: 'Handbook', ghalib: 'Ghalib', mir: 'Mir' };
  const eyebrowCounts = {
    handbook: (typeof EXERCISES_DATA !== 'undefined' && Array.isArray(EXERCISES_DATA)) ? EXERCISES_DATA.length : 24,
    ghalib: (typeof GHALIB_EXT_DATA !== 'undefined' && Array.isArray(GHALIB_EXT_DATA)) ? GHALIB_EXT_DATA.length : 185,
    mir: (typeof MIR_EXT_DATA !== 'undefined' && Array.isArray(MIR_EXT_DATA)) ? MIR_EXT_DATA.length : 429
  };
  if ($('ghazalEyebrow')) $('ghazalEyebrow').textContent = `${eyebrowNames[col] || col} · ${eyebrowCounts[col] || 0} ghazals`;

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
        const mList = Array.isArray(item.meters) ? item.meters.map(String) : (Array.isArray(item.m) ? item.m.map(String) : [String(item.meter || item.m)]);
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
  const searchQ = $('ghazalSearchInput') ? $('ghazalSearchInput').value.toLowerCase().trim() : '';

  if (col === 'handbook') {
    if (typeof EXERCISES_DATA === 'undefined') return [];
    return EXERCISES_DATA.filter(ex => {
      if (selFilter !== 'all') {
        const mList = Array.isArray(ex.m) ? ex.m.map(String) : [String(ex.m)];
        if (!mList.includes(selFilter)) return false;
      }
      if (searchQ) {
        const poetMatch = (ex.poet || '').toLowerCase().includes(searchQ);
        const l1 = ex.lines && ex.lines[0];
        const lineMatch = l1 && (
          (l1.ur || '').toLowerCase().includes(searchQ) ||
          (l1.hi || '').toLowerCase().includes(searchQ) ||
          (l1.ro || '').toLowerCase().includes(searchQ) ||
          (l1.ascii || '').toLowerCase().includes(searchQ)
        );
        if (!poetMatch && !lineMatch) return false;
      }
      return true;
    });
  } else {
    const corpus = (col === 'ghalib') ? ((typeof GHALIB_EXT_DATA !== 'undefined') ? GHALIB_EXT_DATA : []) : ((typeof MIR_EXT_DATA !== 'undefined') ? MIR_EXT_DATA : []);
    return corpus.filter(g => {
      if (selFilter !== 'all') {
        const mList = Array.isArray(g.meters) ? g.meters.map(String) : [String(g.meter || g.m)];
        if (!mList.includes(selFilter)) return false;
      }
      if (searchQ) {
        const poetMatch = (col === 'ghalib' ? 'ghalib' : 'mir').includes(searchQ);
        const l1 = g.lines && g.lines[0];
        const lineMatch = l1 && (
          (l1.ur || '').toLowerCase().includes(searchQ) ||
          (l1.hi || '').toLowerCase().includes(searchQ) ||
          (l1.ro || '').toLowerCase().includes(searchQ) ||
          (l1.ascii || '').toLowerCase().includes(searchQ)
        );
        if (!poetMatch && !lineMatch) return false;
      }
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

  if (activeCollection === 'handbook') {
    renderHandbookList();
  } else if (activeCollection === 'ghalib') {
    renderCorpusList('ghalib');
  } else if (activeCollection === 'mir') {
    renderCorpusList('mir');
  }
}
window.renderGhazalsList = renderGhazalsList;

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

  container.innerHTML = filtered.map((ex, idx) => {
    const l1 = ex.lines && ex.lines[0];
    const disp1 = l1 ? ((typeof getLineDisplay === 'function') ? getLineDisplay(l1, cs) : (l1[cs] || l1.ur)) : '';
    const mStr = Array.isArray(ex.m) ? ex.m.map(x => '#' + x).join('/') : '#' + ex.m;

    return `
      <div class="vrow" role="link" tabindex="0" onclick="navigate('/ghazals/handbook/${ex.id}')">
        <span class="vnum">Ex. ${ex.id}</span>
        <div class="vtext">
          <div class="vline" ${langDir}>${disp1}</div>
          <div class="vmeta">
            <span>${escapeHtml(ex.poet)}</span>
            <span>·</span>
            <span class="mono">${mStr}</span>
          </div>
        </div>
        <div class="vact">
          <span class="chevron">›</span>
        </div>
      </div>
      ${idx < filtered.length - 1 ? '<div class="vrule"></div>' : ''}
    `;
  }).join('');
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
  const shown = filtered.slice(0, ghazalShownCount);
  const colName = (col === 'ghalib') ? 'Ghalib' : 'Mir';

  if (!filtered.length) {
    listEl.innerHTML = renderZeroResults(col, selFilter, searchQ);
    if (moreBtn) { moreBtn.classList.add('hidden'); moreBtn.style.display = 'none'; }
    return;
  }

  listEl.innerHTML = shown.map((g, gi) => {
    const l1 = g.lines && g.lines[0];
    const disp1 = l1 ? ((typeof getLineDisplay === 'function') ? getLineDisplay(l1, cs) : (l1[cs] || l1.ur)) : '';
    const mStr = Array.isArray(g.meters) ? g.meters.map(x => '#' + x).join('/') : '#' + (g.meter || g.m);
    const lineCount = g.lines ? g.lines.length : 0;

    return `
      <div class="vrow" role="link" tabindex="0" onclick="navigate('/ghazals/${col}/${g.id}')">
        <span class="vnum">${colName} ${g.id}</span>
        <div class="vtext">
          <div class="vline" ${langDir}>${disp1}</div>
          <div class="vmeta">
            <span>${lineCount} lines</span>
            <span>·</span>
            <span class="mono">${mStr}</span>
          </div>
        </div>
        <div class="vact">
          <span class="chevron">›</span>
        </div>
      </div>
      ${gi < shown.length - 1 ? '<div class="vrule"></div>' : ''}
    `;
  }).join('');

  if (moreBtn) {
    if (filtered.length > shown.length) {
      moreBtn.classList.remove('hidden');
      moreBtn.style.display = 'inline-flex';
      moreBtn.textContent = `Show 30 more (${filtered.length - shown.length} remaining)`;
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
      titleEl.textContent = `Ex. ${item.id} · ${item.poet || 'Handbook'}`;
    } else {
      const colCap = col === 'ghalib' ? 'Ghalib' : 'Mir';
      titleEl.textContent = `${colCap} ${item.id} · ${colCap}`;
    }
  }

  const mId = Array.isArray(item.meters) ? item.meters[0] : (Array.isArray(item.m) ? item.m[0] : (item.meter || item.m));
  const rHeader = $('readerHeader');
  if (rHeader) {
    rHeader.innerHTML = (typeof renderMeterLabel === 'function') ? renderMeterLabel(mId, { size: 'lg', play: true }) : '';
  }

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
    ${(typeof legendHTML === 'function') ? legendHTML('top') : ''}
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
            <span class="play sm" role="button" tabindex="0" aria-label="Play couplet" onclick="playReaderCoupletByIndex(${c})">▶</span>
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
      populateCoupletScan(lines[2 * c], lines[2 * c + 1], c);
    }
  }
}
window.openGhazalReader = openGhazalReader;

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
      populateCoupletScan(lines[2 * c], lines[2 * c + 1], c);
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
          populateCoupletScan(lines[2 * c], lines[2 * c + 1], c);
        }
      }
    }
  }
}
window.toggleReaderAllScans = toggleReaderAllScans;

function populateCoupletScan(line1, line2, c) {
  const b1 = $(`misraScan_${c}_1`);
  const b2 = $(`misraScan_${c}_2`);
  const txt = l => (l && typeof l === 'object') ? l.ur : l;
  const obj = l => (l && typeof l === 'object') ? l : null;
  if (b1 && typeof renderLineScan === 'function') renderLineScan(txt(line1), b1, obj(line1));
  if (b2 && typeof renderLineScan === 'function') renderLineScan(txt(line2), b2, obj(line2));
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

function playReaderCoupletByIndex(c) {
  const lines = getCurrentReaderLines();
  if (!lines || !lines[2 * c] || !lines[2 * c + 1]) return;
  // Playback highlights the scan chips, so make sure they're rendered and visible.
  const box = $(`coupletScanBox_${c}`);
  if (box && box.classList.contains('hidden')) toggleCoupletScan(c);
  else if (box && !box.querySelector('.chip')) populateCoupletScan(lines[2 * c], lines[2 * c + 1], c);
  const b1 = $(`misraScan_${c}_1`);
  const b2 = $(`misraScan_${c}_2`);
  const nodes1 = b1 ? [...b1.querySelectorAll('.chip')].sort((a,b)=>a.dataset.i-b.dataset.i) : null;
  const groups1 = b1 ? [...b1.querySelectorAll('.fgrp')] : null;
  const nodes2 = b2 ? [...b2.querySelectorAll('.chip')].sort((a,b)=>a.dataset.i-b.dataset.i) : null;
  const groups2 = b2 ? [...b2.querySelectorAll('.fgrp')] : null;

  if (typeof A !== 'undefined' && A.ensure && !A.ensure()) return;
  if (typeof Scan === 'undefined' || !Scan.scanLine) return;
  const r1 = Scan.scanLine(lines[2 * c].ur);
  const r2 = Scan.scanLine(lines[2 * c + 1].ur);
  if (r1 && r1.fits && r1.fits.length && r2 && r2.fits && r2.fits.length) {
    const e1 = Scan.explain(r1, r1.fits[0]);
    const e2 = Scan.explain(r2, r2.fits[0]);
    if (typeof playEx === 'function') {
      const dur = playEx(e1, nodes1, groups1);
      playLater(() => {
        playEx(e2, nodes2, groups2);
      }, (dur || 0) * 1000 + 350);
    }
  }
}
window.playReaderCoupletByIndex = playReaderCoupletByIndex;

function editCurrentInScan(col, id) {
  const lines = getCurrentReaderLines();
  if (!lines) return;
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
