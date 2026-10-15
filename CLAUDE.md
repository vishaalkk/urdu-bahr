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
| `#/lab/tap`, `#/lab/practice`, `#/lab/transcribe` | Unlinked/experimental (`?t=<text>` pre-fills the Transliterator) |
| `#/handbook/chN` | Redirects to that chapter on Pritchett's site (no in-app reader) |

- **Poets** (Rekhta): `data/poets_extended.json`, built by `scripts/build_poets.py`, is the shipped data (one collection per poet; ids
  are stable, matched by Rekhta URL; each ghazal links to its Rekhta page). Pipeline, all local: `scripts/import_*.py` (scrape) →
  `data/poets/` → `node scripts/scan_poets.js` (meter per ghazal through the real engine, `scripts/lib_scan.js`) →
  `data/poets_scanned/` → `build_poets.py`. The scrape and scan folders are gitignored. Rekhta lines are scanned with the izafat,
  tashdid and pen-name hints their Roman gives (`rekhtaScanText` / `lineScanText`, `src/js/05-translit-helpers.js`). Poet data does NOT
  feed `WORD_ASCII_MAP`, `ROMAN_CASUAL_MAP` or the known-verse index: Rekhta's Roman must not override Pritchett's.
- **Persian** (plan and status: `docs/PERSIAN_PLAN.md`): Sufinama kalaam `scripts/import_sufinama.py` → `node scripts/scan_sufinama.js`
  (Persian-aware: line `lang`, no `H` on Persian lines) → `build_poets.py` (ghazal `lang`, `xl`, Ganjoor `gj`/`fa`). Gold:
  `scripts/match_ganjoor.py` → `tests/data/persian_gold.json`; `tests/benchmark_fa.js` gates it (`npm test` runs it `--quick`;
  the full ~14-minute run, with the Ganjoor line check, is `npm run bench:fa`: run it before changing the Persian engine or data). Ganjoor meters:
  `scripts/build_fa_meters.py` → `data/persian_meters.json` (the circles' Persian status; key rule mirrored in `faMeterKey`).
  Persian engine `window.ScanFa`: `build_app.py` splices `data/fa_scan.json` (`scripts/build_fa_scan.js`) into a second copy of the
  engine block; Persian lines (`l.lang === 'fa'`) scan on it via `scanCorpusLine` / `engineOf`. Persian-only meter ids are `F<Ganjoor id>`.
  Persian word list `data/fa_lexicon.json` (`scripts/build_fa_lexicon.js`) for Fārsī Roman/Devanagari only.
  Steingass, Platts and Fallon (1879, Hindustani; stress apostrophes dropped from his Roman) live in ONE place,
  `data/dictionary_bundle.json.gz` (`scripts/import_steingass.py`, `scripts/import_platts.py`, `scripts/import_fallon.py`
  download the sources; `scripts/build_dictionary_bundle.py` builds it): the Transcribe drawer and the Dictionary tab read it
  (IndexedDB), ScanFa's build takes Steingass's classical readings from it (`lib_fa_steingass.js`, add-only), the typed-Roman
  fallback, `readingsOf` and `dictEntryForms` take Platts only (`dict === 'Platts'`).
  `scripts/compare_sufinama_ganjoor.py` lists where Sufinama's words differ from Ganjoor's (a review file; nothing is applied).
- **Transliterator** (`src/js/24-transcribe.js`, `#/lab/transcribe`): a whole text between Roman (casual or diacritics), Urdu script,
  Fārsī script and Devanagari, in any direction, no scansion. Persian-script lines read the Persian list first, and in a Persian line a word the Urdu lists know takes the Persian list's reading even with vowel length dropped (mara: مرا, not مارا); Fārsī output is
  `trUrToFa` (Urdu letters in Persian orthography). It adds no reading of its own: words come from Scan's pipeline (`romanToAscii`, `asciiToScripts`),
  and each word's tier (known / poets / persian / loose / derived / guess) is what `casualPiece` reports (Transcribe adds form: a dictionary word's
  regular form, once the dictionary has loaded; the dictionary's IndexedDB copy is kept while it matches `DICT_BUNDLE_HASH`, stamped by the build), the same chain `casualRomanLine` uses. Guessed
  words are filled from `FA_LEXICON` (Persian list, `trFaRo` turns its dots into ʿ ʾ); the user's corrections are kept per spelling
  (`store` key `trChoices`). Logic: `tests/transcribe_logic.js`.
  Analyzer (`12-dictionary-module.js`): one table of Urdu's regular inflection (`PARADIGMS`), read forward (a dictionary word's
  forms: `dictEntryForms`, `knownForms`, `DICT_STORE.formsFor`) and backward (a form's dictionary words: `dictLemmas` in
  `DICT_STORE.lookup`); same-spelling readings `readingsOf`, sound-alikes `soundsLike`. Word families: `build_dictionary_bundle.py`
  reads each entry's own links ("v.n. fr. X", "caus. of", "pl. of", "corr. of", "= X", "fr. X"; "next"/"prec." resolved) into `rel`
  (only targets that are headwords); `DICT_STORE.family` follows them both ways, and the drawer leads with the verb for a verb form.
  The dictionaries' text is never edited: only Fallon's DSAL encoding is repaired (NFKC for ﮩ, `/?/` → ḳh / ġ / ʿ). Line language: `detectScanLang` sums word
  weights mined by `scripts/build_lang_words.js` → `data/lang_words.json`.
  Gates (all in `npm test`; floors only rise, `--update`; a new benchmark's floor is what the code BEFORE the change scores): `tests/typed_roman_heldout.js` (typed Roman on held-out Rekhta poets → Urdu,
  Roman, Devanagari, inflected words; `tests/typed_roman_baseline.json`), `tests/transcribe_golden.js` (what every hand-written exception
  gives, `tests/data/transcribe_golden.json`, frozen by `scripts/build_transcribe_golden.js`; its `todo` lists known-wrong words) and
  `tests/benchmark_dictionary.js` (drawer lookup on held-out words), `tests/benchmark_lemma.js` (gold form → dictionary word),
  `tests/benchmark_transcribe.js` (Transcribe's own output on held-out poets, incl. underlining: caught / calm),
  `tests/benchmark_readings.js` (Platts homographs offered), `tests/benchmark_lang.js` (line language); `tests/dictionary_cache.js`
  (IndexedDB copy kept per fingerprint); `tests/derived_data.js` (roman_fallback / fa_scan / lang_words match their builders: rebuild
  data with its script when its code changes). Shared: `tests/lib_page.js` (the built page in a vm), `tests/lib_bench.js` (folds, floors;
  `roFold` reads Rekhta's Ḍ as ṛ and Pritchett's final silent -ah as Rekhta's -a, notation, not error). Replace exceptions with general
  rules checked against the dictionary; never add an alias without a golden row. One converter from dictionary Roman: `scholarRoToAscii`.
  **Typed-word scorer** (`casualCands`, `typingCost`, `CASUAL_SCORE`, `05-translit-helpers.js`): a typed word no list matches as typed
  is looked up in Pritchett's list and the poets' list under its casual-spelling variants (d/D for ṛ, g for ġh, k for q, f for ph, ai
  for e, a final -a for a silent -ah …) and its consonant skeleton, and scored by how a typist spells each sound (`SOUND_TYPED`) less
  its commonness. A capital or apostrophe inside a word (baRi, mo'tabar) is a mark it reads, not a reason to skip the lists. A list
  word typed as the list spells it stands unless the typing clearly says otherwise (chaand: چاند). Before adding an alias, check the
  scorer cannot reach the word: `tests/transcribe_golden.js` fails on an alias whose word comes out the same without it. Aliases are
  for closed-class spellings (yih, vuh, nah; un ko; gaʾe) and words no list has (peṭ, nain, vuẓū). The poets' list
  (`data/roman_fallback.json`) is verified with the aliases off (an alias answering first once let ڈ through for ڑ: pade = pa;De).
  Typing costs are learned from real typing: `scripts/learn_typing.js` aligns native speakers' romanizations from Google's Dakshina
  (train split, local in `source_data/dakshina`, CC BY-SA, credited on About) to the sounds of words the lists know → `data/typing_costs.json`
  (`TYPING_COSTS`); `typingCost` takes, per sound, the cheaper of it and the hand table (`SOUND_TYPED`, which keeps the notations
  Dakshina lacks: Rekhta's capitals and dots). Gate: `tests/benchmark_dakshina.js` (committed test split; the honest number, since the
  Rekhta benchmarks only strip diacritics off tidy Roman). Roman style (Classical / Modern, `TR_MODERN_RO`) and a Roman typed in a word's
  box change only the Roman shown.
- **Collocations**: `data/collocations.json` (`scripts/build_collocations.py`) holds neighbour rules for typed Roman
  (`collocSpelling` in `05-translit-helpers.js`). Judge changes with `scripts/colloc_benchmark.py` and `scripts/casual_roman_eval.js`
  (typed Roman → right Urdu word, table mined without the test poets). `tests/benchmark.js` `typed.*` goes the other way (Urdu → Roman)
  and cannot see them.
- **Sound layers and the tabla** (`src/js/15c-taal.js`): every couplet ▶ in the reader, Scan, Look up and the Home example
  (`tkWants`: those `pbToggle` keys, lines of 6+ syllables) plays on one clock (`tkGo`) with the layers on or off: voice,
  melody (Tarannum), tabla theka, tanpura, harmonium, pulse. Each layer has its own gain, so a ribbon dot acts at once; the
  tabla changes the timing, so it restarts the couplet. With the tabla, lines are laid on the taal by mātrās (`tkLay`,
  Auto = `tkFits`), a cycle of theka first, a one-cycle tihai onto sam after. The ribbon under the playing couplet is the
  mixer (stays when paused); the bouncing ball (`settings.ball`) rides every couplet. Drills, Learn and pattern ▶ keep
  `play()`. `settings.style` is kept in step with the layers (`tkLegacy`) for the players that still read it. Strokes:
  `data/tabla/` → `scripts/build_tabla_strokes.py` → `data/tabla_strokes.json` (credited on About).
- Couplet and signature-verse lines shrink to stay on one line (`fitVerseLines`, `--vfit`, floor 0.62), alongside `fitChipRows`.
- Navigating away stops playback (`pbCancel`). Last route is stored under `lastRoute`.
- Persistence is `store` / `localStorage`: script, theme, settings (voice, tempo, foot gap, drum, ASCII; the sound layers
  `voiceOn`/`melodyOn`/`tabla`/`drone`/`pulse`, `gapOn`, `taal`, `taalEnd`, `ball`; Tarannum's options, `src/js/15b-tarannum.js`), `lastRoute`,
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
