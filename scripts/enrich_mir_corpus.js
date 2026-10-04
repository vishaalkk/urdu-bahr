#!/usr/bin/env node
/**
 * scripts/enrich_mir_corpus.js
 *
 * Enriches the Mir corpus by combining:
 * 1. Frances Pritchett's verified Mir corpus (data/mir_extended.json)
 * 2. Complete Rekhta scrape (data/poets/mir.json)
 *
 * Rules:
 * a) If Rekhta has missing couplets for a Fran ghazal, we insert those couplets
 *    in the canonical order of the original ghazal. Fran's existing couplets and
 *    hyperlinks (which contain commentary/translations) stay untouched.
 * b) If Fran already has the full ghazal (or Rekhta has no missing couplets),
 *    we keep Fran's ghazal untouched.
 * c) If Rekhta has ghazals not present in Fran at all, we incorporate them and
 *    scan them using the engine to determine their consensus bahr.
 * d) For verses originating from Rekhta, we convert the transliteration to match
 *    Fran's Sean Pue transliteration format (ascii, ur, hi, ro).
 *
 * Output:
 * data/mir_enriched.json
 */

const fs = require('fs');
const path = require('path');
const { root, loadEngine, scanGhazal, normalizeAscii } = require('./lib_scan');

const FRAN_FILE = path.join(root, 'data/mir_extended.json');
const REKHTA_FILE = path.join(root, 'data/poets/mir.json');
const OUT_FILE = path.join(root, 'data/mir_enriched.json');

const { Scan, ctx } = loadEngine();

// Transliteration helper for Rekhta lines
function convertRekhtaLine(l) {
  // Clean Rekhta Roman: remove quotes, dots inside words like ro.o.ge or taale.o
  const cleanRo = (l.ro || '')
    .replace(/['’‘]/g, '')
    .replace(/\.(?=[a-zA-Zāīūñṭḍṛṣżẓḥ])/g, '')
    .replace(/\.(?=\s|$)/g, '');

  let ascii = '';
  try {
    ascii = normalizeAscii(ctx.romanToAscii(cleanRo));
  } catch (e) {
    ascii = '';
  }
  let ro = '', hi = '';
  if (ascii) {
    try { ro = ctx.window.p_di.parse(ascii); } catch (e) {}
    try { hi = ctx.window.p_hi.parse(ascii); } catch (e) {}
  }
  // Normalize Arabic letters to Urdu
  const ur = (l.ur || '').replace(/ي/g, 'ی').replace(/ى/g, 'ی').replace(/ك/g, 'ک');
  return {
    ascii: ascii || '',
    ur: ur,
    hi: hi || l.hi || '',
    ro: ro || l.ro || ''
  };
}

// Couplet matching helpers
const MARKS = /[\u064B-\u065F\u0670\u0651\u0654\u0614\u200B-\u200D\uFEFF\u00AD]/g;

function tokens(text) {
  if (!text) return new Set();
  const s = text.replace(MARKS, '')
    .replace(/ي/g, 'ی').replace(/ى/g, 'ی').replace(/ك/g, 'ک')
    .replace(/[هة]/g, 'ہ').replace(/[أإآ]/g, 'ا').replace(/ؤ/g, 'و').replace(/ئ/g, 'ی');
  const words = s.split(/\s+/).map(w => w.replace(/[^ء-ۿ]/g, '')).filter(Boolean);
  return new Set(words);
}

function lineSim(text1, text2) {
  const t1 = tokens(text1);
  const t2 = tokens(text2);
  if (!t1.size || !t2.size) return 0;
  let inter = 0;
  for (const w of t1) {
    if (t2.has(w)) inter++;
  }
  const union = t1.size + t2.size - inter;
  return union ? inter / union : 0;
}

function coupletSim(c1, c2) {
  const s0 = lineSim(c1[0].ur, c2[0].ur);
  const s1 = lineSim(c1[1].ur, c2[1].ur);
  if (s0 >= 0.7 || s1 >= 0.7) return (s0 + s1) / 2;
  if (s0 >= 0.5 && s1 >= 0.5) return (s0 + s1) / 2;
  return 0.0;
}

function toCouplets(lines) {
  const couplets = [];
  for (let i = 0; i < lines.length; i += 2) {
    if (i + 1 < lines.length) {
      couplets.push([lines[i], lines[i + 1]]);
    }
  }
  return couplets;
}

function cleanFranLine(l) {
  return {
    ascii: l.ascii || '',
    ur: l.ur || '',
    hi: l.hi || '',
    ro: l.ro || ''
  };
}

function main() {
  console.log('Loading datasets...');
  const franGhazals = JSON.parse(fs.readFileSync(FRAN_FILE, 'utf8'));
  const rekhtaGhazals = JSON.parse(fs.readFileSync(REKHTA_FILE, 'utf8'));

  console.log(`Fran Mir ghazals: ${franGhazals.length}`);
  console.log(`Rekhta Mir ghazals: ${rekhtaGhazals.length}`);

  const franWithCouplets = franGhazals.map(g => ({
    ...g,
    couplets: toCouplets(g.lines.map(cleanFranLine))
  }));

  const rekhtaWithCouplets = rekhtaGhazals.map(g => ({
    ...g,
    couplets: toCouplets(g.lines)
  }));

  const matchedRekhtaIds = new Set();
  const enrichedCorpus = [];

  let countKeptFranFull = 0;
  let countEnrichedWithRekhta = 0;
  let totalCoupletsAdded = 0;

  franWithCouplets.forEach((fg, fIdx) => {
    let bestRg = null;
    let bestMatches = []; // array of { rIdx, fCoupletIdx, sim }

    rekhtaWithCouplets.forEach(rg => {
      const pairMatches = [];
      rg.couplets.forEach((rc, rIdx) => {
        fg.couplets.forEach((fc, fCoupletIdx) => {
          const sim = coupletSim(rc, fc);
          if (sim > 0) {
            pairMatches.push({ rIdx, fCoupletIdx, sim });
          }
        });
      });

      if (pairMatches.length > 0) {
        if (!bestMatches.length || pairMatches.length > bestMatches.length) {
          bestMatches = pairMatches;
          bestRg = rg;
        }
      }
    });

    if (!bestRg) {
      // No Rekhta match at all: keep Fran's ghazal as-is
      enrichedCorpus.push({
        id: fg.id,
        poet: fg.poet,
        meter_label: fg.meter_label,
        meters: fg.meters,
        url: fg.url,
        lines_count: fg.lines.length,
        scan_pass_rate: fg.scan_pass_rate,
        source_id: fg.source_id || '',
        lines: fg.lines.map(cleanFranLine)
      });
      countKeptFranFull++;
      return;
    }

    matchedRekhtaIds.add(bestRg.id);

    const rToF = new Map();
    const fUsed = new Set();
    bestMatches.forEach(m => {
      if (!rToF.has(m.rIdx) && !fUsed.has(m.fCoupletIdx)) {
        rToF.set(m.rIdx, m.fCoupletIdx);
        fUsed.add(m.fCoupletIdx);
      }
    });

    const hasMissingCouplets = bestRg.couplets.length > fg.couplets.length || rToF.size < bestRg.couplets.length;

    if (!hasMissingCouplets) {
      // Fran already has full ghazal: keep Fran's
      enrichedCorpus.push({
        id: fg.id,
        poet: fg.poet,
        meter_label: fg.meter_label,
        meters: fg.meters,
        url: fg.url,
        rekhta_url: bestRg.url,
        lines_count: fg.lines.length,
        scan_pass_rate: fg.scan_pass_rate,
        source_id: fg.source_id || '',
        lines: fg.lines.map(cleanFranLine)
      });
      countKeptFranFull++;
      return;
    }

    // Rekhta has missing couplets! Splicing in Rekhta's missing couplets
    const mergedCouplets = [];
    const franLineIndices = [];
    let addedForThisGhazal = 0;

    bestRg.couplets.forEach((rc, rIdx) => {
      const currentLineIdx = mergedCouplets.length * 2;
      if (rToF.has(rIdx)) {
        // Use Fran's original couplet
        const fCoupletIdx = rToF.get(rIdx);
        mergedCouplets.push(fg.couplets[fCoupletIdx]);
        franLineIndices.push(currentLineIdx, currentLineIdx + 1);
      } else {
        // Missing couplet from Rekhta: convert to Fran's Pue style
        const converted = [
          convertRekhtaLine(rc[0]),
          convertRekhtaLine(rc[1])
        ];
        mergedCouplets.push(converted);
        addedForThisGhazal++;
      }
    });

    // Check if Fran had any couplets not in Rekhta (preserve them at the end)
    fg.couplets.forEach((fc, fCoupletIdx) => {
      if (!fUsed.has(fCoupletIdx)) {
        const currentLineIdx = mergedCouplets.length * 2;
        mergedCouplets.push(fc);
        franLineIndices.push(currentLineIdx, currentLineIdx + 1);
      }
    });

    const mergedLines = mergedCouplets.flat();

    enrichedCorpus.push({
      id: fg.id,
      poet: fg.poet,
      meter_label: fg.meter_label,
      meters: fg.meters,
      url: fg.url,
      rekhta_url: bestRg.url,
      lines_count: mergedLines.length,
      couplets_count: mergedCouplets.length,
      scan_pass_rate: fg.scan_pass_rate,
      source_id: fg.source_id || '',
      lines: mergedLines,
      enriched: true,
      couplets_added: addedForThisGhazal,
      fran_lines: franLineIndices
    });

    countEnrichedWithRekhta++;
    totalCoupletsAdded += addedForThisGhazal;
  });

  console.log(`\n=== Intermediate Fran Processing Summary ===`);
  console.log(`Fran ghazals kept as-is: ${countKeptFranFull}`);
  console.log(`Fran ghazals enriched with Rekhta couplets: ${countEnrichedWithRekhta}`);
  console.log(`Total missing couplets added from Rekhta: ${totalCoupletsAdded} (${totalCoupletsAdded * 2} lines)`);

  // Step 3: Handle Rekhta ghazals not found in Fran at all (Rule c)
  let countBrandNewRekhta = 0;
  let nextId = Math.max(...enrichedCorpus.map(g => g.id)) + 1;

  rekhtaWithCouplets.forEach(rg => {
    if (matchedRekhtaIds.has(rg.id)) {
      return; // Already matched and merged
    }

    // Brand new ghazal from Rekhta!
    const convertedLines = rg.lines.map(convertRekhtaLine);

    // Run through scansion engine to find consensus bahr
    const scanned = scanGhazal({
      id: nextId,
      poet: 'Mir',
      url: rg.url,
      lines: convertedLines
    }, nextId, { Scan, ctx });

    enrichedCorpus.push({
      id: nextId,
      poet: 'Mir',
      meter_label: scanned.meters.length ? `R-${scanned.meters.join('/')}` : 'unassigned',
      meters: scanned.meters,
      url: rg.url,
      lines_count: convertedLines.length,
      couplets_count: Math.floor(convertedLines.length / 2),
      scan_pass_rate: scanned.scan_pass_rate,
      source_id: '',
      lines: convertedLines,
      source: 'rekhta_only'
    });

    nextId++;
    countBrandNewRekhta++;
  });

  console.log(`\n=== Rule (c) Brand New Rekhta Ghazals ===`);
  console.log(`Brand new ghazals incorporated from Rekhta: ${countBrandNewRekhta}`);

  enrichedCorpus.sort((a, b) => a.id - b.id);

  fs.writeFileSync(OUT_FILE, JSON.stringify(enrichedCorpus, null, 2) + '\n', 'utf8');

  const totalLines = enrichedCorpus.reduce((sum, g) => sum + g.lines.length, 0);
  console.log(`\nSaved enriched corpus to: ${path.relative(root, OUT_FILE)}`);
  console.log(`Total ghazals in enriched corpus: ${enrichedCorpus.length}`);
  console.log(`Total lines in enriched corpus: ${totalLines} (${totalLines / 2} couplets)`);
}

main();
