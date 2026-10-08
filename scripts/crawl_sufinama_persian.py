#!/usr/bin/env python3
"""
scripts/crawl_sufinama_persian.py

Lists every Persian kalaam in Sufinama's Persian qawwali collections (https://sufinama.org/sufi-qawwali/persian-kalam and
each collection it links to, including the lazy-loaded pages of each), works out each one's poet from its page, and adds
the new ones to data/sufinama_manifest.json as `fa_<poet key>` (a URL already in the manifest, under any category, is
skipped). Then: scripts/import_sufinama.py → node scripts/scan_sufinama.js → scripts/build_poets.py.

    python3 scripts/crawl_sufinama_persian.py           # crawl and update the manifest
    python3 scripts/crawl_sufinama_persian.py --dry     # report only
"""
import json, os, re, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.join(os.path.dirname(__file__), '..')
MANIFEST = os.path.join(ROOT, 'data', 'sufinama_manifest.json')
POETS_OUT = os.path.join(ROOT, 'data', 'sufinama_poets.json')   # poet slug -> names, read by import/build (gitignored like the rest)
BASE = 'https://sufinama.org'
HEADERS = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'}

# Sufinama poet slug -> our poet key (scripts/build_poets.py POETS); anything else becomes its own key from the slug
KNOWN = {
    'rumi': 'rumi', 'hafiz': 'hafiz', 'hafiz-shirazi': 'hafiz', 'saadi-shirazi': 'saadi', 'sheikh-saadi': 'saadi',
    'abdul-rahman-jami': 'jami', 'jami': 'jami', 'amir-khusrau': 'khusrau', 'bu-ali-shah-qalandar': 'bu_ali',
    'shah-niyaz-ahmad-barelvi': 'shah_niyaz', 'fakhruddin-iraqi': 'iraqi', 'mirza-ghalib': 'ghalib_farsi',
    'jigar-moradabadi': 'jigar', 'amir-hasan-ala-sijzi': 'hasan_sijzi', 'ahmad-jam': 'ahmad_jam',
    'nizamuddin-auliya': 'nizamuddin', 'alauddin-ali-ahmad-sabir': 'sabir', 'sheikh-abdul-qadir-jilani': 'jilani',
    'lal-shahbaz-qalandar': 'lal_shahbaz', 'bahlol-dana': 'bahlol', 'mirza-muhammad-hussain-qateel': 'qateel_mirza',
    'unknown': 'anonymous_fa', 'hakeem-nazr-ashraf-ashrafi': 'ashrafi', 'shams-mashriqi': 'shams_mashriqi',
    'shah-siddique-saudagar': 'saudagar', 'muneer': 'muneer', 'allama-iqbal': 'iqbal', 'mirza-abdul-qadir-bedil': 'bedil',
}
# categories that already exist in the manifest for a poet key
CATEGORY_OF = {'jami': 'jami', 'bu_ali': 'bu_ali', 'khusrau': 'khusrau_persian'}


def get(url):
    for attempt in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=30) as r:
                return r.read().decode('utf-8', errors='ignore')
        except Exception:
            time.sleep(1.5 * (attempt + 1))
    return ''


def kalaam_links(html):
    # inside a collection a link is /persian-kalam/<collection>/<kalaam>; elsewhere /persian-kalam/<kalaam>
    return {BASE + '/persian-kalam/' + s for s in re.findall(r'/persian-kalam/(?:[a-z0-9-]+/)?([a-z0-9-]+)(?=["\'?#])', html)
            if s.endswith('persian-kalam') or re.search(r'persian-kalam-\d+$', s)}


def collection_urls(slug):
    html = get(f'{BASE}/sufi-qawwali/{slug}')
    urls = kalaam_links(html)
    for sort in ('popularity-desc', ''):   # both orders: the first page differs between them
        for page in range(1, 60):           # lazy-loaded pages (some collections load everything this way), until one is empty
            more = get(f'{BASE}/CollectionLoading?id={slug}&lang=1&pageType=tab-shayaricollection&contentType=persian-kalam'
                       f'&keyword=&pageIndex={page}&sort={sort}')
            found = kalaam_links(more)
            if not found:
                break
            urls |= found
    return urls


def poet_of(url):
    html = get(url)
    m = re.search(r'href="/poets/([a-z0-9-]+)/persian-kalam"', html)
    name = re.search(r'og:title" content="[^"]*? by ([^"]+)"', html)
    return (m.group(1) if m else 'unknown'), (name.group(1).strip() if name else '')


def key_for(slug):
    slug = re.sub(r'-\d+$', '', slug)   # Sufinama numbers namesakes: shah-turab-ali-qalandar-1
    return KNOWN.get(slug) or re.sub(r'[^a-z0-9]+', '_', slug).strip('_')


def main():
    hub = get(f'{BASE}/sufi-qawwali/persian-kalam')
    slugs = sorted({s for s in re.findall(r'/sufi-qawwali/([a-z0-9-]+)', hub) if s != 'persian-kalam'})
    print(f'{len(slugs)} collections')
    found = {}
    for s in slugs:
        urls = collection_urls(s)
        for u in urls:
            found.setdefault(u, []).append(s)
        print(f'  {s:60} {len(urls)}')
    manifest = json.load(open(MANIFEST, encoding='utf-8'))
    have = {u for v in manifest.values() for u in v}
    new = sorted(u for u in found if u not in have)
    print(f'{len(found)} kalaams in all; {len(found) - len(new)} already in the manifest; {len(new)} new')
    with ThreadPoolExecutor(max_workers=5) as ex:
        poets = dict(zip(new, ex.map(poet_of, new)))
    names = json.load(open(POETS_OUT, encoding='utf-8')) if os.path.exists(POETS_OUT) else {}
    by_cat = {}
    for u, (slug, name) in poets.items():
        key = key_for(slug)
        cat = CATEGORY_OF.get(key, 'fa_' + key)
        by_cat.setdefault(cat, []).append(u)
        names.setdefault(key, {'slug': slug, 'name': name or slug.replace('-', ' ').title()})
    for cat, us in sorted(by_cat.items()):
        print(f'  + {cat:28} {len(us)}')
    if '--dry' in sys.argv:
        return
    for cat, us in by_cat.items():
        manifest.setdefault(cat, []).extend(us)
    json.dump(manifest, open(MANIFEST, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    json.dump(names, open(POETS_OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'manifest: +{len(new)} URLs')


if __name__ == '__main__':
    main()
