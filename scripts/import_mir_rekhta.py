#!/usr/bin/env python3
"""
scripts/import_mir_rekhta.py

Scrapes Mir Taqi Mir's ghazals from Rekhta across 3 scripts (Urdu, Hindi, Roman)
using the URL list from:
https://raw.githubusercontent.com/Fizza-Rubab/Poet-Ghazal-Dataset/main/links/mir_taqi_mir.txt

Saves the aligned scraped ghazals to data/poets/mir.json.
Features:
- Accurate extraction from Rekhta's HtmlRawText data attribute
- Exact 3-script alignment (Urdu, Hindi, diacritic Roman)
- Resumable: skips already downloaded URLs and saves checkpoints
- Polite pacing with configurable delay and retry logic
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

LINKS_URL = "https://raw.githubusercontent.com/Fizza-Rubab/Poet-Ghazal-Dataset/main/links/mir_taqi_mir.txt"
DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
POETS_DIR = os.path.join(DATA_DIR, 'poets')
OUT_FILE = os.path.join(POETS_DIR, 'mir.json')

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

def fetch_links():
    req = urllib.request.Request(LINKS_URL, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=15) as resp:
        text = resp.read().decode('utf-8')
    return [l.strip() for l in text.splitlines() if l.strip()]

def fetch_page(url, max_retries=4, backoff=1.5):
    req = urllib.request.Request(url, headers=HEADERS)
    for attempt in range(max_retries):
        try:
            with urllib.request.urlopen(req, timeout=12) as resp:
                return resp.read().decode('utf-8', errors='ignore')
        except Exception as e:
            if attempt == max_retries - 1:
                print(f"    [Error] Failed fetching {url}: {e}")
                return None
            time.sleep(backoff * (attempt + 1))
    return None

def extract_couplet_lines(page_html, lang='ur'):
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
            # remove soft hyphens and zero-width chars
            clean = re.sub(r'[\u200b\u200c\u200d\uFEFF\u00AD]', '', clean).strip()
            if clean:
                out.append(clean)
    return out

def scrape_single_ghazal(link, delay=0.25):
    time.sleep(delay)
    ur_html = fetch_page(f"{link}?lang=ur")
    time.sleep(delay)
    hi_html = fetch_page(f"{link}?lang=hi")
    time.sleep(delay)
    ro_html = fetch_page(f"{link}?lang=en")

    ur_lines = extract_couplet_lines(ur_html, 'ur')
    hi_lines = extract_couplet_lines(hi_html, 'hi')
    ro_lines = extract_couplet_lines(ro_html, 'en')

    # If line counts differ, try to align up to min length or reject
    if not (len(ur_lines) == len(hi_lines) == len(ro_lines) and len(ur_lines) > 0):
        print(f"    [Mismatch] {link.split('/')[-1]}: ur={len(ur_lines)}, hi={len(hi_lines)}, ro={len(ro_lines)}")
        if min(len(ur_lines), len(hi_lines), len(ro_lines)) >= 2:
            min_len = min(len(ur_lines), len(hi_lines), len(ro_lines))
            min_len -= (min_len % 2) # keep even
            ur_lines = ur_lines[:min_len]
            hi_lines = hi_lines[:min_len]
            ro_lines = ro_lines[:min_len]
        else:
            return None

    line_objs = []
    for u, h, r in zip(ur_lines, hi_lines, ro_lines):
        line_objs.append({'ur': u, 'hi': h, 'ro': r})

    return {
        'url': link,
        'poet': 'Mir Taqi Mir',
        'lines_count': len(line_objs),
        'lines': line_objs
    }

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--limit', type=int, default=None, help="Max ghazals to process")
    parser.add_argument('--delay', type=float, default=0.2, help="Delay between requests")
    parser.add_argument('--workers', type=int, default=3, help="Concurrent workers")
    args = parser.parse_args()

    os.makedirs(POETS_DIR, exist_ok=True)

    links = fetch_links()
    print(f"Total links fetched from repository: {len(links)}")

    existing = []
    seen_urls = set()
    if os.path.exists(OUT_FILE):
        try:
            with open(OUT_FILE, 'r', encoding='utf-8') as f:
                existing = json.load(f)
                seen_urls = {g['url'] for g in existing if 'url' in g}
            print(f"Resuming: {len(existing)} ghazals already saved in {OUT_FILE}.")
        except Exception as e:
            print(f"Error reading existing file: {e}")

    todo_links = [l for l in links if l not in seen_urls]
    if args.limit:
        todo_links = todo_links[:args.limit]

    print(f"Links remaining to scrape: {len(todo_links)}")
    if not todo_links:
        print("All requested links already downloaded.")
        return

    results = list(existing)
    lock_save = False

    def save_checkpoint():
        # Sort by original links index for consistency
        link_order = {l: i for i, l in enumerate(links)}
        results.sort(key=lambda x: link_order.get(x['url'], 99999))
        for idx, g in enumerate(results):
            g['id'] = idx + 1
        with open(OUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)

    total = len(todo_links)
    completed = 0

    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        future_to_link = {executor.submit(scrape_single_ghazal, link, args.delay): link for link in todo_links}
        for future in as_completed(future_to_link):
            link = future_to_link[future]
            completed += 1
            slug = link.split('/')[-1]
            try:
                res = future.result()
                if res:
                    results.append(res)
                    print(f"[{completed}/{total}] Success: {slug} ({res['lines_count']} lines)")
                else:
                    print(f"[{completed}/{total}] Skipped: {slug}")
            except Exception as e:
                print(f"[{completed}/{total}] Exception on {slug}: {e}")

            if completed % 10 == 0 or completed == total:
                save_checkpoint()
                print(f"  --> Checkpoint: {len(results)} total saved.")

    save_checkpoint()
    print(f"\nFinished! Total ghazals saved: {len(results)} to {OUT_FILE}")

if __name__ == '__main__':
    main()
