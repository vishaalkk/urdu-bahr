/* ================= GHALIB EXTENDED CORPUS (preview browse) ================= */
let ghalibExtMeter = 'all';
let ghalibExtShown = 12;
function renderGhalibExt() {
  const sel = $('ghalibExtMeterFilter');
  const list = $('ghalibExtList');
  if(!sel || !list) return;

  if(!sel.options || sel.options.length <= 1) {
    const meterIds = [...new Set(GHALIB_EXT_DATA.flatMap(g => g.meters))].sort((a,b) => a - b);
    sel.innerHTML = '<option value="all">All meters</option>' + meterIds.map(id => `<option value="${id}">Meter #${id}</option>`).join('');
  }
  ghalibExtMeter = sel.value || 'all';

  const isRtl = (currentScript === 'ur');
  const rows = GHALIB_EXT_DATA.filter(g => ghalibExtMeter === 'all' || g.meters.includes(+ghalibExtMeter));
  const shown = rows.slice(0, ghalibExtShown);

  list.innerHTML = shown.map((g, gi) => {
    const disp1 = getLineDisplay(g.lines[0], currentScript);
    const meterTxt = g.meters.length > 1 ? g.meters.map(m => '#' + m).join('/') : '#' + g.meters[0];
    return `
      <div class="vrow">
        <span class="vnum">Ghalib ${g.id}</span>
        <div class="vtext">
          <div class="vline" ${isRtl ? 'lang="ur" dir="rtl"' : 'lang="ur-Latn" dir="ltr"'}>${disp1}</div>
        </div>
        <div class="vact">
          <span class="faint tiny vact-meta">${meterTxt} &middot; ${g.n}L</span>
          <button class="btn ghost sm" onclick="scanGhalibExtInStudio(${g.id})">Scan Ghazal</button>
        </div>
      </div>${gi < shown.length - 1 ? '<div class="vrule"></div>' : ''}`;
  }).join('') || '<div class="faint small">No ghazals in this meter.</div>';

  const more = $('ghalibExtMore');
  if(more) {
    if(rows.length > shown.length) { more.style.display = ''; more.textContent = `Show more (${rows.length - shown.length} left)`; }
    else { more.style.display = 'none'; }
  }
}
function showMoreGhalibExt() { ghalibExtShown += 12; renderGhalibExt(); }

function scanGhalibExtInStudio(id) {
  const g = GHALIB_EXT_DATA.find(x => x.id === id);
  if(!g) return;
  go('scan');
  const txt = g.lines.map(l => l.ur).join('\n');
  $('scanIn').value = txt;
  if($('studioInput')) $('studioInput').value = txt;
  ovr = {}; selWord = null; curEx = null;
  runScan();
}

