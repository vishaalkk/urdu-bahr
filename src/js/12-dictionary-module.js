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
