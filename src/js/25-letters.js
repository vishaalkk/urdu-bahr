/* ================= LETTERS (#/letters) =================
   Every letter and mark the Transliterator reads, with the Roman and the other script it writes for it, and one word that
   shows the sound. Urdu follows Pritchett's Roman (her ASCII is what Pue's parsers read); Punjabi, Saraiki and the Arabic
   spellings follow the Library of Congress tables (ALA-LC: Sindhi 2024 for the implosives, Urdu 2013 for tā marbūṭa and
   tanvīn); Devanagari is read as Urdu says the word (Platts' readings). Each example's Roman and other script are not typed
   here: they are written by the engine from `xa` (Pritchett ASCII) when the page renders, so the page cannot drift from it.
   tests/letters_page.js checks that each example, read as written, gives that Roman (`guess`: an unwritten vowel the reader
   cannot know; then only the row's own letter is checked). */
/* a function, not a var: the router can render #/letters while the page's script is still loading, before a var below
   would be assigned (a function declaration is hoisted whole) */
var LETTER_GROUPS_CACHE = null;
function letterGroups() { return LETTER_GROUPS_CACHE || (LETTER_GROUPS_CACHE = [
  { id: 'urdu', title: 'Urdu', lang: 'ur',
    note: 'The alphabet, with the Roman Frances Pritchett uses in her Urdu Meter handbook and the Ghalib and Mir corpora. Short vowels are not written; the Roman supplies them.',
    rows: [
      ['ا', 'alif', 'ā, a', 'आ, अ', 'a', 'اب', 'ab', 'now'],
      ['ب', 'be', 'b', 'ब', 'b', 'بات', 'baat', 'word'],
      ['پ', 'pe', 'p', 'प', 'p', 'پانی', 'paanii', 'water'],
      ['ت', 'te', 't', 'त', 't', 'تارا', 'taaraa', 'star'],
      ['ٹ', 'ṭe', 'ṭ', 'ट', ';t', 'ٹوٹا', ';tuu;taa', 'broken'],
      ['ث', 'ṡe', 'ṡ', 'स', ';s', 'ثابت', ';saabit', 'proven'],
      ['ج', 'jīm', 'j', 'ज', 'j', 'جان', 'jaan', 'life'],
      ['چ', 'che', 'ch', 'च', 'ch', 'چاند', 'chaa;nd', 'moon'],
      ['ح', 'baṛī ḥe', 'ḥ', 'ह', ';h', 'حال', ';haal', 'state'],
      ['خ', 'ḳhe', 'ḳh', 'ख़', ';x', 'خواب', ';xvaab', 'dream'],
      ['د', 'dāl', 'd', 'द', 'd', 'دل', 'dil', 'heart'],
      ['ڈ', 'ḍāl', 'ḍ', 'ड', ';d', 'ڈر', ';dar', 'fear'],
      ['ذ', 'żāl', 'ż', 'ज़', ';z', 'ذرا', ';zaraa', 'a little'],
      ['ر', 're', 'r', 'र', 'r', 'رات', 'raat', 'night'],
      ['ڑ', 'ṛe', 'ṛ', 'ड़', ';r', 'پڑھنا', 'pa;rhnaa', 'to read'],
      ['ز', 'ze', 'z', 'ज़', 'z', 'زمین', 'zamiin', 'earth'],
      ['ژ', 'zhe', 'zh', 'झ़', 'zh', 'ژالہ', 'zhaalah', 'hail'],
      ['س', 'sīn', 's', 'स', 's', 'سال', 'saal', 'year'],
      ['ش', 'shīn', 'sh', 'श', 'sh', 'شام', 'shaam', 'evening'],
      ['ص', 'ṣvād', 'ṣ', 'स', '.s', 'صبح', '.sub;h', 'morning'],
      ['ض', 'ẓvād', 'ẓ', 'ज़', '.z', 'ضرور', '.zaruur', 'surely'],
      ['ط', 't̤oʾe', 't̤', 'त', ':t', 'طرف', ':taraf', 'side'],
      ['ظ', 'z̤oʾe', 'z̤', 'ज़', ':z', 'ظالم', ':zaalim', 'cruel'],
      ['ع', 'ʿain', 'ʿ', '—', '((', 'عشق', '((ishq', 'love'],
      ['غ', 'ġhain', 'ġh', 'ग़', ';g', 'غم', ';gam', 'grief'],
      ['ف', 'fe', 'f', 'फ़', 'f', 'فلک', 'falak', 'sky'],
      ['ق', 'qāf', 'q', 'क़', 'q', 'قدم', 'qadam', 'step'],
      ['ک', 'kāf', 'k', 'क', 'k', 'کتاب', 'kitaab', 'book'],
      ['گ', 'gāf', 'g', 'ग', 'g', 'گل', 'gul', 'rose'],
      ['ل', 'lām', 'l', 'ल', 'l', 'لب', 'lab', 'lip'],
      ['م', 'mīm', 'm', 'म', 'm', 'مے', 'mai', 'wine'],
      ['ن', 'nūn', 'n', 'न', 'n', 'نام', 'naam', 'name'],
      ['ں', 'nūn ġhunnah', 'ñ', 'ँ, ं', ';n', 'ماں', 'maa;n', 'mother'],
      ['و', 'vāʾo', 'v, o, ū, au', 'व, ओ, ऊ, औ', 'v', 'وقت', 'vaqt', 'time'],
      ['ہ', 'choṭī he', 'h', 'ह', 'h', 'ہاتھ', 'haath', 'hand'],
      ['ھ', 'do-chashmī he', 'h (aspirates the letter before)', 'भ, फ, थ …', 'h', 'بھائی', 'bhaa))ii', 'brother'],
      ['ء', 'hamzah', 'ʾ', '—', '))', 'نئی', 'na))ii', 'new'],
      ['ی', 'choṭī ye', 'y, ī', 'य, ई', 'y', 'یار', 'yaar', 'friend'],
      ['ے', 'baṛī ye', 'e, ai', 'ए, ऐ', 'e', 'سے', 'se', 'from']
    ] },
  { id: 'aspirates', title: 'Aspirates', lang: 'ur',
    note: 'A consonant with do-chashmī he (ھ) is one sound, breathed: one letter in Devanagari, the consonant and h in Roman.',
    rows: [
      ['بھ', '', 'bh', 'भ', 'bh', 'بھائی', 'bhaa))ii', 'brother'],
      ['پھ', '', 'ph', 'फ', 'ph', 'پھول', 'phuul', 'flower'],
      ['تھ', '', 'th', 'थ', 'th', 'ہاتھ', 'haath', 'hand'],
      ['ٹھ', '', 'ṭh', 'ठ', ';th', 'ٹھیک', ';thiik', 'right'],
      ['جھ', '', 'jh', 'झ', 'jh', 'جھوٹ', 'jhuu;t', 'a lie'],
      ['چھ', '', 'chh', 'छ', 'chh', 'کچھ', 'kuchh', 'some'],
      ['دھ', '', 'dh', 'ध', 'dh', 'دھوپ', 'dhuup', 'sunshine'],
      ['ڈھ', '', 'ḍh', 'ढ', ';dh', 'ڈھول', ';dhol', 'drum'],
      ['ڑھ', '', 'ṛh', 'ढ़', ';rh', 'پڑھنا', 'pa;rhnaa', 'to read'],
      ['کھ', '', 'kh', 'ख', 'kh', 'آنکھ', 'aa;nkh', 'eye'],
      ['گھ', '', 'gh', 'घ', 'gh', 'گھر', 'ghar', 'house']
    ] },
  { id: 'marks', title: 'Vowel marks and signs', lang: 'ur',
    note: 'Usually left unwritten. Where a text writes them, the reader takes them as written.',
    rows: [
      ['◌َ', 'zabar', 'a', '(none)', 'a', 'دَم', 'dam', 'breath'],
      ['◌ِ', 'zer', 'i', 'ि', 'i', 'دِل', 'dil', 'heart'],
      ['◌ُ', 'pesh', 'u', 'ु', 'u', 'گُل', 'gul', 'rose'],
      ['◌ْ', 'jazm', '(no vowel)', '्', '', 'صَبْر', '.sabr', 'patience'],
      ['◌ّ', 'tashdīd', '(the letter doubled)', '्', '', 'مُحَبَّت', 'mu;habbat', 'love'],
      ['آ', 'alif maddah', 'ā', 'आ', 'aa', 'آنکھ', 'aa;nkh', 'eye'],
      ['◌ً', 'tanvīn', 'aṅ (Pritchett\u2019s; ALA-LC an)', 'न', ':n', 'فوراً', 'faura:n', 'at once'],
      ['◌ِ ۂ', 'iẓāfat', '-e', '-ए', '-e', 'دلِ ناداں', 'dil-e naadaa;n', 'the foolish heart']
    ] },
  { id: 'punjabi', title: 'Punjabi', lang: 'pnb',
    note: 'Shahmukhi adds two retroflex letters. Many texts write them with ن and ل instead (or ṇ as نڑ); the reader takes the letter only where it is written.',
    rows: [
      ['ݨ', 'ṇūn', 'ṇ', 'ण', '.n', 'پاݨی', 'paa.nii', 'water'],
      ['ݪ', 'ḷām', 'ḷ', 'ळ', '.l', 'کاݪا', 'kaa.laa', 'black']
    ] },
  { id: 'saraiki', title: 'Saraiki', lang: 'skr',
    note: 'Four implosive stops, said with the breath drawn in, and ݨ for ṇ. The Roman is the Library of Congress’s (b̤ d̤ g̈; its cell for ڄ is blank, so j̈ follows g̈). Typed Roman may use the IPA letters ɓ ʄ ɗ ɠ instead.',
    rows: [
      ['ٻ', 'ɓe', 'b̤', 'ॿ', '.b', 'ٻال', '.baal', 'child'],
      ['ڄ', 'ʄīm', 'j̈', 'ॼ', '.j', 'ڄم', '.jam', 'born'],
      ['ݙ', 'ɗāl', 'd̤', 'ॾ', '.d', 'میݙا', 'me.daa', 'my', true],
      ['ڳ', 'ɠāf', 'g̈', 'ॻ', '.g', 'ڳالھ', '.gaalh', 'talk, word']
    ] },
  { id: 'arabic', title: 'Arabic spellings', lang: 'ar',
    note: 'Arabic phrases in hamd, naʿt and qawwali keep Arabic letters and marks. Tā marbūṭa and tanvīn read as the Library of Congress’s Urdu table reads them.',
    rows: [
      ['ة ۃ', 'tā marbūṭah', 't', 'त', 't', 'صلاة', '.salaat', 'prayer'],
      ['ى', 'alif maqṣūrah', 'ā (after a zabar)', 'ा', 'aa', 'هُدَى', 'hudaa', 'guidance'],
      ['وٰ', 'vāʾo with khaṛā zabar', 'ā', 'ा', 'aa', 'زکوٰۃ', 'zakaat', 'alms'],
      ['ٱ', 'alif waṣlah', 'a (of al-)', 'अ', 'a', 'ٱلْحَمْدُ', 'al;hamdu', 'praise'],
      ['أ إ', 'hamzah on alif', 'a, i', 'अ, इ', 'a', 'إسلام', 'islaam', 'Islam'],
      ['ؤ', 'hamzah on vāʾo', 'oʾ', 'ओ', 'o))', 'مؤمن', 'mo))min', 'believer', true],
      ['◌ٌ ◌ٍ', 'tanvīn', 'un, in', 'उन, इन', 'un', 'رَحْمَةٌ', 'ra;hmatun', 'mercy']
    ] },
  { id: 'devanagari', title: 'Devanagari: Hindi, Braj, Avadhi', lang: 'hi', other: 'ur',
    note: 'Typed in Devanagari, a word is read as Urdu says it. A consonant with no vowel sign has its a, dropped where Hindi drops it.',
    rows: [
      ['◌', '(no vowel sign)', 'a, or none', '—', 'a', 'नैनन', 'nainan', 'eyes (Braj)'],
      ['ण', 'ṇa', 'n', 'ن', 'n', 'गुण', 'gun', 'virtue'],
      ['ष', 'ṣa', 'sh', 'ش', 'sh', 'भाषा', 'bhaashaa', 'language'],
      ['ऋ ◌ृ', 'r̥', 'ri', 'ر', 'ri', 'कृष्ण', 'krishn', 'Krishna'],
      ['ज्ञ', 'jña', 'gy', 'گی', 'gy', 'ज्ञान', 'gyaan', 'knowledge'],
      ['◌ं', 'anusvār', 'n before a consonant', 'ن', 'n', 'रंग', 'rang', 'colour'],
      ['◌ँ', 'chandrabindu', 'ñ', 'ں', ';n', 'आँख', 'aa;nkh', 'eye'],
      ['◌ः', 'visarg', '(silent)', '—', '', 'दुःख', 'dukh', 'sorrow'],
      ['ऽ', 'avagrah', '(dropped)', '—', '', 'सोऽहम्', 'soham', 'I am He'],
      ['ॐ', 'om', 'om', 'اوم', 'om', 'ॐ', 'om', 'om']
    ] }
]); }

/* one row's parts: [glyph, name, Roman, other script, ASCII, example, example ASCII, meaning, guess] */
function letterRow(r, g) {
  var o = (typeof asciiToScripts === 'function') ? asciiToScripts(r[6]) : { ro: '', hi: '', ur: '' };
  return { glyph: r[0], name: r[1], ro: r[2], other: r[3], ascii: r[4], ex: r[5], xa: r[6], gloss: r[7], guess: !!r[8],
    exRo: o.ro || '', exOther: g.other === 'ur' ? (o.ur || '') : (o.hi || '') };
}

function lettersHtml() {
  var esc = typeof escapeHtml === 'function' ? escapeHtml : function (s) { return String(s); };
  return letterGroups().map(function (g) {
    var scriptAttr = g.lang === 'hi' ? 'lang="hi" dir="ltr"' : 'lang="' + g.lang + '" dir="rtl"';
    var otherAttr = g.other === 'ur' ? 'lang="ur" dir="rtl"' : 'lang="hi" dir="ltr"';
    var gCls = g.lang === 'hi' ? 'lt-deva' : 'lt-arab', oCls = g.other === 'ur' ? 'lt-arab' : 'lt-deva';
    var rows = g.rows.map(function (raw) {
      var r = letterRow(raw, g);
      return '<tr>' +
        '<td class="lt-glyph ' + gCls + '" ' + scriptAttr + '>' + esc(r.glyph) + '</td>' +
        '<td class="lt-ro" lang="ur-Latn">' + esc(r.ro) + '</td>' +
        '<td class="lt-other ' + oCls + '" ' + otherAttr + '>' + esc(r.other) + '</td>' +
        '<td class="lt-name">' + (r.name ? '<span class="lt-name-t">' + esc(r.name) + '</span>' : '') +
          (r.ascii ? '<span class="lt-ascii" title="Pritchett ASCII">' + esc(r.ascii) + '</span>' : '') + '</td>' +
        '<td class="lt-ex"><div class="lt-ex-line"><span class="lt-ex-src ' + gCls + '" ' + scriptAttr + '>' + esc(r.ex) + '</span>' +
          '<span class="lt-ex-ro" lang="ur-Latn">' + esc(r.exRo) + '</span>' +
          (r.exOther ? '<span class="lt-ex-other ' + oCls + '" ' + otherAttr + '>' + esc(r.exOther) + '</span>' : '') +
          '<span class="lt-ex-gl">' + esc(r.gloss) + (r.guess ? ' <span class="lt-guess">(vowel unwritten)</span>' : '') + '</span></div></td>' +
        '</tr>';
    }).join('');
    /* a div, not a <section>: the router hides every section on the page before it shows the active view */
    return '<div class="lt-group" role="region" id="lt-' + g.id + '" aria-labelledby="lt-h-' + g.id + '">' +
      '<h2 class="group-title lt-title" id="lt-h-' + g.id + '" tabindex="-1">' + esc(g.title) + '</h2>' +
      '<p class="lt-note">' + esc(g.note) + '</p>' +
      '<table class="lt-table"><thead><tr><th scope="col">Letter</th><th scope="col">Roman</th><th scope="col">' +
        (g.other === 'ur' ? 'Urdu' : 'Devanagari') + '</th><th scope="col">Name</th><th scope="col">Example</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table></div>';
  }).join('');
}

function renderLetters() {
  var host = typeof $ === 'function' ? $('lettersBody') : null;
  if (!host) return;
  if (!host.dataset || host.dataset.built !== '1') {
    host.innerHTML = lettersHtml();
    if (host.dataset) host.dataset.built = '1';
  }
}

/* ?g=<group>: jump straight to the group (no long animated scroll past hundreds of rows), focus its heading for keyboard and
   screen-reader users, and light the heading briefly so the eye finds where it landed (DESIGN_PRINCIPLES §6: a background
   transition, nothing moves). */
var letterJumpTimer = null;
function lettersJump(g) {
  var group = typeof $ === 'function' ? $('lt-' + g) : null, head = typeof $ === 'function' ? $('lt-h-' + g) : null;
  if (!group) return;
  if (typeof group.scrollIntoView === 'function') group.scrollIntoView({ block: 'start' });   // instant: nothing sets scroll-behavior: smooth
  if (!head) return;
  try { head.focus({ preventScroll: true }); } catch (e) {}
  if (head.classList) {
    document.querySelectorAll('.lt-title.lt-here').forEach(function (h) { h.classList.remove('lt-here'); });
    head.classList.add('lt-here');
    if (letterJumpTimer) clearTimeout(letterJumpTimer);
    letterJumpTimer = setTimeout(function () { head.classList.remove('lt-here'); }, 900);
  }
}
