/* ================= TRANSLITERATOR (#/lab/transcribe) =================
   A whole text between Roman (casual or with Pritchett's diacritics), Urdu script, Fārsī script and Devanagari, in any
   direction: line for line, word by word, no scansion and no couplets. It runs the same pipeline Scan does for a typed line (romanToAscii, then Pue's parsers
   p_di / p_ur / p_hi), so a word comes out as it does in Scan. What it adds is the review:
     - every Roman word is tiered by where its spelling came from (the order casualRomanLine tries):
         known   Pritchett's word list (strict / loose key), a neighbour rule or an alias
         poets   the Rekhta poets' verified list (ROMAN_FALLBACK)
         persian the Persian list (FA_LEXICON, Sufinama's spellings), tried for words the Urdu lists do not have
         loose   Pritchett's laxest match (o~u, e~i): often right, worth a look
         derived built by an inflection rule (gaye, sunāʾeñ, dekhūñgā), not found in any list: worth a look
         form    a regular form of a Platts word (uṭhāʾe, laṛkiyāñ, paṛhūñgā): what derived and guess become once the dictionary loads
         guess   no list knows it: the letter rules read it, short vowels are a guess
         typed   already carries marks (ʿ ā ḥ …) or is a single letter: read exactly as written
     - a tap on a word opens its alternatives; a choice is kept per spelling and applies everywhere that spelling occurs.
   Pure logic (trBuild / trText) is unit-tested in tests/transcribe_logic.js. The DOM part is guarded. */

var TR_LEAD = /^["“”‘’'«»\[{<—–…¿¡]+/;
var TR_TRAIL = /[.,;:!?"“”‘’'«»\]}>—–…،۔؟؛]+$/;
var TR_LETTER = /[a-zāīūñḍṭṛḥṣẓżḳġʿʾ]/i;
var TR_SEVERITY = { guess: 4, loose: 3, derived: 3, persian: 2, form: 2, you: 1 };
var TR_SCRIPTS = [['ro', 'Roman'], ['ur', 'اردو'], ['fa', 'فارسی'], ['hi', 'हिन्दी']];

/* ---- script helpers ---- */

/* ascii → {ro, hi, ur}: Scan's own helper (19-scan.js) */

/* Persian morphological decomposition and lexicon helpers (trUrToFa, trFaHits, tryFaDecompose)
   are defined in 05-translit-helpers.js so Scan and Transcribe share the exact same pipeline. */

/* a piece worth a second look: a word, not a joiner, punctuation or Devanagari we only read */
function trReviewable(p) { return p.tier !== 'conn' && !p.locked && TR_LETTER.test(p.src || ''); }

/* ---- one line ---- */

function trSplitEdges(tok) {
  var lead = '', trail = '', core = tok, m;
  if ((m = core.match(TR_LEAD))) { lead = m[0]; core = core.slice(lead.length); }
  if ((m = core.match(TR_TRAIL))) { trail = m[0]; core = core.slice(0, core.length - trail.length); }
  return { lead: lead, core: core, trail: trail };
}

/* Roman words of a line, each {lead, trail, pieces:[{src, ascii, tier, key, ...}]}. A standalone "o" or "e" joins its
   neighbours the way Scan's pipeline does (dard o gham → dard-o-gham, dil e nādāñ → dil-e nādāñ). */
function trRomanWords(raw, o) {
  var toks = raw.split(/\s+/).filter(Boolean).map(trSplitEdges);
  var cores = toks.map(function (t) { return t.core; });
  var ascii = romanToAscii(cores.filter(Boolean).join(' '));
  var atoks = ascii.split(/\s+/).filter(Boolean);

  /* units: lists of token indexes that become one ascii token */
  var units = [];
  toks.forEach(function (t, i) {
    var low = t.core.toLowerCase(), u = units[units.length - 1];
    if (u && low === 'o' && i < toks.length - 1 && !t.lead && !t.trail && !toks[u[u.length - 1]].trail && !toks[i + 1].lead && t.core) {
      u.push(i); u.__join = true; return;
    }
    if (u && u.__join === true && u[u.length - 1] === i - 1 && toks[u[u.length - 1]].core.toLowerCase() === 'o') { u.push(i); u.__join = false; return; }
    if (u && low === 'e' && i < toks.length - 1 && !t.lead && !t.trail && !toks[u[u.length - 1]].trail && /[a-zāīūñḍṭṛḥ]$/i.test(toks[u[u.length - 1]].core)) {
      u.push(i); return;
    }
    units.push([i]);
  });
  var words = [], aligned = units.filter(function (u) { return u.some(function (i) { return toks[i].core && TR_LETTER.test(toks[i].core); }); }).length;
  var letterUnits = units.filter(function (u) { return u.some(function (i) { return TR_LETTER.test(toks[i].core); }); });
  var useAscii = letterUnits.length === atoks.length;
  var ai = 0;
  units.forEach(function (u) {
    var first = toks[u[0]], last = toks[u[u.length - 1]];
    var hasLetters = u.some(function (i) { return TR_LETTER.test(toks[i].core); });
    var w = { lead: first.lead, trail: last.trail, pieces: [], plain: !hasLetters, src: u.map(function (i) { return toks[i].lead + toks[i].core + toks[i].trail; }).join(' ') };
    if (!hasLetters) { w.plainText = u.map(function (i) { return toks[i].core; }).join('-'); words.push(w); return; }
    var srcPieces = [], tokOf = [];
    u.forEach(function (ti, k) {
      var core = toks[ti].core;
      var faWhole = (typeof tryFaDecompose === 'function') ? tryFaDecompose(core) : null;
      if (faWhole && faWhole.sfx && core.includes('-')) {
        srcPieces.push(core);
        tokOf.push({ ti: ti, j: 0, hyph: false, joiner: false, faWhole: faWhole });
      } else {
        var ps = core.split('-');
        ps.forEach(function (p, j) { srcPieces.push(p); tokOf.push({ ti: ti, j: j, hyph: ps.length > 1, joiner: u.length > 1 && (k > 0) && j === 0 }); });
      }
    });
    var asc = useAscii ? atoks[ai++] : null;
    var ap = asc ? asc.split('-') : null;
    var piecewise = ap && ap.length === srcPieces.length;
    if (!piecewise) {
      /* the ascii does not line up piece for piece (a list word with its own hyphen): one opaque piece */
      var wholeFa = (typeof tryFaDecompose === 'function') ? tryFaDecompose(srcPieces.join('-')) : null;
      var tier = (u.length === 1 && srcPieces.length === 1) ? casualPiece(srcPieces[0], 0, false, '', '').tier : (wholeFa ? 'persian' : 'typed');
      var pObj = { src: srcPieces.join('-'), ascii: asc || (wholeFa && wholeFa.ascii) || romanToAscii(srcPieces.join('-')), tier: tier, key: srcPieces.join('-').toLowerCase(), opaque: true };
      if (wholeFa) {
        pObj.fixed = { ur: wholeFa.ur, ro: wholeFa.ro, hi: wholeFa.hi, decomp: wholeFa };
      }
      w.pieces.push(pObj);
    } else {
      srcPieces.forEach(function (p, k) {
        var t = tokOf[k], tier;
        if (t.faWhole) {
          tier = 'persian';
          w.pieces.push({ src: p, ascii: ap[k], tier: tier, key: p.toLowerCase(), fixed: { ur: t.faWhole.ur, ro: t.faWhole.ro, hi: t.faWhole.hi, decomp: t.faWhole } });
        } else if (t.joiner && /^(e|ye|o)$/i.test(p)) {
          tier = 'conn';   // a standalone e / o that Scan's pipeline joins to its neighbour
          w.pieces.push({ src: p, ascii: ap[k], tier: tier, key: p.toLowerCase() });
        } else {
          tier = casualPiece(p, t.j, t.hyph, cores[t.ti - 1] || '', cores[t.ti + 1] || '').tier;
          w.pieces.push({ src: p, ascii: ap[k], tier: tier, key: p.toLowerCase() });
        }
      });
    }
    words.push(w);
  });
  return words;
}

/* a word typed in Urdu / Persian script: one piece carrying its scripts. A Persian line asks the Persian list first, an Urdu
   one Scan's word map first; the letter map is the last resort. A written iẓāfat (zer, ۂ) shows as -e, as in faLineScripts. */
function trArabicWord(core, lang) {
  var literal = /[\u064B-\u065F\u0670]/.test(core), known = (typeof wordAscii === 'function') && wordAscii(core, literal);
  var fa = (typeof faWordScripts === 'function' && (lang === 'fa' || !known)) ? faWordScripts(core) : null;
  var r;
  if (fa && fa.ro) r = { tier: (lang === 'fa' || !known) ? 'persian' : 'known', ro: trFaRo(fa.ro, core), hi: fa.hi || '' };
  else {
    var u = (typeof urduWordsToScripts === 'function') ? urduWordsToScripts(core) : null;   // Scan's per-word reading, letter map for the unknown
    r = { tier: known ? 'known' : 'guess', ro: (u && u.ro) || core, hi: (u && u.hi) || core };
  }
  if ((/[\u0650]$|ۂ$/.test(core)) && !/-e$/.test(r.ro)) { r.ro += '-e'; if (r.hi) r.hi += '-ए'; }
  return { tier: r.tier, fixed: { ur: trUrSpelling(core), ro: r.ro, hi: r.hi } };
}

function trScriptWords(raw, o) {
  var lang = (typeof detectScanLang === 'function' && /[\u0600-\u06FF]/.test(raw)) ? detectScanLang(raw) : 'ur';
  return raw.split(/\s+/).filter(Boolean).map(function (tok) {
    var e = trSplitEdges(tok), w = { lead: e.lead, trail: e.trail, pieces: [], src: tok, plain: false };
    if (/[\u0900-\u097F]/.test(e.core)) {
      var asc = (typeof devToAscii === 'function') ? devToAscii(e.core) : e.core, p = asciiToScripts(asc);
      w.pieces.push({ src: e.core, tier: 'typed', key: e.core, fixed: { ur: p.ur || e.core, ro: p.ro || e.core, hi: e.core }, locked: true });
    } else if (!e.core) {
      w.plain = true; w.plainText = '';
    } else {
      var parts = e.core.split('\u200c').filter(Boolean);   // صاحب‌دلان: two words, one compound
      w.zwnj = parts.length > 1;
      parts.forEach(function (part) {
        var r = trArabicWord(part, lang);
        w.pieces.push({ src: part, tier: r.tier, key: part, fixed: r.fixed, script: true });
      });
    }
    return w;
  });
}

/* ---- candidates for one piece ---- */

function trCands(piece, def, lang) {
  var out = [], seen = {}, fUr = function (s) { return (typeof dictFoldUr === 'function') ? dictFoldUr(s) : (s || ''); };
  function add(c) {
    if (!c || !c.ro) return;
    if (c.ur) c.ur = c.ur.normalize('NFC');   // the parsers can give ا + ٓ for آ
    var normUr = fUr(c.ur);
    var k = normUr + '|' + casualKey(c.ro, 0);   // one word once: two spellings of one sound (صدا ṣadā, سدا sadā) are two words
    if (!seen[k]) {
      seen[k] = 1;
      out.push(c);
    }
  }
  var isFa = lang === 'fa';
  if (piece.script) {
    add({ ro: def.ro, hi: def.hi, ur: def.ur, fixed: { ur: def.ur, ro: def.ro, hi: def.hi }, tag: 'now', isDefault: true });
    trFaHits(piece.src).forEach(function (h) { add({ ro: h.ro, hi: h.hi, ur: isFa ? trUrToFa(piece.src) : piece.src, fixed: { ur: piece.src, ro: h.ro, hi: h.hi }, tag: 'persian' }); });
    return out;
  }
  var plain = piece.src.toLowerCase().replace(/[āáâ]/g, 'ā').replace(/[īíî]/g, 'ī').replace(/[ūúû]/g, 'ū');
  function viaAscii(a, tag, isDefault) {
    var p = asciiToScripts(a);
    if (isFa && /[ñں]/.test(p.ur) && !/[ñ]/.test(plain)) {
      if (tag === 'list' || tag === 'loose') return; // suppress Urdu colloquialisms like māñ in Persian context
    }
    add({ ro: p.ro, hi: p.hi, ur: isFa ? trUrToFa(p.ur) : p.ur, ascii: a, tag: tag, isDefault: !!isDefault });
  }
  if (def.fixed) add({ ro: def.fixed.ro, hi: def.fixed.hi, ur: isFa ? trUrToFa(def.fixed.ur) : def.fixed.ur, fixed: def.fixed, tag: 'persian', isDefault: true });
  else viaAscii(def.ascii, 'now', true);
  if (piece.near && piece.tier === 'guess') add({ ro: piece.near.ro, hi: piece.near.hi, ur: piece.near.ur, fixed: piece.near, tag: 'lexicon' });

  if (isFa) {
    trFaHits(plain).slice(0, 3).forEach(function (h) {
      add({ ro: h.ro, hi: h.hi, ur: trUrToFa(h.ur), fixed: { ur: h.ur, ro: h.ro, hi: h.hi }, tag: 'persian' });
    });
    var decomp = tryFaDecompose(plain);
    if (decomp) {
      if (decomp.roFa && decomp.roFa !== decomp.ro) {
        add({ ro: decomp.roFa, hi: decomp.hi, ur: decomp.fa || trUrToFa(decomp.ur), fixed: { ur: decomp.fa || decomp.ur, ro: decomp.roFa, hi: decomp.hi, decomp: decomp }, tag: 'persian' });
      }
      add({ ro: decomp.ro, hi: decomp.hi, ur: decomp.fa || trUrToFa(decomp.ur), fixed: { ur: decomp.fa || decomp.ur, ro: decomp.ro, hi: decomp.hi, decomp: decomp }, tag: 'persian' });
      if (decomp.zwnj) {
        add({ ro: decomp.roFa || decomp.ro, hi: decomp.hi, ur: decomp.zwnj, fixed: { ur: decomp.zwnj, ro: decomp.roFa || decomp.ro, hi: decomp.hi, decomp: decomp }, tag: 'persian' });
      }
      if (decomp.ur && decomp.ur !== decomp.fa) {
        add({ ro: decomp.ro, hi: decomp.hi, ur: decomp.ur, fixed: { ur: decomp.ur, ro: decomp.ro, hi: decomp.hi, decomp: decomp }, tag: 'persian' });
      }
    }
  }

  for (var lv = 0; lv <= 2; lv++) {
    var hit = casualLookup(plain, lv, lv);
    if (hit) viaAscii(hit, lv < 2 ? 'list' : 'loose');
  }
  if (plain.includes('eh')) {
    var ahPlain = plain.replace(/e(?=h)/g, 'a');
    for (var lvh = 0; lvh <= 2; lvh++) {
      var hAh = casualLookup(ahPlain, lvh, lvh);
      if (hAh) viaAscii(hAh, lvh < 2 ? 'list' : 'loose');
    }
    var fbAh = rekhtaFallback(ahPlain);
    if (fbAh) viaAscii(fbAh, 'poets');
  }
  var urMorph = (typeof tryUrMorphDecompose === 'function') ? tryUrMorphDecompose(plain) : null;
  if (urMorph && urMorph.ascii) {
    viaAscii(urMorph.ascii, 'standard', true);
  }
  /* a dictionary word's regular forms (for a word the lists know, they underline it only when as close to what was typed: trRivals) */
  if (!isFa && (piece.baseTier || piece.tier) !== 'typed' && typeof DICT_STORE !== 'undefined' && DICT_STORE.status === 'ready') {
    DICT_STORE.formsFor(plain).slice(0, 4).forEach(function (f) { viaAscii(f.ascii, 'form'); });
  }
  var fb = rekhtaFallback(plain);
  if (fb) viaAscii(fb, 'poets');
  if (/ya$/.test(plain)) {
    var stemI = plain.replace(/ya$/, 'i');
    var fbStem = rekhtaFallback(stemI);
    if (fbStem) viaAscii(fbStem, 'poets');
    trFaHits(stemI).slice(0, 2).forEach(function (h) { add({ ro: h.ro, hi: h.hi, ur: isFa ? trUrToFa(h.ur) : h.ur, fixed: { ur: h.ur, ro: h.ro, hi: h.hi }, tag: 'persian' }); });
  }

  if (!isFa) {
    trFaHits(plain).slice(0, 4).forEach(function (h) { add({ ro: h.ro, hi: h.hi, ur: h.ur, fixed: { ur: h.ur, ro: h.ro, hi: h.hi }, tag: 'persian' }); });
    var decomp2 = tryFaDecompose(plain);
    if (decomp2) {
      add({ ro: decomp2.ro, hi: decomp2.hi, ur: decomp2.ur, fixed: { ur: decomp2.ur, ro: decomp2.ro, hi: decomp2.hi, decomp: decomp2 }, tag: 'persian' });
      if (decomp2.roFa && decomp2.roFa !== decomp2.ro) {
        add({ ro: decomp2.roFa, hi: decomp2.hi, ur: decomp2.fa || decomp2.ur, fixed: { ur: decomp2.fa || decomp2.ur, ro: decomp2.roFa, hi: decomp2.hi, decomp: decomp2 }, tag: 'persian' });
      }
      if (decomp2.fa && decomp2.fa !== decomp2.ur) {
        add({ ro: decomp2.ro, hi: decomp2.hi, ur: decomp2.fa, fixed: { ur: decomp2.fa, ro: decomp2.ro, hi: decomp2.hi, decomp: decomp2 }, tag: 'persian' });
      }
      if (decomp2.zwnj) {
        add({ ro: decomp2.roFa || decomp2.ro, hi: decomp2.hi, ur: decomp2.zwnj, fixed: { ur: decomp2.zwnj, ro: decomp2.roFa || decomp2.ro, hi: decomp2.hi, decomp: decomp2 }, tag: 'persian' });
      }
    }
  }

  if (/^ba[ah]?$|^bā$/.test(plain)) {
    add({ ro: 'bā', hi: 'बा', ur: 'با', fixed: { ur: 'با', ro: 'bā', hi: 'बा' }, tag: 'persian' });
    add({ ro: 'ba', hi: 'ब', ur: isFa ? 'به' : 'بہ', fixed: { ur: isFa ? 'به' : 'بہ', ro: 'ba', hi: 'ब' }, tag: 'persian' });
  }

  /* other readings, from the dictionary (src/js/12-dictionary-module.js): the same spelling read otherwise (readingsOf: Platts'
     Devanagari tells بیچ bīch from bech, the stem of bećnā) and other spellings of the same sound (soundsLike: sada is صدا
     ṣadā or سدا sadā). A reading may differ from what was typed in o~u, e~i, ai~e, au~o (میل mail / mel), not a~i (ہم is not him) */
  if (typeof DICT_STORE !== 'undefined' && DICT_STORE.status === 'ready' && !(isFa && /^maa?n$/.test(plain))) {
    var asFixed = function (r, tag) { var u = isFa ? trUrToFa(r.ur) : r.ur; add({ ro: r.ro, hi: r.hi, ur: u, fixed: { ur: u, ro: r.ro, hi: r.hi }, tag: tag }); };
    /* a reading the typed word (or the reading given) could stand for: o~u and e~i, not a~i (ہم is ham, not him) */
    var lax = function (r) { return casualKey(String(r).replace(/ai/g, 'e').replace(/au/g, 'o'), 2); }, want = [lax(plain), out.length ? lax(out[0].ro || '') : ''];
    if (out.length) DICT_STORE.readingsOf(out[0].ur).filter(function (r) { return want.indexOf(lax(r.ro)) >= 0; }).slice(0, 3)
      .forEach(function (r) { asFixed(r, 'reading'); });
    DICT_STORE.soundsLike(plain).filter(function (r) { return !out.some(function (c) { return fUr(c.ur) === fUr(r.ur); }); }).slice(0, 3)
      .forEach(function (r) { asFixed(r, 'lexicon'); });
  }
  /* classical near-pairs no rule derives (a different letter and vowel: safar سفر / ṣifr صفر): offered both ways */
  TR_PAIRS.forEach(function (p) {
    if (casualKey(p[0], 1) !== casualKey(plain, 1) && casualKey(p[1], 1) !== casualKey(plain, 1)) return;
    [p[2], p[3]].forEach(function (c) { add({ ro: c[1], hi: '', ur: isFa ? trUrToFa(c[0]) : c[0], fixed: { ur: c[0], ro: c[1], hi: '' }, tag: 'pair' }); });
  });

  /* Generalized phonetic confusions: g↔gh always (classical near-homophones); others when the piece is not an exact known match */
  var isKnown = piece && piece.tier === 'known';
  var TR_CONFUSIONS = [
    { p: /gh/g, r: 'g', always: true },
    { p: /(^|[^n])g(?!h)/g, r: '$1gh', always: true },
    { p: /q/g, r: 'k' },
    { p: /k(?!h)/g, r: 'q' },
    { p: /zh/g, r: 'z' },
    { p: /z(?!h)/g, r: 'zh' },
    { p: /kh/g, r: 'k' },
    { p: /(^|[^k])k(?!h)/g, r: '$1kh' },
    { p: /sh/g, r: 's' },
    { p: /(^|[^s])s(?!h)/g, r: '$1sh' }
  ];
  var confAlts = {};
  TR_CONFUSIONS.forEach(function (rule) {
    if ((rule.always || !isKnown) && rule.p.test(plain)) {
      var a = plain.replace(rule.p, rule.r);
      if (a !== plain && !confAlts[a]) confAlts[a] = 1;
    }
  });
  Object.keys(confAlts).forEach(function (alt) {
    for (var lv = 0; lv <= 2; lv++) {
      var h = casualLookup(alt, lv, lv);
      if (h) viaAscii(h, 'loose');
    }
    trFaHits(alt).slice(0, 2).forEach(function (h) {
      add({ ro: h.ro, hi: h.hi, ur: isFa ? trUrToFa(h.ur) : h.ur, fixed: { ur: h.ur, ro: h.ro, hi: h.hi }, tag: 'persian' });
    });
    var fbAlt = rekhtaFallback(alt);
    if (fbAlt) viaAscii(fbAlt, 'poets');
    var decAlt = tryFaDecompose(alt);
    if (decAlt) {
      add({ ro: decAlt.ro, hi: decAlt.hi, ur: isFa ? (decAlt.fa || trUrToFa(decAlt.ur)) : decAlt.ur, fixed: { ur: decAlt.ur, ro: decAlt.ro, hi: decAlt.hi, decomp: decAlt }, tag: 'persian' });
    }
  });

  if (plain.includes('kh')) {
    var px = plain.replace(/kh/g, ';x');
    if (/ya$/.test(plain)) {
      viaAscii(px.replace(/ya$/, 'yaa'), 'letters');
      viaAscii(px.replace(/ya$/, 'yah'), 'letters');
    }
  }
  var rk = rekhtaMarks(plain);
  if (out.length === 0 || rk !== plain) {
    viaAscii(rk, 'letters');
  }
  return out;
}

/* ---- the model ----
   trBuild(text, { choices }) → { lines:[{src, blank?, verified?, words:[…], out:{ro,hi,ur}}], stats } */

function trBuild(text, opts) {
  opts = opts || {};
  var choices = opts.choices || {};
  var stats = { words: 0, known: 0, poets: 0, persian: 0, form: 0, loose: 0, derived: 0, guess: 0, you: 0, check: 0 };
  var lines = String(text || '').replace(/\r/g, '').split('\n').map(function (rawLine) {
    var raw = rawLine.normalize('NFC').trim();
    if (!raw) return { src: '', blank: true, words: [], out: { ro: '', hi: '', ur: '', fa: '' } };
    var nk = normVerseKey(raw), kv = (typeof KNOWN_VERSES !== 'undefined') ? KNOWN_VERSES[nk] : null;
    if (kv && kv.ro && kv.ur && !/[؀-ۿऀ-ॿ]/.test(raw)) {
      /* a verse of Pritchett's own corpora: her Roman, verbatim */
      return { src: raw, verified: true, words: [], out: { ro: kv.ro, hi: kv.hi || '', ur: kv.ur, fa: trUrToFa(kv.ur) } };
    }
    var scripted = /[؀-ۿऀ-ॿ]/.test(raw);
    var lineLang = (opts && opts.lang) || (TR.script === 'fa' ? 'fa' : ((typeof detectScanLang === 'function') ? detectScanLang(raw) : 'ur'));
    var words = scripted ? trScriptWords(raw, opts) : trRomanWords(raw, opts);
    words.forEach(function (w) {
      w.lang = lineLang;
      w.pieces.forEach(function (p) {
        if (p.fixed) { p.def = { fixed: p.fixed }; }
        else p.def = { ascii: p.ascii };
        var ch = choices[p.key];
        if (!trReviewable(p)) return;
        if (ch) {
          if (ch.t === 'f') p.fixed = { ur: ch.ur || '', ro: ch.ro, hi: ch.hi || '', decomp: ch.decomp || null };
          else { p.fixed = null; p.ascii = ch.a; }
          p.chosen = true; p.baseTier = p.tier; p.tier = 'you';
          return;
        }
        /* a word no list knows, or that only the inflection regexes or the Persian splitter built: a regular form of a
           dictionary word, when the dictionary has one (formsFor, src/js/12-dictionary-module.js) */
        var forms = (!scripted && lineLang !== 'fa' && /^(guess|derived|persian)$/.test(p.tier) && !/-/.test(p.src) && typeof DICT_STORE !== 'undefined' && DICT_STORE.status === 'ready')
          ? DICT_STORE.formsFor(p.src) : [];
        /* a reading the lists or the Persian splitter gave stays unless the dictionary's is closer to what was typed; a tie goes to
           the dictionary (its form is checked), except against a hand-listed inflection (OBL_NOUN_MAP: shamon is shāmoñ) */
        if (forms.length && p.tier !== 'guess' && p.ascii && !forms.some(function (f) { return f.ascii === p.ascii; })) {
          var own = p.def.fixed ? 0 : typedDistance(p.src, asciiToScripts(p.ascii).ro || '');
          var listed = p.tier === 'derived' && (casualPiece(p.src, 0, false, '', '').urDec || {}).listed;
          if (p.def.fixed || own < forms[0].dist || (listed && own <= forms[0].dist)) forms = [];
        }
        if (forms.length) {
          p.ascii = forms[0].ascii; p.fixed = null; p.def = { ascii: p.ascii };
          p.baseTier = p.tier; p.tier = 'form';
          return;
        }
        /* a word no list knows, nor any rule: the dictionary word it sounds like, at most one short vowel or vowel length away
           (faasla: فاصلہ fāṣilah), spelled by the parsers (DICT_STORE.soundsLike), is its first alternative, not its reading: as the
           reading it gained Urdu words and lost Roman ones (the dictionary's Roman is classical: ḳhat̤rah, Rekhta's ḳhatra) */
        var near = (!scripted && lineLang !== 'fa' && p.tier === 'guess' && !/-/.test(p.src) && typeof DICT_STORE !== 'undefined' && DICT_STORE.status === 'ready')
          ? DICT_STORE.soundsLike(p.src.toLowerCase(), true)[0] : null;
        if (near && typedDistance(p.src, near.ro.replace(/ah$/, 'a')) <= 1) {   // its final -ah is the silent h typed -a
          p.near = { ur: near.ur, ro: near.ro, hi: near.hi };
        }
        if (!scripted && !p.opaque) {
          if (lineLang === 'fa' && p.src.toLowerCase() === 'man') {
            var mHits = trFaHits('man');
            if (mHits.length) {
              p.fixed = { ur: mHits[0].ur, ro: mHits[0].ro, hi: mHits[0].hi };
              p.baseTier = p.tier; p.tier = 'persian';
              p.def = { fixed: p.fixed };
            }
          } else if (p.tier === 'guess' || lineLang === 'fa') {
            var hits = (p.tier === 'guess') ? trFaHits(p.src) : trFaHitsStrict(p.src);
            if (!hits.length && p.tier !== 'guess') {
              /* casual typing drops vowel length (mara: مرا marā): the Persian word under the loose key, unless it is only the
                 word already read with the Persian ن for ں, a final ئے or an initial آ (darin دریں, ku کو, ab اب) */
              var loose = trFaIndex().loose[casualKey(p.src, 1)] || [];
              var fold = function (u) { return String(u || '').replace(/ں/g, 'ن').replace(/^آ/, 'ا').replace(/ئے$|ی$|ے$/, ''); };
              var cur = p.fixed ? p.fixed.ur : (p.ascii ? asciiToScripts(p.ascii).ur : '');
              if (loose.length && fold(loose[0].ur) !== fold(cur)) hits = loose;
            }
            if (hits.length) {
              p.fixed = { ur: hits[0].ur, ro: hits[0].ro, hi: hits[0].hi };
              p.baseTier = p.tier; p.tier = 'persian';
              p.def = { fixed: p.fixed };
            } else {
              var decomp = tryFaDecompose(p.src.toLowerCase());
              if (decomp && (p.tier === 'guess' || lineLang === 'fa')) {
                var chosenUr = (lineLang === 'fa' && decomp.fa) ? decomp.fa : decomp.ur;
                var chosenRo = (lineLang === 'fa' && decomp.roFa) ? decomp.roFa : decomp.ro;
                p.fixed = { ur: chosenUr, ro: chosenRo, hi: decomp.hi, decomp: decomp };
                p.baseTier = p.tier; p.tier = 'persian';
                p.def = { fixed: p.fixed };
              }
            }
          }
        }
      });
      w.out = trWordOut(w);
      var worst = null;
      w.pieces.forEach(function (p) {
        if (!(p.tier in TR_SEVERITY) && p.tier !== 'known' && p.tier !== 'poets') return;
        if (!worst || (TR_SEVERITY[p.tier] || 0) > (TR_SEVERITY[worst] || 0)) worst = p.tier;
      });
      w.tier = worst || (w.plain ? 'plain' : 'typed');
      w.reviewable = w.pieces.some(trReviewable);
      var cLang = (lineLang === 'fa' || (typeof TR !== 'undefined' && TR.script === 'fa')) ? 'fa' : 'ur';
      var hasChoice = w.reviewable && w.pieces.some(function (p) {
        if (!trReviewable(p)) return false;
        return trRivals(p, trCands(p, p.def, cLang)) > 0;
      });
      w.hasChoice = hasChoice;
      w.needsCheck = hasChoice || w.tier === 'guess' || w.tier === 'loose' || w.tier === 'derived' ||
        w.tier === 'form';   // a dictionary form is still a guess at which word: underlined (tests/benchmark_transcribe.js: caught)
      if (!w.plain) {
        stats.words++;
        if (stats[w.tier] != null) stats[w.tier]++;
        if (w.needsCheck) stats.check++;   // the underlined words, whatever made them so
      }
    });
    var line = { src: raw, words: words };
    line.out = { ro: trLineText(words, 'ro'), hi: trLineText(words, 'hi'), ur: trLineText(words, 'ur'), fa: trLineText(words, 'fa') };
    return line;
  });
  return { lines: lines, stats: stats };
}

/* one word's three scripts. Ascii-backed pieces go through the parser together (it knows iẓāfat across a hyphen);
   a word with a piece from the Persian list or a typed correction is joined piece by piece. */
function trWordOut(w) {
  if (w.plain) return { ro: w.plainText, hi: w.plainText, ur: w.plainText, fa: w.plainText };
  var ps = w.pieces, o;
  if (!ps.some(function (p) { return p.fixed; })) { o = asciiToScripts(ps.map(function (p) { return p.ascii; }).join('-')); o.fa = trUrToFa(o.ur); return o; }
  var parts = ps.map(function (p) {
    if (p.fixed) return { ro: p.fixed.ro, hi: p.fixed.hi || asciiToScripts(romanToAscii(p.fixed.ro)).hi, ur: p.fixed.ur || asciiToScripts(romanToAscii(p.fixed.ro)).ur, fa: p.fixed.fa || (p.fixed.decomp && p.fixed.decomp.fa) || trUrToFa(p.fixed.ur), conn: false };
    var t = asciiToScripts(p.ascii);
    return { ro: t.ro || p.src, hi: t.hi || p.src, ur: t.ur || p.src, fa: trUrToFa(t.ur), conn: p.tier === 'conn', src: p.src.toLowerCase() };
  });
  var ur = '', fa = '';
  parts.forEach(function (p, i) {
    if (w.zwnj && i > 0) { ur += '\u200c'; fa += '\u200c'; }
    if (p.conn && /^y?e$/.test(p.src) && ur) {
      if (/[ہه]$/.test(ur)) {
        ur = ur.replace(/[ہه]$/, 'ۂ ');
        fa = fa.replace(/[ہه]$/, 'هٔ ');
      } else if (/[آاو]$/.test(ur)) {
        ur += 'ئے ';
        fa += 'ی ';
      } else {
        ur += 'ِ ';
        fa += 'ِ ';
      }
    }
    else if (p.conn && p.src === 'o') {
      ur = ur.trim() + ' و ';
      fa = fa.trim() + ' و ';
    }
    else {
      if (i > 0 && !w.zwnj && !parts[i - 1].conn && ur && !/\s$/.test(ur)) {
        ur += ' ';
        fa += ' ';
      }
      ur += p.ur;
      fa += (p.fa || trUrToFa(p.ur));
    }
  });
  ur = ur.trim().replace(/\s+/g, ' ');
  fa = fa.trim().replace(/\s+/g, ' ');
  return { ro: parts.map(function (p) { return p.ro; }).join('-'), hi: parts.map(function (p) { return p.hi; }).join('-'), ur: ur, fa: fa };
}

var TR_UR_PUNCT = { ',': '،', ';': '؛', '?': '؟', '.': '۔' };
function trEdge(s, script) {
  return (script === 'ur' || script === 'fa') ? s.replace(/[,;?.]/g, function (c) { return TR_UR_PUNCT[c]; }) : s;
}
function trLineText(words, script) {
  return words.map(function (w) { return trEdge(w.lead, script) + w.out[script] + trEdge(w.trail, script); }).join(' ');
}

/* plain text of a whole model in one script, a blank line where the text had one */
function trText(model, script) {
  return model.lines.map(function (l) { return l.blank ? '' : (l.out[script] || ''); }).join('\n').replace(/\n+$/, '');
}

/* ---- view ---- */

var TR = { script: 'ro', open: null, model: null, choices: {}, timer: null, msg: '', dictTarget: null };

function trSave(key, val) { try { if (typeof store !== 'undefined' && store.set) store.set(key, val); } catch (e) {} }
function trLoad(key, def) { try { if (typeof store !== 'undefined' && store.get) { var v = store.get(key, def); return v == null ? def : v; } } catch (e) {} return def; }

var TR_TIER_NOTE = {
  known: 'Pritchett’s word list', poets: 'the Rekhta poets’ list', persian: 'the Persian list', loose: 'a loose match: check it', derived: 'built by an inflection rule: check it', form: 'a regular form of a dictionary word',
  guess: 'no list knows it: read from the letters, short vowels are a guess', typed: 'as you typed it', you: 'your correction'
};
/* classical near-pairs: [typed, typed, [Urdu, Roman], [Urdu, Roman]] (offered for either typed spelling) */
var TR_PAIRS = [['sada', 'sadaa', ['صدا', 'ṣadā'], ['سدا', 'sadā']], ['safar', 'sifr', ['سفر', 'safar'], ['صفر', 'ṣifr']], ['halal', 'hilal', ['حلال', 'ḥalāl'], ['ہلال', 'hilāl']],
  ['khar', 'khwar', ['خار', 'ḳhār'], ['خوار', 'ḳhvār']], ['qaza', 'ghaza', ['قضا', 'qaẓā'], ['غزا', 'ġhazā']],
  ['salam', 'salām', ['سلام', 'salām'], ['سالم', 'sālim']], ['nazar', 'nazr', ['نظر', 'naz̤ar'], ['نذر', 'nażr']],
  ['durud', 'durūd', ['درود', 'durūd'], ['درود', 'darūd']], ['buvad', 'buad', ['بود', 'buvad'], ['بود', 'būd']], ['bood', 'būd', ['بود', 'buvad'], ['بود', 'būd']],
  ['main', 'meen', ['میں', 'maiñ'], ['مین', 'mīn']], ['mein', 'meen', ['میں', 'meñ'], ['مین', 'mīn']], ['gaye', 'gāye', ['گئے', 'gaʾe'], ['گیے', 'gaye']], ['naye', 'nayi', ['نئے', 'naʾe'], ['نیے', 'naye']], ['aaye', 'āye', ['آئے', 'āʾe'], ['آیے', 'āye']]];
var TR_TAG_NOTE = { now: 'as read now', list: 'Pritchett’s list', loose: 'loose match', poets: 'Rekhta poets', persian: 'Persian list', letters: 'from the letters', reading: 'same spelling, another word', lexicon: 'dictionary', pair: 'classical pair', form: 'dictionary word’s form' };

function trScriptAttrs(script) {
  return script === 'ur' ? 'class="tr-res tr-res-ur" lang="ur" dir="rtl"' : script === 'fa' ? 'class="tr-res tr-res-ur" lang="fa" dir="rtl"' : script === 'hi' ? 'class="tr-res tr-res-hi" lang="hi" dir="ltr"' : 'class="tr-res tr-res-ro" lang="und-Latn" dir="ltr"';
}

function trWordHtml(w, li, wi, script) {
  var txt = escapeHtml(trEdge(w.lead, script) + w.out[script] + trEdge(w.trail, script));
  var checkCls = w.tier === 'you' ? ' tr-t-you' : (w.needsCheck ? ' tr-t-choice' : '');
  var cls = 'tr-w tr-t-' + w.tier + checkCls;
  if (!w.reviewable) return '<span class="' + cls + '">' + txt + '</span>';
  var on = TR.open && TR.open.li === li && TR.open.wi === wi;
  var note = TR_TIER_NOTE[w.tier] || '';
  return '<button type="button" class="' + cls + (on ? ' on' : '') + '" aria-expanded="' + (on ? 'true' : 'false') + '" title="' + escapeHtml(note) + '" onclick="trOpen(' + li + ',' + wi + ')">' + txt + '</button>';
}

/* what a candidate looks like inside its button */
function trCandHtml(c, script) {
  var ro = escapeHtml(c.ro || '');
  var ur = escapeHtml(c.ur ? (script === 'fa' ? trUrToFa(c.ur) : trUrSpelling(c.ur)) : '');
  var hi = escapeHtml(c.hi || '');

  if (script === 'ro') {
    if (ur && ur !== ro) {
      return '<span class="tr-cand-script" lang="ur" dir="rtl">' + ur + '</span><span class="tr-cand-ro-lbl">' + ro + '</span>';
    }
    return '<span class="tr-cand-ro-lbl">' + ro + '</span>';
  } else if (script === 'ur') {
    return '<span class="tr-cand-script" lang="ur" dir="rtl">' + (ur || ro) + '</span><span class="tr-cand-ro-lbl">' + ro + '</span>';
  } else if (script === 'fa') {
    var fa = escapeHtml(trUrToFa(c.ur) || ro);
    return '<span class="tr-cand-script" lang="fa" dir="rtl">' + fa + '</span><span class="tr-cand-ro-lbl">' + ro + '</span>';
  } else if (script === 'hi') {
    return '<span class="tr-cand-deva" lang="hi" dir="ltr">' + (hi || ro) + '</span><span class="tr-cand-ro-lbl">' + ro + '</span>';
  }
  return ro;
}

/* one line per piece: the spelling as typed, its alternatives as small tags, a box to type your own */
function trEditHtml(w, script) {
  var rows = [];
  var cls = 'tr-cand-' + script;
  var lang = script === 'ro' ? 'ur-Latn' : script;
  var cLang = (script === 'fa' || w.lang === 'fa') ? 'fa' : 'ur';

  var rev = [];
  w.pieces.forEach(function (p, pi) {
    if (!trReviewable(p)) return;
    var cands = trCands(p, p.def, cLang);
    var hasChoice = trRivals(p, cands) > 0 || p.tier === 'guess' || p.tier === 'loose' || p.tier === 'derived' || p.chosen;
    rev.push({ p: p, pi: pi, cands: cands, hasChoice: hasChoice });
  });
  var hasAnyChoice = rev.some(function (r) { return r.hasChoice; });
  var activeRows = (rev.length > 1 && hasAnyChoice) ? rev.filter(function (r) { return r.hasChoice; }) : rev;

  activeRows.forEach(function (r) {
    var p = r.p, pi = r.pi, cands = r.cands;
    var cur = p.fixed ? p.fixed.ro : null;
    var btns = cands.map(function (c, ci) {
      var isCur = p.fixed ? c.ro === cur : (!c.fixed && c.ascii === p.ascii);
      var tip = c.ro + (TR_TAG_NOTE[c.tag] ? ' · ' + TR_TAG_NOTE[c.tag] : '');
      return '<button type="button" class="btn sm tr-cand ' + cls + (isCur ? ' on' : '') + '" lang="' + lang + '" aria-pressed="' + isCur + '" title="' + escapeHtml(tip) + '" onclick="trPick(' + pi + ',' + ci + ')">' + trCandHtml(c, script) + '</button>';
    }).join('');
    rows.push('<form class="tr-edit-row" onsubmit="return trCustom(' + pi + ', this)">' +
      '<span class="tr-edit-src" lang="ur-Latn" dir="ltr" title="' + escapeHtml(TR_TIER_NOTE[p.tier] || '') + '">' + escapeHtml(p.src) + '</span>' + btns +
      '<input class="tr-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" lang="ur-Latn" dir="ltr" aria-label="Type the spelling of ' + escapeHtml(p.src) + '" placeholder="type…">' +
      '<button type="submit" class="btn sm">Use</button></form>');
  });
  var activePiece = null;
  if (TR.dictTarget != null && w.pieces && w.pieces[Number(TR.dictTarget)]) {
    activePiece = w.pieces[Number(TR.dictTarget)];
  } else if (w.pieces) {
    for (var i = 0; i < w.pieces.length; i++) {
      if (w.pieces[i].chosen) { activePiece = w.pieces[i]; break; }
    }
    if (!activePiece && w.pieces.length > 0) {
      activePiece = w.pieces[0];
    }
  }
  var dictHtml = trDictSectionHtml(w, activePiece, script);
  return '<div class="tr-edit" role="group" aria-label="Spellings for ' + escapeHtml(w.src) + '" title="A choice applies to every place this spelling appears.">' + rows.join('') + dictHtml +
    '<button type="button" class="btn ghost sm tr-close" aria-label="Close" onclick="trClose()">×</button></div>';
}

/* how many alternatives make a word worth a second look. For a word no list vouches for, any. For a word Pritchett's or the poets'
   lists know: those from the lists and rules, and a dictionary word spelled otherwise only when it is as close to what was
   typed as the list's reading (the list may have the wrong word); the same spelling's other readings are offered on a tap,
   not underlined. Tuned on tests/benchmark_transcribe.js (caught: no silent errors; calm: no needless underlines). */
function trRivals(p, cands) {
  var alts = cands.filter(function (c) { return !c.isDefault; });
  if (!/^(known|poets)$/.test(p.tier) || !cands.length || typeof typedDistance !== 'function') return alts.length;
  var own = typedDistance(p.src, cands[0].ro || '');
  return alts.filter(function (c) {
    if (c.tag === 'reading') return false;
    return !/^(lexicon|form)$/.test(c.tag) || typedDistance(p.src, c.ro || '') <= own;
  }).length;
}

/* the reading shown is a regular form of a dictionary verb (hārī of hārnā, picked or given): the drawer leads with the verb */
function trIsVerbForm(p) {
  if (!p || !p.ascii || !p.src || typeof DICT_STORE === 'undefined' || DICT_STORE.status !== 'ready') return false;
  return DICT_STORE.formsFor(p.src).some(function (f) { return f.ascii === p.ascii && /naa$/.test(f.base || ''); });
}

/* the entries for the first of several spellings of one word that the dictionary knows */
function trLookupFirst(spellings) {
  for (var i = 0; i < spellings.length; i++) {
    if (!spellings[i]) continue;
    var h = DICT_STORE.lookup(spellings[i]);
    if (h.length) return h;
  }
  return [];
}

function trDictSectionHtml(w, activeP, script) {
  if (typeof DICT_STORE === 'undefined') return '';
  var src = w.src || '';
  var p = activeP || (w.pieces && w.pieces[0]) || null;
  var isSuffix = p && /^(i|ee|ii|am|at|ash|im|id|and|e|ye)$/i.test(p.src);
  if (isSuffix && w.pieces && w.pieces.length > 1) {
    p = w.pieces[0];
  }
  var decomp = (p && p.fixed && p.fixed.decomp) || null;
  if (!decomp && p && p.src) {
    var dCheck = tryFaDecompose(p.src.toLowerCase());
    if (dCheck && (p.tier === 'guess' || p.tier === 'persian' || w.lang === 'fa')) decomp = dCheck;
  }
  if (!decomp && src) {
    var dCheckW = tryFaDecompose(src.toLowerCase());
    if (dCheckW) decomp = dCheckW;
  }
  var morphBanner = '';
  if (decomp && decomp.morph) {
    var morphDesc = decomp.morph;
    if (decomp.pfx && decomp.stem) {
      morphDesc = decomp.pfx + ' (prefix) + ' + decomp.stem + (decomp.stemUr ? ' (' + decomp.stemUr + ')' : '') + (decomp.sfx ? ' + -' + decomp.sfx + ' (suffix)' : '');
    } else if (decomp.stem && decomp.sfx) {
      morphDesc = decomp.stem + (decomp.stemUr ? ' (' + decomp.stemUr + ')' : '') + ' + -' + decomp.sfx + ' (suffix)';
    }
    morphBanner = '<div class="tr-dict-morph dim small">' +
      '<strong>Morphology:</strong> ' + escapeHtml(morphDesc) + '</div>';
  }
  if (DICT_STORE.status !== 'ready') {
    if (DICT_STORE.status === 'unloaded') {
      return morphBanner + '<div class="tr-dict-teaser"><button type="button" class="btn link sm" onclick="triggerLoadDictionary()"><span class="icon">📖</span> View Platts / Fallon / Steingass definition</button></div>';
    } else if (DICT_STORE.status === 'loading') {
      return morphBanner + '<div class="tr-dict-teaser dim small">Loading dictionary…</div>';
    }
    return morphBanner;
  }

  var verbForm = trIsVerbForm(p);   // the lookup leads with the verb and its family; their order stands (no re-sort below)
  // Build candidate tabs. DICT_STORE.lookup already folds spellings and finds a form's dictionary word: what is left to try is
  // which spelling of the word to ask with (typed, Urdu, Roman, a compound whole or unspaced)
  var tabs = [];
  var wholeHits = src && src.includes('-') ? trLookupFirst([src, src.replace(/-/g, '')]) : [];
  if (!wholeHits.length && w.out && w.out.ur) {
    wholeHits = DICT_STORE.lookup(w.out.ur, 0, { verbFirst: verbForm });
    if (w.out.ro && w.out.ro !== w.out.ur) {
      DICT_STORE.lookup(w.out.ro).forEach(function (rh) {
        if (!wholeHits.some(function (wh) { return wh.ur === rh.ur && wh.ro === rh.ro && wh.def === rh.def; })) wholeHits.push(rh);
      });
    }
  }
  if (!wholeHits.length && decomp && decomp.stem) {
    wholeHits = trLookupFirst([decomp.pfxUr && decomp.stemUr && decomp.pfxUr + ' ' + decomp.stemUr, decomp.pfxUr && decomp.stemUr && decomp.pfxUr + decomp.stemUr,
      decomp.pfx && decomp.pfx + '-' + decomp.stem, decomp.pfx && decomp.pfx + decomp.stem]);
  }
  if (!wholeHits.length && src && !src.includes('-')) wholeHits = DICT_STORE.lookup(src);

  if (wholeHits.length) {
    var wholeLabel = (w.pieces && w.pieces.length > 1 && w.out && w.out.ur)
      ? (w.out.ur + (w.out.ro ? ' (' + w.out.ro + ')' : ''))
      : (wholeHits[0].ur + ' (' + wholeHits[0].ro + ')');
    tabs.push({ id: 'whole', label: wholeLabel, hits: wholeHits });
  }

  if (w.pieces && w.pieces.length > 1) {
    w.pieces.forEach(function (pc, pi) {
      var isConn = (pc.tier === 'conn') || /^(e|ye|o)$/i.test(pc.src);
      if (isConn) return;
      var ur = (pc.fixed && pc.fixed.ur) || (pc.ascii && asciiToScripts(pc.ascii).ur) || pc.src;
      var ro = (pc.fixed && pc.fixed.ro) || (pc.ascii && asciiToScripts(pc.ascii).ro) || pc.src;
      var hList = trLookupFirst([ur, ro, pc.src]);
      tabs.push({ id: String(pi), pi: pi, p: pc, label: ur + ' (' + ro + ')', hits: hList });
    });
  } else if (decomp && decomp.stem) {
    var sUr = decomp.stemUr || '';
    var sRo = decomp.stem || '';
    var sHits = trLookupFirst([sUr, sRo]);
    tabs.push({ id: 'stem', label: (sUr || sRo) + (sRo ? ' (' + sRo + ')' : ''), hits: sHits });
  }

  var activeTab = null;
  var curTarget = (typeof TR !== 'undefined') ? TR.dictTarget : null;
  if (curTarget != null) {
    activeTab = tabs.find(function (t) { return t.id === String(curTarget); });
  }
  if (!activeTab && tabs.length > 0) {
    if (tabs[0].id === 'whole' && tabs.length > 1 && w.pieces && w.pieces.length > 1 && !src.includes('ba-') && !src.includes('na-')) {
      activeTab = tabs[1];
    } else {
      activeTab = tabs[0];
    }
  }

  var hits = (activeTab && activeTab.hits && activeTab.hits.length) ? activeTab.hits : [];
  if (!hits.length) {
    var targetP = (activeTab && activeTab.p) || p;
    var isSuff = targetP && /^(i|ee|ii|am|at|ash|im|id|and|e|ye)$/i.test(targetP.src);
    var urTarget = (!isSuff && ((targetP && targetP.fixed && targetP.fixed.ur) || (targetP && (targetP.ascii || (targetP.def && targetP.def.ascii)) && asciiToScripts(targetP.ascii || targetP.def.ascii).ur))) || '';
    hits = trLookupFirst([urTarget, !isSuff && targetP && targetP.fixed && targetP.fixed.ro, !isSuff && targetP && targetP.src, src]);
  }

  var tabsHtml = '';
  if (tabs.length > 1) {
    tabsHtml = '<div class="tr-dict-tabs row">' +
      tabs.map(function (t) {
        var isCur = t === activeTab;
        return '<button type="button" class="btn sm tr-dict-tab' + (isCur ? ' on' : '') + '" aria-pressed="' + isCur + '" onclick="trSetDictTarget(\'' + escapeHtml(t.id) + '\')">' + escapeHtml(t.label) + '</button>';
      }).join('') + '</div>';
  }

  if (!hits.length) return (morphBanner || tabsHtml) ? '<div class="tr-dict-box">' + morphBanner + tabsHtml + '<div class="dim small">No dictionary entry found.</div></div>' : '';

  function trFoldRo(s) {
    if (!s) return '';
    return s.normalize('NFC').replace(/ć/g, 'ch').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '');
  }

  var distinctReadings = [];
  var seenReadings = {};
  hits.forEach(function (x) {
    var normUr = (typeof dictFoldUr === 'function') ? dictFoldUr(x.ur) : (x.ur || '');
    var key = normUr + '|' + trFoldRo(x.ro) + '|' + (x.origin || '') + '|' + (x.dict || '');
    if (!seenReadings[key]) {
      var item = { primary: x, all: [x], ro: x.ro, origin: x.origin, dict: x.dict, ur: x.ur, page: x.page, def: x.def, phrases: x.phrases ? x.phrases.slice() : [] };
      seenReadings[key] = item;
      distinctReadings.push(item);
    } else {
      seenReadings[key].all.push(x);
      if (x.phrases && x.phrases.length) {
        seenReadings[key].phrases = seenReadings[key].phrases.concat(x.phrases);
      }
    }
  });

  var activeRo = (p && p.fixed && p.fixed.ro) || (p && p.ro) || (w.out && w.out.ro) || src;
  var cleanSrc = trFoldRo(activeRo);
  var isFaMode = (typeof TR !== 'undefined' && TR.script === 'fa') || (w && w.lang === 'fa');

  function roMatchScore(cand) {
    if (!cleanSrc) return 0;
    var cr = trFoldRo(cand.ro);
    if (cr === cleanSrc) return 100;
    if (cr.replace(/na$/, '') === cleanSrc) return 90;
    if (cr.replace(/a$/, '') === cleanSrc) return 80;
    return cr.startsWith(cleanSrc) ? 70 : 0;
  }

  if (!verbForm) distinctReadings.sort(function(a, b) {
    var aScore = roMatchScore(a);
    var bScore = roMatchScore(b);
    if (aScore !== bScore) return bScore - aScore;
    if (isFaMode) {
      var aP = (a.origin === 'P' || a.dict === 'Steingass') ? 1 : 0;
      var bP = (b.origin === 'P' || b.dict === 'Steingass') ? 1 : 0;
      if (aP !== bP) return bP - aP;
    }
    return 0;
  });

  var defaultMatch = verbForm ? distinctReadings[0] : null;
  if (!defaultMatch && cleanSrc) {
    defaultMatch = (isFaMode ? distinctReadings.find(function(x) {
      return (roMatchScore(x) > 0) && (x.origin === 'P' || x.dict === 'Steingass');
    }) : null) || distinctReadings.find(function(x) {
      return roMatchScore(x) > 0;
    });
  }
  if (!defaultMatch && decomp && decomp.stem) {
    var dStemClean = trFoldRo(decomp.stem);
    defaultMatch = distinctReadings.find(function(x) {
      return trFoldRo(x.ro) === dStemClean && (x.origin === 'P' || !x.origin);
    }) || distinctReadings.find(function(x) {
      return trFoldRo(x.ro) === dStemClean;
    });
  }
  var selIdx = (typeof TR !== 'undefined' && TR.dictHitIdx != null) ? TR.dictHitIdx : (defaultMatch ? distinctReadings.indexOf(defaultMatch) : 0);
  if (selIdx < 0 || selIdx >= distinctReadings.length) selIdx = 0;
  var h = distinctReadings[selIdx] || (hits[0] ? { primary: hits[0], all: [hits[0]], ro: hits[0].ro, origin: hits[0].origin, dict: hits[0].dict, ur: hits[0].ur, page: hits[0].page, def: hits[0].def } : null);

  var dictSource = h.dict || (h.page ? 'Platts' : 'Steingass');
  var dictTitle = dictSource === 'Steingass' ? 'Steingass (Persian)' : dictSource === 'Fallon' ? 'Fallon (Hindustani)' : 'Platts (Urdu/Hindi)';
  var org = (typeof DICT_ORIGIN_NAMES !== 'undefined' && DICT_ORIGIN_NAMES[h.origin]) || h.origin || '';
  var badgeCls = h.origin ? 'origin-' + h.origin : 'origin-default';
  var phrasesHtml = (h.phrases && h.phrases.length) ? '<div class="tr-dict-phrases">' +
    h.phrases.slice(0, 3).map(function(ph){ return '<div><em>' + escapeHtml(ph.ro) + '</em>: ' + escapeHtml(ph.def) + '</div>'; }).join('') + '</div>' : '';

  var readingsHtml = '';
  if (distinctReadings.length > 1) {
    readingsHtml = '<div class="tr-dict-readings row">' +
      '<span class="tr-readings-lbl">Readings:</span>' +
      distinctReadings.slice(0, 6).map(function (dh, di) {
        var isCur = (di === selIdx);
        var dSrc = dh.dict || (dh.page ? 'Platts' : 'Steingass');
        var orgCode = dh.origin || (dSrc === 'Steingass' ? 'P' : '');
        var badgeCls = orgCode ? 'origin-' + orgCode : 'origin-default';
        var wordRo = dh.ro || dh.ur || '';
        var roTag = wordRo ? '<span class="tr-pill-ro">' + escapeHtml(wordRo) + '</span>' : '';
        var orgTag = orgCode ? '<span class="tr-pill-org ' + badgeCls + '">' + escapeHtml(orgCode) + '</span>' : '';
        return '<button type="button" class="tr-reading-pill' + (isCur ? ' on' : '') + '" ' +
          'onclick="trSetDictHit(' + di + ')">' + roTag + orgTag + '</button>';
      }).join('') + '</div>';
  }

  var defText = '';
  if (h && h.all && h.all.length > 1) {
    defText = h.all.map(function (entry, idx) {
      return '<div class="tr-dict-sense"><strong>(' + (idx + 1) + ')</strong> ' + escapeHtml(entry.def || '') + '</div>';
    }).join('');
  } else if (h) {
    defText = escapeHtml(h.def || (h.primary && h.primary.def) || '');
  }

  var headUr = (h && h.ur) ? '<span class="tr-dict-ur" dir="rtl">' + escapeHtml(h.ur) + '</span>' : '';
  var headRo = (h && h.ro) ? '<span class="tr-dict-ro">' + escapeHtml(h.ro) + '</span>' : '';

  return '<div class="tr-dict-box">' + morphBanner + tabsHtml + readingsHtml +
    '<div class="tr-dict-head">' + headUr + headRo +
    '<span class="tr-dict-title">' + escapeHtml(dictTitle) + '</span>' +
    (org ? '<span class="dict-lex-badge ' + badgeCls + '">' + escapeHtml(org) + '</span>' : '') +
    (h.page ? '<span class="dict-lex-page">p. ' + h.page + '</span>' : '') + '</div>' +
    '<div class="tr-dict-body">' + defText + '</div>' +
    phrasesHtml + '</div>';
}

function trStatsHtml(s) {
  if (!s.words) return '';
  var bits = [s.words + (s.words === 1 ? ' word' : ' words')];
  bits.push(s.check ? s.check + ' to check' : 'all verified');
  if (s.you) bits.push(s.you + ' corrected');
  return bits.join(' · ');
}

function trCorrectionsHtml() {
  var keys = Object.keys(TR.choices);
  if (!keys.length) return '';
  var items = keys.map(function (k, i) {   // the handler gets a position, never user text
    var c = TR.choices[k], ro = c.t === 'f' ? c.ro : (asciiToScripts(c.a).ro || c.a);
    return '<li><span lang="ur-Latn" dir="ltr">' + escapeHtml(k) + ' → ' + escapeHtml(ro) + '</span> <button type="button" class="btn link sm" onclick="trUndo(' + i + ')">Undo</button></li>';
  }).join('');
  return '<div class="tr-fixes"><div class="eyebrow">Your corrections</div><ul>' + items + '</ul>' +
    '<button type="button" class="btn ghost sm" onclick="trUndoAll()">Clear all</button></div>';
}

function trRender() {
  var host = $('trOut');
  if (!host || !host.innerHTML === undefined) return;
  var ta = $('trIn'), text = ta ? ta.value : '';
  TR.model = trBuild(text, { choices: TR.choices });
  var m = TR.model, script = TR.script, has = m.lines.some(function (l) { return !l.blank; });
  var attrs = trScriptAttrs(script);
  var html = m.lines.map(function (l, li) {
    if (l.blank) return '<div class="tr-gap" aria-hidden="true"></div>';
    var body = l.verified ? '<div ' + attrs + '>' + escapeHtml(l.out[script]) + '</div>'
      : '<div ' + attrs + '>' + l.words.map(function (w, wi) { return trWordHtml(w, li, wi, script); }).join(' ') + '</div>';
    return '<div class="tr-line">' + body + '</div>';
  }).join('');
  host.innerHTML = html;

  var insp = $('trInspector');
  if (insp) {
    var openWord = (TR.open && m.lines[TR.open.li] && m.lines[TR.open.li].words[TR.open.wi]) || null;
    if (openWord) {
      insp.innerHTML = trEditHtml(openWord, script);
      insp.classList.remove('hidden');
    } else {
      insp.innerHTML = '';
      insp.classList.add('hidden');
    }
  }

  var st = $('trStats'); if (st) st.textContent = trStatsHtml(m.stats);
  var fx = $('trFixes'); if (fx) fx.innerHTML = trCorrectionsHtml();
  var ac = $('trActions'); if (ac) ac.classList.toggle('hidden', !has);
  var em = $('trEmpty'); if (em) em.classList.toggle('hidden', has);
  var lg = $('trLegend'); if (lg) lg.classList.toggle('hidden', !has);
  var inClr = $('trInClear'); if (inClr) inClr.classList.toggle('hidden', !has);
  var sb = $('trScriptBtns');
  if (sb) sb.innerHTML = TR_SCRIPTS.map(function (s) {
    var cls = 'tr-script-btn tr-script-btn-' + s[0] + (TR.script === s[0] ? ' on' : '');
    return '<button type="button" class="' + cls + '" data-script="' + s[0] + '" aria-pressed="' + (TR.script === s[0]) + '" onclick="trSetScript(\'' + s[0] + '\')">' + s[1] + '</button>';
  }).join('');
  var ms = $('trMsg'); if (ms) ms.textContent = TR.msg || '';
}

function trOnInput() {
  TR.open = null; TR.msg = '';
  var ta = $('trIn');
  if (ta) trSave('trText', ta.value);
  if (TR.timer) clearTimeout(TR.timer);
  TR.timer = setTimeout(trRender, 120);
}
function trSetScript(s) { TR.script = s; trSave('trScript', s); trRender(); }
function trOpen(li, wi) {
  var wasClosed = !TR.open || TR.open.li !== li || TR.open.wi !== wi;
  TR.open = wasClosed ? { li: li, wi: wi } : null;
  TR.dictTarget = null; TR.dictHitIdx = null;
  trRender();
  if (wasClosed) {
    var insp = $('trInspector');
    if (insp && typeof insp.scrollIntoView === 'function') {
      try { insp.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {}
    }
  }
}
function trClose() { TR.open = null; TR.dictTarget = null; TR.dictHitIdx = null; trRender(); }
function trSetDictTarget(t) { TR.dictTarget = t; TR.dictHitIdx = null; trRender(); }
function trSetDictHit(idx) { TR.dictHitIdx = idx; trRender(); }

function trChoiceFor(c) { return c.fixed ? { t: 'f', ro: c.fixed.ro, hi: c.fixed.hi || '', ur: c.fixed.ur || '', decomp: c.fixed.decomp || null } : { t: 'a', a: c.ascii }; }
function trOpenPiece(pi) {
  if (!TR.open || !TR.model) return null;
  var l = TR.model.lines[TR.open.li], w = l && l.words[TR.open.wi], p = w && w.pieces[pi];
  return p ? { w: w, p: p } : null;
}
function trPick(pi, ci) {
  var h = trOpenPiece(pi); if (!h) return;
  var cLang = (TR.script === 'fa' || (h.w && h.w.lang === 'fa')) ? 'fa' : 'ur';
  var c = trCands(h.p, h.p.def, cLang)[ci]; if (!c) return;
  if (c.isDefault) delete TR.choices[h.p.key]; else TR.choices[h.p.key] = trChoiceFor(c);
  TR.dictTarget = String(pi);
  TR.dictHitIdx = null;
  trSave('trChoices', TR.choices);
  trRender();
}
/* A spelling typed in the box: Urdu script is taken as written (its Roman and Devanagari read from it), Devanagari through
   devToAscii, Roman with Rekhta's capitals kept as marks (ungRi, ulTi, baDi: ṛ ṭ ḍ, which romanToAscii alone would lowercase
   away). Nothing readable, nothing changed: the word is never replaced by an empty one. */
function trCustomChoice(v, p) {
  if (/[\u0600-\u06FF]/.test(v)) {
    var u = (typeof urduWordsToScripts === 'function' && urduWordsToScripts(v)) || {};
    return { t: 'f', ur: v, ro: u.ro || v, hi: u.hi || '' };
  }
  var a = /[\u0900-\u097F]/.test(v) ? devToAscii(v) : romanToAscii(rekhtaMarks(v.replace(/(?<=[a-zāīūñ])R/g, ';r')));
  if (!a || !/[a-z]/i.test(a)) return null;
  if (p.script) return { t: 'f', ro: asciiToScripts(a).ro || v, hi: asciiToScripts(a).hi, ur: p.src };
  return { t: 'a', a: a };
}
function trCustom(pi, form) {
  var h = trOpenPiece(pi), inp = form && form.querySelector ? form.querySelector('input') : null;
  var v = inp ? inp.value.trim() : '';
  var c = h && v ? trCustomChoice(v, h.p) : null;
  if (c) {
    TR.choices[h.p.key] = c;
    trSave('trChoices', TR.choices);
    trRender();
  }
  return false;
}
function trUndo(i) { var k = Object.keys(TR.choices)[i]; if (k != null) delete TR.choices[k]; trSave('trChoices', TR.choices); trRender(); }
function trUndoAll() { TR.choices = {}; trSave('trChoices', TR.choices); trRender(); }

function trCopy() {
  if (!TR.model) trRender();
  var txt = trText(TR.model, TR.script);
  var done = function (ok) {
    TR.msg = ok ? 'Copied.' : 'Copy failed: select the text and copy it.';
    var ms = $('trMsg');
    if (ms) {
      ms.textContent = TR.msg;
      if (TR.msgTimer) clearTimeout(TR.msgTimer);
      TR.msgTimer = setTimeout(function () { if (ms) ms.textContent = ''; TR.msg = ''; }, 2500);
    }
  };
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(txt).then(function () { done(true); }, function () { done(false); }); return; }
  } catch (e) {}
  try {
    var ta = document.createElement('textarea'); ta.value = txt; ta.className = 'sr-only'; document.body.appendChild(ta); ta.select();
    var ok = document.execCommand('copy'); document.body.removeChild(ta); done(ok);
  } catch (e2) { done(false); }
}

var TR_SAMPLE = 'dil-e nadan tujhe hua kya hai\naakhir is dard ki dava kya hai\nhum hain mushtaaq aur vo bezaar\nya ilaahi ye maajra kya hai';
function trSample() { var ta = $('trIn'); if (ta) { ta.value = TR_SAMPLE; trOnInput(); trRender(); } }
function trClear() { var ta = $('trIn'); if (ta) ta.value = ''; TR.open = null; TR.msg = ''; trSave('trText', ''); trRender(); if (typeof setHashQuiet === 'function' && typeof location !== 'undefined' && /^#\/lab\/transcribe/.test(location.hash || '')) setHashQuiet('/lab/transcribe'); }

function mountTranscribe(params) {
  if (typeof TR === 'undefined' || !TR) return;   // a direct load reaches the router before this file's top level has run: the self-mount below picks it up
  var ta = $('trIn');
  if (!ta) return;
  TR.script = trLoad('trScript', 'ro');
  if (!TR_SCRIPTS.some(function (s) { return s[0] === TR.script; })) TR.script = 'ro';
  var saved = trLoad('trChoices', {});
  TR.choices = (saved && typeof saved === 'object') ? saved : {};
  if (params && params.t) ta.value = params.t;
  else if (!ta.value) ta.value = trLoad('trText', '') || '';
  TR.open = null;
  trRender();
}

/* self-mount: this file loads after 21-learn.js's initial handleRoute(), like 23-practice.js */
if (typeof document !== 'undefined') {
  var trSec = document.getElementById('transcribe-section');
  if (trSec && trSec.classList && typeof trSec.classList.contains === 'function' && trSec.classList.contains('on')) mountTranscribe(typeof parseHash === 'function' ? parseHash().params : null);
}
