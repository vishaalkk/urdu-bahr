/* Persian support, piece by piece (docs/PERSIAN_PLAN.md). Run after `npm run build`: node tests/persian_helpers.js
   1. Scan text: detectScanLang, faScanText (Iranian letters and spelling, the uncounted nūn after a long vowel), rkPlain (Allah spellings)
   2. Roman hints: rekhtaScanText keeps the iẓāfat when Roman and Urdu split words differently, never on a particle
   3. Word list: faKey is the same in the app and in scripts/lib_fa_lexicon.js; faWordScripts / faLineScripts
   4. Roman repair rules (scripts/lib_fa_lexicon.js repairLine)
   5. In the page (jsdom): Scan reads Hafiz as Fārsī in Meter #4 with no Hindi meter; the Poets language filter keeps a
      two-language poet's Urdu ghazals out of Fārsī */
const fs = require('fs'), path = require('path');
const { loadEngine } = require('../scripts/lib_scan');
const L = require('../scripts/lib_fa_lexicon');
let failures = 0, passed = 0;
const check = (c, m) => { if (c) passed++; else { failures++; console.log('  ✗ ' + m); } };
const { Scan, ctx } = loadEngine();

/* 1. scan text */
check(ctx.detectScanLang('دل می‌رود ز دستم صاحب‌دلان خدا را') === 'fa', 'Iranian spelling reads as Fārsī');
check(ctx.detectScanLang('نمی دانم چہ منزل بود شب جائے کہ من بودم') === 'fa', 'Persian in Urdu spelling reads as Fārsī');
check(ctx.detectScanLang('ہزاروں خواہشیں ایسی کہ ہر خواہش پہ دم نکلے') === 'ur', 'Ghalib reads as Urdu');
check(ctx.detectScanLang('کوئی امید بر نہیں آتی') === 'ur', 'an Urdu line with بر stays Urdu');
check(ctx.faScanText('بشنو این نی چون شکایت می‌کند') === 'بشنو ایں نی چوں شکایت می کند', 'faScanText: nūn after a long vowel → ں, joiner → space');
check(ctx.faScanText('خانهٔ دل') === 'خانۂ دل', 'faScanText: هٔ → ۂ (iẓāfat)');
check(ctx.faScanText('من') === 'من', 'faScanText: nūn after a short vowel stays');
check(ctx.faScanText('دِلْ') === 'دِل', 'faScanText: sukūn is dropped (fully voweled text)');
check(ctx.faScanText('در آن حرم') === 'در آں حرم', 'faScanText: آن → آں like the other long vowels');
check(ctx.faLiaisonVariants('کہ عشق آساں نمود')[0] === 'کہ عشقاساں نمود', 'liaison: a consonant joins a following آ, which keeps its long ā (ʿeshq-āsān)');
check(ctx.faLiaisonVariants('ہم از ایں') .includes('ہمز ایں'), 'liaison: ا before a consonant is a short vowel and goes (ham az → ha-maz)');
check(ctx.faLiaisonVariants('دلِ ما را').length === 0 && ctx.faLiaisonVariants('تو اگر').length === 0, 'liaison: none after a vowel or a written iẓāfat');
check(ctx.faLiaisonVariants('کہ از دست').includes('کز دست') && ctx.faLiaisonVariants('کہ ایں دل').includes('کیں دل'), 'contraction: ke + az → kaz, ke + īn → kīn');
check(ctx.faLiaisonVariants('مردہ است عیسی').includes('مردست عیسی') && ctx.faLiaisonVariants('دانا است').includes('داناست'), 'contraction: ast after a vowel loses its alif (murdast, dānāst)');
check(ctx.faScanText('با دورباش\u200cِ زیر بود') === 'با دورباشِ زیر بود', 'faScanText: a zer written after a ZWNJ joins the letter before it');
/* Iranian spelling (faIranianSpelling) */
check(ctx.faScanText('دیدار خوبان مشکل\u200cست') === 'دیدار خوباں مشکلست', 'faScanText: ast joined by a ZWNJ contracts onto a consonant');
check(ctx.faScanText('دردی سوخته\u200cست') === 'دردی سوختست', 'faScanText: ast after ه takes its place (sūḳh-tast)');
check(ctx.faScanText('ندیدم روی را') === 'ندیدم روئے را', 'faScanText: final -وی is ū + y (rūy)');
check(ctx.faScanText('خوش می\u200cروی') === 'خوش می روی' && ctx.faScanText('بیخود شوی') === 'بیخود شوی' && ctx.faScanText('قوی') === 'قوی',
  'faScanText: the verbs ravī / shavī and -avī adjectives keep their -وی');
check(ctx.faScanText('دلآویزی') === 'دل آویزی', 'faScanText: آ inside a word opens the compound\'s second word (for liaison)');
check(ctx.faScanText('برافشانیم بود') === 'بر افشانیم بود' && ctx.faScanText('برادر') === 'برادر',
  'faScanText: a preverb before an alif-initial verb stem splits off; other بر/در words do not');
check(ctx.faScanText('ای دل، بیا؟') === 'ای دل بیا', 'faScanText: punctuation is dropped (the engine would read ، as a letter)');
check(ctx.faScanText('سودای تو برای') === 'سودائے تو برائے', 'faScanText: -ای after ā is the iẓāfat / yā (saudā-ye)');
check(ctx.faScanText('ساغر اندازیم') === 'ساغر اندازی' && ctx.faScanText('چه شود') === 'چہ شود',
  'faProsodyText: a line-final long vowel + consonant scans as one long syllable (not after و: shavad)');
check(ctx.faScanText('یا جان ز تن برآید') === 'یا جاں ز تن بر آید', 'faProsodyText: line-final آید keeps its d (ā-yad: ی after آ is the consonant y)');
check(ctx.faScanText('رویِ تو جایِ من') === 'روئِ تو جائِ من' && ctx.faScanText('دیده\u200cیِ جان') === 'دیدۂ جاں',
  'faScanText: a written iẓāfat -ye after a long vowel → ئِ (rū-e), after a silent h → ۂ (dīda-e)');
check(ctx.faScanText('کل تویی ناطق') === 'کل توئی ناطق', 'faScanText: ī after a long vowel → ئی (tu-ī)');
check(ctx.faScanText('بوستان است') === 'بوستانست', 'faProsodyText: ast after ān keeps the n (bū-stā-nast)');
check(ctx.faScanText('کـاین') === 'کیں', 'faScanText: tatweel is dropped');
check(ctx.lineScanText({ ur: 'ڈر نالہہائے زار سے میرے خدا کو مان' }) === 'ڈر نالہ ہائے زار سے میرے خدا کو مان' && ctx.urPluralHa('کہہ دو') === 'کہہ دو',
  'lineScanText: the Persian plural -hā after a silent h scans as its own word (Ghalib 112.7 nā-la-hā-e); kahh is left alone');
check(ctx.faLiaisonVariants('افشانیم و می').includes('افشانی مو می'), 'faLiaisonVariants: و takes the consonant before it (af-shā-nī-mo)');
{
  const slots = l => { const W = ctx.faScanText(l).split(' '); return ctx.faIzafatSlots(W).map(i => W[i]).join(' '); };
  check(slots('ساقی فرخ رخ من جام چو گلنار بده') === 'ساقی فرخ رخ', 'faIzafatSlots: sāqī-e farruḳh-ruḳh-e man (not on چو, a verb, or the last word)');
  check(slots('متوجه است با ما سخنان بی\u200cحسیبت').includes('سخناں'), 'faIzafatSlots: an iẓāfat before a bī- adjective (suḳhanān-e bī-ḥasīb)');
  check(slots('بیا تا گل برافشانیم و می در ساغر اندازیم') === '', 'faIzafatSlots: none before a verb, و, a preposition, or on a particle');
  check(slots('ما ملامت را به جان جوییم در بازار عشق') === 'بازار', 'faIzafatSlots: bāzār-e ʿishq; none before را or a verb (جوییم)');
}
check(ctx.faScanText('کاین همه') === 'کیں ہمہ' && ctx.faScanText('توی') === 'توئی', 'faScanText: کاین is kīn, توی is tu-yī');
const fits = l => (Scan.scanLine(l).fits || []).filter(f => f.meter.id !== 'H');
check(fits(ctx.faScanText('بشنو این نی چون شکایت می‌کند'))[0].meter.id === 11, 'Rumi (Iranian spelling) scans as Meter #11');
check(String(fits(ctx.faScanText('دل می‌رود ز دستم صاحب‌دلان خدا را'))[0].meter.id) === '4', 'Hafiz (Iranian spelling) scans as Meter #4 (as Ganjoor)');
check(fits(ctx.faScanText('من که باشم در آن حرم که صبا')).some(f => ['14', '15'].includes(String(f.meter.id)) && f.c <= 2), 'Hafiz sh56 (dar ān ḥaram) fits khafīf');
check(ctx.rkPlain('یا رسول‌ اللہؐ') === 'یا رسول اللہ', 'rkPlain: honorific and stray joiner around Allah');
check(ctx.rkPlain('لا الٰہ') === 'لا الٰہ', 'rkPlain: ilāh is not Allah');
check(ctx.rkPlain('محمدؐ') === 'محمدؐ', 'rkPlain: other words keep their honorific sign');

/* 2. Roman hints across different word splits */
check(ctx.rekhtaScanText('بخدا غیر خدا در دو جہاں چیزے نیست', 'ba-ḳhudā ġhair-e-ḳhudā dar do-jahāñ chīze niist') === 'بخدا غیرِ خدا در دو جہاں چیزے نیست',
  'iẓāfat kept when the Roman splits بخدا in two');
check(ctx.rekhtaScanText('آمدہ بہ قتل من آں شوخ ستم گارے', 'āmada qatl-e-man aañ shoḳh sitam-gāre') === 'آمدہ بہ قتلِ من آں شوخ ستم گارے',
  'iẓāfat on قتل, not on the particle بہ the Roman dropped');
check(ctx.rekhtaScanText('ز رحمت کن نظر بر حال زارم یا رسول‌ اللہؐ', 'za rahmat kun nazar bar hāl-e-zāram yā rasūlallāh').includes('حالِ زارم'),
  'iẓāfat kept when the Roman joins rasūlallāh');
check(ctx.rekhtaScanText('دل ناداں تجھے ہوا کیا ہے', 'dil-e-nādāñ tujhe huā kyā hai') === 'دلِ ناداں تجھے ہوا کیا ہے', 'equal word counts: unchanged path');

/* 3. word list */
for (const w of ['صاحب‌دلان', 'جائے', 'خانۂ', 'ﻧﻮﺭﻡ', 'کِتاب']) check(ctx.faKey(w) === L.faKey(w), `faKey(${w}) is the same in the app and lib_fa_lexicon`);
const lex = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data/fa_lexicon.json'), 'utf8'));
check(Object.keys(lex).length > 2000, 'fa_lexicon has its words');
check(ctx.faWordScripts('دستم') && ctx.faWordScripts('دستم').ro === 'dastam', 'a listed word');
const built = ctx.faWordScripts('نمی‌خواهم');
check(built && /^namī-/.test(built.ro), 'prefix + known stem: namī-…');
const line = ctx.faLineScripts('دل می‌رود ز دستم صاحب‌دلان خدا را');
check(line.ro === 'dil mī-ravad za-dastam sāhib-dilāñ ḳhudā rā', `faLineScripts Hafiz: ${line.ro}`);
check(ctx.faLineScripts('آمدہ بہ قتلِ من').ro === 'āmada ba-qatl-e-man', `faLineScripts joins ba- and the iẓāfat: ${ctx.faLineScripts('آمدہ بہ قتلِ من').ro}`);

/* 3b. Persian prosody and Arabic formulae */
check(ctx.faProsodyText('سوئے شہر عشق راہے دیگر است') === 'سوئے شہر عشق راہے دیگرست', 'ast after a consonant joins the word (dīgarast)');
check(ctx.faProsodyText('دلم ما است') === 'دلم ما است', 'ast after a vowel stays a word');
check(ctx.faProsodyText('خشک تارے خشک چوبے خشک پوست') === 'خشک تارے خشک چوبے خشک پوس', 'line-final overlong pōst: its t is not counted');
check(ctx.faProsodyText('بر سر کوئے دوست') === 'بر سر کوئے دوس' && ctx.faProsodyText('دوست بر سر') === 'دوس بر سر', 'overlong dōst: its t is not counted at the line end, nor before a consonant');
check(ctx.faProsodyText('دوست اگر') === 'دوست اگر', 'overlong dōst before a vowel keeps its t (it starts the next syllable)');
check(ctx.faProsodyText('جلوۂ دلدار دیدم') === 'جلوۂ دلدار دیدم', 'dīdam (dī-dam) is not an overlong ending: untouched');
check(ctx.faLineScripts('الا یا ایها الساقی ادر کأسا و ناولها').ro === 'alā yā ayyuha-s-sāqī adir ka.san va nāvilhā', 'Arabic: Hafiz\'s opening');
check(/yā rasūlallāh$/.test(ctx.faLineScripts('تنم فرسودہ جاں پارہ ز ہجراں یا رسول اللہ').ro), 'Arabic: yā rasūlallāh');
check(ctx.faWordScripts('کردہ') && ctx.faWordScripts('کردہ').ro === 'karda', 'participle: known stem + -a');

/* 3c. the Persian engine (node: as scripts/build_app.py assembles it) and mustazād */
const FA = require('../scripts/lib_fa_scan').loadFaEngine();
const { mustazadFit } = require('../scripts/lib_scan');
check(FA.Scan.METERS.length > Scan.METERS.length && FA.Scan.METERS.some(m => m.id === 'F25'), 'ScanFa has the Persian-only meters');
check(Scan.METERS.every(m => !String(m.id).startsWith('F')), 'the Urdu engine has none of them');
const saadi = (FA.Scan.scanLine('ہر کہ چیزے دوست دارد جان و دل بر وے گمارد').fits || [])[0];
check(saadi && saadi.meter.id === 'F26' && saadi.c <= 1, `Saadi 166 scans in F26 (ramal musamman sālim) on ScanFa: ${saadi && saadi.meter.id}`);
const mz = mustazadFit(FA.Scan, FA.ctx.rekhtaScanText('ہر لحظہ بہ شکلے بت عیار بر آمد دل برد و نہاں شد', "har-lahza ba-shakle but-e-'ayyār bar aamad dil burd-o-nihāñ shud"));
check(mz && mz.meter.id === 8 && mz.split === 8, 'mustazād: hazaj #8 + its first-and-last-foot tail');
/* the app's mustazād scan (faMustazadScan): one fit under the meter's own id, running through head and tail, so explain() gives
   the whole line with a caesura before the tail */
const mzText = FA.ctx.faProsodyText(FA.ctx.rekhtaScanText('ہر لحظہ بہ شکلے بت عیار بر آمد دل برد و نہاں شد', "har-lahza ba-shakle but-e-'ayyār bar aamad dil burd-o-nihāñ shud"));
const mzr = FA.ctx.faMustazadScan(FA.Scan, mzText, [8]), mzf = mzr.fits[0];
const mze = mzf && FA.Scan.explain(mzr, mzf);
check(mzf && mzf.meter.id === 8 && mzf.c <= 2 && mzf.mustazad === 8, 'faMustazadScan: the line as #8 + tail, under id 8');
check(mze && mze.syl.filter(s => !s.cheat).length === 14 + 6 && mze.feet.filter(Boolean).some(F => F.cae) && mze.syl[mze.syl.length - 1].wordTo === mzr.words.length - 1,
  'faMustazadScan: explain() covers head and tail, the tail after a caesura');
check(!FA.ctx.faScanFits(FA.Scan, mzText, { target: new Set(['8']) }).some(f => String(f.meter.id) === '8' && f.c <= 2)
  && FA.ctx.faScanFits(FA.Scan, mzText, { target: new Set(['8']), mustazad: ['8'] }).some(f => String(f.meter.id) === '8' && f.c <= 2),
  'faScanFits opts.mustazad: the mustazād line fits #8 only as meter + tail');
const bayt = FA.ctx.faProsodyText(FA.ctx.rekhtaScanText('بیا بیا دلدار من دلدار من در آ در آ در کار من در کار من', 'bayā bayā dil-dār-e-man dil-dār-e-man dar-ā dar-ā dar kār-e-man dar kār-e-man'));
check(FA.ctx.faMustazadScan(FA.Scan, bayt, [3]).fits.length === 0, 'mustazād: a sālim meter run on (a bayt of rajaz musaddas on one line) is not meter + tail');
/* sung refrains: the line without the repeats, counted only where it fits the ghazal's meter */
const jami = FA.ctx.faProsodyText(FA.ctx.rekhtaScanText('گل از رخت آموختہ نازک بدنی را بدنی را بدنی را', 'gul az ruḳhat āmoḳhta nāzuk badanī rā badanī rā badanī rā'));
check(FA.ctx.faRefrainVariants(jami).includes('گل از رخت آموختہ نازک بدنی را'), 'refrain: the repeats of the last words go');
check(FA.ctx.faRefrainVariants('زہے عشق زہے عشق کہ ما راست خدایا').length === 0, 'refrain: a repeat inside the line is not a refrain');
const rf = FA.ctx.faScanFits(FA.Scan, jami, { target: new Set(['8']), refrain: true }).find(f => String(f.meter.id) === '8' && f.c <= 2);
check(rf && /نازک بدنی را$/.test(rf.refrain) && !/بدنی را بدنی/.test(rf.refrain), 'refrain: Jami\'s line fits #8 without its sung repeats (with liaison: ruḳha-tāmoḳhta)');
check(!FA.ctx.faScanFits(FA.Scan, jami, { refrain: true }).some(f => f.refrain), 'refrain: never without a target meter');

/* 3d. drift: data/fa_scan.json is keyed by the engine's own spelling rules; if the engine's normalisation changes, every
   Persian reading must still be found (else ScanFa silently loses them). Same for the Persian-only meters. */
const FA_DATA = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data/fa_scan.json'), 'utf8'));
const lexKeys = Object.keys(FA_DATA.lex);
const stale = lexKeys.filter(k => { try { const w = FA.Scan.scanWord(k); return w.key !== k || w.opts.length !== FA_DATA.lex[k].length; } catch (e) { return true; } });
check(lexKeys.length > 300 && stale.length === 0, `fa_scan.json: ${stale.length} of ${lexKeys.length} Persian readings no longer reach the engine (${stale.slice(0, 5).join(' ')})`);
check(FA_DATA.meters.every(([id]) => FA.Scan.METERS.some(m => m.id === id)), 'every Persian-only meter is in ScanFa');

/* golden couplets, each checked against Ganjoor's meter (as written there, Iranian spelling): the Persian path end to end
   (faScanText → faProsodyText → ScanFa with liaison). Hafiz is given his iẓāfat marks (Ganjoor's text has them). */
const faFit = (line, ids) => FA.ctx.faScanFits(FA.Scan, FA.ctx.faProsodyText(FA.ctx.faScanText(line)))
  .some(f => ids.includes(String(f.meter.id)) && f.c <= 2);
check(faFit('اگر آن ترکِ شیرازی به دست آرد دلِ ما را', ['26']), 'golden: Hafiz 3, hazaj musamman sālim (#26), with its iẓāfat');
check(faFit('ماییم و می و مطرب و این کنج خراب', ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9', 'R10', 'R11', 'R12'])
  && faFit('جان و دل و جام و جامه پر درد شراب', ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9', 'R10', 'R11', 'R12']), 'golden: Khayyam, both lines a rubāʿī');
check(faFit('هر کسی را نتوان گفت که صاحب نظر است', ['18', '19']), 'golden: Saadi, ramal makhbūn maḥẕūf');
check(faFit('داد ز خویش چاشنی جان ستم چشیده را', ['25']), 'golden: Rumi, Shams 46, rajaz matwī makhbūn (#25)');
check(faFit('من که باشم در آن حرم که صبا', ['14', '15']), 'golden: Hafiz 56, khafīf (liaison dar ān → da-rān)');
check(FA.ctx.faScanFits(FA.Scan, FA.ctx.faProsodyText(FA.ctx.faScanText('دوست دارم من نگار نازنین خویش را')), { guessIzafat: true })
  .some(f => String(f.meter.id) === '10' && f.c <= 2), 'guessed iẓāfat: nigār-e nāzanīn-e (the ں of nāzanīn back to ن before it), ramal maḥẕūf');

/* 4. Roman repair */
const fix = L.repairLine({ ur: 'آمدہ بہ قتل من آں شوخ ستم گارے', hi: 'आमदः ब-क़त्ल-ए-मन आँ शोख़ सितम-गारे', ro: 'āmada qatl-e-man aañ shoḳh sitam-gāre' }, {});
check(fix && fix.ro === 'āmada ba-qatl-e-man aañ shoḳh sitam-gāre', 'repair restores a dropped particle');
check(L.repairLine({ ur: 'دل ناداں', hi: 'दिल-ए-नादाँ', ro: 'dil-e-nādāñ' }, {}) === null, 'repair leaves a matching line alone');
const lexOthers = { 'بیمار': ['bīmār', 'बीमार', 5, 1] };
const typo = L.repairLine({ ur: 'بیمار غم', hi: 'बीमार ग़म', ro: 'bāmīr ġham' }, lexOthers);
check(typo && typo.ro === 'bīmār ġham', 'repair fixes a misspelling Devanagari and the word list agree on');
check(L.repairLine({ ur: 'بیمار غم', hi: 'बीमार ग़म', ro: 'bāmīr ġham' }, { 'بیمار': ['bīmār', 'बीमार', 2, 1] }) === null, 'not on a word seen fewer than 3 times');
check(L.repairLine({ ur: 'بیمار غم', hi: 'हिकमत ग़म', ro: 'hikmat ġham' }, lexOthers) === null, 'not when the Devanagari disagrees');
check(L.devaSkel('शोख़') === L.romanSkel('shoḳh'), 'Devanagari nukta letters skeleton like their Roman');

/* 5. in the page */
const { JSDOM, VirtualConsole } = require('jsdom');
const vc = new VirtualConsole();
const dom = new JSDOM(fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8'),
  { runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, url: 'http://localhost/index.html#/scan' });
const w = dom.window; w.scrollTo = () => {};
setTimeout(() => {
  const d = w.document;
  d.getElementById('scanIn').value = 'دل می‌رود ز دستم صاحب‌دلان خدا را\nدردا که راز پنهان خواهد شد آشکارا';
  w.runScan();
  check(/Fārsī/.test(d.getElementById('scanLangDetected').textContent), 'Scan: Hafiz detected as Fārsī');
  check(/Meter #4/.test(d.getElementById('scanOut').textContent), 'Scan: Hafiz couplet in Meter #4');
  check(!/Hindi meter/.test(d.getElementById('scanOut').textContent), 'Scan: no Hindi meter on a Persian line');
  check(typeof w.ScanFa === 'object' && w.ScanFa.METERS.length > w.Scan.METERS.length, 'the page has the Persian engine (window.ScanFa)');
  d.getElementById('scanIn').value = 'هر که چیزی دوست دارد جان و دل بر وی گمارد';
  w.runScan();
  check(/Persian meter \(Ganjoor #26\)/.test(d.getElementById('scanOut').textContent) && /رمل مثمن سالم/.test(d.getElementById('scanOut').textContent),
    'Scan: a Persian-only meter scans and is labelled (Ganjoor #26, ramal musamman sālim)');
  const pm = w.persianMeterMeta('F26');
  check(pm && pm.gid === 26 && /ganjoor\.net\/simi/.test(pm.url), 'persianMeterMeta gives the Ganjoor entry');
  const hafizLine = w.eval("poetItems('hafiz').find(g => g.lang === 'fa').lines[0]");
  check(hafizLine && hafizLine.lang === 'fa', 'Persian lines are tagged fa at load');
  const rr = w.scanCorpusLine(hafizLine);
  check(rr.__fa === 1 && w.engineOf(rr) === w.ScanFa && !rr.fits.some(f => f.meter.id === 'H'), 'a Persian corpus line scans on ScanFa, never in the Hindi meter');
  const ghalibLine = w.eval('GHALIB_EXT_DATA[0].lines[0]');
  check(w.engineOf(w.scanCorpusLine(ghalibLine)) === w.Scan, 'an Urdu corpus line stays on the Urdu engine');
  /* a mustazād ghazal (Shah Niyaz: "ai dost ba-bīñ dar hama sū … / bā-ʿain nigāhe"): the reader scans each line as meter + tail
     and shows the tail after a caesura */
  const mzG = w.eval("poetItems('shah_niyaz').find(g => /^ai dost ba-bīñ dar hama sū/.test(g.lines[0].ro || ''))");
  const mzR = mzG && w.scanCorpusLine(mzG.lines[0], mzG.meters);
  check(mzG && mzR.fits.some(f => f.mustazad && mzG.meters.map(String).includes(String(f.meter.id)) && f.c <= 2), 'reader: a mustazād line fits its meter as meter + tail');
  const notMz = w.eval("poetItems('hafiz').find(g => g.lang === 'fa' && g.meters.length)");
  check(notMz && !w.faMustazadGhazal(w.ScanFa, notMz.lines.filter(l => l.lang === 'fa').map(l => w.faProsodyText(w.lineScanText(l))), notMz.meters), 'an ordinary Persian ghazal is no mustazād');
  if (mzG) {
    const box = d.createElement('div');
    w.renderLineScan(mzG.lines[0].ur, box, mzG.lines[0], mzG.meters);
    check(/caeu/.test(box.innerHTML) && /Mustazād/.test(box.textContent) && !/No meter fits/.test(box.textContent), 'reader: the mustazād tail is scanned after a //, with a note');
  }
  /* a sung refrain (Jami: "… badanī rā badanī rā badanī rā") is left out of the reader's scan */
  const jamiG = w.eval("poetItems('jami').find(g => /badanī rā badanī rā/.test(g.lines[0].ro || ''))");
  const jamiR = jamiG && w.scanCorpusLine(jamiG.lines[0], jamiG.meters);
  check(jamiR && jamiR.refrain === 4 && jamiR.fits.some(f => jamiG.meters.map(String).includes(String(f.meter.id))), 'reader: Jami\'s refrain line fits its meter without the repeats');
  check(jamiG && !w.scanCorpusLine(jamiG.lines[4], jamiG.meters).refrain, 'reader: a line with no repeat scans whole');
  d.getElementById('scanIn').value = 'ہزاروں خواہشیں ایسی کہ ہر خواہش پہ دم نکلے';
  w.runScan();
  check(/Urdu/.test(d.getElementById('scanLangDetected').textContent), 'Scan: Ghalib detected as Urdu');

  const meta = w.eval("poetMeta('jigar')");
  check(meta && meta.langs.includes('fa') && meta.langs.includes('ur'), 'Jigar is listed in both languages');
  w.setPoetLang('fa');
  const faOnly = w.eval("poetItems('jigar').filter(g => poetLangMatch('jigar', g)).map(g => g.lang || 'ur')");
  check(faOnly.length >= 1 && faOnly.every(l => l === 'fa'), 'Fārsī filter: only Jigar\'s Persian ghazals');
  w.setPoetLang('ur');
  check(w.eval("poetItems('jigar').filter(g => poetLangMatch('jigar', g)).every(g => (g.lang || 'ur') === 'ur')"), 'Urdu filter: only Jigar\'s Urdu ghazals');
  w.setPoetLang('all');

  console.log(failures ? `PERSIAN HELPERS: ${failures} failed, ${passed} passed` : `PERSIAN HELPERS: all ${passed} checks passed`);
  process.exit(failures ? 1 : 0);
}, 300);
