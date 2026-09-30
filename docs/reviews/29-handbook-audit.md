# 29 - Handbook audit: are our scansion rules backed by Pritchett/Anjum?

## Status (update at every commit)

- done: dataset tests/data/handbook_examples.json (253 examples, 37 meters, 12 rubai, 20 afaail); harness tests/handbook_examples.js (in scripts/check.sh, tolerates tests/data/handbook_known_failures.json)
- done (production, each gated: npm test 0, BENCHMARK no regressions, held-out 96.46 / 78.10 / 100 unchanged): 4.2 s/sh+t final cluster (= -); 3.4 al-constructions + LEX baalkul family; allah, gyaan; optional final hamza after alif
- now: reachable examples lab 249/253, prod 229/253 (see tables); meter tables 49/49
- done: resilience checks (see end of doc);
- next: remaining prod gaps listed below (other 4.2 clusters, tanvin-tan, hamza-chair words, ;xved/;xve suppressed-o exceptions, kyaa kyaa, archaic ain-graft)
- not changed on purpose: no-three-shorts rule blocks handbook's own nazariyah/tarabiyah divisions in both engines (documented)
- caveat: pass = some reading matches (reachable); top-1 (cheapest) is lower, esp. production 3.4 (al reading costs +1) and 1.4 minority splits (varaq, magar: no lexicon)
- resume hint: data/handbook_verbatim.json is gitignored (copy from main checkout).

## Coverage by handbook section

| § | rule (one line) | rules.json ids | production | examples (lab pass/fail, prod pass/fail) |
|---|---|---|---|---|
| 1.2 | letters vs non-letters (short vowels, aspiration h, nasal, tashdid) | L1.2-letters, L1.2-short-vowels, L1.2-aspiration, L1.2-nasal, L1.2-tashdid, L1.2-hamza-chair, R1.2-h-apostrophe-h, S1.2-syllable-size, F4.3-mh-pronoun, T-ascii-n-nasal, T-short-vowel, T-nasal-n, T-gol-dochashmi | yes | n/a (no worked pattern) |
| 1.3 | syllable starts with a consonant; alif/aa/hamza/ain behaviour | L1.3-ain-hamza-consonants, S1.3-onset, S1.3-hamza-onset, S1.3-madd-alone, F1.3-amphibious-ii, T-vao-ye | yes | lab 5/0; prod 5/0 |
| 1.4 | divide by pronunciation; 3-consonant words split (= -) mostly, minority (- =) | S1.4-pronunciation, S1.4-three-consonant, T-short-vowel | partial: majority split only; minority (- =) words reachable but not ranked; no lexicon | lab 22/2; prod 22/2 |
| 1.5 | two letters long, one short | S1.5-weight | yes | n/a (no worked pattern) |
| 2.1 | listed monosyllables flexible; taa/go/yaa, bah/kih/nah, kyaa etc fixed; aur (= -) or (=) | F2.1-listed-monosyllable, F2.1-other-monosyllable, F2.1-always-long, F2.1-persian-noun, F2.1-vocative-ai, F2.1-contraction, F4.3-kyaa, F2.1-always-short, F2.1-aur, F2.1-aur-weight, F2.1-repeat | yes (LEX) | lab 45/0; prod 44/1 |
| 2.2 | word-final C+V/C+h flexible; few medial exceptions | F2.2-final-ii-e-h, F2.2-final-o-aa, F2.2-medial-lexical, F2.2-future, F2.2-before-hamza | yes | lab 11/0; prod 11/0 |
| 2.3 | optional alternative syllable divisions (barhaman, initial 3-consonant Arabic) | F2.3-alternate-split | partial (alternates offered) | lab 16/0; prod 16/0 |
| 2.4 | spelling signals scansion (meraa/miraa, ek/ik, n vs ;N, optional tashdid) | T2.4-flexible-spelling, T2.4-n-nasal, F2.4-optional-tashdid, T-tashdid-unwritten | partial (tashdid/n handled; spelled variants via LEX) | lab 20/0; prod 20/0 |
| 3.1 | word-grafting: consonant-final + alif/aa-initial may fuse | F3.1-graft, F3.1-graft-h, F3.1-graft-vowel, F3.1-graft-ain | yes except archaic ain-graft | lab 12/0; prod 11/1 |
| 3.2 | izafat: joins final consonant into flexible syllable; after alif/o/ii/e special | F3.2-consonant, F3.2-cc-tashdid, F3.2-alif, F3.2-iz-vao, F3.2-iz-ii, F3.2-iz-e, F3.2-weight, F3.2-after-short-vowel, F3.3-cc-tashdid, M6.0-no-three-shorts, T-izafat-written | yes | lab 16/0; prod 16/0 |
| 3.3 | conjunctive o: like izafat; after alif/ii separate syllable | F3.3-consonant, F3.3-cc-tashdid, F3.3-alif, F3.3-o-ii, F3.3-o-vowel, F3.3-o-h, F3.3-weight, F3.3-after-short-vowel | yes | lab 12/0; prod 12/0 |
| 3.4 | al: word before scans with extra l; vowel-final + al shortens (fil, bil, zul) | F3.4-al-consonant, F3.4-al-vowel | yes (consonant-final via alUnit; fii/zuu/buu/bi + al; baalkul family via LEX) | lab 14/0; prod 14/0 |
| 4.1 | word-final ain orthographic short syllable; pronunciation beats spelling | R4.1-final-ain, T-ascii-given, T-short-vowel | yes | lab 6/0; prod 6/0 |
| 4.2 | s/sh+t and similar final clusters = one letter; suppressed o after ;x | F4.2-final-cluster, F4.2-suppressed-o, F4.2-piyaalah | yes for s/sh+t and suppressed-o words; no for koft/taa;xt/kaard/paars clusters | lab 36/2; prod 23/15 |
| 4.3 | Indic conjunct onsets (pyaar), huu))aa, tumhaaraa, tumhe;N | F4.3-kyaa, F4.3-initial-conjunct, F4.3-mh-pronoun, F4.3-huaa | partial (LEX only) | lab 13/0; prod 13/0 |
| 4.4 | tanvin, dagger alif, final hamza, hamza chair, all;aah | F4.4-tanvin, F4.4-dagger-alif, F4.4-dagger-izafat, F4.4-final-hamza, F4.4-allah, F4.4-khari-zer | partial: final hamza, allah; no tanvin/tan or hamza-chair words | lab 21/0; prod 16/5 |

Chapters 5-6: afaail 20/20 known to production; meters #1-37 and rubai R1-R12 match the handbook table in both engines (49/49). Ch.7 rules: rules.json M6.0-*, M6.1-*, M7; production implements final-long, cheat syllable, pairs, anceps, Hindi meter; not implemented in either: #6 flexible form, taskin-e ausat (M6.1-meter6-flex, M6.1-taskin).

### Failing examples (expected vs actual)

**lab**

- 1.4-20 na:zariyah [default]: expected - - - x; got nothing
- 1.4-21 :tarabiyah [default]: expected - - - x; got nothing
- 4.2-33 i;xvaan [default]: expected = = -; got - = -
- 4.2-36 ;xved [default]: expected - = -; got = -

**prod**

- 1.4-20 na:zariyah [default]: expected - - - x; got = = - ; - = x ; - - = - ; = - x
- 1.4-21 :tarabiyah [default]: expected - - - x; got = = - ; - = x ; - - = - ; = - x
- 2.1-06 kyaa kyaa [option]: expected = -; got = = ; = - x ; - x = ; - x - x
- 3.1-12 ;xaak ((anbar [option, joined]: expected = = =; got nothing
- 4.2-10 koft [default]: expected = -; got = = ; - = - ; - - = ; = - -
- 4.2-11 taa;xt [default]: expected = -; got = = ; = - -
- 4.2-12 kaard [default]: expected = -; got = = ; = - -
- 4.2-13 paars [default]: expected = -; got = = ; = - -
- 4.2-14 maarg [default]: expected = -; got = = ; = - -
- 4.2-15 shuudr [default]: expected = -; got = = ; - = - ; - - = ; = - -
- 4.2-16 bhiishm [default]: expected = -; got = = ; - = - ; - - = ; = - -
- 4.2-17 gaar;D [default]: expected = -; got = = ; = - -
- 4.2-18 paark [default]: expected = -; got = = ; = - -
- 4.2-21 ;xvurshiid [default]: expected = = -; got = = = ; = - = - ; = - - = ; - = = -
- 4.2-31 ;xavaa.s [default]: expected - = -; got = -
- 4.2-32 ;xavaatiin [default]: expected - = = -; got = = - ; = - =
- 4.2-34 ;xve [default]: expected =; got - x
- 4.2-36 ;xved [default]: expected - = -; got = - ; - =
- 4.2-38 piyaalah [option]: expected = x; got - = x ; = = x
- 4.4-04 ishaarata:n [default]: expected - = - =; got - = = ; = = = ; - = - -
- 4.4-05 iraadata:n [default]: expected - = - =; got - = = ; = = = ; - = - -
- 4.4-13 muu))'a;s;sir [default]: expected - = =; got = = = ; = - = - ; - = = - ; - = - =
- 4.4-14 muu))'addab [default]: expected - = =; got = = = ; = - = - ; - = = - ; - = - =
- 4.4-15 muu))'a;z;zin [default]: expected - = =; got = = = ; = - = - ; - = = - ; - = - =

### Rules with no (or only indirect) handbook citation

- R1.2-h-apostrophe-h: section field "1.2 (glossary: kah'h (=), naalah'haa)" - h'h counts as one h
- F2.1-aur-weight: section field "2.1 (checked against the corpus)" - aur as one syllable: its weight
- F3.2-after-short-vowel: section field "3.2 (ASCII convention)" - iẓāfat after a written short vowel (dar-pa-e)
- F3.3-after-short-vowel: section field "3.3 (ASCII convention)" - o after a written short vowel
- G-glossary: section field "Glossary" - Glossary scansions the general rules do not produce
- G-pahunch: section field "Glossary (p'hu;N-chaa (= x)), 4.1" - pahu;Nch- scanned without its u
- T-lexicon: section field "7 (compare other editions)" - Known word: corpus readings

All T-* transcription rules cite ch.7 or corpus practice only (indirect support). Rules with a section but no worked example in the book: L1.2-*, S1.5, F3.2-weight, M6.*.

## Resilience (tests/handbook_resilience.js, in check.sh)

30 sloppy variants of grafting, iẓāfat, o and al (missing space, extra ZWNJ, missing zer, attached o, detached al, hamza-ye spellings, tab/double space) run through both engines: 0 throws, candidates always returned. Gaps (candidates exist but the handbook reading is absent), all production unless noted:
- ZWNJ or no space between words ("عالم‌الغیب", "آخراس"): read as one word, so no al/graft reading (engine-lab handles both). Splitting on ZWNJ was not done: ZWNJ is also used inside words.
- iẓāfat on ii spelled "یئے" or with no mark: not read as iẓāfat (unmarked iẓāfat is only a learned hypothesis in production).
