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

---

## 2. Regression Test Coverage

- Added **Test 40** in `tests/transcribe_logic.js`: Verifies standard hamza resolution and candidate alternatives for `gaye`, `aaye`, `naye`, `koyi`.
- Added **Test 41** in `tests/transcribe_logic.js`: Verifies that `gada` in Persian context defaults to the *beggar / poor* definition in Steingass and Platts.
- Verified size budget (`tests/size_budget.js`): Raw size is strictly $\le$ 8,000,000 bytes; gzip size is $\le$ 3,000,000 bytes.
