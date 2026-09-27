/* ================= THEME ================= */
const THEME_NAMES = ['light', 'dark', 'contrast'];
function setTheme(name) {
  // Migrate sepia -> light, indigo -> dark
  if (name === 'sepia') name = 'light';
  if (name === 'indigo') name = 'dark';
  if (name && THEME_NAMES.indexOf(name) === -1) name = '';
  try {
    if (name) {
      document.documentElement.setAttribute('data-theme', name);
      localStorage.setItem('theme', name);
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.removeItem('theme');
    }
  } catch(e) {}
  const sel = document.getElementById('themeSelect');
  if (sel) sel.value = name || '';
}

function initTheme() {
  let saved = '';
  try { saved = localStorage.getItem('theme') || ''; } catch(e) {}
  // Migration
  if (saved === 'sepia') saved = 'light';
  if (saved === 'indigo') saved = 'dark';
  if (saved && THEME_NAMES.indexOf(saved) !== -1) {
    document.documentElement.setAttribute('data-theme', saved);
  } else {
    saved = '';
  }
  const sel = document.getElementById('themeSelect');
  if (sel) sel.value = saved;
}
