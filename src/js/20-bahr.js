/* ================= BAHR & METER LOOK UP (§5.5, §6.4) ================= */
let lookupExpandedId = null;
let lookupFilterKind = 'all';

/* Full couplets for a meter, for Look up. First the family's famous misras, each
   located in a corpus so we can show the whole sher; then, if none, the matla of
   ghazals tagged with this meter (Handbook, then Ghalib, then Mir). */
var _coupletCache = {};
function _meterCollections() {
  const out = [];
  if (typeof EXERCISES_DATA !== 'undefined' && Array.isArray(EXERCISES_DATA)) out.push(['handbook', EXERCISES_DATA, it => it.poet || 'Handbook', it => it.m]);
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
    found.push({ l1, l2, poet, col, id: item.id });
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

  host.innerHTML = metersToRender.map(m => {
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

      // 3. Famous couplets in this meter: the same couplet box as the reader (▶, scan, highlight)
      if (cps.length) {
        const disp = l => (typeof getLineDisplay === 'function') ? getLineDisplay(l, cs) : (l[cs] || l.ur);
        const langDir = cs === 'ur' ? 'lang="ur" dir="rtl"' : (cs === 'hi' ? 'lang="hi"' : 'lang="ur-Latn" dir="ltr"');
        h += `<div class="meter-couplets">`;
        h += `<div class="fam-section-label">Famous couplets in this bahr</div>`;
        cps.forEach((c, i) => {
          h += `<div class="card couplet-card">`;
          h += `<div class="row couplet-head"><a class="vnum" href="#/ghazals/${c.col}/${c.id}" onclick="event.stopPropagation()">${c.poet}${c.col !== 'handbook' ? ' ' + c.id : ''} ›</a>`;
          h += `<div class="row couplet-acts"><span class="play sm" role="button" tabindex="0" aria-label="Play couplet" data-label="Play couplet" data-pb="lookup:${idStr},${i}" onclick="event.stopPropagation();playLookupCouplet('${idStr}',${i},null,this)">▶︎</span></div></div>`;
          h += `<div class="cbox-verse"><div class="vline-lg" ${langDir}>${disp(c.l1)}</div><div class="vline-lg" ${langDir}>${disp(c.l2)}</div></div>`;
          h += `<div class="couplet-scan-box"><div id="lkScan_${idStr}_${i}_1"></div><div id="lkScan_${idStr}_${i}_2"></div></div>`;
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

  // fill the expanded row's couplet scans
  if (lookupExpandedId != null && typeof renderLineScan === 'function') {
    coupletsForMeter(lookupExpandedId, 2).forEach((c, i) => {
      [c.l1, c.l2].forEach((l, k) => { const el = $(`lkScan_${lookupExpandedId}_${i}_${k + 1}`); if (el) renderLineScan(l.ur, el, l, lookupExpandedId); });
    });
  }
}

function playLookupCouplet(mId, i, start, btn) {
  const c = coupletsForMeter(mId, 2)[i]; if (!c) return;
  btn = btn || document.querySelector(`[data-pb="lookup:${mId},${i}"]`);
  pbToggle('lookup:' + mId + ':' + i, btn, () => {
    if (typeof Scan === 'undefined' || !Scan.scanLine) return null;
    const out = [];
    [c.l1, c.l2].forEach((l, k) => {
      const r = Scan.scanLine(l.ur); if (!r || !r.fits || !r.fits.length) return;
      const f = r.fits.find(x => String(x.meter.id) === String(mId)) || r.fits[0];
      out.push(Object.assign({ e: Scan.explain(r, f) }, pbNodes($(`lkScan_${mId}_${i}_${k + 1}`))));
    });
    return out;
  }, start);
}
window.playLookupCouplet = playLookupCouplet;

function famPulsePlay(id, el) {
  const f = FAMS.find(x => x.id === id);
  if (!f) return;
  const nodes = el && el.parentNode && typeof el.parentNode.querySelectorAll === 'function' ? [...el.parentNode.querySelectorAll('.blk')] : null;
  playPat(f.pattern, nodes);
}

function famSing(id, gi) {
  const f = FAMS.find(x => x.id === id);
  if (!f || !f.gz || !f.gz[gi]) return;
  singAlong(f.gz[gi].ur, f, $('fs-' + id + '-' + gi));
}

window.renderFams = renderFams;
window.toggleMeterLookupExpand = toggleMeterLookupExpand;
window.famPulsePlay = famPulsePlay;
window.famSing = famSing;
