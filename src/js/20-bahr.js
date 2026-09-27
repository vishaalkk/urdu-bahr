/* ================= BAHR & METER LOOK UP (§5.5, §6.4) ================= */
let lookupExpandedId = null;
let lookupFilterKind = 'all';

/* Full couplets for a meter, for Look up. First the family's famous misras, each
   located in a corpus so we can show the whole sher; then, if none, the matla of
   ghazals tagged with this meter (Handbook, then Ghalib, then Mir). */
/* wrapWordsHTML()'d for playback highlight, but getLineDisplay() can tack on an
   "approximate" badge <span> whose own attribute spaces would corrupt naive whitespace
   splitting — strip it first and re-append it outside the word spans. */
function dispWordWrap(l, cs) {
  const full = (typeof getLineDisplay === 'function') ? getLineDisplay(l, cs) : (l[cs] || l.ur || '');
  const m = /^([\s\S]*?)(\s*<span class="pill[^>]*>[\s\S]*?<\/span>)\s*$/.exec(full);
  const plain = m ? m[1] : full;
  const badge = m ? m[2] : '';
  const w = (typeof wrapWordsHTML === 'function') ? wrapWordsHTML(plain) : { html: plain, count: 0 };
  return { html: w.html + badge, count: w.count };
}

var _coupletCache = {};
function _meterCollections() {
  const out = [];
  if (typeof EXERCISES_DATA !== 'undefined' && Array.isArray(EXERCISES_DATA)) out.push(['handbook', EXERCISES_DATA, it => it.poet || 'Handbook', it => it.meters || it.m]);
  if (typeof GHALIB_EXT_DATA !== 'undefined' && Array.isArray(GHALIB_EXT_DATA)) out.push(['ghalib', GHALIB_EXT_DATA, () => 'Ghalib', it => it.meters || it.meter || it.m]);
  if (typeof MIR_EXT_DATA !== 'undefined' && Array.isArray(MIR_EXT_DATA)) out.push(['mir', MIR_EXT_DATA, () => 'Mir', it => it.meters || it.meter || it.m]);
  return out;
}
function coupletsForMeter(mId, max) {
  const idStr = String(mId); max = max || 2;
  if (_coupletCache[idStr]) return _coupletCache[idStr];
  const found = [], seen = new Set();
  const key = t => (typeof normVerseKey === 'function') ? normVerseKey(t || '') : (t || '');
  const add = (col, item, poet, i) => {
    const lines = item.lines || [], a = i - (i % 2), l1 = lines[a], l2 = lines[a + 1];
    if (!l1 || !l2) return;
    const k = col + '|' + item.id + '|' + a; if (seen.has(k)) return; seen.add(k);
    found.push({ l1, l2, poet, col, id: item.id, item });
  };
  const colls = _meterCollections();
  const fam = (typeof famOfMeter !== 'undefined') ? famOfMeter[mId] : null;
  if (fam && fam.gz) fam.gz.forEach(g => {
    if (found.length >= max) return;
    const gk = key(g.ur); if (!gk) return;
    for (const [col, data, poetOf] of colls) {
      const item = data.find(it => (it.lines || []).some(l => key(l.ur) === gk));
      if (item) { add(col, item, poetOf(item), item.lines.findIndex(l => key(l.ur) === gk)); break; }
    }
  });
  for (const [col, data, poetOf, metersOf] of colls) {
    if (found.length >= max) break;
    const item = data.find(it => { const m = metersOf(it); return Array.isArray(m) ? m.some(x => String(x) === idStr) : String(m) === idStr; });
    if (item) add(col, item, poetOf(item), 0);
  }
  return (_coupletCache[idStr] = found.slice(0, max));
}
window.coupletsForMeter = coupletsForMeter;

function toggleMeterLookupExpand(id, e) {
  if (e && e.target && typeof e.target.closest === 'function' && e.target.closest('.play')) return;
  lookupExpandedId = (lookupExpandedId === id) ? null : id;
  renderFams();
  if (typeof setHashQuiet === 'function') setHashQuiet('/meter/lookup' + (lookupExpandedId != null ? '?open=' + lookupExpandedId : ''));
}

function renderFams() {
  const host = $('allMeters');
  if (!host) return;

  const hasOn = el => el && (
    (el.classList && typeof el.classList.contains === 'function' && el.classList.contains('on')) ||
    (typeof el.className === 'string' && el.className.indexOf('on') !== -1)
  );

  let activeKind = lookupFilterKind || 'all';
  if (hasOn($('filterMeterRubai'))) {
    activeKind = 'rubai';
  } else if (hasOn($('filterMeterHindi'))) {
    activeKind = 'hindi';
  } else if (hasOn($('filterMeterAll'))) {
    activeKind = 'all';
  }

  let metersToRender = [];
  if (activeKind === 'rubai') {
    metersToRender = (typeof Scan !== 'undefined' && Scan.METERS) ? Scan.METERS.filter(m => m.kind === 'rubai') : [];
  } else if (activeKind === 'hindi') {
    metersToRender = [{ id: 'H', kind: 'hindi' }];
  } else {
    // All 37 standard classical meters
    metersToRender = (typeof Scan !== 'undefined' && Scan.METERS) ? Scan.METERS.filter(m => m.kind !== 'rubai' && String(m.id) !== 'H') : [];
  }

  const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
  const isRtl = (cs === 'ur');

  const legend = (typeof legendHTML === 'function') ? legendHTML('legend-sticky') : '';
  host.innerHTML = legend + metersToRender.map(m => {
    const mId = m.id;
    const idStr = String(mId);
    const isExpanded = (lookupExpandedId === idStr);
    const cps = coupletsForMeter(mId, 2);
    const labelHtml = (typeof renderMeterLabel === 'function') ? renderMeterLabel(mId, { size: 'sm', play: true, couplet: cps[0] || null }) : '';
    const info = (typeof meterLabelInfo === 'function') ? meterLabelInfo(mId) : null;
    const matchInfo = (typeof bestGhazalLinkForMeter === 'function') ? bestGhazalLinkForMeter(mId) : { count: 0, link: `#/ghazals?meter=${mId}` };

    let h = `<div class="meter-row card ${isExpanded ? 'expanded' : ''}" id="m-row-${idStr}">`;
    h += `<div class="meter-row-header" onclick="toggleMeterLookupExpand('${idStr}', event)">`;
    h += `<div class="fam-label-wrap">${labelHtml}</div>`;
    h += `<button class="icon-btn fam-toggle-btn" aria-label="${isExpanded ? 'Collapse' : 'Expand'}">${isExpanded ? '▴' : '▾'}</button>`;
    h += `</div>`;

    if (isExpanded) {
      h += `<div class="meter-row-details">`;

      // (pattern + feet are already in the header label)
      if (idStr === 'H') {
        h += `<div class="meter-detail-section"><div class="fam-allowance">Mir's Hindi meter: about 15 long-beats; every even-numbered long except the 8th may become two shorts.</div></div>`;
      }

      // 2. Metadata notes & caesura
      const meta = (typeof METERS_DATA !== 'undefined' && METERS_DATA.standard) ? METERS_DATA.standard.find(x => String(x.id) === idStr) : null;
      if (meta) {
        if (meta.caesura) {
          h += `<div class="meter-meta-notes">Caesura // between hemistich halves</div>`;
        }
        // notes start with Pritchett's ASCII name in [brackets] — already shown properly in the header
        const note = (meta.notes || '').replace(/^\s*\[[^\]]*\]\.?\s*/, '').trim();
        if (note) h += `<div class="meter-meta-notes">${note}</div>`;
      }

      h += meterCoupletsHTML(mId, 'lk');

      // 4. Ghazal link
      if (matchInfo.count > 0) {
        h += `<div class="fam-action-row">`;
        h += `<a href="${matchInfo.link}" class="small btn link">${matchInfo.count} ghazals in this meter ›</a>`;
        h += `</div>`;
      }

      h += `</div>`;
    }

    h += `</div>`;
    return h;
  }).join('');

}

/* per-couplet "Scan" toggle: closed by default (reference, not scansion); render the
   syllable chips lazily the first time a box is opened, then just show/hide it. */

/* Famous couplets of a meter as couplet boxes (words light up on ▶, syllable scan behind a toggle).
   pfx keeps element ids unique when the same meter appears in Look up ('lk') and Learn ('fm'). */
function meterCoupletsHTML(mId, pfx) {
  pfx = pfx || 'lk';
  const idStr = String(mId);
  const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
  const isRtl = (cs === 'ur');
  const cps = coupletsForMeter(mId, 2);
  let h = '';
  // the couplet itself; a "Scan" toggle (closed by default) reveals the syllable chips.
  if (cps.length) {
    const langDir = cs === 'ur' ? 'lang="ur" dir="rtl"' : (cs === 'hi' ? 'lang="hi"' : 'lang="ur-Latn" dir="ltr"');
    h += `<div class="meter-couplets">`;
    h += `<div class="fam-section-label">Famous couplets in this bahr</div>`;
    cps.forEach((c, i) => {
      const w1 = dispWordWrap(c.l1, cs);
      const w2 = dispWordWrap(c.l2, cs);
      h += `<div class="card couplet-card">`;
      h += `<div class="row couplet-head"><a class="vnum" href="#/ghazals/${c.col}/${c.id}" onclick="event.stopPropagation()">${c.poet}${c.col !== 'handbook' ? ' ' + ((typeof franNum === 'function' ? franNum(c.col, c.item) : null) || c.id) : ''} ›</a>`;
      h += `<div class="row couplet-acts">`;
      h += `<button class="scan-toggle-btn tiny" id="${pfx}ScanBtn_${idStr}_${i}" aria-expanded="false" onclick="event.stopPropagation();toggleLookupScan('${idStr}',${i},'${pfx}')">Scan ▾</button>`;
      h += `<span class="play sm" role="button" tabindex="0" aria-label="Play couplet" data-label="Play couplet" data-pb="lookup:${idStr},${i},${pfx}" onclick="event.stopPropagation();playLookupCouplet('${idStr}',${i},null,this,'${pfx}')">▶︎</span>`;
      h += `</div></div>`;
      h += `<div class="cbox-verse"><div class="vline-lg" id="${pfx}Words_${idStr}_${i}_1" ${langDir}>${w1.html}</div><div class="vline-lg" id="${pfx}Words_${idStr}_${i}_2" ${langDir}>${w2.html}</div></div>`;
      h += `<div class="couplet-scan-box hidden" id="${pfx}ScanBox_${idStr}_${i}"><div id="${pfx}Scan_${idStr}_${i}_1"></div><div id="${pfx}Scan_${idStr}_${i}_2"></div></div>`;
      h += `</div>`;
    });
    h += `</div>`;
  } else {
    // No ghazal in our collections: fall back to the family's famous misra(s)
    const fam = (typeof famOfMeter !== 'undefined') ? famOfMeter[mId] : null;
    if (fam && fam.gz && fam.gz.length) {
      const vCls = isRtl ? 'urdu' : (cs === 'hi' ? 'deva' : 'ro');
      h += `<div class="meter-couplets"><div class="fam-section-label">Famous lines in this bahr</div>`;
      fam.gz.slice(0, 2).forEach(g => {
        const vDisp = (typeof getLineDisplay === 'function') ? getLineDisplay(g, cs) : (g[cs] || g.ur);
        h += `<figure class="meter-couplet"><div class="mc-line ${vCls}">${vDisp}</div><figcaption>— ${g.p}</figcaption></figure>`;
      });
      h += `</div>`;
    }
  }


  return h;
}
window.meterCoupletsHTML = meterCoupletsHTML;

function toggleLookupScan(mId, i, pfx) {
  pfx = pfx || 'lk';
  const box = $(`${pfx}ScanBox_${mId}_${i}`), btn = $(`${pfx}ScanBtn_${mId}_${i}`);
  if (!box) return;
  const opening = box.classList.contains('hidden');
  box.classList.toggle('hidden');
  if (btn) { btn.textContent = opening ? 'Scan ▴' : 'Scan ▾'; btn.setAttribute('aria-expanded', opening ? 'true' : 'false'); }
  if (opening) {
    if (!box.dataset.filled) {
      const c = coupletsForMeter(mId, 2)[i];
      if (c && typeof renderLineScan === 'function') {
        [c.l1, c.l2].forEach((l, k) => { const el = $(`${pfx}Scan_${mId}_${i}_${k + 1}`); if (el) renderLineScan(l.ur, el, l, mId); });
        box.dataset.filled = '1';
      }
    }
    if (typeof fitChipRows === 'function') fitChipRows(box);
  }
}
window.toggleLookupScan = toggleLookupScan;

function playLookupCouplet(mId, i, start, btn, pfx) {
  pfx = pfx || 'lk';
  const c = coupletsForMeter(mId, 2)[i]; if (!c) return;
  btn = btn || document.querySelector(`[data-pb="lookup:${mId},${i},${pfx}"]`);
  pbToggle('lookup:' + pfx + ':' + mId + ':' + i, btn, () => {
    if (typeof Scan === 'undefined' || !Scan.scanLine) return null;
    const out = [];
    [c.l1, c.l2].forEach((l, k) => {
      const r = Scan.scanLine(l.ur); if (!r || !r.fits || !r.fits.length) return;
      const f = r.fits.find(x => String(x.meter.id) === String(mId)) || r.fits[0];
      const e = Scan.explain(r, f);
      const wordsHost = $(`${pfx}Words_${mId}_${i}_${k + 1}`);
      out.push(Object.assign({ e, words: (typeof pbWordsMatching === 'function') ? pbWordsMatching(wordsHost, e) : null },
        pbNodes($(`${pfx}Scan_${mId}_${i}_${k + 1}`))));
    });
    return out;
  }, start);
}
window.playLookupCouplet = playLookupCouplet;

function famPulsePlay(id, btn) {
  const f = FAMS.find(x => x.id === id);
  if (!f) return;
  const host = btn && btn.closest ? btn.closest('.fam-strip-wrap, .row') : null;
  const nodes = host && typeof host.querySelectorAll === 'function' ? [...host.querySelectorAll('.blk')] : null;
  if (typeof pbTogglePattern === 'function') pbTogglePattern('fampulse:' + id, btn, f.pattern, nodes);
}

function famSing(id, gi, btn) {
  const f = FAMS.find(x => x.id === id);
  if (!f || !f.gz || !f.gz[gi]) return;
  if (typeof singAlong === 'function') singAlong('famsing:' + id + ':' + gi, f.gz[gi].ur, f, $('fs-' + id + '-' + gi), btn);
}

window.renderFams = renderFams;
window.toggleMeterLookupExpand = toggleMeterLookupExpand;
window.famPulsePlay = famPulsePlay;
window.famSing = famSing;
