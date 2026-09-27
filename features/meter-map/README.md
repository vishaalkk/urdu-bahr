# Meter family map

A standalone, dependency-free ES module that renders the classical
prosodic families (*ʻarūz*) as an interactive SVG map: family "hub" nodes
fanned out to their individual meters, with a distinct dashed link drawn
between classically paired meters (e.g. #14 ↔ #15).

No framework, no CDN, no `fetch`. The caller supplies data in memory.

## Files

- `meterMap.js` — the module. Exports `mountMeterMap(container, options)`.
- `demo.html` — standalone demo, opens directly over `file://`.
- `demo-data.js` — generated data file the demo loads via `<script src>` (not a module import), so there's no `fetch()` of local JSON, which Chrome/Firefox block under `file://` CORS rules.
- `build-demo-data.mjs` — regenerates `demo-data.js` from `../../data/meters.json`. Run `node build-demo-data.mjs` after that file changes upstream.

## API

```js
import { mountMeterMap } from './meterMap.js';

const handle = mountMeterMap(containerEl, {
  meters,      // array — see "Meter object shape" below
  pairs,       // optional [[idA, idB], ...], e.g. [[1,9],[14,15],[16,17],[18,19],[33,34]]
  onSelect(meter) {},    // called on click / Enter on a meter node, with the ORIGINAL object from `meters`
  playMeter(meter) {},   // optional; called alongside onSelect on the same interaction
});

handle.update({ meters, pairs });  // re-render with new data (also resets onSelect/playMeter if passed)
handle.destroy();                   // remove listeners + DOM, tears down the ResizeObserver
```

### Meter object shape

The module is built to consume `data/meters.json`'s `standard` array
directly, plus two extra groups. Recognized fields per item:

| field | required | notes |
|---|---|---|
| `id` | yes | number (standard meters) or string (e.g. `"R2"` for rubāʻī). Must be unique. |
| `name` | yes | display name. First word is used to derive the family (e.g. `"hazaj musaddas..."` → Hazaj) unless `family` is set explicitly. |
| `raw_name` | no | ASCII technical name, shown under the display name in the detail panel. |
| `pattern` | no* | long/short string, e.g. `"= = = / = - = / - = ="`. Parsed into feet by splitting on `/`; `//` (or any run of 2+ slashes) marks a caesura. `*` after a syllable mark renders it with a small dot — see "Known data quirks" below. Omit for meters described only by `feet` (see Hindi meter, below). |
| `caesura` | no | boolean; shown as a badge in the detail panel. |
| `paired` | no | array of other meter ids this one pairs with. Merged with the `pairs` option (either is sufficient; both is fine — de-duplicated). |
| `notes` | no | free text, shown in the detail panel. |
| `family` | no | explicit family label; skips name-based derivation. |
| `group` | no | `'rubai'` or `'hindi'` buckets the item into the Rubāʻī / Hindi-meter group instead of deriving an Arabic family name. |
| `description` | no | shown in the detail panel (used by the Hindi meter, which has no single fixed pattern). |
| `feet` | no | array of alternate foot-shape strings (each parsed like `pattern`), for meters with no single fixed sequence — currently only Mir's Hindi meter in the source data. |

`*` required unless the item sets `group: 'hindi'` and provides `feet` instead.

## CSS variables

The component reads these on `:root` (or wherever the mount container
inherits from) and falls back to a dark palette matching the current app
theme if unset:

| variable | used for | fallback |
|---|---|---|
| `--fg` | node labels, primary text | `#ECE3D0` |
| `--bg` | node fill (so strokes/labels read against the page background) | `#161320` |
| `--muted` | secondary text, node strokes, family-membership lines | `#a79db3` |
| `--accent` | focus ring, active/selected/paired highlight, paired-meter dashed links | `#E6A93C` |
| `--rule` | thin structural dividers (legend rule, caesura tick) | `rgba(236,227,208,.16)` |
| `--long` | long-syllable blocks | `#52CBB6` |
| `--short` | short-syllable blocks | `#E87AA0` |

These names were chosen to match the app's in-progress re-theme (moving
off the current `--ink`/`--dim`/`--gold`/`--line`/`--teal`/`--rose`
names). Until that lands, `demo.html` defines these vars directly at
`:root` / `:root[data-theme="light"]` with values taken from the app's
existing dark/light palettes, so the map looks native today and needs no
changes once the rename lands — only the variable *names* need to line
up.

Styles are injected once into `<head>` as a single `<style>` tag guarded
by a marker attribute, so mounting the map more than once on a page is
safe.

## Interaction & accessibility

- Hover or focus a meter node: highlights its family's structural lines,
  dims unrelated nodes, highlights its paired partner (if any), and
  updates the detail panel below the map with its name, feet (grouped
  long/short blocks split at `/` boundaries, with a caesura tick where the
  source marks one), and notes.
- Click, or focus + Enter/Space: calls `onSelect(meter)`, then
  `playMeter(meter)` if provided.
- The whole map is one `role="tree"`; family hubs and meters are
  `role="treeitem"` with a roving `tabindex` (one stop from outside the
  widget). Arrow keys / Home / End move between nodes in document order
  (family hub, then its meters, next family, ...); Enter/Space on a hub
  jumps focus to its first meter; Enter/Space on a meter selects it. Every
  node has a descriptive `aria-label` (meter nodes include their pair
  partner's id, when any).
- The detail panel is `aria-live="polite"` so screen readers announce
  updates as focus moves.

## Responsive behavior

- **≥ 640px** container width: a radial cluster layout — family hubs on
  an inner ring, their meters fanned out on an outer ring within the
  family's angular sector. The SVG uses a `viewBox` and scales to fill
  the container (no scrolling needed); a `ResizeObserver` re-renders on
  width/aspect-ratio changes.
- **< 640px**: a vertical stacked layout — one horizontal band per
  family, hub on the left, its meters laid out left-to-right. If a
  family's meter count makes a band wider than the viewport, only the
  map's own wrapper scrolls horizontally (`overflow-x: auto` on an inner
  div) — the page itself never gets a horizontal scrollbar. Verified by
  hand at 375px in the source (see "Verification" below).

The breakpoint is a module-level constant (`NARROW_BREAKPOINT = 640`) if
it ever needs tuning for the actual Meters-tab container.

## Verification

**Logic**: Because the browser-automation tool was unavailable this
session (`claude-in-chrome` extension not connected — tried twice, see
"Known issues"), I couldn't get a real screenshot. Instead I exercised
every DOM-independent function (`parsePattern`, `buildModel`,
`layoutRadial`, `layoutStacked`, `deriveFamily`) directly in Node against
the actual `data/meters.json`:

- `parsePattern` correctly handles meter #1's irregularly-spaced pattern
  (`"= = = /= - = / - = ="`, note the glued `/=`), the `*`-flagged
  syllable in meters #14–19, and the `//` caesura in meter #2.
- `buildModel` over the full 48-item set (37 standard + 10 rubāʻī + 1
  Hindi) indexes all 48 meters, resolves all 5 pairs from the `PAIRS`
  list with none missing, and (after a fix — see below) orders the 13
  resulting groups exactly as Handbook Chapter 6 does, with Kāmil, Rubāʻī,
  and Hindi appended after the 10 named families.
- `layoutRadial`/`layoutStacked` produce finite (non-NaN) coordinates for
  all 48 meters at both 375px and 1440px container widths.

**Bug this caught**: my first `FAMILY_ORDER` list used idealized
canonical spellings (`khafif`, `mujtass`, `sarii`, `mutadarak`) that
didn't match what the family-derivation logic actually produces from the
data's real spellings (`xafif`, `mujtas`, `sari`, `mutadarik`) — labels
still resolved correctly via aliases in `FAMILY_LABELS`, but those four
families silently fell out of classical order into an "unrecognized"
fallback bucket. Fixed by pointing `FAMILY_ORDER` at the confirmed real
keys (see the comment above that constant in `meterMap.js`).

**Visual**: not done — please re-verify in a real browser (open
`demo.html` directly, or via the `claude-in-chrome` tools once
reconnected) before relying on the radial layout's visual spacing,
overlap-avoidance at high meter-counts-per-family (Hazaj has 9), and the
375px stacked layout's actual scroll behavior.

## Known data quirks / uncertain items (flagging for the lead)

1. **11 families, not 10, in the standard 37.** Meter #37
   (`kāmil musamman sālim`) belongs to a "Kāmil" family not in the brief's
   list of ten. I've included it as an extra group after Mutadārak rather
   than dropping or misfiling it — worth a decision on whether it's
   in-scope for the Meters tab at all, or a data-entry anomaly.
2. **The `*` marker in `pattern` is undocumented.** It appears on the
   first syllable of meters #14–19 (all four are members of the two
   paired-meter groups #14/15 and #16/17, plus #18/19) but *not* on #1,
   #9, #33, #34 — which are also paired meters with the same
   "final-long-splits-into-two-shorts" pairing structure the handoff
   describes. So `*` doesn't mark the pairing-relevant syllable; its
   actual prosodic meaning (possibly the "cheat"/overlong flexibility
   mentioned for syllable cards elsewhere in `PROJECT_HANDOFF.md` §4.3)
   isn't stated in the JSON. I render it as a small accent dot on that
   block with a generic `title` rather than asserting a meaning — worth
   checking against the Pritchett handbook source if it needs a real
   label.
3. **Rubāʻī `name` fields contain embedded newlines/indentation** (e.g.
   `"axrab makfūf \n            abtar"`), and rubāʻī skips id `"R1"` and
   `"R11"` (ids present: R2–R10, R12). The module collapses whitespace
   defensively when building the display name; the missing ids look like
   an intentional gap in the source rather than a bug on my end, but
   worth confirming.
4. **Inconsistent whitespace in `pattern` strings** — meter #1 has `/=`
   glued with no space, unlike every other meter. `parsePattern` strips
   all whitespace before scanning, so it's tolerant of this, but it's a
   likely typo in `data/meters.json` worth fixing at the source if other
   tooling parses these patterns by splitting on `" "`.
5. **No per-meter afāʻīl (named feet, e.g. "mafāʻīlun") in the data** —
   only the raw long/short `pattern` string. The "feet" row in the detail
   panel is therefore the pattern split into groups at `/` boundaries,
   not named foot units. If named feet exist elsewhere (e.g. in
   `handbook_verbatim.json`) and are wanted here, that's a follow-up.

## Integration note (for later)

Per the brief, integration into the real Meters tab is deferred until
after that tab is refactored out of the current `original_base.html` /
`build_app.py` string-patching pipeline. When that happens:

- Mount into a dedicated container inside the **≋ Meters** tab section
  (e.g. above or below the existing 37-meter list), sized with a
  reasonable `min-height` (the module defaults to `320px` on its root but
  the radial layout wants real room — 420px+ is comfortable).
- Pass `data.standard` (with `group: 'standard'` implied by absence),
  `data.rubai.map(m => ({...m, group: 'rubai'}))`, and a synthesized
  single-item array for `hindi_info` (see `build-demo-data.mjs` for the
  exact shape) concatenated into one `meters` array, plus the existing
  `PAIRS` constant from `build_app.py`'s `runStudioScan()` as `pairs`.
- Wire `onSelect` to whatever currently happens when a meter card is
  tapped in that tab (e.g. scroll-to/highlight its existing detail card,
  or pipe it into the Studio the way "Scan in Studio" does elsewhere).
- Wire `playMeter` to the existing rhythm-playback function (`play(seq,
  opts)` per §4.2 of `PROJECT_HANDOFF.md`) if a meter's cadence should
  audition on click — the brief allows this to be a no-op for now by
  simply not passing `playMeter`.
- The CSS variable names (`--fg`, `--bg`, `--muted`, `--accent`, `--rule`,
  `--long`, `--short`) assume the in-progress re-theme; until it lands,
  either define these vars alongside the existing ones on `:root`, or
  wrap the mount container in a small block that maps old → new (e.g.
  `--fg: var(--ink); --muted: var(--dim); --accent: var(--gold); --rule:
  var(--line);` — `--long`/`--short` have no existing equivalent and can
  reuse `--teal`/`--rose` as a stopgap).
