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
