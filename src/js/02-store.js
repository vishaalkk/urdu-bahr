'use strict';
const $ = id => document.getElementById(id);
const store = {
  get(k, d) { try { const v = localStorage.getItem('dumda:' + k); return v ? JSON.parse(v) : d; } catch(e) { return d; } },
  set(k, v) { try { localStorage.setItem('dumda:' + k, JSON.stringify(v)); } catch(e) {} }
};

/* ================= HASH ROUTER (§4) ================= */
/* Frances W. Pritchett & K. A. K. Anjum, Urdu Meter: A Practical Handbook — on her site */
const PRITCHETT_BOOK = 'https://franpritchett.com/00ghalib/meterbk/';
const PRITCHETT_CH = { ch0: '00_intro', ch1: '01_genrules', ch2: '02_flexibility', ch3: '03_special', ch4: '04_irregular',
  ch5: '05_feet', ch6: '06_meters', ch7: '07_scanning', ch8: '08_eyetoear' };
let currentRoute = '';
const subTabMemory = {
  weight: store.get('subTab:weight', 'learn'),
  meter: store.get('subTab:meter', 'learn')
};

function navigate(path, replace) {
  if (!path.startsWith('#')) path = '#' + (path.startsWith('/') ? path : '/' + path);
  if (typeof location !== 'undefined') {
    if (replace && typeof location.replace === 'function') {
      location.replace(path);
    } else {
      location.hash = path;
    }
  } else {
    handleRoute(path);
  }
}

/* Update the address bar to a shareable link for what's on screen, without a route change
   (no re-render, no scroll jump, no extra history entry). file:// pages may refuse; that's fine. */
function setHashQuiet(path) {
  if (!path.startsWith('#')) path = '#' + (path.startsWith('/') ? path : '/' + path);
  try { if (typeof history !== 'undefined' && history.replaceState) history.replaceState(null, '', path); } catch (e) {}
}
window.setHashQuiet = setHashQuiet;

/* Backward compatibility shim for any existing go(id) calls */
function go(id) {
  const map = {
    'ear': '/meter/drill',
    'learn': '/weight/learn',
    'tap': '/lab/tap',
    'exercises': '/ghazals/handbook',
    'scan': '/scan',
    'studio': '/scan',
    'bahr': '/meter/learn',
    'dictionary': '/weight/lookup',
    'bibliography': '/about'
  };
  const target = map[id] || '/meter/learn';
  navigate(target);
}

function parseHash(hash) {
  let target = '';
  if (typeof hash === 'string') {
    target = hash;
  } else if (typeof location !== 'undefined' && typeof location.hash === 'string') {
    target = location.hash;
  }
  const h = (target || '').replace(/^#\/?/, '');
  const [pathPart, queryPart] = h.split('?');
  const parts = pathPart ? pathPart.split('/').filter(Boolean) : [];
  const params = {};
  if (queryPart) {
    queryPart.split('&').forEach(kv => {
      const [k, v] = kv.split('=');
      if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || '');
    });
  }
  return { parts, params, raw: h };
}

function handleRoute(targetHash) {
  // Leaving a view stops whatever it was playing
  try { if (typeof pbCancel === 'function') pbCancel(); else if (typeof stopAll === 'function') stopAll(); } catch (e) {}
  const { parts, params, raw } = parseHash(targetHash);
  let root = parts[0] || '';

  // The Handbook reader was removed: old #/handbook/chN links go to that chapter on Pritchett's site.
  if (root === 'handbook') {
    const url = PRITCHETT_BOOK + (PRITCHETT_CH[parts[1]] || '00_index') + '.html';
    if (typeof location !== 'undefined' && typeof location.replace === 'function') location.replace(url);
    return;
  }

  // Default route when hash is empty
  if (!root) {
    // A bare URL always opens Home — the landing page explaining what each tab is for.
    // Shared links and bookmarks carry their own route, so they still open exactly
    // where they point.
    const last = '/home';
    if (typeof location !== 'undefined') {
      navigate(last, true);
      return;
    } else {
      return handleRoute(last);
    }
  }

  store.set('lastRoute', '/' + raw);

  // Top-level sections mapping
  const sectionMap = {
    'home': 'home-section',
    'weight': 'weight-section',
    'meter': 'meter-section',
    'scan': 'scan-section',
    'ghazals': 'ghazals-section',
    'about': 'about-section',
    'lab': 'tap-section'
  };

  // Hide all sections, show active
  const activeSecId = sectionMap[root] || 'home-section';
  document.querySelectorAll('.tab-view, section').forEach(s => {
    s.classList.remove('on');
    s.style.display = 'none';
  });

  const activeSec = $(activeSecId);
  if (activeSec) {
    activeSec.classList.add('on');
    activeSec.style.display = 'block';
  }

  // Update nav active states (desktop + mobile)
  const navRoot = (root === 'weight' || root === 'meter' || root === 'scan' || root === 'ghazals') ? root : '';
  if (typeof document !== 'undefined' && typeof document.querySelectorAll === 'function') {
    document.querySelectorAll('[data-nav]').forEach(el => {
      const isCur = (typeof el.getAttribute === 'function' ? el.getAttribute('data-nav') : '') === navRoot;
      if (el.classList && typeof el.classList.toggle === 'function') el.classList.toggle('on', isCur);
      if (typeof el.setAttribute === 'function') {
        if (isCur) el.setAttribute('aria-current', 'page');
        else if (typeof el.removeAttribute === 'function') el.removeAttribute('aria-current');
      }
    });
  }

  // Handle specific tabs
  if (root === 'home') {
    if (typeof document !== 'undefined') document.title = 'Baḥr — learn Urdu meter';
    if (typeof renderHome === 'function') renderHome();
  } else if (root === 'weight') {
    let sub = parts[1] || subTabMemory.weight || 'learn';
    if (!['learn', 'drill', 'lookup'].includes(sub)) sub = 'learn';
    if (parts[1] !== sub) setHashQuiet('/weight/' + sub);
    subTabMemory.weight = sub;
    store.set('subTab:weight', sub);
    showWeightSubtab(sub);
    if (typeof document !== 'undefined') document.title = 'Weight — Baḥr';
  } else if (root === 'meter') {
    let sub = parts[1] || subTabMemory.meter || 'learn';
    if (!['learn', 'drill', 'lookup'].includes(sub)) sub = 'learn';
    if (parts[1] !== sub) setHashQuiet('/meter/' + sub + (raw && raw.indexOf('?') !== -1 ? raw.slice(raw.indexOf('?')) : ''));
    subTabMemory.meter = sub;
    store.set('subTab:meter', sub);
    showMeterSubtab(sub, params);
    if (typeof document !== 'undefined') document.title = 'Meter — Baḥr';
  } else if (root === 'scan') {
    if (typeof document !== 'undefined') document.title = 'Scan — Baḥr';
    initScanEmptyState();
    if (params && params.t && $('scanIn') && $('scanIn').value !== params.t && typeof runScan === 'function') { $('scanIn').value = params.t; runScan(); }
  } else if (root === 'ghazals') {
    if (typeof document !== 'undefined') document.title = 'Ghazals — Baḥr';
    handleGhazalsRoute(parts, params);
  } else if (root === 'about') {
    if (typeof document !== 'undefined') document.title = 'About — Baḥr';
    if (typeof renderBibliography === 'function') renderBibliography();
  } else if (root === 'lab' && parts[1] === 'tap') {
    if (typeof document !== 'undefined') document.title = 'Tap Along — Baḥr';
    if (typeof echoNew === 'function') echoNew();
  }

  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function' && !params.keepScroll) {
    window.scrollTo(0, 0);
  }
}

function showWeightSubtab(sub) {
  const tabs = {
    learn: { btn: 'weightSubLearn', panel: 'weightPanelLearn' },
    drill: { btn: 'weightSubDrill', panel: 'weightPanelDrill' },
    lookup: { btn: 'weightSubLookup', panel: 'weightPanelLookup' }
  };
  Object.keys(tabs).forEach(k => {
    const b = $(tabs[k].btn), p = $(tabs[k].panel);
    const on = (k === sub);
    if (b) {
      if (b.classList && typeof b.classList.toggle === 'function') b.classList.toggle('on', on);
      if (typeof b.setAttribute === 'function') b.setAttribute('aria-selected', on ? 'true' : 'false');
    }
    if (p) p.style.display = on ? 'block' : 'none';
  });

  if (sub === 'learn') {
    if (typeof renderConstr === 'function') renderConstr();
    if (typeof renderSpecialSyll === 'function') renderSpecialSyll();
  } else if (sub === 'drill') {
    if (typeof mountDrill === 'function') mountDrill('weight');
    if (typeof wdNext === 'function' && $('wdWord') && !$('wdWord').textContent) wdNext();
    if (typeof fxNext === 'function' && $('fxWord') && !$('fxWord').textContent) fxNext();
  } else if (sub === 'lookup') {
    if (typeof renderDictionary === 'function') renderDictionary();
  }
}

function showMeterSubtab(sub, params) {
  const tabs = {
    learn: { btn: 'meterSubLearn', panel: 'meterPanelLearn' },
    drill: { btn: 'meterSubDrill', panel: 'meterPanelDrill' },
    lookup: { btn: 'meterSubLookup', panel: 'meterPanelLookup' }
  };
  Object.keys(tabs).forEach(k => {
    const b = $(tabs[k].btn), p = $(tabs[k].panel);
    const on = (k === sub);
    if (b) {
      if (b.classList && typeof b.classList.toggle === 'function') b.classList.toggle('on', on);
      if (typeof b.setAttribute === 'function') b.setAttribute('aria-selected', on ? 'true' : 'false');
    }
    if (p) p.style.display = on ? 'block' : 'none';
  });

  if (sub === 'learn') {
    if (typeof renderEarFams === 'function') renderEarFams();
    if (typeof renderEar === 'function') renderEar();
    if (params && params.open && typeof earPick === 'function') earPick(params.open);
  } else if (sub === 'drill') {
    if (typeof mountDrill === 'function') mountDrill('meter');
    if (typeof iomNew === 'function' && $('iomStrip') && !$('iomStrip').textContent) iomNew();
    if (typeof wtNew === 'function' && $('wtChoices') && !$('wtChoices').textContent) wtNew();
    if (typeof renderWeak === 'function') renderWeak();
  } else if (sub === 'lookup') {
    if (params && params.open != null && typeof lookupExpandedId !== 'undefined') lookupExpandedId = String(params.open);
    if (typeof renderFams === 'function') renderFams();
    if (params && params.open != null) scrollToLater('m-row-' + params.open);
  }
  if (sub === 'learn' && params && params.open) scrollToLater('fam-' + params.open);
}

/* after a shared link opens something, bring it into view once it's rendered */
function scrollToLater(id) {
  if (typeof setTimeout !== 'function') return;
  setTimeout(() => { const el = $(id); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, 60);
}

function filterMeterLookup(kind) {
  ['filterMeterAll', 'filterMeterRubai', 'filterMeterHindi'].forEach(id => {
    const el = $(id);
    if (el) el.classList.toggle('on', (kind === 'all' && id === 'filterMeterAll') ||
                                    (kind === 'rubai' && id === 'filterMeterRubai') ||
                                    (kind === 'hindi' && id === 'filterMeterHindi'));
  });
  if (typeof renderFams === 'function') renderFams();
}

function onHandbookBack() {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    navigate('/weight/learn');
  }
}

function handleGhazalsRoute(parts, params) {
  const sub = parts[1] || 'handbook';
  const ghazalId = parts[2] || null;

  if (ghazalId) {
    openGhazalReader(sub, ghazalId);
    return;
  }

  closeGhazalReader();
  switchCollection(sub);

  if (params && params.meter && typeof openMeterGroupFor === 'function') openMeterGroupFor(params.meter);
  if (params && params.q && $('ghazalSearchInput')) {
    $('ghazalSearchInput').value = params.q;
    onGhazalSearch();
  }
}

let activeCollection = 'handbook';
function switchCollection(col) {
  activeCollection = col;
  const btns = {
    'handbook': 'colBtnHandbook',
    'ghalib': 'colBtnGhalib',
    'mir': 'colBtnMir'
  };
  Object.keys(btns).forEach(k => {
    const el = $(btns[k]);
    if (el) el.classList.toggle('on', k === col);
  });

  const descs = {
    'handbook': 'The handbook\'s exercise ghazals, with Frances Pritchett\'s notes. <a class="fran-link" href="https://franpritchett.com/00ghalib/meterbk/10_ex_01_06.html" target="_blank" rel="noopener">Her exercises<span class="ext">↗</span></a> · <a class="fran-link" href="https://franpritchett.com/00ghalib/meterbk/11_exnotes.html" target="_blank" rel="noopener">answers &amp; notes<span class="ext">↗</span></a>',
    'ghalib': "Ghalib's divan, scanned and meter-checked by the engine.",
    'mir': "Mir Taqi Mir, scanned and meter-checked by the engine."
  };
  if ($('colDesc')) $('colDesc').innerHTML = descs[col] || '';   // descriptions may carry links (trusted, static)

  const cHandbook = $('handbookExContainer');
  const cGhalib = $('ghalibContainer');
  const cMir = $('mirContainer');

  if (cHandbook) cHandbook.style.display = (col === 'handbook') ? 'block' : 'none';
  if (cGhalib) cGhalib.style.display = (col === 'ghalib') ? 'block' : 'none';
  if (cMir) cMir.style.display = (col === 'mir') ? 'block' : 'none';

  if (col === 'handbook' && typeof renderExercises === 'function') renderExercises();
  if (col === 'ghalib' && typeof renderGhalibExt === 'function') renderGhalibExt();
  if (col === 'mir' && typeof renderMirExt === 'function') renderMirExt();

  populateGhazalMeterFilter(col);
}

function populateGhazalMeterFilter(col) {
  const sel = $('ghazalMeterFilter');
  if (!sel) return;
  sel.innerHTML = '<option value="all">All meters</option>';
}

function onGhazalFilterChange() {
  const val = $('ghazalMeterFilter') ? $('ghazalMeterFilter').value : 'all';
  if (activeCollection === 'ghalib' && $('ghalibExtMeterFilter')) {
    $('ghalibExtMeterFilter').value = val;
    if (typeof renderGhalibExt === 'function') renderGhalibExt();
  } else if (activeCollection === 'mir' && $('mirExtMeterFilter')) {
    $('mirExtMeterFilter').value = val;
    if (typeof renderMirExt === 'function') renderMirExt();
  }
}

function onGhazalSearch() {
  const q = $('ghazalSearchInput') ? $('ghazalSearchInput').value.toLowerCase().trim() : '';
  if (activeCollection === 'ghalib') {
    if (typeof renderGhalibExt === 'function') renderGhalibExt();
  } else if (activeCollection === 'mir') {
    if (typeof renderMirExt === 'function') renderMirExt();
  }
}

function openGhazalReader(col, id) {
  const rView = $('ghazalReaderView');
  const lView = $('ghazalListView');
  if (rView) rView.style.display = 'block';
  if (lView) lView.style.display = 'none';
  if ($('readerTitle')) $('readerTitle').textContent = `${col.toUpperCase()} ${id}`;
}

function closeGhazalReader() {
  const rView = $('ghazalReaderView');
  const lView = $('ghazalListView');
  if (rView) rView.style.display = 'none';
  if (lView) lView.style.display = 'block';
}

function initScanEmptyState() {
  const host = $('samples');
  if (!host) return;
  const samples = [
    { title: "Ghalib: dil-e nādāñ", text: "دلِ ناداں تجھے ہوا کیا ہے\nآخر اس درد کی دوا کیا ہے" },
    { title: "Mir: hastī apnī", text: "ہستی اپنی حباب کی سی ہے\nیہ نمائش سراب کی سی ہے" },
    { title: "Iqbal: sitāroñ se āge", text: "ستاروں سے آگے جہاں اور بھی ہیں\nابھی عشق کے امتحان اور بھی ہیں" }
  ];
  host.innerHTML = samples.map((s, i) => `
    <button class="chipbtn sm" onclick="$('scanIn').value=\`${s.text}\`;runScan();">${s.title}</button>
  `).join('');
}

function toggleScanHelp() {
  const p = $('scanHelpPopover');
  if (p) p.style.display = (p.style.display === 'none' || !p.style.display) ? 'block' : 'none';
}

/* Settings Sheet Controls */
function openSettings() {
  const s = $('settingsSheet');
  if (s) {
    s.classList.add('on');
    if (typeof renderSoundOpts === 'function') renderSoundOpts();
  }
}

function closeSettings() {
  const s = $('settingsSheet');
  if (s) s.classList.remove('on');
}

function toggleAsciiScript(show) {
  store.set('showAscii', show);
  const hdrBtn = $('btnScriptAsciiHeader');
  if (hdrBtn) hdrBtn.style.display = show ? 'inline-flex' : 'none';
}

/* ================= HOME (§Round3 "Home page") ================= */
const HOME_EXAMPLE_UR = 'دلِ ناداں تجھے ہوا کیا ہے';
function renderHome() {
  const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
  const isRtl = (cs === 'ur');

  const legend = $('homeLegend');
  if (legend && typeof legendHTML === 'function') legend.innerHTML = legendHTML();

  const verseEl = $('homeExampleVerse');
  if (verseEl) {
    verseEl.className = 'home-example-verse ' + (isRtl ? 'urdu' : (cs === 'hi' ? 'deva' : 'mono'));
    if (typeof verseEl.setAttribute === 'function') {
      verseEl.setAttribute('lang', isRtl ? 'ur' : (cs === 'hi' ? 'hi' : 'ur-Latn'));
      verseEl.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    }
    verseEl.innerHTML = (typeof getLineDisplay === 'function') ? getLineDisplay(HOME_EXAMPLE_UR, cs) : HOME_EXAMPLE_UR;
  }

  const scanHost = $('homeExampleScan');
  if (scanHost && typeof renderLineScan === 'function') renderLineScan(HOME_EXAMPLE_UR, scanHost);
}

/* ▶ on the home page's sample couplet: same shared player as every other ▶ (G1) */
function homePlayExample(btn) {
  const host = $('homeExampleScan');
  if (!host || typeof Scan === 'undefined' || typeof pbToggle !== 'function') return;
  pbToggle('home:example', btn, () => {
    const r = Scan.scanLine(HOME_EXAMPLE_UR);
    const f = r.fits[0];
    if (!f) return null;
    const e = Scan.explain(r, f);
    return [Object.assign({ e }, (typeof pbNodes === 'function') ? pbNodes(host) : {})];
  });
}
window.renderHome = renderHome;
window.homePlayExample = homePlayExample;

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('hashchange', () => handleRoute());
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeSettings();
      const hp = $('scanHelpPopover');
      if (hp) hp.style.display = 'none';
    }
  });
}
