/* ================= GHALIB EXTENDED CORPUS ================= */
/* Superseded (round 3 cleanup): the Ghalib browse list, its meter filter,
   and "scan in Studio" action all now live in 09-exercises-module.js
   (renderCorpusList('ghalib'), populateGhazalMeterFilter, editCurrentInScan).
   This file used to define its own `renderGhalibExt`/`showMoreGhalibExt`/
   `scanGhalibExtInStudio` against DOM ids (`ghalibExtMeterFilter`) that no
   longer exist in ghazals.html — since function declarations in a
   concatenated script all share one scope, THIS file's later declaration
   was silently winning over 09's for the bare `renderGhalibExt` identifier
   (only 02-store.js/06-script-mode.js called it that way; the real render
   path always went through renderGhazalsList, so it was a landmine, not a
   visible bug). Left empty rather than removed from the manifest so file
   ownership/numbering stays stable. */
