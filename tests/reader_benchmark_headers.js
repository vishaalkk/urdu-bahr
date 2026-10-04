/* tests/reader_benchmark_headers.js
   Integrity test to guarantee that EVERY ghazal across all collections
   always renders a valid reader header benchmark card with:
   - "Same bahr as <Poet>'s:" (for cross-poet references), OR
   - "Signature verse for this bahr:" (for canonical / self-reference verses)
   - A non-empty signature misra in the active script.

   Also verifies dynamic auto-discovery for future newly added meters/poets.
   Run: node tests/reader_benchmark_headers.js
*/

const fs = require('fs');
const path = require('path');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  url: 'http://localhost:8000/#/ghazals/ghalib/1'
});
const win = dom.window;

let failures = 0;
function check(cond, msg) {
  if (!cond) {
    failures++;
    console.error('  ✗ FAIL:', msg);
  }
}

// Give JSDOM a moment to execute initial scripts
setTimeout(() => {
  try {
    runTests();
  } catch (err) {
    console.error('Test threw unhandled error:', err);
    process.exit(1);
  }
}, 500);

function runTests() {
  console.log('Testing reader header benchmark card across all corpus ghazals...');

  const colls = win.poetCollections ? win.poetCollections() : [];
  check(colls.length >= 60, `Expected at least 60 poet collections, got ${colls.length}`);

  let totalGhazals = 0;
  let settledGhazals = 0;

  function verifyGhazal(poetName, g, collectionKey) {
    totalGhazals++;
    const mId = (g.meters && g.meters[0]) || g.m;
    const item = { ...g, poet: poetName };

    if (!mId) {
      // Unsettled poem check: must render the clean unsettled notice card
      const unsettledHdr = win.renderGhazalReaderHeader(null, item);
      check(
        unsettledHdr.includes('reader-header-unsettled') && unsettledHdr.includes('Unsettled'),
        `${poetName} #${g.id}: Unsettled poem should render clear unsettled card`
      );
      return;
    }

    settledGhazals++;

    // 1. meterFamousLine must NOT return null or empty text
    const famous = win.meterFamousLine(mId, item);
    check(
      famous && famous.text && famous.text.trim().length > 0,
      `${poetName} #${g.id} (meter ${mId}): meterFamousLine returned null or empty text`
    );

    // 2. renderGhazalReaderHeader must output benchmark card
    const hdr = win.renderGhazalReaderHeader(mId, item);
    check(
      hdr.includes('reader-benchmark-card'),
      `${poetName} #${g.id} (meter ${mId}): missing .reader-benchmark-card in reader header`
    );

    // 3. Must contain either "Same bahr as" or "Signature verse for this bahr:"
    const hasBenchmarkLabel = hdr.includes('Same bahr as') || hdr.includes('Signature verse for this bahr:');
    check(
      hasBenchmarkLabel,
      `${poetName} #${g.id} (meter ${mId}): missing "Same bahr as" / "Signature verse" label`
    );

    // 4. Must render the hero verse container
    check(
      hdr.includes('reader-header-hero-verse'),
      `${poetName} #${g.id} (meter ${mId}): missing .reader-header-hero-verse`
    );
  }

  // 1. Extended poets
  colls.forEach(([pKey, items]) => {
    const pMeta = win.POET_LIST ? win.POET_LIST.find(p => p.key === pKey) : null;
    const pName = pMeta ? pMeta.name : pKey;
    items.forEach(g => verifyGhazal(pName, g, pKey));
  });

  // 2. Ghalib & Mir (via GHAZAL_COLLECTIONS or direct stores)
  const ghalibItems = win.GHALIB_EXT_DATA || [];
  const mirItems = win.MIR_EXT_DATA || [];
  ghalibItems.forEach(g => verifyGhazal('Ghalib', g, 'ghalib'));
  mirItems.forEach(g => verifyGhazal('Mir', g, 'mir'));

  console.log(`  ✓ Checked ${totalGhazals} ghazals (${settledGhazals} settled). All have valid benchmark cards.`);

  // 3. Synthetic Edge Case: Future new meter with first/only poem
  console.log('Testing future edge case: newly added meter with single poem...');
  const newMeterItem = {
    id: 9001,
    poet: 'FuturePoet',
    meters: [99],
    lines: [
      { ur: 'یہ مستقبل کا نیا شعر ہے بحر ننانوے کا', ro: 'ye mustaqbil ka naya sher hai', hi: 'यह भविष्य का नया शेर है' }
    ]
  };
  const famousSingle = win.meterFamousLine(99, newMeterItem);
  check(famousSingle && famousSingle.text, 'Future new meter must auto-discover opening line as signature verse');
  const hdrSingle = win.renderGhazalReaderHeader(99, newMeterItem);
  check(hdrSingle.includes('Signature verse for this bahr:'), 'Single new meter must render "Signature verse for this bahr:"');

  // 4. Synthetic Edge Case: Future second poet writing in that same new meter
  console.log('Testing future edge case: second poet in newly added meter (cross-poet discovery)...');
  const jaunCol = colls.find(([k]) => k === 'jaun');
  if (jaunCol) {
    jaunCol[1].push({
      id: 9002,
      poet: 'Jaun',
      meters: [99],
      lines: [
        { ur: 'یہ جون کا شعر ہے اسی نئی بحر میں', ro: 'ye jaun ka sher hai usi nayi bahr mein', hi: 'यह जौन का शेर है' }
      ]
    });
    const hdrSecond = win.renderGhazalReaderHeader(99, newMeterItem);
    check(
      hdrSecond.includes('Same bahr as Jaun&#39;s:') || hdrSecond.includes("Same bahr as Jaun's:"),
      'Second poet in meter must trigger cross-poet reference "Same bahr as Jaun\'s:"'
    );
  }

  if (failures > 0) {
    console.error(`\nREADER HEADER INTEGRITY TEST FAILED with ${failures} error(s).`);
    process.exit(1);
  } else {
    console.log('reader benchmark headers OK (all poems guaranteed non-missing)');
    process.exit(0);
  }
}
