/* ================= HANDBOOK VIEWER ================= */
let currentHbChapter = 'ch0';
function renderHandbook() {
  const chips = $('hbChapterChips');
  if(!chips) return;
  chips.innerHTML = HANDBOOK_DATA.map(ch => `
    <button class="fchip ${ch.id === currentHbChapter ? 'on' : ''}" onclick="pickHbChapter('${ch.id}')">
      ${ch.title}
    </button>
  `).join('');

  const view = $('hbChapterView');
  if(!view) return;
  const ch = HANDBOOK_DATA.find(x => x.id === currentHbChapter) || HANDBOOK_DATA[0];
  view.innerHTML = `
    <div class="hb-chapter-head">
      <div>
        <div class="eyebrow">Chapter ${ch.id.replace('ch','')}</div>
        <h1 class="hb-chapter-title">${ch.title}</h1>
        <div class="faint small">${ch.filename} · Complete unabridged text from Frances Pritchett &amp; Kh. A. Khaliq Anjum</div>
      </div>
      <div class="hb-chapter-urdu">${ch.urdu_title}</div>
    </div>
    <div class="hb-verbatim">
      ${ch.html_content}
    </div>
  `;

  // Internal link navigation
  view.querySelectorAll('a').forEach(a => {
    const href = a.getAttribute('href');
    if(href && href.startsWith('#')) {
      a.onclick = (e) => {
        e.preventDefault();
        const target = view.querySelector(`[name="${href.slice(1)}"]`) || view.querySelector(href);
        if(target) target.scrollIntoView({behavior:'smooth'});
      };
    } else if(href && href.endsWith('.html')) {
      const matchCh = HANDBOOK_DATA.find(c => href.includes(c.filename));
      if(matchCh) {
        a.onclick = (e) => {
          e.preventDefault();
          pickHbChapter(matchCh.id);
        };
      }
    }
  });
}

function pickHbChapter(id) {
  currentHbChapter = id;
  renderHandbook();
  if(typeof window.scrollTo === 'function') window.scrollTo(0, 0);
}

