# Engine phase handoff (updated 2026-09-30 ~06:55)

NOTHING IS PUSHED (user wants to test locally first). A pre-push hook (.git/hooks/pre-push) blocks all pushes; delete it to allow.
`main` is green: `npm test` exit 0. Floors (tests/benchmark_baseline.json): Ghalib/Mir raised after each gain. Held-out report (not gated): handbook 96.46 / iqbal 73.87 / urdupoetry 100 top-1.

## Local testing checklist (browser; nothing below was checked in a real browser)
Run: `npm run build && python3 -m http.server 8000`, open http://localhost:8000/
- Meter > Drill: Match Bahr (anchor + 3-4 candidates, each Listen), Which bahr foot pauses, Next stops audio, script toggle re-renders, Source/Score badges.
- Meter > Lookup: All / Rubai / Hindi segmented control + count. Ghazals on mobile: switching collection closes the reader.
- #/lab/practice: 1/2 syllable tapper (no nav link yet; add one from Meter or Home if kept).
- Scan: type a broken line -> "Nearest:" meter with clash chips (near-fit). Type unmarked Urdu (no zer) -> learned iz/o hypotheses; `دل ناداں` gives 9 first, 14 second (known limit).
- Legend: `x` reads "shortenable long".

## What landed since the bug-fix commit (all local)
Scan inspector/audio/guide/corpora/benchmark; Match Bahr; Practice Editor; engine Part 6 Roman fixes; lexicon entries (kaarobaar, kah, takalluf, tajalli); held-out benchmark report; near-fit contract (status exact|licensed|near|none + nearest meters with clash positions); learned hypotheses (docs/reviews/27: unwritten izafat + short conjunctive o, stripped-text top-1 Ghalib 55.6->82, Mir 81.9->90, Iqbal 53->65).

## Landed since the 21:10 update (all local, `npm test` green at each step)
- Practice reveal: names a famous verse ("Same rhythm as..."), technical name secondary, explains flexible (purple) syllables, flags lines that fit two families.
- Drills + Practice prefer lines that fit ONE meter family (fitAmbiguity, gap 1.5); fall back if none.
- Drill CSS: real strip containers are .dr-strip/.dr-pat/.dr-ans-strip (NOT .strip); Urdu strips run RTL, Roman/Devanagari LTR; placeholder dots hidden; lit bars get a wash only (no lift/border growth).
- Playback highlight (`litter` in 15-audio.js) now holds for the syllable's real duration (play() passes dur ms to onStep). Fallback 240ms.
- Held-out report skips speaker labels: Iqbal 78.10 top-1 (105 verse lines). jamiateaqvam is 0/6 (engine meter 8 at cost 0, label 5): needs a human look.
- scripts/serve_nocache.py: local server with Cache-Control no-store. Run: `npm run build && python3 scripts/serve_nocache.py 8000`.
- Housekeeping: studio.css was committed by mistake and untracked again (file stays on disk, unused).

## Lessons (cost us quota)
- Verify CSS selectors match real DOM before claiming a fix (the .strip wrapper did not exist).
- Agents: require a commit after every step; check `git status` fully (not a path-filtered diff) before judging an agent stuck.
- Browser cache misled testing: use the no-cache server.

## Parked worktrees (all committed, all agents stopped)
| Stream | Worktree (.claude/worktrees/) | Resume file | State |
|---|---|---|---|
| Engines 2-4 (Python) | agent-ab0b23cbe5f5ab87a | engine-py/PROGRESS.md | crash fix + benchmark harness; NEXT urdu_syl.py. Low priority: runtime is JS, ASCII numbers not comparable |
| Engine 1 (translit graph) | agent-a60350de9ee9ef48b | engine-py/translit/PROGRESS.md | skeleton/design only |
| Aruuz oracle | agent-a9f8c548cd5839744 | engine-py/oracle/PROGRESS.md | DONE; report docs/reviews/20 (squash old logs/ commit before merging) |

## Untracked on purpose
- studio_mockup.html, src/styles/studio.css: Gemini Studio, rejected (docs/reviews/19).
- (docs/reviews/24 DRY audit was never run.)

## Candidate next steps
1. Better izafat feature (noun/adjective class or bigram) so classic compounds like dil-e nadan get p>0.2 without hurting written-text floors.
2. Add a nav link to #/lab/practice and test Practice in the browser; then Practice-first Studio redesign (docs/reviews/19 wireframes).
3. Iqbal is the weak spot (73.9): inspect misses (`node tests/benchmark.js --misses=20`) for a general cause.
4. Run the DRY audit (single source of truth for meters/rules) before more engine copies appear.
5. Licensing: permissive (Apache-2.0 code, CC BY data); check Pritchett corpus permissions before promoting repo as copyable.
