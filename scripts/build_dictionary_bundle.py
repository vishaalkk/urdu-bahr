#!/usr/bin/env python3
"""
scripts/build_dictionary_bundle.py

Extracts Platts (1884) and Steingass (1892) entries into an offline dictionary bundle
and classical compound phrase index.

Outputs:
  data/platts_phrases.json: List of attested multi-word compound phrases and idioms (for scansion/meter)
  data/dictionary_bundle.json: Full headword definitions, etymologies, and sub-phrases (for offline lookup)
  data/dictionary_bundle.json.gz: Gzipped bundle for fast static serving / IndexedDB hydration

Usage:
  python3 scripts/build_dictionary_bundle.py
"""
import glob
import gzip
import json
import os
import re
import sqlite3
import sys

ROOT = os.path.join(os.path.dirname(__file__), '..')
CACHE_DIR = os.path.join(ROOT, 'data', 'platts_cache')
STEINGASS_DB = os.path.join(ROOT, 'data', 'steingass_cache', 'entries_slim.sqlite')
OUT_PHRASES = os.path.join(ROOT, 'data', 'platts_phrases.json')
OUT_BUNDLE = os.path.join(ROOT, 'data', 'dictionary_bundle.json')
OUT_BUNDLE_GZ = os.path.join(ROOT, 'data', 'dictionary_bundle.json.gz')


def clean_text(s):
    if not s:
        return ''
    s = re.sub(r'<[^>]+>', ' ', s)
    s = re.sub(r'\s+', ' ', s)
    return s.strip()


def parse_platts_page(filepath, page_num):
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        html = f.read()

    entries = []
    # Match <entry> <span class="new_p"> [origin] <hw>...</hw> [body] </span>
    raw_entries = re.findall(
        r'<entry>\s*<span class="new_p">\s*([A-Za-z?]+)?\s*<hw>(.*?)</hw>(.*?)</span>',
        html,
        re.DOTALL
    )

    for origin, hw_html, body_html in raw_entries:
        pas = re.findall(r'<pa>(.*?)</pa>', hw_html)
        ds = re.findall(r'<d>(.*?)</d>', hw_html)
        ros = re.findall(r'<i>(.*?)</i>', hw_html)

        ur = clean_text(pas[0]) if pas else ''
        hi = clean_text(ds[0]) if ds else ''
        ro = clean_text(ros[0]).replace('*', '') if ros else ''
        origin = clean_text(origin or '')

        if not ur and not ro:
            continue

        # Split body into main definition and sub-phrases
        # Sub-phrases typically start with an em-dash '— <i>phrase</i>'
        parts = re.split(r'[—–]\s*(?:<i>|<hw><i>)', body_html)
        main_def = clean_text(parts[0]) if parts else ''

        sub_phrases = []
        for p in parts[1:]:
            p_ro_m = re.match(r'^(.*?)(?:</i>|</hw>)(.*)', p, re.DOTALL)
            if p_ro_m:
                sub_ro = clean_text(p_ro_m.group(1)).replace('*', '')
                sub_def = clean_text(p_ro_m.group(2))
                if sub_ro:
                    sub_phrases.append({'ro': sub_ro, 'def': sub_def[:160]})
            else:
                m_ro = re.findall(r'^(.*?)[\s,;:]', p)
                if m_ro:
                    sub_phrases.append({'ro': clean_text(m_ro[0]), 'def': clean_text(p)[:160]})

        entries.append({
            'ur': ur,
            'hi': hi,
            'ro': ro,
            'origin': origin,
            'page': page_num,
            'def': main_def[:300],
            'phrases': sub_phrases[:15]
        })

    return entries


def main():
    print("Building dictionary bundle and compound phrase index...")
    html_files = sorted(glob.glob(os.path.join(CACHE_DIR, 'p_*.html')))
    if not html_files:
        print("No Platts cache files found in data/platts_cache/! Run scripts/import_platts.py first.")
        sys.exit(1)

    all_entries = {}
    all_phrases = {}

    for path in html_files:
        base = os.path.basename(path)
        m = re.search(r'p_(\d+)', base)
        page_num = int(m.group(1)) if m else 0
        page_entries = parse_platts_page(path, page_num)

        for ent in page_entries:
            key = (ent['ur'], ent['ro'])
            if key not in all_entries:
                all_entries[key] = ent
            for phr in ent['phrases']:
                pro = phr['ro'].strip()
                if (' ' in pro or '-' in pro) and len(pro) >= 4:
                    if pro not in all_phrases:
                        all_phrases[pro] = {
                            'head_ur': ent['ur'],
                            'head_ro': ent['ro'],
                            'def': phr['def']
                        }

    print(f"Parsed {len(all_entries)} headword entries from Platts across {len(html_files)} pages.")
    print(f"Found {len(all_phrases)} multi-word classical phrases and idioms.")

    # Load Steingass entries from SQLite if present
    steingass_count = 0
    if os.path.exists(STEINGASS_DB):
        conn = sqlite3.connect(STEINGASS_DB)
        cur = conn.cursor()
        for fa, ro, defs in cur.execute('SELECT headword_persian, headword_latin, definitions FROM entries'):
            fa = fa.strip()
            ro = ro.replace('*', '').strip()
            if not fa or not ro:
                continue
            key = (fa, ro)
            if key not in all_entries:
                clean_d = clean_text(defs)[:240]
                all_entries[key] = {
                    'ur': fa,
                    'hi': '',
                    'ro': ro,
                    'origin': 'P',
                    'page': 0,
                    'def': clean_d,
                    'phrases': []
                }
                steingass_count += 1
        print(f"Added {steingass_count} Persian entries from Steingass.")

    # Write platts_phrases.json (compact index of compounds)
    with open(OUT_PHRASES, 'w', encoding='utf-8') as f:
        json.dump(all_phrases, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(all_phrases)} phrases to {os.path.relpath(OUT_PHRASES, ROOT)}")

    # Format dictionary bundle as a list for export
    bundle_data = list(all_entries.values())
    raw_json = json.dumps(bundle_data, ensure_ascii=False, separators=(',', ':'))

    with open(OUT_BUNDLE, 'w', encoding='utf-8') as f:
        f.write(raw_json)

    with gzip.open(OUT_BUNDLE_GZ, 'wb', compresslevel=9) as f:
        f.write(raw_json.encode('utf-8'))

    raw_mb = len(raw_json) / (1024 * 1024)
    gz_mb = os.path.getsize(OUT_BUNDLE_GZ) / (1024 * 1024)
    print(f"Wrote dictionary bundle: {len(bundle_data)} entries")
    print(f"  Raw:  {raw_mb:.2f} MB ({os.path.relpath(OUT_BUNDLE, ROOT)})")
    print(f"  Gzip: {gz_mb:.2f} MB ({os.path.relpath(OUT_BUNDLE_GZ, ROOT)})")


if __name__ == '__main__':
    main()
