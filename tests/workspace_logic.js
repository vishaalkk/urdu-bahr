// Scan + Transliterator workspace logic (src/js/18c-verse-shared.js, 19-scan.js, 24-transcribe.js), run on the built page:
//   input detection, the rhythm map's data, the partner-misra diagnosis, the review stepper's order, the hand-off links.
// Run: node tests/workspace_logic.js
const { run } = require('./lib_page').loadPage();
const J = JSON.stringify;
let bad = 0;
const ok = (c, m) => { if (!c) { bad++; console.log('FAIL: ' + m); } };

// input detection
const det = t => run(`viDetect(${J(t)})`);
ok(det('dil-e nadan tujhe hua kya hai').kind === 'ro', 'casual Roman');
ok(det('dil-e nādāñ tujhe huā kyā hai').kind === 'rod', 'Roman with diacritics');
ok(det('دلِ ناداں تجھے ہوا کیا ہے').kind === 'ur', 'Urdu script');
ok(det('دل می‌رود ز دستم صاحب‌دلان خدا را\nدردا که راز پنهان خواهد شد آشکارا').kind === 'fa', 'Fārsī script');
ok(det('दिल-ए नादाँ तुझे हुआ क्या है').kind === 'hi', 'Devanagari');
ok(det('') === null, 'no text, no badge');

// rhythm map: built from the chips' own data (a hand-made diagnosis: one extra, one flexible, one tick)
const ex = [
  { syl: [{ resolved: 'l', native: 'l' }, { resolved: 's', native: 'x' }, { resolved: 'c', fsyl: '+' }], feet: [{ idx: [0, 1, 2], ur: 'فعولن' }] },
  { syl: [{ resolved: 'l', native: 'l' }, { resolved: 's', native: 's', extra: true }, { missing: true, expected: 'l' }], feet: [{ idx: [0, 1] , ur: 'فعولن' }, { idx: [2], ur: '' }] }
];
const d = run(`rhythmMapData(${J(ex)}, [true, false])`);
ok(d.cols.length === 2 && d.cols[0].n === 3 && d.cols[0].name === 'فعولن', 'columns are feet: ' + J(d.cols));
ok(J(d.rows[0].feet[0]) === J([{ w: 'l', flex: false }, { w: 's', flex: true }, { tick: true }]), 'weights, flex and tick: ' + J(d.rows[0].feet[0]));
ok(d.rows[1].feet[0][1].bad === true && d.rows[1].feet[1][0].gap === true && d.rows[1].ok === false, 'a syllable with no room is bad, a missing slot a gap');

// the real thing: Ghalib 21, couplet 8 (the misra that does not scan) is named in the diagnosis as the partner misra, not as an example verse
run(`$('scanIn').value = ghazalScanText('ghalib/21'); runScan();`);
ok(run('lastScan.results.length') === 26, 'Ghalib 21 scanned');
const info = run('scanMapInfo()');
ok(info && info.rows.length === 26 && info.rows[14].ok === false, 'row 15 (couplet 8, misra 1) does not fit');
const html = run('renderUnscannedDiagnostic(lineExplain(14), "ur", true, 14)');
ok(/partner misra/.test(html) && html.includes('دل ہر قطرہ') === false && html.includes('اسے ہم نے') === false, 'diagnosis names the partner misra, not an example verse');
const partner = run('lastScan.lineObjs[15].ur');
ok(html.includes(partner), 'partner misra text is shown: ' + partner);
ok(/too many|short|wrong weight/.test(html), 'says in words what is wrong');
ok(run('scanRailItems()').length === 13 && run('scanRailItems()')[7].ok === false, 'rail: 13 couplets, the 8th does not fit');

// sample cards load full ghazals (whole rhythm map + rail)
run(`scanTry(0);`);
ok(run('lastScan.results.length') >= 10 && run('scanMapInfo()') !== null && run('scanRailItems().length') >= 5, 'sample card 0 loads whole ghazal into Scan');

const href = run(`TR.script='ro'; trScanHref(trBuild("dil-e nadan tujhe hua kya hai", {choices:{}}), false)`);
ok(href === '#/scan?t=' + encodeURIComponent(run(`trText(trBuild("dil-e nadan tujhe hua kya hai", {choices:{}}), 'ur')`)), 'Scan hand-off carries the Urdu output: ' + href);
ok(run(`scanTranscribeHref("a b\\nc")`) === '#/lab/transcribe?t=a%20b%0Ac', 'Transliterator hand-off');
ok(J(run('trPaGroups("پاݨی ٻال")')) === J(['punjabi', 'saraiki']) && run('trPaGroups("پانی")').length === 0, 'Punjabi / Saraiki letters link the right Letters groups');

// the input override changes the reading: forced Fārsī reads a Roman word from the Persian list
const lang = i => run(`trBuild("man", {choices:{}, input:${J(i)}}).lines[0].words[0].lang`);
ok(lang('fa') === 'fa' && lang('ur') === 'ur', 'the override sets the language the line is read in');

// wide meter rhythm map (8 feet) gets rmap-wide and omits duplicate legend; interlinear supports diacritics + modern rows
run(`$('scanIn').value = "میرے رشک قمر تو نے پہلی نظر جب نظر سے ملائی مزا آ گیا\\nمیرے رشک قمر تو نے پہلی نظر جب نظر سے ملائی مزا آ گیا\\nمیرے رشک قمر تو نے پہلی نظر جب نظر سے ملائی مزا آ گیا"; runScan();`);
ok(run('scanMapInfo().cols.length') === 8, '8-foot verse produces 8 map columns');
ok(!run('$("scanMap").innerHTML.includes("rmap-grid")') && run('$("scanMap").innerHTML.includes("scan-viewbar")'), 'the map is folded by default: only the Couplets | Rhythm map bar shows');
run('scanSetView("map")');
ok(run('$("scanMap").innerHTML.includes("rmap-wide") && !$("scanMap").innerHTML.includes("rmap-key")'), 'wide map uses rmap-wide and single legend');
ok(run('$("scanMap").innerHTML.includes(\'data-pb="scan:all"\') && /class="rm [^"]*" data-i="0"/.test($("scanMap").innerHTML)'), 'the bar has ▶ Play the ghazal, and each map mark knows its syllable (the player lights them)');
ok(!run('$("scanOut").innerHTML.includes("ss-pat-key")') && !/style="/.test(run('$("scanOut").innerHTML')), 'the summary has no pattern key line and no inline style');
run('scanJump(1)');
ok(run('scanView()') === 'cp', 'jumping to a couplet from the map goes back to the Couplets view');
const ilLine = run(`(function(){ TR.view='inter'; TR.inter={ro:true,rom:true,ur:true,fa:false,hi:false}; var m=trBuild("dil-e nadan tujhe hua kya hai"); return trLineHtml(m.lines[0],0); })()`);
ok(ilLine.includes('Diacritics') && ilLine.includes('Modern') && ilLine.includes('nādāñ') && ilLine.includes('nadan'), 'interlinear distinguishes diacritical and modern Roman rows');
ok(run(`(function(){ TR.view='inter'; TR.inter={ro:true,rom:false,ur:true,fa:false,hi:false}; trToggleInterStyle('rom'); trToggleInter('ur'); return TR.inter.ro && TR.inter.rom && !TR.inter.ur; })()`), 'interlinear toggles Classical/Modern and hides scripts independently');

console.log(bad ? `workspace_logic: ${bad} FAILED` : 'workspace_logic: all checks passed');
process.exit(bad ? 1 : 0);
