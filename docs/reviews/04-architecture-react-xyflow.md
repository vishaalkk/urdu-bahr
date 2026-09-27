# React / xyflow evaluation (agent: arch-eval, 2026-09-26)

## Recommendation
Do not rebuild on React + xyflow. xyflow is a node-graph editor; only the meter-family/paired-meter taxonomy is a real graph, and it is small and static — hand-rolled SVG gets ~90% of the value at ~0 KB vs ~128 KB gzip for React+xyflow. The real problem is the build: `scripts/build_app.py` applies 17 `html.replace()` patches onto `original_base.html` with only 7 asserts, so most patches silently no-op if the base drifts (counts verified by lead).

## Phased plan
1. **De-risk the build (1–2 days):** extract CSS/JS/data from `original_base.html` into source files; bundle with Vite + `vite-plugin-singlefile` (still one standalone HTML). Retire string patching.
2. **Modularize tab by tab (3–5 days):** vanilla ES modules, Vite dev server.
3. **Meter-family graph (3–4 days, optional):** plain SVG (+ d3-hierarchy for layout, ~5 KB).
4. **Other interactions without a framework:** rhythm piano-roll/timeline (extend `.blk.lit`), click/drag-to-toggle syllable weights, collapsible Ch.7 "code-breaking" elimination tree.
5. **If components are wanted later:** Preact (~4 KB) over React (~45 KB).

## Evidence
- Proof build (Vite 8.3.1, React 19.3.0, @xyflow/react 12.12.0, vite-plugin-singlefile 2.3.3): one `dist/index.html`, 416 KB raw / 127,756 B gzip, no workarounds. Location: session scratchpad `arch/proof/` (temporary).
- GitHub Pages serves multi-file static sites; single-file is a self-imposed constraint.

## GitHub Pages deploy
checkout → setup-node → `npm ci` → `npm run build` → `actions/upload-pages-artifact@v3` (dist/) → `actions/deploy-pages@v4`; permissions `pages: write, id-token: write`; on push to `main`.
