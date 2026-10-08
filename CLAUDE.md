# Bahr — project guide

Interactive Urdu meter (bahr) handbook and scanner. Single-file app: `src/` + `data/` are built into `index.html`.
Design rules live in `docs/DESIGN_PRINCIPLES.md` — read it before touching any UI.

## Workflow rules

1. **Never hand-edit `index.html`** (build output). Edit `src/` or `data/`, then `npm run build`.
2. **Commit the rebuilt `index.html` with the source change.** CI fails if the committed file differs from a fresh build.
3. **`npm test` before pushing** (`scripts/check.sh`: build + every suite). It gates the GitHub Pages deploy.
4. **Preview on `localhost:8000`** (the user's own server). Never start a server on another port.
5. **Offline-first, zero runtime network requests.** No CDN fonts, scripts or stylesheets. Fonts are bundled in
   `src/fonts` and inlined at build.
6. **Do not touch the scansion engine** (`src/js/01-engine.js` block from `(function(root){ 'use strict'; /* ---------- meters`
   to `})(this);`). `tests/corpus_scan.js` slices the source on those exact strings. Engine and transliteration changes
   are separate, deliberate work. The one routine exception is lexicon data: words are added to the unwritten-tashdid block
   with `scripts/find_tashdid_words.js`, one reading at cost 0 each (several tie across meters and flip Ghalib/Mir results),
   and only if `node tests/benchmark.js` stays at its floors.
7. **Nothing may regress Fran's Ghalib/Mir transliteration and meters.** `tests/benchmark.js` enforces floors in
   `tests/benchmark_baseline.json`; raise a floor only with `--update`, never lower it.
8. **No inline `style=""` for anything visual**, in markup or JS template strings. Use classes and tokens.
9. **One agent per file at a time**; shared files (`base.css`, `manifest.json`, `scripts/build_app.py`, `test_runtime.py`)
   are edited serially.

## Architecture

- `src/head.html`, `src/body/*.html` (one partial per section), `src/styles/*.css`, `src/js/NN-name.js` (concatenated in
  `src/manifest.json` order), `src/fonts/`. `scripts/build_app.py` concatenates and injects `data/*.json` at
  `/*@@NAME@@*/` placeholders.
- Hash router in `src/js/02-store.js` (`handleRoute`). Never assume a view's DOM exists; `go(id)` is a legacy shim.

| Route | View |
|---|---|
| `#/home` | Landing page (what a bare URL opens) |
| `#/weight/{learn\|drill\|lookup}` | Weight |
| `#/meter/{learn\|drill\|lookup}` | Meter (`?open=<famId>`, `?meter=<id>`) |
| `#/scan` | Scan (`?g=ghalib/21` scans a ghazal by reference) |
| `#/ghazals/{collection}[/{id}]` | List and reader; collection = `handbook`, `ghalib`, `mir` or a poet key (`jaun`, `faiz`, …; the Poets ▾ picker). `#/ghazals/others[/N]` redirects. Query: `?meter=<id>&q=<text>` |
| `#/guide`, `#/about` | How to use; sources and scanner accuracy |
| `#/lab/tap`, `#/lab/practice` | Unlinked/experimental |
| `#/handbook/chN` | Redirects to that chapter on Pritchett's site (no in-app reader) |

- **Poets** (Rekhta): `data/poets_extended.json`, built by `scripts/build_poets.py`, is the shipped data (one collection per poet; ids
  are stable, matched by Rekhta URL; each ghazal links to its Rekhta page). Pipeline, all local: `scripts/import_*.py` (scrape) →
  `data/poets/` → `node scripts/scan_poets.js` (meter per ghazal through the real engine, `scripts/lib_scan.js`) →
  `data/poets_scanned/` → `build_poets.py`. The scrape and scan folders are gitignored. Rekhta lines are scanned with the izafat,
  tashdid and pen-name hints their Roman gives (`rekhtaScanText` / `lineScanText`, `src/js/05-translit-helpers.js`). Poet data does NOT
  feed `WORD_ASCII_MAP`, `ROMAN_CASUAL_MAP` or the known-verse index: Rekhta's Roman must not override Pritchett's.
- **Persian** (plan and status: `docs/PERSIAN_PLAN.md`): Sufinama kalaam `scripts/import_sufinama.py` → `node scripts/scan_sufinama.js`
  (Persian-aware: line `lang`, no `H` on Persian lines) → `build_poets.py` (ghazal `lang`, `xl`, Ganjoor `gj`/`fa`). Gold:
  `scripts/match_ganjoor.py` → `tests/data/persian_gold.json`; `tests/benchmark_fa.js` gates it. Ganjoor meters:
  `scripts/build_fa_meters.py` → `data/persian_meters.json` (the circles' Persian status; key rule mirrored in `faMeterKey`).
  Persian engine `window.ScanFa`: `build_app.py` splices `data/fa_scan.json` (`scripts/build_fa_scan.js`) into a second copy of the
  engine block; Persian lines (`l.lang === 'fa'`) scan on it via `scanCorpusLine` / `engineOf`. Persian-only meter ids are `F<Ganjoor id>`.
  Persian word list `data/fa_lexicon.json` (`scripts/build_fa_lexicon.js`) for Fārsī Roman/Devanagari only.
- **Collocations**: `data/collocations.json` (`scripts/build_collocations.py`) holds neighbour rules for typed Roman
  (`collocSpelling` in `05-translit-helpers.js`). Judge changes with `scripts/colloc_benchmark.py` and `scripts/casual_roman_eval.js`
  (typed Roman → right Urdu word, table mined without the test poets). `tests/benchmark.js` `typed.*` goes the other way (Urdu → Roman)
  and cannot see them.
- Navigating away stops playback (`pbCancel`). Last route is stored under `lastRoute`.
- Persistence is `store` / `localStorage`: script, theme, settings (voice, tempo, foot gap, drum, ASCII), `lastRoute`,
  per-tab last sub-tab, `stats`, `poetLang` (Poets picker language).

## Gotchas

- `setScriptMode` must re-render every mounted verse view (meter labels, lists, reader, drills, filter options). Script
  switching must not change scroll position.
- `test_runtime.py` runs the inline scripts in a sandbox with a mocked `getElementById`. New code must tolerate missing
  elements (guard `$()` results).
- Meter ids mix numbers, arrays (`[14,15]`) and strings (`R1…R12`, `H`). Normalise to strings in filter and label code.
- Prefer a verse's **stored Roman** over `urduToRoman`, which is a letter map that cannot see short vowels
  (`ban` → `bn`). Use `wordRomanMap(line, res)` or the corpus `ro` field.
- Scan edits are a learner exercise, judged against the **original** bahr, even if the edited line fits another meter.
  Any new validator rule must cite a handbook section.
- Every `.btn` and tag already has a flat style; adding a one-off high-specificity override (especially in
  `#weight-section` / `#meter-section` / `#ghazals-section`) will fight it. Edit the shared rule instead.

## Out of scope (parked)

- Tap / Echo a bahr and tap-to-scan: code kept reachable at `#/lab/tap`, not linked, not deleted.
- Nastaliq web font embedding (Noto Nastaliq Urdu is large); currently relies on installed fonts.
- Rhythm roll and the meter map (kept on disk in `features/`, not in the app).
