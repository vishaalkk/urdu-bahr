#!/usr/bin/env python3
"""Learn P(hidden feature | cheap surface features) from aligned (Urdu, Pritchett ASCII) lines.

Hidden features (both invisible in unvocalized Urdu, both spelled out in Pritchett's ASCII):
  iz   the word is followed by an unwritten iza:fat            (ASCII word ends -e / -i)
  vao  a medial و inside one written word is the short
       conjunctive o (kaar-o-baar)                             (ASCII has -o-)
A small L2 logistic regression over closed-class surface features (final letter class, length, next
letter class, function-word class, position). NO content-word lists. The model becomes a capped
extra cost for an alternative reading in the engine (src/js/01b-hypothesis-costs.js, generated).

  uv run python scripts/learn_hypotheses.py --report      labels, base rates, AUC (train G+M, held-out, LOSO)
  uv run python scripts/learn_hypotheses.py --export      also write src/js/01b-hypothesis-costs.js
  options: --iz-scale --iz-floor --iz-cap --vao-scale --vao-floor --vao-cap (engine cost mapping), --all (export model fit on all sources)
"""
import argparse, json, math, os, re, sys, unicodedata
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCES = {
    'ghalib': 'data/ghalib_extended.json', 'mir': 'data/mir_extended.json',
    'handbook': 'data/exercises_verified.json', 'iqbal': 'data/iqbal_corpus.json',
    'urdupoetry': 'data/urdupoetry_verses.json',
}
TRAIN = ['ghalib', 'mir']
HELD = ['handbook', 'iqbal', 'urdupoetry']

# closed grammatical class (postpositions, auxiliaries, pronouns, conjunctions): not content words
FUNC = set('کا کی کے کو سے میں نے پر تک ہے ہیں تھا تھی تھے ہوں ہو ہی بھی تو نہ کہ کیا کیوں جو یہ وہ اس ان اک ایک اور یا گر مگر ہم تم مجھ تجھ ہمیں تمہیں نہیں جب تب اب کچھ اسے انہیں جس جن ہوا کر'.split())

MARKS = re.compile('[ً-ٰٟـ‌‍ّ]')
def letters(w):
    w = unicodedata.normalize('NFC', w)
    w = MARKS.sub('', w).replace('ۂ', 'ہ').replace('ۀ', 'ہ')
    return w.replace('ي', 'ی').replace('ى', 'ی').replace('ك', 'ک').replace('ه', 'ہ')
def nlen(w): return len([c for c in w if c != 'ھ'])
def cls(c):
    if c in 'اآ': return 'A'
    if c == 'ی': return 'I'
    if c == 'ے': return 'E'
    if c == 'و': return 'W'
    if c == 'ہ': return 'H'
    if c == 'ں': return 'N'
    if c in 'ءئ': return 'Z'
    if c == 'ن': return 'n'
    return 'C'
def lastc(w, k):
    b = [c for c in w if c != 'ھ']
    return cls(b[-k]) if len(b) >= k else '^'

UR_PUNCT = re.compile('[،۔؟!,.;:?"\'«»()\\[\\]]')
def ur_tokens(s): return UR_PUNCT.sub(' ', s).split()
def as_tokens(s): return re.sub('[,!?"]', ' ', s).split()

def ur_units(s):
    """A standalone و/او merges its neighbours into one unit (spaced=True)."""
    out = []
    for t in ur_tokens(s):
        if letters(t) in ('و', 'او') and out:
            out[-1]['pend'] = True; continue
        if out and out[-1].get('pend'):
            out[-1]['pend'] = False; out[-1]['segs'].append(t); out[-1]['spaced'] = True; continue
        out.append({'segs': [t], 'spaced': False})
    return out

def as_units(s):
    out = []
    for tok in as_tokens(s):
        if tok == 'o' and out:
            out[-1]['pend'] = True; continue
        if out and out[-1].get('pend'):
            out[-1]['pend'] = False; out[-1]['segs'].append(tok); out[-1]['conj'] = True; continue
        cur = None; link = False
        for p in tok.split('-'):
            if p == '': continue
            if p in ('e', 'i') and cur is not None: cur['iz'] = True; continue
            if p == 'o' and cur is not None: link = True; continue
            if link: cur['segs'].append(p); cur['conj'] = True; link = False; continue
            cur = {'segs': [p], 'conj': False, 'iz': False}; out.append(cur)
    return out

def align(ur, asc):
    U, A = ur_units(ur), as_units(asc)
    return list(zip(U, A)) if len(U) == len(A) and U else None

def load(name):
    d = json.load(open(os.path.join(ROOT, SOURCES[name]), encoding='utf8'))
    return [l for g in d for l in g['lines'] if l.get('ur') and l.get('ascii')]

# ---------- features (mirrored exactly in src/js/01-engine.js hypIzFeats / hypVaoFeats) ----------
def first_cls(w):
    c = w[:1]
    if not c: return '^'
    if c in 'اآ': return 'A'
    if c in 'ویے': return 'V'
    return 'C'
def iz_feats(w, nx, i, n):
    l1 = lastc(w, 1); fc = first_cls(nx); nf = str(int(nx in FUNC))
    return ['b', 'fin:' + l1, 'pen:' + lastc(w, 2), 'len:' + str(min(nlen(w), 6)), 'nxt:' + fc,
            'nfw:' + nf, 'cfw:' + str(int(w in FUNC)), 'pos:' + ('0' if i == 0 else 'p' if i == n - 2 else 'm'),
            'finXnxt:' + l1 + fc, 'finXnfw:' + l1 + nf]
def vao_feats(w, j):
    pre, post = w[:j], w[j + 1:]
    return ['b', 'p:' + str(min(nlen(pre), 5)), 's:' + str(min(nlen(post), 5)), 'pl:' + lastc(pre, 1),
            'sf:' + first_cls(post), 'sl:' + lastc(post, 1), 'w:' + str(min(nlen(w), 8)),
            'plXsf:' + lastc(pre, 1) + first_cls(post)]

def build(name):
    iz, vao, st = [], [], Counter()
    for l in load(name):
        st['lines'] += 1
        al = align(l['ur'], l['ascii'])
        if not al: st['skipped'] += 1; continue
        st['aligned'] += 1
        n = len(al)
        for i, (u, a) in enumerate(al):
            segs = [letters(x) for x in u['segs']]
            if i < n - 1 and (u['spaced'] or not a['conj']):
                nx = letters(al[i + 1][0]['segs'][0])
                iz.append((iz_feats(segs[-1], nx, i, n), int(a['iz'])))
                st['iz_n'] += 1; st['iz_pos'] += int(a['iz'])
            if u['spaced'] and len(segs) == 2:
                vao.append((vao_feats(segs[0] + 'و' + segs[1], len(segs[0])), 1)); st['vao_pos'] += 1; st['vao_n'] += 1
            elif not u['spaced'] and len(segs) == 1:
                w = segs[0]
                cands = [j for j, c in enumerate(w) if c == 'و' and nlen(w[:j]) >= 2 and nlen(w[j + 1:]) >= 2]
                if a['conj']:
                    if len(cands) == 1:
                        vao.append((vao_feats(w, cands[0]), 1)); st['vao_pos'] += 1; st['vao_n'] += 1; st['vao_natural_pos'] += 1
                else:
                    for j in cands:
                        vao.append((vao_feats(w, j), 0)); st['vao_n'] += 1
    return iz, vao, st

# ---------- logistic regression (Adagrad, L2) ----------
def sig(z): return 1 / (1 + math.exp(-max(-30, min(30, z))))
def train(data, l2=1.0, epochs=40, lr=0.3):
    w, g2, n = {}, {}, len(data)
    for _ in range(epochs):
        for fs, y in data:
            e = sig(sum(w.get(f, 0.0) for f in fs)) - y
            for f in fs:
                gr = e + (0 if f == 'b' else l2 * w.get(f, 0.0) / n)
                g2[f] = g2.get(f, 0.0) + gr * gr
                w[f] = w.get(f, 0.0) - lr * gr / math.sqrt(g2[f] + 1e-8)
    return w
def prob(w, fs): return sig(sum(w.get(f, 0.0) for f in fs))
def auc(scores, labels):
    npos = sum(labels); nneg = len(labels) - npos
    if not npos or not nneg: return float('nan')
    order = sorted(range(len(scores)), key=lambda i: scores[i]); ranks = [0.0] * len(scores); i = 0
    while i < len(order):
        j = i
        while j + 1 < len(order) and scores[order[j + 1]] == scores[order[i]]: j += 1
        for k in range(i, j + 1): ranks[order[k]] = (i + j) / 2 + 1
        i = j + 1
    return (sum(r for r, y in zip(ranks, labels) if y) - npos * (npos + 1) / 2) / (npos * nneg)
def evalset(w, data):
    if not data: return None
    sc = [prob(w, fs) for fs, _ in data]; ys = [y for _, y in data]; base = sum(ys) / len(ys)
    k = max(1, len(sc) // 5); top = sorted(range(len(sc)), key=lambda i: -sc[i])[:k]
    ll = -sum(math.log(max(1e-9, p if y else 1 - p)) for p, y in zip(sc, ys)) / len(ys)
    cl = -(base * math.log(max(base, 1e-9)) + (1 - base) * math.log(max(1 - base, 1e-9)))
    return {'n': len(ys), 'pos': sum(ys), 'base': base, 'auc': auc(sc, ys), 'prec': sum(ys[i] for i in top) / k, 'll': ll, 'cll': cl}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--report', action='store_true'); ap.add_argument('--export', action='store_true')
    ap.add_argument('--all', action='store_true'); ap.add_argument('--vao-shift', type=float, default=3.0); ap.add_argument('--l2', type=float, default=1.0)
    for k, d in (('iz-scale', 0.5), ('iz-floor', 0.4), ('iz-cap', 2.0), ('vao-scale', 0.5), ('vao-floor', 0.4), ('vao-cap', 2.6)):
        ap.add_argument('--' + k, type=float, default=d)
    a = ap.parse_args()
    D, S = {}, {}
    for s in SOURCES:
        iz, vao, st = build(s); D[s] = (iz, vao); S[s] = st
    print('== labels (Urdu stripped of all marks = unvocalized)')
    for s in SOURCES:
        st = S[s]
        print(f"{s:11} lines {st['lines']:5} aligned {st['aligned']:5} skipped {st['skipped']:4} | iz {st['iz_pos']:5}/{st['iz_n']:6} = {100*st['iz_pos']/max(1,st['iz_n']):5.1f}% | vao {st['vao_pos']:4}/{st['vao_n']:5} = {100*st['vao_pos']/max(1,st['vao_n']):5.1f}% (natural-joined positives {st['vao_natural_pos']})")
    pool = lambda names, k: [x for n in names for x in D[n][k]]
    res = {}
    for k, nm in ((0, 'iz'), (1, 'vao')):
        print(f'\n== {nm}: train ghalib+mir, test held-out')
        w = train(pool(TRAIN, k), a.l2); res[nm] = w
        for s in TRAIN + HELD:
            r = evalset(w, D[s][k])
            if r: print(f"  {s:11} n {r['n']:6} pos {r['pos']:5} base {r['base']:.3f}  AUC {r['auc']:.3f}  prec@top20% {r['prec']:.3f}  logloss {r['ll']:.3f} (const {r['cll']:.3f})")
        r = evalset(w, pool(HELD, k))
        if r: print(f"  HELD-OUT ALL n {r['n']} pos {r['pos']} base {r['base']:.3f}  AUC {r['auc']:.3f}  prec@top20% {r['prec']:.3f}  logloss {r['ll']:.3f} (const {r['cll']:.3f})")
        print(f'  leave-one-source-out ({nm})')
        for s in SOURCES:
            r = evalset(train(pool([n for n in SOURCES if n != s], k), a.l2), D[s][k])
            if r: print(f"    hold out {s:11} AUC {r['auc']:.3f}  prec@20% {r['prec']:.3f}  base {r['base']:.3f}")
        print('  biggest weights: ' + ', '.join(f'{f}={v:+.2f}' for f, v in sorted(w.items(), key=lambda kv: -abs(kv[1]))[:14]))
    if a.export:
        final = {k: train(pool(list(SOURCES), i), a.l2) for i, k in enumerate(('iz', 'vao'))} if a.all else res
        # vao positives are synthesised from spaced و (no corpus line types it joined), so the training base rate
        # (~52%) is not the rate for joined words in the wild: shift the bias down to a prior near 5%
        final = {k: dict(w) for k, w in final.items()}; final['vao']['b'] = final['vao'].get('b', 0.0) - a.vao_shift
        wz = {n: {f: round(v, 3) for f, v in w.items() if abs(v) > 0.005} for n, w in final.items()}
        samples = [('دل', 'ناداں', 0, 5), ('عشق', 'نے', 1, 6), ('شب', 'ہجر', 0, 4)]
        chk = [[x[0], x[1], x[2], x[3], round(prob({f: v for f, v in wz['iz'].items()}, iz_feats(letters(x[0]), letters(x[1]), x[2], x[3])), 4)] for x in samples]
        vchk = [[w_, j, round(prob(wz['vao'], vao_feats(letters(w_), j)), 4)] for w_, j in (('کاروبار', 3), ('دوستی', 1), ('رنگوبو', 3))]
        out = {'v': 1, 'trainedOn': 'all sources' if a.all else 'ghalib+mir',
               'iz': {'w': wz['iz'], 'scale': a.iz_scale, 'floor': a.iz_floor, 'cap': a.iz_cap},
               'vao': {'w': wz['vao'], 'scale': a.vao_scale, 'floor': a.vao_floor, 'cap': a.vao_cap},
               'func': sorted(FUNC), 'check': {'iz': chk, 'vao': vchk}}
        path = os.path.join(ROOT, 'src/js/01b-hypothesis-costs.js')
        with open(path, 'w', encoding='utf8') as f:
            f.write('/* GENERATED by scripts/learn_hypotheses.py --export; do not edit. Logistic weights for hidden-feature hypotheses\n   (unwritten iza:fat, short conjunctive o). cost = clamp(scale * -logit(p), floor, cap), added to the alternative reading.\n   Trained on ' + out['trainedOn'] + '. */\n')
            f.write('var HYP_COSTS = ' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n')
        print('wrote', path)

if __name__ == '__main__': main()
