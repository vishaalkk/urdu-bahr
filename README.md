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
index.html                    Production app (standalone; see below)
"urdu-meter-trainer 2.html"   Byte-for-byte mirror of index.html
original_base.html            Pre-build HTML that scripts/build_app.py patches
test_runtime.py               Verification suite (see "Test")
data/                         JSON data compiled into index.html (handbook text,
                               exercises, meters, dictionary, bibliography)
source_data/                  Raw scraped handbook/exercise HTML from Pritchett's site
pritchett_scripts/            Sean Pue's AST-graph transliteration engine
scripts/                      Build & data-extraction scripts
scratch/                      Ad hoc diagnostic scripts, not part of the app
docs/reviews/                 Design/architecture review notes (see below)
```

`index.html` and `"urdu-meter-trainer 2.html"` must stay byte-for-byte
identical; both are written by the build script, never hand-edited
individually.

## Build

```
uv run python scripts/build_app.py
```

Regenerates `index.html` and `"urdu-meter-trainer 2.html"` from
`original_base.html` and `data/*.json`. Do not edit either HTML file by
hand — change the generator or the data instead, then rebuild.

## Test

```
uv run python test_runtime.py
```

Runs a 6-phase suite: verbatim handbook content, audited ghazal exercise
data, the Sean Pue transliteration engine (via Node), a sandboxed run of
the app's inline scripts (meter labeling, studio scansion, script
switching, sequential audio), byte-for-byte file mirroring, and
bibliography/UI integrity. Requires `node` on `PATH` in addition to `uv`.

## Deploy

The app is a static file, so it deploys directly to GitHub Pages:

1. In the repo settings, under **Pages**, set **Source** to **GitHub
   Actions**.
2. Push to `main` (or run the workflow manually). `.github/workflows/pages.yml`
   runs the test suite, then publishes `index.html` and `.nojekyll` to
   Pages. The deploy is blocked if the test suite fails.

The workflow currently ships the prebuilt standalone HTML directly (no
npm build step); a commented-out alternative in the workflow shows how to
switch to a Vite build once the app is modularized (see
`docs/reviews/04-architecture-react-xyflow.md`).

Only public, non-copyrighted-source files are published — `scripts/`,
`source_data/`, `data/`, `scratch/`, `original_base.html`, and the
duplicate trainer HTML are intentionally excluded (see "Licensing" below
and the workflow's staging step for the full list).

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
