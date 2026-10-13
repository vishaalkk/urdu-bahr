#!/usr/bin/env python3
"""
scripts/import_steingass.py
Steingass, A Comprehensive Persian-English Dictionary (1892, public domain): every headword in Persian script with its
classical pronunciation in Roman, short vowels and all (نهفتن nihuftan, موافق muwāfiq, زنخدان zanaḵẖdān).
Source: the DSAL digital edition as scraped by Theodore Beers (github.com/theodore-s-beers/steingass-scraper, MIT),
`entries_slim.sqlite`, downloaded to data/steingass_cache/ (gitignored). scripts/build_dictionary_bundle.py puts it in
data/dictionary_bundle.json.gz, the one Steingass the app reads (the Transcribe drawer) and the Persian engine's build reads
(scripts/lib_fa_steingass.js: the syllable weights of words neither the engine nor Sufinama's Roman reads right).
    python3 scripts/import_steingass.py
"""
import os, urllib.request

ROOT = os.path.join(os.path.dirname(__file__), '..')
CACHE = os.path.join(ROOT, 'data', 'steingass_cache', 'entries_slim.sqlite')
URL = 'https://github.com/theodore-s-beers/steingass-scraper/raw/main/entries_slim.sqlite'


def main():
    if not os.path.exists(CACHE):
        os.makedirs(os.path.dirname(CACHE), exist_ok=True)
        req = urllib.request.Request(URL, headers={'User-Agent': 'urdu-bahr (github.com/vishaalkk/urdu-bahr)'})
        with urllib.request.urlopen(req, timeout=120) as r, open(CACHE, 'wb') as f:
            f.write(r.read())
    print(f'{os.path.relpath(CACHE, ROOT)} ready: now run scripts/build_dictionary_bundle.py')


if __name__ == '__main__':
    main()
