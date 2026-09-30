# 18 - Does the real engine share the Part 6 (prototype fallback scanner) bugs?

Harness: `tests/engine_part6.js` (loads built index.html in jsdom; Roman input goes through `romanToAscii` -> `p_ur` -> `Scan.scanLine`, exactly as `runScan()` does). Wired into `scripts/check.sh`.
AUDIT_BUGS_AND_FEATURES.md is not in this worktree's history, so the case list is taken from the brief.

Summary: the real engine does NOT have the hiatus or regular-word problems. Its problems were in the Roman front end (Roman `diya`, standalone `e`, `dile`, `nadan`), fixed. Two items remain (one documented tradeoff, one inherent ambiguity).

Weights in the tables are the engine's native word weights; a final `x` is the engine's flexible final vowel (long by default, shortenable), so `- x` counts as `- =`.

## 1. Hiatus

| Case | Expected | Actual (before fix) | Verdict |
|---|---|---|---|
| ہوا / huā / hua | `- =` | `- x` (LEX entry ہوا `s x`) | pass |
| لیے / liye | `- =` | `- x` | pass |
| کیے / kiye | `- =` | `- x` | pass |
| دیا / diyā | `- =` | `- x` | pass |
| Roman `diya` (no macron) | `- =` | `x` (parsed to دی, dropped the yā) | FAIL -> fixed |

Root cause of the Roman failure: `romanToAscii` only special-cased `hua`/`kya`; an unmarked word-final `a` after `i` became short `a`, which Pritchett ASCII turns into nothing. Fix: word-final `-iya` -> `-iyaa` (Urdu words do not end in short a after i). Also covers `liya`.

## 2. Regular words, no lexicon

| Word | In LEX? | Expected | Actual | Verdict |
|---|---|---|---|---|
| گلوں | no | `- =` | `- x` | pass |
| دلوں | no | `- =` | `- x` | pass |
| بتوں | no | `- =` | `- x` | pass |
| لبوں | no | `- =` | `- x` | pass |
| چمن | no | `- =` | `= -` | FAIL, not fixed (see below) |

The engine syllabifies from letters (nasal ں dropped, و as CV), so plural -on words need no lexicon. LEX contains only the flexible monosyllables and a few irregulars (ہوا, کیا, ایک...).

چمن: the three-letter CCC word ties `CC+C` (`= -`) against `C+CC` (`- =`), both cost 0, and push order picks `= -`. A cost bias of 0.3 on `CC` when it leaves a single final consonant fixes it (handbook: a single intervocalic consonant onsets the next syllable), and Ghalib top-1 rises 89.64 -> 89.94, but Mir top-1 falls 93.70 -> 93.18 (floor 93.70). A 0.05 tie-break still gives Mir 93.25. The gate forbids that, so it is NOT applied. Follow-up: find which Mir lines flip (probably Hindi-vocabulary three-letter words like شرم-type closed monosyllables that the letter model cannot represent) and special-case those, then apply the bias.

## 3. Ghalib opener, all spellings

| Input | Expected | Actual (before) | After fix | Verdict |
|---|---|---|---|---|
| `dil-e-nādāñ tujhe huā kyā hai` | #14, 10 syl | #14, 10, c=0 | same | pass |
| `dil-e nādāñ ...` | same | same | same | pass |
| `dil e nadan ...` | same | no fit (`e` became اے, `nadan` -> ندن) | #14, 10, c=0 | FAIL -> fixed |
| `dile nadan ...` | same | no fit (دلے ندن) | #14, 10, c=0 | FAIL -> fixed |
| Urdu `دلِ ناداں تجھے ہوا کیا ہے` | same | #14, 10, c=0 | same | pass |
| Urdu `دل ناداں تجھے ہوا کیا ہے` (no zer) | same | #9 c=1.4 (#14 at 6.0) | unchanged | KNOWN LIMIT |

Fixes in `romanToAscii` (05-translit-helpers.js): a standalone token `e` after a word becomes `-e` (iẓāfat); `dile` -> `dil-e`; `nadan` -> `naadaa;n` (same style as the existing `naadaan` special case). Ordinary words are untouched (`ye hai` stays).

Unmarked-iẓāfat Urdu: `دل ناداں` genuinely is `= = -`, which is a valid #9 line (c=1.4), while reading iẓāfat costs a syllable change the engine cannot know about. No false clashes, just a different valid meter. Fixing this means trying optional iẓāfat on every non-final word and ranking it, which is a large scoring change that would hurt top-1 on unmarked corpora; not attempted. The UI already offers the per-word iẓāfat toggle (`toggleIz`). Recommendation: surface "try iẓāfat here" when the best fit is poor.

## 4. Meter #14 flexible first slot

| Line | Expected | Actual | Verdict |
|---|---|---|---|
| ہستی اپنی حباب کی سی ہے (Mir) | #14, first `=` | c=0 | pass |
| اثر اس کو ذرا نہیں ہوتا (Momin) | #14, first `=` | c=0 | pass |
| اسی خانہ خراب کی سی ہے (Mir) | #14, first `-` | c=0.4 | pass |
| دلِ ناداں تجھے ہوا کیا ہے | #14, first `-` | c=0 | pass |

The engine's #14 (`x - = = / - = - = / = =`) accepts both; there is no flexibility bug.

## 5. Faiz "gulon mein rang bhare"

The couplet is not in the bundled corpora. Scanned by hand: `گلوں میں رنگ بھرے بادِ نو بہار چلے` (and the unmarked-iẓāfat spelling) -> **#34**, c=0, pattern `- = - = / - - = = / - = - = / - -`, top-2 is #19 at 6.0. The brief's "#27" is not this line's meter (#27 is `- = = = / - = = = / - =`). Second misra `چلے بھی آؤ کہ گلشن کا کاروبار چلے` gives no fit at all in the engine (not investigated: likely آؤ / کاروبار handling); worth a follow-up.

## Gate

`npm test` exits 0 and prints `BENCHMARK: no regressions`. tests/engine_part6.js: 30 pass, 2 documented known limits, 0 failing.
