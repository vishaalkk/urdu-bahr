# Transcribe & Dictionary Engine Session Log (2026-10-13)

This document records all questions, investigations, architectural decisions, and code fixes made during pair-programming on the Transcribe module (`#/lab/transcribe`), Dictionary drawer, and transliteration engine.

---

## 1. Summary of Inquiries & Technical Interventions

### Q1: Reading Pill Aesthetics & Origin Badge Chips
- **User Query**: Reading pills were visually heavy; questioned the verbose `(PERSIAN)[FA]` label and whether pill aesthetics matched the rest of the application.
- **Root Cause**: Pills were rendering large font sizes with metric baseline shifts and duplicated full language names.
- **Solution**:
  - Restyled `.tr-reading-pill` into sleek 24px height tags with subtle borders and flat hover/active states (`src/styles/transcribe.css`).
  - Abbreviated language markers into standardized badges: `[ P ]` (Persian), `[ A ]` (Arabic), `[ H ]` (Hindi), `[ S ]` (Sanskrit) (`src/js/24-transcribe.js`).
  - Preserved full name badges (`[Persian]`, `[Arabic]`) in the definition drawer header card (`.tr-dict-head`).

---

### Q2: *ćain* (Comfort) vs *China* (*chīn*)
- **User Query**: Sanskrit/Hindi word *ćain* (comfort, चैन / چین) typed casually as `chain` or `chaen` was showing *China* (*chīn*) instead of *comfort*.
- **Root Cause**: The casual key `chain` had collided with `chīn` (*China*) in frequency sorting.
- **Solution**: Mapped `chain` and `chaen` in fallback / casual lookup to prioritize the indigenous word *ćain* (comfort) with full cross-lingual definitions.

---

### Q3: Hindi Verbal Participles (*kahat*, *chalat*)
- **User Query**: What should casual Roman and transliteration show for Hindi words like *kahat*?
- **Root Cause**: Words ending in `-at` were being intercepted by the Persian clitic classifier, interpreting *kahat* as pseudo-Persian *kāhat* (*کاہت*).
- **Solution**:
  - Guarded `-at` clitic decomposition to prevent hijacking Hindi participles (`src/js/05-translit-helpers.js`).
  - Added dictionary fallback in `DICT_STORE.lookup` so verbal participles (*kahat*, *chalat*) resolve to their infinitives (*kahnā* کہنا, *chalnā* چلنا).

---

### Q4: Nastaliq Alignment & Visibility in Dictionary Drawer
- **User Query**: Why wasn't the Nastaliq word shown in the dictionary definition, and how to align it properly?
- **Solution**:
  - Added a prominent 22px Nastaliq headword `<span class="tr-dict-ur" dir="rtl">` directly into `.tr-dict-head` alongside the italic Roman transliteration, dictionary source badge, and page citation.

---

### Q5: Compound Structure & Oblique Noun Navigation (*but-khaane*)
- **User Query**: Explained behavior when clicking *but-khaane*: why duplicate buttons appeared, why *khāne* showed 3 pills instead of 4, and why *khana* wasn't resolving.
- **Explanation Provided**:
  - Layer 1: Compound word as a whole (`but-khāna`).
  - Layer 2: Segment 0 (*but*) and Segment 1 (*khāne*).
  - Layer 3: Reading pills for the active segment.
- **Solution**:
  - Labeled the whole compound tab with the full compound text: `بت خانے (but-ḳhāne)`.
  - Added oblique noun normalization in `DICT_STORE.lookup`:
    - Urdu `-e` (`-ے`) falls back to `-ah` (`-ہ`) and `-a` (`-ا`) (e.g. *khāne* / خانے $\to$ *khāna* / خانہ).
    - Plural `-on` (`-وں`) falls back to singular.
  - Synchronized selection states so clicking pieces updates the drawer predictably without losing context.

---

### Q6: Elimination of Nastaliq Redundancy in Reading Pills
- **User Query**: Do we need to display Nastaliq inside the `READINGS:` pills if it is prominently displayed in the definition card?
- **Design Decision**: Confirmed to remove Nastaliq from individual reading buttons.
- **Rationale**:
  - For heteronyms sharing identical spelling (e.g. *mulk*, *milk*, *malik*, *malak* all spelled ملک), repeating `ملک` in 6 buttons added zero distinguishing value.
  - Eliminated baseline height clipping and descender overflow.
  - Clean separation:
    - **Row 1**: Script spelling choices (`[ خدا khudā ] [ خودہ khūda ]`).
    - **Row 2**: Phonetic reading choices (`[ khudā P ] [ khūda P ]`).
    - **Row 3**: Definition card anchored by the 22px Nastaliq headword.

---

### Q7: Transliteration of *woh* (وہ)
- **User Query**: What is the transliteration of *woh* ("that person / he / she")?
- **Explanation**:
  - **Casual**: `woh`, `voh`, `vo`.
  - **ALA-LC & Frances Pritchett (Classical Scansion)**: **`vuh`** (flexible monosyllable pattern `x`, paired with *yih* for یہ).
  - **Platts (1884)**: Headword **وه** transliterated as **`wah`** (with phonetic note: *colloquially wǒh*).
  - **Devanagari**: **वह** (*vah*, pronounced *voh*) or **वो** (*vo*).

---

### Q8: The Double-Wāw Spelling *ووه* in Platts
- **User Query**: What is the candidate with two wāws (**ووه**)?
- **Explanation**: A 19th-century dialectal/colloquial phonetic spelling recorded on p. 1204 of Platts' 1884 dictionary (*"pron. (dialec. or colloq.) = وه wah or wǒh, q.v."*). Scribes wrote the first *wāw* as consonant /v/ and second *wāw* as vowel /o/. Obsolete in modern Urdu; modern standard exclusively uses **وہ**.

---

### Q9 & Q10: *gaye* and Systematic Hamzah vs Yeh Verb Conjugations
- **User Query**: Why did casual Roman `gaye` produce `گیے` without hamza, and only show hamza when typing `ga'ye`? How to fix all words where *yeh* vs *hamzah* differs?
- **Root Cause**:
  - `gayi` had been aliased to `ga))ii` (**گئی**), but `gaye` was missing from `CASUAL_ALIAS`.
  - It fell back to literal ghazal corpus frequency where 8 historical verses were transcribed as `gaye` $\to$ **گیے**.
  - Typing `ga'ye` forced an apostrophe token through character parsing as an ASCII hamza `))`.
- **Systematic Solution**:
  1. Updated `CASUAL_ALIAS` in `src/js/05-translit-helpers.js`:
     - *jānā*: `gaye: 'ga))e'`, `gayen: 'ga))ii;N'`, `gayein: 'ga))ii;N'`, `gayin: 'ga))ii;N'` $\to$ **گئے**, **گئیں**
     - *ānā*: `aaye: 'aa))e'`, `aae: 'aa))e'`, `aayi: 'aa))ii'`, `aayein: 'aa))e;N'` $\to$ **آئے**, **آئی**, **آئیں**
     - *lānā*: `laaye: 'laa))e'`, `laayi: 'laa))ii'`, `laayein: 'laa))e;N'` $\to$ **لائے**, **لائی**, **لائیں**
     - *pānā*: `paaye: 'paa))e'`, `paayi: 'paa))ii'`, `paayein: 'paa))e;N'` $\to$ **پائے**, **پائی**, **پائیں**
     - *khānā*: `khaaye: 'khaa))e'`, `khaayi: 'khaa))ii'`, `khaayein: 'khaa))e;N'` $\to$ **کھائے**, **کھائی**, **کھائیں**
     - *gānā*: `gaaye: 'gaa))e'`, `gaayi: 'gaa))ii'`, `gaayein: 'gaa))e;N'` $\to$ **گائے**, **گائی**, **گائیں**
     - *honā*: `huye: 'hu))e'`, `huyi: 'hu))ii'`, `huyein: 'hu))ii;N'` $\to$ **ہوئے**, **ہوئی**, **ہوئیں**
     - *ronā*, *dhonā*, *sonā*, *khonā*, *bonā*: `roye`/`royi`, `dhoye`/`dhoyi`, `soye`/`soyi`, `khoye`/`khoyi`, `boye`/`boyi` $\to$ **روئے**, **دھوئے**, **سوئے**, **کھوئے**, **بوئے**
     - Causative/derived verbs: `bataaye`/`bataye`, `dikhaaye`/`dikhaye`, `sunaaye`/`sunaye`, `banaaye`/`banaye`, `lagaaye`/`lagaye`, `bulaaye`, `chalaaye`, `jalaaye`, `milaaye`
     - Adjectives & Nouns: `naye`/`nayi` (**نئے**/**نئی**), `chaaye` (**چائے**), `raaye` (**رائے**), `jaaye` (**جائے**), `koyi` (**کوئی**), `bhaayi` (**بھائی**)
  2. Enhanced `tryUrMorphDecompose` with regular rules for vowel-stem past plural (`-aaye` $\to$ `))e`) and past feminine (`-aayi` $\to$ `))ii`).
  3. Added homophone candidates so users can toggle between standard hamza (**گئے**) and historical/calligraphic yeh (**گیے**) in Row 1 pills.

---

### Q11: *gadā* (Beggar / Poor) Meaning Missing in Dictionary Drawer
- **User Query**: When typing `gada`, the meaning for *poor* or *beggar* (Steingass / Platts) was missing; drawer displayed Hindi *gaddā* (*quilted bedding*).
- **Root Cause**:
  1. **Stale IndexedDB Cache**: Browser cached `urdu_bahr_lexicon_v1`. In the older compilation, Platts' Sanskrit *gadā* (*mace*) had overwritten Persian *gadā* (*beggar*) due to identical `(ur, ro)` tuple collision.
  2. **Diacritic Stripping Bug in `defaultMatch`**: In `trDictSectionHtml`, reading matching ran `replace(/[^a-z]/g, '')`. When matching `cleanSrc = 'gada'` against `gadā`, `ā` was stripped, leaving `'gad'`. Because `'gad' !== 'gada'`, it failed to match and defaulted to Index 0 (*gaddā* cushion).
- **Solution**:
  - Bumped IndexedDB to `urdu_bahr_lexicon_v2` and added auto-purge of `v1` on initialization (`src/js/12-dictionary-module.js`).
  - Implemented Unicode NFD folding `trFoldRo(s)` in `src/js/24-transcribe.js` so `gadā` cleanly folds to `'gada'` for robust matching.
  - Prioritized phonetic matches and Persian origins (`P`), ensuring **`[ gadā P ]`** (Steingass: *Poor, indigent, beggarly; a beggar*) is selected by default as Pill 0.

---

### Q12: Classical Persian *būd* vs *buvad* / *bu'ad*
- **User Query**: Are *bud* and *buad* distinct in Farsi, and why did typing `bu'ad` show no dictionary meaning?
- **Explanation**:
  - Both are forms of **بودن** (*būdan*, to be) and both are spelled **بود** in Persian script:
    - **بود (*būd*)**: Past tense (*was*), 1 long syllable (–).
    - **بوَد (*buvad* / *bavad*, casually *bu'ad*)**: Present subjunctive (*is / shall be / may it be*), 2 syllables (U –).
  - Typing `bu'ad` failed previously because the apostrophe was parsed as a hamza (`بئد`), which is not a valid word.
- **Solution**:
  - Added aliasing in `casualPiece`, `CASUAL_ALIAS`, and `HOMOPHONES`:
    - `bu'ad`, `bu’ad`, `buad`, `buwad` $\to$ **`buvad`** $\to$ script **`بود`**.
  - Dictionary drawer immediately displays Steingass: *He, she, or it was... — buwad, Let him be; it may, might, or will be.*
  - Homophone pills provide single-click switching between `buvad` (2 syllables) and `būd` (1 syllable).

### Q13: Candidate Duplication and Reading Pill Merging for *ham* (ہم vs حام vs حم)
- **User Query**: When typing `ham`, Row 1 showed four candidates with duplicate `[ ہم ham ]`. Row 2 showed multiple `ham (P)` pills where one pill merged 4 unrelated definitions (Hām son of Noah, also/fellow-citizen, shedding tears, father-in-law). Clicking candidates rearranged the numbered meanings confusingly.
- **Root Cause**:
  1. **Unicode Goal Heh vs Arabic Heh Collision**: Standard parser outputs Urdu Goal Heh `\u06C1` (**ہم**), whereas Platts/Steingass headwords use Arabic Heh `\u0647` (**هم**). Strict Unicode equality `c.ur === targetUr` failed, causing candidate deduplication to register both.
  2. **Missing Script in Reading Pill Grouping Key**: In `trDictSectionHtml`, grouping key was `trFoldRo(x.ro) + '|' + (x.origin || '') + '|' + (x.dict || '')`. Because `ḥām`, `ham`, and `ḥam` all fold to `ham`, and Steingass tagged them with `P`, distinct headwords **`حام`** (Noah), **`ہم`** (fellow-citizen), and **`حم`** (father-in-law) shared `'ham|P|Steingass'` and were squashed into definitions (1)-(4) of a single pill.
  3. **Heterograph Pollution in wholeHits**: `trDictSectionHtml` was appending `DICT_STORE.lookup(src)` even when exact script matches (`w.out.ur`) already existed.
  4. **Stale Hit Selection**: `trPick` did not reset `TR.dictHitIdx = null`, keeping previous index selection active across different headword candidate changes.
- **Solution**:
  - Unified script comparisons via `dictFoldUr`, eliminating duplicate candidate buttons in Row 1.
  - Included normalized Urdu script in reading pill grouping key: `normUr + '|' + trFoldRo(x.ro) + '|' + (x.origin || '') + '|' + (x.dict || '')`.
  - Scoped dictionary lookup to only query `src` if `!wholeHits.length`, preventing heterograph pollution.
  - Reset `TR.dictHitIdx = null` upon picking a candidate in `trPick`.

### Q14: Plural Normalization for *rahguzaron* and Compound Discovery for *rah-guzar*
- **User Query**: Typing `rahguzaron` showed no dictionary entry. Changing it to `rah-guzar` also failed to show the compound word definition.
- **Root Cause**:
  1. **Missing `-on` Plural Normalization**: In `DICT_STORE.lookup`, plural fallback only checked Urdu noon ghunna `/وں$/`. Casual Roman `rahguzaron` was transliterated to `رہگزرون` (ending in standard noon `ن`), and Roman plural stripping lacked `/[a-z](?:on|oñ|o;N)$/i`. Thus neither `rahguzaron` nor `رہگزرون` fell back to singular `rahguzar`.
  2. **Compound Decomposition Overwriting Headwords**: For hyphenated compound `rah-guzar`, `trDictSectionHtml` queried `w.out.ur` (`رہ گزر` with space). Because `رہ گزر` did not match `indexUr`, `lookup` fell back to splitting it into `rah` (road) and `gazar` (pass). Because `wholeHits` was now populated with these piece hits, it never called `DICT_STORE.lookup(src)` (which would have found the compound headword `رهگذار` / `rah-guẕār` in Steingass and Platts).
- **Solution**:
  - Expanded plural/oblique normalization in `DICT_STORE.lookup` for `/و[ںن]$/` and `/[a-z](?:on|oñ|o;N)$/i`.
  - Prioritized `DICT_STORE.lookup(src)` for hyphenated compounds before falling back to decomposed space-separated strings.
  - Clicking the whole compound tab (`رہ گزر (rah-guzar)`) displays the full compound definition: *A pass, passage, road... a traveller; a guard*.

### Q15: Homographs and Verb Stem Fallback for *baich* (بیچ to sell vs بیچ middle/center)
- **User Query**: How to write the word `baich` meaning "to sell", when typing `baich` currently shows the noun meaning *middle/center* (`bīch` بیچ)? Also expand handling for other words with this pattern (`mail`/`mel` میل, `sair`/`ser` سیر, `bair`/`ber` بیر, `daikh`/`dekh` دیکھ, `paish`/`pesh` پیش, `bhaid`/`bhed` بھید, `pait`/`pet` پیٹ, `paid`/`per` پیڑ).
- **Root Cause**:
  1. **Urdu Homograph Collisions**:
     - The exact Urdu spelling **بیچ** represents two distinct words:
       - Verb root *bech* (Devanagari: बेच) from infinitive *bećnā* (بیچنا) = "to sell".
       - Noun/preposition *bīch* (Devanagari: बीच) = "middle, midst, center".
     - Platts indexes verbs under their infinitive form (*bećnā* p. 207). Without a verbal stem $\to$ infinitive fallback, querying `بیچ` only ever matched the noun *bīć* (p. 179).
  2. **19th-Century Typography in Platts**:
     - In Platts' 1884 printing, retroflex consonants used older characters (`ٿ` \u067F for `ٹ`, `ڐ` \u0690 for `ڈ`, `ڙ` \u0699 for `ڑ`), and aspirated consonants used Arabic heh `ه` (\u0647) instead of do-chashmī he `ھ` (\u06BE).
     - Because `dictFoldUr` previously left `ھ`, `ٿ`, `ڐ`, `ڙ` unfolded, modern Urdu inputs for aspirated and retroflex verb stems (e.g., `دیکھنا`, `بیٹھنا`) failed exact script match.
  3. **Homophone Candidate Pairing & Script Mirroring**:
     - When typing `baich` or `bech`, users were not offered `[ بیچ bīch ]` (Devanagari: बीच) alongside `[ بیچ bech ]` (Devanagari: बेच).
     - Selecting `bech` vs `bīch` did not dynamically reprioritize dictionary drawer definitions to match the active reading.
- **Solution**:
  1. Added `CASUAL_ALIAS` entries in `src/js/05-translit-helpers.js`:
     - `baich: 'bech'`, `daikh: 'dekh'`, `bhaid: 'bhed'`, `paish: 'pesh'`, `pait: 'pe;t'`, `paid: 'pe;R'`.
  2. Normalized 19th-century typography in `dictFoldUr` (`src/js/12-dictionary-module.js`):
     - Maps `ٿ` $\to$ `ٹ`, `ڐ` $\to$ `ڈ`, `ڙ` $\to$ `ڑ`, and `[هۀۂةھ]` $\to$ `ہ`.
  3. Added verbal stem $\to$ infinitive fallback in `DICT_STORE.lookup` (`src/js/12-dictionary-module.js`):
     - Single-word non-compound queries ending in letters fall back to `word + 'na'` (Roman) and `word + 'نا'` (Urdu), bounded by depth guard `_depth <= 1` to prevent recursion loops.
     - `بیچ` explicitly incorporates `بیچنا` (*bećnā*, to sell) alongside `bīć` (middle).
  4. Added homophone candidate pairs in `HOMOPHONES` (`src/js/24-transcribe.js`):
     - `bech` / `baich` $\leftrightarrow$ `bīch` (Devanagari: बेच vs बीच)
     - `mail` $\leftrightarrow$ `mel` (Devanagari: मैल dirt vs मेल union/meeting)
     - `sair` $\leftrightarrow$ `ser` (Devanagari: सैर walk/stroll vs सेर full/satiated)
     - `bair` $\leftrightarrow$ `ber` (Devanagari: बैر enmity vs बेर jujube/time)
  5. Implemented `roMatchScore` and `w.out.ro` lookup in `trDictSectionHtml` (`src/js/24-transcribe.js`):
     - Folds Platts' acute `ć` $\to$ `ch`.
     - Prioritizes the dictionary entry matching the active reading: selecting `[ بیچ bech ]` brings *bećnā* (to sell) to the front; selecting `[ بیچ bīch ]` brings *bīć* (middle) to the front.

---

## 2. Regression Test Coverage

- Added **Test 40** in `tests/transcribe_logic.js`: Verifies standard hamza resolution and candidate alternatives for `gaye`, `aaye`, `naye`, `koyi`.
- Added **Test 41** in `tests/transcribe_logic.js`: Verifies that `gada` in Persian context defaults to the *beggar / poor* definition in Steingass and Platts.
- Added **Test 42** in `tests/transcribe_logic.js`: Verifies candidate deduplication for `ham` (no duplicate `ہم`), and verifies strict separation of `ہم` from heterographs `حام` (son of Noah) and `حم`.
- Added **Test 43** in `tests/transcribe_logic.js`: Verifies `-on` plural noun fallback for `rahguzaron` and compound headword resolution for `rah-guzar` (`rah-guẕār`).
- Added **Test 44** in `tests/transcribe_logic.js`: Verifies homograph candidate pairs and definitions for `baich` / `bech` (*bećnā* to sell vs *bīć* middle), `mail` / `mel`, and `sair` / `ser`.
- Verified size budget (`tests/size_budget.js`): Raw size is strictly $\le$ 8,000,000 bytes (7,999,994 bytes); gzip size is $\le$ 3,000,000 bytes.
