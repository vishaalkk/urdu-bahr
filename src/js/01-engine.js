/* ===== Urdu scansion engine — rules from Pritchett & Khaliq, Urdu Meter: A Practical Handbook ===== */
(function(root){
'use strict';

/* ---------- meters (ch.6, exact) ---------- */
const METERS_RAW = [
 [1,"= = = / = - = / - = ="],[2,"= = / - = = // = = / - = ="],[3,"= = - = / = = - = / = = - = / = = - ="],
 [4,"= = - / = - = = // = = - / = - = ="],[5,"= = - / = - = - / - = = - / = - ="],
 [6,"= = / - - = / = = / = = / = = / - - = / = = / = ="],[7,"= = - / - = = = // = = - / - = = ="],
 [8,"= = - / - = = - / - = = - / - = ="],[9,"= = - / - = - = / - = ="],[10,"= - = = / = - = = / = - = = / = - ="],
 [11,"= - = = / = - = = / = - ="],[12,"= - = / = - = / = - = / = - = / = - = / = - = / = - = / = - ="],
 [13,"= - = / = - = / = - = / ="],[14,"x - = = / - = - = / = ="],[15,"x - = = / - = - = / - - ="],
 [16,"x - = = / - - = = / = ="],[17,"x - = = / - - = = / - - ="],[18,"x - = = / - - = = / - - = = / = ="],
 [19,"x - = = / - - = = / - - = = / - - ="],[20,"= - = / - = = = // = - = / - = = ="],[21,"= - = / - = - = // = - = / - = - ="],
 [22,"= - - = / = - = // = - - = / = - ="],[23,"= - - = / = - = - / = - - = / ="],[24,"= - - = / = - - = / = - ="],
 [25,"= - - = / - = - = // = - - = / - = - ="],[26,"- = = = / - = = = / - = = = / - = = ="],[27,"- = = = / - = = = / - = ="],
 [28,"- = = / - = = / - = = / - = ="],[29,"- = = / - = = / - = = / - ="],[30,"- = - / = = / - = - / = = / - = - / = = / - = - / = ="],
 [31,"- = - / = = / - = - / = = / - = - / = ="],[32,"- = - = / - = - = / - = - = / - = - ="],[33,"- = - = / - - = = / - = - = / = ="],
 [34,"- = - = / - - = = / - = - = / - - ="],[35,"- = - = / - - = = / - = - = / - - = ="],[36,"- - = - / = - = = // - - = - / = - = ="],
 [37,"- - = - = / - - = - = / - - = - = / - - = - ="]
];
const RUBAI_RAW = [
 ["R1","= = - / - = = - / - = = - / - ="],["R2","= = - / - = = - / - = = = / ="],["R3","= = - / - = - = / - = = = / ="],
 ["R4","= = - / - = - = / - = = - / - ="],["R5","= = = / = - = / - = = - / - ="],["R6","= = = / = - = / - = = = / ="],
 ["R7","= = - / - = = = / = = = / ="],["R8","= = - / - = = = / = = - / - ="],["R9","= = = / = = = / = = - / - ="],
 ["R10","= = = / = = = / = = = / ="],["R11","= = = / = = - / - = = = / ="],["R12","= = = / = = - / - = = - / - ="]
];
const CAESURA_OK = new Set([2,4,7,20,21,22,25,36]);   /* meters allowing an extra short before the break */

function parseRaw(raw){
  const toks=[]; raw.trim().split(/\s+/).forEach(p=>{
    if(p==='//')toks.push('//'); else if(p==='/')toks.push('|');
    else if(p==='=')toks.push('l'); else if(p==='-')toks.push('s'); else if(p==='x')toks.push('x');
  }); return toks;
}
function buildMeter(id,raw,kind){
  const toks=parseRaw(raw), seq=[]; let cae=-1;
  toks.forEach(t=>{ if(t==='//')cae=seq.length; else if(t!=='|')seq.push(t); });
  return {id,raw,toks,seq,cae,kind:kind||'regular',
    cheatFinal: id!==26, cheatCae: CAESURA_OK.has(id)&&cae>0};
}
const GHALIB_USED=new Set([10,26,5,20,18,19,36,27,14,15,33,34,4,16,17,28,8,11,25,35,23,7,9,1,22,2,29]);
const METERS = METERS_RAW.map(([n,r])=>buildMeter(n,r)).concat(RUBAI_RAW.map(([n,r])=>buildMeter(n,r,'rubai')));
/* expand allowances into concrete target variants; 'c' = cheat slot (unscanned short, must be word-final) */
function variants(m){
  const out=[{seq:m.seq.slice(),extra:0}];
  if(m.cheatFinal) out.push({seq:m.seq.concat(['c']),extra:0});
  if(m.cheatCae){
    const base=out.slice();
    base.forEach(v=>{const s=v.seq.slice(); s.splice(m.cae,0,'c'); out.push({seq:s,extra:0});});
  }
  return out;
}
METERS.forEach(m=>m.vars=variants(m));


/* ---------- feet (afāʿīl), handbook ch.5 — pattern → [roman syllables, Urdu name] ---------- */
const FEET={
 'lll':[['maf','ʿū','lun'],'مفعولن'], 'llsl':[['mus','taf','ʿi','lun'],'مستفعلن'], 'lls':[['maf','ʿū','l'],'مفعول'],
 'll':[['faʿ','lun'],'فعلن'], 'lsll':[['fā','ʿi','lā','tun'],'فاعلاتن'], 'lsls':[['fā','ʿi','lā','t'],'فاعلات'],
 'lsl':[['fā','ʿi','lun'],'فاعلن'], 'lssl':[['muf','ta','ʿi','lun'],'مفتعلن'], 'ls':[['faʿ','l'],'فعل'], 'l':[['faʿ'],'فع'],
 'slll':[['ma','fā','ʿī','lun'],'مفاعیلن'], 'slls':[['ma','fā','ʿī','l'],'مفاعیل'], 'sll':[['fa','ʿū','lun'],'فعولن'],
 'slsl':[['ma','fā','ʿi','lun'],'مفاعلن'], 'sls':[['fa','ʿū','l'],'فعول'], 'sl':[['fa','ʿal'],'فعل'],
 'ssll':[['fa','ʿi','lā','tun'],'فعلاتن'], 'sslsl':[['mu','ta','fā','ʿi','lun'],'متفاعلن'], 'ssls':[['fa','ʿi','lā','tu'],'فعلات'],
 'ssl':[['fa','ʿi','lun'],'فعلن']
};
function footInfo(pat){ const f=FEET[pat]; return f?{pat,ro:f[0],ur:f[1],name:f[0].join('')}:{pat,ro:pat.split('').map(c=>c==='l'?'=':'–'),ur:'',name:''}; }
/* foot index for each position of a (variant) sequence; cheat slots belong to the foot before them */
function footMap(m,seq){
  const base=[]; let fi=0; m.toks.forEach(t=>{ if(t==='|'||t==='//'){ fi++; } else base.push(fi); });
  const out=[]; let b=0; seq.forEach(t=>{ if(t==='c'){ out.push({f:base[Math.max(0,b-1)],cheat:true}); } else { out.push({f:base[b],cheat:false}); b++; } });
  const caeFoot = m.cae>0 ? base[m.cae] : -1;
  return {map:out,caeFoot};
}
/* Hindi meter: segment into the feet Pritchett's patterns (a)–(h) use: = =, = –, – = =, – = –, and a final = */
function hindiFeet(res){
  const w=res.filter(x=>x!=='c'), n=w.length, FE=[['ll',0],['sll',0],['ls',0.5],['sls',0.7]];
  const best=new Array(n+1).fill(null); best[0]={c:0,cuts:[],m:0};
  for(let i=0;i<n;i++){ if(!best[i]) continue;
    const opts=FE.concat(i===n-1?[['l',0]]:[]).concat(i===n-2?[['sl',0]]:[]);
    opts.forEach(([p,c])=>{ const L=p.length; if(i+L>n) return; if(w.slice(i,i+L).join('')!==p) return;
      const mor=best[i].m+[...p].reduce((a,ch)=>a+(ch==='l'?2:1),0);
      const pen = (best[i].m<16 && mor>16) ? 2 : 0;
      const cand={c:best[i].c+c+pen,cuts:best[i].cuts.concat([[i,L,p]]),m:mor};
      if(!best[i+L]||cand.c<best[i+L].c) best[i+L]=cand; }); }
  const r=best[n]; if(!r) return null;
  const idx=[]; r.cuts.forEach(([i,L],fi)=>{ for(let k=0;k<L;k++) idx.push(fi); });
  const out=[]; let j=0; res.forEach(x=>{ if(x==='c') out.push({f:idx[j-1]||0,cheat:true}); else { out.push({f:idx[j],cheat:false}); j++; } });
  let caeFoot=-1, mm=0; r.cuts.forEach(([i,L,p],fi)=>{ if(mm===16) caeFoot= caeFoot<0?fi:caeFoot; mm+=[...p].reduce((a,ch)=>a+(ch==='l'?2:1),0); });
  return {map:out,caeFoot};
}
/* attach feet to explained syllables: s.foot, s.fsyl (roman syllable of the rukn); returns list of feet */
function attachFeet(syl,fit){
  let fm=null;
  if(fit.seq) fm=footMap(fit.meter,fit.seq);
  else fm=hindiFeet(syl.map(s=>s.resolved));
  if(!fm) return [];
  syl.forEach((s,i)=>{ s.foot=fm.map[i].f; s.cheat=fm.map[i].cheat; });
  const feet=[]; syl.forEach((s,i)=>{ if(!feet[s.foot]) feet[s.foot]={idx:[],cae:false}; feet[s.foot].idx.push(i); });
  feet.forEach((F,fi)=>{ if(!F) return; const pat=F.idx.filter(i=>!syl[i].cheat).map(i=>syl[i].resolved==='l'?'l':'s').join('');
    Object.assign(F,footInfo(pat)); F.cae=(fi===fm.caeFoot);
    let k=0; F.idx.forEach(i=>{ if(!syl[i].cheat){ syl[i].fsyl=F.ro[k++]||''; } else syl[i].fsyl='+'; }); });
  return feet;
}
/* feet of a bare pattern string (for strips): resolves x as long */
function patternFeet(raw){
  const toks=parseRaw(raw), groups=[[]], cae=[]; toks.forEach(t=>{ if(t==='|'){groups.push([]);} else if(t==='//'){cae.push(groups.length); groups.push([]);} else groups[groups.length-1].push(t); });
  return groups.map((g,i)=>Object.assign(footInfo(g.map(x=>x==='x'?'l':x).join('')),{toks:g,caeBefore:cae.includes(i)}));
}

/* ---------- letters ---------- */
const HARAKAT=/[\u064B-\u0650\u0652-\u065F\u0670]/;   /* all diacritics except shadda (0651) */
const MAP={'أ':'ا','إ':'ا','ٱ':'ا','ي':'ی','ى':'ی','ك':'ک','ه':'ہ','ۀ':'ہ','ۂ':'ہ','ة':'ت','ۃ':'ت','ئ':'ء','ە':'ہ'};
function typ(l){ if(l==='AA')return'AA'; if(l==='ا')return'A'; if(l==='و')return'W'; if(l==='ی')return'Y'; if(l==='ے')return'E'; if(l==='ہ')return'H'; return'C'; }
const isVowelT=t=>t==='A'||t==='W'||t==='Y'||t==='E'||t==='AA';

function lexKey(w){ return w.replace(/[\u064B-\u065F\u0670\u0640\u200C\u200D]/g,'').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/ه/g,'ہ'); }
/* word-level Urdu -> Pritchett-ASCII, built from every verified corpus line
   (see WORD_ASCII_MAP), so a typed line built from known ghazal vocabulary
   can go through the real Pue parser instead of the lossy character map. */
function normalize(raw){
  let s=raw.normalize('NFC').replace(/[\u0640\u200C\u200D]/g,'');
  let suffix=null;
  if(/\u0650$/.test(s)){suffix='iz'; s=s.slice(0,-1);}           /* written zer = iẓāfat */
  if(/(ۂ|ۀ|ہ\u0654|ه\u0654)$/.test(s)){suffix='iz'; s=s.replace(/(ۂ|ۀ|ہ\u0654|ه\u0654)$/,'ہ');}
  const key=lexKey(s);
  if(/(ی\u0654|ئ\u0650|ی\u0650)$/.test(s)){suffix='iz'; s=s.replace(/(\u0654|\u0650)$/,'');}
  const L=[];
  let idx=-1;
  for(const ch0 of s){ idx++;
    if(ch0==='أ' && idx>0){ L.push('ء'); continue; }
    if(ch0==='\u0651'){ if(L.length && typ(L[L.length-1])!=='A' && L[L.length-1]!=='AA') L.push(L[L.length-1]); continue; }  /* tashdīd doubles */
    if(HARAKAT.test(ch0)) continue;
    if(ch0==='\u0654'){ continue; }
    if(ch0==='ھ'||ch0==='ں') continue;                        /* aspiration h and nasal n are not letters */
    if(ch0==='آ'){L.push('AA');continue;}
    if(ch0==='ۓ'){L.push('ء','ے');continue;}
    if(ch0==='ؤ'){L.push('ء','و');continue;}
    const ch=MAP[ch0]||ch0;
    if(/[\u0600-\u06FF]/.test(ch)) L.push(ch);
  }
  /* nasal ن after a long vowel, before a consonant (ḍhūñḍhā, āñkh) → not a letter */
  const out=[], flags=[];
  for(let i=0;i<L.length;i++){
    const t=typ(L[i]);
    if(L[i]==='ن' && i>0 && i<L.length-1 && (typ(L[i+1])==='C'||typ(L[i+1])==='H')){
      const pt=typ(L[i-1]);
      const afterLong = (pt==='A'||pt==='W'||pt==='Y'||pt==='E'||pt==='AA') && !(i===1 && pt==='A');
      flags.push({i:out.length, kind: afterLong?'long':'short'});
    }
    /* irregular Persian khv: خوا / خوی → و silent (ḳhvāb = khāb) */
    if(L[i]==='و' && i>0 && L[i-1]==='خ' && (L[i+1]==='ا'||L[i+1]==='ی'||L[i+1]==='ش'||L[i+1]==='د')){ continue; }
    out.push(L[i]);
  }
  return {letters:out, key, suffix, raw, nasal:flags.slice(0,3)};
}

/* ---------- lexicon (ch.2 flexible monosyllables etc.) ---------- */
const LEX={};
function lex(words,opts){ words.split(' ').forEach(w=>LEX[w]=opts); }
const X1=[{w:['x'],c:0}];
lex('بھی تو تھا تھے تھی تھیں جو دو سا سے سی سو کا کے کی کو میں نے وہ یہ ہو ہوں ہی ہے ہیں یوں تُو کوں سوں',X1);
lex('پیار بیاہ دھیان پیاس',[{w:['l','s'],c:0}]);
lex('پیارا پیاری پیارے',[{w:['l','x'],c:0}]);
lex('آئینہ',[{w:['l','x','x'],c:0}]);
lex('تا گو یا جیوں جوں',[{w:['l'],c:0}]);
lex('کیوں',[{w:['l'],c:0},{w:['s'],c:1.5,n:'kyūñ shortened'}]);
lex('نہ کہ بہ',[{w:['s'],c:0}]);
lex('کیا',[{w:['l'],c:0,n:'read as kyā'},{w:['s','x'],c:0.8,n:'read as kiyā'}]);
lex('اور',[{w:['l','s'],c:0},{w:['l'],c:0.2,n:'aur as a single long'}]);
lex('کوئی',[{w:['x','x'],c:0}]);
lex('ایک',[{w:['l','s'],c:0},{w:['l'],c:0.6,n:'ek read as ik'}]);
lex('اک',[{w:['l'],c:0}]);
lex('ہوا ہوئی ہوئے ہوئیں ہوئا گیا گئی گئے گئیں گئں',[{w:['s','x'],c:0}]);
lex('تسلی تسلّی',[{w:['s','l','x'],c:0}]);
lex('تمہیں انہیں انھیں تمھیں',[{w:['s','x'],c:0}]);
lex('تمہارا تمہاری تمہارے تمھارا تمھاری تمھارے',[{w:['s','l','x'],c:0}]);

/* ---------- syllabify a letter string into candidate readings ---------- */
function syllabify(L){
  const T=L.map(typ), n=L.length, res=[];
  function go(i,acc,cost){
    if(cost>6) return;
    if(i===n){res.push({syl:acc.slice(),c:cost});return;}
    const t=T[i], n1=T[i+1], n2=T[i+2];
    const push=(k,len,w,c)=>{acc.push({k,t:L.slice(i,i+len),w}); go(i+len,acc,cost+c); acc.pop();};
    if(t==='AA'){ push('AA',1,'l',0); return; }
    if(t==='E') return;
    if(t==='A'){
      if(i!==0){ push('A1',1,'l',3); return; }
      if(n1===undefined){ push('A1',1,'l',0); return; }
      if(n1==='W'||n1==='Y'||n1==='E'){ push('AV',2,'l',0); push('V1',1,'s',1); return; }
      if(n1==='C'||n1==='H'){ push('AC',2,'l',0); push('V1',1,'s',0); return; }
      push('V1',1,'s',1); return;
    }
    /* consonant-type onset (C,H,W,Y) */
    if(n1===undefined){ const prev=acc[acc.length-1];
      if(t==='Y'){ push('C',1,'s',4); return; }
      if(t==='W'){ push('C',1,'s',2.5); return; }        /* word-final و/ی are vowels, not lone consonants */
      push('C',1,'s',(!prev||prev.w==='l')?0:3); return; }
    if(n1==='A'||n1==='E'){ push('CV',2,'l',0); return; }
    if(n1==='AA'){ push('C',1,'s',0); return; }
    if(n1==='W'||n1==='Y'){
      const vAfter=(n2==='A'||n2==='E');
      push('CV',2,'l',vAfter?1:0);
      push('C',1,'s',vAfter?0:(n2===undefined?4:2));
      return;
    }
    if(n1==='H'){
      if(n2===undefined){ push('CH',2,'x',0); return; }
      const vAfter=(n2==='A'||n2==='E'||n2==='W'||n2==='Y');
      push('CC',2,'l',(n2==='A'||n2==='E')?1:0);
      push('C',1,'s',vAfter?0:1);
      return;
    }
    /* n1 consonant */
    push('CC',2,'l',0);
    { const prev=acc[acc.length-1];
      let pc = n2===undefined?3:0;
      if(prev && prev.k==='V1') pc+=1.2;            /* a-pa-nī: unlikely */
      else if(prev && prev.k==='C' && prev.w==='s') pc+=0.6;
      push('C',1,'s',pc); }
  }
  go(0,[],0);
  /* flexibility: word-final vowels; forbid 3 definite shorts in a row */
  const outs=[];
  res.forEach(r=>{
    const syl=r.syl.map(s=>Object.assign({},s));
    const last=syl[syl.length-1];
    if(syl.length>1 && (last.k==='CV'||last.k==='AV')){
      last.w='x';
      const v=last.t[last.t.length-1];
      last.xs = (v==='ا')?0.6:0;            /* final ā is shortened less often */
    } else if(syl.length===1 && (last.k==='CV'||last.k==='AV'||last.k==='AA')){
      last.w='x'; last.xs=2;               /* unlisted monosyllable: normally long */
    }
    let run=0,bad=false; syl.forEach(s=>{run=(s.w==='s')?run+1:0; if(run>=3)bad=true;});
    if(!bad) outs.push({syl,c:r.c});
  });
  outs.sort((a,b)=>a.c-b.c);
  const seen=new Set(), uniq=[];
  outs.forEach(o=>{const k=o.syl.map(s=>s.w+s.t.join('')).join('.'); if(!seen.has(k)){seen.add(k);uniq.push(o);}});
  return uniq.slice(0,6);
}

/* try each nasal ن both ways: after a long vowel it is usually silent (ḍhūñḍhā),
   after a short vowel usually pronounced (rang, kanghī) but sometimes nasal (phañstā, añkhyāñ) */
function syllabifyNasal(L,nasal){
  let variants=[{L:L.slice(),c:0,n:''}];
  (nasal||[]).forEach(f=>{
    const next=[];
    variants.forEach(v=>{
      const drop=v.L.slice(); drop.splice(f.i - (L.length - v.L.length),1);
      if(f.kind==='long'){ next.push({L:drop,c:v.c,n:v.n}); next.push({L:v.L,c:v.c+0.4,n:v.n}); }
      else { next.push({L:v.L,c:v.c,n:v.n}); next.push({L:drop,c:v.c+0.8,n:(v.n?v.n+'; ':'')+'nasal ن not counted'}); }
    });
    variants=next;
  });
  const out=[];
  variants.forEach(v=>syllabify(v.L).forEach(o=>out.push({syl:o.syl,c:o.c+v.c,n:v.n})));
  out.sort((a,b)=>a.c-b.c);
  const seen=new Set(); return out.filter(o=>{const k=o.syl.map(s=>s.w+s.t.join('')).join('.'); if(seen.has(k))return false; seen.add(k); return true;}).slice(0,8);
}

/* ---------- iẓāfat / o suffix ---------- */
function applySuffix(opts,type){
  const out=[];
  opts.forEach(o=>{
    const syl=o.syl.map(s=>Object.assign({},s)), last=syl.pop();
    const E={k:'SUF',t:['ِ'],w:'x',suf:type};
    const add=(arr,c,note)=>out.push({syl:arr,c:o.c+c,n:(o.n?o.n+'; ':'')+(note||'')});
    switch(last.k){
      case 'C': add(syl.concat([Object.assign({},last,{w:'x',suf:type})]),0,type==='iz'?'iẓāfat joins final consonant':'o joins final consonant'); break;
      case 'CC': case 'AC':
        add(syl.concat([{k:'C',t:[last.t[0]],w:'s'},{k:'C',t:[last.t[1]],w:'x',suf:type}]),0);
        add(syl.concat([Object.assign({},last,{w:'l'}),{k:'C',t:[last.t[1]],w:'x',suf:type}]),1.5,'tashdīd before '+(type==='iz'?'iẓāfat':'o'));
        break;
      case 'CV': case 'AV': case 'AA': case 'A1': {
        const v=last.t[last.t.length-1];
        if(v==='ی'){
          const ivy={k:'C',t:[last.t[0]],w:'s'}, yE={k:'C',t:['ی'],w:'x',suf:type};
          const sep=[Object.assign({},last,{w:'l'}),Object.assign({},E,{w: type==='iz'?'s':'x'})];
          if(type==='iz'){ add(syl.concat([ivy,yE]),0,'ī becomes consonant before iẓāfat'); add(syl.concat(sep),1.5,'separate iẓāfat after ī'); }
          else { add(syl.concat(sep),0); add(syl.concat([ivy,yE]),1,'ī becomes consonant before o'); }
        } else if(v==='ے'){
          add(syl.concat([{k:'C',t:[last.t[0]],w:'s'},{k:'C',t:['ے'],w:'x',suf:type}]),0,'e becomes consonant');
        } else if(v==='و'){
          add(syl.concat([Object.assign({},last,{w:'l'}),E]),0);
          add(syl.concat([{k:'C',t:[last.t[0]],w:'s'},{k:'C',t:['و'],w:'x',suf:type}]),1,'au becomes av');
        } else { add(syl.concat([Object.assign({},last,{w:'l'}),E]),0,'final ā stays long'); }
        break; }
      case 'CH':
        add(syl.concat([{k:'C',t:[last.t[0]],w:'s'},{k:'C',t:['ہ'],w:'x',suf:type}]),0,'hidden h + iẓāfat');
        break;
      default: add(syl.concat([last,E]),0);
    }
  });
  return out;
}

function scanWord(raw,forceSuffix){
  raw = (raw || '').normalize('NFC');
  const nw=normalize(raw);
  const suffix=forceSuffix||nw.suffix;
  let opts;
  const lx=LEX[nw.key];
  if(lx && !suffix){
    opts=lx.map(o=>({syl:[{k:'LEX',t:nw.letters.slice(),w:o.w.length===1?o.w[0]:null,lexw:o.w}],c:o.c,n:o.n||''}))
      .map(o=>{ if(o.syl[0].lexw.length>1){ /* split letters roughly for display */
        const ws=o.syl[0].lexw, letters=nw.letters, per=Math.max(1,Math.floor(letters.length/ws.length));
        o.syl=ws.map((w,j)=>({k:'LEX',t:letters.slice(j*per, j===ws.length-1?letters.length:(j+1)*per),w,xs:0}));
      } else { o.syl[0].w=o.syl[0].lexw[0]; o.syl[0].xs=0; }
      return o; });
  } else {
    opts=syllabifyNasal(nw.letters,nw.nasal);
    if(suffix) opts=applySuffix(opts,suffix);
  }
  return {raw,letters:nw.letters,key:nw.key,suffix,opts};
}
function tokenize(line){
  line = (line || '').normalize('NFC');
  const parts=line.replace(/[،۔؟!,.;:?"'«»()\[\]]/g,' ').split(/\s+/).filter(Boolean);
  const words=[];
  for(let i=0;i<parts.length;i++){
    const p=parts[i];
    if((p==='و'||p==='وَ'||p==='-و-') && words.length){ words[words.length-1].pendingO=true; continue; }
    words.push({raw:p});
  }
  return words.map(w=>scanWord(w.raw, w.pendingO?'o':null)).map((w,i,arr)=>w);
}
/* grafting eligibility: first ends in consonant, second begins with ا or آ */
function graftable(a,b){
  if(a.suffix||!b) return false;
  const la=a.letters[a.letters.length-1]; if(!la) return false;
  const ta=typ(la); if(ta!=='C') return false;
  const fb=b.letters[0]; return fb==='ا'||fb==='AA';
}
function graftedOpts(chain){
  let L=chain[0].letters.slice();
  for(let k=1;k<chain.length;k++){
    const b=chain[k].letters; L=L.concat(b[0]==='AA'?['ا'].concat(b.slice(1)):b.slice(1));
  }
  let opts=syllabify(L).map(o=>({syl:o.syl,c:o.c+1.2*(chain.length-1),n:'word-grafting'}));
  const lastSuf=chain[chain.length-1].suffix; if(lastSuf) opts=applySuffix(opts,lastSuf);
  return opts;
}
function buildUnits(words, overrides){
  const units=[];
  for(let i=0;i<words.length;i++){
    const u=[];
    const ov=overrides&&overrides[i];
    const own = (ov&&ov.suffix!==undefined) ? scanWord(words[i].raw, ov.suffix||null).opts : words[i].opts;
    const pinned = ov && ov.opt!=null ? [own[ov.opt]].filter(Boolean) : own;
    u.push({from:i,to:i,opts:pinned,graft:false});
    if(!(ov&&ov.noGraft)){
      if(graftable(words[i],words[i+1])){ u.push({from:i,to:i+1,opts:graftedOpts([words[i],words[i+1]]),graft:true});
        if(graftable(words[i+1],words[i+2])) u.push({from:i,to:i+2,opts:graftedOpts([words[i],words[i+1],words[i+2]]),graft:true}); }
    }
    units.push(u);
  }
  return units;
}

/* ---------- match a line against one regular/rubāʿī meter ---------- */
function cheatOK(s){ /* ch.6: a true one-letter short syllable, or hamza + vowel */
  if(s.suf) return false;
  if(s.k==='C' && s.t.length===1 && s.w==='s') return true;
  return s.t && s.t[0]==='ء';
}
function resolveCost(w,t,s){
  if(t==='c') return cheatOK(s)?0:Infinity;
  if(t==='x') return 0;
  if(w==='x') return t==='s'?(s.xs||0):0;
  return w===t?0:Infinity;
}
function matchMeter(units,n,m){
  let best=null;
  m.vars.forEach(v=>{
    const seq=v.seq, memo=new Map();
    function f(i,pos){
      if(i===n) return pos===seq.length?{c:0,path:[]}:null;
      const key=i+'|'+pos; if(memo.has(key)) return memo.get(key);
      let b=null;
      for(const u of units[i]){
        for(let oi=0;oi<u.opts.length;oi++){
          const o=u.opts[oi], sy=o.syl; if(pos+sy.length>seq.length) continue;
          let c=o.c, ok=true;
          for(let k=0;k<sy.length;k++){
            const t=seq[pos+k];
            if(t==='c' && k!==sy.length-1){ok=false;break;}
            const rc=resolveCost(sy[k].w,t,sy[k]); if(rc===Infinity){ok=false;break;} c+=rc;
          }
          if(!ok) continue;
          const rest=f(u.to+1,pos+sy.length); if(!rest) continue;
          if(!b||c+rest.c<b.c) b={c:c+rest.c,path:[{u,oi,pos}].concat(rest.path)};
        }
      }
      memo.set(key,b); return b;
    }
    const r=f(0,0);
    if(r && (!best||r.c<best.c)) best={c:r.c+v.extra,path:r.path,seq};
  });
  if(best){ best.prior = m.kind==='rubai'?0.6:(GHALIB_USED.has(m.id)?0:0.4); best.c+=best.prior; }
  return best;
}
/* ---------- Mir's "Hindi" meter (handbook 6.2) ----------
   Counted in half-beats (long=2, short=1). Total 28/30/32 (14/15/16 longs; 15 usual).
   Short syllables come in pairs; a pair may be split by one long (- = -, rare).
   Russell's model (pairs replace even-numbered longs, never the 8th) is the norm, so
   pairs elsewhere cost a little, syncopation costs more. Last syllable long; optional cheat. */
function matchHindi(units,n){
  let best=null;
  [30,28,32].forEach((M,mi)=>{
    const memo=new Map();
    function f(i,m,st){                      /* st: 0 free, 1 one short open, 2 short+long open */
      if(i===n) return (m===M&&st===0)?{c:0,path:[]}:null;
      const key=i+'|'+m+'|'+st; if(memo.has(key))return memo.get(key);
      let b=null;
      for(const u of units[i]) for(let oi=0;oi<u.opts.length;oi++){
        const o=u.opts[oi];
        /* enumerate resolutions of this option's syllables (x = long or short) */
        const alts=[{m,st,c:o.c,res:[]}];
        for(let k=0;k<o.syl.length;k++){
          const s=o.syl[k]; const nxt=[];
          const isLastSyl = (u.to===n-1 && k===o.syl.length-1);
          alts.forEach(A=>{
            const tryL=()=>{ if(A.st===2) return; const c=A.c+(A.st===1?1.2:0)+(s.w==='x'&&false?0:0);
              nxt.push({m:A.m+2,st:A.st===1?2:0,c,res:A.res.concat('l')}); };
            const tryS=()=>{ let c=A.c+(s.w==='x'?(s.xs||0):0);
              if(A.st===0){ const slot=Math.floor(A.m/2)+1; if(!(A.m%2===0 && slot%2===0 && slot!==8)) c+=0.4;
                nxt.push({m:A.m+1,st:1,c,res:A.res.concat('s')}); }
              else nxt.push({m:A.m+1,st:0,c,res:A.res.concat('s')}); };
            if(s.w==='l'||s.w==='x') tryL();
            if(s.w==='s'||s.w==='x') tryS();
            if(isLastSyl && A.st===0 && A.m===M && cheatOK(s)) nxt.push({m:A.m,st:0,c:A.c,res:A.res.concat('c')});
          });
          alts.length=0; nxt.filter(A=>A.m<=M).forEach(A=>alts.push(A));
          if(alts.length>40){ alts.sort((x,y)=>x.c-y.c); alts.length=40; }
        }
        alts.forEach(A=>{
          const rest=f(u.to+1,A.m,A.st); if(!rest) return;
          if(!b||A.c+rest.c<b.c) b={c:A.c+rest.c,path:[{u,oi,res:A.res}].concat(rest.path)};
        });
      }
      memo.set(key,b); return b;
    }
    const r=f(0,0,0);
    if(r){ const lastRes=r.path[r.path.length-1].res; const endsLong=lastRes[lastRes.length-1]==='l'||(lastRes[lastRes.length-1]==='c'&&lastRes[lastRes.length-2]==='l');
      if(endsLong){ const c=r.c+0.8+mi*0.3; if(!best||c<best.c) best={c,path:r.path,M:M/2}; } }
  });
  return best;
}
/* x syllables inside Hindi matcher are greedily read long; try the alternative too via a second pass */

/* ---------- public: scan a line ---------- */
function scanLine(line, overrides){
  line = (line || '').normalize('NFC');
  const words=tokenize(line), n=words.length;
  if(!n) return {words,fits:[]};
  const units=buildUnits(words,overrides);
  const fits=[];
  METERS.forEach(m=>{ const r=matchMeter(units,n,m); if(r) fits.push({meter:m,c:r.c,path:r.path,seq:r.seq}); });
  const h=matchHindi(units,n); if(h) fits.push({meter:{id:'H',kind:'hindi',raw:'Hindi'},c:h.c,path:h.path,M:h.M});
  fits.sort((a,b)=>a.c-b.c);
  return {words,fits,units};
}
/* flatten a fit into displayable syllables with resolved weights */
/* map original characters (incl. ھ ں diacritics) onto syllables */
function alignTexts(rawWords, syl){
  const exp=[]; syl.forEach((sy,si)=>{ if(sy.k==='SUF') return; sy.t.forEach(l=>exp.push({l,si})); });
  const texts=syl.map(()=> '');
  let p=0, cur=0;
  const raw=rawWords.map(w => (w || '').normalize('NFC')).join('');
  for(const ch0 of raw){
    let ch=MAP[ch0]||ch0; if(ch0==='آ') ch='AA'; if(ch0==='ۓ') ch='ء';
    const e=exp[p];
    if(e && (e.l===ch || (e.l==='ا'&&ch==='AA') || (e.l==='AA'&&ch==='AA'))){ cur=e.si; texts[cur]+=ch0; p++; continue; }
    if(ch0==='\u0651' && e && exp[p-1] && e.l===exp[p-1].l){ const prevGlyph=[...texts[cur]].filter(c=>!/[\u064B-\u065F]/.test(c)).pop()||''; cur=e.si; texts[cur]+=prevGlyph+ch0; p++; continue; }
    if(ch0==='ۓ' && e && e.l==='ء'){ cur=e.si; texts[cur]+=ch0; p+=2; continue; }
    texts[cur]+=ch0;
  }
  syl.forEach((sy,si)=>{ if(sy.k==='SUF') texts[si]= sy.suf==='o'?'و':'ِ'; else if(sy.suf==='o') texts[si]+=' و'; });
  return texts;
}
function explain(res,fit){
  const out=[]; const notes=[];
  let pos=0;
  fit.path.forEach(step=>{
    const o=step.u.opts[step.oi];
    if(o.n) notes.push({word:res.words.slice(step.u.from,step.u.to+1).map(w=>w.raw).join(' '),note:o.n});
    const rawWords=res.words.slice(step.u.from,step.u.to+1).map(w=>w.raw);
    const texts=alignTexts(rawWords,o.syl);
    o.syl.forEach((s,k)=>{
      let rw;
      if(step.res) rw=step.res[k];
      else { const t=fit.seq[(step.pos||0)+k]; rw = t==='c'?'c':(t==='x')?(s.w==='x'?'l':s.w):t;
        if(s.w==='x' && t==='s' && s.xs) notes.push({word:res.words[step.u.from].raw,note:'final vowel shortened (uncommon)'}); }
      out.push({text:texts[k]||'·',native:s.w,resolved:rw,word:step.u.from,wordTo:step.u.to,graft:step.u.graft,suf:s.suf,last:k===o.syl.length-1});
    });
  });
  const feet=attachFeet(out,fit);
  return {syl:out,notes,feet};
}

const API={METERS,FEET,footInfo,patternFeet,attachFeet,parseRaw,scanLine,explain,normalize,syllabify,scanWord,tokenize,buildUnits,matchMeter,matchHindi,
  matchWeights(ws){ /* pattern-only matching (tap mode / manual) */
    const fits=[];
    METERS.forEach(m=>{ let best=Infinity;
      m.vars.forEach(v=>{ if(v.seq.length!==ws.length) return; let c=0;
        for(let i=0;i<ws.length;i++){ const r=v.seq[i]==='c'?((ws[i]==='s'||ws[i]==='x')?0:Infinity):resolveCost(ws[i],v.seq[i],{xs:0}); if(r===Infinity){c=Infinity;break;} c+=r; }
        if(c<best)best=c; });
      if(best<Infinity) fits.push({meter:m,c:best}); });
    return fits;
  }};
if(typeof module!=='undefined') module.exports=API; else root.Scan=API;
})(this);

/* duplicate of the scanner engine's private lexKey (normalizes a word for
   lookup) — that one is trapped inside the IIFE above and only usable by the
   engine itself; this identical copy is for the global-scope helpers below. */
function lexKey(w){ return w.replace(/[\u064B-\u065F\u0670\u0640\u200C\u200D]/g,'').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/ه/g,'ہ'); }
let _wordAsciiNorm = null;
function wordAsciiNormMap(){
  if(_wordAsciiNorm) return _wordAsciiNorm;
  _wordAsciiNorm = {};
  if(typeof WORD_ASCII_MAP !== 'undefined'){
    Object.keys(WORD_ASCII_MAP).forEach(w => {
      const k = lexKey(w);
      if(!(k in _wordAsciiNorm)) _wordAsciiNorm[k] = WORD_ASCII_MAP[w];
    });
  }
  return _wordAsciiNorm;
}
function urduLineToAscii(urLine){
  const norm = wordAsciiNormMap();
  const parts = urLine.split(/(\s+)/);
  let allKnown = parts.some(w => !/^\s*$/.test(w));
  const out = parts.map(w => {
    if(/^\s*$/.test(w)) return w;
    const k = lexKey(w);
    if(norm[k]) return norm[k];
    allKnown = false;
    return w;
  });
  return { ascii: out.join(''), allKnown };
}

/* ---- syllable-level Roman display for chips, from the already-correct
   whole-line/whole-word spelling, not a fresh guess ----
   A word's correct Roman spelling is split into exactly N pieces (N = the
   scanner's own syllable count for that word) using where its vowels
   actually are, plus the classical Perso-Arabic rule for a consonant run
   between two vowels: one consonant goes with the FOLLOWING syllable; two
   or more split after the first (closing/heavying the PRECEDING syllable),
   the rest go to the following syllable. Digraphs (kh, gh, bh, ph, th, dh,
   ḍh, ṛh, chh, jh, ḳh, ġh) are never split apart. If a word's vowel count
   doesn't match N, or a line's words don't line up 1:1 with its Roman
   tokens (compounds, grafted phrases), this quietly returns null and the
   caller falls back to the old per-fragment conversion — never wrong,
   just occasionally less complete, same as before this existed. */
const ROMAN_DIGRAPHS=['ḳh','ġh','chh','kh','gh','bh','ph','th','dh','ḍh','ṛh','jh'];
const ROMAN_VOWELS='aeiouāīūēōâîûêô';
function romanConsonantUnits(span){
  // Fix C: skip hyphens so they don't count as consonant units (izafat splits land correctly)
  const units=[]; let i=0;
  while(i<span.length){
    if(span[i]==='-'){ i+=1; continue; } // Fix C: hyphens are not consonant units
    let m=null;
    for(const dg of ROMAN_DIGRAPHS){ if(span.startsWith(dg,i)){ m=dg; break; } }
    if(m){ units.push(m); i+=m.length; } else { units.push(span[i]); i+=1; }
  }
  return units;
}
function romanNuclei(word){
  const out=[]; let i=0;
  while(i<word.length){
    if(ROMAN_VOWELS.includes(word[i])){
      let j=i+1; while(j<word.length && ROMAN_VOWELS.includes(word[j])) j++;
      if(word[j]==='ñ') j++;
      out.push([i,j]); i=j;
    } else i++;
  }
  return out;
}
function syllabifyRoman(word,n){
  const nuclei=romanNuclei(word);
  // Fix B: allow a word ending in a closed syllable (trailing consonant cluster)
  // when n === nuclei.length+1 we split the trailing consonant run as its own final piece
  if(nuclei.length!==n && !(n===nuclei.length+1)) return null;
  const bounds=[0];
  for(let k=0;k<nuclei.length-1;k++){
    const spanStart=nuclei[k][1], spanEnd=nuclei[k+1][0];
    const units=romanConsonantUnits(word.slice(spanStart,spanEnd));
    bounds.push(units.length<=1 ? spanStart : spanStart+units[0].length);
  }
  if(n===nuclei.length+1){
    // Fix B: closed-syllable final piece — split trailing consonant run off the last nucleus
    const lastNucEnd=nuclei.length>0 ? nuclei[nuclei.length-1][1] : 0;
    bounds.push(lastNucEnd);
    bounds.push(word.length);
  } else {
    bounds.push(word.length);
  }
  const out=[]; for(let k=0;k<bounds.length-1;k++) out.push(word.slice(bounds[k],bounds[k+1]));
  return out;
}
/* map each scanner word-index -> its correct Roman spelling, honoring
   word-grafting (several Urdu tokens read as one prosodic word).
   Fix A: split ro on spaces AND hyphens, keeping izafat -e/-o/-i attached
   to preceding piece; fail per-word not per-line so one compound doesn't
   sink the whole line. */
function wordRomanMap(lineObj,r){
  if(!lineObj || !lineObj.ro || !r || !r.words) return null;
  // Expand space-separated tokens; hyphens that introduce non-izafat pieces become real splits
  const spaceTokens=lineObj.ro.trim().split(/\s+/);
  const romanTokens=[];
  for(const tok of spaceTokens){
    const parts=tok.split(/-/);
    if(parts.length<=1){ romanTokens.push(tok); continue; }
    let cur=parts[0];
    for(let pi=1;pi<parts.length;pi++){
      const piece=parts[pi];
      // Izafat: 1-2 char all-vowel piece (e, o, ī, i, ...) — attach to preceding
      const isIzafat=/^[aeiouāīūēōâîûêô]{1,2}$/.test(piece);
      if(isIzafat){ cur+='-'+piece; }
      else { romanTokens.push(cur); cur=piece; }
    }
    romanTokens.push(cur);
  }
  let ptr=0; const map=[];
  for(let wi=0; wi<r.words.length; wi++){
    const urduTokens=(r.words[wi].raw||'').trim().split(/\s+/).filter(Boolean);
    const k=Math.max(1,urduTokens.length);
    const chunk=romanTokens.slice(ptr,ptr+k);
    // Fix A: null for this word only — don't abort the whole line
    map[wi]= chunk.length===k ? chunk.join('') : null;
    ptr+=k;
  }
  // Fix A: always return the map (per-word failures are already null in map[wi])
  return map;
}
/* per-syllable override array (parallel to e.syl), 'ro' script only for now */
function chipRomanOverrides(syl,li){
  if(!lastScan || !lastScan.results || !lastScan.results[li] || !lastScan.lineObjs) return [];
  const r=lastScan.results[li], lineObj=lastScan.lineObjs[li];
  const wmap=wordRomanMap(lineObj,r);
  if(!wmap) return [];
  const counts={}, ordinals=[];
  syl.forEach(s=>{ const ord=counts[s.word]||0; ordinals.push(ord); counts[s.word]=ord+1; });
  const pieces={};
  return syl.map((s,i)=>{
    if(!(s.word in pieces)){
      const w=wmap[s.word];
      pieces[s.word]= w ? syllabifyRoman(w,counts[s.word]) : null;
    }
    const p=pieces[s.word];
    return p ? p[ordinals[i]] : null;
  });
}


