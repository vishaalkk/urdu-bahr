"""Shared by build_collocations.py and colloc_benchmark.py: corpus loading, tokens, the table, and its scoring.

The task a collocation table serves: a typed word has several spellings in the corpora that share one casual key
(rah رہ / raah راہ, ab اب / aab آب); pick one from its neighbours. Everything here is keyed by casual key, the same
fold the app uses to look a typed word up (src/js/05-translit-helpers.js casualKey, level 1).
"""
import glob
import json
import os
import re
from collections import Counter, defaultdict

DATA = os.path.join(os.path.dirname(__file__), '..', 'data')
NON_LATIN = re.compile(r'[؀-ۿऀ-ॿ]')


def load(rel):
    with open(os.path.join(DATA, rel), encoding='utf-8') as f:
        return json.load(f)


def casual_key(a, level=1):
    a = a.lower().replace(';g', 'gh').replace(';x', 'kh')
    a = re.sub(r"[;.:()'’‘ʿʾ-]", '', a)
    a = a.replace('oo', 'uu').replace('w', 'v')
    if level >= 1:
        a = a.replace('aa', 'a').replace('ii', 'i').replace('uu', 'u')
    if level >= 2:
        a = a.replace('o', 'u').replace('e', 'i')
    return re.sub(r'(.)\1+' if level >= 1 else r'([^aiu])\1+', r'\1', a)   # same as casualKey() in src/js/05-translit-helpers.js


def label(w):
    """The distinction a table must decide: the strict casual key (long vowels kept, marks and case-coded letters
    ignored), so ra;ng/rang or ((ishq/ishq are one spelling but rah/raah are two. The app's own ROMAN_CASUAL_MAP[0] is
    keyed the same way, so a table that answers with this label needs no other spelling data."""
    return casual_key(w, 0)


def split_hyphens(tokens):
    """Split hyphenated compounds, keeping iẓāfat -e/-ye on its word (the -o- conjunction is its own word)."""
    out = []
    for t in tokens:
        for i, p in enumerate(t.split('-')):
            if i and p in ('e', 'ye') and out:
                out[-1] += '-' + p
            elif p:
                out.append(p)
    return out


def tokens_of(ascii_line):
    toks = [re.sub(r'-(e|ye)$', '', x) for x in split_hyphens(ascii_line.split())]
    return [x for x in toks if x and '-' not in x]


# Pure letter map of Rekhta Roman -> Pritchett-style ASCII. No lexicon, no aliases: the label comes from what the
# Roman itself says (rāh vs rah), not from the app's own guesses. Retroflex marks use the verified corpora's ;T ;D ;R.
_LETTERS = [('ā', 'aa'), ('ī', 'ii'), ('ū', 'uu'), ('ñ', ';N'), ('ġh', ';G'), ('ġ', ';G'), ('ḳh', ';x'), ('ḳ', ';x'),
            ('ṭ', ';T'), ('ḍ', ';D'), ('ṛ', ';R'), ('ṣ', '.s'), ('ż', ';z'), ('ẕ', ';z'), ('ẓ', '.z'), ('ṡ', ';s'),
            ('ḥ', ';h'), ('ʿ', '(('), ('’', '))'), ('ʾ', '))'), ("'", '))')]


def letter_ascii(ro):
    s = ro.lower()
    for a, b in _LETTERS:
        s = s.replace(a, b)
    return re.sub(r';N(?=g|j|d|k|t|ch)', 'n', s)


class Corpus:
    """Groups of token lines. group = one ghazal (the unit held out in a split); src = 'V' verified, 'R' Rekhta."""

    def __init__(self):
        self.groups = []   # (src, ghazal key, [token lists])

    def add(self, src, key, lines):
        lines = [t for t in lines if t]
        if lines:
            self.groups.append((src, key, lines))


def load_corpus(rekhta='letters'):
    """rekhta: 'letters' (pure letter map of ro), 'stored' (the scanned files' ascii, built through the app's own
    casual lookup), or None for the verified corpora only."""
    c = Corpus()
    for name in ('exercises_verified', 'ghalib_extended', 'mir_extended'):
        for i, g in enumerate(load(name + '.json')):
            c.add('V', f'{name}/{i}', [tokens_of(l.get('ascii', '')) for l in g.get('lines', [])])
    for i, p in enumerate(load('iqbal_corpus.json')):
        if p.get('lines') and isinstance(p['lines'][0], dict):
            c.add('V', f'iqbal/{i}', [tokens_of(l.get('ascii', '')) for l in p['lines']])
    for i, g in enumerate(load('others_extended.json')):
        c.add('V', f'others/{i}', [tokens_of(l.get('ascii', '')) for l in g['lines'] if l.get('verified')])
    if rekhta:
        files = sorted(glob.glob(os.path.join(DATA, 'poets_scanned', '*.json'))) + [os.path.join(DATA, 'faiz_scanned.json')]
        for f in files:
            for g in json.load(open(f, encoding='utf-8')):
                lines = []
                for l in g['lines']:
                    if rekhta == 'letters':
                        a = '' if (not l['ro'] or NON_LATIN.search(l['ro'])) else letter_ascii(l['ro'])
                    else:
                        a = l.get('ascii', '')
                    lines.append(tokens_of(a))
                c.add('R', f"{os.path.basename(f)}/{g['id']}", lines)
    return c


def spelling_stats(groups):
    kc = defaultdict(Counter)
    for _, _, lines in groups:
        for t in lines:
            for w in t:
                kc[casual_key(w)][label(w)] += 1
    return kc


MIN_SECOND = 3   # a key is ambiguous only if a second spelling occurs this often (single typos are not ambiguity)


class Table:
    """Decision list: most specific context first. Contexts are over casual keys:
       LR  'prev|k|next'   L2 'prev2 prev k'   R2 'k next next2'   L1 'prev k'   R1 'k next'."""
    ORDER = ('LR', 'L2', 'R2', 'L1', 'R1')

    def __init__(self, default, rules):
        self.default, self.rules = default, rules   # rules: {kind: {context: spelling}}

    def predict(self, toks, i):
        k = casual_key(toks[i])
        ck = [casual_key(t) for t in toks]
        n = len(toks)
        ctx = {
            'LR': f'{ck[i-1]}|{k}|{ck[i+1]}' if 0 < i < n - 1 else None,
            'L2': f'{ck[i-2]} {ck[i-1]} {k}' if i > 1 else None,
            'R2': f'{k} {ck[i+1]} {ck[i+2]}' if i < n - 2 else None,
            'L1': f'{ck[i-1]} {k}' if i > 0 else None,
            'R1': f'{k} {ck[i+1]}' if i < n - 1 else None,
        }
        for kind in self.ORDER:
            c = ctx[kind]
            if c and c in self.rules.get(kind, {}):
                return self.rules[kind][c], kind
        return self.default.get(k, label(toks[i])), None


def target_key(kind, ctx):
    """The key being disambiguated inside a context string."""
    return ctx.split('|')[1] if kind == 'LR' else ctx.split()[{'L1': 1, 'L2': 2, 'R1': 0, 'R2': 0}[kind]]


def build_table(groups, kinds=('L1', 'R1'), min_n=3, purity=0.9, min_groups=2):
    kc = spelling_stats(groups)
    default = {k: c.most_common(1)[0][0] for k, c in kc.items()}
    ambiguous = {k for k, c in kc.items() if sum(1 for w, n in c.items() if n >= MIN_SECOND) > 1 or
                 (len(c) > 1 and c.most_common(2)[1][1] >= MIN_SECOND)}
    seen = {kind: defaultdict(Counter) for kind in kinds}
    gsets = {kind: defaultdict(lambda: defaultdict(set)) for kind in kinds}
    for _, gkey, lines in groups:
        for t in lines:
            ck = [casual_key(x) for x in t]
            n = len(t)
            for i, w in enumerate(t):
                k = ck[i]
                if k not in ambiguous:
                    continue
                ctxs = {
                    'LR': f'{ck[i-1]}|{k}|{ck[i+1]}' if 0 < i < n - 1 else None,
                    'L2': f'{ck[i-2]} {ck[i-1]} {k}' if i > 1 else None,
                    'R2': f'{k} {ck[i+1]} {ck[i+2]}' if i < n - 2 else None,
                    'L1': f'{ck[i-1]} {k}' if i > 0 else None,
                    'R1': f'{k} {ck[i+1]}' if i < n - 1 else None,
                }
                for kind in kinds:
                    c = ctxs[kind]
                    if c:
                        seen[kind][c][label(w)] += 1
                        gsets[kind][c][label(w)].add(gkey)
    rules = {kind: {} for kind in kinds}
    for kind in kinds:
        for c, cnt in seen[kind].items():
            tot = sum(cnt.values())
            w, n = cnt.most_common(1)[0]   # w is a label
            k = target_key(kind, c)
            if tot >= min_n and n / tot >= purity and w != default.get(k) and len(gsets[kind][c][w]) >= min_groups:
                rules[kind][c] = w
    return Table(default, rules)


def evaluate(table, test_groups, ambiguous_keys):
    n = ok_default = ok_table = fixed = broke = hits = 0
    by_kind = Counter()
    for _, _, lines in test_groups:
        for t in lines:
            for i, w in enumerate(t):
                k = casual_key(w)
                if k not in ambiguous_keys:
                    continue
                n += 1
                d = table.default.get(k, label(w))
                p, kind = table.predict(t, i)
                ok_default += d == label(w)
                ok_table += p == label(w)
                if kind:
                    hits += 1
                    by_kind[kind] += 1
                if p != d:
                    fixed += (p == label(w) and d != label(w))
                    broke += (d == label(w) and p != label(w))
    return dict(n=n, default=round(ok_default / n, 4), table=round(ok_table / n, 4), hits=hits, fixed=fixed, broke=broke,
                net=fixed - broke, by_kind=dict(by_kind))


def ambiguous_in(groups):
    return {k for k, c in spelling_stats(groups).items() if len(c) > 1 and c.most_common(2)[1][1] >= MIN_SECOND}
