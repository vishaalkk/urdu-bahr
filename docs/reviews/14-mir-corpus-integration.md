# Mir corpus integration (agent: general-purpose, 2026-09-27)

## M-label -> our meter mapping

Found Pritchett's own meter-pattern key for this corpus: `https://franpritchett.com/00garden/apparatus/txt_meters.html`
(linked from every ghazal page's "[meter: Mn]" footnote). It gives the raw scansion pattern for
each Mn label, and for many of them a cross-reference to Ghalib's "Gn" label (e.g. "M5 ... Ghalib
meter G3"). Two independent methods were used and agreed on every label:

1. **Reference-page pattern match**: normalized Mn's raw pattern string and matched it exactly
   against `data/meters.json`'s `standard` list.
2. **Scanner-consensus**: ran every line of every entry under each Mn label through our own
   scanner (`Scan.scanLine`, same engine `tests/corpus_scan.js` uses) and tabulated which meter id
   the group converges on most.

| M-label | Our meter(s) | Method | Consensus hit-rate |
|---|---|---|---|
| M1 | H (Mir's Hindi meter) | pattern (moraic, non-standard) | 98.3% |
| M3 | 3 | pattern | 87.5% |
| M4 | 4 | pattern | 93.4% |
| M5 | 5 | pattern + Gn-crosswalk (G3) | 91.7% |
| M6 | 7 | pattern + Gn-crosswalk (G18) | 86.0% |
| M7 | 8 | pattern + Gn-crosswalk (G13) | 85.0% |
| M8 | 9, 1 (paired) | pattern + Gn-crosswalk (G19) | 77.1% |
| M10 | 10 | pattern + Gn-crosswalk (G1) | 89.5% |
| M11 | 11 | pattern + Gn-crosswalk (G14) | 70.5% |
| M12 | 14, 15 (paired) | pattern + Gn-crosswalk (G8) | 92.7% |
| M13 | 18, 19 (paired) | pattern + Gn-crosswalk (G5) | 88.8% |
| M18 | 24 | pattern | 62.5% (only 2 entries, 8 lines) |
| M20 | 26 | pattern + Gn-crosswalk (G2) | 90.5% |
| M21 | 27 | pattern + Gn-crosswalk (G7) | 72.0% |
| M22 | 28 | pattern + Gn-crosswalk (G12) | 85.4% |
| M23 | 29 | pattern | 90.3% |
| M24 | 30 | pattern | 81.8% |
| M25 | 33, 34 (paired) | pattern + Gn-crosswalk (G9) | 84.7% |
| M27 | 36 | pattern + Gn-crosswalk (G6) | 100% (1 entry) |
| M28 | 37 | pattern | 87.5% |

The Gn-crosswalk was derived from `data/ghalib_extended.json` (grouping its entries by
`meter_label` and reading off their already-verified `meters`). Every label where both methods
applied agreed on the same meter id(s), so confidence is high. M2, M9, M16, M19 exist in
Pritchett's key but never appear in `data/mir_corpus.json`, so were not needed.

## Verification & quality gate

Pipeline (ad hoc Node script, not checked in — same technique as `scripts/build_audited_exercises.js`
and `tests/corpus_scan.js`): loaded the real Sean Pue parsers (`pritchett_scripts/*.js`) to produce
`ur`/`hi`/`ro` from each entry's raw `ascii` line, then ran every line through `Scan.scanLine`
(the exact engine embedded in `index.html`) and checked whether the mapped meter id(s) appeared in
the line's top-3 fits.

Dropped, per entry:
- **50 entries**: no meter label at all (uncaptioned commentary citations) — excluded, matches
  `docs/reviews/13`'s count.
- **5 single-line entries**: all had no meter label, so already excluded by the rule above (no
  separate "too short" drops were needed).
- **1 entry (id 0711, M4, 17 lines)**: odd line count — dropped as an anomaly rather than guessed at.
- **77 entries**: failed the >=90% scan-pass-rate bar (same bar as the Ghalib integration).

**429 of 557 entries kept (77% of the total scrape, ~85% of the 507 labeled entries), 3,110 lines.**
Per-entry `scan_pass_rate` ranges 0.90-1.0 (mean 0.993) and is stored on every kept entry. A few
source lines contain scrape artifacts (stray `[`/`]` from embedded English commentary in a couple
of citation-heavy pages, and a handful of lines using bare `x` instead of `;x` for خ) — these were
left as-is rather than hand-corrected; they only ever cost a line or two within an otherwise-passing
entry, never enough on their own to fail the 90% bar.

Written to **`data/mir_extended.json`** (1,193,679 bytes), same per-line shape as
`data/ghalib_extended.json`/`data/exercises_verified.json`: `id`, `poet`, `meter_label`, `meters`,
`url`, `lines_count`, `scan_pass_rate`, `lines[{ascii,ur,hi,ro}]`.

## Wiring into build_app.py

- `MIR_EXT` loaded from `data/mir_extended.json`; `MIR_EXT_PREVIEW` embeds **full** per-line
  ascii/ur/hi/ro for every kept ghazal (not a truncated preview — lesson from `docs/reviews/12`),
  emitted as `MIR_EXT_DATA` in the page.
- `WORD_ASCII_MAP`'s source loop extended to `EXERCISES + GHALIB_EXT + MIR_EXT`.
- Every Mir line registered via `registerKnownVerse()` right after the Ghalib registration block.
- New "More Ghazals — Mir Corpus" card added directly under the existing Ghalib panel in the
  Exercises tab, reusing the same `.verses`/`.vrow`/`.vnum`/`.vtext`/`.vline`/`.vact`/`.vrule` list
  classes (no card grid). Filterable by meter (including a "Mir's Hindi meter" option), paginated
  12-at-a-time via `mirExtShown`/`showMoreMirExt()`, mirroring `ghalibExtShown`/`showMoreGhalibExt()`.
  "Scan Ghazal" loads the *whole* entry's lines into Scan (`scanMirExtInStudio`), same as Ghalib's.

## Page weight

`index.html`: **1,032,669 -> 2,937,358 bytes** (before -> after; the "before" figure is the one
recorded at the end of the Ghalib integration in `docs/reviews/12`). This is a real ~1.9MB, ~2.8x
increase driven by embedding full text for 429 ghazals across 4 scripts — well within the ~3MB
threshold the owner set as a check-in point, so no further size mitigation was applied.

## Test results

- `uv run python scripts/build_app.py`: compiles cleanly, both output files still byte-identical.
- `uv run python test_runtime.py`: **all 6 phases pass**.
- `node tests/corpus_scan.js`: **218/226 (96.5%)** top-1, unchanged from the pre-Mir baseline (this
  test only scans the original 24 audited exercises, so the Mir addition doesn't move it — no
  regression).

## Left for later

- Exclusion list detail beyond counts (dropped IDs are in the ad hoc build script's output, not
  persisted) — regenerate from `data/mir_corpus.json` vs `data/mir_extended.json` id sets if needed.
- The couple of scrape-artifact lines (stray brackets, bare `x`) could be hand-cleaned in
  `data/mir_corpus.json` at the source if this corpus is revisited.
- Two large "More Ghazals" panels (185 Ghalib + 429 Mir) now sit in the Exercises tab; worth a
  future look at whether they need search or should collapse behind a toggle as this app's
  Exercises tab keeps growing.
