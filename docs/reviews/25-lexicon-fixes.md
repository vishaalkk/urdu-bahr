# 25 - Lexicon word-option fixes (from oracle report, doc 20)

Landed (per-word `lex()` entries in src/js/01-engine.js; new readings carry extra cost so they only win when the meter needs them):
- کاروبار: `kār-o-bār` `= - = -` (short conjunctive و), cost 0.5. Targets the Faiz misra that had no fit.
- کہہ: single long syllable, cost 0.3.
- تکلف, تجلی: `- = =`, cost 0.3.
Gate after merge: Ghalib top-1 90.38 (floor 89.64), Mir 93.73 (floor 93.70), `npm test` exit 0.

Tried and REVERTED: چمن-type tie-break (prefer `- =` over `= -` for bare 3-consonant words, +0.05 cost). Mir top-1 fell to 93.25 (< 93.70 floor). Same result as the earlier engine agent's CC bias. Needs the learned/context-conditioned cost approach in engine-py/PROGRESS.md, not a flat bias.

Not done: generic "medial و may be short conjunctive o" hypothesis (per-word entries only handle known words); zer-less `دل ناداں` fallback ranking (meter 9 beats 14).
