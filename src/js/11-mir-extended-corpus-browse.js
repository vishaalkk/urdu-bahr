/* ================= MIR EXTENDED CORPUS ================= */
/* Superseded (round 3 cleanup): the Mir browse list, its meter filter, and
   "scan in Studio" action all now live in 09-exercises-module.js
   (renderCorpusList('mir'), populateGhazalMeterFilter, editCurrentInScan).
   See 10-ghalib-extended-corpus-preview-browse.js for why this file's old
   `renderMirExt`/`showMoreMirExt`/`scanMirExtInStudio` — and the other
   Studio-loading helpers below (`loadCoupletInStudio`, `loadExInStudio`,
   `playCoupletRhythm`, `loadExInScan`, `scanLineInEngine`) — were dead:
   nothing in the app calls them by name any more. Left empty rather than
   removed from the manifest so file ownership/numbering stays stable. */
