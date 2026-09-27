const fs = require('fs');
global.window = global;

eval(fs.readFileSync('pritchett_scripts/urdu_parser_data.js', 'utf8'));
eval(fs.readFileSync('pritchett_scripts/devanagari_parser_data.js', 'utf8'));
eval(fs.readFileSync('pritchett_scripts/diacritics_parser_data.js', 'utf8'));
eval(fs.readFileSync('pritchett_scripts/ghalib.js', 'utf8'));
global.p_di = new Parser('diacritics', diacritics_tokens, diacritics_token_regex, diacritics_graph, diacritics_onmatch);

// Check all 4 files
const files = [
  'source_data/10_ex_01_06.html',
  'source_data/10_ex_07_12.html',
  'source_data/10_ex_13_18.html',
  'source_data/10_ex_19_24.html'
];

let allParsedGhazals = [];
for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  const blocks = html.split(/GHAZAL\s+/i).slice(1);
  for (const block of blocks) {
    const m = block.match(/^([A-Z0-9\-]+)\s+by\s+([^,:\n<]+)/i);
    if (!m) continue;
    const numRaw = m[1].trim();
    const poet = m[2].trim();
    
    const ems = [];
    const re = /<em class=["']urdu["']>([\s\S]*?)<\/em>/gi;
    let match;
    while ((match = re.exec(block)) !== null) {
      const txt = match[1].replace(/<br\s*\/?>/gi, '\n').replace(/&nbsp;/gi, ' ').trim();
      const lines = txt.split('\n').map(l => l.trim()).filter(Boolean);
      ems.push(...lines);
    }
    
    if (ems.length === 0) continue;
    
    const sample = ems[0] || '';
    allParsedGhazals.push({
      numRaw,
      poet,
      lines_count: ems.length,
      sample_ascii: sample,
      sample_urdu: window.p_ur.parse(sample),
      sample_diacritics: window.p_di.parse(sample)
    });
  }
}

console.log('Total ghazals audited in exercise HTMLs:', allParsedGhazals.length);
allParsedGhazals.forEach((g, i) => {
  console.log(`${i+1}. Ghazal ${g.numRaw} (${g.poet}) - ${g.lines_count} lines | Sample: ${g.sample_urdu} [${g.sample_diacritics}]`);
});
