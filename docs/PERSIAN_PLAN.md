# Persian (Fārsī) support: plan

Goal: Bahr works for Persian ghazals as well as Urdu. That means scanning, meters, the corpus and transliteration
(Persian script ↔ Roman ↔ Devanagari). The first corpus is the Persian kalaam sung in qawwali (Sufinama's
[top 100 Persian qawwali](https://sufinama.org/sufi-qawwali/top-100-persian-qawwali)), plus examples the user supplies.

Status (2026-10-08): circle-wheel fixes, Phase 0, Phase 1, Phase 4b (Ganjoor status in the circles) and the top-100 intake
are built; Phases 2, 3, 4 (ScanFa, Persian lexicon, Persian script input, Persian-only meter matching) and 6 (app surfaces beyond
the Poets language filter) are next. See "Done so far" at the end.

---

## 1. What we already have (measured, not assumed)

- **The Persian data already exists.** `scripts/import_sufinama.py` brings in Jami (45 ghazals), Bu Ali Qalandar (5) and
  Khusrau's Persian kalaam (22) with aligned `ur` / `hi` / `ro` lines. `data/sufinama_scanned.json` scans them with the
  Urdu engine, and `build_poets.py` ships them as poet collections.
- **Persian scansion baseline today**, over 732 lines (Jami, Bu Ali, Khusrau-fa):

  | Measure | Value |
  |---|---|
  | Lines at cost 0 | 305 (42%) |
  | Lines that don't scan (cost > 5) | 84 (11.5%) |
  | Lines given the Hindi meter `H` (never right for Persian) | 58 (8%) |
  | Mean `scan_pass_rate`, Jami / Khusrau-fa / Bu Ali | 0.78 / 0.85 / 0.96 (Urdu Sufinama poets: 0.88–0.94) |

- **Where the failures actually come from.** Every one of the 732 lines was rescanned with the real pipeline:
  `scanLine(rekhtaScanText(ur, ro))`, which reads Urdu script plus hints taken from the Roman. The `ascii` column in
  `sufinama_scanned.json` is display only, so its `kii`/`baa` slips are cosmetic. The failures fall into four buckets,
  and they overlap:

  | Bucket | Lines | Of which fail (cost > 2) |
  |---|---|---|
  | **Hindi meter `H` is the cheapest fit.** It is a lenient catch-all, so it beats the real meter, and whole ghazals get labelled `H`. Example: *chūñ māh dar arz-o-samā … tābāñ tuī* is rajaz musamman sālim. | 58 top-`H` | n/a |
  | **Iẓāfat hints dropped.** `rekhtaScanText` pairs Roman with Urdu tokens all-or-nothing. Sufinama's Roman hyphenates prefixes and joins words differently (*ba-ḳhudā* / `بخدا`, *rasūlallāh* / `رسول اللہ`), so the counts differ and every hint for the line is lost. | 149 (20%) | 52 |
  | **Arabic formulae and al- compounds** (`یا رسول اللہ`, `والضحیٰ`, `واللیل`, `خیرالبشر`, `ذوالجلال`) | 120 | 49 |
  | **Persian word readings the engine lacks**: `توئی` *tu-ī* is read with a long `تو`; prefixes *ba-/be-/na-*; *chu*; line-final *nīst* | the rest | n/a |

  With `H` set aside, 614 lines (84%) have a regular meter within cost 5, 538 (73%) within cost 2, and 118 (16%) have
  none at all.
- **The meter table already covers the Persian staples.** Among the 40 meters in `data/meters.json`:
  - ramal musaddas mahzūf (11), the Masnavi meter
  - khafīf (14, 15)
  - mujtass (33–35)
  - munsarih (22, 23)
  - sarīʿ (24)
  - hazaj musaddas mahzūf (27)
  - mutaqārib (28, 29)
  - ramal mashkūl (36)
  - rajaz matvī makhbūn (25)
  - kāmil (37)

  The gaps are a handful of meters common in Rumi and Hafiz, such as rajaz musamman matvī (*muftaʿilun* ×4). Phase 0
  shows whether those gaps matter.
- **Language is mixed up in the data.** `build_poets.py` sends both `khusrau_persian` and `khusrau_urdu` to the one key
  `khusrau`. Nothing records which lines are Persian. Qawwali transcriptions also mix in Urdu and Purabi girah lines.

**Bottom line:** Urdu ʿarūz is Persian ʿarūz, so the engine's syllable-weight rules and meter table mostly carry over.
The first three buckets can be fixed outside the protected engine block: the `H` filter, Roman↔Urdu alignment in
`05-translit-helpers.js`, and Arabic phrase hints. The fourth bucket, Persian readings the engine doesn't offer, is
where a real decision lies (§3.3, Phase 2).

## 2. Constraints this plan keeps

- **No engine edits** (CLAUDE.md rule 6). The Persian layer goes around `01-engine.js`: language detection,
  normalisation, word→ASCII readings and post-filters. If an engine or `METERS_RAW` change ever turns out to be needed,
  it's a separate phase that you sign off on (§6, Phase 4).
- **Ghalib and Mir must not regress** (rule 7). `tests/benchmark.js` floors stay where they are. Persian readings go in
  their own map, keyed by language, and **never** feed `WORD_ASCII_MAP`, `ROMAN_CASUAL_MAP` or the Urdu lexicon. This
  is the same rule that keeps Rekhta's Roman from overriding Pritchett's.
- **Offline-first.** No new runtime requests. Any new font is bundled and subset.
- **No inline styles.** Any UI follows `docs/DESIGN_PRINCIPLES.md`.

## 3. Decisions (settled 2026-10-08)

1. **Roman: Indo-Persian.** Majhūl ē/ō (*shokh*, *be-navā*, *ze*), as sung and as Sufinama and Pritchett write it.
   Iranian Roman may come later as a display option.
2. **Persian script: store both spellings.** Every Persian line keeps Sufinama's Urdu-orthography `ur` and gains an
   Iranian-orthography `fa`. Display uses `fa` when it exists.
3. **Persian readings use a second engine instance** (my call, as delegated). Tested 2026-10-08: the engine strips
   most harakat (`بِخُدا` reads exactly like `بخدا`), so vocalised input can't carry Persian readings. Instead,
   `build_app.py` emits the protected block a second time with the Persian `lex()` lines spliced in. This is the same
   splice `lib_scan.js` already does with `extraLex`. The copy is exposed as `ScanFa`. The block's source stays
   byte-identical, so the Urdu engine and its floors can't move. The cost is about 56 KB uncompressed on a 4.9 MB page.
   Persian-only meters (Phase 4) run in that instance too.
4. **Rights: ship the modern poets too** (Jigar, Ashrafi, Shams Mashriqi, Saudagar, Muneer), the same way Rekhta poets
   ship: text plus a link back. **Also add the Persian works of the popular Urdu poets:** Ghalib's Persian dīvān,
   Iqbal's Persian books (*Payām-e Mashriq*, *Zabūr-e ʿAjam*, *Javīd-nāma*), and the Persian of Khusrau, Bedil and
   others. Ganjoor carries many of these, and the source for each is confirmed in Phase 5.
5. **Collection shape: mixed into the Poets picker, with a language filter** (All / Urdu / Fārsī). A poet with both
   languages, such as Ghalib, Iqbal or Khusrau, stays one poet, and the filter narrows to the language. The filter
   lives in the URL (`?lang=fa`) like `meter` and `q`.

## 4. Data model

Per ghazal: `lang` (`fa` | `ur` | `mixed`). Per line: `lang` (`fa` | `ur` | `ar` for Arabic formulae), plus

```
{ "fa": "نمی‌دانم چه منزل بود شب جایی که من بودم",   // Iranian orthography (new, optional)
  "ur": "نمی دانم چہ منزل بود شب جائے کہ من بودم",     // as Sufinama gives it
  "hi": "नमी-दानम चे मंज़िल बूद शब जाए कि मन बूदम",
  "ro": "namī-dānam che manzil buud shab jaa.e ki man būdam",
  "lang": "fa", "meter_id": 26, "cost": 0.4, "gold_meter": 26 }
```

Fix the `khusrau` key so that Urdu and Persian Khusrau stay in one poet but carry their own `lang`. Lines with
`lang: ur` inside a Persian qawwali (girah) are scanned as Urdu and don't count toward the ghazal's Persian meter
vote.

## 5. Ground truth: the gold set (built before anything is tuned)

- **`tests/data/persian_gold.json`**, made of:
  - the 50 kalaams from the top-100 list, each with a hand-verified meter per ghazal and per line
  - your own examples
  - a held-out slice of Ganjoor poems that carry meter labels
- **Ganjoor**, the open Persian poetry archive:
  - Each poem page states its meter (وزن) and gives authentic Iranian-orthography text.
  - Phase 0 checks how to get it, either through the site's API or through its open-source backend's data.
  - It is used for three things: gold meters for Hafiz, Saadi, Rumi, Iraqi and Jami; a `fa` column; and **attribution
    checks**. Qawwali attributions are often apocryphal; the "Jami" ghazal examined on 2026-10-07 had no Ganjoor match.
    Unmatched poems are tagged `attribution: "qawwali tradition"` rather than dropped.
- **`tests/benchmark_fa.js`**:
  - floors in `tests/benchmark_fa_baseline.json`, using the same raise-only `--update` rule as `benchmark.js`
  - metrics: line cost-0 rate, unscanned rate, `H` rate (must be 0), ghazal-meter accuracy against gold, and
    Roman→Persian and Persian→Roman word accuracy
  - added to `scripts/check.sh`
- **Training and test stay separate.** Lexicon entries mined from a poet's lines are scored on other poets, as
  `casual_roman_eval.js` already does.

## 6. Phases

### Phase 0: baseline and diagnosis (small)
- Tag `lang` per line in `sufinama_ghazals.json`. Detection uses marker words: Persian *ast, nīst, mī-, rā, az, ba,
  ze, -am/-ī/-ad*; Urdu *hai, meñ, kā/kī/ke, se, ne*.
- Build the gold set (§5). Add `scripts/fa_diagnose.js`, which sorts every failing line into one bucket: `H` leak,
  dropped hints, Arabic formula, missing Persian reading, missing meter, girah or non-Persian line, or engine rule. The
  first version is the throwaway script behind the §1 numbers.
- Test whether the engine honours harakat in the scan text (`تُئی` vs `توئی`). The answer picks the Phase 2 route.
- Record the baseline in `benchmark_fa_baseline.json`. **The bucket counts decide how much weight each later phase
  gets.**

### Phase 1: quick wins outside the engine
- **Remove the Hindi meter from Persian results.** Filter `H` out of results for `lang: fa` lines, in `lib_scan.js` and
  the scan view, not in the engine.
- **Robust Roman↔Urdu alignment.** In `rekhtaScanText`, align Roman parts to Urdu words by consonant skeleton (a
  small DP that allows 1↔2 merges), so one mismatched token no longer throws away the line's hints. This is shared
  code, so Rekhta lines benefit too. It must keep `tests/benchmark.js` and the Rekhta poets' scan rates at least where
  they are.
- **Pen names.** Strip the quote marks (`'jāmī'`, `'ḳhusrav'`) before alignment.
- **Arabic formulae.** A small `ar` phrase table, applied as hints before scanning. It pins the al-reading
  (`alUnit`, handbook 3.4) or the written-out vocalisation: *yā rasūlallāh, vallail, vazzuhā, subḥānallazī asrā,
  ḳhair-ul-bashar, zul-jalāl, lā ilāha illallāh, anal-ḥaqq*.
- **Expected effect.** The `H` filter clears 58 lines, hints recover some of the 52, and Arabic hints some of the 49.
  Phase 0 measures this; I am not quoting a number in advance.

### Phase 2: Persian lexicon
- **`data/fa_lexicon.json`**, mapping word to ASCII reading (short vowels written out), built by
  `scripts/build_fa_lexicon.py` from:
  1. Sufinama's Roman of Persian kalaam (it does Pritchett's job here: a vocalised reading per line)
  2. Ganjoor text for coverage
  3. Wiktionary or Kaikki Persian entries for vocalisation (CC BY-SA, credited in `LICENSES/`)
- **Verb morphology generator.** Classical Persian verbs are regular: prefix *mī-/na-/be-/ma-* + past or present stem +
  personal ending (+ *-ast/-and*). About 300 stems × the endings covers most verb forms in ghazal text.
- **How Persian readings reach the engine (§3.3).** `scanLine(line, overrides)` can only pin one of the engine's own
  readings, and harakat are stripped, so `fa_lexicon.json` becomes `lex()` lines spliced into a second engine
  instance, `ScanFa`, at build time. The scanner, the reader and `lib_scan.js` choose the instance by line `lang`.

  Shared-`LEX` additions (rule 6's tashdid route) stay limited to words that read the same in Urdu and Persian.
- **Prosody points to test against gold** (these shouldn't need engine changes; record any that do):
  - overlong syllables mid-line (*nīst*, *dūst*, *kārd*) count as long + short
  - alif elision after a vowel (*murda ast* → *murdast*, *manast*)
  - *o/va* conjunction short or long
  - iẓāfat *-e/-ye* flexible
  - *ki/che* always short
  - pronoun *ū* long

### Phase 3: Persian script in and out
- **`faNormalize`** in a new `src/js/05b-persian.js`. It maps Iranian orthography to the forms the engine expects:
  - final `ه` → `ہ`; `ي`/`ك` → `ی`/`ک`
  - `ۀ`/`هٔ` → iẓāfat hint
  - ZWNJ (`نمی‌دانم`) → word-internal joiner
  - final `ی` vs `ے` decided by lexicon
  - written kasra → iẓāfat hint, the same mechanism as `rekhtaScanText`
- **Script output.** Persian script, Roman (Indo-Persian), Devanagari (Sufinama conventions: *ख़, ज़, फ़*, nasal *ँ*)
  and, later, Iranian Roman.
- **Language detection** for typed input: Auto / Urdu / Fārsī, with a visible toggle so the user can override it.
- **Typed Roman → Persian script.** Ships as a lexicon-backed `collocSpelling` counterpart. It is judged by a
  `fa_roman_eval.js`, with test poets held out.
- **Font.** Persian Naskh is available on every OS, so v1 uses system fonts, like Nastaliq does today. A bundled subset
  font (Vazirmatn, OFL) is optional.

### Phase 4: meters borrowed from Ganjoor
Ganjoor's public API (`https://api.ganjoor.net/api/ganjoor/rhythms`, fetched 2026-10-08) lists **212 meters, each with
its afāʿīl and a verse count**, about 1.49 M verses in all. I converted each one's afāʿīl to a weight pattern and matched
it against `data/meters.json`, letting `=*` stand for either weight:

- **Our 40 standard meters cover 94.9% of Ganjoor's verses.** The rubāʿī meter (3.5%) is already in the `rubai` list,
  which brings coverage to about 98%.
- **Missing meters with more than about 800 verses.** Some may already be reached through the engine's final-syllable
  variants; the Phase 0 check settles that before anything is added.

  | Ganjoor id | Meter | Verses |
  |---|---|---|
  | #31 | hazaj musaddas akhrab maqbūz (*mafʿūlu mafāʿilun mafāʿīlun*) | 6,431 |
  | #25 | ramal musamman makhbūn (*faʿilātun* ×4) | 2,752 |
  | #26 | ramal musamman sālim (*fāʿilātun* ×4) | 2,225 |
  | #67 | muzāriʿ musaddas akhrab makfūf (*mafʿūlu fāʿilātu mafāʿīlun*) | 1,650 |
  | #84 | *mafʿūlu mafāʿīlu fāʿilātun* | 1,574 |
  | #85 | *faʿilātun* ×3 + *faʿ* | 1,219 |
  | #27 | rajaz musamman matvī (*muftaʿilun* ×4) | 821 |

  The long tail (about 200 meters under 500 verses each) is not added.
- **Where they go.** A new `persian` key in `data/meters.json` (id `F1…`, Ganjoor id, afāʿīl, Persian name, verse
  count), built by `scripts/build_fa_meters.py` from a checked-in snapshot of the API response.
- **How they're matched.** They are matched only in `ScanFa`, through the exported `parseRaw` / `buildUnits` /
  `matchMeter`; `variants()` is reimplemented there, since it isn't exported. Urdu scans never see them.
- **Names.** Every meter, Urdu or Persian, gets its Persian name (*ramal-e musaddas-e maḥzūf*, afāʿīl in Persian
  script) and its Ganjoor id and verse count. The Ganjoor ids give a direct cross-check against Ganjoor's per-poem
  meter labels, which become the Phase 0 gold set. Handbook entries cite Elwell-Sutton, *The Persian Metres* (1976),
  and Shamisa, *Āshnāyī bā ʿarūz va qāfiya*.

### Phase 4b: circles that know about Persian
The circles view (`17c-circles.js`) gives every knob setting (circle meter × musamman/musaddas × base/makhbūn ×
sālim/mahzūf/maqṭūʿ) one of two statuses: "Canonical Urdu meter #N" or "Theoretical (al-Khalīl), not composed in
Urdu". I ran the 90 settings that `buildCircleLineFeet` builds through it and looked each pattern up in Ganjoor (muzāriʿ
and mujtass build only their musamman makhbūn form; Wāfir, Ṭawīl and Basīṭ are not covered yet):

- **Persian-attested settings currently marked theoretical:**

  | Setting | Ganjoor | Verses |
  |---|---|---|
  | ramal musamman makhbūn sālim | #25 | 2,752 |
  | hazaj musaddas sālim | #61 | 64 |
  | rajaz musaddas | #43, #1169 | 69 + 15 |
  | mutaqārib musaddas sālim | #1141 | 43 |
  | mutadārik musaddas sālim | #1200 | 35 |
  | kāmil musaddas sālim | #115, #1220 | 25 |
  | ramal musaddas makhbūn sālim | #45 | 9 |
  | Basīṭ makhbūn (shown as "Arabic only") | #32 | 389 |

- **Three-way status.** Canonical Urdu meter #N · **Persian meter** (with its Ganjoor verse count) · Theoretical. A
  setting counts as Persian if Ganjoor has at least 200 verses in it, or at least one line in our own Persian corpus
  scans in it. Below that, it reads "rare in Persian (N verses)" rather than "never composed".
- **Verses.** A Persian-status setting shows a couplet from our Persian corpus that `ScanFa` fits at cost 0, linked to
  the reader. If the corpus has none, it shows a Ganjoor-sourced public-domain couplet with a link to its Ganjoor page.
  Canonical Urdu settings gain a Persian couplet next to the Urdu one where we have it. That fills in, for example,
  khafīf and mujtass with Hafiz and Saadi.
- **Copy to fix.** Several `theoreticalReason` strings are wrong once Persian counts. For example, "classical Persian
  and Urdu poets never composed…" for khafīf musamman (true: 0 Ganjoor verses), but "Rajaz is standardly composed as an
  8-foot meter" hides rajaz musaddas in Persian. Each one is rewritten to say Urdu and Persian separately.
- **Wheel bugs found along the way** (they matter here, because the Persian lookup is by pattern). These are fixed
  first, in a separate commit:
  - *ramal base sālim* builds the mahzūf pattern. So "ramal musaddas sālim" and "ramal musaddas mahzūf" produce the same
    feet, yet one says Urdu #11 and the other says theoretical. The same holds for musamman (#10). Meters 10 and 11 are
    both mahzūf in `meters.json`, so the sālim setting should build *fāʿilātun* ×N, which is Ganjoor #26 and #55.
  - *rajaz musamman base mahzūf* builds the sālim pattern.
  - The makhbūn knob changes nothing for hazaj, kāmil, mutaqārib and mutadārik: both settings produce identical feet
    under different labels. The knob should be disabled for those meters, or given its real zihāf.
  - *maqṭūʿ* endings never hit Ganjoor, because Ganjoor files *faʿlun/faʿilun* under one meter. The lookup has to treat
    them as one.
- **Test.** `tests/circles_combinations_test.js` gains a table of every setting → expected status and Ganjoor id.

### Phase 5: corpus intake
- **Top-100 list: 50 unique kalaams. 20 are already in the corpus and 30 are new** (Appendix A).
- **Import.** Add the new slugs to `sufinama_manifest.json` under `persian_qawwali`, with the poet read from the slug.
  Run `import_sufinama.py`, then `scan`, then build.
- **Next poets** (Sufinama persian-kalam and Ganjoor):
  - Hafiz, Rumi (Dīvān-e Shams), Saadi, ʿIrāqī, Khusrau (more)
  - Jami (Ganjoor-verified)
  - Shah Niyaz
  - Persian works of Urdu poets: Ghalib's Persian dīvān, Iqbal's Persian books, Bedil, Khusrau (§3.4)
  - the modern qawwali poets on the list (Jigar, Ashrafi, Shams Mashriqi, Saudagar, Muneer), with a link back
- **Each entry** keeps its Sufinama link, `lang`, `gold_meter` where verified, and `attribution` status.
- **The known-verse index** (`?g=` references) gets a `fa/...` namespace.

### Phase 6: app surfaces
- **Scan.** A language toggle (Auto / Urdu / Fārsī). Persian results show meter names in Persian and English, and the
  word gloss row shows the reading used.
- **Ghazals.** Persian poets go in the Poets picker next to Urdu ones, with a language filter (All / Urdu / Fārsī,
  `?lang=`) on the picker and the list. Poets who wrote in both languages stay one poet. Script switching re-renders
  every mounted view (the `setScriptMode` gotcha), and lines whose language differs from the ghazal's show a small
  language tag.
- **Meter.** Each meter page shows Persian examples next to the Urdu ones, and the Persian-only meters from Phase 4
  appear in Lookup.
- **Home, About, Guide.** Copy changes from "Urdu" to "Urdu & Persian". About gets Persian scanner accuracy from
  `benchmark_fa`.
- **Out of scope for now:** audio voice for Persian, and drills built on Persian lines (a later phase once the corpus
  is verified).

### Phase 7: tests and CI
- `benchmark_fa.js` goes into `check.sh`, so it gates the Pages deploy.
- `packed_data.js` already accepts Sufinama links. Extend it to check `lang` values and that every `fa` line has `ro`.
- `test_runtime.py`: the new Persian module must tolerate missing DOM, like everything else.

## 7. Targets

| Metric | Today | After P1 | After P2/P3 |
|---|---|---|---|
| Persian lines at cost 0 | 42% | measured in P0 | ≥ 85% |
| Lines with no regular meter within cost 5 (ignoring `H`) | 16% | measured in P0 | < 3% |
| `H` on Persian lines | 8% | 0 | 0 |
| Ghazal meter matches gold | n/a | measured | ≥ 95% |
| Persian script → Roman word accuracy | n/a | measured | ≥ 90% |
| Ghalib / Mir floors | unchanged | unchanged | unchanged |

## 8. Risks

- **Sung text is not the written text.** Qawwali transcriptions add repetitions, girah lines and vocative padding. A
  line that fails because it is sung padding is not an engine bug. Gold marks such lines `sung: true`, and the metrics
  leave them out.
- **Attribution.** Many "Khusrau" and "Jami" qawwali texts are traditional. Ganjoor matching settles what it can, and
  the rest gets labelled.
- **Lexicon leakage into Urdu.** Persian and Urdu share most vocabulary but not all readings (Urdu *ki* is long when it
  means "of"; Persian *ki* is short). Scoping by `lang`, plus the Urdu floors, guards this.
- **Data size.** Ganjoor is huge. Ship only the corpus we show, and keep the lexicon packed the way `pack_verses.py`
  packs verses.

## 9. Order of work

1. Phase 0, then Phase 1. This is one short loop, and its numbers decide the rest. The circle-wheel bug fixes (Phase 4b)
   are independent and can go first.
2. Phase 5: import the 30 new kalaams, so the gold set grows while the lexicon is built.
3. Phase 2 and Phase 3 together: the lexicon, the `ScanFa` instance and the script layer.
4. Phase 4, the Ganjoor meters (data plus `ScanFa` matching), then Phase 4b, the circles' Persian status and verses.
5. Phase 6, the UI, once the Persian benchmark is at its targets.

---

## Appendix A: top-100 Persian qawwali (50 unique kalaams)

All are under `https://sufinama.org/sufi-qawwali/top-100-persian-qawwali/<slug>`.

**Already in the corpus (20):**
ai-chehra-e-zebaa-e-tuu-rashk-e-butaan-e-aazarii-amir-khusrau-persian-kalam ·
ba-khudaa-gair-e-khudaa-dar-do-jahaan-chiize-niist-jami-persian-kalam ·
ba-khuubii-ham-chu-mah-taabinda-baashii-amir-khusrau-persian-kalam ·
chashm-e-maste-ajabe-zulf-e-daraaze-ajabe-amir-khusrau-persian-kalam-3 ·
chuun-maah-dar-arz-o-samaa-taabaan-tuii-taabaan-tuii-jami-persian-kalam-18 ·
diishab-ki-mii-raftii-ayaan-ruu-karda-az-maa-yak-taraf-amir-khusrau-persian-kalam ·
diivaana-shudam-dar-aarzuuyat-amir-khusrau-persian-kalam ·
dilam-dar-aashiqii-aavaara-shud-aavaara-tar-baada-amir-khusrau-persian-kalam ·
guftam-ki-raushan-chuun-qamar-guftaa-ki-rukhsaar-e-manast-amir-khusrau-persian-kalam ·
har-shab-manam-fitaada-ba-gird-e-saraae-tuu-amir-khusrau-persian-kalam ·
jahaan-raushanast-az-jamaal-e-mohammad-jami-persian-kalam-4 ·
kaafir-e-ishqam-musalmaanii-maraa-darkaar-niist-amir-khusrau-persian-kalam ·
khabaram-rasiida-imshab-ki-nigaar-khvaahii-aamad-amir-khusrau-persian-kalam ·
manam-mahv-e-jamaal-e-uu-namii-daanam-kujaa-raftam-bu-ali-shah-qalandar-persian-kalam ·
namii-daanam-che-manzil-buud-shab-jaae-ki-man-buudam-amir-khusrau-persian-kalam ·
nasiimaa-jaanib-e-bathaa-guzar-kun-jami-persian-kalam-11 ·
tanam-farsuuda-jaan-paara-ze-hijraan-yaa-rasuul-allaah-jami-persian-kalam ·
yaa-mohammad-ba-man-e-be-sar-o-saamaan-madade-jami-persian-kalam-21 ·
za-mahjuurii-bar-aamad-jaan-e-aalam-jami-persian-kalam-17 ·
za-rahmat-kun-nazar-bar-haal-e-zaaram-yaa-rasuulallaah-jami-persian-kalam-22

**New (30):** classical, public domain unless marked †, which means check rights (§3.4)

| Poet | Slugs |
|---|---|
| Hafiz | ai-khusrav-e-khuubaan-nazare-suu-e-gadaa-kun-hafiz-persian-kalam-9 · ba-har-suu-jalva-e-dildaar-diidam-hafiz-persian-kalam · dil-mii-ravad-za-dastam-saaheb-dilaan-khudaa-raa-hafiz-persian-kalam · manam-ki-gosha-e-mai-khaana-khaanqaah-e-manast-hafiz-persian-kalam |
| Rumi | chamane-ki-taa-qiyaamat-gul-e-uu-ba-baar-baadaa-rumi-persian-kalam-37 · na-man-behuuda-gird-e-kuucha-o-baazaar-mii-gardam-rumi-persian-kalam · saaqii-e-baa-vafaa-manam-dam-hama-dam-alii-alii-rumi-persian-kalam-158 · tuu-kariimii-man-kamiina-barda-am-rumi-persian-kalam-17 |
| Saadi | ai-maah-e-aalam-soz-e-man-az-man-chiraa-ranjiida-ii-saadi-shirazi-persian-kalam · bar-sariir-e-dil-shaaham-shauqat-e-gadaa-iin-ast-saadi-shirazi-persian-kalam |
| Fakhruddin Iraqi | sanamaa-rah-e-qalandar-sazad-ar-ba-man-numaaii-fakhruddin-iraqi-persian-kalam |
| Amir Hasan Sijzi | ai-ki-sharah-e-vazzuhaa-aamad-jamaal-e-ruu-e-tuu-amir-hassan-ala-sijzi-persian-kalam |
| Ahmad Jam | manzil-e-ishq-az-makaane-diigarast-ahmad-jam-persian-kalam |
| Nizamuddin Auliya | sabaa-ba-suu-e-madiina-ruu-kun-az-iin-duaa-go-salaam-bar-khvaan-nizamuddin-auliya-persian-kalam |
| Alauddin Sabir | imroz-shaah-e-shaahaan-mehmaan-shudast-maa-raa-alauddin-ali-ahmad-sabir-persian-kalam |
| Abdul Qadir Jilani | be-hijaabaana-dar-aa-az-dar-e-kaashaana-e-maa-sheikh-abdul-qadir-jilani-persian-kalam |
| Lal Shahbaz Qalandar | haidariyam-qalandaram-mastam-lal-shahbaz-qalandar-persian-kalam |
| Bahlol Dana | raushan-az-aks-e-jamaalash-aalam-e-imkaan-e-maa-bahlol-dana-persian-kalam |
| Ghalib (Persian) | haq-jalva-gar-za-tarz-o-bayaan-e-mohammad-ast-mirza-ghalib-persian-kalam |
| Qateel | maa-raa-ba-gamza-kusht-o-qazaa-raa-bahaana-saakht-mirza-muhammad-hussain-qateel-persian-kalam |
| Shah Niyaz | ai-dil-ba-giir-daaman-e-sultaan-e-uliyaa-shah-niyaz-ahmad-barelvi-persian-kalam-4 · ba-deh-dast-e-yaqiin-ai-dil-ba-dast-e-shaah-e-jiilaanii-shah-niyaz-ahmad-barelvi-persian-kalam-3 · dilaa-dast-e-talab-ba-kushaa-ba-dargaah-e-shahanshaahe-shah-niyaz-ahmad-barelvi-persian-kalam-4 · khvaaja-e-khvaajgaan-muiinuddiin-shah-niyaz-ahmad-barelvi-persian-kalam-1 |
| Unknown | ai-jaan-e-jahaan-aarzuu-e-ruu-e-tuu-daaram-unknown-persian-kalam |
| † Jigar Moradabadi | dil-burd-az-man-diiroz-shaame-jigar-moradabadi-persian-kalam |
| † Hakeem Nazr Ashrafi | namii-daanam-ki-aakhir-chuun-dam-e-diidaar-mii-raqsam-hakeem-nazr-ashraf-ashrafi-persian-kalam |
| † Shams Mashriqi | har-lahza-ba-shakle-but-e-ayyaar-bar-aamad-dil-burd-o-nihaan-shud-shams-mashriqi-persian-kalam |
| † Shah Siddique Saudagar | aashiq-na-shudii-jalva-e-jaanaan-che-shanaasii-shah-siddique-saudagar-persian-kalam-5 |
| † Muneer | aamada-qatl-e-man-aan-shokh-sitam-gaare-muneer-persian-kalam |

---

## Done so far (2026-10-08)

- **Circle wheel.** Each knob setting now builds the feet it names:
  - ramal and khafīf sālim; rajaz, kāmil and generic ḥadhf/qaṭʿ endings; mujtass and muzāriʿ sālim
  - hazaj qabḍ, which is meter #32
  - khafīf's mustafʿilun
  - The makhbūn knob is disabled where it has no meaning (kāmil, mutaqārib).
  - The Masnavi entry moved from meter #1 to #11.
  - New canonical settings: #32 (Parveen) and #35 (Ghalib #142).
  - `tests/circles_combinations_test.js` checks that every canonical setting builds its meter's pattern and that the
    three endings differ.
- **Ganjoor meters.**
  - `data/persian_meters.json` is built by `scripts/build_fa_meters.py` from the snapshot in
    `data/sources/ganjoor_rhythms.json`.
  - The wheel shows "Persian Meter" (200 or more Ganjoor verses), "Rare in Persian" or "Theoretical".
  - Settings found only in Persian show a Persian couplet: Saadi 166, Attar 142, Saadi 402. Each one's fit is verified
    by the engine.
  - The Rumi Masnavi couplet now sits under canonical #11.
- **Corpus.**
  - 30 new kalaams were added to `sufinama_manifest.json` as `fa_<poet>`; 2 missing Bedam ghazals were scraped too.
  - New script `scripts/scan_sufinama.js`, Persian-aware: a per-line `lang` tag, no Hindi meter on Persian lines, and
    girah lines don't vote.
  - `build_poets.py` ships `lang`, `xl` (other-language lines) and, for sure Ganjoor matches, `gj` and `fa`
    (Iranian-orthography lines).
  - The Poets picker has an All / Urdu / Fārsī filter.
- **Gold.** `scripts/match_ganjoor.py` writes `tests/data/persian_gold.json`. 37 of 102 ghazals were found on Ganjoor.
  Its attribution flags include "Shams Mashriqi" (Ganjoor has Shams Maghribi) and one "Hafiz" text that is
  Hedayat's anthology.
- **Hints (shared with the Rekhta poets).**
  - `rekhtaScanText` aligns Roman to Urdu by consonant skeleton when the word counts differ, applying iẓāfat only.
  - Allah spellings and the stray ZWNJ are folded.
  - Over 19,787 Rekhta, Columbia and Sufinama lines: own-meter fit at cost 2 or less goes from 17,129 to 17,278. 244
    lines improve; one good fit (*lab-e-ābdār*) gets worse, and its hint is what the Roman says.
- **Benchmarks.** `tests/benchmark_fa.js` is in `npm test`. Floors: line.cost0 45.3%, line.fit2 76.0%,
  line.own2 70.8%, gold.meter 100% (35/35). The Ghalib/Mir benchmark is unchanged.

## Round 2 (2026-10-08)

- **Every Persian qawwali collection on Sufinama.**
  - `scripts/crawl_sufinama_persian.py` walks the hub and all 19 collections, including their lazy-loaded pages. The
    first pass saw only the first page; top-100 actually holds 98 unique kalaams.
  - It finds 194 unique Persian kalaams and files each by the poet its page names.
  - URLs already in the manifest are skipped, and `build_poets.py` drops same-couplet duplicates within a poet.
  - The corpus now has 222 Persian ghazals from 52 poets. New poets are registered from `data/sufinama_poets.json`,
    with their Urdu and Devanagari names.
  - One page used Arabic presentation-form letters. They are folded to plain letters in the build, the scan and
    `rkPlain`.
- **Language filter works per ghazal.** A two-language poet (Jigar, Khusrau, Shah Niyaz, Iqbal) shows only the ghazals in
  the chosen language, with a "show all" link. Persian ghazals of these poets carry a Fārsī tag in the list.
- **Ganjoor in the reader.** The reader title links to the poem on Ganjoor. In Urdu-script mode a line shows Ganjoor's
  Iranian spelling where it is the same line; a sung variant keeps Sufinama's text, so the Roman and the scan always
  match what is shown.
- **Scan in Fārsī.** An Auto / Urdu / Fārsī control. `detectScanLang` recognises Iranian letters and Persian words.
  `faScanText` folds Iranian letters and applies the Persian rule that a nūn after a long vowel is not counted
  (این → ایں, جان → جاں). No Hindi meter for Persian. When no standard meter fits a line, it is tried against Ganjoor's
  Persian-only meters (300 or more verses), and the result is reported with a link. Two Persian samples were added.
- **Reader verse size.** Urdu/Persian 32 → 40px (phones 25 → 30), Devanagari 22 → 26px, Roman 19 → 20px.
- **Benchmark.** `benchmark_fa.js` gates a fixed core (the first 102 Persian ghazals,
  `tests/data/persian_core_urls.json`; unchanged at 45.3 / 76.0 / 70.8) and the whole Persian corpus, separately.

## Round 3 (2026-10-08): Persian word list and Roman repair

- **Word list.** `data/fa_lexicon.json`, 3,276 words, is built by `scripts/build_fa_lexicon.js` with
  `scripts/lib_fa_lexicon.js`. It is mined from Sufinama lines whose Urdu and Roman split into the same words, maps each
  Urdu-script word to Sufinama's Roman and Devanagari, and never feeds the Urdu maps.
- **Word-building in the app.** `faWordScripts` / `faLineScripts` in `05-translit-helpers.js` look a word up, then try
  Persian prefixes (mī-, namī-, be-, ba-, na-) and endings (-hā, -ān, -am, -ī, -ash …) around a known stem. They write
  half-space compounds and particles the way Sufinama does (sāhib-dilāñ, ba-qatl, qatl-e-man).
- **Scan tab.** Fārsī input gets its Roman and Devanagari from these functions instead of the Urdu letter map.
- **Held-out score.** `benchmark_fa.js translit.word`: a word list learned without six poets gets 83.5% of their words
  right, against 22.8% for the letter map. The floor is set.
- **Roman repair** in `scripts/scan_sufinama.js`.
  - Sufinama's Roman is changed only where its own Urdu and Devanagari agree against it: a dropped particle, or a word
    that the Devanagari and the word list (built from the other ghazals, seen 3 or more times, 80%+ of the time) spell the
    same way.
  - The new spelling must resemble the old, and the line must scan at least as well in its meter.
  - 27 repairs, listed in `data/sufinama_repairs.json`; repaired lines are marked `rf` in the shipped data.

## Round 4 (2026-10-08): the Persian engine, mustazād, Arabic

- **ScanFa, the Persian engine.** `scripts/build_app.py` assembles a second copy of the engine from the unchanged
  `src/js/01-engine.js`, with `data/fa_scan.json` spliced in (`scripts/build_fa_scan.js`, `scripts/lib_fa_scan.js`). It is
  exposed as `window.ScanFa`; the Urdu engine and its benchmark are untouched. It adds:
  - **433 Persian readings**, add-only. A word gets a reading taken from Sufinama's Roman only when none of the engine's
    own readings match. Re-ranking the engine's readings was tried first and made things worse (held-out own-meter fit
    69.5 → 66.6%), because the engine's flexible readings are what meter needs.
  - **10 Persian-only meters** from Ganjoor (300 or more verses; id `F<Ganjoor id>`). The rubāʿī meter is left to R1–R12.
- **Where ScanFa is used.**
  - The Scan tab in Fārsī mode. A Persian-only meter is now a real fit, labelled "Persian meter (Ganjoor #N)", where
    before it was only a note.
  - Reader and Look-up lines tagged `lang: fa`, via `scanCorpusLine` / `engineOf`.
  - `scripts/scan_sufinama.js` and `tests/benchmark_fa.js`.
- **Persian prosody.** `faProsodyText` joins *ast* to a consonant-final word (*dīgarast*).
- **Mustazād.** `lib_scan.mustazadFit`: a line that does not scan is split before a 2–6 word tail; the head must fit a
  meter and the tail must be that meter's first plus last foot. 76 lines in 17 ghazals; 5 ghazals that had no meter now
  settle on #8.
- **Ghazal-level rules for Persian kalaam.**
  - The rubāʿī meters vote as one family.
  - On equal coverage an Urdu meter beats a Persian-only one: F55, F31 and F25 are #11, #9 and #19 plus one final long,
    which is where overlong endings blur them.
- **Every ghazal has a meter** (1,435 of 1,435). Rumi's *khushk tāre* is settled by hand: #11, blocked only by the
  line-final overlong *pōst*.
- **Gold.** 52 judged, 52 right. Jami 633 has an override: Ganjoor's F31 counts the overlong line endings as two
  syllables.
- **Roman repair is stricter.** A repaired line must fit the meter (cost ≤ 5) and no worse than before. 21 repairs were
  applied; 6 that could not be checked are listed in `data/sufinama_repairs_review.json` for a person, not applied.
- **Arabic formulae** (`FA_ARABIC`): 23 phrases (alā yā ayyuha-s-sāqī, yā rasūlallāh, anal-haq …), matched whole
  before word lookup.
- **Word-building.** Added ئے after a vowel and the participle -a (*karda*). Held-out transliteration is now 83.8%.
- **Benchmarks.**
  - Core: own-meter fit at cost ≤ 2 70.8 → 74.8%; any meter at cost ≤ 2 76.0 → 79.7%.
  - All Persian: own-meter fit at cost ≤ 2 67.9 → 70.9%.
  - Floors raised.

**Still open:**
- The engine does not drop a line-final *-st* cluster after a long vowel (Persian overlong). That needs a deliberate
  engine rule.
- Mustazād lines in the reader still scan their whole line, not head plus tail.

## Round 5 (2026-10-08/09): resilience, more kalaam, Persian prosody rules

- **Corpus.** The crawler also reads the Persian-kalaam pages of 16 poets (`POET_PAGES`) and the Persian Sufi Poetry
  sections of Rumi and Hafiz (`POET_SECTIONS`, paged under every sort order). 1,836 ghazals in all, every one metered.
  Lines whose "Urdu" page Sufinama serves in Devanagari are dropped at import (34 Rumi pieces had no Urdu text at all).
  Mir's Persian is its own collection (`mir_farsi`), apart from Pritchett's Mir.
- **Guards.** The crawler stops if a collection or poet page shrinks; `build_poets.py` refuses to change a shipped meter
  without `--accept-meter-changes`; the page has a size budget (`tests/size_budget.json`, now 8 MB / 3 MB, to come back
  down when the corpus is trimmed).
- **Learning from Sufinama, more carefully.**
  - A word pair teaches only if its Urdu and Roman consonants agree (`linePairs`): Sufinama sometimes gives a line another
    line's Roman (فرخ had been learned as "har").
  - A doubled Roman letter is a tashdīd on one-to-one word pairs (*farruḳh* → فرّخ).
  - When the poets' Roman splits on a word, every reading with ≥ 30% share is kept (dropping the word lost برائے, وادی …).
- **Persian verbs.** `scripts/lib_fa_verbs.js`: about 2,000 forms (prefix be-/na-/ma- + present or past stem + ending) for
  ~60 classical verbs, in the word list (Roman and Devanagari) and as readings; a verb's reading costs 0 even where the
  engine has it only at a cost (رود *ravad* "goes", not *rūd* "river").
- **Persian prosody** (Persian lines only; the Urdu engine and Ghalib/Mir are unchanged). Sources: Mahdavi Mazdeh 2019,
  Shams-i Qays via the hamza-elision notes, persianlanguageonline's ʿarūz series.
  - *ke*, *be* and *o / va* short or long; آن reads like آں; sukūn dropped; a zer after a ZWNJ joins its letter.
  - Overlong long vowel + two consonants is long + short mid-line too (*dūst*, *navāḳht*), not only at the line end.
  - Liaison (grafting) at no cost (`faLiaisonVariants`, `faScanFits`): the Urdu engine grafts at 1.2, Persian grafts
    freely (*ke ʿish-qā-sān*, *da-rān*). Contractions too: *ke az* → *kaz*, *ke īn* → *kīn*, *murda ast* → *murdast*.
  - Contraction of a foot (`contractionRows`): a *muftaʿilun* or *faʿilātun* foot sung as three longs (not the last foot),
    as extra rows under the meter's own id.
  - Guessed iẓāfat for text with no Roman (`faScanFits(…, { guessIzafat })`): one or two, at a small cost each, never on a
    particle, the last word, or before و.
- **Tests.** `tests/persian_helpers.js` (75 checks) has golden couplets checked against Ganjoor: Hafiz 3 and 56, Khayyam,
  Saadi, Rumi 46, Saadi's *dūst dāram*. `tests/data/ganjoor_testset.json` is now 240 well-known ghazals (those Sufinama
  lists as sung, then the most recited on Ganjoor), with Ganjoor's vowel marks; Arabic ghazals are left out.
- **Results** (`tests/benchmark_fa.js`):

  | | before round 5 | now |
  |---|---|---|
  | core own-meter fit ≤ 2 | 74.8% | 76.7% |
  | all Persian own-meter fit ≤ 2 | 70.9% | 72.2% |
  | Ganjoor ghazal meter | 97.5% | 98.3% |
  | Ganjoor lines fit (with Ganjoor's marks) | 39.6% (no marks) | 65.8% |
  | Ganjoor lines fit (marks stripped) | — | 63.0% |

  Fran's Ghalib/Mir benchmark is identical throughout.
- **Looked at and left:** Gemini's research notes (Mazdeh, Iranica, VaznYab, dictionary). Their rules are in; their
  "missing meters" were already F-meters; the VaznYab corpus has wrong expected meters (Hafiz's *alā yā ayyuha-s-sāqī*
  is *hazaj*, not #5), so it is not a test set. The chaiandconversation dictionary uses modern Tehrani Roman.

- **Fixes for the worst ghazals** (2026-10-09): mustazād lines scanned as meter + tail everywhere a line is scanned
  (`faMustazadScan`, `faMustazadGhazal`; the reader marks the tail), sung refrains left out of a line's scan when that is what
  makes it fit (`faRefrainVariants`; shown as a note), and two more Ganjoor meters (F29 hazaj makfūf maḥẕūf, F108 muftaʿilun
  faʿ ×4). Ghazals with under half their lines fitting: 38 → 30. Four shipped meters changed, each now as Ganjoor or a hand
  scan (rumi 8, 186, 205 → Ganjoor's; rumi 82 → 25); five that contraction would have moved wrongly are pinned in
  `MANUAL_METERS`.
- **Benchmark split.** `npm test` runs `tests/benchmark_fa.js --quick` (core set, gold, transliteration, Ganjoor meters;
  ~1.5 min). The full run, with all.* and the Ganjoor line check, is `npm run bench:fa` (~14 min): run it before changing the
  Persian engine or its data.
- **Floors re-recorded where the set changed** (not regressions): gold.meter 100 → 98.67 (judged on 225 ghazals, was 52;
  misses: Rumi's *tabīb-e dard* and two Hafiz Persian Sufi Poetry pieces) and translit.word 83.81 → 83.73 (28.7k held-out
  words, was 7.5k).

**Still open:**
- Three gold misses: ship Ganjoor's meter for sure matches (the engine's own pick still scored)?
- The Scan tab does not yet use the guessed iẓāfat. Refrains like Rumi's *bayā bayā* (a whole couplet per line) still miss.

## Round 6 (2026-10-09): Iranian spelling, Steingass, Sufinama against Ganjoor

- **Iranian spelling** (`faIranianSpelling` in `faScanText`, Persian text only). The worst Ganjoor ghazals failed on
  spelling conventions, not on missing words: Saadi 22 scanned 1/10 lines, Saadi 73 0/10. Five rules, measured one by one
  on the 2,400 Ganjoor lines:
  - *ast* written onto a word with a ZWNJ contracts (مشکل‌ست *mush-ki-last*, سوخته‌ست *sūḳh-tast*): +35 lines, none lost;
  - final -وی after a consonant is ū + y (روی *rūy*, موی, هایاهوی), except the verbs *ravī / shavī* and the -avī
    adjectives: +91 lines (the 11 it first broke were all *ravī / shavī*, now excluded);
  - آ inside a word opens a compound's second word (دلآویز *di-lā-vez*, by liaison): +36;
  - a preverb before an alif-initial verb stem (برافشانیم *ba-raf-shā-nīm*, دراندازیم): small.
  Saadi 22 → 9/10, Saadi 73 → 6/10, Hafiz 233 → 6/10.
- **Steingass** (1892, public domain; Theodore Beers's scrape of the DSAL edition, MIT): `scripts/import_steingass.py` →
  `data/fa_steingass.tsv` (50k single-word headwords with classical Roman). `scripts/lib_fa_steingass.js` adds, add-only like
  the verb forms, the reading of each headword the engine lacks (3.2k words; 46k already agree). Small but consistent gains.
  The PersianG2P/Tihu dictionary was looked at and left: modern Tehrani pronunciation, ~30% coverage of the test words.
- **ScanFa lexicon packed** in `build_app.py`: words with the same readings share one `lex()` call, readings written as
  `lx;ssx@2.6`. The page went from 8.04 MB (over budget with Steingass) to 7.41 MB.
- **Sufinama against Ganjoor** (`scripts/compare_sufinama_ganjoor.py`, review file `data/sufinama_ganjoor_diff.json`):
  of 3,530 Sufinama lines, 1,110 identical to Ganjoor's, 995 differ only in spelling, 7 have a letter typo (ہدیں / بدین,
  its Roman *badīñ* right), 706 have a different word, 712 have no Ganjoor match. Measured: Sufinama's typos never change
  the meter, and putting Ganjoor's words in place of Sufinama's makes lines scan worse (382 → 339 of 482): Sufinama
  carries the sung text with a Roman that matches it, Ganjoor often a different reading. So it stays a review list; nothing is
  replaced automatically.

  | | before round 6 | now |
  |---|---|---|
  | Ganjoor lines fit (with marks) | 65.4% | 73.0% |
  | Ganjoor lines fit (marks stripped) | 62.7% | 70.7% |
  | Ganjoor ghazal meter | 98.3% | 99.6% |
  | all Persian lines at cost 0 | 43.0% | 46.7% |
  | all Persian own-meter fit ≤ 2 | 72.95% | 73.4% |

**Still open:** Hafiz 374 and Rumi 636 (2/10): words the engine reads as one long vowel too many, the voweled و of
*buvad*; the Scan tab's iẓāfat guess; refrain-per-couplet lines; the three gold misses.

## Round 7 (2026-10-09): grammar iẓāfat, and what the failing lines had in common

- **Tagging the failing lines** (Ganjoor, plain text) found more spelling the engine misread, now in `faIranianSpelling` /
  `faProsodyText` / `faLiaisonVariants`:
  - punctuation was read as a letter (دل، as two syllables): dropped first;
  - -ای after ā is the iẓāfat -ye (سودای *saudā-ye*, برای), written ائے; کاین is *kīn*; توی is *tu-yī*;
  - و after a consonant takes it, free (*afshānīm-o* → *af-shā-nī-mo*, *dil-o jān*; the engine's own join costs 1.2);
  - a line-final long ā / ī + one consonant is one long syllable (*andāzīm*), but not ی after ا / و, which is the consonant
    *y* (*bar-ā-yad*, *ḥikā-yat*, *gū-yad*), nor after و (*shavad*).
  Hafiz 374 (*biyā tā gul bar-afshānīm*), 2/10 lines, now fits.
- **Grammar iẓāfat** (`faIzafatSlots`), replacing the blind single guess: an iẓāfat only where Persian grammar allows one
  (the archived Jahanshiri grammar, "Genitive case" and "Noun phrase"; UT Austin Persian Online Resources, "Ezafe"): never
  on a preposition, conjunction, particle, demonstrative, *har / hīch / chand*, pronoun, the copula, a verb, or the last word;
  never before و, را, a preposition, the copula or a verb. Verbs are the 1,944 forms of `scripts/lib_fa_verbs.js`
  (`data/fa_scan.json` `verbs`, injected as `FA_VERBS`) and any word after می. Up to three per line, 0.3 each. Measured
  before building it: blind single guess 72.1% own fit with 4.1% false fits on a wrong meter; grammar, up to three, 74.8%
  with 2.8%.
- `faScanSpelling` is the spelling half of `faScanText` (no line-end prosody), for word lists: Steingass and the verb forms
  were being trimmed as if each word ended a line.

  | | start of round 6 | now |
  |---|---|---|
  | Ganjoor lines fit (with marks) | 65.4% | 80.7% |
  | Ganjoor lines fit (marks stripped, as pasted) | 62.7% | 80.2% |
  | Ganjoor ghazal meter | 98.3% | 99.6% |

  Sufinama's own lines (Roman-guided) and the gold meters are unchanged by round 7.
