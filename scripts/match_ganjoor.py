#!/usr/bin/env python3
"""
scripts/match_ganjoor.py

Finds each Persian Sufinama ghazal (data/sufinama_ghazals.json, lang fa) on Ganjoor and records what Ganjoor knows:
its page, its poet (an attribution check: qawwali texts are often traditional), the meter Ganjoor's editors gave it
(gold for tests/benchmark_fa.js) and its text in Iranian orthography (the `fa` column, line by line where we can align).

    python3 scripts/match_ganjoor.py            # only ghazals not matched yet (results are cached)
    python3 scripts/match_ganjoor.py --retry    # also retry the ones not found
    python3 scripts/match_ganjoor.py --refresh  # everything again
    python3 scripts/match_ganjoor.py --resection  # re-read the meter of matched poems (the section holding our lines)

Writes tests/data/persian_gold.json. A ghazal matches when at least two of its first six lines are found (letters only,
spacing and Urdu/Persian letter forms folded) in one Ganjoor poem; with a single line it is recorded as `weak`.
"""
import difflib, json, os, re, sys, time, urllib.parse, urllib.request

ROOT = os.path.join(os.path.dirname(__file__), '..')
SRC = os.path.join(ROOT, 'data', 'sufinama_ghazals.json')
OUT = os.path.join(ROOT, 'tests', 'data', 'persian_gold.json')
API = 'https://api.ganjoor.net/api/ganjoor'
PERSIAN = lambda c: c in ('jami', 'bu_ali', 'khusrau_persian') or (c or '').startswith('fa_')

FOLD = str.maketrans({'ہ': 'ه', 'ۂ': 'ه', 'ۀ': 'ه', 'ة': 'ه', 'ھ': 'ه', 'ے': 'ی', 'ي': 'ی', 'ى': 'ی', 'ئ': 'ی',
                      'ك': 'ک', 'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ٱ': 'ا', 'ؤ': 'و'})
NOISE = re.compile(r'[^ء-ۓ]')   # keep letters only (drops marks, ZWNJ, spaces, punctuation)


def fold(s):
    return NOISE.sub('', s.translate(FOLD))


def as_persian(s):
    """Urdu-orthography line -> a Persian-letters search term."""
    return re.sub(r'[ً-ٰٟ]', '', s.translate(FOLD)).strip()


def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'urdu-bahr (github.com/vishalk) persian-gold'})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=40) as r:
                return json.loads(r.read().decode('utf-8'))
        except Exception:
            time.sleep(2 * (attempt + 1))
    return None


def poem_lines(p):
    return [l.strip() for l in (p.get('plainText') or '').replace('\r', '').split('\n') if l.strip()]


def best_match(lines, cands):
    ours = [fold(l['ur']) for l in lines[:6] if l.get('ur')]
    best = None
    for p in cands or []:
        theirs = [fold(l) for l in poem_lines(p)]
        hits = sum(1 for o in ours if any(difflib.SequenceMatcher(None, o, t).ratio() >= 0.82 for t in theirs))
        if hits and (not best or hits > best[0]):
            best = (hits, p)
    return best


def best_section(lines, poem):
    """the metred section that holds our lines (a ghazal can sit inside a masnavi whose own meter is different)"""
    ours = [fold(l['ur']) for l in lines[:8] if l.get('ur')]
    best = None
    for sec in poem.get('sections') or []:
        if not sec.get('ganjoorMetreId'):
            continue
        theirs = [fold(t) for t in (sec.get('plainText') or '').replace('\r', '').split('\n') if t.strip()]
        hits = sum(1 for o in ours if any(difflib.SequenceMatcher(None, o, t).ratio() >= 0.82 for t in theirs))
        if not best or hits > best[0]:
            best = (hits, sec)
    return best[1] if best else None


def align(lines, flines):
    """our line i -> the Ganjoor line it matches (or '')"""
    ft = [fold(l) for l in flines]
    out = []
    for l in lines:
        o = fold(l.get('ur', ''))
        r = [(difflib.SequenceMatcher(None, o, t).ratio(), i) for i, t in enumerate(ft)]
        sc, i = max(r) if r else (0, -1)
        out.append(flines[i] if sc >= 0.82 else '')
    return out


def main():
    ghazals = [g for g in json.load(open(SRC, encoding='utf-8')) if PERSIAN(g.get('category'))]
    gold = {}
    if os.path.exists(OUT) and '--refresh' not in sys.argv:
        gold = {g['url']: g for g in json.load(open(OUT, encoding='utf-8'))}
    for n, g in enumerate(ghazals, 1):
        if g['url'] in gold and (gold[g['url']]['ganjoor'] or '--retry' not in sys.argv):
            continue
        rec = {'url': g['url'], 'category': g['category'], 'poet': g['poet'], 'ganjoor': None}
        m = None
        # the opening words of the first lines (the opening may be a sung variant), then each line's three longest
        # words: Ganjoor's search wants whole words, and joined/split words (نمی‌دانم / نمی دانم) break a phrase
        terms = [' '.join(as_persian(l['ur']).split()[:6]) for l in g['lines'][:3]]
        terms += [' '.join(sorted(as_persian(l['ur']).split(), key=len, reverse=True)[:3]) for l in g['lines'][:4]]
        for term in terms:
            cands = get(f"{API}/poems/search?term={urllib.parse.quote(term)}&PageNumber=1&PageSize=20")
            m = best_match(g['lines'], cands)
            time.sleep(0.4)
            if m:
                break
        if m:
            hits, p = m
            full = get(f"{API}/poem?url={urllib.parse.quote(p['fullUrl'])}&catInfo=false&catPoems=false&rhymes=false"
                       "&recitations=false&images=false&songs=false&comments=false&verseDetails=false&navigation=false"
                       "&relatedpoems=false") or p
            sec = best_section(g['lines'], full)
            fl = poem_lines(full)
            rec['ganjoor'] = {
                'url': 'https://ganjoor.net' + full['fullUrl'],
                'title': full.get('fullTitle', ''),
                'poet': (full.get('fullTitle', '') or '').split('»')[0].strip(),
                'metre_id': sec['ganjoorMetreId'] if sec else None,
                'rhythm': (sec.get('ganjoorMetre') or {}).get('rhythm') if sec else None,
                'hits': hits,
                'weak': hits < 2,
                'multiple_poets': bool(full.get('claimedByMultiplePoets')),
            }
            rec['fa'] = align(g['lines'], fl)
            time.sleep(0.4)
        gold[g['url']] = rec
        gj = rec['ganjoor']
        print(f"[{n}/{len(ghazals)}] {g['category']:16} {'✓ ' + gj['poet'] + ' #' + str(gj['metre_id']) + (' (weak)' if gj['weak'] else '') if gj else '—'}  {g['lines'][0]['ro'][:40]}", flush=True)
        os.makedirs(os.path.dirname(OUT), exist_ok=True)
        with open(OUT, 'w', encoding='utf-8') as f:
            json.dump(list(gold.values()), f, ensure_ascii=False, indent=1)
    if '--resection' in sys.argv:
        src = {g['url']: g for g in ghazals}
        for url, rec in gold.items():
            gj = rec.get('ganjoor')
            if not gj or url not in src:
                continue
            full = get(f"{API}/poem?url={urllib.parse.quote(gj['url'].replace('https://ganjoor.net', ''))}&catInfo=false&catPoems=false"
                       "&rhymes=false&recitations=false&images=false&songs=false&comments=false&verseDetails=false"
                       "&navigation=false&relatedpoems=false")
            sec = best_section(src[url]['lines'], full or {})
            if sec and sec['ganjoorMetreId'] != gj['metre_id']:
                print(f"  {url.split('/')[-1][:50]}: metre {gj['metre_id']} -> {sec['ganjoorMetreId']}")
                gj['metre_id'], gj['rhythm'] = sec['ganjoorMetreId'], (sec.get('ganjoorMetre') or {}).get('rhythm')
            time.sleep(0.3)
        with open(OUT, 'w', encoding='utf-8') as f:
            json.dump(list(gold.values()), f, ensure_ascii=False, indent=1)
    found = [g for g in gold.values() if g['ganjoor'] and not g['ganjoor']['weak']]
    print(f"\n{len(found)}/{len(gold)} matched on Ganjoor (+{sum(1 for g in gold.values() if g['ganjoor'] and g['ganjoor']['weak'])} weak)")


if __name__ == '__main__':
    main()
