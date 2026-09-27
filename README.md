# Urdu Bahr — Interactive Meter Handbook & Studio

An interactive, offline-first web application for learning, scanning, reciting,
and composing Urdu poetry (*sh'er*) according to the classical
Arabic-Persian-Urdu prosodic system (*ʻIlm-e-ʻArūz* / علم عروض).

The app bundles the unabridged handbook text, 24 fully audited classical
ghazals, a 37-meter catalog, a multi-script transliteration engine, a
"Poet's Studio" for scanning your own couplets, and Web-Audio-based rhythm
playback and ear training — all in a single self-contained HTML file with
zero runtime network requests.

## Credits

- **Frances W. Pritchett & Khawaja Ahmad Khaliq Anjum**, *Urdu Meter: A
  Practical Handbook* (1987; Columbia University web edition). The
  handbook text, exercises, and scansion notes embedded in this app are
  drawn directly from their work.
- **A. Sean Pue**, AST-graph transliteration parser from *A Desertful of
  Roses* (Columbia University / Michigan State University), used for
  Urdu / Devanagari / Roman conversion.

See the in-app **Bibliography** tab for full citations.

## Repo layout

```
index.html              The app — built output, the only file GitHub Pages serves
src/                    App source: manifest.json, head.html, body/*.html partials,
                        styles/*.css, js/*.js (concatenated in manifest order), fonts/
scripts/build_app.py    Build: src/ + data/ → index.html (fonts and data inlined)
scripts/check.sh        Build + every test (what CI runs)
test_runtime.py         Content + sandboxed-script verification suite
tests/                  corpus_scan.js, chip_translit_consistency.js, dom_smoke.js (jsdom)
data/                   JSON compiled into index.html (handbook, exercises, meters,
                        glossary, Ghalib/Mir corpora, bibliography)
source_data/            Raw scraped handbook HTML/text (build input; not published)
pritchett_scripts/      A. Sean Pue's ghalib.js transliteration engine (Apache-2.0)
features/               Standalone widget experiments (not in the app)
docs/                   Design specs (REDESIGN_HANDOFF.md, RESKIN_BRIEF.md), reviews, mockup
LICENSES/               Third-party notices (ghalib.js Apache-2.0, OFL fonts)
```

Never hand-edit `index.html`; change `src/` or `data/` and rebuild.

## Develop

Needs [`uv`](https://docs.astral.sh/uv/) (Python 3.12) and Node 20+.

```
npm install        # once: jsdom for the DOM smoke test
npm run build      # src/ → index.html
npm test           # build + all tests (scripts/check.sh)
open index.html    # the app runs straight from the file — no server needed
```

The tests:

- `test_runtime.py` — handbook text, audited exercises, the transliteration
  engine, a sandboxed run of the app's scripts, and self-containment checks.
- `tests/corpus_scan.js` — the scanner against the 24 Handbook ghazals' answer keys.
- `tests/chip_translit_consistency.js` — syllable-level vs whole-line transliteration.
- `tests/dom_smoke.js` — loads the built page in jsdom: no nested sections, no
  duplicate ids, no network resources, every tab and sub-tab renders when
  deep-linked, drills mount, family rows expand, search is diacritic-insensitive.

The build itself also fails if a `src/manifest.json` body partial isn't placed
in the page or `<section>` tags are unbalanced.

## Deploy (GitHub Pages)

1. Repo **Settings → Pages → Source: GitHub Actions** (one-time).
2. Push to `main`. `.github/workflows/pages.yml` installs dependencies, runs
   `npm test`, fails if the committed `index.html` doesn't match a fresh build,
   then publishes `index.html` + `.nojekyll`. Pull requests run the tests only.

Only `index.html` is published; `src/`, `scripts/`, `data/`, `source_data/`,
`docs/` and `tests/` are not (everything the app needs is compiled in).

## Status / roadmap

Ongoing design and architecture review notes live in `docs/reviews/`:

- [`02-tab-naming.md`](docs/reviews/02-tab-naming.md) — review of tab
  names/labels across the app.
- [`04-architecture-react-xyflow.md`](docs/reviews/04-architecture-react-xyflow.md)
  — evaluation of rebuilding on React + xyflow (recommendation: no; de-risk
  the `build_app.py` string-patching build instead, then modularize).
- [`06-improvements.md`](docs/reviews/06-improvements.md) — audited
  findings against the exercise data with proposed fixes.

More review docs may be added to that directory over time; check it for
the current state of open work.

## Licensing (open item for the repo owner)

This repository embeds substantial verbatim text from Frances W.
Pritchett & Khawaja Ahmad Khaliq Anjum's *Urdu Meter: A Practical
Handbook* — both in `data/handbook_verbatim.json` (baked into
`index.html`) and as raw scraped HTML in `source_data/`. No license for
redistributing this text has been confirmed. Before making this
repository or its deployed site public, the owner should:

- Confirm the copyright/licensing status of the handbook text and
  exercises with Columbia University's web edition and/or the authors.
- Decide whether verbatim reproduction is permitted, requires attribution
  terms beyond what's in the Bibliography tab, or needs to be reworked
  (e.g. summarized/linked instead of reproduced).

Until that's resolved, `source_data/` (the raw scraped originals) is kept
out of the public GitHub Pages deploy; `data/handbook_verbatim.json` is
still compiled into the published `index.html` itself, so this does not
fully avoid the question — it only avoids publishing the raw HTML
separately.
