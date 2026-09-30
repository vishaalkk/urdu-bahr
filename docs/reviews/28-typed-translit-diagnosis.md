# 28 - Why typed Urdu -> Roman is only 74-77% words / 31-34% lines

Sample: 1,152 lines (every 6th Ghalib/Mir ghazal), typed without marks, compared with Pritchett's Roman.
- exact line match 32.7%
- differs ONLY by hyphen/space compound style (`be dimāġhī` vs `be-dimāġhī`) 11.8%
- differs ONLY by a missing/extra izafat `-e` or `-o-` marker 29.9%
- real reading differences 25.5% (homographs: maiñ/meñ, tū/to, par/pur, sher/shīr, kiyā/kyā; a few genuine bugs like `frmāoīñ`, `naz̤z̤ārah`)
So ~42% of "misses" are spelling convention or an unwritten izafat, not a wrong reading.

Experiment (reverted): in urduLineToAscii, replace "first spelling the corpus showed" (e.first) with the learned scan model P(iz) > tau (tau 0.2-0.7 swept; 0.5 best). Typed word/line accuracy vs old:
ghalib 74.7/35.2 -> 73.3/33.3; mir 75.7/32.8 -> 77.5/40.3; handbook 91.1/63.3 -> 89.1/53.1; iqbal 74.8/28.9 -> 74.4/25.4.
Mixed, and Ghalib would fall below its gated typed.romanWord floor (74.03).

Why not landed: WORD_ASCII_MAP is built from these same lines, so the old rule effectively memorizes the answer key (handbook 91%). The benchmark cannot judge a principled rule against a memorized one. A fair test needs a leave-one-corpus-out word map (build the map without the corpus being scored).

Next steps: (1) add that leave-one-out evaluation to the benchmark (report only); (2) then re-try the P(iz) policy, plus rule for compound hyphenation (`be-`, `-kash`, `-o-`); (3) homographs need context, not a lexicon. See engine-py/PROGRESS.md (translit) and translit-lab for the OOV predictor.

## Update: fair (leave-one-corpus-out) evaluation, now in tests/benchmark.js (report only)
Typed Roman, word map WITH vs WITHOUT the scored corpus (ghalib/mir sampled every 5th ghazal):
| corpus | word | line |
|---|---|---|
| handbook | 91.1 -> 82.3 | 63.3 -> 25.2 |
| ghalib | 74.7 -> 67.4 | 35.2 -> 16.9 |
| mir | 75.7 -> 69.3 | 32.9 -> 16.4 |
| iqbal | 74.8 -> 65.4 | 28.9 -> 9.4 |
So the gated typed.* floors overstate real-world quality by roughly 2x on exact lines.

Learned izafat policy (HYP_TAU=0.5, opt-in in src/js/01-engine.js, default null = old rule) under the fair setup, word / line:
handbook 82.3->84.1 / 25.2->34.1; ghalib 67.4->67.5 / 16.9->18.6; mir 69.3->70.3 / 16.4->20.1; iqbal 65.4->65.4 / 9.4->7.4 (105 lines, ~2 lines).
Handbook is a true held-out for the izafat model (it trained on ghalib+mir). Net positive.
To turn on: set HYP_TAU=0.5 as default AND re-baseline the gated typed.* floors (they would fall on the memorized setup: ghalib 74.0 -> ~73.3). Better: make the gated typed scores come from the leave-one-out setup so the gate stops rewarding memorization.
