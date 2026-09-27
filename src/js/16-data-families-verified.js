/* ================= DATA: families (verified) ================= */
const FAMS = /*@@FAMS@@*/;
window.FAMS = FAMS;
const famOfMeter={}; FAMS.forEach(f=>f.meters.forEach(m=>famOfMeter[m]=f));

/* sequences carrying their feet */
function patSeq(raw){ const fs=Scan.patternFeet(raw); const seq=[],feet=[],cae=[]; fs.forEach((f,fi)=>{ if(f.caeBefore) cae.push(fi); f.toks.forEach(t=>{ seq.push(t==='x'?'l':t); feet.push(fi); }); }); return {seq,feet,cae}; }
function exSeq(e){ return {seq:e.syl.map(s=>s.resolved), feet:e.syl.map(s=>s.foot), cae:(e.feet||[]).map((F,i)=>F&&F.cae?i:-1).filter(i=>i>=0)}; }
function playPat(raw,nodes){ const p=patSeq(raw); return play(p.seq,{feet:p.feet,cae:p.cae,onStep:nodes?litter(nodes):null}); }
function playEx(e,nodes,groups){ const p=exSeq(e); return play(p.seq,{feet:p.feet,cae:p.cae,onStep:i=>{ if(nodes)litter(nodes)(i); if(groups){ groups.forEach(g=>g.classList.remove('litf')); const g=groups[e.syl[i].foot]; if(g) g.classList.add('litf'); } }}); }
/* pattern with named feet (handbook convention, left→right) */
function feetStrip(raw){ return '<div class="fstrip">'+Scan.patternFeet(raw).map(f=>`${f.caeBefore?'<span class="cae">//</span>':''}<span class="fbox"><span class="strip tight">${strip(f.toks)}</span><span class="fn">${f.ro.join('·')}</span></span>`).join('')+'</div>'; }
/* rendering helpers */
function strip(tokens){ return tokens.map(t=>t==='|'?'<span class="ft"></span>':t==='//'?'<span class="cae">//</span>':`<span class="blk ${t}">${t==='l'?'=':t==='s'?'–':t==='x'?'x':'·'}</span>`).join(''); }
function sylls(tokens){ return tokens.filter(t=>t==='l'||t==='s'||t==='x'||t==='c'); }
function famLabel(f){ return f.gz[0]; }
function chipHTML(s,i,li,override,gpos){
  const cls=[s.resolved==='c'?'c':s.resolved, s.native==='x'?'flex':'', s.last?'wend':''].join(' ');
  const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
  const isRtl = (cs === 'ur');
  const txt = (cs === 'ur' || !s.text || s.text === '·') ? s.text : (override!=null ? override : (typeof translitText === 'function' ? translitText(s.text, cs) : s.text));
  const scriptCls = cs === 'hi' ? 'deva' : (cs !== 'ur' ? 'roman' : '');
  const clickable = li!=null;
  const wsel = clickable && selWord && selWord[0]===li && selWord[1]===s.word;
  const wov = clickable && ovr[li] && ovr[li][s.word];
  const cwCls=['cw', clickable?'click':'', wsel?'wsel':'', wov?'wov':'', gpos?'g '+gpos:''].join(' ').replace(/\s+/g,' ').trim();
  const click = clickable ? ` onclick="pickWord(${li},${s.word})"` : '';
  return `<span class="${cwCls}"${click}><span class="chip ${cls} ${scriptCls}" data-i="${i}">${txt}</span><span class="fs">${s.fsyl||''}</span></span>`;
}
/* position of each syllable inside a grafted run (words joined across the space): g-start / g-mid / g-end */
function graftPos(syl){
  const same=(a,b)=>a&&b&&a.graft&&b.graft&&a.word===b.word&&a.wordTo===b.wordTo;
  return syl.map((s,i)=>{ if(!s.graft) return ''; const p=same(syl[i-1],s), n=same(s,syl[i+1]); return p&&n?'g-mid':p?'g-end':n?'g-start':'g-solo'; });
}
/* Roman syllable labels from a specific scanned line (reader, look-up) instead of the Scan tab's state */
function romanOverridesFor(syl,r,lineObj){
  if(!r||!lineObj||typeof wordRomanMap!=='function'||typeof syllabifyRoman!=='function') return [];
  const wmap=wordRomanMap(lineObj,r); if(!wmap) return [];
  const counts={}, ordinals=[], pieces={};
  syl.forEach(s=>{ const o=counts[s.word]||0; ordinals.push(o); counts[s.word]=o+1; });
  return syl.map((s,i)=>{ if(!(s.word in pieces)){ const w=wmap[s.word]; pieces[s.word]=w?syllabifyRoman(w,counts[s.word]):null; } const p=pieces[s.word]; return p?p[ordinals[i]]:null; });
}
function chipsHTML(syl,feet,li,roCtx){
  const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
  const overrides = cs!=='ro' ? [] : roCtx ? romanOverridesFor(syl,roCtx.r,roCtx.lineObj) : (li!=null && typeof chipRomanOverrides==='function') ? chipRomanOverrides(syl,li) : [];
  const gp=graftPos(syl);
  if(!feet||!feet.length) return syl.map((s,i)=>chipHTML(s,i,li,overrides[i],gp[i])).join('');
  return feet.map((F,fi)=>F?`${F.cae?'<span class="caeu">//</span>':''}<span class="fgrp" data-f="${fi}"><span class="fname" onclick="pbFromFoot(event,this)" title="Play from this foot">${(()=>{const fm=cs==='ur'?(F.ur||''):(cs==='hi'?(typeof urduToDevanagari==='function'?urduToDevanagari(F.ur):''):''); return fm?`${fm} <i>${F.name||''}</i>`:`<i>${F.name||''}</i>`;})()}</span><span class="fchips">${F.idx.map(i=>chipHTML(syl[i],i,li,overrides[i],gp[i])).join('')}</span></span>`:'').join('');
}
/* Wrap each whitespace-separated word of a display string in <span class="word" data-w="i">
   for word-level playback highlight (pbWordsMatching). Leaves the whitespace itself outside
   the spans so RTL/LTR flow is untouched. Returns the word count too, so callers can check
   it against the scanner's word count before trusting the mapping. */
function wrapWordsHTML(text) {
  let i = 0;
  const html = String(text == null ? '' : text).split(/(\s+)/).map(tok => {
    if (tok === '' || /^\s+$/.test(tok)) return tok;
    const h = `<span class="word" data-w="${i}">${tok}</span>`;
    i++;
    return h;
  }).join('');
  return { html, count: i };
}

/* Keep each syllable row on one line: shrink a row's --fit only as far as needed, down to
   a floor of 0.7. Below that floor, stop shrinking and let the row wrap — but only between
   feet (.fgrp), never inside one: adds .wrap-feet, which verse.css turns into a flex-wrap. */
function fitChipRows(root){
  if (typeof document === 'undefined' || typeof document.querySelectorAll !== 'function') return;
  const FLOOR = 0.7;
  (root || document).querySelectorAll('.cbox-scan .chips, .couplet-scan-box .chips').forEach(ch => {
    if (!ch.clientWidth) return;                      // hidden box: fitted when shown
    ch.classList.remove('wrap-feet');
    ch.style.setProperty('--fit', '1');
    for (let k = 0; k < 4 && ch.scrollWidth > ch.clientWidth + 1; k++) {
      const cur = parseFloat(ch.style.getPropertyValue('--fit')) || 1;
      const next = Math.max(FLOOR, cur * ch.clientWidth / ch.scrollWidth * 0.99);
      ch.style.setProperty('--fit', next.toFixed(3));
      if (next <= FLOOR) break;
    }
    if (ch.scrollWidth > ch.clientWidth + 1) ch.classList.add('wrap-feet');
  });
}
window.fitChipRows = fitChipRows;
if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined' && document.body && typeof requestAnimationFrame === 'function') {
  let fitQueued = false;
  const queueFit = () => { if (fitQueued) return; fitQueued = true; requestAnimationFrame(() => { fitQueued = false; fitChipRows(); }); };
  new MutationObserver(ms => { if (ms.some(m => (m.type === 'attributes' && m.target.classList && m.target.classList.contains('couplet-scan-box')) || [...m.addedNodes].some(n => n.nodeType === 1 && (n.matches('.chips, .fgrp') || n.querySelector('.chips'))))) queueFit(); })
    .observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  window.addEventListener('resize', queueFit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(queueFit);
}

/* align a known verse to its family's meter */
const alignCache={};
function alignVerse(ur,fam){
  const k=ur+'|'+fam.id; if(alignCache[k]!==undefined) return alignCache[k];
  const r=Scan.scanLine(ur); const f=r.fits.find(x=>fam.meters.includes(x.meter.id));
  alignCache[k]= f? Scan.explain(r,f):null; return alignCache[k];
}
/* sing-along ▶: goes through the player (▶⇄❚❚, stop remembers the foot). key must be
   unique per sing-along instance (caller's family+verse id); btn is the ▶ element itself.
   Re-renders the chips fresh on every play (so a script switch is picked up); leaves them
   alone when the tap is just stopping playback. */
function singAlong(key,ur,fam,host,btn){
  const e=alignVerse(ur,fam); if(!e||!host) return;
  const stopping = (typeof PB!=='undefined' && PB.playing && PB.key===key);
  if(!stopping){
    const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
    host.innerHTML=`<div class="chips ${cs==='ur'?'':'ltr'}">${chipsHTML(e.syl,e.feet)}</div>`;
  }
  pbToggle(key,btn,()=>[Object.assign({e},pbNodes(host))]);
}
window.singAlong = singAlong;

