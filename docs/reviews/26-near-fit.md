# 26 - Near-fit contract (never silently no fit)

Done: `Scan.scanLine` now returns `status` (exact|licensed|near|none), `licences`, `near` (<=3 of {meter,clashes,extra,missing,cost,confidence}); near runs diagnose() over all meters only when fits is empty (fitStatus in src/js/01-engine.js). Scan UI no-meter branch (src/js/19-scan.js) shows nearest meter + chips with clash/extra. tests/near_fit.js wired into scripts/check.sh.
Gate: npm test exit 0, BENCHMARK no regressions, held-out unchanged (handbook 96.46/98.67, iqbal 73.87/80.18, urdupoetry 100/100).
Next: none required; optional confidence calibration.
