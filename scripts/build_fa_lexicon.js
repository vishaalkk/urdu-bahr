// data/sufinama_ghazals.json (Persian kalaam) -> data/fa_lexicon.json: {Urdu-script word key: [Roman, Devanagari, times seen]},
// the Persian word list the app uses for Fārsī lines (src/js/05-translit-helpers.js faWordScripts). Kept apart from the Urdu maps:
// it never feeds WORD_ASCII_MAP or ROMAN_CASUAL_MAP. Girah lines (Urdu inside Persian kalaam) are left out.
//   node scripts/build_fa_lexicon.js
const fs = require('fs'), path = require('path');
const { mine, finalize, withVerbs, PERSIAN } = require('./lib_fa_lexicon');
const { lineLang } = require('./lib_scan');
const root = path.join(__dirname, '..');
const ghazals = JSON.parse(fs.readFileSync(path.join(root, 'data/sufinama_ghazals.json'), 'utf8')).filter(PERSIAN)
    .map(g => Object.assign({}, g, { lines: g.lines.filter(l => lineLang(l.ro, 'fa') === 'fa') }));
const lex = withVerbs(finalize(mine(ghazals)));   // + verb forms Sufinama never showed (lib_fa_verbs.js)
fs.writeFileSync(path.join(root, 'data/fa_lexicon.json'), JSON.stringify(lex, null, 0).replace(/\],"/g, '],\n"') + '\n');
console.log(`${Object.keys(lex).length} Persian words from ${ghazals.length} ghazals -> data/fa_lexicon.json`);
