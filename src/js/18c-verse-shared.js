/* Shared verse workspace helpers (Scan, Transliterator): viDetect, viBadgeHTML, viGrow, viSamplesHTML, viLangDir, viFirstLine, viScrollTo */

var VI_MARKS = /[āīūñḍṭṛḥṣẓżḳġʿʾṇḷ]/i;
var VI_KIND_LABEL = { ro: 'casual Roman', rod: 'Roman with diacritics', ur: 'Urdu script', fa: 'Fārsī script', hi: 'Devanagari', mixed: 'mixed scripts' };

/* What a text is written in, by its lines: { kind, lang, label, lines } (null for no text). kind: ro / rod / ur / fa / hi /
   mixed; lang: the language the code already works out for the text (detectScanLang: 'ur' or 'fa'). */
function viDetect(text) {
  var lines = String(text || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
  if (!lines.length) return null;
  var arScript = (typeof AR_SCRIPT !== 'undefined') ? AR_SCRIPT : /[؀-ۿݐ-ݿ]/;
  var n = { ar: 0, hi: 0, ro: 0, marks: 0 };
  lines.forEach(function (l) {
    if (/[ऀ-ॿ]/.test(l)) n.hi++;
    else if (arScript.test(l)) n.ar++;
    else { n.ro++; if (VI_MARKS.test(l)) n.marks++; }
  });
  var kinds = ['ar', 'hi', 'ro'].filter(function (k) { return n[k]; });
  var lang = (typeof detectScanLang === 'function') ? detectScanLang(lines.join(' ')) : 'ur';
  var kind = kinds.length > 1 ? 'mixed' : n.ar ? (lang === 'fa' ? 'fa' : 'ur') : n.hi ? 'hi' : (n.marks * 2 >= n.ro ? 'rod' : 'ro');
  return { kind: kind, lang: lang, label: VI_KIND_LABEL[kind], lines: lines.length };
}

/* ---- the badge: "Read as: casual Roman ▾" ---- */
/* o: { id, valId, text (what is shown), options: [[key, label]], current (key), onPick (name of a global function) } */
function viBadgeHTML(o) {
  var items = o.options.map(function (op) {
    var on = op[0] === o.current;
    return '<button type="button" role="menuitemradio" aria-checked="' + on + '" class="vi-menu-item' + (on ? ' on' : '') + '" onclick="viMenuClose();' + o.onPick + '(\'' + op[0] + '\')">' + escapeHtml(op[1]) + '</button>';
  }).join('');
  return '<span class="vi-badge" id="' + o.id + '"><span class="vi-badge-lbl">Read as</span>' +
    '<button type="button" class="btn sm vi-badge-btn" aria-haspopup="menu" aria-expanded="false" onclick="viMenuToggle(this)"><span class="vi-badge-val"' + (o.valId ? ' id="' + o.valId + '"' : '') + '>' + escapeHtml(o.text) + '</span><span class="vi-caret" aria-hidden="true">▾</span></button>' +
    '<span class="vi-menu" role="menu" aria-label="Read the text as">' + items + '</span></span>';
}
function viMenuClose() {
  if (typeof document === 'undefined' || typeof document.querySelectorAll !== 'function') return;
  document.querySelectorAll('.vi-badge.open').forEach(function (b) {
    b.classList.remove('open');
    var btn = b.querySelector('.vi-badge-btn'); if (btn) btn.setAttribute('aria-expanded', 'false');
  });
}
function viMenuToggle(btn) {
  var w = btn && btn.closest ? btn.closest('.vi-badge') : null; if (!w) return;
  var was = w.classList.contains('open');
  viMenuClose();
  if (was) return;
  w.classList.add('open'); btn.setAttribute('aria-expanded', 'true');
  var cur = w.querySelector('.vi-menu-item.on') || w.querySelector('.vi-menu-item'); if (cur && cur.focus) cur.focus();
}
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
  document.addEventListener('click', function (e) { if (!(e.target && e.target.closest && e.target.closest('.vi-badge'))) viMenuClose(); });
  document.addEventListener('keydown', function (e) {
    if (!e.target || !e.target.closest || !e.target.closest('.vi-badge.open')) return;
    var w = e.target.closest('.vi-badge'), items = [].slice.call(w.querySelectorAll('.vi-menu-item')), i = items.indexOf(e.target);
    if (e.key === 'Escape') { e.preventDefault(); viMenuClose(); var b = w.querySelector('.vi-badge-btn'); if (b && b.focus) b.focus(); }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); var d = e.key === 'ArrowDown' ? 1 : -1; var nx = items[(i + d + items.length) % items.length]; if (nx) nx.focus(); }
  });
}

/* ---- a textarea that grows with its text ---- */
function viGrow(ta) {
  if (!ta || !ta.style || typeof ta.style.setProperty !== 'function') return;
  ta.style.setProperty('--vi-h', 'auto');
  var extra = (ta.offsetHeight || 0) - (ta.clientHeight || 0);
  var h = (ta.scrollHeight || 0) + (extra > 0 ? extra : 0);
  if (h) ta.style.setProperty('--vi-h', h + 'px');
}

/* ---- sample cards ---- */
/* list: [{ poet, first: [{ text, script }], cta }] (script ur / fa / hi / ro: how the first line is shown); handler: a global function taking the index */
function viSamplesHTML(list, handler) {
  return list.map(function (s, i) {
    var lines = (s.first || []).filter(function (f) { return f && f.text; }).map(function (f) {
      var a = viLangDir(f.script);
      return '<span class="vi-sample-line vi-sample-' + f.script + '" lang="' + a.lang + '" dir="' + a.dir + '">' + escapeHtml(f.text) + '</span>';
    }).join('');
    return '<button type="button" class="vi-sample" onclick="' + handler + '(' + i + ')">' + lines +
      '<span class="vi-sample-foot"><span class="vi-sample-poet">' + escapeHtml(s.poet) + '</span><span class="vi-sample-go">' + escapeHtml(s.cta || 'Scan') + ' →</span></span></button>';
  }).join('');
}

/* ---- per-line text and script attributes ---- */
function viLangDir(script) {
  return script === 'ur' ? { lang: 'ur', dir: 'rtl' } : script === 'fa' ? { lang: 'fa', dir: 'rtl' } : script === 'hi' ? { lang: 'hi', dir: 'ltr' } : { lang: 'und-Latn', dir: 'ltr' };
}
/* a line's text in each script, from a Scan line object ({ur, ro, hi}) or a Transliterator line ({out: {ur, ro, hi, fa}}) */
function viFirstLine(text) { return String(text || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean)[0] || ''; }

function viScrollTo(el) {
  if (!el || typeof el.scrollIntoView !== 'function') return;
  var calm = false;
  try { calm = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  try { el.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' }); } catch (e2) { el.scrollIntoView(); }
}
