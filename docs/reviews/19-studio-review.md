# 19 — Review of `studio_mockup.html` (Gemini): Ghazal Studio + "Decipher the Baḥr"

Reviewer: Claude. Scope: `studio_mockup.html`, `src/styles/studio.css` (both untracked), against `docs/DESIGN_PRINCIPLES.md`, `AUDIT_BUGS_AND_FEATURES.md` Parts 1–3 and 9, and the production engine (`src/js/01-engine.js`, `15-audio.js`, `17-ear.js`, `18-tap.js`, `22-drill.js`).

Method: rendered in headless Chrome at 1280px (studio empty, studio with sample, trainer mid-scan, trainer complete). Screenshots are in the session scratchpad (`studio-1280.png`, `sample-1280.png`, `p3-1280.png`, `pdone-1280.png`). Headless Chrome will not go below about 500px window width, so the "390" shots are cropped 500px layouts. I did not trust them for overflow claims. Mobile findings below come from reading the CSS (tap sizes, media queries), not from the crops. I also ran the real engine in node to check the mockup's data.

Verdict: the shell is faithful to Quiet Manuscript. It reuses the header, tokens, hairlines and `.seg`, and the palette is right. The product underneath is wrong. It is two apps on one screen, the trainer is built on fabricated data and not on the engine, it gives the answer away, and the composer's scan display is visibly broken.

---

## 1. Top 10 problems, ranked

### 1. The trainer's content is fabricated, so it teaches wrong prosody (correctness, critical)
Evidence (`PRACTICE_VERSES`, lines 954–1041):
- **Mir verse:** the displayed line is `ہستی اپنی حباب کی سی ہے`, which is about 10 syllables. The data holds 14 syllable objects, including `ye`, `numā`, `yish`, `sar`, `āb`. Those come from the second misra, `یہ نمائش سراب کی سی ہے`, so the tiles do not match the verse on screen.
- **Faiz verse:** the tokens are `bā`, `de`, `nau`, `ba`, `hār`, `cha`, `le`, `bā`, `ġh`. That is nonsense syllabification, invented to hit 15 slots.
- **Rule strings:** these are made up per tile, e.g. "Cadence link carries 1 beat", "Syllable lengthened in rhythmic flow", "Shortened vowel bridging foot boundary". They explain a weight by pointing at the meter's own target, which is circular. Real rules are `Scan.sylRule` / `Scan.explain`.
- **Wrong Urdu glyphs:** `tu` renders as `ث` in the screenshot because `تُ` collapses.
- **Wrong rule on `jhe`:** the mockup says "Aspirated consonant with long vowel". `جھے` is long because of the open `-e` syllable, not the aspirate.
- **Mismatched meter data:** engine `#14` is `x - = = / - = - = / = =`, but the catalog lists `#14` as `= - = = / …`. Engine `#1` is `= = = / = - = / - = =`, which is not "Hazaj Sālim `- = = =`". Ids `#17`, `#21`, `#25` and `#11` also do not match the engine. The names were guessed.

Fix: no hand-authored syllable/rule data. Take the verse text, run `Scan.scanLine`, and read weights and rules from `Scan.diagnose(res, meter).syl[*]` (fields `text`, `resolved`, `foot`, `fsyl`) and `Scan.explain` / `Scan.sylRule`.

### 2. It shows the answer too early, which violates Part 9's own rationale
Evidence:
- Every syllable tile is pre-segmented and pre-romanised. `e` (the izāfat) is its own tile, which tells the learner where the izāfat is.
- **Wrong-tap feedback names the answer:** `⚠️ … takes 2 beats … Try pressing 2.` Combined with the rule that a wrong tap does not advance, this is a guess-until-green game with no score.
- **Radar row 1 gives it away:** the first correct tap eliminates most of the 8 meters. In the p3 shot, 5 taps isolated `#14`, so the "mystery" is solved by tap 5.
- **Correct-tap feedback** prints the rule for the syllable just tapped ("has 2 beats because …") on every tap, so the learner reads the answer for the next syllable once they see the pattern.
- **The Studio placeholders are the anchor verse itself.** The empty input shows the Ghalib misra, so a "compose" screen invites copying.
- **Meter name reappears in `Mystery Baḥr` badge context and the radar names before completion.**

Fix: ear-first order, per Part 1. Play the line, learner taps 1/2 per syllable, learner **commits** the whole line, and only then does the app diff against the engine and reveal weights, rules and meter. Hints are opt-in and cost a point. Wrong taps are recorded (not blocked) and shown at the end.

### 3. Two products on one screen behind a tab, with a title that names both
Evidence: H1 is "Ghazal Writing Studio & Decipher Trainer", the lede is two sentences joined by "or", and the tabs are "Ghazal Writing Studio" and "Decipher the Baḥr (Trainer)". The first-screen answer to "what do I do here?" is "either of two unrelated things", and the default tab is the harder one (compose, 4 empty RTL fields). Part 1 puts Decipher at Tier 1 and Compose at Tier 5, so the default is backwards. The header's right-hand label "STUDIO & TRAINER" repeats the confusion. The mockup also introduces a third name, "Mystery", for what the app calls Scan and Drill.
Fix: two routes with one job each (see §2). Practice becomes a peer of Scan and Drill. Compose is opened from Scan ("Write in this meter") or from the Ghazals page.

### 4. The composer's scansion display is broken (visible bug)
Evidence (`sample-1280.png`): each foot column stacks its chips **vertically**, with dashed underlines running on top of each other, and the three feet sit far apart. The intent was a horizontal row. Causes: `.chips` / `.chip` from `verse.css` are `display:block`-ish and inline `style=""` is overridden; `.fgrp` is `inline-flex` but the chips inside inherit the theme's `.chip` layout. The word-chip row underneath reads left-to-right while the Urdu above reads right-to-left, so `دل` sits at the right of the verse and at the **left** of the chip row. The foot groups are drawn from the **target** slots, with no foot names and no relation to the words.
Fix: reuse `renderLineScan` (the Scan page's renderer), which already handles RTL, foot grouping and syllable-under-word. Do not hand-roll HTML per keystroke.

### 5. Duplicated, weaker scanning logic; Studio silently drops to a fake lexicon
Evidence: `syllabifyLine` calls `Scan.scanLine` inside `try {} catch(e) {}` and falls back to an 80-entry hard-coded `LEXICON` plus two regex syllabifiers (`syllabifyUrduWord`, `syllabifyRomanWord`) that ignore izāfat, tashdīd, nūn-ghunna, hamza, and any aspirate. Whenever `res.fits` is empty (any line that fits **no** meter, exactly the lines a learner writes) it falls to the lexicon, and unknown words get guessed weights. Even on the engine path:
- `chosenFit = fits.find(id) || fits[0]` compares against a **different** meter if the chosen one does not fit, and never says so.
- `Scan.diagnose` resolves flexible syllables **toward** the chosen meter, so near-misses look like matches (that is the point of `diagnose`, but the UI reads it as a verdict).
- Lines in Roman or Devanagari go straight to the lexicon (`isUrdu` test), although the production engine has `05-translit-helpers.js` and `translit-lab/`.
- `window.Scan` exists (01-engine.js exports `root.Scan`), but `Scan.diagnose` is called without `overrides` support, and there is no error surface.

Fix: one code path. `Scan.scanLine(text)` then `Scan.diagnose(res, meter)`; report `missing`, `forced` and `cheat` from the diagnosis, and show "fits no known meter" honestly. Delete the lexicon and both regex syllabifiers.

### 6. The "Live Meter Radar" is a fake with 8 meters, and the copy over-claims
Evidence: the engine has 49 meters (`Scan.METERS.length`; the spec says 37 classical + 12 rubāʿī). The radar's 8 are hand-typed with wrong patterns (see #1). "Confirmed Baḥr" is decided by `meter.name.includes(pv.bahrName)`, so it is decided by string match on the authored answer, not by the tapped weights. In the real engine the Ghalib line fits **two** meters (`#14` and `#15`, they differ only in the last foot). The mockup says "1 candidate isolated" and "Confirmed", which is false. Eliminated rows stay on screen at 40% opacity with 10.5px mono "Mismatched at beat N" text (contrast fails, the text is decorative-grey), and 8 rows of pattern strings wrap awkwardly (`#1`, `#25` wrap onto a second line, see `p3-1280.png`).
Fix: use `Scan.matchWeights(ws)` (already in the engine, pattern-only prefix matching intended for tap mode). Do not show a radar during the scan at all (see #2). Show "N of 49 still possible" as a single quiet line if anything, and after commit show the top fits with the shared foot structure.

### 7. Feedback clutter: the rule-explainer box fires on every tap and shouts
Evidence: `updatePhoneticRuleFeedback` writes a `.note` after **every** tap. It carries emoji (`💡 ⚠️ ✨ 🎯`); the note already has its own `.note-sym`, so a wrong tap renders `⚠️ ⚠️` (visible in `p3-1280.png`), and on completion `✓ 🎯`. Then a **second** success box (`footCompletionBanner`) repeats "Baḥr Successfully Deciphered! … with 0 rhythmic errors". That "0 rhythmic errors" is hard-coded: wrong taps are never counted, so it is a false claim after a mistake. On complete, three things say "done": the badge, the note, the banner, plus the radar row and an auto-played cadence 550ms later. The tone is arcade ("Rhythm grooves cleanly!", "Mystery Pick", "🎲") in an app whose voice is the quiet manuscript.
Fix: one status line, no emoji, muted. Correct tap: audio plus a ring, no words. Wrong tap: brief, silent-ish shake and a counted error, no hint until the end (or on request). One completion summary, not four.

### 8. Accessibility and colour-only signals
Evidence:
- **Board:** the correct/wrong signal on the taqtīʿ board is `.short` (orange, dotted) vs `.long` (blue, solid), with symbols `–`/`=`, which is fine and follows `base.css`. But the active tile is signalled only by a 20%-alpha gold ring and a 3px lift, and the error state is a border colour plus a 250ms shake, gone before a screen reader or a slow reader sees it. No `aria-live` on the status note, no role or label on tiles (`<div>`s, not buttons), no `aria-pressed` on the tabs (`role="tab"` without `aria-selected` or `tabpanel`), and `switchViewMode` toggles `display` only.
- **Keyboard:** keys 1/2 (also D/K) are on `window`, disabled when an INPUT has focus, but they also swallow **Space** (`preventDefault`) and **Backspace** everywhere on the page in practice mode, so Space no longer activates a focused button and the page cannot be operated by keyboard alone. `R` resets progress with no confirm.
- **Contrast:** `.syl-num` (`--ghost`, 10px), `.radar-tag.elim` (`--faint` at 40% row opacity, 10.5px), `.tapper-btn-sub` (`--faint`, 11px mono) and `.misra-label` (11.5px `--faint` uppercase) are at or below the size and contrast the brief sets (`--ghost` is "decorative only, never text").
- **Focus:** `.studio-input:focus { outline: none }` replaced with a border-colour change only. `.anchor-chip` and `.tapper-btn` have no `:focus-visible`.
- **Tap targets:** `.syl-chip-slot` is 44x36 (below 44 tall, and they are display-only). The real tap buttons (`.tapper-btn`) are large enough, but they sit **below** the board and the note, so on a phone the learner scrolls between the tile they are scanning and the buttons (see the stack in `p3-390.png`). The board wraps at 10 tiles per row at 390px into two rows, then 15 tiles for Faiz into three.
- **Palette:** no dark-theme or classic-theme check; `color-mix` is used for washes, which is fine, but `.mystery-verse-display` is a **filled `--bg2` card with a radius and border**, which the brief bans (rule 2: "no cards, no shaded panels"). So are `.anchor-chip` pills (rule 2: "no pill chips for UI"), `.tapper-btn` bordered boxes (rule 3: "Buttons are text"), the toast, and `.mystery-badge`.

### 9. Inconsistent with the real Scan and Drill pages
Evidence: the real app already ships a Scan inspector (`19-scan.js`, `renderLineScan`), a tap trainer (`tap.html`, `18-tap.js`), drills (`22-drill.js`) with `footGap`, and an earlier Studio composer (`13-studio-composer-module.js`, textarea → `runStudioScan`, 200ms debounce). The mockup ignores all of it:
- its own `playTone`/`playSequence` synth (fixed 100bpm, 330/220Hz sine/triangle) instead of `A.ensure()`, `playPat`, the user's voice/drum setting, bpm, and `settings.footGap`;
- no playback highlight (`litter()`, `.chip.lit`, `.blk.lit`), which the brief lists under "Must keep (the user explicitly asked)";
- no script toggle (اردو / देव / Roman) even though the brief says all three scripts must work;
- no `Scan.explain` and no `meterLabel()` naming (it prints `Khafīf Musaddas (#14)` strings it typed itself);
- a new vocabulary ("Anchor Model", "Mystery Verse", "Meter Radar", "Tapper", "Cadence") that appears nowhere else;
- header links go to `index.html#/…` with a brand-new "STUDIO & TRAINER" label instead of a real nav item.
Fix: build inside the app shell as routes, not as a stand-alone HTML file, using the same audio, script and label helpers.

### 10. RTL / Nastaliq handling and information density
Evidence:
- `.anchor-verse` is `direction: rtl` and holds `“…” — غالب` in one string, so the quote marks and the dash flip and the attribution lands **before** the verse (`studio-1280.png`: `—" دل ناداں … "` reads backwards). Same problem in the `Radīf` line where an Urdu snippet sits in an LTR sentence with no `<bdi>`.
- The composer's inputs are `direction:rtl` only after the first Urdu character; for Roman it flips to LTR serif, so the field jumps sides while typing. Placeholders at 18px Nastaliq inside a 24px, `line-height:2` field are clipped-looking (`studio-1280.png`).
- Nastaliq line-height is 1.5 on `.syl-token` (20px), which clips the tall marks (`جھے`, `کیا` look cramped over the roman label). The brief's token is `--lh-urdu: 2.2`.
- Density: the empty Studio shows a title, lede, tabs, a "1." step heading, 4 pills, an anchor citation, a Radīf/Qāfiyah strip, an info note, then a couplet header, two rhyme tags, two play buttons and **four** empty fields with 4 empty scansion grids: about 30 controls before the first keystroke. The step number "1." is followed by no "2.".
- Hard-coded English (Matla', S̱ānī, Ūlā) in mixed Urdu/Latin labels, e.g. `MISRA 1 (مصرع اول / ŪLĀ)`, in 11.5px uppercase.
Fix: see wireframes. One verse per screen, Urdu at `--fs-urdu`/`--lh-urdu`, `<bdi>` around embedded runs, and dir set on the field once (Urdu default).

### Other bugs noted (lower rank)
- Rhyme check: `extractRhymeEnding` is a suffix table (`ān/ār/ūr/īr/ā/e/ī/o`) with a fallback `w.slice(-2)`, so `isMatlaRhyming` uses `endsWith` either way round and accepts almost anything. It also cannot see harf-e-rawī, and qāfiyah vs radīf detection is "longest common word suffix", which mis-locks a shared word that is really part of the qāfiyah.
- `saveDraftToStorage` / `localStorage` calls are not in try/catch (they throw in private mode); the app store (`02-store.js`) is the place for this.
- `navigator.clipboard.writeText` is not awaited or guarded; the toast says "Copied" regardless.
- The meter chosen in Studio is only the anchor's, so the studio cannot say "your line fits #15 instead", which is the most useful thing a composer could hear.
- `randomPracticeVerse` and `nextPracticeVerse` share the same three verses forever; there is no progress, no history, no per-syllable stats, unlike `17-ear.js` (`renderWeak`, `stat`).
- Emoji: `🔒 🔓 💡 ⚠️ ✨ 🎯 🎲 ⌫ ↺ ▶ ℹ ✓` are used as UI. The rest of the app uses none; ▶ is the only carry-over that is defensible.

---

## 2. Recommended information architecture

Principle: one screen, one job. Ear first. The engine is the only authority on weights and meters.

```
Nav:  Weight | Meter | Scan | Practice | Ghazals            (Studio disappears as a name)
                                 |
                                 +-- Practice (Decipher)   route #/practice   Tier 1-2  (default, new learners)
Scan (existing) --- "Write a line in this meter" --> Compose   route #/compose    Tier 5  (opened from Scan or Ghazals)
```

Rules for both flows:
- The meter name and feet are **hidden until commit** in Practice, and **chosen up front** in Compose.
- Every audio control uses the existing sound settings and `litter()` highlight.
- Script toggle (اردو / देव / Roman) is in the header as everywhere else.
- No cards, no pills, no emoji. Text buttons; one gold primary per screen.

### 2a. Practice flow (Decipher the Baḥr)

Screen P1, first screen (1280 and phone are the same single column, 760px max):

```
baḥr بحر    Weight  Meter  Scan  Practice  Ghazals                    اردو | देव | Roman
--------------------------------------------------------------------------------------
PRACTICE
Hear it, then scan it.                                           (serif 40px)
Tap 1 for a short beat and 2 for a long one. You will not be told the meter until you finish.

                          Ghalib                                  (sans 12 uppercase, faint)

              دلِ ناداں تجھے ہوا کیا ہے                           (Nastaliq, --fs-urdu x1.3, lh 2.2)
              dil-e-nādāñ tujhe huā kyā hai                       (serif italic, dim)

                    ( ▶ Listen )    ( ▶ Slower )                  (text buttons; 1 ring play btn ok)

--------------------------------------------------------------------------------------
                        (1 of 10)
        دِل    ِ     نا    داں   تُ    جھے   ہُ    وا   کیا    ہے          <- words, not syllables
        ___   ___   ___   ___   ___   ___   ___   ___   ___   ___          <- empty underline slots
        [ current slot has gold underline + soft wash ]

           [   1   short   ]      [   2   long   ]                        (two text buttons, 56px min)
                                                    step back  reset      (text, faint)
--------------------------------------------------------------------------------------
                                                         Check my scan ->  (gold, enabled at last slot)
```
Notes:
- The learner gets the **words** and the engine's syllable split (from `Scan.diagnose`) as slots, with no weights, no rules, no foot names, no radar.
- Slots are underline marks per the brief (`.blk`-style, short = half width), not filled boxes. Active slot: gold wash.
- Tap plays the tone for what was **tapped** (da or dum), not the correct one. Correctness is never leaked by the sound.
- A wrong tap is not blocked. The scan is free-form, exactly like the tap page. Errors are counted silently.
- Keyboard: `1`/`2` only when focus is on the board region, `Backspace` steps back **inside** the board, Space is never intercepted. Board has `role="group"`, slots are `<button>`s with `aria-label="syllable 3 of 10: dāñ"`, status line is `aria-live="polite"`.
- Phone: buttons pinned at the bottom of the viewport (sticky), slots wrap to 2 rows of at most 6, verse above scrolls away.

Screen P2, after "Check my scan" (the reveal, the only place rules and feet appear):

```
Your scan                                                              8 of 10 right
   دِل   ِ   نا   داں   تُ   جھے   ہُ   وا   کیا   ہے
   ==   -   ==   ==   -    ==    -   ==   ==    ==      <- yours; wrong ones underlined in the "no" colour AND marked "x" below
   ==   -   ==   ==   -    -     -   ==   ==    ==      <- correct weights from the engine

Fā'ilātun     Mafā'ilun          Fa'lun                   <- feet appear now, italic serif
Two syllables were off:
  6  جھے   long. Open syllable ending in a long vowel.     (Scan.sylRule text, one line each)
  ...
This line fits:  Khafīf Musaddas Makhbūn  (#14)  ·  also #15 (differs in the last foot)
                 x - = = / - = - = / = =                    (mono pattern, engine)
   ▶ Hear the meter          Try again          Next line ->
```
Notes:
- Only errors get rule text, one line each; correct syllables need none.
- "Fits" shows every engine fit (`res.fits`), honestly, with the ambiguity called out.
- Progress ("8 of 10", streak per meter) stored with the existing store; feeds the weak-spots list in `17-ear.js`.
- Optional "Hint" link during P1: reveals the meter's **rhythm by ear only** (plays the cadence), costs one point. This is the ear-first hint.

### 2b. Compose flow

Screen C1, first screen: pick a meter, then write. One question at a time.

```
baḥr بحر    Weight  Meter  Scan  Practice  Ghazals                    اردو | देव | Roman
--------------------------------------------------------------------------------------
COMPOSE
Write in a meter                                                (serif 40px)

Start from a meter you know
   Khafīf Musaddas Makhbūn (#14)  ·  Ghalib, "dil-e nādāñ"                 change
   x - = = / - = - = / = =                                    ▶ Hear it
--------------------------------------------------------------------------------------
Matla                                                                ▶ Hear the couplet
   ______________________________________________________   <- misra 1 (Nastaliq, dir=rtl fixed)
   ...live scan under the line (see below)
   ______________________________________________________   <- misra 2
--------------------------------------------------------------------------------------
                                                          Add a sher +      Copy  Save
```
Live scan under each misra (one component, `renderLineScan`, not custom HTML):

```
   دلِ ناداں تجھے ہوا کیا ہے
   ==  -  ==  ==  -  ==  -  ==  ==  ==
   fa-  'i-  lā-  tun  ma-  fā-  'i-  lun  fa'  lun        (only when the line fits; foot names from the engine)
   Fits Khafīf (#14).                                        <- one quiet line, sans 13
```
States, one sentence each, no icons:
- Fits target: "Fits Khafīf (#14)." (ok colour, text only)
- Fits another: "Fits #15 not #14: the last foot is x - x" (link: "switch to #15")
- Too long or short: "2 syllables too many after word 4" with the slot **marked** (extra slot shown in `--no` plus "+")
- Fits nothing: "This line does not fit a known meter. Weakest words: …" (from `diagnose`.missing/forced)

Screen C2, after the matla, reveal the ghazal constraints, then the next sher:

```
Radīf   کیا ہے        Qāfiyah   ā   (ہوا, دوا)                    edit
Both lines of the matla share this ending. Every following second line must end the same way.
--------------------------------------------------------------------------------------
Sher 2
   first line (free)
   second line: must end   ... ā  کیا ہے                         <- constraint stated as a ghost suffix in the field
```
- Structure checks (radīf, qāfiyah) run **after** the line is complete or the field blurs, not per keystroke, and appear as one line under the field.
- Qāfiyah should be user-confirmable ("Is this your qāfiyah?") because suffix heuristics are not reliable for Urdu.
- Phone: one misra field per view row, scan wraps at foot boundaries (feet never split), toolbar is a sticky bottom text row.

---

## 3. Reuse vs throw away

Reuse (as design, not code):
- The page shell: `.wrap`, `.page-head`, eyebrow + serif title, `.lede`, `.seg` styling. It is the right look and matches the other pages.
- The two-step idea of a Practice reveal that **regroups syllables into feet** at the end (Part 9 core). Keep as P2's foot row. Drop the "card" feel.
- The Radīf / Qāfiyah locking concept and the sher-2 constraint text ("must end with …"), rebuilt on better rhyme logic.
- Copy Plain Text / Copy with Scansion (as `Copy`), Load Sample (as "Try a Ghalib couplet").
- `sylHitch` micro shake (keep, but 120ms and off under `prefers-reduced-motion`).
- The `.mystery-verse-*` typography (poet caption, big Nastaliq line, Roman line) minus the card background.
- Foot-completion audio idea (`justCompletedFoot` plays the foot back): use `playPat` with `footGap` instead of the mockup synth.

Throw away:
- `LEXICON`, `syllabifyUrduWord`, `syllabifyRomanWord`, the Roman tokenizer, and the `try{}catch(e){}` around the engine.
- `METER_CATALOG` and the "Radar" table, the "8 meters" claim, `isExactMatchLine` string matching.
- `PRACTICE_VERSES` syllable/rule/feet arrays (all of it; derive from the engine).
- `MODELS` (4 hand-typed slot patterns): use `Scan.METERS` and the reference verses already in the corpora / `METERS_DATA`.
- The mockup's audio synth and its keyboard listener on `window`.
- `.anchor-chip`, `.tapper-btn`, `.mystery-badge`, `.mystery-verse-display` boxes, `.toast`, `.radar-*`, and every emoji.
- The single-file layout with about 850 lines of inline `<script>` and inline `style=""` (violates brief rule 6).
- The combined H1 and the two-mode tab.

---

## 4. Build plan (reuse the production engine `Scan.*`)

Engine API already available (verified in `01-engine.js`): `Scan.METERS` (49), `scanLine`, `diagnose`, `syllabify`, `parseRaw`, `matchWeights`, `explain`, `sylRule`, `footMap`, `attachFeet`. Audio: `15-audio.js` (`A.ensure`, `playPat`, `litter`, `settings.footGap`). Rendering: `renderLineScan` (19-scan.js).

1. **Data adapter (`src/js/23-practice-data.js`, ~60 lines).** `buildTask(urduLine, meterId)` runs `Scan.scanLine(line)`, picks the fit for `meterId` (or best), then `Scan.diagnose(res, meter)` and returns `{ words, syl:[{text, word, resolved, foot, fsyl, rule}], feet, fits }`. Pull practice lines from the existing Ghalib/Mir/Iqbal corpora, keeping only lines where `fits.length >= 1` and `diagnose` has no `missing`/`forced`. Add a node test: every line yields `syl.length === meter.seq.length`.
2. **Practice route.** New `src/body/practice.html` + `src/js/24-practice.js`, hash route `#/practice`, in the nav. State: `taps[]`, `errors[]`, `revealed`. Board is real `<button>`s. Tap sound = tapped weight (existing `playPat`/tone helper). On "Check": compare `taps` with `syl[*].resolved`; render P2 with `Scan.sylRule` text for wrong ones and `Scan.matchWeights(taps)` for "what your scan would fit" (shows the learner what their own scan means). Store results via `02-store.js` and feed `renderWeak`.
3. **Compose route.** `src/body/compose.html` + `src/js/25-compose.js`, reusing `13-studio-composer-module.js`'s debounce and `renderLineScan` for the per-misra scan. Meter selection via the existing meter label helper (`meterLabel`, `18b-meter-label.js`). Feedback states come from `res.fits` and `diagnose(...).syl[*].missing/forced/cheat`. Matla/radīf/qāfiyah logic is a new pure function `analyzeGhazal(lines, script)` with unit tests, and qāfiyah is user-confirmable.
4. **Styles.** Move the parts of `studio.css` worth keeping into `pages.css` under `#practice-section` / `#compose-section`, remove pills, boxes and inline `style=""`, use `--lh-urdu`, add `:focus-visible` (gold ring), `prefers-reduced-motion`, and `bdi`/`dir` rules for mixed runs.
5. **Accessibility pass.** Roles and `aria-live`, keyboard map documented on-page (1/2/Backspace inside board only), contrast audit with the existing `docs/DESIGN_PRINCIPLES.md` §3 numbers, and all three themes.
6. **Tests.** Extend `npm test` (which gates deploy): the adapter test above; a test that `analyzeGhazal` handles the Ghalib sample (radīf `کیا ہے`, qāfiyah `ā`); a smoke test that no task line renders a meter name before reveal (string check on the P1 DOM).
7. **Retire the mockup.** Do not commit `studio_mockup.html` or `studio.css` as-is. Rebuild `index.html` with the project's normal build and commit it, per the hosting notes.

Order: 1 → 2 (ships the Tier-1 experience, low risk) → 4/5 in parallel → 3 → 6/7.
