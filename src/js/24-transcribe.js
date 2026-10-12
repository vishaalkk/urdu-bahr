/* ================= TRANSLITERATOR (#/lab/transcribe) =================
   A whole text between Roman (casual or with Pritchett's diacritics), Urdu script, Fārsī script and Devanagari, in any
   direction: line for line, word by word, no scansion and no couplets. It runs the same pipeline Scan does for a typed line (romanToAscii, then Pue's parsers
   p_di / p_ur / p_hi), so a word comes out as it does in Scan. What it adds is the review:
     - every Roman word is tiered by where its spelling came from (the order casualRomanLine tries):
         known   Pritchett's word list (strict / loose key), a neighbour rule or an alias
         poets   the Rekhta poets' verified list (ROMAN_FALLBACK)
         persian the Persian list (FA_LEXICON, Sufinama's spellings), tried for words the Urdu lists do not have
         loose   Pritchett's laxest match (o~u, e~i): often right, worth a look
         guess   no list knows it: the letter rules read it, short vowels are a guess
         typed   already carries marks (ʿ ā ḥ …) or is a single letter: read exactly as written
     - a tap on a word opens its alternatives; a choice is kept per spelling and applies everywhere that spelling occurs.
   Pure logic (trBuild / trText) is unit-tested in tests/transcribe_logic.js. The DOM part is guarded. */

var TR_LEAD = /^["“”‘’'«»\[{<—–…¿¡]+/;
var TR_TRAIL = /[.,;:!?"“”‘’'«»\]}>—–…،۔؟؛]+$/;
var TR_LETTER = /[a-zāīūñḍṭṛḥṣẓżḳġʿʾ]/i;
var TR_SEVERITY = { guess: 4, loose: 3, persian: 2, you: 1 };
var TR_SCRIPTS = [['ro', 'Roman'], ['ur', 'اردو'], ['fa', 'فارسی'], ['hi', 'हिन्दी']];

/* ---- script helpers ---- */

/* ascii → {ro, hi, ur}: Scan's own helper (19-scan.js) */
function trParse3(ascii) { return asciiToScripts(ascii); }

/* Urdu letters in Persian orthography: ہ ھ → ه, ے ۓ → ی, ں → ن, ۂ → هٔ (the app only had the other direction, faIranianSpelling,
   which prepares Persian for the engine). Letters Persian lacks (ٹ ڈ ڑ) stay: they only occur in Urdu words. */
function trUrToFa(ur) {
  return String(ur || '').replace(/ۂ/g, 'هٔ').replace(/[ہھ]/g, 'ه').replace(/[ےۓ]/g, 'ی').replace(/ں/g, 'ن');
}
/* Arabic-script input spelled the Urdu way: Arabic yeh and kaf, and the Persian heh as ہ */
function trUrSpelling(w) {
  return String(w || '').replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/[هۀة]/g, function (c) { return c === 'ه' ? 'ہ' : 'ۂ'; });
}

/* the Persian list spells hamza / ʿain with a dot (rekhtaMarks' notation) and ḳh as kH; Pritchett's marks instead.
   The word's Urdu spelling settles which a dot is: ع → ʿ, ئ ء ؤ → ʾ. */
function trFaRo(ro, ur) {
  var s = String(ro || '').replace(/kH/g, 'ḳh').replace(/gH/g, 'ġh').replace(/zH/g, 'zh').replace(/\.h/g, 'ḥ');
  var ain = /ع/.test(ur || ''), ham = /[ئءؤ]/.test(ur || '');
  if (ain && !ham) return s.replace(/\./g, 'ʿ');
  if (ham && !ain) return s.replace(/\./g, 'ʾ');
  return s.replace(/\.(e|ī|ii|ai)/g, 'ʾ$1').replace(/\.([aiuāū])/g, 'ʿ$1');
}

/* Persian list by Roman: casual key → [{ur, ro, hi, n}], most frequent first. Built on first use. */
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

/* Persian prefixes and pronominal enclitics/suffixes on Roman words:
   Prefixes: nā- (un-), be- (without), ba- (with/to), ham- (co-), dar- (in), bar- (on)
   Suffixes: -am (my / I am), -at (your), -ash (his/her), -īm (we are), -īd (you are), -and (they are), -ast (is), -hā/-ān (plural) */
var RO_FA_PREFIXES = [
  ['naa', 'نا', 'nā', 'ना'],
  ['na',  'نا', 'nā', 'ना'],
  ['be',  'بے', 'be', 'बे'],
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
  ['im', 'یم', 'īm', 'ीम'], ['eem', 'یم', 'īm', 'ीम']
];

function resolveFaStem(core) {
  if (!core || core.length < 2) return null;
  var hits = trFaHits(core);
  if (hits.length) {
    return { ur: hits[0].ur, ro: hits[0].ro, hi: hits[0].hi || '', stem: hits[0].ro };
  }
  for (var lv = 0; lv <= 2; lv++) {
    var cas = (typeof casualLookup === 'function') ? casualLookup(core, lv, lv) : null;
    if (cas) {
      var p = trParse3(cas);
      return { ur: p.ur, ro: p.ro || core, hi: p.hi || '', stem: cas };
    }
  }
  var normCore = core.replace(/([āa])y([iq])/g, '$1i$2').replace(/yi/g, 'i');
  if (normCore !== core) {
    for (var lv2 = 0; lv2 <= 2; lv2++) {
      var cas2 = (typeof casualLookup === 'function') ? casualLookup(normCore, lv2, lv2) : null;
      if (cas2) {
        var p2 = trParse3(cas2);
        return { ur: p2.ur, ro: p2.ro || core, hi: p2.hi || '', stem: cas2 };
      }
    }
  }
  var fb = (typeof rekhtaFallback === 'function') ? rekhtaFallback(core) : null;
  if (fb) {
    var p3 = trParse3(fb);
    return { ur: p3.ur, ro: p3.ro || core, hi: p3.hi || '', stem: fb };
  }
  return null;
}

function tryFaDecompose(plain) {
  if (!plain || plain.length < 3) return null;
  var raw = plain.toLowerCase().replace(/[-_]/g, '');

  /* 1. Prefix + Stem + Suffix (e.g. naalaaiqam, nalaaiqam, nalayiqam) */
  for (var p = 0; p < RO_FA_PREFIXES.length; p++) {
    var pfx = RO_FA_PREFIXES[p];
    if (raw.length > pfx[0].length + 3 && raw.indexOf(pfx[0]) === 0) {
      var rem = raw.slice(pfx[0].length);
      for (var s = 0; s < RO_FA_SUFFIXES.length; s++) {
        var sfx = RO_FA_SUFFIXES[s];
        if (rem.length > sfx[0].length + 2 && rem.slice(-sfx[0].length) === sfx[0]) {
          var stemStr = rem.slice(0, -sfx[0].length);
          var st = resolveFaStem(stemStr);
          if (st) {
            var isLaiq = /l[aā]+[yi]*q/i.test(stemStr);
            var faStemUr = isLaiq ? 'لایق' : trUrToFa(st.ur);
            var urStem = st.ur;
            var faUr = trUrToFa(pfx[1]) + faStemUr + trUrToFa(sfx[1]);
            var faZwnj = trUrToFa(pfx[1]) + faStemUr + '\u200c' + (sfx[0] === 'am' ? 'ام' : trUrToFa(sfx[1]));
            var urOut = pfx[1] + urStem + sfx[1];
            var roStem = isLaiq ? 'lāyiq' : st.ro;
            var roOut = pfx[2] + '-' + roStem + '-' + sfx[2];
            var hiOut = pfx[3] + '-' + st.hi + '-' + sfx[3];
            return { ur: urOut, fa: faUr, zwnj: faZwnj, ro: roOut, hi: hiOut, stem: roStem, pfx: pfx[2], sfx: sfx[2], morph: pfx[2] + ' + ' + roStem + ' + ' + sfx[2] };
          }
        }
      }
      /* Prefix + Stem (e.g. naadaan, bedaar) */
      if (rem.length >= 2) {
        var stPfx = resolveFaStem(rem);
        if (stPfx) {
          var faStem = trUrToFa(stPfx.ur);
          return {
            ur: pfx[1] + stPfx.ur,
            fa: trUrToFa(pfx[1]) + faStem,
            zwnj: trUrToFa(pfx[1]) + '\u200c' + faStem,
            ro: pfx[2] + '-' + stPfx.ro,
            hi: pfx[3] + '-' + stPfx.hi,
            stem: stPfx.ro,
            pfx: pfx[2],
            morph: pfx[2] + ' + ' + stPfx.ro
          };
        }
      }
    }
  }

  /* 2. Stem + Suffix (e.g. dilam, dastam, aabaadam) */
  for (var s2 = 0; s2 < RO_FA_SUFFIXES.length; s2++) {
    var sfx2 = RO_FA_SUFFIXES[s2];
    if (raw.length > sfx2[0].length + 2 && raw.slice(-sfx2[0].length) === sfx2[0]) {
      var stemStr2 = raw.slice(0, -sfx2[0].length);
      var st2 = resolveFaStem(stemStr2);
      if (st2) {
        var isLaiq2 = /l[aā]+[yi]*q/i.test(stemStr2);
        var faStemUr2 = isLaiq2 ? 'لایق' : trUrToFa(st2.ur);
        var faUr2 = faStemUr2 + trUrToFa(sfx2[1]);
        var faZwnj2 = faStemUr2 + '\u200c' + (sfx2[0] === 'am' ? 'ام' : trUrToFa(sfx2[1]));
        var roStem2 = isLaiq2 ? 'lāyiq' : st2.ro;
        return {
          ur: st2.ur + sfx2[1],
          fa: faUr2,
          zwnj: faZwnj2,
          ro: roStem2 + '-' + sfx2[2],
          hi: st2.hi + '-' + sfx2[3],
          stem: roStem2,
          sfx: sfx2[2],
          morph: roStem2 + ' + ' + sfx2[2]
        };
      }
    }
  }

  return null;
}

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
      var ps = toks[ti].core.split('-');
      ps.forEach(function (p, j) { srcPieces.push(p); tokOf.push({ ti: ti, j: j, hyph: ps.length > 1, joiner: u.length > 1 && (k > 0) && j === 0 }); });
    });
    var asc = useAscii ? atoks[ai++] : null;
    var ap = asc ? asc.split('-') : null;
    var piecewise = ap && ap.length === srcPieces.length;
    if (!piecewise) {
      /* the ascii does not line up piece for piece (a list word with its own hyphen): one opaque piece */
      w.pieces.push({ src: srcPieces.join('-'), ascii: asc || romanToAscii(srcPieces.join('-')), tier: u.length === 1 && srcPieces.length === 1 ? casualPiece(srcPieces[0], 0, false, '', '').tier : 'typed', key: srcPieces.join('-').toLowerCase(), opaque: true });
    } else {
      srcPieces.forEach(function (p, k) {
        var t = tokOf[k], tier;
        if (t.joiner && /^(e|ye|o)$/i.test(p)) tier = 'conn';   // a standalone e / o that Scan's pipeline joins to its neighbour
        else tier = casualPiece(p, t.j, t.hyph, cores[t.ti - 1] || '', cores[t.ti + 1] || '').tier;
        w.pieces.push({ src: p, ascii: ap[k], tier: tier, key: p.toLowerCase() });
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
      var asc = (typeof devToAscii === 'function') ? devToAscii(e.core) : e.core, p = trParse3(asc);
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
  var out = [], seen = {};
  function add(c) {
    if (!c || !c.ro) return;
    var k = (c.ur || '') + '|' + casualKey(c.ro, 0);
    if (!seen[k] && !seen[c.ro]) {
      seen[k] = 1;
      seen[c.ro] = 1;
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
    var p = trParse3(a);
    if (isFa && /[ñں]/.test(p.ur) && !/[ñ]/.test(plain)) {
      if (tag === 'list' || tag === 'loose') return; // suppress Urdu colloquialisms like māñ in Persian context
    }
    add({ ro: p.ro, hi: p.hi, ur: isFa ? trUrToFa(p.ur) : p.ur, ascii: a, tag: tag, isDefault: !!isDefault });
  }
  if (def.fixed) add({ ro: def.fixed.ro, hi: def.fixed.hi, ur: isFa ? trUrToFa(def.fixed.ur) : def.fixed.ur, fixed: def.fixed, tag: 'persian', isDefault: true });
  else viaAscii(def.ascii, 'now', true);

  if (isFa) {
    trFaHits(plain).slice(0, 3).forEach(function (h) {
      add({ ro: h.ro, hi: h.hi, ur: trUrToFa(h.ur), fixed: { ur: h.ur, ro: h.ro, hi: h.hi }, tag: 'persian' });
    });
    var decomp = tryFaDecompose(plain);
    if (decomp) {
      add({ ro: decomp.ro, hi: decomp.hi, ur: decomp.fa || trUrToFa(decomp.ur), fixed: { ur: decomp.fa || decomp.ur, ro: decomp.ro, hi: decomp.hi }, tag: 'persian' });
      if (decomp.zwnj) {
        add({ ro: decomp.ro, hi: decomp.hi, ur: decomp.zwnj, fixed: { ur: decomp.zwnj, ro: decomp.ro, hi: decomp.hi }, tag: 'persian' });
      }
      if (decomp.ur && decomp.ur !== decomp.fa) {
        add({ ro: decomp.ro, hi: decomp.hi, ur: decomp.ur, fixed: { ur: decomp.ur, ro: decomp.ro, hi: decomp.hi }, tag: 'persian' });
      }
    }
  }

  for (var lv = 0; lv <= 2; lv++) {
    var hit = casualLookup(plain, lv, lv);
    if (hit) viaAscii(hit, lv < 2 ? 'list' : 'loose');
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
      add({ ro: decomp2.ro, hi: decomp2.hi, ur: decomp2.ur, fixed: { ur: decomp2.ur, ro: decomp2.ro, hi: decomp2.hi }, tag: 'persian' });
      if (decomp2.fa && decomp2.fa !== decomp2.ur) {
        add({ ro: decomp2.ro, hi: decomp2.hi, ur: decomp2.fa, fixed: { ur: decomp2.fa, ro: decomp2.ro, hi: decomp2.hi }, tag: 'persian' });
      }
      if (decomp2.zwnj) {
        add({ ro: decomp2.ro, hi: decomp2.hi, ur: decomp2.zwnj, fixed: { ur: decomp2.zwnj, ro: decomp2.ro, hi: decomp2.hi }, tag: 'persian' });
      }
    }
  }

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
  var stats = { words: 0, known: 0, poets: 0, persian: 0, loose: 0, guess: 0, you: 0 };
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
          if (ch.t === 'f') p.fixed = { ur: ch.ur || '', ro: ch.ro, hi: ch.hi || '' };
          else { p.fixed = null; p.ascii = ch.a; }
          p.chosen = true; p.baseTier = p.tier; p.tier = 'you';
          return;
        }
        if (!scripted && !p.opaque) {
          if (lineLang === 'fa' && p.src.toLowerCase() === 'man') {
            var mHits = trFaHits('man');
            if (mHits.length) { p.fixed = { ur: mHits[0].ur, ro: mHits[0].ro, hi: mHits[0].hi }; p.baseTier = p.tier; p.tier = 'persian'; }
          } else if (p.tier === 'guess' || lineLang === 'fa') {
            var hits = trFaHits(p.src);
            if (hits.length && (p.tier === 'guess' || lineLang === 'fa')) {
              p.fixed = { ur: hits[0].ur, ro: hits[0].ro, hi: hits[0].hi }; p.baseTier = p.tier; p.tier = 'persian';
            } else {
              var decomp = tryFaDecompose(p.src.toLowerCase());
              if (decomp && (p.tier === 'guess' || lineLang === 'fa')) {
                var chosenUr = (lineLang === 'fa' && decomp.fa) ? decomp.fa : decomp.ur;
                p.fixed = { ur: chosenUr, ro: decomp.ro, hi: decomp.hi, decomp: decomp }; p.baseTier = p.tier; p.tier = 'persian';
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
        var cands = trCands(p, p.def, cLang);
        return cands.length > 1;
      });
      w.hasChoice = hasChoice;
      w.needsCheck = hasChoice || w.tier === 'guess' || w.tier === 'loose';
      if (!w.plain) {
        stats.words++;
        if (stats[w.tier] != null) stats[w.tier]++;
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
  if (!ps.some(function (p) { return p.fixed; })) { o = trParse3(ps.map(function (p) { return p.ascii; }).join('-')); o.fa = trUrToFa(o.ur); return o; }
  var parts = ps.map(function (p) {
    if (p.fixed) return { ro: p.fixed.ro, hi: p.fixed.hi || trParse3(romanToAscii(p.fixed.ro)).hi, ur: p.fixed.ur || trParse3(romanToAscii(p.fixed.ro)).ur, fa: p.fixed.fa || (p.fixed.decomp && p.fixed.decomp.fa) || trUrToFa(p.fixed.ur), conn: false };
    var t = trParse3(p.ascii);
    return { ro: t.ro || p.src, hi: t.hi || p.src, ur: t.ur || p.src, fa: trUrToFa(t.ur), conn: p.tier === 'conn', src: p.src.toLowerCase() };
  });
  var ur = '', fa = '';
  parts.forEach(function (p, i) {
    if (w.zwnj && i > 0) { ur += '\u200c'; fa += '\u200c'; }
    if (p.conn && /^y?e$/.test(p.src) && ur) { ur += 'ِ'; fa += 'ِ'; }
    else if (p.conn && p.src === 'o') { ur += ' و '; fa += ' و '; }
    else { ur += p.ur; fa += (p.fa || trUrToFa(p.ur)); }
  });
  ur = ur.trim();
  fa = fa.trim();
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

var TR = { script: 'ro', open: null, model: null, choices: {}, timer: null, msg: '' };

function trSave(key, val) { try { if (typeof store !== 'undefined' && store.set) store.set(key, val); } catch (e) {} }
function trLoad(key, def) { try { if (typeof store !== 'undefined' && store.get) { var v = store.get(key, def); return v == null ? def : v; } } catch (e) {} return def; }

var TR_TIER_NOTE = {
  known: 'Pritchett’s word list', poets: 'the Rekhta poets’ list', persian: 'the Persian list', loose: 'a loose match: check it',
  guess: 'no list knows it: read from the letters, short vowels are a guess', typed: 'as you typed it', you: 'your correction'
};
var TR_TAG_NOTE = { now: 'as read now', list: 'Pritchett’s list', loose: 'loose match', poets: 'Rekhta poets', persian: 'Persian list', letters: 'from the letters' };

function trScriptAttrs(script) {
  return script === 'ur' ? 'class="tr-res tr-res-ur" lang="ur" dir="rtl"' : script === 'fa' ? 'class="tr-res tr-res-ur" lang="fa" dir="rtl"' : script === 'hi' ? 'class="tr-res tr-res-hi" lang="hi" dir="ltr"' : 'class="tr-res tr-res-ro" lang="ur-Latn" dir="ltr"';
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
    var hasChoice = cands.length > 1 || p.tier === 'guess' || p.tier === 'loose' || p.chosen;
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
  var dictHtml = trDictSectionHtml(w);
  return '<div class="tr-edit" role="group" aria-label="Spellings for ' + escapeHtml(w.src) + '" title="A choice applies to every place this spelling appears.">' + rows.join('') + dictHtml +
    '<button type="button" class="btn ghost sm tr-close" aria-label="Close" onclick="trClose()">×</button></div>';
}

function trDictSectionHtml(w) {
  if (typeof DICT_STORE === 'undefined') return '';
  var src = w.src || '';
  var decomp = (w.pieces && w.pieces[0] && w.pieces[0].fixed && w.pieces[0].fixed.decomp) || null;
  var morphBanner = '';
  if (decomp && decomp.morph) {
    morphBanner = '<div class="tr-dict-morph dim small" style="margin-bottom:var(--sp-2); padding:var(--sp-1) var(--sp-2); background:var(--bg-card); border-radius:var(--radius-sm); font-size:12px;">' +
      '<strong>Morphology:</strong> ' + escapeHtml(decomp.morph) + '</div>';
  }
  if (DICT_STORE.status === 'ready') {
    var hits = DICT_STORE.lookup(src);
    if (!hits.length && w.pieces.length === 1 && w.pieces[0].src) hits = DICT_STORE.lookup(w.pieces[0].src);
    if (!hits.length && decomp && decomp.stem) hits = DICT_STORE.lookup(decomp.stem);
    if (!hits.length) return morphBanner ? '<div class="tr-dict-box">' + morphBanner + '</div>' : '';
    var h = hits[0];
    var org = (typeof DICT_ORIGIN_NAMES !== 'undefined' && DICT_ORIGIN_NAMES[h.origin]) || h.origin || '';
    var badgeCls = h.origin ? 'origin-' + h.origin : 'origin-default';
    var phrasesHtml = (h.phrases && h.phrases.length) ? '<div class="tr-dict-phrases">' +
      h.phrases.slice(0, 3).map(function(ph){ return '<div><em>' + escapeHtml(ph.ro) + '</em>: ' + escapeHtml(ph.def) + '</div>'; }).join('') + '</div>' : '';
    return '<div class="tr-dict-box">' + morphBanner +
      '<div class="tr-dict-head"><span class="tr-dict-title">Platts / Steingass</span>' +
      (org ? '<span class="dict-lex-badge ' + badgeCls + '">' + escapeHtml(org) + '</span>' : '') +
      (h.page ? '<span class="dict-lex-page">p. ' + h.page + '</span>' : '') + '</div>' +
      '<div class="tr-dict-body">' + escapeHtml(h.def) + '</div>' +
      phrasesHtml + '</div>';
  } else if (DICT_STORE.status === 'unloaded') {
    return morphBanner + '<div class="tr-dict-teaser"><button type="button" class="btn link sm" onclick="triggerLoadDictionary()"><span class="icon">📖</span> View Platts / Steingass definition</button></div>';
  } else if (DICT_STORE.status === 'loading') {
    return morphBanner + '<div class="tr-dict-teaser dim small">Loading dictionary…</div>';
  }
  return morphBanner;
}

function trStatsHtml(s) {
  if (!s.words) return '';
  var bits = [s.words + (s.words === 1 ? ' word' : ' words')];
  var check = s.guess + s.loose;
  bits.push(check ? check + ' to check' : 'all verified');
  if (s.you) bits.push(s.you + ' corrected');
  return bits.join(' · ');
}

function trCorrectionsHtml() {
  var keys = Object.keys(TR.choices);
  if (!keys.length) return '';
  var items = keys.map(function (k, i) {   // the handler gets a position, never user text
    var c = TR.choices[k], ro = c.t === 'f' ? c.ro : (trParse3(c.a).ro || c.a);
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
    var edit = (TR.open && TR.open.li === li && l.words[TR.open.wi]) ? trEditHtml(l.words[TR.open.wi], script) : '';
    return '<div class="tr-line">' + body + edit + '</div>';
  }).join('');
  host.innerHTML = html;
  var st = $('trStats'); if (st) st.textContent = trStatsHtml(m.stats);
  var fx = $('trFixes'); if (fx) fx.innerHTML = trCorrectionsHtml();
  var ac = $('trActions'); if (ac) ac.classList.toggle('hidden', !has);
  var em = $('trEmpty'); if (em) em.classList.toggle('hidden', has);
  var lg = $('trLegend'); if (lg) lg.classList.toggle('hidden', !has);
  var sb = $('trScriptBtns');
  if (sb) sb.innerHTML = TR_SCRIPTS.map(function (s) {
    return '<button type="button" class="tr-script-btn' + (TR.script === s[0] ? ' on' : '') + '" aria-pressed="' + (TR.script === s[0]) + '" onclick="trSetScript(\'' + s[0] + '\')">' + s[1] + '</button>';
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
  TR.open = (TR.open && TR.open.li === li && TR.open.wi === wi) ? null : { li: li, wi: wi };
  trRender();
}
function trClose() { TR.open = null; trRender(); }

function trChoiceFor(c) { return c.fixed ? { t: 'f', ro: c.fixed.ro, hi: c.fixed.hi || '', ur: c.fixed.ur || '' } : { t: 'a', a: c.ascii }; }
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
  trSave('trChoices', TR.choices);
  trRender();
}
function trCustom(pi, form) {
  var h = trOpenPiece(pi), inp = form && form.querySelector ? form.querySelector('input') : null;
  var v = inp ? inp.value.trim() : '';
  if (h && v) {
    if (h.p.script) {
      var hi = trParse3(romanToAscii(v)).hi;
      TR.choices[h.p.key] = { t: 'f', ro: v, hi: hi, ur: h.p.src };
    } else TR.choices[h.p.key] = { t: 'a', a: romanToAscii(v) };
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
