// The built page (index.html) run in a vm with a DOM stub rich enough that its top level (script mode, router) runs to the end.
// Shared by the Transcribe / dictionary tests and benchmarks (and scripts/build_transcribe_golden.js); folds and floors are in
// tests/lib_bench.js. withDict: also load the Platts + Steingass
// bundle (data/dictionary_bundle.json.gz), as the browser does from IndexedDB once the Transcribe drawer has opened.
const fs = require('fs'), path = require('path'), vm = require('vm'), zlib = require('zlib');

function loadPage({ withDict = false } = {}) {
    const root = path.join(__dirname, '..');
    const html = fs.readFileSync(process.env.URDU_BAHR_HTML || path.join(root, 'index.html'), 'utf8');
    const scripts = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
    const domStore = {};
    const elBase = id => ({ id, classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, querySelectorAll: () => [], querySelector: () => null,
        textContent: '', innerHTML: '', value: '', style: {}, children: [], dataset: {} });
    const makeElement = id => new Proxy(elBase(id), { get: (t, k) => (k in t || typeof k === 'symbol') ? t[k] : () => null, set: (t, k, v) => { t[k] = v; return true; } });
    const el = id => domStore[id] || (domStore[id] = makeElement(id));
    const ctx = {
        window: {}, document: { getElementById: el, querySelectorAll: () => [], querySelector: s => makeElement(s), addEventListener() {}, documentElement: makeElement('html') },
        $: el, console: { log() {}, warn() {}, error() {} }, setTimeout: fn => { fn(); return 1; }, clearTimeout() {}, setInterval() {}, clearInterval() {},
        AudioContext: function () { return {}; }, localStorage: { getItem: () => null, setItem() {}, removeItem() {} }
    };   // (the Pue parsers log every character they cannot read: console is muted)
    vm.createContext(ctx);
    scripts.slice(0, 2).forEach(s => vm.runInContext(s.replace(/<\/?script[^>]*>/gi, ''), ctx));
    const run = c => vm.runInContext(c, ctx);
    if (withDict) {
        ctx.__dict = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(root, 'data', 'dictionary_bundle.json.gz'))));
        run(`DICT_STORE.initEntries(__dict); DICT_STORE.status = 'ready'; delete this.__dict;`);
    }
    return { ctx, run };
}

module.exports = { loadPage };
