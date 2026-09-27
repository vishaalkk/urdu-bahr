# Baḥr redesign — implementation handoff

Status: decisions final (2026-09-27). Written for implementation agents (Sonnet-class).
Everything below is a decision, not a suggestion. If something here conflicts with the
code, the code is out of date — follow this doc. If something here is ambiguous or
impossible, **stop and ask the human**; do not improvise design.

---

## 0. Read first — rules for agents

1. **Never hand-edit `index.html` or `urdu-meter-trainer 2.html`.** They are build output.
   Edit sources, then run `uv run python scripts/build_app.py`.
2. **After every task:** `uv run python scripts/build_app.py && uv run python test_runtime.py && node tests/corpus_scan.js && node tests/chip_translit_consistency.js`. All must pass before you report done.
3. **Do not touch the scansion engine** — the block starting
   `(function(root){\n'use strict';\n\n/* ---------- meters` through `})(this);`.
   `tests/corpus_scan.js` slices the HTML on those exact strings.
4. **Precondition — version control.** The project directory is currently *not* a git
   repo. The human must `git init` + commit a baseline before Phase 0. Commit at the
   end of every task with a message naming the phase/task ID (e.g. `P1.3 hash router`).
5. **One agent per file at a time.** Past parallel work collided on `build_app.py`.
   Phase 0 splits the source into partials specifically so later phases can parallelise
   by file ownership (see §9).
6. **Verify visually** at 375×812 and 1280×800 in both Light and Dark before reporting a
   UI task done (use the `run` skill or Chrome tools). Attach what you checked.
7. Offline-first is a hard constraint: **zero runtime network requests**. No CDN fonts,
   no external scripts, no external stylesheets.

---

## 1. Goal and audience

**Audience:** anyone who *knows Urdu by ear* (not necessarily the script) and wants to
learn Urdu meter: syllable **weight**, **scansion**, **ear** for the bahr, and
**practice** on real ghazals.

**Not a course.** No lesson plan, no daily path, no streaks. Information is organised by
*skill*, coherently, and the learner roams freely.

**Problems being fixed:** 9 peer tabs with misleading names ("Practice" holds no
drills), the same content in multiple places (meter families ×2, scanning ×2, rules ×2),
reference material given the same weight as tools, an overloaded header, no back button /
deep links, 235 inline `style=""` attributes, inconsistent meter naming (`#16` vs
misra vs Arabic name).

---

## 2. Decision log

| # | Decision | Notes |
|---|---|---|
| D1 | Audience = Urdu speaker learning meter; no lesson plan | Remove 6-stage path, "today" card, streak |
| D2 | Top-level grouped **by skill** | |
| D3 | **4 tabs: Weight · Meter · Scan · Ghazals** | Ear merged into Meter |
| D4 | Every skill tab uses sub-tabs **Learn · Drill · Look up** | Scan and Ghazals have no sub-tabs |
| D5 | Ghazals = one tab, collection switch **Handbook 24 · Ghalib · Mir**, one shared, **deduplicated** meter filter, one row layout, one reader | Keep the existing `.vrow` list layout for rows |
| D6 | Opening a ghazal → **in-place reader**: every couplet with inline scan + Fran's notes under the couplet they belong to. No jump to Scan tab | |
| D7 | Meter identity everywhere = **famous misra (in current script) + pattern**; number, classical name, ghazal count are secondary small print | Must re-render on script switch |
| D8 | Meter tab: **one list**, no tree map | Remove meter-map bundle from the build |
| D9 | Header = title · script switch (اردو / देव / Roman) · ⚙ settings. ASCII script, theme, voice, tempo, foot pause, drum → settings sheet | Streak removed |
| D10 | Handbook is **not a tab**: contextual "Go deeper" links + full-screen chapter reader; ToC link in footer | |
| D11 | Scan tab = **your own text only**. Remove exercise dropdown; sample chips only as empty state; typing help behind ⓘ; accuracy note as footnote | |
| D12 | Nav: **bottom bar on phone (<768px), in header on ≥768px**; ≥768px content in a 760px reading column | |
| D13 | Visual: **editorial manuscript** — warm paper light / warm charcoal dark, gold sole UI accent | |
| D14 | **IBM Plex Mono for all UI text and Roman/ASCII verse.** Urdu keeps Nastaliq, Devanagari keeps its script font | Embed as base64 woff2 |
| D15 | Long/short/flexible keep **current colour semantics**: long = gold, short = teal, flexible = rose; long blocks stay 2× width | |
| D16 | Drill feedback = **quiet + explain**: ✓/✗ + one-line reason + Next; session score only | |
| D17 | Themes: **System, Light, Dark, High contrast**. Sepia and Indigo removed | Migrate stored values |
| D18 | Tap/Echo and tap-to-scan **parked** — hidden from nav, code retained | See §10 |
| D19 | Hash routing so back/forward and deep links work | Spec in §4 |

Reconciliation note (D4 + D8): Meter › Learn shows the ~12 *families* (the "common"
meters, with sing-along). Meter › Look up shows *every* meter (37 + rubāʿī + Hindi) with
filter chips. Same row component in both.

---

## 3. Information architecture

### 3.1 Map

```
Header:  بحر · Baḥr   [nav on ≥768px]   [اردو | देव | Roman]  ⚙

Weight    Learn    · Words we use (misra, sher, bahr, dum/da, rukn)
                   · Letters & weight (3 rules, weight law, what's invisible)
                   · Bending (flexible words, final vowels, izāfat, o, grafting, cheat syllable)
                   · Across word boundaries (#constr examples, ▶ before→after)
                   · Go deeper → Handbook ch.1, ch.2, ch.3
          Drill    · Weigh the word
                   · Flexible, always long, or always short?
          Look up  · Word bank (search + tag chips: All / Flexible / Persian / Indic)
                   · Go deeper → Handbook ch.4

Meter     Learn    · Counting bahr vs shape bahr (explainer card)
                   · Family list (FAMS) — row expands to sing-along, feet, variants,
                     "N ghazals in this bahr ›"
                   · Go deeper → Handbook ch.5, ch.6
          Drill    · In the bahr, or limping?
                   · Which ghazal is this?
                   · Weak families card (renderWeak)
                   · Go deeper → Handbook ch.8
          Look up  · All meters: chips [All 37 | Rubāʿī | Hindi]; same row component

Scan      input · Scan ▸ · ▶ · Clear · ⓘ typing help · results · accuracy footnote
          · Go deeper → Handbook ch.7

Ghazals   [Handbook 24 | Ghalib 185 | Mir 429]   Meter [▾]   search…
          list rows → reader  (#/ghazals/<collection>/<id>)

Footer (in-flow, bottom of every page):  Handbook · Sources · About the scanner · Settings
```

### 3.2 Old → new mapping (every current element must land somewhere or be removed)

| Current location | Element | New home |
|---|---|---|
| Listen | counting/shape card | Meter › Learn (top) |
| Listen | `#earFams` scroller + `#earPanel` sing-along | Meter › Learn family rows (expanded state) |
| Listen | Drill 1 in/limping (`iom*`) | Meter › Drill |
| Listen | Drill 2 which ghazal (`wt*`) | Meter › Drill |
| Listen | `#weakCard` (`renderWeak`) | Meter › Drill (bottom) |
| Foundations | `#today`, six stages | **Remove** |
| Foundations | Letters & weight card | Weight › Learn |
| Foundations | Weigh the word (`wd*`) | Weight › Drill |
| Foundations | Bending drill (`fx*`) | Weight › Drill |
| Foundations | Bending explainer (stage 4 text) | Weight › Learn |
| Foundations | Across word boundaries (`#constr`, `renderConstr`) | Weight › Learn |
| Foundations | "How far to trust the scanner" | Scan footnote + About page |
| Tap Along | whole section | **Parked**: remove from nav, keep code, route `#/lab/tap` (unlinked) |
| Practice | 24 exercises | Ghazals › Handbook 24 |
| Practice | Ghalib corpus card | Ghazals › Ghalib |
| Practice | Mir corpus card | Ghazals › Mir |
| Practice | per-couplet "Scan" → Scan tab | Reader inline scan |
| Scan | textarea, Scan, Play couplet, Clear, results | Scan |
| Scan | Quick-load samples | Scan empty state only ("Try:" 3 chips) |
| Scan | `#exSel` exercise dropdown | **Remove** (reader covers it) |
| Scan | "How to type" `<details>` | ⓘ popover next to input |
| Scan | hidden `#studioInput`, `#studioResults` | Keep if `runStudioScan` needs them; otherwise remove |
| Meters | tree map (`mountMeterMap`) | **Remove** from build (keep `features/meter-map/` on disk) |
| Meters | family list `#famList` (`renderFams`) | Merged into Meter › Learn family rows |
| Meters | All 37 `<details>` (`#allMeters`) | Meter › Look up |
| Word Bank | whole section | Weight › Look up |
| Handbook | whole section | Chapter reader route `#/handbook/<ch>`; footer link |
| Sources | bibliography | `#/about` page (Sources + scanner accuracy); footer link |
| Header | theme `<select>` | Settings sheet |
| Header | streak button | **Remove** (and `markToday`, `renderToday`, `streak` storage reads) |
| Header | Sound chip + `#soundSheet` | Merged into Settings sheet |
| Header | tempo slider `#bpmHdr` | Settings sheet (single tempo control; delete the duplicate `#bpm`/`#bpmHdr` pair → one) |
| Header | ASCII script button | Settings sheet toggle "Show Pritchett ASCII" |

---

## 4. Routing

Hash router, no library. Replace `go(id)` callers with `navigate(path)`; keep `go()` as a
thin shim mapping old ids → new routes (so any missed caller still works):
`ear→/meter/drill`, `learn→/weight/learn`, `tap→/lab/tap`, `exercises→/ghazals/handbook`,
`scan|studio→/scan`, `bahr→/meter/learn`, `dictionary→/weight/lookup`,
`handbook→/handbook/ch0`, `bibliography→/about`.

| Route | View |
|---|---|
| `#/weight/{learn\|drill\|lookup}` | Weight tab + sub-tab |
| `#/meter/{learn\|drill\|lookup}` | Meter tab + sub-tab. Optional `?open=<famId>` expands a family row |
| `#/scan` | Scan |
| `#/ghazals/{handbook\|ghalib\|mir}` | List. Query: `?meter=<id>&q=<text>` |
| `#/ghazals/{collection}/{id}` | Reader |
| `#/handbook/{ch0..ch8}` | Chapter reader. Optional `?from=<route>` for the back link |
| `#/about` | Sources + scanner accuracy |
| `#/lab/tap` | Parked tap section (not linked anywhere) |

Rules:
- Default route when hash empty: last visited top-level tab (store key `lastRoute`), else `#/meter/learn`.
- Tab click goes to that tab's **last sub-tab** (remember per tab in memory + `store`).
- Ghazals list remembers collection, meter filter, search, and scroll position when you
  return from the reader via back.
- Reader and handbook reader show a `←` back control that calls `history.back()` if the
  previous entry is in-app, else navigates to the parent route.
- Route change scrolls to top except when restoring list scroll.
- Update `document.title`: `Weight — Baḥr`, `Ghalib 12 — Baḥr`, etc.
- Update `test_runtime.py` assertions that reference `data-s="bibliography"` /
  `id="bibliography"` to the new structure (assert the `#/about` route view exists and
  `BIBLIOGRAPHY_DATA` is still embedded). Keep an element with `id="btnScriptAscii"`
  (the settings toggle) and update the test to not require it in `<header>`.

---

## 5. Screen specs

### 5.1 Header
- Left: `بحر · Baḥr` (Urdu word in `--urdu`, rest Plex Mono 600). Clicking it → `#/meter/learn`.
- ≥768px: the 4 nav links inline after the title.
- Right: segmented script switch `اردو | देव | Roman` (ids `btnScriptUrdu`, `btnScriptDev`, `btnScriptRo`), then ⚙ icon button (`aria-label="Settings"`).
- No uppercase labels ("SCRIPT", "THEME" labels are removed).
- If ASCII mode is on (settings), the script switch shows a 4th segment `ASCII` (id `btnScriptAscii` lives on the settings toggle; the segment can use another id).
- ≥768px: header is sticky. <768px: header scrolls away; bottom nav is fixed.

### 5.2 Nav
- Anchors (`<a href="#/weight">`), not buttons. Active link gets `aria-current="page"`.
- Labels: `Weight`, `Meter`, `Scan`, `Ghazals`. No icons needed; if icons are used, one consistent stroke set, no emoji.
- Phone: fixed bottom, 4 equal-width items, 56px tall + `env(safe-area-inset-bottom)`. Active = gold text + 2px gold top border.
- Desktop: inline text links in header, active = gold text + 2px gold underline offset 6px.

### 5.3 Sub-tabs (Weight, Meter)
- Segmented control directly under the page title: `Learn | Drill | Look up`.
- ARIA: `role="tablist"`, items `role="tab"` + `aria-selected`, panels `role="tabpanel"`; ←/→ move between tabs. Selecting a tab updates the route.

### 5.4 Weight
- Page title "Weight", one-line lede: "How long each syllable is — the raw material of every meter."
- **Learn**: sections in the order in §3.1. "Words we use" is a compact definition list (term in Plex 600, definition in dim). Across-word-boundary examples keep their ▶ before→after.
- **Drill**: two drill cards (§6.8). Weigh-the-word keeps its `= – x` input buttons.
- **Look up**: word bank. Search input full width, tag chips below. Results are a single-column list (not the current 320px card grid) — word (current script), weight pattern (L/S/X coloured), meaning (dim). Empty result: "No words match ‘<q>’."

### 5.5 Meter
- Title "Meter", lede: "Every bahr is a tune. Hear it, then learn to recognise it."
- **Learn**: counting/shape explainer card, then family list. Each row = **meter label** (§6.4) + ▶ (plays pulse) + expand chevron. Expanded:
  - sing-along: famous misra syllables light up while it plays (reuse `renderEarFams`/`#earPanel` logic, rendered inside the row);
  - foot boxes (afāʿīl) for the pattern;
  - `pair` text (the allowance note) in dim;
  - variants: other meters in `fam.meters` as small meter labels;
  - "N ghazals in this bahr ›" → `#/ghazals/<collection>?meter=<id>` choosing the collection with the most matches.
  - Only one row expanded at a time; expanded row is `?open=` in the route.
- **Drill**: in/limping, which ghazal, weak families. Drill feedback per §6.8.
- **Look up**: chips `All 37 | Rubāʿī | Hindi` (default All 37). One row per meter using the same row component; rows expand to pattern + foot boxes + ghazal count link. Meters with no famous verse show the pattern as the primary line (§6.4 fallback).

### 5.6 Scan
- Title "Scan a verse", ⓘ button right of title opens a popover with the current "How to type for best results" text.
- Textarea (Urdu, Devanagari or Roman). Placeholder: "Paste a misra, a sher, or a whole ghazal".
- Actions row: `Scan ▸` (primary), `▶` (icon, only after a successful scan), `Clear` (quiet).
- Empty state (no input, no results): "Try:" + 3 sample chips (first 3 of existing `#samples` data).
- No-fit state: "No meter fits every syllable." + closest candidates if the engine returns any + a tip line ("Adding tashdīd ّ and izāfat ِ often helps.").
- Footnote under results (faint, xs): "Tested on the handbook's 226 exercise lines: 225 fit. About the scanner ›" → `#/about`.
- Enter in textarea = newline; ⌘/Ctrl+Enter = Scan.

### 5.7 Ghazals list
- Title "Ghazals". Collection segmented control `Handbook 24 | Ghalib 185 | Mir 429` (counts computed from data, not hardcoded).
- Controls row: meter filter (§6.5) + search input (matches poet + first line in all scripts, case/diacritic-insensitive).
- Rows: existing `.vrow` layout: number/label, first misra in current script, poet (dim, xs), meter short `#16` (faint), `›`. Whole row is a link to the reader.
- Handbook 24: show all. Ghalib/Mir: 30 per page + "Show 30 more" quiet button.
- Zero results: "No <collection> ghazals in this meter." + links to other collections that do have matches, e.g. "Ghalib has 12 ›".
- Collection one-line description under the switch (dim, xs):
  - Handbook 24: "The handbook's exercise ghazals, with Frances Pritchett's notes."
  - Ghalib: "Ghalib's divan, scanned and meter-checked by the engine."
  - Mir: "Mir Taqi Mir, scanned and meter-checked by the engine."

### 5.8 Ghazal reader (`#/ghazals/{collection}/{id}`)
```
← Ghazals                      Ex. 7 · Ghalib
[meter label: famous misra / pattern / #16 · name · ▶]
▎ Pritchett's note: <ex.notes.intro>            (handbook only, if present)
[ Show scans ]  (toggle; state remembered per session)

1  first misra                               ▶  Scan
2  second misra
   ── inline scan (when toggled on or per-couplet Scan pressed) ──
   syllable chips + foot boxes for each misra; engine word notes (dim)
   ▎ Pritchett's note (verse 1): <ex.notes.verses[1]>
──
3  …
```
- Data: Handbook = `EXERCISES_DATA` (all couplets, `notes.intro`, `notes.verses[n]`); Ghalib = `GHALIB_EXT_DATA`; Mir = `MIR_EXT_DATA` (render all lines they contain).
- Per-couplet `▶` = existing `playCoupletRhythm` logic; `Scan` toggles that couplet's inline scan.
- **Extract** the per-line result renderer out of `runScan()` into a reusable `renderLineScan(text, container)`; use it in Scan and the reader so both look identical.
- Note callouts: label "Pritchett's note" for handbook notes; "Scanner notes" for engine-generated word notes. Never mix the two labels.
- Secondary quiet link at bottom: "Edit in Scan ›" (loads the full text into Scan).
- Prev/next ghazal links at the bottom (within current collection + filter).

### 5.9 Handbook reader (`#/handbook/{ch}`)
- `←` back (to `?from=` route or footer origin), chapter chips `0…8` (horizontal scroll on phone), chapter HTML in a 68ch prose column.
- "Go deeper" links elsewhere use the format: `Go deeper: Handbook ch. 2 — Flexibility ›`.
- Chapter titles: ch0 Introduction, ch1 General Rules, ch2 Flexibility, ch3 Special Constructions, ch4 Irregular Words, ch5 Metrical Feet, ch6 Meters & Bahrs, ch7 Scanning as Code-Breaking, ch8 From Eye to Ear.

### 5.10 Settings sheet
- Phone: bottom sheet (max 85vh, scrolls). ≥768px: right-side panel, 360px wide. Overlay dims page; Esc/overlay click closes; focus trapped; focus returns to ⚙.
- Fields, in order: Theme (System / Light / Dark / High contrast) · Voice (existing sound options) · Tempo slider (60–220, shows value) · Pause between feet (0–2 beats) · ☐ Soft drum on each foot · ☐ Show Pritchett ASCII script (`id="btnScriptAscii"`) · iPhone mute-switch tip (xs, faint).
- Changes apply immediately and persist via the existing `store`. No "Done" primary button; a close ✕ top-right.

### 5.11 About (`#/about`)
- "About the scanner" (accuracy text from Foundations) + Sources (`renderBibliography` output) + credits. Plain prose page.

### 5.12 Footer
- In-flow at the end of every page (above the phone nav's reserved space): `Handbook · Sources · About the scanner · Settings`, xs, faint, gold on hover.

---

## 6. Visual system

All values below are final. **No raw hex, px font sizes, or inline `style=""` in markup or
JS templates after Phase 3** — only tokens and classes. Keep the existing token *names*
(`--bg`, `--ink`, `--gold`…) so current CSS keeps working; change their values.

### 6.1 Colour tokens

| Token | Light (paper) | Dark (warm charcoal) | High contrast |
|---|---|---|---|
| `--bg` | `#F7F2E8` | `#1A1815` | `#0B0B0B` |
| `--bg2` (surface) | `#FCF9F3` | `#221F1B` | `#141414` |
| `--bg3` (sunken/hover) | `#EFE7D7` | `#2C2823` | `#1F1F1F` |
| `--raise` | `#E6DBC6` | `#36312A` | `#2A2A2A` |
| `--ink` | `#2A241C` | `#ECE5D8` | `#FFFFFF` |
| `--dim` | `#574D40` | `#C4BAA8` | `#E6E6E6` |
| `--faint` | `#6B6152` | `#A39884` | `#CCCCCC` |
| `--ghost` (decorative only, never text) | `#8C8170` | `#7D7465` | `#999999` |
| `--gold` (accent + long) | `#8A5A12` | `#E3B45E` | `#FFD166` |
| `--teal` (short) | `#1C6258` | `#5FC4B2` | `#7AF0DC` |
| `--rose` (flexible) | `#8C2F4B` | `#E8A0B8` | `#FFB0CC` |
| `--ok` | `#2F6B2F` | `#7ACB7F` | `#8BF08B` |
| `--no` | `#A3322A` | `#F0A49B` | `#FF9C92` |
| `--onGold` | `#FFFFFF` | `#1A1815` | `#000000` |
| `--line` | `rgba(42,36,28,.12)` | `rgba(236,229,216,.12)` | `rgba(255,255,255,.35)` |
| `--line2` | `rgba(42,36,28,.22)` | `rgba(236,229,216,.22)` | `rgba(255,255,255,.60)` |

Contrast was computed for every text token on `--bg`, `--bg2`, `--bg3`: all ≥ 4.8:1
(WCAG AA). Do not introduce new text colours without re-checking.

- `:root` default = Light values; `@media (prefers-color-scheme: dark)` under
  `:root:not([data-theme])` = Dark; explicit `[data-theme="light"|"dark"|"contrast"]`.
- Delete `sepia` and `indigo` blocks. On load, migrate stored theme `sepia→light`,
  `indigo→dark`.
- Delete the `--mm-*` and `--rr-*` token families along with the meter map / rhythm roll.
- Gold is the only UI accent (active nav, primary button, focus ring, links on hover).
  Teal and rose appear **only** in syllable/pattern marks.
- Shadows: only on the settings sheet and expanded rows:
  `0 1px 2px rgba(42,36,28,.06), 0 8px 24px rgba(42,36,28,.08)` (light);
  `0 8px 24px rgba(0,0,0,.35)` (dark). No other shadows.

### 6.2 Typography

Fonts:
```
--mono / --body / --display: 'IBM Plex Mono', ui-monospace, 'SF Mono', Consolas, monospace;
--urdu: 'Jameel Noori Nastaleeq','Noto Nastaliq Urdu','Urdu Typesetting','Geeza Pro',serif;  (unchanged)
--deva: 'Noto Sans Devanagari','Kohinoor Devanagari','Devanagari Sangam MN',sans-serif;
```
- Embed IBM Plex Mono **400, 500, 600** (+ 400 italic) as base64 woff2 `@font-face` with
  `font-display: swap`. Source: the official IBM Plex release (OFL). Add the licence to
  `LICENSES/`. Subset with `fonttools` (`pyftsubset`) to Basic Latin, Latin-1, Latin
  Extended-A, Latin Extended Additional (U+1E00–1EFF), U+02BE–02BF (ʾ ʿ), general
  punctuation, arrows/geometric shapes used in UI (▶ ■ ▸ › ← ✓ ✗ ⓘ ⚙ if present in the
  font). **Verify coverage** of every character that appears in any `ro` field in
  `data/*.json` and report missing glyphs; missing ones fall back via the stack, which is
  acceptable but must be listed in your report.
- Add a test in `test_runtime.py`: no `http://`/`https://` inside any `@font-face` `src`.

Scale (size / line-height / weight):

| Role | Token | Value |
|---|---|---|
| Page title | `--fs-2xl` | 24px / 1.25 / 600, letter-spacing −0.01em |
| Section heading | `--fs-xl` | 18px / 1.35 / 600 |
| Card/drill title | `--fs-lg` | 16px / 1.45 / 600 |
| Body | `--fs-base` | 14.5px / 1.65 / 400 |
| Small / meta | `--fs-sm` | 13px / 1.55 / 400 |
| Micro (footnotes, counts) | `--fs-xs` | 11.5px / 1.5 / 500, letter-spacing .02em |
| Roman/ASCII verse (list) | `--fs-verse` | 15px / 1.7 / 400 |
| Roman/ASCII verse (reader, meter label) | `--fs-verse-lg` | 17px / 1.7 / 500 |
| Urdu verse (list) | `--fs-urdu` | 22px / 2.1 |
| Urdu verse (reader, meter label) | `--fs-urdu-lg` | 26px / 2.2 |
| Devanagari verse | `--fs-deva` | 17px / 1.8 |
| Pattern marks (= – x) | `--fs-pattern` | 14px / 1.4 / 500, `font-variant-numeric: tabular-nums` |

- Sentence case everywhere. No ALL-CAPS labels (remove `CHAPTER`, `SCRIPT`, `THEME` caps).
- Prose max width 68ch. Use `text-wrap: pretty` on paragraphs, `balance` on headings.

### 6.3 Spacing, radii, layout

- Spacing: existing `--sp-1..7` (4, 8, 12, 16, 24, 32, 48). Add `--sp-8: 64px`.
- Radii: `--radius-sm: 6px` (chips, buttons, syllable blocks), `--radius-md: 10px`
  (cards, inputs, segmented control), `--radius-lg: 14px` (sheet). No pills.
- `--content-max: 760px` (reading column, centred) on ≥768px; phone gutters 16px.
- Vertical rhythm: page title → lede `--sp-2`; lede → sub-tabs `--sp-4`; between
  sections `--sp-6`; between cards in a section `--sp-4`.
- Cards: `--bg2` background + 1px `--line` border, radius-md, padding 16px (phone) /
  20px (≥768px). No shadow. Use cards only for drills, callouts, and expanded rows —
  plain lists (meters, ghazals, words) are rows separated by 1px `--line` rules, not cards.
- z-index scale tokens: `--z-nav: 30`, `--z-overlay: 40`, `--z-sheet: 50`, `--z-popover: 60`.

### 6.4 Meter label (component, used everywhere a meter is named)

```
▶  “dil-e nādāñ tujhe huʾā kyā hai”          ← verse, current script, --fs-verse-lg / --fs-urdu-lg
   = – = = / – = – = / – – =                 ← pattern, L/S/X coloured, --fs-pattern
   #16 · khafīf musaddas makhbūn · 42 ghazals ← --fs-xs, --faint
```
- Implement `meterLabel(id)` → `{verse: {ur,hi,ro,ascii}|null, pattern, name, number, count}`
  and a renderer `renderMeterLabel(id, {size:'sm'|'lg', play:true})`.
- Verse source priority: (1) first `gz` of the `FAMS` family whose `meters` includes `id`;
  (2) first line of the first `EXERCISES_DATA` ghazal with that meter; (3) `GHALIB_EXT_DATA`;
  (4) `MIR_EXT_DATA`; (5) none → pattern becomes the primary line.
- Name from `METERS_DATA` (`name`). Count = ghazals across all three collections.
- Rubāʿī ids (`R1…R12`) and Hindi (`H`) are valid ids; handle string ids.
- **Must re-render on script switch.** `setScriptMode` must re-render every visible
  meter label, list, reader, drill, and meter filter options.

### 6.5 Meter filter (Ghazals)
- Single native `<select>` (accessible, zero custom-listbox risk).
- Options = **union of distinct meter ids** across the current collection (a ghazal tagged
  `[14,15]` counts under both; each id appears once). Hide ids with 0 matches.
- Option text: `<first ~28 chars of verse in current script>… — #<id> (<count>)`; if no
  verse, `<pattern> — #<id> (<count>)`. Sorted by count desc, then id.
- First option: `All meters (<total>)`. Rebuild options on collection change and script change.

### 6.6 Syllables, feet, patterns
- Keep existing `.blk.l/.s/.x` (long 2× short width), `.fbox`, `.L/.S/.X` classes; they
  now take colours from the new tokens.
- Foot names (mafāʿīlun, fāʿilun…) render in Plex Mono 500, `--fs-sm`.
- Playback highlight: current syllable gets `--bg3` background + `outline: 2px solid var(--gold)`;
  foot group highlight `.litf` uses `--bg3`. Transition 80ms; none under reduced motion.

### 6.7 Buttons and controls (all with `:hover`, `:active`, `:focus-visible`, `:disabled`)

| Component | Spec |
|---|---|
| Primary `.btn.gold` | bg `--gold`, text `--onGold`, 500 14px, min-height 44px, padding 0 16px, radius-sm. Hover: `filter: brightness(1.07)`. Active: `translateY(1px)`. Disabled: opacity .45, no hover |
| Quiet `.btn.ghost` | transparent, 1px `--line2` border, `--ink`. Hover: bg `--bg3` |
| Text link button `.btn.link` | no border/bg, `--dim`, underline on hover, gold on hover |
| Icon `.play` / icon button | 36px visual, 44px hit area (padding/pseudo-element), radius-sm, `--dim`; hover `--ink` + bg `--bg3`. Playing state: glyph ▶ → ■, gold, `aria-pressed="true"` |
| Segmented `.seg` | container `--bg3`, radius-md, padding 3px; items 36px tall, 500 13px, `--dim`; selected item bg `--bg2`, `--ink`, 1px `--line` border |
| Chip `.chipbtn` | 32px tall (44px hit via margin/padding), radius-sm, 1px `--line2`, `--dim`; on: gold border + gold text |
| Input / textarea / select | bg `--bg2`, 1px `--line2`, radius-md, 44px min-height, 14.5px; focus: border `--gold` + focus ring |
| Focus ring (global) | `:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }` — never removed |
| Note callout `.note` | bg `--bg2`, 2px left border `--gold`, radius 0 radius-sm radius-sm 0, padding 8px 12px, `--fs-sm`, `--dim`; label in 600 `--gold` |
| Transitions | 150ms ease-out on colour/background/border/transform; sheet 200ms; nothing animates layout properties |

### 6.8 Drill card (all 4 drills)
```
In the bahr, or limping?                              7 / 10
A line is sung. Sometimes a syllable is added, dropped or flipped.
[ ▶ Play ]  [ ↻ ]
[ In ✓ ]  [ Limping ✗ ]
✗ Not quite — a short was added after the second foot.
[ Next ▸ ]
```
- Title (`--fs-lg`), one-line prompt (dim), controls, answer buttons (equal width, quiet style).
- After answering: answer buttons disabled; the chosen one gets `--ok`/`--no` border;
  feedback line `✓ Right — <reason>` / `✗ Not quite — <reason>` in `--ok`/`--no`;
  focus moves to **Next ▸** (primary).
- Reason text: use explanation data the drill already has (correct pattern, which syllable
  changed, word's syllable split). If a drill has no reason data, show the correct answer
  (e.g. `Answer: = – =`). **Do not invent linguistic explanations.**
- Score `correct / attempted` for this session only, right-aligned, `--fs-xs` tabular.
  Keep the persisted `stats` used by `renderWeak`; no other persistence, no streaks, no
  sounds, no confetti.

---

## 7. UX rules

- **Script switching:** every verse element gets `lang` + `dir`: Urdu `lang="ur" dir="rtl"` (right-aligned, `--urdu`); Devanagari `lang="hi"` (`--deva`); Roman/ASCII `lang="ur-Latn" dir="ltr"` (Plex Mono). Pattern strips are always LTR. Switching script must not change scroll position.
- **Playback:** one thing plays at a time; starting a new playback stops the current one and resets its control to ▶. `Esc` stops playback. Tempo/voice changes apply to the next playback.
- **States required:** Scan empty / no-fit (§5.6); Ghazals zero-results (§5.7); Word bank no match (§5.4); audio unavailable (show the iPhone mute-switch tip inline next to the ▶ that failed, once). No loading states — everything is synchronous and local.
- **Persistence (`store`):** `script`, `theme`, `settings` (voice, tempo, foot gap, drum, ascii), `lastRoute`, per-tab last sub-tab, `stats`. Remove `streak` reads/writes.
- **Accessibility:** 44px min touch targets; visible focus everywhere; nav `aria-current`; sub-tabs full tab pattern; settings sheet `role="dialog" aria-modal="true"` + labelled title + focus trap; `prefers-reduced-motion` disables transitions and highlight animation (highlight still shown); all icon-only buttons have `aria-label`; skip link "Skip to content" as first focusable element.
- **Copy:** sentence case, plain words, no exclamation marks, no "Oops". Define terms where they first appear (Weight › Learn "Words we use"). Keep existing domain vocabulary (misra, sher, bahr, rukn, dum/da, izāfat, tashdīd). Keep source attributions exactly as they are.
- **Motion:** only hover/press/sheet transitions and the playback highlight. No scroll-triggered animations, no staggered entrances.

---

## 8. Phases and tasks

Each task: do it, rebuild, run all tests, verify visually (for UI tasks), commit.

### P0 — Build consolidation (serial, one agent) — **no visible change**
Goal: markup/CSS/JS live in editable source files; the build only concatenates + injects data.
- P0.1 Snapshot current `index.html` → `scratch/pre-redesign-index.html` for comparison.
- P0.2 Create `src/` with partials, extracted from the *current built output* so all
  `build_app.py` string-patches are already applied:
  `src/head.html`, `src/styles.css`, `src/body/*.html` (one per section + header + nav + sheet),
  `src/js/NN-name.js` (ordered chunks, split at existing `/* ===== ... ===== */` comments;
  the engine block stays a single file untouched), `src/manifest.json` listing order.
- P0.3 Replace every embedded data constant (`HANDBOOK_DATA`, `EXERCISES_DATA`, `METERS_DATA`,
  `GLOSSARY_DATA`, `GHALIB_EXT_DATA`, `MIR_EXT_DATA`, `BIBLIOGRAPHY_DATA`, `FAMS` if it is
  generated, Pue parser bundle, etc.) with placeholders like `/*@@EXERCISES_DATA@@*/`.
- P0.4 Rewrite `scripts/build_app.py` to: read manifest → concatenate → substitute
  placeholders from `data/*.json` (reuse its existing data-loading code) → write both
  mirrored HTML files. Remove all `html.replace(old, new)` UI patching.
- P0.5 **Acceptance:** rebuilt `index.html` is byte-identical to the P0.1 snapshot (if not
  achievable, a diff showing whitespace-only differences, attached to the report); all
  tests pass. `original_base.html` is moved to `scratch/` (no longer a build input);
  update README "Build"/"Repo layout".

### P1 — IA, routing, header, settings (serial, one agent) — current look retained
- P1.1 Hash router + `go()` shim (§4).
- P1.2 New nav (4 tabs, anchors) and sub-tab component; restructure sections per §3.2 by
  moving existing DOM blocks — do not rewrite drill logic.
- P1.3 Remove: streak, today card, six stages, meter map bundle + `#meterMapContainer`,
  `#exSel`, header theme select, `Tap` from nav (keep `#/lab/tap`).
- P1.4 Header per §5.1; Settings sheet per §5.10 (merge `#soundSheet`; single tempo control).
- P1.5 Footer, `#/about`, handbook reader route with `?from=` back link; add "Go deeper" links (§3.1).
- P1.6 Scan tab trims (§5.6 structure; empty state chips; ⓘ popover; footnote).
- P1.7 Update `test_runtime.py` assertions (§4 last bullets).
- **Acceptance:** every row of §3.2 verified; every route in §4 loads directly by URL
  and via back/forward; all tests pass.

### P2 — Meter labels, Meter tab, Ghazals library + reader (P2.1 first, then two agents in parallel)
- P2.1 `meterLabel()` + `renderMeterLabel()` (§6.4) in its own `src/js/` file; wire into
  `setScriptMode`. *(Blocks P2.2 and P2.3.)*
- P2.2 **Agent A — Meter tab** (owns `src/body/meter.html` + meter JS files): Learn family
  rows with expand, Look up list with chips, "N ghazals ›" links, drill feedback (§6.8) for
  the two ear drills.
- P2.3 **Agent B — Ghazals** (owns `src/body/ghazals.html` + ghazals JS files): collection
  switch, deduped meter filter (§6.5), search, pagination, reader (§5.8), extract
  `renderLineScan()` from `runScan()`, list state restore.
- P2.4 (after A and B) Weight drills feedback (§6.8); cross-check script switching on all views.
- **Acceptance:** script switch updates every meter label, filter option, list and reader;
  filter never shows a duplicate id; reader shows Pritchett notes under the right couplet
  for all 24 handbook ghazals (spot-check ex. 1, 10, 18, 20).

### P3 — Visual system (P3.1 first, then per-tab agents in parallel)
- P3.1 Tokens (§6.1), themes + migration, Plex Mono embed + font test (§6.2), type/spacing/
  radius/z tokens (§6.3), global focus ring, base component CSS (§6.7). *(Blocks the rest.)*
- P3.2 Per-surface agents, each owning its partial: Weight / Meter / Scan / Ghazals+reader /
  header+nav+sheet+footer+about+handbook. Replace every inline `style=""` in markup **and in
  JS template strings** with classes; apply §5 and §6 specs.
- P3.3 Acceptance grep: `grep -c 'style="' index.html` → 0 outside the embedded handbook
  chapter HTML (which is source content — leave it); no hex colours outside the token blocks.

### P4 — QA and polish (serial)
- P4.1 A11y pass per §7 (keyboard-only walkthrough of every route; reduced motion; contrast of any new pairs).
- P4.2 Screenshot matrix: every route × {375, 1280} × {Light, Dark} + HC on 3 key routes; save to `docs/reviews/redesign-screens/`.
- P4.3 Copy pass per §7.
- P4.4 Update README (tab names, structure) and this doc's status line.

---

## 9. File ownership for parallel agents (after P0)

| Owner | Files |
|---|---|
| Shell agent | `src/head.html`, `src/body/header.html`, `nav.html`, `settings.html`, `footer.html`, router + settings JS |
| Weight agent | `src/body/weight.html`, weight drill JS, dictionary JS |
| Meter agent | `src/body/meter.html`, ear/families JS |
| Scan agent | `src/body/scan.html`, scan UI JS (not the engine) |
| Ghazals agent | `src/body/ghazals.html`, `reader.html`, exercises/corpus JS |
| Shared (serial only, one agent at a time) | `src/styles.css` token/base section, `src/manifest.json`, `scripts/build_app.py`, `test_runtime.py`, meter-label JS |

Per-surface CSS goes into `src/styles/<surface>.css` (added to the manifest in P3.1) so
agents don't edit one stylesheet concurrently.

---

## 10. Parking lot (out of scope — do not build)

- Tap / Echo a bahr, and tap-to-scan: the human hasn't decided what these should be. Keep the
  code reachable at `#/lab/tap`; don't link it; don't delete it.
- Embedding a Nastaliq web font (Noto Nastaliq Urdu is large). Currently relies on
  installed fonts; revisit separately.
- Rhythm roll (reverted earlier), meter map (removed from the app; `features/` stays on disk).
- Any change to scansion rules, corpus data, or transliteration.

## 11. Known gotchas

- `setScriptMode` currently calls every render function; after P1 it should re-render
  only mounted views plus the header (avoid rendering hidden tabs into missing nodes).
- `test_runtime.py` TEST 4 runs the inline scripts in a sandbox with a mocked
  `getElementById`. New code must tolerate missing elements (guard `$()` results), or the
  sandbox test fails.
- Ghazals tagged with two meters (e.g. `[14,15]`) and string ids (`R1`, `H`) — normalise ids
  to strings everywhere in filter/label code.
- `index.html` is ~2.9 MB; keep the Plex subset small (target < 120 KB base64 total).
