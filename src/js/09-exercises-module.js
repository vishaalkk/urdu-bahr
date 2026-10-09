/* ================= GHAZALS LIBRARY & READER MODULE (§5.7, §5.8) ================= */
let ghazalShownCount = 30;
let curReaderCol = null;
let curReaderId = null;
let curReaderItem = null;

/* Universal search (round 2): while the box has a query, results merge all
   three collections; the collection segmented buttons then act as a filter
   on those merged results instead of switching which corpus is browsed.
   'all' = no filter. Reset to 'all' whenever the search box is cleared. */
let searchCollectionFilter = 'all';
let ghazalSearchDebounce = null;

// Scans are shown by default; only an explicit "Hide all scans" turns them off.
let showAllScans = true;
try {
  showAllScans = (sessionStorage.getItem('bahr_reader_scans') !== 'false');
} catch (e) {
  showAllScans = true;
}

/* Handbook items store meter id(s) under `meters` (array); Ghalib/Mir extended
   corpora also use `meters`. Some older call sites assumed `m`/`meter`, which is
   why rows showed "#undefined". Always resolve through this helper. */
function mListOf(item) {
  if (!item) return [];
  const src = Array.isArray(item.meters) ? item.meters
    : (Array.isArray(item.m) ? item.m : [item.meter != null ? item.meter : item.m]);
  return src.filter(x => x !== undefined && x !== null && x !== '');
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getLangDir(cs) {
  if (cs === 'ur') return 'lang="ur" dir="rtl"';
  if (cs === 'hi') return 'lang="hi"';
  return 'lang="ur-Latn" dir="ltr"';
}

/* ================= UNIVERSAL SEARCH (round 2 G-search) =================
   One normalizer for Urdu, Devanagari and Roman text, poet names, and
   ghazal numbers, so a single query box can match across all of them and
   across all three collections at once. Diacritic-insensitive on both
   sides: Urdu combining marks/tatweel/ZWNJ are stripped, and Roman text is
   NFD-decomposed so ā/ī/ū/ṭ/ḍ/ṇ/ṣ/ẕ/ḥ/ḳ/ñ all fold to their plain letter
   (which also makes "ḳh" == "kh"); ʿ/ʾ/ʽ/' are dropped outright since they
   don't correspond to a plain-key letter at all. This is deliberately
   separate from normVerseKey() (05-translit-helpers.js) — that one matches
   whole verses across scripts exactly for the corpus dedup/lookup index;
   this one only needs to be forgiving enough for a human typing a search. */
function searchNorm(str) {
  if (!str) return '';
  let s = String(str).toLowerCase();
  s = s.replace(/[ً-ٰٟـ​-‏]/g, '');   // Urdu diacritics, madda, tatweel, ZW*
  s = s.normalize('NFD').replace(/[̀-ͯ]/g, '');           // ā→a, ṭ→t, ñ→n, ḳ→k, …
  s = s.replace(/[ʿʾʽ`'’‘]/g, '');                                   // ayn/hamza marks, apostrophes
  s = s.replace(/[،۔؟!,.;:?"«»()\[\]{}\-–—/]/g, ' ');
  return s.replace(/\s+/g, ' ').trim();
}

/* GHALIB_EXT_DATA/MIR_EXT_DATA only carry the poet's name in Roman ("Ghalib",
   "Mir"); add the Urdu/Devanagari spellings so a search in those scripts can
   find the poet too. Handbook items already carry each ghazal's own
   (Roman-only) poet name, which we index as-is. */
const POET_NAMES = {
  ghalib: ['Ghalib', 'غالب', 'ग़ालिब'],
  mir: ['Mir', 'میر', 'मीर']
};
/* Poet collections: search also matches the poet's Urdu and Devanagari name and common Roman spellings */
POET_LIST.forEach(p => { POET_NAMES[p.key] = [p.name, p.full, p.ur, p.hi].concat(p.aliases || []); });
/* the collections of the Ghazals tab, in tab order, and where each one's data lives */
const GHAZAL_COLS = ['handbook', 'ghalib', 'mir'].concat(POET_LIST.map(p => p.key));
const COL_NAMES = { handbook: 'Handbook', ghalib: 'Ghalib', mir: 'Mir' };
POET_LIST.forEach(p => { COL_NAMES[p.key] = p.name; });
function collectionData(col) {
  const d = col === 'handbook' ? (typeof EXERCISES_DATA !== 'undefined' ? EXERCISES_DATA : null)
    : col === 'ghalib' ? (typeof GHALIB_EXT_DATA !== 'undefined' ? GHALIB_EXT_DATA : null)
    : col === 'mir' ? (typeof MIR_EXT_DATA !== 'undefined' ? MIR_EXT_DATA : null)
    : isPoetCol(col) ? poetItems(col) : null;
  return Array.isArray(d) ? d : [];
}
window.collectionData = collectionData;
/* a poet ghazal's number as a link to its page on Rekhta/Urdushahkar (new tab), "12 ↗"; plain "#12" for the few without a link */
function rekhtaLinkHTML(item, opts) {
  const label = (opts && opts.bare) ? String(item.id) : `${item.poet} ${item.id}`;
  const isShahkar = item.url && item.url.includes('urdushahkar.org');
  const isSufinama = item.url && item.url.includes('sufinama.org');
  const srcTitle = isSufinama ? 'This poem on Sufinama' : isShahkar ? 'This ghazal on Urdushahkar' : 'This ghazal on Rekhta';
  return item.url
    ? `<a class="fran-link" href="${escapeHtml(item.url)}" target="_blank" rel="noopener" onclick="event.stopPropagation()" title="${srcTitle}">${label}<span class="ext" aria-hidden="true">↗</span></a>`
    : escapeHtml(label);
}
window.rekhtaLinkHTML = rekhtaLinkHTML;

let GHAZAL_SEARCH_INDEX = null; // built lazily on first search; { col, id, hay } rows
function buildGhazalSearchIndex() {
  const cols = GHAZAL_COLS.map(c => [c, collectionData(c)]);
  const idx = [];
  cols.forEach(([col, corpus]) => {
    const poetNames = POET_NAMES[col] || null;
    corpus.forEach(item => {
      const fields = poetNames ? poetNames.slice() : [item.poet || ''];
      fields.push(String(item.id));
      if (item.lines && item.lines.length) {
        item.lines.forEach(l => {
          if (l.ur) fields.push(l.ur);
          if (l.hi) fields.push(l.hi);
          if (l.ro) fields.push(l.ro);
          if (l.ascii) fields.push(l.ascii);
        });
      }
      idx.push({ col, id: String(item.id), hay: searchNorm(fields.filter(Boolean).join(' ')) });
    });
  });
  GHAZAL_SEARCH_INDEX = idx;
}
window.buildGhazalSearchIndex = buildGhazalSearchIndex;

function findMatchingLine(item, terms) {
  if (!item || !item.lines || !item.lines.length) return null;
  if (!terms || !terms.length) return item.lines[0];
  for (let i = 0; i < item.lines.length; i++) {
    const l = item.lines[i];
    const text = [l.ur, l.hi, l.ro, l.ascii].filter(Boolean).join(' ');
    const norm = searchNorm(text);
    if (terms.some(t => norm.indexOf(t) !== -1)) {
      return l;
    }
  }
  return item.lines[0];
}
window.findMatchingLine = findMatchingLine;

/* -> { handbook: Set<id>, ghalib: Set<id>, mir: Set<id>, others: Set<id> } or null for an empty query.
   All query words must appear (substring) in a row's haystack — good enough for
   short poet-name / first-line / number queries without needing real tokenization. */
function searchGhazalIndex(q) {
  const nq = searchNorm(q);
  if (!nq) return null;
  if (!GHAZAL_SEARCH_INDEX) buildGhazalSearchIndex();
  const terms = nq.split(' ').filter(Boolean);
  const out = {}; GHAZAL_COLS.forEach(c => { out[c] = new Set(); });
  GHAZAL_SEARCH_INDEX.forEach(rec => {
    if (terms.every(t => rec.hay.indexOf(t) !== -1)) out[rec.col].add(rec.id);
  });
  return out;
}
window.searchGhazalIndex = searchGhazalIndex;

/* The famous misra for a meter, in the current script, plus its poet — for
   the reader header's "Same bahr as …" reference line. Reads the FAMS/
   famOfMeter globals (owned by the Player & Meter agent's data file) but
   doesn't modify them. */
function poetPossessive(poet) {
  if (!poet) return '';
  const p = poet.trim();
  if (/s$/i.test(p)) return `${p}'`;
  return `${p}'s`;
}

const EXTENDED_METER_BENCHMARKS = {
  faiz: {
    33: { p: 'Faiz', ur: 'گلوں میں رنگ بھرے باد نوبہار چلے', ro: 'guloñ meñ rang bhare bād-e-naubahār chale', hi: 'गुलों में रंग भरे बाद-ए-नौबहार चले', ref: 'Faiz 3' },
    34: { p: 'Faiz', ur: 'گلوں میں رنگ بھرے باد نوبہار چلے', ro: 'guloñ meñ rang bhare bād-e-naubahār chale', hi: 'गुलों में रंग भरे बाद-ए-नौबहार चले', ref: 'Faiz 3' },
    18: { p: 'Faiz', ur: 'دل میں اب یوں ترے بھولے ہوئے غم آتے ہیں', ro: 'dil meñ ab yūñ tire bhūle hue ġham aate haiñ', hi: 'दिल में अब यूँ तिरे भूले हुए ग़म आते हैं', ref: 'Faiz 12' },
    19: { p: 'Faiz', ur: 'دل میں اب یوں ترے بھولے ہوئے غم آتے ہیں', ro: 'dil meñ ab yūñ tire bhūle hue ġham aate haiñ', hi: 'दिल में अब यूँ तिरे भूले हुए ग़म आते हैं', ref: 'Faiz 12' },
    14: { p: 'Faiz', ur: 'آئے کچھ ابر کچھ شراب آئے', ro: 'ā.e kuchh abr kuchh sharāb ā.e', hi: 'आए कुछ अब्र कुछ شراب आए', ref: 'Faiz 2' },
    15: { p: 'Faiz', ur: 'آئے کچھ ابر کچھ شراب آئے', ro: 'ā.e kuchh abr kuchh sharāb ā.e', hi: 'आए कुछ अब्र कुछ شراب आए', ref: 'Faiz 2' }
  },
  iqbal: {
    14: { p: 'Iqbal', ur: 'ستاروں سے آگے جہاں اور بھی ہیں', ro: 'sitāroñ se aage jahāñ aur bhī haiñ', hi: 'सितारों से आगे जहाँ और भी हैं', ref: 'Iqbal 2' },
    15: { p: 'Iqbal', ur: 'ستاروں سے آگے جہاں اور بھی ہیں', ro: 'sitāroñ se aage jahāñ aur bhī haiñ', hi: 'सितारों से आगे जहाँ और भी हैं', ref: 'Iqbal 2' },
    26: { p: 'Iqbal', ur: 'لب پہ آتی ہے دعا بن کے تمنا میری', ro: 'lab pe aatī hai duʿā ban ke tamannā merī', hi: 'लब पे आती है दुआ बन के तमन्ना मेरी', ref: 'Iqbal' },
    33: { p: 'Iqbal', ur: 'کبھی اے حقیقتِ منتظر نظر آ لباسِ مجاز میں', ro: 'kabhī ai ḥaqīqat-e-muntaz̤ar nazar ā libās-e-majāz meñ', hi: 'कभी ऐ हक़ीक़त-ए-मुंतज़र नज़र आ लिबास-ए-मजाज़ में', ref: 'Iqbal' },
    34: { p: 'Iqbal', ur: 'کبھی اے حقیقتِ منتظر نظر آ لباسِ مجاز میں', ro: 'kabhī ai ḥaqīqat-e-muntaz̤ar nazar ā libās-e-majāz meñ', hi: 'कभी ऐ हक़ीक़त-ए-मुंतज़र नज़र आ लिबास-ए-मजाज़ में', ref: 'Iqbal' }
  },
  faraz: {
    33: { p: 'Faraz', ur: 'رنجش ہی سہی دل ہی دکھانے کے لیے آ', ro: 'ranjish hī sahī dil hī dukhāne ke liye ā', hi: 'रंजिश ہی सही दिल ही दुखाने के लिए आ', ref: 'Faraz 3' },
    34: { p: 'Faraz', ur: 'رنجش ہی سہی دل ہی دکھانے کے لیے آ', ro: 'ranjish hī sahī dil hī dukhāne ke liye ā', hi: 'रंजिश ہی सही दिल ही दुखाने के लिए आ', ref: 'Faraz 3' },
    18: { p: 'Faraz', ur: 'سنا ہے لوگ اسے آنکھ بھر کے دیکھتے ہیں', ro: 'sunā hai log use āñkh bhar ke dekhte haiñ', hi: 'सुना है लोग उसे आँख भर के देखते हैं', ref: 'Faraz 1' },
    19: { p: 'Faraz', ur: 'سنا ہے لوگ اسے آنکھ بھر کے دیکھتے ہیں', ro: 'sunā hai log use āñkh bhar ke dekhte haiñ', hi: 'सुना है लोग उसे आँख भर के देखते हैं', ref: 'Faraz 1' },
    14: { p: 'Faraz', ur: 'سلسلے توڑ گیا وہ سبھی جاتے جاتے', ro: 'silsile toḌ gayā vo sabhī jaate jaate', hi: 'सिलसिले तोड़ गया वो सभी जाते जाते', ref: 'Faraz 2' },
    15: { p: 'Faraz', ur: 'سلسلے توڑ گیا وہ سبھی جاتے جاتے', ro: 'silsile toḌ gayā vo sabhī jaate jaate', hi: 'सिलसिले तोड़ गया वो सभी जाते जाते', ref: 'Faraz 2' }
  },
  parveen: {
    14: { p: 'Parveen Shakir', ur: 'کو بہ کو پھیل گئی بات شناسائی کی', ro: 'kū-bah-kū phail ga.ī baat shanāsā.ī kī', hi: 'कू-ब-कू फैल गई बात शनासाई की', ref: 'Parveen 1' },
    15: { p: 'Parveen Shakir', ur: 'کو بہ کو پھیل گئی بات شناسائی کی', ro: 'kū-bah-kū phail ga.ī baat shanāsā.ī kī', hi: 'कू-ब-कू फैल गई बात शनासाई की', ref: 'Parveen 1' },
    18: { p: 'Parveen Shakir', ur: 'وہ تو خوشبو ہے ہواؤں میں بکھر جائے گا', ro: 'vo to ḳhushbū hai havāoñ meñ bikhar jā.egā', hi: 'वो तो ख़ुशबू है हवाओं में बिखर जाएगा', ref: 'Parveen 3' },
    19: { p: 'Parveen Shakir', ur: 'وہ تو خوشبو ہے ہواؤں میں بکھر جائے گا', ro: 'vo to ḳhushbū hai havāoñ meñ bikhar jā.egā', hi: 'वो तो ख़ुशबू है हवाओं में बिखर जाएगा', ref: 'Parveen 3' }
  },
  jaun: {
    33: { p: 'Jaun Elia', ur: 'شاید مجھے کسی سے محبت نہیں ہوئی', ro: 'shāyad mujhe kisī se maḥabbat nahīñ huī', hi: 'शायद मुझे किसी से मोहब्बत नहीं हुई', ref: 'Jaun 3' },
    34: { p: 'Jaun Elia', ur: 'شاید مجھے کسی سے محبت نہیں ہوئی', ro: 'shāyad mujhe kisī se maḥabbat nahīñ huī', hi: 'शायद मुझे किसी से मोहब्बत नहीं हुई', ref: 'Jaun 3' },
    14: { p: 'Jaun Elia', ur: 'بے قراری سی بے قراری ہے', ro: 'be-qarārī sī be-qarārī hai', hi: 'बे-क़रारी सी बे-क़रारी है', ref: 'Jaun 1' },
    15: { p: 'Jaun Elia', ur: 'بے قراری سی بے قراری ہے', ro: 'be-qarārī sī be-qarārī hai', hi: 'बे-क़रारी सी बे-क़रारी है', ref: 'Jaun 1' }
  }
};

/* Canonical signature verses for each bahr across the entire system.
   Curated to iconic, widely sung, celebrated verses. */
const CANONICAL_SIGNATURE_VERSES = {
  3: {
    p: 'Nazeer',
    ur: 'محفل میں ہم تھے اس طرف وہ شوخ چنچل اس طرف',
    ro: 'mahfil meñ ham the is taraf vo shoḳh chanchal us taraf',
    hi: 'महफ़िल में हम थे इस तरफ़ वो शोख़ चंचल इस तरफ़',
    ref: 'Nazeer · Bahr-e-Rajaz'
  },
  4: {
    p: 'Dagh',
    ur: 'عجب اپنا حال ہوتا جو وصال یار ہوتا',
    ro: 'ʿajab apnā ḥāl hotā jo viṣāl-e yār hotā',
    hi: 'अजब अपना हाल होता जो विसाल-ए यार होता',
    ref: 'Dagh · sung by Mehdi Hassan, Ghulam Ali'
  },
  5: {
    p: 'Faraz',
    ur: 'رنجش ہی سہی دل ہی دکھانے کے لیے آ',
    ro: 'ranjish hī sahī dil hī dukhāne ke liye ā',
    hi: 'रंजिश ही सही दिल ही दुखाने के लिए आ',
    ref: 'Faraz · sung by Mehdi Hassan',
    alt: {
      p: 'Ghalib',
      ur: 'مدت ہوئی ہے یار کو مہماں کیے ہوئے',
      ro: 'muddat huī hai yaar ko mehmāñ kiye hue',
      hi: 'मुद्दत हुई है यार को मेहमाँ किए हुए',
      ref: 'Ghalib 233'
    }
  },
  7: {
    p: 'Faiz',
    ur: 'کب ٹھہرے گا درد اے دل کب رات بسر ہوگی',
    ro: 'kab ṭhahregā dard ai dil kab raat basar hogī',
    hi: 'कब ठहरेगा दर्द ऐ दिल कब रात बसर होगी',
    ref: 'Faiz · sung by Tina Sani, Nayyara Noor'
  },
  10: {
    p: 'Ghalib',
    ur: 'نقش فریادی ہے کس کی شوخی تحریر کا',
    ro: 'naqsh faryādī hai kis kī shoḳhī-e taḥrīr kā',
    hi: 'नक़्श फ़रियादी है किस की शोख़ी-ए तहरीर का',
    ref: 'Ghalib 1 · Divan-e Ghalib opening'
  },
  22: {
    p: 'Nazeer',
    ur: 'جام نہ رکھ ساقیا شب ہے پڑی اور بھی',
    ro: 'jām nah rakh sāqiyā shab hai paṛī aur bhī',
    hi: 'जाम न रख साक़िया शब है पड़ी और भी',
    ref: 'Nazeer · Saqi-nama'
  },
  27: {
    p: 'Hafeez Hoshiarpuri',
    ur: 'محبت کرنے والے کم نہ ہوں گے',
    ro: 'muḥabbat karne vāle کم nah hoñge'.replace('کم', 'kam'),
    hi: 'मोहब्बत करने वाले कम न होंगे',
    ref: 'Hafeez Hoshiarpuri · sung by Mehdi Hassan, Iqbal Bano, Ghulam Ali'
  },
  28: {
    p: 'Iqbal',
    ur: 'ترے عشق کی انتہا چاہتا ہوں',
    ro: 'tire ʿishq kī intihā chāhtā huuñ',
    hi: 'तिरे इश्क़ की इंतहा चाहता हूँ',
    ref: 'Iqbal · sung by Nusrat Fateh Ali Khan'
  },
  29: {
    p: 'Mir',
    ur: 'فقیرانہ آئے صدا کر چلے',
    ro: 'faqīrānah āʾe ṣadā kar chale',
    hi: 'फ़क़ीराना आए सदा कर चले',
    ref: 'Mir 161 · sung by Mehdi Hassan, Begum Akhtar, Ghulam Ali'
  },
  31: {
    p: 'Parveen Shakir',
    ur: 'عکس خوشبو ہوں بکھرنے سے نہ روکے کوئی',
    ro: 'aks-e-ḳhushbū huuñ bikharne se nah roke koʾī',
    hi: 'अक्स-ए-ख़ुशबू हूँ बिखरने से न रोके कोई',
    ref: 'Parveen Shakir 1'
  },
  32: {
    p: 'Parveen Shakir',
    ur: 'سبھی گناہ دھل گئے سزا ہی اور ہو گئی',
    ro: 'sabhī gunāh dhul ga.e sazā hī aur ho ga.ī',
    hi: 'सभी गुनाह धुल गए सज़ा ही और हो गई',
    ref: 'Parveen Shakir 65'
  },
  35: {
    p: 'Ghalib',
    ur: 'عجب نشاط سے جلاد کے چلے ہیں ہم آگے',
    ro: 'ʿajab nashāt̤ se jallād ke chale haiñ ham āge',
    hi: 'अजब नशात से जल्लाद के चले हैं हम आगे',
    ref: 'Ghalib 176'
  },
  40: {
    p: 'Amir Khusrau',
    ur: 'زحال مسکیں مکن تغافل دورائے نیناں بنائے بتیاں',
    ro: 'ze-hāl-e-miskīñ ma-kun taġhāful durāye naināñ banāye bātyāñ',
    hi: 'ज़े-हाल-ए-मिस्कीं मकुन तग़ाफ़ुल दुराए नैनाँ बनाए बतियाँ',
    ref: 'Amir Khusrau · sung by Ghulam Ali, Lata Mangeshkar, Sabri Brothers'
  }
};
window.CANONICAL_SIGNATURE_VERSES = CANONICAL_SIGNATURE_VERSES;

function meterFamousLine(mId, item) {
  if (!mId) return null;
  const numId = Number(mId);
  const idStr = String(mId);
  const fam = (typeof famOfMeter !== 'undefined') ? (famOfMeter[numId] || famOfMeter[idStr]) : null;
  const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';

  const curCol = (typeof activeCollection !== 'undefined') ? activeCollection : '';
  const curPoet = (item && item.poet) || (curCol && typeof COL_NAMES !== 'undefined' && COL_NAMES[curCol]) || '';
  const poetKey = curPoet.toLowerCase();

  function lineText(entry) {
    if (!entry) return '';
    if (typeof getLineDisplay === 'function') return getLineDisplay(entry, cs);
    return entry[cs] || entry.ur || entry.ro || entry.ascii || '';
  }

  // 0. Canonical Benchmark Override (Curated Iconic Verses)
  const canEntry = CANONICAL_SIGNATURE_VERSES[numId] || CANONICAL_SIGNATURE_VERSES[idStr];
  if (canEntry) {
    let chosen = canEntry;
    const isSamePoet = poetKey && canEntry.p.toLowerCase().includes(poetKey);
    if (numId === 5) {
      // User directive: "5 use both randomly" (Faraz / Ghalib)
      if (poetKey === 'faraz' || curCol === 'faraz') {
        chosen = canEntry.alt; // Ghalib
      } else if (poetKey === 'ghalib' || curCol === 'ghalib') {
        chosen = canEntry; // Faraz
      } else {
        chosen = (Math.random() < 0.5) ? canEntry : canEntry.alt;
      }
    } else if (isSamePoet) {
      chosen = null; // Fall through to cross-poet search or signature verse
    }
    if (chosen) {
      const text = lineText(chosen);
      if (text) return { text, poet: chosen.p || '', ref: chosen.ref || '' };
    }
  }

  // 1. Check extended modern poet benchmark
  const pMap = (poetKey && EXTENDED_METER_BENCHMARKS[poetKey]) || (curCol && EXTENDED_METER_BENCHMARKS[curCol]);
  if (pMap && pMap[numId]) {
    const pEntry = pMap[numId];
    const text = lineText(pEntry);
    if (text) return { text, poet: pEntry.p || '', ref: pEntry.ref || '' };
  }

  // 2. Check if famOfMeter contains an entry for this poet
  if (fam && fam.gz && fam.gz.length) {
    if (poetKey) {
      const match = fam.gz.find(x => x.p && x.p.toLowerCase().includes(poetKey));
      if (match) {
        const text = lineText(match);
        return text ? { text, poet: match.p || '', ref: match.ref || '' } : null;
      }
    }
  }

  // 3. Balanced Cross-Poet Mix-and-Match in core families:
  if (fam && fam.gz && fam.gz.length) {
    let chosen = null;
    if ((numId === 14 || numId === 15) && fam.gz[4]) {
      chosen = (poetKey === 'ghalib' || curCol === 'ghalib') ? fam.gz[0] : fam.gz[4];
    } else if ((numId === 18 || numId === 19) && fam.gz[1]) {
      chosen = (poetKey === 'ghalib' || curCol === 'ghalib') ? fam.gz[1] : fam.gz[0];
    } else if ((numId === 33 || numId === 34)) {
      if (poetKey === 'ghalib' || curCol === 'ghalib') {
        chosen = fam.gz[2] || fam.gz[0];
      } else if (EXTENDED_METER_BENCHMARKS.faiz && EXTENDED_METER_BENCHMARKS.faiz[33]) {
        const fz = EXTENDED_METER_BENCHMARKS.faiz[33];
        const text = lineText(fz);
        return { text, poet: fz.p, ref: fz.ref };
      }
    } else if (numId === 5 && fam.gz[1]) {
      chosen = (poetKey === 'ghalib' || curCol === 'ghalib') ? fam.gz[1] : fam.gz[0];
    } else if (numId === 10 && fam.gz[2]) {
      chosen = (poetKey === 'ghalib' || curCol === 'ghalib') ? fam.gz[2] : fam.gz[0];
    } else if (numId === 11 && fam.gz[1]) {
      chosen = fam.gz[1];
    } else if (numId === 26 && fam.gz[1]) {
      chosen = (poetKey === 'ghalib' || curCol === 'ghalib') ? fam.gz[1] : fam.gz[0];
    }

    if (!chosen && poetKey) {
      chosen = fam.gz.find(x => x.p && !x.p.toLowerCase().includes(poetKey));
    }
    if (!chosen) chosen = fam.gz[0];
    if (chosen) {
      const text = lineText(chosen);
      if (text) return { text, poet: chosen.p || '', ref: chosen.ref || '' };
    }
  }

  // 4. Dynamic Corpus Search: Find another poet who used this meter
  // (preferring an alternative poet so "Same bahr as <Other Poet>'s" is shown)
  let altVerse = null;
  let selfVerse = null;

  function checkList(list, pName, pKey) {
    if (!list || !Array.isArray(list)) return;
    for (let i = 0; i < list.length; i++) {
      const g = list[i];
      const gMeters = g.meters || (g.m != null ? [g.m] : (g.meter != null ? [g.meter] : []));
      const match = Array.isArray(gMeters) ? gMeters.some(x => String(x) === idStr) : String(gMeters) === idStr;
      if (match && g.lines && g.lines[0]) {
        const txt = lineText(g.lines[0]);
        if (txt) {
          const isCurr = poetKey && (pKey === poetKey || pName.toLowerCase().includes(poetKey));
          const entry = { text: txt, poet: pName, ref: `${pName} ${g.id || ''}`.trim() };
          if (!isCurr && !altVerse) {
            altVerse = entry;
            return;
          } else if (isCurr && !selfVerse) {
            selfVerse = entry;
          }
        }
      }
    }
  }

  if (typeof GHALIB_EXT_DATA !== 'undefined') checkList(GHALIB_EXT_DATA, 'Ghalib', 'ghalib');
  if (!altVerse && typeof MIR_EXT_DATA !== 'undefined') checkList(MIR_EXT_DATA, 'Mir', 'mir');
  if (!altVerse && typeof poetCollections === 'function') {
    for (const [pKey, items] of poetCollections()) {
      const pMeta = (typeof POETS_DATA !== 'undefined' && POETS_DATA.poets) ? POETS_DATA.poets.find(p => p.key === pKey) : null;
      const pName = pMeta ? pMeta.name : pKey;
      checkList(items, pName, pKey.toLowerCase());
      if (altVerse) break;
    }
  }

  if (altVerse) return altVerse;

  // 5. Fallback for meters outside the core 10 families from meterLabelInfo:
  if (typeof meterLabelInfo === 'function') {
    const info = meterLabelInfo(mId);
    if (info && info.verse) {
      const v = info.verse;
      const text = lineText(v);
      if (text) {
        return {
          text,
          poet: v.poet || '',
          ref: v.ref || (v.poet ? `${v.poet}` : '')
        };
      }
    }
  }

  if (selfVerse) return selfVerse;

  // 6. ULTIMATE SAFETY NET:
  // If this poem is the first or only poem in this bahr across the entire corpus,
  // use the poem's own opening misra. The reader will display it as:
  // "Signature verse for this bahr: <Misra>"
  // so the top card is NEVER empty or missing.
  if (item && item.lines && item.lines[0]) {
    const text = lineText(item.lines[0]);
    if (text) {
      const pName = item.poet || (curCol && typeof COL_NAMES !== 'undefined' && COL_NAMES[curCol]) || '';
      return {
        text,
        poet: pName,
        ref: `${pName} ${item.id || 1}`.trim()
      };
    }
  }

  return null;
}

/* PB-compatible "line" for a bare pattern string (no verse) — lets the
   reader header's ▶ go through the shared pbToggle controller (round 2 G1)
   without a real Scan.explain() result. Same technique as rawPbLine() in
   21-learn.js; requested as a formal pbTogglePattern() helper in
   15-audio.js so every "play the pattern only" button can share it — see
   final report. */
function readerPatternLine(raw, host) {
  if (typeof Scan === 'undefined' || !Scan.parseRaw) return null;
  const toks = Scan.parseRaw(raw).filter(t => t === 'l' || t === 's' || t === 'x' || t === 'c');
  return { e: { syl: toks.map(t => ({ resolved: t })) }, nodes: host ? [...host.querySelectorAll('.blk')] : null, groups: null };
}

function toggleReaderPatternPlay(mId, btn) {
  if (typeof pbToggle !== 'function') return;
  const info = (typeof meterLabelInfo === 'function') ? meterLabelInfo(mId) : null;
  if (!info || !info.pattern) return;
  const host = btn.closest('.reader-header-comp');
  const patHost = host ? host.querySelector('.reader-header-pattern') : null;
  pbToggle('reader-pattern:' + mId, btn, () => {
    const line = readerPatternLine(info.pattern, patHost);
    return line ? [line] : null;
  });
}
window.toggleReaderPatternPlay = toggleReaderPatternPlay;

/* Reader header (§5.8 / round 2): meter number + name as the title, its
   pattern centred underneath, and — clearly marked as a reference, not this
   ghazal's own line — the famous misra for the bahr. Built here rather than
   via renderMeterLabel() (18b-meter-label.js) because that component shows
   the famous misra as the PRIMARY line, which reads as though it were this
   ghazal's own first line. */
function patEnding(raw){
  if(!raw) return '';
  const parts = String(raw).split('/');
  return parts[parts.length - 1].trim();
}

function renderGhazalReaderHeader(mId, item) {
  if (!mId) {
    return `
    <div class="reader-header-comp reader-benchmark-card reader-header-unsettled">
      <div class="row reader-header-top-row">
        <span class="mono reader-header-mnum dim">Unsettled</span>
        <span class="reader-header-intro dim"> · Scansion consensus pending</span>
      </div>
      <div class="reader-header-tech faint tiny">This poem's meter has not been settled yet. Tap "Edit in Scan ›" below to analyze it.</div>
    </div>
  `;
  }
  const info = (typeof meterLabelInfo === 'function') ? meterLabelInfo(mId) : null;
  if (!info) return '';
  const pairGroup = (item && item.meters && item.meters.length > 1)
    ? item.meters
    : (typeof SCAN_PAIRS !== 'undefined' ? (SCAN_PAIRS.find(p => p.includes(Number(mId))) || null) : null);
  const isPair = !!pairGroup;
  const pairTip = 'Classic paired meters: In Classical Urdu prosody, these variation endings can be freely alternated within the same poem without breaking meter. (Handbook \u00a76.1)';
  const pairPill = isPair ? ` <span class="pair-bahr-pill" tabindex="0" data-tip="${pairTip}">Paired Bahr</span>` : '';
  const canPlay = !!info.pattern;
  let patternHtml = (info.pattern && typeof feetStrip === 'function') ? feetStrip(info.pattern) : '';
  if (isPair && pairGroup && pairGroup.length === 2 && typeof Scan !== 'undefined' && Scan.METERS) {
    const m1 = Scan.METERS.find(x => x.id === pairGroup[0]);
    const m2 = Scan.METERS.find(x => x.id === pairGroup[1]);
    const r1 = m1 ? (m1.raw || m1.pattern) : '';
    const r2 = m2 ? (m2.raw || m2.pattern) : '';
    if (r1 && r2 && typeof Scan.patternFeet === 'function') {
      const p1 = Scan.patternFeet(r1);
      const p2 = Scan.patternFeet(r2);
      if (p1.length === p2.length && p1.length > 0) {
        const lastIdx = p1.length - 1;
        const f1L = p1[lastIdx];
        const f2L = p2[lastIdx];
        if (f1L.pat !== f2L.pat && typeof strip === 'function') {
          const altToks = strip(f2L.toks);
          const altFn = (f2L.ro && f2L.ro.length) ? ` <span class="alt-fn">(or ${f2L.ro.join('·')})</span>` : '';
          const feetHtml = p1.map((f, i) => {
            if (i === lastIdx) {
              return `${f.caeBefore ? '<span class="cae">//</span>' : ''}<span class="fbox"><span class="strip tight">${strip(f.toks)} <span class="alt-or faint">(or <span class="alt-strip">${altToks}</span>)</span></span><span class="fn">${f.ro.join('·')}${altFn}</span></span>`;
            }
            return `${f.caeBefore ? '<span class="cae">//</span>' : ''}<span class="fbox"><span class="strip tight">${strip(f.toks)}</span><span class="fn">${f.ro.join('·')}</span></span>`;
          }).join('');
          patternHtml = `<div class="fstrip">${feetHtml}</div>`;
        }
      }
    }
  }
  const numLabel = isPair ? ('Meter #' + pairGroup.join(' / #')) : info.number;
  const numHtml = `<span class="mono reader-header-mnum">${escapeHtml(numLabel)}</span>`;
  const famous = meterFamousLine(mId, item);
  const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
  const langDir = (typeof getLangDir === 'function') ? getLangDir(cs) : '';
  const misraScriptCls = cs === 'ur' ? 'urdu' : (cs === 'hi' ? 'deva' : 'roman');

  let isSelf = false;
  if (famous && item) {
    const mRef = famous.ref ? famous.ref.match(/^([A-Za-z]+)\s+(\d+)$/) : null;
    const curCol = (typeof activeCollection !== 'undefined') ? activeCollection : '';
    if (mRef && item.id != null) {
      const refPoet = mRef[1].toLowerCase();
      const refNum = parseInt(mRef[2], 10);
      const itemNum = parseInt(item.id, 10);
      if (itemNum === refNum && (curCol === refPoet || (item.poet && item.poet.toLowerCase().includes(refPoet)))) {
        isSelf = true;
      }
    }
    if (!isSelf && item.lines && item.lines[0] && famous.text && typeof searchNorm === 'function') {
      const l1 = item.lines[0];
      const famNorm = searchNorm(famous.text);
      if (famNorm && (
        (l1.ur && searchNorm(l1.ur) === famNorm) ||
        (l1.ro && searchNorm(l1.ro) === famNorm) ||
        (l1.ascii && searchNorm(l1.ascii) === famNorm)
      )) {
        isSelf = true;
      }
    }
  }

  let introHtml = '';
  if (famous) {
    const introLabel = isSelf ? 'Signature verse for this bahr:' : (famous.poet ? `Same bahr as ${poetPossessive(famous.poet)}:` : 'Signature verse for this bahr:');
    introHtml = `<span class="reader-header-intro dim"> · ${escapeHtml(introLabel)}</span>`;
  }

  const heroVerseHtml = famous
    ? `<div class="reader-header-hero-verse reader-header-misra ${misraScriptCls}" ${langDir}>${escapeHtml(famous.text)}</div>`
    : '';

  const techHtml = info.name
    ? `<div class="reader-header-tech faint tiny">${escapeHtml(info.name)}</div>`
    : '';

  return `
    <div class="reader-header-comp reader-benchmark-card">
      <div class="row reader-header-top-row">
        ${canPlay ? `<span class="play sm" role="button" tabindex="0" data-label="Play meter pattern" aria-label="Play meter pattern" onclick="toggleReaderPatternPlay('${info.id}', this)">▶︎</span>` : ''}
        ${numHtml}${pairPill}${introHtml}
      </div>
      ${heroVerseHtml}
      <div class="reader-header-pattern">${patternHtml}</div>
      ${techHtml}
    </div>
  `;
}
window.renderGhazalReaderHeader = renderGhazalReaderHeader;

/* Fran Pritchett's own number for a ghazal (Ghalib: our id is hers; Mir: ours is sequential,
   hers is source_id, e.g. 0006 → 6). Handbook exercises have none. */
function franNum(col, item) {
  if (!item) return null;
  if (col === 'ghalib') return item.id;
  if (col === 'mir') { const n = parseInt(item.source_id, 10); return isNaN(n) ? item.id : n; }
  return null;
}
window.franNum = franNum;
/* her number as a link to her page for that ghazal (new tab); doesn't open our reader.
   opts.bare (round 3): inside a single-collection list the group header already
   carries the collection, so the row just needs "12 ↗" — no "Ghalib"/"Mir" prefix.
   Keep the full "Ghalib 12 ↗" form (the default) wherever rows from different
   collections mix (search results) and in the reader title. */
function franLinkHTML(col, item, opts) {
  const n = franNum(col, item);
  if (n == null) return '';
  const who = col === 'ghalib' ? 'Ghalib' : 'Mir';
  const bare = !!(opts && opts.bare);
  const label = bare ? String(n) : `${who} ${n}`;
  const title = `Frances Pritchett's page for ${who} ${n}`;
  return item.url
    ? `<a class="fran-link" href="${escapeHtml(item.url)}" target="_blank" rel="noopener" onclick="event.stopPropagation()" title="${escapeHtml(title)}">${label}<span class="ext" aria-hidden="true">↗</span></a>`
    : label;
}
window.franLinkHTML = franLinkHTML;
/* ================= GROUP BY METER (round 3) =================
   Lists group rows by their ghazal's meter — the group header carries the
   meter identity (famous misra + pattern + count) so rows themselves no
   longer repeat the meter name/number. A paired meter (mListOf -> [18, 19])
   groups under the FIRST id, since that's the bahr the ghazal is filed
   under everywhere else (meter filter, franLinkHTML, etc). `rows` can be
   plain corpus items (Handbook/Ghalib/Mir lists) or {col, item} pairs
   (universal search, which mixes collections in one group). */
function buildMeterGroups(rows, getMeterId, getSortId) {
  const map = new Map();
  rows.forEach(r => {
    const key = String(getMeterId(r) || '');
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(r);
  });
  const groups = [...map.entries()].map(([key, its]) => {
    its.sort((a, b) => String(getSortId(a)).localeCompare(String(getSortId(b)), undefined, { numeric: true }));
    return { key, rows: its };
  });
  // Largest group first; ties broken by meter id so ordering is stable.
  groups.sort((a, b) => b.rows.length - a.rows.length || a.key.localeCompare(b.key, undefined, { numeric: true }));
  return groups;
}

function meterGroupHeaderHTML(key, count, open) {
  const info = (key && typeof meterLabelInfo === 'function') ? meterLabelInfo(key) : null;
  const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
  let verseHtml = '';
  if (info && info.verse) {
    const text = (typeof getLineDisplay === 'function') ? getLineDisplay(info.verse, cs) : (info.verse[cs] || info.verse.ur);
    if (text) {
      const scriptCls = cs === 'ur' ? 'urdu' : (cs === 'hi' ? 'deva' : 'roman');
      const langDir = (typeof getLangDir === 'function') ? getLangDir(cs) : '';
      // the group is named after a famous verse in this bahr — often by another poet than this collection's
      verseHtml = `<div class="meter-group-label">Bahr of</div><div class="meter-group-verse ${scriptCls}" ${langDir}>${escapeHtml(text)}</div>` +
        (info.verse.poet ? `<div class="meter-group-poet">– ${escapeHtml(info.verse.poet)}</div>` : '');
    }
  }
  if (!verseHtml) {
    const label = (info && info.name) ? info.name : (key ? '#' + key : 'Unfiled · the engine could not settle a bahr');
    verseHtml = `<div class="meter-group-verse faint">${escapeHtml(label)}</div>`;
  }
  const patternHtml = (info && info.pattern && typeof feetStrip === 'function') ? feetStrip(info.pattern) : '';
  return `
    <div class="meter-group-head${open ? ' open' : ''}" role="button" tabindex="0" aria-expanded="${open ? 'true' : 'false'}"
         onclick="toggleMeterGroup('${escapeHtml(key)}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleMeterGroup('${escapeHtml(key)}')}">
      <div class="meter-group-title">${verseHtml}</div>
      ${patternHtml ? `<div class="meter-group-pattern">${patternHtml}</div>` : ''}
      <div class="meter-group-count faint tiny">${count} ghazal${count === 1 ? '' : 's'} <span class="meter-group-chev" aria-hidden="true">${open ? '▴' : '▾'}</span></div>
    </div>
  `;
}

/* Renders as many whole/partial groups as fit in `shownCount` rows (largest
   groups first, per buildMeterGroups), so "Show N more" always continues
   from exactly where the last render left off — including mid-group. */
/* Every meter group is listed up front as one collapsed line; tap to open its ghazals.
   A search or meter filter (or a single group) opens everything that matches. */
const openMeterGroups = new Set();
function toggleMeterGroup(key) {
  if (openMeterGroups.has(key)) openMeterGroups.delete(key); else openMeterGroups.add(key);
  if (typeof renderGhazalsList === 'function') renderGhazalsList();
}
window.toggleMeterGroup = toggleMeterGroup;
/* #/ghazals/<col>?meter=15 (e.g. from Meter › Look up): open that meter's group and bring it into view.
   Paired meters are grouped under the first of the pair. */
const METER_PAIR_HEAD = { 15: 14, 17: 16, 19: 18, 34: 33 };
function openMeterGroupFor(id) {
  const key = String(METER_PAIR_HEAD[id] || id);
  openMeterGroups.add(key);
  if (typeof renderGhazalsList === 'function') renderGhazalsList();
  // each collection's list has its own groups (the hidden ones too), so scroll to the visible one
  if (typeof setTimeout === 'function') setTimeout(() => {
    const el = [...document.querySelectorAll('[data-mgroup="' + key + '"]')].find(n => n.offsetParent !== null || n.getClientRects().length);
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, 80);
}
window.openMeterGroupFor = openMeterGroupFor;
function renderGroupedRows(groups, shownCount, rowRenderer) {
  const mf = $('ghazalMeterFilter');
  const filtering = !!(($('ghazalSearchInput') && $('ghazalSearchInput').value.trim()) || (mf && mf.value && mf.value !== 'all'));
  let html = '';
  groups.forEach(g => {
    const open = filtering || groups.length === 1 || openMeterGroups.has(g.key);
    html += `<div class="meter-group${open ? ' open' : ''}" data-mgroup="${escapeHtml(g.key)}">` + meterGroupHeaderHTML(g.key, g.rows.length, open);
    if (open) html += `<div class="meter-group-rows">${g.rows.map((r, i) => rowRenderer(r, i, g.rows.length)).join('')}</div>`;
    html += `</div>`;
  });
  const totalRows = groups.reduce((s, g) => s + g.rows.length, 0);
  return { html, shownRows: totalRows, totalRows };   // no "show more": groups are the pagination
}

function getGhazalNavLabel(col, item) {
  if (!item) return '';
  if (col === 'handbook') return item.poet || 'Handbook';
  const n = franNum(col, item);
  if (col === 'ghalib') return `Ghalib ${n}`;
  if (col === 'mir') return `Mir ${n}`;
  if (isPoetCol(col)) return `${item.poet} ${item.id}`;
  return `${col} ${item.id}`;
}

function updateCollectionCounts() {
  const col = (typeof activeCollection !== 'undefined') ? activeCollection : 'handbook';
  const host = $('ghazalCollectionCount');
  if (host) {
    const all = collectionData(col), shown = all.filter(g => poetLangMatch(col, g));
    if (shown.length === all.length) host.textContent = all.length + ' ghazals';
    else host.innerHTML = `${shown.length} ${poetLangFilter === 'fa' ? 'Fārsī' : 'Urdu'} of ${all.length} ghazals · <button type="button" class="btn link" onclick="setPoetLang('all')">show all</button>`;
  }
  renderPoetPickerButton();
}

function populateGhazalMeterFilter(col) {
  const sel = $('ghazalMeterFilter');
  if (!sel) return;

  const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
  const corpus = collectionData(col);

  const meterCounts = {};
  corpus.forEach(item => {
    const dedup = [...new Set(mListOf(item).map(x => String(x)))];
    dedup.forEach(id => {
      meterCounts[id] = (meterCounts[id] || 0) + 1;
    });
  });

  const sortedIds = Object.keys(meterCounts).sort((a, b) => {
    if (meterCounts[b] !== meterCounts[a]) return meterCounts[b] - meterCounts[a];
    return a.localeCompare(b, undefined, { numeric: true });
  });

  const currentVal = sel.value;
  let optsHtml = `<option value="all">All meters (${corpus.length})</option>`;
  sortedIds.forEach(id => {
    let preview = '';
    const info = (typeof meterLabelInfo === 'function') ? meterLabelInfo(id) : null;
    if (info && info.verse) {
      const vText = (typeof getLineDisplay === 'function') ? getLineDisplay(info.verse, cs) : (info.verse[cs] || info.verse.ur);
      preview = vText ? (vText.slice(0, 28) + (vText.length > 28 ? '…' : '')) : (info.pattern || '');
    } else if (info && info.pattern) {
      preview = info.pattern;
    }
    const label = preview ? `${preview} — #${id} (${meterCounts[id]})` : `Meter #${id} (${meterCounts[id]})`;
    optsHtml += `<option value="${id}">${label}</option>`;
  });

  sel.innerHTML = optsHtml;
  if (currentVal && (currentVal === 'all' || sortedIds.includes(currentVal))) {
    sel.value = currentVal;
  } else {
    sel.value = 'all';
  }
}

function onGhazalFilterChange() {
  ghazalShownCount = 30;
  renderGhazalsList();
}
window.onGhazalFilterChange = onGhazalFilterChange;

function onGhazalSearch() {
  ghazalShownCount = 30;
  clearTimeout(ghazalSearchDebounce);
  ghazalSearchDebounce = setTimeout(() => {
    const q = ($('ghazalSearchInput') && $('ghazalSearchInput').value.trim()) || '';
    if (!q) {
      searchCollectionFilter = 'all';
      const col = (typeof activeCollection !== 'undefined') ? activeCollection : 'handbook';
      const count = collectionData(col).length;
      const countText = count.toLocaleString() + ' ghazals';
      const descs = {
        'handbook': 'The handbook\'s exercise ghazals, with Frances Pritchett\'s notes. <a class="fran-link" href="https://franpritchett.com/00ghalib/meterbk/10_ex_01_06.html" target="_blank" rel="noopener">Her exercises<span class="ext">↗</span></a> · <a class="fran-link" href="https://franpritchett.com/00ghalib/meterbk/11_exnotes.html" target="_blank" rel="noopener">answers &amp; notes<span class="ext">↗</span></a>',
        'ghalib': "Ghalib's divan, scanned and meter-checked by the engine.",
        'mir': "Mir Taqi Mir, scanned and meter-checked by the engine.",
      };
      const descText = descs[col] || (isPoetCol(col) ? 'Rekhta corpus' : '');
      if ($('colDesc')) {
        $('colDesc').innerHTML = `<span id="ghazalCollectionCount" class="ghazal-collection-count">${countText}</span>${descText ? ' · <span id="colDescText">' + descText + '</span>' : ''}`;
      } else if ($('ghazalCollectionCount')) {
        $('ghazalCollectionCount').textContent = countText;
      }
    }
    renderGhazalsList();
    // shareable: the address bar carries the search
    if (typeof setHashQuiet === 'function') setHashQuiet(q ? '/ghazals?q=' + encodeURIComponent(q) : '/ghazals/' + (typeof activeCollection !== 'undefined' ? activeCollection : 'handbook'));
  }, 150);
}
window.onGhazalSearch = onGhazalSearch;

/* Highlight the segmented buttons for whichever meaning currently applies:
   collection switch (normal browsing) or result filter (search active). */
function syncCollectionButtons() {
  const searchActive = !!($('ghazalSearchInput') && $('ghazalSearchInput').value.trim());
  const on = searchActive ? searchCollectionFilter : activeCollection;
  if ($('colFilterLabel')) $('colFilterLabel').hidden = !searchActive;   // while searching, the tabs narrow the results
  const btns = { handbook: 'colBtnHandbook', ghalib: 'colBtnGhalib', mir: 'colBtnMir' };
  Object.keys(btns).forEach(k => {
    const el = $(btns[k]);
    if (el) el.classList.toggle('on', k === on);
  });
  const pb = $('colBtnPoets');
  if (pb) pb.classList.toggle('on', isPoetCol(on));
  renderPoetPickerButton();
}

function switchCollection(col) {
  if (typeof closeGhazalReader === 'function') closeGhazalReader();   // on mobile the reader covers the tabs
  const searchActive = !!($('ghazalSearchInput') && $('ghazalSearchInput').value.trim());
  if (searchActive) {
    // While a query is active, the segmented control filters the merged
    // cross-collection results instead of switching pages; click the same
    // one again to go back to "all collections".
    searchCollectionFilter = (searchCollectionFilter === col) ? 'all' : col;
    syncCollectionButtons();
    renderGhazalsList();
    return;
  }

  activeCollection = col;
  searchCollectionFilter = 'all';
  syncCollectionButtons();
  if (typeof setHashQuiet === 'function') setHashQuiet(`/ghazals/${col}`);

  const descs = {
    'handbook': 'The handbook\'s exercise ghazals, with Frances Pritchett\'s notes. <a class="fran-link" href="https://franpritchett.com/00ghalib/meterbk/10_ex_01_06.html" target="_blank" rel="noopener">Her exercises<span class="ext">↗</span></a> · <a class="fran-link" href="https://franpritchett.com/00ghalib/meterbk/11_exnotes.html" target="_blank" rel="noopener">answers &amp; notes<span class="ext">↗</span></a>',
    'ghalib': "Ghalib's divan, scanned and meter-checked by the engine.",
    'mir': "Mir Taqi Mir, scanned and meter-checked by the engine.",
  };
  const count = collectionData(col).length;
  const countText = count.toLocaleString() + ' ghazals';
  const descText = descs[col] || (isPoetCol(col) ? 'Rekhta corpus' : '');

  if ($('colDesc')) {
    $('colDesc').innerHTML = `<span id="ghazalCollectionCount" class="ghazal-collection-count">${countText}</span>${descText ? ' · <span id="colDescText">' + descText + '</span>' : ''}`;
  } else if ($('ghazalCollectionCount')) {
    $('ghazalCollectionCount').textContent = countText;
  }
  if ($('ghazalEyebrow')) $('ghazalEyebrow').textContent = '';

  const cHandbook = $('handbookExContainer');
  const cGhalib = $('ghalibContainer');
  const cMir = $('mirContainer');
  const cPoets = $('poetsContainer');
  if (cPoets) { cPoets.classList.toggle('hidden', !isPoetCol(col)); cPoets.style.display = ''; }

  if (cHandbook) { cHandbook.classList.toggle('hidden', col !== 'handbook'); cHandbook.style.display = ''; }
  if (cGhalib) { cGhalib.classList.toggle('hidden', col !== 'ghalib'); cGhalib.style.display = ''; }
  if (cMir) { cMir.classList.toggle('hidden', col !== 'mir'); cMir.style.display = ''; }

  ghazalShownCount = 30;
  populateGhazalMeterFilter(col);
  renderGhazalsList();
}
window.switchCollection = switchCollection;

/* ---- Poets ▾: one tab for every poet beyond Handbook/Ghalib/Mir. It opens a flat fold-out under the tabs
   (a filter box and one hairline row per poet with its count), never a floating menu. */
function renderPoetPickerButton() {
  const b = $('colBtnPoets');
  if (!b) return;
  const box = $('poetPicker');
  const open = !!(box && box.classList && typeof box.classList.contains === 'function' && !box.classList.contains('hidden'));
  const cur = (typeof activeCollection !== 'undefined' && isPoetCol(activeCollection)) ? poetMeta(activeCollection) : null;
  b.textContent = (cur ? cur.name : 'Poets') + (open ? ' ▴' : ' ▾');
  if (typeof b.setAttribute === 'function') b.setAttribute('aria-expanded', open ? 'true' : 'false');
}
/* Language filter (All / Urdu / Fārsī): a poet who wrote in both (Khusrau, Jigar, Shah Niyaz) is one poet and shows under both */
const POET_LANGS = [['all', 'All'], ['ur', 'Urdu'], ['fa', 'Fārsī']];
let poetLangFilter = (typeof store !== 'undefined' && store.get) ? store.get('poetLang', 'all') : 'all';
const poetLangs = p => p.langs || ['ur'];
/* a ghazal of a two-language poet (Jigar, Khusrau, Shah Niyaz) passes the language filter only in its own language */
function poetLangMatch(col, g) {
  if (poetLangFilter === 'all' || !isPoetCol(col)) return true;
  const meta = poetMeta(col);
  if (!meta || poetLangs(meta).length < 2) return true;
  return (g.lang || 'ur') === poetLangFilter;
}
function setPoetLang(lang) {
  poetLangFilter = lang;
  if (typeof store !== 'undefined' && store.set) store.set('poetLang', lang);
  renderPoetPickerList();
  if (typeof activeCollection !== 'undefined' && isPoetCol(activeCollection)) { ghazalShownCount = 30; renderGhazalsList(); }
}
function renderPoetPickerList() {
  const host = $('poetPickerList'), f = $('poetPickerFilter'), langs = $('poetPickerLangs');
  if (!host) return;
  if (langs) langs.innerHTML = POET_LANGS.map(([k, label]) =>
    `<button type="button" class="btn sm${poetLangFilter === k ? ' on' : ''}" aria-pressed="${poetLangFilter === k}" onclick="setPoetLang('${k}')">${label}</button>`).join('');
  const q = searchNorm((f && f.value) || '');
  /* full names, in Roman whatever the script, in pen-name order (how poets are looked up); the filter matches any form of the name */
  const rows = POET_LIST.filter(p => (poetLangFilter === 'all' || poetLangs(p).includes(poetLangFilter)) &&
    (!q || searchNorm([p.name, p.full, p.ur, p.hi].concat(p.aliases || []).join(' ')).includes(q)));
  host.innerHTML = rows.length ? rows.map(p => {
    const fa = poetLangs(p).includes('fa') ? `<span class="poet-opt-lang faint">${poetLangs(p).includes('ur') ? 'Urdu · Fārsī' : 'Fārsī'}</span>` : '';
    return `<button type="button" class="poet-opt${p.key === activeCollection ? ' on' : ''}" data-poet="${p.key}" onclick="pickPoet('${p.key}')"><span class="poet-opt-name">${escapeHtml(p.full || p.name)}${fa}</span><span class="poet-opt-count faint">${p.count}</span></button>`;
  }).join('') : '<div class="poet-opt-none faint small">No poet matches.</div>';
}
window.setPoetLang = setPoetLang;
function togglePoetPicker(force) {
  const box = $('poetPicker');
  if (!box) return;
  const open = typeof force === 'boolean' ? force : box.classList.contains('hidden');
  box.classList.toggle('hidden', !open);
  if (open) { renderPoetPickerList(); const f = $('poetPickerFilter'); if (f && typeof f.focus === 'function') f.focus(); }
  renderPoetPickerButton();
}
function pickPoet(key) {
  togglePoetPicker(false);
  if (typeof navigate === 'function') navigate('/ghazals/' + key); else switchCollection(key);
}
window.renderPoetPickerButton = renderPoetPickerButton;
window.renderPoetPickerList = renderPoetPickerList;
window.togglePoetPicker = togglePoetPicker;
window.pickPoet = pickPoet;

function renderZeroResults(col, selFilter, searchQ) {
  const colNames = COL_NAMES;
  const colName = colNames[col] || col;

  let msg = '';
  let suggestionsHtml = '';

  if (selFilter !== 'all') {
    msg = `No ${colName.toLowerCase()} ghazals in this meter.`;
    const otherCols = GHAZAL_COLS.filter(c => c !== col);
    const suggestions = [];

    otherCols.forEach(otherCol => {
      const corpus = collectionData(otherCol);

      const count = corpus.filter(item => {
        const mList = mListOf(item).map(String);
        return mList.includes(selFilter);
      }).length;

      if (count > 0) {
        suggestions.push({
          col: otherCol,
          name: colNames[otherCol],
          count: count
        });
      }
    });

    if (suggestions.length > 0) {
      suggestionsHtml = `<div class="zero-suggestions">` + suggestions.map(s => {
        return `<a href="#/ghazals/${s.col}?meter=${selFilter}">${s.name} has ${s.count} ›</a>`;
      }).join('') + `</div>`;
    }
  } else if (searchQ) {
    msg = `No ${colName.toLowerCase()} ghazals match “${escapeHtml(searchQ)}”.`;
  } else {
    msg = `No ${colName.toLowerCase()} ghazals found.`;
  }

  return `
    <div class="zero-state">
      <p>${msg}</p>
      ${suggestionsHtml}
    </div>
  `;
}

function getFilteredGhazals(col) {
  const selVal = $('ghazalMeterFilter') ? $('ghazalMeterFilter').value : 'all';
  const selFilter = (selVal && selVal.trim()) ? selVal.trim() : 'all';
  const searchQ = $('ghazalSearchInput') ? $('ghazalSearchInput').value.trim() : '';
  // Universal search (searchGhazalIndex) covers all scripts + poet + number,
  // diacritic-insensitively; the list views normally don't reach this branch
  // with a query (renderGhazalsList routes those to the merged results
  // instead), but keep it correct for direct callers (e.g. reader prev/next).
  const searchIds = searchQ ? searchGhazalIndex(searchQ) : null;

  if (col === 'handbook') {
    if (typeof EXERCISES_DATA === 'undefined') return [];
    return EXERCISES_DATA.filter(ex => {
      if (selFilter !== 'all') {
        const mList = mListOf(ex).map(String);
        if (!mList.includes(selFilter)) return false;
      }
      if (searchIds && !searchIds.handbook.has(String(ex.id))) return false;
      return true;
    });
  } else {
    const corpus = collectionData(col);
    return corpus.filter(g => {
      if (selFilter !== 'all') {
        const mList = mListOf(g).map(String);
        if (!mList.includes(selFilter)) return false;
      }
      if (searchIds && !searchIds[col].has(String(g.id))) return false;
      if (!poetLangMatch(col, g)) return false;
      return true;
    });
  }
}

function renderGhazalsList() {
  updateCollectionCounts();

  // If reader is currently active, re-render it (e.g. on script change)
  const rView = $('ghazalReaderView');
  if (curReaderCol && curReaderId && rView && !rView.classList.contains('hidden') && rView.style.display !== 'none') {
    openGhazalReader(curReaderCol, curReaderId);
    return;
  }

  const q = $('ghazalSearchInput') ? $('ghazalSearchInput').value.trim() : '';
  if (q) {
    renderUniversalSearchResults(q);
    return;
  }

  const uHost = $('ghazalUniversalResults');
  if (uHost) { uHost.classList.add('hidden'); uHost.style.display = 'none'; }
  const cHandbook = $('handbookExContainer'), cGhalib = $('ghalibContainer'), cMir = $('mirContainer'), cPoets = $('poetsContainer');
  if (cPoets) { cPoets.classList.toggle('hidden', !isPoetCol(activeCollection)); cPoets.style.display = ''; }
  if (cHandbook) { cHandbook.classList.toggle('hidden', activeCollection !== 'handbook'); cHandbook.style.display = ''; }
  if (cGhalib) { cGhalib.classList.toggle('hidden', activeCollection !== 'ghalib'); cGhalib.style.display = ''; }
  if (cMir) { cMir.classList.toggle('hidden', activeCollection !== 'mir'); cMir.style.display = ''; }

  if (activeCollection === 'handbook') {
    renderHandbookList();
  } else if (activeCollection === 'ghalib') {
    renderCorpusList('ghalib');
  } else if (activeCollection === 'mir') {
    renderCorpusList('mir');
  } else if (isPoetCol(activeCollection)) {
    renderCorpusList(activeCollection);
  }
}
window.renderGhazalsList = renderGhazalsList;

/* Merged, tagged results across Handbook/Ghalib/Mir for the universal
   search box; searchCollectionFilter (driven by the segmented control)
   narrows this to one collection. */
function renderUniversalSearchResults(q) {
  const uHost = $('ghazalUniversalResults');
  const cHandbook = $('handbookExContainer'), cGhalib = $('ghalibContainer'), cMir = $('mirContainer'), cPoets = $('poetsContainer');
  [cHandbook, cGhalib, cMir, cPoets].forEach(el => { if (el) { el.classList.add('hidden'); el.style.display = 'none'; } });
  if (!uHost) return;
  uHost.classList.remove('hidden');
  uHost.style.display = 'block';
  syncCollectionButtons();

  const idx = searchGhazalIndex(q);
  const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
  const langDir = getLangDir(cs);
  const colNames = COL_NAMES;
  const cols = (searchCollectionFilter === 'all') ? GHAZAL_COLS : [searchCollectionFilter];

  const rows = [];
  if (idx) {
    cols.forEach(col => {
      const ids = idx[col];
      if (!ids || !ids.size) return;
      collectionData(col).forEach(item => { if (ids.has(String(item.id))) rows.push({ col, item }); });
    });
  }

  const nq = searchNorm(q);
  const terms = nq.split(' ').filter(Boolean);

  if ($('ghazalEyebrow')) $('ghazalEyebrow').textContent = '';
  const scope = searchCollectionFilter !== 'all' ? 'in ' + colNames[searchCollectionFilter] : 'across all collections';
  const countText = `${rows.length} match${rows.length === 1 ? '' : 'es'} ${scope}`;
  if ($('colDesc')) {
    $('colDesc').innerHTML = `<span id="ghazalCollectionCount" class="ghazal-collection-count">${countText}</span>${q ? ' · <span id="colDescText" class="faint">for &ldquo;' + escapeHtml(q) + '&rdquo;</span>' : ''}`;
  } else if ($('ghazalCollectionCount')) {
    $('ghazalCollectionCount').textContent = countText;
  }

  if (!rows.length) {
    const where = searchCollectionFilter !== 'all' ? ` in ${colNames[searchCollectionFilter]}` : '';
    uHost.innerHTML = `<div class="zero-state"><p>No ghazals match &ldquo;${escapeHtml(q)}&rdquo;${where}.</p></div>`;
    return;
  }

  const groups = buildMeterGroups(rows, r => mListOf(r.item)[0], r => r.item.id);
  const { html, shownRows, totalRows } = renderGroupedRows(groups, ghazalShownCount, (r, i, arrLen) => {
    const { col, item } = r;
    const matchedLine = findMatchingLine(item, terms) || (item.lines && item.lines[0]);
    const disp1 = matchedLine ? ((typeof getLineDisplay === 'function') ? getLineDisplay(matchedLine, cs) : (matchedLine[cs] || matchedLine.ur)) : '';
    const who = (col === 'handbook' || isPoetCol(col)) ? (item.poet || colNames[col]) : colNames[col];
    const isHb = (col === 'handbook');
    const mId = mListOf(item)[0];
    const metaParts = [];
    if (who) metaParts.push(escapeHtml(who));
    if (isHb) metaParts.push('Handbook');
    if (mId != null && typeof meterBenchmarkFor === 'function') {
      const bm = meterBenchmarkFor(mId);
      if (bm && bm.p) metaParts.push(`Bahr ${mId} (${escapeHtml(bm.p)})`);
      else if (mId != null) metaParts.push(`Bahr ${mId}`);
    }
    const metaHtml = metaParts.length
      ? `<div class="vmeta">${metaParts.map(p => `<span>${p}</span>`).join('<span>·</span>')}</div>`
      : '';
    return `
      <div class="vrow" role="link" tabindex="0" onclick="navigate('/ghazals/${col}/${item.id}')">
        <span class="vnum">${col === 'handbook' ? escapeHtml(getGhazalNavLabel(col, item)) : isPoetCol(col) ? rekhtaLinkHTML(item) : franLinkHTML(col, item)}</span>
        <div class="vtext">
          <div class="vline" ${langDir}>${disp1}</div>
          ${metaHtml}
        </div>
        <div class="vact"><span class="chevron">›</span></div>
      </div>
      ${i < arrLen - 1 ? '<div class="vrule"></div>' : ''}
    `;
  });
  uHost.innerHTML = html;

  const moreBtn = $('ghazalUniversalMore');
  if (moreBtn) {
    if (totalRows > shownRows) {
      moreBtn.classList.remove('hidden');
      moreBtn.style.display = 'inline-flex';
      moreBtn.textContent = `Show 30 more (${totalRows - shownRows} remaining)`;
      moreBtn.onclick = () => { ghazalShownCount += 30; renderUniversalSearchResults(q); };
    } else {
      moreBtn.classList.add('hidden');
      moreBtn.style.display = 'none';
    }
  }
}
window.renderUniversalSearchResults = renderUniversalSearchResults;

function renderHandbookList() {
  const container = $('exDetailView');
  const chips = $('exPoetChips');
  if (!container) return;
  if (chips) { chips.classList.add('hidden'); chips.style.display = 'none'; }

  const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
  const langDir = getLangDir(cs);
  const selFilter = $('ghazalMeterFilter') ? $('ghazalMeterFilter').value : 'all';
  const searchQ = $('ghazalSearchInput') ? $('ghazalSearchInput').value.toLowerCase().trim() : '';

  const filtered = getFilteredGhazals('handbook');

  if (!filtered.length) {
    container.innerHTML = renderZeroResults('handbook', selFilter, searchQ);
    return;
  }

  // Only 24 exercises total — small enough to group and show in full,
  // no "load more" needed.
  const groups = buildMeterGroups(filtered, ex => mListOf(ex)[0], ex => ex.id);
  const { html } = renderGroupedRows(groups, filtered.length, (ex, idx, arrLen) => {
    const l1 = ex.lines && ex.lines[0];
    const disp1 = l1 ? ((typeof getLineDisplay === 'function') ? getLineDisplay(l1, cs) : (l1[cs] || l1.ur)) : '';

    return `
      <div class="vrow" role="link" tabindex="0" onclick="navigate('/ghazals/handbook/${ex.id}')">
        <span class="vnum vpoet">${escapeHtml(ex.poet || 'Handbook')}</span>
        <div class="vtext">
          <div class="vline" ${langDir}>${disp1}</div>
        </div>
        <div class="vact">
          <span class="chevron">›</span>
        </div>
      </div>
      ${idx < arrLen - 1 ? '<div class="vrule"></div>' : ''}
    `;
  });
  container.innerHTML = html;
}
window.renderHandbookList = renderHandbookList;

function renderCorpusList(col) {
  const listEl = $(col === 'ghalib' ? 'ghalibExtList' : isPoetCol(col) ? 'poetExtList' : 'mirExtList');
  const moreBtn = $(col === 'ghalib' ? 'ghalibExtMore' : isPoetCol(col) ? 'poetExtMore' : 'mirExtMore');
  if (!listEl) return;

  const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
  const langDir = getLangDir(cs);
  const selFilter = $('ghazalMeterFilter') ? $('ghazalMeterFilter').value : 'all';
  const searchQ = $('ghazalSearchInput') ? $('ghazalSearchInput').value.toLowerCase().trim() : '';

  const filtered = getFilteredGhazals(col);

  if (!filtered.length) {
    listEl.innerHTML = renderZeroResults(col, selFilter, searchQ);
    if (moreBtn) { moreBtn.classList.add('hidden'); moreBtn.style.display = 'none'; }
    return;
  }

  const groups = buildMeterGroups(filtered, g => mListOf(g)[0], g => g.id);
  const { html, shownRows, totalRows } = renderGroupedRows(groups, ghazalShownCount, (g, gi, arrLen) => {
    const l1 = g.lines && g.lines[0];
    const disp1 = l1 ? ((typeof getLineDisplay === 'function') ? getLineDisplay(l1, cs) : (l1[cs] || l1.ur)) : '';
    // Single-collection list: the group header already carries the meter,
    // and the collection is obvious from the tab, so the row is just her
    // number (bare, e.g. "12 ↗") — no "Ghalib"/"Mir" prefix (round 3).
    return `
      <div class="vrow" role="link" tabindex="0" onclick="navigate('/ghazals/${col}/${g.id}')">
        <span class="vnum">${isPoetCol(col) ? rekhtaLinkHTML(g, { bare: true }) : (franLinkHTML(col, g, { bare: true }) || escapeHtml('#' + g.id))}</span>
        <div class="vtext">
          <div class="vline" ${langDir}>${disp1}</div>
          ${g.lang === 'fa' && isPoetCol(col) && poetLangs(poetMeta(col) || {}).length > 1 ? '<div class="vmeta"><span>Fārsī</span></div>' : ''}
        </div>
        <div class="vact">
          <span class="chevron">›</span>
        </div>
      </div>
      ${gi < arrLen - 1 ? '<div class="vrule"></div>' : ''}
    `;
  });
  listEl.innerHTML = html;

  if (moreBtn) {
    if (totalRows > shownRows) {
      moreBtn.classList.remove('hidden');
      moreBtn.style.display = 'inline-flex';
      moreBtn.textContent = `Show 30 more (${totalRows - shownRows} remaining)`;
      moreBtn.onclick = () => {
        ghazalShownCount += 30;
        renderCorpusList(col);
      };
    } else {
      moreBtn.classList.add('hidden');
      moreBtn.style.display = 'none';
    }
  }
}
window.renderCorpusList = renderCorpusList;

function showMoreGhalibExt() {
  ghazalShownCount += 30;
  renderCorpusList('ghalib');
}
window.showMoreGhalibExt = showMoreGhalibExt;

function showMoreMirExt() {
  ghazalShownCount += 30;
  renderCorpusList('mir');
}
window.showMoreMirExt = showMoreMirExt;

function showMorePoetExt() {
  ghazalShownCount += 30;
  renderCorpusList(activeCollection);
}
window.showMorePoetExt = showMorePoetExt;

function showMoreUniversal() {
  ghazalShownCount += 30;
  const q = $('ghazalSearchInput') ? $('ghazalSearchInput').value.trim() : '';
  renderUniversalSearchResults(q);
}
window.showMoreUniversal = showMoreUniversal;

/* ================= IN-PLACE GHAZAL READER (§5.8) ================= */

function openGhazalReader(col, id) {
  curReaderCol = col;
  curReaderId = id;

  const rView = $('ghazalReaderView');
  const lView = $('ghazalListView');
  if (rView) {
    rView.classList.remove('hidden');
    rView.style.display = 'block';
  }
  if (lView) {
    lView.classList.add('hidden');
    lView.style.display = 'none';
  }

  const item = collectionData(col).find(x => String(x.id) === String(id)) || null;

  curReaderItem = item;
  if (!item) return;

  const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
  const langDir = getLangDir(cs);

  // Title & Header
  const titleEl = $('readerTitle');
  if (titleEl) {
    if (col === 'handbook') {
      titleEl.textContent = item.poet || 'Handbook';
    } else if (isPoetCol(col)) {
      /* Persian kalaam found on Ganjoor (scripts/match_ganjoor.py): its page there too, for the authentic text and attribution */
      titleEl.innerHTML = rekhtaLinkHTML(item) + (item.gj ? ` · <a class="fran-link" href="${escapeHtml(item.gj)}" target="_blank" rel="noopener" title="This poem on Ganjoor">Ganjoor<span class="ext" aria-hidden="true">↗</span></a>` : '')
        /* Ganjoor credits it to someone else: qawwali attributions are often traditional, so show both */
        + (item.gjPoet ? ` <span class="faint small gj-poet">(there: <span lang="fa">${escapeHtml(item.gjPoet)}</span>)</span>` : '');
    } else {
      titleEl.innerHTML = franLinkHTML(col, item) || escapeHtml(getGhazalNavLabel(col, item));
    }
  }

  const mId = mListOf(item)[0];
  const rHeader = $('readerHeader');
  if (rHeader) rHeader.innerHTML = renderGhazalReaderHeader(mId, item);

  // Intro note (Handbook only per §5.8)
  const introDiv = $('readerIntroNote');
  if (introDiv) {
    const introNote = (col === 'handbook' && item.notes && item.notes.intro) ? item.notes.intro : '';
    if (introNote) {
      introDiv.classList.remove('hidden');
      introDiv.style.display = 'block';
      introDiv.innerHTML = `<strong>Pritchett's note:</strong> <span>${escapeHtml(introNote)}</span>`;
    } else {
      introDiv.classList.add('hidden');
      introDiv.style.display = 'none';
      introDiv.innerHTML = '';
    }
  }

  // Couplets host
  const coupletsHost = $('readerCouplets');
  if (!coupletsHost) return;

  const lines = item.lines || [];
  const cCount = Math.floor(lines.length / 2);
  const hasExtra = (lines.length % 2 === 1);

  let cHtml = `
    <div class="row reader-actions">
      <button class="btn ghost sm" id="btnToggleAllScans" onclick="toggleReaderAllScans()">${showAllScans ? 'Hide all scans' : 'Show all scans'}</button>
      <button class="btn link sm faint" onclick="editCurrentInScan('${col}', '${item.id}')">Edit in Scan ›</button>
    </div>
    ${(typeof legendHTML === 'function') ? legendHTML('legend-sticky') : ''}
  `;

  const readerMeters = mListOf(item);
  const isPairGh = (readerMeters && readerMeters.length > 1 && typeof SCAN_PAIRS !== 'undefined' && SCAN_PAIRS.some(p => readerMeters.every(m => p.includes(Number(m)))));

  for (let c = 0; c < cCount; c++) {
    const l1 = lines[2 * c];
    const l2 = lines[2 * c + 1];
    if (!l1 || !l2) continue;
    const vNum = c + 1;
    const disp1 = (typeof getLineDisplay === 'function') ? getLineDisplay(l1, cs) : (l1[cs] || l1.ur);
    const disp2 = (typeof getLineDisplay === 'function') ? getLineDisplay(l2, cs) : (l2[cs] || l2.ur);
    const vNote = (col === 'handbook' && item.notes && item.notes.verses && item.notes.verses[vNum]) ? item.notes.verses[vNum] : '';

    let pairBadge = '';
    if (isPairGh && typeof Scan !== 'undefined' && typeof lineScanText === 'function') {
      const r1 = scanCorpusLine(l1);
      const r2 = scanCorpusLine(l2);
      const f1 = (r1 && r1.fits) ? (r1.fits.find(f => readerMeters.includes(f.meter.id)) || r1.fits[0]) : null;
      const f2 = (r2 && r2.fits) ? (r2.fits.find(f => readerMeters.includes(f.meter.id)) || r2.fits[0]) : null;
      if (f1 && f2 && f1.meter.id !== f2.meter.id) {
        const e1 = (typeof patEnding === 'function') ? patEnding(f1.meter.raw || f1.meter.pattern) : '';
        const e2 = (typeof patEnding === 'function') ? patEnding(f2.meter.raw || f2.meter.pattern) : '';
        const tip = `Misra 1 uses Meter #${f1.meter.id} (${e1}), Misra 2 uses Meter #${f2.meter.id} (${e2}). In Classical Urdu prosody, these alternating cadences form an accepted paired meter (Handbook \u00a76.1).`;
        pairBadge = ` <span class="pair-bahr-pill sm" tabindex="0" data-tip="${tip}">Paired · #${f1.meter.id} &amp; #${f2.meter.id}</span>`;
      } else if (f1 && readerMeters.length > 1 && f1.meter.id !== readerMeters[0]) {
        const e1 = (typeof patEnding === 'function') ? patEnding(f1.meter.raw || f1.meter.pattern) : '';
        const tip = `Both misras in this couplet use Meter #${f1.meter.id} (${e1}), the secondary cadence in this paired bahr.`;
        pairBadge = ` <span class="pair-bahr-pill sm faint-pair" tabindex="0" data-tip="${tip}">Meter #${f1.meter.id}</span>`;
      }
    }

    cHtml += `
      <div class="card couplet-card">
        <div class="row couplet-head">
          <div class="row couplet-head-left"><span class="vnum">Couplet ${vNum}</span>${pairBadge}</div>
          <div class="row couplet-acts">
            <span class="play sm" role="button" tabindex="0" aria-label="Play couplet" data-label="Play couplet" data-pb="reader:${c}" onclick="playReaderCoupletByIndex(${c}, null, this)">▶︎</span>
            ${practiceLineBtn(l1, l2, item)}
            <button class="btn ghost sm" onclick="toggleCoupletScan(${c})">Scan</button>
          </div>
        </div>
        <div class="cbox-verse">
          <div class="vline-lg" ${langDir}>${disp1}</div>
          <div class="vline-lg" ${langDir}>${disp2}</div>
        </div>

        <div id="coupletScanBox_${c}" class="couplet-scan-box ${showAllScans ? '' : 'hidden'}">
          <div id="misraScan_${c}_1"></div>
          <div id="misraScan_${c}_2" class="misra-scan-second"></div>
        </div>

        ${vNote ? `
          <div class="note couplet-note">
            <strong>Pritchett's note (verse ${vNum}):</strong>
            <span>${escapeHtml(vNote)}</span>
          </div>
        ` : ''}
      </div>
    `;
  }

  if (hasExtra) {
    const extraLine = lines[lines.length - 1];
    const dispExtra = (typeof getLineDisplay === 'function') ? getLineDisplay(extraLine, cs) : (extraLine[cs] || extraLine.ur);
    cHtml += `
      <div class="card couplet-card">
        <div class="row couplet-head">
          <span class="vnum">Line ${lines.length}</span>
        </div>
        <div class="cbox-verse"><div class="vline-lg" ${langDir}>${dispExtra}</div></div>
      </div>
    `;
  }

  // Footer nav with Prev / Next ghazal links (§5.8)
  let filtered = getFilteredGhazals(col);
  let curIdx = filtered.findIndex(x => String(x.id) === String(id));
  if (curIdx === -1) {
    filtered = collectionData(col);
    curIdx = filtered.findIndex(x => String(x.id) === String(id));
  }
  const prevGhazal = (curIdx > 0) ? filtered[curIdx - 1] : null;
  const nextGhazal = (curIdx >= 0 && curIdx < filtered.length - 1) ? filtered[curIdx + 1] : null;

  cHtml += `
    <div class="reader-footer-nav row">
      ${prevGhazal ? `<button class="btn ghost sm" onclick="navigate('/ghazals/${col}/${prevGhazal.id}')">← ${getGhazalNavLabel(col, prevGhazal)}</button>` : '<span></span>'}
      <button class="btn link sm faint" onclick="editCurrentInScan('${col}', '${item.id}')">Edit in Scan ›</button>
      ${nextGhazal ? `<button class="btn ghost sm" onclick="navigate('/ghazals/${col}/${nextGhazal.id}')">${getGhazalNavLabel(col, nextGhazal)} →</button>` : '<span></span>'}
    </div>
  `;

  coupletsHost.innerHTML = cHtml;

  // Render scans if showAllScans is true
  if (showAllScans) {
    for (let c = 0; c < cCount; c++) {
      populateCoupletScan(lines[2 * c], lines[2 * c + 1], c, mListOf(item));
    }
  }
}
window.openGhazalReader = openGhazalReader;

/* "Practice" button for a couplet: opens the tapper on its first line that can be tapped out; nothing if neither can */
function practiceLineBtn(l1, l2, item) {
  if (typeof prPracticable !== 'function') return '';
  const m = (typeof drMetersOf === 'function' && item) ? drMetersOf(item)[0] : null;   // the ghazal's own baḥr
  const l = [l1, l2].find(x => x && x.ur && prPracticable(x.ur, m));
  return l ? `<a class="btn ghost sm" href="${prLinkFor(l.ur, m, l.ro)}" title="Tap this line's rhythm yourself">Practice</a>` : '';
}

function closeGhazalReader() {
  curReaderCol = null;
  curReaderId = null;
  curReaderItem = null;

  const rView = $('ghazalReaderView');
  const lView = $('ghazalListView');
  if (rView) {
    rView.classList.add('hidden');
    rView.style.display = 'none';
  }
  if (lView) {
    lView.classList.remove('hidden');
    lView.style.display = 'block';
  }
}
window.closeGhazalReader = closeGhazalReader;

function toggleCoupletScan(c) {
  const box = $(`coupletScanBox_${c}`);
  if (!box) return;
  const isHidden = box.classList.contains('hidden') || box.style.display === 'none';
  box.classList.toggle('hidden', !isHidden);
  box.style.display = '';
  if (isHidden) {
    const lines = getCurrentReaderLines();
    if (lines && lines[2 * c] && lines[2 * c + 1]) {
      populateCoupletScan(lines[2 * c], lines[2 * c + 1], c, mListOf(curReaderItem));
    }
  }
}
window.toggleCoupletScan = toggleCoupletScan;

function toggleReaderAllScans() {
  showAllScans = !showAllScans;
  try {
    sessionStorage.setItem('bahr_reader_scans', showAllScans ? 'true' : 'false');
  } catch (e) {}

  const btn = $('btnToggleAllScans');
  if (btn) btn.textContent = showAllScans ? 'Hide all scans' : 'Show all scans';

  document.querySelectorAll('.couplet-scan-box').forEach(box => {
    box.classList.toggle('hidden', !showAllScans);
    box.style.display = '';
  });

  if (showAllScans) {
    const lines = getCurrentReaderLines();
    if (lines) {
      const cCount = Math.floor(lines.length / 2);
      for (let c = 0; c < cCount; c++) {
        if (lines[2 * c] && lines[2 * c + 1]) {
          populateCoupletScan(lines[2 * c], lines[2 * c + 1], c, mListOf(curReaderItem));
        }
      }
    }
  }
}
window.toggleReaderAllScans = toggleReaderAllScans;

function populateCoupletScan(line1, line2, c, meters) {
  const b1 = $(`misraScan_${c}_1`);
  const b2 = $(`misraScan_${c}_2`);
  const txt = l => (l && typeof l === 'object') ? lineScanText(l) : l;   // Rekhta lines scan with their Roman's hints
  const obj = l => (l && typeof l === 'object') ? l : null;
  // `meters` is the ghazal's own bahr (from mListOf(item)), e.g. [18,19] for a
  // paired meter. renderLineScan then scans each line only against those
  // meters, instead of whatever the scanner would otherwise guess best.
  if (b1 && typeof renderLineScan === 'function') renderLineScan(txt(line1), b1, obj(line1), meters);
  if (b2 && typeof renderLineScan === 'function') renderLineScan(txt(line2), b2, obj(line2), meters);
}
window.populateCoupletScan = populateCoupletScan;

function getCurrentReaderLines() {
  if (curReaderItem && curReaderItem.lines) {
    return curReaderItem.lines;
  }
  const { parts } = (typeof parseHash === 'function') ? parseHash() : { parts: [] };
  const col = parts[1] || 'handbook';
  const id = parts[2];
  const item = collectionData(col).find(x => String(x.id) === String(id));
  return item ? item.lines : null;
}

function playReaderCoupletByIndex(c, start, btn) {
  const lines = getCurrentReaderLines();
  if (!lines || !lines[2 * c] || !lines[2 * c + 1]) return;
  btn = btn || document.querySelector(`[data-pb="reader:${c}"]`);
  const key = 'reader:' + (curReaderItem ? curReaderItem.id : '') + ':' + c;
  pbToggle(key, btn, () => {
    // Playback highlights the scan chips, so make sure they're rendered and visible.
    const box = $(`coupletScanBox_${c}`);
    if (box && box.classList.contains('hidden')) toggleCoupletScan(c);
    else if (box && !box.querySelector('.chip')) populateCoupletScan(lines[2 * c], lines[2 * c + 1], c);
    if (typeof A !== 'undefined' && A.ensure && !A.ensure()) return null;
    if (typeof Scan === 'undefined' || !Scan.scanLine) return null;
    // Play back the fit in the ghazal's own bahr (never the scanner's best
    // guess), matching what populateCoupletScan renders above.
    const meters = mListOf(curReaderItem).map(String);
    const out = [];
    [1, 2].forEach(k => {
      const r = scanCorpusLine(lines[2 * c + k - 1], meters);
      const f = meters.length
        ? r.fits.filter(x => meters.includes(String(x.meter.id))).sort((a, b) => a.c - b.c)[0]
        : r.fits[0];
      if (f) out.push(Object.assign({ e: engineOf(r).explain(r, f) }, pbNodes($(`misraScan_${c}_${k}`))));
    });
    return out;
  }, start);
}
window.playReaderCoupletByIndex = playReaderCoupletByIndex;

/* "ghalib/21" -> that ghazal's Urdu lines joined for the Scan box, or null. Lets Scan carry a short link (#/scan?g=ghalib/21)
   instead of the whole text percent-encoded. */
function ghazalScanText(ref) {
  const [col, id] = String(ref || '').split('/');
  const data = collectionData(col);
  const item = data && data.find(x => String(x.id) === String(id));
  return item && item.lines ? item.lines.map(l => lineScanText(l).trim()).filter(Boolean).join('\n') : null;
}
window.ghazalScanText = ghazalScanText;

function editCurrentInScan(col, id) {
  const lines = getCurrentReaderLines();
  if (!lines) return;
  scanGhazalRef = col + '/' + id;   // runScan keeps the address short while the text is still this ghazal
  if (typeof navigate === 'function') {
    navigate('/scan');
  } else if (typeof go === 'function') {
    go('scan');
  }
  const txt = lines.map(l => l.ur).join('\n');
  if ($('scanIn')) $('scanIn').value = txt;
  if ($('studioInput')) $('studioInput').value = txt;
  if (typeof runScan === 'function') runScan();
}
window.editCurrentInScan = editCurrentInScan;

function renderExercises() {
  renderGhazalsList();
}
window.renderExercises = renderExercises;

function renderGhalibExt() {
  renderGhazalsList();
}
window.renderGhalibExt = renderGhalibExt;

function renderMirExt() {
  renderGhazalsList();
}
window.renderMirExt = renderMirExt;
