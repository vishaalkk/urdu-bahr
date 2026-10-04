#!/usr/bin/env node
/**
 * scripts/enrich_columbia.js
 *
 * Enriches and scans the ghazals curated by the Columbia Urdu Poetry Group
 * (data/columbia_ghazals.json):
 *
 * 1. For both Rekhta and Urdushahkar lines, generates Sean Pue diacritics (ro)
 *    and Sean Pue ASCII (ascii) using `romanToAscii` and `p_di.parse`.
 * 2. Retains authentic Urdu script (ur) and Devanagari script (hi).
 * 3. Scans each ghazal with the prosody engine (`scanGhazal`) to determine
 *    its consensus bahr (`meters`) and `scan_pass_rate`.
 * 4. Preserves both the primary source URL (Rekhta/Urdushahkar) and the
 *    Columbia Urdu Poetry Group reading page URL (columbia_url).
 *
 * Outputs:
 * data/columbia_scanned.json
 */

const fs = require('fs');
const path = require('path');
const { root, loadEngine, scanGhazal, normalizeAscii } = require('./lib_scan');

const IN_FILE = path.join(root, 'data/columbia_ghazals.json');
const OUT_FILE = path.join(root, 'data/columbia_scanned.json');

const { Scan, ctx } = loadEngine();

const rawGhazals = JSON.parse(fs.readFileSync(IN_FILE, 'utf8'));
console.log(`Loaded ${rawGhazals.length} ghazals from ${IN_FILE}`);

const ARABIC_TO_URDU = {
  'ي': 'ی',
  'ى': 'ی',
  'ك': 'ک'
};

function normalizeUrdu(s) {
  if (!s) return '';
  return s.replace(/[يىك]/g, ch => ARABIC_TO_URDU[ch] || ch).trim();
}

function convertLine(l, sourceSite) {
  const ur = normalizeUrdu(l.ur);
  const hi = (l.hi || '').replace(/['’‘]/g, '').trim();
  const rawRo = sourceSite === 'shahkar' ? (l.ro_guidance || '') : (l.ro || '');
  const cleanRo = rawRo
    .replace(/['’‘]/g, '')
    .replace(/\.(?=[a-zA-Zāīūñṭḍṛṣżẓḥ])/g, '')
    .replace(/\.(?=\s|$)/g, '')
    .trim();

  let ascii = '';
  try {
    ascii = normalizeAscii(ctx.romanToAscii(cleanRo));
  } catch (e) {
    ascii = '';
  }

  let ro = '';
  if (ascii && ctx.window.p_di) {
    try {
      ro = ctx.window.p_di.parse(ascii);
    } catch (e) {
      ro = '';
    }
  }

  return {
    ur: ur,
    hi: hi,
    ro: ro || cleanRo,
    ascii: ascii
  };
}

let withMeter = 0;
const enrichedGhazals = [];

rawGhazals.forEach((g, idx) => {
  const convertedLines = g.lines.map(l => convertLine(l, g.source_site));
  const candidate = {
    poet: g.poet,
    title: g.title,
    source_site: g.source_site,
    url: g.url,
    columbia_url: g.columbia_url,
    lines: convertedLines
  };

  const scanned = scanGhazal(candidate, idx, { Scan, ctx });
  if (scanned.meters && scanned.meters.length > 0) {
    withMeter++;
  }

  enrichedGhazals.push({
    id: idx + 1,
    poet: g.poet,
    title: g.title,
    source_site: g.source_site,
    url: g.url,
    columbia_url: g.columbia_url,
    meters: scanned.meters || [],
    scan_pass_rate: scanned.scan_pass_rate || 0,
    lines_count: convertedLines.length,
    couplets_count: convertedLines.length / 2,
    lines: scanned.lines.map(l => ({
      ur: l.ur,
      hi: l.hi,
      ro: l.ro,
      ascii: l.ascii
    }))
  });
});

fs.writeFileSync(OUT_FILE, JSON.stringify(enrichedGhazals, null, 2) + '\n', 'utf8');

console.log(`\n==============================================`);
console.log(`Enrichment & Scansion Complete!`);
console.log(`Total Ghazals: ${enrichedGhazals.length}`);
console.log(`With Confident Bahr: ${withMeter} (${(withMeter / enrichedGhazals.length * 100).toFixed(1)}%)`);
console.log(`Saved to: ${OUT_FILE}`);
console.log(`==============================================`);
