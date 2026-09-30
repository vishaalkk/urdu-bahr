"""The definitive word list, seeded from Frances Pritchett's Ghalib and Mir.

data/fran_lexicon.json maps each word, keyed by its undiacritized Urdu spelling (how
people type it), to every spelling Fran uses for it: her ASCII, Roman, the Urdu as
her transcription renders it, how often, and where (ghazal ids). A key with more than
one spelling is `ambiguous`: typed text alone can't decide it (میں maiñ/meñ,
کیا kyā/kiyā, iẓāfat), so meter or context must.

Only sourced entries belong here. Rebuild after adding a corpus:
    uv run python scripts/build_fran_lexicon.py"""
import json, re, unicodedata
from collections import defaultdict

MARKS = re.compile('[ً-ٰٟـ‌‍]')
def key(w):
    w = unicodedata.normalize('NFC', w)
    return MARKS.sub('', w).replace('ي', 'ی').replace('ى', 'ی').replace('ك', 'ک').replace('ه', 'ہ')

CORPORA = [('ghalib', 'data/ghalib_extended.json', lambda g: f"G{g['id']}"),
           ('mir', 'data/mir_extended.json', lambda g: f"M{g.get('source_id') or g['id']}")]
def split_hyphens(tokens):
    """Fran hyphenates compounds (kaav-kaav-e, ((ajz-o-qaalib) where Urdu writes separate
    words: split them, keeping iẓāfat -e on its word and -o- as the word و."""
    out = []
    for t in tokens:
        parts = t.split('-')
        for i, p in enumerate(parts):
            if i and p in ('e', 'ye') and out: out[-1] += '-' + p
            elif p: out.append(p)
    return out

forms = defaultdict(lambda: defaultdict(lambda: {'n': 0, 'src': set()}))
skipped = 0
for name, path, gid in CORPORA:
    for g in json.load(open(path, encoding='utf-8')):
        for l in g['lines']:
            ur, asc, ro = l['ur'].split(), l['ascii'].split(), l['ro'].split()
            if len(ur) != len(asc):
                asc, ro = split_hyphens(asc), split_hyphens(ro)
            if not (len(ur) == len(asc) == len(ro)):
                skipped += 1
                continue
            for u, a, r in zip(ur, asc, ro):
                f = forms[key(u)][a]
                f['n'] += 1; f['ro'] = r; f['ur'] = unicodedata.normalize('NFC', u)
                if len(f['src']) < 8: f['src'].add(gid(g))

lex = {}
for k in sorted(forms):
    fs = sorted(forms[k].items(), key=lambda kv: -kv[1]['n'])
    lex[k] = {'forms': [{'ascii': a, 'ro': f['ro'], 'ur': f['ur'], 'n': f['n'], 'src': sorted(f['src'])} for a, f in fs]}
    if len(fs) > 1: lex[k]['ambiguous'] = True
out = {'about': 'Words from Frances W. Pritchett\'s Ghalib (franpritchett.com/00ghalib) and Mir (franpritchett.com/00garden) '
                'transcriptions. Key: undiacritized Urdu. Built by scripts/build_fran_lexicon.py.',
       'words': lex}
json.dump(out, open('data/fran_lexicon.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
amb = sum(1 for v in lex.values() if v.get('ambiguous'))
print(f"{len(lex)} words, {amb} ambiguous ({100*amb/len(lex):.1f}%); {skipped} lines skipped (word counts differ across scripts)")
for k in ['میں', 'کیا', 'حسرت', 'دل', 'ستاروں']:
    v = lex.get(k); print(k, [(f['ro'], f['n']) for f in v['forms']] if v else '—')
