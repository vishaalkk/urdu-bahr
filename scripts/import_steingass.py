#!/usr/bin/env python3
"""
scripts/import_steingass.py

Steingass, A Comprehensive Persian-English Dictionary (1892, public domain): every headword in Persian script with its
classical pronunciation in Roman, short vowels and all (نهفتن nihuftan, موافق muwāfiq, زنخدان zanaḵẖdān). The Persian engine
(scripts/build_fa_scan.js, scripts/lib_fa_steingass.js) takes from it the syllable weights of words neither the engine nor
Sufinama's Roman reads right.

Source: the DSAL digital edition as scraped by Theodore Beers (github.com/theodore-s-beers/steingass-scraper, MIT),
`entries_slim.sqlite`, cached in data/steingass_cache/ (gitignored). Writes data/fa_steingass.tsv: one single-word headword
per line, `persian<TAB>roman` as Steingass prints it (italics stripped), deduped.

    python3 scripts/import_steingass.py
"""
import os, re, sqlite3, urllib.request

ROOT = os.path.join(os.path.dirname(__file__), '..')
CACHE = os.path.join(ROOT, 'data', 'steingass_cache', 'entries_slim.sqlite')
OUT = os.path.join(ROOT, 'data', 'fa_steingass.tsv')
URL = 'https://github.com/theodore-s-beers/steingass-scraper/raw/main/entries_slim.sqlite'


def main():
    if not os.path.exists(CACHE):
        os.makedirs(os.path.dirname(CACHE), exist_ok=True)
        req = urllib.request.Request(URL, headers={'User-Agent': 'urdu-bahr (github.com/vishaalkk/urdu-bahr)'})
        with urllib.request.urlopen(req, timeout=120) as r, open(CACHE, 'wb') as f:
            f.write(r.read())
    db = sqlite3.connect(CACHE)
    rows, seen = [], set()
    for fa, ro in db.execute('SELECT headword_persian, headword_latin FROM entries ORDER BY id'):
        fa, ro = fa.strip(), ro.replace('*', '').strip()
        # one word, one pronunciation: phrases, variants ("a, b"), and notes in brackets are left out
        if not fa or not ro or re.search(r'\s', fa) or re.search(r'[\s,;()=?+/]', ro) or (fa, ro) in seen:
            continue
        seen.add((fa, ro))
        rows.append(f'{fa}\t{ro}')
    if len(rows) < 40000:
        raise SystemExit(f'only {len(rows)} headwords read — not writing')
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write('\n'.join(rows) + '\n')
    print(f'{len(rows)} headwords -> {os.path.relpath(OUT, ROOT)}')


if __name__ == '__main__':
    main()
