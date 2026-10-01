"""Aligned (Roman word, Urdu word) pairs from the Rekhta poets, for the typed-Roman fallback word list.

The poets' lines whose scripts split into the same words (scripts/pack_verses.py) give each Roman word its Urdu word. This lists, per
distinct pair, the typed form (Roman without diacritics), a pure letter-map ASCII base, the Urdu word, and how often it occurs.
scripts/build_roman_fallback.js turns the pairs into data/roman_fallback.json, keeping only spellings the app's real pipeline
turns back into the right Urdu word.

    python3 scripts/roman_fallback.py --out pairs.json [--exclude jaun,faraz]
"""
import argparse
import json
import os
import re
import sys
import unicodedata
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from colloc_lib import letter_ascii          # noqa: E402
from pack_verses import line_parts, POET_FIELDS   # noqa: E402

PLAIN = re.compile(r"^[a-zāīūñḍṭṛḳġṣżẓṡḥ]+$", re.I)


def typed_form(ro):
    s = unicodedata.normalize('NFD', ro.lower())
    return ''.join(c for c in s if not unicodedata.combining(c)).replace('ñ', 'n')


def pairs(poets, exclude=()):
    freq = Counter()
    for key, gs in poets['ghazals'].items():
        if key in exclude:
            continue
        for g in gs:
            for l in g['lines']:
                p = line_parts(l, POET_FIELDS)
                if not p:
                    continue
                for ur, _hi, ro in p[0]:
                    if len(ro) >= 2 and PLAIN.match(ro):          # plain words only: no izafat joins, no marks like .a
                        freq[(typed_form(ro), letter_ascii(ro), ur)] += 1
    return [[t, b, u, n] for (t, b, u), n in freq.items()]


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--exclude', default='')
    ap.add_argument('--out', required=True)
    a = ap.parse_args()
    with open(os.path.join(HERE, '..', 'data', 'poets_extended.json'), encoding='utf-8') as f:
        poets = json.load(f)
    out = pairs(poets, set(x for x in a.exclude.split(',') if x))
    with open(a.out, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, separators=(',', ':'))
    print(len(out), 'distinct (Roman, Urdu) pairs')
