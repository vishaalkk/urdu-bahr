/* ================= DICTIONARY MODULE ================= */
let currentDictTag = 'all';
let currentDictQuery = '';

function formatWeightPattern(wt) {
  if (!wt) return '';
  return wt
    .replace(/=/g, '<span class="L mono">=</span>')
    .replace(/-/g, '<span class="S mono">–</span>')
    .replace(/x/g, '<span class="X mono">x</span>');
}

function getDictWordDisplay(item, script) {
  const src = (item.ascii && !/^\d/.test(item.ascii)) ? item.ascii : (item.syl || item.ascii || '');
  if (script === 'ascii') return src;
  try {
    if (script === 'hi' && typeof window !== 'undefined' && window.p_hi) return window.p_hi.parse(src);
    if (script === 'ro' && typeof window !== 'undefined' && window.p_di) return window.p_di.parse(src);
    if ((!script || script === 'ur') && typeof window !== 'undefined' && window.p_ur) return window.p_ur.parse(src);
  } catch (e) {}
  return item.syl || item.ascii || '';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderDictionary() {
  const list = $('dictList');
  if (!list) return;

  const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
  const q = currentDictQuery.toLowerCase().trim();

  const filtered = GLOSSARY_DATA.filter(item => {
    if (currentDictTag === 'flex' && !item.wt.includes('x')) return false;
    if (currentDictTag === 'persian' && !item.mean.toLowerCase().includes('pers')) return false;
    if (currentDictTag === 'indic' && !item.mean.toLowerCase().includes('indic')) return false;
    if (!q) return true;
    const sylMatch = item.syl && item.syl.toLowerCase().includes(q);
    const asciiMatch = item.ascii && item.ascii.toLowerCase().includes(q);
    const meanMatch = item.mean && item.mean.toLowerCase().includes(q);
    const dispWord = getDictWordDisplay(item, cs);
    const wordMatch = dispWord && dispWord.toLowerCase().includes(q);
    return sylMatch || asciiMatch || meanMatch || wordMatch;
  });

  if (filtered.length === 0) {
    list.innerHTML = `<div class="dict-empty dim small">${q ? `No words match ‘${escapeHtml(q)}’.` : 'No words match the selected filter.'}</div>`;
    return;
  }

  const scriptClass = (cs === 'ur') ? 'urdu' : ((cs === 'hi') ? 'deva' : 'mono');
  const langDirAttr = (cs === 'ur') ? 'lang="ur" dir="rtl"' : ((cs === 'hi') ? 'lang="hi"' : 'lang="ur-Latn" dir="ltr"');

  list.innerHTML = filtered.slice(0, 180).map(item => {
    const word = getDictWordDisplay(item, cs);
    const patHtml = formatWeightPattern(item.wt);
    const meanHtml = escapeHtml(item.mean);
    const safeWt = item.wt.replace(/'/g, "\\'");
    return `
      <div class="dict-row">
        <div class="dict-row-top row">
          <span class="dict-word ${scriptClass}" ${langDirAttr}>${word}</span>
          <span class="dict-pat mono">${patHtml}</span>
          <button class="icon-btn play sm dict-play" onclick="playWordRhythm('${safeWt}')" aria-label="Play rhythm" title="Play rhythm">▶</button>
        </div>
        ${item.mean ? `<div class="dict-mean dim small">${meanHtml}</div>` : ''}
      </div>
    `;
  }).join('');
}

function onDictSearch() {
  const input = $('dictSearchInput');
  currentDictQuery = input ? input.value : '';
  renderDictionary();
}

function filterDictTag(tag) {
  currentDictTag = tag;
  ['dictTagAll', 'dictTagFlex', 'dictTagPersian', 'dictTagIndic'].forEach(id => {
    const el = $(id);
    if (el) el.classList.remove('on');
  });
  const activeBtn = $('dictTag' + tag.charAt(0).toUpperCase() + tag.slice(1));
  if (activeBtn) activeBtn.classList.add('on');
  renderDictionary();
}

function playWordRhythm(wt) {
  if (typeof A !== 'undefined' && A.ensure && !A.ensure()) return;
  const seq = [];
  const parts = wt.replace(/[()]/g, '').split(/[\s,]+/);
  parts.forEach(p => {
    if (p === '=') seq.push('l');
    else if (p === '-') seq.push('s');
    else if (p === 'x') seq.push('l');
  });
  if (seq.length && typeof play === 'function') play(seq);
}
