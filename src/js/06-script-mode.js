/* ================= SCRIPT MODE ================= */
let currentScript = 'ur';
window.currentScript = currentScript;
/* data-script on <html> lets CSS keep Roman/Devanagari out of Nastaliq + RTL styling (see verse.css) */
function markScript(mode) { try { document.documentElement.setAttribute('data-script', mode); } catch (e) {} }
markScript(currentScript);
function setScriptMode(mode) {
  window.currentScript = currentScript = mode;
  markScript(mode);
  ['btnScriptUrdu', 'btnScriptDev', 'btnScriptRo', 'btnScriptAsciiHeader'].forEach(id => {
    const el = document.getElementById(id);
    if(el) {
      el.classList.toggle('on', (id === 'btnScriptUrdu' && mode === 'ur') ||
                                (id === 'btnScriptDev' && mode === 'hi') ||
                                (id === 'btnScriptRo' && mode === 'ro') ||
                                (id === 'btnScriptAsciiHeader' && mode === 'ascii'));
    }
  });

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
  if(typeof runStudioScan === 'function') runStudioScan();
  if(typeof runScan === 'function' && $('scanIn') && $('scanIn').value) runScan();
}
