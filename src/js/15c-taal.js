/* ================= TABLA THEKA, THE RIBBON, THE BALL =================
   Sound is layers, each on or off: voice, melody, tabla, tanpura, harmonium, pulse. With the tabla (settings.tabla) a couplet
   is played over a recorded theka. The line is laid
   on the taal by its mātrās (long 2 beats, short 1); a line that falls short of a whole cycle holds its last syllable, as a
   singer would. One clock runs the whole couplet: a cycle of theka alone, the lines (the voice comes in on sam), then the
   ending (tihai onto sam, or straight to sam, or the couplet again until stopped). pbToggle() hands a couplet here when
   tkWants() says so; stopAll() calls tkOnStop().
   Strokes: data/tabla/ (sources and licences in data/tabla/SOURCES.md), built small by scripts/build_tabla_strokes.py.
   The ribbon (under the playing couplet, kept when paused) has a row per layer with an on/off dot, and the controls wanted
   mid-play (▶ / ❚❚, taal, tempo, ⚙). The bouncing ball rides the syllables of every couplet that plays (settings.ball). */
const TABLA_STROKES = /*@@TABLA_STROKES@@*/;

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
/* the layers of sound, each on or off: voice, melody (Tarannum), tabla, tanpura (settings.drone), harmonium (settings.tarHarm),
   soft pulse (settings.pulse). Before layers there were three styles; settings.style is still kept in step (tkLegacy) for
   the players that use it (drills, previews) */
const TK_DEFAULTS = { tabla: false, taal: 'auto', taalEnd: 'tihai',
  ball: { on: true, shape: 'nuqta', color: 'weight', size: 'm', trail: false, squash: true, ripple: false, high: true } };
Object.keys(TK_DEFAULTS).forEach(k => { if (settings[k] == null) settings[k] = JSON.parse(JSON.stringify(TK_DEFAULTS[k])); });
Object.keys(TK_DEFAULTS.ball).forEach(k => { if (settings.ball[k] == null) settings.ball[k] = TK_DEFAULTS.ball[k]; });
if (!TAALS[settings.taal] && settings.taal !== 'auto') settings.taal = 'auto';
if (settings.voiceOn == null) {   /* from the three styles: Strokes = voice with a pause between feet, Groove = voice running on over
                                     the drone, Tarannum = the melody */
  const st = settings.style || 'strokes';
  settings.voiceOn = st !== 'tarannum'; settings.melodyOn = st === 'tarannum'; settings.gapOn = st === 'strokes';
  if (st === 'strokes') settings.drone = false;
  store.set('settings', settings);
}
function tkLegacy() { settings.style = settings.melodyOn && !settings.voiceOn ? 'tarannum' : (settings.gapOn ? 'strokes' : 'groove'); }
tkLegacy();

/* ---------- strokes: pools of real takes; a bol is one or two strokes struck together ---------- */
const TK_POOL = {
  na: ['na1', 'na2', 'a_na'], tin: ['tin1', 'tin2', 'tin3', 'a_tin'], tun: ['tun1', 'tun2', 'tun3', 'a_tun'],
  te: ['te1', 'te2', 'te3', 'te4', 'a_te', 'a_tit'], re: ['re1', 'a_re'], ke: ['ke1', 'ke2', 'ke3', 'a_ka'],
  ghe: ['ghe1', 'ghe2', 'ghe3', 'ghe4', 'a_ge'], gheLong: ['ghe_long1', 'ghe_long2'], dha: ['a_dha'], dhin: ['a_dhin']
};
const TK_HAND = { na: 'R', tin: 'R', tun: 'R', te: 'R', re: 'R', ke: 'L', ghe: 'L', gheLong: 'L', dha: 'B', dhin: 'B' };
const TK_MIX = { na: 0.8, tin: 0.62, tun: 0.7, te: 0.5, re: 0.38, ke: 0.42, ghe: 0.62, gheLong: 0.62, dha: 0.85, dhin: 0.85 };
const TK_BOL = {
  dha: ['na', 'ghe'], dhin: ['tin', 'ghe'], dhi: ['tin', 'ghe'], na: ['na'], ta: ['na'], tin: ['tin'], ti: ['te'],
  tu: ['tun'], ge: ['ghe'], ke: ['ke'], ka: ['ke'], te: ['te'], re: ['re'], '-': []
};
const TK_WHOLE = { dha: 'dha', dhin: 'dhin', dhi: 'dhin' };   /* a recorded dha / dhin, now and then, instead of the layered one */
const TK_AJ_RATE = 314 / 322;   /* the a_ takes sit ~45 cents above the others: retuned to match */
const TK = { buf: {}, ready: null, last: {}, ring: { R: null, L: null }, play: null, token: 0, pending: null };
const tkGauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const tkRAF = f => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(f) : setTimeout(() => f(Date.now()), 16));
const tkCAF = id => { if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(id); clearTimeout(id); };

/* decoded on the first tabla play, not at load */
function tkLoad() {
  if (TK.ready) return TK.ready;
  const peak = b => { const x = b.getChannelData(0); let p = 1e-4; for (let i = 0; i < x.length; i++) { const a = Math.abs(x[i]); if (a > p) p = a; } return p; };
  TK.ready = Promise.all(Object.entries(TABLA_STROKES || {}).map(([k, s]) => new Promise(res => {
    try {
      const bin = atob(s), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      const p = A.ctx.decodeAudioData(u.buffer, b => { TK.buf[k] = { b, g: 0.9 / peak(b) }; res(); }, () => res());
      if (p && p.catch) p.catch(() => res());
    } catch (e) { res(); }
  })));
  return TK.ready;
}
/* one stroke from a pool: never the same take twice running; a new stroke on a drum damps that drum's ring */
function tkSound(kind, t, vel, meend) {
  let pool = TK_POOL[kind].filter(k => TK.buf[k]);
  if (!pool.length) return;
  if (pool.length > 1) pool = pool.filter(k => k !== TK.last[kind]);
  const key = pool[Math.floor(Math.random() * pool.length)]; TK.last[kind] = key;
  const s = TK.buf[key], c = A.ctx, src = c.createBufferSource(), g = c.createGain(), hand = TK_HAND[kind];
  src.buffer = s.b;
  const rate = (key.startsWith('a_') ? TK_AJ_RATE : 1) * (1 + tkGauss() * 0.004);
  src.playbackRate.setValueAtTime(rate, t);
  if (meend) src.playbackRate.linearRampToValueAtTime(rate * 1.12, t + Math.min(0.45, meend));   /* the wrist presses: ghe rises */
  g.gain.value = s.g * TK_MIX[kind] * vel * 0.8;
  src.connect(g); g.connect(A.dest || A.out); src.start(Math.max(t, c.currentTime));
  (hand === 'B' ? ['R', 'L'] : [hand]).forEach(h => {
    const prev = TK.ring[h]; if (prev && prev.t < t) { prev.g.gain.setTargetAtTime(0, t, kind === 'ke' ? 0.012 : 0.03); try { prev.src.stop(t + 0.3); } catch (e) {} }
    TK.ring[h] = { g, src, t };
  });
}
function tkBol(name, t, vel, meend) {
  if (!TK_BOL[name] || name === '-') return;
  t += tkGauss() * 0.005;
  if (TK_WHOLE[name] && Math.random() < 0.22) { tkSound(TK_WHOLE[name], t, vel); return; }
  TK_BOL[name].forEach(k => {
    if (k === 'ghe') tkSound(meend ? 'gheLong' : 'ghe', t + tkGauss() * 0.004, vel * (0.9 + Math.random() * 0.2), meend);   /* the hands land a few ms apart */
    else tkSound(k, t, vel);
  });
}
/* a cycle as strokes in beats; small ornaments so no two cycles are the same */
function tkCycle(T) {
  const hits = T.bols.map((b, i) => {
    const khali = T.khali.includes(T.sec[i]), first = T.starts.has(i);
    return { at: i, bol: b, vel: (i === 0 ? 1 : first ? 0.9 : 0.76) * (khali ? 0.88 : 1) * (0.94 + Math.random() * 0.12) };
  });
  if (Math.random() < 0.45) {   /* one beat split in two, or a ghe off the beat */
    const cand = T.bols.map((b, i) => i).filter(i => i > 0 && !T.khali.includes(T.sec[i]) && T.bols[i] !== '-');
    const i = cand[Math.floor(Math.random() * cand.length)];
    if (i !== undefined) hits.push(Math.random() < 0.5 ? { at: i + 0.5, bol: Math.random() < 0.5 ? 'te' : 'na', vel: 0.5 } : { at: i + 0.5, bol: 'ge', vel: 0.55 });
  }
  if (Math.random() < 0.35) hits.push({ at: T.beats - 0.5, bol: 'ge', vel: 0.6, meend: 0.35 });   /* a sliding ghe into sam */
  return hits;
}
/* the closing cycle: theka, then a tihai whose last dha lands on the next sam, all inside one cycle.
   (te re ke te dha) × 3 for taals of 8 beats or more, (te te dha) × 3 for Dadra and Rupak; half a beat between repeats */
function tkTihai(T) {
  const P = T.beats >= 8 ? ['te', 're', 'ke', 'te', 'dha'] : ['te', 'te', 'dha'];
  const start = 2 * T.beats - (3 * P.length + 2) + 1;   /* in half-beats; the last stroke falls on 2 × beats = sam */
  const hits = tkCycle(T).filter(h => h.at < start / 2 - 0.25 && !h.meend);
  let h = start;
  for (let r = 0; r < 3; r++) { P.forEach((x, k) => { if (h + k < 2 * T.beats) hits.push({ at: (h + k) / 2, bol: x, vel: k === P.length - 1 ? 0.95 : 0.6 }); }); h += P.length + 1; }
  return hits;
}

/* ---------- a line on the taal ---------- */
/* {seq, feet} → syllables in mātrās: long, flexible and a missing long take 2 beats, short and a missing short 1 (a missing
   one stays silent); an extrametrical c joins the syllable before. i = the seq indices a syllable covers */
function tkMatras(p) {
  const out = [];
  p.seq.forEach((v, i) => {
    const m = (v === 'l' || v === 'x' || v === 'rl') ? 2 : (v === 's' || v === 'rs') ? 1 : 0;
    if (!m) { if (out.length) out[out.length - 1].i.push(i); return; }
    out.push({ m, long: m === 2, rest: v === 'rl' || v === 'rs', i: [i], fs: i === 0 || p.feet[i] !== p.feet[i - 1] });
  });
  return out;
}
function tkFootStarts(p) {   /* mātrā offsets where each foot after the first begins */
  const at = []; let acc = 0;
  p.seq.forEach((v, i) => { if (i && p.feet[i] !== p.feet[i - 1]) at.push(acc); acc += (v === 'l' || v === 'x' || v === 'rl') ? 2 : (v === 's' || v === 'rs') ? 1 : 0; });
  return at;
}
/* every taal scored for a couplet: beats held (the shortfall of the last cycle) minus the share of feet that open a section */
const TK_PREF = { keherwa: 0, dadra: 0, rupak: 0.1, jhaptaal: 0.2, deepchandi: 0.4, teentaal: 0.5 };
function tkFits(ps, meterId) {
  const lines = ps.map(p => ({ m: tkMatras(p), feet: tkFootStarts(p) }));
  const nFeet = ps.length ? new Set(ps[0].feet).size : 0;
  return Object.entries(TAALS).map(([k, T]) => {
    let pad = 0, al = 0, n = 0;
    lines.forEach(L => {
      const tot = L.m.reduce((a, s) => a + s.m, 0), cyc = Math.max(1, Math.ceil(tot / T.beats));
      pad += cyc * T.beats - tot;
      L.feet.forEach(f => { n++; if (T.starts.has(f % T.beats)) al++; });
    });
    pad /= Math.max(1, lines.length);
    let score = pad - 1.5 * (n ? al / n : 0) + TK_PREF[k];
    if (meterId === 'H') score += (k === 'keherwa' ? -3 : k === 'teentaal' ? -2.5 : 0);   /* the Hindi meter moves in 4-beat groups */
    else if (nFeet === 3 && k === 'dadra') score -= 0.2;
    else if (nFeet >= 4 && k === 'keherwa') score -= 0.2;
    return { k, pad, score };
  }).sort((a, b) => a.score - b.score);
}
function tkLay(p, T) {   /* each syllable's start beat and length; the shortfall goes to the last syllable */
  const m = tkMatras(p), tot = m.reduce((a, s) => a + s.m, 0), cyc = Math.max(1, Math.ceil(tot / T.beats)), pad = cyc * T.beats - tot;
  let at = 0;
  const syl = m.map((s, j) => { const len = s.m + (j === m.length - 1 ? pad : 0); const o = Object.assign({}, s, { at, len }); at += len; return o; });
  return { cyc, pad, tot, syl };
}
const tkMeterOf = lines => (lines.find(L => L.m) || {}).m;
const tkKeyFor = ps => settings.taal === 'auto' || !TAALS[settings.taal] ? tkFits(ps, tkMeterOf(TK.lines || []))[0].k : settings.taal;

/* ---------- the couplet player ----------
   Every couplet ▶ in the reader, Scan, Look up and the Home example plays here, whatever the layers: with the tabla, the
   lines are laid on the taal (a cycle of theka first, the ending after); without it, they run at their own length (a pause
   between feet if asked, a breath at the caesura and between lines). Patterns, single words, Learn and the drills keep
   today's player (15-audio.js play()). */
const TK_KEYS = /^(reader|scan|line|orig|lookup|home):/;
function tkWants(lines, key) {
  return !!(TK_KEYS.test(key || '') && lines && lines.length && lines.every(L => L && L.e && L.e.syl && L.e.syl.length >= 6));
}
function tkOnStop() {
  const P = TK.play; TK.token++;
  if (!P) return;
  clearInterval(P.timer); tkCAF(P.raf);
  P.cues.forEach(c => { if (c.lit) { try { c.fn(false); } catch (e) {} } });
  TK.play = null; TK.pending = null;
}
/* the voice of a syllable: the chosen sound, except that with the theka on a tabla voice gives way to da · dum */
function tkVoice(t, dur, isLong, pos) {
  const kind = settings.tabla && (settings.sound === 'tablarec' || settings.sound === 'tabla') ? 'rec' : settings.sound;
  syllableSound(t, dur, isLong, 1, pos, 0.97, kind);
}
function tkRun(lines, start) {
  if (!A.ensure()) return;
  A.released = false; iosPlaybackSession(); clearTimeout(A.idleT);
  const tok = ++TK.token, btn = PB.btn, key = PB.key;
  TK.lines = lines;
  Promise.all([settings.tabla ? tkLoad() : null, A.rec ? null : loadRec()]).then(() => { if (tok === TK.token && PB.playing) tkGo(lines, start, tok, btn, key); });
}
/* a line without the tabla: syllables at their own length; a pause after each foot (voice, if asked), a breath at the caesura */
function tkFree(p) {
  const m = tkMatras(p), syl = []; let at = 0;
  const lastOfFoot = i => i === p.seq.length - 1 || p.feet[i + 1] !== p.feet[i];
  m.forEach((s, j) => {
    const f = p.feet[s.i[0]];
    if (j && s.fs && p.cae.includes(f)) at += 1;
    syl.push(Object.assign({}, s, { at, len: s.m }));
    at += s.m;
    if (j < m.length - 1 && settings.voiceOn && settings.gapOn && lastOfFoot(s.i[s.i.length - 1])) at += (settings.footGap != null ? settings.footGap : 0.5);
  });
  if (settings.melodyOn && syl.length) { const L = syl[syl.length - 1]; L.len *= 1.5; at += L.m * 0.5; }   /* a sung line lands long */
  return { syl, len: at, cyc: 1 };
}
/* each layer plays through its own gain, so turning one off or on takes effect at once: everything is scheduled, the gate decides */
function tkLayerOn(k) {
  return k === 'voice' ? !!settings.voiceOn : k === 'melody' ? !!settings.melodyOn : k === 'harm' ? !!(settings.melodyOn && settings.tarHarm)
    : k === 'tabla' ? !!settings.tabla : k === 'pulse' ? !!(settings.pulse && !settings.tabla) : true;
}
function tkGates() {
  const P = TK.play; if (!P || !P.bus) return;
  Object.entries(P.bus).forEach(([k, g]) => { try { g.gain.setTargetAtTime(tkLayerOn(k) ? 1 : 0, A.ctx.currentTime, 0.03); } catch (e) {} });
}
function tkGo(lines, start, tok, btn, key) {
  const c = A.ctx, sess = c.createGain(); sess.gain.value = 1; sess.connect(A.voiceBus || A.out); A.sess = sess; A.dest = sess;
  const bus = {}; ['voice', 'melody', 'harm', 'tabla', 'pulse'].forEach(k => { const g = c.createGain(); g.gain.value = tkLayerOn(k) ? 1 : 0; g.connect(sess); bus[k] = g; });
  tarTuneFromRec();
  if (settings.drone) tarDroneStart();
  const ps = lines.map(L => L.p || exSeq(L.e)), n = ps.length;
  if (settings.melodyOn) TAR.round++;
  const taal = !!settings.tabla;
  let T = TAALS[tkKeyFor(ps)], phase = taal ? 'lead' : 'line', li = Math.max(0, Math.min(n - 1, (start && start.line) || 0)), k = 0, laid = null, bl = 60 / settings.bpm;
  const steps = lines.map((L, i) => pbStepFn(L, i, ps[i]));
  const P = TK.play = { t: c.currentTime + 0.15, cues: [], T, ps, done: false, taal, bus, sess };
  P.t0 = P.t;
  P.rib = tkRibbon(tkBox(btn), btn, T, ps);
  const ribCues = () => taal ? P.rib.cells.map((el, i) => ({ at: i, len: 1, fn: on => { const x = P.rib.cells[i]; if (x) x.classList.toggle('now', on); } })) : [];
  const count = txt => ({ at: 0, len: 0.01, fn: on => { if (on && !TK.pending) tkCount(txt); } });
  const pulse = len => !taal ? Array.from({ length: Math.ceil(len) }, (_, i) => ({ at: i, layer: 'pulse', fn: t => { tarTick(t, 0.05); if (tkLayerOn('pulse')) tkPulseBlink(t); } })) : [];
  const lineCycle = (L, lo, len, myLi, first) => {
    const my = L.syl.filter(s => s.at >= lo && s.at < lo + len);
    const cyc = { len, bl, hits: taal ? tkCycle(T) : [], voice: [], audio: pulse(len), cues: ribCues() };
    if (first) cyc.melody = { li: myLi, laid: L, lenBeats: taal ? L.cyc * T.beats : L.len };
    if (first && !taal && settings.gapOn && settings.footPulse !== false) my.filter(s => s.fs).forEach(s => cyc.audio.push({ at: s.at, layer: 'voice', fn: t => footThump(t, 0.9) }));
    if (taal) cyc.cues.unshift({ at: 0, len: 0.01, fn: on => { if (on) tkBeatSyl(my, lo, len, myLi); } });
    my.forEach(s => {
      const gi = s.i[0], pos = gi / Math.max(1, ps[myLi].seq.length - 1);
      if (!s.rest) cyc.voice.push({ at: s.at - lo, dur: s.len, long: s.long || s.len > 1, pos });
      cyc.cues.push({ at: s.at - lo, len: s.len, fn: (on, secs) => { if (on) { steps[myLi](gi, secs * 1000, s.len); tkNowSyl(myLi, s, gi); } } });
    });
    return cyc;
  };
  const nextLine = () => { if (++li >= n) { if (settings.taalEnd === 'loop' && taal) { li = 0; if (settings.melodyOn) TAR.round++; } else phase = taal ? 'tail' : 'done'; } };
  const source = () => {
    const clearSyl = { at: 0, len: 0.01, fn: on => { if (on) tkBeatSyl([], 0, T.beats); } };
    if (phase === 'lead') { phase = 'line'; return { len: T.beats, bl, hits: tkCycle(T), cues: [clearSyl].concat(ribCues(), count('theka · the voice comes in on sam')) }; }
    if (phase === 'line') {
      if (!taal) {   /* a whole line at its own length, then a breath */
        bl = 60 / settings.bpm * (settings.melodyOn && !settings.voiceOn && settings.tarInst === 'sarangi' ? 1.25 : 1);   /* sarangi phrasing breathes */
        laid = tkFree(ps[li]); bindLine(li);
        const cyc = lineCycle(laid, 0, laid.len + 0.8, li, true);
        cyc.cues.push(count(`line ${li + 1} of ${n}`));
        nextLine(); return cyc;
      }
      const pre = [];
      if (k === 0) {   /* a new line: a waiting taal change starts here, on sam; the tempo is held for the whole line */
        if (TK.pending && TAALS[TK.pending]) { T = TAALS[TK.pending]; P.T = T; const T2 = T; pre.push({ at: 0, len: 0.01, fn: on => { if (on) { TK.pending = null; tkRibbonDraw(P.rib, T2); } } }); }
        bl = 60 / settings.bpm;
        laid = tkLay(ps[li], T); bindLine(li);
      }
      const cyc = lineCycle(laid, k * T.beats, T.beats, li, k === 0);
      cyc.cues = pre.concat(cyc.cues, count(`line ${li + 1} · cycle ${k + 1} of ${laid.cyc}` + (settings.taalEnd === 'loop' ? ' · looping' : '')));
      if (++k >= laid.cyc) { k = 0; nextLine(); }
      return cyc;
    }
    if (phase === 'tail') {
      const off = { at: 0, len: 0.01, fn: on => { if (on) steps.forEach(s => s.clear && s.clear()); } };
      if (settings.taalEnd === 'sam') { phase = 'done'; return { len: 2, bl, hits: [{ at: 0, bol: 'dha', vel: 1 }], cues: [ribCues()[0], off, count('sam')] }; }
      phase = 'sam';
      return { len: T.beats, bl, hits: tkTihai(T), cues: [clearSyl].concat(ribCues(), off, count('tihai · onto sam')) };
    }
    if (phase === 'sam') { phase = 'done'; return { len: 2, bl, hits: [{ at: 0, bol: 'dha', vel: 1 }], cues: [ribCues()[0], count('sam')] }; }
    return null;
  };
  function bindLine(i) { P.li = i; }
  const fill = () => {
    if (tok !== TK.token) return;
    while (!P.done && P.t < c.currentTime + 0.6) {
      const cyc = source(); if (!cyc) { P.done = true; P.end = P.t + 0.8; break; }
      const b = cyc.bl || 60 / settings.bpm;
      A.dest = bus.tabla; (cyc.hits || []).forEach(h => tkBol(h.bol, P.t + h.at * b, h.vel, h.meend ? Math.max(0.15, h.meend * b * 2) : 0));
      A.dest = bus.voice; (cyc.voice || []).forEach(v => tkVoice(P.t + v.at * b, v.dur * b, v.long, v.pos));
      (cyc.audio || []).forEach(a => { A.dest = bus[a.layer] || sess; a.fn(P.t + a.at * b, b); });
      if (cyc.melody) tkSing(P.t, cyc.melody, b, lines, ps);
      A.dest = sess;
      (cyc.cues || []).forEach(cu => { if (cu && cu.fn) P.cues.push({ t: P.t + cu.at * b, off: P.t + (cu.at + cu.len) * b, fn: cu.fn, lit: false }); });
      P.t += cyc.len * b;
    }
    if (P.done && c.currentTime > P.end) { stopAll(); pbFinish(); }
  };
  fill(); P.timer = setInterval(fill, 60); A.timers.push(P.timer);
  const ui = () => {
    if (tok !== TK.token) return;
    const now = c.currentTime;
    P.cues = P.cues.filter(cu => {
      if (now >= cu.off) { if (cu.lit) cu.fn(false); else { cu.fn(true, cu.off - cu.t); cu.fn(false); } return false; }
      if (now >= cu.t && !cu.lit) { cu.lit = true; cu.fn(true, cu.off - cu.t); }
      return true;
    });
    P.raf = tkRAF(ui);
  };
  ui();
}
/* the melody of a whole line on its syllables' timing (played from 15b's instruments) */
function tkSing(t0, mel, b, lines, ps) {
  const L = lines[mel.li];
  const ev = mel.laid.syl.filter(s => !s.rest).map(s => ({ at: s.at * b, dur: s.len * b, isLong: s.long, i: s.i[0], fs: s.fs, vol: s.fs ? 1 : 0.82 }));
  const hook = typeof tarHookFor === 'function' ? tarHookFor(lines, mel.li) : -1;
  const ro = L.e && typeof translitText === 'function' ? L.e.syl.map(x => { try { return translitText(x.text, 'ro'); } catch (err) { return ''; } }) : null;
  const P = TK.play, harm = settings.tarHarm;
  settings.tarHarm = false; A.dest = P.bus.melody;   /* the harmonium goes on its own gate */
  const pts = tarSingLine(t0, ev, { line: mel.li, lines: lines.length, hook, ro, len: mel.lenBeats * b, n: ps[mel.li].seq.length });
  settings.tarHarm = harm;
  if (pts) { A.dest = P.bus.harm; tarHarmonium(t0, ev, pts, mel.lenBeats * b, 0.7); }
  A.dest = P.sess;
  if (pts && TK.play) { TK.play.mel = TK.play.mel || []; TK.play.mel[mel.li] = new Map(ev.map((e, j) => [e.i, pts[j] && pts[j][0] ? pts[j][0].s : null])); }
}

/* ---------- the ribbon: what is playing, one row per layer (tap the dot to turn it on or off), and the controls ---------- */
const TK_SARGAM = ['Sa', 're', 'Re', 'ga', 'Ga', 'Ma', 'Ma′', 'Pa', 'dha', 'Dha', 'ni', 'Ni'];
function tkNoteName(s) {   /* semitones from Sa → sargam, a dot below for the low octave and above for the high */
  if (s == null) return '–';
  const o = Math.floor(s / 12), nm = TK_SARGAM[((s % 12) + 12) % 12];
  return o < 0 ? nm[0] + '̣' + nm.slice(1) : o > 0 ? nm[0] + '̇' + nm.slice(1) : nm;
}
function tkBox(btn) { return btn && typeof btn.closest === 'function' ? btn.closest('.couplet-card, .misra-card, .card') : null; }
function tkEl(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
const TK_RIB = { R: null };   /* the ribbon on screen */
function tkRibbon(box, btn, T, ps) {
  const R = { el: null, cells: [], ps, btn, T };
  if (!box || typeof document === 'undefined' || typeof document.createElement !== 'function') return R;
  tkRibbonRemove();
  const el = R.el = tkEl('div', 'tk-rib');
  el.setAttribute('aria-label', 'What is playing');
  const head = tkEl('div', 'tk-rib-head');
  const play = R.play = tkEl('button', 'tk-rib-play', '❚❚'); play.type = 'button'; play.setAttribute('aria-label', 'Pause');
  const tb = R.tb = tkEl('button', 'tk-rib-taal'); tb.type = 'button'; tb.setAttribute('aria-expanded', 'false');
  const cnt = R.count = tkEl('span', 'tk-rib-count');
  const tempo = tkEl('span', 'tk-rib-tempo', '<button type="button" aria-label="Slower">−</button><span class="v"></span><button type="button" aria-label="Faster">+</button>');
  const gear = tkEl('button', 'tk-rib-gear', '⚙'); gear.type = 'button'; gear.setAttribute('aria-label', 'Sound settings');
  head.append(play, tb, cnt, tempo, gear); el.appendChild(head);
  R.pop = tkEl('div', 'tk-rib-pop hidden'); el.appendChild(R.pop);
  R.rows = tkEl('div', 'tk-rows'); el.appendChild(R.rows);
  box.appendChild(el);
  const [down, , up] = tempo.children; R.bpm = tempo.querySelector('.v');
  down.onclick = () => { setBpm(Math.max(60, settings.bpm - 10)); R.bpm.textContent = settings.bpm; };
  up.onclick = () => { setBpm(Math.min(260, settings.bpm + 10)); R.bpm.textContent = settings.bpm; };
  gear.onclick = () => { if (typeof openSettings === 'function') openSettings(); };
  play.onclick = () => { if (R.btn && typeof R.btn.click === 'function') R.btn.click(); };   /* the couplet's own ▶ / ❚❚ */
  tb.onclick = () => tkPop(R, 'taal');
  R.bpm.textContent = settings.bpm;
  TK_RIB.R = R;
  tkRibbonDraw(R, T);
  return R;
}
function tkRibbonRemove() { if (typeof document !== 'undefined' && typeof document.querySelectorAll === 'function') document.querySelectorAll('.tk-rib').forEach(e => e.remove()); TK_RIB.R = null; }
/* paused or finished: the ribbon stays, its ▶ resumes (the couplet's ▶ remembers where) */
function tkRibbonPaused() {
  const R = TK_RIB.R; if (!R || !R.el || TK.play) return;
  R.play.textContent = '▶︎'; R.play.setAttribute('aria-label', 'Play');
  if (R.count) R.count.textContent = PB.resume ? 'paused · ▶ resumes from this line' : 'stopped · ▶ plays again';
  R.cells.forEach(x => x.classList.remove('now'));
}
function tkCount(txt) { const R = TK_RIB.R; if (R && R.count) R.count.textContent = txt; }
function tkRibbonDraw(R, T) {
  if (!R.el) return;
  R.T = T;
  const playing = !!TK.play;
  R.play.textContent = playing ? '❚❚' : '▶︎';
  R.tb.classList.toggle('hidden', !settings.tabla);
  R.tb.innerHTML = `${T.name} · ${T.beats}${settings.taal === 'auto' ? '<span class="auto">auto</span>' : ''} ▾`;
  R.rows.innerHTML = ''; R.cells = []; R.mel = R.harm = R.syl = R.tick = null;
  const rtl = typeof currentScript !== 'undefined' && currentScript === 'ur';
  const row = (layer, on, lbl, sub, body, chooser) => {
    const d = tkEl('div', 'tk-row' + (on ? '' : ' off'));
    const dot = tkEl('button', 'tk-dot' + (on ? ' on' : '')); dot.type = 'button'; dot.setAttribute('aria-pressed', on); dot.setAttribute('aria-label', (on ? 'Turn off ' : 'Turn on ') + lbl);
    dot.onclick = () => tkToggleLayer(layer);
    const name = tkEl(chooser ? 'button' : 'span', 'tk-row-lbl', `${lbl}<i>${sub}</i>`);
    if (chooser) { name.type = 'button'; name.onclick = () => tkPop(R, chooser); }
    const b = tkEl('div', 'tk-row-body', on ? body : '<span class="tk-row-off">off</span>');
    d.append(dot, name, b); R.rows.appendChild(d); return b;
  };
  const SND = typeof SOUNDS !== 'undefined' ? SOUNDS : [];
  const vName = (SND.find(s => s.id === settings.sound) || { nm: settings.sound }).nm;
  const vb = row('voice', settings.voiceOn, 'Voice', vName + ' ▾', '<span class="tk-syl">–</span>', 'voice');
  R.syl = vb.querySelector('.tk-syl');
  const raga = settings.tarRaga === 'rotate' ? ((TAR.last && TAR.last.raga) || 'yaman') : settings.tarRaga, Rg = RAGAS[raga] || RAGAS.yaman;
  const mb = row('melody', settings.melodyOn, 'Melody', `${TAR_INSTS[settings.tarInst] || ''} · ${Rg.name} ▾`,
    `<span class="tk-mel-now">–</span><span class="tk-mel-scale">${Rg.up.map(tkNoteName).join(' ')} ${tkNoteName(12)}</span>`, 'melody');
  R.mel = mb.querySelector('.tk-mel-now');
  const tbody = row('tabla', !!settings.tabla, 'Tabla', settings.tabla ? T.name + ' ▾' : 'taal ▾', `<div class="tk-cyc b${T.beats}${rtl ? ' rtl' : ''}"></div>`, 'taal');
  const cyc = tbody.querySelector('.tk-cyc');
  if (cyc) R.cells = T.bols.map((b, i) => {
    const sec = T.sec[i], el = tkEl('div', 'tk-bt' + (T.starts.has(i) ? ' vs' : '') + (T.khali.includes(sec) ? ' khali' : '') + (i === 0 && !T.khali.includes(0) ? ' sam' : ''),
      `<div class="mk">${T.starts.has(i) ? T.marks[sec] : ''}</div><div class="bol">${b === '-' ? '·' : b}</div><div class="wt"></div><div class="sy"></div>`);
    cyc.appendChild(el); return el;
  });
  row('drone', !!settings.drone, 'Tanpura', 'drone', '<span class="tk-row-note">on</span>');
  const hb = row('harm', !!(settings.melodyOn && settings.tarHarm), 'Harmonium', settings.melodyOn ? 'held under the melody' : 'comes with the melody', '<div class="tk-harm"></div><span class="tk-harm-n">Sa · Pa</span>');
  R.harm = hb.querySelector('.tk-harm');
  if (!settings.tabla) { const pb = row('pulse', !!settings.pulse, 'Pulse', 'a soft tick each beat', '<span class="tk-tick"></span>'); R.tick = pb.querySelector('.tk-tick'); }
  if (R.popKind) tkPop(R, R.popKind, true);
}
/* the syllables of this cycle under its bols: each on the beat it starts, a long one's bar across both its beats, and the
   beats a held last syllable adds (to fill the cycle) dotted */
function tkBeatSyl(my, lo, len, li) {
  const R = TK_RIB.R; if (!R || !R.cells.length) return;
  const L = li != null ? (TK.lines || [])[li] : null;
  R.cells.forEach((cell, b) => {
    const s = my.find(x => x.at - lo <= b && b < x.at - lo + x.len), wt = cell.querySelector('.wt'), sy = cell.querySelector('.sy');
    if (!wt || !sy) return;
    const k = s ? b - (s.at - lo) : 0, node = s && L && L.nodes ? L.nodes[s.i[0]] : null;
    sy.textContent = s && k === 0 ? ((node && node.textContent) || '') : '';
    wt.className = 'wt' + (!s ? '' : k >= s.m ? ' over' : s.rest ? ' rest' : node && node.classList.contains('flex') ? ' x' : s.long ? ' l' : ' s') + (s && k > 0 && k < s.m ? ' cont' : '');
  });
}
/* the chooser under the ribbon's head: taal, voice or melody */
function tkPop(R, kind, keep) {
  const open = keep || R.popKind !== kind || R.pop.classList.contains('hidden');
  R.popKind = open ? kind : null;
  R.pop.classList.toggle('hidden', !open);
  R.tb.setAttribute('aria-expanded', open && kind === 'taal');
  if (!open) return;
  const chip = (attr, val, on, label) => `<button type="button" class="tk-chip${on ? ' on' : ''}" data-${attr}="${val}">${label}</button>`;
  let h = '';
  if (kind === 'taal') {
    const T = R.T, fits = tkFits(R.ps, tkMeterOf(TK.lines || [])), L0 = tkLay(R.ps[0], T);
    h = `<div class="tk-chips">${chip('taal', 'auto', settings.taal === 'auto', `Auto<span class="auto">${TAALS[fits[0].k].name}</span>`)}` +
      fits.map(f => chip('taal', f.k, settings.taal === f.k, `${TAALS[f.k].name}<span class="n">${f.pad ? '+' + Math.round(f.pad * 10) / 10 : '0'}</span>`)).join('') + '</div>' +
      `<p class="tk-why">${L0.tot} mātrās a line → <i>${T.name}</i>, ${T.beats} beats (${T.div.join(' + ')}) × ${L0.cyc} = ${L0.cyc * T.beats}` +
      (L0.pad ? `; the last syllable is held ${L0.pad} beat${L0.pad > 1 ? 's' : ''} more, as a singer would.` : ': it fits exactly.') + ' The number on each taal is the beats it holds per line.</p>';
  } else if (kind === 'voice') {
    h = `<div class="tk-chips">${(typeof SOUNDS !== 'undefined' ? SOUNDS : []).filter(s => s.id !== 'mine' || (typeof hasMine === 'function' && (hasMine('dum') || hasMine('da'))))
      .map(s => chip('voice', s.id, settings.sound === s.id, s.nm)).join('')}</div>`;
  } else if (kind === 'melody') {
    h = `<div class="tk-chips">${Object.keys(TAR_INSTS).map(k => chip('inst', k, settings.tarInst === k, TAR_INSTS[k])).join('')}</div>` +
      `<div class="tk-chips tk-ragas">${RAGA_KEYS.map(k => chip('raga', k, settings.tarRaga === k, RAGAS[k].name)).join('')}</div>`;
  }
  R.pop.innerHTML = h;
  R.pop.querySelectorAll('[data-taal]').forEach(b => b.onclick = () => tkPickTaal(b.getAttribute('data-taal')));
  R.pop.querySelectorAll('[data-voice]').forEach(b => b.onclick = () => { settings.sound = b.getAttribute('data-voice'); if (['tablarec', 'rec', 'mine'].includes(settings.sound)) settings.grooveSound = settings.sound; tkSaved(); });
  R.pop.querySelectorAll('[data-inst]').forEach(b => b.onclick = () => { settings.tarInst = b.getAttribute('data-inst'); tkSaved(); });
  R.pop.querySelectorAll('[data-raga]').forEach(b => b.onclick = () => { settings.tarRaga = b.getAttribute('data-raga'); tkSaved(); });
}
/* a layer turned on or off from the ribbon or the sheet. Sound changes land at the next line; the tabla changes the
   clock, so a couplet that is playing restarts from its line */
function tkToggleLayer(layer) { tkToggleLayer2(layer); tkGates(); }
function tkToggleLayer2(layer) {
  if (layer === 'voice') settings.voiceOn = !settings.voiceOn;
  else if (layer === 'melody') settings.melodyOn = !settings.melodyOn;
  else if (layer === 'drone') { settings.drone = !settings.drone; if (TK.play) { if (settings.drone) tarDroneStart(); else tarDroneStop(); } }
  else if (layer === 'harm') { if (!settings.melodyOn) { settings.melodyOn = true; settings.tarHarm = true; } else settings.tarHarm = !settings.tarHarm; }
  else if (layer === 'pulse') settings.pulse = !settings.pulse;
  else if (layer === 'tabla') { settings.tabla = !settings.tabla; tkSaved(); tkRestart(); return; }
  tkSaved();
}
function tkRestart() {   /* stop and play again from the line it was on */
  const R = TK_RIB.R; if (!R || !R.btn || !TK.play) return;
  R.btn.click(); setTimeout(() => { if (!PB.playing) R.btn.click(); }, 60);
}
function tkSaved() {
  tkLegacy(); store.set('settings', settings); pbForget();
  const R = TK_RIB.R; if (R) tkRibbonDraw(R, R.T);
  if (typeof renderSoundOpts === 'function' && $('settingsSheet') && $('settingsSheet').classList.contains('on')) renderSoundOpts();
}
function tkPickTaal(key) {
  settings.taal = key; tkLegacy(); store.set('settings', settings);
  const P = TK.play, R = TK_RIB.R;
  if (P && P.taal) {
    const next = key === 'auto' ? tkFits(P.ps, tkMeterOf(TK.lines || []))[0].k : key;
    if (TAALS[next] !== P.T) { TK.pending = next; tkCount(TAALS[next].name + ' from the next line'); }
  } else if (R) tkRibbonDraw(R, TAALS[key === 'auto' ? tkFits(R.ps, tkMeterOf(TK.lines || []))[0].k : key]);
  if (R) { R.popKind = null; R.pop.classList.add('hidden'); tkRibbonDraw(R, R.T); }
  if (typeof renderStyleOpts === 'function') renderStyleOpts();
}
function tkNowSyl(li, s, gi) {
  const P = TK.play, R = TK_RIB.R; if (!P || !R) return;
  if (R.harm && settings.melodyOn && settings.tarHarm) R.harm.classList.add('on');
  if (R.mel && P.mel && P.mel[li]) R.mel.textContent = tkNoteName(P.mel[li].get(s.i[0]));
  if (R.syl) { const L = (TK.lines || [])[li], node = L && L.nodes && L.nodes[gi]; R.syl.textContent = (node && node.textContent) || '–'; }   /* the chip's own text, in the script shown */
}
function tkPulseBlink(t) {
  const R = TK_RIB.R; if (!R || !R.tick) return;
  setTimeout(() => { if (R.tick) { R.tick.classList.add('on'); setTimeout(() => R.tick && R.tick.classList.remove('on'), 120); } }, Math.max(0, (t - A.ctx.currentTime) * 1000));
}

/* ---------- the ball: lands on each syllable as it sounds, arcs to the next across its length ---------- */
const TK_SHAPES = {
  dot:     { nm: 'Dot', svg: '<circle r="5"/>' },
  nuqta:   { nm: 'Nuqta', svg: '<path d="M-1.2,-6 L5,-1 L1.2,6 L-5,1Z"/>' },
  ring:    { nm: 'Ring', svg: '<circle r="4.6" fill="none" stroke="currentColor" stroke-width="2"/>' },
  drop:    { nm: 'Drop', svg: '<path d="M0,-7.5 C3.5,-3 5,0 5,2.2 A5,5 0 1 1 -5,2.2 C-5,0 -3.5,-3 0,-7.5Z"/>', turn: true },
  petal:   { nm: 'Petal', svg: '<path d="M0,-7.5 C5,-4 5,3.5 0,7.5 C-5,3.5 -5,-4 0,-7.5Z"/>', turn: true },
  sparkle: { nm: 'Sparkle', svg: '<path d="M0,-7.5 L1.7,-1.7 L7.5,0 L1.7,1.7 L0,7.5 L-1.7,1.7 L-7.5,0 L-1.7,-1.7Z"/>', spin: true },
  hilal:   { nm: 'Crescent', svg: '<path d="M2.5,-6.5 A6.6,6.6 0 1 0 2.5,6.5 A5,5 0 1 1 2.5,-6.5Z"/>' }
};
const TK_COLORS = { weight: 'By weight', accent: 'Blue', long: 'Bright', ink: 'Ink', rose: 'Plum' };
const TK_SIZES = { s: ['Small', 0.75], m: ['Medium', 1], l: ['Large', 1.35], w: ['By weight', 1] };
const TK_GHOSTS = 6;
const tkReduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
function tkMakeBall(host) {
  const mk = cls => { const d = tkEl('div', cls); host.appendChild(d); return d; };
  const b = { host, el: mk('tk-ball'), ghosts: [], hist: [], x: 0, y: 0, rot: 0, sx: 1, sy: 1, scale: 1 };
  for (let i = 0; i < TK_GHOSTS; i++) b.ghosts.push(mk('tk-ghost g' + i));
  tkStyleBall(b);
  return b;
}
function tkStyleBall(b) {
  const B = settings.ball, shape = TK_SHAPES[B.shape] || TK_SHAPES.nuqta;
  [b.el, ...b.ghosts].forEach(e => {
    e.innerHTML = `<svg viewBox="-10 -10 20 20" fill="currentColor" aria-hidden="true">${shape.svg}</svg>`;
    Object.keys(TK_COLORS).forEach(k => e.classList.remove('c-' + k)); e.classList.add('c-' + B.color);
  });
}
function tkPlace(b) {
  b.el.style.transform = `translate(${b.x.toFixed(1)}px, ${b.y.toFixed(1)}px) rotate(${b.rot.toFixed(1)}deg) scale(${(b.sx * b.scale).toFixed(3)}, ${(b.sy * b.scale).toFixed(3)})`;
  if (settings.ball.trail && !tkReduced() && b.el.classList.contains('on')) {
    b.hist.unshift([b.x, b.y, b.rot]); b.hist.length = Math.min(b.hist.length, TK_GHOSTS * 3);
    b.ghosts.forEach((g, i) => { const h = b.hist[(i + 1) * 3 - 1] || b.hist[b.hist.length - 1];
      g.style.transform = `translate(${h[0].toFixed(1)}px, ${h[1].toFixed(1)}px) rotate(${h[2].toFixed(1)}deg) scale(${(b.scale * (1 - i * 0.1)).toFixed(3)})`;
      g.classList.add('on'); });
  } else b.ghosts.forEach(g => g.classList.remove('on'));
}
function tkHop(b, to, secs, height) {
  tkCAF(b.anim);
  const x0 = b.x, y0 = b.y, x1 = to[0], y1 = to[1], shape = TK_SHAPES[settings.ball.shape] || TK_SHAPES.nuqta;
  if (tkReduced() || secs <= 0) { b.x = x1; b.y = y1; tkPlace(b); return; }
  const t0 = Date.now(), T = secs * 1000;
  const step = () => {
    const p = Math.min(1, (Date.now() - t0) / T);
    b.x = x0 + (x1 - x0) * p; b.y = y0 + (y1 - y0) * p - height * Math.sin(Math.PI * p);
    if (shape.turn) { const vx = x1 - x0, vy = (y1 - y0) - height * Math.PI * Math.cos(Math.PI * p); if (Math.abs(vx) + Math.abs(vy) > 0.5) b.rot = Math.atan2(vy, vx) * 180 / Math.PI + 90; }
    if (shape.spin) b.rot += 4;
    const sq = settings.ball.squash ? (p < 0.12 ? 1 - (0.12 - p) * 2.2 : p > 0.9 ? 1 - (p - 0.9) * 2.4 : 1) : 1;   /* squash as it lands, stretch as it leaves */
    b.sx = 2 - sq; b.sy = sq;
    tkPlace(b);
    if (p < 1) b.anim = tkRAF(step);
  };
  b.anim = tkRAF(step);
}
function tkLandOn(b, node) {
  const a = b.host.getBoundingClientRect(), n = node.getBoundingClientRect();
  return [n.left - a.left + n.width / 2, n.top - a.top - 12];
}
function tkRipple(b, x, y) {
  if (!settings.ball.ripple || tkReduced()) return;
  const r = tkEl('div', 'tk-ripple ' + [...b.el.classList].filter(c => /^(c|w)-/.test(c)).join(' '));
  r.style.setProperty('--at', `translate(${x.toFixed(1)}px, ${(y + 10).toFixed(1)}px)`);
  b.host.appendChild(r); setTimeout(() => r.remove(), 560);
}
function tkLook(b, node, isLong) {
  const w = node.classList.contains('flex') ? 'x' : isLong ? 'l' : 's';
  [b.el, ...b.ghosts].forEach(e => { e.classList.remove('w-l', 'w-s', 'w-x'); e.classList.add('w-' + w); });
  b.scale = settings.ball.size === 'w' ? (isLong ? 1.25 : 0.8) : (TK_SIZES[settings.ball.size] || TK_SIZES.m)[1];
}
/* one step of any couplet playback: ball onto syllable gi of this line's chip nodes */
const TK_BALL = { b: null };
function tkBallStep(btn, nodes, gi, ms, v, len) {
  if (!settings.ball || !settings.ball.on || !nodes || !nodes[gi] || typeof document === 'undefined') return;
  const host = tkBox(btn); if (!host || typeof host.getBoundingClientRect !== 'function') return;
  const shown = n => n && typeof n.getBoundingClientRect === 'function' && n.getBoundingClientRect().width > 0;
  if (!shown(nodes[gi])) { tkBallHide(); return; }   /* chips hidden (Look up keeps them folded): no ball, rather than one in the corner */
  if (!TK_BALL.b || TK_BALL.b.host !== host || !host.contains(TK_BALL.b.el)) { tkBallHide(); host.classList.add('tk-host'); TK_BALL.b = tkMakeBall(host); }
  const b = TK_BALL.b, node = nodes[gi], isLong = v === 'l' || v === 'x' || v === 'rl', next = shown(nodes[gi + 1]) ? nodes[gi + 1] : null;
  b.el.classList.add('on'); tkLook(b, node, isLong);
  const here = tkLandOn(b, node); b.x = here[0]; b.y = here[1]; tkPlace(b); tkRipple(b, here[0], here[1]);
  const secs = ms / 1000, hi = settings.ball.high ? ((len || (isLong ? 2 : 1)) > 1 ? 28 : 14) : 18;
  if (next) tkHop(b, tkLandOn(b, next), secs * 0.98, hi);
  else tkHop(b, here, secs * 0.6, 8);   /* the line's last syllable: one small bounce in place */
}
function tkBallHide() {
  const b = TK_BALL.b; if (!b) return;
  tkCAF(b.anim); [b.el, ...b.ghosts].forEach(e => { try { e.remove(); } catch (err) {} });
  TK_BALL.b = null;
}
/* the player's ▶ went back to ▶ (paused, finished, or something else took over): the ball goes, the ribbon stays paused */
function tkStopUI() { tkBallHide(); tkRibbonPaused(); setTimeout(tkRibbonPaused, 0); }   /* again once pbToggle has noted where it stopped */

/* ---------- Settings: Appearance › Bouncing ball, Sound › the layers ---------- */
function tkSet(k, v) { settings[k] = v; tkSaved(); tkRenderSettings(); if (k === 'tabla') tkRestart(); else { tkGates(); if (k === 'drone' && TK.play) { if (v) tarDroneStart(); else tarDroneStop(); } } }
function tkSetBall(k, v) { settings.ball[k] = v; store.set('settings', settings); if (TK_BALL.b) tkStyleBall(TK_BALL.b); tkRenderSettings(); }
function tkRenderSettings() {
  if (typeof $ !== 'function') return;
  const B = settings.ball, opts = (id, items, cur, key, icon) => { const box = $(id); if (!box) return;
    box.innerHTML = Object.entries(items).map(([k, v]) => `<button type="button" class="tk-chip${k === cur ? ' on' : ''}" role="radio" aria-checked="${k === cur}" onclick="tkSetBall('${key}','${k}')">${icon ? icon(k) : ''}${Array.isArray(v) ? v[0] : v.nm || v}</button>`).join(''); };
  opts('ballShape', TK_SHAPES, B.shape, 'shape', k => `<svg viewBox="-10 -10 20 20" fill="currentColor" aria-hidden="true">${TK_SHAPES[k].svg}</svg>`);
  opts('ballColor', TK_COLORS, B.color, 'color', k => `<span class="tk-sw c-${k}"></span>`);
  opts('ballSize', TK_SIZES, B.size, 'size');
  [['ballOn', 'on'], ['ballTrail', 'trail'], ['ballSquash', 'squash'], ['ballRipple', 'ripple'], ['ballHigh', 'high']].forEach(([id, k]) => { const el = $(id); if (el) el.checked = !!B[k]; });
  const bo = $('ballOpts'); if (bo) bo.classList.toggle('hidden', !B.on);
  /* the layers */
  [['layerVoice', 'voiceOn'], ['layerMelody', 'melodyOn'], ['taalOn', 'tabla'], ['styleDrone', 'drone'], ['stylePulse', 'pulse'], ['styleGap', 'gapOn'], ['tarHarm', 'tarHarm']]
    .forEach(([id, k]) => { const el = $(id); if (el) el.checked = !!settings[k]; });
  const show = (id, on) => { const el = $(id); if (el) el.classList.toggle('hidden', !on); };
  show('stylePanelStrokes', settings.voiceOn); show('stylePanelTarannum', settings.melodyOn); show('taalSub', settings.tabla);
  show('stylePulseRow', !settings.tabla); show('footGapLine', settings.gapOn && !settings.tabla); show('footPulseRow', settings.gapOn && !settings.tabla);
  const gap = $('styleGap'); if (gap) { gap.disabled = !!settings.tabla; if (settings.tabla) gap.checked = false; }
  const gr = $('styleGapRow'); if (gr) gr.classList.toggle('tk-off', !!settings.tabla);
  const ts = $('taalSel'); if (ts) { if (!ts.options.length) ts.innerHTML = '<option value="auto">Auto (fits each couplet)</option>' + Object.entries(TAALS).map(([k, T]) => `<option value="${k}">${T.name} · ${T.beats} beats</option>`).join(''); ts.value = settings.taal; }
  const te = $('taalEnd'); if (te) te.value = settings.taalEnd;
  const rule = $('taalRule');
  if (rule) rule.textContent = !settings.voiceOn && !settings.melodyOn ? 'Voice and melody are both off: you hear only what is underneath.'
    : settings.tabla ? 'With the tabla on, the theka keeps time: no pause between feet or pulse, and a tabla voice gives way to da · dum so two tablas never fight.' : '';
  tkPreviewStart();
}
/* a live preview of the ball in the sheet; it stops itself once the sheet closes */
const TK_PV = { b: null, timer: null, nodes: null };
function tkPreviewStart() {
  const host = $('ballPreview'), sheet = $('settingsSheet');
  if (!host || typeof host.getBoundingClientRect !== 'function' || !sheet || !sheet.classList.contains('on')) return;
  clearTimeout(TK_PV.timer);
  if (!TK_PV.nodes) {
    const syl = [['dil', 'l'], ['e', 's'], ['nā', 'l'], ['dāñ', 'l'], ['tu', 's'], ['jhe', 'x']];
    const row = tkEl('div', 'tk-pv-row'); host.appendChild(row);
    TK_PV.nodes = syl.map(([t, w]) => { const sp = tkEl('span', 'tk-pv-' + w + (w === 'x' ? ' flex' : '')); sp.textContent = t; row.appendChild(sp); return { sp, long: w !== 's' }; });
  }
  if (!TK_PV.b) TK_PV.b = tkMakeBall(host);
  tkStyleBall(TK_PV.b);
  TK_PV.b.el.classList.toggle('on', !!settings.ball.on);
  let j = 0;
  const go = () => {
    if (!sheet.classList.contains('on')) { tkCAF(TK_PV.b.anim); return; }
    const b = TK_PV.b, cur = TK_PV.nodes[j], nx = TK_PV.nodes[(j + 1) % TK_PV.nodes.length], secs = (cur.long ? 2 : 1) * 0.3;
    if (settings.ball.on) {
      tkLook(b, cur.sp, cur.long);
      const here = tkLandOn(b, cur.sp); b.x = here[0]; b.y = here[1]; tkPlace(b); tkRipple(b, here[0], here[1]);
      tkHop(b, tkLandOn(b, nx.sp), secs * 0.98, settings.ball.high ? (cur.long ? 28 : 14) : 18);
    }
    j = (j + 1) % TK_PV.nodes.length; TK_PV.timer = setTimeout(go, secs * 1000);
  };
  go();
}
window.tkWants = tkWants; window.tkRun = tkRun; window.tkOnStop = tkOnStop; window.tkStopUI = tkStopUI; window.tkBallStep = tkBallStep;
window.tkSet = tkSet; window.tkSetBall = tkSetBall; window.tkRenderSettings = tkRenderSettings; window.tkPickTaal = tkPickTaal;
window.tkToggleLayer = tkToggleLayer; window.tkRibbonRemove = tkRibbonRemove;
