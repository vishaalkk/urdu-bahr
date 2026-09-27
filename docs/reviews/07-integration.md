# Integration pass (lead, 2026-09-26) — reduced scope (low quota)

Done:
- Scanner: `normalize()` in original_base.html now NFC-normalizes input. Corpus accuracy 175→211/226 top-1 (77.4%→93.4%), top-3 96.0%.
- Transliteration glue (build_app.py): NFC at top of `devToAscii`, `urduToDevanagari`, `urduToRoman`; multiMap sorted longest-pattern-first so whole-word overrides (مجھ, تھا, …) beat digraphs.
- Nav: plain-English names + learning order: Listen, Foundations, Tap Along, Practice, Scan, Compose | Reference: Meters, Word Bank, Handbook, Sources. Nav patch now asserted.
- tests/corpus_scan.js: scans all 226 lines from built index.html, exits 1 below 93% top-1.
- LICENSES/NOTICE-ghalib.js.txt (Apache-2.0 notice).
- Build OK, test_runtime.py ALL PASSED.

Deferred (next session):
1. Merge Scan + Compose (Studio) into one tab.
2. Mount features/meter-map (Meters tab) and features/rhythm-roll (Scan tab); fix rhythm-roll hard-coded #1a1526.
3. Raise --faint to 7:1 in all themes.
4. "Approximate" label on hand-map ur→hi/ro output.
5. Convert remaining unguarded `html.replace` patches to an asserting `patch()` helper — or do the Vite extraction (04).
6. Wire tests/corpus_scan.js into test_runtime.py and the Pages workflow; add full Apache-2.0 text; add rubāʻī R1/R11 to data/meters.json; fix PROJECT_HANDOFF.md claims (see 03, 06).
7. Voice flow: unreviewed patch + test page saved in features/voice-flow/ (open test.html to compare old vs new).
8. In-text references to old tab names ("Ear", "Studio") in headings/body copy.

Visual check needed (no browser used): all 5 themes, nav at 375px (incl. "Reference" label), Scan/Compose syllable cards.

## Later the same session (lead)
- Recorded tabla sound (`TABLAPACK`, default): long = ta, short = ti, each trimmed to a single stroke from ~/Downloads/tabla_*.mp3; no reverb; final stroke shortened; extrametrical `c` syllables silent on tabla.
- Rest between feet in `play()` (`settings.footGap`, default 0.5 beat) + "Pause between feet" slider in the Sound panel.
- Header tempo slider (`#bpmHdr`, 60–220), synced with the Sound-panel slider.
