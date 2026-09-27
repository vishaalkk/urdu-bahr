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
  { t: 'iẓāfat after ū', d: 'Same pattern as ā and ī: one extra flexible syllable, written with an added ی.', ex: [['کو ← کوئے', 'kū → kū-e', '=', '= x', 'kū-e']] },
  { t: 'iẓāfat, short Arabic word', d: 'A two-consonant Arabic word may double its last consonant (tashdīd) before the iẓāfat. Safest to scan both syllables as flexible.', ex: [['فن ← فنِ / فنّ', 'fan → fan-e / fann-e', '=', 'x x', 'fa-ne / fan-ne']] },
  { t: 'o, "and"', d: 'After a consonant it joins it, like iẓāfat.', ex: [['دین و دل', 'dīn o dil', '= - =', '= x =', 'dī-no dil']] },
  { t: 'al, "the"', d: 'Read the word before as if it merely ended in an extra ل.', ex: [['عالم الغیب', 'ʿālam ul-ġhaib', '= - = = -', '= - = = -', 'ʿā-la-mul ġhai-b']] }
];

/* Build a PB-compatible "line" from a raw pattern string ('=', '-', 'x' tokens)
   and the .blk nodes already rendered for it, so every ▶ in this file goes
   through the shared pbToggle controller (round 2 G1) instead of calling
   play() directly. */
function rawPbLine(raw, resolve, host) {
  const toks = sylls(Scan.parseRaw(raw)).map(t => resolve ? resolve(t) : t);
  return { e: { syl: toks.map(t => ({ resolved: t })) }, nodes: host ? [...host.querySelectorAll('.blk')] : null, groups: null };
}

function renderConstr() {
  const host = $('constr');
  if (!host) return;
  host.innerHTML = CONSTR.map((c, ci) => `
    <div class="card constr-card">
      <h3 class="constr-title">${c.t}</h3>
      <p class="constr-desc dim small">${c.d}</p>
      ${c.ex.map((e, ei) => `
        <div class="constr-ex">
          <div class="urdu constr-urdu ur-always">${e[0]}</div>
          <div class="ro dim small constr-ro">${e[1]} → ${e[4]}</div>
          <div class="row constr-row">
            <span class="play sm" role="button" tabindex="0" data-label="Play example" aria-label="Play example" onclick="cPlay(${ci},${ei},this)">▶︎</span>
            <div class="strip">${strip(Scan.parseRaw(e[2]))}</div>
            <span class="L mono constr-arrow">→</span>
            <div class="strip">${strip(Scan.parseRaw(e[3]))}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `).join('');
}

function cPlay(ci, ei, btn) {
  const e = CONSTR[ci].ex[ei];
  const strips = btn.parentNode.querySelectorAll('.strip');
  const lineA = rawPbLine(e[2], t => t === 'x' ? 'l' : t, strips[0]);
  const lineB = rawPbLine(e[3], t => t === 'x' ? 's' : t, strips[1]);
  pbToggle('constr:' + ci + ':' + ei, btn, () => [lineA, lineB]);
}
window.cPlay = cPlay;

/* Rules about how a single word divides into syllables (Handbook ch. 1.4,
   1.3) — no before/after transform, just the word and its reading. */
const SPECIAL_SYLL = [
  { t: 'Three-consonant Arabic/Persian words', d: 'A word made of three consonants and no vowel letters usually splits two-then-one, not one-then-two.', ex: [['ملک', 'mulk', '= -'], ['وقت', 'vaqt', '= -'], ['ورق', 'varaq', '- =']], note: 'A minority — varaq, qasam, magar, ġhazal, nikal — split one-then-two instead.' },
  { t: 'و and ی: vowel or consonant', d: 'و and ی count as vowels only as the second letter of a syllable; starting a syllable, or standing alone, they are ordinary consonants v/y.', ex: [['کو', 'ko', '='], ['وقت', 'vaqt', '= -'], ['یار', 'yār', '= -']] }
];

function renderSpecialSyll() {
  const host = $('specialSyll');
  if (!host) return;
  host.innerHTML = SPECIAL_SYLL.map((c, ci) => `
    <div class="card constr-card">
      <h3 class="constr-title">${c.t}</h3>
      <p class="constr-desc dim small">${c.d}</p>
      <div class="row constr-row special-syll-row">
        ${c.ex.map((e, ei) => `
          <div class="constr-ex special-syll-ex">
            <div class="urdu constr-urdu ur-always">${e[0]}</div>
            <div class="ro dim small constr-ro">${e[1]}</div>
            <div class="row">
              <span class="play sm" role="button" tabindex="0" data-label="Play example" aria-label="Play example" onclick="ssPlay(${ci},${ei},this)">▶︎</span>
              <div class="strip">${strip(Scan.parseRaw(e[2]))}</div>
            </div>
          </div>
        `).join('')}
      </div>
      ${c.note ? `<p class="constr-desc dim small">${c.note}</p>` : ''}
    </div>
  `).join('');
}

function ssPlay(ci, ei, btn) {
  const e = SPECIAL_SYLL[ci].ex[ei];
  const strip_ = btn.parentNode.querySelector('.strip');
  const line = rawPbLine(e[2], null, strip_);
  pbToggle('special:' + ci + ':' + ei, btn, () => [line]);
}
window.ssPlay = ssPlay;

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
if (typeof renderSpecialSyll === 'function') renderSpecialSyll();
if (typeof renderHandbook === 'function') renderHandbook();
if (typeof renderExercises === 'function') renderExercises();
if (typeof renderDictionary === 'function') renderDictionary();
if (typeof renderBibliography === 'function') renderBibliography();

// Kick off routing
if (typeof handleRoute === 'function') {
  handleRoute();
}
