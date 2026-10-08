/* Persian support, piece by piece (docs/PERSIAN_PLAN.md). Run after `npm run build`: node tests/persian_helpers.js
   1. Scan text: detectScanLang, faScanText (Iranian letters, the uncounted nūn after a long vowel), rkPlain (Allah spellings)
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
const fits = l => (Scan.scanLine(l).fits || []).filter(f => f.meter.id !== 'H');
check(fits(ctx.faScanText('بشنو این نی چون شکایت می‌کند'))[0].meter.id === 11, 'Rumi (Iranian spelling) scans as Meter #11');
check(String(fits(ctx.faScanText('دل می‌رود ز دستم صاحب‌دلان خدا را'))[0].meter.id) === '4', 'Hafiz (Iranian spelling) scans as Meter #4 (as Ganjoor)');
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
  d.getElementById('scanIn').value = 'هر که چیزی دوست دارد جان و دل بر وی گمارد';
  w.runScan();
  check(d.querySelector('.scan-fa-note') && /رمل مثمن سالم/.test(d.querySelector('.scan-fa-note').textContent), 'Scan: a Persian-only meter is reported (ramal musamman sālim)');
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
