/* ================= LEARN / INITIALIZATION ================= */
const WORDS = [ /* each verified with the handbook's rules */
  ['کب', 'kab', ['l']],
  ['کبھی', 'kabhī', ['s', 'x']],
  ['آدمی', 'ādmī', ['l', 's', 'x']],
  ['اور', 'aur (normal)', ['l', 's']],
  ['ملک', 'mulk', ['l', 's']],
  ['وقت', 'vaqt', ['l', 's']],
  ['ورق', 'varaq', ['s', 'l']],
  ['مگر', 'magar', ['s', 'l']],
  ['غزل', 'ġhazal', ['s', 'l']],
  ['ہزاروں', 'hazāroñ', ['s', 'l', 'x']],
  ['آہستہ', 'āhistah', ['l', 'l', 'x']],
  ['حیات', 'ḥayāt', ['s', 'l', 's']],
  ['کتاب', 'kitāb', ['s', 'l', 's']],
  ['خواب', 'ḳhvāb (و silent)', ['l', 's']],
  ['مدّت', 'muddat', ['l', 'l']],
  ['دیوار', 'dīvār', ['l', 'l', 's']]
];

let wdI = -1, wdIn = [], wdS = 0, wdT = 0;

function wdNext() {
  wdI = (wdI + 1) % WORDS.length;
  wdIn = [];
  if ($('wdWord')) $('wdWord').textContent = WORDS[wdI][0];
  if ($('wdRo')) $('wdRo').textContent = WORDS[wdI][1];
  if ($('wdStrip')) $('wdStrip').innerHTML = '';
  if ($('wdFb')) {
    $('wdFb').className = 'fb';
    $('wdFb').innerHTML = '';
  }
  ['wdBtnL', 'wdBtnS', 'wdBtnX', 'wdBtnBack', 'wdBtnCheck'].forEach(id => {
    const el = $(id);
    if (el) {
      el.disabled = false;
      el.classList.remove('ans-ok', 'ans-no');
    }
  });
}

function wdAdd(v) {
  if (!$('wdStrip') || wdI < 0) return;
  if (wdIn.length < WORDS[wdI][2].length) {
    wdIn.push(v);
    $('wdStrip').innerHTML = strip(wdIn);
  }
}

function wdBack() {
  if (!$('wdStrip')) return;
  wdIn.pop();
  $('wdStrip').innerHTML = strip(wdIn);
}

function wdCheck() {
  if (!$('wdFb') || !$('wdStrip') || wdI < 0) return;
  const a = WORDS[wdI][2];
  const ok = (wdIn.length === a.length && wdIn.every((v, i) => v === a[i]));
  wdT++;
  if (ok) wdS++;
  if ($('wdScore')) $('wdScore').textContent = wdS + ' / ' + wdT;

  const patStr = a.map(x => x === 'l' ? '=' : x === 's' ? '–' : 'x').join(' ');
  const reason = ok ? patStr : `Answer is ${patStr}`;
  const fb = $('wdFb');
  fb.className = 'fb ' + (ok ? 'ok' : 'no');
  fb.innerHTML = `<div class="fb-text">${ok ? '✓ Right' : '✗ Not quite'} — ${reason}</div><button class="btn gold sm fb-next-btn" id="wdNextBtn" onclick="wdNext()">Next ▸</button>`;

  $('wdStrip').innerHTML = strip(a);
  if (typeof play === 'function') {
    play(a.map(x => x === 'x' ? 'l' : x), {
      onStep: (typeof litter === 'function') ? litter([...$('wdStrip').querySelectorAll('.blk')]) : undefined
    });
  }

  ['wdBtnL', 'wdBtnS', 'wdBtnX', 'wdBtnBack', 'wdBtnCheck'].forEach(id => {
    const el = $(id);
    if (el) el.disabled = true;
  });
  const chk = $('wdBtnCheck');
  if (chk) chk.classList.add(ok ? 'ans-ok' : 'ans-no');

  const nextBtn = $('wdNextBtn');
  if (nextBtn) nextBtn.focus();
}

const FLEX = [
  ['جو', 'x'], ['تو', 'x'], ['سے', 'x'], ['کو', 'x'], ['کا', 'x'], ['ہے', 'x'],
  ['میں', 'x'], ['بھی', 'x'], ['نے', 'x'], ['ہوں', 'x'], ['یہ', 'x'], ['وہ', 'x'],
  ['دو', 'x'], ['تھا', 'x'], ['تا', 'l'], ['گو', 'l'], ['یا', 'l'], ['نہ', 's'],
  ['کہ', 's'], ['بہ', 's']
];

let fxI = 0, fxS = 0, fxT = 0;

function fxNext() {
  fxI = Math.floor(Math.random() * FLEX.length);
  if ($('fxWord')) $('fxWord').textContent = FLEX[fxI][0];
  if ($('fxFb')) {
    $('fxFb').className = 'fb';
    $('fxFb').innerHTML = '';
  }
  ['fxBtnX', 'fxBtnL', 'fxBtnS'].forEach(id => {
    const el = $(id);
    if (el) {
      el.disabled = false;
      el.classList.remove('ans-ok', 'ans-no');
    }
  });
}

function fxAns(v) {
  if (!$('fxFb')) return;
  const a = FLEX[fxI][1];
  const ok = (v === a);
  fxT++;
  if (ok) fxS++;
  if ($('fxScore')) $('fxScore').textContent = fxS + ' / ' + fxT;

  const L = { x: 'flexible', l: 'always long (=)', s: 'always short (–)' };
  let reason = L[a];
  if (FLEX[fxI][0] === 'تا') {
    reason += ' (compare تھا, which is flexible — ھ changes the word, not the count)';
  }

  const fb = $('fxFb');
  fb.className = 'fb ' + (ok ? 'ok' : 'no');
  fb.innerHTML = `<div class="fb-text">${ok ? '✓ Right' : '✗ Not quite'} — ${reason}</div><button class="btn gold sm fb-next-btn" id="fxNextBtn" onclick="fxNext()">Next ▸</button>`;

  const btnMap = { x: 'fxBtnX', l: 'fxBtnL', s: 'fxBtnS' };
  ['fxBtnX', 'fxBtnL', 'fxBtnS'].forEach(id => {
    const el = $(id);
    if (el) el.disabled = true;
  });
  const chosenBtn = $(btnMap[v]);
  if (chosenBtn) {
    chosenBtn.classList.add(ok ? 'ans-ok' : 'ans-no');
  }

  const nextBtn = $('fxNextBtn');
  if (nextBtn) nextBtn.focus();
}

const CONSTR = [
  { t: 'Word-grafting', d: 'First word ends in a consonant, next begins with ا or آ: say them as one word. Optional — it happens less than half the time.', ex: [['آخر اس', 'ākhir is', '= = =', '= - =', 'ākhiris']] },
  { t: 'Grafting, three words', d: 'Ghalib runs three words together.', ex: [['کافر ان اصنام', 'kāfir in aṣnām', '= = = = = -', '= - - = = -', 'kāfirinaṣnām']] },
  { t: 'iẓāfat on a consonant', d: 'The ِ joins the last consonant into one flexible syllable.', ex: [['ملک ← ملکِ', 'mulk → mulk-e', '= -', '= x', 'mul-ke'], ['لب ← لبِ', 'lab → lab-e', '=', '- x', 'la-be']] },
  { t: 'iẓāfat after ā', d: 'An extra syllable appears; the ā stays long.', ex: [['وفا ← وفائے', 'vafā → vafā-e', '- =', '- = x', 'va-fā-e']] },
  { t: 'iẓāfat after ī', d: 'Usually the ī turns into a consonant.', ex: [['شوخی ← شوخیِ', 'shoḳhī → shoḳhī-e', '= x', '= - x', 'sho-khi-ye']] },
  { t: 'o, "and"', d: 'After a consonant it joins it, like iẓāfat.', ex: [['دین و دل', 'dīn o dil', '= - =', '= x =', 'dī-no dil']] },
  { t: 'al, "the"', d: 'Read the word before as if it merely ended in an extra ل.', ex: [['عالم الغیب', 'ʿālam ul-ġhaib', '= - = = -', '= - = = -', 'ʿā-la-mul ġhai-b']] }
];

function renderConstr() {
  const host = $('constr');
  if (!host) return;
  host.innerHTML = CONSTR.map((c, ci) => `
    <div class="card constr-card">
      <h3 class="constr-title">${c.t}</h3>
      <p class="constr-desc dim small">${c.d}</p>
      ${c.ex.map((e, ei) => `
        <div class="constr-ex">
          <div class="urdu constr-urdu">${e[0]}</div>
          <div class="ro dim small constr-ro">${e[1]} → ${e[4]}</div>
          <div class="row constr-row">
            <button class="icon-btn play sm" onclick="cPlay(${ci},${ei},this)" aria-label="Play example" title="Play">▶︎</button>
            <div class="strip">${strip(Scan.parseRaw(e[2]))}</div>
            <span class="L mono constr-arrow">→</span>
            <div class="strip">${strip(Scan.parseRaw(e[3]))}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `).join('');
}

function cPlay(ci, ei, el) {
  const e = CONSTR[ci].ex[ei];
  const a = sylls(Scan.parseRaw(e[2])).map(t => t === 'x' ? 'l' : t);
  const b = sylls(Scan.parseRaw(e[3])).map(t => t === 'x' ? 's' : t);
  const strips = el.parentNode.querySelectorAll('.strip');
  const na = [...strips[0].querySelectorAll('.blk')], nb = [...strips[1].querySelectorAll('.blk')];
  const bpm = (typeof settings !== 'undefined' && settings.bpm) ? settings.bpm : 120;
  const beat = 60 / bpm;
  const d = play(a, { onStep: (typeof litter === 'function') ? litter(na) : undefined });
  setTimeout(() => play(b, { onStep: (typeof litter === 'function') ? litter(nb) : undefined }), (d + beat * 1.5) * 1000);
}

/* App Initialization */
if ($('footPulse')) $('footPulse').checked = settings.footPulse !== false;
if (typeof initTheme === 'function') initTheme();
if (typeof toggleAsciiScript === 'function') {
  const showAscii = store.get('showAscii', false);
  const chk = $('btnScriptAscii');
  if (chk) chk.checked = showAscii;
  toggleAsciiScript(showAscii);
}

// Initialize components if functions are present
if (typeof renderEarFams === 'function') renderEarFams();
if (typeof renderEar === 'function') renderEar();
if (typeof iomNew === 'function') iomNew();
if (typeof wtNew === 'function') wtNew();
if (typeof renderWeak === 'function') renderWeak();
if (typeof indexFamsVerses === 'function') indexFamsVerses();
if (typeof renderFams === 'function') renderFams();
if (typeof wdNext === 'function') wdNext();
if (typeof fxNext === 'function') fxNext();
if (typeof renderConstr === 'function') renderConstr();
if (typeof renderHandbook === 'function') renderHandbook();
if (typeof renderExercises === 'function') renderExercises();
if (typeof renderDictionary === 'function') renderDictionary();
if (typeof renderBibliography === 'function') renderBibliography();

// Kick off routing
if (typeof handleRoute === 'function') {
  handleRoute();
}
