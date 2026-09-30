/* ================= LEARN / INITIALIZATION ================= */
const WORDS = [ /* each verified with the handbook's rules */
  ['کب', 'kab', ['l'], 'S1.5-weight'],
  ['کبھی', 'kabhī', ['s', 'x'], 'F2.2-final-ii-e-h'],
  ['آدمی', 'ādmī', ['l', 's', 'x'], 'F2.2-final-ii-e-h'],
  ['اور', 'aur (normal)', ['l', 's'], 'F2.1-aur'],
  ['ملک', 'mulk', ['l', 's'], 'S1.4-three-consonant'],
  ['وقت', 'vaqt', ['l', 's'], 'S1.4-three-consonant'],
  ['ورق', 'varaq', ['s', 'l'], 'S1.4-three-consonant'],
  ['مگر', 'magar', ['s', 'l'], 'S1.4-three-consonant'],
  ['غزل', 'ġhazal', ['s', 'l'], 'S1.4-three-consonant'],
  ['ہزاروں', 'hazāroñ', ['s', 'l', 'x'], 'F2.2-final-o-aa'],
  ['آہستہ', 'āhistah', ['l', 'l', 'x'], 'F2.2-final-ii-e-h'],
  ['حیات', 'ḥayāt', ['s', 'l', 's'], 'S1.5-weight'],
  ['کتاب', 'kitāb', ['s', 'l', 's'], 'S1.5-weight'],
  ['خواب', 'ḳhvāb (و silent)', ['l', 's'], 'F4.2-suppressed-o'],
  ['مدّت', 'muddat', ['l', 'l'], 'L1.2-tashdid'],
  ['دیوار', 'dīvār', ['l', 'l', 's'], 'S1.3-onset']
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
  fb.innerHTML = `<div class="fb-text">${ok ? '✓ Right' : '✗ Not quite'} — ${reason}</div>${hbRef(WORDS[wdI][3])}<button class="btn gold sm fb-next-btn" id="wdNextBtn" onclick="wdNext()">Next ▸</button>`;

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
  ['جو', 'x', 'F2.1-listed-monosyllable'], ['تو', 'x', 'F2.1-listed-monosyllable'], ['سے', 'x', 'F2.1-listed-monosyllable'], ['کو', 'x', 'F2.1-listed-monosyllable'], ['کا', 'x', 'F2.1-listed-monosyllable'], ['ہے', 'x', 'F2.1-listed-monosyllable'],
  ['میں', 'x', 'F2.1-listed-monosyllable'], ['بھی', 'x', 'F2.1-listed-monosyllable'], ['نے', 'x', 'F2.1-listed-monosyllable'], ['ہوں', 'x', 'F2.1-listed-monosyllable'], ['یہ', 'x', 'F2.1-listed-monosyllable'], ['وہ', 'x', 'F2.1-listed-monosyllable'],
  ['دو', 'x', 'F2.1-listed-monosyllable'], ['تھا', 'x', 'F2.1-listed-monosyllable'], ['تا', 'l', 'F2.1-always-long'], ['گو', 'l', 'F2.1-always-long'], ['یا', 'l', 'F2.1-always-long'], ['نہ', 's', 'F2.1-always-short'],
  ['کہ', 's', 'F2.1-always-short'], ['بہ', 's', 'F2.1-always-short']
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

  const L = { x: 'flexible', l: 'virtually always long (=)', s: 'short in modern usage (–)' };
  let reason = L[a];
  if (FLEX[fxI][0] === 'تا') {
    reason += ' (compare تھا, which is flexible — ھ changes the word, not the count)';
  }

  const fb = $('fxFb');
  fb.className = 'fb ' + (ok ? 'ok' : 'no');
  fb.innerHTML = `<div class="fb-text">${ok ? '✓ Right' : '✗ Not quite'} — ${reason}</div>${hbRef(FLEX[fxI][2])}<button class="btn gold sm fb-next-btn" id="fxNextBtn" onclick="fxNext()">Next ▸</button>`;

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

/* Each card cites the handbook rule it follows (`rule` = an id in engine-lab/rules.json; the section is read off
   the id). Examples are [urdu, roman, before, after, syllables]; `before` is the plain word-by-word scan and may be
   '' when only the joined reading is shown. Explanations are our own words; the worked examples are the handbook's. */
const CONSTR = [
  { t: 'Two words as one', rule: 'F3.1-graft', d: 'The poet may choose to run two neighbouring words together and scan them as one long word. This is possible only when the first word ends in a consonant and the second begins with Alif (ا) or Alif Madd (آ). To see the result, drop the second word\'s initial Alif (or its madd) and write the rest straight onto the first word. Grafting packs more words into the same space: a syllable disappears, or a long turns short. The page never changes, so only the meter shows that it happened, and it happens in fewer than half of the qualifying pairs: do not assume it on a first reading of an unknown meter. (Very rarely a final ی, ے or و acts as a consonant to allow it; treating ع as alif, as Mir once did, is no longer done.)', ex: [
    ['آخر اس', 'ākhir is', '= = =', '= - =', 'ākhiris'],
    ['آپ اگر', 'āp agar', '= - - =', '= - =', 'āpagar'],
    ['آخر اگر', 'ākhir agar', '= = - =', '= - - =', 'ākhiragar'],
    ['آپ آخر', 'āp ākhir', '= - = =', '= = =', 'āpākhir']] },
  { t: 'Grafting, three words', rule: 'F3.1-graft', d: 'Grafting can chain: two, three or four adjacent words may be run together, and the change in the pattern can be dramatic. Ghalib\'s example joins three words.', ex: [['کافر ان اصنام', 'kāfir in aṣnām', '= = = = = -', '= - - = = -', 'kāfirinaṣnām']] },
  { t: 'iẓāfat on a consonant', rule: 'F3.2-consonant', d: 'On a word that ends in a consonant, the iẓāfat joins that last consonant to form one flexible syllable. Nothing else in the word changes, even in the three-consonant words that sometimes re-divide. So naẓar (– =) with iẓāfat is (– – =): the last syllable cannot be flexible here, because three shorts never come in a row.', ex: [
    ['لب ← لبِ', 'lab → lab-e', '=', '- x', 'la-be'],
    ['ملک ← ملکِ', 'mulk → mulk-e', '= -', '= x', 'mul-ke'],
    ['دیوان ← دیوانِ', 'dīvān → dīvān-e', '= = -', '= = x', 'dī-vā-ne'],
    ['نظر ← نظرِ', 'naẓar → naẓar-e', '- =', '- - =', 'na-ẓa-re']] },
  { t: 'iẓāfat, short Arabic word', rule: 'F3.2-cc-tashdid', d: 'A short Arabic word of two consonants may double its last consonant (tashdīd) before the iẓāfat: for some words this is optional, for some compulsory, and there is no simple way to tell which. On a first pass, scan both syllables as flexible, although strictly only the second is. The same doubling is sometimes seen before the conjunction o.', ex: [['فن ← فنِ / فنّ', 'fan → fan-e / fann-e', '=', 'x x', 'fa-ne / fan-ne']] },
  { t: 'iẓāfat after ā', rule: 'F3.2-alif', d: 'The iẓāfat is written with ے (or ئے, a lone hamza, or in old books a zer) and forms one flexible syllable of its own. The syllable ending in alif before it is never flexible: always long.', ex: [['وفا ← وفائے', 'vafā → vafā-e', '- =', '- = x', 'va-fā-e']] },
  { t: 'iẓāfat after ū, o, au', rule: 'F3.2-iz-vao', d: 'After a final o that is a vowel, the iẓāfat usually acts as after alif: an added ے and one flexible syllable, most often short. When the word ends in the au sound (zabar), the o instead turns into a consonant and joins the iẓāfat.', ex: [['کو ← کوئے', 'kū → kū-e', '=', '= x', 'kū-e'], ['جَو ← جَوِ', 'jau → ja-ve', '=', '- x', 'ja-ve']] },
  { t: 'iẓāfat after ī', rule: 'F3.2-iz-ii', d: 'As a rule the final ī turns into a consonant (y), and the iẓāfat then behaves as on any consonant. Less often the poet keeps ī a vowel: the word ends long and the iẓāfat syllable stands alone, almost always short (Atish\'s sāqī-e).', ex: [['شوخی ← شوخیِ', 'shoḳhī → shoḳhī-e', '= x', '= - x', 'sho-khi-ye'], ['دشمنی ← دشمنیِ', 'dushmanī → dushmanī-e', '= - x', '= - - x', 'dush-ma-ni-ye'], ['ساقی ← ساقیِ', 'sāqī → sāqī-e (less usual)', '= x', '= = -', 'sā-qī-e']] },
  { t: 'iẓāfat after e', rule: 'F3.2-iz-e', d: 'A final vowel e turns into a consonant before the iẓāfat, which then joins it in the ordinary way.', ex: [['مے ← مئے', 'mai → mai-e', '=', '- x', 'ma-ye']] },
  { t: 'o, "and", after a consonant', rule: 'F3.3-consonant', d: 'The conjunction o (between two Persian or Arabic words or names) joins the consonant before it into one flexible syllable, just like iẓāfat. This is the normal pattern. Short Arabic two-consonant words may double their last consonant before o as they do before iẓāfat.', ex: [['دین و دل', 'dīn o dil', '= - - =', '= x =', 'dī-no dil'], ['خط ← خط و', 'ḳhaṭ → ḳhaṭ o', '=', '- x', 'ḳha-ṭo']] },
  { t: 'o, "and", after ā', rule: 'F3.3-alif', d: 'After alif, o always stands as a syllable of its own. It is usually short, and the syllable ending in alif is always long. (Sometimes the o is long.)', ex: [['وفا ← وفا و', 'vafā → vafā o', '- =', '- = -', 'va-fā o']] },
  { t: 'o, "and", after ī', rule: 'F3.3-o-ii', d: 'Usually the same as after alif: the o stands alone, usually short (sometimes long), and the ī before it is long. Occasionally the o turns ī into a consonant and they form one flexible syllable together, so the syllable before shrinks to one short letter; Mir does this now and then.', ex: [['سادگی ← سادگی و', 'sādagī → sādagī o', '= - x', '= - = -', 'sā-da-gī o'], ['شادی ← شادی و', 'shādī → shādī o (less usual)', '= x', '= - x', 'shā-di-yo']] },
  { t: 'o, "and", after e or o', rule: 'F3.3-o-vowel', d: 'Final vowels e and o usually turn into consonants and then join the o like any other consonant. A final o that already is a consonant (as in sarv) joins it directly.', ex: [['مے ← مے و', 'mai → mai o', '=', '- x', 'ma-yo'], ['خسرو ← خسرو و', 'ḳhusrau → ḳhusrau o', '= =', '= - x', 'ḳhus-ra-vo']] },
  { t: 'o, "and", after h', rule: 'F3.3-o-h', d: 'After a final h, o usually joins it in a single flexible syllable, as after any consonant. Sometimes the h is treated as a vowel instead, and then the o forms a flexible syllable by itself. The same range of choices applies to ḥ.', ex: [] },
  { t: 'al, "the", after a consonant', rule: 'F3.4-al-consonant', d: 'Arabic al (usually said ul) links two Arabic words. The word before it is scanned together with it: pretend the word simply ends in an extra ل and scan it normally. After al there is a complete break, and scanning starts afresh with the next word. If the first word has only two consonants, its last consonant carries a tashdīd (rabb ul-raḥīm).', ex: [
    ['عالم الغیب', 'ʿālam ul-ġhaib', '= = = = -', '= - = = -', 'ʿā-la-mul ġhai-b'],
    ['ان الحق', 'an al-ḥaq', '', '- = =', 'a-nal ḥaq'],
    ['لسان العصر', 'lisān ul-ʿaṣr', '', '- = = = -', 'li-sā-nul ʿaṣ-r'],
    ['رب الرحیم', 'rabb ul-raḥīm', '', '= = - = -', 'rab-bur ra-ḥī-m']] },
  { t: 'al, "the", after a vowel', rule: 'F3.4-al-vowel', d: 'When al follows a vowel, expect the spelling to mislead: the real reading is always shorter than it looks, and Arabic grammar decides it, so no general rule is given. bi + al becomes bil, fī + al becomes fil, and ẓū or bū + al become ẓul, bul. A hamza at the end of the first word blocks this shortening (māʾ al-ḥayāt keeps every syllable).', ex: [
    ['بالکل', 'bālkul (bi al-kul)', '', '= =', 'bil-kul'],
    ['فی الحال', 'fī al-ḥāl', '', '= = -', 'fil-ḥā-l'],
    ['ذو الفقار', 'ẓū al-fiqār', '', '= - = -', 'ẓul-fi-qā-r']] }
];

/* ONE highlighting model for every example on the Learn pages. A syllable is lit on every layer at once:
   its weight block, its Roman piece and its Urdu letters (.sy-u / .sy-r spans, in syllable order). The pieces go
   through the same pbToggle/litter controller as verse playback, so the sound and the light stay in step
   everywhere. fanNodes() turns "these spans share syllable i" into the single node litter() expects. */
function fanNodes(lists) {
  return lists.map(ns => ({ classList: {
    add: c => ns.forEach(n => n && n.classList.add(c)),
    remove: c => ns.forEach(n => n && n.classList.remove(c)),
    contains: c => !!(ns[0] && ns[0].classList.contains(c)) } }));
}
/* layers: the syllable-ordered span lists to light with the blocks; a list of one span lights for every syllable */
function sylLayers(host) {
  const blks = [...host.querySelectorAll('.blk')];
  const layers = ['.sy-u', '.sy-r'].map(q => [...host.querySelectorAll(q)]).filter(l => l.length);
  return blks.map((b, i) => [b].concat(layers.map(l => l.length === blks.length ? l[i] : l[0])));
}
/* Build a PB-compatible "line" from a raw pattern string ('=', '-', 'x' tokens) and the node host rendered for it,
   so every ▶ in this file goes through the shared pbToggle controller (round 2 G1) instead of calling play(). */
function rawPbLine(raw, resolve, host) {
  const toks = sylls(Scan.parseRaw(raw)).map(t => resolve ? resolve(t) : t);
  return { e: { syl: toks.map(t => ({ resolved: t })) }, nodes: host ? fanNodes(sylLayers(host)) : null, groups: null };
}
/* Urdu letters of a one-word example, cut at the syllable division the engine reads for that weight pattern
   (null when the letters and the engine's syllables do not line up: the word then lights whole). */
function urduSylParts(word, pat) {
  const want = pat.replace(/[^=\-x]/g, '').replace(/=|x/g, 'l').replace(/-/g, 's');
  const opt = ((Scan.scanWord(word) || {}).opts || []).find(o => o.syl.map(x => x.w === 's' ? 's' : 'l').join('') === want);
  if (!opt) return null;
  const groups = [];
  for (const ch of word.normalize('NFC')) { if (/[\u064B-\u065F\u0670\u06D6-\u06ED\u200C\u200D]/.test(ch) && groups.length) groups[groups.length - 1] += ch; else groups.push(ch); }
  if (opt.syl.reduce((a, x) => a + x.t.length, 0) !== groups.length) return null;
  let i = 0;
  return opt.syl.map(x => { const p = groups.slice(i, i + x.t.length).join(''); i += x.t.length; return p; });
}
/* "mul-k" -> spans per syllable with the hyphens between them; one span per piece, weight class for the lit colour */
function sylSpans(text, cls, wts) {
  let k = 0;
  return String(text).replace(/([^-\s·]+)|([-\s·]+)/g, (m, piece, sep) => piece ? `<span class="sy ${cls} ${wts[k++] || ''}">${piece}</span>` : sep);
}

/* Across word boundaries: the 16 cards above are shown in four families (handbook §3.1-3.4). The consonant case
   of each family is the one to learn first; the variants after a vowel sit in a fold-out. */
const CONSTR_GROUPS = [
  { k: 'iz', sec: '3.2', t: 'The iẓāfat', lead: 'The linking -e of a Persian or Arabic phrase (dil-e nādāṅ).', more: 'After a vowel: ā, ū / o / au, ī, e' },
  { k: 'graft', sec: '3.1', t: 'Word-grafting', lead: 'Two or three words read as one.', more: 'Three words in a row' },
  { k: 'o', sec: '3.3', t: 'The conjunction o, “and”', lead: 'The o between two Persian or Arabic words (dīn o dil).', more: 'After a vowel or h' },
  { k: 'al', sec: '3.4', t: 'Arabic al, “the”', lead: 'Rare: it appears in Arabic phrases only.', more: 'After a vowel' }
];
const CONSTR_MORE = new Set(['F3.2-cc-tashdid', 'F3.2-alif', 'F3.2-iz-vao', 'F3.2-iz-ii', 'F3.2-iz-e', 'F3.3-alif', 'F3.3-o-ii', 'F3.3-o-vowel', 'F3.3-o-h', 'F3.4-al-vowel']);
const fmtN = n => String(n).replace(/\B(?=(\d{3})+$)/g, ',');
const pctOf = (a, b) => b ? Math.round(100 * a / b) : 0;

/* the joined reading's Roman, cut into syllables when the pieces match the weight pattern (they light with the blocks) */
function roAfter(e) {
  const wts = sylls(Scan.parseRaw(e[3])).map(t => t === 'l' ? 'l' : t === 's' ? 's' : 'x');
  const pieces = String(e[4]).split(/[-\s]+/).filter(Boolean);
  return pieces.length === wts.length ? sylSpans(e[4], 'sy-r', wts) : e[4];
}
function constrCard(c, ci) {
  return `
    <div class="card constr-card">
      <h3 class="constr-title">${c.t}</h3>
      <p class="constr-desc dim small">${c.d}</p>
      ${c.ex.map((e, ei) => `
        <div class="constr-ex">
          <div class="urdu constr-urdu ur-always">${e[0]}</div>
          <div class="ro dim small constr-ro">${e[1]} → ${roAfter(e)}</div>
          <div class="row constr-row">
            <span class="play sm" role="button" tabindex="0" data-label="Play example" aria-label="Play example" onclick="cPlay(${ci},${ei},this)">▶︎</span>
            ${e[2] ? `<div class="strip before">${strip(Scan.parseRaw(e[2]))}</div>
            <span class="L mono constr-arrow">→</span>` : ''}
            <div class="strip after">${strip(Scan.parseRaw(e[3]))}</div>
          </div>
        </div>
      `).join('')}
      ${c.app ? '' : hbRef(c.rule)}
    </div>`;
}

/* Verse examples come from src/js/20b-weight-corpus.js (scripts/weight_corpus.js): well-known Ghalib lines, each checked
   against the engine in Pritchett's meter for its ghazal. */
const CORP_X = [];
/* One real line, drawn like every verse in the app: the line in Urdu and Roman (the join highlighted), the syllable
   chips with their weights, the meter's name, and a ▶ that lights all of them together. It is scanned at render time
   in Pritchett's meter for its ghazal. */
function corpusExample(e, label) {
  let r, f;
  try { r = Scan.scanLine(e.w.join(' ')); f = (r.fits || []).find(x => String(x.meter.id) === String(e.m)); } catch (err) { f = null; }
  if (!f) return '';
  const id = CORP_X.push(Scan.explain(r, f)) - 1, x = CORP_X[id];
  const inHi = i => i >= e.hi[0] && i <= e.hi[1];
  const hiSyl = new Set(x.syl.map((s, i) => inHi(s.word) ? i : -1).filter(i => i >= 0));
  const ro = e.ro.split(/\s+/);
  const span = (w, i) => `<span class="word${inHi(i) ? ' corpus-hi' : ''}" data-w="${i}">${w}</span>`;
  return `
    <div class="constr-ex corpus-ex" data-x="${id}">
      ${label ? `<div class="corpus-label ${label.cls || ''}">${label.t}</div>` : ''}
      <div class="urdu constr-urdu ur-always corpus-line">${e.w.map(span).join(' ')}</div>
      <div class="ro dim small constr-ro corpus-ro">${ro.length === e.w.length ? ro.map(span).join(' ') : e.ro}</div>
      <div class="row constr-row">
        <span class="play sm" role="button" tabindex="0" data-label="Play line" aria-label="Play line" onclick="corpPlay(${id},this)" data-pb="none">▶︎</span>
        ${chipRowHTML(x.syl, x.feet, { r, ro: e.ro, cls: 'corpus-chips', hiSyl })}
      </div>
      <div class="corpus-meta tiny"><a class="corpus-src" href="${e.url}" target="_blank" rel="noopener">${e.poet}, ghazal ${e.gz} ↗</a></div>
    </div>`;
}
/* the verses that show a join: just the lines (the join is underlined, ▶ plays them) */
function corpusCard(k) {
  const C = typeof WEIGHT_CORPUS !== 'undefined' ? WEIGHT_CORPUS : null;
  if (!C || !C.examples[k] || !C.examples[k].length) return '';
  const body = C.examples[k].map(e => corpusExample(e)).join('');
  return body ? `<div class="card corpus-card small">${body}</div>` : '';
}
function corpPlay(id, btn) {
  const host = btn.closest('.corpus-ex'), x = CORP_X[id];
  if (!host || !x) return;
  const urW = [...host.querySelectorAll('.corpus-line .word')], roW = [...host.querySelectorAll('.corpus-ro .word')];
  const words = urW.map((w, i) => ({ classList: {
    add: c => { w.classList.add(c); if (roW.length === urW.length) roW[i].classList.add(c); },
    remove: c => { w.classList.remove(c); if (roW.length === urW.length) roW[i].classList.remove(c); } } }));
  pbToggle('corp:' + id, btn, () => [Object.assign({ e: x, words }, pbNodes(host))]);
}
window.corpPlay = corpPlay;

function renderConstr() {
  const secKey = Object.fromEntries(CONSTR_GROUPS.map(g => [g.sec, g.k]));
  const isMore = c => c.t === 'Grafting, three words' || (CONSTR_MORE.has(c.rule) && c.rule !== 'F3.1-graft');
  const build = keys => CONSTR_GROUPS.filter(g => keys.includes(g.k)).map(g => {
    const mine = CONSTR.map((c, ci) => ({ c, ci })).filter(x => secKey[ruleSec(x.c.rule)] === g.k);
    const main = mine.filter(x => !isMore(x.c)), more = mine.filter(x => isMore(x.c));
    return `
    <div class="constr-group" id="cg-${g.k}">
      <h3 class="group-title">${g.t} <span class="group-sec mono tiny">§${g.sec}</span></h3>
      <p class="small dim group-lead">${g.lead}</p>
      ${corpusCard(g.k)}
      ${main.map(x => constrCard(x.c, x.ci)).join('')}
      ${more.length ? `<details class="constr-more"><summary>${g.more} <span class="dim tiny">(${more.length} more)</span></summary>${more.map(x => constrCard(x.c, x.ci)).join('')}</details>` : ''}
    </div>`; }).join('');
  if ($('constr')) $('constr').innerHTML = build(['iz', 'graft', 'o']);
  if ($('constrRef')) $('constrRef').innerHTML = build(['al']);
}

/* a word shown in two verses, once per reading: the same layout for every flexible word, aur included */
function readingPair(wordHtml, readings) {
  return `<div class="flex-pair"><div class="flex-pair-word urdu ur-always">${wordHtml}</div>${readings.map(([label, list]) => (list || []).map(e => corpusExample(e, label)).join('')).join('')}</div>`;
}
function renderFlexEvidence() {
  const C = typeof WEIGHT_CORPUS !== 'undefined' ? WEIGHT_CORPUS : null;
  if (!C) return;
  const L = { t: 'long (=)', cls: 'l' }, S = { t: 'short (–)', cls: 's' };
  const fh = $('flexVerses');
  if (fh && C.flexv) fh.innerHTML = `<div class="card corpus-card small">${['ہے', 'میں'].map(w => readingPair(w, [[L, C.flexv[w].long], [S, C.flexv[w].short]])).join('')}</div>`;
  const ah = $('aurVerses');
  if (ah) ah.innerHTML = `<div class="card corpus-card small">${readingPair('اور', [[{ t: 'one syllable (=)', cls: 'l' }, C.examples.aur1], [{ t: 'two syllables (= –)', cls: 'two' }, C.examples.aur2]])}</div>`;
  const eh = $('finalEvidence'); if (eh) eh.innerHTML = '';
}

/* ---- the lesson: one stage at a time ---- */
const STAGES = ['Basics', 'Flexible', 'Across words', 'Reference'];
/* rows are fitted to one line by their width, which a hidden stage does not have: refit whenever one appears */
function refitLearn() {
  if (typeof fitChipRows !== 'function' || typeof requestAnimationFrame !== 'function') return;
  requestAnimationFrame(() => fitChipRows($('weightPanelLearn')));
}
if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('resize', () => { clearTimeout(refitLearn.t); refitLearn.t = setTimeout(refitLearn, 150); });
function showStage(n, scroll) {
  n = Math.max(1, Math.min(STAGES.length, n | 0));
  document.querySelectorAll('#weightPanelLearn .stage').forEach(s => { s.hidden = (+s.dataset.stage !== n); });
  document.querySelectorAll('#weightStepper .step').forEach(b => {
    const on = +b.dataset.stage === n;
    b.classList.toggle('on', on); b.setAttribute('aria-current', on ? 'step' : 'false');
  });
  try { store.set('weightStage', n); } catch (e) {}
  refitLearn();
  if (typeof pbCancel === 'function') pbCancel();
  if (scroll && $('weightStepper') && $('weightStepper').scrollIntoView) $('weightStepper').scrollIntoView({ block: 'start' });
}
let stagesReady = false;
function initStages() {
  const st = $('weightStepper');
  if (!st || stagesReady || typeof document.createElement !== 'function') return;
  stagesReady = true;
  st.innerHTML = STAGES.map((t, i) => `<button type="button" class="step" data-stage="${i + 1}" onclick="showStage(${i + 1}, true)"><span class="step-n mono">${i < STAGES.length - 1 ? i + 1 : '★'}</span><span class="step-t">${t}</span></button>`).join('');
  document.querySelectorAll('#weightPanelLearn .stage').forEach(sec => {
    const n = +sec.dataset.stage, nav = document.createElement('div');
    nav.className = 'stage-nav';
    nav.innerHTML = `${n > 1 ? `<button type="button" class="btn" onclick="showStage(${n - 1}, true)">◂ ${STAGES[n - 2]}</button>` : '<span></span>'}
      ${n < STAGES.length ? `<button type="button" class="btn" onclick="navigate('/weight/drill')">Practise this</button>` : ''}
      ${n < STAGES.length ? `<button type="button" class="btn gold" onclick="showStage(${n + 1}, true)">${STAGES[n]} ▸</button>` : '<span></span>'}`;
    sec.appendChild(nav);
  });
  let n = 1; try { n = +store.get('weightStage', 1) || 1; } catch (e) {}
  showStage(n, false);
}
window.showStage = showStage;
/* the verse examples draw chips in the chosen script, so they redraw when it changes */
function renderLearnExamples() { renderConstr(); renderFlexEvidence(); refitLearn(); }
window.renderLearnExamples = renderLearnExamples;

/* The first screen: two words taken apart before any rule is stated. */
const INTRO_WORDS = [['کتاب', 'kitāb', '- = -', 'ki-tā-b'], ['مدّت', 'muddat', '= =', 'mud-dat'], ['ملک', 'mulk', '= -', 'mul-k']];
function renderIntroEx() {
  const host = $('introEx');
  if (!host) return;
  host.innerHTML = INTRO_WORDS.map((e, ei) => wordExample(e, `introPlay(${ei},this)`)).join('');
}
function introPlay(ei, btn) {
  const e = INTRO_WORDS[ei];
  pbToggle('intro:' + ei, btn, () => [rawPbLine(e[2], null, btn.closest('.constr-ex'))]);
}
window.introPlay = introPlay;

function cPlay(ci, ei, btn) {
  const e = CONSTR[ci].ex[ei];
  const row = btn.parentNode, after = row.querySelector('.strip.after'), before = row.querySelector('.strip.before');
  const exHost = row.closest('.constr-ex');
  /* the Roman spans belong to the joined reading, so they light with the "after" blocks only */
  const lineB = rawPbLine(e[3], t => t === 'x' ? 's' : t, null);
  const blks = [...after.querySelectorAll('.blk')], ro = [...exHost.querySelectorAll('.sy-r')];
  lineB.nodes = fanNodes(blks.map((b, i) => [b, ro.length === blks.length ? ro[i] : null]));
  const lineA = e[2] ? rawPbLine(e[2], t => t === 'x' ? 'l' : t, null) : null;
  if (lineA) lineA.nodes = fanNodes([...before.querySelectorAll('.blk')].map(b => [b]));
  pbToggle('constr:' + ci + ':' + ei, btn, () => lineA ? [lineA, lineB] : [lineB]);
}
window.cPlay = cPlay;

/* Rules about how a single word divides into syllables (Handbook ch. 1.4,
   1.3) — no before/after transform, just the word and its reading. */
const SPECIAL_SYLL = [
  { t: 'Three-letter, three-consonant words', rule: 'S1.4-three-consonant', d: 'A word of three consonants and no vowel letters, mostly Arabic in origin, is divided two-then-one in the great majority of cases; words ending in ح or ع show this most strongly. The division inherited from Arabic holds in poetry even where speech has changed.', ex: [['ملک', 'mulk', '= -', 'mul-k'], ['وقت', 'vaqt', '= -', 'vaq-t'], ['ورق', 'varaq', '- =', 'va-raq']], note: 'A minority, Arabic and non-Arabic alike, divide one-then-two instead: varaq, qasam, magar, ġhazal, nikal. These change their division when grammar changes the pronunciation (nikal, but niklā); they usually keep it when Arabic or Persian endings are added (naẓar, naẓariyah).' }
];

/* a single word taken apart: Urdu letters by syllable, Roman by syllable, weights; ▶ lights all three together */
function wordExample(e, onclick) {
  const wts = sylls(Scan.parseRaw(e[2])).map(t => t === 'l' ? 'l' : t === 's' ? 's' : 'x');
  const parts = urduSylParts(e[0], e[2]);
  return `
    <div class="constr-ex special-syll-ex">
      <div class="urdu constr-urdu ur-always">${parts ? parts.map((p, i) => `<span class="sy sy-u ${wts[i]}">${p}</span>`).join('') : `<span class="sy sy-u">${e[0]}</span>`}</div>
      <div class="ro dim small constr-ro">${e[3] ? sylSpans(e[3], 'sy-r', wts) : e[1]}</div>
      <div class="row">
        <span class="play sm" role="button" tabindex="0" data-label="Play example" aria-label="Play example" onclick="${onclick}">▶︎</span>
        <div class="strip">${strip(Scan.parseRaw(e[2]))}</div>
      </div>
    </div>`;
}
/* the three-consonant card follows Rule three; the ا و ی examples sit inside Rule two */
const SPECIAL_HOST = { 0: 'specialSyll' };
const RULE_TWO_EX = [['کو', 'ko', '=', 'ko'], ['وقت', 'vaqt', '= -', 'vaq-t'], ['یار', 'yār', '= -', 'yā-r']];
function ruleTwoPlay(ei, btn) {
  const e = RULE_TWO_EX[ei];
  pbToggle('rule2:' + ei, btn, () => [rawPbLine(e[2], null, btn.closest('.constr-ex'))]);
}
window.ruleTwoPlay = ruleTwoPlay;
function renderSpecialSyll() {
  if ($('ruleTwoEx')) $('ruleTwoEx').innerHTML = RULE_TWO_EX.map((e, ei) => wordExample(e, `ruleTwoPlay(${ei},this)`)).join('');
  SPECIAL_SYLL.forEach((c, ci) => {
    const host = $(SPECIAL_HOST[ci]);
    if (!host) return;
    host.innerHTML = `
    <div class="card constr-card">
      <h3 class="constr-title">${c.t}</h3>
      <p class="constr-desc dim small">${c.d}</p>
      <div class="row constr-row special-syll-row">
        ${c.ex.map((e, ei) => wordExample(e, `ssPlay(${ci},${ei},this)`)).join('')}
      </div>
      ${c.note ? `<p class="constr-desc dim small">${c.note}</p>` : ''}
      ${c.app ? '' : hbRef(c.rule)}
    </div>`;
  });
}

function ssPlay(ci, ei, btn) {
  const e = SPECIAL_SYLL[ci].ex[ei];
  const line = rawPbLine(e[2], null, btn.closest('.constr-ex'));
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
if (typeof renderFlexEvidence === 'function') renderFlexEvidence();
if (typeof renderSpecialSyll === 'function') renderSpecialSyll();
if (typeof renderIntroEx === 'function') renderIntroEx();
if (typeof initStages === 'function') initStages();
if (typeof renderHandbook === 'function') renderHandbook();
if (typeof renderExercises === 'function') renderExercises();
if (typeof renderDictionary === 'function') renderDictionary();
if (typeof renderBibliography === 'function') renderBibliography();

// Kick off routing
if (typeof handleRoute === 'function') {
  handleRoute();
}
