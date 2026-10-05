/* Automated Testing & Benchmarking Suite for Khalil Metric Circles & Instrument
   Verifies:
   1. All 5 metric circles and their meters
   2. All 144 parameter combinations (2 lengths x 2 body mods x 3 end mods)
   3. 100% of canonical combinations resolve to authentic in-app corpus ghazals
   4. Syllable scansion foot counts match length (4 for musamman, 3 for musaddas)
   5. DOM rendering produces zero 'undefined', 'NaN', or broken tags
   6. Rapid state transitions benchmark in simulated DOM
   
   Run: node tests/circles_combinations_test.js
*/

const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

const HTML = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

const vc = new VirtualConsole();
const IGNORE = /Not implemented|scrollTo/;
vc.on('jsdomError', e => {
  if (!IGNORE.test(e.message)) console.warn('JSDOM warning:', e.message);
});

const dom = new JSDOM(HTML, {
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  virtualConsole: vc,
  url: 'http://localhost/index.html#/meter/circles'
});

dom.window.scrollTo = () => {};

let failures = 0;
let passed = 0;

function assert(condition, message) {
  if (!condition) {
    failures++;
    console.error('  ✗ ' + message);
  } else {
    passed++;
  }
}

async function runTests() {
  console.log('===============================================================');
  console.log('  KHALIL METRIC CIRCLES: COMBINATIONS & BENCHMARK TEST SUITE   ');
  console.log('===============================================================');

  const w = dom.window;

  // 1. Data Integrity: Circles Structure
  console.log('\n[1/5] Verifying Metric Circles Structure...');
  assert(Array.isArray(w.CIRCLES), 'w.CIRCLES must be an array');
  assert(w.CIRCLES.length === 5, `Expected 5 circles, found ${w.CIRCLES.length}`);

  const circleNames = w.CIRCLES.map(c => c.nameEn);
  console.log('  Circles detected: ' + circleNames.join(', '));
  assert(circleNames.some(n => /Mujtaliba/i.test(n)), 'Mujtaliba present');
  assert(circleNames.some(n => /Mushtabiha/i.test(n)), 'Mushtabiha present');
  assert(circleNames.some(n => /Muttafiqa/i.test(n)), 'Muttafiqa present');
  assert(circleNames.some(n => /Muʾtalifa|Mutalifa/i.test(n)), 'Muʾtalifa present');
  assert(circleNames.some(n => /Muḫtalifa|Mukhtalifa/i.test(n)), 'Mukhtalifa present');

  // 2. Comprehensive Permutations Audit
  console.log('\n[2/5] Auditing All Meter Combinations (12 per meter)...');
  let totalCombinations = 0;
  let canonicalCombinations = 0;
  let theoreticalCombinations = 0;

  const lengths = ['musamman', 'musaddas'];
  const bodyMods = ['base', 'makhbun'];
  const endMods = ['salim', 'mahzuuf', 'maqtu'];

  const verifiedGhazals = new Set();
  const canonicalCombos = [];

  w.CIRCLES.forEach((circ, cIdx) => {
    circ.meters.forEach((mtr, mIdx) => {
      lengths.forEach(len => {
        bodyMods.forEach(bMod => {
          endMods.forEach(eMod => {
            totalCombinations++;
            const res = w.getMeterResolution(mtr, len, bMod, eMod);
            assert(res && typeof res === 'object', `Resolution object returned for ${circ.nameEn} > ${mtr.name} (${len}/${bMod}/${eMod})`);

            if (res.isCanonical) {
              canonicalCombinations++;
              assert(Number.isInteger(res.meterNum) && res.meterNum >= 1 && res.meterNum <= 39,
                `Canonical meter #${res.meterNum} must be between 1 and 39 in ${mtr.name}`);
              assert(typeof res.nameEn === 'string' && !res.nameEn.includes('undefined'),
                `Valid nameEn: "${res.nameEn}"`);

              // Test verse resolution for this canonical combo
              let verseObj = null;
              if (bMod === 'makhbun') {
                verseObj = (mtr.verses && mtr.verses[`${len}_makhbun_${eMod}`]) ||
                           (mtr.verses && mtr.verses[`${len}_makhbun`]);
              }
              if (!verseObj) {
                if (eMod === 'maqtu') {
                  verseObj = mtr.verses && (mtr.verses[`${len}_maqtu`] || mtr.verses['musamman_maqtu']);
                } else if (eMod === 'mahzuuf') {
                  verseObj = mtr.verses && mtr.verses[`${len}_mahzuuf`];
                } else {
                  verseObj = mtr.verses && (mtr.verses[`${len}_salim`] || mtr.verses['musamman_salim']);
                }
              }
              if (!verseObj && mtr.verses) verseObj = Object.values(mtr.verses)[0];

              assert(verseObj && verseObj.ur, `Verse object exists for canonical ${mtr.name} (${len}/${bMod}/${eMod})`);
              assert(verseObj && !verseObj.poet.includes('Mir Hasan'), `Mir Hasan must NOT be present anywhere in corpus verses`);

              const links = w.getCircleVerseLinks(verseObj, mtr, res);
              assert(links.appGhazal && links.appGhazal.startsWith('#/ghazals/'),
                `appGhazal route exists and valid: ${links.appGhazal} for ${mtr.name}`);
              assert(links.ghazalLabel && !links.ghazalLabel.includes('undefined'),
                `ghazalLabel valid: "${links.ghazalLabel}"`);

              // Verify poet is short canonical name
              const validPoets = ['Ghalib', 'Mir', 'Iqbal', 'Faiz', 'Atish', 'Dagh', 'Hasrat', 'Zauq', 'Dard', 'Momin'];
              assert(validPoets.includes(links.poet), `Canonical poet attribution "${links.poet}" must match site conventions`);

              // Verify in-app ghazal exists in loaded datasets
              const routeParts = links.appGhazal.replace('#/ghazals/', '').split('/');
              const pKey = routeParts[0];
              const gId = routeParts[1];
              let list = null;
              if (pKey === 'ghalib') list = w.eval('GHALIB_EXT_DATA');
              else if (pKey === 'mir') list = w.eval('MIR_EXT_DATA');
              else if (w.eval('POETS_DATA.ghazals')[pKey]) list = w.eval('POETS_DATA.ghazals')[pKey];

              const foundInCorpus = list ? list.find(g => String(g.id) === String(gId) || String(g.num) === String(gId)) : null;
              assert(foundInCorpus, `Ghazal ${links.ghazalLabel} (${links.appGhazal}) found in site corpus!`);
              if (foundInCorpus) verifiedGhazals.add(links.appGhazal);

              canonicalCombos.push({
                meterNum: res.meterNum,
                meterName: res.nameEn,
                combo: `${len} / ${bMod} / ${eMod}`,
                poet: links.poet,
                ghazal: links.ghazalLabel,
                route: links.appGhazal,
                ur: verseObj.ur
              });
            } else {
              theoreticalCombinations++;
              assert(typeof res.theoreticalReason === 'string' && res.theoreticalReason.length > 10,
                `Theoretical meter reason provided for ${mtr.name} (${len}/${bMod}/${eMod})`);
            }
          });
        });
      });
    });
  });

  console.log(`  ✓ Audited ${totalCombinations} total parameter combinations:`);
  console.log(`    - ${canonicalCombinations} Canonical Urdu configurations (all verified in in-app corpus)`);
  console.log(`    - ${theoreticalCombinations} Theoretical al-Khalīl circle prototypes`);
  console.log(`    - ${verifiedGhazals.size} Distinct authentic ghazals verified in corpus`);

  // 3. DOM Rendering & UI Sanity Checks
  console.log('\n[3/5] Testing Interactive DOM Rendering & State Switches...');
  const doc = w.document;

  for (let cIdx = 0; cIdx < w.CIRCLES.length; cIdx++) {
    w.selectCircle(cIdx);
    const circ = w.CIRCLES[cIdx];

    // Check circle card header text
    const cardHeader = doc.getElementById('circleCardHeader');
    assert(cardHeader && cardHeader.textContent.includes(circ.nameUr), `Circle ${cIdx} title Urdu rendered in card header`);
    assert(cardHeader && cardHeader.textContent.includes(circ.nameEn), `Circle ${cIdx} title English rendered in card header`);

    // Check lens segments in SVG
    const lensSegments = doc.querySelectorAll('#wheelLensGroup path.lens-seg');
    assert(lensSegments.length === circ.footLen, `Lens segments (${lensSegments.length}) match footLen (${circ.footLen}) for Circle ${cIdx}`);

    for (let mIdx = 0; mIdx < circ.meters.length; mIdx++) {
      w.selectCircleMeter(mIdx);
      const mtr = circ.meters[mIdx];

      // Check hub meter name
      const hub = doc.getElementById('hubMeterName');
      assert(hub && hub.textContent.includes(mtr.name), `Hub meter name displays "${mtr.name}"`);

      // Check couplet card fields
      const vUr = doc.getElementById('circleVerseUrdu');
      const vHi = doc.getElementById('circleVerseHindi');
      const vRo = doc.getElementById('circleVerseRoman');
      const vPoet = doc.getElementById('circleCoupletAttribution');
      const headLeft = doc.getElementById('circleCoupletHeadLeft');
      const headRight = doc.getElementById('circleCoupletHeadRight');

      assert(vUr && !vUr.textContent.includes('undefined') && !vUr.textContent.includes('NaN'), `Verse Urdu valid for ${mtr.name}`);
      assert(vHi && !vHi.textContent.includes('undefined') && !vHi.textContent.includes('NaN'), `Verse Hindi valid for ${mtr.name}`);
      assert(vRo && !vRo.textContent.includes('undefined') && !vRo.textContent.includes('NaN'), `Verse Roman valid for ${mtr.name}`);
      assert(vPoet && !vPoet.textContent.includes('undefined'), `Verse Attribution valid for ${mtr.name}`);
      assert(headLeft && !headLeft.innerHTML.includes('undefined'), `Couplet Head Left valid for ${mtr.name}`);
      assert(headRight && !headRight.innerHTML.includes('undefined'), `Couplet Head Right valid for ${mtr.name}`);
    }
  }

  // Test snap button on a non-canonical setting
  w.selectCircle(0);
  w.selectCircleMeter(0);
  w.setCircleLength('musaddas');
  w.setCircleEndMod('salim'); // theoretical for Hazaj
  const snapHeadLeft = doc.getElementById('circleCoupletHeadLeft');
  assert(snapHeadLeft && snapHeadLeft.textContent.includes('Prototype'), 'Prototype badge shown for theoretical setting');
  w.snapToCanonicalMeter();
  const postSnapHeadLeft = doc.getElementById('circleCoupletHeadLeft');
  assert(postSnapHeadLeft && postSnapHeadLeft.textContent.includes('Meter #26'), 'Snap restores to canonical Meter #26');

  // Test script mode switching on the circle couplet card
  w.setScriptMode('hi');
  const vHiActive = doc.getElementById('circleVerseHindi');
  const vPoetHi = doc.getElementById('circleCoupletAttribution');
  assert(vHiActive && vHiActive.textContent.trim().length > 3, 'Hindi verse content rendered when script=hi');
  assert(vPoetHi && /[\u0900-\u097F]/.test(vPoetHi.textContent), `Poet attribution "${vPoetHi.textContent}" localized in Devanagari`);

  w.setScriptMode('ur');
  const vUrActive = doc.getElementById('circleVerseUrdu');
  const vPoetUr = doc.getElementById('circleCoupletAttribution');
  assert(vUrActive && vUrActive.textContent.trim().length > 3, 'Urdu verse content rendered when script=ur');
  assert(vPoetUr && /[\u0600-\u06FF]/.test(vPoetUr.textContent), `Poet attribution "${vPoetUr.textContent}" localized in Urdu Nastaliq`);

  // Verify corpus dataset data/urdupoetry_verses.json has trilingual text and localized poets
  const urdupoetryRaw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'urdupoetry_verses.json'), 'utf8'));
  assert(urdupoetryRaw.length >= 22, `Expected at least 22 couplets in urdupoetry_verses.json, found ${urdupoetryRaw.length}`);
  urdupoetryRaw.forEach(up => {
    assert(up.id && up.poet && up.poetUr && up.poetHi, `Couplet ${up.id} has poet metadata: ${up.poet} / ${up.poetUr} / ${up.poetHi}`);
    assert(Array.isArray(up.lines) && up.lines.length === 2, `Couplet ${up.id} has 2 lines`);
    up.lines.forEach((l, li) => {
      assert(l.ur && l.ur.length > 2, `Couplet ${up.id} line ${li} has Urdu text`);
      assert(l.ro && l.ro.length > 2, `Couplet ${up.id} line ${li} has Roman text`);
      assert(l.hi && l.hi.length > 2, `Couplet ${up.id} line ${li} has Hindi text`);
      assert(l.ascii && l.ascii.length > 2, `Couplet ${up.id} line ${li} has ASCII text`);
    });
  });

  // 4. Syllable Scansion Color & Foot Alignment Check
  console.log('\n[4/5] Checking Syllable Scansion Foot Alignment & Color Legend...');
  w.selectCircle(0); // Mujtalib
  w.selectCircleMeter(0); // Hazaj
  w.setCircleLength('musamman');
  w.setCircleEndMod('salim');
  w.setCircleBodyMod('base');

  const fgrps = doc.querySelectorAll('#circleSylRow .fgrp');
  assert(fgrps.length === 4, `Musamman rendered exactly 4 feet (found ${fgrps.length})`);

  w.setCircleLength('musaddas');
  w.setCircleEndMod('mahzuuf'); // Hazaj Musaddas Mahzuf (canonical Meter #27)
  const fgrps6 = doc.querySelectorAll('#circleSylRow .fgrp');
  assert(fgrps6.length === 3, `Musaddas rendered exactly 3 feet (found ${fgrps6.length})`);

  // Check legend colors: short = orange, long = blue
  const sampleShort = doc.querySelector('#circleSylRow .chip.s');
  const sampleLong = doc.querySelector('#circleSylRow .chip.l');
  assert(sampleShort, 'Short syllable chip rendered');
  assert(sampleLong, 'Long syllable chip rendered');

  // 5. Performance Benchmark
  const iterations = 25;
  console.log(`\n[5/5] Running Performance Benchmark (${iterations} Rapid State Transitions in JSDOM)...`);
  const t0 = performance.now();

  for (let i = 0; i < iterations; i++) {
    const c = i % 5;
    w.selectCircle(c);
    const mCount = w.CIRCLES[c].meters.length;
    w.selectCircleMeter(i % mCount);
    if (i % 2 === 0) w.setCircleLength('musaddas');
    else w.setCircleLength('musamman');
    if (i % 3 === 0) w.setCircleBodyMod('makhbun');
    else w.setCircleBodyMod('base');
    if (i % 4 === 0) w.setCircleEndMod('mahzuuf');
    else if (i % 4 === 1) w.setCircleEndMod('maqtu');
    else w.setCircleEndMod('salim');
  }

  const elapsed = performance.now() - t0;
  const avgMs = (elapsed / iterations).toFixed(2);
  console.log(`  ✓ Benchmark completed: ${iterations} full UI/DOM redraws in ${elapsed.toFixed(1)}ms (avg: ${avgMs}ms / transition)`);
  assert(parseFloat(avgMs) < 800.0, `Average transition latency (${avgMs}ms in software JSDOM) is healthy (< 800ms CI budget)`);

  console.log('\n===============================================================');
  if (failures === 0) {
    console.log(`  ALL ${passed} ASSERTIONS PASSED! ZERO FAILURES.`);
    console.log('===============================================================\n');
    process.exit(0);
  } else {
    console.error(`  TEST FAILED: ${failures} assertions failed out of ${passed + failures}.`);
    console.log('===============================================================\n');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test runner exception:', err);
  process.exit(1);
});
