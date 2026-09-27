/* Real-DOM smoke test of the built index.html (jsdom).
   Catches what the sandbox tests can't: broken page structure (a tab nested in
   another), script errors on load (incl. direct deep links), empty tabs, drills
   that don't mount. Run: node tests/dom_smoke.js */
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const path = require('path');

const HTML = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const IGNORE = /Not implemented|scrollTo/;          // jsdom gaps, not app bugs
let failures = 0;
const fail = msg => { failures++; console.log('  ✗ ' + msg); };
const ok = msg => console.log('  ✓ ' + msg);

function load(hash) {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { if (!IGNORE.test(e.message)) errors.push(e.message.split('\n')[0]); });
  const dom = new JSDOM(HTML, { runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, url: 'http://localhost/index.html' + hash });
  dom.window.scrollTo = () => {};
  return { dom, errors };
}
const wait = ms => new Promise(r => setTimeout(r, ms));
const shown = (w, el) => { for (let e = el; e && e !== w.document.documentElement; e = e.parentElement) if (w.getComputedStyle(e).display === 'none') return false; return true; };
const text = el => el.textContent.replace(/\s+/g, ' ').trim();

const ROUTES = [
  ['#/weight', 'weightPanelLearn', 500], ['#/weight/drill', 'weightPanelDrill', 60], ['#/weight/lookup', 'weightPanelLookup', 500],
  ['#/meter', 'meterPanelLearn', 500], ['#/meter/drill', 'meterPanelDrill', 60], ['#/meter/lookup', 'meterPanelLookup', 500],
  ['#/scan', 'scan-section', 100], ['#/ghazals', 'ghazals-section', 500]
];

(async () => {
  console.log('Structure');
  {
    const d = new JSDOM(HTML).window.document;       // parse only
    const sections = [...d.querySelectorAll('.wrap > section.tab-view, section.tab-view')];
    const nested = sections.filter(s => s.parentElement.closest('section'));
    nested.length ? fail('sections nested inside another section: ' + nested.map(s => s.id).join(', ')) : ok(sections.length + ' tab sections, none nested');
    const ids = [...d.querySelectorAll('[id]')].map(e => e.id);
    const dup = [...new Set(ids.filter((x, i) => ids.indexOf(x) !== i))];
    dup.length ? fail('duplicate ids in static markup: ' + dup.slice(0, 8).join(', ')) : ok('no duplicate ids in static markup');
    /(https?:)?\/\/fonts\.(googleapis|gstatic)\.com|<script[^>]+src=|<link[^>]+stylesheet[^>]+href=["']https?:/i.test(HTML)
      ? fail('page references a network resource (must work offline)') : ok('no network fonts/scripts/stylesheets');
  }

  console.log('Every route, loaded directly (deep link)');
  for (const [hash, id, minChars] of ROUTES) {
    const { dom, errors } = load(hash);
    await wait(1500);
    const w = dom.window, el = w.document.getElementById(id);
    const drill = /drill/.test(hash);
    if (errors.length) fail(`${hash}: script error — ${errors[0]}`);
    else if (!el) fail(`${hash}: #${id} missing`);
    else if (!shown(w, el)) fail(`${hash}: #${id} is hidden`);
    else if (text(el).length < minChars) fail(`${hash}: #${id} has only ${text(el).length} chars`);
    else if (drill && !el.querySelector('.dr-root .dr-choice')) fail(`${hash}: drill did not mount a question`);
    else ok(`${hash} → #${id} (${text(el).length} chars${drill ? ', drill question shown' : ''})`);
    w.close();
  }

  console.log('Navigation between tabs');
  {
    const { dom, errors } = load('#/weight');
    await wait(1500);
    const w = dom.window;
    for (const [hash, id] of ROUTES) {
      w.location.hash = hash; w.dispatchEvent(new w.HashChangeEvent('hashchange')); await wait(150);
      const el = w.document.getElementById(id);
      if (!el || !shown(w, el)) fail(`navigate ${hash}: #${id} not shown`);
    }
    errors.length ? fail('script error while navigating: ' + errors[0]) : ok('visited all routes in one session without errors');
    w.close();
  }

  console.log('Features');
  {
    const { dom, errors } = load('#/meter');
    await wait(1500);
    const w = dom.window, d = w.document;
    const f0 = w.FAMS && w.FAMS[0] && w.FAMS[0].id;
    if (!f0) fail('FAMS not loaded');
    else {
      w.toggleFamExpand(f0, { target: d.body });
      if (!d.getElementById('fam-' + f0).classList.contains('expanded')) w.toggleFamExpand(f0, { target: d.body });   // first family may start open
      const row = d.getElementById('fam-' + f0);
      row && row.querySelectorAll('.couplet-card .play').length ? ok('Meter › Learn family expands to playable couplet boxes') : fail('family row has no couplet boxes');
    }
    w.location.hash = '#/ghazals'; w.dispatchEvent(new w.HashChangeEvent('hashchange')); await wait(200);
    if (typeof w.searchGhazalIndex === 'function') {
      const hits = q => { const r = w.searchGhazalIndex(q) || {}; return Object.values(r).reduce((n, set) => n + set.size, 0); };
      const a = hits('khvahish'), b = hits('ḳhvāhish'), u = hits('غالب');
      if (!(u > 100)) fail(`Urdu poet search غالب found only ${u}`);
      a > 0 && a === b ? ok(`search is diacritic-insensitive (khvahish = ḳhvāhish: ${a} hits)`) : fail(`search mismatch: khvahish=${a}, ḳhvāhish=${b}`);
    } else fail('searchGhazalIndex missing');
    if (errors.length) fail('script error in feature checks: ' + errors[0]);
    w.close();
  }

  console.log('Shareable links');
  {
    const check = async (hash, test, label) => {
      const { dom, errors } = load(hash); await wait(1500);
      const w = dom.window;
      let res; try { res = test(w, w.document); } catch (e) { res = 'threw ' + e.message; }
      if (errors.length) fail(`${hash}: script error — ${errors[0]}`);
      else res === true ? ok(`${label}  (${hash})`) : fail(`${label} (${hash}): ${res}`);
      w.close();
    };
    await check('#/meter/lookup?open=26', (w, d) => { const r = d.getElementById('m-row-26'); return r && r.classList.contains('expanded') ? true : 'meter #26 not expanded'; }, 'Look up opens a specific meter');
    await check('#/meter/learn?open=' + 'hazaron', (w, d) => { const r = d.getElementById('fam-hazaron'); return r && r.querySelector('.couplet-card') ? true : 'family not expanded'; }, 'Learn opens a specific family');
    await check('#/scan?t=' + encodeURIComponent('دلِ ناداں تجھے ہوا کیا ہے\nآخر اس درد کی دوا کیا ہے'), (w, d) => d.querySelectorAll('#scanOut .chip').length > 10 ? true : 'verse not scanned', 'Scan link scans the shared verse');
    await check('#/ghazals?q=' + encodeURIComponent('ghalib'), (w, d) => (d.getElementById('ghazalSearchInput').value === 'ghalib' && /Ghalib/.test(d.getElementById('ghazals-section').textContent)) ? true : 'search not applied', 'Ghazals search link fills and runs the search');
    await check('#/ghazals/ghalib', (w, d) => (w.eval('GHALIB_EXT_DATA.length') === 234 && /Ghalib 234/.test(d.getElementById('colBtnGhalib').textContent)) ? true : 'Ghalib count ' + w.eval('GHALIB_EXT_DATA.length') + ' / label ' + d.getElementById('colBtnGhalib').textContent, 'all 234 Ghalib ghazals present and labelled');
    await check('', (w) => w.location.hash === '#/weight/learn' ? true : 'landed on ' + w.location.hash, 'bare URL lands on Weight › Learn');
    await check('#/ghazals/mir', (w, d) => { const a = d.querySelector('#mirExtList .vrow .fran-link'); return a && /franpritchett\.com/.test(a.href) && /Mir 6\b/.test(a.textContent) ? true : 'first Mir row: ' + (a ? a.textContent + ' ' + a.href : 'no link'); }, "Mir rows show Fran's number, linked to her page");
    await check('#/weight', (w) => /^#\/weight\/(learn|drill|lookup)$/.test(w.location.hash) ? true : 'address stayed ' + w.location.hash, 'bare #/weight becomes an explicit sub-tab link');
  }

  console.log(failures ? `\nDOM SMOKE: ${failures} failure(s)` : '\nDOM SMOKE: all checks passed');
  process.exit(failures ? 1 : 0);
})();
