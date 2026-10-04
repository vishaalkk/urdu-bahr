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
 [37,"- - = - = / - - = - = / - - = - = / - - = - ="],
 [38,"- = = / - = = / - = = / - = = // - = = / - = = / - = = / - = ="],
 [39,"= - = / = - = / = - = / = - ="],
 [40,"- = - / = = // - = - / = ="]
];
const RUBAI_RAW = [
 ["R1","= = - / - = = - / - = = - / - ="],["R2","= = - / - = = - / - = = = / ="],["R3","= = - / - = - = / - = = = / ="],
 ["R4","= = - / - = - = / - = = - / - ="],["R5","= = = / = - = / - = = - / - ="],["R6","= = = / = - = / - = = = / ="],
 ["R7","= = - / - = = = / = = = / ="],["R8","= = - / - = = = / = = - / - ="],["R9","= = = / = = = / = = - / - ="],
 ["R10","= = = / = = = / = = = / ="],["R11","= = = / = = - / - = = = / ="],["R12","= = = / = = - / - = = - / - ="]
];
const CAESURA_OK = new Set([2,4,7,20,21,22,25,36,38,40]);   /* meters allowing an extra short before the break */

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

/* NFC first: the word map's Urdu (Pue's parser) writes آ as ا + combining madda, typed text as one letter */
function lexKey(w){ return w.normalize('NFC').replace(/[\u064B-\u065F\u0670\u0640\u200C\u200D]/g,'').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/ه/g,'ہ'); }
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
    if(ch0==='\u0651' || ch0==='\uFE7C'){ if(L.length && typ(L[L.length-1])!=='A' && L[L.length-1]!=='AA') L.push(L[L.length-1]); continue; }  /* tashdīd doubles */
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
lex('کاروبار',[{w:['l','l','l','s'],c:0},{w:['l','s','l','s'],c:0.5,n:'kār-o-bār, short conjunctive و'},{w:['l','s','s','l','s'],c:2.6},{w:['l','s','l','l','s'],c:5}]);
lex('کہہ',[{w:['l','s'],c:0},{w:['l'],c:0.3,n:'kah as one long syllable'},{w:['s','x'],c:1}]);
lex('تکلف',[{w:['l','l'],c:0},{w:['s','l','s'],c:0},{w:['s','l','l'],c:0.3,n:'takalluf as - = ='},{w:['s','s','l'],c:0.6},{w:['l','s','s'],c:6}]);
lex('تجلی',[{w:['l','x'],c:0},{w:['s','l','l'],c:0.3,n:'tajallī as - = ='},{w:['s','s','x'],c:0.6},{w:['s','l','s'],c:4}]);
lex('تمہیں انہیں انھیں تمھیں',[{w:['s','x'],c:0}]);
/* Handbook 1.2/1.4: a nasalizing نن in the first syllable of an Indic verb, a silent ع, and muñh: the letter rules alone allow other splits,
   so the pronunciation is stated here. The other splits stay available, at a cost, for poets who scan them differently. */
lex('شروع',[{w:['s','l','s'],c:0},{w:['l','l'],c:1.2},{w:['s','s','l'],c:1.2}]);
lex('ہنسنا',[{w:['l','x'],c:0},{w:['s','l','x'],c:1.2}]);
lex('منہ',[{w:['l'],c:0},{w:['l','s'],c:0.5},{w:['s','x'],c:0.5}]);
/* Words whose tashdīd is nearly always left unwritten (Handbook 1.2: the doubled letter counts). Without it the letters divide as
   mud-t / mu-dt; with it, mud-dat. The raw readings stay, at a cost. Not listed on purpose: ḥaqq, ḳhaṭṭ, rabb and the other
   word-final geminates (an extra overlong reading made scans slightly worse), and ḥasrat, qismat (no hidden doubling). */
lex('مدت لذت منت شدت عزت قوت نیت',[{w:['l','l'],c:0},{w:['l','s'],c:0.6},{w:['s','l'],c:0.6}]);
lex('محبت',[{w:['s','l','l'],c:0},{w:['l','l'],c:0.6},{w:['s','l','s'],c:0.6}]);
lex('تمنا',[{w:['s','l','x'],c:0},{w:['l','x'],c:0.6}]);
lex('مدعا',[{w:['l','s','x'],c:0},{w:['l','x'],c:0.6}]);
lex('ذرہ',[{w:['l','x'],c:0},{w:['l','s'],c:0.4}]);
/* More words with a hidden tashdīd, from scripts/find_tashdid_words.js: the Roman of the Rekhta ghazals doubles the consonant
   (jannat, muqaddar, patthar) in >=80% of >=3 aligned occurrences while the Urdu does not. Each has ONE reading at cost 0, the
   one the Roman pronounces (ta-ʿal-luq = - = =); the engine's other letter splits stay at +0.6 or more. Several cost-0 readings
   tie across meters and flip Ghalib/Mir results. On plain Urdu these fix ~337 of 554 Rekhta lines that contain such a word and
   break 3. Left out because they lower Ghalib/Mir meter scores or fix nothing: اچھا زنار توقع غصے واللہ دوپٹہ موذن. */
lex('اچھی',[{w:['l','x'],c:0},{w:['s','x'],c:1.2},{w:['s','s','x'],c:1.8},{w:['s','l','s'],c:4.6}]);   /* achchhī x85 */
lex('تصور',[{w:['s','l','l'],c:0},{w:['l','l','s'],c:0.6},{w:['l','l'],c:1.2},{w:['s','l','s'],c:1.2}]);   /* tasavvur x28 */
lex('پتھر',[{w:['l','l'],c:0},{w:['s','l','s'],c:0.6},{w:['s','s','l'],c:1.2},{w:['l','s'],c:1.2}]);   /* patthar x21 */
lex('مقدر',[{w:['s','l','l'],c:0},{w:['l','l','s'],c:0.6},{w:['l','s','l'],c:0.6},{w:['s','s','l','s'],c:1.2}]);   /* muqaddar x19 */
lex('جنت',[{w:['l','l'],c:0},{w:['s','l','s'],c:0.6},{w:['s','s','l'],c:1.2},{w:['l','s'],c:1.2}]);   /* jannat x17 */
lex('اول',[{w:['l','l'],c:0},{w:['l','s'],c:1.2},{w:['s','l','s'],c:1.6},{w:['s','l'],c:2.2}]);   /* avval x16 */
lex('تعلق',[{w:['s','l','l'],c:0},{w:['l','l','s'],c:0.6},{w:['l','s','l'],c:0.6},{w:['s','s','l','s'],c:1.2}]);   /* ta.alluq x16 */
lex('مدتوں',[{w:['l','s','x'],c:0},{w:['s','l','x'],c:0.6},{w:['l','x'],c:1.2},{w:['s','s','x'],c:1.8}]);   /* muddatoñ x15 */
lex('تبسم',[{w:['s','l','l'],c:0},{w:['l','l','s'],c:0.6},{w:['l','s','l'],c:0.6},{w:['s','s','l','s'],c:1.2}]);   /* tabassum x15 */
lex('اچھے',[{w:['l','x'],c:0},{w:['s','x'],c:1.2},{w:['s','s','x'],c:1.8}]);   /* achchhe x15 */
lex('مٹی',[{w:['l','x'],c:0},{w:['s','s','x'],c:1.2},{w:['s','x'],c:1.2},{w:['s','l','s'],c:4.6}]);   /* miTTī x13 */
lex('قصہ',[{w:['l','s'],c:0},{w:['l','x'],c:0},{w:['s','l','s'],c:0.6},{w:['s','s','x'],c:1.2}]);   /* qissa x12 */
lex('توجہ',[{w:['s','l','l'],c:0},{w:['s','l','x'],c:0},{w:['l','l','s'],c:0.6},{w:['l','s','x'],c:0.6}]);   /* tavajjoh x11 */
lex('غصہ',[{w:['l','s'],c:0},{w:['l','x'],c:0},{w:['s','l','s'],c:0.6},{w:['s','s','x'],c:1.2}]);   /* ġhussa x10 */
lex('مروت',[{w:['s','l','l'],c:0},{w:['l','l','s'],c:0.6},{w:['l','l'],c:1.2},{w:['s','l','s'],c:1.2}]);   /* muravvat x10 */
lex('ذرے',[{w:['l','x'],c:0},{w:['s','s','x'],c:1.2},{w:['s','x'],c:1.2}]);   /* zarre x10 */
lex('جلاد',[{w:['l','l'],c:0},{w:['l','l','s'],c:0.6},{w:['s','l','s'],c:0.6},{w:['s','s','l','s'],c:1.2}]);   /* jallād x8 */
lex('ہمت',[{w:['l','l'],c:0},{w:['s','l','s'],c:0.6},{w:['s','s','l'],c:1.2},{w:['l','s'],c:1.2}]);   /* himmat x8 */
lex('پٹی',[{w:['l','x'],c:0},{w:['s','s','x'],c:1.2},{w:['s','x'],c:1.2},{w:['s','l','s'],c:4.6}]);   /* paTTī x8 */
lex('جہنم',[{w:['s','l','l'],c:0},{w:['l','l','s'],c:0.6},{w:['l','s','l'],c:0.6},{w:['l','l'],c:1.2}]);   /* jahannum x7 */
lex('محبتوں',[{w:['l','l','s','x'],c:0},{w:['l','l','x'],c:0.6},{w:['s','l','s','x'],c:0.6},{w:['l','s','s','x'],c:1.2}]);   /* mohabbatoñ x7 */
lex('محلے',[{w:['l','l','x'],c:0},{w:['l','s','x'],c:0.6},{w:['s','l','x'],c:0.6},{w:['l','x'],c:1.2}]);   /* mohalle x7 */
lex('حجت',[{w:['l','l'],c:0},{w:['s','l','s'],c:0.6},{w:['s','s','l'],c:1.2},{w:['l','s'],c:1.2}]);   /* hujjat x6 */
lex('طرہ',[{w:['l','s'],c:0},{w:['l','x'],c:0},{w:['s','l','s'],c:0.6},{w:['s','s','x'],c:1.2}]);   /* turra x5 */
lex('ترقی',[{w:['s','l','x'],c:0},{w:['l','s','x'],c:0.6},{w:['l','x'],c:1.2},{w:['s','s','x'],c:1.8}]);   /* taraqqī x5 */
lex('مٹھی',[{w:['l','x'],c:0},{w:['s','s','x'],c:1.2},{w:['s','x'],c:1.2},{w:['s','l','s'],c:4.6}]);   /* muTThī x5 */
lex('قصے',[{w:['l','x'],c:0},{w:['s','s','x'],c:1.2},{w:['s','x'],c:1.2}]);   /* qisse x5 */
lex('تکلم',[{w:['s','l','l'],c:0},{w:['l','l','s'],c:0.6},{w:['l','s','l'],c:0.6},{w:['s','s','l','s'],c:1.2}]);   /* takallum x5 */
lex('الا',[{w:['l','x'],c:0},{w:['s','x'],c:1.2},{w:['s','s','x'],c:1.8},{w:['s','l','l'],c:3.6}]);   /* illā x5 */
lex('عیاری',[{w:['l','l','x'],c:0},{w:['s','s','l','x'],c:0.6},{w:['s','l','x'],c:1.2},{w:['s','l','l','x'],c:4.6}]);   /* ayyārī x5 */
lex('چکر',[{w:['l','l'],c:0},{w:['s','l','s'],c:0.6},{w:['s','s','l'],c:1.2},{w:['l','s'],c:1.2}]);   /* chakkar x5 */
lex('کچے',[{w:['l','x'],c:0},{w:['s','s','x'],c:1.2},{w:['s','x'],c:1.2}]);   /* kachche x5 */
lex('تلطف',[{w:['s','l','l'],c:0},{w:['l','l','s'],c:0.6},{w:['l','s','l'],c:0.6},{w:['s','s','l','s'],c:1.2}]);   /* talattuf x5 */
lex('البتہ',[{w:['l','l','s'],c:0},{w:['l','l','x'],c:0},{w:['l','s','l','s'],c:0.6},{w:['s','l','l','s'],c:0.6}]);   /* albatta x4 */
lex('منور',[{w:['s','l','l'],c:0},{w:['l','l','s'],c:0.6},{w:['l','l'],c:1.2},{w:['s','l','s'],c:1.2}]);   /* munavvar x4 */
lex('حصے',[{w:['l','x'],c:0},{w:['s','s','x'],c:1.2},{w:['s','x'],c:1.2}]);   /* hisse x4 */
lex('مصفا',[{w:['s','l','x'],c:0},{w:['l','s','x'],c:0.6},{w:['l','x'],c:1.2},{w:['s','s','x'],c:1.8}]);   /* musaffā x3 */
lex('بدھی',[{w:['l','x'],c:0},{w:['s','s','x'],c:1.2},{w:['s','x'],c:1.2},{w:['s','l','s'],c:4.6}]);   /* baddhī x3 */
lex('امارہ',[{w:['l','l','s'],c:0},{w:['l','l','x'],c:0},{w:['s','l','x'],c:1.2},{w:['s','s','l','x'],c:1.8}]);   /* ammāra x3 */
lex('مقرر',[{w:['s','l','l'],c:0},{w:['l','l','s'],c:0.6},{w:['l','s','l'],c:0.6},{w:['s','s','l','s'],c:1.2}]);   /* muqarrar x3 */
lex('حصہ',[{w:['l','s'],c:0},{w:['l','x'],c:0},{w:['s','l','s'],c:0.6},{w:['s','s','x'],c:1.2}]);   /* hissa x3 */
lex('سفاک',[{w:['l','l'],c:0},{w:['l','l','s'],c:0.6},{w:['s','s','l','s'],c:1.2},{w:['s','l','s'],c:1.2}]);   /* saffāk x3 */
lex('معطر',[{w:['l','l','l'],c:0},{w:['l','l','s'],c:0.6},{w:['l','s','l'],c:0.6},{w:['s','l','l'],c:0.6}]);   /* mo.attar x3 */
lex('محبتیں',[{w:['l','l','s','x'],c:0},{w:['l','l','x'],c:0.6},{w:['s','l','s','x'],c:0.6},{w:['l','s','s','x'],c:1.2}]);   /* mohabbateñ x3 */
lex('مدتیں',[{w:['l','s','x'],c:0},{w:['s','l','x'],c:0.6},{w:['l','x'],c:1.2},{w:['s','s','x'],c:1.8}]);   /* muddateñ x3 */
lex('محمد',[{w:['l','l','l'],c:0},{w:['l','l','s'],c:0.6},{w:['l','s','l'],c:0.6},{w:['s','l','l'],c:0.6}]);   /* mohammad x3 */
lex('بچہ',[{w:['l','s'],c:0},{w:['l','x'],c:0},{w:['s','l','s'],c:0.6},{w:['s','x'],c:0.6}]);   /* bachcha x3 */
lex('لذتیں',[{w:['l','s','x'],c:0},{w:['s','l','x'],c:0.6},{w:['l','x'],c:1.2},{w:['s','s','x'],c:1.8}]);   /* lazzateñ x3 */
lex('غماز',[{w:['l','l'],c:0},{w:['l','l','s'],c:0.6},{w:['s','s','l','s'],c:1.2},{w:['s','l','s'],c:1.2}]);   /* ġhammāz x3 */
lex('قتالہ',[{w:['l','l','s'],c:0},{w:['l','l','x'],c:0},{w:['s','s','l','x'],c:1.2},{w:['s','l','x'],c:1.2}]);   /* qattāla x3 */
lex('پتوں',[{w:['l','x'],c:0},{w:['s','s','x'],c:1.2},{w:['s','x'],c:1.2},{w:['s','l','s'],c:3.1}]);   /* pattoñ x3 */
lex('بلور',[{w:['l','l'],c:0},{w:['l','l','s'],c:0.6},{w:['s','l','l'],c:0.6},{w:['s','s','l','s'],c:1.2}]);   /* billor x3 */
lex('کچا',[{w:['l','x'],c:0},{w:['s','s','x'],c:1.2},{w:['s','x'],c:1.2},{w:['s','l','l'],c:3.6}]);   /* kachchā x3 */
lex('تھرا',[{w:['l','x'],c:0},{w:['s','s','x'],c:1.2},{w:['s','x'],c:1.2},{w:['s','l','l'],c:3.6}]);   /* tharrā x3 */
lex('سچا',[{w:['l','x'],c:0},{w:['s','s','x'],c:1.2},{w:['s','x'],c:1.2},{w:['s','l','l'],c:3.6}]);   /* sachchā x3 */
lex('جنتی',[{w:['l','s','x'],c:0},{w:['s','l','x'],c:0.6},{w:['l','x'],c:1.2},{w:['s','s','x'],c:1.8}]);   /* jannatī x3 */
lex('اللہ اللٰہ',[{w:['l','l','s'],c:0},{w:['l','l'],c:0.3,n:'allāh as (= =)'}]);
lex('گیان',[{w:['l','s'],c:0}]);
lex('بالکل',[{w:['l','l'],c:0}]);
lex('بالآخر',[{w:['l','l','l'],c:0}]);
lex('بالارادہ',[{w:['l','s','l','x'],c:0}]);
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

function partitionLexLetters(letters, ws){
  const n = letters.length, m = ws.length;
  if(m <= 1) return [letters];
  if(n === m) return letters.map(ch => [ch]);
  const g = letters.findIndex((ch, i) => i < n - 1 && ch === letters[i + 1] && typ(ch) === 'C');
  if(g >= 0){
    let bestJ = -1, bestScore = -Infinity;
    for(let j = 1; j < m; j++){
      const leftL = g + 1, rightL = n - (g + 1);
      const leftS = j, rightS = m - j;
      if(leftL >= leftS && rightL >= rightS){
        let score = 0, remL = leftL;
        for(let k = 0; k < leftS - 1; k++) remL -= (ws[k] === 's' ? 1 : 2);
        if(remL >= (ws[leftS - 1] === 's' ? 1 : 2)) score += 10;
        let remR = rightL;
        for(let k = leftS + 1; k < m; k++) remR -= (ws[k] === 's' ? 1 : 2);
        if(remR >= (ws[leftS] === 's' ? 1 : 2)) score += 10;
        if(score > bestScore){ bestScore = score; bestJ = j; }
      }
    }
    if(bestJ > 0){
      const leftParts = partitionLexLetters(letters.slice(0, g + 1), ws.slice(0, bestJ));
      const rightParts = partitionLexLetters(letters.slice(g + 1), ws.slice(bestJ));
      return leftParts.concat(rightParts);
    }
  }
  const want = ws.map(w => w === 's' ? 1 : 2);
  let totalWant = want.reduce((a, b) => a + b, 0);
  let counts = want.slice(), diff = n - totalWant;
  if(diff > 0){
    for(let i = m - 1; i >= 0 && diff > 0; i--){
      if(ws[i] !== 's'){ counts[i]++; diff--; }
    }
    while(diff > 0){ counts[m - 1]++; diff--; }
  } else if(diff < 0){
    for(let i = 0; i < m && diff < 0; i++){
      if(counts[i] > 1){ counts[i]--; diff++; }
    }
  }
  const res = [];
  let cur = 0;
  for(let i = 0; i < m; i++){
    res.push(letters.slice(cur, cur + counts[i]));
    cur += counts[i];
  }
  return res;
}

function scanWord(raw,forceSuffix){
  raw = (raw || '').normalize('NFC');
  const nw=normalize(raw);
  const suffix=forceSuffix||nw.suffix;
  let opts;
  const lx=LEX[nw.key];
  if(lx && !suffix){
    opts=lx.map(o=>({syl:[{k:'LEX',t:nw.letters.slice(),w:o.w.length===1?o.w[0]:null,lexw:o.w}],c:o.c,n:o.n||''}))
      .map(o=>{ if(o.syl[0].lexw.length>1){ /* split letters for display, splitting geminate consonants across syllables */
        const ws=o.syl[0].lexw, parts=partitionLexLetters(nw.letters, ws);
        o.syl=ws.map((w,j)=>({k:'LEX',t:parts[j]||[],w,xs:0}));
      } else { o.syl[0].w=o.syl[0].lexw[0]; o.syl[0].xs=0; }
      return o; });
  } else {
    opts=syllabifyNasal(nw.letters,nw.nasal);
    /* handbook 4.2: consonant + long vowel + s/sh + t at word end (dost, gosht, raast, bardaasht) —
       the final pair is one conjunct, so the last two syllables are (= -), never (= =) */
    { const L=nw.letters, n=L.length;
      if(!suffix && n>=4 && L[n-1]==='ت' && (L[n-2]==='س'||L[n-2]==='ش') && 'اوی'.includes(L[n-3]) && !(nw.nasal||[]).length){
        const cl=syllabify(L.slice(0,n-1)).map(o=>{ const syl=o.syl.map(s=>Object.assign({},s)), last=syl[syl.length-1];
          if(last.w!=='s' || last.t.length!==1) return null;
          last.t=[L[n-2],L[n-1]]; return {syl,c:o.c,n:'final s/sh+t cluster (4.2)'}; }).filter(Boolean);
        if(cl.length) opts=cl;
      } }
    /* handbook 4.4: a final hamza after alif (umarā', ʿulamā') is usually not scanned at all; if scanned it is a short */
    { const L=nw.letters, n=L.length;
      if(!suffix && n>=3 && L[n-1]==='ء' && L[n-2]==='ا'){
        const dropped=syllabify(L.slice(0,n-1)).map(o=>({syl:o.syl,c:o.c,n:'final hamza not scanned (4.4)'}));
        opts=dropped.concat(opts.map(o=>Object.assign({},o,{c:o.c+0.5})));
      } }
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
  return hypothesize(words.map(w=>scanWord(w.raw, w.pendingO?'o':null)));
}
/* ---------- learned hypotheses about what unvocalized spelling hides ----------
   scripts/learn_hypotheses.py fits P(hidden feature | cheap surface features) on Pritchett's aligned
   Urdu/ASCII pairs and generates HYP_COSTS (src/js/01b-hypothesis-costs.js). Two hypotheses:
     iz   a non-final word with no written zer is followed by an iẓāfat  (دل ناداں = dil-e nādāñ)
     vao  a medial و inside one written word is the short conjunctive o   (کاروبار = kār-o-bār)
   Each becomes an EXTRA reading appended to the word's options (existing indexes unchanged), costing
   clamp(scale*-logit p, floor, cap): it can only win when the meter needs it. Same scanWord path. */
const HYP_MARKS=/[\u064B-\u065F\u0670\u0640\u200C\u200D\u0651]/g;
function hypLetters(w){ return (w||'').normalize('NFC').replace(HYP_MARKS,'').replace(/[ۂۀ]/g,'ہ').replace(/ي|ى/g,'ی').replace(/ك/g,'ک').replace(/ه/g,'ہ'); }
function hypLen(w){ return [...w].filter(c=>c!=='ھ').length; }
function hypCls(c){ return 'اآ'.includes(c)?'A':c==='ی'?'I':c==='ے'?'E':c==='و'?'W':c==='ہ'?'H':c==='ں'?'N':'ءئ'.includes(c)?'Z':c==='ن'?'n':'C'; }
function hypLast(w,k){ const b=[...w].filter(c=>c!=='ھ'); return b.length>=k?hypCls(b[b.length-k]):'^'; }
function hypFirst(w){ const c=w[0]; return !c?'^':'اآ'.includes(c)?'A':'ویے'.includes(c)?'V':'C'; }
function hypIzFeats(w,nx,i,n,func){
  const l1=hypLast(w,1), fc=hypFirst(nx), nf=func.has(nx)?'1':'0';
  return ['b','fin:'+l1,'pen:'+hypLast(w,2),'len:'+Math.min(hypLen(w),6),'nxt:'+fc,'nfw:'+nf,'cfw:'+(func.has(w)?'1':'0'),
    'pos:'+(i===0?'0':i===n-2?'p':'m'),'finXnxt:'+l1+fc,'finXnfw:'+l1+nf];
}
function hypVaoFeats(w,j){
  const pre=w.slice(0,j), post=w.slice(j+1);
  return ['b','p:'+Math.min(hypLen(pre),5),'s:'+Math.min(hypLen(post),5),'pl:'+hypLast(pre,1),'sf:'+hypFirst(post),'sl:'+hypLast(post,1),
    'w:'+Math.min(hypLen(w),8),'plXsf:'+hypLast(pre,1)+hypFirst(post)];
}
function hypProb(m,feats){ let z=0; for(const f of feats) z+=m.w[f]||0; return 1/(1+Math.exp(-Math.max(-30,Math.min(30,z)))); }
function hypCost(m,p){ p=Math.min(Math.max(p,1e-4),1-1e-4); return Math.min(m.cap,Math.max(m.floor,m.scale*-Math.log(p/(1-p)))); }
let HYP_FUNC=null;
function hypothesize(words){
  const H=root.HYP_COSTS; if(!H||!words.length) return words;
  if(!HYP_FUNC) HYP_FUNC=new Set(H.func);
  const n=words.length, units=words.filter(w=>w.suffix!=='o').length;
  /* a line that already spells out an iẓāfat is vocalized: the words without one really have none */
  const izOK=!words.some(w=>w.suffix==='iz');
  let ui=0;
  words.forEach((w,i)=>{
    const wl=hypLetters(w.raw), ownI=ui; if(w.suffix!=='o') ui++;
    const extra=[];
    if(H.iz && izOK && !w.suffix && i<n-1 && wl){
      const p=hypProb(H.iz,hypIzFeats(wl,hypLetters(words[i+1].raw),ownI,units,HYP_FUNC)), c=hypCost(H.iz,p);
      scanWord(w.raw,'iz').opts.forEach(o=>extra.push({syl:o.syl,c:o.c+c,n:(o.n?o.n+'; ':'')+'unwritten iẓāfat assumed',hyp:'iz'}));
    }
    if(H.vao && !w.suffix){
      [...w.raw].forEach((ch,ci)=>{
        if(ch!=='و') return;
        const pre=w.raw.slice(0,ci), post=w.raw.slice(ci+1), lp=hypLetters(pre), ls=hypLetters(post);
        if(hypLen(lp)<2||hypLen(ls)<2) return;
        const c=hypCost(H.vao,hypProb(H.vao,hypVaoFeats(wl,lp.length)));
        const A=scanWord(pre,'o').opts.slice(0,3), B=scanWord(post).opts.slice(0,3);
        A.forEach(a=>B.forEach(b=>extra.push({syl:a.syl.concat(b.syl),c:a.c+b.c+c,n:'medial و read as short conjunctive o',hyp:'vao'})));
      });
    }
    if(extra.length) w.opts=w.opts.concat(extra);
  });
  return words;
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
/* add / remove a tashdīd. A doubled letter must sit inside the word (never first or
   last: a word-final geminate like ḥaqq only surfaces before an iẓāfat, which
   applySuffix already offers) and follow a short vowel, i.e. a consonant or a
   word-initial alif — never ā/ī/ū/e, ھ or ں (handbook 1.2, 3.2). Words whose
   doubling falls elsewhere than the guess are listed. Returns raw unchanged when
   no site exists, so callers can test for that. */
const TASHDID_KNOWN = {
  'مدت':'مدّت','شدت':'شدّت','عزت':'عزّت','محبت':'محبّت','مروت':'مروّت','ذلت':'ذلّت','قوت':'قوّت',
  'نیت':'نیّت','جنت':'جنّت','ملت':'ملّت','قصہ':'قصّہ','حصہ':'حصّہ','بچہ':'بچّہ','امید':'امّید',
  'توجہ':'توجّہ','تعلق':'تعلّق','تصور':'تصوّر','تبسم':'تبسّم','پکا':'پکّا','کتا':'کتّا'
};
function tashdidSite(chars){
  const base = chars.map((ch,i)=>({ch,i})).filter(o=>!/[\u064B-\u065F\u0670ھ]/.test(o.ch));
  let site=-1;
  for(let k=1;k<base.length-1;k++){
    const c=base[k].ch, prev=base[k-1].ch;
    if(/[اآءںےوی]/.test(c) || !/[\u0600-\u06FF]/.test(c)) continue;
    const prevShort = !/[آءںےوی]/.test(prev) && (prev!=='ا' || k===1);
    if(prevShort) site=base[k].i;
  }
  return site;
}
function applyTashdid(raw, add){
  raw = (raw || '').normalize('NFC');
  if(!add) return raw.replace(/[\u0651\uFE7C]/g, '');
  if(/[\u0651\uFE7C]/.test(raw)) return raw;
  const k = lexKey(raw);
  if(TASHDID_KNOWN[k]) return TASHDID_KNOWN[k];
  const chars=[...raw], at=tashdidSite(chars);
  if(at<0) return raw;
  chars.splice(at+1, 0, '\u0651');
  return chars.join('');
}
function buildUnits(words, overrides){
  const units=[];
  for(let i=0;i<words.length;i++){
    const u=[];
    const ov=overrides&&overrides[i];
    const isTash = (ov && ov.tashdid !== undefined) ? !!ov.tashdid : /[\u0651\uFE7C]/.test(words[i].raw);
    const rawWord = (ov && ov.tashdid !== undefined) ? applyTashdid(words[i].raw, isTash) : words[i].raw;
    const suf = (ov && ov.suffix!==undefined) ? ov.suffix : words[i].suffix;
    const own = ((ov && (ov.suffix!==undefined || ov.tashdid!==undefined)) ? scanWord(rawWord, suf||null).opts : words[i].opts)
      .map((o,k)=>Object.assign({},o,{_oi:k}));
    let pinned = ov && ov.opt!=null ? [own[ov.opt]].filter(Boolean) : own;
    /* learner-forced weights on the pinned reading's syllables (validated by sylRule before they get here) */
    if(ov && ov.force && ov.opt!=null) pinned = pinned.map(o=>Object.assign({},o,{syl:o.syl.map((sy,k)=>ov.force[k]?Object.assign({},sy,{w:ov.force[k],xs:0,forced:true}):sy)}));
    u.push({from:i,to:i,opts:pinned,graft:false});
    /* a word with learner-forced weights can't be grafted: the graft would re-read its letters */
    const forced = o=>o&&o.force&&Object.keys(o.force).length>0;
    if(!(ov&&ov.noGraft) && !forced(ov) && !forced(overrides&&overrides[i+1])){
      const wordObj = (rawWord !== words[i].raw) ? scanWord(rawWord, suf||null) : words[i];
      if(graftable(wordObj,words[i+1])){ u.push({from:i,to:i+1,opts:graftedOpts([wordObj,words[i+1]]),graft:true});
        if(graftable(words[i+1],words[i+2])) u.push({from:i,to:i+2,opts:graftedOpts([wordObj,words[i+1],words[i+2]]),graft:true}); }
    }
    if(!(ov&&ov.noGraft)){ const au=alUnit(words,i); if(au) u.push(au); }
    units.push(u);
  }
  return units;
}
/* handbook 3.4: word + ال + word. The word before al is read as if it ended in an extra ل (a two-consonant
   word doubles its last letter first); al itself and the next word then scan separately. Offered as an
   extra reading over the whole span, so it only wins when the meter needs it. */
function alUnit(words,i){
  const a=words[i]; if(!a || a.suffix) return null;
  const b=words[i+1]; if(!b) return null;
  const raw=(b.raw||'').normalize('NFC').replace(/[ً-ٰٟـ‌‍]/g,'');
  let restRaw=null, to=i+1;
  if(raw==='ال'||raw==='الـ'){ const c=words[i+2]; if(!c) return null; restRaw=c.raw; to=i+2; }
  else if(/^ال.{2,}$/.test(raw) && !/^ال(ل|ٰ)/.test(raw)) restRaw=raw.slice(2);
  else return null;
  const la=a.letters[a.letters.length-1]; if(!la) return null;
  let L=a.letters.slice();
  const key=lexKey(a.raw||''), AL_VOWEL={'فی':'ف','ذو':'ذ','بو':'ب','بی':'ب'};   /* fii/zuu/buu/bi + al → fil-, zul-, bul-, bil- (3.4) */
  if(typ(la)!=='C'){ if(!AL_VOWEL[key]) return null; L=[AL_VOWEL[key]]; }
  if(L.length===2 && typ(L[0])==='C') L.push(L[1]);           /* rabb ul-: tashdīd on the final consonant */
  L.push('ل');
  const first=syllabify(L), rest=scanWord(restRaw).opts;
  const opts=[];
  first.forEach(f=>rest.forEach(r=>opts.push({syl:f.syl.concat(r.syl),c:f.c+r.c+1.0,n:'al-construction (3.4)'})));
  if(!opts.length) return null;
  opts.sort((x,y)=>x.c-y.c);
  return {from:i,to,opts:opts.slice(0,8),graft:true};
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
  if(best){ best.prior = m.kind==='rubai'?0.6:(GHALIB_USED.has(m.id)?0:(m.id>37?2.0:0.4)); best.c+=best.prior; }
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
  if(!n) return {words,fits:[],status:'none',near:[]};
  const units=buildUnits(words,overrides);
  const fits=[];
  METERS.forEach(m=>{ const r=matchMeter(units,n,m); if(r) fits.push({meter:m,c:r.c,path:r.path,seq:r.seq}); });
  const h=matchHindi(units,n); if(h) fits.push({meter:{id:'H',kind:'hindi',raw:'Hindi'},c:h.c,path:h.path,M:h.M});
  fits.sort((a,b)=>a.c-b.c);
  const res={words,fits,units};
  Object.assign(res,fitStatus(res));
  return res;
}
/* 'never silently no fit': status + nearest meters. Runs the (costly) near search only when
   nothing fits, so fits and every benchmark score are untouched. */
function fitStatus(res){
  try{
    const fits=res.fits;
    if(fits.length){
      const b=fits[0], licences=[];
      if(b.path){ try{ explain(res,b).notes.forEach(x=>licences.push(x)); }catch(e){} }
      return {status:(b.c===0&&!licences.length)?'exact':'licensed',licences,near:[]};
    }
    const near=[];
    METERS.forEach(m=>{ const d=diagnose(res,m); if(!d) return;
      const clashes=[]; d.syl.forEach((e,i)=>{ if(e.clash) clashes.push(i); });
      const real=d.syl.filter(e=>!e.missing).length, tot=Math.max(real+d.missingCount,1);
      near.push({meter:m,clashes,extra:d.extraCount,missing:d.missingCount,cost:d.c,
        confidence:Math.max(0,Math.min(1,+(1-(d.clashCount+d.extraCount+d.missingCount)/tot).toFixed(3)))}); });
    near.sort((a,b)=>a.cost-b.cost||(+a.meter.id-+b.meter.id)||(String(a.meter.id)<String(b.meter.id)?-1:1));
    const top=near.slice(0,3);
    return {status:top.length?'near':'none',near:top};
  }catch(e){ return {status:'none',near:[]}; }
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
  syl.forEach((sy,si)=>{ if(sy.k==='SUF') texts[si]= sy.suf==='o'?'و':'ـِ'; else if(sy.suf==='o') texts[si]+=' و'; });
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
      out.push({text:texts[k]||'·',native:s.w,resolved:rw,word:step.u.from,wordTo:step.u.to,graft:step.u.graft,suf:s.suf,last:k===o.syl.length-1,oi:o._oi,k,forced:!!s.forced});
    });
  });
  const feet=attachFeet(out,fit);
  return {syl:out,notes,feet};
}

/* ---------- learner validator: may syllable k of this reading be long / short? ----------
   Each verdict is 'ok' (a rule allows it), 'rare' (attested but marked) or 'no' (no rule
   allows it), with the handbook section. Only flexibility is judged here; a different
   syllable division is a different reading (see the reading list), not a weight change. */
const ALWAYS_LONG=new Set(['تا','گو','یا','جیوں','جوں','کیا','کیوں']);
const ALWAYS_SHORT=new Set(['نہ','کہ','بہ']);
function sylRule(opt,k,key){
  const s=opt.syl[k], n=opt.syl.length, fin=k===n-1, next=opt.syl[k+1];
  const V=(v,rule,why)=>({v,rule,why});
  const flexLex = LEX[key] && LEX[key].some(o=>o.w.length===n && o.w[k]==='x');
  if(s.w==='x' || (s.forced && opt._native && opt._native[k]==='x')){
    if(s.k==='SUF' || s.suf) return {l:V('ok','3.2','An iẓāfat or o joined to the word makes a flexible syllable.'), s:V('ok','3.2','An iẓāfat or o joined to the word makes a flexible syllable.')};
    if(n===1 && LEX[key]) return {l:V('ok','2.1','One of the common flexible monosyllables.'), s:V('ok','2.1','One of the common flexible monosyllables.')};
    if(n===1) return {l:V('ok','2.1','One-syllable words are normally long.'), s:V('rare','2.1','One-syllable words not on the flexible list are normally long; Arabic and Persian nouns never shorten.')};
    if(!fin && flexLex) return {l:V('ok','2.2','One of the very few words flexible inside the word (koʾī, āʾīnah).'), s:V('ok','2.2','One of the very few words flexible inside the word (koʾī, āʾīnah).')};
    const v=s.t[s.t.length-1];
    return {l:V('ok','2.2','Word-final vowels are flexible.'),
      s: v==='ا' ? V('ok','2.2','Word-final ā may shorten, though less often than ī, e, h; Persian and Arabic words usually keep it long.')
                 : V('ok','2.2','Word-final ī, e, o and h are flexible.')};
  }
  if(s.w==='s'){
    const keep=V('ok','1.5','A one-letter syllable is short.');
    if(ALWAYS_SHORT.has(key)) return {s:keep, l:V('rare','2.1','Always short in modern usage; Mir sometimes scans kih and nah long, almost no one after him.')};
    if(s.k==='LEX') return {s:keep, l:V('no','4.3','This word is scanned as it is pronounced, not as spelled; its short syllable is fixed.')};
    return {s:keep, l:V('no','1.5','A one-letter syllable is always short. Only a tashdīd (doubling the next letter) or grafting changes how the letters divide.')};
  }
  const keep=V('ok','1.5','A two-letter syllable is long.');
  if(ALWAYS_LONG.has(key)) return {l:keep, s:V('no','2.1','Always scanned long (tā, go, yā, kyā, kyūñ, jyūñ).')};
  if(next && next.k==='SUF') return {l:keep, s:V('no','3.2','Before an iẓāfat the word-final vowel is always long.')};
  if(s.k==='CC'||s.k==='AC') return {l:keep, s:V('no','1.5','A closed syllable (two letters, no vowel letter) is long. Grafting can re-split it only if the next word starts with alif (3.1).')};
  if(s.k==='LEX') return {l:keep, s:V('no','2.1','This word’s long syllable is fixed.')};
  return {l:keep, s:V('no','2.2','Only word-final vowels are flexible; a long vowel inside a word stays long.')};
}
/* ---------- diagnose a line against ONE meter, allowing edits ----------
   Needleman–Wunsch style: each reading's syllables are aligned to the meter's slots with
   match (weight fits), clash (wrong weight), extra (syllable with no slot) and missing
   (slot with no syllable), each costing 1; the optional cheat slot is free to skip.
   Picks the readings that make the line limp least, so the blame lands where it belongs. */
function diagnose(res,m){
  if(!res||!res.units||!m||!m.vars) return null;
  const units=res.units, n=res.words.length;
  let best=null;
  m.vars.forEach(v=>{
    const seq=v.seq, S=seq.length, memo=new Map();
    const fits=(sy,t)=> t==='c' ? cheatOK(sy) : (t==='x'||sy.w==='x'||sy.w===t);
    function word(sy,j){ /* align syllables sy from slot j: returns [{b,c,ops}] for each end slot j+b */
      const L=sy.length, g=[];
      for(let a=0;a<=L;a++){ g.push([]); for(let b=0;j+b<=S;b++){
        if(a===0&&b===0){ g[a][b]={c:0,op:null}; continue; }
        let c=Infinity, op=null;
        if(a>0&&b>0){ const t=seq[j+b-1], ok=fits(sy[a-1],t);
          if(ok || t!=='c'){ const cc=g[a-1][b-1].c+(ok?(sy[a-1].w==='x'&&t==='s'?(sy[a-1].xs||0)*0.3:0):1); if(cc<c){c=cc;op='m';} } }
        if(a>0){ const cc=g[a-1][b].c+1; if(cc<c){c=cc;op='i';} }
        if(b>0){ const cc=g[a][b-1].c+(seq[j+b-1]==='c'?0:1); if(cc<c){c=cc;op='d';} }
        g[a][b]={c,op}; } }
      return g;
    }
    function f(i,j){
      if(i===n){ let c=0; for(let q=j;q<S;q++) if(seq[q]!=='c') c++; return {c,path:c?[{trail:j}]:[]}; }
      const key=i+'|'+j; if(memo.has(key)) return memo.get(key);
      let b=null;
      for(const u of units[i]) for(let oi=0;oi<u.opts.length;oi++){
        const o=u.opts[oi], g=word(o.syl,j), L=o.syl.length;
        for(let bb=0;j+bb<=S;bb++){ const cell=g[L][bb]; if(!cell||cell.c===Infinity) continue;
          /* a wholly extra word (the usual learner insertion) is blamed as one unit, not split up */
          const rest=f(u.to+1,j+bb); const c=cell.c-(bb===0&&L>1?0.5:0)+o.c*0.05+rest.c;
          if(!b||c<b.c) b={c,path:[{u,oi,j,bb,g}].concat(rest.path)}; }
      }
      memo.set(key,b); return b;
    }
    const r=f(0,0);
    if(r && (!best||r.c<best.c)) best={c:r.c,path:r.path,seq};
  });
  if(!best) return null;
  /* unwind into display syllables; missing slots become ghost syllables */
  const seq=best.seq, fm=footMap(m,seq), out=[];
  best.path.forEach(st=>{
    if(st.trail!=null){ for(let q=st.trail;q<seq.length;q++) if(seq[q]!=='c')
      out.push({text:'·',native:seq[q],resolved:seq[q]==='s'?'rs':'rl',missing:true,expected:seq[q],slot:q,k:-1,word:n-1,wordTo:n-1}); return; }
    const o=st.u.opts[st.oi], sy=o.syl, texts=alignTexts(res.words.slice(st.u.from,st.u.to+1).map(w=>w.raw),sy);
    const ops=[]; let a=sy.length, b=st.bb;
    while(a>0||b>0){ const op=st.g[a][b].op; ops.push({op,a,b}); if(op==='m'){a--;b--;} else if(op==='i') a--; else b--; }
    ops.reverse().forEach(({op,a,b})=>{
      const base={word:st.u.from,wordTo:st.u.to,graft:st.u.graft,oi:o._oi};
      if(op==='d'){ const t=seq[st.j+b-1]; if(t==='c') return;
        out.push(Object.assign(base,{text:'·',native:t,resolved:t==='s'?'rs':'rl',missing:true,expected:t,slot:st.j+b-1,k:-1})); return; }
      const s=sy[a-1], k=a-1;
      const e=Object.assign(base,{text:texts[k]||'·',native:s.w,suf:s.suf,last:k===sy.length-1,k,forced:!!s.forced});
      if(op==='m'){ const t=seq[st.j+b-1]; e.slot=st.j+b-1; e.resolved = t==='c'?'c':t==='x'?(s.w==='x'?'l':s.w):t; }
      else { e.resolved = s.w==='x'?'s':s.w; e.extra=true; }
      out.push(e);
    });
  });
  /* clashes: a matched-by-position syllable whose weight the slot can't take */
  out.forEach(e=>{ if(e.slot==null||e.missing) return; const t=seq[e.slot];
    if(t!=='c' && t!=='x' && e.native!=='x' && e.native!==t){ e.clash=true; e.expected=t; e.resolved=e.native; } });
  /* feet from the meter's slots; an extra syllable sits in the foot before it */
  let lastF=0; out.forEach(e=>{ if(e.slot!=null){ const mm=fm.map[e.slot]; e.foot=mm.f; e.cheat=mm.cheat; lastF=mm.f; } else e.foot=lastF; });
  const pf=patternFeet(m.raw), feet=[];
  out.forEach((e,i)=>{ if(!feet[e.foot]) feet[e.foot]=Object.assign({},pf[e.foot]||{},{idx:[],cae:e.foot===fm.caeFoot}); feet[e.foot].idx.push(i); });
  const slotK={}; { const cnt={}; seq.forEach((t,q)=>{ if(t==='c') return; const F=fm.map[q].f; slotK[q]=cnt[F]=(cnt[F]||0); cnt[F]++; }); }
  out.forEach(e=>{ if(e.extra||e.cheat) e.fsyl='+'; else { const F=feet[e.foot]; e.fsyl=(F&&F.ro&&F.ro[slotK[e.slot]])||''; } });
  const count=k=>out.filter(e=>e[k]).length;
  return {syl:out,feet,notes:[],seq,c:best.c,clashCount:count('clash'),extraCount:count('extra'),missingCount:count('missing')};
}

const API={hypProb,hypIzFeats,hypVaoFeats,hypLetters,hypFunc:()=>new Set((root.HYP_COSTS||{func:[]}).func),METERS,FEET,footInfo,patternFeet,attachFeet,parseRaw,scanLine,explain,normalize,syllabify,scanWord,tokenize,buildUnits,matchMeter,matchHindi,alignTexts,footMap,applyTashdid,sylRule,diagnose,
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
function lexKey(w){ return w.normalize('NFC').replace(/[\u064B-\u065F\u0670\u0640\u200C\u200D]/g,'').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/ه/g,'ہ'); }
let _wordAsciiNorm = null;
/* lexKey drops the iẓāfat zer (and the hamza on ہ), so حسرتِ and حسرت share a key.
   Keep their spellings apart: {plain, iz, first}. A line typed WITH diacritics is taken
   literally (a word gets the iẓāfat spelling only if it carries the mark); a line with
   none can't show iẓāfat at all, so it keeps the first spelling the corpus gave. */
const IZ_MARK = /[ِٔ]$/;
function wordAsciiNormMap(){
  if(_wordAsciiNorm) return _wordAsciiNorm;
  _wordAsciiNorm = {};
  if(typeof WORD_ASCII_MAP !== 'undefined'){
    Object.keys(WORD_ASCII_MAP).forEach(w => {
      const k = lexKey(w), e = _wordAsciiNorm[k] || (_wordAsciiNorm[k] = {});
      const slot = IZ_MARK.test(w.normalize('NFC')) ? 'iz' : 'plain';
      if(!(slot in e)) e[slot] = WORD_ASCII_MAP[w];
      if(!('first' in e)) e.first = WORD_ASCII_MAP[w];
    });
  }
  return _wordAsciiNorm;
}
const HAS_MARKS = /[\u064B-\u065F\u0670]/;
function wordAscii(w, literal){
  const e = wordAsciiNormMap()[lexKey(w)]; if(!e) return null;
  if(!literal) return e.first;
  if(IZ_MARK.test(w.normalize('NFC'))) return e.iz || (e.plain && !/-e$/.test(e.plain) ? e.plain + '-e' : e.plain) || null;
  return e.plain || (e.iz ? e.iz.replace(/-e$/, '') : null);
}
/* Typed text carries no zer, so whether a word takes -e is a guess. With HYP_TAU set, use the learned scan model
   (HYP_COSTS.iz): iẓāfat if P(iz) > HYP_TAU. null = the old rule (the first spelling the corpus showed). */
let HYP_TAU = null, _hypFunc = null;
function izWanted(words, k){
  if(HYP_TAU == null || typeof HYP_COSTS === 'undefined' || !HYP_COSTS.iz || typeof Scan === 'undefined') return null;
  if(!_hypFunc) _hypFunc = Scan.hypFunc();
  const n = words.length; if(k >= n - 1) return false;
  const wl = Scan.hypLetters(words[k]), nl = Scan.hypLetters(words[k+1]); if(!wl) return null;
  return Scan.hypProb(HYP_COSTS.iz, Scan.hypIzFeats(wl, nl, k, n, _hypFunc)) > HYP_TAU;
}
function urduLineToAscii(urLine){
  const parts = urLine.split(/(\s+)/);
  const wi = []; parts.forEach((w, i) => { if(!/^\s*$/.test(w)) wi.push(i); });
  const words = wi.map(i => parts[i]);
  let allKnown = wi.length > 0;
  const literal = HAS_MARKS.test(urLine);
  const out = parts.map((w, i) => {
    if(/^\s*$/.test(w)) return w;
    let a = wordAscii(w, literal);
    if(a){
      if(!literal){
        const e = wordAsciiNormMap()[lexKey(w)], want = izWanted(words, wi.indexOf(i));
        if(e && want != null){
          const plain = e.plain || (e.iz ? e.iz.replace(/-e$/, '') : null);
          if(want) a = e.iz || (plain && !/[aeiou]$/.test(plain) ? plain + '-e' : plain) || a;
          else a = plain || a;
        }
      }
      return a;
    }
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
/* a written letter is its base character plus any combining marks (t + U+0324 = ṭ-with-ring for ط): never cut between them */
const ROMAN_MARK=/[\u0300-\u036f]/;
/* consonant + h reads as one aspirated / digraph unit (sh, ch, zh, ṭh ...): never split apart either */
const ROMAN_ASPIRABLE='bcdgjkpqstzṭḍṛḳġ';
function romanConsonantUnits(span){
  // Fix C: skip hyphens so they don't count as consonant units (izafat splits land correctly)
  const units=[]; let i=0;
  while(i<span.length){
    if(span[i]==='-'){ i+=1; continue; } // Fix C: hyphens are not consonant units
    let m=null;
    for(const dg of ROMAN_DIGRAPHS){ if(span.startsWith(dg,i)){ m=dg; break; } }
    if(!m){
      let j=i+1; while(j<span.length && ROMAN_MARK.test(span[j])) j++;      /* base + its marks */
      const base=span[i].normalize('NFD')[0];
      if(span[j]==='h' && ROMAN_ASPIRABLE.includes(base)) j++;              /* ... + aspiration */
      m=span.slice(i,j);
    }
    units.push(m); i+=m.length;
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
/* Shape-aware split: shapes[k] is true when the scanner's syllable k is a lone
   consonant (one letter, e.g. the q of ʿish-q, the r of au-r, the s of s-tā-roñ in
   an unvowelled spelling). Such a syllable may or may not carry a written short vowel
   in the Roman; when the Roman has fewer vowel nuclei than syllables, the missing
   ones are lone consonants — the word-final one first (ʿish-q), then from the left.
   Each vowelless syllable takes one consonant unit from where it sits; the next
   syllable keeps one onset consonant; the rest closes the syllable before. */
function syllabifyRomanShaped(word,shapes){
  const n=shapes.length, nuc=romanNuclei(word), d=n-nuc.length;
  if(d<0) return null;
  const cand=shapes.map((c,k)=>c?k:-1).filter(k=>k>=0);
  const order=cand.includes(n-1)?[n-1].concat(cand.filter(k=>k!==n-1)):cand;
  if(order.length<d) return null;
  const bare=new Set(order.slice(0,d));
  const out=new Array(n).fill(''); let ni=0, cursor=0, tailDone=false;
  const unitsOf=(span,split)=>{ const u=romanConsonantUnits(span); return split?[].concat(...u.map(x=>x.length>1&&!/^[ḳġ]h$/.test(x)?[...x]:[x])):u; };
  const cut=(span,split)=>unitsOf(span,split).map(u=>u);
  /* walk syllables; vowel-bearing ones are anchored on nuclei */
  let k=0;
  while(k<n){
    /* collect the run of bare syllables before the next vowel-bearing one */
    const run=[]; while(k<n && bare.has(k)){ run.push(k); k++; }
    const spanStart=cursor, spanEnd=ni<nuc.length?nuc[ni][0]:word.length;
    const span=word.slice(spanStart,spanEnd).replace(/-/g,'');
    let units=cut(span,false); const needOnset=k<n?1:0;
    if(units.length<run.length+needOnset) units=cut(span,true);
    if(units.length<run.length) return null;
    const onset=needOnset&&units.length>run.length?units.slice(units.length-1):[];
    const mid=units.slice(units.length-onset.length-run.length, units.length-onset.length);
    const coda=units.slice(0, units.length-onset.length-run.length).join('');
    /* coda closes the previous vowel-bearing syllable (or, at the start, joins the first piece) */
    let prev=-1; for(let q=(run.length?run[0]:k)-1;q>=0;q--){ if(!bare.has(q)){ prev=q; break; } }
    if(prev>=0) out[prev]+=coda; else if(run.length) mid[0]=coda+mid[0]; else onset.unshift(coda);
    run.forEach((q,j)=>{ out[q]=mid[j]; });
    if(k<n){ out[k]=onset.join('')+word.slice(nuc[ni][0],nuc[ni][1]); cursor=nuc[ni][1]; ni++; k++; }
    else tailDone=true;
  }
  /* a word that ends in consonants after its last vowel (kis, qismat, bosah): they close the last syllable */
  if(!tailDone && cursor<word.length) out[n-1]+=word.slice(cursor);
  /* a hyphen-joined iẓāfat / o stays with its syllable */
  if(out.some(x=>!x)) return null;
  return out;
}
function sylShapes(syl){ return syl.map(s=>{ const b=(s.text||'').replace(/[ً-ٰٟـھں]/g,''); return [...b].length===1 && !/[اآوییےۓ]/.test(b); }); }
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
    if (/^(al|ul|il)-/i.test(tok)) {
      const rest = tok.slice(3).split(/-/);
      let cur = tok.slice(0, 3) + rest[0];
      for(let pi=1; pi<rest.length; pi++){
        const piece = rest[pi];
        const isIzafat = /^[aeiouāīūēōâîûêô]{1,2}$/.test(piece);
        if(isIzafat){ cur += '-' + piece; }
        else { romanTokens.push(cur); cur = piece; }
      }
      romanTokens.push(cur);
      continue;
    }
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
/* per-syllable Roman labels (parallel to e.syl): each word — or grafted run of words —
   gets its correct Roman spelling split at the scanner's own syllables */
function romanPiecesFor(syl,wmap){
  const key=s=>s.word+'-'+(s.wordTo!=null?s.wordTo:s.word);
  const groups={}; syl.forEach((s,i)=>{ if(s.missing) return; (groups[key(s)]=groups[key(s)]||[]).push(i); });
  const out=syl.map(()=>null);
  Object.values(groups).forEach(idx=>{
    const s0=syl[idx[0]], to=s0.wordTo!=null?s0.wordTo:s0.word;
    const parts=[]; for(let w=s0.word;w<=to;w++){ if(!wmap[w]) return; parts.push(wmap[w]); }
    /* grafting drops the second word's alif: its Roman vowel simply follows the consonant */
    const word=parts.join('');
    let pieces=syllabifyRomanShaped(word,sylShapes(idx.map(i=>syl[i]))) || (parts.length===1?syllabifyRoman(word,idx.length):null);
    /* safety net: a piece must never start with a combining mark (hand it back to the piece before it), and the pieces
       must spell exactly the word; otherwise drop them and let the caller fall back rather than show a garbled split */
    if(pieces){
      pieces=pieces.slice();
      for(let q=1;q<pieces.length;q++){ const m=/^[\u0300-\u036f]+/.exec(pieces[q]); if(m){ pieces[q-1]+=m[0]; pieces[q]=pieces[q].slice(m[0].length); } }
      const strip=x=>x.normalize('NFC').replace(/-/g,'');
      if(pieces.some(x=>!x) || strip(pieces.join(''))!==strip(word)) pieces=null;
    }
    if(pieces) idx.forEach((i,j)=>{ out[i]=pieces[j]; });
  });
  return out;
}
function chipRomanOverrides(syl,li){
  if(!lastScan || !lastScan.results || !lastScan.results[li] || !lastScan.lineObjs) return [];
  const wmap=wordRomanMap(lastScan.lineObjs[li],lastScan.results[li]);
  return wmap ? romanPiecesFor(syl,wmap) : [];
}


