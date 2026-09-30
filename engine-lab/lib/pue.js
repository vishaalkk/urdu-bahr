/* Load Sean Pue's ghalib.js transliteration parsers (pritchett_scripts/, Apache-2.0,
   (c) 2015 Michigan State University) into node without touching the app build.
   Exposes ur / hi / ro(diacritics) parsers: ASCII (Pritchett scheme) -> script.
   The upstream files are browser globals, so they are evaluated in a vm context. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const DIR = path.join(__dirname, '..', '..', 'pritchett_scripts');
let cached = null;
function load(){
  if(cached) return cached;
  const ctx = { window:{}, console:{ log(){}, warn(){}, error(){} } };
  vm.createContext(ctx);
  for(const f of ['urdu_parser_data.js','devanagari_parser_data.js','diacritics_parser_data.js','ghalib.js'])
    vm.runInContext(fs.readFileSync(path.join(DIR,f),'utf8'), ctx, {filename:f});
  vm.runInContext("window.p_di = new Parser('diacritics', diacritics_tokens, diacritics_token_regex, diacritics_graph, diacritics_onmatch);", ctx);
  const wrap = p => s => { try { return p.parse(s).trim(); } catch(e){ return null; } };
  cached = { ur: wrap(ctx.window.p_ur), hi: wrap(ctx.window.p_hi), ro: wrap(ctx.window.p_di) };
  return cached;
}
module.exports = { load };
