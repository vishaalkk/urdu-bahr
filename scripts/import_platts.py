#!/usr/bin/env python3
"""
scripts/import_platts.py

John T. Platts, A Dictionary of Urdu, Classical Hindi, and English (1884, public domain).
Every headword with its Urdu/Perso-Arabic script (<pa>), Devanagari script (<d>),
and Roman transliteration with diacritics (<i>), short vowels and etymology (<entry>).

Source: The Digital Dictionaries of South Asia (DSAL) at the University of Chicago
(https://dsal.uchicago.edu/dictionaries/platts/).
Pages 1 to 1254 are cached locally in data/platts_cache/p_XXXX.html (gitignored).
Writes:
  data/ur_platts.tsv: urdu<TAB>hindi<TAB>roman<TAB>origin<TAB>page

Usage:
  python3 scripts/import_platts.py [--pages N] [--workers W]
"""
import argparse, concurrent.futures, os, re, sys, time, urllib.request

ROOT = os.path.join(os.path.dirname(__file__), '..')
CACHE_DIR = os.path.join(ROOT, 'data', 'platts_cache')
OUT_TSV = os.path.join(ROOT, 'data', 'ur_platts.tsv')
BASE_URL = 'https://dsal.uchicago.edu/cgi-bin/app/platts_query.py?page={page}'
TOTAL_PAGES = 1254


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


def parse_page_html(html, page):
    """Extract (urdu, hindi, roman, origin, page) from page HTML."""
    rows = []
    # Pattern matching each <hw> block within its <entry>
    # <entry> <span class="new_p">A <hw><pa>برزخ</pa> <i>barzaḵẖ</i></hw>
    raw_entries = re.findall(r'<entry>\s*<span class="new_p">\s*([A-Za-z?]+)?\s*<hw>(.*?)</hw>', html, re.DOTALL)
    for origin, hw in raw_entries:
        pas = re.findall(r'<pa>(.*?)</pa>', hw)
        ds = re.findall(r'<d>(.*?)</d>', hw)
        ro_matches = re.findall(r'<i>(.*?)</i>', hw)

        ur = pas[0].strip() if pas else ''
        hi = ds[0].strip() if ds else ''
        ro = ro_matches[0].replace('*', '').strip() if ro_matches else ''
        origin = (origin or '').strip()

        # Clean tags or entities
        ur = re.sub(r'<[^>]+>', '', ur).strip()
        hi = re.sub(r'<[^>]+>', '', hi).strip()
        ro = re.sub(r'<[^>]+>', '', ro).strip()

        if ur and ro:
            rows.append((ur, hi, ro, origin, page))

    return rows


def main():
    parser = argparse.ArgumentParser(description="Import Platts dictionary from DSAL")
    parser.add_argument('--pages', type=int, default=TOTAL_PAGES, help="Total pages to scrape (default 1254)")
    parser.add_argument('--workers', type=int, default=6, help="Concurrent workers (default 6)")
    args = parser.parse_args()

    os.makedirs(CACHE_DIR, exist_ok=True)
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) urdu-bahr academic linguistics tool (github.com/vishaalkk/urdu-bahr)'
    }

    print(f"Fetching {args.pages} pages with {args.workers} workers...")
    all_rows = []
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

    # Parse in page order
    seen = set()
    unique_rows = []
    for p in range(1, args.pages + 1):
        if p in page_data:
            rows = parse_page_html(page_data[p], p)
            for r in rows:
                key = (r[0], r[2])  # (urdu, roman)
                if key not in seen:
                    seen.add(key)
                    unique_rows.append(r)

    print(f"Parsed {len(unique_rows)} unique headwords from {len(page_data)} pages.")

    with open(OUT_TSV, 'w', encoding='utf-8') as f:
        f.write("urdu\thindi\troman\torigin\tpage\n")
        for ur, hi, ro, orig, pg in unique_rows:
            f.write(f"{ur}\t{hi}\t{ro}\t{orig}\t{pg}\n")

    print(f"Wrote {len(unique_rows)} entries -> {os.path.relpath(OUT_TSV, ROOT)}")


if __name__ == '__main__':
    main()
