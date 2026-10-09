#!/usr/bin/env python3
"""
scripts/compare_sufinama_ganjoor.py

Sufinama's Persian text against Ganjoor's, word by word, for every Sufinama ghazal matched to Ganjoor
(tests/data/persian_gold.json, scripts/match_ganjoor.py: `fa` holds the Ganjoor hemistich each of our lines matches).
Ganjoor's words are the authority; Sufinama's Roman is kept for what Ganjoor does not write (iẓāfat, short vowels).

Each difference is one of:
  spelling  the same word in the two orthographies (روئے / روی, سنگیں دل / سنگین‌دل, غماز است / غمازست): nothing to do
  typo      Sufinama's Urdu letters are wrong but its Roman spells Ganjoor's word (ہدیں badīñ / بدین): fix the letters,
            keep the Roman
  variant   a different word (Sufinama روزے مستیٔ / Ganjoor دردی سوخته‌ست): take Ganjoor's words; their Roman comes
            from the Persian word list (data/fa_lexicon.json) where it has them, else the line is left for review

Writes data/sufinama_ganjoor_diff.json (gitignored, a review file) and prints a summary.

    python3 scripts/compare_sufinama_ganjoor.py                 # all matched ghazals
    python3 scripts/compare_sufinama_ganjoor.py --url man-badiin  # one ghazal, every line printed
"""
import difflib, json, os, re, sys, unicodedata

ROOT = os.path.join(os.path.dirname(__file__), '..')
SUFINAMA = os.path.join(ROOT, 'data', 'sufinama_ghazals.json')
GOLD = os.path.join(ROOT, 'tests', 'data', 'persian_gold.json')
LEXICON = os.path.join(ROOT, 'data', 'fa_lexicon.json')
OUT = os.path.join(ROOT, 'data', 'sufinama_ganjoor_diff.json')

FOLD = str.maketrans({'ہ': 'ه', 'ۂ': 'ه', 'ۀ': 'ه', 'ة': 'ه', 'ھ': 'ه', 'ے': 'ی', 'ي': 'ی', 'ى': 'ی', 'ئ': 'ی',
                      'ك': 'ک', 'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ٱ': 'ا', 'ؤ': 'و', 'ں': 'ن'})
MARKS = re.compile(r'[ً-ٰٕٔؔ]')
# consonant skeletons (as scripts/lib_fa_lexicon.js): vowels and و ی ه ح ع left out, doubles merged
SKEL_FA = {'ب': 'b', 'پ': 'p', 'ت': 't', 'ط': 't', 'ث': 's', 'س': 's', 'ص': 's', 'ج': 'j', 'چ': 'c', 'خ': 'x', 'د': 'd',
           'ذ': 'z', 'ز': 'z', 'ض': 'z', 'ظ': 'z', 'ژ': 'z', 'ر': 'r', 'ش': 'S', 'غ': 'g', 'ف': 'f', 'ق': 'q', 'ک': 'k',
           'ك': 'k', 'گ': 'g', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ں': 'n'}


def fold(w):
    return re.sub(r'[^ء-ۓ]', '', MARKS.sub('', w).translate(FOLD))


def spelling_fold(s):
    """what two orthographies of the same words share: no spaces, ast contracted, yā-e vahdat / iẓāfat ی collapsed"""
    s = fold(re.sub(r'(^|\s)به\s', r'\1ب', s.replace('بہ ', 'به ')))   # به سر / بسر
    s = re.sub(r'ه?ا?ست', 'ست', s)
    return re.sub(r'ی+', 'ی', s)


def skel_fa(w):
    return re.sub(r'(.)\1+', r'\1', ''.join(SKEL_FA.get(c, '') for c in w))


def skel_ro(r):
    s = unicodedata.normalize('NFD', r.lower())
    s = re.sub(r'[̀-ͯ]', '', s)
    for a, b in (('kh', 'x'), ('gh', 'g'), ('sh', 'S'), ('ch', 'c'), ('zh', 'z')):
        s = s.replace(a, b)
    s = re.sub(r'[^a-zS]', '', s)
    s = re.sub(r'[aeiouyvwh]', '', s)
    return re.sub(r'(.)\1+', r'\1', s)


def words(s):
    return [w for w in re.split(r'[\s‌،,.!؟?]+', MARKS.sub('', s)) if w]


def roman_words(ro, urdu):
    """Sufinama's Roman, one entry per Urdu word: hyphens join words (ḳhūbī-o-zebā.ī) but also prefixes (na-dīdam is one
       word), so parts are taken for each word until they spell (nearly) as many consonants as it has; a bare -e- / -ye- is the
       iẓāfat, no word of its own: it stays on the word before (chashm-e). None when the two do not come out even."""
    parts = []
    for p in re.split(r'[\s-]+', ro.replace("'", '')):
        if p in ('e', 'ye', 'é') and parts:
            parts[-1] += '-' + p
        elif p:
            parts.append(p)
    out, i = [], 0
    for w in urdu:
        if i >= len(parts):
            return None
        need, acc = len(skel_fa(w)), parts[i]
        need -= need >= 3   # the Roman may drop one (sañgī-dil for سنگیں دل)
        i += 1
        while len(skel_ro(acc)) < need and i < len(parts):
            acc, i = acc + '-' + parts[i], i + 1
        out.append(acc)
    return out if i == len(parts) else None


def to_urdu(w):
    """a Ganjoor word in Sufinama's (Urdu) spelling"""
    w = w.replace('ي', 'ی').replace('ك', 'ک').replace('هٔ', 'ۂ').replace('ۀ', 'ۂ').replace('ه', 'ہ')
    return re.sub(r'([آاوی])ن$', r'\1ں', w)


STEINGASS = None


def steingass():
    """Steingass headword -> its Roman in Sufinama's letters (data/fa_steingass.tsv, scripts/import_steingass.py)"""
    global STEINGASS
    if STEINGASS is None:
        STEINGASS = {}
        path = os.path.join(ROOT, 'data', 'fa_steingass.tsv')
        for line in open(path, encoding='utf-8') if os.path.exists(path) else []:
            fa, ro = line.rstrip('\n').split('\t')
            ro = unicodedata.normalize('NFD', ro)
            ro = ro.replace('k\u0331h\u0331', 'ḳh').replace('g\u0331h\u0331', 'ġh').replace('t\u0331h\u0331', 's')
            ro = re.sub(r'[\u0331\u0324\u0323]', '', unicodedata.normalize('NFC', ro)).replace('ẖ', 'h').replace('w', 'v')
            STEINGASS.setdefault(fa, ro.replace('‘', '').replace('’', ''))
    return STEINGASS


def roman_for(g, sufinama_roman, lex):
    """Roman for a Ganjoor word: Sufinama's own where it spells the same consonants (روی → ruue), else the Persian word
       list (data/fa_lexicon.json), else Steingass"""
    same = [r for r in sufinama_roman if skel_ro(r) == skel_fa(g)]
    if same:
        return same[0]
    hit = lex.get(to_urdu(g))
    if hit:
        return hit[0]
    return steingass().get(MARKS.sub('', g).replace('ي', 'ی').replace('ك', 'ک'))


def compare_line(ur, ro, gj, lex):
    su, gw = words(ur), words(gj)
    rw = roman_words(ro, su)
    diffs, new_ur, new_ro = [], [], []
    sm = difflib.SequenceMatcher(None, [fold(w) for w in su], [fold(w) for w in gw], autojunk=False)
    for op, a1, a2, b1, b2 in sm.get_opcodes():
        s, g = su[a1:a2], gw[b1:b2]
        r = rw[a1:a2] if rw else None
        if op == 'equal':
            new_ur += s
            new_ro += r or []
            continue
        if spelling_fold(' '.join(s)) == spelling_fold(' '.join(g)):
            kind = 'spelling'
        elif r and len(s) == len(g) and all(skel_ro(x) == skel_fa(y) != skel_fa(z) for x, y, z in zip(r, g, s)):
            kind = 'typo'
        elif r and skel_ro(''.join(r)) == skel_fa(''.join(g)):
            kind = 'spelling'   # the same consonants, split or joined differently
        else:
            kind = 'variant'
        d = {'kind': kind, 'sufinama': ' '.join(s), 'ganjoor': ' '.join(g)}
        if r:
            d['roman'] = ' '.join(r)
        if kind == 'typo':
            d['fix'] = ' '.join(to_urdu(x) for x in g)
        if kind == 'variant':
            d['fix'] = ' '.join(to_urdu(x) for x in g)
            got = [roman_for(x, r or [], lex) for x in g]
            d['fix_roman'] = ' '.join(got) if all(got) else None
        diffs.append(d)
        # the corrected line: Sufinama's words where only the spelling differs, Ganjoor's otherwise
        if kind == 'spelling':
            new_ur += s
            new_ro += r or []
        else:
            new_ur += d['fix'].split()
            new_ro += (r or []) if kind == 'typo' else (d['fix_roman'] or '').split()
    fixed = {'ur': ' '.join(new_ur)}
    if rw and len(new_ro) == len(new_ur):
        fixed['ro'] = ' '.join(new_ro)
    return diffs, fixed


def main():
    only = sys.argv[sys.argv.index('--url') + 1] if '--url' in sys.argv else None
    suf = {g['url']: g for g in json.load(open(SUFINAMA, encoding='utf-8'))}
    lex = json.load(open(LEXICON, encoding='utf-8'))
    out, n = [], {'lines': 0, 'unmatched': 0, 'same': 0, 'spelling': 0, 'typo': 0, 'variant': 0}
    for gold in json.load(open(GOLD, encoding='utf-8')):
        g = suf.get(gold['url'])
        if not g or not gold.get('ganjoor') or not gold.get('fa') or (only and only not in gold['url']):
            continue
        rows = []
        for i, (l, gj) in enumerate(zip(g['lines'], gold['fa'])):
            n['lines'] += 1
            if not gj:
                n['unmatched'] += 1
                continue
            diffs, fixed = compare_line(l['ur'], l.get('ro', ''), gj, lex)
            kinds = {d['kind'] for d in diffs} - {'spelling'}
            n['same' if not diffs else 'spelling' if not kinds else 'variant' if 'variant' in kinds else 'typo'] += 1
            if kinds or only:
                rows.append({'line': i, 'ur': l['ur'], 'ro': l.get('ro', ''), 'ganjoor': gj, 'diffs': diffs, 'fixed': fixed})
        if rows:
            out.append({'url': gold['url'], 'ganjoor': gold['ganjoor']['url'], 'lines': rows})
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(f"{n['lines']} lines: {n['same']} identical, {n['spelling']} spelling only, {n['typo']} with a typo, "
          f"{n['variant']} with a different word, {n['unmatched']} not found on Ganjoor -> {os.path.relpath(OUT, ROOT)}")
    if only:
        for gh in out:
            print(gh['url'], '\n', gh['ganjoor'])
            for r in gh['lines']:
                print(f"\n{r['line']:>2} S {r['ur']}\n   R {r['ro']}\n   G {r['ganjoor']}")
                for d in r['diffs']:
                    extra = f"  -> {d['fix']}" + (f" [{d['fix_roman']}]" if d.get('fix_roman') else '') if d.get('fix') else ''
                    print(f"     {d['kind']:<8} {d['sufinama']} | {d['ganjoor']}" + (f" ({d['roman']})" if d.get('roman') else '') + extra)


if __name__ == '__main__':
    main()
