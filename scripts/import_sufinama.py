#!/usr/bin/env python3
"""
scripts/import_sufinama.py

Scrapes target poems from Sufinama across the 7 categories requested:
1. Ameer Minai (video kalaams)
2. Zaheen Shah Taji (ghazals)
3. Bedam Shah Warsi (kalaam)
4. Jami (persian-kalam)
5. Bu Ali Shah Qalandar (persian-kalam)
6. Amir Khusrau (persian-kalam)
7. Amir Khusrau (ghazals from kalaam)

Extracts exact 3-script aligned lines (Urdu, Hindi, Roman).
Saves to data/sufinama_ghazals.json.
"""

import urllib.request
import re
import html as html_lib
import json
import os
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
MANIFEST_PATH = os.path.join(DATA_DIR, 'sufinama_manifest.json')
OUT_PATH = os.path.join(DATA_DIR, 'sufinama_ghazals.json')

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
}

POET_METADATA = {
    'ameer_meenai': {'name': 'Ameer Meenai', 'full': 'Ameer Meenai', 'ur': 'امیر مینائی', 'hi': 'अमीर मीनाई'},
    'zaheen': {'name': 'Zaheen', 'full': 'Zaheen Shah Taji', 'ur': 'ذہین شاہ تاجی', 'hi': 'ज़हीन शाह ताजी'},
    'bedam': {'name': 'Bedam', 'full': 'Bedam Shah Warsi', 'ur': 'بیدم شاہ وارثی', 'hi': 'बेदम शाह वारसी'},
    'jami': {'name': 'Jami', 'full': 'Nur al-Din Abd al-Rahman Jami', 'ur': 'جامی', 'hi': 'जामी'},
    'bu_ali': {'name': 'Bu Ali', 'full': 'Bu Ali Shah Qalandar', 'ur': 'بو علی شاہ قلندر', 'hi': 'बू علی शाह क़لंदर'},
    'khusrau_persian': {'name': 'Amir Khusrau', 'full': 'Hazrat Amir Khusrau (Persian)', 'ur': 'امیر خسرو (فارسی)', 'hi': 'अमीर ख़ुसरो (फ़ारसी)'},
    'khusrau_urdu': {'name': 'Amir Khusrau', 'full': 'Hazrat Amir Khusrau', 'ur': 'امیر خسرو', 'hi': 'अमीर ख़ुसरो'},
    # Sufinama's top 100 Persian qawwali (2026-10-08): category fa_<poet key in build_poets.py>
    'fa_hafiz': {'name': 'Hafiz', 'full': 'Hafiz Shirazi'},
    'fa_rumi': {'name': 'Rumi', 'full': 'Maulana Jalaluddin Rumi'},
    'fa_saadi': {'name': 'Saadi', 'full': 'Saadi Shirazi'},
    'fa_iraqi': {'name': 'Iraqi', 'full': 'Fakhruddin Iraqi'},
    'fa_hasan_sijzi': {'name': 'Hasan Sijzi', 'full': 'Amir Hasan Ala Sijzi'},
    'fa_ahmad_jam': {'name': 'Ahmad Jam', 'full': 'Shaikh Ahmad Jam'},
    'fa_nizamuddin': {'name': 'Nizamuddin Auliya', 'full': 'Hazrat Nizamuddin Auliya'},
    'fa_sabir': {'name': 'Sabir Kaliyari', 'full': 'Alauddin Ali Ahmad Sabir'},
    'fa_jilani': {'name': 'Abdul Qadir Jilani', 'full': 'Shaikh Abdul Qadir Jilani'},
    'fa_lal_shahbaz': {'name': 'Lal Shahbaz Qalandar', 'full': 'Lal Shahbaz Qalandar'},
    'fa_bahlol': {'name': 'Bahlol Dana', 'full': 'Bahlol Dana'},
    'fa_ghalib_farsi': {'name': 'Ghalib (Persian)', 'full': 'Mirza Ghalib'},
    'fa_qateel_mirza': {'name': 'Mirza Qateel', 'full': 'Mirza Muhammad Hasan Qateel'},
    'fa_shah_niyaz': {'name': 'Shah Niyaz', 'full': 'Shah Niyaz Ahmad Barelvi'},
    'fa_anonymous_fa': {'name': 'Anonymous', 'full': 'Unknown (qawwali tradition)'},
    'fa_jigar': {'name': 'Jigar', 'full': 'Jigar Moradabadi'},
    'fa_ashrafi': {'name': 'Ashrafi', 'full': 'Hakeem Nazr Ashraf Ashrafi'},
    'fa_shams_mashriqi': {'name': 'Shams Mashriqi', 'full': 'Shams Mashriqi'},
    'fa_saudagar': {'name': 'Shah Siddique Saudagar', 'full': 'Shah Siddique Saudagar'},
    'fa_muneer': {'name': 'Muneer', 'full': 'Muneer (qawwali tradition)'},
}
# Kalaam in Persian; a ghazal's lines are tagged `lang` by scripts/scan_sufinama.js (girah lines may be Urdu)
PERSIAN_CATEGORIES = {'jami', 'bu_ali', 'khusrau_persian'}
is_persian = lambda c: c in PERSIAN_CATEGORIES or c.startswith('fa_')


def crawled_meta(category):
    """a poet found by scripts/crawl_sufinama_persian.py: its name as Sufinama gives it"""
    path = os.path.join(DATA_DIR, 'sufinama_poets.json')
    names = json.load(open(path, encoding='utf-8')) if os.path.exists(path) else {}
    key = category[3:] if category.startswith('fa_') else category
    name = (names.get(key) or {}).get('name') or key.replace('_', ' ').title()
    return {'name': name, 'full': name}


def fetch_url(url, retries=3):
    req = urllib.request.Request(url, headers=HEADERS)
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=12) as resp:
                return resp.read().decode('utf-8', errors='ignore')
        except Exception as e:
            if attempt == retries - 1:
                return ''
            time.sleep(1.0 * (attempt + 1))
    return ''


def extract_lines(html):
    couplets = re.findall(r"<div class=[\x27\x22]c[\x27\x22][^>]*>(.*?)</div>", html, re.DOTALL)
    lines = []
    for c in couplets:
        ps = re.findall(r"<p[^>]*>(.*?)</p>", c, re.DOTALL)
        for p in ps:
            clean = html_lib.unescape(re.sub(r"<[^>]+>", "", p)).strip()
            if clean:
                lines.append(clean)
    return lines


def process_poem(category, url):
    ur_html = fetch_url(url + '?lang=ur')
    ur_lines = extract_lines(ur_html)
    if not ur_lines:
        return None

    hi_html = fetch_url(url + '?lang=hi')
    hi_lines = extract_lines(hi_html)

    ro_html = fetch_url(url)
    ro_all = extract_lines(ro_html)
    ro_lines = ro_all[:len(ur_lines)] if len(ro_all) >= len(ur_lines) else ro_all

    lines = []
    for i in range(len(ur_lines)):
        lines.append({
            'ur': ur_lines[i],
            'hi': hi_lines[i] if i < len(hi_lines) else '',
            'ro': ro_lines[i] if i < len(ro_lines) else ''
        })

    meta = POET_METADATA.get(category) or crawled_meta(category)

    return {
        'category': category,
        'lang': 'fa' if is_persian(category) else 'ur',
        'poet': meta['name'],
        'poet_full': meta['full'],
        'url': url,
        'lines_count': len(lines),
        'lines': lines
    }


def main():
    with open(MANIFEST_PATH, encoding='utf-8') as f:
        manifest = json.load(f)

    existing = {}
    if os.path.exists(OUT_PATH):
        try:
            with open(OUT_PATH, encoding='utf-8') as f:
                data = json.load(f)
                for item in data:
                    existing[item['url']] = item
        except Exception:
            existing = {}

    to_fetch = []
    for cat, urls in manifest.items():
        for url in urls:
            if url not in existing:
                to_fetch.append((cat, url))

    print(f"Total manifest URLs: {sum(len(v) for v in manifest.values())}")
    print(f"Already scraped: {len(existing)}. To scrape: {len(to_fetch)}")

    if to_fetch:
        results = []
        with ThreadPoolExecutor(max_workers=5) as executor:
            future_to_url = {executor.submit(process_poem, cat, url): (cat, url) for cat, url in to_fetch}
            done = 0
            for future in as_completed(future_to_url):
                cat, url = future_to_url[future]
                done += 1
                try:
                    res = future.result()
                    if res:
                        results.append(res)
                        print(f"[{done}/{len(to_fetch)}] Success: {cat} -> {res['lines'][0]['ro'][:40]}")
                    else:
                        print(f"[{done}/{len(to_fetch)}] Warning: No lines extracted for {url}")
                except Exception as e:
                    print(f"[{done}/{len(to_fetch)}] Error on {url}: {e}")

        for r in results:
            existing[r['url']] = r

    # Save ordered by category
    final_list = []
    for cat, urls in manifest.items():
        for url in urls:
            if url in existing:
                final_list.append(existing[url])

    with open(OUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(final_list, f, indent=2, ensure_ascii=False)

    print(f"\nSaved {len(final_list)} poems to {OUT_PATH}")


if __name__ == '__main__':
    main()
