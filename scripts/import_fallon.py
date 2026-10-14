#!/usr/bin/env python3
"""
scripts/import_fallon.py

S. W. Fallon, A New Hindustani-English Dictionary (1879, public domain).
Every headword with its Urdu script (<pa>), Devanagari script (<d>) and Roman transliteration with diacritics (<i>,
stress marked with an apostrophe: chel'ā), then part of speech, etymology, definition, proverbs and phrases.

Source: The Digital Dictionaries of South Asia (DSAL) at the University of Chicago
(https://dsal.uchicago.edu/dictionaries/fallon/).
Fetches pages 1 to 1216 into data/fallon_cache/p_XXXX.html (gitignored), which scripts/build_dictionary_bundle.py parses
into data/dictionary_bundle.json.gz: the one dictionary bundle the app and the build scripts read.

Usage:
  python3 scripts/import_fallon.py [--pages N] [--workers W]
"""
import argparse, concurrent.futures, os, sys, time, urllib.request

ROOT = os.path.join(os.path.dirname(__file__), '..')
CACHE_DIR = os.path.join(ROOT, 'data', 'fallon_cache')
BASE_URL = 'https://dsal.uchicago.edu/cgi-bin/app/fallon_query.py?page={page}'
TOTAL_PAGES = 1216


def fetch_page(page, session_headers):
    cache_file = os.path.join(CACHE_DIR, f'p_{page:04d}.html')
    if os.path.exists(cache_file) and os.path.getsize(cache_file) > 500:
        with open(cache_file, 'r', encoding='utf-8', errors='ignore') as f:
            return page, f.read()

    url = BASE_URL.format(page=page)
    req = urllib.request.Request(url, headers=session_headers)
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                content = r.read().decode('utf-8', errors='ignore')
                if len(content) > 500:
                    with open(cache_file, 'w', encoding='utf-8') as f:
                        f.write(content)
                    return page, content
        except Exception as e:
            if attempt == 3:
                print(f"Error fetching page {page}: {e}", file=sys.stderr)
                return page, ""
            time.sleep(1.0 * (attempt + 1))
    return page, ""


def main():
    parser = argparse.ArgumentParser(description="Import Fallon dictionary from DSAL")
    parser.add_argument('--pages', type=int, default=TOTAL_PAGES, help="Total pages to scrape (default 1216)")
    parser.add_argument('--workers', type=int, default=4, help="Concurrent workers (default 4)")
    args = parser.parse_args()

    os.makedirs(CACHE_DIR, exist_ok=True)
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) urdu-bahr academic linguistics tool (github.com/vishaalkk/urdu-bahr)'
    }

    print(f"Fetching {args.pages} pages with {args.workers} workers...")
    page_data = {}

    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {executor.submit(fetch_page, p, headers): p for p in range(1, args.pages + 1)}
        done_count = 0
        for future in concurrent.futures.as_completed(futures):
            p, html = future.result()
            done_count += 1
            if html:
                page_data[p] = html
            if done_count % 100 == 0 or done_count == args.pages:
                print(f"  [{done_count}/{args.pages}] pages fetched (cached: {len(page_data)})")

    print(f"{len(page_data)} pages cached in {os.path.relpath(CACHE_DIR, ROOT)}: now run scripts/build_dictionary_bundle.py")


if __name__ == '__main__':
    main()
