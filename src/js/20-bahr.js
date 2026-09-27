/* ================= BAHR & METER LOOK UP (§5.5, §6.4) ================= */
let lookupExpandedId = null;
let lookupFilterKind = 'all';

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
    const labelHtml = (typeof renderMeterLabel === 'function') ? renderMeterLabel(mId, { size: 'sm', play: true }) : '';
    const info = (typeof meterLabelInfo === 'function') ? meterLabelInfo(mId) : null;
    const matchInfo = (typeof bestGhazalLinkForMeter === 'function') ? bestGhazalLinkForMeter(mId) : { count: 0, link: `#/ghazals?meter=${mId}` };

    let h = `<div class="meter-row card ${isExpanded ? 'expanded' : ''}" id="m-row-${idStr}">`;
    h += `<div class="meter-row-header" onclick="toggleMeterLookupExpand('${idStr}', event)">`;
    h += `<div class="fam-label-wrap">${labelHtml}</div>`;
    h += `<button class="icon-btn fam-toggle-btn" aria-label="${isExpanded ? 'Collapse' : 'Expand'}">${isExpanded ? '▴' : '▾'}</button>`;
    h += `</div>`;

    if (isExpanded) {
      h += `<div class="meter-row-details">`;

      // 1. Pattern and foot boxes
      if (info && info.pattern && typeof feetStrip === 'function') {
        h += `<div class="meter-detail-section">`;
        h += `<div class="fam-section-label">Metrical pattern & feet:</div>`;
        h += `<div class="meter-strip-wrap">${feetStrip(info.pattern)}</div>`;
        h += `</div>`;
      } else if (idStr === 'H') {
        h += `<div class="meter-detail-section">`;
        h += `<div class="fam-section-label">Pattern structure:</div>`;
        h += `<div class="fam-allowance">Mir's Hindi meter: about 15 long-beats; every even-numbered long except the 8th may become two shorts.</div>`;
        h += `</div>`;
      }

      // 2. Metadata notes & caesura
      const meta = (typeof METERS_DATA !== 'undefined' && METERS_DATA.standard) ? METERS_DATA.standard.find(x => String(x.id) === idStr) : null;
      if (meta) {
        if (meta.caesura) {
          h += `<div class="meter-meta-notes">Caesura // between hemistich halves</div>`;
        }
        if (meta.notes) {
          h += `<div class="meter-meta-notes">${meta.notes}</div>`;
        }
      }

      // 3. Famous verses from family if available
      const fam = (typeof famOfMeter !== 'undefined') ? famOfMeter[mId] : null;
      if (fam && fam.gz && fam.gz.length) {
        h += `<div class="meter-verses-list">`;
        h += `<div class="fam-section-label">Famous verses in this bahr:</div>`;
        fam.gz.forEach(g => {
          const vDisp = (typeof getLineDisplay === 'function') ? getLineDisplay(g, cs) : (g[cs] || g.ur);
          h += `<div class="ear-sing-header">`;
          h += `<span class="faint tiny">${g.p}:</span>`;
          h += `<span class="ear-verse-text ${isRtl ? 'urdu' : (cs === 'hi' ? 'deva' : '')}">${vDisp}</span>`;
          h += `</div>`;
        });
        h += `</div>`;
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
}

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
