/* Pritchett-ASCII front end.
   Turns a line in the transliteration used on franpritchett.com (and by Sean Pue's
   ghalib.js) into prosodic words, and each word into an ITEM string: the metrical
   letters of handbook 1.2 plus the non-letters that matter for scansion.

   Item kinds
     C   consonant letter (includes (( ain, )) hamza, gol he h, consonantal v / y)
     V   vowel letter: aa ii uu e o ai au (alif / ye / vao as the 2nd letter, 1.3)
     A   word-initial alif carrying a short vowel (a, i, u)            1.3
     AA  alif madd, always a syllable by itself                          1.3
     v   short vowel zabar/zer/pesh -- NOT a letter                      1.2
     N   nuun-e ghunnah -- NOT a letter                                  1.2
     H   do-chashmii he of aspiration -- NOT a letter                    1.2
   Everything the ASCII writes explicitly (short vowels, ;N, iẓāfat -e, -o-, tashdīd
   as a doubled consonant) is taken as given: the ASCII is the definitive transcription. */
'use strict';

/* consonant symbols, longest first. ;n and :n are nuun variants (:n = tanvīn, 4.4) */
const CONS = [';T',';D',';R',';s',';h',';x',';z',';G','.s','.z',':t',':z',':n','((','))',
  'sh','zh','ch','b','p','t','j','d','r','z','s','f','q','k','g','l','m','n','v','h','y','x'];
/* consonants that the aspiration h may follow (1.2); ch covers chh */
const ASPIRABLE = new Set(['b','p','t',';T','j','ch','d',';D',';R','k','g']);
const VOWELS = [';aa','aa','ai','au','ii','uu','a','i','u','e','o'];
const LONGV = new Set(['aa','ii','uu','e','o','ai','au']);
const ARABIC_LETTERS = new Set([';s',';h',';z','.s','.z',':t',':z','((',';G','q']);   /* 1.4, 4.4 */
const INDIC_LETTERS = new Set(['p','ch','zh','g',';T',';D',';R']);                      /* 1.4, 4.4 (+ aspirates) */

/* strip scrape artifacts: "=== {6,2} " refs, English glosses after "1)", brackets, stray punctuation */
function cleanLine(s){
  const notes = [];
  let t = s;
  if(/^===\s*\{[^}]*\}\s*/.test(t)){ t = t.replace(/^===\s*\{[^}]*\}\s*/, ''); notes.push('ref-prefix'); }
  const gl = t.match(/\s\d+[a-z]?\)\s.*$/); if(gl){ t = t.slice(0, gl.index); notes.push('english-gloss'); }
  if(/[\[\]{}]/.test(t)){ t = t.replace(/[\[\]{}]/g, ''); notes.push('brackets'); }
  t = t.replace(/(^|[\s-])x(?=[aeiou])/g, '$1;x');             /* bare x for ;x (a few Mir pages) */
  t = t.replace(/[,!?"]|--+|\//g, ' ').replace(/\s+/g, ' ').trim();
  return { text:t, notes };
}

/* split a line into prosodic words with their suffixes: iẓāfat (-e), conjunction o (-o-),
   Arabic article (ul-/al-, 3.4). Hyphenated compounds become separate words (they are
   written as separate words in Urdu script and can graft, 3.1). */
function splitLine(text){
  const words = [];
  const toks = text.split(/\s+/).filter(Boolean);
  for(const tok of toks){
    const parts = tok.split('-').filter(p => p !== '');
    for(let k = 0; k < parts.length; k++){
      const p = parts[k];
      const prev = words[words.length-1];
      if(p === 'e' && k > 0 && prev){ prev.iz = true; continue; }
      if(p === 'o' && k > 0 && prev && k < parts.length-1){ prev.conjO = true; continue; }
      if((p === 'ul' || p === 'al') && k === 0 && parts.length > 1 && prev){ prev.article = p; continue; }
      if(p === 'al' && k === 0 && parts.length > 1 && !prev && parts[1][0] === 'l'){ parts[1] = 'al' + parts[1]; continue; }   /* al-l;aah at line start = all;aah */
      words.push({ ascii:p, iz:false, conjO:false, article:null, hyphenBefore: k > 0 });
    }
  }
  return words;
}

function tokenizeSymbols(w){
  /* a few pages drop the ';' of ;T ;D ;R ;N (miT, ;Dhuun;Dhaa): upper-case is unambiguous */
  w = w.replace(/(^|[^;])([TDRN])/g, '$1;$2');
  const out = []; let i = 0;
  while(i < w.length){
    if(w[i] === "'"){ out.push({sym:"'", t:'sep'}); i++; continue; }
    if(w.startsWith(';N', i)){ out.push({sym:';N', t:'N'}); i += 2; continue; }
    let m = null;
    for(const v of VOWELS) if(w.startsWith(v, i)){ m = {sym: v === ';aa' ? 'aa' : v, t:'vow', dagger: v === ';aa'}; i += v.length; break; }
    if(!m) for(const c of CONS) if(w.startsWith(c, i)){ m = {sym: c === 'x' ? ';x' : (c === ':n' ? 'n' : c), t:'con', tanvin: c === ':n'}; i += c.length; break; }
    if(!m){ out.push({sym:w[i], t:'junk'}); i++; continue; }
    out.push(m);
  }
  return out;
}

/* ASCII word -> items. Records which ASCII-level rules fired (aspiration, ;xv) */
function parseWord(w){
  const sy = tokenizeSymbols(w);
  const items = [], fired = [];
  let prevCons = null;
  for(let j = 0; j < sy.length; j++){
    const s = sy[j];
    if(s.t === 'junk'){ fired.push({id:'X-junk', sym:s.sym}); continue; }
    if(s.t === 'sep'){
      /* h'h (kah'h, naalah'haa): Pritchett writes the apostrophe between a word-final h and a
         following h; only one h is scanned (glossary: kah'h (=)) */
      const nx = sy[j+1];
      if(nx && nx.t === 'con' && nx.sym === 'h' && items.length && items[items.length-1].k === 'C' && items[items.length-1].s === 'h'){ j++; fired.push({id:'R1.2-h-apostrophe-h'}); }
      prevCons = null; continue;
    }
    if(s.t === 'N'){ items.push({k:'N'}); continue; }
    if(s.t === 'con'){
      if(s.sym === 'h' && prevCons && ASPIRABLE.has(prevCons) && items.length && items[items.length-1].k === 'C'){
        items.push({k:'H'}); fired.push({id:'L1.2-aspiration'}); prevCons = null; continue;
      }
      items.push({k:'C', s:s.sym, tanvin:!!s.tanvin}); prevCons = s.sym; continue;
    }
    /* vowel */
    prevCons = null;
    const first = items.length === 0;
    if(first){
      if(s.sym === 'aa') items.push({k:'AA'});
      else if(s.sym === 'a' || s.sym === 'i' || s.sym === 'u') items.push({k:'A', v:s.sym});
      else { items.push({k:'A', v:null}); items.push({k:'V', s:s.sym}); }
      continue;
    }
    if(LONGV.has(s.sym)) items.push({k:'V', s:s.sym, dagger:!!s.dagger});
    else items.push({k:'v', s:s.sym});
  }
  /* 4.2 suppressed-o: ;x + v + vowel -> the v is not scanned (;xvud = ;xud, ;xvaab = ;xaab) */
  for(let j = 0; j + 2 < items.length; j++){
    const a = items[j], b = items[j+1], c = items[j+2];
    if(a.k === 'C' && a.s === ';x' && b.k === 'C' && b.s === 'v' && (c.k === 'V' || c.k === 'v')){
      items.splice(j+1, 1); fired.push({id:'F4.2-suppressed-o'});
    }
  }
  return { items, fired, origin: origin(sy) };
}

/* 1.4 / 4.4 heuristics for a word's language of origin, from its letters */
function origin(sy){
  let ar = false, ind = false;
  for(let j = 0; j < sy.length; j++){
    const s = sy[j];
    if(s.t !== 'con') continue;
    if(ARABIC_LETTERS.has(s.sym)) ar = true;
    if(INDIC_LETTERS.has(s.sym)) ind = true;
  }
  if(ind) return 'indic';                /* p ch zh g retroflex: definitely not Arabic */
  if(ar) return 'arabic';
  return 'unknown';
}

module.exports = { cleanLine, splitLine, parseWord, tokenizeSymbols, LONGV, ASPIRABLE };
