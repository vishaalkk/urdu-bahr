/* Tabla engine for the ear-lab taal pages (inlined by taal_gen.js; needs STROKES and VOICEPACK).
   Recorded strokes (tabla/SOURCES.md) played as thekas: a bol is one or two strokes struck together, no take twice
   running, a new stroke damps its drum's ring, small timing and loudness drift, section accents, a cycle that varies.
   TL holds the options (set by the page) and the player. */
const TL = { bpm: 200, voice: true, fills: true, cc0: false, onReady: null };

/* ---------- taals: bols per beat, sections (vibhāg) and their marks ---------- */
const TAALS = {
  dadra:      { name: 'Dadra', beats: 6, div: [3, 3], marks: ['×', '0'], khali: [1], bols: ['dha', 'dhin', 'na', 'dha', 'tu', 'na'] },
  rupak:      { name: 'Rupak', beats: 7, div: [3, 2, 2], marks: ['0', '1', '2'], khali: [0], bols: ['tin', 'tin', 'na', 'dhi', 'na', 'dhi', 'na'] },
  keherwa:    { name: 'Keherwa', beats: 8, div: [4, 4], marks: ['×', '0'], khali: [1], bols: ['dha', 'ge', 'na', 'ti', 'na', 'ke', 'dhi', 'na'] },
  jhaptaal:   { name: 'Jhaptaal', beats: 10, div: [2, 3, 2, 3], marks: ['×', '2', '0', '3'], khali: [2], bols: ['dhi', 'na', 'dhi', 'dhi', 'na', 'ti', 'na', 'dhi', 'dhi', 'na'] },
  deepchandi: { name: 'Deepchandi', beats: 14, div: [3, 4, 3, 4], marks: ['×', '2', '0', '3'], khali: [2], bols: ['dha', 'dhin', '-', 'dha', 'dha', 'tin', '-', 'ta', 'tin', '-', 'dha', 'dha', 'dhin', '-'] },
  teentaal:   { name: 'Teentaal', beats: 16, div: [4, 4, 4, 4], marks: ['×', '2', '0', '3'], khali: [2], bols: ['dha', 'dhin', 'dhin', 'dha', 'dha', 'dhin', 'dhin', 'dha', 'dha', 'tin', 'tin', 'ta', 'ta', 'dhin', 'dhin', 'dha'] }
};
Object.values(TAALS).forEach(T => {   /* section of each beat, and the beats that open a section */
  T.sec = []; T.starts = new Set(); let b = 0;
  T.div.forEach((n, i) => { T.starts.add(b); for (let k = 0; k < n; k++) T.sec[b++] = i; });
});

/* ---------- strokes: pools of real takes per sound; a bol is one or two sounds struck together ---------- */
const POOL = {
  na: ['na1', 'na2', 'a_na'], tin: ['tin1', 'tin2', 'tin3', 'a_tin'], tun: ['tun1', 'tun2', 'tun3', 'a_tun'],
  te: ['te1', 'te2', 'te3', 'te4', 'a_te', 'a_tit'], re: ['re1', 'a_re'], ke: ['ke1', 'ke2', 'ke3', 'a_ka'],
  ghe: ['ghe1', 'ghe2', 'ghe3', 'ghe4', 'a_ge'], gheLong: ['ghe_long1', 'ghe_long2'], dha: ['a_dha'], dhin: ['a_dhin']
};
const HAND = { na: 'R', tin: 'R', tun: 'R', te: 'R', re: 'R', ke: 'L', ghe: 'L', gheLong: 'L', dha: 'B', dhin: 'B' };
const MIX = { na: 0.8, tin: 0.62, tun: 0.7, te: 0.5, re: 0.38, ke: 0.42, ghe: 0.62, gheLong: 0.62, dha: 0.85, dhin: 0.85 };
const BOL = {
  dha: ['na', 'ghe'], dhin: ['tin', 'ghe'], dhi: ['tin', 'ghe'], na: ['na'], ta: ['na'], tin: ['tin'], ti: ['te'],
  tu: ['tun'], ge: ['ghe'], ke: ['ke'], ka: ['ke'], te: ['te'], re: ['re'], '-': []
};
const WHOLE = { dha: 'dha', dhin: 'dhin', dhi: 'dhin' };   /* a recorded dha / dhin, used now and then instead of the layered one */
const AJ_RATE = 314 / 322;   /* ajaysm's tabla sits ~45 cents above mmiron's; retune it to match */

let ctx = null, out = null, ready = null;
const buf = {}, voice = { da: [], dum: [] }, last = {}, ring = { R: null, L: null };
const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const b64 = s => { const bin = atob(s), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; };
const decode = data => new Promise(res => { try { const p = ctx.decodeAudioData(data, b => res(b), () => res(null)); if (p && p.catch) p.catch(() => res(null)); } catch (e) { res(null); } });
function peak(b) { const x = b.getChannelData(0); let p = 1e-4; for (let i = 0; i < x.length; i++) { const a = Math.abs(x[i]); if (a > p) p = a; } return p; }

function initAudio() {
  if (ready) return ready;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  /* a small room so the dry close-miked takes sit together: short noise tail, low in the mix */
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 3; comp.connect(ctx.destination);
  out = ctx.createGain(); out.gain.value = 0.9; out.connect(comp);
  const len = Math.floor(ctx.sampleRate * 0.55), ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
  const conv = ctx.createConvolver(); conv.buffer = ir; const wet = ctx.createGain(); wet.gain.value = 0.14;
  out.connect(conv); conv.connect(wet); wet.connect(comp);
  ready = Promise.all([
    ...Object.entries(STROKES).map(([k, s]) => decode(b64(s)).then(b => { if (b) buf[k] = { b, g: 0.9 / peak(b) }; })),
    ...['da', 'dum'].map(k => Promise.all(VOICEPACK[k].map(o => decode(b64(o.b64)).then(b => b && { b, off: o.off, dur: o.dur }))).then(a => { voice[k] = a.filter(Boolean); }))
  ]).then(() => { if (TL.onReady) TL.onReady(Object.keys(buf).length); });
  return ready;
}

/* one sound from a pool: never the same take twice running; a new stroke on a drum damps that drum's ring */
function sound(kind, t, vel, meend) {
  let pool = POOL[kind].filter(k => buf[k] && !(TL.cc0 && k.startsWith('a_')));
  if (!pool.length) return;
  if (pool.length > 1) pool = pool.filter(k => k !== last[kind]);
  const key = pool[Math.floor(Math.random() * pool.length)]; last[kind] = key;
  const s = buf[key], src = ctx.createBufferSource(), g = ctx.createGain(), hand = HAND[kind];
  src.buffer = s.b;
  const rate = (key.startsWith('a_') ? AJ_RATE : 1) * (1 + gauss() * 0.004);
  src.playbackRate.setValueAtTime(rate, t);
  if (meend) src.playbackRate.linearRampToValueAtTime(rate * 1.12, t + Math.min(0.45, meend));   /* the wrist presses: ghe rises */
  g.gain.value = s.g * MIX[kind] * vel;
  src.connect(g); g.connect(out); src.start(t);
  (hand === 'B' ? ['R', 'L'] : [hand]).forEach(h => {
    const prev = ring[h]; if (prev && prev.t < t) { prev.g.gain.setTargetAtTime(0, t, kind === 'ke' ? 0.012 : 0.03); try { prev.src.stop(t + 0.3); } catch (e) {} }
    ring[h] = { g, src, t };
  });
}
function bol(name, t, vel, meend) {
  if (!BOL[name] || name === '-') return;
  t += gauss() * 0.005;
  const whole = WHOLE[name];
  if (whole && !TL.cc0 && Math.random() < 0.22) { sound(whole, t, vel); return; }
  BOL[name].forEach(k => {
    if (k === 'ghe') sound(meend ? 'gheLong' : 'ghe', t + gauss() * 0.004, vel * (0.9 + Math.random() * 0.2), meend);   /* the hands land a few ms apart */
    else sound(k, t, vel);
  });
}

/* ---------- a cycle as a list of strokes in beats; variations so no two cycles are the same ---------- */
const FILL = [['te', 're'], ['ke', 'te'], ['na', 'ka'], ['te', 're'], ['ke', 'te']];
function cycleHits(T, opts = {}) {
  const hits = T.bols.map((b, i) => {
    const khali = T.khali.includes(T.sec[i]), first = T.starts.has(i);
    return { at: i, bol: b, vel: (i === 0 ? 1 : first ? 0.9 : 0.76) * (khali ? 0.88 : 1) * (0.94 + Math.random() * 0.12) };
  });
  if (opts.fill) {   /* the last section breaks into half-beat strokes, the last beat a dha with a rising ghe */
    const s0 = T.beats - T.div[T.div.length - 1];
    for (let i = hits.length - 1; i >= 0; i--) if (hits[i].at >= s0) hits.splice(i, 1);
    for (let b = s0, j = 0; b < T.beats - 1; b++, j++) FILL[j % FILL.length].forEach((x, h) => hits.push({ at: b + h / 2, bol: x, vel: 0.62 + (h ? 0 : 0.1) }));
    hits.push({ at: T.beats - 1, bol: 'dha', vel: 0.95, meend: 0.5 });
  } else if (Math.random() < 0.45) {   /* a small ornament: one beat split in two, or a ghe off the beat */
    const cand = T.bols.map((b, i) => i).filter(i => i > 0 && !T.khali.includes(T.sec[i]) && T.bols[i] !== '-');
    const i = cand[Math.floor(Math.random() * cand.length)];
    if (i !== undefined) hits.push(Math.random() < 0.5 ? { at: i + 0.5, bol: Math.random() < 0.5 ? 'te' : 'na', vel: 0.5 } : { at: i + 0.5, bol: 'ge', vel: 0.55 });
  }
  if (!opts.fill && Math.random() < 0.35) hits.push({ at: T.beats - 0.5, bol: 'ge', vel: 0.6, meend: 0.35 });   /* a sliding ghe into sam */
  return hits.sort((a, b) => a.at - b.at);
}
/* tihai: (te re ke te dha) three times, one half-beat rest between, the last dha on endBeat */
function tihaiHits(endBeat) {
  const P = ['te', 're', 'ke', 'te', 'dha'], hits = [];
  let h = endBeat * 2 - (3 * P.length + 2 - 1);
  for (let r = 0; r < 3; r++) { P.forEach((x, k) => hits.push({ at: (h + k) / 2, bol: x, vel: k === 4 ? 0.95 : 0.6 })); h += P.length + 1; }
  return hits;
}

/* the closing cycle: theka, then a tihai whose last dha lands on the next sam, all inside one cycle.
   (te re ke te dha) for taals of 8 beats or more, (te te dha) for Dadra and Rupak; half a beat between repeats */
function tihaiCycle(T) {
  const P = T.beats >= 8 ? ['te', 're', 'ke', 'te', 'dha'] : ['te', 'te', 'dha'];
  const start = 2 * T.beats - (3 * P.length + 2 * 1) + 1;   /* in half-beats; the last stroke falls on 2 × beats = sam */
  const hits = cycleHits(T).filter(h => h.at < start / 2 - 0.25);
  let h = start;
  for (let r = 0; r < 3; r++) { P.forEach((x, k) => { if (h + k < 2 * T.beats) hits.push({ at: (h + k) / 2, bol: x, vel: k === P.length - 1 ? 0.95 : 0.6 }); }); h += P.length + 1; }
  return hits;
}

/* ---------- player: a lookahead scheduler over cycles ----------
   source() gives the next cycle {len (beats), hits, voice: [{at, dur, long}], audio: [{at, fn(t, beatSecs)}],
   cues: [{at, len, fn(on)}]} or null when done.
   Cues run on screen in time with the sound (fn(true) at the start, fn(false) after len beats). */
TL.play = null;
TL.beat = () => 60 / TL.bpm;
TL.now = () => ctx ? ctx.currentTime : 0;
TL.stop = function () {
  const p = TL.play; if (!p) return;
  clearInterval(p.timer); cancelAnimationFrame(p.raf);
  p.cues.forEach(c => { if (c.lit) c.fn(false); });
  ['R', 'L'].forEach(h => { const r = ring[h]; if (r) { try { r.g.gain.setTargetAtTime(0, ctx.currentTime, 0.05); } catch (e) {} } ring[h] = null; });
  TL.play = null;
  if (p.onstop) p.onstop();
};
TL.start = function (source, onstop, meta = {}) {
  TL.stop();
  const p = TL.play = Object.assign({ cues: [], onstop, done: false }, meta);
  initAudio().then(() => {
    if (TL.play !== p) return;
    ctx.resume();
    p.t = p.t0 = ctx.currentTime + 0.12;
    const fill = () => {
      while (!p.done && p.t < ctx.currentTime + 0.6) {
        const cyc = source(); if (!cyc) { p.done = true; p.end = p.t + 1.2; break; }
        const bl = TL.beat();
        cyc.hits.forEach(h => bol(h.bol, p.t + h.at * bl, h.vel, h.meend != null ? Math.max(0.15, h.meend * bl * 2) : 0));
        if (TL.voice) (cyc.voice || []).forEach(v => sing(p.t + v.at * bl, v.dur * bl, v.long));
        (cyc.audio || []).forEach(a => a.fn(p.t + a.at * bl, bl));   /* any other sound the page schedules itself */
        (cyc.cues || []).forEach(c => p.cues.push({ t: p.t + c.at * bl, off: p.t + (c.at + c.len) * bl, fn: c.fn, lit: false }));
        p.t += cyc.len * bl;
      }
      if (p.done && ctx.currentTime > p.end) TL.stop();
    };
    fill(); p.timer = setInterval(fill, 60);
    const ui = () => {
      const now = ctx.currentTime;
      p.cues = p.cues.filter(c => {
        if (now >= c.off) { if (c.lit) c.fn(false); else { c.fn(true); c.fn(false); } return false; }
        if (now >= c.t && !c.lit) { c.lit = true; c.fn(true, (c.off - c.t)); }
        return true;
      });
      p.raf = requestAnimationFrame(ui);
    };
    ui();
  });
};
/* the app's recorded da / dum, the take that best fits the syllable's length */
function sing(t, dur, isLong) {
  const pool = isLong ? voice.dum : voice.da; if (!pool.length) return;
  let k = pool[0], bs = 1e9; pool.forEach(x => { const sc = Math.abs((x.dur - x.off) - dur * 0.92) + Math.random() * 0.05; if (sc < bs) { bs = sc; k = x; } });
  const src = ctx.createBufferSource(), g = ctx.createGain(); src.buffer = k.b;
  const st = Math.max(ctx.currentTime, t - k.off), hold = Math.min(k.dur, k.off + dur * 0.95), fo = Math.min(0.06, hold / 3);
  g.gain.setValueAtTime(0.75, st); g.gain.setValueAtTime(0.75, st + hold - fo); g.gain.linearRampToValueAtTime(0, st + hold);
  src.connect(g); g.connect(out); src.start(st); src.stop(st + hold + 0.02);
}

/* plain low / high tone for a syllable (the app's 'tone' voice) */
function tone(t, dur, isLong) {
  const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = isLong ? 220 : 330;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.35, t + 0.01); g.gain.setTargetAtTime(0, t + dur * 0.8, 0.03);
  o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.2);
}

/* ---------- a line on the taal ---------- */
/* a line's syllables in mātrās; a zero-length syllable (a final consonant) joins the one before it. i = the scanner's
   syllable indices it covers, so a page can light the scan's own chips */
function matras(line) {
  const out = [];
  line.syl.forEach((s, i) => { const m = s.w === 'l' ? 2 : s.w === 's' ? 1 : 0;
    if (!m && out.length) { out[out.length - 1].ro += s.ro; out[out.length - 1].i.push(i); }
    else if (m) out.push({ ro: s.ro, m, long: m === 2, i: [i] }); });
  return out;
}
function footStarts(line) {   /* mātrā offsets where each foot after the first begins */
  const ms = line.syl.map(s => s.w === 'l' ? 2 : s.w === 's' ? 1 : 0), at = [];
  line.feet.forEach((f, i) => { if (i && Array.isArray(f.idx) && f.idx.length) at.push(ms.slice(0, f.idx[0]).reduce((a, b) => a + b, 0)); });
  return at;
}
/* every taal scored for a couplet: beats held (the shortfall of the last cycle) minus the share of feet that open a section */
const PREF = { keherwa: 0, dadra: 0, rupak: 0.1, jhaptaal: 0.2, deepchandi: 0.4, teentaal: 0.5 };
function fitTaals(c) {
  const lines = c.lines.map(l => ({ m: matras(l), feet: footStarts(l) }));
  const nFeet = c.lines[0].feet.length;
  return Object.entries(TAALS).map(([k, T]) => {
    let pad = 0, al = 0, n = 0;
    lines.forEach(L => {
      const tot = L.m.reduce((a, s) => a + s.m, 0), cyc = Math.max(1, Math.ceil(tot / T.beats));
      pad += cyc * T.beats - tot;
      L.feet.forEach(f => { n++; if (T.starts.has(f % T.beats)) al++; });
    });
    pad /= lines.length;
    let score = pad - 1.5 * (n ? al / n : 0) + PREF[k];
    if (c.meterId === 'H') score += (k === 'keherwa' ? -3 : k === 'teentaal' ? -2.5 : 0);   /* the Hindi meter moves in 4-beat groups */
    else if (nFeet === 3 && k === 'dadra') score -= 0.2;
    else if (nFeet >= 4 && k === 'keherwa') score -= 0.2;
    return { k, pad, score, aligned: n ? al / n : 0 };
  }).sort((a, b) => a.score - b.score);
}
/* a line laid on the taal: each syllable's start beat and length, the shortfall added to the last syllable */
function layLine(line, T) {
  const m = matras(line), tot = m.reduce((a, s) => a + s.m, 0), cyc = Math.max(1, Math.ceil(tot / T.beats)), pad = cyc * T.beats - tot;
  const syl = []; let at = 0;
  m.forEach((s, j) => { const len = s.m + (j === m.length - 1 ? pad : 0); syl.push(Object.assign({}, s, { at, len, held: len - s.m })); at += len; });
  return { cyc, pad, tot, syl, len: cyc * T.beats };
}
/* a couplet as cycles: one cycle of theka alone, the lines, the tihai onto sam (if fills), a closing dha.
   lineCues(li, k) / beatCue(k) let the page attach its own cues per cycle */
function coupletCycles(laid, T, o = {}) {
  const seq = [];
  const cyc = (extra) => Object.assign({ len: T.beats, hits: cycleHits(T), cues: (o.beatCues ? o.beatCues(T.beats) : []) }, extra);
  seq.push(cyc({ phase: 'lead' }));
  laid.forEach((L, li) => { for (let k = 0; k < L.cyc; k++) {
    const lo = k * T.beats, hi = lo + T.beats, inCyc = L.syl.filter(s => s.at >= lo && s.at < hi);
    const c = cyc({ phase: 'line', li, k, voice: inCyc.map(s => ({ at: s.at - lo, dur: s.len, long: s.long || s.len > 1 })) });
    if (o.sylCue) inCyc.forEach(s => c.cues.push({ at: s.at - lo, len: s.len, fn: o.sylCue(li, s) }));
    if (o.cycleCue) c.cues.push({ at: 0, len: T.beats, fn: o.cycleCue(li, k) });
    seq.push(c);
  } });
  if (TL.fills) seq.push({ len: T.beats, hits: tihaiCycle(T), cues: (o.beatCues ? o.beatCues(T.beats) : []), phase: 'tihai' });
  seq.push({ len: 2, hits: [{ at: 0, bol: 'dha', vel: 1 }], cues: (o.beatCues ? o.beatCues(T.beats).slice(0, 1) : []), phase: 'sam' });
  return seq;
}
