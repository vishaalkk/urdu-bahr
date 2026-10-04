#!/usr/bin/env python3
"""
scripts/import_columbia_group.py

Scrapes ghazals curated on https://www.columbiaurdupoetrygroup.com/
Excludes:
- Mirza Ghalib and Mir Taqi Mir (already comprehensively handled)
- Nazms (non-couplet or non-ghazal forms)

Sources supported:
1. Rekhta (https://www.rekhta.org/ghazals/...)
2. Urdushahkar (https://urdushahkar.org/...)

Outputs:
data/columbia_ghazals.json
"""

import urllib.request
import re
import html as html_lib
import json
import os
import sys
import time
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
OUT_FILE = os.path.join(DATA_DIR, 'columbia_ghazals.json')

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

def fetch_columbia_index():
    url = "https://www.columbiaurdupoetrygroup.com/"
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=15) as resp:
        html = resp.read().decode('utf-8')
    m = re.search(r'const searchData = (\[.*?\]);', html, re.DOTALL)
    if not m:
        raise RuntimeError("Could not find searchData on columbiaurdupoetrygroup.com")
    all_poems = json.loads(m.group(1))
    
    # Filter out Ghalib and Mir Taqi Mir
    filtered = [p for p in all_poems if p['poet'] not in ('Ghalib', 'Mir Taqi Mir')]
    return filtered

def fetch_poem_links(poem_info):
    url = "https://www.columbiaurdupoetrygroup.com" + poem_info['slug']
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            page = resp.read().decode('utf-8', errors='ignore')
        all_ext = re.findall(r'href=[\"\'](https?://[^\"\']+)[\"\']', page)
        r_links = [re.sub(r'[\)\]\"\'\s]+$', '', l) for l in all_ext if 'rekhta.org' in l]
        s_links = [re.sub(r'[\)\]\"\'\s]+$', '', l) for l in all_ext if 'urdushahkar.org' in l]
        return {
            'poet': poem_info['poet'],
            'title': poem_info['title'],
            'columbia_url': url,
            'rekhta_links': r_links,
            'shahkar_links': s_links
        }
    except Exception as e:
        print(f"  [Warn] Failed fetching {url}: {e}")
        return None

def fetch_page(url, max_retries=3, backoff=1.5):
    req = urllib.request.Request(url, headers=HEADERS)
    for attempt in range(max_retries):
        try:
            with urllib.request.urlopen(req, timeout=12) as resp:
                return resp.read().decode('utf-8', errors='ignore')
        except Exception as e:
            if attempt == max_retries - 1:
                return None
            time.sleep(backoff * (attempt + 1))
    return None

def extract_rekhta_couplet_lines(page_html, lang='ur'):
    if not page_html:
        return []
    m = re.search(r'id=[\"\']HtmlRawText[\"\'][^>]*data-html=[\"\'](.*?)[\"\']', page_html)
    if not m:
        return []
    raw_html = html_lib.unescape(m.group(1))
    if lang == 'en':
        off_match = re.search(r"<div class=['\"]pMC['\"][^>]*data-roman=['\"]off['\"][^>]*>(.*?)(?:<div class=['\"]pMC['\"]|$)", raw_html, re.DOTALL)
        if off_match:
            raw_html = off_match.group(1)
    couplets = re.findall(r"<div class=['\"]c['\"][^>]*>(.*?)</div>", raw_html, re.DOTALL)
    out = []
    for c in couplets:
        for p in re.findall(r"<p[^>]*>(.*?)</p>", c, re.DOTALL):
            clean = html_lib.unescape(re.sub(r"<[^>]+>", "", p)).strip()
            clean = re.sub(r'[\u200b\u200c\u200d\uFEFF\u00AD]', '', clean).strip()
            if clean:
                out.append(clean)
    return out

def scrape_rekhta_ghazal(url, delay=0.2):
    time.sleep(delay)
    clean_url = url.split('?')[0]
    ur_html = fetch_page(f"{clean_url}?lang=ur")
    time.sleep(delay)
    hi_html = fetch_page(f"{clean_url}?lang=hi")
    time.sleep(delay)
    ro_html = fetch_page(f"{clean_url}?lang=en")

    ur_lines = extract_rekhta_couplet_lines(ur_html, 'ur')
    hi_lines = extract_rekhta_couplet_lines(hi_html, 'hi')
    ro_lines = extract_rekhta_couplet_lines(ro_html, 'en')

    if not (len(ur_lines) == len(hi_lines) == len(ro_lines) and len(ur_lines) >= 6):
        min_len = min(len(ur_lines), len(hi_lines), len(ro_lines))
        min_len -= (min_len % 2)
        if min_len >= 6:
            ur_lines = ur_lines[:min_len]
            hi_lines = hi_lines[:min_len]
            ro_lines = ro_lines[:min_len]
        else:
            return None

    line_objs = []
    for u, h, r in zip(ur_lines, hi_lines, ro_lines):
        line_objs.append({'ur': u, 'hi': h, 'ro': r})

    return line_objs

def extract_shahkar_lines(tab_html):
    if not tab_html:
        return []
    clean = re.sub(r'<br\s*/?>', '\n', tab_html)
    ps = re.findall(r'<p[^>]*>(.*?)</p>', clean, re.DOTALL)
    out = []
    for p in ps:
        for l in re.sub(r'<[^>]+>', '', p).split('\n'):
            l = html_lib.unescape(l).replace('\xa0', ' ').strip()
            # Exclude digits across Urdu, Devanagari, and ASCII
            if l and not re.match(r'^[۰-۹0-9०-९\s\.\-]+$', l):
                out.append(l)
    return out[1:] if len(out) > 1 else []

def scrape_shahkar_ghazal(url):
    page = fetch_page(url)
    if not page:
        return None
    m1 = re.search(r'id=[\"\']wptabsy-content-1[\"\']>(.*?)</div>\s*<div class=[\"\']wptabsy-content', page, re.DOTALL)
    m2 = re.search(r'id=[\"\']wptabsy-content-2[\"\']>(.*?)</div>\s*<div class=[\"\']wptabsy-content', page, re.DOTALL)
    m3 = re.search(r'id=[\"\']wptabsy-content-3[\"\']>(.*?)</div>\s*<div class=[\"\']wptabsy-content', page, re.DOTALL)

    if not m1 or not m2:
        return None

    ur_lines = extract_shahkar_lines(m1.group(1))
    hi_lines = extract_shahkar_lines(m2.group(1))

    if len(ur_lines) != len(hi_lines) or len(ur_lines) < 6 or len(ur_lines) % 2 != 0:
        return None

    # Roman lines from Tab 3 (tooltip-classic-item)
    ro_lines = []
    if m3:
        items = re.findall(r'<span[^>]*class=[\"\']tooltip-classic-item[\"\'][^>]*>(.*?)</span>', m3.group(1), re.DOTALL)
        for it in items[1:]:
            clean = re.sub(r'<sup[^>]*>.*?</sup>', '', it)
            clean = html_lib.unescape(clean).replace('\xa0', ' ').strip()
            sub_lines = [re.sub(r'<[^>]+>', '', l).strip() for l in clean.splitlines() if re.sub(r'<[^>]+>', '', l).strip()]
            ro_lines.extend(sub_lines)

    if len(ro_lines) != len(ur_lines):
        ro_lines = [''] * len(ur_lines)

    line_objs = []
    for u, h, r in zip(ur_lines, hi_lines, ro_lines):
        line_objs.append({'ur': u, 'hi': h, 'ro_guidance': r})

    return line_objs

def is_ghazal_rhyme(lines):
    """Verifies that lines adhere to ghazal rhyme structure (AA, BA, CA...)."""
    if len(lines) < 6 or len(lines) % 2 != 0:
        return False
    
    marks = re.compile(r'[\u064B-\u065F\u0670\u0651\u0654\u0614]')
    def clean(s):
        s = marks.sub('', s).replace('ي', 'ی').replace('ى', 'ی').replace('ك', 'ک').replace('ه', 'ہ')
        words = re.sub(r'[^ء-ۿ\s]', '', s).split()
        return words[-1] if words else ''

    c0_l0 = clean(lines[0]['ur'])
    c0_l1 = clean(lines[1]['ur'])

    has_matla_match = (c0_l0 == c0_l1) or (len(c0_l0) >= 2 and len(c0_l1) >= 2 and c0_l0[-2:] == c0_l1[-2:])
    
    if not has_matla_match:
        return False

    couplets_count = len(lines) // 2
    matches = 0
    for i in range(1, couplets_count):
        end_word = clean(lines[2 * i + 1]['ur'])
        if end_word == c0_l1 or (len(end_word) >= 2 and len(c0_l1) >= 2 and end_word[-2:] == c0_l1[-2:]):
            matches += 1

    return (matches / (couplets_count - 1)) >= 0.55

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--workers', type=int, default=6, help="Concurrent workers")
    args = parser.parse_args()

    print("Fetching non-Mir, non-Ghalib poem list from Columbia Urdu Poetry Group...")
    poems = fetch_columbia_index()
    print(f"Total candidate poems: {len(poems)}")

    print("Extracting external links from poem pages...")
    with ThreadPoolExecutor(max_workers=8) as ex:
        all_info = [r for r in ex.map(fetch_poem_links, poems) if r]

    targets = []
    seen_urls = set()

    for p in all_info:
        for l in p['rekhta_links']:
            clean_l = l.split('?')[0]
            if '/ghazals/' in clean_l and clean_l not in seen_urls:
                seen_urls.add(clean_l)
                targets.append({
                    'type': 'rekhta',
                    'poet': p['poet'],
                    'title': p['title'],
                    'url': clean_l,
                    'columbia_url': p['columbia_url']
                })
        
        for l in p['shahkar_links']:
            clean_l = l.split('?')[0]
            if clean_l not in seen_urls:
                seen_urls.add(clean_l)
                targets.append({
                    'type': 'shahkar',
                    'poet': p['poet'],
                    'title': p['title'],
                    'url': clean_l,
                    'columbia_url': p['columbia_url']
                })

    print(f"Total unique poetry targets to inspect/scrape: {len(targets)}")

    existing_by_url = {}
    if os.path.exists(OUT_FILE):
        try:
            with open(OUT_FILE, 'r', encoding='utf-8') as f:
                for g in json.load(f):
                    existing_by_url[g['url']] = g
        except Exception:
            pass

    scraped_ghazals = []
    
    def process_target(t):
        if t['url'] in existing_by_url:
            return existing_by_url[t['url']]
        if t['type'] == 'rekhta':
            lines = scrape_rekhta_ghazal(t['url'])
        else:
            lines = scrape_shahkar_ghazal(t['url'])

        if not lines:
            return None
        
        if not is_ghazal_rhyme(lines):
            return None

        return {
            'poet': t['poet'],
            'title': t['title'],
            'source_site': t['type'],
            'url': t['url'],
            'columbia_url': t['columbia_url'],
            'lines_count': len(lines),
            'couplets_count': len(lines) // 2,
            'lines': lines
        }

    completed = 0
    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        futures = {ex.submit(process_target, t): t for t in targets}
        for f in as_completed(futures):
            t = futures[f]
            completed += 1
            res = f.result()
            slug = t['url'].split('/')[-1] or t['url'].split('/')[-2]
            if res:
                scraped_ghazals.append(res)
                print(f"[{completed}/{len(targets)}] Kept Ghazal: {res['poet']} ({res['source_site']}) - {slug} ({res['couplets_count']} cpls)")
            else:
                print(f"[{completed}/{len(targets)}] Excluded/Nazm: {t['poet']} ({t['type']}) - {slug}")

    scraped_ghazals.sort(key=lambda g: (g['poet'], g['title']))
    for idx, g in enumerate(scraped_ghazals):
        g['id'] = idx + 1

    os.makedirs(DATA_DIR, exist_ok=True)
    with open(OUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(scraped_ghazals, f, ensure_ascii=False, indent=2)

    total_lines = sum(g['lines_count'] for g in scraped_ghazals)
    print(f"\n==============================================")
    print(f"Scrape Complete!")
    print(f"Total Ghazals Kept: {len(scraped_ghazals)}")
    print(f"Total Lines: {total_lines} ({total_lines // 2} couplets)")
    print(f"Saved to: {OUT_FILE}")
    print(f"==============================================")

if __name__ == '__main__':
    main()
