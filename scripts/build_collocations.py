#!/usr/bin/env python3
"""
Builds data/collocations.json: neighbour rules that pick between spellings of one typed word.

A typed word's casual key can stand for several words (rah رہ / raah راہ, ab اب / aab آب). A rule says: when the
previous word (L1) or the next word (R1) has this casual key, answer with this spelling. The answer is the strict
casual key (long vowels kept), which the app already maps to a full spelling through ROMAN_CASUAL_MAP[0].

Mined from every verified corpus plus the Rekhta ghazals. Rekhta labels come from a pure letter map of its Roman,
not from the app's own transliteration, so they do not echo the model back. A rule is kept only if the context was
seen >=3 times, >=90% of those agree, it differs from the word's default spelling, and it comes from >=2 ghazals.
That cut was chosen with scripts/colloc_benchmark.py (held-out by ghazal): trigram and looser tables were tried and
did not pay for their size.

    uv run python scripts/build_collocations.py
    uv run python scripts/colloc_benchmark.py          # held-out accuracy, fixed vs broken
"""
import argparse
import json
import os

from colloc_lib import DATA, build_table, load_corpus

KINDS = ('L1', 'R1')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--exclude', default='', help='comma-separated Rekhta poets (jaun,faraz,...) to leave out, for held-out testing')
    ap.add_argument('--out', default=os.path.join(DATA, 'collocations.json'))
    a = ap.parse_args()
    skip = tuple(x + '_scanned.json/' for x in a.exclude.split(',') if x)
    corpus = load_corpus('letters')
    corpus.groups = [g for g in corpus.groups if not (g[0] == 'R' and g[1].startswith(skip))] if skip else corpus.groups
    table = build_table(corpus.groups, kinds=KINDS)
    out = {kind: dict(sorted(table.rules[kind].items())) for kind in KINDS}
    path = a.out
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, separators=(',', ':'))
        f.write('\n')
    size = os.path.getsize(path)
    print('Collocations built')
    for kind in KINDS:
        print(f'  {kind}: {len(out[kind])} rules')
    print(f'  {size / 1024:.1f} KB -> {path}   ({len(corpus.groups)} ghazals mined)')


if __name__ == '__main__':
    main()
