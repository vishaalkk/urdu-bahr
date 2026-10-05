/* ================= SCRIPT MODE ================= */
/* remembered across visits (try/catch: storage can be blocked) */
function loadScriptMode() {
  try { const m = JSON.parse(localStorage.getItem('dumda:script')); if (['ur', 'hi', 'ro', 'ascii'].indexOf(m) >= 0) return m; } catch (e) {}
  return 'ur';
}
let currentScript = loadScriptMode();
window.currentScript = currentScript;
/* data-script on <html> lets CSS keep Roman/Devanagari out of Nastaliq + RTL styling (see verse.css) */
function markScript(mode) { try { document.documentElement.setAttribute('data-script', mode); } catch (e) {} }
markScript(currentScript);
function syncScriptButtons(mode) {
  ['btnScriptUrdu', 'btnScriptDev', 'btnScriptRo', 'btnScriptAsciiHeader'].forEach(id => {
    const el = document.getElementById(id);
    if(el) {
      el.classList.toggle('on', (id === 'btnScriptUrdu' && mode === 'ur') ||
                                (id === 'btnScriptDev' && mode === 'hi') ||
                                (id === 'btnScriptRo' && mode === 'ro') ||
                                (id === 'btnScriptAsciiHeader' && mode === 'ascii'));
    }
  });
}
syncScriptButtons(currentScript);
function setScriptMode(mode) {
  window.currentScript = currentScript = mode;
  markScript(mode);
  try { localStorage.setItem('dumda:script', JSON.stringify(mode)); } catch (e) {}
  syncScriptButtons(mode);
  if(typeof drOnScriptChange === 'function') drOnScriptChange();

  if(typeof renderEarFams === 'function') renderEarFams();
  if(typeof renderHome === 'function' && typeof location !== 'undefined' && /^#\/home/.test(location.hash || '')) renderHome();
  if(typeof renderEar === 'function') renderEar();
  if(typeof renderWeak === 'function') renderWeak();
  if(typeof renderHandbook === 'function') renderHandbook();
  if(typeof renderExercises === 'function') renderExercises();
  if(typeof renderGhalibExt === 'function') renderGhalibExt();
  if(typeof renderMirExt === 'function') renderMirExt();
  if(typeof renderDictionary === 'function') renderDictionary();
  if(typeof renderFams === 'function') renderFams();
  if(typeof renderFeetCatalog === 'function') renderFeetCatalog();
  if(typeof renderCircles === 'function') renderCircles();
  if(typeof renderLearnExamples === 'function') renderLearnExamples();
  if(typeof runStudioScan === 'function') runStudioScan();
  if(typeof runScan === 'function' && $('scanIn') && $('scanIn').value) runScan();
}
