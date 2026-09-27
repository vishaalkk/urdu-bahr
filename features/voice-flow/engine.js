/* ============================================================
   Shared bits (unchanged from original_base.html)
   ============================================================ */
const A={ctx:null,out:null,noise:null,timers:[],
  ensure(){
    if(!this.ctx){const C=window.AudioContext||window.webkitAudioContext; if(!C)return false;
      this.ctx=new C();
      const comp=this.ctx.createDynamicsCompressor(); comp.threshold.value=-20; comp.knee.value=12; comp.ratio.value=5;
      const mk=this.ctx.createGain(); mk.gain.value=1.6;
      this.out=this.ctx.createGain(); this.out.gain.value=0.9; this.out.connect(comp); comp.connect(mk); mk.connect(this.ctx.destination);
      const len=Math.floor(this.ctx.sampleRate*1.0), b=this.ctx.createBuffer(1,len,this.ctx.sampleRate), d=b.getChannelData(0);
      for(let i=0;i<len;i++)d[i]=Math.random()*2-1; this.noise=b;
      try{ const rl=Math.floor(this.ctx.sampleRate*1.1), ir=this.ctx.createBuffer(2,rl,this.ctx.sampleRate);
        for(let ch=0;ch<2;ch++){const x=ir.getChannelData(ch); for(let i=0;i<rl;i++) x[i]=(Math.random()*2-1)*Math.pow(1-i/rl,3.2);}
        const cv=this.ctx.createConvolver(); cv.buffer=ir; const wet=this.ctx.createGain(); wet.gain.value=0.22;
        this.voiceBus=this.ctx.createGain(); this.voiceBus.connect(this.out); this.voiceBus.connect(cv); cv.connect(wet); wet.connect(this.out);
      }catch(e){ this.voiceBus=this.out; }
      try{ const N=48, re=new Float32Array(N), im=new Float32Array(N); for(let k=1;k<N;k++) im[k]=Math.pow(k,-1.25)*(k%2?1:0.85);
        this.glottal=this.ctx.createPeriodicWave(re,im,{disableNormalization:false}); }catch(e){ this.glottal=null; }
    }
    if(this.ctx.state==='suspended')this.ctx.resume();
    return true;
  },
  unlock(){ if(!this.ensure())return; try{const s=this.ctx.createBufferSource(); s.buffer=this.ctx.createBuffer(1,1,22050); s.connect(this.ctx.destination); s.start(0);}catch(e){} }
};
document.addEventListener('pointerdown',()=>A.unlock(),{once:true,passive:true});

function burst(t,freq,q,vol,dur,dest){
  const c=A.ctx, n=c.createBufferSource(); n.buffer=A.noise;
  const f=c.createBiquadFilter(); f.type='bandpass'; f.frequency.value=freq; f.Q.value=q;
  const g=c.createGain(); g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.0005,t+dur);
  n.connect(f); f.connect(g); g.connect(dest||A.dest||A.out); n.start(t); n.stop(t+dur+0.01);
}
/* voice(): unchanged, except a 7th optional pitchMul param (backward compatible: undefined -> 1) */
function voice(t,dur,isLong,style,vol,pos,pitchMul){
  const c=A.ctx, sound=Math.max(0.1,dur*0.9);
  const phrase = 1 + 0.05*Math.sin(Math.PI*Math.min(1,pos||0)) - (pos>0.92?0.04:0);
  const f0=(isLong?117:124)*phrase*(pitchMul||1)*(1+(Math.random()-0.5)*0.02);
  const osc=c.createOscillator(); if(A.glottal) osc.setPeriodicWave(A.glottal); else osc.type='sawtooth';
  osc.frequency.setValueAtTime(f0*0.97,t); osc.frequency.linearRampToValueAtTime(f0,t+0.06);
  osc.frequency.linearRampToValueAtTime(f0*(isLong?0.985:0.99),t+sound);
  const lfo=c.createOscillator(), lg=c.createGain(); lfo.frequency.value=5.3+Math.random()*0.5;
  lg.gain.setValueAtTime(0,t); lg.gain.linearRampToValueAtTime(isLong?f0*0.014:f0*0.004,t+Math.min(0.35,sound));
  lfo.connect(lg); lg.connect(osc.frequency);
  const src=c.createGain(); osc.connect(src);
  const br=c.createBufferSource(); br.buffer=A.noise; br.loop=true;
  const bf=c.createBiquadFilter(); bf.type='bandpass'; bf.frequency.value=1600; bf.Q.value=0.6;
  const bg=c.createGain(); bg.gain.value=0.05; br.connect(bf); bf.connect(bg); bg.connect(src);
  const env=c.createGain(); env.gain.value=0; env.connect(A.dest||A.voiceBus||A.out);
  const V = (style==='dumda'&&isLong) ? [{f:640,b:80,g:1},{f:1150,b:100,g:0.55},{f:2450,b:150,g:0.24},{f:3400,b:220,g:0.08}]
                                      : [{f:760,b:90,g:1},{f:1250,b:110,g:0.6},{f:2600,b:160,g:0.22},{f:3500,b:220,g:0.08}];
  const nodes=V.map(x=>{const bp=c.createBiquadFilter(); bp.type='bandpass'; bp.Q.value=x.f/x.b; bp.frequency.value=x.f;
    const g=c.createGain(); g.gain.value=x.g; src.connect(bp); bp.connect(g); g.connect(env); return {bp,g,x};});
  nodes[0].bp.frequency.setValueAtTime(300,t); nodes[0].bp.frequency.linearRampToValueAtTime(V[0].f,t+0.05);
  nodes[1].bp.frequency.setValueAtTime(1700,t); nodes[1].bp.frequency.linearRampToValueAtTime(V[1].f,t+0.06);
  const pv=c.createBiquadFilter(); pv.type='lowpass'; pv.frequency.value=320; const pg=c.createGain();
  pg.gain.setValueAtTime(0,t); pg.gain.linearRampToValueAtTime(0.9*vol,t+0.008); pg.gain.linearRampToValueAtTime(0,t+0.03);
  src.connect(pv); pv.connect(pg); pg.connect(env);
  const pk=(isLong?3.3:3.0)*vol;
  env.gain.setValueAtTime(0,t); env.gain.linearRampToValueAtTime(pk*0.35,t+0.012); env.gain.linearRampToValueAtTime(pk,t+0.04);
  if(style==='dumda' && isLong){
    const m=t+sound*0.55;
    nodes[0].bp.frequency.setValueAtTime(V[0].f,m); nodes[0].bp.frequency.linearRampToValueAtTime(260,m+0.06);
    [1,2,3].forEach(i=>{ nodes[i].g.gain.setValueAtTime(V[i].g,m); nodes[i].g.gain.linearRampToValueAtTime(0.02,m+0.06); });
    env.gain.setValueAtTime(pk,m); env.gain.linearRampToValueAtTime(pk*0.85,m+0.07);
    bg.gain.setValueAtTime(0.05,m); bg.gain.linearRampToValueAtTime(0.0,m+0.06);
  } else if(isLong){ env.gain.setValueAtTime(pk,t+sound*0.6); env.gain.linearRampToValueAtTime(pk*0.8,t+sound-0.05); }
  env.gain.setTargetAtTime(0,t+sound-0.04,0.03);
  const end=t+sound+0.25;
  osc.start(t); osc.stop(end); lfo.start(t); lfo.stop(end); br.start(t); br.stop(end);
  burst(t+0.004,3100,0.9,0.28*vol,0.018);
}
function footThump(t,vol){ const c=A.ctx,o=c.createOscillator(),g=c.createGain(); o.type='sine';
  o.frequency.setValueAtTime(95,t); o.frequency.exponentialRampToValueAtTime(58,t+0.18);
  g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(0.5*vol,t+0.006); g.gain.exponentialRampToValueAtTime(0.0005,t+0.3);
  o.connect(g); g.connect(A.dest||A.out); o.start(t); o.stop(t+0.32); }
function stopAll(){ A.timers.forEach(clearTimeout); A.timers=[];
  if(A.ctx && A.sess){ const g=A.sess, now=A.ctx.currentTime; try{ g.gain.cancelScheduledValues(now); g.gain.setValueAtTime(g.gain.value,now); g.gain.linearRampToValueAtTime(0,now+0.03); }catch(e){}
    setTimeout(()=>{ try{g.disconnect();}catch(e){} },80); A.sess=null; } }

/* decode VOICEPACK once; shared by both OLD and NEW engines */
let _decodeP=null;
function decodeAll(){
  if(_decodeP) return _decodeP;
  const dec=o=>{ const bin=atob(o.b64), u=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
    return new Promise((res)=>{ try{ const p=A.ctx.decodeAudioData(u.buffer,b=>res({buf:b,off:o.off,dur:o.dur}),()=>res(null)); if(p&&p.then)p.catch(()=>res(null)); }catch(e){res(null);} }); };
  _decodeP=Promise.all([Promise.all(VOICEPACK.da.map(dec)),Promise.all(VOICEPACK.dum.map(dec))])
    .then(([da,dum])=>({da:da.filter(Boolean),dum:dum.filter(Boolean)}));
  return _decodeP;
}

/* ============================================================
   OLD engine (verbatim port of the current original_base.html)
   ============================================================ */
function recSound_old(R,t,dur,isLong,vol,pos,holdF){
  const pool=isLong?R.dum:R.da, key=isLong?'l':'s';
  let bi=0,bs=1e9; pool.forEach((k,j)=>{ const sc=Math.abs((k.dur-k.off)-dur*0.95)+(j===R.last[key]?0.2:0); if(sc<bs){bs=sc;bi=j;} });
  R.last[key]=bi; const k=pool[bi];
  const rate=1+0.02*Math.sin(Math.PI*Math.min(1,pos||0))-((pos||0)>0.9?0.02:0);
  const c=A.ctx, src=c.createBufferSource(); src.buffer=k.buf; src.playbackRate.value=rate;
  const g=c.createGain(); const start=Math.max(c.currentTime, t-k.off/rate);
  const hold=Math.min(k.dur/rate, k.off/rate+dur*0.95), fo=Math.min(0.05,hold/3);
  g.gain.setValueAtTime(vol,start); g.gain.setValueAtTime(vol,start+hold-fo); g.gain.linearRampToValueAtTime(0,start+hold);
  src.connect(g); g.connect(A.dest||A.voiceBus||A.out); src.start(start); src.stop(start+hold+0.02);
}
function syllableSound_old(R,t,dur,isLong,vol,pos,hold){
  const d=dur*(hold||1);
  recSound_old(R,t,d/0.95,isLong,vol,pos,hold);
}
function play_old(seq,opts){
  opts=opts||{}; if(!A.ensure())return 0;
  return decodeAll().then(R0=>{
    const R={da:R0.da,dum:R0.dum,last:{l:-1,s:-1}};
    stopAll();
    const sess=A.ctx.createGain(); sess.gain.value=1; sess.connect(A.voiceBus||A.out); A.sess=sess; A.dest=sess;
    const beat=60/(opts.bpm||150); let t=A.ctx.currentTime+0.16; const t0=t;
    const F=opts.feet, cae=opts.cae||[];
    seq.forEach((v,i)=>{
      const isLong=(v==='l'||v==='x'); let dur=(isLong?2:1)*beat;
      let vol=v==='c'?0.45:1, hold=0.97;
      if(F){ const fs=(i===0||F[i]!==F[i-1]), fe=(i===seq.length-1||F[i+1]!==F[i]);
        if(fs && i>0 && cae.includes(F[i])) t+=beat*0.6;
        if(fs && v!=='c') footThump(t,0.9);
        if(!fs && v!=='c') vol*=0.84;
        if(fe && i<seq.length-1){ dur*=1.07; hold=0.82; }
      }
      if(opts.cadence!==false && i===seq.length-1 && seq.length>4) dur*=1.4;
      syllableSound_old(R,t,dur,isLong,vol,i/Math.max(1,seq.length-1),hold);
      if(opts.onStep) A.timers.push(setTimeout(()=>opts.onStep(i),(t-A.ctx.currentTime)*1000));
      t+=dur;
    });
    if(opts.onEnd) A.timers.push(setTimeout(opts.onEnd,(t-A.ctx.currentTime)*1000+60));
    return (t-t0);
  });
}

/* ============================================================
   NEW engine (proposed redesign)
   ============================================================ */
function findLoopPoints(k){
  if(k._loopChecked) return; k._loopChecked=true;
  try{
    const d=k.buf.getChannelData(0), sr=k.buf.sampleRate, n=d.length;
    const lo=Math.floor(n*0.40), hi=Math.floor(n*0.86), win=Math.floor(sr*0.09);
    if(hi-lo<win+1) return;
    const hop=Math.max(1,Math.floor(sr*0.008));
    let bestI=-1,bestVar=Infinity,prevRms=null;
    for(let i=lo;i+win<hi;i+=hop){
      let sum=0,cnt=0; for(let j=i;j<i+win;j+=4){ sum+=d[j]*d[j]; cnt++; }
      const rms=Math.sqrt(sum/Math.max(1,cnt));
      if(prevRms!=null){ const v=Math.abs(rms-prevRms); if(v<bestVar){bestVar=v;bestI=i;} }
      prevRms=rms;
    }
    if(bestI<0) return;
    const snap=p=>{ let best=p,bd=Infinity,span=Math.floor(sr*0.003); for(let o=-span;o<=span;o++){ const q=p+o; if(q<1||q>=n)continue; const v=Math.abs(d[q]); if(v<bd){bd=v;best=q;} } return best; };
    const a=snap(bestI), b=snap(bestI+win);
    if(b-a>sr*0.03){ k.loopStart=a/sr; k.loopEnd=b/sr; }
  }catch(e){}
}
function eqPowerFade(peak,n){ const c=new Float32Array(n); for(let i=0;i<n;i++) c[i]=peak*Math.cos((i/(n-1))*Math.PI/2); return c; }
function recSound_new(R,t,dur,isLong,vol,pos,ctx){
  ctx=ctx||{};
  const pool=isLong?R.dum:R.da, key=isLong?'l':'s';
  const xfade=ctx.xfade!=null?ctx.xfade:0.02;
  let fadeStart=(ctx.nextOnset!=null?ctx.nextOnset-xfade/2:t+dur);
  fadeStart=Math.max(fadeStart,t+0.02);
  const fadeEnd=fadeStart+(ctx.nextOnset!=null?xfade:xfade*1.5);
  let bi;
  if(ctx.footKey && ctx.footTake && ctx.footTake[ctx.footKey]!=null){ bi=ctx.footTake[ctx.footKey]; }
  else{
    bi=0; let bs=1e9; const target=fadeStart-t;
    pool.forEach((k,j)=>{ const sc=Math.abs((k.dur-k.off)-target)+(j===R.last[key]?0.15:0); if(sc<bs){bs=sc;bi=j;} });
    if(ctx.footKey && ctx.footTake) ctx.footTake[ctx.footKey]=bi;
  }
  R.last[key]=bi; const k=pool[bi]; findLoopPoints(k);
  const need=fadeStart-t, rate0=1+0.015*Math.sin(Math.PI*Math.min(1,pos||0));
  const needRatio=(k.dur-k.off)/Math.max(1e-6,need);
  const rate=needRatio<rate0 ? Math.max(0.92,needRatio) : rate0*(ctx.pitchLift?1.015:1);
  const c=A.ctx, src=c.createBufferSource(); src.buffer=k.buf; src.playbackRate.value=rate;
  const start=Math.max(c.currentTime, t-k.off/rate);
  const naturalEnd=start+k.dur/rate;
  const useLoop=naturalEnd<fadeStart && k.loopStart!=null;
  if(useLoop){ src.loop=true; src.loopStart=k.loopStart; src.loopEnd=k.loopEnd; }
  const g=c.createGain(); src.connect(g); g.connect(A.dest||A.voiceBus||A.out);
  g.gain.setValueAtTime(vol,start);
  if(naturalEnd>=fadeStart){
    g.gain.setValueAtTime(vol,fadeStart);
    g.gain.setValueCurveAtTime(eqPowerFade(vol,12),fadeStart,fadeEnd-fadeStart);
  } else if(useLoop){
    g.gain.setValueAtTime(vol,naturalEnd);
    g.gain.linearRampToValueAtTime(vol*0.72,fadeStart);
    g.gain.setValueCurveAtTime(eqPowerFade(vol*0.72,12),fadeStart,fadeEnd-fadeStart);
  } else {
    const fs2=Math.max(start+0.02,naturalEnd-0.03);
    g.gain.setValueAtTime(vol,fs2);
    g.gain.setValueCurveAtTime(eqPowerFade(vol,12),fs2,0.03);
  }
  src.start(start); src.stop((useLoop?fadeEnd:Math.min(naturalEnd,fadeEnd))+0.02);
}
function syllableSound_new(R,t,dur,isLong,vol,pos,ctx){
  recSound_new(R,t,dur,isLong,vol,pos,ctx);
}
function play_new(seq,opts){
  opts=opts||{}; if(!A.ensure())return 0;
  return decodeAll().then(R0=>{
    const R={da:R0.da,dum:R0.dum,last:{l:-1,s:-1}};
    stopAll();
    const sess=A.ctx.createGain(); sess.gain.value=1; sess.connect(A.voiceBus||A.out); A.sess=sess; A.dest=sess;
    const beat=60/(opts.bpm||150); const t0=A.ctx.currentTime+0.16;
    const F=opts.feet||null, cae=opts.cae||[], n=seq.length;
    const footGapUnits=opts.footGap!=null?opts.footGap:0.16, caeGapUnits=opts.caeGap!=null?opts.caeGap:0.6;
    const xfade=opts.xfade!=null?opts.xfade:0.02;
    const slots=[]; let t=t0;
    seq.forEach((v,i)=>{
      const isLong=(v==='l'||v==='x'); let dur=(isLong?2:1)*beat;
      let vol=v==='c'?0.45:1, pitchLift=false;
      const fs=F?(i===0||F[i]!==F[i-1]):(i===0), fe=F?(i===n-1||F[i+1]!==F[i]):(i===n-1);
      if(F && fs && i>0 && cae.includes(F[i])) t+=beat*caeGapUnits;
      if(fs && v!=='c'){ vol*=1.12; if(isLong) pitchLift=true; }
      else if(v!=='c') vol*=0.92;
      if(opts.cadence!==false && i===n-1 && n>4) dur*=1.4;
      const gapAfter=(F && fe && i<n-1) ? beat*footGapUnits : 0;
      slots.push({i,v,isLong,dur,vol,pitchLift,fs,foot:F?F[i]:0,onset:t});
      t+=dur+gapAfter;
    });
    const footTake={};
    slots.forEach((sl,i)=>{
      const next=slots[i+1];
      if(F && sl.fs && sl.v!=='c') footThump(sl.onset,0.9);
      const ctx={footKey:F?(sl.foot+':'+(sl.isLong?'l':'s')):null, footTake, pitchLift:sl.pitchLift,
                 nextOnset:next?next.onset:null, xfade};
      syllableSound_new(R,sl.onset,sl.dur,sl.isLong,sl.vol,i/Math.max(1,n-1),ctx);
      if(opts.onStep) A.timers.push(setTimeout(()=>opts.onStep(i),(sl.onset-A.ctx.currentTime)*1000));
    });
    const last=slots[n-1], endT=last.onset+last.dur;
    if(opts.onEnd) A.timers.push(setTimeout(opts.onEnd,(endT-A.ctx.currentTime)*1000+60));
    return (endT-t0);
  });
}
