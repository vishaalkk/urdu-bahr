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
function feetStrip(raw){ return '<div class="fstrip">'+Scan.patternFeet(raw).map(f=>`${f.caeBefore?'<span class="cae">//</span>':''}<span class="fbox"><span class="strip" style="margin:0">${strip(f.toks)}</span><span class="fn">${f.ro.join('·')}</span></span>`).join('')+'</div>'; }
/* rendering helpers */
function strip(tokens){ return tokens.map(t=>t==='|'?'<span class="ft"></span>':t==='//'?'<span class="cae">//</span>':`<span class="blk ${t}">${t==='l'?'=':t==='s'?'–':t==='x'?'x':'·'}</span>`).join(''); }
function sylls(tokens){ return tokens.filter(t=>t==='l'||t==='s'||t==='x'||t==='c'); }
function famLabel(f){ return f.gz[0]; }
function chipHTML(s,i,li,override){
  const cls=[s.resolved==='c'?'c':s.resolved, s.native==='x'?'flex':'', s.graft?'g':'', s.last?'wend':''].join(' ');
  const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
  const isRtl = (cs === 'ur');
  const txt = (cs === 'ur' || !s.text || s.text === '·') ? s.text : (override!=null ? override : (typeof translitText === 'function' ? translitText(s.text, cs) : s.text));
  const clickable = li!=null;
  const wsel = clickable && selWord && selWord[0]===li && selWord[1]===s.word;
  const wov = clickable && ovr[li] && ovr[li][s.word];
  const cwCls=['cw', clickable?'click':'', wsel?'wsel':'', wov?'wov':''].join(' ').replace(/\s+/g,' ').trim();
  const click = clickable ? ` onclick="pickWord(${li},${s.word})"` : '';
  return `<span class="${cwCls}"${click}><span class="chip ${cls}" data-i="${i}" style="${!isRtl?'font-family:var(--body);font-size:15px;':''}">${txt}</span><span class="fs">${s.fsyl||''}</span></span>`;
}
function chipsHTML(syl,feet,li){
  const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
  const isRtl = (cs === 'ur');
  const overrides = (cs==='ro' && li!=null && typeof chipRomanOverrides==='function') ? chipRomanOverrides(syl,li) : [];
  if(!feet||!feet.length) return syl.map((s,i)=>chipHTML(s,i,li,overrides[i])).join('');
  return feet.map((F,fi)=>F?`${F.cae?'<span class="caeu">//</span>':''}<span class="fgrp" data-f="${fi}"><span class="fname">${(()=>{const fm=cs==='ur'?(F.ur||''):(cs==='hi'?(typeof urduToDevanagari==='function'?urduToDevanagari(F.ur):''):''); return fm?`${fm} <i>${F.name||''}</i>`:`<i>${F.name||''}</i>`;})()}</span><span class="fchips" style="direction:${isRtl?'rtl':'ltr'}">${F.idx.map(i=>chipHTML(syl[i],i,li,overrides[i])).join('')}</span></span>`:'').join('');
}
/* align a known verse to its family's meter */
const alignCache={};
function alignVerse(ur,fam){
  const k=ur+'|'+fam.id; if(alignCache[k]!==undefined) return alignCache[k];
  const r=Scan.scanLine(ur); const f=r.fits.find(x=>fam.meters.includes(x.meter.id));
  alignCache[k]= f? Scan.explain(r,f):null; return alignCache[k];
}
function singAlong(ur,fam,host){
  const e=alignVerse(ur,fam); if(!e) return;
  host.innerHTML=`<div class="chips">${chipsHTML(e.syl,e.feet)}</div>`;
  const nodes=[...host.querySelectorAll('.chip')].sort((a,b)=>a.dataset.i-b.dataset.i), groups=[...host.querySelectorAll('.fgrp')];
  playEx(e,nodes,groups);
}

