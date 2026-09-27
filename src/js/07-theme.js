/* ================= THEME ================= */
/* Two themes: Light (default, no attribute) and colour-blind friendly ('cvd').
   Older stored values (dark, contrast, sepia, indigo, system) fall back to Light. */
const THEME_NAMES = ['cvd'];
function applyTheme(name) {
  if (THEME_NAMES.indexOf(name) === -1) name = '';
  const root = document.documentElement;
  if (root) { if (name) root.setAttribute('data-theme', name); else root.removeAttribute('data-theme'); }
  const tog = document.getElementById && document.getElementById('cvdToggle');
  if (tog) tog.checked = (name === 'cvd');
  return name;
}
function setTheme(name) {
  name = applyTheme(name);
  try {
    if (name) localStorage.setItem('theme', name);
    else localStorage.removeItem('theme');
  } catch(e) {}
}

function initTheme() {
  let saved = '';
  try { saved = localStorage.getItem('theme') || ''; } catch(e) {}
  if (applyTheme(saved) !== saved) {
    try { localStorage.removeItem('theme'); } catch(e) {}
  }
}
