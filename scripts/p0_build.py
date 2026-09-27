#!/usr/bin/env python3
"""
P0 Build Consolidation Script
Extracts source partials from current index.html and creates the new build system.
"""
import json, re, os, sys, shutil, subprocess

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(BASE)

def read_file(path, encoding='utf-8'):
    with open(path, 'r', encoding=encoding) as f:
        return f.read()

def write_file(path, content, encoding='utf-8'):
    os.makedirs(os.path.dirname(path) if os.path.dirname(path) else '.', exist_ok=True)
    with open(path, 'w', encoding=encoding) as f:
        f.write(content)

print("=== P0.1: Snapshot index.html ===")
os.makedirs('scratch', exist_ok=True)
shutil.copy2('index.html', 'scratch/pre-redesign-index.html')
print("  Copied index.html -> scratch/pre-redesign-index.html")

# Move original_base.html if it exists
if os.path.exists('original_base.html'):
    shutil.move('original_base.html', 'scratch/original_base.html')
    print("  Moved original_base.html -> scratch/original_base.html")

html = read_file('index.html')
print(f"  Read index.html: {len(html)} bytes, {html.count(chr(10))+1} lines")

print("\n=== P0.2: Extract source partials ===")
os.makedirs('src/body', exist_ok=True)
os.makedirs('src/js', exist_ok=True)

# ── HEAD ──────────────────────────────────────────────────────────────────────
# Extract everything inside <head>...</head>
head_match = re.search(r'<head>(.*?)</head>', html, re.DOTALL)
assert head_match, "Could not find <head>...</head>"
head_inner = head_match.group(1)

# Extract CSS from <style>...</style> in head
style_match = re.search(r'<style>(.*?)</style>', head_inner, re.DOTALL)
assert style_match, "Could not find <style> in head"
css_content = style_match.group(1)

# Write CSS
write_file('src/styles.css', css_content)
print("  Wrote src/styles.css")

# Head without the style block (replace style content with placeholder)
head_without_style = head_inner.replace(style_match.group(0), '<style>/*@@STYLES@@*/</style>')
write_file('src/head.html', head_without_style)
print("  Wrote src/head.html")

# ── BODY SECTIONS ─────────────────────────────────────────────────────────────
# The body structure (from inspection):
# <body>
#   <header>...</header>
#   <div class="wrap">
#     <!-- EAR / LISTEN -->
#     <!-- HANDBOOK SECTION --> <section id="handbook">...</section>
#     <!-- EXERCISES SECTION --> <section id="exercises">...</section>
#     <!-- DICTIONARY SECTION --> <section id="dictionary">...</section>
#     <!-- BIBLIOGRAPHY & ATTRIBUTIONS --> <section id="bibliography">...</section>
#     <section id="ear" class="on">...</section>
#     <!-- TAP --> <section id="tap">...</section>
#     <!-- SCAN --> <section id="scan">...</section>
#     <!-- BAHR --> <section id="bahr">...</section>
#     <!-- LEARN --> <section id="learn">...</section>
#   </div>
#   <nav id="nav">...</nav>
#   <div class="sheet" id="soundSheet">...</div>
# </body>

# Find body content
body_match = re.search(r'<body>(.*?)</body>', html, re.DOTALL)
assert body_match, "Could not find <body>...</body>"
body_inner = body_match.group(1)

# Extract header
header_match = re.search(r'(<header>.*?</header>)', body_inner, re.DOTALL)
assert header_match, "Could not find <header>"
header_html = header_match.group(1)
write_file('src/body/header.html', header_html + '\n')
print("  Wrote src/body/header.html")

# Find the wrap div (contains all sections)
wrap_match = re.search(r'(<div class="wrap">.*?</div>)\s*\n\s*<nav', body_inner, re.DOTALL)
assert wrap_match, "Could not find wrap div"
wrap_content = wrap_match.group(1)

# Extract nav
nav_match = re.search(r'(<nav id="nav">.*?</nav>)', body_inner, re.DOTALL)
assert nav_match, "Could not find <nav>"
nav_html = nav_match.group(1)
write_file('src/body/nav.html', nav_html + '\n')
print("  Wrote src/body/nav.html")

# Extract soundSheet
sheet_match = re.search(r'(<div class="sheet" id="soundSheet".*?</div>\s*</div>)', body_inner, re.DOTALL)
assert sheet_match, "Could not find soundSheet"
settings_html = sheet_match.group(1)
write_file('src/body/settings.html', settings_html + '\n')
print("  Wrote src/body/settings.html")

def extract_section(html_str, section_id):
    """Extract <section id="...">...</section> from HTML."""
    # Try with class attribute variants
    pat = rf'(<section id="{section_id}"[^>]*>.*?</section>)'
    m = re.search(pat, html_str, re.DOTALL)
    if not m:
        raise AssertionError(f"Could not find section id={section_id}")
    return m.group(1)

def extract_between_comments(html_str, comment_start, comment_end=None):
    """Extract content between two HTML comments."""
    idx_start = html_str.find(comment_start)
    if idx_start == -1:
        raise AssertionError(f"Could not find comment: {comment_start}")
    if comment_end:
        idx_end = html_str.find(comment_end, idx_start + len(comment_start))
        if idx_end == -1:
            raise AssertionError(f"Could not find end comment: {comment_end}")
        return html_str[idx_start:idx_end]
    return html_str[idx_start:]

# Extract each section
sections = {
    'handbook': ('handbook.html', extract_section(body_inner, 'handbook')),
    'exercises': ('ghazals.html', extract_section(body_inner, 'exercises')),
    'dictionary': ('weight.html', extract_section(body_inner, 'dictionary')),
    'bibliography': ('about.html', extract_section(body_inner, 'bibliography')),
    'ear': ('meter.html', extract_section(body_inner, 'ear')),
    'tap': ('tap.html', extract_section(body_inner, 'tap')),
    'scan': ('scan.html', extract_section(body_inner, 'scan')),
    'bahr': ('bahr.html', extract_section(body_inner, 'bahr')),
    'learn': ('foundations.html', extract_section(body_inner, 'learn')),
}

for sec_id, (filename, content) in sections.items():
    write_file(f'src/body/{filename}', content + '\n')
    print(f"  Wrote src/body/{filename} (section #{sec_id})")

# ── JAVASCRIPT ────────────────────────────────────────────────────────────────
# There are two <script> blocks in the HTML:
# 1. Lines 535-1563: Contains Pue parser + scansion engine
# 2. Lines 1564-5251: Contains all the application JS

# Find both script blocks
script_blocks = re.findall(r'<script>(.*?)</script>', html, re.DOTALL)
assert len(script_blocks) == 2, f"Expected 2 script blocks, found {len(script_blocks)}"

script1_content = script_blocks[0]  # Pue + engine
script2_content = script_blocks[1]  # App JS

print(f"\n  Script 1 (Pue+engine): {len(script1_content)} chars")
print(f"  Script 2 (App JS): {len(script2_content)} chars")

# Script 1 contains:
# /* ================= SEAN PUE AST GRAPH TRANSLITERATION ENGINE ================= */
# ... (Pue parser data - this is the @@PUE_PARSER@@ placeholder)
# /* ===== Urdu scansion engine ... ===== */
# ... (engine - MUST NOT TOUCH)

ENGINE_START = '/* ===== Urdu scansion engine — rules from Pritchett & Khaliq, Urdu Meter: A Practical Handbook ===== */'
PUE_COMMENT = '/* ================= SEAN PUE AST GRAPH TRANSLITERATION ENGINE ================= */'

pue_end_idx = script1_content.find(ENGINE_START)
assert pue_end_idx != -1, "Could not find engine start marker in script1"
pue_block = script1_content[:pue_end_idx]
engine_block = script1_content[pue_end_idx:]

# Write the Pue parser block with placeholder
write_file('src/js/00-pue-parser.js', f'/*@@PUE_PARSER@@*/\n')
print("  Wrote src/js/00-pue-parser.js (with PUE_PARSER placeholder)")

# Write the scansion engine (untouched!)
write_file('src/js/01-engine.js', engine_block)
print(f"  Wrote src/js/01-engine.js (engine, {len(engine_block)} chars)")

# Now split Script 2 at the /* ===== ... ===== */ comment boundaries
# Comments found: (from grep output)
# /* ================= DATA: EXPANDED ENCYCLOPEDIA ================= */
# /* ================= STANDALONE METER FAMILY MAP WIDGET ================= */
# /* ================= STANDALONE RHYTHM TIMELINE WIDGET ================= */
# /* ================= SCRIPT MODE ================= */
# /* ================= THEME ================= */
# /* ================= HANDBOOK VIEWER ================= */
# /* ================= EXERCISES MODULE ================= */
# /* ================= GHALIB EXTENDED CORPUS (preview browse) ================= */
# /* ================= MIR EXTENDED CORPUS (browse) ================= */
# /* ================= DICTIONARY MODULE ================= */
# /* ================= STUDIO / COMPOSER MODULE ================= */
# /* ================= BIBLIOGRAPHY MODULE ================= */
# /* ================= AUDIO ================= */
# /* ================= DATA: families (verified) ================= */
# /* ================= EAR ================= */
# /* ================= TAP ================= */
# /* ================= SCAN ================= */
# /* ================= BAHR ================= */
# /* ================= LEARN ================= */

# Split script2 at /* ================= ... ================= */ boundaries
section_pattern = re.compile(r'(/\* =+\s+[A-Z][^=]+\s*=+ \*/)')
parts = section_pattern.split(script2_content)

# parts[0] = content before first comment (store, router, go() etc.)
# parts[1], parts[2] = first comment, content after first comment
# parts[3], parts[4] = second comment, content
# etc.

# Build named chunks
chunks = []
if parts[0].strip():
    chunks.append(('02-store.js', parts[0]))

i = 1
while i < len(parts):
    comment = parts[i]
    content = parts[i+1] if i+1 < len(parts) else ''
    # Derive a filename from the comment
    m = re.search(r'/\* =+ (.*?) =+ \*/', comment)
    name = m.group(1).strip().lower() if m else f'chunk_{i}'
    name = re.sub(r'[^a-z0-9]+', '-', name).strip('-')
    chunks.append((comment + content, name))
    i += 2

# Now build proper ordered JS files
js_files = []

# File 02: Store (content before first comment in script2)
store_content = parts[0] if parts else ''
write_file('src/js/02-store.js', store_content)
js_files.append('src/js/02-store.js')
print(f"  Wrote src/js/02-store.js")

chunk_num = 3
i = 1
while i < len(parts):
    comment = parts[i]
    content = parts[i+1] if i+1 < len(parts) else ''
    full = comment + content
    
    # Derive filename from comment
    m = re.search(r'/\* =+ (.*?) =+ \*/', comment)
    name = m.group(1).strip() if m else f'chunk_{chunk_num}'
    slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    filename = f'src/js/{chunk_num:02d}-{slug}.js'
    
    write_file(filename, full)
    js_files.append(filename)
    print(f"  Wrote {filename}")
    chunk_num += 1
    i += 2

print(f"\n  Total JS files: {2 + len(js_files)}")  # pue + engine + store + rest

# ── MANIFEST ──────────────────────────────────────────────────────────────────
print("\n=== Creating manifest.json ===")

# Collect all src/js files in order
all_js = sorted([f for f in os.listdir('src/js') if f.endswith('.js')])

# Body files in order (matching the HTML structure)
body_files_ordered = [
    'src/body/header.html',
    'src/body/handbook.html',
    'src/body/ghazals.html',
    'src/body/weight.html',
    'src/body/about.html',
    'src/body/meter.html',
    'src/body/tap.html',
    'src/body/scan.html',
    'src/body/bahr.html',
    'src/body/foundations.html',
    'src/body/nav.html',
    'src/body/settings.html',
]

manifest = {
    "head": "src/head.html",
    "styles": "src/styles.css",
    "body": body_files_ordered,
    "js": [f'src/js/{f}' for f in all_js]
}

write_file('src/manifest.json', json.dumps(manifest, indent=2, ensure_ascii=False))
print("  Wrote src/manifest.json")

print("\n=== P0.3: Replace data constants with placeholders ===")

# The data constants are in specific JS files. We need to find them and replace
# their values with placeholders.
# Data constants to replace:
# - HANDBOOK_DATA
# - EXERCISES_DATA
# - METERS_DATA
# - GLOSSARY_DATA
# - BIBLIOGRAPHY_DATA
# - METER_MAP_DATA (keep this too)
# - GHALIB_EXT_DATA
# - MIR_EXT_DATA
# - WORD_ASCII_MAP
# - FAMS (in DATA: families section)
# - PUE_PARSER (already done as placeholder)

# These are in the DATA: EXPANDED ENCYCLOPEDIA section
data_js_file = None
for f in all_js:
    if 'data' in f and 'expanded' in f:
        data_js_file = f'src/js/{f}'
        break

if not data_js_file:
    # Try to find it
    for f in all_js:
        content = read_file(f'src/js/{f}')
        if 'const HANDBOOK_DATA' in content:
            data_js_file = f'src/js/{f}'
            break

assert data_js_file, "Could not find data JS file containing HANDBOOK_DATA"
print(f"  Data JS file: {data_js_file}")

data_js = read_file(data_js_file)

# Replace data constants with placeholders
# Pattern: const NAME = <VALUE>;  where value can be a huge JSON blob
# We need to be careful to find the right boundaries

def replace_const(content, name, placeholder=None):
    """Replace `const NAME = <value>;` with placeholder."""
    if placeholder is None:
        placeholder = f'/*@@{name}@@*/'
    
    # Find `const NAME = `
    prefix = f'const {name} = '
    idx = content.find(prefix)
    if idx == -1:
        print(f"    WARNING: Could not find 'const {name}' in content")
        return content
    
    # Find the end of the value - tricky because values are huge JSON
    # The value ends at the first `;` that is not inside a string or bracket
    value_start = idx + len(prefix)
    value = content[value_start:]
    
    # Find end of value (the matching semicolon)
    depth = 0
    in_string = False
    string_char = None
    j = 0
    while j < len(value):
        c = value[j]
        if in_string:
            if c == '\\':
                j += 2
                continue
            if c == string_char:
                in_string = False
        else:
            if c in ('"', "'", '`'):
                in_string = True
                string_char = c
            elif c in ('{', '[', '('):
                depth += 1
            elif c in ('}', ']', ')'):
                depth -= 1
            elif c == ';' and depth == 0:
                # Found end
                break
        j += 1
    
    if j >= len(value):
        print(f"    WARNING: Could not find end of value for {name}")
        return content
    
    # Replace the value
    new_content = content[:value_start] + placeholder + content[value_start + j:]
    print(f"    Replaced {name} ({j} chars) with {placeholder}")
    return new_content

constants_to_replace = [
    'HANDBOOK_DATA',
    'EXERCISES_DATA', 
    'METERS_DATA',
    'GLOSSARY_DATA',
    'BIBLIOGRAPHY_DATA',
    'METER_MAP_DATA',
    'GHALIB_EXT_DATA',
    'MIR_EXT_DATA',
    'WORD_ASCII_MAP',
]

for const_name in constants_to_replace:
    data_js = replace_const(data_js, const_name)

write_file(data_js_file, data_js)
print(f"  Updated {data_js_file}")

# Replace FAMS in the "DATA: families" JS file
fams_js_file = None
for f in all_js:
    if 'families' in f or 'fams' in f:
        fams_js_file = f'src/js/{f}'
        break
    # Also check content
    content = read_file(f'src/js/{f}')
    if 'const FAMS = ' in content:
        fams_js_file = f'src/js/{f}'
        break

if fams_js_file:
    fams_js = read_file(fams_js_file)
    fams_js = replace_const(fams_js, 'FAMS')
    # Also handle `window.FAMS = FAMS;` line - keep it as-is
    write_file(fams_js_file, fams_js)
    print(f"  Updated {fams_js_file} (FAMS placeholder)")
else:
    print("  WARNING: Could not find FAMS JS file")

print("\n=== P0 source extraction complete ===")
print(f"  src/ directory created with:")
print(f"  - src/head.html")
print(f"  - src/styles.css")
print(f"  - src/manifest.json")
print(f"  - src/body/*.html ({len(body_files_ordered)} files)")
print(f"  - src/js/*.js ({len(all_js)} files)")
