/* ================= BIBLIOGRAPHY MODULE ================= */
function renderBibliography() {
  const list = $('bibList');
  if(!list || !BIBLIOGRAPHY_DATA || !BIBLIOGRAPHY_DATA.entries) return;

  list.innerHTML = BIBLIOGRAPHY_DATA.entries.map((e, idx) => {
    const isPritchett = (idx === 0);
    const accentColor = isPritchett ? 'var(--gold)' : 'var(--teal)';
    const authorsDisp = (e.authors || []).join(' & ');
    return `
      <div class="card" id="bib-${e.id}" style="margin:0;background:var(--bg2);border-left:4px solid ${accentColor};padding:18px;">
        <div class="row" style="margin:0;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;">
          <div>
            <div class="row" style="margin:0;gap:8px;align-items:center;">
              <span class="pill count">${e.year}</span>
              <span class="pill shape" style="font-size:11px;">${isPritchett ? 'Pedagogical Foundation & Handbook' : 'Computational Linguistics & Script Engine'}</span>
            </div>
            <h3 style="margin:8px 0 2px 0;font-size:20px;color:${accentColor};">${e.title}</h3>
            ${e.urdu_title ? `<div style="font-family:'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', serif;font-size:20px;color:var(--ink);direction:rtl;margin-top:2px;">${e.urdu_title}</div>` : ''}
            <div style="font-size:15px;color:var(--ink);font-weight:600;margin-top:6px;">${authorsDisp}</div>
            <div class="muted small" style="margin-top:2px;">${e.publisher_or_affiliation}</div>
          </div>
          <a href="${e.canonical_url}" target="_blank" rel="noopener" class="btn sm ${isPritchett ? 'gold' : ''}" style="text-decoration:none;display:inline-flex;align-items:center;gap:6px;">↗ Open Source Website</a>
        </div>

        <div style="margin-top:14px;padding:12px 14px;background:var(--bg);border-radius:8px;font-size:14px;color:var(--dim);line-height:1.65;border-left:2px solid ${accentColor};">
          <strong style="color:var(--ink);">Role in this Application:</strong>
          <div style="margin-top:4px;">${e.summary}</div>
        </div>

        ${e.related_project ? `
          <div style="margin-top:10px;padding:10px 14px;background:var(--bg3);border-radius:8px;font-size:13px;color:var(--dim);line-height:1.5;">
            <strong>Companion Reference:</strong> ${e.related_project}
          </div>` : ''}
      </div>
    `;
  }).join('');
}

function openBibAnchor(anchor) {
  go('bibliography');
  setTimeout(() => {
    const target = document.getElementById('bib-' + anchor) || document.getElementById('bib-pritchett_khaliq_1987') || document.getElementById('bibList');
    if(target) {
      target.scrollIntoView({behavior: 'smooth', block: 'center'});
      target.style.outline = '2px solid var(--gold)';
      target.style.boxShadow = '0 0 16px rgba(212, 175, 55, 0.5)';
      setTimeout(() => {
        target.style.outline = '';
        target.style.boxShadow = '';
      }, 2500);
    }
  }, 100);
}


