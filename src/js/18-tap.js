/* ================= TAP ================= */
let tapMode='echo', taps=[], echoT=null, padOn=true;
function setTapMode(m){ tapMode=m; $('tmEcho').classList.toggle('on',m==='echo'); $('tmFree').classList.toggle('on',m==='free');
  $('tapEcho').style.display=m==='echo'?'':'none'; $('tapFree').style.display=m==='free'?'':'none'; tapReset(); }
function echoNew(){ const f=pickFam(FAMS.filter(x=>!x.hindi)); echoT={f,seq:famPulse(f),cmp:sylls(Scan.parseRaw(f.pattern))}; $('echoInfo').textContent=echoT.seq.length+' syllables'; tapReset(); $('echoHint').textContent='Listen, then tap it back on the pad.'; }
function echoListen(){ playPat(echoT.f.pattern); }
function tapReset(){ taps=[]; $('padSub').innerHTML='&nbsp;'; $('tapOut').innerHTML=''; }
$('pad').addEventListener('pointerdown',e=>{ e.preventDefault(); A.ensure(); taps.push(performance.now()); tick();
  const p=$('pad'); p.classList.add('hit'); setTimeout(()=>p.classList.remove('hit'),70);
  $('padSub').textContent=taps.length+' tap'+(taps.length>1?'s':'');
  if(tapMode==='echo' && echoT && taps.length===echoT.seq.length) setTimeout(tapDone,350);
});
/* turn tap onsets into long/short: find the unit u that best explains gaps as u or 2u */
function classify(ts){
  const g=[]; for(let i=1;i<ts.length;i++) g.push(ts[i]-ts[i-1]);
  if(!g.length) return {w:['x'],g,u:0};
  const mx=Math.max(...g), mn=Math.min(...g);
  if(mx/mn<1.38){ return {w:g.map(()=>'l').concat(['x']),g,u:mx/2,flat:true}; }
  let best=null; const cands=g.flatMap(v=>[v,v/2]);
  cands.forEach(u=>{ let e=0; g.forEach(v=>{ const a=Math.abs(Math.log(v/u)), b=Math.abs(Math.log(v/(2*u))); e+=Math.min(a,b)**2; }); if(!best||e<best.e)best={u,e}; });
  const th=best.u*Math.SQRT2;
  return {w:g.map(v=>v<th?'s':'l').concat(['x']),g,u:best.u,th};
}
function barsHTML(c,target){
  if(!c.g.length) return '';
  const mx=Math.max(...c.g,(c.u||1)*2.4);
  const th=c.th?`<div class="th" style="bottom:${(c.th/mx)*100}%"></div>`:'';
  return `<div class="bars">${th}${c.g.map((v,i)=>{const w=c.w[i]; const bad=target&&target[i]&&((target[i]==='x'?false:target[i]!==w)); return `<div class="b" style="height:${Math.max(6,(v/mx)*100)}%;background:${bad?'var(--no)':w==='l'?'var(--gold)':'var(--teal)'}"></div>`;}).join('')}</div>
   <p class="tiny muted" style="margin:0">Each bar is the gap after a tap. Dashed line = the long/short boundary your own tempo sets.</p>`;
}
function tapDone(){
  if(taps.length<2){ $('tapOut').innerHTML='<p class="small muted">Tap at least a few syllables first.</p>'; return; }
  const c=classify(taps);
  if(tapMode==='echo' && echoT){
    const tgt=echoT.cmp; let right=0; const n=Math.min(tgt.length,c.w.length);
    for(let i=0;i<n;i++){ if(c.w[i]==='x'||tgt[i]==='x'||tgt[i]===c.w[i]) right++; }
    const ok=right===tgt.length && c.w.length===tgt.length; stat(echoT.f.id,ok);
    let h=`<div class="card"><div class="verdict ${ok?'L':''}">${ok?'✓ Perfect echo':right+' / '+tgt.length+' syllables right'}</div>
      <p class="tiny muted" style="margin:8px 0 2px">Target</p>${feetStrip(echoT.f.pattern)}
      <p class="tiny muted" style="margin:6px 0 2px">Yours</p><div class="strip">${strip(c.w)}</div>${barsHTML(c,tgt)}
      ${c.flat?'<p class="small X">All your gaps were about equal — hold each long about twice as long as a short.</p>':''}
      ${c.w.length!==tgt.length?`<p class="small muted">You tapped ${c.w.length}, the line has ${tgt.length}.</p>`:''}
      <div class="gz"><div class="who">This was the bahr of</div><div class="urdu">${famLabel(echoT.f).ur}</div></div>
      <div class="row"><button class="btn gold sm" onclick="echoNew()">Next ▸</button><button class="btn sm" onclick="echoListen()">▶︎ Hear again</button></div></div>`;
    $('tapOut').innerHTML=h; taps=[];
  } else { freeW=c.w.slice(); freeC=c; renderFree(); taps=[]; }
}
let freeW=[],freeC=null;
function renderFree(){
  const fits=Scan.matchWeights(freeW).sort((a,b)=>a.c-b.c);
  const fams=[...new Set(fits.map(f=>famOfMeter[f.meter.id]).filter(Boolean))];
  let h=`<div class="card"><p class="tiny muted" style="margin:0">Your taps → tap a block to correct it</p>
    <div class="strip edit">${freeW.map((w,i)=>`<span class="blk ${w}" onclick="freeCycle(${i})">${w==='l'?'=':w==='s'?'–':'x'}</span>`).join('')}</div>
    ${freeC?barsHTML(freeC):''}
    <div class="row"><button class="btn sm" onclick="play(freeW)">▶︎ Hear your pattern</button></div>`;
  if(fits.length){
    h+=`<div class="verdict L" style="margin-top:8px">Fits ${fits.length} pattern${fits.length>1?'s':''}</div>`;
    if(fams.length) h+=fams.map(f=>`<div class="gz"><div class="who">same bahr as</div><div class="urdu">${famLabel(f).ur}</div></div>`).join('');
    else h+=`<p class="small muted">${fits.slice(0,4).map(f=>'#'+f.meter.id).join(', ')} — outside the families in this app.</p>`;
  } else h+=`<div class="verdict" style="margin-top:8px;color:var(--no)">No bahr fits this pattern</div><p class="small muted">Correct any block you think you mistimed, or try again a little slower.</p>`;
  $('tapOut').innerHTML=h+'</div>';
}
function freeCycle(i){ freeW[i]={l:'s',s:'x',x:'l'}[freeW[i]]; renderFree(); }

