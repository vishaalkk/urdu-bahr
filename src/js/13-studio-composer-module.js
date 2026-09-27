/* ================= STUDIO / COMPOSER MODULE ================= */
let studioTimer = null;
let lastStudioResults = [];
window.lastStudioResults = lastStudioResults;

function onStudioInput() {
  clearTimeout(studioTimer);
  studioTimer = setTimeout(runStudioScan, 200);
}

function studioClear() {
  $('studioInput').value = '';
  $('studioResults').innerHTML = '';
  window.lastStudioResults = lastStudioResults = [];
}

function runStudioScan() {
  const text = $('studioInput').value.trim();
  const resDiv = $('studioResults');
  if(!text) {
    resDiv.innerHTML = '';
    window.lastStudioResults = lastStudioResults = [];
    return;
  }

  const rawLines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if(!rawLines.length) {
    resDiv.innerHTML = '';
    window.lastStudioResults = lastStudioResults = [];
    return;
  }

  // Pre-process lines with known index or transliteration fallback
  const lineScans = rawLines.map(rawL => {
    const nk = normVerseKey(rawL);
    let urduL = rawL;
    let lineObj = null;

    if(KNOWN_VERSES[nk]) {
      lineObj = KNOWN_VERSES[nk];
      urduL = lineObj.ur;
    } else if(/[\u0600-\u06FF]/.test(rawL)) {
      urduL = rawL;
      lineObj = { ur: rawL, hi: urduToDevanagari(rawL), ro: urduToRoman(rawL), ascii: rawL, isApprox: true };
    } else if(/[\u0900-\u097F]/.test(rawL)) {
      const asc = devToAscii(rawL);
      let ur = '';
      try { if(window.p_ur) ur = window.p_ur.parse(asc); } catch(e){}
      let ro = '';
      try { if(window.p_di) ro = window.p_di.parse(asc); } catch(e){}
      urduL = ur || rawL;
      lineObj = { ur: urduL, hi: rawL, ro: ro || rawL, ascii: asc };
    } else {
      const asc = romanToAscii(rawL);
      let ur = '';
      try { if(window.p_ur) ur = window.p_ur.parse(asc); } catch(e){}
      let hi = '';
      try { if(window.p_hi) hi = window.p_hi.parse(asc); } catch(e){}
      let ro = '';
      try { if(window.p_di) ro = window.p_di.parse(asc); } catch(e){}
      urduL = ur || rawL;
      lineObj = { ur: urduL, hi: hi || rawL, ro: ro || rawL, ascii: asc };
    }

    const res = Scan.scanLine(urduL);
    return { raw: rawL, urdu: urduL, lineObj: lineObj, res: res };
  });

  window.lastStudioResults = lastStudioResults = lineScans.map(ls => ({
    res: ls.res,
    lineObj: ls.lineObj,
    best: (ls.res.fits && ls.res.fits.length) ? ls.res.fits[0] : null
  }));

  // Couplet / Stacking evaluation
  let common = null;
  if(lineScans.length > 1) {
    const PAIRS = [[1, 9], [14, 15], [16, 17], [18, 19], [33, 34]];
    const inPair = new Set(PAIRS.flat());
    const groups = Scan.METERS.map(m => m.id).filter(id => !inPair.has(id)).map(id => [id]).concat(PAIRS).concat([['H']]);
    const tot = groups.map(g => {
      let c = 0, fits = [];
      for(const ls of lineScans) {
        const f = ls.res.fits.filter(x => g.includes(x.meter.id)).sort((a, b) => a.c - b.c)[0];
        if(!f) return null;
        c += f.c;
        fits.push(f);
      }
      return { id: g[0], group: g, c, fits };
    }).filter(Boolean).sort((a, b) => a.c - b.c);

    common = tot[0] || null;
    if(common) {
      common.fits.forEach((f, idx) => {
        if(lastStudioResults[idx]) lastStudioResults[idx].best = f;
      });
    }
  }

  let htmlOut = '';

  // 1. Couplet / Multiline banner
  if(lineScans.length > 1) {
    if(common) {
      const avgCost = common.c / lineScans.length;
      const [vc, vt] = verdictOf(avgCost);
      const isPaired = common.group.length > 1;
      htmlOut += `
        <div class="card" style="border-left:4px solid var(--ok);background:var(--bg2);margin-bottom:16px;">
          <div class="row" style="margin:0;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
            <div>
              <div class="row" style="margin:0;gap:8px;align-items:center;">
                <span class="pill shape">COUPLET VERDICT: ${vt}</span>
                ${isPaired ? '<span class="pill count">Paired Meters #' + common.group.join(' ↔ #') + '</span>' : ''}
              </div>
              <h3 style="margin:8px 0 2px 0;color:var(--gold);font-size:20px;">${meterLabel(common.fits[0].meter)}</h3>
              <div class="muted small">${isPaired ? 'Classic paired meters (one long ↔ two shorts near line end) used together in one poem' : 'Both misras share this exact metrical form'}</div>
            </div>
            <button class="btn sm gold" onclick="studioPlayCouplet()">▶ Play Couplet Rhythm</button>
          </div>
        </div>`;
    } else {
      htmlOut += `
        <div class="card" style="border-left:4px solid var(--warn);background:var(--bg2);margin-bottom:16px;">
          <div class="row" style="margin:0;color:var(--gold);font-weight:600;">Differing or Strained Meters Between Lines</div>
          <div class="muted small" style="margin-top:6px;">The entered lines do not share a common classical meter or paired family. Inspect individual misras below.</div>
        </div>`;
    }
  }

  // 2. Individual Line Cards
  lineScans.forEach((ls, li) => {
    const best = lastStudioResults[li] ? lastStudioResults[li].best : null;
    const misraTitle = lineScans.length === 2 ? (li === 0 ? 'Misra 1 (مصرع اول / Ūlā)' : 'Misra 2 (مصرع دوم / S̱ānī)') : `Line ${li + 1}`;
    
    // Display in currentScript
    const dispLine = getLineDisplay(ls.lineObj, currentScript);
    const isRtl = (currentScript === 'ur');

    if(!best) {
      htmlOut += `
        <div class="card" style="border-left:3px solid var(--no);background:var(--bg2);margin-bottom:14px;">
          <div class="row" style="margin:0;justify-content:space-between;align-items:center;">
            <span class="pill count">${misraTitle}</span>
            <span class="pill no">NO MATCH</span>
          </div>
          <div style="${isRtl ? 'font-family:\'Jameel Noori Nastaleeq\', \'Noto Nastaliq Urdu\', serif;font-size:22px;direction:rtl;' : 'font-size:17px;'}margin:10px 0;">${dispLine}</div>
          <div class="muted small" style="margin-top:6px;">Does not match any of the 37 classical meters. Check for surplus syllables, missing flexible words, or 3 consecutive shorts (---).</div>
        </div>`;
      return;
    }

    const expl = Scan.explain(ls.res, best);
    const [vc, vt] = verdictOf(best.c);

    htmlOut += `
      <div class="card" style="border-left:3px solid var(--${vc});background:var(--bg2);margin-bottom:14px;">
        <div class="row" style="margin:0;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
          <div>
            <div class="row" style="margin:0;gap:8px;align-items:center;">
              <span class="pill count">${misraTitle}</span>
              <span class="pill ${vc}">${vt}</span>
            </div>
            <h4 style="margin:6px 0 2px 0;color:var(--gold);font-size:17px;">${meterLabel(best.meter)}</h4>
            <div class="muted tiny">${best.meter.raw || ''}</div>
          </div>
          <button class="btn sm" onclick="studioPlayLine(${li})">▶ Play Line Rhythm</button>
        </div>

        <div style="${isRtl ? 'font-family:\'Jameel Noori Nastaleeq\', \'Noto Nastaliq Urdu\', serif;font-size:22px;direction:rtl;' : 'font-size:17px;'}margin:12px 0;padding:8px 0;border-top:1px solid var(--line2);border-bottom:1px solid var(--line2);">
          ${dispLine}
        </div>

        <div style="background:var(--bg3);padding:14px;border-radius:8px;">
          <div class="row" style="margin:0;gap:8px;flex-wrap:wrap;justify-content:center;">
            ${expl.syl.map(s => `
              <div style="display:flex;flex-direction:column;align-items:center;background:var(--bg2);padding:6px 10px;border-radius:6px;min-width:44px;border:1px solid var(--line);">
                <span style="font-family:'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', serif;font-size:18px;">${s.text || '·'}</span>
                <span class="pill ${s.resolved === 'l' ? 'shape' : (s.resolved === 'c' ? 'faint' : 'count')}" style="margin-top:4px;font-size:12px;">${s.resolved === 'l' ? '=' : (s.resolved === 'c' ? 'c' : '-')}</span>
                <span class="muted tiny" style="margin-top:2px;font-size:10px;">${s.fsyl || ''}</span>
              </div>
            `).join('')}
          </div>
        </div>

        ${expl.notes && expl.notes.length ? `
          <div style="margin-top:10px;padding:8px 12px;background:var(--bg);border-radius:6px;font-size:12.5px;color:var(--dim);">
            <strong style="color:var(--gold);">Prosodic flexibilities detected:</strong>
            <ul style="margin:4px 0 0 16px;padding:0;">
              ${expl.notes.map(n => `<li>${n.word ? '<strong>' + n.word + '</strong>: ' : ''}${n.note}</li>`).join('')}
            </ul>
          </div>` : ''}
      </div>`;
  });

  resDiv.innerHTML = htmlOut;
}

function studioPlayLine(idx) {
  if(!A.ensure()) return;
  const item = lastStudioResults[idx];
  if(!item || !item.best) return;
  const expl = Scan.explain(item.res, item.best);
  playEx(expl);
}

function studioPlayCouplet() {
  if(!A.ensure()) return;
  if(!lastStudioResults || !lastStudioResults.length) {
    runStudioScan();
  }
  if(!lastStudioResults || !lastStudioResults.length) return;

  const validLines = [];
  lastStudioResults.forEach((item, idx) => {
    if(item && item.best) {
      const expl = Scan.explain(item.res, item.best);
      const pat = exSeq(expl);
      validLines.push({ idx, pat });
    }
  });

  if(!validLines.length) return;

  function playAt(i) {
    if(i >= validLines.length) return;
    const cur = validLines[i];
    play(cur.pat.seq, {
      feet: cur.pat.feet,
      cae: cur.pat.cae,
      onEnd: () => {
        if(i + 1 < validLines.length) {
          setTimeout(() => playAt(i + 1), 350);
        }
      }
    });
  }

  playAt(0);
}

function studioPlayRhythm() {
  studioPlayCouplet();
}

