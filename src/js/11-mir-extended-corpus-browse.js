/* ================= MIR EXTENDED CORPUS (browse) ================= */
let mirExtMeter = 'all';
let mirExtShown = 12;
function renderMirExt() {
  const sel = $('mirExtMeterFilter');
  const list = $('mirExtList');
  if(!sel || !list) return;

  if(!sel.options || sel.options.length <= 1) {
    const meterIds = [...new Set(MIR_EXT_DATA.flatMap(g => g.meters))].sort((a,b) => {
      if(a === 'H') return 1;
      if(b === 'H') return -1;
      return a - b;
    });
    sel.innerHTML = '<option value="all">All meters</option>' + meterIds.map(id => `<option value="${id}">${id === 'H' ? "Mir's Hindi meter" : 'Meter #' + id}</option>`).join('');
  }
  mirExtMeter = sel.value || 'all';

  const isRtl = (currentScript === 'ur');
  const rows = MIR_EXT_DATA.filter(g => mirExtMeter === 'all' || g.meters.includes(mirExtMeter === 'H' ? 'H' : +mirExtMeter));
  const shown = rows.slice(0, mirExtShown);

  list.innerHTML = shown.map((g, gi) => {
    const disp1 = getLineDisplay(g.lines[0], currentScript);
    const meterTxt = g.meters[0] === 'H' ? 'Hindi' : (g.meters.length > 1 ? g.meters.map(m => '#' + m).join('/') : '#' + g.meters[0]);
    return `
      <div class="vrow">
        <span class="vnum">Mir ${g.id}</span>
        <div class="vtext">
          <div class="vline" ${isRtl ? 'lang="ur" dir="rtl"' : 'lang="ur-Latn" dir="ltr"'}>${disp1}</div>
        </div>
        <div class="vact">
          <span class="faint tiny vact-meta">${meterTxt} &middot; ${g.n}L</span>
          <button class="btn ghost sm" onclick="scanMirExtInStudio(${g.id})">Scan Ghazal</button>
        </div>
      </div>${gi < shown.length - 1 ? '<div class="vrule"></div>' : ''}`;
  }).join('') || '<div class="faint small">No ghazals in this meter.</div>';

  const more = $('mirExtMore');
  if(more) {
    if(rows.length > shown.length) { more.style.display = ''; more.textContent = `Show more (${rows.length - shown.length} left)`; }
    else { more.style.display = 'none'; }
  }
}
function showMoreMirExt() { mirExtShown += 12; renderMirExt(); }

function scanMirExtInStudio(id) {
  const g = MIR_EXT_DATA.find(x => x.id === id);
  if(!g) return;
  go('scan');
  const txt = g.lines.map(l => l.ur).join('\n');
  $('scanIn').value = txt;
  if($('studioInput')) $('studioInput').value = txt;
  ovr = {}; selWord = null; curEx = null;
  runScan();
}

function loadCoupletInStudio(exId, c) {
  const ex = EXERCISES_DATA.find(x => x.id === exId);
  if(!ex) return;
  const l1 = ex.lines[2 * c];
  const l2 = ex.lines[2 * c + 1];
  if(!l1 || !l2) return;
  go('scan');
  const txt = `${l1.ur}\n${l2.ur}`;
  $('scanIn').value = txt;
  if($('studioInput')) $('studioInput').value = txt;
  ovr = {}; selWord = null; curEx = ex;
  runScan();
}

function loadExInStudio(exId) {
  const ex = EXERCISES_DATA.find(x => x.id === exId);
  if(!ex) return;
  go('scan');
  const txt = ex.lines.map(l => l.ur).join('\n');
  $('scanIn').value = txt;
  if($('studioInput')) $('studioInput').value = txt;
  ovr = {}; selWord = null; curEx = ex;
  runScan();
}

function playCoupletRhythm(exId, c) {
  if(!A.ensure()) return;
  const ex = EXERCISES_DATA.find(x => x.id === exId);
  if(!ex) return;
  const l1 = ex.lines[2 * c];
  const l2 = ex.lines[2 * c + 1];
  if(!l1 || !l2) return;

  const r1 = Scan.scanLine(l1.ur);
  const r2 = Scan.scanLine(l2.ur);
  if(r1.fits.length && r2.fits.length) {
    const e1 = Scan.explain(r1, r1.fits[0]);
    const p1 = exSeq(e1);
    const e2 = Scan.explain(r2, r2.fits[0]);
    const p2 = exSeq(e2);
    play(p1.seq, {
      feet: p1.feet,
      cae: p1.cae,
      onEnd: () => {
        playLater(() => {
          play(p2.seq, { feet: p2.feet, cae: p2.cae });
        }, 350);
      }
    });
  }
}

function loadExInScan(id) {
  const ex = EXERCISES_DATA.find(x => x.id === id);
  if(!ex) return;
  go('scan');
  const txt = ex.lines.map(l => l.ur).join('\n');
  $('scanIn').value = txt;
  if($('studioInput')) $('studioInput').value = txt;
  ovr = {}; selWord = null; curEx = ex;
  runScan();
}

function scanLineInEngine(line) {
  go('scan');
  $('scanIn').value = line;
  if($('studioInput')) $('studioInput').value = line;
  ovr = {}; selWord = null; curEx = null;
  runScan();
}

