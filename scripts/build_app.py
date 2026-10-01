import json
import re, re, os, sys, subprocess, base64
from collections import Counter

# ─── 1. Load datasets ─────────────────────────────────────────────────────────

# data/handbook_verbatim.json (and source_data/) are local-only reference material — gitignored,
# not needed to build the site (the Handbook reader was removed; see HANDBOOK_DATA below).

with open('data/exercises_verified.json', 'r', encoding='utf-8') as f:
    EXERCISES = json.load(f)

with open('data/meters.json', 'r', encoding='utf-8') as f:
    METERS_DATA = json.load(f)

with open('data/glossary.json', 'r', encoding='utf-8') as f:
    GLOSSARY = json.load(f)

with open('data/bibliography.json', 'r', encoding='utf-8') as f:
    BIBLIOGRAPHY = json.load(f)

with open('data/ghalib_extended.json', 'r', encoding='utf-8') as f:
    GHALIB_EXT = json.load(f)

with open('data/mir_extended.json', 'r', encoding='utf-8') as f:
    MIR_EXT = json.load(f)
# "More Poets": ghazals from Rekhta (Urdu and Devanagari as given; Roman converted to Pritchett's style), see scripts/build_others.js.
with open('data/others_extended.json', 'r', encoding='utf-8') as f:
    OTHERS_EXT = json.load(f)
# Famous couplets from Irfan 'Abid's urdupoetry.com bahr article (data/urdupoetry_bahrs.json
# has the full article extraction + scan verification; this is just the subset wired into
# Meter > Lookup as extra examples). See scripts/incorporate_iqbal.js for the sibling pattern.
with open('data/urdupoetry_verses.json', 'r', encoding='utf-8') as f:
    URDUPOETRY_EXT = json.load(f)
# Iqbal: Frances Pritchett's pages, scraped by scripts/scrape_iqbal.py (+ incorporate_iqbal.js).
# Only feeds the word map below, so typed Iqbal lines get her spelling.
with open('data/iqbal_corpus.json', 'r', encoding='utf-8') as f:
    IQBAL = [p for p in json.load(f) if p['lines'] and isinstance(p['lines'][0], dict)]

# Full per-line data (ascii/ur/hi/ro) for every retained ghazal, not just a
# truncated preview — see docs/reviews/12's lesson: a preview-only "opening
# couplet" store silently broke "Scan Ghazal" and diacritics display and had
# to be redone. Both browse panels below embed every line from the start.
GHALIB_EXT_PREVIEW = [{
    'id': g['id'],
    'meters': g['meters'],
    'url': g.get('url', ''),        # Fran Pritchett's page for this ghazal (Ghalib id = her number)
    'label': g['meter_label'],
    'n': g['lines_count'],
    'lines': [{'ascii': l['ascii'], 'ur': l['ur'], 'hi': l['hi'], 'ro': l['ro']} for l in g['lines']],
} for g in GHALIB_EXT]

MIR_EXT_PREVIEW = [{
    'id': g['id'],
    'meters': g['meters'],
    'url': g.get('url', ''),
    'source_id': g.get('source_id', ''),   # her number for the ghazal (our Mir id is sequential)
    'label': g['meter_label'],
    'n': g['lines_count'],
    'lines': [{'ascii': l['ascii'], 'ur': l['ur'], 'hi': l['hi'], 'ro': l['ro']} for l in g['lines']],
} for g in MIR_EXT]

# Neighbour rules that pick between spellings of one typed word (scripts/build_collocations.py; benchmark: scripts/colloc_benchmark.py)
with open('data/collocations.json', 'r', encoding='utf-8') as f:
    COLLOCATIONS = json.load(f)
# Poet collections of the Ghazals tab beyond Ghalib and Mir (Rekhta; the six hand-checked ones keep their verified Roman),
# built by scripts/build_poets.py. Deliberately NOT fed to the word maps below: their Roman is Rekhta's, not Pritchett's.
with open('data/poets_extended.json', 'r', encoding='utf-8') as f:
    POETS = json.load(f)
# the poets, Ghalib and Mir ship as a word dictionary plus id lines (see scripts/pack_verses.py); the app unpacks them at load
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pack_verses import pack_poets as _pack_poets, pack_list as _pack_list, dumps as _dumps_json
POETS_PACKED = _pack_poets(POETS)
# only lines whose converted Urdu matched Rekhta's Urdu feed the word maps below (their ascii spelling is trustworthy)
OTHERS_WORDS = [{'lines': [l for l in g['lines'] if l.get('verified')]} for g in OTHERS_EXT]

# Word-level Urdu -> Pritchett-ASCII dictionary, built from every line we have
# verified translation for (226 exercise lines + 2920 Ghalib-extended lines +
# 3110 Mir-extended lines + 339 Iqbal lines from Pritchett's pages). Used at runtime so a *novel* typed line composed
# mostly of known ghazal vocabulary can still be routed through the real Pue
# parser, instead of the lossy hand-rolled character map, whenever every word
# in it is recognized.
def _split_hyphens(tokens):
    # Fran hyphenates compounds (kaav-kaav-e, ((ajz-o-qaalib) where Urdu writes separate
    # words: split them, keeping iẓāfat -e on its word and -o- as the word و
    # (same rule as scripts/build_fran_lexicon.py)
    out = []
    for t in tokens:
        for i, p in enumerate(t.split('-')):
            if i and p in ('e', 'ye') and out: out[-1] += '-' + p
            elif p: out.append(p)
    return out
_word_pair_freq = Counter()
for _g in EXERCISES + GHALIB_EXT + MIR_EXT + IQBAL + OTHERS_WORDS:
    for _l in _g['lines']:
        _uw, _aw = _l['ur'].split(), _l['ascii'].split()
        if len(_uw) != len(_aw):
            _aw = _split_hyphens(_aw)
        if len(_uw) != len(_aw):
            continue
        for _u, _a in zip(_uw, _aw):
            _word_pair_freq[(_u, _a)] += 1
_word_best = {}
for (_u, _a), _c in _word_pair_freq.items():
    if _u not in _word_best or _c > _word_best[_u][1]:
        _word_best[_u] = (_a, _c)
WORD_ASCII_MAP = {_u: _a for _u, (_a, _c) in _word_best.items()}

# Casual Roman -> Pritchett-ASCII: people type Roman without diacritics (ishq, gham, aaj, mohabbat), so a typed word is
# looked up by a folded key. The key drops every diacritic and ascii marker (;N .s :t (( )) -) and folds long vowels,
# doubled letters and w/v, so "mohabbat", "mu;habbat" and "muhabat" meet. Where several spellings share a key the most
# frequent one wins. KI_NEXT decides the one spelling that cannot be told apart by itself: ki is kih (that) or kii (of),
# judged by the word that follows. The same fold is written in src/js/05-translit-helpers.js (casualKey).
def _casual_key(a, level):
    # level 0 strict: long vowels kept (aa ii uu); 1 loose: long vowels folded; 2 lax: also o~u and e~i. Mirrors casualKey() in
    # src/js/05-translit-helpers.js.
    a = a.lower().replace(';g', 'gh').replace(';x', 'kh')
    a = re.sub(r"[;.:()'\u2019\u2018\u02bf\u02be-]", '', a)
    a = a.replace('oo', 'uu').replace('w', 'v')
    if level >= 1: a = a.replace('aa', 'a').replace('ii', 'i').replace('uu', 'u')
    if level >= 2: a = a.replace('o', 'u').replace('e', 'i')
    return re.sub(r'(.)\1+' if level >= 1 else r'([^aiu])\1+', r'\1', a)
_casual_freq = [{}, {}, {}]
for (_u, _a), _c in _word_pair_freq.items():
    _a = re.sub(r'-(e|ye)$', '', _a)
    if '-' in _a or not _a: continue
    for _lv in range(3):
        _casual_freq[_lv].setdefault(_casual_key(_a, _lv), Counter())[_a] += _c
ROMAN_CASUAL_MAP = [{_k: _cnt.most_common(1)[0][0] for _k, _cnt in _f.items()} for _f in _casual_freq]
# A strict (level 0) entry shadows the looser levels, so it must have real support. Typed "ka" matched a one-off "ka" in the corpora
# and never reached "kaa" (کا, 3000 uses); "bhi" matched one "bhi" against 523 "bhii". Keep a strict entry only if its spelling
# makes up >= 10% of its loose (level 1) group; otherwise the typed word falls through to the common spelling.
_loose_total = {_k: sum(_c.values()) for _k, _c in _casual_freq[1].items()}
for _k0, _cnt0 in _casual_freq[0].items():
    _k1 = _casual_key(_cnt0.most_common(1)[0][0], 1)
    if _cnt0.most_common(1)[0][1] < 0.10 * _loose_total.get(_k1, 0):
        ROMAN_CASUAL_MAP[0].pop(_k0, None)
_ki_next = {}
for _g in EXERCISES + GHALIB_EXT + MIR_EXT + IQBAL + OTHERS_WORDS:
    for _l in _g['lines']:
        _t = [re.sub(r'-(e|ye)$', '', x) for x in _l['ascii'].split()]
        for _i in range(len(_t) - 1):
            if _t[_i] in ('kih', 'kii'):
                _slot = _ki_next.setdefault(_casual_key(_t[_i + 1], 1), [0, 0])
                _slot[0 if _t[_i] == 'kih' else 1] += 1
KI_NEXT = {_k: _v for _k, _v in _ki_next.items() if sum(_v) >= 3}

# Load Sean Pue AST transliteration parser scripts
with open('pritchett_scripts/urdu_parser_data.js', 'r', encoding='utf-8') as f:
    pue_ur_js = f.read()
with open('pritchett_scripts/devanagari_parser_data.js', 'r', encoding='utf-8') as f:
    pue_hi_js = f.read()
with open('pritchett_scripts/diacritics_parser_data.js', 'r', encoding='utf-8') as f:
    pue_di_js = f.read()
with open('pritchett_scripts/ghalib.js', 'r', encoding='utf-8') as f:
    pue_ghalib_js = f.read()

# Load Meter Map and Rhythm Roll modules
with open('features/meter-map/meterMap.js', 'r', encoding='utf-8') as f:
    meter_map_raw = f.read()
with open('features/rhythm-roll/rhythmRoll.js', 'r', encoding='utf-8') as f:
    rhythm_roll_raw = f.read()

meter_map_bundled = meter_map_raw.replace('export function mountMeterMap', 'function mountMeterMap') + '\nwindow.mountMeterMap = mountMeterMap;\n'
rhythm_roll_bundled = rhythm_roll_raw.replace('export function mountRhythmRoll', 'function mountRhythmRoll') + '\nwindow.mountRhythmRoll = mountRhythmRoll;\n'

# Build METER_MAP_DATA
standard_mm = [{**m, 'group': 'standard'} for m in METERS_DATA['standard']]
rubai_mm = [{**m, 'group': 'rubai'} for m in METERS_DATA['rubai']]
hindi_mm = [{
    'id': 'HINDI',
    'name': "Mir's Hindi meter",
    'group': 'hindi',
    'description': METERS_DATA['hindi_info']['description'],
    'feet': METERS_DATA['hindi_info']['feet'],
    'paired': []
}]
meter_map_meters = standard_mm + rubai_mm + hindi_mm
meter_map_pairs = []
seen_pairs = set()
for m in METERS_DATA['standard']:
    for otherId in m.get('paired', []):
        key = (min(m['id'], otherId), max(m['id'], otherId))
        if key not in seen_pairs:
            seen_pairs.add(key)
            meter_map_pairs.append([m['id'], otherId])
meter_map_data = {'meters': meter_map_meters, 'pairs': meter_map_pairs}

# ─── 2. Generate enriched FAMS data with 4 scripts ────────────────────────────
node_fams_code = r'''
const fs = require('fs');
global.window = global;
eval(fs.readFileSync('pritchett_scripts/urdu_parser_data.js', 'utf8'));
eval(fs.readFileSync('pritchett_scripts/devanagari_parser_data.js', 'utf8'));
eval(fs.readFileSync('pritchett_scripts/diacritics_parser_data.js', 'utf8'));
eval(fs.readFileSync('pritchett_scripts/ghalib.js', 'utf8'));
global.p_di = new Parser('diacritics', diacritics_tokens, diacritics_token_regex, diacritics_graph, diacritics_onmatch);

const fams = [
 {id:'dilenadan',meters:[14,15],shape:true,pattern:'x - = = / - = - = / = =',pair:'The next-to-last long may split into two shorts, and the first long may be short.',
  gz:[{p:'Ghalib',ascii:'dil-e naadaa;N tujhe hu))aa kyaa hai',ascii2:'aa;xir is dard kii davaa kyaa hai',ref:'Ghalib 162'},
      {p:'Ghalib',ascii:'ko))ii ummiid bar nahii;N aatii',ascii2:'ko))ii .suurat na:zar nahii;N aatii',ref:'Ghalib 161'},
      {p:'Ghalib',ascii:'ibn-e maryam hu))aa kare ko))ii',ref:'Ghalib 215'},
      {p:'Ghalib',ascii:'phir is andaaz se bahaar aa))ii',ref:'Ghalib 181'},
      {p:'Mir',ascii:'hastii apnii ;hubaab kii sii hai',ascii2:'yih numaa))ish saraab kii sii hai',ref:'handbook ex. 4'}]},
 {id:'hazaron',meters:[26],cell:'- = = =',reps:4,pattern:'- = = = / - = = = / - = = = / - = = =',pair:'The only bahr that forbids the final cheat syllable.',
  gz:[{p:'Ghalib',ascii:'hazaaro;N ;xvaahishe;N aisii kih har ;xvaahish pah dam nikle',ascii2:'bahut nikle mire armaan lekin phir bhii کم nikle'.replace('کم', 'kam'),ref:'Ghalib 219'},
      {p:'Vali',ascii:'kiyaa mujh ((ishq ne :zaalim ko aab aahistah aahistah',ref:'handbook ex. 1'},
      {p:"Mus'hafi",ascii:'nah vuh raate;N nah vuh baate;N nah vuh qi.s.sah kahaanii hai',ref:'handbook ex. 6'}]},
 {id:'sadagi',meters:[10],cell:'= - = =',reps:4,clip:'last cell clipped to = – =',pattern:'= - = = / = - = = / = - = = / = - =',
  gz:[{p:'Ghalib',ascii:'saadagii par us kii mar jaane kii ;hasrat dil me;N hai',ascii2:'bas nahii;N chaltaa kih phir ;xanjar kaf-e qaatil me;N hai',ref:'Ghalib 157'},
      {p:'Ghalib',ascii:'sab kahaa;N kuchh laalah-o-gul me;N numaayaa;N ho ga))ii;N',ascii2:';xaak me;N kyaa .suurate;N ho;N gii kih pinhaa;N ho ga))ii;N',ref:'Ghalib 111'},
      {p:"Jur'at",ascii:'baal suljhaanaa tiraa kanghii se dil uljhaa))e hai',ref:'handbook ex. 7'}]},
 {id:'koidin',meters:[11],cell:'= - = =',reps:3,clip:'last cell clipped to = – =',pattern:'= - = = / = - = = / = - =',
  gz:[{p:'Ghalib',ascii:'ko))ii din gar zindagaanii aur hai',ascii2:'apne jii me;N ham ne ;Thaanii aur hai',ref:'Ghalib 160'},
      {p:'Mir Dard',ascii:'tuhmate;N chand apne zimme dhar chale',ascii2:'jis li))e aa))e the so ham kar chale',ref:'handbook ex. 2'}]},
 {id:'bazicha',meters:[8],shape:true,pattern:'= = - / - = = - / - = = - / - = =',
  gz:[{p:'Ghalib',ascii:'baaziichah-e a:tfaal hai dunyaa mire aage',ascii2:'hotaa hai shab-o-roz tamaashaa mire aage',ref:'Ghalib 208'}]},
 {id:'yihnathi',meters:[36],shape:true,pattern:'- - = - / = - = = // - - = - / = - = =',pair:'Two mirrored halves; an extra short may sit just before the break.',
  gz:[{p:'Ghalib',ascii:'yih nah thii hamaarii qismat kih vi.saal-e yaar hotaa',ascii2:'agar aur jiite rahte yahii intizaar hotaa',ref:'Ghalib 20'}]},
 {id:'nuktachin',meters:[18,19],shape:true,pattern:'x - = = / - - = = / - - = = / = =',pair:'The next-to-last long may split into two shorts; the first long may be short.',
  gz:[{p:'Ghalib',ascii:'nuktah-chii;N hai ;Gam-e dil us ko sunaa))e nah bane',ascii2:'kyaa bane baat jahaa;N baat banaa))e nah bane',ref:'Ghalib 191'},
      {p:'Atish',ascii:';hasrat-e jalvah-e diidaar li))e phirtii hai',ref:'handbook ex. 9'}]},
 {id:'harek',meters:[33,34],shape:true,pattern:'- = - = / - - = = / - = - = / = =',pair:'The next-to-last long may split into two shorts.',
  gz:[{p:'Ghalib',ascii:'har ek baat pah kahte ho tum kih tuu kyaa hai',ascii2:'tumhii;N kaho kih yih andaaz-e guftaguu kyaa hai',ref:'Ghalib 178'},
      {p:'Ghalib',ascii:'bahut sahii ;Gam-e giitii sharaab kam kyaa hai',ref:'Ghalib 216'},
      {p:'Atish',ascii:'yih aarzuu thii tujhe gul ke ruu bah ruu karte',ref:'handbook ex. 10'}]},
 {id:'muddat',meters:[5],shape:true,pattern:'= = - / = - = - / - = = - / = - =',
  gz:[{p:'Ghalib',ascii:'muddat hu))ii hai yaar ko mihmaa;N kiye hu))e',ascii2:'josh-e qada;h se bazm charaaGaa;N kiye hu))e',ref:'Ghalib 233'},
      {p:'Zauq',ascii:'laa))ii ;hayaat aa))e qa.zaa le chalii chale',ref:'handbook ex. 12'}]},
 {id:'milne',meters:[25],shape:true,pattern:'= - - = / - = - = // = - - = / - = - =',pair:'Two halves; an extra short may sit before the break.',
  gz:[{p:'Mir',ascii:'milne lage ho der der dekhiye kyaa hai kyaa nahii;N',ref:'handbook ex. 3'}]},
 {id:'use',meters:[27],cell:'- = = =',reps:3,clip:'last cell clipped to – = =',pattern:'- = = = / - = = = / - = =',
  gz:[{p:'Zauq',ascii:'use ham ne bahut ;Dhuu;N;Dhaa nah paayaa',ref:'handbook ex. 11'}]},
 {id:'ulti',meters:['H'],hindi:true,pattern:'= = / = = / = = / = = // = = / = = / = = / =',pair:'Mir\'s "Hindi" meter: about 15 long-beats; any even-numbered long except the 8th may become two shorts. Recognise it by its length and swing.',
  gz:[{p:'Mir',ascii:'ul;Tii ho ga))ii;N sab tadbiire;N kuchh nah davaa ne kaam kiyaa',ascii2:'dekhaa is biimaarii-e dil ne aa;xir kaam tamaam kiyaa',ref:'Mir 7 · sung by Begum Akhtar and Mehdi Hassan'}]}
];

fams.forEach(f => {
  f.gz.forEach(g => {
    g.ur = window.p_ur.parse(g.ascii);
    g.hi = window.p_hi.parse(g.ascii);
    g.ro = window.p_di.parse(g.ascii);
    if(g.ascii2) {
      g.ur2 = window.p_ur.parse(g.ascii2);
      g.hi2 = window.p_hi.parse(g.ascii2);
      g.ro2 = window.p_di.parse(g.ascii2);
    }
  });
});

console.log('JSON_START' + JSON.stringify(fams) + 'JSON_END');
'''

res_fams = subprocess.run(['node', '-e', node_fams_code], capture_output=True, text=True)
assert res_fams.returncode == 0, f"Error in node_fams_code: {res_fams.stderr}"
s_fams_out = res_fams.stdout
fams_json = s_fams_out[s_fams_out.find('JSON_START') + 10 : s_fams_out.find('JSON_END')]
assert len(fams_json) > 100, "fams_json extraction failed or empty"

# ─── 3. Build PUE parser bundle ───────────────────────────────────────────────
pue_parser_bundle = f'''/* ================= SEAN PUE AST GRAPH TRANSLITERATION ENGINE ================= */
{pue_ur_js}
{pue_hi_js}
{pue_di_js}
{pue_ghalib_js}
if (typeof Parser !== 'undefined') {{
  window.p_di = new Parser('diacritics', diacritics_tokens, diacritics_token_regex, diacritics_graph, diacritics_onmatch);
}}
'''

# ─── 3b. Embed offline fonts as base64 @font-face rules ───────────────────────
# Source Serif 4 (400, 400 italic, 600), Inter (400, 500), Source Code Pro (400, 600)
# and Noto Sans Mono (400), subsetted to Latin + Latin Extended A/B/Additional + combining
# diacritics + the transliteration/pattern marks this app actually uses
# (see LICENSES/OFL-fonts.txt for provenance). Embedding them keeps the app
# at zero runtime network requests instead of loading from Google Fonts.
FONT_FACES = [
    ('Source Serif 4', 'normal', 400, 'src/fonts/SourceSerif4-Regular.woff2'),
    ('Source Serif 4', 'italic', 400, 'src/fonts/SourceSerif4-Italic.woff2'),
    ('Source Serif 4', 'normal', 600, 'src/fonts/SourceSerif4-SemiBold.woff2'),
    ('Inter', 'normal', 400, 'src/fonts/Inter-Regular.woff2'),
    ('Inter', 'normal', 500, 'src/fonts/Inter-Medium.woff2'),
    ('Source Code Pro', 'normal', 400, 'src/fonts/SourceCodePro-Regular.woff2'),
    ('Source Code Pro', 'normal', 600, 'src/fonts/SourceCodePro-SemiBold.woff2'),
    ('Noto Sans Mono', 'normal', 400, 'src/fonts/NotoSansMono-Regular.woff2'),
]

def build_font_face_css(faces):
    rules = []
    for family, style, weight, path in faces:
        with open(path, 'rb') as f:
            b64 = base64.b64encode(f.read()).decode('ascii')
        rules.append(
            "@font-face{{font-family:'{family}';font-style:{style};"
            "font-weight:{weight};font-display:swap;"
            "src:url(data:font/woff2;base64,{b64}) format('woff2');}}".format(
                family=family, style=style, weight=weight, b64=b64
            )
        )
    return ''.join(rules)

font_face_css = build_font_face_css(FONT_FACES)

# ─── 4. Read manifest and source files ────────────────────────────────────────
with open('src/manifest.json', 'r', encoding='utf-8') as f:
    manifest = json.load(f)

def read_source(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

# ─── 5. Concatenate HTML from source partials ─────────────────────────────────
head_content = read_source(manifest['head'])
styles_src = manifest['styles']
styles_content = '\n'.join(read_source(p) for p in (styles_src if isinstance(styles_src, list) else [styles_src]))

# Substitute style placeholders
head_content = head_content.replace('/*@@FONTFACES@@*/', font_face_css)
head_content = head_content.replace('/*@@STYLES@@*/', styles_content)

# Read body parts
body_parts = {}
for body_file in manifest['body']:
    key = os.path.basename(body_file).replace('.html', '')
    body_parts[key] = read_source(body_file)

# ─── 6. Build data substitution map ───────────────────────────────────────────
substitutions = {
    'PUE_PARSER': pue_parser_bundle,
    # The Handbook reader was removed from the site (links go to Pritchett's own pages);
    # data/handbook_verbatim.json stays in the repo as local reference material only.
    'HANDBOOK_DATA': '[]',
    'EXERCISES_DATA': json.dumps(EXERCISES, ensure_ascii=False),
    'METERS_DATA': json.dumps(METERS_DATA, ensure_ascii=False),
    'GLOSSARY_DATA': json.dumps(GLOSSARY, ensure_ascii=False),
    'BIBLIOGRAPHY_DATA': json.dumps(BIBLIOGRAPHY, ensure_ascii=False),
    'METER_MAP_DATA': json.dumps(meter_map_data, ensure_ascii=False),
    'GHALIB_EXT_DATA': _dumps_json(_pack_list(GHALIB_EXT_PREVIEW)),
    'MIR_EXT_DATA': _dumps_json(_pack_list(MIR_EXT_PREVIEW)),
    'COLLOCATIONS': json.dumps(COLLOCATIONS, ensure_ascii=False, separators=(',', ':')),
    'POETS_DATA': _dumps_json(POETS_PACKED),
    'URDUPOETRY_DATA': json.dumps(URDUPOETRY_EXT, ensure_ascii=False),
    'WORD_ASCII_MAP': json.dumps(WORD_ASCII_MAP, ensure_ascii=False),
    'ROMAN_CASUAL_MAP': json.dumps(ROMAN_CASUAL_MAP, ensure_ascii=False),
    'KI_NEXT': json.dumps(KI_NEXT, ensure_ascii=False),
    'FAMS': fams_json,
    # meter_map_bundled and rhythm_roll_bundled are NOT placeholders in the JS,
    # they are embedded directly in 04- and 05- files — those files in src/js/
    # already contain the full content (extracted from the built HTML).
    # So no substitution needed for those.
}

# ─── 7. Assemble full HTML ────────────────────────────────────────────────────
# Reproduce the original HTML structure exactly, matching whitespace

def get_bp(key):
    # Strip trailing newline from body part for clean joining
    return body_parts.get(key, '').rstrip('\n')

def get_group(key):
    # A page plus its sub-tab partials (e.g. weight + weight-drill + weight-lookup),
    # in manifest order. Every manifest body file must end up in the page.
    keys = [k for k in body_parts if k == key or k.startswith(key + '-')]
    return '\n\n'.join(get_bp(k) for k in keys)

# Build JS content with substitutions
def build_js_chunk(files):
    parts = []
    for js_file in files:
        parts.append(read_source(js_file))
    content = '\n'.join(parts)
    # Apply substitutions
    for name, value in substitutions.items():
        placeholder = f'/*@@{name}@@*/'
        if placeholder in content:
            content = content.replace(placeholder, value)
    return content

# Find which JS files are in script1 (pue + engine) vs script2 (rest)
js_files_in_manifest = manifest['js']
script1_files = [f for f in js_files_in_manifest if '00-pue-parser' in f or '01b-hypothesis' in f or '01-engine' in f]
script2_files = [f for f in js_files_in_manifest if f not in script1_files]

script1_content = build_js_chunk(script1_files)
script2_content = build_js_chunk(script2_files)

# The original HTML had this structure:
# <!DOCTYPE html>
# <html lang="en">
# <head>
# {head_content}
# </head>
# <body>
# {header}
#
# <div class="wrap">
#
# <!-- ===================== EAR / LISTEN ===================== -->
#
# {handbook}        <- includes "<!-- HANDBOOK SECTION -->" comment prefix
# ...
# {foundations}
#
# </div>
#
# {nav}
#
# {settings}
#
# <script>
# {script1}
# </script>
# <script>
# {script2}
# </script>
# </body>
# </html>

# The meter (ear) section did NOT have a preceding comment (it was the natural default)
# The EAR/LISTEN comment appeared before HANDBOOK (right after the wrap div open)

full_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
{head_content}
</head>
<body>
{get_bp('header')}

<div class="wrap">

{get_bp('home')}

{get_group('weight')}

{get_group('meter')}

{get_bp('scan')}

{get_bp('ghazals')}

{get_bp('about')}

{get_bp('guide')}

{get_bp('tap')}

{get_bp('practice')}

{get_bp('footer')}

</div>

{get_bp('nav')}

{get_bp('settings')}

<script>
{script1_content}
</script>
<script>
{script2_content}
</script>
</body>
</html>
"""


# ─── 7b. Structural checks: every body partial used, sections balanced ──────
_used = {'header','home','nav','settings','scan','ghazals','about','guide','tap','practice','footer'}
_unused = [k for k in body_parts if k not in _used and not any(k == g or k.startswith(g + '-') for g in ('weight','meter'))]
if _unused:
    raise SystemExit(f"build_app: manifest body partials not placed in the page: {_unused}")
_body = full_html[full_html.index('<body>'):full_html.index('<script>')]
_open, _close = _body.count('<section'), _body.count('</section>')
if _open != _close:
    raise SystemExit(f"build_app: unbalanced <section> tags in body ({_open} open, {_close} close)")

# ─── 8. Write output files ────────────────────────────────────────────────────
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(full_html)

print('Compiled successfully into index.html!')
