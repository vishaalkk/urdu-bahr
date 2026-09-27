# Theme redesign (agent: theme, 2026-09-26; verified by lead)

## Result
- Build OK; `test_runtime.py` all phases pass; both inline scripts pass `node --check`.
- Google Fonts removed (0 external `http(s)` src/href in index.html). System stacks: `ui-serif` / `-apple-system` / `ui-monospace`; Urdu `'Jameel Noori Nastaleeq','Noto Nastaliq Urdu','Urdu Typesetting',serif`.
- Emojis removed from nav, headings, buttons (only ✓/✗ drill feedback remain). Streak 🔥 → plain marker. Sound button reads "Sound: dum·da".
- Width: content column 1100px (was 600px); prose capped at 70ch; scansion strips/chips/nav scroll inside their own container below 640px.
- De-AI pass: pill radii 20px → 6–10px, gold glows and radial gradients removed, gold reserved for links / active tab / primary buttons / notation; section labels neutral.

## Themes
`data-theme` = dark, light, sepia, indigo, contrast; `<select id="themeSelect">` in header; persisted in localStorage (try/catch); no stored choice → follows `prefers-color-scheme`.

## Contrast (scratchpad `theme/contrast.py`)
195 foreground/surface pairs across 5 themes: 0 failures. ink 9–17:1; dim/gold/teal/rose/ok/no/ghost ≥ 7:1. **`--faint` was held at 4.5:1 — below AAA for small text; being raised to 7:1 by the integration pass (07).**

## Files
- `original_base.html` ~1–189: token block rewritten into 5 palettes + spacing/radius scales, stylesheet restyled; `paintStreak()` emoji removed.
- `scripts/build_app.py`: removed the width and `.chipbtn` CSS patches (absorbed into base), header gains theme select, nav tabs plain text, 16 emoji removals in section templates, `initTheme()` / `setTheme()` added.

## Needs a manual visual check (no browser was available)
- Each theme across all tabs, especially the theme select, Ear block flashing, Studio syllable cards.
- Mobile (375px): nav horizontal scroll, scansion strip scroll, no page-level horizontal scroll.
- Whether the palette still reads "AI" — dark theme remains purple-black with a gold accent.
