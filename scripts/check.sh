#!/usr/bin/env bash
# Build the app and run every test. Used locally (npm test) and in CI.
# After the build, the slow suites run side by side: the two benchmarks, the jsdom smoke test split into
# shards (DOM_SHARD, one page load each, ~0.5 GB apiece), and the quick suites in one serial job. Each job
# logs to its own file; the logs print in a fixed order, and the run fails if any job failed.
set -euo pipefail
cd "$(dirname "$0")/.."
echo "── build";                 uv run python scripts/build_app.py
echo "── size budget";          node tests/size_budget.js

CORES=$(getconf _NPROCESSORS_ONLN 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 2)
SHARDS=$(( CORES > 3 ? CORES - 2 : 1 )); (( SHARDS > 6 )) && SHARDS=6
LOGS=$(mktemp -d); trap 'rm -rf "$LOGS"' EXIT
quiet() { grep -v "^parser" || true; }      # drop the engine's parser chatter, keep the producer's exit code

quick_suites() {
  echo "── runtime + sandbox";     uv run python test_runtime.py
  echo "── corpus scan";           node tests/corpus_scan.js
  echo "── packed data (poets, Ghalib, Mir ≡ source)"; node tests/packed_data.js
  echo "── reader benchmark headers"; node tests/reader_benchmark_headers.js
  echo "── Persian helpers";       node tests/persian_helpers.js 2>&1 | quiet
  echo "── chip transliteration";  node tests/chip_translit_consistency.js
  echo "── practice logic";        node tests/practice_logic.js
  echo "── transcribe logic";      node tests/transcribe_logic.js
  echo "── transcribe golden (the exceptions' spec)"; node tests/transcribe_golden.js
  echo "── dictionary lookup (held-out words; floors tests/dictionary_baseline.json)"; node tests/benchmark_dictionary.js
  echo "── dictionary word of inflected forms (gold; floors tests/lemma_baseline.json)"; node tests/benchmark_lemma.js
  echo "── same spelling, other reading (Platts pairs; floors tests/readings_baseline.json)"; node tests/benchmark_readings.js
  echo "── line language (held-out lines; floors tests/lang_baseline.json)"; node tests/benchmark_lang.js
  echo "── real casual typing (Dakshina test split; floors tests/dakshina_baseline.json)"; node tests/benchmark_dakshina.js
  echo "── Modern Roman style vs real typing (Dakshina test sentences; floors tests/modern_ro_baseline.json)"; node tests/benchmark_modern_ro.js
  echo "── dictionary cache (IndexedDB keyed by the build's fingerprint)"; node tests/dictionary_cache.js
  echo "── generated data is current (roman_fallback, fa_scan, lang_words)"; node tests/derived_data.js
  echo "── learn examples";        node tests/learn_examples.js
  echo "── learn alignment";       node tests/learn_alignment.js
  echo "── learn render";          node tests/learn_render.js 2>&1 | quiet
  echo "── handbook examples";     node tests/handbook_examples.js | tail -3
  echo "── handbook resilience";   node tests/handbook_resilience.js | tail -1
  echo "── Circles combinations & benchmark"; node tests/circles_combinations_test.js
  echo "── Match Bahr drill";      node tests/match_drill.js
  echo "── engine part 6";         node tests/engine_part6.js | tail -1
  echo "── near fit contract";     node tests/near_fit.js
  echo "── learned hypotheses";    node tests/hypotheses.js
}

titles=(); pids=()
job() {   # job <title> <command…>: run in the background under errexit + pipefail
  local i=${#titles[@]}; titles+=("$1"); shift
  ( set -euo pipefail; "$@" ) >"$LOGS/$i.log" 2>&1 &
  pids+=($!)
}
job "Fran benchmark (Ghalib + Mir: no score may fall below tests/benchmark_baseline.json)" node tests/benchmark.js
job "Typed Roman, held-out poets (no score may fall below tests/typed_roman_baseline.json)" node tests/typed_roman_heldout.js
job "Transcribe, held-out poets (no score may fall below tests/transcribe_baseline.json)" node tests/benchmark_transcribe.js
job "Persian benchmark (quick; the full run is \`npm run bench:fa\`)" bash -c 'set -o pipefail; node tests/benchmark_fa.js --quick 2>&1 | { grep -v "^parser" || true; }'
for ((s = 0; s < SHARDS; s++)); do job "DOM smoke (jsdom), shard $((s + 1))/$SHARDS" env DOM_SHARD="$s/$SHARDS" node tests/dom_smoke.js; done
job "quick suites" quick_suites

failed=()
for i in "${!pids[@]}"; do
  if wait "${pids[$i]}"; then status=ok; else status=FAILED; failed+=("${titles[$i]}"); fi
  echo "── ${titles[$i]}  [$status]"; cat "$LOGS/$i.log"
done
if (( ${#failed[@]} )); then
  echo; echo "FAILED:"; printf '  %s\n' "${failed[@]}"; exit 1
fi
