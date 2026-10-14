#!/usr/bin/env python3
"""
scripts/build_dictionary_bundle.py

Extracts Platts (1884), Fallon (1879) and Steingass (1892) entries into an offline dictionary bundle (each entry carries its own
compound phrases and idioms; scripts/build_roman_fallback.js reads Platts' headwords from it too).

Outputs:
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
import unicodedata

ROOT = os.path.join(os.path.dirname(__file__), '..')
CACHE_DIR = os.path.join(ROOT, 'data', 'platts_cache')
FALLON_CACHE_DIR = os.path.join(ROOT, 'data', 'fallon_cache')
STEINGASS_DB = os.path.join(ROOT, 'data', 'steingass_cache', 'entries_slim.sqlite')
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
            'dict': 'Platts',
            'def': main_def[:300],
            'phrases': sub_phrases[:15]
        })

    return entries

# Fallon's phrase and proverb markers: an italic phrase followed by its part of speech (", v. a. To abuse"), or "— <i>"
FALLON_PHRASE = re.compile(r'<i>[^<]+</i>\s*,\s*(?:v\.\s*[ant]\.|n\.\s*[mf]\.|n\.|adj\.|adv\.)(?=[\s,.<])|[—–]\s*<i>')
FALLON_BARE_POS = re.compile(r'^[\s,]*(?:(?:[A-Z][a-z]*\.|[a-z]\.)\s*)*$|^[\s,]*(?:[A-Z][a-z]*\.\s*)*(?:v\.\s*[ant]\.|n\.\s*[mf]?\.?|adj\.|adv\.)(?:\s*[mf]\.)?[\s,]*$')
FALLON_PROVERB = re.compile(r'<i>([^<]+)</i>\.?\s*Prov\.\s*([^<]+)')


def clean_fallon(s):   # tags drop without a space: "<i>hai</i>." reads "hai."
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', s or '')).strip()


def fallon_roman(s):
    """DSAL prints /?/ where Fallon's letter has a mark it could not show: before kh the dot of ḳh (ba-/?/khair), after g the
    dot of ġ (bālig/?/), elsewhere an ʿain (ā/?/lā, tā/?/ālā)"""
    s = re.sub(r'/\?/\s*kh', 'ḳh', s)
    s = re.sub(r'g/\?/', 'ġ', s)
    return s.replace('/?/', 'ʿ')


def fallon_urdu(s):
    """Fallon's Urdu as letters: the DSAL text uses typesetting glyphs (ﮩ, the medial heh) that no search matches"""
    return unicodedata.normalize('NFKC', s)


# How an entry says it comes from another word, in Platts' and Steingass's own abbreviations: a verbal noun ("v.n. fr. hārnā"),
# a causal or intensive verb, a plural, a corruption, an equivalent ("= X, q.v."), another derivative ("fr. X"). Each becomes
# [kind, the other word's Roman]; the app links both ways (DICT_STORE.family), so hārnā's entry leads to hār "defeat".
REL_ROMAN = r"(?:[^\sa-z\u00c0-\u024f\u1e00-\u1eff(\[]+\s+){0,2}([a-z\u00c0-\u024f\u1e00-\u1effʻʼʿ'\u0300-\u036f\-]{2,})"   # Urdu / Devanagari may come first
REL_NOT = {'to', 'the', 'see', 'of', 'in', 'a', 'an', 'and', 'or', 'be', 'by', 'is', 'it', 'as', 'at', 'on', 'for', 'rt', 'q', 'v'}   # English, abbreviations
# ("next" / "prec." are resolved to the neighbouring headword before this check)
REL_PATTERNS = [
    ('vn', r'v\.\s?n\.\s?fr\.\s+' + REL_ROMAN),
    ('caus', r'caus\.\s+of\s+' + REL_ROMAN),
    ('intens', r'intens\.\s+of\s+' + REL_ROMAN),
    ('pl', r'pl\.\s+of\s+\*?' + REL_ROMAN),
    ('corr', r'corr\.\s+of\s+' + REL_ROMAN),
    ('same', r'^\s*,?\s*=\s*[^a-zāīū]{0,40}?' + REL_ROMAN),
    ('fr', r'(?<!v\.n\. )(?<!v\.n\.)\bfr\.\s+' + REL_ROMAN),
]


def headword_key(ro):
    """a Roman headword with its marks, joiners and hyphens dropped: how a link's target is matched to an entry"""
    return re.sub(r"[\u0300-\u036fʻʼʿ'\-]", '', unicodedata.normalize('NFD', ro or '').lower())


def relations_of(e, headwords):
    """the entry's links whose target is itself a headword (so "to", "the" or a cut-off name never link)"""
    rel, head = [], unicodedata.normalize('NFC', (e.get('def') or '')[:220])
    for kind, pat in REL_PATTERNS:
        for m in re.finditer(pat, head):
            target = m.group(1).strip("-'*")
            if target in ('next', 'prec', 'preceding'):
                target = e.get('_next' if target == 'next' else '_prev') or ''
            if len(target) > 1 and target not in REL_NOT and target != e.get('ro') and headword_key(target) in headwords and [kind, target] not in rel:
                rel.append([kind, target])
            if kind == 'same':
                break
    return rel


def parse_fallon_page(filepath, page_num):
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        html = f.read()

    entries = []
    # <span class="new_p"> [<b>origin</b>] <hw><pa>Urdu</pa> <d>Devanagari</d> <i>roman, variants</i></hw> body </span>
    for flag, hw_html, body_html in re.findall(
            r'<span class="new_p">\s*(?:<b>(.*?)</b>)?\s*<hw>(.*?)</hw>(.*?)</span>\s*</div>', html, re.DOTALL):
        pas = re.findall(r'<pa>(.*?)</pa>', hw_html)
        ds = re.findall(r'<d>(.*?)</d>', hw_html)
        ros = re.findall(r'<i>(.*?)</i>', hw_html)

        ur = fallon_urdu(clean_fallon(pas[0])) if pas else ''
        hi = clean_fallon(ds[0]) if ds else ''
        # the first spelling only; the stress mark (chel'ā) is not part of the word
        ro = fallon_roman(re.split(r'[,;]', clean_fallon(ros[0]))[0]).replace("'", '').replace('*', '').strip() if ros else ''
        om = re.match(r'([PAHST])(?![a-z])', clean_fallon(flag or ''))   # 'Port.', 'Tel.', 'Heb.' name no origin letter
        origin = om.group(1) if om else ''

        if not ur and not ro:
            continue

        body_html = re.sub(r'<sup>.*?</sup>|<footnote>.*?</footnote>', ' ', body_html, flags=re.DOTALL)
        sub_phrases = []
        parts, last = [], 0
        for m in FALLON_PHRASE.finditer(body_html):
            if FALLON_BARE_POS.match(clean_fallon(body_html[:m.start()])):
                continue   # the feminine form after the headword's own part of speech (", n. m. <i>chelī</i>, n. f.")
            parts.append(body_html[last:m.start()])
            last = m.start()
        parts.append(body_html[last:])
        main_def = clean_fallon(parts[0]).lstrip(', ')
        for p in parts[1:]:
            pm = re.match(r'(?:[—–]\s*)?<i>([^<]+)</i>\s*,?\s*(.*)', p, re.DOTALL)
            if pm:
                sub_ro = fallon_roman(clean_fallon(pm.group(1))).replace("'", '').replace('*', '')
                sub_def = clean_fallon(pm.group(2))
                if sub_ro:
                    sub_phrases.append({'ro': sub_ro, 'def': sub_def[:160]})
        for pro, gloss in FALLON_PROVERB.findall(body_html):
            sub_phrases.append({'ro': fallon_roman(clean_fallon(pro)).replace("'", '')[:80],
                                'def': re.sub(r"\s*\d+\.\s*'?$", '', clean_fallon(gloss))[:160]})

        entries.append({
            'ur': ur,
            'hi': hi,
            'ro': ro,
            'origin': origin,
            'page': page_num,
            'dict': 'Fallon',
            'def': fallon_roman(main_def)[:300],
            'phrases': sub_phrases[:15]
        })

    return entries


def entry_priority(e):
    d = e.get('def', '').strip()
    score = 0
    if d.startswith('= ') or d.startswith('See ') or 'cf. P.' in d[:35] or 'cf. ' in d[:25]:
        score -= 50
    if len(d) > 80:
        score += 30
    elif len(d) > 40:
        score += 15
    if any(pos in d[:40] for pos in ['pron.', 's.m.', 's.f.', 'adj.', 'v.t.', 'v.i.', 'adv.']):
        score += 20
    return score


def main():
    print("Building dictionary bundle and compound phrase index...")
    html_files = sorted(glob.glob(os.path.join(CACHE_DIR, 'p_*.html')))
    if not html_files:
        print("No Platts cache files found in data/platts_cache/! Run scripts/import_platts.py first.")
        sys.exit(1)

    all_entries = {}

    for path in html_files:
        base = os.path.basename(path)
        m = re.search(r'p_(\d+)', base)
        page_num = int(m.group(1)) if m else 0
        page_entries = parse_platts_page(path, page_num)

        for i, ent in enumerate(page_entries):
            # Platts' "v.n. fr. next" / "prec.": the headword after / before this one on the page (resolved in relations_of)
            ent['_next'] = page_entries[i + 1]['ro'] if i + 1 < len(page_entries) else ''
            ent['_prev'] = page_entries[i - 1]['ro'] if i else ''
            key = (ent['ur'], ent['ro'], ent.get('origin', ''), ent.get('def', '')[:40])
            if key not in all_entries:
                all_entries[key] = ent

    print(f"Parsed {len(all_entries)} headword entries from Platts across {len(html_files)} pages.")

    fallon_files = sorted(glob.glob(os.path.join(FALLON_CACHE_DIR, 'p_*.html')))
    if not fallon_files:
        print("No Fallon cache files found in data/fallon_cache/: run scripts/import_fallon.py to add Fallon.")
    fallon_count = 0
    for path in fallon_files:
        m = re.search(r'p_(\d+)', os.path.basename(path))
        for ent in parse_fallon_page(path, int(m.group(1)) if m else 0):
            key = (ent['ur'], ent['ro'], ent.get('origin', ''), ent.get('def', '')[:40], 'Fallon')
            if key not in all_entries:
                all_entries[key] = ent
                fallon_count += 1
    print(f"Parsed {fallon_count} headword entries from Fallon across {len(fallon_files)} pages.")

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
            clean_d = clean_text(defs)[:240]
            key = (fa, ro, 'P', clean_d[:40])
            if key not in all_entries:
                all_entries[key] = {
                    'ur': fa,
                    'hi': '',
                    'ro': ro,
                    'origin': 'P',
                    'page': 0,
                    'dict': 'Steingass',
                    'def': clean_d,
                    'phrases': []
                }
                steingass_count += 1
        print(f"Added {steingass_count} Persian entries from Steingass.")


    # Format dictionary bundle as a list for export
    # Substantive definitions precede cross-reference stubs
    bundle_data = list(all_entries.values())
    linked, headwords = 0, {headword_key(e.get('ro')) for e in bundle_data}
    for e in bundle_data:
        rel = relations_of(e, headwords)
        e.pop('_next', None)
        e.pop('_prev', None)
        if rel:
            e['rel'] = rel
            linked += 1
    print(f"Linked {linked} entries to the words they come from (rel).")
    bundle_data.sort(key=lambda e: (-entry_priority(e), e.get('page', 0)))
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
