#!/usr/bin/env bash
# Build the app and run every test. Used locally (npm test) and in CI.
set -euo pipefail
cd "$(dirname "$0")/.."
echo "── build";                 uv run python scripts/build_app.py
echo "── runtime + sandbox";     uv run python test_runtime.py
echo "── corpus scan";           node tests/corpus_scan.js
echo "── chip transliteration";  node tests/chip_translit_consistency.js
echo "── DOM smoke (jsdom)";     node tests/dom_smoke.js
