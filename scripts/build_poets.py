#!/usr/bin/env python3
"""Builds data/poets_extended.json: every poet-named collection of the Ghazals tab beyond Ghalib and Mir.

    node scripts/scan_poets.js            # data/poets/*.json -> data/poets_scanned/*.json (meter per ghazal, via the engine)
    uv run python scripts/build_poets.py  # -> data/poets_extended.json, injected into index.html by build_app.py

Inputs: the Rekhta ghazals (data/poets_scanned/*_scanned.json, data/faiz_scanned.json) and the six hand-checked
"More Poets" ghazals (data/others_extended.json: Faiz, Dagh x2, Jigar, Firaq, Hasrat), which keep their verified Roman.
Output shape, per poet: ghazals [{id, url, meters, n, lines:[{ur, hi, ro}]}] in the shape Ghalib/Mir use, minus the scan
bookkeeping (cost, consensus). `meters` is the ghazal's bahr (a pair like [14, 15] counts as one bahr) or [] when the
engine could not settle one; such ghazals stay readable but feed no drill or Look up.

Ids are stable: if data/poets_extended.json already exists, a ghazal keeps its id (matched by Rekhta URL, else by first
couplet), so deep links such as #/ghazals/jaun/12 and ?g= scan references survive a rebuild. New ghazals get max+1.
Duplicates are dropped: the same URL, or the same first couplet, within a poet.
"""
import glob
import json
import os
import re

DATA = os.path.join(os.path.dirname(__file__), '..', 'data')
OUT = os.path.join(DATA, 'poets_extended.json')

# key: (display name, Urdu, Hindi, aliases for search). The key is the route: #/ghazals/<key>/<id>
POETS = {
    'atish':   ('Atish', 'Khwaja Haidar Ali Atish', 'آتش', 'आतिश', ['Haidar Ali Atish']),
    'dagh':    ('Dagh', 'Dagh Dehlvi', 'داغ', 'दाग़', ['Dagh Dehlavi', 'Daagh']),
    'faiz':    ('Faiz', 'Faiz Ahmed Faiz', 'فیض', 'फ़ैज़', []),
    'faraz':   ('Faraz', 'Ahmad Faraz', 'فراز', 'फ़राज़', []),
    'firaq':   ('Firaq', 'Firaq Gorakhpuri', 'فراق', 'फ़िराक़', []),
    'hasrat':  ('Hasrat', 'Hasrat Mohani', 'حسرت', 'हसरत', []),
    'iqbal':   ('Iqbal', 'Allama Iqbal', 'اقبال', 'इक़बाल', ['Muhammad Iqbal']),
    'jaun':    ('Jaun', 'Jaun Elia', 'جون', 'जौन', ['Jaun Eliya']),   # Rekhta spells it Eliya
    'jigar':   ('Jigar', 'Jigar Moradabadi', 'جگر', 'जिगर', []),
    'nazeer':  ('Nazeer', 'Nazeer Akbarabadi', 'نظیر', 'नज़ीर', ['Nazir Akbarabadi']),
    'parveen': ('Parveen', 'Parveen Shakir', 'پروین شاکر', 'परवीन शाकिर', []),
    'riyaz':   ('Riyaz', 'Riyaz Khairabadi', 'ریاض', 'रियाज़', []),
    'siraj':   ('Siraj', 'Siraj Aurangabadi', 'سراج', 'सिराज', []),
}
# name = the pen name (tabs, list rows, search tags, sort order); full = the whole name (the Poets picker, the collection note)
KEY_OF = {alias.lower(): k for k, v in POETS.items() for alias in v[4]}
KEY_OF.update({v[0].lower(): k for k, v in POETS.items()})
KEY_OF.update({v[1].lower(): k for k, v in POETS.items()})

MARKS = re.compile(r'[ً-ٰٟـ‌‍ّؔٔ]')
KEEP = re.compile(r'[^ء-ۿ]')


def couplet_key(lines):
    """First couplet, folded: no marks, spaces, punctuation or quotes. Same poem => same key."""
    s = ''.join(MARKS.sub('', l['ur']) for l in lines[:2])
    s = s.replace('ي', 'ی').replace('ى', 'ی').replace('ك', 'ک').replace('ه', 'ہ')
    return KEEP.sub('', s)


# Rekhta's Iqbal pages (and a few others) use the Arabic forms of yeh and kaf; Urdu writes ی and ک. The engine already treats
# them as the same letters; the app's letter maps and fonts expect the Urdu forms.
ARABIC_TO_URDU = str.maketrans({'ي': 'ی', 'ى': 'ی', 'ك': 'ک'})


def urdu(s):
    return s.translate(ARABIC_TO_URDU)


def load(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def rekhta_ghazals():
    files = sorted(glob.glob(os.path.join(DATA, 'poets_scanned', '*_scanned.json')))
    files.append(os.path.join(DATA, 'faiz_scanned.json'))
    for f in files:
        if not os.path.exists(f):
            continue
        for g in load(f):
            key = KEY_OF.get(g['poet'].lower())
            if key:
                yield key, g


def main():
    previous = {}   # key -> {url: id, couplet: id}
    next_id = {}
    if os.path.exists(OUT):
        old = load(OUT)
        for key, gs in old['ghazals'].items():
            previous[key] = {'url': {g['url']: g['id'] for g in gs if g.get('url')},
                             'couplet': {couplet_key(g['lines']): g['id'] for g in gs}}
            next_id[key] = max(g['id'] for g in gs) + 1

    out = {k: [] for k in POETS}
    seen = {k: {'url': set(), 'couplet': set()} for k in POETS}
    dropped = []

    # 1. the hand-checked six keep their verified Roman and ascii; a Rekhta twin only lends its link
    twins = {}   # (poet key, couplet) -> url
    for key, g in rekhta_ghazals():
        twins[(key, couplet_key(g['lines']))] = g['url']
    legacy_src = []   # (old More Poets id, poet key, couplet) -> new "key/id" once ids are assigned
    for g in load(os.path.join(DATA, 'others_extended.json')):
        key = KEY_OF[g['poet'].lower()]
        ck = couplet_key(g['lines'])
        legacy_src.append((g['id'], key, ck))
        out[key].append({'id': None, 'url': twins.get((key, ck), ''), 'meters': g['meters'], 'n': g['lines_count'],
                         'lines': [{k: l[k] for k in ('ur', 'hi', 'ro', 'ascii') if k in l} for l in g['lines']],
                         'verified': True, '_ck': ck})
        seen[key]['couplet'].add(ck)

    # 2. Rekhta
    for key, g in rekhta_ghazals():
        ck = couplet_key(g['lines'])
        if g['url'] in seen[key]['url'] or ck in seen[key]['couplet']:
            dropped.append((key, g['id'], g['url']))
            continue
        seen[key]['url'].add(g['url'])
        seen[key]['couplet'].add(ck)
        out[key].append({'id': None, 'url': g['url'], 'meters': g['meters'], 'n': g['lines_count'],
                         'lines': [{'ur': urdu(l['ur']), 'hi': l['hi'], 'ro': l['ro']} for l in g['lines']], '_ck': ck})

    # 3. ids: keep any id a previous build gave; new ghazals get max+1, in a stable (URL) order
    for key, gs in out.items():
        prev = previous.get(key, {'url': {}, 'couplet': {}})
        used = set()
        for g in gs:
            gid = prev['url'].get(g['url']) if g['url'] else None
            gid = gid if gid is not None else prev['couplet'].get(g['_ck'])
            if gid is not None and gid not in used:
                g['id'] = gid
                used.add(gid)
        nid = next_id.get(key, 1)
        for g in sorted((x for x in gs if x['id'] is None), key=lambda x: (x['url'], x['_ck'])):
            g['id'] = nid
            nid += 1
        gs.sort(key=lambda x: x['id'])

    # #/ghazals/others/N (the old More Poets collection) now lives under its poet
    legacy = {}
    for old_id, key, ck in legacy_src:
        new = next(g['id'] for g in out[key] if g['_ck'] == ck)
        legacy[f'others/{old_id}'] = f'{key}/{new}'
    for gs in out.values():
        for g in gs:
            del g['_ck']

    poets = [{'key': k, 'name': v[0], 'full': v[1], 'ur': v[2], 'hi': v[3], 'aliases': v[4], 'count': len(out[k])}
             for k, v in sorted(POETS.items(), key=lambda kv: kv[1][0].lower()) if out[k]]
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump({'poets': poets, 'ghazals': {k: v for k, v in out.items() if v}, 'legacy': legacy}, f, ensure_ascii=False, separators=(',', ':'))
        f.write('\n')
    total = sum(len(v) for v in out.values())
    withm = sum(1 for v in out.values() for g in v if g['meters'])
    print(f"{total} ghazals, {withm} with a bahr, {len(dropped)} duplicates dropped, {os.path.getsize(OUT)/1e6:.2f} MB -> {OUT}")
    for p in poets:
        print(f"  {p['key']:8} {p['count']}")


if __name__ == '__main__':
    main()
