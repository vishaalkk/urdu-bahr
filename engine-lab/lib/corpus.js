/* Load the three evaluation corpora into one shape:
   { corpus, gid, label, gold:Set<string>, lines:[{ascii, ur, clean:{notes}}] }
   Gold meter ids come from Pritchett's page labels (Ghalib Gn, Mir Mn) via the mappings in
   scripts/incorporate_ghalib.js and docs/reviews/14-mir-corpus-integration.md, and from the
   handbook's own answers for the 24 exercise ghazals. Mir is loaded from the FULL scrape
   (data/mir_corpus.json), not mir_extended.json, because the latter was filtered by the
   current engine's own pass rate (>= 90%) and would flatter it. */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const { cleanLine } = require('./ascii.js');

const G_MAP = { G1:[10], G2:[26], G3:[5], G4:[20], G5:[18,19], G6:[36], G7:[27], G8:[14,15], G9:[33,34], G10:[4], G11:[16,17],
  G12:[28], G13:[8], G14:[11], G15:[25], G16:[35], G17:[23], G18:[7], G19:[9,1] };
const M_MAP = { M1:['H'], M3:[3], M4:[4], M5:[5], M6:[7], M7:[8], M8:[9,1], M10:[10], M11:[11], M12:[14,15], M13:[18,19],
  M18:[24], M20:[26], M21:[27], M22:[28], M23:[29], M24:[30], M25:[33,34], M27:[36], M28:[37] };

const read = f => JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8'));
let cache = {};
function load(name){
  if(cache[name]) return cache[name];
  let out = [];
  if(name === 'ghalib'){
    for(const g of read('ghalib_extended.json')){
      const gold = G_MAP[g.meter_label]; if(!gold) continue;
      out.push({ corpus:'ghalib', gid:'G' + g.id, label:g.meter_label, gold:new Set(gold.map(String)),
        lines: g.lines.map(l => ({ ascii: cleanLine(l.ascii).text, ur: l.ur, notes: cleanLine(l.ascii).notes })) });
    }
  } else if(name === 'mir'){
    const pue = require('./pue.js').load();
    for(const g of read('mir_corpus.json')){
      const gold = M_MAP[g.meter_label]; if(!gold) continue;
      const lines = g.lines.map(l => { const c = cleanLine(l); return { ascii: c.text, ur: pue.ur(c.text) || '', notes: c.notes }; }).filter(l => l.ascii);
      if(lines.length) out.push({ corpus:'mir', gid:'M' + g.id, label:g.meter_label, gold:new Set(gold.map(String)), lines });
    }
  } else if(name === 'exercises'){
    for(const g of read('exercises_verified.json')){
      out.push({ corpus:'exercises', gid:'E' + g.id, label: g.meters.join('/'), gold:new Set(g.meters.map(String)), poet:g.poet,
        lines: g.lines.map(l => ({ ascii: cleanLine(l.ascii).text, ur: l.ur, notes: cleanLine(l.ascii).notes })) });
    }
  }
  cache[name] = out;
  return out;
}
/* Urdu as it is usually printed: no zer/zabar/pesh/shadda/tanvin/dagger alif (U+064B-0652, 0670) */
function stripHarakat(s){ return (s || '').normalize('NFC').replace(/[ً-ْٰ]/g, ''); }
module.exports = { load, stripHarakat, G_MAP, M_MAP };
