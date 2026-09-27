# Improvements audit (agent: improvements, 2026-09-26; numbers re-verified by lead)

Harness: session scratchpad `improve/{engine.js,harness.js,harness_nfc.js}` — scans all 226 lines of `data/exercises_verified.json` against each ghazal's documented meter.

| # | Finding | Evidence | Fix | Status |
|---|---|---|---|---|
| 1 | **Scanner misreads decomposed آ.** `normalize()` strips U+0653 (combining madda) via the HARAKAT range, so آ written as U+0627+U+0653 (50/226 lines) scans as short alef. | index.html ~929–936. Baseline 175/226 (77.4%) top-1, 183/226 (81.0%) top-3; with NFC: **211/226 (93.4%) top-1, 217/226 (96.0%) top-3** (verified). | `raw = raw.normalize('NFC')` at top of `normalize()`. Remaining 9 failures mostly ہوا/ہوئی LEX entries (Ghazal 17). | Queued (after theme) |
| 2 | Handoff data claims wrong | `meters_catalog.json`, `dictionary_expanded.json` don't exist; real files are `meters.json` (37 meters, 10 rubāʻī not 24) and `glossary.json` (387 entries). Engine RUBAI_RAW has 12 (R1–R12); display data lacks R1, R11. | Correct handoff; add R1/R11 to meters.json. | Open |
| 3 | Google Fonts loaded live despite "zero network" invariant | index.html:7–9 (also in original_base.html). test_runtime only checks `<script src>`. | Remove / self-host; extend test to check `<link href>`. | Assigned to theme |
| 4 | Tests exercise ~4 lines, not the corpus | test_runtime.py:100–320 (real VM tests, but narrow) | Add corpus phase with accuracy floor (≥93% top-1). | Open |
| 5 | Fragile string-patch build | build_app.py; silent no-op on drift | Extract to source files + bundler (see 04). | Open |
| 6 | Mandatory byte-identical mirror `urdu-meter-trainer 2.html` | enforced in test_runtime.py | Drop mirror + that test. | Open |
| 7 | No git repo | — | `git init` + baseline commit. | Needs owner OK |
| 8 | `scratch/` 2.5 MB of one-off scripts / bundle copies | — | Delete or .gitignore. | .gitignore (deploy agent) |
| 9 | Page weight 860 KB: script block 2 (UI + embedded JSON) = 83% | — | Trim embedded data first. | Open |
| 10 | Pages polish: no favicon, no OG tags, no .nojekyll, `lang="en"` everywhere | — | Add; set `lang="ur" dir="rtl"` on Urdu spans. | Partly (deploy agent) |
