// Generated data must match what its builder makes from today's code and sources: a code change whose data was not rebuilt is
// caught here, not months later (data/fa_scan.json once sat stale in the repo while the Persian helpers it is built with changed).
// Each builder writes to a temporary file, which must equal the committed one byte for byte:
//   data/roman_fallback.json   scripts/build_roman_fallback.js   (typed-Roman words the poets have and Pritchett's lists lack)
//   data/fa_scan.json          scripts/build_fa_scan.js          (what the Persian engine ScanFa adds)
//   data/lang_words.json       scripts/build_lang_words.js       (line-language word weights)
//   data/typing_costs.json     scripts/learn_typing.js           (how native speakers type each sound, from Dakshina's train split)
// Builders that read the built page need it current: run after `npm run build`.   Run: node tests/derived_data.js
const fs = require('fs'), path = require('path'), os = require('os');
const { execFileSync } = require('child_process');
const root = path.join(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'derived-'));
/* [file, builder, sources only some checkouts have]: a builder whose local-only sources are missing (CI) is skipped, not failed */
const BUILDS = [
    ['data/roman_fallback.json', 'scripts/build_roman_fallback.js', []],
    ['data/fa_scan.json', 'scripts/build_fa_scan.js', ['data/sufinama_ghazals.json']],   // the Sufinama scrape is gitignored
    ['data/lang_words.json', 'scripts/build_lang_words.js', []],
    ['data/typing_costs.json', 'scripts/learn_typing.js', ['source_data/dakshina/dakshina_dataset_v1.0/ur/lexicons/ur.translit.sampled.train.tsv']]   // Dakshina's train split is kept locally
];
let bad = 0;
for (const [file, script, local] of BUILDS) {
    const missing = local.filter(f => !fs.existsSync(path.join(root, f)));
    if (missing.length) { console.log(`  - ${file}: skipped (its builder needs ${missing.join(', ')}, kept locally only)`); continue; }
    const out = path.join(tmp, path.basename(file));
    execFileSync('node', [path.join(root, script), '--out', out], { stdio: 'ignore' });
    const same = fs.readFileSync(out).equals(fs.readFileSync(path.join(root, file)));
    if (!same) bad++;
    console.log(`  ${same ? '✓' : '✗'} ${file}${same ? '' : `: stale, rebuild it with node ${script} (then npm run build)`}`);
}
fs.rmSync(tmp, { recursive: true, force: true });
console.log(bad ? `${bad} STALE` : 'derived data: current');
process.exit(bad ? 1 : 0);
