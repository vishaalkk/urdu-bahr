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
    .replace(/[āáâ]/g, 'aa')
    .replace(/[īíî]/g, 'ii')
    .replace(/[ūúû]/g, 'uu')
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
    } else if(matraMap[ch]) {   // after a nukta letter, already turned to ASCII above (ड़ी, ज़िं): the vowel sign still counts
      out += matraMap[ch];
    } else if(ch === '्') {
      /* a virama after a nukta letter: no vowel */
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
  buad: 'buvad', buwad: 'buvad',
  keh: 'kih', hua: 'hu))aa', kya: 'kyaa', dava: 'davaa', nadan: 'naadaa;n', nadaan: 'naadaa;n', naadaan: 'naadaa;n', dile: 'dil-e', aaxir: 'aa;xir', kahi: 'kahii;N', nahin: 'nahii;N', nahi: 'nahii;N', mein: 'me;N', main: 'mai;N', hai: 'hai', hain: 'hai;N', hun: 'huu;N', hoon: 'huu;N',
  kubra: 'kubr;aa', kubraa: 'kubr;aa', sughra: '.su;Gr;aa', sughraa: '.su;Gr;aa', uzma: '((u:zm;aa', uzmaa: '((u:zm;aa',
  musa: 'muus;aa', musaa: 'muus;aa', fatwa: 'fatv;aa', fatwaa: 'fatv;aa', taqwa: 'taqv;aa', taqwaa: 'taqv;aa',
  adna: 'adn;aa', adnaa: 'adn;aa', yahya: 'ya;hy;aa', yahyaa: 'ya;hy;aa', mujtaba: 'mujtab;aa', mujtabaa: 'mujtab;aa',
  murtaza: 'murta:z;aa', murtazaa: 'murta:z;aa',
  hum: 'ham', humein: 'hame;N', humne: 'ham ne', unko: 'un ko', inko: 'in ko', usko: 'us ko', isko: 'is ko',
  aake: 'aa ke', jaake: 'jaa ke', hoke: 'ho ke', karke: 'kar ke',
  gaye: 'ga))e', gayen: 'ga))ii;N', gayein: 'ga))ii;N', gayin: 'ga))ii;N', gayi: 'ga))ii', gayee: 'ga))ii',
  aaye: 'aa))e', aae: 'aa))e', aayi: 'aa))ii', aayee: 'aa))ii', aaii: 'aa))ii', aayein: 'aa))e;N', aayen: 'aa))e;N',
  laaye: 'laa))e', laae: 'laa))e', laayi: 'laa))ii', laayee: 'laa))ii', laayein: 'laa))e;N', laayen: 'laa))e;N',
  paaye: 'paa))e', paae: 'paa))e', paayi: 'paa))ii', paayee: 'paa))ii', paayein: 'paa))e;N', paayen: 'paa))e;N',
  khaaye: 'khaa))e', khaae: 'khaa))e', khaayi: 'khaa))ii', khaayee: 'khaa))ii', khaayein: 'khaa))e;N', khaayen: 'khaa))e;N',
  gaaye: 'gaa))e', gaae: 'gaa))e', gaayi: 'gaa))ii', gaayee: 'gaa))ii', gaayein: 'gaa))e;N', gaayen: 'gaa))e;N',
  roye: 'ro))e', royi: 'ro))ii', royee: 'ro))ii',
  dhoye: 'dho))e', dhoyi: 'dho))ii', dhoyee: 'dho))ii',
  soye: 'so))e', soyi: 'so))ii', soyee: 'so))ii',
  khoye: 'kho))e', khoyi: 'kho))ii', khoyee: 'kho))ii',
  boye: 'bo))e', boyi: 'bo))ii', boyee: 'bo))ii',
  huye: 'hu))e', huyi: 'hu))ii', huyee: 'hu))ii', huyein: 'huu))ii;N', huyen: 'huu))ii;N',   // hu))ii;N parses as ہئیں
  naye: 'na))e', nayi: 'na))ii', nayee: 'na))ii',
  chaaye: 'chaa))e', chaye: 'chaa))e',
  raaye: 'raa))e', raye: 'raa))e',
  jaaye: 'jaa))e', jaye: 'jaa))e',
  koyi: 'ko))ii', bhaayi: 'bhaa))ii',
  bataaye: 'bataa))e', bataye: 'bataa))e', bataayi: 'bataa))ii', batayi: 'bataa))ii', bataayee: 'bataa))ii',
  dikhaaye: 'dikhaa))e', dikhaye: 'dikhaa))e', dikhaayi: 'dikhaa))ii', dikhayi: 'dikhaa))ii', dikhaayee: 'dikhaa))ii',
  sunaaye: 'sunaa))e', sunaye: 'sunaa))e', sunaayi: 'sunaa))ii', sunayi: 'sunaa))ii', sunaayee: 'sunaa))ii',
  banaaye: 'banaa))e', banaye: 'banaa))e', banaayi: 'banaa))ii', banayi: 'banaa))ii', banaayee: 'banaa))ii',
  lagaaye: 'lagaa))e', lagaye: 'lagaa))e', lagaayi: 'lagaa))ii', lagayi: 'lagaa))ii', lagaayee: 'lagaa))ii',
  bulaye: 'bulaa))e', bulaaye: 'bulaa))e', bulayi: 'bulaa))ii', bulaayi: 'bulaa))ii', bulaayee: 'bulaa))ii',
  chalaye: 'chalaa))e', chalaaye: 'chalaa))e', chalayi: 'chalaa))ii', chalaayi: 'chalaa))ii',
  jalaye: 'jalaa))e', jalaaye: 'jalaa))e', jalayi: 'jalaa))ii', jalaayi: 'jalaa))ii',
  milaye: 'milaa))e', milaaye: 'milaa))e', milayi: 'milaa))ii', milaayi: 'milaa))ii',
  samaaye: 'samaa))e', samaye: 'samaa))e', samaayi: 'samaa))ii', samayi: 'samaa))ii',
  padi: 'pa;Rii', pada: 'pa;Raa', pade: 'pa;Re',
  badi: 'ba;Rii', bada: 'ba;Raa', bade: 'ba;Re', baDi: 'ba;Rii', baDa: 'ba;Raa', baDe: 'ba;Re',
  chhod: 'chho;R', chhoD: 'chho;R', chhoda: 'chho;Raa', chhoDa: 'chho;Raa', chhode: 'chho;Re', chhoDe: 'chho;Re', chhodi: 'chho;Rii', chhoDi: 'chho;Rii',
  ghadi: 'gha;Rii', ghaDi: 'gha;Rii',
  bichhad: 'bichha;R', bichhaD: 'bichha;R',
  daud: 'dau;R', dauda: 'dau;Raa', dauD: 'dau;R',
  chadh: 'cha;Rh', chadha: 'cha;Rhaa', chaDh: 'cha;Rh', chaDha: 'cha;Rhaa',
  badh: 'ba;Rh', badha: 'ba;Rhaa', baDh: 'ba;Rh', baDha: 'ba;Rhaa',
  ud: 'u;R', uda: 'u;Raa', uD: 'u;R', uDa: 'u;Raa',
  faida: 'faa))idah', faayda: 'faa))idah', faeda: 'faa))idah', fayda: 'faa))idah',
  harchand: 'har-chand',
  garchi: 'garchih', garche: 'garchih',
  jag: 'jag', jaag: 'jaag',
  baich: 'bech', daikh: 'dekh', bhaid: 'bhed', paish: 'pesh', pait: 'pe;t', paid: 'pe;R',
  ghat: 'gha;t', ghaat: 'ghaa;t' };
function casualKey(s, level) {   // level 0 strict (long vowels kept), 1 loose, 2 lax (also o~u, e~i): mirrors _casual_key in build_app.py
  s = s.normalize('NFC').toLowerCase().replace(/ć/g, 'ch').replace(/[āáâ]/g, 'aa').replace(/[īíî]/g, 'ii').replace(/[ūúû]/g, 'uu').replace(/ee/g, 'ii').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/;g/g, 'gh').replace(/;x/g, 'kh').replace(/[;.:()'’‘ʿʾ-]/g, '').replace(/oo/g, 'uu').replace(/w/g, 'v');
  if (level >= 1) s = s.replace(/aa/g, 'a').replace(/ii/g, 'i').replace(/uu/g, 'u');
  if (level >= 2) s = s.replace(/o/g, 'u').replace(/e/g, 'i');
  return level >= 1 ? s.replace(/(.)\1+/g, '$1') : s.replace(/([^aiu])\1+/g, '$1');
}
/* ROMAN_CASUAL_MAP[level]: casual key → the corpora's spelling, rebuilt from each spelling's frequency (ASCII_FREQ, in the order the
   build met them) by scripts/build_app.py's own rules: per key the most frequent spelling (on a tie, the first met); a strict
   (level 0) entry only when it is at least 10% of its loose group. tests/packed_data.js checks it against the build's digest. */
const ASCII_FREQ = /*@@ASCII_FREQ@@*/;
const ROMAN_CASUAL_DIGEST = /*@@ROMAN_CASUAL_DIGEST@@*/;
function buildCasualMap(freq) {
  const best = [{}, {}, {}], loose = {};
  Object.keys(freq).forEach(a => {
    const c = freq[a];
    for (let lv = 0; lv < 3; lv++) {
      const k = casualKey(a, lv), b = best[lv][k];
      if (!b || c > b[1]) best[lv][k] = [a, c];
      if (lv === 1) loose[k] = (loose[k] || 0) + c;
    }
  });
  const map = best.map(m => { const o = {}; for (const k in m) o[k] = m[k][0]; return o; });
  for (const k0 in best[0]) if (best[0][k0][1] < 0.1 * (loose[casualKey(best[0][k0][0], 1)] || 0)) delete map[0][k0];
  return map;
}
const ROMAN_CASUAL_MAP = buildCasualMap(ASCII_FREQ);
const CASUAL_SPECIAL = /[ḥṣẓżẕṡṭḍṛġḳʿʾñ;:()]|(?<=[a-zāīūñ])[TRDNH]/;   // spelled with marks (or already ASCII, or intentional medial/terminal capitals): the letter rules read these exactly
function casualLookup(plain, minLv, maxLv) {   // levels minLv..maxLv (default all three)
  if (typeof ROMAN_CASUAL_MAP === 'undefined') return null;
  for (let lv = minLv || 0; lv <= (maxLv == null ? 2 : maxLv); lv++) {
    const k = casualKey(plain, lv);
    if (Object.prototype.hasOwnProperty.call(ROMAN_CASUAL_MAP[lv], k)) return ROMAN_CASUAL_MAP[lv][k];
  }
  return null;
}
/* Hindustani Metaphone / phonetic key: normalizes multi-variant casual Roman
   (kareeb ~ qariib, khwaab ~ xwab ~ khvaab, phool ~ fool, shikwa ~ shikvah, etc.)
   lax: false preserves e and o, true folds e~i and o~u. */
function phoneticKey(s, lax) {
  if (!s) return '';
  var str = String(s).toLowerCase().normalize('NFC')
    .replace(/;x/g, 'kh').replace(/;g/g, 'gh').replace(/;n/g, 'n').replace(/;t/g, 't')
    .replace(/;d/g, 'd').replace(/;r/g, 'r').replace(/\.s/g, 's').replace(/\.z/g, 'z')
    .replace(/:z/g, 'z').replace(/:t/g, 't').replace(/;h/g, 'h').replace(/;s/g, 's').replace(/;z/g, 'z')
    .replace(/[āáâ]/g, 'a').replace(/[īíî]/g, 'i').replace(/[ūúû]/g, 'u').replace(/[ñṅṉ]/g, 'n')
    .replace(/[ṭt̤]/g, 't').replace(/[ḍ]/g, 'd').replace(/[ṛ]/g, 'r').replace(/[ṣṡs̱]/g, 's')
    .replace(/[żẕẓžz̤]/g, 'z').replace(/[ḥ]/g, 'h').replace(/[ḳ]/g, 'k').replace(/[ġ]/g, 'g')
    .replace(/[ʿʽ‘'ʾ’"`;.:()\-]/g, '');

  str = str.replace(/^(?:khw|xw|xv|khv)/, 'kh');
  str = str.replace(/w/g, 'v')
    .replace(/ph/g, 'f')
    .replace(/q/g, 'k')
    .replace(/x/g, 'kh')
    .replace(/chh/g, 'ch')
    .replace(/zh/g, 'z');

  str = str.replace(/oo|uu/g, 'u')
    .replace(/ee|ii/g, 'i')
    .replace(/aa/g, 'a')
    .replace(/ai|ay|ei|ey|ae/g, 'e')
    .replace(/au|aw/g, 'o');

  if (lax) {
    str = str.replace(/o/g, 'u').replace(/e/g, 'i');
  }

  str = str.replace(/ah$/, 'a').replace(/([b-df-hj-np-tv-z])h$/, '$1');
  str = str.replace(/(.)\1+/g, '$1');
  return str;
}
var _trPhoneticIndex = null;
function trPhoneticIndex() {
  if (_trPhoneticIndex) return _trPhoneticIndex;
  var strict = {}, lax = {};
  if (typeof ASCII_FREQ !== 'undefined') {
    Object.keys(ASCII_FREQ).forEach(function (asc) {
      var c = ASCII_FREQ[asc];
      var ks = phoneticKey(asc, false), kl = phoneticKey(asc, true);
      if (ks) { (strict[ks] || (strict[ks] = [])).push({ ascii: asc, count: c, tag: 'list' }); }
      if (kl) { (lax[kl] || (lax[kl] = [])).push({ ascii: asc, count: c, tag: 'loose' }); }
    });
  }
  if (typeof ROMAN_FALLBACK !== 'undefined') {
    Object.keys(ROMAN_FALLBACK).forEach(function (k1) {
      var asc = ROMAN_FALLBACK[k1];
      var ks = phoneticKey(asc, false), kl = phoneticKey(asc, true);
      if (ks && !(strict[ks] || []).some(function (x) { return x.ascii === asc; })) {
        (strict[ks] || (strict[ks] = [])).push({ ascii: asc, count: 1, tag: 'poets' });
      }
      if (kl && !(lax[kl] || []).some(function (x) { return x.ascii === asc; })) {
        (lax[kl] || (lax[kl] = [])).push({ ascii: asc, count: 1, tag: 'poets' });
      }
    });
  }
  Object.keys(strict).forEach(function (k) { strict[k].sort(function (a, b) { return b.count - a.count; }); });
  Object.keys(lax).forEach(function (k) { lax[k].sort(function (a, b) { return b.count - a.count; }); });
  _trPhoneticIndex = { strict: strict, lax: lax };
  return _trPhoneticIndex;
}
function trPhoneticHits(plain) {
  var idx = trPhoneticIndex();
  var ks = phoneticKey(plain, false);
  var hs = idx.strict[ks] || [];
  if (hs.length) return hs;
  var kl = phoneticKey(plain, true);
  return idx.lax[kl] || [];
}
/* Rekhta-style marks, for a word the lookup does not know: a capital in the middle of a word is retroflex (jhūTī ṭ, ulTī ṭ, baḌā ṛ);
   .e .ī after a vowel are a hamza (aa.e, jaa.e); .a .i .u are an ʿain (shā.ir, ma.asūm, va.ade); .h is ḥ (sub.h) */
function rekhtaMarks(piece) {
  let s = piece
    .replace(/(?<=[a-zāīūñ])Rh/g, ';rh').replace(/(?<=[a-zāīūñ])R/g, ';r').replace(/Ḍ|Ṛ/g, ';r')
    .replace(/(?<=[a-zāīūñ])Th/g, ';th').replace(/(?<=[a-zāīūñ])T/g, ';t')
    .replace(/(?<=[a-zāīūñ])Dh/g, ';dh').replace(/(?<=[a-zāīūñ])D(?!h)/g, ';d')
    .replace(/(?<=[a-zāīūñ])N/g, ';n')
    .replace(/(?<=[a-zāīūñ])H/g, ';h')
    .replace(/(?<=[a-zāīūñ])S/g, '.s')
    .replace(/(?<=[a-zāīūñ])Z/g, '.z')
    .replace(/\.h/g, ';h').replace(/\.(e|ī|ii|ai)/g, '))$1').replace(/\.([aiuāū])/g, '(($1');
  if (/(?:;[trd]h?|;n|\.[sz])[a-zāīūñ]*(?<![iī])i$/i.test(s)) s = s.replace(/i$/, 'ii');
  if (/(?:;[trd]h?|;n|\.[sz])[a-zāīūñ]*(?<![aā])a$/i.test(s)) s = s.replace(/a$/, 'aa');
  return s;
}
/* Neighbour rules (data/collocations.json, built by scripts/build_collocations.py): a typed word whose casual key stands for
   several words (rah / raah, ab / aab) is settled by the word before it (L1) or after it (R1). A rule answers with the strict
   casual key, which ROMAN_CASUAL_MAP[0] turns into the full spelling. null when no rule applies. */
function collocSpelling(key, prevWord, nextWord) {
  if (typeof COLLOCATIONS === 'undefined' || typeof ROMAN_CASUAL_MAP === 'undefined') return null;
  const nb = w => (w ? casualKey(w.split('-')[w === prevWord ? w.split('-').length - 1 : 0], 1) : '');
  const pk = nb(prevWord), nk = nb(nextWord);
  const label = (pk && nk && COLLOCATIONS.LR && COLLOCATIONS.LR[pk + '|' + key + '|' + nk]) ||
                (pk && COLLOCATIONS.L1 && COLLOCATIONS.L1[pk + ' ' + key]) ||
                (nk && COLLOCATIONS.R1 && COLLOCATIONS.R1[key + ' ' + nk]);
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
/* Urdu letters in Persian orthography: ہ ھ → ه, ے ۓ → ی, ں → ن, ۂ → هٔ */
function trUrToFa(ur) {
  return String(ur || '').replace(/ۂ/g, 'هٔ').replace(/[ہھ]/g, 'ه').replace(/[ےۓ]/g, 'ی').replace(/ں/g, 'ن');
}
function trUrSpelling(w) {
  return String(w || '').replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/[هۀة]/g, function (c) { return c === 'ه' ? 'ہ' : 'ۂ'; });
}
function trFaRo(ro, ur) {
  var s = String(ro || '').replace(/kH/g, 'ḳh').replace(/gH/g, 'ġh').replace(/zH/g, 'zh').replace(/\.h/g, 'ḥ');
  var ain = /ع/.test(ur || ''), ham = /[ئءؤ]/.test(ur || '');
  if (ain && !ham) return s.replace(/\./g, 'ʿ');
  if (ham && !ain) return s.replace(/\./g, 'ʾ');
  return s.replace(/\.(e|ī|ii|ai)/g, 'ʾ$1').replace(/\.([aiuāū])/g, 'ʿ$1');
}

var TR_FA_INDEX = null;
function trFaIndex() {
  if (TR_FA_INDEX) return TR_FA_INDEX;
  TR_FA_INDEX = { strict: {}, loose: {} };
  var lex = (typeof FA_LEXICON !== 'undefined' && FA_LEXICON) || {};
  Object.keys(lex).forEach(function (ur) {
    var e = lex[ur];
    if (!e || !e[0]) return;
    var ro = trFaRo(e[0], ur);
    var k0 = casualKey(ro, 0), k1 = casualKey(ro, 1);
    if (k0) (TR_FA_INDEX.strict[k0] || (TR_FA_INDEX.strict[k0] = [])).push({ ur: ur, ro: ro, hi: e[1] || '', n: e[2] || 0 });
    if (k1) (TR_FA_INDEX.loose[k1] || (TR_FA_INDEX.loose[k1] = [])).push({ ur: ur, ro: ro, hi: e[1] || '', n: e[2] || 0 });
  });
  Object.keys(TR_FA_INDEX.strict).forEach(function (k) { TR_FA_INDEX.strict[k].sort(function (a, b) { return b.n - a.n; }); });
  Object.keys(TR_FA_INDEX.loose).forEach(function (k) { TR_FA_INDEX.loose[k].sort(function (a, b) { return b.n - a.n; }); });
  return TR_FA_INDEX;
}
function trFaHits(plain) {
  var idx = trFaIndex();
  var k0 = casualKey(plain, 0), k1 = casualKey(plain, 1);
  var h0 = idx.strict[k0] || [];
  if (h0.length) return h0;
  return idx.loose[k1] || [];
}
function trFaHitsStrict(plain) {
  var idx = trFaIndex();
  var k0 = casualKey(plain, 0);
  return idx.strict[k0] || [];
}

var RO_FA_PREFIXES = [
  ['naa', 'نا', 'nā', 'ना'],
  ['na',  'نا', 'nā', 'ना'],
  ['be',  'بے', 'be', 'बे'],
  ['baa', 'با', 'bā', 'बा'],
  ['bah', 'بہ', 'bah', 'बह'],
  ['ba',  'بہ', 'ba', 'ब'],
  ['ham', 'ہم', 'ham', 'हम'],
  ['dar', 'در', 'dar', 'दर'],
  ['bar', 'بر', 'bar', 'बर']
];
var RO_FA_SUFFIXES = [
  ['ashan', 'شاں', 'ashān', 'शाँ'], ['ashaan', 'شاں', 'ashān', 'शाँ'],
  ['atan', 'تاں', 'atān', 'ताँ'], ['ataan', 'تاں', 'atān', 'ताँ'],
  ['aman', 'ماں', 'amān', 'माँ'], ['amaan', 'ماں', 'amān', 'माँ'],
  ['and', 'ند', 'and', 'न्द'], ['ast', 'ست', 'st', 'स्त'],
  ['ash', 'ش', 'ash', 'श'], ['at', 'ت', 'at', 'त'], ['am', 'م', 'am', 'म'],
  ['ha', 'ہا', 'hā', 'हा'], ['haa', 'ہا', 'hā', 'हा'],
  ['an', 'اں', 'ān', 'ाँ'], ['aan', 'اں', 'ān', 'ाँ'],
  ['id', 'ید', 'īd', 'ीद'], ['eed', 'ید', 'īd', 'ीद'],
  ['im', 'یم', 'īm', 'ीम'], ['eem', 'یم', 'īm', 'ीम'],
  ['ee', 'ئی', 'ī', 'ई'], ['ii', 'ئی', 'ī', 'ई'], ['i', 'ئی', 'ī', 'ई']
];

/* A dictionary's scholarly Roman (Platts, Steingass, the Persian list after trFaRo) → the ASCII scheme Pue's parsers read.
   One converter for all of them: scripts/build_roman_fallback.js reads Platts through it too. ur (optional): a final ہ/ه
   after short a is written -ah, as Pritchett does. */
function scholarRoToAscii(ro, ur) {
  if (!ro) return '';
  var s = String(ro).trim().toLowerCase()
    .replace(/k[̱_]h[̱_]|ḵẖ|k͟h/g, ';x').replace(/g[̱_]h[̱_]|g̱ẖ|g͟h/g, ';g')
    .replace(/ḳh|ḳ|ḵ/g, ';x').replace(/ġh|ġ/g, ';g')
    .replace(/ćh/g, 'chh').replace(/ć/g, 'ch')
    .replace(/ś|ṣh/g, 'sh').replace(/ṣ/g, '.s')
    .replace(/ż|ẕ/g, ';z').replace(/ẓ/g, '.z')
    .replace(/z̤/g, ':z').replace(/t̤/g, ':t').replace(/ṭ/g, ';t').replace(/ḍ/g, ';d').replace(/ṛ/g, ';r')
    .replace(/ḥ/g, ';h').replace(/s̱|ṡ/g, ';s')
    .replace(/[āáâ]/g, 'aa').replace(/[īíî]/g, 'ii').replace(/[ūúû]/g, 'uu')
    .replace(/[ñṅṉ]|n̐/g, ';n')
    .replace(/[ʻ‘ʿ]/g, '((').replace(/[ʼ’ʾ']/g, '))')
    .replace(/w/g, 'v');
  if (ur && /[ہه]$/.test(ur) && /a$/.test(s)) s = s.slice(0, -1) + 'ah';
  return s;
}

/* an ASCII-scheme string in the three scripts (Pue's parsers); '' for a script whose parser is missing or fails */
function asciiToScripts(asc) {
  var out = { ur: '', hi: '', ro: '' };
  [['ur', 'p_ur'], ['hi', 'p_hi'], ['ro', 'p_di']].forEach(function (pair) {
    try {
      var obj = (typeof window !== 'undefined' && window[pair[1]]) || (typeof globalThis !== 'undefined' && globalThis[pair[1]]);
      if (obj && typeof obj.parse === 'function') out[pair[0]] = obj.parse(asc);
    } catch (e) {}
  });
  return out;
}

function resolveFaStem(core) {
  if (!core || core.length < 2) return null;
  var hits = trFaHits(core);
  if (hits.length) {
    var ascHits = scholarRoToAscii(hits[0].ro, hits[0].ur);
    return { ur: hits[0].ur, ro: hits[0].ro, hi: hits[0].hi || '', stem: hits[0].ro, ascii: ascHits };
  }
  for (var lv = 0; lv <= 2; lv++) {
    var cas = casualLookup(core, lv, lv);
    if (cas) {
      var p = asciiToScripts(cas);
      return { ur: p.ur || cas, ro: p.ro || core, hi: p.hi || '', stem: p.ro || cas, ascii: cas };
    }
  }
  var normCore = core.replace(/([āa])y([iq])/g, '$1i$2').replace(/yi/g, 'i');
  if (normCore !== core) {
    for (var lv2 = 0; lv2 <= 2; lv2++) {
      var cas2 = casualLookup(normCore, lv2, lv2);
      if (cas2) {
        var p2 = asciiToScripts(cas2);
        return { ur: p2.ur || cas2, ro: p2.ro || core, hi: p2.hi || '', stem: p2.ro || cas2, ascii: cas2 };
      }
    }
  }
  var fb = rekhtaFallback(core);
  if (fb) {
    var p3 = asciiToScripts(fb);
    return { ur: p3.ur || fb, ro: p3.ro || core, hi: p3.hi || '', stem: p3.ro || fb, ascii: fb };
  }
  return null;
}

/* One Persian prefix / stem / suffix split → its Urdu, Fārsī (plain and ZWNJ), Roman, Devanagari and ASCII. pfx, sfx: rows of
   RO_FA_PREFIXES / RO_FA_SUFFIXES or null. lāʾiq is written لایق in Fārsī. */
function faAffix(pfx, st, stemStr, sfx) {
  var laiq = /l[aā]+[yi]*q/i.test(stemStr), faStem = laiq ? 'لایق' : trUrToFa(st.ur);
  var pUr = pfx ? pfx[1] : '', pFa = trUrToFa(pUr), pAsc = !pfx ? '' : (pfx[0] === 'na' || pfx[0] === 'naa') ? 'naa' : pfx[0];
  var stemAsc = laiq ? 'laa))iq' : (st.ascii || st.stem), r = { stem: st.ro, stemUr: st.ur };
  if (pfx) { r.pfx = pfx[2]; r.pfxUr = pUr; }
  if (!sfx) {
    r.ur = pUr + st.ur; r.fa = pFa + faStem; r.zwnj = pFa + '‌' + faStem;
    r.ro = pfx[2] + '-' + st.ro; r.hi = pfx[3] + '-' + st.hi; r.morph = pfx[2] + ' + ' + st.ro; r.ascii = pAsc + stemAsc;
    return r;
  }
  /* the suffix's Urdu, Fārsī and ZWNJ forms and ASCII: -ī after a silent h or a vowel takes hamza, -am after h a joiner */
  var isI = /^(i|ii|ee)$/.test(sfx[0]), isHeh = /[ہه]$/.test(st.ur), u, f, z, a;
  if (isI && isHeh) { u = '‌ئی'; f = z = '‌ای'; a = '-ii'; }
  else if (isI && /[آاو]$/.test(st.ur)) { u = f = 'ئی'; z = '‌ئی'; a = '))ii'; }
  else if (isI) { u = f = 'ی'; z = '‌ی'; a = 'ii'; }
  else if (sfx[0] === 'am') { if (isHeh) { u = f = z = '‌ام'; a = '-am'; } else { u = f = 'م'; z = '‌ام'; a = 'am'; } }
  else { u = sfx[1]; f = trUrToFa(sfx[1]); z = '‌' + f; a = sfx[0]; }
  var pRo = pfx ? pfx[2] + '-' : '';
  r.ur = pUr + st.ur + u; r.fa = pFa + faStem + f; r.zwnj = pFa + faStem + z;
  r.ro = pRo + st.ro + '-' + sfx[2]; r.roFa = pRo + (laiq ? 'lāyiq' : st.ro) + '-' + sfx[2];
  r.hi = pfx ? pfx[3] + '-' + st.hi + '-' + sfx[3] : (st.hi ? st.hi + '-' + sfx[3] : '');
  r.sfx = sfx[2]; r.morph = pRo.replace('-', ' + ') + st.ro + ' + ' + sfx[2]; r.ascii = pAsc + stemAsc + a;
  return r;
}

/* A Persian word typed in Roman as prefix + stem + suffix (naalaaiqam), prefix + stem (naadaan) or stem + suffix (dilam,
   farmuda-i), the stem found by resolveFaStem */
function tryFaDecompose(plain) {
  if (!plain || plain.length < 3) return null;
  if (/(?:^|[-_])(?:e|ye|o)(?:[-_]|$)/i.test(plain)) return null;
  var raw = plain.toLowerCase().replace(/[-_]/g, ''), st, stem, i, j, pfx, sfx;
  for (i = 0; i < RO_FA_PREFIXES.length; i++) {
    pfx = RO_FA_PREFIXES[i];
    if (raw.length <= pfx[0].length + 3 || raw.indexOf(pfx[0]) !== 0) continue;
    var rem = raw.slice(pfx[0].length);
    for (j = 0; j < RO_FA_SUFFIXES.length; j++) {
      sfx = RO_FA_SUFFIXES[j];
      if (rem.length <= sfx[0].length + 2 || rem.slice(-sfx[0].length) !== sfx[0]) continue;
      stem = rem.slice(0, -sfx[0].length);
      if ((st = resolveFaStem(stem))) return faAffix(pfx, st, stem, sfx);
    }
    if (rem.length >= 2 && (st = resolveFaStem(rem))) return faAffix(pfx, st, rem, null);
  }
  for (j = 0; j < RO_FA_SUFFIXES.length; j++) {
    sfx = RO_FA_SUFFIXES[j];
    if (raw.length <= sfx[0].length + 2 || raw.slice(-sfx[0].length) !== sfx[0]) continue;
    stem = raw.slice(0, -sfx[0].length);
    if (sfx[0] === 'at' && stem.length < 4 && !plain.includes('-')) continue;
    if ((st = resolveFaStem(stem))) return faAffix(null, st, stem, sfx);
  }
  return null;
}

/* a stem as typed ('a' alone is no stem). Retroflex ṛ is not guessed from r (mur- may be muṛ- or mur-, as in murjhānā): Transcribe
   gets it from the dictionary (DICT_STORE.formsFor) */
function stemClean(s) { return !s || s === 'a' ? '' : s; }

/* Urdu inflectional morphology: productive verbal future/subjunctive/imperative & plural noun forms */
function tryUrMorphDecompose(plain) {
  if (!plain || plain.length < 3) return null;
  const s = plain.toLowerCase().replace(/[-_]/g, '');

  // 1. Feminine plural nouns in -ā'eñ / -ā'oñ (duayein, hawayein, sadayein, adayein, duaoon, hawaon)
  let m = s.match(/^(du|hav|sad|ad|vaf|dav)(?:a|aa)(?:y|)(?:e|ee|ei)n$/);
  if (m) {
    const rootMap = { du: 'du((aa))e;N', hav: 'havaa))e;N', sad: 'sadaa))e;N', ad: 'adaa))e;N', vaf: 'vafaa))e;N', dav: 'davaa))e;N' };
    return { ascii: rootMap[m[1]], stem: m[1] + 'aa', sfx: '-eñ', morph: m[1] + 'aa + plural', listed: true };
  }
  m = s.match(/^(du|hav|sad|ad|vaf|dav)(?:a|aa)(?:y|)(?:oo|uu|u)n$/);
  if (m) {
    const rootMap = { du: 'du((aa))o;N', hav: 'havaa))o;N', sad: 'sadaa))o;N', ad: 'adaa))o;N', vaf: 'vafaa))o;N', dav: 'davaa))o;N' };
    return { ascii: rootMap[m[1]], stem: m[1] + 'aa', sfx: '-oñ', morph: m[1] + 'aa + oblique plural', listed: true };
  }

  // 2. Vowel-stem future 1st person: basaaungaa, sajaaoonga, chhuraaoonga, banaaunga, aaungaa, etc.
  m = s.match(/^([a-zāīū]*?)(?:a|aa)(?:oo|uu|u)ng(a|aa|i|ii)$/);
  if (m) {
    const isF = m[2].startsWith('i');
    const stem = stemClean(m[1]);
    const spaceAsc = (stem ? (stem + 'aa') : 'aa') + '))uu;N ' + (isF ? 'gii' : 'gaa');
    return { ascii: spaceAsc, stem: stem ? (stem + 'aa') : 'aa', sfx: isF ? '-ūṅgī' : '-ūṅgā', morph: (stem ? (stem + 'ā') : 'ā') + (isF ? ' + -ūṅgī' : ' + -ūṅgā') };
  }

  // 3. Vowel-stem future 2nd/3rd plural / polite: basaayenge, basaaenge, aayenge, jaayenge
  m = s.match(/^([a-zāīū]*?)(?:a|aa)(?:y|)(?:e|ee)ng(e|ee|i|ii|ay)$/);
  if (m) {
    const isF = m[2].startsWith('i');
    const stem = stemClean(m[1]);
    const spaceAsc = (stem ? (stem + 'aa') : 'aa') + '))e;N ' + (isF ? 'gii' : 'ge');
    return { ascii: spaceAsc, stem: stem ? (stem + 'aa') : 'aa', sfx: isF ? '-eṅgī' : '-eṅge', morph: (stem ? (stem + 'ā') : 'ā') + (isF ? ' + -eṅgī' : ' + -eṅge') };
  }

  // 4. Vowel-stem future 2nd/3rd singular: basaayega, aayega, jaayega, khaayega
  m = s.match(/^([a-zāīū]*?)(?:a|aa)(?:y|)(?:e|ee)g(a|aa|i|ii)$/);
  if (m) {
    const isF = m[2].startsWith('i');
    const stem = stemClean(m[1]);
    const spaceAsc = (stem ? (stem + 'aa') : 'aa') + '))e ' + (isF ? 'gii' : 'gaa');
    return { ascii: spaceAsc, stem: stem ? (stem + 'aa') : 'aa', sfx: isF ? '-egī' : '-egā', morph: (stem ? (stem + 'ā') : 'ā') + (isF ? ' + -egī' : ' + -egā') };
  }

  // 5. Vowel-stem subjunctive 1st person: basaaoon, basaaun, sajaaoon, banaaoon, aaun, jaaoon
  m = s.match(/^([a-zāīū]*?)(?:a|aa)(?:oo|uu|u)n$/);
  if (m && !/(?:qanoon|joon|noon|khoon|funoon|haroon|mamnoon)/.test(s)) {
    const stem = stemClean(m[1]);
    return { ascii: (stem ? (stem + 'aa') : 'aa') + '))uu;N', stem: stem ? (stem + 'aa') : 'aa', sfx: '-ūṅ', morph: (stem ? (stem + 'ā') : 'ā') + ' + -ūṅ' };
  }

  // 6. Vowel-stem subjunctive plural / polite: basaayein, basaaen, aaein, jaayein
  m = s.match(/^([a-zāīū]*?)(?:a|aa)(?:y|)(?:e|ee|ei)n$/);
  if (m) {
    const stem = stemClean(m[1]);
    return { ascii: (stem ? (stem + 'aa') : 'aa') + '))e;N', stem: stem ? (stem + 'aa') : 'aa', sfx: '-eñ', morph: (stem ? (stem + 'ā') : 'ā') + ' + -eñ' };
  }

  // 6b. Vowel-stem past plural: -aaye / -aye (basaaye, dikhaaye, sunaaye, banaaye, etc.)
  m = s.match(/^([a-zāīū]+?)(?:a|aa)y(?:e|ee)$/);
  if (m) {
    const stem = stemClean(m[1]);
    return { ascii: (stem ? (stem + 'aa') : 'aa') + '))e', stem: stem ? (stem + 'aa') : 'aa', sfx: '-e', morph: (stem ? (stem + 'ā') : 'ā') + ' + past pl' };
  }

  // 6c. Vowel-stem past feminine: -aayi / -ayi (basaayi, dikhaayi, sunaayi, banaayi, etc.)
  m = s.match(/^([a-zāīū]+?)(?:a|aa)y(?:i|ii|ee)$/);
  if (m) {
    const stem = stemClean(m[1]);
    return { ascii: (stem ? (stem + 'aa') : 'aa') + '))ii', stem: stem ? (stem + 'aa') : 'aa', sfx: '-ī', morph: (stem ? (stem + 'ā') : 'ā') + ' + past fem' };
  }

  // 7. Polite Imperatives: aaiye, jaaiye, bataaiye, aaiyega, jaaiyega
  m = s.match(/^([a-zāīū]*?)(?:a|aa)(?:y|)(?:i|ee)ye(?:h|)(g(?:a|aa)|)$/);
  if (m) {
    const stem = stemClean(m[1]);
    const gPfx = m[2] ? ' gaa' : '';
    return { ascii: (stem ? (stem + 'aa') : 'aa') + '))iye' + gPfx, stem: stem ? (stem + 'aa') : 'aa', sfx: m[2] ? '-iyegā' : '-iye', morph: (stem ? (stem + 'ā') : 'ā') + (m[2] ? ' + -iyegā' : ' + -iye') };
  }

  // 8. Vowel-stem verbs in -o- / -u-: so-oonga, soonga, ro-oonga, roonga, dho-oonga, dhoonga, so-yega, ro-yega
  m = s.match(/^(dh|s|r|chh)(?:o|oo|u)(?:o|oo|uu|u|)ng(a|aa|i|ii)$/);
  if (m) {
    const isF = m[2].startsWith('i');
    const stem = m[1] === 'chh' ? 'chhu;' : m[1];
    const spaceAsc = stem + 'o))uu;N ' + (isF ? 'gii' : 'gaa');
    return { ascii: spaceAsc, stem: stem + 'o', sfx: isF ? '-ūṅgī' : '-ūṅgā', morph: stem + 'o + future' };
  }
  m = s.match(/^(dh|s|r|chh)(?:o|oo)(?:y|)(?:e|ee)g(a|aa|i|ii)$/);
  if (m) {
    const isF = m[2].startsWith('i');
    const stem = m[1] === 'chh' ? 'chhu;' : m[1];
    return { ascii: stem + 'o))e ' + (isF ? 'gii' : 'gaa'), stem: stem + 'o', sfx: isF ? '-egī' : '-egā', morph: stem + 'o + future 3sg' };
  }

  // 9. Consonant-stem future: dekhoonga, boloonga, rokoonga, chhoroonga, bhejoonga
  m = s.match(/^([a-zāīū]+?)(?:oo|uu|u)ng(a|aa|i|ii)$/);
  if (m && !m[1].endsWith('a')) {
    const isF = m[2].startsWith('i');
    const stem = stemClean(m[1]);
    const spaceAsc = stem + 'uu;N ' + (isF ? 'gii' : 'gaa');
    return { ascii: spaceAsc, stem: stem, sfx: isF ? '-ūṅgī' : '-ūṅgā', morph: stem + (isF ? ' + -ūṅgī' : ' + -ūṅgā') };
  }


  // 10. Honorific imperatives: kijiye, kijiyega, dijiye, dijiyega, lijiye, lijiyega
  m = s.match(/^(k|d|l)(?:i|ee)j(?:i|ee)ye(?:h|)(g(?:a|aa)|)$/);
  if (m) {
    const rMap = { k: 'kiijiye', d: 'diijiye', l: 'liijiye' };
    const gPfx = m[2] ? ' gaa' : '';
    return { ascii: rMap[m[1]] + gPfx, stem: m[1], sfx: m[2] ? '-iyegā' : '-iye', morph: rMap[m[1]] + (m[2] ? ' gaa' : '') };
  }

  // 11. High-frequency regular oblique plural nouns in -on / -oñ: kitabon, doston, etc.
  const OBL_NOUN_MAP = {
    kitabon: 'kitaabo;N', kitaabon: 'kitaabo;N', doston: 'dosto;N',
    raaton: 'raato;N', raton: 'raato;N', baaton: 'baato;N', baton: 'baato;N',
    aankhon: 'aankho;N', ankhon: 'aankho;N', dilon: 'dilo;N', gharon: 'gharo;N',
    shehron: 'shahro;N', shahron: 'shahro;N', khwabon: ';xvaabo;N', khwaabon: ';xvaabo;N',
    gulon: 'gulo;N', shamon: 'shaamo;N', shaamon: 'shaamo;N', ashkon: 'ashko;N'
  };
  if (OBL_NOUN_MAP[s]) {
    return { ascii: OBL_NOUN_MAP[s], stem: s.replace(/oñ?$/, ''), sfx: '-oñ', morph: s + ' (oblique plural)', listed: true };
  }

  return null;
}

/* One typed piece (a word, or one side of a hyphen) → {s, tier}: the ASCII-scheme spelling and which list answered, in the order
   tried. tier: conn (e / ye / o joining a compound), typed (already marked, or one letter: the letter rules read it exactly),
   known (Pritchett's lists, a neighbour rule, an alias), poets (the Rekhta poets' list), loose (her laxest match), persian (a
   Persian prefix/suffix split), derived (an Urdu inflection rule, tryUrMorphDecompose: no list confirms it), guess (no list: the
   letter rules). casualRomanLine takes .s; the Transcribe view (src/js/24-transcribe.js) also shows .tier. */
function casualPiece(piece, i, tokHasHyphen, prev, next) {
  const plain = piece.toLowerCase().replace(/[āáâ]/g, 'ā').replace(/[īíî]/g, 'ī').replace(/[ūúû]/g, 'ū');
  if (i > 0 && (plain === 'e' || plain === 'ye' || plain === 'o')) return { s: piece, tier: 'conn' };
  if (tokHasHyphen && i === 0) {
    if (plain === 'na' || plain === 'naa') return { s: 'naa', tier: 'known' };
    if (plain === 'bah') return { s: 'bah', tier: 'known' };
    if (plain === 'baa' || plain === 'bā') return { s: 'baa', tier: 'known' };
  }
  if (tokHasHyphen && i > 0) {
    if (plain === 'am' || plain === 'at' || plain === 'ash') return { s: plain, tier: 'persian' };
    if (plain === 'ee' || plain === 'ii' || plain === 'i') return { s: 'ii', tier: 'persian' };
    if (plain === 'im' || plain === 'eem') return { s: 'im', tier: 'persian' };
    if (plain === 'id' || plain === 'eed') return { s: 'id', tier: 'persian' };
    if (plain === 'and' || plain === 'ast') return { s: plain, tier: 'persian' };
  }
  const cleanApos = piece.toLowerCase().replace(/['’]/g, '');
  if (cleanApos === 'buad' || cleanApos === 'buwad') return { s: 'buvad', tier: 'known' };
  if (CASUAL_ALIAS[piece] || CASUAL_ALIAS[plain]) return { s: CASUAL_ALIAS[piece] || CASUAL_ALIAS[plain], tier: 'known' };
  if (plain.length < 2 || !/^[a-zāīū.]+$/.test(plain) || CASUAL_SPECIAL.test(piece)) return { s: rekhtaMarks(piece), tier: 'typed' };
  if (!tokHasHyphen) {   // hyphenated compounds keep their own pieces
    const c = collocSpelling(casualKey(plain, 1), prev, next);
    if (c) return { s: c, tier: 'known' };
  }
  if (plain === 'ki') {   // کہ (that) or کی (of): line-initial (!prev) or after clause conjunctions / speech verbs is always کہ (kih);
    // otherwise the next word decides where the corpora know it (KI_NEXT); کی is the commoner reading overall
    if (!prev) return { s: 'kih', tier: 'known' };
    const pk = (prev || '').toLowerCase().replace(/[^a-z]/g, '');
    if (pk === 'jab' || pk === 'tab' || pk === 'ab' || pk === 'ta' || pk === 'balke' || pk === 'chunki' ||
        pk === 'kaha' || pk === 'dekha' || pk === 'socha' || pk === 'samjha' || pk === 'chaha') return { s: 'kih', tier: 'known' };
    const n = (typeof KI_NEXT !== 'undefined' && KI_NEXT[casualKey(next.split('-')[0], 1)]) || null;
    return { s: n ? (n[1] > 2 * n[0] ? 'kii' : 'kih') : 'kii', tier: 'known' };
  }
  if (CASUAL_ALIAS[plain]) return { s: CASUAL_ALIAS[plain], tier: 'known' };
  /* Pritchett's strict and loose matches, then the poets' verified word list, and only then her laxest match (o~u, e~i), which
     otherwise hijacks khud as khod (کھود) */
  let h;
  if ((h = casualLookup(plain, 0, 1))) return { s: h, tier: 'known' };
  if (plain.includes('eh')) {
    const ah = plain.replace(/e(?=h)/g, 'a');
    if ((h = casualLookup(ah, 0, 1))) return { s: h, tier: 'known' };
    if ((h = rekhtaFallback(ah))) return { s: h, tier: 'poets' };
    if ((h = casualLookup(ah, 2, 2))) return { s: h, tier: 'loose' };
  }
  if ((h = rekhtaFallback(plain))) return { s: h, tier: 'poets' };
  if ((h = casualLookup(plain, 2, 2))) return { s: h, tier: 'loose' };
  var faDec = (typeof tryFaDecompose === 'function') ? tryFaDecompose(plain) : null;
  if (faDec && faDec.ascii) return { s: faDec.ascii, tier: 'persian' };

  var urDec = (typeof tryUrMorphDecompose === 'function') ? tryUrMorphDecompose(plain) : null;
  if (urDec && urDec.ascii) return { s: urDec.ascii, tier: 'derived', urDec: urDec };

  return { s: rekhtaMarks(piece), tier: 'guess' };
}
function casualRomanLine(line) {
  const toks = line.split(/(\s+)/), words = toks.filter(t => t && !/^\s+$/.test(t));
  let wi = 0;
  const out = toks.map(tok => {
    if (!tok || /^\s+$/.test(tok)) return tok;
    const next = words[++wi] || '', prev = words[wi - 2] || '';
    tok = tok.replace(/^['’‘]+|['’‘]+$/g, '');   // a quoted takhallus: 'dāġh'
    const hyph = tok.includes('-');
    if (hyph) {
      const faWhole = (typeof tryFaDecompose === 'function') ? tryFaDecompose(tok) : null;
      if (faWhole && faWhole.sfx && faWhole.ascii) return faWhole.ascii;
    }
    return tok.split('-').map((piece, i) => casualPiece(piece, i, hyph, prev, next).s).join('-');
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
       .replace(/[āáâ]/g, 'aa')
       .replace(/[īíî]/g, 'ii')
       .replace(/[ūúû]/g, 'uu')
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
       .replace(/u([aā])/g, 'u))$1')
       .replace(/aa(?!\)\))(?=[ieo])/g, 'aa))');
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
/* how common a meter is in Persian, to break a tie between equally good fits: Ganjoor's verse count for it (PERSIAN_METERS,
   data/persian_meters.json, summed over the Ganjoor meters that are this Urdu meter). The rubāʿī's 24 patterns are not in that
   list; they rank with the middle of it. */
let _faMeterVerses = null;
function getFaMeterPopularity(id) {
  if (!_faMeterVerses) {
    let list = null;
    try { list = PERSIAN_METERS; } catch (e) { /* declared in a later file (17c-circles.js): not yet, in a partial load */ }
    if (!Array.isArray(list)) return String(id).startsWith('R') ? 60000 : 0;   // not cached: asked again once it exists
    _faMeterVerses = {};
    list.forEach(m => {
      (m.urdu || []).forEach(u => { _faMeterVerses[u] = (_faMeterVerses[u] || 0) + (m.verses || 0); });
      _faMeterVerses['F' + m.gid] = m.verses || 0;
    });
  }
  const s = String(id);
  return s.startsWith('R') ? 60000 : (_faMeterVerses[s] || 0);
}
const FA_PREVERB = /(^|[\s\u200c])(بر|در|فرا|فرو|باز|پیش)(?=(آمد|آید|آورد|افشان|انداز|انداخت|افروز|افروخت|افکن|افگن|افت|اوفت|انگیز|انگیخت|افراز|افراشت|اندیش|ایست|نگذر|نگرد|ندار|نرو|نبین|نشنو|نمان|نرس|نگوی|نخواه|گذر|گذشت|گشای|گشود|خورد|خوان|شنو|پذیر|گرد|گشت))/g;
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
    .replace(/(^|[\s\u200c])کارام(?=$|[\s\u200c])/g, '$1کہ آرام')
    .replace(/(^|[\s\u200c])(چونکه|چونکہ|چونک)(?=$|[\s\u200c])/g, '$1چوں کہ')
    .replace(/(^|[\s\u200c])(زانکه|زانکہ|زانک)(?=$|[\s\u200c])/g, '$1از آں کہ')
    .replace(/(^|[\s\u200c])یکدیگرند(?=$|[\s\u200c])/g, '$1یک دیگرند')
    .replace(/(^|[\s\u200c])یکدیگر(?=$|[\s\u200c])/g, '$1یک دیگر')
    .replace(/ذوال/g, 'ذو ال')
    .replace(/([^\s\u200c])آ/g, (m, c, at, str) => {
      const w = (str.slice(0, at + m.length).match(/\S+$/) || [''])[0];
      return /^(مرآ|قرآ|مآ)/.test(w) ? m : c + ' آ';
    })
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
    if (f.meter && f.meter.id === 'H') return;
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
  const nonHindi = [...best.values()].filter(f => f.meter.id !== 'H');
  return nonHindi.sort((a, b) => {
    const diff = a.c - b.c;
    if (Math.abs(diff) > 0.05) return diff;
    const popA = getFaMeterPopularity(a.meter.id);
    const popB = getFaMeterPopularity(b.meter.id);
    return (popB - popA) || diff;
  });
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


/* Which language a line is: Iranian letters (ي ك ۀ, final ه) say Persian outright; otherwise each word's log-odds of Persian
   over Urdu (LANG_WORDS, data/lang_words.json, mined by scripts/build_lang_words.js from the line languages of the shipped
   collections) is summed, from the two languages' share of lines; Persian above a margin. Scored by tests/benchmark_lang.js. */
const LANG_WORDS = /*@@LANG_WORDS@@*/;
function detectScanLang(text) {
  const t = String(text || '');
  if (/[يكۀ]|هٔ|ه(?=$|[\s،۔])/.test(t)) return 'fa';   // (not the ZWNJ: Rekhta's Urdu uses it too, شعلہ‌رو)
  const roman = /[a-zA-Z]/.test(t), table = (LANG_WORDS && LANG_WORDS[roman ? 'ro' : 'ur']) || {};
  const toks = roman ? t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[ʿʾ’'‘.]/g, '').split(/[^a-z]+/)
    : t.normalize('NFC').replace(/[\u064B-\u065F\u0670\u0640]/g, '').split(/[\s،۔؟!]+/);
  let score = (LANG_WORDS && LANG_WORDS.prior) || 0;
  new Set(toks.filter(Boolean)).forEach(w => { if (table[w]) score += table[w]; });
  return score > (roman ? 2.5 : 4) ? 'fa' : 'ur';   // margins set on the mining half (Urdu kept at 99.8%+): reading Urdu as Persian respells it, so the doubt goes to Urdu
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
/* The Persian plural -hā on a word ending in a silent h is a word of its own for the scanner: Pue's parser writes Pritchett's
   naalah'haa-e as نالہہائے, which the engine reads nā-lah-hā-e (= = = -), where the verse says nā-la-hā-e (= - = -), as
   Urdu prints it (نالہ ہائے). Scan text only: the stored and displayed Urdu is left as it is. */
function urPluralHa(s) { return String(s || '').replace(/ہہا(?=$|[\s،۔؟!]|ئے|ے|ں|ی)/g, 'ہ ہا'); }
window.urPluralHa = urPluralHa;
function lineScanText(lineObj) {
  if (!lineObj) return '';
  if (lineObj._sc === undefined) lineObj._sc = urPluralHa(!lineObj.rk || !lineObj.ro ? lineObj.ur || '' : rekhtaScanText(lineObj.ur || '', lineObj.ro));
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
    [/دلِ/g, 'दिल-ए'], [/ہوا/g, 'हुआ'], [/دوا/g, 'दवा'], [/ناداں/g, 'नादाँ'], [/تجھے/g, 'तुझे'],
    [/[یى]ٰ/g, 'ा']
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
    [/دلِ/g, 'dil-e'], [/ہوا/g, 'huʾā'], [/دوا/g, 'davā'], [/ناداں/g, 'nādāñ'], [/تجھے/g, 'tujhe'],
    [/[یى]ٰ/g, 'ā']
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

