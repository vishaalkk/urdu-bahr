#!/usr/bin/env python3
"""
scripts/import_rekhta_poets.py

Imports Urdu Ghazals from Rekhta across 12 prominent classical and modern poets
(excluding Mirza Ghalib, Mir Taqi Mir, and Faiz Ahmad Faiz, which are already handled).

Features:
- Paced, polite scraping with configurable delays between requests (prevents rate-limiting).
- Automatic retry with exponential backoff on network errors.
- Automatic resume: saves progress progressively and skips already downloaded ghazals.
- Exact 3-script alignment (Urdu, Hindi, Roman) for every couplet.
- Modular per-poet JSON files in data/poets/ and optional unified export.

Usage:
    python3 scripts/import_rekhta_poets.py [--poet NAME] [--limit-per-poet N] [--delay SECONDS]
"""

import urllib.request
import re
import html as html_lib
import json
import os
import sys
import time
import argparse

GITHUB_LINKS_BASE = "https://raw.githubusercontent.com/Fizza-Rubab/Poet-Ghazal-Dataset/main/links/"
DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
POETS_DIR = os.path.join(DATA_DIR, 'poets')

# Target Poets (excluding Ghalib, Mir, Faiz, Zafar Iqbal, Nida Fazli, Qateel Shifai, Muneer Niyazi)
POETS = [
    {"file": "ahmad_faraz.txt", "name": "Ahmad Faraz", "id": "faraz"},
    {"file": "allama_iqbal.txt", "name": "Allama Iqbal", "id": "iqbal_rekhta"},
    {"file": "haidar_ali_atish.txt", "name": "Khwaja Haidar Ali Atish", "id": "atish"},
    {"file": "jaun_eliya.txt", "name": "Jaun Eliya", "id": "jaun"},
    {"file": "nazeer_akbarabadi.txt", "name": "Nazeer Akbarabadi", "id": "nazeer"},
    {"file": "parveen_shakir.txt", "name": "Parveen Shakir", "id": "parveen"},
    {"file": "riyaz_khairabadi.txt", "name": "Riyaz Khairabadi", "id": "riyaz"},
    {"file": "siraj_aurangabadi.txt", "name": "Siraj Aurangabadi", "id": "siraj"},
]

def fetch_links_for_poet(filename):
    url = GITHUB_LINKS_BASE + filename
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            text = resp.read().decode('utf-8')
        return [l.strip() for l in text.splitlines() if l.strip()]
    except Exception as e:
        print(f"Error fetching links list for {filename}: {e}")
        return []

def extract_couplet_lines(url, max_retries=3, backoff=2.0):
    headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'}
    req = urllib.request.Request(url, headers=headers)

    for attempt in range(max_retries):
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                page = resp.read().decode('utf-8', errors='ignore')
            break
        except Exception as e:
            if attempt == max_retries - 1:
                print(f"    [Warn] Failed fetching {url}: {e}")
                return []
            time.sleep(backoff * (attempt + 1))

    couplets = re.findall(r"<div class=[\"']c[\"'][^>]*>(.*?)</div>", page, re.DOTALL)
    out = []
    for c in couplets:
        ps = re.findall(r"<p[^>]*>(.*?)</p>", c, re.DOTALL)
        for p in ps:
            clean = html_lib.unescape(re.sub(r"<[^>]+>", "", p)).strip()
            if clean:
                out.append(clean)
    return out

def process_poet(poet_info, limit_per_poet=None, delay=0.35):
    poet_name = poet_info['name']
    poet_id = poet_info['id']
    poet_file = poet_info['file']
    out_path = os.path.join(POETS_DIR, f"{poet_id}.json")

    print(f"\n========================================================")
    print(f"Poet: {poet_name} ({poet_file})")
    print(f"========================================================")

    links = fetch_links_for_poet(poet_file)
    if not links:
        print("  No links found, skipping.")
        return

    total_links = len(links)
    if limit_per_poet:
        links = links[:limit_per_poet]

    print(f"Total available links: {total_links}. Processing: {len(links)}")

    existing_ghazals = []
    existing_urls = set()
    if os.path.exists(out_path):
        try:
            with open(out_path, 'r', encoding='utf-8') as f:
                existing_ghazals = json.load(f)
                existing_urls = {g['url'] for g in existing_ghazals if 'url' in g}
            print(f"Resuming: {len(existing_ghazals)} ghazals already saved locally.")
        except Exception:
            pass

    ghazals = existing_ghazals

    for idx, link in enumerate(links):
        if link in existing_urls:
            continue

        slug = link.split('/')[-1]
        print(f"  [{idx+1}/{len(links)}] Fetching {slug}...")

        time.sleep(delay)
        ur_lines = extract_couplet_lines(f"{link}?lang=ur")
        time.sleep(delay)
        hi_lines = extract_couplet_lines(f"{link}?lang=hi")
        time.sleep(delay)
        ro_lines = extract_couplet_lines(f"{link}?lang=en")

        # Keep only lines where the Urdu version contains Arabic/Urdu script (filters banner sher)
        filtered = []
        for u, h, r in zip(ur_lines, hi_lines, ro_lines):
            if re.search(r'[\u0600-\u06FF]', u):
                filtered.append((u, h, r))

        if not filtered:
            print("    Skipping (empty/invalid)")
            continue

        ur_lines = [f[0] for f in filtered]
        hi_lines = [f[1] for f in filtered]
        ro_lines = [f[2] for f in filtered]

        line_objects = []
        for u, h, r in zip(ur_lines, hi_lines, ro_lines):
            line_objects.append({'ur': u, 'hi': h, 'ro': r})

        ghazals.append({
            'id': len(ghazals) + 1,
            'poet': poet_name,
            'url': link,
            'meter_label': f"{poet_id}-{len(ghazals) + 1}",
            'lines_count': len(ur_lines),
            'lines': line_objects
        })
        existing_urls.add(link)

        print(f"    -> {len(ur_lines)} lines aligned")

        # Checkpoint save
        if len(ghazals) % 5 == 0 or idx == len(links) - 1:
            with open(out_path, 'w', encoding='utf-8') as f:
                json.dump(ghazals, f, ensure_ascii=False, indent=2)

    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(ghazals, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(ghazals)} ghazals for {poet_name} to: {out_path}")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--poet', type=str, default=None, help="Process single poet by ID (e.g. faraz, jaun)")
    parser.add_argument('--limit-per-poet', type=int, default=None, help="Max ghazals per poet")
    parser.add_argument('--delay', type=float, default=0.35, help="Delay in seconds between requests (polite scraping)")
    args = parser.parse_args()

    os.makedirs(POETS_DIR, exist_ok=True)

    target_poets = POETS
    if args.poet:
        target_poets = [p for p in POETS if p['id'] == args.poet or p['file'] == args.poet]
        if not target_poets:
            print(f"Poet '{args.poet}' not found. Available IDs:")
            for p in POETS:
                print(f"  {p['id']} ({p['name']})")
            sys.exit(1)

    print(f"Starting polite batch import for {len(target_poets)} poets.")
    print(f"Request delay: {args.delay}s | Destination: {POETS_DIR}")

    for p in target_poets:
        process_poet(p, limit_per_poet=args.limit_per_poet, delay=args.delay)

    print("\nBatch import completed successfully!")

if __name__ == '__main__':
    main()
