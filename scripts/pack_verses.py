#!/usr/bin/env python3
"""Packs the verse collections for shipping: a word dictionary instead of the same poem in three or four scripts.

Each word has one Devanagari, one Roman (and, for Pritchett's Ghalib and Mir, one ASCII) form. A line whose scripts split into the
same words is stored as a list of dictionary ids plus a short gap string: for every break between two words, one bit per script
says whether it is a hyphen (1) or a space (0). Any other line stays as plain text. Lossless by construction: a line is packed only
if rebuilding it gives back exactly the original text, and every build re-checks the whole collection.

    uv run python scripts/pack_verses.py        # print the saving for each collection and check the round trips

Used by scripts/build_app.py. The app rebuilds the lines at load (unpackVerses in src/js/03-data-expanded-encyclopedia.js);
tests/packed_data.js checks that the built app holds exactly the source data.
Fields: ('ur', 'hi', 'ro') for the Rekhta poets, ('ur', 'hi', 'ro', 'ascii') for Ghalib and Mir. 'ur' is always the first.
Gap bit j-1 belongs to field j (so hi = 1, ro = 2, ascii = 4).
"""
import gzip
import json
import os
import re
import sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
SPLIT = re.compile(r'([\s-]+)')
IZAFAT = {'e', 'ye', 'ए', 'ये'}   # the -e / -ye that joins two words: kept inside the word's entry ("dil-e")
POET_FIELDS = ('ur', 'hi', 'ro')
FRAN_FIELDS = ('ur', 'hi', 'ro', 'ascii')


def entries(text):
    """-> (words, gaps) where an izafat -e stays with its word, or None if the text does not split cleanly."""
    if not text or text != text.strip():
        return None
    toks = SPLIT.split(text)
    parts, seps = toks[0::2], toks[1::2]
    if any(not p for p in parts) or any(s not in (' ', '-') for s in seps):
        return None
    words, gaps, i = [], [], 0
    while i < len(parts):
        w = parts[i]
        i += 1
        while i < len(parts) and seps[i - 1] == '-' and parts[i].lower() in IZAFAT:
            w += '-' + parts[i]
            i += 1
        words.append(w)
        if i < len(parts):
            gaps.append(seps[i - 1])
    return words, gaps


def line_parts(line, fields):
    if set(line) - set(fields) or not all(line.get(k) for k in fields):
        return None
    ur = line['ur']
    if ur != ' '.join(ur.split()):
        return None
    uw = ur.split(' ')
    ents = [entries(line[f]) for f in fields[1:]]
    if not all(ents) or not all(len(e[0]) == len(uw) for e in ents):
        return None
    gaps = ''.join(str(sum((e[1][i] == '-') << j for j, e in enumerate(ents))) for i in range(len(uw) - 1))
    return list(zip(uw, *[e[0] for e in ents])), gaps


def rebuild(words, gaps, fields):
    out = {f: '' for f in fields}
    for i, w in enumerate(words):
        if i:
            c = int(gaps[i - 1])
            out['ur'] += ' '
            for j, f in enumerate(fields[1:]):
                out[f] += '-' if (c >> j) & 1 else ' '
        for f, piece in zip(fields, w):
            out[f] += piece
    return out


def pack_groups(groups, fields):
    """groups: {name: [ghazal, ...]} (a ghazal carries 'lines'); one dictionary is shared by every group.
    -> {'f': fields, 'dict': [[ur, hi, ...], ...], 'g': {name: [ghazal with packed lines]}}"""
    parsed, freq = {}, Counter()
    for name, gs in groups.items():
        for gi, g in enumerate(gs):
            for li, l in enumerate(g['lines']):
                p = line_parts(l, fields)
                if p and rebuild(p[0], p[1], fields) == {f: l[f] for f in fields}:
                    parsed[(name, gi, li)] = p
                    freq.update(p[0])
    order = {w: i for i, (w, _) in enumerate(freq.most_common())}   # frequent words get the short ids
    packed = {}
    for name, gs in groups.items():
        packed[name] = []
        for gi, g in enumerate(gs):
            lines = []
            for li, l in enumerate(g['lines']):
                p = parsed.get((name, gi, li))
                lines.append([[order[w] for w in p[0]], p[1]] if p else l)
            packed[name].append({**g, 'lines': lines})
    return {'f': list(fields), 'dict': [list(w) for w, _ in freq.most_common()], 'g': packed}


def unpack_groups(p):
    d, fields = p['dict'], p['f']
    return {name: [{**g, 'lines': [rebuild([d[i] for i in l[0]], l[1], fields) if isinstance(l, list) else l for l in g['lines']]} for g in gs]
            for name, gs in p['g'].items()}


def pack_poets(data):
    p = pack_groups(data['ghazals'], POET_FIELDS)
    return {'poets': data['poets'], 'legacy': data['legacy'], **p}


def pack_list(ghazals, fields=FRAN_FIELDS):
    """a single collection (Ghalib or Mir): {'f', 'dict', 'g': [ghazals]}"""
    p = pack_groups({'all': ghazals}, fields)
    return {'f': p['f'], 'dict': p['dict'], 'g': p['g']['all']}


def dumps(o):
    return json.dumps(o, ensure_ascii=False, separators=(',', ':'))


def _report(name, source, packed, back, nlines, npacked):
    assert back == source, name + ': round trip failed'
    a, b = dumps(source), dumps(packed)
    gz = lambda s: len(gzip.compress(s.encode('utf-8'), 9))
    print(f"{name:8} {npacked}/{nlines} lines packed ({100 * npacked / nlines:.0f}%), {len(packed['dict'])} words | "
          f"raw {len(a.encode()) / 1e6:.2f} -> {len(b.encode()) / 1e6:.2f} MB | gzip {gz(a) / 1e6:.2f} -> {gz(b) / 1e6:.2f} MB | round trip identical")


def main():
    sys.path.insert(0, HERE)
    with open(os.path.join(HERE, '..', 'data', 'poets_extended.json'), encoding='utf-8') as f:
        poets = json.load(f)
    pk = pack_poets(poets)
    back = {'poets': pk['poets'], 'legacy': pk['legacy'], 'ghazals': unpack_groups(pk)}
    n = sum(len(g['lines']) for v in poets['ghazals'].values() for g in v)
    k = sum(isinstance(l, list) for v in pk['g'].values() for g in v for l in g['lines'])
    _report('poets', poets, pk, back, n, k)
    for name, fn in (('ghalib', 'ghalib_extended.json'), ('mir', 'mir_extended.json')):
        with open(os.path.join(HERE, '..', 'data', fn), encoding='utf-8') as f:
            gs = [{'id': g['id'], 'lines': [{x: l[x] for x in FRAN_FIELDS} for l in g['lines']]} for g in json.load(f)]
        pk = pack_list(gs)
        back = unpack_groups({'f': pk['f'], 'dict': pk['dict'], 'g': {'all': pk['g']}})['all']
        n = sum(len(g['lines']) for g in gs)
        k = sum(isinstance(l, list) for g in pk['g'] for l in g['lines'])
        _report(name, gs, pk, back, n, k)


if __name__ == '__main__':
    sys.exit(main())
