import json, re, os, subprocess, base64
from collections import Counter

# ─── 1. Load datasets ─────────────────────────────────────────────────────────

with open('data/handbook_verbatim.json', 'r', encoding='utf-8') as f:
    HANDBOOK = json.load(f)

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

# Word-level Urdu -> Pritchett-ASCII dictionary, built from every line we have
# verified translation for (226 exercise lines + 2920 Ghalib-extended lines +
# 3110 Mir-extended lines). Used at runtime so a *novel* typed line composed
# mostly of known ghazal vocabulary can still be routed through the real Pue
# parser, instead of the lossy hand-rolled character map, whenever every word
# in it is recognized.
_word_pair_freq = Counter()
for _g in EXERCISES + GHALIB_EXT + MIR_EXT:
    for _l in _g['lines']:
        _uw, _aw = _l['ur'].split(), _l['ascii'].split()
        if len(_uw) != len(_aw):
            continue
        for _u, _a in zip(_uw, _aw):
            _word_pair_freq[(_u, _a)] += 1
_word_best = {}
for (_u, _a), _c in _word_pair_freq.items():
    if _u not in _word_best or _c > _word_best[_u][1]:
        _word_best[_u] = (_a, _c)
WORD_ASCII_MAP = {_u: _a for _u, (_a, _c) in _word_best.items()}

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
 {id:'nuktachin',meters:[18,19],shape:true,pattern:'x - = = / - - = = / - - = = / = =',pair:'The final long may split into two shorts; the first long may be short.',
  gz:[{p:'Ghalib',ascii:'nuktah-chii;N hai ;Gam-e dil us ko sunaa))e nah bane',ascii2:'kyaa bane baat jahaa;N baat banaa))e nah bane',ref:'Ghalib 191'},
      {p:'Atish',ascii:';hasrat-e jalvah-e diidaar li))e phirtii hai',ref:'handbook ex. 9'}]},
 {id:'harek',meters:[33,34],shape:true,pattern:'- = - = / - - = = / - = - = / = =',pair:'The final long may split into two shorts.',
  gz:[{p:'Ghalib',ascii:'har ek baat pah kahte ho tum kih tuu kyaa hai',ascii2:'tumhii;N kaho kih yih andaaz-e guftaguu kyaa hai',ref:'Ghalib 178'},
      {p:'Ghalib',ascii:'bahut sahii ;Gam-e giitii sharaab kam kyaa hai',ref:'Ghalib 216'},
      {p:'Atish',ascii:'yih aarzuu thii tujhe gul ke ruu bah ruu karte',ref:'handbook ex. 10'}]},
 {id:'muddat',meters:[5],shape:true,pattern:'= = - / = - = - / - = = - / = - =',
  gz:[{p:'Ghalib',ascii:'muddat hu))ii hai yaar ko mihmaa;N kiye hu))e',ascii2:'josh-e qada;h se bazm charaaGaa;N kiye hu))e',ref:'Ghalib 233'},
      {p:'Zauq',ascii:'laa))ii ;hayaat aa))e qa.zaa le chalii chale',ref:'handbook ex. 12'}]},
 {id:'milne',meters:[25],shape:true,pattern:'= - - = / - = - = // = - - = / - = - =',pair:'Two halves; an extra short may sit before the break (the ر of the second دیر).',
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
# Source Serif 4 (400, 400 italic, 600), Inter (400, 500) and IBM Plex Mono
# (400), subsetted to Latin + Latin Extended A/B/Additional + combining
# diacritics + the transliteration/pattern marks this app actually uses
# (see LICENSES/OFL-fonts.txt for provenance). Embedding them keeps the app
# at zero runtime network requests instead of loading from Google Fonts.
FONT_FACES = [
    ('Source Serif 4', 'normal', 400, 'src/fonts/SourceSerif4-Regular.woff2'),
    ('Source Serif 4', 'italic', 400, 'src/fonts/SourceSerif4-Italic.woff2'),
    ('Source Serif 4', 'normal', 600, 'src/fonts/SourceSerif4-SemiBold.woff2'),
    ('Inter', 'normal', 400, 'src/fonts/Inter-Regular.woff2'),
    ('Inter', 'normal', 500, 'src/fonts/Inter-Medium.woff2'),
    ('IBM Plex Mono', 'normal', 400, 'src/fonts/IBMPlexMono-Regular.woff2'),
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
    'HANDBOOK_DATA': json.dumps(HANDBOOK, ensure_ascii=False),
    'EXERCISES_DATA': json.dumps(EXERCISES, ensure_ascii=False),
    'METERS_DATA': json.dumps(METERS_DATA, ensure_ascii=False),
    'GLOSSARY_DATA': json.dumps(GLOSSARY, ensure_ascii=False),
    'BIBLIOGRAPHY_DATA': json.dumps(BIBLIOGRAPHY, ensure_ascii=False),
    'METER_MAP_DATA': json.dumps(meter_map_data, ensure_ascii=False),
    'GHALIB_EXT_DATA': json.dumps(GHALIB_EXT_PREVIEW, ensure_ascii=False),
    'MIR_EXT_DATA': json.dumps(MIR_EXT_PREVIEW, ensure_ascii=False),
    'WORD_ASCII_MAP': json.dumps(WORD_ASCII_MAP, ensure_ascii=False),
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
script1_files = [f for f in js_files_in_manifest if '00-pue-parser' in f or '01-engine' in f]
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

{get_bp('handbook')}

{get_bp('about')}

{get_bp('tap')}

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
_used = {'header','home','nav','settings','scan','ghazals','handbook','about','tap','footer'}
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
