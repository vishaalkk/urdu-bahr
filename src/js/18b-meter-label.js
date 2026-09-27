/* ================= METER LABEL COMPONENT (§6.4) ================= */
/**
 * meterLabelInfo(mOrId) -> {
 *   id: string,
 *   number: string,
 *   name: string,
 *   pattern: string,
 *   verse: { ur: string, hi: string, ro: string, ascii: string } | null,
 *   count: number
 * }
 */
function meterLabelInfo(mOrId) {
  if (!mOrId) return null;
  const rawId = (typeof mOrId === 'object' && mOrId !== null) ? mOrId.id : mOrId;
  const idStr = String(rawId);
  const idNum = Number(rawId);

  // 1. Meter object & pattern
  let mObj = (typeof Scan !== 'undefined' && Scan.METERS) ? Scan.METERS.find(m => String(m.id) === idStr) : null;
  let pattern = mObj ? (mObj.raw || mObj.pattern || '') : '';
  let name = '';
  if (idStr === 'H') {
    name = "Mir's Hindi meter";
  } else if (typeof METERS_DATA !== 'undefined' && METERS_DATA.standard) {
    const meta = METERS_DATA.standard.find(m => String(m.id) === idStr);
    if (meta) {
      name = meta.name || '';
      if (!pattern && meta.pattern) pattern = meta.pattern;
    }
  }

  // 2. Ghazal count across all 3 collections
  let count = 0;
  if (typeof EXERCISES_DATA !== 'undefined' && Array.isArray(EXERCISES_DATA)) {
    EXERCISES_DATA.forEach(e => {
      const match = Array.isArray(e.m) ? e.m.some(x => String(x) === idStr) : String(e.m) === idStr;
      if (match) count++;
    });
  }
  if (typeof GHALIB_EXT_DATA !== 'undefined' && Array.isArray(GHALIB_EXT_DATA)) {
    GHALIB_EXT_DATA.forEach(e => {
      const match = Array.isArray(e.meters) ? e.meters.some(x => String(x) === idStr) : String(e.meter || e.m) === idStr;
      if (match) count++;
    });
  }
  if (typeof MIR_EXT_DATA !== 'undefined' && Array.isArray(MIR_EXT_DATA)) {
    MIR_EXT_DATA.forEach(e => {
      const match = Array.isArray(e.meters) ? e.meters.some(x => String(x) === idStr) : String(e.meter || e.m) === idStr;
      if (match) count++;
    });
  }

  // 3. Verse resolution priority: (1) FAMS, (2) EXERCISES_DATA, (3) GHALIB_EXT_DATA, (4) MIR_EXT_DATA
  let verse = null;
  const fam = (typeof famOfMeter !== 'undefined') ? famOfMeter[idNum || idStr] : null;
  if (fam && fam.gz && fam.gz[0]) {
    const g = fam.gz[0];
    verse = { ur: g.ur || '', hi: g.hi || '', ro: g.ro || '', ascii: g.ascii || '' };
  } else if (typeof FAMS !== 'undefined' && Array.isArray(FAMS)) {
    const fMatch = FAMS.find(f => Array.isArray(f.meters) && f.meters.some(x => String(x) === idStr));
    if (fMatch && fMatch.gz && fMatch.gz[0]) {
      const g = fMatch.gz[0];
      verse = { ur: g.ur || '', hi: g.hi || '', ro: g.ro || '', ascii: g.ascii || '' };
    }
  }

  if (!verse && typeof EXERCISES_DATA !== 'undefined' && Array.isArray(EXERCISES_DATA)) {
    const exMatch = EXERCISES_DATA.find(e => Array.isArray(e.m) ? e.m.some(x => String(x) === idStr) : String(e.m) === idStr);
    if (exMatch && exMatch.lines && exMatch.lines[0]) {
      const l = exMatch.lines[0];
      verse = { ur: l.ur || '', hi: l.hi || '', ro: l.ro || '', ascii: l.ascii || '' };
    }
  }

  if (!verse && typeof GHALIB_EXT_DATA !== 'undefined' && Array.isArray(GHALIB_EXT_DATA)) {
    const ghMatch = GHALIB_EXT_DATA.find(e => Array.isArray(e.meters) ? e.meters.some(x => String(x) === idStr) : String(e.meter || e.m) === idStr);
    if (ghMatch && ghMatch.lines && ghMatch.lines[0]) {
      const l = ghMatch.lines[0];
      verse = { ur: l.ur || '', hi: l.hi || '', ro: l.ro || '', ascii: l.ascii || '' };
    }
  }

  if (!verse && typeof MIR_EXT_DATA !== 'undefined' && Array.isArray(MIR_EXT_DATA)) {
    const mirMatch = MIR_EXT_DATA.find(e => Array.isArray(e.meters) ? e.meters.some(x => String(x) === idStr) : String(e.meter || e.m) === idStr);
    if (mirMatch && mirMatch.lines && mirMatch.lines[0]) {
      const l = mirMatch.lines[0];
      verse = { ur: l.ur || '', hi: l.hi || '', ro: l.ro || '', ascii: l.ascii || '' };
    }
  }

  const number = (idStr.startsWith('R') || idStr.startsWith('r')) ? ('rubāʿī ' + idStr.slice(1)) : (idStr === 'H' ? 'Hindi' : ('#' + idStr));

  return {
    id: idStr,
    number,
    name,
    pattern,
    verse,
    count
  };
}

/**
 * renderMeterLabel(mOrId, opts)
 * opts: { size: 'sm' | 'lg', play: boolean }
 */
function renderMeterLabel(mOrId, opts) {
  const info = meterLabelInfo(mOrId);
  if (!info) return '';
  opts = opts || {};
  const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
  const isRtl = (cs === 'ur');
  const size = opts.size || 'sm';
  const canPlay = opts.play !== false && !!info.pattern;

  let verseText = '';
  if (info.verse) {
    if (typeof getLineDisplay === 'function') {
      verseText = getLineDisplay(info.verse, cs);
    } else {
      verseText = info.verse[cs] || info.verse.ur || '';
    }
  }

  const primaryText = verseText ? `“${verseText}”` : info.pattern;
  const isVerseUrdu = verseText && isRtl;

  let h = `<div class="meter-label-comp ${size==='lg'?'meter-label-lg':'meter-label-sm'}" style="margin:4px 0;">`;
  h += `<div class="row" style="margin:0;align-items:flex-start;gap:10px;">`;
  if (canPlay) {
    h += `<span class="play sm" aria-label="Play meter rhythm" onclick="playPat('${info.pattern}')">▶</span>`;
  }
  h += `<div style="flex:1;min-width:0;">`;
  h += `<div class="meter-label-primary" style="${isVerseUrdu ? 'font-family:var(--urdu);font-size:'+(size==='lg'?'24px':'20px')+';direction:rtl;line-height:1.8;' : 'font-size:'+(size==='lg'?'16px':'14.5px')+';font-weight:500;'}">${primaryText}</div>`;
  if (info.pattern && typeof feetStrip === 'function') {
    h += `<div class="meter-label-pattern" style="margin:4px 0;">${feetStrip(info.pattern)}</div>`;
  }
  h += `<div class="meter-label-meta faint tiny" style="margin-top:2px;">`;
  const metaParts = [];
  if (info.number) metaParts.push(info.number);
  if (info.name) metaParts.push(info.name);
  if (info.count > 0) metaParts.push(`${info.count} ghazals`);
  h += metaParts.join(' · ');
  h += `</div>`;
  h += `</div></div></div>`;
  return h;
}

window.meterLabelInfo = meterLabelInfo;
window.renderMeterLabel = renderMeterLabel;
