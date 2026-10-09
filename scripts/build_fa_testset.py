#!/usr/bin/env python3
"""
scripts/build_fa_testset.py

An independent Persian test set: the best-known ghazals of Hafiz, Saadi, Rumi (Divan-e Shams) and Jami from Ganjoor, in
Iranian spelling, each with the meter Ganjoor's editors give it. None of it passes through our Sufinama pipeline, so it
checks the Fārsī path (faScanText → the Persian engine) on text we did not shape. Public-domain classical poetry; stored as
test data only (tests/data/ganjoor_testset.json), never shipped in the app.

  - Which ghazals: the ones people know. First every kalaam of the poet on Sufinama (SUFINAMA: the ones sung in qawwali),
    found on Ganjoor by its opening hemistich; then the rest by how many recitations Ganjoor hosts (/api/audio/published).
  - Which text: the hemistichs from `verses[].text`, which keep the editors' zer and iẓāfat marks (محبتِ, سراپردهٔ).
    `plainText` strips them; tests/benchmark_fa.js derives that unmarked form itself, since it is what people paste.
  - Arabic ghazals (Rumi has some) are left out: they test Arabic, not Persian.

Raw API responses are cached in data/ganjoor_cache/ (gitignored), so a re-run re-ranks without fetching again.

    python3 scripts/build_fa_testset.py           # 60 per poet
    python3 scripts/build_fa_testset.py --per 30
"""
import difflib, json, os, re, sys, time, urllib.parse, urllib.request
from collections import Counter

ROOT = os.path.join(os.path.dirname(__file__), '..')
OUT = os.path.join(ROOT, 'tests', 'data', 'ganjoor_testset.json')
CACHE = os.path.join(ROOT, 'data', 'ganjoor_cache')
API = 'https://api.ganjoor.net/api'
DIVANS = [('Hafiz', '/hafez/ghazal'), ('Saadi', '/saadi/divan/ghazals'), ('Rumi', '/moulavi/shams/ghazalsh'),
          ('Jami', '/jami/divanj/fateha-shabab/ghazal-jf')]
MAX_LINES = 10   # hemistichs kept per ghazal: enough to vote on its meter, small enough to keep in the repo
SUFINAMA = {'Hafiz': 'https://sufinama.org/poets/hafiz/persian-kalam', 'Rumi': 'https://sufinama.org/poets/rumi/persian-kalam',
            'Saadi': 'https://sufinama.org/poets/saadi-shirazi/persian-kalam'}
PERSIAN = re.compile(r'[پچژگ]|(^|\s)(که|است|را|از|می|بی|چو|چه|این|آن|ما|من|تو)(\s|$)')


def get(url, cache_name=None):
    path = os.path.join(CACHE, cache_name) if cache_name else None
    if path and os.path.exists(path):
        with open(path, encoding='utf-8') as f:
            return json.load(f)
    req = urllib.request.Request(url, headers={'User-Agent': 'urdu-bahr test set (github.com/vishaalkk/urdu-bahr)'})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=40) as r:
                data = json.loads(r.read().decode('utf-8'))
            time.sleep(0.3)
            if path:
                os.makedirs(CACHE, exist_ok=True)
                with open(path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False)
            return data
        except Exception:
            time.sleep(2 * (attempt + 1))
    return None


def fold(s):
    s = s.translate(str.maketrans({'ہ': 'ه', 'ۂ': 'ه', 'ۀ': 'ه', 'ة': 'ه', 'ھ': 'ه', 'ے': 'ی', 'ي': 'ی', 'ى': 'ی',
                                   'ئ': 'ی', 'ك': 'ک', 'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ؤ': 'و', 'ں': 'ن'}))
    return re.sub(r'[^ء-ۓ]', '', s)


def sufinama_picks(poet, poems):
    """urlSlugs of this divan's poems that the poet's Sufinama kalaam open with, in Sufinama's order."""
    if poet not in SUFINAMA:
        return []
    sys.path.insert(0, os.path.dirname(__file__))
    from import_sufinama import fetch_url, extract_lines
    links = list(dict.fromkeys(re.findall(r'https://sufinama.org/persian-kalam/[a-z0-9-]+-persian-kalam(?:-\d+)?(?=")',
                                          fetch_url(SUFINAMA[poet]))))
    excerpts = [(fold(p.get('excerpt') or ''), p['urlSlug']) for p in poems]
    picks, missed = [], []
    for link in links:
        first = extract_lines(fetch_url(link + '?lang=ur'))[:1]
        time.sleep(0.3)
        best = max(((difflib.SequenceMatcher(None, fold(first[0]), e).ratio(), slug) for e, slug in excerpts),
                   default=(0, None)) if first else (0, None)
        if best[0] >= 0.8:
            picks.append(best[1])
        else:
            missed.append(link.rsplit('/', 1)[-1])
    print(f'{poet}: {len(links)} Sufinama kalaam, {len(set(picks))} found in this divan; not found: {", ".join(missed) or "none"}')
    return list(dict.fromkeys(picks))


def recitation_counts(cat_id):
    """poem url → number of published recitations in this section of the divan."""
    n, page = Counter(), 1
    while True:
        rows = get(f'{API}/audio/published?catId={cat_id}&PageNumber={page}&PageSize=1000', f'audio_{cat_id}_{page}.json')
        if not rows:
            break
        n.update(r['poemFullUrl'] for r in rows)
        if len(rows) < 1000:
            break
        page += 1
    return n


def is_persian(lines):
    """Arabic ghazals carry none of Persian's own letters or everyday words in most of their hemistichs."""
    return sum(1 for l in lines if PERSIAN.search(l)) >= len(lines) / 2


def main():
    per = int(sys.argv[sys.argv.index('--per') + 1]) if '--per' in sys.argv else 60
    out = []
    for poet, cat in DIVANS:
        c = get(f"{API}/ganjoor/cat?url={urllib.parse.quote(cat)}&poems=true&mainSections=false",
                'cat_' + cat.strip('/').replace('/', '_') + '.json')
        cat_info = (c or {}).get('cat') or {}
        poems = cat_info.get('poems') or []
        if len(poems) < per:
            sys.exit(f'{poet}: Ganjoor listed {len(poems)} poems, expected at least {per} — not writing')
        heard = recitation_counts(cat_info['id'])
        order = {p['urlSlug']: i for i, p in enumerate(poems)}
        sung = {slug: i for i, slug in enumerate(sufinama_picks(poet, poems))}
        ranked = sorted(poems, key=lambda p: (sung.get(p['urlSlug'], len(sung)), -heard[f"{cat}/{p['urlSlug']}"],
                                              order[p['urlSlug']]))
        kept = 0
        for p in ranked:
            if kept >= per:
                break
            url = f"{cat}/{p['urlSlug']}"
            full = get(f"{API}/ganjoor/poem?url={urllib.parse.quote(url)}&catInfo=false&catPoems=false&rhymes=false"
                       "&recitations=false&images=false&songs=false&comments=false&verseDetails=true&navigation=false"
                       "&relatedpoems=false", 'poem_' + url.strip('/').replace('/', '_') + '.json')
            if not full:
                continue
            sec = next((s for s in full.get('sections') or [] if s.get('ganjoorMetreId')), None)
            verses = sorted((v for v in full.get('verses') or [] if v.get('versePosition') in (0, 1)), key=lambda v: v['vOrder'])
            lines = [v['text'].strip() for v in verses if v.get('text', '').strip()][:MAX_LINES]
            if not sec or len(lines) < 4 or not is_persian(lines):
                continue
            out.append({'poet': poet, 'url': 'https://ganjoor.net' + full['fullUrl'], 'metre_id': sec['ganjoorMetreId'],
                        'rhythm': (sec.get('ganjoorMetre') or {}).get('rhythm', ''), 'recitations': heard[url],
                        **({'sufinama': True} if p['urlSlug'] in sung else {}),
                        'lines': lines})
            kept += 1
        print(f'{poet}: {kept} ghazals ({sum(1 for x in out if x["poet"] == poet and x.get("sufinama"))} from Sufinama, '
              f'the rest down to {out[-1]["recitations"]} recitations)', flush=True)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=0)
    print(f'{len(out)} ghazals -> {OUT}')


if __name__ == '__main__':
    main()
