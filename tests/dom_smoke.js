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
    /original print edition|INTRODUCTION TO THE NEW ONLINE VERSION/.test(HTML) ? fail('handbook chapter text is embedded (it should only live locally)') : ok('handbook text not published');
    /href="#\/handbook/.test(HTML) ? fail('a link still points at the removed in-app Handbook') : ok('no links to the removed in-app Handbook');
    /<link rel="icon"[^>]+href="data:image\/svg\+xml/.test(HTML) ? ok('inline بحر favicon') : fail('no inline favicon');
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
    /* Weight > Learn is a four-stage lesson: the router hides every <section>, so each stage (and its content) must
       actually be visible after navigation and after stepping (this once shipped blank). */
    {
      w.location.hash = '#/weight/learn'; w.dispatchEvent(new w.HashChangeEvent('hashchange')); await wait(200);
      const vis = el => { for (let e = el; e && e !== d.body; e = e.parentElement) if (w.getComputedStyle(e).display === 'none' || e.hidden) return false; return true; };
      const stages = [...d.querySelectorAll('#weightPanelLearn .stage')];
      const dead = [];
      for (let n = 1; n <= stages.length; n++) {
        w.showStage(n, false);
        const st = stages[n - 1];
        if (!vis(st) || st.textContent.trim().length < 200 || st.querySelectorAll('.card').length < 1) dead.push(n);
      }
      w.showStage(1, false);
      stages.length === 4 && !dead.length ? ok('Weight › Learn: all 4 stages show their content') : fail('Weight › Learn stages blank or missing: ' + (dead.join(',') || stages.length + ' stages'));
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

  console.log('Scan editing');
  {
    /* two misras fit, the third doesn't: its chips are benchmarked against the shared bahr */
    const L = ['دلِ ناداں تجھے ہوا کیا ہے', 'آخر اس درد کی دوا کیا ہے', 'یہ بالکل غلط اور بے وزن جملہ ہے جو کسی بحر میں نہیں'];
    const { dom, errors } = load('#/scan?t=' + encodeURIComponent(L.join('\n')));
    await wait(1500);
    const w = dom.window, d = w.document;
    let err = null; try { w.runScan(); } catch (e) { err = e.message; }
    err || errors.length ? fail('partly-metrical input throws: ' + (err || errors[0]))
      : d.getElementById('sc2') && d.querySelector('#scanOut .unscanned-diag') ? ok('unscanned misra renders chips + diagnostic') : fail('unscanned misra has no chips/diagnostic');
    /* pinning a reading from the word panel pins that same reading in the engine */
    w.pickWord(0, 4);
    const rows = [...d.querySelectorAll('#scanOut .word-card .optrow')];
    const pick = rows.find(r => /setOpt\(0,4,[1-9]/.test(r.getAttribute('onclick') || ''));
    if (!pick) fail('word panel offers no alternate reading for کیا');
    else {
      const want = pick.querySelector('.word-badge').textContent.trim();
      pick.click();
      const o = w.eval("ovr")[0][4].opt, got = w.Scan.scanWord('کیا').opts[o].syl.map(x => x.w === 'l' ? '=' : x.w === 's' ? '–' : 'x').join(' ');
      got === want ? ok(`pinned reading matches the row clicked (${want})`) : fail(`clicked ${want}, engine pinned ${got}`);
    }
    w.close();
  }

  console.log('Learner edits (validator + original bahr)');
  {
    const L = ['دلِ ناداں تجھے ہوا کیا ہے', 'آخر اس درد کی دوا کیا ہے'];
    const { dom, errors } = load('#/scan?t=' + encodeURIComponent(L.join('\n')));
    await wait(1500);
    const w = dom.window, d = w.document;
    const sylOf = (li, wi) => [...d.querySelectorAll('#sc' + li + ' .cw')].filter(x => new RegExp('pickSyl\\(' + li + ',' + wi + ',').test(x.getAttribute('onclick') || ''));
    sylOf(0, 2)[0].click();                                   // ت of تجھے: one letter, can't be long
    const lng = [...d.querySelectorAll('.syl-opt')][0];
    lng && lng.disabled && /1\.5/.test(lng.textContent) ? ok('one-letter syllable: "long" refused, citing §1.5') : fail('one-letter syllable could be made long');
    sylOf(0, 2)[1].click();                                   // جھے: flexible, meter reads it long
    const sh = [...d.querySelectorAll('.syl-opt')].find(b => !b.classList.contains('on') && !b.disabled);
    if (!sh) fail('flexible syllable offers no other weight');
    else {
      sh.click();
      const diag = d.querySelector('#scanOut .unscanned-diag');
      diag && /original bahr/.test(diag.textContent) && d.querySelectorAll('#sc0 .chip.clash').length === 1 && d.getElementById('sco0')
        ? ok('forcing it short breaks the ORIGINAL bahr: one clash, original row shown') : fail('forced edit not judged against the original bahr');
      w.resetEdits(0);
      !d.querySelector('#scanOut .unscanned-diag') ? ok('Undo edits restores the scan') : fail('Undo edits left the line broken');
    }
    if (errors.length) fail('script error in edit checks: ' + errors[0]);
    w.close();
  }
  {
    /* Iqbal, sitāroñ se āge (Pritchett: - = = / - = = / - = = / - = =): Roman chips follow the syllables */
    const L = ['ستاروں سے آگے جہاں اور بھی ہیں', 'ابھی عشق کے امتحاں اور بھی ہیں'];
    const { dom, errors } = load('#/scan?t=' + encodeURIComponent(L.join('\n')));
    await wait(1500);
    const w = dom.window, d = w.document;
    w.eval('currentScript="ro"'); w.runScan();
    const chips = li => [...d.querySelectorAll('#sc' + li + ' .chip')].map(c => c.textContent.trim()).join(' ');
    const want1 = 'a bhī ʿish q ke im ti ḥāñ au r bhī haiñ';
    chips(1) === want1 ? ok('Roman chips split at the scanner\'s syllables (ʿish·q, au·r)') : fail(`Roman chips: "${chips(1)}" ≠ "${want1}"`);
    const m0 = d.querySelector('.misra-text').textContent;
    /^\s*sitāroñ se āge jahāñ aur bhī haiñ/.test(m0) && !/approximate/.test(m0) ? ok('Iqbal line uses Pritchett\'s spelling (sitāroñ…), not the letter-map guess') : fail('Iqbal line 1 Roman: ' + m0.trim());
    chips(0) === 'si tā roñ se ā ge ja hāñ au r bhī haiñ' ? ok('line-1 chips: si·tā·roñ … ja·hāñ au·r') : fail('line-1 chips: ' + chips(0));
    if (errors.length) fail('script error in Roman checks: ' + errors[0]);
    w.close();
  }

  console.log('Legend and scripts');
  {
    const { dom, errors } = load('#/ghazals/handbook'); await wait(1500);
    const w = dom.window, d = w.document;
    const lg = d.createElement('div'); lg.innerHTML = w.legendHTML('legend-sticky');
    const items = [...lg.querySelectorAll('.lg-item')];
    const labels = items.map(i => i.textContent.replace(/\s+/g, ' ').trim()).join(' | ');
    items.length === 6 && items.every(i => (i.getAttribute('data-tip') || '').length > 20) && /extra/.test(labels) && !/cheat/.test(labels)
      ? ok('legend: 6 items, each with an explanation; uses "extra"') : fail('legend items: ' + labels);
    w.setScriptMode('ro'); await wait(200);
    const head = d.querySelector('#handbookExContainer .meter-group-head'); if (head) head.click(); await wait(100);   // groups start collapsed
    const gv = d.querySelector('#handbookExContainer .meter-group-verse');
    if (!(gv && gv.getAttribute('lang') === 'ur-Latn' && / /.test(gv.textContent))) fail('Roman group header: ' + (gv ? gv.outerHTML.slice(0, 90) : 'none'));
    const rows = [...d.querySelectorAll('#handbookExContainer .vline')];
    d.documentElement.getAttribute('data-script') === 'ro' && rows.length && rows.every(r => r.getAttribute('lang') === 'ur-Latn' && r.getAttribute('dir') === 'ltr' && / /.test(r.textContent.trim()))
      ? ok(`Roman mode: <html data-script="ro">, ${rows.length} rows tagged Roman/LTR with spaces`) : fail('Roman rows: ' + rows.slice(0, 2).map(r => r.outerHTML.slice(0, 90)).join(' || '));
    w.setScriptMode('ur'); await wait(200);
    d.documentElement.getAttribute('data-script') === 'ur' ? ok('switching back to Urdu resets data-script') : fail('data-script stuck');
    if (errors.length) fail('script error in legend/script checks: ' + errors[0]);
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
    await check('#/meter/learn', (w, d) => { const n = d.querySelectorAll('#feetLesson .foot-card').length; return n === 4 && d.querySelector('#feetDemoScan .fgrp') ? true : `Feet lesson: ${n} cards, demo feet ${!!d.querySelector('#feetDemoScan .fgrp')}`; }, 'Meter › Learn shows the Feet lesson');
    await check('#/meter/lookup', (w, d) => { w.filterMeterLookup('feet'); const n = d.querySelectorAll('#feetList .foot-tr').length; w.filterFeet('salim'); const s = d.querySelectorAll('#feetList .foot-tr').length; w.filterFeet('all', '= = -'); const p = d.querySelectorAll('#feetList .foot-tr').length; w.filterFeet('all', 'mafailun'); const r = d.querySelectorAll('#feetList .foot-tr').length; return n === 20 && s === 6 && p >= 1 && r >= 1 ? true : `feet catalog: all ${n}, salim ${s}, pattern ${p}, roman ${r}`; }, 'Look up › Feet lists the catalog and filters it');
    await check('#/meter/lookup?open=R5', (w, d) => { const r = d.getElementById('m-row-R5'); return r && r.classList.contains('expanded') ? true : 'rubai R5 not opened'; }, 'Look up opens a rubāʿī form from a link');
    await check('#/meter/lookup', (w, d) => { w.filterMeterLookup('feet'); const a = d.querySelector('#feetList a.ft-meter'); return a && /open=/.test(a.getAttribute('href')) ? true : 'no meter links in Feet notes'; }, 'Feet notes link to their meters');
    await check('#/meter/learn?open=' + 'hazaron', (w, d) => { const r = d.getElementById('fam-hazaron'); return r && r.querySelector('.couplet-card') ? true : 'family not expanded'; }, 'Learn opens a specific family');
    await check('#/scan?t=' + encodeURIComponent('دلِ ناداں تجھے ہوا کیا ہے\nآخر اس درد کی دوا کیا ہے'), (w, d) => d.querySelectorAll('#scanOut .chip').length > 10 ? true : 'verse not scanned', 'Scan link scans the shared verse');
    await check('#/ghazals?q=' + encodeURIComponent('ghalib'), (w, d) => (d.getElementById('ghazalSearchInput').value === 'ghalib' && /Ghalib/.test(d.getElementById('ghazals-section').textContent)) ? true : 'search not applied', 'Ghazals search link fills and runs the search');
    await check('#/ghazals/ghalib', (w, d) => (w.eval('GHALIB_EXT_DATA.length') === 234 && /^Ghalib$/.test(d.getElementById('colBtnGhalib').textContent.trim()) && /234 ghazals/.test(d.getElementById('ghazalCollectionCount').textContent)) ? true : 'Ghalib count ' + w.eval('GHALIB_EXT_DATA.length') + ' / label ' + d.getElementById('colBtnGhalib').textContent + ' / count ' + (d.getElementById('ghazalCollectionCount') || {}).textContent, 'all 234 Ghalib ghazals present and labelled');
    await check('', (w) => w.location.hash === '#/home' ? true : 'landed on ' + w.location.hash, 'bare URL lands on Home');
    await check('#/home', (w, d) => { const s = d.getElementById('home-section'); return s && s.classList.contains('on') && /Weight/.test(s.textContent) && /Ghazals/.test(s.textContent) ? true : 'home section not rendered'; }, 'Home renders its content');
    // Round 3: inside the (single-collection) Mir list the group header carries the
    // meter and poet, so the row's own link is bare — just her number, e.g. "19↗" —
    // not "Mir 19"; the "Mir …" form is reserved for places that mix collections
    // (universal search results, the reader title).
    await check('#/ghazals/mir', (w, d) => { if (d.querySelector('#mirExtList .vrow')) return 'groups should start collapsed'; const h = d.querySelector('#mirExtList .meter-group-head'); if (!h) return 'no group headers'; h.click(); const a = d.querySelector('#mirExtList .vrow .fran-link'); return a && /franpritchett\.com/.test(a.href) && /^\d+↗$/.test(a.textContent) ? true : 'first Mir row: ' + (a ? a.textContent + ' ' + a.href : 'no link'); }, "Mir rows show Fran's number (bare), linked to her page");
    await check('#/ghazals/ghalib?meter=15', (w, d) => { const g = d.querySelector('#ghalibExtList [data-mgroup="14"]'); return g && g.classList.contains('open') && g.querySelector('.vrow') ? true : 'group #14 not opened for ?meter=15'; }, 'a ?meter= link opens that meter group (pairs → first of pair)');
    await check('#/weight', (w) => /^#\/weight\/(learn|drill|lookup)$/.test(w.location.hash) ? true : 'address stayed ' + w.location.hash, 'bare #/weight becomes an explicit sub-tab link');
  }

  console.log(failures ? `\nDOM SMOKE: ${failures} failure(s)` : '\nDOM SMOKE: all checks passed');
  process.exit(failures ? 1 : 0);
})();
