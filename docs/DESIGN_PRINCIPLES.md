# Design Principles — Bahr

The visual language of the site: **quiet, airy, literary** — a fine-press journal, in the spirit of
[columbiaurdupoetrygroup.com](https://www.columbiaurdupoetrygroup.com/). Ink on paper, hairlines instead
of boxes, small tracked capitals for the interface, serif for everything that is read.

This is the **single source of truth** for how the site looks and behaves. It supersedes the earlier
"Quiet Manuscript" reskin brief (now removed) and includes the Columbia pass (2026-10-01) that changed
navigation, tabs and buttons. Tokens live in `src/styles/base.css`; use them, never raw hex. Iterate on this
file, not on side briefs.

---

## 1. Principles

1. **Type does the hierarchy, not boxes.** No cards, shaded panels or shadows in page content. Separate
   with whitespace and 1px hairlines (`--line`). Only the settings sheet has a surface and shadow.
2. **Two voices.** Serif is the reading voice (verse, headings, ledes, notes). Sans is the interface
   voice (navigation, buttons, labels, meta). Never mix them within one job.
3. **The interface whispers; the poetry speaks.** UI labels are small, widely tracked capitals. Urdu verse is
   the largest, most generous thing on the page.
4. **Ink is the accent for chrome.** Navigation, tabs, buttons and filters use ink (`--ink`) for active and
   hover. Blue (`--gold`) is kept for the primary link/hover on list lines and the focus ring.
   Blue/orange/purple as *syllable weights* appear only inside scans and patterns.
5. **Flat, never plastic.** No bevels, inner highlights, glows or pill bubbles on controls.
6. **Generous space.** 760px reading column, 48–64px between sections, long rows with air.
7. **Accessibility is not negotiable.** Text ≥ 7:1 (WCAG AAA) on `--bg` and `--bg2`; weight colours are
   never the only cue (shapes and underlines accompany them); visible focus rings; keyboard reachable.
8. **Everything works in all three scripts** (اردو / हिन्दी / Roman) and both themes. Nothing may rely on
   case or letter-spacing for Urdu text.
9. **Offline and private.** Fonts are bundled in `src/fonts` and inlined at build. No CDN fonts or
   third-party requests.

---

## 2. Typography

| Role | Family | Token |
|---|---|---|
| Headings, verse prose, ledes, notes | Source Serif 4 | `--serif` / `--display` |
| UI: nav, tabs, buttons, labels | Inter (Regular 400, Medium 500 only) | `--sans` |
| Roman verse, syllables, glossary | Source Code Pro | `--mono-ro` |
| Meter patterns and weight marks (`= – ∪`) | Noto Sans Mono | `--mono-pat` |
| Urdu | Noto Nastaliq Urdu | `--urdu` |
| Hindi | Noto Sans Devanagari | `--deva` |

Inter is bundled at **400 and 500 only**. Do not ask for 600 or bold in UI; the browser fakes it.
Emphasis in the UI is conveyed by ink colour, a border, or weight 500.

**Scale** (`--fs-*`): 2xl 26 · xl 20 · lg 17 · base 15.5 · sm 13.5 · xs 12 · Urdu 24 (line-height 2.2).
Page title: serif 32px (26px on phones). Section title: serif 22px. Group title: serif xl with a hairline above.

**Tracked-caps UI labels** (sans, uppercase):

| Element | Size | Tracking |
|---|---|---|
| Site title | 13px | 0.18em |
| Main nav (desktop) | 12px | 0.16em |
| Main nav (mobile bottom bar) | 11px | 0.14em |
| Sub-tabs / segmented (`.seg-btn`) | 12px | 0.15em |
| Buttons, stepper, lesson tags | 11.5px (11px small) | 0.10em |
| Filter chips | 11.5px | 0.06em |
| Eyebrow / filter labels | 11–12px | 0.08–0.14em |

**Never apply caps or letter-spacing to Urdu or Hindi text, or to verse.** Letter-spacing breaks Nastaliq
joining. Controls that hold script text (word buttons, syllable tabs/options, drill answer choices,
practice keys) stay in sentence case with no tracking.

---

## 3. Colour

- **Paper and ink:** `--bg #FAF8F3`, `--bg2 #F6F2EA`, `--bg3 #EFE9DC`, text `--ink #15120E`,
  `--dim #3A342C`, `--faint #4D473E`. `--ghost` is decorative only, never text.
- **Hairlines:** `--line` (12% ink) for dividers, `--line2` (24% ink) for control borders.
- **Accent `--gold` (#0A4687):** the single blue; in practice used for links, the focus ring and list-line hover.
- **Weight colours** (inside scans only): long blue, short orange, flexible purple, with `--mark-*` brighter
  variants for graphic marks (≥ 3:1). Shape cues accompany them (dotted/double/dashed underlines).
- **Themes:** Standard (default, no attribute) and Colour-blind friendly (`data-theme="cvd"`). Ink tints
  are built with `color-mix(in srgb, var(--ink) N%, transparent)` so they follow the theme.
- **Correct / wrong answers:** `--ok` and `--no` borders and ✓ ✗ marks, never colour alone.

---

## 4. Components

### 4.1 Navigation
- **Desktop top nav:** sans 12px caps, tracked 0.16em, `--faint`; hover `--ink`; active `--ink` with a 1px
  ink underline.
- **Mobile bottom nav:** 60px bar on `--bg2` with a `--line2` top hairline (chrome, so it never reads as a row
  of the page above). Each tab is a 24×16 line glyph (stroke `currentColor`, 1.6) over 11px caps: scale (Weight),
  metronome (Meter), pen on a line (Scan), rose (Ghazals). Active: `--ink`, weight 500, 6% ink tint, 2px ink top-line.
- **Site title:** small tracked caps with the Urdu word beside it at 18px.

### 4.2 Sub-tabs and segmented controls (`.subtabs.seg`, `.seg-btn`)
Plain tracked-caps text on a hairline rule, no pill, no fill. Active = `--ink` with a 2px ink underline
(weight 500). Gap 24px on desktop; tighter (12px) with `flex: 1` on phones so 3–4 tabs fit without scrolling.

### 4.3 The flat tag (the one button shape)
Everything pressable that is not a link uses the same shape:

- 4px radius, 1px `--line2` border, transparent background, sans caps 11.5px / 0.10em, `--faint` text,
  min-height 36px (30px for `.sm`), padding 4px 12px.
- **Hover:** border and text go to `--ink`.
- **Active / selected / primary:** ink border + faint ink tint (6%), text `--ink`, weight 500.
- **Disabled:** 45% opacity.

| Variant | Where | Look |
|---|---|---|
| default `.btn` | actions (Practise this, More, Check) | flat tag |
| `.btn.gold` | primary (Next, Play line) | ink border + 6% tint |
| `.btn.ghost` | quiet actions | caps text, no box until hover |
| `.btn.link` | inline | underlined sentence-case text |
| `.step` | lesson stage stepper | flat tag; scrolls sideways on phones |
| `.corpus-label` | example labels | flat tag, non-interactive; keeps its long/short colour |
| `.constr-more > summary`, `.card-more > summary` | "+ more" fold-outs | flat tag with `+` / `–` |
| `.stage-nav .btn` | Back / Next | flat tag; Next is the primary |
| `.dr-chips button` | drill filters | flat tag, 3px radius, 0.06em |

### 4.3b Script-bearing controls
Same border and active treatment as the flat tag, but **sentence case, no tracking**, 4px radius:
`.dr-choice` (answer tiles), `.wbtn` (word buttons, dashed → solid ink when selected), `.syl-tab`,
`.syl-opt`, `.pr-key`.

### 4.4 Play button
Round, flat 1px `--line2` ring, no glow. This is the one allowed circle.

### 4.5 Cards and panels
Content cards have no background, border or shadow; sections are divided by a hairline. The Drill question
card keeps a hairline box (it is a task container, not decoration).

### 4.6 Notes and callouts
Hairline and serif text; no tinted panel. `strong` inside a note is `--ink`, weight 500.

---

## 5. Layout and spacing

- Spacing tokens `--sp-1..8` = 4, 8, 12, 16, 24, 32, 48, 64px. Use tokens, not literal pixels.
- Reading column 760px in page content (`main, .wrap`); shell max 960px.
- Page head: eyebrow → serif title → lede, 32px below.
- Radii: 4px for controls; 8–10px only for the drill card and couplet panels; circle only for play.
- Mobile first: 20px page gutters, no horizontal page scroll (steppers may scroll inside themselves),
  tap targets ≥ 30px high for small tags, ≥ 36px for standard.

---

## 6. Motion and interaction

- Transitions 140–160ms ease-out on colour, border and background only. No bouncing, no scaling beyond the
  `:active` 0.97 press.
- **Playback highlight is a feature, not decoration:** the syllable currently being played lights up
  (`.chip.lit`, `.blk.lit`, `.litf`). Keep it clearly visible in any restyle.
- Focus: `:focus-visible` gets a 2px `--gold` outline with 2px offset. Do not remove it.

---

## 7. Content and voice

- Interface labels are short: one or two words (`Bahr`, `Foot`, `Limping`), not questions. The question
  heading carries the context.
- Roman transliteration follows Pritchett's conventions (ż ẓ ṡ ʾ, ḳh, ġh). **Always prefer the verse's stored
  Roman** over machine transliteration; the letter-by-letter converter (`urduToRoman`) cannot see short
  vowels and is a last resort.
- Sentence case for prose and for any control that can hold script; caps only for fixed English UI labels.

---

## 8. Shared components and behaviours

Decisions carried over from the earlier rounds; they apply across all tabs.

- **One player.** Every ▶ goes through `pbToggle(key, btn, getLines, start)` (▶ ⇄ ❚❚). Stopping remembers the
  foot and resumes from it; changing tempo or voice forgets it; navigating away cancels it. Never call
  `play()` / `playPat()` directly from a user-facing button.
- **One legend** (`legendHTML(cls)` in `19-scan.js`): shows the mark *and* the symbol — long `=` (dum), short
  `–` (da), flexible, either `x`, cheat, grafted. Sticky (`legend-sticky`) under the site header in the ghazal
  reader, Scan results, Meter Buḥūr/Look up and the drills; it must never cover content. Do not write another.
- **One drill engine** (`22-drill.js`, `drill.css`) for Weight › Drill and Meter › Drill: one card, a queue of
  mixed question types, filter chips for type and source (Handbook / Ghalib / Mir), a quiet ✓/✗ with a
  one-line reason and Next, session score only. Questions come from confident scans only (strain ≤ 2.5).
- **Heading scale:** `.page-title` serif 32px, `.section-title` serif 22px, `.eyebrow` sans caps. Use the
  classes; no inline styles for anything visual.
- **Weight marks are underlines**, 2–3px, not filled chips: long blue, short orange, flexible purple, cheat
  dashed grey. Long blocks (`.blk`) stay twice the width of short ones. Each verse syllable shows its foot
  syllable beneath it, and each foot group shows its foot name (italic serif).
- **Playback highlight** (see §6) works across wrapped rows. Rows shrink via `--fit` to a 0.7 floor, then wrap
  **between feet, never inside one**; there are no horizontal scrollbars in couplet boxes.
- **Meter identity** is the famous misra (in the current script) plus its pattern strip. Official ʿarūz names
  are secondary: never a row's main label, at most small faint print. Meter › Buḥūr groups families into
  *Counting bahrs* and *Shape bahrs*.
- **Ghazals:** the list is grouped by meter (group header = famous misra + pattern + count; rows = number +
  first line). In Ghalib/Mir rows the number is Fran's number linked to her page, without repeating the poet.
  Roman and Devanagari rows carry `lang` / `dir` for their script (Roman = mono, LTR). One universal search box
  covers all collections (Urdu diacritic/ZWNJ-insensitive, Roman diacritic-insensitive, Devanagari, poet,
  number); the collection switch acts as a filter. The reader header shows the meter name, a small
  "Same bahr as ‹famous misra›" reference line, and the centred pattern strip with a ▶.
- **Meter › Look up is reference, not scansion:** ▶ lights the couplet's own words in time (grafted words
  together); a per-box "Scan" toggle reveals the syllable chips, hidden by default.
- **Weight/Meter › Learn:** one rule per block — short heading, one-sentence rule, 1–3 examples in the current
  script, each with a ▶ through the player. Meter families are a vertical list, not a horizontal strip.
- **Home** (`#/home`, what a bare URL opens): what each tab is for, how to read the legend, a sample couplet to
  play, where to start.
- **Sound controls** (voice, drum/tabla, tempo, foot pause) live in the settings sheet; restyle freely but never
  remove or rename their ids or handlers.

---

## 9. Information architecture and UX rules

- **Audience:** someone who knows Urdu by ear (not necessarily the script) and wants to learn meter: syllable
  weight, scansion, an ear for the bahr. No lesson plan, no streaks, no "today" card.
- **Four skill tabs: Weight · Meter · Scan · Ghazals**, plus Home (landing), Guide and About reached from the footer.
  Weight has sub-tabs **Learn · Drill · Look up**; Meter has **Feet · Buḥūr · Drill · Look up**; Scan and Ghazals have none.
  A tab click returns to that tab's last sub-tab.
- **Header:** title · script switch (اردو / देव / Roman) · ⚙ settings. Theme, voice, tempo, foot pause, drum and ASCII
  live in the settings sheet. Nav is a fixed bottom bar under 768px and inline in the header from 768px.
- **Scan is your own text only.** Sample chips appear only as the empty state; typing help is behind ⓘ; the accuracy
  note is a footnote linking to About.
- **Ghazals:** one tab with a collection switch (Handbook · Ghalib · Mir · More Poets), one shared de-duplicated
  meter filter, one row layout, one in-place reader (every couplet with its inline scan and Pritchett's notes under
  the couplet they belong to). Label hand-written notes "Pritchett's note" and engine notes "Scanner notes"; never mix.
- **Handbook is not a tab.** Offer contextual "Go deeper" links to Pritchett's chapters.
- **Drill feedback is quiet and explains:** ✓/✗ plus a one-line reason, then Next; session score only. Use the
  explanation data the drill already has, or show the correct answer. **Never invent linguistic explanations.**
  No streaks, sounds or confetti.
- **Script switching:** every verse element carries `lang` and `dir` — Urdu `ur`/rtl in `--urdu`, Devanagari `hi` in
  `--deva`, Roman `ur-Latn`/ltr in mono. Pattern strips are always LTR.
- **Playback:** one thing plays at a time; starting another stops the first and resets its control to ▶; Esc stops.
  Tempo or voice changes apply to the next playback.
- **Required states:** Scan empty and no-fit; Ghazals zero results (offer other collections that do match); Look up
  no match ("No words match ‘<q>’."); audio unavailable (inline iPhone mute-switch tip, once). Everything is local and
  synchronous, so there are no loading states.
- **Accessibility:** tap targets ≥ 36px (≥ 30px for small tags); visible focus everywhere; nav `aria-current`;
  sub-tabs use the full tab pattern with ←/→; the settings sheet is `role="dialog" aria-modal="true"` with a focus
  trap and returns focus to ⚙; icon-only buttons have `aria-label`; a "Skip to content" link comes first;
  `prefers-reduced-motion` removes transitions (the playback highlight stays visible).
- **Copy:** plain words, no exclamation marks, no "Oops". Define a term where it first appears. Keep domain
  vocabulary (misra, sher, bahr, rukn, dum/da, izāfat, tashdīd) and source attributions exactly. Sentence case for
  prose; caps only for fixed English UI labels (§2).

---

## 10. Rules of thumb when adding UI

1. Reach for an existing class (`.btn`, `.seg-btn`, `.step`, `.dr-chips button`) before writing a new one.
2. Edit the existing rule in place; don't layer a higher-specificity override. Avoid `!important`.
3. Use tokens (`--ink`, `--line2`, `--sp-*`), never raw hex; this is what keeps both themes working.
4. If it holds Urdu/Hindi text, no caps and no letter-spacing.
5. If it needs a box, ask whether a hairline or whitespace would do instead.
6. Check it in all three scripts, both themes, and at ~390px wide.

---

## 11. Known gaps

- `.eyebrow` and `.group-title` still use the older spacing (12px / 0.08em); they could be brought in line
  with the tracked-caps scale in §2.
- Some one-off controls may still carry earlier radii (6–10px) or gold active states; fix them toward §4.3
  as they are found.
- Inter has no 600 weight; any leftover `font-weight: 600` on Inter text is a faux-bold.
- Dark, High-contrast and System themes were removed (2026-09-27); do not reintroduce them implicitly through
  `prefers-color-scheme`.
