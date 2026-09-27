# Design & interaction pass (agent: design2, 2026-09-27)

## Result
- Build OK; `test_runtime.py` all 6 phases pass; `node tests/corpus_scan.js` unaffected (top-1 96.5%, top-3 98.7% — no regression).
- Contrast script: 0 failing pairs out of 195 (unchanged from the theme pass — no colors were added, only reassigned to already-validated tokens).

## Task B — word-chip interaction redesign (Scan tab)
- **Removed**: the dashed `.words`/`.wbtn` row above every scanned line (was rendered by `lineHTML`/`lineInner` in `original_base.html`, calling `pickWord(li,wi)`).
- **New surface**: the syllable/foot chip grid itself is now the single clickable target. `Scan.explain()`'s returned syllables (`e.syl`) already carry a `word` index (`step.u.from`, set at `original_base.html:895`) — no new data plumbing was needed.
  - `chipHTML(s,i,li)` (was `chipHTML(s,i)`) now takes an optional line index `li`. When present, each `.cw` wrapper (chip + foot-syllable label) gets `onclick="pickWord(li, s.word)"`, class `click`, and state classes `wsel`/`wov` mirroring the old `.wbtn.sel`/`.wbtn.ov`.
  - `chipsHTML(syl,feet,li)` threads `li` through to every chip. Call sites: `lineHTML`/`lineInner` now pass `li`; `singAlong()`'s call (Ear tab, playback-only) intentionally omits it, so those chips stay non-interactive.
  - New CSS: `.cw.click{cursor:pointer}`, `.cw.click:hover .chip{border-color:var(--line2)}`, `.cw.wov .chip{box-shadow:inset 0 0 0 1.5px var(--rose)}`, `.cw.wsel .chip{box-shadow:inset 0 0 0 1.5px var(--gold)}`.
  - `wordPanel(r,li,wi)` and `pickWord` are unchanged; the panel now renders directly under the chip grid instead of under the dashed row.
- **Preserved**: `playScan`/`singAlong` still `querySelectorAll('.chip')`/`('.fgrp')` — untouched, since the wrapper/attribute additions don't affect class-based lookups. RTL layout, `.sel`/`.ov` semantics, and the "Hear it" flash highlighting were verified by re-reading the query paths (no audio/playback code was touched).
- **Known limitation, by design**: when the scan produces **no fit at all** (`!f` branch — the "Doesn't scan as typed" case), there is no syllable/chip grid to click, so the dashed `.words` row is kept as a fallback *only* in that branch — otherwise there'd be no way to fix a broken line via the UI. This is the one place `.wbtn` markup still renders.
- **Known limitation, multi-word steps**: a syllable's `word` field is the *first* word index of its metrical step (`step.u.from`); a step that grafts two words together (rare — iẓāfat/vāv compounds) exposes only that first word's reading options via the chip click, not the second. The old dashed row let you click every word independently regardless of step grouping. This is a minor loss of granularity in an edge case, not a functional regression for the common single-word-per-step case.

## Task A — elegant redesign pass (gold consolidation)
Per the owner's "still feels AI-ish" note, the biggest concrete tell was gold used as generic interactive-chrome (every hover, every "selected" pill/tab/segment) rather than as a considered accent. Card treatment, spacing tokens, radius scale, and type scale were already handled by the prior theme pass (01) and are in reasonable shape — I did not re-touch those.

Reserved gold for exactly two roles app-wide: the primary CTA (`.btn.gold`) and the current bottom-nav tab (`nav button.on`) — plus the pre-existing, semantically load-bearing uses (long-syllable notation, caesura mark, foot-end divider, focus ring, text-link color, the "warn" callout, the word-selection ring). Converted every other "active/hover chrome" instance to neutral (`--ink`/`--raise`/`--ghost`, already-validated tokens):
- `.chipbtn:hover`, `.btn:hover`, `.play:hover`, `.pad:hover` → border to `--ghost` instead of gold glow.
- `.chipbtn.on` (script switcher, اردو/देवनागरी/Roman/ASCII) → `--raise` fill + `--ink` border, was solid gold fill.
- `.seg button.on` (segmented controls) → `--raise` fill + `--ink` text, was solid gold fill.
- `.fchip.on` (Ear/Dictionary "famous verse" chip) → `--raise` fill + `--ink` border, was solid gold fill.
- `.sopt.on` (settings sheet option) → `--ink` border + `--raise` fill, was gold border/tint.
- `details.gloss>summary` (glossary disclosure) → `--ink` text, was gold.
- Left untouched: `.pad.hit` (audio drill hit-feedback — playback-adjacent, out of scope), `.play` icon color (pairs with the CTA as the app's one other "primary action" cue), notation/warn/focus-ring uses.

## Visual-check list for the owner (no browser was available this session)
1. **Scan tab, any line that scans successfully**: confirm the dashed word row is gone and clicking a syllable/chip opens the reading-options panel for the right word; click a couple of different words in the same line and confirm the gold selection ring moves correctly and RTL order isn't scrambled.
2. **Scan tab, a line that fails to scan** (e.g. try garbled input): confirm the fallback dashed row still appears and still lets you fix a word's reading.
3. **"Hear it" playback** on a scanned line: confirm the flashing highlight during playback still lands on the right chips/feet (unchanged code, but worth a look since the DOM around `.chip`/`.fgrp` changed).
4. **Header script switcher** (اردو/देवनागरी/Roman/ASCII): active button should now read as an outlined/filled neutral state, not solid gold.
5. **Ear tab**: famous-verse chip scroller selected state, and the practice-mode segmented control — both should be neutral now, not gold-filled.
6. **Studio tab**: settings sheet (voice/timbre picker) selected option — neutral border, not gold.
7. **Bottom nav bar**: confirm the current tab is still clearly gold — it's now one of only two gold uses in the whole app, so it should read as a stronger, more deliberate signal than before.
8. Spot-check all 5 themes (dark/light/sepia/indigo/contrast) for the above, since the neutral tokens (`--ink`/`--raise`/`--ghost`) resolve differently per theme.
