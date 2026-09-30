# 30 - Learn pages vs the handbook (Pritchett & Anjum)

## Status (update at every commit)

- done: audit of every rule card on Weight > Learn, Meter > Learn, the Home key and the legend (table below)
- done: all wrong/incomplete claims fixed in code; each rule card shows "Handbook §x.y" (links to franpritchett.com chapter + #anchor) or an "App addition" tag; attribution line on both Learn pages
- done: tests/learn_alignment.js (in scripts/check.sh): rule ids exist in engine-lab/rules.json and sit in the cited section, joined patterns are ones the handbook prints for that section, static cards carry a link, 8-word verbatim guard vs data/handbook_verbatim.json (skipped when absent)
- gate: npm test 0, BENCHMARK no regressions, engine untouched so held-out (96.46 / 78.10 / 100) unchanged
- next (optional): per-item citation inside Meter > Look up notes (they are Pritchett's own notes already); Weight > Look up glossary is out of scope here

Policy: her worked examples (word + printed scansion + syllable split) are used as printed and cited; explanations are our words in her terms; nothing is quoted (guard test).

Card ids are engine-lab/rules.json ids; the section is read off the id (F3.2-... = §3.2).

## Audit table (state BEFORE this change, and action taken)

| card | our claim (short) | handbook § | verdict | action |
|---|---|---|---|---|
| Weight: Words we use | miṣraʿ, sheʿr, baḥr, rukn, dum/da glossary | 5, 6 (rukn, baḥr); miṣraʿ/sheʿr/dum/da absent | rukn/baḥr match; rest not in handbook | added "flexible"; tagged: rukn/baḥr/flexible are handbook terms, miṣraʿ/sheʿr/dum-da labelled App addition |
| Letters: three rules | syllable = 2 letters or 1; consonant start; follows pronunciation | 1.2, 1.3, 1.4 | matches (but merged, no detail) | split into one card per rule, each cited |
| Letters: invisible / counts | zer/zabar/pesh, ھ, ں invisible; hamza, ع consonants; tashdīd doubles; آ is two letters | 1.2, 1.3 | incomplete: hamza chair not a letter; hamza only counts inside a word; older texts write aspiration as plain h; alif/آ always vowels | rewritten (§1.2, §1.3 cards) |
| Weight law | two letters long, one short | 1.5 | matches (handbook: "in general"; long about twice a short) | reworded, cited §1.5, flexible defined |
| Special: three-consonant words | title said "Arabic/Persian"; two-then-one usual | 1.4 | incomplete/wrong title: minority includes non-Arabic; ح/ع-final strongest; minority re-divides under grammar | retitled, expanded, cited §1.4 |
| Special: و and ی | vowel only as 2nd letter; alone = consonant | 1.3 | incomplete: alif/آ always vowel; ے also; ع/hamza consonants | rewritten, cited §1.3 |
| Bending: flexible words | list of 12 flexible words; "licence, not a third length; shortenable long" | 2.1 | incomplete + non-handbook term "shortenable long" | now "flexible"; full listed set; first-pass advice; cited §2.1 |
| Bending: "Final vowels before vowels ... bridge words" | vague | none | WRONG/not in handbook | removed; replaced by §2.1-2.4 cards |
| (missing) always long / always short | - | 2.1 | incomplete | new card (taa, go, yaa, kyaa, kyuñ, jyuñ, noun monosyllables; bah, kih, nah) |
| (missing) aur | - | 2.1 | incomplete | new card |
| (missing) word-final flexibility | - | 2.2 | incomplete | new card |
| (missing) alternate splits | - | 2.3 | incomplete | new card (barhaman, barkat) |
| (missing) flexible spellings | - | 2.4 | incomplete | new card (meraa/miraa, ek/ik/yak, vahaañ/vaañ, rakhā) |
| WORDS drill (16 words) | stated weights | 1.3-1.5, 2.1, 2.2, 4.2 | matches (engine-checked by learn_examples) | rule id + Handbook § link in feedback |
| FLEX drill (20 words) | flexible / always long / always short | 2.1 | matches | rule id + link; wording "virtually always long", "short in modern usage" |
| Grafting | optional; consonant-final + alif/آ; meter decides; less than half | 3.1 | matches (already fixed); incomplete: how to see it, rare ی/ے/و and ع cases, chaining | expanded; examples ākhir is, āp agar, ākhir agar, āp ākhir added (printed in §3.1) |
| Grafting, three words | Ghalib runs three words | 3.1 | matches | text says up to four words may chain |
| iẓāfat on consonant | joins last consonant, one flexible syllable | 3.2 | incomplete: no other changes (naẓar), no three shorts | expanded; dīvān, naẓar examples added |
| iẓāfat, short Arabic word | may double last consonant; scan both flexible | 3.2 | incomplete: optional for some, compulsory for others; also before o | expanded |
| iẓāfat after ā | extra syllable; ā stays long | 3.2 | incomplete: syllable is flexible; spellings ئے/hamza/zer | fixed |
| iẓāfat after ū | "same pattern as ā and ī" | 3.2 (on o) | WRONG: like alif; after au the o becomes a consonant (jau -> ja-ve) | fixed; jau example added |
| iẓāfat after ī | usually ī turns consonant | 3.2 | incomplete: rare vowel-ī reading (sāqī-e = = -) | fixed; dushmanī, sāqī examples added |
| (missing) iẓāfat after e | - | 3.2 | incomplete | new card (mai -> ma-ye) |
| o after consonant | joins it like iẓāfat | 3.3 | incomplete: tashdīd option; petrified compounds (2.2) | expanded, ḳhaṭ o example |
| (missing) o after ā / ī / e,o / h | - | 3.3 | incomplete | four new cards (vafā o, sādagī o, shādī o, mai o, ḳhusrau o) |
| al after consonant | word before scans with extra l | 3.4 | incomplete: complete break after al; tashdīd on two-consonant words | expanded; an al-ḥaq, lisān ul-ʿaṣr, rabb ul-raḥīm added |
| (missing) al after vowel | - | 3.4 | incomplete | new card (bilkul, fil-, ẓul-; hamza blocks) |
| Legend: long/short | dum/da, underline | 1.5 | matches; dum/da is app | tip cites §1.5, notes "in this app" |
| Legend: flexible | "a word whose long syllable may be shortened" | 2.1, 2.2 | wrong: flexible is a syllable, not only a word | reworded |
| Legend: x shortenable long | "about the meter, not the word" | 7 (meters 14-19 first syllable) | not in handbook as x; handbook says flexible = x | relabelled "long or short", App notation, §7 cited |
| Legend: extra | cheat syllable at line end, some mid-line breaks | 6.1 | matches | cited |
| Legend: grafted | "aḳhir us -> ā·khi·ras" | 3.1 | wrong vowel in example | now ākhir is -> ā·ḳhi·ris (her example) |
| Home: How to read the marks | "x is a licence: a long that may be shortened" | 1.5, 2 | non-handbook wording | reworded, cited §1.5, colours/dum-da labelled app's |
| Meter: family groups (counting / shape) | pedagogical grouping | none | not in handbook | tagged App addition |
| Meter: family names / dum-da tunes | nicknames from opening words | none | not in handbook | stated in the page attribution as app's |
| Meter: nuktachin (#18/19) allowance | "final long may split into two shorts" | 6.1 | WRONG: it is the next-to-last long | fixed in build_app.py |
| Meter: harek (#33/34) allowance | same | 6.1 | WRONG: next-to-last | fixed |
| Meter: dilenadan (#14/15) | next-to-last split; first long may be short | 6.1, 7 | matches | cited |
| Meter: hazaron (#26) | forbids cheat syllable | 6.1 | matches | cited |
| Meter: yihnathi (#36), milne (#25) | extra short before the break | 6.1 | matches; "ر of second دیر" not in handbook | remark removed, cited |
| Meter: ulti (Hindi) | ~15 longs; even longs except 8th may split | 6.2 | matches | cited §6.2 |
| Meter: patterns / numbers / feet | from her meter list | 5, 6.1 | matches (tests: 49/49) | attribution line |

Totals: 43 rows audited (72 cited items in the test incl. drill words); wrong 7 (Bending final-vowels claim, iẓāfat after ū, legend flexible, legend grafted example, nuktachin and harek allowances, three-consonant title), incomplete 24, matches the rest; app additions labelled: glossary terms (miṣraʿ, sheʿr, dum/da), legend x notation, counting/shape grouping (2), family names/tunes.

## Notes

- learn_examples.js now accepts the handbook's normal (unjoined) reading if any combination of per-word engine options gives it: the engine's cheapest reading of agar is not the handbook's (= - - =). Known caveat, unchanged.
- cards without a before-pattern (al, some o cases) show only the joined reading (the "before" for a vowel-final word + al is a spelling, not a scansion).
