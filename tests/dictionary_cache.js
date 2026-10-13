// The Transcribe drawer's dictionary is downloaded once and kept in IndexedDB, under the fingerprint the build stamps on the page
// (DICT_BUNDLE_HASH: data/dictionary_bundle.json.gz's SHA-1). DICT_STORE.load(), with an in-memory IndexedDB and a counting fetch:
//   1. first visit: one download (the URL carries the fingerprint), saved with it; the hand-versioned _v1/_v2 copies are deleted
//   2. revisit: no download
//   3. a rebuilt dictionary (a page with another fingerprint): one download, saved with the new fingerprint
//   4. revisit after it: no download
// Run after `npm run build`: node tests/dictionary_cache.js
const fs = require('fs'), path = require('path'), os = require('os');
const { loadPage } = require('./lib_page');
const ROOT = path.join(__dirname, '..');
const gz = fs.readFileSync(path.join(ROOT, 'data', 'dictionary_bundle.json.gz'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const hash = (html.match(/const DICT_BUNDLE_HASH = "([0-9a-f]{12})"/) || [])[1];
let bad = 0;
const ok = (c, m) => { if (!c) { bad++; console.log('FAIL: ' + m); } };
ok(hash, 'the page carries a 12-digit DICT_BUNDLE_HASH');

/* just enough IndexedDB for DICT_STORE: open (with upgrade), one object store, get / put, deleteDatabase */
const dbs = {}, deleted = new Set();
const fakeIDB = {
    deleteDatabase(n) { deleted.add(n); delete dbs[n]; },
    open(name) {
        const req = {};
        setTimeout(() => {
            const fresh = !dbs[name], store = dbs[name] || (dbs[name] = new Map());
            req.result = { objectStoreNames: { contains: () => true }, createObjectStore() {},
                transaction() {
                    const tx = { objectStore: () => ({
                        get(k) { const r = {}; setTimeout(() => { r.result = store.get(k); r.onsuccess && r.onsuccess(); }); return r; },
                        put(v, k) { store.set(k, v); setTimeout(() => tx.oncomplete && tx.oncomplete()); } }) };
                    return tx;
                } };
            if (fresh && req.onupgradeneeded) req.onupgradeneeded();
            req.onsuccess && req.onsuccess();
        });
        return req;
    }
};
const fetched = [];
async function visit(page) {
    if (page) process.env.URDU_BAHR_HTML = page; else delete process.env.URDU_BAHR_HTML;
    const { ctx, run } = loadPage();
    Object.assign(ctx, { indexedDB: fakeIDB, Response, DecompressionStream, fetch: async u => { fetched.push(u); return new Response(gz); } });
    const before = fetched.length;
    await run('DICT_STORE.load()');
    await new Promise(r => setTimeout(r, 20));   // the save is not awaited by load()
    return { downloads: fetched.slice(before), entries: run('DICT_STORE.entries.length'), saved: (dbs.urdu_bahr_lexicon && dbs.urdu_bahr_lexicon.get('all') || {}).hash };
}

(async () => {
    dbs.urdu_bahr_lexicon_v2 = new Map([['all', [1, 2, 3]]]);   // an old hand-versioned copy
    const v1 = await visit();
    ok(v1.downloads.length === 1 && v1.downloads[0].endsWith('?v=' + hash), 'first visit downloads once, with the fingerprint: ' + v1.downloads);
    ok(v1.entries > 100000 && v1.saved === hash, 'first visit loads the dictionary and saves it with its fingerprint');
    ok(deleted.has('urdu_bahr_lexicon_v1') && deleted.has('urdu_bahr_lexicon_v2') && !dbs.urdu_bahr_lexicon_v2, 'the hand-versioned copies are deleted');
    const v2 = await visit();
    ok(v2.downloads.length === 0 && v2.entries === v1.entries, 'a revisit uses the saved copy: ' + v2.downloads.length + ' downloads');
    const rebuilt = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'dict-cache-')), 'index.html');
    fs.writeFileSync(rebuilt, html.replace(`const DICT_BUNDLE_HASH = "${hash}"`, 'const DICT_BUNDLE_HASH = "0123456789ab"'));
    const v3 = await visit(rebuilt);
    ok(v3.downloads.length === 1 && v3.saved === '0123456789ab', 'a rebuilt dictionary (new fingerprint) is downloaded again and saved with it');
    const v4 = await visit(rebuilt);
    ok(v4.downloads.length === 0, 'and only once: ' + v4.downloads.length + ' downloads on the revisit');
    fs.rmSync(path.dirname(rebuilt), { recursive: true, force: true });
    console.log(bad ? `${bad} FAILED` : 'dictionary cache: downloads on a new fingerprint only (4 visits checked)');
    process.exit(bad ? 1 : 0);
})();
