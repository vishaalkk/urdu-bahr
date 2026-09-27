# Rhythm/sound exploration — beyond flat tabla

## Diagnosis (grounded in original_base.html)

`tabla()` (line ~1091) plays the same two fixed frequencies every time — 311 Hz
for long, 370 Hz for short, always the same harmonic ratios `[1,2,3,4.15]` and
the same envelope. Every "ta" sounds identical to the last "ta"; every "ti" to
the last "ti". `play()` (line ~1121) schedules onsets by pure addition
(`t+=dur`) with `settings.footGap` a fixed 0.5-beat pause — perfectly
quantized, no timing variance at all. `syllableSound()` only varies volume two
ways: `0.45` for extrametrical, and `vol*=0.84` for non-foot-first syllables
(line 1135) — a flat two-level dynamic, not the swell/fade of real recitation.
There is no tonal center: each hit decays into silence before the next, so the
ear never gets a key to hear the long/short *pattern* against — it just hears
isolated percussive events. `voice()` (line 982) already proves the engine
*can* do phrase contour (its `pos`-driven pitch drift and vibrato-bloom) and
`voice.patch` already proves it can do legato/crossfade scheduling — but
neither made it to the tabla path, which is what's actually shipped by default.

## Options prototyped (demo.html, scratchpad)

**a. Tanpura-style drone (cheap, synthesizable).** 3 detuned oscillators
(root/fifth/octave) + a slow 0.18 Hz amplitude wobble, gain ~0.05, running
under the whole line. Gives the ear a tonal home so long/short reads as
rhythm-against-a-key rather than isolated clicks. Zero recording needed.

**b. Micro-timing + phrase accelerando (cheap, synthesizable).** `jitter()`
displaces each onset by ~0.6% of a beat on foot-first/strong beats and ~4.5%
on weak ones (real reciters are rhythmically precise on the downbeat, loose
elsewhere); `phraseCurve()` bows the tempo across the line — a shade slower at
the start, easing forward, settling again at the end. This is the single
biggest "robotic → human" lever, and it's a pure formula, no new audio.

**c. Pentatonic pitch contour (cheap, but changes tabla's character).**
Instead of 2 fixed pitches for the whole line, `pitchContourMul()` walks a
5-ratio near-1.0 scale (`[1, 9/8, 5/4, 3/2, 27/16]`) foot-by-foot, dipping down
at a caesura and resolving to the root on the last foot — mimicking a ghazal's
rise-and-cadence. Synthesizable, but it's the most audibly different of the
three, so I'd ship it **off by default**, as a toggle.

**d. Karplus-Strong pluck / harmonium stab** — sketched only lightly in the
demo notes, not built out; cheap in principle (a plucked-string comb filter)
but needs real tuning/EQ work to not sound thin. Lower priority than a/b/c.

## What needs real recording — none of this does

All three options above are pure DSP on top of the existing synthesized
`tabla()`; nothing here requires the owner to record anything new. If the
owner later wants a genuinely different *timbre* (real harmonium chord, real
sitar pluck, a second tabla stroke type), that's the same precedent as the
existing `TABLAPACK`/`VOICEPACK` recordings and `voice.patch`'s ask: short,
single-stroke clips (~0.5–0.8s), trimmed, one WAV per syllable/stroke type,
dropped into a new `*PACK` constant the way `TABLAPACK` was.

## Recommendation

**Micro-timing/accelerando + drone, on by default; pentatonic contour as an
opt-in toggle.** (a)+(b) fix the "robotic" complaint directly (no timing
variance, no tonal center) without changing what the tabla *is*, so they're
safe defaults. (c) is a bigger character change some users may not want on a
sober classical bahr recitation — hence the toggle. "All combined" in the demo
is the most *musical*, but (c) alone already reads less like tabla and more
like a mallet instrument, so judge it by ear before defaulting it on.

## Files

- Demo (open in a browser yourself, click any of the 5 buttons per line):
  `/private/tmp/claude-501/-Users-vishalk-personal-repo-urdu-bahr/d53bbc33-6bcb-4099-9c82-c3b1cd6b1dd3/scratchpad/rhythm-demo/demo.html`
- Draft patch (not applied) implementing the recommended combination against
  `original_base.html`:
  `/Users/vishalk/personal-repo/urdu-bahr/features/voice-flow/rhythm_sound.patch`
