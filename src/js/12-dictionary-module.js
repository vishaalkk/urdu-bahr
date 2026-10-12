/* ================= DICTIONARY MODULE ================= */
let currentDictTag = 'all';
let currentDictQuery = '';

/* GLOSSARY_DATA .wt can list several alternative readings, e.g. "(= - x), (= x)" —
   play/display just the first. Returns a raw pattern string ("= - x") the scansion
   engine's own parseRaw/patternFeet already understands, so the pattern strip and
   playback share one source of truth with the rest of the app. */
function dictFirstPattern(wt) {
  return String(wt || '').split(/\)\s*,/)[0].replace(/[()]/g, '').trim();
}

function getDictWordDisplay(item, script) {
  const src = (item.ascii && !/^\d/.test(item.ascii)) ? item.ascii : (item.syl || item.ascii || '');
  if (script === 'ascii') return src;
  try {
    if (script === 'hi' && typeof window !== 'undefined' && window.p_hi) return window.p_hi.parse(src);
    if (script === 'ro' && typeof window !== 'undefined' && window.p_di) return window.p_di.parse(src);
    if ((!script || script === 'ur') && typeof window !== 'undefined' && window.p_ur) return window.p_ur.parse(src);
  } catch (e) {}
  return item.syl || item.ascii || '';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderDictionary() {
  const list = $('dictList');
  if (!list) return;

  const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
  const q = currentDictQuery.toLowerCase().trim();

const INDIC_GLOSSARY_WORDS = new Set([
  'aap hii', 'aaphii', 'aapii', 'u;Thaa', 'u;T;Thaa', 'idhar', 'iidhar', 'anjhuu', 'aur', 'bachchah', 'bachah', 'bahut', 'bhii', 'bhiitar', 'bhitar', 'byaah', 'byopaar', 'paa))o;N', 'paa;Nv', 'pachchiis', 'pachiis', 'priit', 'pret', 'prem', 'pakaa', 'pakkaa', 'pah', 'pahu;Nchnaa', 'po;Nchnaa', 'pahu;Nchaa', 'phuvaar', 'phuuhaar', 'phvaar', 'pyaar', 'pyaalah', 'tak', 'talak', 'tumhaaraa', 'to', 'tuu', 'thaa', 'tahah', 'ta))ii;N', 'teraa', 'tiraa', 'tevrii', 'tyuu;N', 'jidhar', 'jiidhar', 'jagah', 'jaagah', 'jo', 'juvaa', 'juvva', 'jvaar', 'jii', 'jyuu;N', 'chakhaa', 'chakkhaa', 'chuuhiyaa', 'chuhiyaa', 'chyuun;Tii', 'dukaan', 'duukaan', 'dukkaan', 'dulhan', 'duulhan', 'dupa;T;Tah', 'dopa;T;Tah', 'doraahaa', 'duulhaa', 'duulah', 'duu))ii', 'dhyaan', 'rakhaa', 'rakkhaa', 'saa', 'saajan', 'sajan', 'sarhaanaa', 'so', 'sau', 'suu', 'svaa;Ng', 'saa;Ng', 'suvar', 'suuraaj', 'svaraaj', 'se', 'shakar', 'shakkar', 'krishn', 'kaa', 'ko', 'ko))ii', "kah'h", 'kho))e', 'kahiye', 'kii', 'ke', 'kyaa', 'kiyaarii', 'kyaarii', 'kyuu;N', 'garhan', 'gahan', 'guuruu', 'guruu', 'ga))e', 'gyaan', 'likhaa', 'likkhaa', 'lohaar', 'luhaar', 'lek', 'maarg', 'muvaa', 'muu))ii', 'muu))e', 'muu;Nhah', 'miyaa;N', 'myaa;N', 'meraa', 'miraa', 'me;N', 'mai;N', 'naa))o', 'naav', 'nibaahnaa', 'nibhaanaa', 'nadii', 'naddii', 'nanhaa', 'nau', 'nah', 'nai', 'ne', 'vahaa;N', 'vaa;N', 'haa))e', 'hai', 'ho', 'huu))aa', 'huu))e', 'huu))ii', 'huu))ii;N', 'ho;N', 'huu;N', 'hii', 'hai;N', 'yahaa;N', 'yaa;N', 'yuu;N', 'ye'
]);

const PERSIAN_GLOSSARY_WORDS = new Set([
  'aa;xir', 'aa;xiir', 'a;xiir', 'az', 'z', 'asharfii', 'ashrafii', 'aashkaar', 'aashkaaraa', 'aashiyaanah', 'aashiyaa;N', 'aagaah', 'aagah', 'ummiid', 'umiid', 'aa))iinah', 'aa))inah', 'yak', 'barhaman', 'barahman', 'barahnah', 'barhanah', 'buustaan', 'bustaan', 'bah', 'bayak', 'parvaa', 'parvaah', 'panaah', 'panah', 'pairaahan', 'pairahan', 'payaam', 'pai;Gaam', 'payambar', 'pai;Gambar', 'peshvaaz', 'pishvaaz', 'taa', 'tanuur', 'tannuur', 'tanduur', 'juzv', 'juz', ';xaamoshii', ';xamoshii', ';xaamushii', ';xi.zr', ';xi.zir', ';xa:trah', ';xa:tar', ';xvaam;xvaah', ';xvaahish', ';xvud', ';xvushii', 'daaman', 'daamaan', 'du;xtar', 'du;xt', 'do', 'dobaarah', 'dozaanuu', 'dogaanaa', 'dahan', 'dahaan', 'dahanah', 'diigar', 'digar', 'diivaanah', 'divaanah', 'raastah', 'rastah', 'raah', 'rah', 'ru;xsaar', 'ru;xsaarah', 'ruubah', 'ruubaah', 'rahguz;ar', 'raahguz;ar', 'rahguz;aar', 'raahguz;aar', 'zinhaar', 'ziinhaar', 'sih', 'sii', 'siyaah', 'siyah', 'shaah', 'shah', 'shubahah', 'shutur', 'ushtur', 'sharaar', 'sharar', 'sharaarah', 'firang', 'afrang', 'fuzuu;N', 'afzuu;N', 'fasaanah', 'afsaanah', 'fusurdah', 'afsurdah', 'fusuu;N', 'afsuu;N', 'fi;Gaa;N', 'af;Gaa;N', 'figaar', 'afgaar', 'fulaa;N', 'falaanaa', 'kaasah', 'kaas', 'kinaarah', 'kinaar', 'kih', 'gaah', 'gah', 'gar', 'agar', 'garchah', 'agarchah', 'gursanah', 'gurasnah', 'gulsitaa;N', 'gunaah', 'gunah', 'go', 'gauhar', 'guhar', 'laash', 'laashah', 'lekin', 'maah', 'mah', 'mihmaan', 'miinaar', 'minaar', 'naa;xuun', 'naa;xun', 'naagaah', 'naagahah', 'nashtar', 'neshtar', 'nigaah', 'nigah', 'naushah', 'naushaah', 'nayastaa;N', 'naisitaa;N', 'varnah', 'vagarnah', 'vuh', 'vai', 'hoshyaar', 'hushyaar', 'yaa', 'yuurish', 'yih'
]);

  const filtered = GLOSSARY_DATA.filter(item => {
    const isIndic = INDIC_GLOSSARY_WORDS.has(item.ascii) || (item.mean && item.mean.toLowerCase().includes('indic'));
    const isPersian = PERSIAN_GLOSSARY_WORDS.has(item.ascii) || (item.mean && item.mean.toLowerCase().includes('pers'));
    if (currentDictTag === 'flex' && !item.wt.includes('x')) return false;
    if (currentDictTag === 'persian' && !isPersian) return false;
    if (currentDictTag === 'indic' && !isIndic) return false;
    if (!q) return true;
    const sylMatch = item.syl && item.syl.toLowerCase().includes(q);
    const asciiMatch = item.ascii && item.ascii.toLowerCase().includes(q);
    const meanMatch = item.mean && item.mean.toLowerCase().includes(q);
    const dispWord = getDictWordDisplay(item, cs);
    const wordMatch = dispWord && dispWord.toLowerCase().includes(q);
    return sylMatch || asciiMatch || meanMatch || wordMatch;
  });

  if (filtered.length === 0) {
    list.innerHTML = `<div class="dict-empty dim small">${q ? `No words match ‘${escapeHtml(q)}’.` : 'No words match the selected filter.'}</div>`;
    return;
  }

  const scriptClass = (cs === 'ur') ? 'urdu' : ((cs === 'hi') ? 'deva' : 'mono');
  const langDirAttr = (cs === 'ur') ? 'lang="ur" dir="rtl"' : ((cs === 'hi') ? 'lang="hi"' : 'lang="ur-Latn" dir="ltr"');

  list.innerHTML = filtered.slice(0, 180).map((item, i) => {
    const word = getDictWordDisplay(item, cs);
    const rawPat = dictFirstPattern(item.wt);
    const patHtml = (typeof Scan !== 'undefined' && typeof strip === 'function') ? strip(Scan.parseRaw(rawPat)) : escapeHtml(item.wt);
    const meanHtml = escapeHtml(item.mean);
    const safePat = rawPat.replace(/'/g, "\\'");
    return `
      <div class="dict-row">
        <div class="dict-row-top row">
          <span class="dict-word ${scriptClass}" ${langDirAttr}>${word}</span>
          <span class="dict-pat mono">${patHtml}</span>
          <button class="icon-btn play sm dict-play" data-label="Play rhythm" onclick="playWordRhythm(${i},'${safePat}',this)" aria-label="Play rhythm" title="Play rhythm">▶︎</button>
        </div>
        ${item.mean ? `<div class="dict-mean dim small">${meanHtml}</div>` : ''}
      </div>
    `;
  }).join('');
}

function onDictSearch() {
  const input = $('dictSearchInput');
  currentDictQuery = input ? input.value : '';
  renderDictionary();
}

function filterDictTag(tag) {
  currentDictTag = tag;
  ['dictTagAll', 'dictTagFlex', 'dictTagPersian', 'dictTagIndic'].forEach(id => {
    const el = $(id);
    if (el) el.classList.remove('on');
  });
  const activeBtn = $('dictTag' + tag.charAt(0).toUpperCase() + tag.slice(1));
  if (activeBtn) activeBtn.classList.add('on');
  renderDictionary();
}

/* Word Bank ▶: goes through the player (▶⇄❚❚), lighting the word's own syllable strip. */
function playWordRhythm(idx, rawPat, btn) {
  if (!rawPat) return;
  const row = btn && btn.closest ? btn.closest('.dict-row-top') : null;
  const nodes = row && typeof row.querySelectorAll === 'function' ? [...row.querySelectorAll('.blk')] : null;
  if (typeof pbTogglePattern === 'function') pbTogglePattern('dictword:' + idx, btn, rawPat, nodes);
}

/* ================= PLATTS & STEINGASS CLASSICAL LEXICON ================= */
const DICT_ORIGIN_NAMES = { P: 'Persian', A: 'Arabic', S: 'Sanskrit', H: 'Hindi', T: 'Turkish' };

const DICT_STORE = {
  status: 'unloaded', // 'unloaded' | 'loading' | 'ready' | 'error'
  error: null,
  entries: null,
  indexUr: null,
  indexRo: null,
  source: 'handbook', // 'handbook' | 'lexicon'
  lexiconOrigin: 'all',
  loadPromise: null,

  async load() {
    if (this.status === 'ready') return this.entries;
    if (this.loadPromise) return this.loadPromise;

    this.status = 'loading';
    this.loadPromise = (async () => {
      try {
        const cached = await this.readFromIDB();
        if (cached && Array.isArray(cached) && cached.length > 50000) {
          this.initEntries(cached);
          this.status = 'ready';
          return this.entries;
        }

        const url = 'data/dictionary_bundle.json.gz';
        const res = await fetch(url);
        if (!res.ok) throw new Error('HTTP ' + res.status);

        let data;
        if (typeof DecompressionStream !== 'undefined') {
          const ds = new DecompressionStream('gzip');
          const decompressed = res.body.pipeThrough(ds);
          const jsonRes = new Response(decompressed);
          data = await jsonRes.json();
        } else {
          const rawRes = await fetch('data/dictionary_bundle.json');
          data = await rawRes.json();
        }

        this.initEntries(data);
        this.status = 'ready';
        this.saveToIDB(data).catch(() => {});
        return this.entries;
      } catch (err) {
        this.status = 'error';
        this.error = err.message || String(err);
        throw err;
      }
    })();
    return this.loadPromise;
  },

  initEntries(data) {
    this.entries = data;
    this.indexUr = new Map();
    this.indexRo = new Map();
    for (let i = 0; i < data.length; i++) {
      const e = data[i];
      if (e.ur) {
        const u = e.ur.normalize('NFC').replace(/[\u064B-\u065F\u0670\u0640]/g, '');
        let arr = this.indexUr.get(u);
        if (!arr) { arr = []; this.indexUr.set(u, arr); }
        arr.push(e);
      }
      if (e.ro) {
        const r = typeof casualKey === 'function' ? casualKey(e.ro, 1) : e.ro.toLowerCase().replace(/[^a-z]/g, '');
        if (r) {
          let arr = this.indexRo.get(r);
          if (!arr) { arr = []; this.indexRo.set(r, arr); }
          arr.push(e);
        }
      }
    }
  },

  async openIDB() {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB unavailable'));
      const req = indexedDB.open('urdu_bahr_lexicon_v1', 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('bundle')) db.createObjectStore('bundle');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  async readFromIDB() {
    try {
      const db = await this.openIDB();
      return new Promise(resolve => {
        const tx = db.transaction('bundle', 'readonly');
        const req = tx.objectStore('bundle').get('all');
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      return null;
    }
  },

  async saveToIDB(data) {
    try {
      const db = await this.openIDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('bundle', 'readwrite');
        tx.objectStore('bundle').put(data, 'all');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {}
  },

  lookup(word) {
    if (!this.entries || !word) return [];
    word = String(word).trim();
    const results = [];
    const seen = new Set();
    const add = e => {
      const k = e.ur + '|' + e.ro;
      if (!seen.has(k)) { seen.add(k); results.push(e); }
    };

    const uNorm = word.normalize('NFC').replace(/[\u064B-\u065F\u0670\u0640]/g, '');
    if (this.indexUr && this.indexUr.has(uNorm)) {
      this.indexUr.get(uNorm).forEach(add);
    }

    const rKey = typeof casualKey === 'function' ? casualKey(word, 1) : word.toLowerCase().replace(/[^a-z]/g, '');
    if (rKey && this.indexRo && this.indexRo.has(rKey)) {
      this.indexRo.get(rKey).forEach(add);
    }
    return results;
  }
};
if (typeof window !== 'undefined') window.DICT_STORE = DICT_STORE;

function filterLexiconOrigin(origin) {
  DICT_STORE.lexiconOrigin = origin;
  ['All', 'P', 'A', 'S', 'H'].forEach(k => {
    const btn = $('lexTag' + k);
    if (btn) btn.classList.toggle('on', origin.toLowerCase() === k.toLowerCase());
  });
  renderLexiconSection();
}

let currentLexQuery = '';
function onLexiconSearch() {
  const input = $('lexSearchInput');
  currentLexQuery = input ? input.value : '';
  renderLexiconSection();
}

function triggerLoadDictionary() {
  DICT_STORE.load().then(() => {
    renderLexiconSection();
    if (typeof trRender === 'function') trRender();
  }).catch(err => {
    renderLexiconSection();
  });
  renderLexiconSection();
}

/* Render the dedicated Classical Dictionary page (#lexList on #dictionary-section) */
function renderLexiconSection() {
  const list = $('lexList');
  if (!list) return;

  if (DICT_STORE.status === 'unloaded') {
    list.innerHTML = `
      <div class="card dict-load-card">
        <h3 style="margin: 0 0 var(--sp-2);">📚 Platts &amp; Steingass Classical Lexicon</h3>
        <p class="dim small" style="max-width: 540px; margin: 0 auto var(--sp-3); line-height: 1.5;">
          117,795 classical headwords with definitions, etymology (Arabic, Persian, Sanskrit, Hindi), and 28,300+ idioms.
          Downloads compressed (<strong>5.8 MB</strong>) once and stays cached in your browser's local storage permanently.
        </p>
        <button type="button" class="btn sm" onclick="triggerLoadDictionary()">⬇️ Load Classical Lexicon (5.8 MB)</button>
      </div>
    `;
    return;
  }

  if (DICT_STORE.status === 'loading') {
    list.innerHTML = `
      <div class="card dict-load-card">
        <div class="dim small">Downloading and indexing 117,795 classical dictionary entries…</div>
      </div>
    `;
    return;
  }

  if (DICT_STORE.status === 'error') {
    list.innerHTML = `
      <div class="card dict-load-card">
        <div class="dim small" style="color: #dc2626; margin-bottom: var(--sp-2);">Failed to load lexicon: ${escapeHtml(DICT_STORE.error)}</div>
        <button type="button" class="btn sm" onclick="triggerLoadDictionary()">Retry Download</button>
      </div>
    `;
    return;
  }

  const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
  const q = currentLexQuery.toLowerCase().trim();
  const qCasual = typeof casualKey === 'function' ? casualKey(q, 1) : q.replace(/[^a-z]/g, '');
  const org = DICT_STORE.lexiconOrigin;

  let results = [];
  if (q) {
    results = DICT_STORE.entries.filter(e => {
      if (org !== 'all' && e.origin !== org) return false;
      if (e.ur && e.ur.includes(q)) return true;
      if (e.ro && e.ro.toLowerCase().includes(q)) return true;
      if (qCasual && e.ro && casualKey(e.ro, 1).includes(qCasual)) return true;
      if (e.hi && e.hi.includes(q)) return true;
      if (e.def && e.def.toLowerCase().includes(q)) return true;
      return false;
    });
  } else {
    results = org === 'all' ? DICT_STORE.entries : DICT_STORE.entries.filter(e => e.origin === org);
  }

  if (results.length === 0) {
    list.innerHTML = `<div class="dict-empty dim small">${q ? `No classical words match ‘${escapeHtml(q)}’.` : 'No entries found.'}</div>`;
    return;
  }

  const scriptClass = (cs === 'ur') ? 'urdu' : ((cs === 'hi') ? 'deva' : 'mono');
  const langDirAttr = (cs === 'ur') ? 'lang="ur" dir="rtl"' : ((cs === 'hi') ? 'lang="hi"' : 'lang="ur-Latn" dir="ltr"');

  list.innerHTML = results.slice(0, 100).map(e => {
    const dispWord = cs === 'hi' ? (e.hi || e.ro) : (cs === 'ro' ? e.ro : e.ur);
    const orgLabel = DICT_ORIGIN_NAMES[e.origin] || e.origin || '';
    const badgeCls = e.origin && ('origin-' + e.origin) in { 'origin-P': 1, 'origin-A': 1, 'origin-S': 1, 'origin-H': 1 } ? 'origin-' + e.origin : 'origin-default';
    const pageHtml = e.page ? `<span class="dict-lex-page">p. ${e.page}</span>` : '';
    const phrasesHtml = (e.phrases && e.phrases.length) ? `
      <div class="dict-lex-phrases">
        ${e.phrases.slice(0, 4).map(ph => `<div class="dict-lex-phr-item"><span class="dict-lex-phr-ro">${escapeHtml(ph.ro)}</span>: ${escapeHtml(ph.def)}</div>`).join('')}
      </div>
    ` : '';

    return `
      <div class="dict-lex-entry">
        <div class="dict-lex-head">
          <span class="dict-word ${scriptClass}" ${langDirAttr}>${escapeHtml(dispWord)}</span>
          <span class="mono dim" style="font-size: 13px;">${escapeHtml(e.ro)}</span>
          ${orgLabel ? `<span class="dict-lex-badge ${badgeCls}">${orgLabel}</span>` : ''}
          ${pageHtml}
        </div>
        ${e.def ? `<div class="dict-lex-def">${escapeHtml(e.def)}</div>` : ''}
        ${phrasesHtml}
      </div>
    `;
  }).join('');
}

