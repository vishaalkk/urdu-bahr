#!/usr/bin/env python3
"""Held-out benchmark for the collocation table (see colloc_lib.py for the task).

    uv run python scripts/colloc_benchmark.py            # the variants below, 3 random splits each
    uv run python scripts/colloc_benchmark.py --check    # exit 1 if the shipped config's net gain is not positive

Split is by ghazal. 'gold' = the verified Ghalib/Mir/Iqbal/exercises spellings (hand-checked); 'rekhta' = labels from
a pure letter map of Rekhta's Roman. The number to watch is `net` (words fixed minus words broken against the plain
most-frequent-spelling default), and gold is the one that counts: it is what a table trained on Rekhta must still get right.
"""
import random
import sys
from statistics import mean

from colloc_lib import ambiguous_in, build_table, evaluate, load_corpus

VARIANTS = {
    'L1+R1':                dict(kinds=('L1', 'R1')),
    'L1+R1 +trigrams':      dict(kinds=('LR', 'L2', 'R2', 'L1', 'R1')),
    'L1+R1 loose (n>=2, 80%)': dict(kinds=('L1', 'R1'), min_n=2, purity=0.8, min_groups=1),
}


def split(groups, seed, frac=0.2):
    g = list(groups)
    random.Random(seed).shuffle(g)
    k = int(len(g) * frac)
    return g[k:], g[:k]


def run(rekhta, variant, held_src, seeds=(1, 2, 3)):
    corpus = load_corpus(rekhta)
    res = []
    for seed in seeds:
        held = [g for g in corpus.groups if g[0] == held_src]
        rest = [g for g in corpus.groups if g[0] != held_src]
        tr_h, te = split(held, seed)
        train = rest + tr_h
        table = build_table(train, **variant)
        res.append((evaluate(table, te, ambiguous_in(train)), sum(len(v) for v in table.rules.values())))
    return res


def fmt(res):
    r = [x for x, _ in res]
    return (f"default {mean(x['default'] for x in r):.3f} -> table {mean(x['table'] for x in r):.3f}  "
            f"fixed {mean(x['fixed'] for x in r):.0f} broke {mean(x['broke'] for x in r):.0f} net {mean(x['net'] for x in r):+.0f}  "
            f"rules {mean(n for _, n in res):.0f}  (test words {mean(x['n'] for x in r):.0f})")


if __name__ == '__main__':
    if '--check' in sys.argv:
        res = run('letters', VARIANTS['L1+R1'], 'V')
        net = mean(x['net'] for x, _ in res)
        print(fmt(res))
        sys.exit(0 if net > 0 else 1)
    for rek in (None, 'stored', 'letters'):
        print(f"\n== Rekhta labels: {rek or 'not used (verified only)'}")
        for name, v in VARIANTS.items():
            print(f"  [gold held out] {name:28} {fmt(run(rek, v, 'V'))}")
            if rek:
                print(f"  [rekhta held out] {name:26} {fmt(run(rek, v, 'R'))}")
