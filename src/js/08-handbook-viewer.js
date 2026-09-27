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
    <div style="border-bottom:1px solid var(--line2);padding-bottom:14px;margin-bottom:18px;">
      <div class="row" style="margin:0;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;">
        <div>
          <span class="pill shape">CHAPTER ${ch.id.replace('ch','')}</span>
          <h1 style="margin:8px 0 4px 0;font-size:24px;color:var(--gold);">${ch.title}</h1>
          <div class="muted small">${ch.filename} · Complete unabridged text from Frances Pritchett & Kh. A. Khaliq Anjum</div>
        </div>
        <div style="font-family:'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', serif;font-size:24px;color:var(--teal);direction:rtl;">
          ${ch.urdu_title}
        </div>
      </div>
    </div>
    <div class="hb-verbatim" style="line-height:1.8;font-size:15px;color:var(--ink);">
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

