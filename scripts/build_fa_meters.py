#!/usr/bin/env python3
"""
scripts/build_fa_meters.py

Persian meters, from Ganjoor's meter list (data/sources/ganjoor_rhythms.json, a snapshot of
https://api.ganjoor.net/api/ganjoor/rhythms taken 2026-10-08; refetch with --fetch).

Each Ganjoor meter (its afāʿīl, name and the number of verses Ganjoor files under it) gets a weight
pattern, a match `key` and the standard Urdu meter ids it equals. Writes data/persian_meters.json.

The key is how a pattern is compared across the two traditions. It applies the same equivalences the
engine's meter variants do, written out so the browser (17c-circles.js `faMeterKey`) computes the same thing:
  - the line's last syllable is free (long or short), so it is written long;
  - a final faʿilun (– – =) and faʿlun (= =) are one meter (Ganjoor files them together);
  - a makhbūn line may open with fāʿilātun or faʿilātun (Urdu meters 14-19 mark this `=*`), so a leading
    = – = = before a makhbūn foot (– – = = or – = – =) is written – – = =.
"""
import json, os, re, sys, urllib.request

ROOT = os.path.join(os.path.dirname(__file__), '..')
SRC = os.path.join(ROOT, 'data', 'sources', 'ganjoor_rhythms.json')
OUT = os.path.join(ROOT, 'data', 'persian_meters.json')
METERS = os.path.join(ROOT, 'data', 'meters.json')

FEET = {   # afāʿīl → weights ('=' long, '-' short)
    'فعولن': '-==', 'فعول': '-=-', 'فعل': '-=', 'فع': '=', 'فاعلن': '=-=', 'فعلن': '--=',
    'فاعلاتن': '=-==', 'فعلاتن': '--==', 'فاعلات': '=-=-', 'فعلات': '--=-',
    'مفاعیلن': '-===', 'مفاعیل': '-==-', 'مفاعلن': '-=-=', 'مستفعلن': '==-=', 'مفتعلن': '=--=',
    'مفعولن': '===', 'مفعول': '==-', 'مفعولات': '===-', 'مستفعل': '==-', 'فاعل': '=-',
    'فعلان': '--=', 'مفاعلتن': '-=--=', 'متفاعلن': '--=-=',
}


def key(p):
    if not p:
        return p
    p = p[:-1] + '='
    if p.endswith('--='):
        p = p[:-3] + '=='
    if re.match(r'^=-==(--==|-=-=)', p):
        p = '-' + p[1:]
    return p


def pattern(rhythm):
    head = rhythm.split('(')[0].replace('‌', ' ').split()
    if not head or any(w not in FEET for w in head):
        return None
    return ''.join(FEET[w] for w in head)


def main():
    if '--fetch' in sys.argv:
        req = urllib.request.Request('https://api.ganjoor.net/api/ganjoor/rhythms', headers={'User-Agent': 'urdu-bahr'})
        with urllib.request.urlopen(req, timeout=30) as r:
            data = json.loads(r.read().decode('utf-8'))
        with open(SRC, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=1)
    rhythms = json.load(open(SRC, encoding='utf-8'))
    urdu = {}
    for m in json.load(open(METERS, encoding='utf-8'))['standard']:
        raw = re.sub(r'[\s/]', '', m['pattern'])
        for first in (['=', '-'] if raw.startswith('=*') else [None]):
            p = (first + raw[2:]) if first else raw
            urdu.setdefault(key(p), []).append(m['id'])
    out = []
    for r in rhythms:
        p = pattern(r['rhythm'])
        if not p:
            continue
        m = re.search(r'\(([^)]*)\)', r['rhythm'])
        out.append({
            'gid': r['id'],
            'rhythm': r['rhythm'],
            'name': m.group(1).strip() if m else '',
            'verses': r['verseCount'],
            'pattern': p,
            'key': key(p),
            'urdu': sorted(set(urdu.get(key(p), [])), key=str),
        })
    out.sort(key=lambda x: -x['verses'])
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, separators=(',', ':'))
    total = sum(r['verseCount'] for r in rhythms)
    covered = sum(x['verses'] for x in out if x['urdu'])
    print(f'{len(out)} Persian meters ({len(rhythms) - len(out)} unparsed); '
          f'{covered / total:.1%} of Ganjoor verses are in a standard Urdu meter')


if __name__ == '__main__':
    main()
