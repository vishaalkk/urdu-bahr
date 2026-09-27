# Ghalib extended corpus integration (agent: ghalib-incorporate, 2026-09-27; stopped mid-task by lead due to a file collision, finished by lead)

## What's in
185 of Ghalib's 234 ghazals passed verification (2,920 lines) and are in `data/ghalib_extended.json`, each with a meter mapped to our own numbering (not Pritchett's site-specific "G1"–"G19" labels — those were matched by pattern against `data/meters.json`), `scan_pass_rate`, and full `ur`/`hi`/`ro`/`ascii` per line. 49 ghazals were excluded (pattern didn't map cleanly to one of our 37 meters, or pass rate was too low) — the agent was stopped before it wrote the exclusion list; rerun `node` against `data/ghalib_full_corpus.json` vs `data/ghalib_extended.json` ghazal_num sets to regenerate it if needed.

## UI
A new "More Ghazals — Ghalib Corpus (Preview)" panel under the Exercises card, filterable by meter. It stores only the opening couplet per ghazal in the page (`GHALIB_EXT_PREVIEW`, not the full 2,920 lines) specifically to control page weight — a deliberate, sensible tradeoff. Each card has a "Scan" button that sends the couplet to the Scan tab.

## Page weight
index.html is 1,032,669 bytes now vs. an 860,165-byte snapshot from earlier this session — but that gap includes everything else built today (themes, tabla, misra rename, etc.), not just this feature, since the agent was interrupted before isolating its own delta. The preview-only design (couplet, not full ghazal) is what kept this addition itself small; embedding all 185 ghazals in full would have added roughly 1MB+ more.

## Verified by lead after a build collision
The agent was stopped mid-task because it and the lead were both editing `original_base.html`/`scripts/build_app.py` at the same time (a genuine process error — should have been sequenced). Its own code had one bug caught by the test suite: `renderGhalibExt()` assumed `sel.options` always exists, which crashes in the test harness's mock DOM (no `.options` on mock elements). Fixed with a null check. Also fixed one stale label ("Scan in Studio" → "Scan", to match today's tab rename). After both fixes: build OK, `test_runtime.py` all 6 phases pass, `tests/corpus_scan.js` unregressed at 218/226 (96.5%).

## Left for later
- Exclusion list/reasons for the 49 dropped ghazals (data exists to regenerate; not written up).
- Mir's corpus (separate `mir-scrape` agent, in progress) will need the same treatment.
- Consider whether 185 preview cards is the right amount to show at once, or whether it needs pagination/search as it's used.
