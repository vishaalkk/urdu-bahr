/* ================= DICTIONARY MODULE ================= */
let currentDictTag = 'all';
let currentDictQuery = '';

/* GLOSSARY_DATA .wt can list several alternative readings, e.g. "(= - x), (= x)" —
   play/display just the first. Returns a raw pattern string ("= - x") the scansion
   engine's own parseRaw/patternFeet already understands, so the pattern strip and
   playback share one source of truth with the rest of the app. */
function dictFirstPattern(wt) {
  return String(wt || '').split(/\)\s*,/)[0].replace(/[()]/g, '').trim();
}

function getDictWordDisplay(item, script) {
  const src = (item.ascii && !/^\d/.test(item.ascii)) ? item.ascii : (item.syl || item.ascii || '');
  if (script === 'ascii') return src;
  try {
    if (script === 'hi' && typeof window !== 'undefined' && window.p_hi) return window.p_hi.parse(src);
    if (script === 'ro' && typeof window !== 'undefined' && window.p_di) return window.p_di.parse(src);
    if ((!script || script === 'ur') && typeof window !== 'undefined' && window.p_ur) return window.p_ur.parse(src);
  } catch (e) {}
  return item.syl || item.ascii || '';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderDictionary() {
  const list = $('dictList');
  if (!list) return;

  const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
  const q = currentDictQuery.toLowerCase().trim();

const INDIC_GLOSSARY_WORDS = new Set([
  'aap hii', 'aaphii', 'aapii', 'u;Thaa', 'u;T;Thaa', 'idhar', 'iidhar', 'anjhuu', 'aur', 'bachchah', 'bachah', 'bahut', 'bhii', 'bhiitar', 'bhitar', 'byaah', 'byopaar', 'paa))o;N', 'paa;Nv', 'pachchiis', 'pachiis', 'priit', 'pret', 'prem', 'pakaa', 'pakkaa', 'pah', 'pahu;Nchnaa', 'po;Nchnaa', 'pahu;Nchaa', 'phuvaar', 'phuuhaar', 'phvaar', 'pyaar', 'pyaalah', 'tak', 'talak', 'tumhaaraa', 'to', 'tuu', 'thaa', 'tahah', 'ta))ii;N', 'teraa', 'tiraa', 'tevrii', 'tyuu;N', 'jidhar', 'jiidhar', 'jagah', 'jaagah', 'jo', 'juvaa', 'juvva', 'jvaar', 'jii', 'jyuu;N', 'chakhaa', 'chakkhaa', 'chuuhiyaa', 'chuhiyaa', 'chyuun;Tii', 'dukaan', 'duukaan', 'dukkaan', 'dulhan', 'duulhan', 'dupa;T;Tah', 'dopa;T;Tah', 'doraahaa', 'duulhaa', 'duulah', 'duu))ii', 'dhyaan', 'rakhaa', 'rakkhaa', 'saa', 'saajan', 'sajan', 'sarhaanaa', 'so', 'sau', 'suu', 'svaa;Ng', 'saa;Ng', 'suvar', 'suuraaj', 'svaraaj', 'se', 'shakar', 'shakkar', 'krishn', 'kaa', 'ko', 'ko))ii', "kah'h", 'kho))e', 'kahiye', 'kii', 'ke', 'kyaa', 'kiyaarii', 'kyaarii', 'kyuu;N', 'garhan', 'gahan', 'guuruu', 'guruu', 'ga))e', 'gyaan', 'likhaa', 'likkhaa', 'lohaar', 'luhaar', 'lek', 'maarg', 'muvaa', 'muu))ii', 'muu))e', 'muu;Nhah', 'miyaa;N', 'myaa;N', 'meraa', 'miraa', 'me;N', 'mai;N', 'naa))o', 'naav', 'nibaahnaa', 'nibhaanaa', 'nadii', 'naddii', 'nanhaa', 'nau', 'nah', 'nai', 'ne', 'vahaa;N', 'vaa;N', 'haa))e', 'hai', 'ho', 'huu))aa', 'huu))e', 'huu))ii', 'huu))ii;N', 'ho;N', 'huu;N', 'hii', 'hai;N', 'yahaa;N', 'yaa;N', 'yuu;N', 'ye'
]);

const PERSIAN_GLOSSARY_WORDS = new Set([
  'aa;xir', 'aa;xiir', 'a;xiir', 'az', 'z', 'asharfii', 'ashrafii', 'aashkaar', 'aashkaaraa', 'aashiyaanah', 'aashiyaa;N', 'aagaah', 'aagah', 'ummiid', 'umiid', 'aa))iinah', 'aa))inah', 'yak', 'barhaman', 'barahman', 'barahnah', 'barhanah', 'buustaan', 'bustaan', 'bah', 'bayak', 'parvaa', 'parvaah', 'panaah', 'panah', 'pairaahan', 'pairahan', 'payaam', 'pai;Gaam', 'payambar', 'pai;Gambar', 'peshvaaz', 'pishvaaz', 'taa', 'tanuur', 'tannuur', 'tanduur', 'juzv', 'juz', ';xaamoshii', ';xamoshii', ';xaamushii', ';xi.zr', ';xi.zir', ';xa:trah', ';xa:tar', ';xvaam;xvaah', ';xvaahish', ';xvud', ';xvushii', 'daaman', 'daamaan', 'du;xtar', 'du;xt', 'do', 'dobaarah', 'dozaanuu', 'dogaanaa', 'dahan', 'dahaan', 'dahanah', 'diigar', 'digar', 'diivaanah', 'divaanah', 'raastah', 'rastah', 'raah', 'rah', 'ru;xsaar', 'ru;xsaarah', 'ruubah', 'ruubaah', 'rahguz;ar', 'raahguz;ar', 'rahguz;aar', 'raahguz;aar', 'zinhaar', 'ziinhaar', 'sih', 'sii', 'siyaah', 'siyah', 'shaah', 'shah', 'shubahah', 'shutur', 'ushtur', 'sharaar', 'sharar', 'sharaarah', 'firang', 'afrang', 'fuzuu;N', 'afzuu;N', 'fasaanah', 'afsaanah', 'fusurdah', 'afsurdah', 'fusuu;N', 'afsuu;N', 'fi;Gaa;N', 'af;Gaa;N', 'figaar', 'afgaar', 'fulaa;N', 'falaanaa', 'kaasah', 'kaas', 'kinaarah', 'kinaar', 'kih', 'gaah', 'gah', 'gar', 'agar', 'garchah', 'agarchah', 'gursanah', 'gurasnah', 'gulsitaa;N', 'gunaah', 'gunah', 'go', 'gauhar', 'guhar', 'laash', 'laashah', 'lekin', 'maah', 'mah', 'mihmaan', 'miinaar', 'minaar', 'naa;xuun', 'naa;xun', 'naagaah', 'naagahah', 'nashtar', 'neshtar', 'nigaah', 'nigah', 'naushah', 'naushaah', 'nayastaa;N', 'naisitaa;N', 'varnah', 'vagarnah', 'vuh', 'vai', 'hoshyaar', 'hushyaar', 'yaa', 'yuurish', 'yih'
]);

  const filtered = GLOSSARY_DATA.filter(item => {
    const isIndic = INDIC_GLOSSARY_WORDS.has(item.ascii) || (item.mean && item.mean.toLowerCase().includes('indic'));
    const isPersian = PERSIAN_GLOSSARY_WORDS.has(item.ascii) || (item.mean && item.mean.toLowerCase().includes('pers'));
    if (currentDictTag === 'flex' && !item.wt.includes('x')) return false;
    if (currentDictTag === 'persian' && !isPersian) return false;
    if (currentDictTag === 'indic' && !isIndic) return false;
    if (!q) return true;
    const sylMatch = item.syl && item.syl.toLowerCase().includes(q);
    const asciiMatch = item.ascii && item.ascii.toLowerCase().includes(q);
    const meanMatch = item.mean && item.mean.toLowerCase().includes(q);
    const dispWord = getDictWordDisplay(item, cs);
    const wordMatch = dispWord && dispWord.toLowerCase().includes(q);
    return sylMatch || asciiMatch || meanMatch || wordMatch;
  });

  if (filtered.length === 0) {
    list.innerHTML = `<div class="dict-empty dim small">${q ? `No words match ‘${escapeHtml(q)}’.` : 'No words match the selected filter.'}</div>`;
    return;
  }

  const scriptClass = (cs === 'ur') ? 'urdu' : ((cs === 'hi') ? 'deva' : 'mono');
  const langDirAttr = (cs === 'ur') ? 'lang="ur" dir="rtl"' : ((cs === 'hi') ? 'lang="hi"' : 'lang="ur-Latn" dir="ltr"');

  list.innerHTML = filtered.slice(0, 180).map((item, i) => {
    const word = getDictWordDisplay(item, cs);
    const rawPat = dictFirstPattern(item.wt);
    const patHtml = (typeof Scan !== 'undefined' && typeof strip === 'function') ? strip(Scan.parseRaw(rawPat)) : escapeHtml(item.wt);
    const meanHtml = escapeHtml(item.mean);
    const safePat = rawPat.replace(/'/g, "\\'");
    return `
      <div class="dict-row">
        <div class="dict-row-top row">
          <span class="dict-word ${scriptClass}" ${langDirAttr}>${word}</span>
          <span class="dict-pat mono">${patHtml}</span>
          <button class="icon-btn play sm dict-play" data-label="Play rhythm" onclick="playWordRhythm(${i},'${safePat}',this)" aria-label="Play rhythm" title="Play rhythm">▶︎</button>
        </div>
        ${item.mean ? `<div class="dict-mean dim small">${meanHtml}</div>` : ''}
      </div>
    `;
  }).join('');
}

function onDictSearch() {
  const input = $('dictSearchInput');
  currentDictQuery = input ? input.value : '';
  renderDictionary();
}

function filterDictTag(tag) {
  currentDictTag = tag;
  ['dictTagAll', 'dictTagFlex', 'dictTagPersian', 'dictTagIndic'].forEach(id => {
    const el = $(id);
    if (el) el.classList.remove('on');
  });
  const activeBtn = $('dictTag' + tag.charAt(0).toUpperCase() + tag.slice(1));
  if (activeBtn) activeBtn.classList.add('on');
  renderDictionary();
}

/* Word Bank ▶: goes through the player (▶⇄❚❚), lighting the word's own syllable strip. */
function playWordRhythm(idx, rawPat, btn) {
  if (!rawPat) return;
  const row = btn && btn.closest ? btn.closest('.dict-row-top') : null;
  const nodes = row && typeof row.querySelectorAll === 'function' ? [...row.querySelectorAll('.blk')] : null;
  if (typeof pbTogglePattern === 'function') pbTogglePattern('dictword:' + idx, btn, rawPat, nodes);
}

/* ================= PLATTS & STEINGASS CLASSICAL LEXICON ================= */
const DICT_ORIGIN_NAMES = { P: 'Persian', A: 'Arabic', S: 'Sanskrit', H: 'Hindi', T: 'Turkish' };

function dictFoldUr(s) {
  return String(s || '').normalize('NFC').replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[هۀۂةھ]/g, 'ہ').replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/ٿ/g, 'ٹ').replace(/ڐ/g, 'ڈ').replace(/ڙ/g, 'ڑ');
}

/* The looser key the index is also kept under: Platts' lithograph spellings meet the modern ones. Final ہہ after an aspirate is
   one ھ (ساتهہ = ساتھ), ں is ن (يہان = یہاں), hamza seats are their letters (سؤال = سوال), and spaces / joiners drop. */
function dictKeyUr(s) {
  return dictFoldUr(s).replace(/[\s‌‍‎‏\-]/g, '').replace(/ہہ$/, 'ہ').replace(/ں/g, 'ن').replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ی').replace(/[أإ]/g, 'ا').replace(/ۓ/g, 'ے');
}

/* Part of speech from the head of a definition (Platts: "[S. …], s.m. …"): v verb, n noun, a adjective; '' unknown (Steingass) */
function dictPos(e) {   // the etymology in brackets first is skipped ("(… v.n.fr. حبّ …), s.f." is a noun)
  const head = (e.def || '').slice(0, 200).replace(/^[\s,]*(?:(?:\[[^\]]*\]|\([^)]*\))[\s,]*)+/, '');
  const m = /(?:^|[\s,\]\)])(s\.\s?[mf]\.|adj\.|v\.\s?[tni]\.(?!\s?fr)|adv\.)/.exec(head);
  return !m ? '' : m[1][0] === 'v' ? 'v' : m[1][0] === 's' ? 'n' : m[1][0] === 'a' && m[1][1] === 'd' && m[1][2] === 'j' ? 'a' : '';
}

/* ---- Urdu's regular inflection: one table, read both ways ----
   Each class: its part of speech and gender, how its dictionary word ends (Roman, ASCII) with a test on the stem (Roman, ASCII)
   or on the Urdu, and the endings of its forms (Roman, ASCII). Schmidt, Urdu: An Essential Grammar §§ 2–3, 11–14. A vowel stem
   takes ʾ before -e, -ī, -eñ, -ūñ (آئے، سوئیں، بتاؤں); a Persian -ah noun loses its h (پردہ → پردے). Forward, the table inflects a
   dictionary word (dictEntryForms) or a spelling the corpora know (knownForms); backward, it takes a form to the dictionary
   words it can be (dictLemmas), in Roman or, through the parser's own spelling of the endings (urEndings), in Urdu script. */
const VERB_C = [['', ''], ['ā', 'aa'], ['ī', 'ii'], ['e', 'e'], ['īñ', 'ii;N'], ['tā', 'taa'], ['tī', 'tii'], ['te', 'te'], ['tīñ', 'tii;N'],
  ['nā', 'naa'], ['ne', 'ne'], ['nī', 'nii'], ['o', 'o'], ['ūñ', 'uu;N'], ['eñ', 'e;N'], ['iye', 'iye'], ['iyegā', 'iye gaa'],
  ['ūñgā', 'uu;N gaa'], ['ūñgī', 'uu;N gii'], ['egā', 'e gaa'], ['egī', 'e gii'], ['eñge', 'e;N ge'], ['eñgī', 'e;N gii'], ['oge', 'o ge'],
  ['at', 'at']];
const VERB_V = [['', ''], ['yā', 'yaa'], ['ʾī', '))ii'], ['ʾe', '))e'], ['ʾīñ', '))ii;N'], ['ʾeñ', '))e;N'], ['ʾūñ', '))uu;N'], ['ʾo', '))o'],
  ['ʾiye', '))iye'], ['tā', 'taa'], ['tī', 'tii'], ['te', 'te'], ['nā', 'naa'], ['ne', 'ne'], ['nī', 'nii'], ['ʾūñgā', '))uu;N gaa'],
  ['ʾūñgī', '))uu;N gii'], ['ʾegā', '))e gaa'], ['ʾegī', '))e gii'], ['ʾeñge', '))e;N ge'], ['ʾoge', '))o ge']];
const CONS = /[^aāeīiouū]$/, CONS_A = /[^aeiou;]$|;[a-z]$/;
/* pos, gender, the dictionary word's ending (Roman ro, ASCII asc), tests on the stem (Roman st, ASCII sa) or on the Urdu (ur),
   the forms; any: an untagged entry may take this class's -oñ */
const PARADIGMS = [
  { pos: 'n', g: 'm', ro: 'ā', asc: 'aa', ur: /ا$/, any: 1, forms: [['e', 'e'], ['oñ', 'o;N']] },
  { pos: 'n', g: 'm', ro: 'ah', asc: 'ah', ur: /[ہه]$/, any: 1, forms: [['e', 'e'], ['oñ', 'o;N']] },
  { pos: 'n', g: 'm', ro: '', asc: '', st: /[ūo]$/, sa: /(uu|o)$/, any: 1, forms: [['ʾoñ', '))o;N']] },
  { pos: 'n', g: 'm', ro: 'ī', asc: 'ii', forms: [['iyoñ', 'iyo;N']] },
  { pos: 'n', g: 'm', ro: '', asc: '', st: CONS, sa: CONS_A, any: 1, forms: [['oñ', 'o;N']] },
  { pos: 'n', g: 'f', ro: 'ī', asc: 'ii', forms: [['iyāñ', 'iyaa;N'], ['iyoñ', 'iyo;N']] },
  { pos: 'n', g: 'f', ro: '', asc: '', st: /ā$/, sa: /aa$/, any: 1, forms: [['ʾeñ', '))e;N'], ['ʾoñ', '))o;N']] },
  { pos: 'n', g: 'f', ro: '', asc: '', st: CONS, sa: CONS_A, forms: [['eñ', 'e;N'], ['oñ', 'o;N']] },
  { pos: 'a', g: '', ro: 'ā', asc: 'aa', ur: /ا$/, forms: [['ī', 'ii'], ['e', 'e']] },
  { pos: 'v', g: '', ro: 'nā', asc: 'naa', st: /[āou]$/, sa: /(aa|o|uu)$/, forms: VERB_V },
  { pos: 'v', g: '', ro: 'nā', asc: 'naa', st: /[^āouīe]$/, sa: CONS_A, forms: VERB_C }
];
const FORM_IRREGULAR = { 'jānā': [['gayā', 'gayaa'], ['gaʾī', 'ga))ii'], ['gaʾe', 'ga))e'], ['gaʾīñ', 'ga))ii;N']],
  'karnā': [['kiyā', 'kiyaa'], ['kiye', 'kiye'], ['kījiye', 'kiijiye']], 'denā': [['diyā', 'diyaa'], ['diye', 'diye'], ['dījiye', 'diijiye']],
  'lenā': [['liyā', 'liyaa'], ['liye', 'liye'], ['lījiye', 'liijiye']], 'honā': [['huʾā', 'hu))aa'], ['huʾī', 'hu))ii'], ['huʾe', 'hu))e'], ['huʾīñ', 'hu))ii;N']],
  'pīnā': [['piyā', 'piyaa'], ['piye', 'piye'], ['pījiye', 'piijiye']] };
/* the Urdu spelling of each class's endings, as the parser writes them after a consonant (or a long-ā stem) */
let _urEndings = null;
function urEndings() {
  if (_urEndings) return _urEndings;
  const tail = (stem, asc) => { const a = asciiToScripts(stem).ur, b = asciiToScripts(stem + asc).ur || ''; return dictFoldUr(b.slice(a.length)).replace(/\s/g, ''); };
  _urEndings = PARADIGMS.map(P => {
    const st = P.sa && P.sa.test('baa') ? 'baa' : 'b';
    return { lemma: tail(st, P.asc), forms: P.forms.map(([, a]) => tail(st, a)) };
  });
  return _urEndings;
}
/* An inflected form → the dictionary words it can be: [word, pos] ('v' a verb's infinitive, 'n' a noun or adjective), longest
   ending first; lookup keeps those the dictionary has with that part of speech. A compound inflects as one word. */
function dictLemmas(word) {
  const roman = /[a-z]/i.test(word), out = [];
  const w = roman ? formKey(String(word).toLowerCase().replace(/[^a-z]/g, '')) : dictFoldUr(word).replace(/[\s‌]/g, '');
  if (!w) return out;
  const push = (f, pos) => { if (f !== w && !out.some(o => o[0] === f)) out.push([f, pos]); };
  Object.entries(FORM_IRREGULAR).forEach(([lemma, forms]) => forms.forEach(([r, a]) => {
    if (roman ? formKey(r) === w : dictFoldUr(asciiToScripts(a).ur || '') === w) push(roman ? formKey(lemma) : asciiToScripts(scholarRoToAscii(lemma)).ur, 'v');
  }));
  const cands = [], ue = roman ? null : urEndings();
  PARADIGMS.forEach((P, pi) => P.forms.forEach(([r], fi) => {
    const end = roman ? formKey('b' + r).slice(1) : ue[pi].forms[fi];
    if (!w.endsWith(end)) return;
    const stem = w.slice(0, w.length - end.length);
    if (stem.length < (P.pos === 'v' ? 1 : 2)) return;
    const lemmas = roman ? (P.ro === 'ah' ? ['a', 'ah'] : [formKey('b' + P.ro).slice(1)]) : [ue[pi].lemma];
    lemmas.forEach(l => cands.push([end.length, stem + l, P.pos === 'v' ? 'v' : 'n']));
  }));
  if (!roman && /..ات$/.test(w)) cands.push([2, w.slice(0, -2), 'n'], [2, w.slice(0, -2) + 'ہ', 'n']);   // the Arabic plural -āt
  cands.sort((a, b) => b[0] - a[0]).forEach(([, f, pos]) => push(f, pos));
  return out;
}

/* the key a typed spelling and a generated one share: casualKey's loose level, with a glide y between vowels and ei folded
   (gaye ~ gaʾe, sunayein ~ sunāʾeñ, larkiyan ~ laṛkiyāñ) */
function formKey(s) { return dictRoKey(s).replace(/([aeiou])y(?=[aeiou])/g, '$1').replace(/ei/g, 'e'); }
function formKeys(ro) {   // ṛ is typed r or d (paṛhnā: parhna, padhna); soʾūñgā is typed soonga
  const k = [formKey(ro)];
  if (/ṛ/.test(ro)) k.push(formKey(ro.replace(/ṛ/g, 'd')));
  if (/oʾū/.test(ro)) k.push(formKey(ro.replace(/oʾū/g, 'ū')));
  return k;
}
/* how far a candidate's Roman is from what was typed: consonants as typed (chh is not ch: ćurāʾūñgā is an edit from typed
   chhuraaoonga, ćhuṛāʾūñgā none), vowel length not (casual typists write ā as a) */
function typedKey(s) {
  return casualKey(String(s).replace(/[ʻʼ]/g, ''), 0).replace(/aa/g, 'a').replace(/ii/g, 'i').replace(/uu/g, 'u')
    .replace(/([aeiou])y(?=[aeiou])/g, '$1').replace(/ei/g, 'e');
}
function editDistance(a, b) {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
}
function typedDistance(typed, ro) {   // with the spellings formKeys allows: ṛ typed d, soʾūñgā typed soonga
  const t = typedKey(typed), r = String(ro);
  return Math.min(...[r, r.replace(/ṛ/g, 'd'), r.replace(/oʾū/g, 'ū')].map(v => editDistance(t, typedKey(v))));
}
function dictGender(e) {
  const head = (e.def || '').slice(0, 200).replace(/^[\s,]*(?:(?:\[[^\]]*\]|\([^)]*\))[\s,]*)+/, '');
  const m = /(?:^|[\s,\]\)])s\.\s?([mf])\./.exec(head);
  return m ? m[1] : '';
}
/* Spellings that differ from a typed word by one short vowel: Urdu speech and casual typing drop a short a / i / u between two
   consonants (fāṣila: faasla, qāfila: qafla, ḥauṣila: hausla) and sometimes add one (fikr: fikar). One vowel restored inside a
   consonant pair (not a digraph: kh, gh, sh… stay whole), or one dropped from between two consonants. */
function shortVowelVariants(t) {
  const cons = c => /[b-df-hj-np-tv-z]/.test(c || ''), out = [];
  for (let i = 1; i < t.length; i++) {
    if (cons(t[i - 1]) && cons(t[i]) && !(t[i] === 'h' && /[kgcjtdpbszr]/.test(t[i - 1]))) ['a', 'i', 'u'].forEach(v => out.push(t.slice(0, i) + v + t.slice(i)));
    if (/[aiu]/.test(t[i]) && cons(t[i - 1]) && cons(t[i + 1])) out.push(t.slice(0, i) + t.slice(i + 1));
  }
  return out;
}

/* a dictionary Roman's typed key: casualKey, with Platts' ʻain and ʼ (U+02BB/02BC) dropped as ʿ ʾ are */
function dictRoKey(r) { return casualKey(String(r).replace(/[ʻʼ]/g, ''), 1); }
/* an entry's forms: [scholarly Roman of the form, its ASCII, the ASCII of the dictionary word itself]. An untagged entry (many
   Persian words) takes only the oblique plural -oñ, which every gender has. */
function dictEntryForms(e) {
  const ro = (e.ro || '').normalize('NFC').trim().replace(/-/g, '');   // a compound (rah-guẕar) inflects as one word
  if (!ro || !e.ur || /[\s,]/.test(ro) || e.dict !== 'Platts') return [];
  const out = [], g = dictGender(e), untagged = !e.pos && !g;
  if (e.pos === 'v' && FORM_IRREGULAR[ro]) FORM_IRREGULAR[ro].forEach(([r, a]) => out.push([r, a, scholarRoToAscii(ro)]));
  PARADIGMS.forEach(P => {
    if (!(P.pos === 'v' ? e.pos === 'v' : P.pos === 'a' ? e.pos === 'a' : (e.pos === 'n' && g === P.g) || (untagged && P.any))) return;
    const m = (P.ro === 'ah' ? /ah?$/ : new RegExp(P.ro + '$')).exec(ro);
    if (!m) return;
    const stem = ro.slice(0, m.index);
    if ((P.st && !P.st.test(stem)) || (P.ur && !P.ur.test(e.ur)) || (!stem && P.pos !== 'v')) return;
    const base = P.pos === 'v' ? scholarRoToAscii(stem) + 'naa' : scholarRoToAscii(ro, e.ur), sa = scholarRoToAscii(stem);
    P.forms.forEach(([r, a]) => { if (r && (!untagged || /oñ$/.test(r))) out.push([stem + r, sa + a, base]); });   // (the bare stem is for lookup: بیچ → بیچنا)
  });
  return out;
}
/* The same table on the spelling the verified corpora (Pritchett's lists, the Rekhta poets') already know for a word: its vowels
   (muḥabbat, where Platts writes maḥabbat), with the endings the dictionary entry's part of speech and gender allow */
function knownForms(typed) {
  const t = formKey(String(typed).toLowerCase()), out = [];
  if (!/^[a-z]+$/.test(t) || typeof casualLookup !== 'function') return out;
  PARADIGMS.forEach(P => P.forms.forEach(([r, a]) => {
    const end = formKey('b' + r).slice(1);
    if (!r || !t.endsWith(end) || t.length - end.length < 2) return;
    (P.ro === 'ah' ? ['a', 'ah'] : [formKey('b' + P.ro).slice(1)]).forEach(l => {
      const stemTyped = t.slice(0, t.length - end.length) + l;
      const known = casualLookup(stemTyped, 0, 1) || (typeof rekhtaFallback === 'function' && rekhtaFallback(stemTyped));
      if (!known || !known.endsWith(P.asc) || /\s/.test(known)) return;
      const sa = known.slice(0, known.length - P.asc.length);
      if (P.sa && !P.sa.test(sa)) return;
      const entries = DICT_STORE.lookupDirect(asciiToScripts(known).ur || '');
      if (!entries.some(e => P.pos === 'v' ? e.pos === 'v' : e.pos !== 'v' && (P.pos === 'a' ? e.pos === 'a' : dictGender(e) !== (P.g === 'm' ? 'f' : 'm')))) return;
      if (!out.some(o => o.ascii === sa + a)) out.push({ ascii: sa + a, base: known, e: entries[0], known: true });
    });
  }));
  return out;
}

/* a form is trusted when the parser spells its dictionary word as the dictionary does */
const _formChecked = new Map();
function formChecked(f) {
  const k = f.base + '|' + f.e.ur;
  if (!_formChecked.has(k)) _formChecked.set(k, dictKeyUr(asciiToScripts(f.base).ur || '') === dictKeyUr(f.e.ur));
  return _formChecked.get(k);
}

/* The dictionary's fingerprint (the first 12 hex digits of data/dictionary_bundle.json.gz's SHA-1), stamped in by
   scripts/build_app.py. The copy saved in IndexedDB carries the fingerprint it was downloaded with: a rebuilt dictionary has a new
   one, so every browser downloads it again once, and an unchanged one is never downloaded twice. */
const DICT_BUNDLE_HASH = /*@@DICT_BUNDLE_HASH@@*/;

const DICT_STORE = {
  status: 'unloaded', // 'unloaded' | 'loading' | 'ready' | 'error'
  error: null,
  entries: null,
  indexUr: null,
  indexRo: null,
  source: 'handbook', // 'handbook' | 'lexicon'
  lexiconOrigin: 'all',
  loadPromise: null,

  async load() {
    if (this.status === 'ready') return this.entries;
    if (this.loadPromise) return this.loadPromise;

    this.status = 'loading';
    this.loadPromise = (async () => {
      try {
        const cached = await this.readFromIDB();
        if (cached && cached.hash === DICT_BUNDLE_HASH && Array.isArray(cached.data)) {
          this.initEntries(cached.data);
          this.status = 'ready';
          return this.entries;
        }

        const url = 'data/dictionary_bundle.json.gz?v=' + DICT_BUNDLE_HASH;   // the fingerprint keeps the HTTP cache honest too
        const res = await fetch(url);
        if (!res.ok) throw new Error('HTTP ' + res.status);

        /* gzip, unpacked by the browser (DecompressionStream: every current browser); the raw JSON is not deployed */
        const data = await new Response(res.body.pipeThrough(new DecompressionStream('gzip'))).json();

        this.initEntries(data);
        this.status = 'ready';
        this.saveToIDB(data).catch(() => {});
        return this.entries;
      } catch (err) {
        this.status = 'error';
        this.error = err.message || String(err);
        throw err;
      }
    })();
    return this.loadPromise;
  },

  /* the saved copy only, when it carries this build's fingerprint: nothing is downloaded. Transcribe opens with the dictionary a
     returning visitor already has (the forms, sound-alikes and underlines need it), without waiting for a click */
  async loadCached() {
    if (this.status !== 'unloaded') return this.status === 'ready';
    const cached = await this.readFromIDB();
    if (this.status !== 'unloaded' || !cached || cached.hash !== DICT_BUNDLE_HASH || !Array.isArray(cached.data)) return this.status === 'ready';
    this.initEntries(cached.data);
    this.status = 'ready';
    return true;
  },

  initEntries(data) {
    this.entries = data;
    this.indexUr = new Map();
    this.indexRo = new Map();
    this.indexRel = new Map();   // a word's Roman key → the entries that say they come from it (rel, scripts/build_dictionary_bundle.py)
    this._forms = null; this._readings = null;
    for (let i = 0; i < data.length; i++) {
      const e = data[i];
      e.pos = dictPos(e);
      if (e.ur) {
        const u = e.ur.normalize('NFC').replace(/[\u064B-\u065F\u0670\u0640]/g, '');
        const uFold = dictFoldUr(u);
        const keys = new Set([u, uFold, dictKeyUr(u)]);
        const uNoSpace = u.replace(/[\s\u200c\u200d\u200e\u200f\-]/g, '');
        const uFoldNoSpace = uFold.replace(/[\s\u200c\u200d\u200e\u200f\-]/g, '');
        if (uNoSpace) keys.add(uNoSpace);
        if (uFoldNoSpace) keys.add(uFoldNoSpace);
        keys.forEach(k => {
          let arr = this.indexUr.get(k);
          if (!arr) { arr = []; this.indexUr.set(k, arr); }
          if (!arr.includes(e)) arr.push(e);
        });
      }
      (e.rel || []).forEach(([, target]) => {
        const k = dictRoKey(target);
        if (!k) return;
        let arr = this.indexRel.get(k);
        if (!arr) this.indexRel.set(k, arr = []);
        if (!arr.includes(e)) arr.push(e);
      });
      if (e.ro) {
        const r = typeof casualKey === 'function' ? dictRoKey(e.ro) : e.ro.toLowerCase().replace(/[^a-z]/g, '');
        if (r) {
          let arr = this.indexRo.get(r);
          if (!arr) { arr = []; this.indexRo.set(r, arr); }
          arr.push(e);
        }
      }
    }
  },

  async openIDB() {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB unavailable'));
      ['urdu_bahr_lexicon_v1', 'urdu_bahr_lexicon_v2'].forEach(n => { try { indexedDB.deleteDatabase(n); } catch (e) {} });   // hand-versioned copies
      const req = indexedDB.open('urdu_bahr_lexicon', 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('bundle')) db.createObjectStore('bundle');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  async readFromIDB() {
    try {
      const db = await this.openIDB();
      return new Promise(resolve => {
        const tx = db.transaction('bundle', 'readonly');
        const req = tx.objectStore('bundle').get('all');
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      return null;
    }
  },

  async saveToIDB(data) {
    try {
      const db = await this.openIDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('bundle', 'readwrite');
        tx.objectStore('bundle').put({ hash: DICT_BUNDLE_HASH, data }, 'all');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {}
  },

  /* typed key → the regular forms of dictionary words it can be: built once, on first use */
  formIndex() {
    if (this._forms || !this.entries) return this._forms || null;
    const idx = this._forms = new Map();
    this.entries.forEach(e => {
      if (e.dict !== 'Platts' || !e.pos) return;
      dictEntryForms(e).forEach(([ro, ascii, base]) => {
        formKeys(ro).forEach(k => {
          let arr = idx.get(k);
          if (!arr) idx.set(k, arr = []);
          if (!arr.some(f => f.ascii === ascii && f.e.ur === e.ur)) arr.push({ ro, ascii, base, e });   // one form per entry spelling: checked later
        });
      });
    });
    return idx;
  },

  /* the dictionary forms a typed word can be, trusted ones only, likeliest first: a word the verified corpora use, then the one
     Platts lists more phrases under */
  formsFor(typed) {
    const idx = this.formIndex();
    if (!idx || !typed) return [];
    /* ranked by how close the form's Roman is to what was typed, then the corpora's own spelling of the word (their vowels:
       muḥabbat, not Platts' maḥabbat), then a word the corpora use, then the one Platts lists more phrases under */
    const seen = f => typeof wordAscii === 'function' && !!wordAscii(asciiToScripts(f.base).ur || '');
    const all = knownForms(typed);
    (idx.get(formKey(typed)) || []).filter(formChecked).forEach(f => { if (!all.some(o => o.ascii === f.ascii)) all.push(f); });
    all.forEach(f => {
      f.dist = typedDistance(typed, f.ro || asciiToScripts(f.ascii).ro || '');
      f.score = (f.known ? 200 : 0) + (seen(f) ? 100 : 0) + Math.min(((f.e && f.e.phrases) || []).length, 15);
    });
    return all.sort((a, b) => a.dist - b.dist || b.score - a.score);
  },

  /* an entry (or a verb's stem) in the app's own spelling: its Roman through the ASCII scheme and Pue's parsers, kept only if that
     rebuilds the entry's Urdu (a reading must be of the same spelling); {ur, ro, hi} or null */
  spelled(ro, ur) {
    const sc = asciiToScripts(scholarRoToAscii(ro, ur));
    return sc.ur && dictKeyUr(sc.ur) === dictKeyUr(ur) ? sc : null;
  },

  /* The readings one Urdu spelling has: its Platts headwords, and the stem of a verb spelled so (بیچ: bīch, and bech of bećnā).
     Devanagari tells them apart where Urdu script does not. Commonest first (most phrases listed); one per distinct reading. */
  readingsOf(ur) {
    if (!ur || !this.indexUr) return [];
    this._readings = this._readings || new Map();
    if (this._readings.has(ur)) return this._readings.get(ur);
    const found = [];
    this.lookupDirect(ur).filter(e => e.dict === 'Platts' && !/[\s-]/.test(e.ro)).forEach(e => found.push([e.ro, e.ur, (e.phrases || []).length]));
    this.lookupDirect(dictFoldUr(ur) + 'نا').filter(e => e.pos === 'v' && /nā$/.test(e.ro))
      .forEach(e => found.push([e.ro.slice(0, -2), e.ur.replace(/نا$/, ''), (e.phrases || []).length + 1]));
    const out = [];
    found.sort((a, b) => b[2] - a[2]).forEach(([ro, eur]) => {
      const sc = this.spelled(ro, eur);
      if (sc && dictFoldUr(sc.ur) === dictFoldUr(ur) && !out.some(o => typedKey(o.ro) === typedKey(sc.ro))) out.push(sc);
    });
    this._readings.set(ur, out);
    return out;
  },

  /* Other spellings of the sound typed (sada: صدا ṣadā, سدا sadā; kismat: قسمت; faasla: فاصلہ fāṣila): the typed key, with one
     short vowel restored or dropped (shortVowelVariants) and k ~ q; closest to what was typed first, then commonest (byScore: by
     the score below, for a word nothing else reads). Fallon's folk headwords are not offered (tests/benchmark_transcribe.js: calm) */
  soundsLike(typed, byScore) {
    const t = String(typed || '').toLowerCase();
    if (!this.indexRo || !/^[a-zāīū]+$/.test(t)) return [];
    const keys = new Set([dictRoKey(t)]);
    shortVowelVariants(t).concat([t.replace(/k/g, 'q'), t.replace(/q/g, 'k')]).forEach(v => { if (v !== t) keys.add(dictRoKey(v)); });
    const hits = [];
    keys.forEach(k => (this.indexRo.get(k) || []).forEach(e => { if (e.ur && e.dict !== 'Fallon' && !/[\s-]/.test(e.ro)) hits.push(e); }));
    const out = [];
    /* one score, lowest first: the distance from what was typed (twice: consonants and short vowels), with vowel length (once), less
       two for a word the verified corpora use, so a common word one dropped vowel away (faasla: fāṣila) beats a rare exact one
       (Steingass's fasla); ties go to the commoner by phrases listed */
    const strict = r => editDistance(casualKey(t, 0), casualKey(String(r).replace(/[ʻʼ]/g, ''), 0));
    const used = e => typeof wordAscii === 'function' && !!wordAscii(e.ur) ? 1 : 0;
    hits.map(e => ({ e, score: byScore ? 2 * typedDistance(t, e.ro) + strict(e.ro) - 2 * used(e) : typedDistance(t, e.ro), n: (e.phrases || []).length }))
      .sort((a, b) => a.score - b.score || b.n - a.n).forEach(({ e }) => {
      const sc = this.spelled(e.ro, e.ur);
      if (sc && !out.some(o => dictFoldUr(o.ur) === dictFoldUr(sc.ur))) out.push(sc);
    });
    return out;
  },

  /* an Urdu spelling the Urdu dictionaries have as a headword (Platts or Fallon), not one only Steingass' Persian lists */
  isUrduWord(ur) {
    if (!ur || !this.indexUr) return false;
    this._urduWord = this._urduWord || new Map();
    if (!this._urduWord.has(ur)) {
      const f = dictFoldUr(ur);
      this._urduWord.set(ur, this.lookupDirect(ur).some(e => e.dict !== 'Steingass' && dictFoldUr(e.ur) === f));
    }
    return this._urduWord.get(ur);
  },

  /* The entries a spelling names, without inflection: its exact Urdu (folded, unspaced, the looser key) or its typed Roman */
  lookupDirect(word) {
    const out = [];
    const push = arr => arr && arr.forEach(e => { if (!out.includes(e)) out.push(e); });
    const uNorm = word.normalize('NFC').replace(/[ً-ٰٟـ]/g, ''), uFold = dictFoldUr(uNorm);
    if (this.indexUr) [uNorm, uFold, uNorm.replace(/[\s‌‍‎‏\-]/g, ''), uFold.replace(/[\s‌‍‎‏\-]/g, ''), dictKeyUr(uNorm)]
      .forEach(k => k && push(this.indexUr.get(k)));
    const rKey = typeof casualKey === 'function' ? dictRoKey(word) : word.toLowerCase().replace(/[^a-z]/g, '');
    if (rKey && this.indexRo) push(this.indexRo.get(rKey));
    if (!out.length && /[زذ]/.test(uFold) && this.indexUr) push(this.indexUr.get(dictKeyUr(uFold.replace(/[زذ]/g, c => c === 'ز' ? 'ذ' : 'ز'))));   // گزر = Platts' گذر
    return out;
  },

  /* Every reading of a word, in tiers: the word itself, then the dictionary words it can be an inflection of (a bare verb stem
     is also its infinitive: بیچ is bīch and bećnā's stem), then, for a compound nothing names whole, its parts */
  /* A word's family, as the dictionaries record it: the words its entries say they come from (hār → hārnā, ajzā → juz) and the
     entries that say they come from it (hārnā → hār "defeat", ćalnā → ćalānā). Each entry's rel names the other word in Roman. */
  family(entries) {
    const out = [];
    const push = e => { if (!entries.includes(e) && !out.includes(e)) out.push(e); };
    entries.forEach(e => {
      (e.rel || []).forEach(([, target]) => (this.indexRo.get(dictRoKey(target)) || []).forEach(push));
      (this.indexRel.get(dictRoKey(e.ro)) || []).forEach(push);
    });
    return out;
  },

  lookup(word, _depth, opts) {
    if (!this.entries || !word || (_depth || 0) > 1) return [];
    opts = opts || {};
    word = String(word).trim();
    const results = [], tier = new Map(), seen = new Set();
    const add = (e, t) => {
      const k = e.ur + '|' + e.ro + '|' + (e.origin || '') + '|' + (e.def ? e.def.slice(0, 30) : '');
      if (!seen.has(k)) { seen.add(k); results.push(e); tier.set(e, t); }
    };
    this.lookupDirect(word).forEach(e => add(e, e.dict === 'Fallon' ? 1.5 : 0));   // Fallon, a supplement, ranks after the inflection tier too (samjhe!: not before samajhnā)
    /* the dictionary words an inflection can come from, each kept only with the part of speech its ending allows, then ranked:
       a word the verified corpora use first (رات before the verb راتنا), an attested verb before an attested participle entry
       (دیکھے: دیکھنا before دیکھا), then the commoner word by how many phrases Platts lists under it (ستارہ before ستار) */
    const cands = dictLemmas(word).map(([form, pos], i) => ({ form, i, verb: pos === 'v',
      hits: this.lookupDirect(form).filter(e => pos === 'v' ? e.pos === 'v' || (!e.pos && /(?:نا|na|nā)$/.test(form)) : !pos || !e.pos || e.pos !== 'v') }))
      .filter(c => c.hits.length);
    const seenInCorpus = f => !/[a-z]/i.test(f) && typeof wordAscii === 'function' && !!wordAscii(f);
    cands.forEach(c => {
      const seen = seenInCorpus(c.form), phrases = Math.max(...c.hits.map(e => e.dict === 'Fallon' ? 0 : (e.phrases || []).length));   // Platts' count: Fallon lists phrases under common words too
      const rank = (opts.verbFirst && c.verb ? -1 : 1) - (seen ? 0.5 : 0) - (seen && c.verb ? 0.3 : 0) - Math.min(phrases, 15) / 100 + c.i / 1000;
      c.hits.forEach(e => add(e, rank));
    });
    /* the family of the word's entries and dictionary words, after them; when the reading is a verb's form (opts.verbFirst:
       the drawer's hārī, of hārnā) the verb leads and its family follows it, before the same spelling's other headwords */
    if (results.length && !(_depth || 0)) {
      const base = results.slice().sort((a, b) => tier.get(a) - tier.get(b)).slice(0, 8);   // the likeliest readings' families first
      let added = 0;
      base.forEach(b => this.family([b]).filter(e => !tier.has(e)).slice(0, 3).forEach(e => {
        if (added++ < 10) add(e, tier.get(b) < 0 ? tier.get(b) + 0.5 : 1.9);
      }));
    }
    if (!results.length && (word.includes('-') || /[\sِ]/.test(word))) {
      word.split(/-(?:e|ye|o)-|[-_\sِ]+/).filter(Boolean).forEach(part => {
        if (!/^(e|ye|o|va)$/i.test(part)) this.lookup(part, (_depth || 0) + 1).forEach(e => add(e, 2));
      });
    }
    const uFold = dictFoldUr(word.normalize('NFC').replace(/[ً-ٰٟـ]/g, ''));
    if (results.length > 1) {
      const wClean = word.toLowerCase().replace(/[^a-z]/g, '');
      const orgWeights = { A: 30, P: 30, H: 30, T: 25, S: 0 };
      results.sort((a, b) => {
        if (tier.get(a) !== tier.get(b)) return tier.get(a) - tier.get(b);
        if (wClean) {
          const exactA = (a.ro && a.ro.toLowerCase().replace(/[^a-z]/g, '') === wClean);
          const exactB = (b.ro && b.ro.toLowerCase().replace(/[^a-z]/g, '') === wClean);
          if (exactA !== exactB) return exactA ? -1 : 1;
        }
        const exactUrA = (a.ur === word || dictFoldUr(a.ur) === uFold);
        const exactUrB = (b.ur === word || dictFoldUr(b.ur) === uFold);
        if (exactUrA !== exactUrB) return exactUrA ? -1 : 1;

        const isStubA = /^(=\s|See\s|\(.*cf\.)/i.test(a.def || '') || /cf\.\s+[PAH]\./i.test((a.def || '').slice(0, 35));
        const isStubB = /^(=\s|See\s|\(.*cf\.)/i.test(b.def || '') || /cf\.\s+[PAH]\./i.test((b.def || '').slice(0, 35));
        if (isStubA !== isStubB) return isStubA ? 1 : -1;

        const fallA = a.dict === 'Fallon' ? 1 : 0, fallB = b.dict === 'Fallon' ? 1 : 0;   // the supplement: after Platts and Steingass, whatever the origin
        if (fallA !== fallB) return fallA - fallB;

        const owA = orgWeights[a.origin] || 10;
        const owB = orgWeights[b.origin] || 10;
        if (owA !== owB) return owB - owA;

        const hypA = (a.ro && a.ro.includes('-') && !word.includes('-')) ? 1 : 0;
        const hypB = (b.ro && b.ro.includes('-') && !word.includes('-')) ? 1 : 0;
        if (hypA !== hypB) return hypA - hypB;

        return (b.def ? b.def.length : 0) - (a.def ? a.def.length : 0);
      });
    }

    return results;
  }
};
if (typeof window !== 'undefined') window.DICT_STORE = DICT_STORE;

function filterLexiconOrigin(origin) {
  DICT_STORE.lexiconOrigin = origin;
  ['All', 'P', 'A', 'S', 'H'].forEach(k => {
    const btn = $('lexTag' + k);
    if (btn) btn.classList.toggle('on', origin.toLowerCase() === k.toLowerCase());
  });
  renderLexiconSection();
}

let currentLexQuery = '';
function onLexiconSearch() {
  const input = $('lexSearchInput');
  currentLexQuery = input ? input.value : '';
  renderLexiconSection();
}

function triggerLoadDictionary() {
  DICT_STORE.load().then(() => {
    renderLexiconSection();
    if (typeof trRender === 'function') trRender();
  }).catch(err => {
    renderLexiconSection();
  });
  renderLexiconSection();
}

/* Render the dedicated Classical Dictionary page (#lexList on #dictionary-section) */
function renderLexiconSection() {
  const list = $('lexList');
  if (!list) return;

  if (DICT_STORE.status === 'unloaded') {
    list.innerHTML = `
      <div class="card dict-load-card">
        <h3 class="dict-load-title">📚 Platts, Fallon &amp; Steingass Classical Lexicon</h3>
        <p class="dim small dict-load-note">
          144,850 classical headwords with definitions, etymology (Arabic, Persian, Sanskrit, Hindi), and 28,300+ idioms.
          Downloads compressed (<strong>8.7 MB</strong>) once and stays cached in your browser's local storage permanently.
        </p>
        <button type="button" class="btn sm" onclick="triggerLoadDictionary()">⬇️ Load Classical Lexicon (8.7 MB)</button>
      </div>
    `;
    return;
  }

  if (DICT_STORE.status === 'loading') {
    list.innerHTML = `
      <div class="card dict-load-card">
        <div class="dim small">Downloading and indexing 144,850 classical dictionary entries…</div>
      </div>
    `;
    return;
  }

  if (DICT_STORE.status === 'error') {
    list.innerHTML = `
      <div class="card dict-load-card">
        <div class="small dict-load-error">Failed to load lexicon: ${escapeHtml(DICT_STORE.error)}</div>
        <button type="button" class="btn sm" onclick="triggerLoadDictionary()">Retry Download</button>
      </div>
    `;
    return;
  }

  const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
  const q = currentLexQuery.toLowerCase().trim();
  const qCasual = typeof casualKey === 'function' ? casualKey(q, 1) : q.replace(/[^a-z]/g, '');
  const org = DICT_STORE.lexiconOrigin;

  let results = [];
  let compoundNote = '';
  if (q) {
    const qClean = q.replace(/[^a-z]/g, '');
    const qUrFold = dictFoldUr(q);
    const orgWeights = { A: 30, P: 30, H: 30, T: 25, S: 0 };
    results = DICT_STORE.entries.filter(e => {
      if (org !== 'all' && e.origin !== org) return false;
      if (e.ur && e.ur.includes(q)) return true;
      if (e.ro && e.ro.toLowerCase().includes(q)) return true;
      if (qCasual && e.ro && casualKey(e.ro, 1).includes(qCasual)) return true;
      if (e.hi && e.hi.includes(q)) return true;
      if (e.def && e.def.toLowerCase().includes(q)) return true;
      return false;
    });

    if (results.length === 0 && (q.includes('-') || /[\s\u0650]/.test(q))) {
      const qParts = q.split(/-(?:e|ye|o)-|[-_\s\u0650]+/).filter(Boolean);
      const seenComp = new Set();
      qParts.forEach(part => {
        if (/^(e|ye|o|va)$/i.test(part)) return;
        const subHits = DICT_STORE.lookup(part);
        subHits.forEach(e => {
          if (org !== 'all' && e.origin !== org) return;
          const k = e.ur + '|' + e.ro + '|' + (e.origin || '');
          if (!seenComp.has(k)) {
            seenComp.add(k);
            results.push(e);
          }
        });
      });
      if (results.length > 0) {
        compoundNote = `<div class="dim small tr-dict-morph">Showing constituent entries for compound query ‘${escapeHtml(q)}’</div>`;
      }
    }

    results.sort((a, b) => {
      function score(e) {
        let s = 0;
        const uFold = dictFoldUr(e.ur);
        if (e.ur === q || uFold === qUrFold) s += 100;
        else if (e.ur && e.ur.startsWith(q)) s += 40;

        if (qClean && e.ro && e.ro.toLowerCase().replace(/[^a-z]/g, '') === qClean) s += 80;
        else if (qCasual && e.ro && typeof casualKey === 'function' && casualKey(e.ro, 1) === qCasual) s += 60;
        else if (e.ro && e.ro.toLowerCase().startsWith(q)) s += 30;

        if (org === 'all') s += (orgWeights[e.origin] || 10);
        if (e.ro && e.ro.includes('-') && !q.includes('-')) s -= 15;
        if (/^(=\s|See\s|\(.*cf\.)/i.test(e.def || '')) s -= 40;
        if (e.dict === 'Fallon') s -= 5;
        s += Math.min(10, Math.floor((e.def ? e.def.length : 0) / 40));
        return s;
      }
      return score(b) - score(a);
    });
  } else {
    results = org === 'all' ? DICT_STORE.entries : DICT_STORE.entries.filter(e => e.origin === org);
  }

  if (results.length === 0) {
    list.innerHTML = `<div class="dict-empty dim small">${q ? `No classical words match ‘${escapeHtml(q)}’.` : 'No entries found.'}</div>`;
    return;
  }

  const scriptClass = (cs === 'ur') ? 'urdu' : ((cs === 'hi') ? 'deva' : 'mono');
  const langDirAttr = (cs === 'ur') ? 'lang="ur" dir="rtl"' : ((cs === 'hi') ? 'lang="hi"' : 'lang="ur-Latn" dir="ltr"');

  list.innerHTML = compoundNote + results.slice(0, 100).map(e => {
    const dispWord = cs === 'hi' ? (e.hi || e.ro) : (cs === 'ro' ? e.ro : e.ur);
    const orgLabel = DICT_ORIGIN_NAMES[e.origin] || e.origin || '';
    const badgeCls = e.origin && ('origin-' + e.origin) in { 'origin-P': 1, 'origin-A': 1, 'origin-S': 1, 'origin-H': 1 } ? 'origin-' + e.origin : 'origin-default';
    const dictSrc = e.dict || (e.page ? 'Platts' : 'Steingass');
    const dictBadge = `<span class="dict-lex-badge dict-source-${dictSrc.toLowerCase()}">${escapeHtml(dictSrc)}</span>`;
    const pageHtml = e.page ? `<span class="dict-lex-page">p. ${e.page}</span>` : '';
    const phrasesHtml = (e.phrases && e.phrases.length) ? `
      <div class="dict-lex-phrases">
        ${e.phrases.slice(0, 4).map(ph => `<div class="dict-lex-phr-item"><span class="dict-lex-phr-ro">${escapeHtml(ph.ro)}</span>: ${escapeHtml(ph.def)}</div>`).join('')}
      </div>
    ` : '';

    return `
      <div class="dict-lex-entry">
        <div class="dict-lex-head">
          <span class="dict-word ${scriptClass}" ${langDirAttr}>${escapeHtml(dispWord)}</span>
          <span class="mono dim dict-lex-ro">${escapeHtml(e.ro)}</span>
          ${dictBadge}
          ${orgLabel ? `<span class="dict-lex-badge ${badgeCls}">${orgLabel}</span>` : ''}
          ${pageHtml}
        </div>
        ${e.def ? `<div class="dict-lex-def">${escapeHtml(e.def)}</div>` : ''}
        ${phrasesHtml}
      </div>
    `;
  }).join('');
}

