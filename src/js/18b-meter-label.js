/* ʿarūz terms: Pritchett's ASCII-style meter names (x = ḳh, z = ẕ/ẓ …) → proper
   romanization (same scheme as the app's transliteration) and Urdu spelling. */
const ARUZ_TERMS = {
  hazaj:['hazaj','ہزج'], ramal:['ramal','رمل'], rajaz:['rajaz','رجز'], 'kāmil':['kāmil','کامل'],
  mujtas:['mujtas̱','مجتث'], munsarih:['munsariḥ','منسرح'], 'mutadārik':['mutadārik','متدارک'],
  'mutaqārib':['mutaqārib','متقارب'], 'muzāriʻ':['muẓāriʿ','مضارع'], 'sarīʻ':['sarīʿ','سریع'],
  'xafīf':['ḳhafīf','خفیف'],
  musamman:['mus̱amman','مثمن'], musaddas:['musaddas','مسدس'],
  'sālim':['sālim','سالم'], axrab:['aḳhrab','اخرب'], axram:['aḳhram','اخرم'], ashtar:['ashtar','اشتر'],
  'maqbūz':['maqbūẓ','مقبوض'], 'mahzūf':['maḥẕūf','محذوف'], 'makfūf':['makfūf','مکفوف'],
  'maxbūn':['maḳhbūn','مخبون'], 'maqtūʻ':['maqt̤ūʿ','مقطوع'], 'matvī':['mat̤vī','مطوی'],
  'maksūf':['maksūf','مکسوف'], 'manhūr':['manḥūr','منحور'], 'muzāʻaf':['muẓāʿaf','مضاعف'],
  aslam:['aslam','اسلم'], asram:['as̱ram','اثرم'], 'mashkūl':['mashkūl','مشکول']
};
/* aruzName(raw) -> { ro: "Ḳhafīf musaddas maḳhbūn …", ur: "خفیف مسدس مخبون …" | '' }
   Unknown words pass through unchanged; ur is '' unless every word is known. */
function aruzName(raw) {
  if (!raw) return { ro: '', ur: '' };
  let allKnown = true;
  const parts = String(raw).split(/(\s+|\s*\/\s*)/);
  const ro = parts.map(w => { const t = ARUZ_TERMS[w]; if (!t && /\S/.test(w) && !/\//.test(w)) allKnown = false; return t ? t[0] : w; }).join('');
  const ur = allKnown ? parts.map(w => ARUZ_TERMS[w] ? ARUZ_TERMS[w][1] : (/\//.test(w) ? ' / ' : w)).join('').replace(/\s+/g, ' ').trim() : '';
  return { ro: ro.charAt(0).toUpperCase() + ro.slice(1), ur };
}
window.aruzName = aruzName;

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
/* Mir's Hindi meter as Pritchett charts it (M1): eight feet of two longs, 15 long-beats in all.
   Any even-numbered long may be two shorts instead (rarely the 8th); see the note in Look up. */
const HINDI_PATTERN = '= = / = = / = = / = = // = = / = = / = = / =';

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
    if (!pattern || pattern === 'Hindi') pattern = HINDI_PATTERN;   // the scanner's synthetic 'H' fit carries no pattern of its own
  } else if (typeof METERS_DATA !== 'undefined' && METERS_DATA.standard) {
    const meta = METERS_DATA.standard.find(m => String(m.id) === idStr);
    if (meta) {
      name = aruzName(meta.name || '').ro;
      if (!pattern && meta.pattern) pattern = meta.pattern;
    }
  }

  // 2. Ghazal count across all 3 collections
  let count = 0;
  if (typeof EXERCISES_DATA !== 'undefined' && Array.isArray(EXERCISES_DATA)) {
    EXERCISES_DATA.forEach(e => {
      const em = e.meters || e.m; const match = Array.isArray(em) ? em.some(x => String(x) === idStr) : String(em) === idStr;
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

  if (typeof OTHERS_DATA !== 'undefined' && Array.isArray(OTHERS_DATA)) {
    OTHERS_DATA.forEach(e => { if (Array.isArray(e.meters) && e.meters.some(x => String(x) === idStr)) count++; });
  }

  // 3. Verse resolution priority: (1) FAMS, (2) EXERCISES_DATA, (3) GHALIB_EXT_DATA, (4) MIR_EXT_DATA
  let verse = null;
  const fam = (typeof famOfMeter !== 'undefined') ? famOfMeter[idNum || idStr] : null;
  if (fam && fam.gz && fam.gz[0]) {
    const g = fam.gz[0];
    verse = { ur: g.ur || '', hi: g.hi || '', ro: g.ro || '', ascii: g.ascii || '', poet: g.p || '' };
  } else if (typeof FAMS !== 'undefined' && Array.isArray(FAMS)) {
    const fMatch = FAMS.find(f => Array.isArray(f.meters) && f.meters.some(x => String(x) === idStr));
    if (fMatch && fMatch.gz && fMatch.gz[0]) {
      const g = fMatch.gz[0];
      verse = { ur: g.ur || '', hi: g.hi || '', ro: g.ro || '', ascii: g.ascii || '', poet: g.p || '' };
    }
  }

  if (!verse && typeof EXERCISES_DATA !== 'undefined' && Array.isArray(EXERCISES_DATA)) {
    const exMatch = EXERCISES_DATA.find(e => { const em = e.meters || e.m; return Array.isArray(em) ? em.some(x => String(x) === idStr) : String(em) === idStr; });
    if (exMatch && exMatch.lines && exMatch.lines[0]) {
      const l = exMatch.lines[0];
      verse = { ur: l.ur || '', hi: l.hi || '', ro: l.ro || '', ascii: l.ascii || '', poet: exMatch.poet || '' };
    }
  }

  if (!verse && typeof GHALIB_EXT_DATA !== 'undefined' && Array.isArray(GHALIB_EXT_DATA)) {
    const ghMatch = GHALIB_EXT_DATA.find(e => Array.isArray(e.meters) ? e.meters.some(x => String(x) === idStr) : String(e.meter || e.m) === idStr);
    if (ghMatch && ghMatch.lines && ghMatch.lines[0]) {
      const l = ghMatch.lines[0];
      verse = { ur: l.ur || '', hi: l.hi || '', ro: l.ro || '', ascii: l.ascii || '', poet: 'Ghalib' };
    }
  }

  if (!verse && typeof MIR_EXT_DATA !== 'undefined' && Array.isArray(MIR_EXT_DATA)) {
    const mirMatch = MIR_EXT_DATA.find(e => Array.isArray(e.meters) ? e.meters.some(x => String(x) === idStr) : String(e.meter || e.m) === idStr);
    if (mirMatch && mirMatch.lines && mirMatch.lines[0]) {
      const l = mirMatch.lines[0];
      verse = { ur: l.ur || '', hi: l.hi || '', ro: l.ro || '', ascii: l.ascii || '', poet: 'Mir' };
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

  const isVerseUrdu = (verseText || opts.couplet) && isRtl;
  const disp = l => (typeof getLineDisplay === 'function') ? getLineDisplay(l, cs) : (l[cs] || l.ur);
  /* opts.couplet {l1,l2}: show the whole sher; otherwise the famous misra (no quote marks) */
  const primaryText = opts.couplet ? `<span class="ml-line">${disp(opts.couplet.l1)}</span><span class="ml-line">${disp(opts.couplet.l2)}</span>`
    : (verseText || info.pattern);

  let h = `<div class="meter-label-comp ${size==='lg'?'meter-label-lg':'meter-label-sm'}">`;
  h += `<div class="row">`;
  if (canPlay) {
    h += `<span class="play sm" role="button" tabindex="0" data-label="Play meter rhythm" aria-label="Play meter rhythm" onclick="event.stopPropagation();pbTogglePattern('meterlabel:${info.id}',this,'${info.pattern.replace(/'/g,"\\'")}',[...this.closest('.meter-label-comp').querySelectorAll('.meter-label-pattern .blk')])">▶︎</span>`;
  }
  h += `<div class="meter-label-body">`;
  h += `<div class="meter-label-primary ${isVerseUrdu ? 'urdu' : ((verseText || opts.couplet) ? (cs === 'ro' ? 'mono' : '') : 'mono')} ${opts.couplet ? 'ml-couplet' : ''}">${primaryText}</div>`;
  if (info.pattern && typeof feetStrip === 'function') {
    h += `<div class="meter-label-pattern">${feetStrip(info.pattern)}</div>`;
  }
  h += `<div class="meter-label-meta faint tiny">`;
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
