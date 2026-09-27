# Research: ukamathAppliedML/bahr (taqti)

## 1. What it is, license, activity
`taqti`: a Python engine (stdlib-only) for Urdu-Hindi meter *identification* and scansion, implementing Pritchett & Khaliq's *Urdu Meter: A Practical Handbook*, with a Streamlit web app on top. Directly on-topic — same source material we use. **License: MIT** (`Copyright (c) 2026 taqti contributors`), permissive, no attribution-in-UI requirement beyond keeping the notice. **Active**: last commit 2026-08-19 (about 6 weeks before this research), single maintainer (Uday Kamath). Star count not checked (no GitHub API access in this session; low likely given the niche and single-maintainer scale — treat as unverified, not stated).

## 2. Data comparison
- **Meters**: their `taqti/meters.py` has all 37 handbook meters (6.1) + Mir's Hindi meter (6.2) + rubā'ī family (6.3) + 12 *extra* rare meters (#41–#52, sourced from Aditya "Naaqid" Pant's survey) = 52 total constructs. Our `data/meters.json` has exactly the 37 standard + `rubai` + `hindi_info` — **we lack their #41–#52 rare-meter block**. Worth a look if we ever want "extended/rare meters" as a stretch category.
- **Corpus/exercises**: their `tests/corpus/` has 24 files — 10 Ghalib + 11 Mir ghazals (one Ghalib has a Devanagari duplicate), ~370 misras, 19 distinct meters, used purely as a scansion test gate (ground truth from Pritchett's *Desertful of Roses* / *Garden of Kashmir*). Our `data/exercises_verified.json` has 24 entries but spans **12 poets** (Ghalib, Mir, Dagh, Zauq, Vali Dakhani, Atish, Mus'hafi, Jur'at, Momin, Akbar Ilahabadi, Khvajah Mir Dard, Iqbal) — broader poet coverage than theirs (Ghalib/Mir only). Their corpus is a *test fixture*, not a learner-facing exercise set — different purpose, not directly reusable as "more ghazals" for our exercises even though it overlaps on Ghalib/Mir.
- **Dictionary/glossary**: they have none — no dictionary, no glossary. Our `data/glossary.json` (387 terms) is unmatched territory for them.
- **No audio, no rhyme/qafia or radif handling, no Devanagari↔Urdu conversion tables** beyond input-mode transliteration variants for scansion. Their "Roadmap" section explicitly lists radif/qafiya extraction as *not yet built*.

## 3. Scansion algorithm — technique comparison
Their engine is meaningfully more rigorous than a typical scanner and worth studying, though not a drop-in replacement:
- **Word-list-driven overrides** (`taqti/rules.py`): explicit `FLEX_WORDS`, `ALWAYS_SHORT`, `ALWAYS_LONG`, and a `SPECIAL`/`SPECIAL_ALT` dict for lexicalized exceptions (`kyā`, `tumheñ`, `qatrah` with two legal divisions, etc.) — a maintainable pattern for exception-heavy prosody rules, cleanly separated from the general syllabifier.
- **Multi-parse line enumeration** (`taqti/parse.py::misra_parses`): generates *all* legal syllabifications of a misra (word-grafting 3.1, izafat 3.2, o-construction 3.3, coda fusion) rather than picking one greedy parse, then lets `identify.py` search across all parses × all meter patterns for a fit. This is a real technique difference from a single deterministic pass — it correctly models Pritchett's "several legal readings, meter narrows it down" framing (ch. 7 "Scanning as Code-Breaking").
- **Poem-level identification, not line-level**: `identify()` intersects fits across every misra in a ghazal, since a single line often fits multiple meters but a whole ghazal rarely does. If our scanner currently judges one line at a time, this is the most concretely useful idea to borrow — it would reduce false-positive meter matches.
- Their syllabifier is comparable in spirit to a typical CVC-weight scanner; I did not do a line-by-line diff against `scanWord`/`scanLine` in `scripts/build_app.py`/`index.html` (would need to pull those specific line ranges and compare rule-by-rule — flagging as unverified rather than asserting equivalence or superiority beyond the two points above).

## 4. License compatibility
MIT is compatible with reuse in our standalone HTML app hosted on GitHub Pages — we can port logic or constants into our JS as long as we retain an MIT notice/attribution for the borrowed portions. No copyleft concerns.

## 5. Recommendation (ranked)
1. **Worth adopting**: the poem-level (all-lines-must-fit) identification strategy — port the *idea*, not the code (different language), into wherever our app currently does per-line meter matching in `scripts/build_app.py`.
2. **Worth adopting**: their exception-word-list pattern (`FLEX_WORDS`/`SPECIAL`/`SPECIAL_ALT`) as a design reference if our `normalize`/`scanWord` special-casing is ad hoc — cross-check specific words like `kyā`, `tumheñ`, `koī`, `aur` against our current handling; adding a few of these edge cases would improve correctness on lines we currently mis-scan.
3. **Consider**: their 12 rare meters (#41–#52) as an optional catalog extension, low priority — Naaqid's enumeration, not core-Pritchett, cite source if imported.
4. **Skip**: their corpus data (different purpose — CI fixture, not curated learner exercises); their glossary/dictionary (none exists); audio (none); rhyme/qafia (none — on their own roadmap, unbuilt).
