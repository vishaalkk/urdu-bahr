#!/usr/bin/env python3
"""
scripts/crawl_sufinama_persian.py

Lists every Persian kalaam in Sufinama's Persian qawwali collections (https://sufinama.org/sufi-qawwali/persian-kalam and
each collection it links to, including the lazy-loaded pages of each) and on the Persian-kalaam pages of the poets in
POET_PAGES (Hafiz, Rumi, Saadi: most of theirs is sung but sits in no collection), works out each one's poet from its page, and adds
the new ones to data/sufinama_manifest.json as `fa_<poet key>` (a URL already in the manifest, under any category, is
skipped). Then: scripts/import_sufinama.py → node scripts/scan_sufinama.js → scripts/build_poets.py.

    python3 scripts/crawl_sufinama_persian.py           # crawl and update the manifest
    python3 scripts/crawl_sufinama_persian.py --dry     # report only
    (stops if the hub or a collection shrinks against data/sufinama_collections.json; --accept-smaller to override)
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
    'meer-taqi-meer': 'mir_farsi',   # his Persian: its own collection, apart from Pritchett's Mir
}
# poets whose own Persian-kalaam page is crawled too (https://sufinama.org/poets/<slug>/persian-kalam)
POET_PAGES = ['hafiz', 'rumi', 'saadi-shirazi', 'fakhruddin-iraqi', 'fariduddin-attar', 'fidai-jaunpuri', 'imdad-ali-ulvi',
              'jan-muhammad-qudsi', 'khaqani', 'maikash-akbarabadi', 'meer-taqi-meer', 'meher-ali-shah', 'mirza-abdul-qadir-bedil',
              'pir-naseeruddin-naseer', 'shah-niyaz-ahmad-barelvi', 'sheikh-abdul-qadir-jilani-1']
# other sections of a poet's page, paged (?pageIndex=n, 50 a page) under every sort order, since one order alone repeats
# and skips items: (poet slug, section). Their kalaam live under https://sufinama.org/<section>/<slug>.
POET_SECTIONS = [('rumi', 'persian-sufi-poetry'), ('hafiz', 'persian-sufi-poetry')]
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


def section_urls(poet, section):
    urls = set()
    for sort in ('', 'popularity-desc', 'title-asc', 'title-desc', 'date-desc', 'date-asc'):
        for page in range(1, 40):
            found = set(re.findall(rf'{BASE}/{section}/[a-z0-9-]+(?=["\'?#])', get(f'{BASE}/poets/{poet}/{section}?pageIndex={page}&sort={sort}')))
            if not found - urls and page > 1:
                break
            urls |= found
    return urls


def poet_of(url):
    html = get(url)
    m = re.search(r'href="/poets/([a-z0-9-]+)/(?:persian-kalam|persian-sufi-poetry|kalaam)"', html)
    name = re.search(r'og:title" content="[^"]*? by ([^"]+)"', html)
    return (m.group(1) if m else 'unknown'), (name.group(1).strip() if name else '')


def key_for(slug):
    slug = re.sub(r'-\d+$', '', slug)   # Sufinama numbers namesakes: shah-turab-ali-qalandar-1
    return KNOWN.get(slug) or re.sub(r'[^a-z0-9]+', '_', slug).strip('_')


def main():
    hub = get(f'{BASE}/sufi-qawwali/persian-kalam')
    slugs = sorted({s for s in re.findall(r'/sufi-qawwali/([a-z0-9-]+)', hub) if s != 'persian-kalam'})
    print(f'{len(slugs)} collections')
    # guard: Sufinama's pages change (the lazy-loaded pages already caught us once). Each collection's size is remembered
    # (data/sufinama_collections.json, local); a collection that vanishes or shrinks by more than a tenth stops the crawl.
    sizes_file = os.path.join(ROOT, 'data', 'sufinama_collections.json')
    last = json.load(open(sizes_file, encoding='utf-8')) if os.path.exists(sizes_file) else {}
    n_last = sum(1 for k in last if not k.startswith('poet:'))   # collections only: poet pages are kept there too
    if n_last and len(slugs) < n_last * 0.9:
        sys.exit(f'✗ the hub lists {len(slugs)} collections, {n_last} last time: the page has probably changed. Nothing written.')
    found, sizes, shrunk = {}, {}, []
    for s in slugs:
        urls = collection_urls(s)
        for u in urls:
            found.setdefault(u, []).append(s)
        sizes[s] = len(urls)
        if s in last and len(urls) < last[s] * 0.9:
            shrunk.append(f'  {s}: {len(urls)} kalaams, {last[s]} last time')
        print(f'  {s:60} {len(urls)}')
    for p in POET_PAGES:
        urls = kalaam_links(get(f'{BASE}/poets/{p}/persian-kalam'))
        for u in urls:
            found.setdefault(u, []).append('poet:' + p)
        sizes['poet:' + p] = len(urls)
        if 'poet:' + p in last and len(urls) < last['poet:' + p] * 0.9:
            shrunk.append(f'  poet:{p}: {len(urls)} kalaams, {last["poet:" + p]} last time')
        print(f'  {"poet:" + p:60} {len(urls)}')
    for p, sec in POET_SECTIONS:
        tag = f'poet:{p}/{sec}'
        urls = section_urls(p, sec)
        for u in urls:
            found.setdefault(u, []).append(tag)
        sizes[tag] = len(urls)
        if tag in last and len(urls) < last[tag] * 0.9:
            shrunk.append(f'  {tag}: {len(urls)} kalaams, {last[tag]} last time')
        print(f'  {tag:60} {len(urls)}')
    if shrunk and '--accept-smaller' not in sys.argv:
        sys.exit('✗ collections shrank (a changed page, or a failed fetch); nothing written. Check, then rerun with --accept-smaller:\n'
                 + '\n'.join(shrunk))
    manifest = json.load(open(MANIFEST, encoding='utf-8'))
    have = {u for v in manifest.values() for u in v}
    new = sorted(u for u in found if u not in have)
    print(f'{len(found)} kalaams in all; {len(found) - len(new)} already in the manifest; {len(new)} new')
    with ThreadPoolExecutor(max_workers=5) as ex:
        poets = dict(zip(new, ex.map(poet_of, new)))
    names = json.load(open(POETS_OUT, encoding='utf-8')) if os.path.exists(POETS_OUT) else {}
    by_cat = {}
    for u, (slug, name) in poets.items():
        if slug == 'unknown':   # its page names no poet: the poet page it was listed on does (poet:<slug>[/section])
            tag = next((t for t in found[u] if t.startswith('poet:')), '')
            slug = tag[5:].split('/')[0] or slug
        key = key_for(slug)
        cat = CATEGORY_OF.get(key, 'fa_' + key)
        by_cat.setdefault(cat, []).append(u)
        names.setdefault(key, {'slug': slug, 'name': name or slug.replace('-', ' ').title()})
    for cat, us in sorted(by_cat.items()):
        print(f'  + {cat:28} {len(us)}')
    if '--dry' in sys.argv:
        return
    json.dump({**last, **sizes}, open(sizes_file, 'w', encoding='utf-8'), indent=1)
    for cat, us in by_cat.items():
        manifest.setdefault(cat, []).extend(us)
    json.dump(manifest, open(MANIFEST, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    json.dump(names, open(POETS_OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'manifest: +{len(new)} URLs')


if __name__ == '__main__':
    main()
