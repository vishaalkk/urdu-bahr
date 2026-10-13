// Shared by the benchmarks (tests/benchmark_*.js, tests/typed_roman_heldout.js, scripts/casual_roman_eval.js): what counts as the
// same word in each script, and the floors.
//   typedRoman   a Rekhta Roman line as a casual typist writes it: no diacritics, ñ → n, dotted letters plain (ṭ → t)
//   urNorm       an Urdu word with its optional marks dropped and Arabic letter forms folded (ي → ی, ك → ک, ۂ → ہ)
//   roFold       a Roman word: Pritchett's ā and Rekhta's aa agree, dots and ʿ ʾ drop, ñ (nūn ghunna) stays
//   foldNasal    Devanagari ँ = ं (Pue's parser writes either for the same nasal, depending on what it parsed before)
//   hiFold       a Devanagari word: nukta dropped, nasals folded, letters only
//   INFLECTED    an Urdu word with a plural / oblique / verb ending (-oñ -eñ -iyāñ -e, -ī after a vowel) on a stem of 2+ letters
//   checkFloors  compare this run with the floors file: a fall fails; --update raises the floors to this run (never lowers one)
const fs = require('fs'), path = require('path');

const typedRoman = ro => ro.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ñ/g, 'n').replace(/[ḍṭṛḳġṣẓżḥ]/gi, c => c.normalize('NFD')[0]);
const urNorm = w => w.normalize('NFC').replace(/[ً-ٰٟـّٔؔ‌‍]/g, '')
    .replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/[ۂۀ]/g, 'ہ').replace(/[^ء-ۿ]/g, '');
const roFold = w => w.normalize('NFC').toLowerCase().replace(/ā/g, 'aa').replace(/ī/g, 'ii').replace(/ū/g, 'uu').replace(/ñ/g, 'N')
    .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zN]/g, '').replace(/w/g, 'v');
const foldNasal = h => String(h || '').replace(/ँ/g, 'ं');
const hiFold = w => foldNasal(w.normalize('NFC').replace(/़/g, '')).replace(/[^ऀ-ॿ]/g, '');
const INFLECTED = /..(?:وں|یں|یاں|ئیں|ئے|ئی|ے)$/;

/* now: {metric: percent, n: count}; keys: the metrics with floors. Returns the exit code. A metric missing from the floors file
   (new) is reported, not failed. opts.readOnly: never write (a comparison run). */
function checkFloors(file, now, keys, opts = {}) {
    const root = path.join(__dirname, '..'), update = process.argv.includes('--update');
    const base = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
    if (base) console.log('  floors: ' + keys.map(k => `${k} ${base[k] != null ? base[k] + '%' : '-'}`).join(', '));
    const fell = base ? keys.filter(k => base[k] != null && now[k] < base[k]) : [];
    if (fell.length) { console.log('FAIL: below the floor: ' + fell.join(', ')); if (opts.onFail) opts.onFail(); return 1; }
    if (opts.readOnly) return 0;
    if (!base || update) {
        const next = { n: now.n };
        keys.forEach(k => { next[k] = base && base[k] != null ? Math.max(base[k], now[k]) : now[k]; });
        fs.writeFileSync(file, JSON.stringify(next, null, 2) + '\n');
        console.log('floors written -> ' + path.relative(root, file));
    } else if (keys.some(k => base[k] == null || now[k] > base[k])) console.log('improved or new: run with --update to raise the floors');
    return 0;
}

module.exports = { typedRoman, urNorm, roFold, foldNasal, hiFold, INFLECTED, checkFloors };
