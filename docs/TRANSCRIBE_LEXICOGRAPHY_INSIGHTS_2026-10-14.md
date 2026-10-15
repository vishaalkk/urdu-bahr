# Transcribe & Lexicography: Recurring Patterns, Root Causes & Architectural Insights
**Date:** October 14, 2026  
**Scope:** Transcribe (`#/lab/transcribe`), Dictionary Module (`src/js/12-dictionary-module.js`, `scripts/build_dictionary_bundle.py`), and Transliteration Helpers (`src/js/05-translit-helpers.js`, `src/js/24-transcribe.js`).

> **Superseded on October 15, 2026 (commit 2657244): one typed-word scorer, not more aliases.** §3's advice to "standardize
> `CASUAL_ALIAS`" for casual spellings (vazoo, baDi, chhod, daikh) is replaced by `casualCands` in `05-translit-helpers.js`. It finds a
> list word under its casual-spelling variants (d/D for ṛ, g for ġh, k for q, ai for e, a final -a for a silent -ah) and its consonant
> skeleton, then scores it by how a typist spells each sound. 136 of 230 aliases were deleted. `tests/transcribe_golden.js` now fails
> on any alias the scorer makes redundant. The `baDi`/`chhod` family also hid bad data: `data/roman_fallback.json` spelled 14 ṛ words
> with ḍ (Rekhta's Ḍ is ṛ), and the fallback builder's check passed only because the alias answered first. Add an alias only for a
> closed-class spelling (yih, vuh, nah; un ko) or a word no list has (peṭ, nain, vuẓū). See CLAUDE.md, "Typed-word scorer".

---

## Executive Summary

Over recent debugging and enhancement sessions, user feedback in Transcribe repeatedly encountered symptoms that seemed disjointed on the surface:
1. *"The word misl shows in the definition, but there's no way to select or change to it."*
2. *"nain for eyes has no options, or shows two options with same Urdu but different transliteration."*
3. *"When I click the first button in top strip, it gets swapped with the second one."*
4. *"vazoo in top bar gave one thing, readings gave another, and definition was cut off."*
5. *"The Use button still doesn't work..."*
6. *"Also feeling same issue with like baRi and rahi kinda words, do they exist?"*

Underneath these disparate symptoms lie **four recurring systemic architectural problems**:
1. **Classical Lexicography vs. Casual User Input (The Lemma Disconnect)**
2. **Dual-Layer State Desynchronization (Candidate Strip vs. Dictionary Drawer)**
3. **Phonetic & Consonantal Orthography Collisions (The Many-to-One Problem)**
4. **Heuristic Drift & Baseline Floor Fragility**

This document details each category, maps past occurrences, explains the mathematical/linguistic root cause, and provides architectural solutions.

---

## 1. The Lemma Disconnect: Classical Lexicography vs. Surface Speech

### The Core Phenomenon
In classical 19th-century South Asian dictionaries (John T. Platts 1884, S. W. Fallon 1879, Francis Steingass 1892):
* **Marked Adjectives** are catalogued exclusively under their **unmarked masculine singular base ending in `-ā` (`ا`)**:
  * *Large, big, great* is indexed under **`baṛā` (بڑا)**. Platts explicitly writes:
    > **بڑا baṛā** [S. वृद्ध + कः ; वडः], **adj. (f. -ī)**, *Large, great, big, vast, immense, huge; grand, noble...*
  * Platts only has a separate headword for **`baṛī` (بڑی)** as an obscure culinary noun:
    > **بڑی baṛī** [S. वटिका], **s.f.** *Small lumps of pulse (urd, mūng, &c.), fried in oil or ghī, then dried in the sun and used as a condiment (vadi)...*
  * Similarly: `chhoṭī` is under `chhoṭā` (چھوٹا); `achhī` is under `achhā` (اچھا); `lambī` is under `lambā` (لمبا); `purānī` is under `purānā` (پرانا); `sūkhī` is under `sūkhā` (سوکھا); `mīṭhī` is under `mīṭhā` (میٹھا).
* **Conjugated Verbs** are catalogued exclusively under their **infinitive ending in `-nā` (`نا`)**:
  * *Stayed, remained, was* is indexed under **`rahnā` (رہنا)**.
  * Steingass happens to list an obscure Persian noun headword **`rahī` (رهی)** meaning *"a traveller; a slave, servant"*.

### The Failure Mode in Code
When a user typed `baRi` or `rahi`, the scoring function `roMatchScore(cand)` gave:
* **100 points** for exact string match (`baṛī` = dumplings, `rahī` = slave).
* **0 points** for the masculine adjective `baṛā` because `"bara"` did not match `"bari"`.
* **70 points** for verb infinitive `rahnā` because `"rahna"` was only a prefix match.

**The Result:** The primary adjective `baṛā` ("big") was pushed down to position #15, completely invisible in the 6 reading pills. The everyday verb `rahnā` was supplanted by Steingass's Persian noun "slave". The user was left wondering: *"Do words like baRi and rahi even exist in Urdu dictionaries?"*

### Historical Precedents in this Project
We have hit this exact lemma disconnect repeatedly:
* **`bech` vs. `bīch`**: `bech` (بیچ) was failing because the verb entry in Platts is `bechnā` (بیچنا), while the direct headword `bīch` (بیچ) is the noun "middle/in between".
* **`hārī` vs. `hārnā`**: Feminine past "lost" (`hārī`) defaulted to the noun "garland" instead of the verb `hārnā`.
* **`samjhe` vs. `samajhnā`**: Plural past/subjunctive "understood" collided with obscure nouns.
* **`shāmoñ` vs. `shām`**: Oblique plural of "evenings" was dropping the base noun.

### Architectural Fix
1. **Adjective Lemma Match (`-ī`/`-e` $\to$ `-ā`)**:
   In `roMatchScore(cand)`, when the typed token ends in `i` or `e` and the dictionary candidate ends in `a` with identical stem (`baṛī`/`baṛe` $\leftrightarrow$ `baṛā`), award a dedicated **Adjective Lemma Score (95)**. This elevates `baṛā` to the top reading pills right alongside surface homographs.
2. **Verb Form Inference (`trIsVerbForm`)**:
   Previously, `trIsVerbForm` only checked `formsFor(p.src)`. When `knownForms` mapped `rahi` to participle base `rahaa`, it failed `/naa$/`. Extending `trIsVerbForm` to consult `dictLemmas(p.src)` guarantees all inflected verb forms (`rahī`, `rahā`, `rahe`, `huī`, `kartī`, `diye`) reliably trigger `opts.verbFirst = true` and lead with the infinitive.

---

## 2. Dual-Layer State Desynchronization (Top Strip vs. Dictionary Card)

### The Failure Mode
Transcribe has two distinct UI tiers for word review:
1. **Tier 1 (Top Strip - Candidate Pills)**: Generated by `trCands(p, p.def)` using `casualLookup`, phonetics, and Rekhta lists.
2. **Tier 2 (Bottom Drawer - Dictionary Entries)**: Full Platts/Steingass/Fallon entries with distinct readings and a `Use this reading` button.

When the user clicked `Use this reading` in Tier 2:
1. `trUseDictReading` updated `TR.choices[p.key] = { t: 'f', ur, ro, hi }`.
2. When `trBuild` rebuilt the model, it applied the choice to `p.fixed`.
3. **Bug A (`p.def` not updated)**: `p.def` remained `{ ascii: p.ascii }`. When Tier 1 re-rendered via `trCands(p, p.def)`, it only knew the pre-choice definition. It had no entry for the newly applied dictionary reading, so **none of the candidate pills at the top was highlighted or shown as selected**.
4. **Bug B (`isCurReading` with `||`)**:
   ```javascript
   var isCurReading = h && (
     (h.ur && curUr && dictFoldUr(h.ur) === dictFoldUr(curUr)) ||
     (h.ro && curRo && trFoldRo(h.ro) === trFoldRo(curRo))
   );
   ```
   Because of the `||` (OR), if the current word had Urdu `وضو` (`vazoo`), **all readings with Urdu `وضو`** (Fallon's `vuzū`, Platts' `wuẓū`) evaluated to `isCurReading = true`. The button was permanently rendered as disabled (`✓ Applied`)! The user could not click to switch between transliteration variants.
5. **Bug C (Stale `TR.dictHitIdx`)**: After rebuilding the word with a new Urdu spelling (e.g. Steingass's `وضؤ`), the dictionary lookup re-queried and re-ordered. Leaving `TR.dictHitIdx = 2` pointed to whatever happened to land at index 2 (Fallon's entry) rather than staying pinned to the chosen reading.

### Historical Precedents
* **Top strip button swapping**: Clicking button 0 swapped its DOM order with button 1 because `trCands` placed the active choice first, changing button order under the user's cursor. (Fixed in `f578a61`).
* **Custom typing box losing focus / desync**: Typing a custom spelling in the text input didn't reflect in the dictionary card until manual blur.

### Architectural Fix
1. **Strict Equality for `isCurReading`**: A reading is only "applied" if **both** normalized Urdu and Roman match:
   ```javascript
   var normHUr = dictFoldUr(h.ur), normCurUr = dictFoldUr(curUr);
   var isCurReading = h && (normHUr === normCurUr) && (h.ro === curRo);
   ```
2. **Def Sync in `trBuild`**: When `ch` is applied, immediately sync `p.def = p.fixed ? { fixed: p.fixed } : { ascii: p.ascii }`.
3. **Drawer Pinning**: When `trUseDictReading(idx)` is called, keep `TR.dictHitIdx` aligned with the chosen reading.

---

## 3. Phonetic & Consonantal Orthography Collisions

### The Many-to-One Problem in Roman Urdu
In everyday casual Roman Urdu typing, English letters collapse rich distinctions in Arabic/Persian/Indic scripts:

| English Typed Letter | Urdu Script Targets | Examples |
|---|---|---|
| `s` | س (seen), ص (swad), ث (se) | `sada` (صدا vs سدا), `misl` (مثل vs مسل) |
| `z` | ز (ze), ذ (zal), ض (zwad), ظ (zoe) | `vazoo` (وضو), `nazar` (نظر vs نذر) |
| `t` | ت (te), ط (toe), ٹ (retroflex te) | `tuti` (طوطی vs توتی), `toot` (ٹوٹ vs توت) |
| `h` | ہ (he), ح (badi he), ھ (aspirated) | `halal` (حلال vs ہلال), `hath` (ہاتھ) |
| `n` | ن (noon), ں (noon ghunna / nasal) | `nain` (نَین eyes vs نئیں/نہیں) |

### Failure Manifestations
1. **The `misl` bug**: The word for "example/like" is `مثل` (*miṡl*). Platts writes `mis̤l` (two dots under s), Sean Pue's parser writes `miṡl` (overdot), ASCII uses `mi;sl`. Because `s̤` was not mapped to `mi;sl` in `CASUAL_SPECIAL` and `scholarRoToAscii`, typing `misl` could not reach the Platts transliteration.
2. **The `vazoo` bug**: Ablution is phonetically typed `vazoo`, `wazoo`, `vazu`, `wazu`. The canonical Urdu is `وضو` (*vuẓū* / *wuẓū*). Without casual aliases, phonetic fallback guessed `وزو` (*vazū*) and `وزوع` (*vazūʿ*).
3. **The `nain` duplicate nasal bug**: `casualPiece` generated both `nain` and `naiñ` for the same Urdu token, displaying duplicate pills in the UI.

### Architectural Fix
* Unified mapping in `CASUAL_SPECIAL`, `scholarRoToAscii`, and `normVerseKey` for all Platts diacritics (`s̤`, `ẕ`, `ż`, `t̤`, `h̤`).
* Standardized `CASUAL_ALIAS` for common religious/cultural loanwords where casual typing diverges from Arabic spelling (`vazoo`, `wazoo` $\to$ `vu.zuu`).
* Deduplication in `trCands` on normalized Urdu + Roman folded key to prevent identical twins from rendering.

---

## 4. Benchmark Floor Fragility & Overfitting

### The Problem
Urdu Bahr enforces strict benchmark floors:
* `tests/dictionary_baseline.json`
* `tests/lemma_baseline.json`
* `tests/readings_baseline.json`
* `tests/typed_roman_baseline.json` (43,713 words across held-out poets Jaun, Faraz, Parveen)
* `tests/transcribe_baseline.json`

When a localized fix is added to a global function (e.g. `casualLookup` or `CASUAL_ALIAS` in `05-translit-helpers.js`), it affects the entire 43,713-word corpus. If one word's ranking changes, a score can shift by 0.05%, failing CI even though the change fixed a legitimate bug.

### Architectural Guardrail
* **Layer Separation**: Keep global scan transliteration (`casualPiece`, `casualLookup`) isolated from Transcribe review heuristics (`trDictSectionHtml`, `trCands`, `roMatchScore`).
* Transcribe drawer improvements must be implemented in `24-transcribe.js` where possible, without altering the unassisted scansion pipeline used by the benchmark baselines.

---

## 5. Summary Matrix of Issues & Solutions

| Symptom | Root Cause | Layer | Resolution |
|---|---|---|---|
| `baRi` shows dumplings, `rahi` shows slave | Dictionaries index under masculine singular base (`baṛā`) and infinitive (`rahnā`). String matching scored lemma as 0. | `src/js/24-transcribe.js` (`roMatchScore`, `trIsVerbForm`) | Add adjective lemma stem matching (score 95) and lemma verb detection (`dictLemmas`). |
| "Use this reading" button disabled / says `✓ Applied` | `isCurReading` used `\|\|` instead of `&&`, treating any matching Urdu spelling as already applied. | `src/js/24-transcribe.js` (`trDictSectionHtml`) | Require strict match on both normalized Urdu and Roman. |
| Selected dictionary reading doesn't appear in top pills | `p.def` not updated in `trBuild` when custom choice applied, so `trCands` rendered pre-choice state. | `src/js/24-transcribe.js` (`trBuild`) | Sync `p.def = { fixed: p.fixed }` on choice application. |
| Definition cut off mid-word | Arbitrary length string truncation in data build script. | `scripts/build_dictionary_bundle.py` | Add `truncate_def` that breaks cleanly at sentence/clause boundary with ellipsis. |
| `misl` transliteration `s̤` cannot be selected | Platts diacritic `s̤` missing from Pue ASCII mapping. | `src/js/05-translit-helpers.js` | Map `s̤` $\to$ `mi;sl` in Pue graph and ASCII helpers. |
| `vazoo` suggests `vazūʿ` (وزوع) | Common casual spelling missing from alias map. | `src/js/05-translit-helpers.js` | Add `vazoo`, `wazoo`, `vazu`, `wazu` $\to$ `vu.zuu`. |

---

## 6. Verification Plan & Path Forward

1. Apply the fixes in `src/js/24-transcribe.js`:
   * Strict `isCurReading` (`normHUr === normCurUr && h.ro === curRo`).
   * Adjective lemma scoring in `roMatchScore`.
   * Infinitive detection in `trIsVerbForm`.
   * Choice `p.def` sync in `trBuild`.
2. Verify with standalone node runner against `baRi`, `rahi`, `vazoo`, `misl`.
3. Build bundle (`python3 scripts/build_app.py`).
4. Run full test suite (`node tests/transcribe_logic.js`, `npm test`).
