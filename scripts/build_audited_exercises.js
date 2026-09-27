const fs = require('fs');

// Initialize Sean Pue's graph parser
global.window = global;
eval(fs.readFileSync('pritchett_scripts/urdu_parser_data.js', 'utf8'));
eval(fs.readFileSync('pritchett_scripts/devanagari_parser_data.js', 'utf8'));
eval(fs.readFileSync('pritchett_scripts/diacritics_parser_data.js', 'utf8'));
eval(fs.readFileSync('pritchett_scripts/ghalib.js', 'utf8'));
global.p_di = new Parser('diacritics', diacritics_tokens, diacritics_token_regex, diacritics_graph, diacritics_onmatch);

// 1. Parse all notes from 11_exnotes.html
const notesHtml = fs.readFileSync('source_data/11_exnotes.html', 'utf8');

function stripTags(s) {
  if (!s) return '';
  return s.replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/gi, ' ')
          .replace(/\s+/g, ' ')
          .trim();
}

const noteSplits = [...notesHtml.matchAll(/<a\s+name=["'](\d+)["']/gi)];
const notesByNum = {};

// Authoritative meter IDs from Pritchett's handbook
const METERS_BY_GHAZAL = {
  1: [26],
  2: [11],
  3: [25],
  4: [14, 15],
  5: ['H'],
  6: [26],
  7: [10],
  8: ['H'],
  9: [18, 19],
  10: [33, 34],
  11: [27],
  12: [5],
  13: [14, 15],
  14: [37],
  15: [18, 19],
  16: [36],
  17: [18, 19],
  18: [10],
  19: [5],
  20: [8],
  21: [4],
  22: [36],
  23: [27],
  24: [37]
};

for (let i = 0; i < noteSplits.length; i++) {
  const m = noteSplits[i];
  const gid = parseInt(m[1], 10);
  const start = m.index;
  const end = (i + 1 < noteSplits.length) ? noteSplits[i + 1].index : notesHtml.length;
  const block = notesHtml.slice(start, end);

  // Poet match
  const poetM = block.match(/GHAZAL\s*(?:\n|\s)+[A-Z0-9\-]+\s+by\s+([^,:\n<]+)/i);
  const poet = poetM ? stripTags(poetM[1]) : '';

  // Clean out [back to top of page]
  const cleanBlock = block.replace(/\[\s*<a\s+href=["']#chart["']>[\s\S]*?\]/gi, '');
  const rawPs = [...cleanBlock.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map(p => stripTags(p[1])).filter(p => p && p !== '&nbsp;');

  let meterInfo = '';
  const introPs = [];
  const verses = {};
  let meterSeen = false;
  let firstVerseSeen = false;

  for (const p of rawPs) {
    if (p.includes('METER:')) {
      meterInfo = p.slice(p.indexOf('METER:') + 6).trim();
      meterSeen = true;
    } else if (/^VERSE\s+\d+/i.test(p)) {
      firstVerseSeen = true;
      const vm = p.match(/^VERSE\s+(\d+)[\s:]*(.*)/i);
      if (vm) {
        verses[parseInt(vm[1], 10)] = vm[2].trim();
      }
    } else {
      if (meterSeen && !firstVerseSeen) {
        introPs.append ? introPs.push(p) : introPs.push(p);
      }
    }
  }

  const intro = introPs.join(' ').trim();

  notesByNum[gid] = {
    poet,
    meter_info: meterInfo,
    meters: METERS_BY_GHAZAL[gid] || [],
    intro,
    verses
  };
}

console.log(`Parsed notes for all ${Object.keys(notesByNum).length} ghazals.`);

// 2. Parse all 24 ghazals from 10_ex_*.html
const exerciseFiles = [
  { file: 'source_data/10_ex_01_06.html', range: [1, 2, 3, 4, 5, 6] },
  { file: 'source_data/10_ex_07_12.html', range: [7, 8, 9, 10, 11, 12] },
  { file: 'source_data/10_ex_13_18.html', range: [13, 14, 15, 16, 17, 18] },
  { file: 'source_data/10_ex_19_24.html', range: [19, 20, 21, 22, 23, 24] }
];

function cleanLine(s) {
  return stripTags(s);
}

const allExercises = [];
let totalCoupletsCount = 0;
let totalLinesCount = 0;

for (const group of exerciseFiles) {
  const content = fs.readFileSync(group.file, 'utf8');

  for (const gid of group.range) {
    const tagPat = gid < 10 ? `0${gid}` : `${gid}`;
    let startMatch = content.search(new RegExp(`<a\\s+name=["'](?:${tagPat}|${gid})["']`, 'i'));
    if (startMatch === -1) {
      startMatch = content.search(new RegExp(`GHAZAL\\s*(?:\\n|\\s)+(?:${gid}|[A-Z\\-]+)\\s*,?\\s*by`, 'i'));
    }
    if (startMatch === -1) {
      console.error(`Error: start anchor for Ghazal ${gid} not found!`);
      continue;
    }

    const nextGid = gid + 1;
    let chunk = '';
    const afterStart = content.slice(startMatch + 10);
    if (group.range.includes(nextGid)) {
      const ntagPat = nextGid < 10 ? `0${nextGid}` : `${nextGid}`;
      let relEnd = afterStart.search(new RegExp(`<a\\s+name=["'](?:${ntagPat}|${nextGid})["']`, 'i'));
      if (relEnd === -1) {
        relEnd = afterStart.search(new RegExp(`GHAZAL\\s*(?:\\n|\\s)+(?:${nextGid}|[A-Z\\-]+)\\s*,?\\s*by`, 'i'));
      }
      chunk = (relEnd !== -1) ? content.slice(startMatch, startMatch + 10 + relEnd) : content.slice(startMatch);
    } else {
      const relEnd = afterStart.search(/<table\s+BORDER=4/i);
      chunk = (relEnd !== -1) ? content.slice(startMatch, startMatch + 10 + relEnd) : content.slice(startMatch);
    }

    // Extract poet
    const poetMatch = chunk.match(/GHAZAL\s*(?:\n|\s)+[A-Z0-9\-]+\s*,?\s*by\s+([^,:\n<]+)/i);
    let poet = poetMatch ? stripTags(poetMatch[1]) : '';
    if (!poet && notesByNum[gid]) poet = notesByNum[gid].poet;

    // Extract couplets from paragraphs containing Urdu class
    // Delimited by </p> or next <p or </blockquote>
    const pMatches = [...chunk.matchAll(/<p[^>]*>([\s\S]*?)(?=<\/p>|<p\b|<\/blockquote>|$)/gi)];
    const couplets = [];
    const lines = [];

    for (const pm of pMatches) {
      const p = pm[1];
      if (/class=["']urdu["']/i.test(p)) {
        if (/<br/i.test(p)) {
          const parts = p.split(/<br\s*\/?>/i);
          const l1 = cleanLine(parts[0]);
          const l2 = cleanLine(parts[1] || '');
          if (l1 && l2) {
            couplets.push({ l1, l2 });

            for (const rawL of [l1, l2]) {
              let ur = '', hi = '', ro = '';
              try {
                ur = window.p_ur.parse(rawL);
              } catch (e) {
                ur = rawL;
              }
              try {
                hi = window.p_hi.parse(rawL);
              } catch (e) {
                hi = rawL;
              }
              try {
                ro = window.p_di.parse(rawL);
              } catch (e) {
                ro = rawL;
              }

              lines.push({
                ascii: rawL,
                ur: ur.trim(),
                hi: hi.trim(),
                ro: ro.trim()
              });
            }
          }
        }
      }
    }

    totalCoupletsCount += couplets.length;
    totalLinesCount += lines.length;

    allExercises.push({
      id: gid,
      poet,
      meters: METERS_BY_GHAZAL[gid] || [],
      couplets_count: couplets.length,
      lines_count: lines.length,
      lines,
      notes: notesByNum[gid] || {}
    });

    console.log(`Ghazal ${gid < 10 ? '0' + gid : gid} (${poet}): ${couplets.length} couplets (${lines.length} lines)`);
  }
}

console.log(`\n========================================`);
console.log(`TOTAL AUDITED GHAZALS: ${allExercises.length}`);
console.log(`TOTAL COUPLETS: ${totalCoupletsCount}`);
console.log(`TOTAL LINES: ${totalLinesCount}`);
console.log(`========================================\n`);

// Save to data/exercises_verified.json
fs.writeFileSync('data/exercises_verified.json', JSON.stringify(allExercises, null, 2), 'utf8');
console.log('Saved data/exercises_verified.json successfully!');

// Also save simplified data/exercises.json compatible with existing UI and scansion load
const simplifiedExercises = allExercises.map(ex => ({
  id: ex.id,
  poet: ex.poet,
  meters: ex.meters,
  lines: ex.lines.map(l => l.ur),
  lines_full: ex.lines,
  notes: ex.notes
}));
fs.writeFileSync('data/exercises.json', JSON.stringify(simplifiedExercises, null, 2), 'utf8');
console.log('Saved data/exercises.json successfully!');
