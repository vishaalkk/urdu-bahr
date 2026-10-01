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
  // urdupoetry.com's "Bah'r: The Backbone of Shaayari" article (Irfan 'Abid', 2001) — its classic
  // couplet for each bahr it names, folded in last so it only adds to (never crowds out) the
  // handbook/Ghalib/Mir examples above. See data/urdupoetry_bahrs.json for the full article extraction.
  if (typeof URDUPOETRY_DATA !== 'undefined' && Array.isArray(URDUPOETRY_DATA)) out.push(['urdupoetry', URDUPOETRY_DATA, it => it.poet || 'Poet', it => it.meters || it.m]);
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

/* Look up › Hindi: why Mir's Hindi meter is a different kind of meter, and how its lines vary.
   Written from Pritchett's Handbook 6.2 and the Mir chart (M1). The strips show the base line
   and two variants, so the "even-numbered long becomes two shorts" rule can be seen, not just read. */
function hindiAboutHTML() {
  const strips = [
    ['The base line', '= = / = = / = = / = = // = = / = = / = = / ='],
    ['2nd long as two shorts', '= - - / = = / = = / = = // = = / = = / = = / ='],
    ['2nd and 6th longs as two shorts', '= - - / = = / = - - / = = // = = / = = / = = / =']
  ].map(r => `<div class="hindi-form"><span class="hindi-form-name small dim">${r[0]}</span>${feetStrip(r[1])}</div>`).join('');
  return `<div class="hindi-about card">
    <h3 class="hindi-about-title">Why this meter is different</h3>
    <p>Almost every bahr is <b>positional</b>: a fixed sequence of long and short syllables, taken from the Arabic and Persian tradition. Mir&rsquo;s Hindi meter is <b>moric</b>, like many Indian meters. What is held steady is the <i>length</i> of the line, not the exact run of syllables. Two shorts count the same as one long.</p>
    <h4>What stays fixed</h4>
    <ul>
      <li>Eight feet to the line.</li>
      <li>The last syllable is long (an extra short may follow it, unscanned, as in every meter).</li>
      <li>Short syllables come in pairs, and the two shorts of a pair may have at most one long between them (<span class="mono">- = -</span>, rare).</li>
    </ul>
    <h4>What varies</h4>
    <p>Any even-numbered long may be said as two shorts, though this is rare for the 8th. So one ghazal can have lines of different syllable counts that are all the same length. This is why a Hindi-meter ghazal can look irregular, line to line, when you scan it as an ordinary meter.</p>
    <div class="hindi-forms">${strips}</div>
    <h4>How long a line is</h4>
    <p>Usually fifteen longs: eight in the first four feet, seven in the last four. Mir and others also use fourteen (seven and seven) and sixteen (eight and eight), and shorter forms turn up too. A half-length form is also used in Urdu.</p>
    <h4>Where it comes from</h4>
    <p>Mir made it famous, though Mir Jafar Zatalli (d. 1712) seems to have used it first, in some long satirical poems. Scholars argue over whether it was invented new, already fits inside the classical system, or is a Hindi meter adapted for Urdu. Most now take the last view. In classical terms it could be called <i>mutaqārib muṡamman muzāʿaf</i> with varying changes, but that name does little to help someone scanning a line.</p>
    <p class="tiny dim">The scanner reads these lines by total length, so it will accept any of the forms above. One line alone proves little, because ordinary sentences can fit this meter. Add the rest of the ghazal.</p>
    <p class="tiny dim">Source: Pritchett, Handbook <a href="https://franpritchett.com/00ghalib/meterbk/06_meters.html" target="_blank" rel="noopener">§6.2 ↗</a>, and her <a href="https://franpritchett.com/00garden/apparatus/txt_meters.html" target="_blank" rel="noopener">chart of Mir&rsquo;s meters ↗</a> (M1).</p>
  </div>`;
}

/* "Collapse" at the foot of an open row: close it and bring its header back into view
   (a long row leaves the header far above, under the pinned legend). */
function collapseMeterRow(id) {
  toggleMeterLookupExpand(id, null);
  setTimeout(() => {
    const el = $('m-row-' + id);
    if (el && typeof window.scrollTo === 'function') window.scrollTo({ top: el.getBoundingClientRect().top + (window.pageYOffset || 0) - 130, behavior: 'smooth' });
  }, 60);
}
window.collapseMeterRow = collapseMeterRow;

function renderFams() {
  const host = $('allMeters');
  if (!host) return;

  const hasOn = el => el && (
    (el.classList && typeof el.classList.contains === 'function' && el.classList.contains('on')) ||
    (typeof el.className === 'string' && el.className.indexOf('on') !== -1)
  );

  if (hasOn($('filterMeterFeet')) && typeof renderFeetCatalog === 'function') renderFeetCatalog();
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
  host.innerHTML = legend + (activeKind === 'hindi' ? hindiAboutHTML() : '') + metersToRender.map(m => {
    const mId = m.id;
    const idStr = String(mId);
    const isExpanded = (lookupExpandedId === idStr);
    const cps = coupletsForMeter(mId, 2);
    const labelHtml = (typeof renderMeterLabel === 'function') ? renderMeterLabel(mId, { size: 'sm', play: true, couplet: cps[0] || null }) : '';
    const info = (typeof meterLabelInfo === 'function') ? meterLabelInfo(mId) : null;
    const matchInfo = (typeof bestGhazalLinkForMeter === 'function') ? bestGhazalLinkForMeter(mId) : { count: 0, link: `#/ghazals?meter=${mId}` };

    // What opening the row would show. A meter with nothing to add (no note, no couplets, no
    // ghazals) is not expandable: its label already carries the pattern, feet and name.
    // Notes start with Pritchett's ASCII name in [brackets], which the header shows properly;
    // "Has caesura." is dropped because the // in the pattern says so and the legend explains it.
    const meta = (typeof METERS_DATA !== 'undefined' && METERS_DATA.standard) ? METERS_DATA.standard.find(x => String(x.id) === idStr) : null;
    const note = meta ? (meta.notes || '').replace(/^\s*\[[^\]]*\]\.?\s*/, '').replace(/^\s*Has caesura\.?\s*/, '').trim() : '';
    const couplets = meterCoupletsHTML(mId, 'lk');
    const expandable = !!(note || couplets.trim() || matchInfo.count > 0);
    const open = expandable && isExpanded;

    let h = `<div class="meter-row card ${open ? 'expanded' : ''} ${expandable ? '' : 'static'}" id="m-row-${idStr}">`;
    if (expandable) {
      h += `<div class="meter-row-header" onclick="toggleMeterLookupExpand('${idStr}', event)">`;
      h += `<div class="fam-label-wrap">${labelHtml}</div>`;
      h += `<button class="icon-btn fam-toggle-btn" aria-label="${open ? 'Collapse' : 'Expand'}" aria-expanded="${open}">${open ? '▴' : '▾'}</button>`;
      h += `</div>`;
    } else {
      h += `<div class="meter-row-header"><div class="fam-label-wrap">${labelHtml}<p class="tiny faint meter-row-none">No ghazals in our collections use this meter.</p></div></div>`;
    }

    if (open) {
      h += `<div class="meter-row-details">`;
      if (note) h += `<div class="meter-meta-notes">${note}</div>`;
      h += couplets;
      if (matchInfo.count > 0) {
        h += `<div class="fam-action-row"><a href="${matchInfo.link}" class="small btn link">${matchInfo.count} ghazals in this meter ›</a></div>`;
      }
      h += `<div class="meter-collapse-row"><button type="button" class="btn link sm faint" onclick="collapseMeterRow('${idStr}')">Collapse ▴</button></div>`;
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
  const cps = coupletsForMeter(mId, 3);
  let h = '';
  // the couplet itself; a "Scan" toggle (closed by default) reveals the syllable chips.
  if (cps.length) {
    const langDir = cs === 'ur' ? 'lang="ur" dir="rtl"' : (cs === 'hi' ? 'lang="hi"' : 'lang="ur-Latn" dir="ltr"');
    h += `<div class="meter-couplets">`;
    h += `<div class="fam-section-label">Famous couplets in this bahr</div>`;
    cps.forEach((c, i) => {
      const w1 = dispWordWrap(c.l1, cs);
      const w2 = dispWordWrap(c.l2, cs);
      // only handbook/Ghalib/Mir have a Ghazals browse page to link to; other collections
      // (e.g. the urdupoetry.com article's couplets) just show the poet's name, unlinked.
      const browsable = c.col === 'handbook' || c.col === 'ghalib' || c.col === 'mir';
      const head = browsable
        ? `<a class="vnum" href="#/ghazals/${c.col}/${c.id}" onclick="event.stopPropagation()">${c.poet}${c.col !== 'handbook' ? ' ' + ((typeof franNum === 'function' ? franNum(c.col, c.item) : null) || c.id) : ''} ›</a>`
        : `<span class="vnum">${c.poet} — urdupoetry.com</span>`;
      h += `<div class="card couplet-card">`;
      h += `<div class="row couplet-head">${head}`;
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


/* ================= FEET CATALOG (Meter › Look up › Feet, Handbook ch. 5) =================
   Built from the engine's FEET table; "used in" is computed from the meter list, so it can't drift from it. */
const FEET_SALIM = new Set(['slll', 'lsll', 'llsl', 'lsl', 'sll', 'sslsl']);
/* where the Handbook says a foot turns up (our words; everything else about a foot is computed) */
const FEET_NOTES = {
  lls: 'Usually the first foot of a line; not in rubāʿī.',
  lssl: 'Rare.',
  l: 'Usually the last foot; rare outside rubāʿī.',
  slls: 'Seldom the first or the last foot.',
  sslsl: 'Rare.',
  ssls: 'Very rare; nearly always the first and third foot.',
  ssl: 'Almost never the first foot.'
};
let feetFilter = 'all', feetQuery = '';
function feetSimple(t) { return (t || '').toString().normalize('NFD').replace(/[̀-ͯʻʿʼ'’·\s.\-]/g, '').toLowerCase(); }
function feetRows() {
  const used = {};
  (Scan.METERS || []).forEach(m => {
    if (m.kind === 'hindi') return;
    const seen = new Set();
    Scan.patternFeet(m.raw).forEach(f => { const k = f.pat; if (!seen.has(k)) { seen.add(k); (used[k] = used[k] || []).push(m.id); } });
  });
  const byUr = {};
  Object.keys(Scan.FEET).forEach(k => { const u = Scan.FEET[k][1]; (byUr[u] = byUr[u] || []).push(k); });
  return Object.keys(Scan.FEET).map(pat => {
    const ro = Scan.FEET[pat][0], ur = Scan.FEET[pat][1];
    const toks = pat.split('');
    const twins = byUr[ur].filter(k => k !== pat);
    return {
      pat, ro, ur, toks, raw: toks.map(t => t === 'l' ? '=' : '-').join(' '),
      salim: FEET_SALIM.has(pat),
      twin: twins.length ? twins.map(k => Scan.FEET[k][0].join('·') + ' (' + k.split('').map(t => t === 'l' ? '=' : '–').join(' ') + ')').join(', ') : '',
      meters: (used[pat] || []).slice().sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }))
    };
  });
}
/* a meter number as a link that opens that meter in Look up; rubāʿī ids are "R5" → "rubāʿī 5" */
function feetMeterLink(id) {
  const rub = /^R/.test(String(id)), n = String(id).replace(/^R/, '');
  return `<a class="ft-meter" href="#/meter/lookup?open=${id}" title="Open ${rub ? 'rubāʿī form' : 'meter'} ${n} in Look up">${rub ? 'rubāʿī ' : 'meter '}${n}</a>`;
}
function filterFeet(kind, query) {
  if (kind) {
    feetFilter = kind;
    ['all', 'salim', 'muzahaf', 'long', 'short'].forEach(k => { const b = $('feetF_' + k); if (b && b.classList) b.classList.toggle('on', k === kind); });
  }
  if (typeof query === 'string') feetQuery = query;
  renderFeetCatalog();
}
function renderFeetCatalog() {
  const host = $('feetList'); if (!host || typeof Scan === 'undefined') return;
  const all = feetRows();
  const q = feetSimple(feetQuery), qp = feetQuery.replace(/[–−]/g, '-').replace(/\s+/g, '');
  const rows = all.filter(r => {
    if (feetFilter === 'salim' && !r.salim) return false;
    if (feetFilter === 'muzahaf' && r.salim) return false;
    if (feetFilter === 'long' && r.toks[0] !== 'l') return false;
    if (feetFilter === 'short' && r.toks[0] !== 's') return false;
    if (!q && !qp) return true;
    const isPat = /^[=\-]+$/.test(qp);
    return isPat ? r.raw.replace(/\s/g, '').startsWith(qp) : (feetSimple(r.ro.join('')).includes(q) || r.ur.includes(feetQuery.trim()));
  });
  if ($('feetCount')) $('feetCount').textContent = `Showing ${rows.length} of ${all.length} feet`;
  host.innerHTML = rows.length ? `<table class="feet-table">
    <thead><tr><th>Foot</th><th>Syllables</th><th>Pattern</th><th>Where it occurs</th><th><span class="sr-only">Play</span></th></tr></thead>
    <tbody>` + rows.map(r => {
    const idx = all.indexOf(r);
    const notes = [FEET_NOTES[r.pat], r.twin ? 'Double identity: also ' + r.twin + '. The meter decides which.' : '',
      r.meters.length ? 'Found in ' + r.meters.map(feetMeterLink).join(', ') + '.' : 'Only as a variant inside longer feet.'].filter(Boolean).join(' ');
    return `<tr class="foot-tr">
      <td class="ft-name"><span class="ft-mark" title="${r.salim ? 'Sālim: an original foot' : 'Altered: a variant of an original foot'}">${r.salim ? '&#9733;' : '&#9671;'}</span><span class="urdu ur-always foot-row-ur">${r.ur}</span><span class="fn">${r.ro.join('')}</span></td>
      <td class="ft-syl mono">${r.ro.join(' · ')}</td>
      <td class="ft-pat"><span class="strip tight">${strip(r.toks)}</span></td>
      <td class="ft-notes small dim">${notes}</td>
      <td class="ft-play"><button class="play sm" aria-label="Play ${r.ro.join('')}" onclick="feetRowPlay(${idx},this)">▶︎</button></td>
    </tr>`;
  }).join('') + '</tbody></table>' : '<p class="small dim">No foot matches.</p>';
}
function feetRowPlay(i, btn) {
  const r = feetRows()[i]; if (!r || typeof pbTogglePattern !== 'function') return;
  const row = btn.closest('.foot-tr');
  pbTogglePattern('footrow:' + r.pat, btn, r.raw, row ? [...row.querySelectorAll('.blk')] : null);
}
window.filterFeet = filterFeet; window.renderFeetCatalog = renderFeetCatalog; window.feetRowPlay = feetRowPlay;
