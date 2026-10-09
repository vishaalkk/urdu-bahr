/* ================= BIBLIOGRAPHY MODULE ================= */
function renderBibliography() {
  const list = $('bibList');
  if(!list || !BIBLIOGRAPHY_DATA || !BIBLIOGRAPHY_DATA.entries) return;

  list.innerHTML = BIBLIOGRAPHY_DATA.entries.map((e, idx) => {
    // Older entries predate the `tag` field, so fall back to the original two-entry assumption.
    const tag = e.tag || (idx === 0 ? 'Pedagogical Foundation & Handbook' : 'Computational Linguistics & Script Engine');
    const authorsDisp = (e.authors || []).join(' & ');
    return `
      <div class="bib-entry" id="bib-${e.id}">
        <div class="bib-entry-head">
          <div>
            ${e.year ? `<span class="bib-year mono">${e.year}</span>` : ''}
            <span class="bib-tag">${tag}</span>
            <h3 class="bib-title">${e.title}</h3>
            ${e.urdu_title ? `<div class="bib-urdu-title">${e.urdu_title}</div>` : ''}
            <div class="bib-authors">${authorsDisp}</div>
            <div class="bib-affil">${e.publisher_or_affiliation}</div>
          </div>
          <a href="${e.canonical_url}" target="_blank" rel="noopener" class="bib-link">↗ Open Source Website</a>
        </div>

        <div class="bib-summary">
          <strong>Role in this Application:</strong>
          <div>${e.summary}</div>
        </div>

        ${e.related_project ? `
          <div class="bib-related">
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
      target.classList.add('bib-flash');
      setTimeout(() => target.classList.remove('bib-flash'), 2500);
    }
  }, 100);
}


