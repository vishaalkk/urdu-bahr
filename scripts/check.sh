#!/usr/bin/env bash
# Build the app and run every test. Used locally (npm test) and in CI.
set -euo pipefail
cd "$(dirname "$0")/.."
echo "── build";                 uv run python scripts/build_app.py
echo "── runtime + sandbox";     uv run python test_runtime.py
echo "── corpus scan";           node tests/corpus_scan.js
echo "── packed data (poets, Ghalib, Mir ≡ source)"; node tests/packed_data.js
echo "── reader benchmark headers"; node tests/reader_benchmark_headers.js
echo "── Fran benchmark";        node tests/benchmark.js      # Ghalib + Mir: no score may fall below tests/benchmark_baseline.json
echo "── chip transliteration";  node tests/chip_translit_consistency.js
echo "── practice logic";        node tests/practice_logic.js
echo "── learn examples";        node tests/learn_examples.js
echo "── learn alignment";       node tests/learn_alignment.js
echo "── learn render";          node tests/learn_render.js 2>&1 | grep -v "^parser"; test "${PIPESTATUS[0]}" -eq 0
echo "── handbook examples";     node tests/handbook_examples.js | tail -3
echo "── handbook resilience";   node tests/handbook_resilience.js | tail -1
echo "── DOM smoke (jsdom)";     node tests/dom_smoke.js
echo "── Circles combinations & benchmark"; node tests/circles_combinations_test.js
echo "── Match Bahr drill";      node tests/match_drill.js
echo "── engine part 6";         node tests/engine_part6.js | tail -1
echo "── near fit contract";     node tests/near_fit.js
echo "── learned hypotheses";    node tests/hypotheses.js
