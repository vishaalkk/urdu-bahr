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
   are separate, deliberate work.
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
| `#/ghazals/{collection}[/{id}]` | List and reader. Query: `?meter=<id>&q=<text>` |
| `#/guide`, `#/about` | How to use; sources and scanner accuracy |
| `#/lab/tap`, `#/lab/practice` | Unlinked/experimental |
| `#/handbook/chN` | Redirects to that chapter on Pritchett's site (no in-app reader) |

- Navigating away stops playback (`pbCancel`). Last route is stored under `lastRoute`.
- Persistence is `store` / `localStorage`: script, theme, settings (voice, tempo, foot gap, drum, ASCII), `lastRoute`,
  per-tab last sub-tab, `stats`.

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
