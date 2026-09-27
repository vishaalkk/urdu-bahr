/* ================= THEME ================= */
/* Two themes: the colour-blind-safe palette (default, no attribute — blue long /
   orange short / purple flexible) and the opt-in 'classic' gold/teal/rose look.
   Older stored values ('cvd', dark, contrast, sepia, indigo, system) fall back to
   the default; a stored 'cvd' — the old name for what is now the default — is
   migrated by clearing it rather than by setting 'classic'. */
const THEME_NAMES = ['classic'];
function applyTheme(name) {
  if (name === 'cvd') name = ''; // pre-round-3 stored value: 'cvd' is now the default
  if (THEME_NAMES.indexOf(name) === -1) name = '';
  const root = document.documentElement;
  if (root) { if (name) root.setAttribute('data-theme', name); else root.removeAttribute('data-theme'); }
  const tog = document.getElementById && document.getElementById('classicToggle');
  if (tog) tog.checked = (name === 'classic');
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
  const applied = applyTheme(saved);
  if (applied !== saved) {
    try {
      if (applied) localStorage.setItem('theme', applied);
      else localStorage.removeItem('theme');
    } catch(e) {}
  }
}
