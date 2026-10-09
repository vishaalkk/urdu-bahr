/* Key normalizer for cross-script verse matching */
function normVerseKey(str) {
  if(!str) return '';
  return str.toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640\u200C\u200D]/g, '')
    .replace(/[،۔؟!,.;:?"'«»()\[\]\-–—/]/g, '')
    .replace(/[آأإٱ]/g, 'ا')
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[هۀۂە]/g, 'ہ')
    .replace(/[āá]/g, 'aa')
    .replace(/[īí]/g, 'ii')
    .replace(/[ūú]/g, 'uu')
    .replace(/[ñṅ]/g, 'n')
    .replace(/[ṭ]/g, 't')
    .replace(/[ḍ]/g, 'd')
    .replace(/[ṛ]/g, 'r')
    .replace(/[ṣ]/g, 's')
    .replace(/[żẕẓž]/g, 'z')
    .replace(/ṡ|s̱/g, 's')
    .replace(/[z̤]/g, 'z')
    .replace(/[t̤]/g, 't')
    .replace(/[ḥ]/g, 'h')
    .replace(/[ʿʽ‘']/g, '')
    .replace(/[ʾ’]/g, '')
    .replace(/kh/g, 'x')
    .replace(/\bhua\b/g, 'huaa')
    .replace(/\bkya\b/g, 'kyaa')
    .replace(/\bdava\b/g, 'davaa')
    .replace(/\s+/g, ' ')
    .trim();
}

/* Universal indexed dictionary of all classical verses across all 4 scripts */
const KNOWN_VERSES = {};
function registerKnownVerse(obj) {
  if(!obj) return;
  const entry = {
    ur: obj.ur || '',
    hi: obj.hi || '',
    ro: obj.ro || '',
    ascii: obj.ascii || ''
  };
  ['ur', 'hi', 'ro', 'ascii'].forEach(k => {
    if(obj[k]) {
      const nk = normVerseKey(obj[k]);
      if(nk) KNOWN_VERSES[nk] = entry;
    }
  });
}

// Index all exercises lines (226 lines across 24 ghazals)
EXERCISES_DATA.forEach(ex => {
  if(ex.lines) ex.lines.forEach(l => registerKnownVerse(l));
});

// Index the extended Ghalib corpus too, so Scan/Compose use its verified
// ur/hi/ro instead of regenerating (lossy) transliteration for these lines.
GHALIB_EXT_DATA.forEach(g => {
  if(g.lines) g.lines.forEach(l => registerKnownVerse(l));
});

// Index the extended Mir corpus too, for the same reason as the Ghalib block above.
MIR_EXT_DATA.forEach(g => {
  if(g.lines) g.lines.forEach(l => registerKnownVerse(l));
});

// The poet collections: only the hand-checked ghazals (their Roman is verified) are known verses, as the old "More Poets" were.
// Rekhta's own Roman is not registered: typed lines keep Pritchett's spelling (ʿishq, imtiḥāñ, āge) wherever she has one.
poetCollections().forEach(([, items]) => items.forEach(g => {
  if(g.verified && g.lines) g.lines.forEach(l => registerKnownVerse(l));
}));

// Index all family famous verses (25 verses across 12 families)
function indexFamsVerses() {
  try {
    const list = (typeof window !== 'undefined' && window.FAMS) ? window.FAMS : null;
    if(list) {
      list.forEach(f => {
        if(f.gz) {
          f.gz.forEach(g => {
            registerKnownVerse({ ur: g.ur, hi: g.hi, ro: g.ro, ascii: g.ascii });
            if(g.ascii2) registerKnownVerse({ ur: g.ur2, hi: g.hi2, ro: g.ro2, ascii: g.ascii2 });
          });
        }
      });
    }
  } catch(e){}
}

/* Transliteration helpers for novel/arbitrary inputs */
function devToAscii(str) {
  if(!str) return '';
  str = str.normalize('NFC');
  const nuktaMap = { 'क़':'q','ख़':';x','ग़':';g','ज़':'z','ड़':';r','ढ़':';rh','फ़':'f' };
  const consMap = {
    'क':'k','ख':'kh','ग':'g','घ':'gh','ङ':'n',
    'च':'ch','छ':'chh','ज':'j','झ':'jh','ञ':'n',
    'ट':';t','ठ':';th','ड':';d','ढ':';dh','ण':'n',
    'त':'t','थ':'th','द':'d','ध':'dh','न':'n',
    'प':'p','फ':'ph','ब':'b','भ':'bh','म':'m',
    'य':'y','र':'r','ल':'l','व':'v',
    'श':'sh','ष':'sh','स':'s','ह':'h'
  };
  const vowelMap = { 'अ':'a','आ':'aa','इ':'i','ई':'ii','उ':'u','ऊ':'uu','ए':'e','ऐ':'ai','ओ':'o','औ':'au' };
  const matraMap = { 'ा':'aa','ि':'i','ी':'ii','ु':'u','ू':'uu','े':'e','ै':'ai','ो':'o','ौ':'au' };
  let s = str;
  for(const [k, v] of Object.entries(nuktaMap)) s = s.split(k).join(v);
  let out = '';
  for(let i = 0; i < s.length; i++) {
    const ch = s[i];
    const nextCh = s[i + 1] || '';
    if(consMap[ch]) {
      const c = consMap[ch];
      if(nextCh === '्') { out += c; i++; }
      else if(matraMap[nextCh]) { out += c + matraMap[nextCh]; i++; }
      else { out += c; }
    } else if(vowelMap[ch]) {
      out += vowelMap[ch];
    } else if(ch === 'ं' || ch === 'ँ') {
      out += ';n';
    } else if(ch === 'ः') {
      out += 'h';
    } else {
      out += ch;
    }
  }
  return out;
}

/* ---- Casual typed Roman (no diacritics): ishq, gham, aaj, mohabbat, ye, vo, na ----
   Most people type Roman without ā ī ū ḳh ġh ʿ, so a typed word is looked up by a folded key in ROMAN_CASUAL_MAP (built from
   every known ghazal word, most frequent spelling wins; see scripts/build_app.py, whose _casual_key this mirrors). Words typed
   WITH Pritchett's marks are left to the letter rules, which read them exactly. */
const CASUAL_ALIAS = { ye: 'yih', yeh: 'yih', yah: 'yih', vo: 'vuh', wo: 'vuh', woh: 'vuh', voh: 'vuh', na: 'nah', pe: 'pah',
  keh: 'kih', hua: 'hu))aa', kya: 'kyaa', dava: 'davaa', nadan: 'naadaa;n', nadaan: 'naadaa;n', naadaan: 'naadaa;n', dile: 'dil-e', aaxir: 'aa;xir', kahi: 'kahii;N', nahin: 'nahii;N', nahi: 'nahii;N', mein: 'me;N', main: 'mai;N', hai: 'hai', hain: 'hai;N', hun: 'huu;N', hoon: 'huu;N' };
function casualKey(s, level) {   // level 0 strict (long vowels kept), 1 loose, 2 lax (also o~u, e~i): mirrors _casual_key in build_app.py
  s = s.normalize('NFC').toLowerCase().replace(/ā/g, 'aa').replace(/ī/g, 'ii').replace(/ū/g, 'uu').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/;g/g, 'gh').replace(/;x/g, 'kh').replace(/[;.:()'’‘ʿʾ-]/g, '').replace(/oo/g, 'uu').replace(/w/g, 'v');
  if (level >= 1) s = s.replace(/aa/g, 'a').replace(/ii/g, 'i').replace(/uu/g, 'u');
  if (level >= 2) s = s.replace(/o/g, 'u').replace(/e/g, 'i');
  return level >= 1 ? s.replace(/(.)\1+/g, '$1') : s.replace(/([^aiu])\1+/g, '$1');
}
const CASUAL_SPECIAL = /[ḥṣẓżẕṡṭḍṛġḳʿʾñ;:()]/;   // spelled with marks (or already ASCII): the letter rules read these exactly
function casualLookup(plain, minLv, maxLv) {   // levels minLv..maxLv (default all three)
  if (typeof ROMAN_CASUAL_MAP === 'undefined') return null;
  for (let lv = minLv || 0; lv <= (maxLv == null ? 2 : maxLv); lv++) {
    const k = casualKey(plain, lv);
    if (Object.prototype.hasOwnProperty.call(ROMAN_CASUAL_MAP[lv], k)) return ROMAN_CASUAL_MAP[lv][k];
  }
  return null;
}
/* Rekhta-style marks, for a word the lookup does not know: a capital in the middle of a word is retroflex (jhūTī ṭ, ulTī ṭ, baḌā ṛ);
   .e .ī after a vowel are a hamza (aa.e, jaa.e); .a .i .u are an ʿain (shā.ir, ma.asūm, va.ade); .h is ḥ (sub.h) */
function rekhtaMarks(piece) {
  return piece.replace(/(?<=[a-zāīūñ])T/g, ';t').replace(/(?<=[a-zāīūñ])D(?!h)/g, ';d').replace(/Ḍ|Ṛ/g, ';r')
    .replace(/\.h/g, ';h').replace(/\.(e|ī|ii|ai)/g, '))$1').replace(/\.([aiuāū])/g, '(($1');
}
/* Neighbour rules (data/collocations.json, built by scripts/build_collocations.py): a typed word whose casual key stands for
   several words (rah / raah, ab / aab) is settled by the word before it (L1) or after it (R1). A rule answers with the strict
   casual key, which ROMAN_CASUAL_MAP[0] turns into the full spelling. null when no rule applies. */
function collocSpelling(key, prevWord, nextWord) {
  if (typeof COLLOCATIONS === 'undefined' || typeof ROMAN_CASUAL_MAP === 'undefined') return null;
  const nb = w => (w ? casualKey(w.split('-')[w === prevWord ? w.split('-').length - 1 : 0], 1) : '');
  const pk = nb(prevWord), nk = nb(nextWord);
  const label = (pk && COLLOCATIONS.L1[pk + ' ' + key]) || (nk && COLLOCATIONS.R1[key + ' ' + nk]);
  if (key === 'ki') return label === 'ki' ? 'kih' : label === 'kii' ? 'kii' : null;   // Rekhta writes ki for کہ and kī for کی
  return (label && ROMAN_CASUAL_MAP[0][label]) || null;
}
/* Fallback word list for typed Roman (ROMAN_FALLBACK, data/roman_fallback.json, built by scripts/build_roman_fallback.js): words the
   Rekhta poets have and Pritchett's classical corpora lack (khud, khushbu, khatra, zinda, varna). Keyed like ROMAN_CASUAL_MAP[1] (loose
   casual key); each spelling is checked to give the right Urdu word through the real pipeline (Pritchett's ASCII writes a silent v
   in خوش = ;xvush and a final h in زندہ = zindah, which Roman hides). It holds no key her map has, so it fills gaps and never
   overrides her. Measured on held-out poets with scripts/casual_roman_eval.js. */
function rekhtaFallback(plain) {
  if (typeof ROMAN_FALLBACK === 'undefined') return null;
  return ROMAN_FALLBACK[casualKey(plain, 1)] || null;
}
function casualRomanLine(line) {
  const toks = line.split(/(\s+)/), words = toks.filter(t => t && !/^\s+$/.test(t));
  let wi = 0;
  const out = toks.map(tok => {
    if (!tok || /^\s+$/.test(tok)) return tok;
    const next = words[++wi] || '', prev = words[wi - 2] || '';
    tok = tok.replace(/^['’‘]+|['’‘]+$/g, '');   // a quoted takhallus: 'dāġh'
    return tok.split('-').map((piece, i) => {
      const plain = piece.toLowerCase();
      if (i > 0 && (plain === 'e' || plain === 'ye' || plain === 'o')) return piece;
      if (plain.length < 2 || !/^[a-zāīū.]+$/.test(plain) || CASUAL_SPECIAL.test(piece)) return rekhtaMarks(piece);
      if (!tok.includes('-')) {   // hyphenated compounds keep their own pieces
        const c = collocSpelling(casualKey(plain, 1), prev, next);
        if (c) return c;
      }
      if (plain === 'ki') {   // کہ (that) or کی (of): the next word decides where the corpora know it (KI_NEXT); کی is the commoner reading
        // overall (54% of Pritchett's, 69% of Rekhta's poets), so it is the default when the next word is unknown
        const n = (typeof KI_NEXT !== 'undefined' && KI_NEXT[casualKey(next.split('-')[0], 1)]) || null;
        return n ? (n[1] > 2 * n[0] ? 'kii' : 'kih') : 'kii';
      }
      if (CASUAL_ALIAS[plain]) return CASUAL_ALIAS[plain];
      /* Pritchett's strict and loose matches, then the poets' verified word list, and only then her laxest match (o~u, e~i), which
         otherwise hijacks khud as khod (کھود) */
      return casualLookup(plain, 0, 1) || rekhtaFallback(plain) || casualLookup(plain, 2, 2) || rekhtaMarks(piece);
    }).join('-');
  }).join('');
  return out.replace(/(\S)\s+o\s+(\S)/g, '$1-o-$2');   // dard o gham -> dard-o-gham (the conjunction و)
}

function romanToAscii(str) {
  if(!str) return '';
  let s = casualRomanLine(str).toLowerCase();
  /* standalone / fused iẓāfat: 'dil e nādāñ', 'dile nādāñ' -> dil-e */
  s = s.replace(/([a-zāīūñḍṭṛḥ])\s+e(?=\s)/g, '$1-e')
       .replace(/\bdile\b/g, 'dil-e')
       .replace(/\bnadan\b/g, 'naadaa;n')
       /* Urdu words do not end in a short -a after i: diya, liya, kiya, dariya = -iyā */
       .replace(/([a-z]i)ya\b/g, '$1yaa');
  s = s.replace(/\bhua\b/g, 'hu))aa')
       .replace(/\bkya\b/g, 'kyaa')
       .replace(/\bdava\b/g, 'davaa')
       .replace(/\baaxir\b/g, 'aa;xir')
       .replace(/\bnaadaan\b/g, 'naadaa;n')
       .replace(/ā/g, 'aa')
       .replace(/ī/g, 'ii')
       .replace(/ū/g, 'uu')
       .replace(/ñ/g, ';n')
       .replace(/ġh|ġ/g, ';g')
       .replace(/ḳh|ḳ/g, ';x')
       .replace(/ṭ/g, ';t')
       .replace(/ḍ/g, ';d')
       .replace(/ṛ/g, ';r')
       .replace(/ṣ/g, '.s')
       .replace(/ż|ẕ/g, ';z')            /* ذ: Pritchett writes ż, scholars ẕ */
       .replace(/ẓ/g, '.z')                /* ض */
       .replace(/ṡ|s̱/g, ';s')              /* ث: Pritchett ṡ, scholars s̱ */
       .replace(/z̤/g, ':z')
       .replace(/t̤/g, ':t')
       .replace(/ḥ/g, ';h')
       .replace(/ʿ/g, '((')
       .replace(/[’ʾ']/g, '))')
       .replace(/u([aā])/g, 'u))$1');
  return s;
}

/* Rekhta's Urdu is unvocalised, so what the engine cannot see in it, the Roman does say. The Roman is split on
   spaces and hyphens; where it lines up word-for-word with the Urdu, each Urdu word gets
     - a zer for iẓāfat (bulbul-e-betāb; ۂ for a final ہ), and
     - a shadda on the letter the Roman doubles (jannat, muqaddar, patthar = pat+thar), the one unwritten-tashdid case.
   The engine reads written marks literally. The takhallus sign ؔ (U+0614) is stripped: it is a name mark, not a letter.
   A line that does not align keeps its plain Urdu.
   (Used by the reader and Look up scans for Rekhta lines, and by scripts/lib_scan.js: one copy.) */
const RK_NON_LATIN = /[\u0600-\u06ff\u0900-\u097f]/;
const RK_ROMAN_VOWEL = /[aeiouāīūñ]/;
const RK_URDU_NONCONS = /[اآىیےںءأئؤۂھً-ٰٟؔ]/;   // و ہ ی can be consonants: tried per word below
const RK_MAYBE_CONS = ['و', 'ی', 'ہ'];
const RK_DIGRAPH_H = /[bcdgjkpstṭḍṛḳġ]/;

function rkRomanConsonants(word) {   // [{ch, dbl}] one entry per consonant letter ('th' = one), doubled letters marked
    const w = word.toLowerCase().replace(/[-’‘ʾ']/g, ''), out = [];
    let afterVowel = true;
    for (let i = 0; i < w.length; i++) {
        const c = w[i];
        if (RK_ROMAN_VOWEL.test(c)) { afterVowel = true; continue; }
        const last = out[out.length - 1];
        if (c === '.') {   // .a .i .u = ʿain (ta.alluq); .e .ī after a vowel = hamza (aa.e), which is not a consonant here
            if (/[aiu]/.test(w[i + 1] || '')) { out.push({ ch: 'ʿ', dbl: false }); afterVowel = false; }
            continue;
        }
        if (c === 'h' && last && !afterVowel && last.ch.length === 2 && last.ch[1] === 'h') continue;   // chh: the h of an aspirate already taken
        let unit = c;
        if (w[i + 1] === 'h' && RK_DIGRAPH_H.test(c)) { unit = c + 'h'; i++; }
        if (last && !afterVowel && (last.ch === unit || (unit.length === 2 && last.ch === unit[0]))) { last.dbl = true; last.ch = unit; }
        else out.push({ ch: unit, dbl: false });
        afterVowel = false;
    }
    return out;
}

function rkAddTashdid(uw, rw) {   // uw: one Urdu word, rw: its Roman; returns uw with a shadda where Roman doubles a consonant
    if (/ّ/.test(uw)) return uw;
    const rc = rkRomanConsonants(rw);
    const di = rc.findIndex(u => u.dbl);
    if (di < 0) return uw;
    const letters = [...uw.normalize('NFC')];
    for (let mask = 0; mask < 8; mask++) {   // which of و ی ہ count as consonants in this word
        const extra = RK_MAYBE_CONS.filter((_, k) => mask & (1 << k));
        const cons = [];
        letters.forEach((ch, i) => { if (!RK_URDU_NONCONS.test(ch) && (!RK_MAYBE_CONS.includes(ch) || extra.includes(ch))) cons.push(i); });
        if (cons.length === rc.length) { letters.splice(cons[di] + 1, 0, 'ّ'); return letters.join(''); }
    }
    return uw;   // not a clean letter-for-letter match: leave it
}

/* The pen-name sign is not a letter. Allāh is spelled several ways (اللّٰہ الّلہ, with an honorific sign: اللہؐ) and joined
   with a stray ZWNJ (رسول‌ اللہ); the engine reads plain اللہ (handbook 3.4 waṣl). Other words keep their honorific sign:
   the engine already reads محمدؐ as the poets do. */
function rkPlain(ur) {
    return ur.replace(/[\ufb50-\ufdff\ufe70-\ufeff]/g, c => c.normalize('NFKC')).replace(/ؔ/g, '').replace(/\u200c(?=\s)|(?<=\s)\u200c/g, '')
        .replace(/(?:الل[ّٰ]+ہ|الّلہ|اللہ)[\u0610-\u061a]*/g, 'اللہ');   // only the two-lām spellings: الٰہ (ilāh) is another word
}

/* ---- Persian (Fārsī) input for the Scan tab ----
   faScanText: a line in Persian spelling, written the way the engine reads verse. Iranian letters → the engine's (ه → ہ,
   ي → ی, ك → ک, هٔ / ۀ → ۂ for the iẓāfat), the half-space joiner (نمی‌دانم) → a space, and a nūn after a long vowel at a word's end
   → ں: Persian prosody does not count it (این chūn → ایں, جان → جاں), exactly as Urdu verse spelling marks it.
   detectScanLang: 'fa' when the text uses Iranian letters or reads as Persian (است، نیست، می‌، را …), else 'ur'. */
const FA_WORDS = new Set('است نیست هست را از چه چو چون کجا ای بود باشد شد کرد کند گشت آمد دارم دارد نمی می همه هیچ ما شما او ایشان این آن'.split(' '));
const UR_WORDS = new Set('ہے ہیں میں کا کی کے سے نے کو تھا تھی تھے نہیں کیا ہو ہوا کوئی کچھ یہ وہ اب بھی ہی'.split(' '));
/* Iranian spelling the Urdu-script engine misreads, fixed while the ZWNJ still shows what is one word:
   - ast written onto a word with a ZWNJ is contracted (مشکل‌ست mush-ki-last, سوخته‌ست sūḳh-tast: the ه goes);
   - final -وی after a consonant is ū + y (روی rūy, موی, هایاهوی), written وئے as Urdu writes it, which the engine reads
     as rū, rūy or rū-yi (به رویی), not ravī; the -avī adjectives (قوی, معنوی) and the verbs ravī / shavī (می‌روی, نشوی, bare شوی) keep their spelling;
   - آ inside a word opens a compound's second word (دلآویز), split off so liaison may join it (di-lā-vez);
   - so does the alif of a verb stem after the preverbs bar-, dar-, farā-, furū- (برافشانیم ba-raf-shā-nīm, دراندازیم
     da-ran-dā-zīm), which the engine would otherwise read as a long ā;
   - final -ای after ā is the iẓāfat (or yā) -ye, as Urdu writes it ائے (سودای saudā-ye, دعای, برای);
   - کاین is ke + īn, one syllable (کیں kīn); توی is tu-yī ("you are"), not ū + y.
   Punctuation goes first: the engine would read ، or ؟ as a letter (دل، as two syllables). */
const FA_PREVERB = /(^|[\s\u200c])(بر|در|فرا|فرو)(?=(افشان|انداز|انداخت|افروز|افروخت|افکن|افگن|افت|اوفت|انگیز|انگیخت|افراز|افراشت|اندیش|ایست))/g;
const FA_AVI = /^(قوی|معنوی|علوی|نبوی|دنیوی|اخروی|لغوی|مولوی|ثانوی|پهلوی|نحوی|دعوی|تقوی|فتوی|سلوی|عیسوی|موسوی|اموی|بدوی|خسروی|کسروی)$/;
function faIranianSpelling(s) {
  return s.replace(/[،؛؟!?.:«»"“”()…]+/g, ' ').replace(/ه\u200cا?ست(?=$|[\s،.!؟])/g, 'ست')
    .replace(/([^\sاوی\u200c])\u200cا?ست(?=$|[\s،.!؟])/g, '$1ست')
    .replace(/(^|[\s\u200c])([^\s\u200c]*[^\s\u200cا]وی)(?=$|[\s\u200c،.!؟])/g, (m, a, w, at, str) => {
      const verb = /^[نب]?(رو|شو)ی$/.test(w) && (w !== 'روی' || /می\u200c?$|می $/.test(str.slice(0, at + a.length)));
      if (w === 'توی') return a + 'توئی';
      return a + (verb || FA_AVI.test(w) ? w : w.slice(0, -1) + 'ئے');
    })
    .replace(/(^|[\s\u200c])([^\s\u200c]+ا)ی(?=$|[\s\u200c])/g, '$1$2ئے')
    .replace(/(^|[\s\u200c])کاین(?=$|[\s\u200c])/g, '$1کیں')
    .replace(/([^\s\u200c])آ/g, '$1 آ')
    .replace(FA_PREVERB, '$1$2 ');
}
function faScanText(s) { return faProsodyText(faScanSpelling(s)); }
/* the spelling half of faScanText, word by word (no line-end prosody): for word lists (data/fa_scan.json verbs) */
function faScanSpelling(s) {
  return faIranianSpelling(String(s || '').normalize('NFC')
    .replace(/[\ufb50-\ufdff\ufe70-\ufeff]/g, c => c.normalize('NFKC'))
    .replace(/\u200c(?=[\u064B-\u0655])/g, '')   // an editor's zer after a ZWNJ (دورباش‌ِ) belongs to the letter before it
    .replace(/\u0652|\u0640/g, ''))   // sukūn (fully voweled text): the engine reads a bare consonant as closing the syllable anyway
    .replace(/\u200c/g, ' ').replace(/ي|ى/g, 'ی').replace(/ك/g, 'ک')
    .replace(/هٔ|ۀ/g, 'ۂ').replace(/ه/g, 'ہ')
    .replace(/ہ یِ(?=$|\s)/g, 'ۂ')   // دیده‌یِ: the iẓāfat after a silent h, as Urdu writes it (dīda-e)
    .replace(/([آاو])یِ(?=$|\s)/g, '$1ئِ')   // رویِ, جایِ: -ye after a long vowel, Urdu روئے (rū-e)
    .replace(/([آاو])یی(?=$|\s)/g, '$1ئی')   // تویی, جایی: ī after a long vowel, Urdu توئی
    .replace(/([آاوی])ن(?=$|[\s،۔؟!])/g, '$1ں')   // آن is آں in Urdu spelling, like جان → جاں
    .replace(/[ \t]+/g, ' ').trim();
}
/* Persian prosody spelled out for the engine (Persian lines only): after a consonant, ast loses its alif and joins the word
   (دیگر است → دیگرست dī-ga-rast, as Persian often writes it); after a vowel it stays a word of its own. */
function faProsodyText(s) {
  return String(s || '').replace(/(^|\s)(\S*[^\sاوی‌ہۂۓ])\s+است(?=$|[\s،۔؟!])/g, (m, a, w) => a + w.replace(/ں$/, 'ن') + 'ست')   // jā-nast: the n starts a syllable
    /* the line's last word ending in a long vowel + s/sh/kh/f + t (dōst, nīst, dāsht, sākht, yāft) is one long syllable at the
       end of a line; the engine lets only ONE final consonant go uncounted, so the t is dropped here. Only these clusters:
       Urdu script hides short vowels, so دیدم (dī-dam) looks like an overlong ending and must not be touched. */
    .replace(/([^\s])([اوی])([سشخف])ت(?=[\s،۔؟!]*$)/, '$1$2$3')   // a word-initial alif is a short a (ast, hast): not touched
    /* and so is any long ā / ī + one consonant there (andāzīm, jahān, yār): the last syllable of a hemistich counts long, whatever
       it holds. Not after و, which may be the consonant v (shavad, ravad), nor ی after ا or و, the consonant y (bar-ā-yad,
       ḥikā-yat, gū-yad, ā-yad): those end in a short vowel + consonant */
    .replace(/([^\s])ا([^\sاویںہۂئ])(?=[\s،۔؟!]*$)/, '$1ا')
    .replace(/([^\sاوآ])ی([^\sاویںہۂئ])(?=[\s،۔؟!]*$)/, '$1ی')
    /* mid-line the same word is long + short, never more (Mahdavi Mazdeh 2019: a syllable holds at most three morae, the
       second coda consonant is extrametrical): navāḳht yār → navāḳh yār, dōst ke → dōs ke. Not before a vowel-initial word,
       where the t starts the next syllable (dōst-ast) */
    .replace(/([^\s])([اوی])([سشخف])ت(?=\s+[^\sاآ])/g, '$1$2$3');
}
window.faProsodyText = faProsodyText;

/* Persian liaison (vasl), optional and decided by the meter: a word ending in a consonant joins a following word that opens
   with alif (ke ʿeshq-āsān, bar ān → ba-rān, ham az → ha-maz). آ keeps its long ā; ا before a consonant is a short vowel and
   goes. -> the line's variants: each join alone, and all of them together. */
function faLiaisonVariants(text) {
  const W = String(text || '').split(' ');
  const at = [];
  /* the conjunction و after a consonant takes that consonant (afshānīm-o → af-shā-nī-mo, dil-o jān): written as the word
     less its last letter + that letter with و, which the engine reads as one short syllable (its own join costs 1.2) */
  for (let i = 0; i < W.length - 1; i++) if ((/^[اآ]/.test(W[i + 1]) || W[i + 1] === 'و') && W[i].length > 1 && !/[اوی‌ہۂۓِ]$/.test(W[i])) at.push(i);
  const join = idx => {
    const v = W.slice();
    for (const i of idx.slice().reverse()) {
      if (W[i + 1] === 'و') { v[i] = W[i].slice(0, -1); v[i + 1] = W[i].slice(-1) + 'و'; continue; }
      v[i] = v[i] + v[i + 1].replace(/^آ/, 'ا').replace(/^ا(?=[^ا])/, m => W[i + 1][0] === 'آ' ? m : ''); v.splice(i + 1, 1);
    }
    return v.join(' ');
  };
  const out = at.map(i => join([i]));
  if (at.length > 1) out.push(join(at));
  /* contractions (Shams-i Qays; Mahdavi Mazdeh 2019), also optional: ke / che before a vowel lose their e (که از → کز kaz,
     که این → کیں kīn, که او → کو kū), and ast after a vowel loses its alif (مردہ است → مردست murdast, دانا است → داناست) */
  for (let i = 0; i < W.length - 1; i++) {
    const v = W.slice();
    if (/^(کہ|چہ)$/.test(W[i]) && /^[اآ]/.test(W[i + 1])) v[i] = W[i].slice(0, -1) + W[i + 1].replace(/^آ/, 'ا').replace(/^ا(?=[^ا])/, m => W[i + 1][0] === 'آ' ? m : '');
    else if (W[i + 1] === 'است' && /[اوی]$|[^\s]ہ$/.test(W[i]) && W[i].length > 1) v[i] = W[i].replace(/ہ$/, '') + 'ست';
    else continue;
    v.splice(i + 1, 1);
    out.push(v.join(' '));
  }
  return out;
}
/* every fit of a Persian line, as written or with liaison, the cheaper per meter; a fit found only through liaison carries
   `liaison` (its text), since its syllables belong to the joined line, not to the words as written */
/* Where Persian grammar lets an iẓāfat go (the archived Jahanshiri grammar, "Genitive case" and "Noun phrase"; UT Austin
   Persian Online Resources, "Ezafe"): it joins a noun or adjective to what modifies it, so
   - never on a preposition, conjunction, particle, demonstrative (īn, ān), quantifier that takes none (har, hīch, chand),
     pronoun, number, the copula, a verb, a word already marked, a word ending in the yā of unity (ے), or the line's last word;
   - never before و, را, a preposition or conjunction (bī- is a prefix: suḳhanān-e bī-ḥasīb), the copula or a verb (the word before closes its phrase).
   Verbs: the forms scripts/lib_fa_verbs.js generates (FA_VERBS, data/fa_scan.json), and any word after می / نمی. -> word indexes */
const FA_IZ_NO_HEAD = new Set(('از بہ ب در بر با بی بے تا چو چوں کہ ک کی گر اگر و را ای اے یا نہ نی مگر چہ چنیں چناں ہر ہیچ چند ' +
  'ایں آں ہمیں ہماں من تو او ما شما ایشاں وی یک دو سہ است ست نیست ہست بود شد می نمی ہمی ز کز وز زاں زیں بدیں بداں دریں دراں ' +
  'ازیں ازاں نیز ہم باز ہنوز اگرچہ ولی لیک لیکن پس جز بجز کجا چگونہ کو آیا').split(' '));
const FA_IZ_NO_NEXT = new Set(('از بہ ب در بر با تا چو چوں کہ ک کی گر اگر و را ای اے یا مگر است ست نیست ہست بود شد می نمی ' +
  'ہمی ز کز وز نیز ہم باز ہنوز اگرچہ ولی لیک لیکن پس جز بجز زاں زیں بدیں بداں دریں دراں ازیں ازاں ہر').split(' '));
const FA_VERB_SET = new Set((typeof FA_VERBS !== 'undefined' && FA_VERBS) || []);
function faIzafatSlots(W) {
  const verb = i => FA_VERB_SET.has(W[i]) || FA_VERB_SET.has(W[i].replace(/یی/g, 'ئی')) || (i > 0 && /^(می|نمی|ہمی)$/.test(W[i - 1]));   // جوییم = جوئیم
  return W.map((_, i) => i).filter(i => i < W.length - 1 && W[i].length > 1 && !FA_IZ_NO_HEAD.has(W[i]) && !verb(i) &&
    !/[ِٔ]$|ۂ$|ے$/.test(W[i]) && !FA_IZ_NO_NEXT.has(W[i + 1]) && !verb(i + 1));
}
window.faIzafatSlots = faIzafatSlots;
function faScanFits(S, text, opts) {
  const best = new Map();
  /* liaison changes the words, so its fit only lends its cost to a fit of the line as written (or carries `liaison`); a guessed
     iẓāfat keeps the words, so its fit (syllables and all) stands, marked `izafat` with the text it scanned */
  const add = (fits, how, t, extra) => (fits || []).forEach(f => {
    const k = String(f.meter.id), had = best.get(k), c = f.c + extra;
    if (had && c >= had.c - 1e-9) return;
    if (how === 'liaison') best.set(k, had ? Object.assign({}, had, { c }) : Object.assign({}, f, { c, liaison: t }));
    else if (how === 'izafat') best.set(k, Object.assign({}, f, { c, izafat: t }));
    else if (how === 'refrain') best.set(k, Object.assign({}, f, { c, refrain: t }));
    else best.set(k, f);
  });
  /* opts.target (a Set of meter ids): only whether those fit matters (a ghazal's known meter), so stop at the first fit */
  const target = opts && opts.target;
  const done = () => !!target && [...target].some(id => { const f = best.get(String(id)); return f && f.c <= 2; });
  /* opts.mustazad (meter ids): a mustazād ghazal's line, also scanned as meter + tail (faMustazadScan) */
  const mz = opts && opts.mustazad;
  const scan = (t, how, extra) => {
    if (done()) return;
    try { add(S.scanLine(t).fits, how, t, extra); if (mz) add(faMustazadScan(S, t, mz).fits, how, t, extra); } catch (e) { /* a variant the engine cannot read */ }
  };
  scan(text, null, 0);
  for (const v of faLiaisonVariants(text)) scan(v, 'liaison', 0);
  /* opts.guessIzafat (true for up to three, or a number): text with no Roman to say where the iẓāfat goes (pasted Iranian text,
     Ganjoor's plain text). Only where Persian grammar allows one (faIzafatSlots), each at a small cost so the line as written wins
     when it fits; fewest first. */
  if (opts && opts.guessIzafat) {
    const W = String(text || '').split(' ');
    const at = faIzafatSlots(W), most = opts.guessIzafat === true ? 3 : opts.guessIzafat;
    const iz = w => /[ہ]$/.test(w) ? w.replace(/ہ$/, 'ۂ') : w.replace(/ں$/, 'ن') + 'ِ';   // nāzanī-ne: before an iẓāfat the n is a full consonant
    let sets = [[]];
    for (const i of at) sets = sets.concat(sets.filter(x => x.length < most).map(x => x.concat(i)));
    sets = sets.slice(1).sort((a, b) => a.length - b.length);
    for (const idx of sets) scan(W.map((w, i) => idx.includes(i) ? iz(w) : w).join(' '), 'izafat', 0.3 * idx.length);
  }
  /* opts.refrain (with a target): a line that still misses its meter may carry a sung refrain (faRefrainVariants); the shortened
     line counts only where it fits a target meter at ≤ 2, and its fit carries `refrain` (the text it scanned) */
  if (opts && opts.refrain && target && !done()) {
    const want = new Set([...target].map(String));
    const keep = (fits, t) => add((fits || []).filter(f => want.has(String(f.meter.id)) && f.c <= 2), 'refrain', t, 0);
    for (const v of faRefrainVariants(text)) for (const t of [v].concat(faLiaisonVariants(v))) {
      if (done()) break;
      try { keep(S.scanLine(t).fits, t); if (mz) keep(faMustazadScan(S, t, mz).fits, t); } catch (e) { /* unreadable variant */ }
    }
  }
  return [...best.values()].sort((a, b) => a.c - b.c);
}
window.faLiaisonVariants = faLiaisonVariants;
window.faScanFits = faScanFits;

/* Mustazād (Persian): each line of a meter followed by an added phrase made of the meter's first and last feet (hazaj #8 +
   mafʿūlu faʿūlun: "har lahza ba-shakle but-e-'ayyār bar āmad / dil burd-o-nihāñ shud"). The head (all but the last 2–6
   words) fits a meter at cost ≤ 2, the tail exactly that meter's first + last foot (≤ 2), and no grafted word crosses the
   split. -> a scanLine-like result {words, units, fits}: per meter its cheapest split, as ONE fit under the meter's own id whose
   pattern runs on through the tail after a caesura, so explain() and the chips give the whole line (fit.mustazad = words in the
   head). ids (meter ids): only those meters (a mustazād ghazal's own); none: every meter. Two shapes are no mustazād and are
   left out unless opts.loose (the ghazal meter vote, scripts/lib_scan.js, keeps them as it always had): a tail that repeats
   the words before it (a sung repeat), and a meter whose first + last foot are just its last two feet (a sālim meter running
   on: Rumi's "biyā biyā dildār-e man dildār-e man / darā darā dar kār-e man dar kār-e man" is a bayt of rajaz musaddas). */
const FA_MZ_PARTS = new WeakMap();   // meter row -> {tail, meter, runOn} or null
function faMustazadParts(S, m) {
  if (FA_MZ_PARTS.has(m)) return FA_MZ_PARTS.get(m);
  const feet = String(m.raw || '').split(/\s*\/\/?\s*/).filter(Boolean);
  let P = null;
  if (feet.length >= 3 && m.vars && m.toks) {
    const tailRaw = feet[0] + ' / ' + feet[feet.length - 1], toks = S.parseRaw(tailRaw), seq = toks.filter(t => t !== '|' && t !== '//');
    const tailVars = [{ seq, extra: 0 }, { seq: seq.concat(['c']), extra: 0 }];   // the tail ends the line: its last short may go unscanned
    P = {
      runOn: (feet[0] + feet[feet.length - 1]).replace(/\s/g, '') === (feet[feet.length - 2] + feet[feet.length - 1]).replace(/\s/g, ''),
      tail: { id: m.id, kind: m.kind, seq, vars: tailVars },
      meter: Object.assign({}, m, { raw: m.raw + ' // ' + tailRaw, toks: m.toks.concat(['//'], toks), seq: m.seq.concat(seq), cae: m.seq.length, mustazad: true,
        vars: m.vars.flatMap(h => tailVars.map(t => ({ seq: h.seq.concat(t.seq), extra: h.extra + t.extra }))) })
    };
  }
  FA_MZ_PARTS.set(m, P);
  return P;
}
function faMustazadScan(S, text, ids, opts) {
  const loose = !!(opts && opts.loose);
  const words = S.tokenize(String(text || '')), n = words.length, res = { words, units: [], fits: [] };
  if (n < 5) return res;
  const units = res.units = S.buildUnits(words);
  const want = ids ? new Set([...ids].map(String)) : null;
  const rows = S.METERS.filter(m => (!want || want.has(String(m.id))) && faMustazadParts(S, m) && (loose || !faMustazadParts(S, m).runOn));
  const same = (a, b, k) => { for (let j = 0; j < k; j++) if (words[a + j].raw !== words[b + j].raw) return false; return true; };
  const best = new Map();
  for (let t = 2; t <= Math.min(6, n - 3); t++) {
    const s = n - t;
    if (!loose && s >= t && same(s - t, s, t)) continue;
    const head = units.slice(0, s).map(us => us.filter(u => u.to < s));
    const tail = units.slice(s).map(us => us.map(u => Object.assign({}, u, { from: u.from - s, to: u.to - s, at: u })));
    for (const m of rows) {
      const h = S.matchMeter(head, s, m);
      if (!h || h.c > 2) continue;
      const P = faMustazadParts(S, m), r = S.matchMeter(tail, t, P.tail);
      if (!r || r.c - r.prior > 2) continue;
      const c = h.c + r.c - r.prior, k = String(m.id), had = best.get(k);   // the meter's prior counts once
      if (had && had.c <= c) continue;
      best.set(k, { meter: P.meter, c, seq: h.seq.concat(r.seq), mustazad: s,
        path: h.path.concat(r.path.map(st => Object.assign({}, st, { u: st.u.at, pos: st.pos + h.seq.length }))) });
    }
  }
  res.fits = [...best.values()].sort((a, b) => a.c - b.c);
  return res;
}
/* Is a Persian ghazal a mustazād? When at least half of its Persian lines miss its meter as a whole (ScanFa, cost ≤ 2) and
   scan as meter + tail (faMustazadScan, strict). texts: those lines as the engine reads them (faProsodyText); ids: the
   ghazal's meters. One rule for scripts/lib_scan.js (scanGhazal), tests/benchmark_fa.js and the reader (scanCorpusLine). */
const FA_MUSTAZAD_SHARE = 0.5;
function faMustazadGhazal(S, texts, ids) {
  if (!ids || !ids.length || !texts.length) return false;
  const want = new Set([...ids].map(String)), need = FA_MUSTAZAD_SHARE * texts.length;
  let yes = 0, left = texts.length;
  for (const t of texts) {
    if (yes >= need || yes + left < need) break;
    left--;
    try { if (!S.scanLine(t).fits.some(f => want.has(String(f.meter.id)) && f.c <= 2) && faMustazadScan(S, t, want).fits.length) yes++; }
    catch (e) { /* a line the engine cannot read */ }
  }
  return yes >= need;
}
window.faMustazadScan = faMustazadScan;
window.faMustazadGhazal = faMustazadGhazal;

/* Sung refrains written into a Persian line (Jami: "gul az ruḳhat āmoḳhta nāzuk badanī rā badanī rā badanī rā"): the line
   without the repeats of its last 1–4 words, and its first half when the second half repeats it. Only tried where the line as
   written misses its ghazal's meter, and kept only where the shortened line fits it (faScanFits opts.refrain, scanCorpusLine):
   Rumi repeats words inside the meter too ("zahe ʿishq zahe ʿishq", "āyina-am man āyina-am man"). */
function faRefrainVariants(text) {
  const W = String(text || '').split(' ').filter(Boolean), n = W.length, out = [];
  const eq = (a, b, k) => W.slice(a, a + k).join(' ') === W.slice(b, b + k).join(' ');
  for (let k = 1; k <= 4; k++) {
    let cut = n;
    while (cut - 2 * k >= 0 && eq(cut - 2 * k, cut - k, k)) cut -= k;
    if (cut < n && cut >= 3) out.push(W.slice(0, cut).join(' '));
  }
  if (n >= 6 && n % 2 === 0 && eq(0, n / 2, n / 2)) out.push(W.slice(0, n / 2).join(' '));
  return [...new Set(out)];
}
window.faRefrainVariants = faRefrainVariants;

function detectScanLang(text) {
  const t = String(text || '');
  if (/[\u200cيكۀ]|هٔ|ه(?=$|[\s،۔])/.test(t)) return 'fa';
  let f = 0, u = 0;
  t.split(/[\s،۔؟!]+/).forEach(w => { const k = w.replace(/ہ/g, 'ه').replace(/ے/g, 'ی'); if (FA_WORDS.has(k) || FA_WORDS.has(w)) f++; if (UR_WORDS.has(w)) u++; });
  return f >= 2 && f > u ? 'fa' : 'ur';
}
window.faScanText = faScanText;
window.faScanSpelling = faScanSpelling;
window.detectScanLang = detectScanLang;

/* ---- Persian words in Roman and Devanagari (Sufinama's spellings, data/fa_lexicon.json) ----
   faKey must stay identical to scripts/lib_fa_lexicon.js. A word not in the list is tried as a known stem with Persian
   prefixes (mī-, namī-, be-, ba-, na-) and endings (-hā, -ān, -am, -ī, -ash …); failing that, the caller falls back. */
let faLex = (typeof FA_LEXICON !== 'undefined' && FA_LEXICON) || {};
function setFaLexicon(lex) { faLex = lex || {}; }   // tests/benchmark_fa.js scores a list built without its test poets
function faKey(w) {
  return String(w || '').normalize('NFC')
    .replace(/[\ufb50-\ufdff\ufe70-\ufeff]/g, c => c.normalize('NFKC'))
    .replace(/[\u064B-\u065F\u0670\u0640\u200c\u200d\u0610-\u061a\u0654]/g, '')
    .replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/[هۂۀة]/g, 'ہ').replace(/ں/g, 'ن')
    .replace(/[^\u0621-\u06d3]/g, '');
}
const FA_PREFIX = [['نمی', 'namī-', 'नमी-'], ['می', 'mī-', 'मी-'], ['بی', 'be-', 'बे-'], ['ب', 'ba-', 'ब-'], ['ن', 'na-', 'न-']];
/* ئے after a vowel is the iẓāfat / yā of a known word (روئے rū, faLineScripts adds the -e); a silent h after a known stem is the
   participle's -a (کردہ karda, شدہ shuda) */
const FA_SUFFIX = [['ئے', '', ''], ['ہا', '-hā', '-हा'], ['ہای', '-hā-e', '-हा-ए'], ['ان', 'ān', 'ान'], ['یم', 'īm', 'ीम'], ['ید', 'īd', 'ीद'], ['ہ', 'a', 'ः'],
  ['ند', 'and', 'न्द'], ['ست', 'st', 'स्त'], ['ام', 'am', 'म'], ['م', 'am', 'म'], ['ش', 'ash', 'श'], ['ت', 'at', 'त'], ['ی', 'ī', 'ी']];
/* exact spelling first; then the other final yeh (Iranian ی for Urdu ے, and back) */
function faLookup(k) {
  const e = faLex[k] || (/ی$/.test(k) && faLex[k.slice(0, -1) + 'ے']) || (/ے$/.test(k) && faLex[k.slice(0, -1) + 'ی']);
  return e ? { ro: e[0], hi: e[1] || '' } : null;
}
function faWordScripts(w) {
  const k = faKey(w);
  if (!k) return null;
  let hit = faLookup(k);
  if (hit) return hit;
  const withSuffix = stem => {
    for (const [u, r, h] of FA_SUFFIX) {
      if (stem.length > u.length + 1 && stem.endsWith(u)) {
        const s = faLookup(stem.slice(0, -u.length));
        if (s && s.ro) return { ro: s.ro + r, hi: s.hi ? s.hi + h : '' };
      }
    }
    return null;
  };
  if ((hit = withSuffix(k))) return hit;
  for (const [u, r, h] of FA_PREFIX) {
    if (k.length > u.length + 1 && k.startsWith(u)) {
      const rest = k.slice(u.length), s = faLookup(rest) || withSuffix(rest);
      if (s && s.ro) return { ro: r + s.ro, hi: s.hi ? h + s.hi : '' };
    }
  }
  return null;
}
/* Arabic inside Persian kalaam: formulae that follow Arabic rules (al- assimilated, case endings) no Persian word list gives.
   Matched as whole phrases (faKey per word), longest first, before the word-by-word lookup. [Urdu-script, Roman, Devanagari] */
const FA_ARABIC = [
  ['الا یا ایہا الساقی', 'alā yā ayyuha-s-sāqī', 'अला या अय्युहस्साक़ी'],
  ['ادر کاسا و ناولہا', 'adir ka.san va nāvilhā', 'अदिर कासन व नाविलहा'],
  ['صلی اللہ علیہ وسلم', 'sallallāhu ʿalaihi va sallam', 'सल्लल्लाहु अलैहि व सल्लम'],
  ['لا الہ الا اللہ', 'lā ilāha illallāh', 'ला इलाह इल्लल्लाह'],
  ['سبحان الذی اسری', 'subhānallazī asrā', 'सुब्हानल्लज़ी असरा'],
  ['الصلوۃ والسلام علیک', 'as-salātu vas-salāmu ʿalaik', 'अस्सलातु वस्सलामु अलैक'],
  ['رحمۃ للعالمین', 'rahmatul-lil-ʿālamīn', 'रहमतुल-लिल-आलमीन'],
  ['یا رسول اللہ', 'yā rasūlallāh', 'या रसूलल्लाह'],
  ['یا حبیب اللہ', 'yā habīballāh', 'या हबीबल्लाह'],
  ['علی ولی اللہ', 'ʿalī valiyullāh', 'अली वलीयुल्लाह'],
  ['ان شاء اللہ', 'inshā-allāh', 'इंशा-अल्लाह'],
  ['ما شاء اللہ', 'mā-shā-allāh', 'मा-शा-अल्लाह'],
  ['بسم اللہ', 'bismillāh', 'बिस्मिल्लाह'],
  ['سبحان اللہ', 'subhānallāh', 'सुब्हानल्लाह'],
  ['الحمد للہ', 'alhamdulillāh', 'अल्हम्दुलिल्लाह'],
  ['اللہ اکبر', 'allāhu akbar', 'अल्लाहु अकबर'],
  ['انا الحق', 'anal-haq', 'अनल-हक़'],
  ['ہو الحق', 'huval-haq', 'हुवल-हक़'],
  ['خیر البشر', 'ḳhair-ul-bashar', 'ख़ैर-उल-बशर'],
  ['ذوالجلال', 'zul-jalāl', 'ज़ुल-जलाल'],
  ['والضحی', 'vaz-zuhā', 'वज़्ज़ुहा'],
  ['واللیل', 'val-lail', 'वल-लैल'],
  ['رسول اللہ', 'rasūlallāh', 'रसूलल्लाह']
];
let _faArabic = null;
function faArabicAt(words, i) {
  if (!_faArabic) _faArabic = FA_ARABIC.map(([u, r, h]) => ({ keys: u.split(' ').map(faKey), ro: r, hi: h })).sort((a, b) => b.keys.length - a.keys.length);
  for (const p of _faArabic) {
    if (i + p.keys.length > words.length) continue;
    const f = k => k.replace(/ٰ/g, '').replace(/[أإ]/g, 'ا');   // Arabic spellings: dagger alif, hamza on alif (کأسا)
    if (p.keys.every((k, j) => f(faKey(words[i + j])) === f(k))) return p;
  }
  return null;
}

/* a Fārsī line in Roman and Devanagari, word by word: the Persian list first, then the Urdu word map, then the letter map.
   A written iẓāfat (zer, ۂ, or ئے on a word) shows as -e. */
function faLineScripts(line) {
  const hi = [], ro = [];
  let known = 0, n = 0;
  const one = w => {
    n++;
    const fa = faWordScripts(w);
    let r = fa && fa.ro, h = fa && fa.hi;
    if (fa) known++;
    if (!r || !h) {
      const u = (typeof urduWordsToScripts === 'function') ? urduWordsToScripts(w) : null;
      r = r || (u && u.ro) || (typeof urduToRoman === 'function' ? urduToRoman(w) : w);
      h = h || (u && u.hi) || (typeof urduToDevanagari === 'function' ? urduToDevanagari(w) : w);
    }
    /* a written iẓāfat: zer or ۂ always; ئے only when the word's own Roman does not already end in it (جائے jā.e) */
    if ((/[\u0650]$|ۂ$/.test(w) || (/ئے$/.test(w) && !/e$/.test(r))) && !/-e$/.test(r)) { r += '-e'; h += '-ए'; }
    return [r, h];
  };
  const words = String(line || '').split(/\s+/).filter(Boolean);
  for (let i = 0; i < words.length; i++) {
    const ar = faArabicAt(words, i);
    if (ar) { ro.push(ar.ro); hi.push(ar.hi); n += ar.keys.length; known += ar.keys.length; i += ar.keys.length - 1; continue; }
    const parts = words[i].split('\u200c').filter(Boolean).map(one);   // صاحب‌دلان: two words, one compound
    let r = parts.map(p => p[0]).join('-'), h = parts.map(p => p[1]).join('-');
    /* Sufinama joins these particles to the next word: ba-qatl, za-dastam, be-niyāz */
    /* … and an iẓāfat to the word it joins: qatl-e-man */
    if ((/^(ba|bi|be|za|ze)$/.test(r) || /-e$/.test(r)) && i + 1 < words.length) { ro.push(r + '-'); hi.push(h + '-'); continue; }
    ro.push(r); hi.push(h);
  }
  return { ro: ro.join(' ').replace(/- /g, '-'), hi: hi.join(' ').replace(/- /g, '-'), known, words: n };
}
window.faKey = faKey;
window.faWordScripts = faWordScripts;
window.faLineScripts = faLineScripts;
window.setFaLexicon = setFaLexicon;

function rekhtaScanText(ur, ro) {
    const plain = rkPlain(ur);
    const honorific = ur.replace(/ؔ/g, '').split(/\s+/).filter(Boolean).map(w => /[\u0610-\u061a]/.test(w));   // محمدؐ: the engine's own reading, no tashdīd
    if (!ro || RK_NON_LATIN.test(ro)) return plain;
    const uw = plain.split(/\s+/).filter(Boolean);
    const parts = [];
    ro.replace(/\s+e(?=\s|$)/g, '-e').split(/\s+/).filter(Boolean).forEach(tok =>
        tok.split('-').forEach((p, i) => {
            if (i > 0 && /^(e|ye)$/i.test(p) && parts.length) parts[parts.length - 1].iz = true;
            else if (p) parts.push({ ro: p, iz: false });
        }));
    const izafa = w => /[ِٔ]$/.test(w) || /ے$/.test(w) ? w : (/[ہۂ]$/.test(w) ? w.replace(/[ہۂ]$/, 'ۂ') : w + 'ِ');
    if (parts.length === uw.length) {
        return uw.map((w, i) => {
            if (!honorific[i]) w = rkAddTashdid(w, parts[i].ro);
            return parts[i].iz ? izafa(w) : w;
        }).join(' ');
    }
    /* The Roman splits or joins words differently (Sufinama: ba-ḳhudā / بخدا, rasūlallāh / رسول اللہ): pair them up by
       consonant skeleton, letting one word stand for two or three, and keep the iẓāfat hints. Unsure → as written. */
    const groups = rkAlignWords(uw, parts.map(p => p.ro));
    if (!groups) return plain;
    return groups.map(([u0, u1, p0, p1]) => {
        const ws = uw.slice(u0, u1);
        /* a doubled Roman letter is a tashdīd only where one word pairs with one word (farruḳh / فرخ); across a split or a
           join it is too often not one */
        if (u1 - u0 === 1 && p1 - p0 === 1 && !honorific[u0]) ws[0] = rkAddTashdid(ws[0], parts[p0].ro);
        if (parts[p1 - 1].iz && !RK_NO_IZAFAT.has(ws[ws.length - 1])) ws[ws.length - 1] = izafa(ws[ws.length - 1]);
        return ws.join(' ');
    }).join(' ');
}

/* particles never take an iẓāfat: when the Roman drops one (… ārzū-e lab / آرزوئے بہ لب) the hint is not theirs */
const RK_NO_IZAFAT = new Set(['بہ', 'کہ', 'نہ', 'چہ', 'کی', 'کے', 'کا', 'و', 'ز', 'از', 'در', 'بر', 'تا', 'یا', 'سے', 'میں', 'پہ', 'ہے']);

/* Consonant skeletons for pairing Urdu words with Roman words: letters that the two scripts write alike, with و ی ہ ح ع
   and vowels left out (they are vowels as often as consonants) and doubles merged (tashdīd is unwritten). */
const RK_SKEL_UR = { 'ب': 'b', 'پ': 'p', 'ت': 't', 'ط': 't', 'ٹ': 't', 'ث': 's', 'س': 's', 'ص': 's', 'ج': 'j', 'چ': 'c',
    'خ': 'x', 'د': 'd', 'ڈ': 'd', 'ذ': 'z', 'ز': 'z', 'ض': 'z', 'ظ': 'z', 'ژ': 'z', 'ر': 'r', 'ڑ': 'r', 'ش': 'S', 'غ': 'g',
    'ف': 'f', 'ق': 'q', 'ک': 'k', 'ك': 'k', 'گ': 'g', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ں': 'n' };
const RK_SKEL_UR_FULL = Object.assign({ 'ہ': 'h', 'ح': 'h', 'ھ': 'h', 'ی': 'y', 'ے': 'y', 'ئ': 'y', 'و': 'v' }, RK_SKEL_UR);
function rkSkelUr(w, full) { return [...w].map(c => (full ? RK_SKEL_UR_FULL : RK_SKEL_UR)[c] || '').join('').replace(/(.)\1+/g, '$1'); }
function rkSkelRo(w, full) {
    const s = w.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/kh/g, 'x').replace(/gh/g, 'g').replace(/sh/g, 'S').replace(/ch/g, 'c').replace(/zh/g, 'z')
        .replace(/[^a-zS]/g, '').replace(/w/g, 'v').replace(/ī|ii/g, 'y');
    return (full ? s.replace(/[aeiou]/g, '') : s.replace(/[aeiouyvh]/g, '')).replace(/(.)\1+/g, '$1');
}
function rkSim(a, b) {
    if (!a && !b) return 1;
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return 1 - d[a.length][b.length] / Math.max(a.length, b.length);
}
/* -> [[u0, u1, p0, p1], …] covering both lists (Urdu words u0..u1-1 ↔ Roman parts p0..p1-1), or null when unsure */
function rkAlignWords(uw, ro) {
    const U = uw.length, P = ro.length, NEG = -1e9;
    if (!U || !P || Math.abs(U - P) > Math.max(2, Math.round(U / 3))) return null;
    const us = uw.map(w => rkSkelUr(w)), ps = ro.map(w => rkSkelRo(w));
    const usF = uw.map(w => rkSkelUr(w, true)), psF = ro.map(w => rkSkelRo(w, true));   // with h y v: breaks ties
    const best = Array.from({ length: U + 1 }, () => new Array(P + 1).fill(NEG)), from = Array.from({ length: U + 1 }, () => new Array(P + 1));
    best[0][0] = 0;
    const STEPS = [[1, 1], [1, 2], [2, 1], [1, 3], [3, 1]];
    for (let i = 0; i <= U; i++) for (let j = 0; j <= P; j++) {
        if (best[i][j] === NEG) continue;
        for (const [du, dp] of STEPS) {
            if (i + du > U || j + dp > P) continue;
            const dd = x => x.replace(/(.)\1+/g, '$1');   // b + bk → bk: a joined word's doubles merge too
            const sim = rkSim(dd(us.slice(i, i + du).join('')), dd(ps.slice(j, j + dp).join('')));
            const tie = 0.01 * rkSim(dd(usF.slice(i, i + du).join('')), dd(psF.slice(j, j + dp).join('')));
            const sc = best[i][j] + sim + tie - (du === 1 && dp === 1 ? 0 : 0.15);
            if (sc > best[i + du][j + dp]) { best[i + du][j + dp] = sc; from[i + du][j + dp] = [i, j, sim]; }
        }
    }
    if (best[U][P] === NEG) return null;
    const out = [];
    let i = U, j = P, low = 1, total = 0;
    while (i > 0 || j > 0) {
        const [pi, pj, sim] = from[i][j];
        out.unshift([pi, i, pj, j]);
        low = Math.min(low, sim); total += sim;
        i = pi; j = pj;
    }
    return (total / out.length >= 0.7 && low >= 0.34) ? out : null;
}

/* The text to scan for a ghazal line: a Rekhta line (marked `rk` when the poet data loads) is scanned with the izafat, tashdid and
   pen-name hints its Roman gives; every other line scans as written. Cached on the line. */
function lineScanText(lineObj) {
  if (!lineObj) return '';
  if (!lineObj.rk || !lineObj.ro) return lineObj.ur || '';
  if (lineObj._sc === undefined) lineObj._sc = rekhtaScanText(lineObj.ur || '', lineObj.ro);
  return lineObj._sc;
}
window.lineScanText = lineScanText;

/* Which engine scans a corpus line: Persian lines (l.lang, set at load from the ghazal's lang/xl) on the Persian engine ScanFa,
   with Persian readings and meters and never the Hindi meter; everything else on the Urdu engine. engineOf(result) gives back
   the engine that made a result, for explain / diagnose. */
function engineForLine(l) { return (l && l.lang === 'fa' && typeof ScanFa !== 'undefined') ? ScanFa : Scan; }
/* Whether the ghazal of a Persian corpus line (l.faG, set at load) is a mustazād: faMustazadGhazal, worked out once per ghazal,
   the first time one of its lines misses its meter. -> its meters, or null */
const FA_MUSTAZAD_OF = new WeakMap();
function lineMustazadIds(l) {
  const g = l && l.faG;
  if (!g || !g.meters || !g.meters.length || engineForLine(l) === Scan) return null;
  if (!FA_MUSTAZAD_OF.has(g)) FA_MUSTAZAD_OF.set(g, faMustazadGhazal(ScanFa, g.lines.filter(x => x.lang === 'fa').map(x => faProsodyText(lineScanText(x))), g.meters));
  return FA_MUSTAZAD_OF.get(g) ? g.meters : null;
}
/* ids (optional): the meters to judge the line by, by default its ghazal's. A Persian line that misses them as a whole (no fit at
   cost ≤ 2) is, in a mustazād ghazal, also scanned as meter + tail (faMustazadScan: one fit running through the whole line,
   `mustazad` set). One that still misses is scanned without a sung refrain (faRefrainVariants) when that gives it a fit in its
   meter, cheaper than any it has as written (and ≤ 5, a line that scans): the result then covers the words before the refrain,
   and r.refrain is the number of words left out. */
function scanCorpusLine(l, ids) {
  const eng = engineForLine(l), fa = !!(l && l.lang === 'fa');
  const scan = t => { const r = eng.scanLine(t); if (fa) { r.fits = r.fits.filter(f => f.meter.id !== 'H'); r.__fa = 1; } return r; };
  const text = fa ? faProsodyText(lineScanText(l)) : lineScanText(l), r = scan(text);
  const own = (ids && ids.length) ? ids : (fa && l.faG && l.faG.meters) || [];
  if (!fa || !own.length) return r;
  const want = new Set(own.map(String)), cost = x => Math.min(Infinity, ...x.fits.filter(f => want.has(String(f.meter.id))).map(f => f.c));
  if (cost(r) <= 2) return r;
  const mz = lineMustazadIds(l);
  const withTail = (x, t) => { if (mz) x.fits = x.fits.concat(faMustazadScan(eng, t, mz).fits).sort((a, b) => a.c - b.c); return x; };
  if (cost(withTail(r, text)) <= 2) return r;
  const n = text.split(' ').filter(Boolean).length;
  for (const v of faRefrainVariants(text)) {
    const r2 = withTail(scan(v), v), c = cost(r2);
    if (c <= 5 && c < cost(r)) return Object.assign(r2, { refrain: n - v.split(' ').length });
  }
  return r;
}
function engineOf(r) { return (r && r.__fa && typeof ScanFa !== 'undefined') ? ScanFa : Scan; }
window.engineForLine = engineForLine;
window.scanCorpusLine = scanCorpusLine;
window.engineOf = engineOf;

function urduToDevanagari(str) {
  if(!str) return '';
  str = str.normalize('NFC');
  const multiMap = [
    [/بھ/g, 'भ'], [/پھ/g, 'फ'], [/تھ/g, 'थ'], [/ٹھ/g, 'ठ'], [/جھ/g, 'झ'], [/چھ/g, 'छ'],
    [/دھ/g, 'ध'], [/ڈھ/g, 'ढ'], [/کھ/g, 'ख'], [/گھ/g, 'घ'], [/ڑھ/g, 'ढ़'],
    [/کیا/g, 'क्या'], [/کیوں/g, 'क्यों'], [/ہے/g, 'है'], [/ہیں/g, 'हैं'], [/تھے/g, 'थे'],
    [/تھی/g, 'थी'], [/تھا/g, 'था'], [/مجھ/g, 'मुझ'], [/تجھ/g, 'तुझ'], [/کچھ/g, 'कुछ'],
    [/دلِ/g, 'दिल-ए'], [/ہوا/g, 'हुआ'], [/دوا/g, 'दवा'], [/ناداں/g, 'नादाँ'], [/تجھے/g, 'तुझे']
  ];
  let s = str;
  multiMap.sort((a, b) => b[0].source.length - a[0].source.length);
  multiMap.forEach(([re, rep]) => { s = s.replace(re, rep); });
  const singleMap = {
    'آ': 'आ', 'ا': 'ा', 'ب': 'ब', 'پ': 'प', 'ت': 'त', 'ٹ': 'ट', 'ث': 'स',
    'ج': 'ज', 'چ': 'च', 'ح': 'ह', 'خ': 'ख़', 'د': 'द', 'ڈ': 'ड', 'ذ': 'ज़',
    'ر': 'र', 'ڑ': 'ड़', 'ز': 'ज़', 'ژ': 'झ़', 'س': 'स', 'ش': 'श', 'ص': 'स',
    'ض': 'ज़', 'ط': 'त', 'ظ': 'ज़', 'ع': '', 'غ': 'ग़', 'ف': 'फ़', 'ق': 'क़',
    'ک': 'क', 'گ': 'ग', 'ل': 'ल', 'م': 'म', 'ن': 'न', 'ں': 'ँ', 'و': 'ो',
    'ہ': 'ह', 'ۂ': 'ह-ए', 'ھ': 'ह', 'ء': '', 'ی': 'ी', 'ے': 'े', 'ۓ': 'ए',
    'ِ': '-ए-', 'ُ': 'ु', 'َ': '',
    /* hamza on yeh / waw, tanwin, the Urdu comma, and the Arabic forms of yeh, alef maksura and kaf (Rekhta's Iqbal pages use them) */
    'ئ': 'ए', 'ؤ': 'ओ', 'ً': 'ं', '،': ',', 'ي': 'ी', 'ى': 'ा', 'ك': 'क', 'ٰ': 'ा'
  };
  let out = '';
  for(let i = 0; i < s.length; i++) {
    const ch = s[i];
    if(singleMap[ch] !== undefined) {
      if(ch === 'ا' && (i === 0 || /\s/.test(s[i - 1]))) out += 'अ';
      else out += singleMap[ch];
    } else {
      out += ch;
    }
  }
  return out;
}

function urduToRoman(str) {
  if(!str) return '';
  str = str.normalize('NFC');
  const multiMap = [
    [/بھ/g, 'bh'], [/پھ/g, 'ph'], [/تھ/g, 'th'], [/ٹھ/g, 'ṭh'], [/جھ/g, 'jh'], [/چھ/g, 'chh'],
    [/دھ/g, 'dh'], [/ڈھ/g, 'ḍh'], [/کھ/g, 'kh'], [/گھ/g, 'gh'], [/ڑھ/g, 'ṛh'],
    [/کیا/g, 'kyā'], [/کیوں/g, 'kyūñ'], [/ہے/g, 'hai'], [/ہیں/g, 'haiñ'], [/تھے/g, 'the'],
    [/تھی/g, 'thī'], [/تھا/g, 'thā'], [/مجھ/g, 'mujh'], [/تجھ/g, 'tujh'], [/کچھ/g, 'kuchh'],
    [/دلِ/g, 'dil-e'], [/ہوا/g, 'huʾā'], [/دوا/g, 'davā'], [/ناداں/g, 'nādāñ'], [/تجھے/g, 'tujhe']
  ];
  let s = str;
  multiMap.sort((a, b) => b[0].source.length - a[0].source.length);
  multiMap.forEach(([re, rep]) => { s = s.replace(re, rep); });
  const singleMap = {
    'آ': 'ā', 'ا': 'ā', 'ب': 'b', 'پ': 'p', 'ت': 't', 'ٹ': 'ṭ', 'ث': 'ṡ',
    'ج': 'j', 'چ': 'ch', 'ح': 'ḥ', 'خ': 'ḳh', 'د': 'd', 'ڈ': 'ḍ', 'ذ': 'ż',
    'ر': 'r', 'ڑ': 'ṛ', 'ز': 'z', 'ژ': 'zh', 'س': 's', 'ش': 'sh', 'ص': 'ṣ',
    'ض': 'ẓ', 'ط': 't̤', 'ظ': 'z̤', 'ع': 'ʿ', 'غ': 'ġh', 'ف': 'f', 'ق': 'q',
    'ک': 'k', 'گ': 'g', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ں': 'ñ', 'و': 'o',
    'ہ': 'h', 'ۂ': 'h-e', 'ھ': 'h', 'ء': 'ʾ', 'ی': 'ī', 'ے': 'e', 'ۓ': 'ʾe',
    'ِ': '-e', 'ُ': 'u', 'َ': 'a',
    'ئ': 'ʾ', 'ؤ': 'ʾ', 'ً': 'an', '،': ',', 'ي': 'ī', 'ى': 'ā', 'ك': 'k', 'ٰ': 'ā'
  };
  let out = '';
  for(let i = 0; i < s.length; i++) {
    const ch = s[i];
    if(singleMap[ch] !== undefined) {
      if(ch === 'ا' && (i === 0 || /\s/.test(s[i - 1]))) out += 'a';
      else out += singleMap[ch];
    } else {
      out += ch;
    }
  }
  return out;
}

function getLineDisplay(lineObj, script) {
  if(!lineObj) return '';
  const approxBadge = ' <span class="pill faint tiny" style="font-size:10.5px;padding:2px 6px;margin-inline-start:6px;vertical-align:middle;font-weight:normal;" title="Urdu script does not write short vowels; transliteration is approximate">approximate</span>';
  if(typeof lineObj === 'string') {
    const nk = normVerseKey(lineObj);
    if(KNOWN_VERSES[nk]) return getLineDisplay(KNOWN_VERSES[nk], script);
    if(script === 'ur') return lineObj;
    if(script === 'hi') return urduToDevanagari(lineObj) + approxBadge;
    if(script === 'ro') return urduToRoman(lineObj) + approxBadge;
    return lineObj;
  }
  const isNovelUr = lineObj.isApprox;
  if(script === 'ascii') return (lineObj.ascii || lineObj.ro || lineObj.ur || '') + (isNovelUr ? approxBadge : '');
  if(script === 'hi') return (lineObj.hi || urduToDevanagari(lineObj.ur) || lineObj.ascii || '') + (isNovelUr || (!lineObj.hi && lineObj.ur) ? approxBadge : '');
  if(script === 'ro') return (lineObj.ro || urduToRoman(lineObj.ur) || lineObj.ascii || '') + (isNovelUr || (!lineObj.ro && lineObj.ur) ? approxBadge : '');
  return lineObj.fa || lineObj.ur || lineObj.ascii || '';   // fa: the same Persian line in Iranian spelling (scripts/build_poets.py)
}
window.getLineDisplay = getLineDisplay;

function translitText(str, script) {
  if(!str) return '';
  if(!script || script === 'ur') return str;
  if(script === 'hi') return (typeof urduToDevanagari === 'function') ? urduToDevanagari(str) : str;
  if(script === 'ro') return (typeof urduToRoman === 'function') ? urduToRoman(str) : str;
  if(script === 'ascii') return (typeof romanToAscii === 'function') ? romanToAscii((typeof urduToRoman === 'function') ? urduToRoman(str) : str) : str;
  return str;
}
window.translitText = translitText;

