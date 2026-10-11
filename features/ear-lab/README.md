# Ear lab (parked mockup)

A standalone mockup of ear training for the bahr, started from a Gemini draft and fixed. Three tabs:

1. **The Living Groove**: the same verse four ways (today's strokes; drone + sub-pulse; tarannum in a raga; da · dum
   with the afāʿīl lighting up), couplets with the rhyme hook. **Shipped** in the app as Settings › Sound ›
   Groove / Tarannum (`src/js/15b-tarannum.js`), which has since moved on (ten ragas, real sarangi samples).
2. **Spot the Limp**: real Ghalib/Mir lines; one fixed-weight syllable flipped so no meter accepts the line
   (`Scan.matchWeights` empty), played on the actual word; tap the word that tripped. **Not in the app yet.**
3. **Tuning Fork & Tap Along**: an anchor verse per bahr (khafīf, hazaj, ramal), looped; taps scored against the
   meter (±90 ms), or read back as = – when tapping freely. **Not in the app yet.**

Open it from the repo root on the local server: `localhost:8000/features/ear-lab/rhythm_mockup.html` (it borrows
`src/styles` and `src/fonts`).

Rebuild after the app changes (`npm run build` first):

    node features/ear-lab/gen.js . features/ear-lab/rhythm_mockup.html

`gen.js` loads the built `index.html` in jsdom and takes every syllable, weight, foot, afāʿīl label, couplet,
rhyme and provable limp from the real scanner and corpus, plus the app's recorded tabla and da · dum takes.
Mir's Hindi meter is left out of the limp drill: the matcher cannot prove a limp in it.

## Taal mockups (tabla under the bahr)

The tabla theka, its ribbon and the bouncing ball started here and are now in the app (`src/js/15c-taal.js`). The mockups
stay for trying ideas: `taal.html` (each taal on its own, and eight couplets laid on a taal) and `taal_view.html` (the
couplet in the app's look, the ribbon as a mixer, the ball's options). Both are generated, not committed:

    node features/ear-lab/taal_gen.js . features/ear-lab/taal.html features/ear-lab/taal_view.html

`taal_gen.js` scans the couplets with the built app (jsdom), inlines the strokes from `data/tabla/` (sources and licences in
`data/tabla/SOURCES.md`) and the engine in `taal_engine.js`, into `taal_template.html` and `taal_view_template.html`.
