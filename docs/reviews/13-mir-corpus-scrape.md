# Mir corpus scrape (agent: mir-scrape, 2026-09-27; agent went idle before writing this — written by lead from the actual data)

Source: Frances Pritchett's "A Garden of Kashmir" (https://franpritchett.com/00garden), crawled from the commentary index (https://franpritchett.com/00garden/commentary_index.html#index). URL pattern: `00garden/{XXc}/{NNNN}/index_{NNNN}.html`, non-contiguous numbering.

Note: the agent's first crawl attempt silently died from a missing `import os`; it was restarted and completed on the second try.

## Result
- **557 pages fetched** (511 ghazal-index pages + 46 commentary-citation pages), written to `data/mir_corpus.json`.
- **3,896 verse lines total**, ranging 1–42 lines per entry.
  - 292 entries are full-ghazal-sized (≥6 lines).
  - 5 entries are a single cited couplet-half (1 line) — isolated verses quoted in commentary, as expected for this site.
  - 6 entries have an odd line count (likely a partial quote or a stray line — worth a spot-check before use).
- **Meter labels**: Pritchett's own "M" numbering (M1, M4, M5, M12, …), same site-specific scheme as Ghalib's "G" labels — **not** our meter numbers; needs the same pattern-matching treatment as the Ghalib corpus (docs/reviews/12) before use.
- 50 entries have no meter label at all (uncaptioned commentary citations).
- Spot-checked entries 0002, 0003, 0006 — real Mir text in Pritchett's ASCII scheme, correctly formed.

## Not yet done
- No transliteration (ur/hi/ro) — raw ASCII only, same as the initial Ghalib scrape.
- No meter mapping to our numbering, no scansion verification.
- Not integrated into the app in any way.

## Next step (mirrors 12-ghalib-corpus-integration.md)
Map M-labels to our meter IDs by pattern, transliterate via the real parser, verify via our scanner, keep only entries that pass a real quality bar, then decide how (or whether) to surface this in the UI given it's a second large corpus on top of the Ghalib one already added.
