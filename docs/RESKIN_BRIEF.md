# Reskin brief — "Quiet Manuscript" (2026-09-27)

Supersedes `docs/REDESIGN_HANDOFF.md` **D13 and D14 only** (visual + fonts). Everything else in
that doc (IA, tabs, routing, rules in §0, parking lot §10, gotchas §11) still applies. Read §0
and §11 of that doc before starting.

**Visual reference:** `docs/design/mockup-a-quiet-manuscript.html` — open it and read its CSS.
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

---

# Round 2 (2026-09-27) — unify experiences, per-tab intent

Decisions (user-approved). Everything in round 1 still applies (look, tokens, file rules).
Read `src/js/15-audio.js` **player section (`PB`, `pbToggle`, `pbFromFoot`, `pbNodes`)** — it is the
one player every ▶ must use.

## Global
- **G1 One player.** Every ▶ in the app goes through `pbToggle(key, btn, getLines, start)` (or a thin
  wrapper): ▶ ⇄ ❚❚, stop remembers the foot, resume from it, `pbForget()` on tempo/voice change,
  cancelled on route change. Plain `play()`/`playPat()` calls without the controller are not allowed
  for user-facing buttons. For pattern-only playback (no verse) add a PB-compatible wrapper
  (e.g. `pbTogglePattern(key, btn, raw, blkNodes)`) in 15-audio.js.
- **G2 Heading scale** (all tabs/sub-tabs): page title = serif 32px; section heading (h2/h3 inside a
  sub-tab) = serif 22px; label/eyebrow = sans 12px uppercase .08em `--faint`. Define as classes in
  pages.css (`.page-title`, `.section-title`, `.eyebrow`) and use them.
- **G3 One drill engine** (`src/js/22-drill.js`, `src/styles/drill.css`) used by Weight › Drill and
  Meter › Drill: one card, a queue that rolls through mixed question types, type filter chips,
  source filter (Handbook / Ghalib / Mir), quiet ✓/✗ + one-line reason + Next, session score only.

## Weight
- **Learn:** audit Handbook ch. 1–4 (`source_data/0[1-4]_*.txt`) against `weight.html`; add missing
  rules + real examples (e.g. nūn ghunna, tashdīd, vāv/yā vowel vs consonant, silent h, Arabic
  endings, izāfat forms, 'o' joining, grafting). Each rule: short heading, one-sentence rule, 1–3
  examples in current script with a ▶ that plays the word/phrase through the player.
- **Drill:** replace the two drill boxes with the shared engine. Types: weigh the word, flexible or
  fixed, iẓāfat, grafting, 'o' joins final consonant (+ any other scanner note types).
- **Look up (Word Bank):** ▶ on a word uses the player with its syllable chips lighting up.

## Meter
- **Learn:** families shown as a vertical list (one row per family: famous line, pattern, ▶;
  expands to sing-along). No narrow horizontal card strip.
- **Drill:** shared engine. Types: which bahr (pick from 3–4), in the bahr or limping, which foot is
  missing/changed, which ghazal. Questions generated from corpus lines with **confident scans only**
  (best fit strain ≤ 2.5, i.e. verdict 'Scans'), each tagged with its source.
- **Look up:** reference, not scansion. Each famous couplet box shows the couplet; ▶ **lights up the
  words of the couplet itself** in time (word-level highlight: a word is lit while any of its
  syllables sound; grafted words light together). A "Scan" toggle per box reveals the syllable chips
  (hidden by default here). Header ▶ plays the pattern via the player with the bars lighting.

## Scan
- No horizontal scrollbars in couplet boxes. Rows shrink via `--fit` down to a floor (0.7); below
  that, the row **wraps between feet (never inside a foot)**; highlight works across wrapped rows.

## Ghazals
- **Universal search:** one box; matches Urdu (diacritics/ZWNJ-insensitive), Roman (diacritic-
  insensitive: ā→a, ḳh→kh, ʿ dropped…), Devanagari, poet name, ghazal number; searches **all
  collections** at once; results show the collection; collection switch acts as a filter.
- **Bug:** Handbook rows show `#undefined` for the meter — fix (field is `m`, can be an array).
- **Reader header:** title = meter name (`#26 · Hazaj mus̱amman sālim`); below it small
  "Same bahr as ‹famous misra› — Ghalib" (clearly a reference, not this ghazal's line); pattern strip
  centred under the title; ▶ plays the pattern through the player.

## File ownership (round 2 — strict)
| Agent | Owns |
|---|---|
| Player & Meter | `src/js/15-audio.js`, `16-data-families-verified.js`, `17-ear.js` (Learn families + sing-along only — not `iomNew`/`wtNew`/`renderWeak`), `18b-meter-label.js`, `20-bahr.js`, `12-dictionary-module.js`, `19-scan.js` (UI only), `src/body/meter.html`, `meter-lookup.html`, `weight-lookup.html`, `scan.html`, `src/styles/verse.css` |
| Drills | `src/js/22-drill.js`, `src/styles/drill.css`, `src/body/weight-drill.html`, `meter-drill.html` (old drill code in 17-ear/21-learn stays in place, unlinked) |
| Pages & Ghazals | `src/styles/pages.css`, `src/body/weight.html` (Learn), `ghazals.html`, `header.html`, `footer.html`, `about.html`, `handbook.html`, `src/js/09-exercises-module.js`, `10-…`, `11-…`, `21-learn.js` (Learn parts), `02-store.js` |
Shared rules from round 1 apply: no commits, no browser, full test command must pass, report
requests for other owners instead of editing their files.

---

# Round 3 (2026-09-27) — legend, grouping, home

User decisions:
- **Meter identity** = famous misra (current script) + pattern strip. Official ʿarūz names are
  secondary: never a row's main label; at most small faint print.
- **One legend component** everywhere (`legendHTML(cls)` in `src/js/19-scan.js`): shows the mark AND
  the symbol: long `=` (dum), short `–` (da), flexible, either `x`, cheat, grafted. Sticky
  (`legendHTML('legend-sticky')`) at the top of the ghazal reader, Scan results, Meter Learn/Look up,
  drills — stays visible while scrolling (below the site header; never covers content).
- **CVD palette is the default** (blue long / orange short / purple flexible + dotted/double
  underline cues). The old gold/teal/rose becomes an opt-in "Classic colours" setting.
- **Ghazals**: list grouped by meter (group header = famous misra + pattern + count; rows = number
  + first line only). In Ghalib/Mir rows the number is Fran's number linked to her page, without
  repeating the poet. Roman/Devanagari rows must be `lang`/`dir` for their script (Roman = mono, LTR).
- **Meter › Learn**: families grouped into **Counting bahrs** and **Shape bahrs**, each with a
  one-line explainer.
- **Home page** (`#/home`, what a bare URL opens): what each tab is for, how to read the legend,
  a sample couplet to play, where to start.

## File ownership (round 3 — strict)
| Agent | Owns |
|---|---|
| Legend & colours | `src/js/19-scan.js` (legendHTML + Scan-results legend placement only), `src/styles/verse.css`, `src/styles/base.css`, `src/js/07-theme.js`, `src/body/settings.html`, `src/js/20-bahr.js` (Look up legend), `src/js/22-drill.js` + `src/styles/drill.css` (drill legend) |
| Ghazals | `src/js/09-exercises-module.js`, `10-…`, `11-…`, `src/body/ghazals.html`, `src/styles/pages.css` |
| Meter & Home | `src/js/17-ear.js`, `src/body/meter.html`, `src/body/home.html`, `src/styles/home.css`, `src/js/02-store.js`, `src/body/header.html`, `src/body/nav.html` |
Call `legendHTML('legend-sticky')` — don't write your own legend. Same rules: no commits, no browser,
`npm test` must pass (runs build + all suites incl. tests/dom_smoke.js).
