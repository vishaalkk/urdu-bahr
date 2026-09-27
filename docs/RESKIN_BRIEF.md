# Reskin brief — "Quiet Manuscript" (2026-09-27)

Supersedes `docs/REDESIGN_HANDOFF.md` **D13 and D14 only** (visual + fonts). Everything else in
that doc (IA, tabs, routing, rules in §0, parking lot §10, gotchas §11) still applies. Read §0
and §11 of that doc before starting.

**Visual reference:** `scratch/mockup-a-quiet-manuscript.html` — open it and read its CSS.
Match its look. It is a mock: it uses Google Fonts; the real app must not (offline-only).

## The look, in rules

1. **Type does the hierarchy, not boxes.** Serif (`--serif`, Source Serif 4) for verse, headings,
   ledes, notes. Sans (`--sans`, Inter) for all UI: nav, buttons, labels, meta. Mono (`--mono`)
   **only** for syllable patterns (`∪ – –`, `= –`), numbers in lists, and per-syllable foot labels.
   Urdu stays Nastaliq (`--urdu`), Devanagari stays `--deva`.
2. **No cards, no shaded panels, no pill chips for UI.** Separate things with whitespace and
   1px `--line` hairlines. Remove backgrounds/borders/radius/shadows from cards, rows, section
   boxes. Only the settings sheet may have a surface + shadow.
3. **Buttons are text.** Default button = sans 14px `--faint` text, hover `--ink`. Primary = `--gold`
   text. Segmented switches (script, collection, sub-tabs) = plain text, active = `--ink` (+ gold
   underline for main nav). The round play button may stay but flat: 1px `--line2` ring, no glow.
4. **Colour discipline.** Page is ink on paper + greys. Gold = the only UI accent (active nav
   underline, primary action, hover on list lines, focus ring). Gold/teal/rose as *syllable
   weight* colours appear only inside scans/patterns.
5. **Generous spacing.** Reading column 760px, page heading ~40px serif, sections separated by
   48–64px, list rows ~22px vertical padding.
6. No inline `style=""` for anything visual in markup you touch; use classes + tokens.

## Must keep (the user explicitly asked)

- **Playback highlight:** when a line/pattern plays, each syllable lights up in time
  (`.chip.lit`, `.blk.lit`, foot group `.litf`, driven by `litter()` / `playEx()`). Keep it clearly
  visible in the new style: soft gold wash behind the syllable + its underline thickening, small
  lift is fine. No big glow shadows.
- **Feet broken into syllables:** each verse syllable shows its foot syllable under it
  (`.cw .fs`, e.g. ma · fā · ʿī · lun), and each foot group shows its foot name (`.fname`, e.g.
  *mafāʿīlun*). Keep both, styled like the mock (foot name italic serif; syllable labels small mono).
- **Syllable weight marks** become underlines (2–3px) under each syllable, not filled chips:
  long `--gold`, short `--teal`, flexible `--rose`, cheat/`c` dashed `--ghost`. Long pattern blocks
  (`.blk`) stay 2× the width of short ones.
- **All sound controls** stay and keep working: voice, drum/tabla sounds, tempo, foot pause,
  and whatever else the settings/sound sheet currently has. Restyle only; do not remove or rename
  any control id or handler.
- All three scripts (اردو / देव / Roman), all themes (System/Light/Dark/High contrast).

## Token contract (Foundation agent defines; others just use)

Existing names keep working: `--bg --bg2 --bg3 --raise --ink --dim --faint --ghost --gold --teal
--rose --ok --no --onGold --line --line2 --shadow --urdu --deva --mono` and the `--fs-*/--lh-*` scale.
New: `--serif`, `--sans`. `--body` = `--sans`, `--display` = `--serif`.
Light palette follows the mock (`--bg #FAF8F3`, `--ink #1F1C18`, `--dim #5E574D`, `--faint #8A8275`
— check `--faint` still passes 4.5:1 on `--bg`; darken if not). Dark follows the mock's dark block.
Spacing: `--sp-1..--sp-8` = 4, 8, 12, 16, 24, 32, 48, 64px.

## File ownership (strict — edit only your files)

| Agent | Owns |
|---|---|
| Foundation | `src/head.html`, `src/styles/base.css`, `scripts/build_app.py`, new `src/fonts/`, `src/js/07-theme.js` |
| Verse | `src/styles/verse.css`, `src/js/16-data-families-verified.js`, `src/js/19-scan.js` (UI parts only), `src/js/18b-meter-label.js`, `src/body/scan.html`, `litter()` + inline styles in `src/js/15-audio.js` (never audio logic) |
| Pages | `src/styles/pages.css`, `src/body/{header,nav,settings,footer,ghazals,weight,meter,about,handbook,bahr}.html`, `src/js/{02-store,08-handbook-viewer,09-exercises-module,10-ghalib-extended-corpus-preview-browse,11-mir-extended-corpus-browse,12-dictionary-module,14-bibliography-module,17-ear,20-bahr,21-learn}.js` |

Need a change in someone else's file? Don't make it — put it under "Requests for other owners"
in your final report. Never touch the scansion engine, corpus data, transliteration, or `tap`.

## Done means

- `uv run python scripts/build_app.py && uv run python test_runtime.py && node tests/corpus_scan.js && node tests/chip_translit_consistency.js` all pass (other agents build concurrently; if a
  failure is clearly in a file you don't own, re-run once, then report it).
- **Do not git commit** — the reviewer commits.
- **Do not use the browser** — the reviewer does visual QA.
- Final report: files changed, what you restyled, anything you couldn't do, requests for other owners.

## Update — themes (2026-09-27, user decision)

Supersedes handoff **D17**. Only two themes: **Standard** (light, default, no `data-theme`) and
**Colour-blind friendly** (`data-theme="cvd"`: long = blue, short = orange + dotted underline,
flexible = purple + double underline). Dark, High contrast and System are removed; old stored
values fall back to Standard. Every text colour must be ≥ 7:1 (WCAG AAA) on `--bg` and `--bg2`.
