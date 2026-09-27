# Rhythm Roll

A standalone, dependency-free rhythm timeline ("piano-roll") for an Urdu metrical line
(*miṣraʿ*). Renders syllable blocks sized by metrical duration, grouped into feet
(*afāʿīl*) with their names, an optional caesura marker, and a host-driven playhead.
Supports an editable mode (toggle a syllable's weight) and a compare-to-meter overlay.

Vanilla ES module. No libraries, no network requests, no external fonts — same
constraint as the rest of this app.

Open `demo.html` directly from `file://` to see it running against three real
couplets pulled from `data/exercises_verified.json` and re-scanned with the app's
own scansion engine (`Scan.scanLine` / `Scan.explain` in `original_base.html`), plus
a small synthetic snippet demonstrating the caesura marker (none of the three meters
shown use one).

## Install / import

```js
import { mountRhythmRoll } from './rhythmRoll.js';

const roll = mountRhythmRoll(containerEl, {
  syllables: [
    { text: 'دل', weight: 'l' },
    { text: 'کا', weight: 's' },
    // ...
  ],
  feet: [[0, 3], [4, 7], [8, 11], [12, 15]], // [startIdx, endIdx] per foot, inclusive
  caesura: undefined,                        // syllable index the caesura falls before
  bpm: 80,
  editable: false,
  onChange(syllables) { /* called after a click/keypress toggles a weight */ },
  onPlay({ syllables, feet, bpm }) { /* fired when the roll's own ▶ is clicked */ },
});
```

`mountRhythmRoll` clears `container`, renders into it, and returns a handle. It does
**not** touch audio — playback is entirely the host's responsibility (see below).

## Options

| Option | Type | Notes |
|---|---|---|
| `syllables` | `{text, weight}[]` | `weight` is `'l'` (long, 2 units) / `'s'` (short, 1 unit) / `'x'` (flexible, 1.5 units, rendered hatched). `text` is whatever the caller wants shown on the block (Urdu, roman, ASCII — the widget is script-agnostic). |
| `feet` | `[number, number][]` | Inclusive `[startIdx, endIdx]` ranges. Optional — defaults to one foot spanning all syllables (no name will show unless the whole line happens to match a known pattern). |
| `caesura` | `number` | Syllable index the marker renders immediately before. Omit for none. |
| `bpm` | `number` | Drives the seconds↔pixel mapping for the playhead (see below). Default 80. |
| `editable` | `boolean` | When true, blocks become focusable buttons: click/tap or Space/Enter cycles `l → s → x → l`. Arrow Left/Right move focus between blocks; Home/End jump to the ends. |
| `onChange(syllables)` | `function` | Called with a fresh `{text, weight}[]` after any edit. |
| `onPlay({syllables, feet, bpm})` | `function` | Called when the roll's built-in ▶ button is clicked. The widget has no audio of its own — this is the hook for the host to start its player and then drive `setPlayhead`/`highlight` as it runs. |

## Returned handle

- `setPlayhead(timeSeconds)` — moves the playhead to an absolute time and auto-highlights
  the syllable it currently falls in. Call this from a `requestAnimationFrame` loop (or
  from audio-scheduled callbacks) while the host's player is running.
- `highlight(i)` — discrete step highlight (e.g. one call per note-on from a scheduler),
  independent of `setPlayhead`. `highlight(-1)` (or any negative/`null` index) clears it
  and hides the playhead line.
- `setTarget(pattern | null)` — `pattern` is a `('l'|'s'|'x')[]` aligned 1:1 with
  `syllables`. Mismatching blocks (where neither side is `'x'`) get a dashed outline and
  an updated aria-label; a small "comparing to meter" badge with a clear button appears
  in the header. Pass `null` to clear.
- `setSyllables(syllables)` — swaps in a new syllable array (e.g. switching examples).
- `setFeet(feet)`, `setBpm(bpm)`, `setEditable(bool)` — update the corresponding option.
- `getSyllables()` — current syllables (deep-ish copy).
- `destroy()` — empties the container and drops references.

## Timing model

A short syllable is 1 "unit", long is 2, flexible is 1.5. `secondsPerUnit = 30 / bpm`
(equivalently: one long syllable = one quarter note at `bpm`). `setPlayhead` looks up
which syllable a given time falls into from a unit-based timing table, then interpolates
its on-screen position from the syllable's *actual measured* pixel offset/width — so
gaps between feet and the caesura marker are automatically accounted for without needing
to duplicate that spacing logic in the timing math. The table is rebuilt on `render()`
and on container resize (via `ResizeObserver`), so it stays correct across the
375px ↔ 1440px breakpoint.

## Styling — CSS custom properties

The widget reads these from its container's cascade, each with a built-in fallback, so
it looks reasonable unmodified and re-themes instantly if the host page defines them
(see the dark-theme example in `demo.html`, which sets them on a wrapping `<div>`):

| Variable | Fallback | Used for |
|---|---|---|
| `--fg` | `#231c2e` | Widget chrome text (header, footer labels) |
| `--bg` | `#F4ECDD` | Widget background, focus-ring cutout |
| `--muted` | `#766d88` | Secondary text, foot names, rules |
| `--accent` | `#B27414` | Playhead, focus outline, play button |
| `--rule` | `rgba(35,28,46,.22)` | Borders / hairlines |
| `--long` | `#B27414` | Long-syllable block color |
| `--short` | `#11836f` | Short-syllable block color |

A flexible (`x`) syllable is rendered as a diagonal hatch of `--long`/`--short`, so it
never needs its own color variable. Syllable-block *text* is a fixed dark ink
(`#1a1526`), independent of theme — it's calibrated against the saturated
`--long`/`--short` colors, not the page background, so it stays legible in both the
light and dark demo panels.

One supplementary, optional variable: `--rr-mismatch-color` (fallback `#b3352c`) tints
the compare-overlay's mismatch outline.

## Accessibility

- The root has `role="group"` with an `aria-label` stating the syllable count and bpm.
- Every syllable block (button in editable mode, `role="img"` div otherwise) carries an
  `aria-label` like `"syllable دل, long"`, extended with `"; press space or enter to
  change"` when editable, or `", mismatch — meter expects short"` under a compare
  overlay.
- Blocks use a roving `tabindex` (one `0`, rest `-1`) so arrow keys move focus without
  tabbing through every syllable — this works in both editable and read-only mode, so
  read-only lines are still keyboard-navigable/inspectable.
- Focus and horizontal scroll position are preserved across re-renders.

## Responsive behavior

The track scrolls horizontally *within its own container* (`overflow-x: auto` on an
inner wrapper) — it never causes page-level horizontal overflow. At 375px a line will
typically need that scroll; at 1440px the three example misras in `demo.html` fit
without scrolling. Block height and font size shrink slightly under a 480px media query.

## Integration notes (future work)

This is meant to eventually replace two spots in `original_base.html`:

1. **Ear tab** — the flashing `.blk.lit` rows (`renderEar()`, `playPat()` in
   `original_base.html`) map onto `highlight(i)` / `setPlayhead(t)` called from the
   existing `play(seq, opts)` audio engine's `onStep` callback, instead of manually
   toggling a `lit` class on hand-built `.blk` spans.
2. **Studio tab** — the per-line syllable scansion cards (built in `runStudioScan()`)
   map onto one `mountRhythmRoll` per scanned misra: `syllables` from
   `explain(res, fit).syl` (`text`/`resolved`→`weight`), `feet` from grouping by
   `s.foot`, `caesura` from the fit's meter `cae` index. The couplet verdict banner and
   paired-meter logic stay outside this widget — it only owns the per-line timeline.

Neither integration is wired up here — this folder only contains the standalone
widget and its demo, per the task's file boundary (only files under
`features/rhythm-roll/` were touched; `original_base.html` audio playback is being
rewritten separately).

## Files

- `rhythmRoll.js` — the widget (single ES module, styles self-injected).
- `demo.html` — three real-verse examples (Hazaj mafāʿīlun ×4, Ramal fāʿilātun ×3 +
  fāʿilun, Mujtass mufāʿilun/faʿilātun/mufāʿilun/faʿilun) plus a caesura-marker
  preview, wired to a demo-only WebAudio click track.
