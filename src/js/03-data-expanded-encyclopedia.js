/* ================= DATA: EXPANDED ENCYCLOPEDIA ================= */
const HANDBOOK_DATA = /*@@HANDBOOK_DATA@@*/;
const EXERCISES_DATA = /*@@EXERCISES_DATA@@*/;
const METERS_DATA = /*@@METERS_DATA@@*/;
const GLOSSARY_DATA = /*@@GLOSSARY_DATA@@*/;
const BIBLIOGRAPHY_DATA = /*@@BIBLIOGRAPHY_DATA@@*/;
const METER_MAP_DATA = /*@@METER_MAP_DATA@@*/;
const GHALIB_EXT_DATA = unpackList(/*@@GHALIB_EXT_DATA@@*/);
const MIR_EXT_DATA = unpackList(/*@@MIR_EXT_DATA@@*/);
/* The verse collections (the Rekhta poets, Ghalib, Mir) ship as a word dictionary + id lines (scripts/pack_verses.py): the same poem in
   three or four scripts is what made them 2.6 MB gzipped, and each word has one form in each script. A packed line is
   [[word ids], gaps]: for every break between words, one bit per script says hyphen (1) or space (0), hi = 1, ro = 2, ascii = 4.
   Lines that did not split into the same words stay plain objects. Unpacking gives back exactly the source data
   (tests/packed_data.js checks it). */
function unpackLines(fields, D, lines) {
  return lines.map(l => {
    if (!Array.isArray(l)) return l;
    const out = {};
    fields.forEach(f => { out[f] = ''; });
    l[0].forEach((id, i) => {
      const w = D[id];
      if (i) {
        const c = l[1].charCodeAt(i - 1) - 48;
        out.ur += ' ';
        for (let j = 1; j < fields.length; j++) out[fields[j]] += ((c >> (j - 1)) & 1) ? '-' : ' ';
      }
      for (let j = 0; j < fields.length; j++) out[fields[j]] += w[j];
    });
    return out;
  });
}
function unpackList(p) {
  return p.g.map(g => { g.lines = unpackLines(p.f, p.dict, g.lines); return g; });
}
function unpackPoets(p) {
  const ghazals = {};
  for (const key in p.g) ghazals[key] = p.g[key].map(g => { g.lines = unpackLines(p.f, p.dict, g.lines); return g; });
  return { poets: p.poets, legacy: p.legacy, ghazals };
}
const POETS_DATA = unpackPoets(/*@@POETS_DATA@@*/);
/* Poet collections (Rekhta; see scripts/build_poets.py). Each ghazal here gets its poet's name and collection key, so code
   written for one flat list of ghazals (Look up, drills, search) can read them like Ghalib or Mir. */
const POET_LIST = POETS_DATA.poets;                        // [{key, name, ur, hi, aliases, count}], alphabetical
const POET_KEYS = new Set(POET_LIST.map(p => p.key));
POET_LIST.forEach(p => (POETS_DATA.ghazals[p.key] || []).forEach(g => {
  g.poet = p.name; g.col = p.key;
  if (!g.verified) g.lines.forEach(l => { l.rk = 1; });   // Rekhta line: scans with its Roman's hints (lineScanText)
  if (g.fa) g.lines.forEach((l, i) => { if (g.fa[i]) l.fa = g.fa[i]; });
  /* each line's language: the ghazal's, except its xl lines (an Urdu girah in Persian kalaam, a Persian misra in Khusrau's Hindavi) */
  if (g.lang || g.xl) { const xl = new Set(g.xl || []), other = g.lang === 'fa' ? 'ur' : 'fa';
    g.lines.forEach((l, i) => { const lang = xl.has(i) ? other : (g.lang || 'ur'); if (lang === 'fa') l.lang = 'fa'; }); }   // Persian line in Iranian spelling (Ganjoor): shown in Urdu script mode
  /* a Persian line knows its ghazal (not enumerable, so never copied or serialised): scanCorpusLine asks whether it is a mustazād */
  if (g.lang === 'fa') g.lines.forEach(l => { if (l.lang === 'fa') Object.defineProperty(l, 'faG', { value: g, configurable: true }); });
}));
function isPoetCol(col) { return POET_KEYS.has(col); }
function poetItems(key) { return POETS_DATA.ghazals[key] || []; }
function poetMeta(key) { return POET_LIST.find(p => p.key === key) || null; }
/* every poet ghazal as [collection key, items] pairs, for code that walks all collections */
function poetCollections() { return POET_LIST.map(p => [p.key, poetItems(p.key)]); }
const URDUPOETRY_DATA = /*@@URDUPOETRY_DATA@@*/;
const WORD_ASCII_MAP = /*@@WORD_ASCII_MAP@@*/;
const ROMAN_CASUAL_MAP = /*@@ROMAN_CASUAL_MAP@@*/;
const KI_NEXT = /*@@KI_NEXT@@*/;
const ROMAN_FALLBACK = /*@@ROMAN_FALLBACK@@*/;
const COLLOCATIONS = /*@@COLLOCATIONS@@*/;
/* Persian words (scripts/build_fa_lexicon.js): {key: [Roman, Devanagari, times seen]}, for Fārsī lines only (faWordScripts) */
const FA_LEXICON = /*@@FA_LEXICON@@*/;
/* Persian verb forms (scripts/lib_fa_verbs.js via data/fa_scan.json): where an iẓāfat cannot go (faIzafatSlots) */
const FA_VERBS = /*@@FA_VERBS@@*/;
window.METER_MAP_DATA = METER_MAP_DATA;

