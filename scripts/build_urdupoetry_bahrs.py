"""Rebuilds data/urdupoetry_bahrs.json from the raw article text (data/sources/urdupoetry_art5.html)
via a small deterministic converter from urdupoetry.com's informal ASCII to Pritchett ASCII
(as used throughout data/ghalib_extended.json / data/mir_extended.json), then hands off to
scripts/incorporate_urdupoetry.js to regenerate ur/hi/ro (Sean Pue's parsers) and scan/verify
each line against the app's matched meter.

The urdupoetry.com article writes its arkaan and ashaar with no macrons and a few
capital-letter conventions instead of Pritchett's semicolon digraphs:
  - 'Kh' (خ) / 'Gh' (غ) where Pritchett writes ';x' / ';G' (lowercase 'kh'/'gh' stay as
    the aspirated stops کھ/گھ in both conventions)
  - a capitalized retroflex letter (T/D/R, e.g. 'Thikaanaa' = ٹھکانا) where Pritchett
    writes ';T'/';D'/';R'
  - 'w' where Pritchett always writes 'v' (و is never 'w' in Fran's ASCII)
  - 'N' for nasalization (ں) where Pritchett writes ';N'
Everything else (long vowels aa/ii/uu, hamza as '))', iẓāfat as '-e-', 'q', the z-letters,
'ain as '(', doubled letters) already matches Pritchett's ASCII closely enough that the
per-word Fran-lexicon lookup (see below) cleans up the rest.

Run: uv run python scripts/build_urdupoetry_bahrs.py && node scripts/incorporate_urdupoetry.js
"""
import json, re

# ---- 1. Raw article text (own sher + classic sher per bah'r), transcribed verbatim from
# data/sources/urdupoetry_art5.html, with only the article's own inconsistent spelling of
# common words normalized (meiN/meN -> meN, kya/kyaa -> kyaa, ka/kaa -> kaa, ye/yeh -> yeh)
# so near-duplicates don't produce spurious "different word" lookups below. -----------------
BAHRS = [
 dict(n=1, name="Hazaj Saalim", arkan=["Ma-faa-ii-lun"]*4, weights="2-1-2-2 (x4)", matched_meter_id=26,
      own=("Irfan 'Abid' (article author)",
           ["bharii duniyaa sahii lekin Thikaanaa ham bhii paa leNge",
            "jahaaN do gaz zamiiN hogii wahiiN ham ghar banaa leNge"]),
      classic=("Allama 'Iqbal'",
           ["mitaa de apnii hastii ko agar kuchh martabaa chaahe",
            "ki daanaa Khaak meN mil kar gul-e-gulzaar hotaa hai"])),
 dict(n=2, name="Hazaj Musamman Akhrab", arkan=["Maf-uu-lu","Ma-faa-ii-lun","Maf-uu-lu","Ma-faa-ii-lun"],
      weights="2-2-1 / 2-1-2-2 (x2)", matched_meter_id=7,
      own=("Irfan 'Abid' (article author)",
           ["KhwaaboN meN banaaii thii aaNkhoN meN sajaa lii hai",
            "tasviir tirii ham ne is dil meN basaa lii hai"]),
      classic=("'Jigar' Moradabadi",
           ["kyaa husn ne samjhaa hai kyaa ishq ne jaanaa hai",
            "ham Khaak-nashiinoN kii thokar meN zamaanaa hai"])),
 dict(n=3, name="Hazaj Musamman Akhrab Makfuuf Mahzuuf",
      arkan=["Maf-uu-lu","Ma-faa-ii-lu","Ma-faa-ii-lu","Fa-uu-lun"],
      weights="2-2-1 / 2-1-1(2) / 2-1-1(2) / 1-2-2", matched_meter_id=8,
      own=("Irfan 'Abid' (article author)",
           ["tuufaan meN tinke kaa sahaaraa bhii bahut hai",
            "zulmat meN to bas ek sharaaraa bhii bahut hai"]),
      classic=("Mirza Ghalib",
           ["baaziichah-e-atfaal hai duniyaa mire aage",
            "hotaa hai shab-o-roz tamaashaa mire aage"])),
 dict(n=4, name="Hazaj Musaddas Mahzuuf", arkan=["Ma-faa-ii-lun","Ma-faa-ii-lun","Fa-uu-lun"],
      weights="2-1-2-2 (x2) / 1-2-2", matched_meter_id=27,
      own=("Irfan 'Abid' (article author)",
           ["tamannaaoN se aye dil kyaa milegaa",
            "jo qismat meN likhaa hogaa milegaa"]),
      classic=("'Firaq' Gorakhpuri",
           ["sitaaroN se ulajhtaa jaa rahaa huuN",
            "shab-e-furqat bahut ghabraa rahaa huuN"])),
 dict(n=5, name="Ramal Musamman Mahzuuf",
      arkan=["Faa-i-laa-tun","Faa-i-laa-tun","Faa-i-laa-tun","Faa-i-lun"],
      weights="2-1-1-2 (x3) / 2-1-2", matched_meter_id=10,
      own=("Irfan 'Abid' (article author)",
           ["dil kii bechainii ne apnaa kaam aaKhir kar diyaa",
            "tujh se mere raabte ko aam aaKhir kar diyaa"]),
      classic=("'Hasrat' Mohani",
           ["sab ghalat kahte haiN lutf-e-yaar ko wajh-e-sukuuN",
            "dard-e-dil us ne tau 'Hasrat' aur duunaa kar diyaa"])),
 dict(n=6, name="Ramal Musaddas Mahzuuf", arkan=["Faa-i-laa-tun","Faa-i-laa-tun","Faa-i-lun"],
      weights="2-1-1-2 (x2) / 2-1-2", matched_meter_id=11,
      own=("Irfan 'Abid' (article author)",
           ["ishq kaa haasil hai kyaa mat puuchhiye",
            "kyaa milaa kyaa kho gayaa mat puuchhiye"]),
      classic=("Meer Taqi 'Meer'",
           ["ibtidaa-e-ishq hai rotaa hai kyaa",
            "aage aage dekhiye hotaa hai kyaa"])),
 dict(n=7, name="Mutaqaarib Saalim", arkan=["Fa-uu-lun"]*4, weights="1-2-2 (x4)", matched_meter_id=28,
      own=("Irfan 'Abid' (article author)",
           ["muhabbat burii hai na nafrat burii hai",
            "burii hai tau har shai kii kasrat burii hai"]),
      classic=("'Bekhud' Dehlvi",
           ["na dekhaa thaa jo bazm-e-dushman meN dekhaa",
            "muhabbat tamaashe dikhaatii hai kyaa kyaa"])),
 dict(n=8, name="Mutaqaarib Musamman Maqbuuz Aslam (16 Ruknii)",
      arkan=["Fa-uu-lu","Faa-lun","Fa-uu-lu","Faa-lun"]*2,
      weights="1-1-2 / 2-2 (x4)", matched_meter_id=30,
      own=("Irfan 'Abid' (article author)",
           ["ho shaam-e-gham jis qadar bhii lambii dhalegii yeh bhii zaruur yaaro",
            "kabhii to utregaa mere ghar meN Khushii kii kirnoN kaa nuur yaaro"]),
      classic=("'Daag' Dehlvi",
           ["sitam hii karnaa jafaa hii karnaa nigaah-e-ulfat kabhii na karnaa",
            "tumheN qasam hai hamaare sar kii hamaare haq meN kamii na karnaa"])),
 dict(n=9, name="Kaamil Saalim", arkan=["Mu-ta-faa-i-lun"]*4, weights="1-1-2-1-2 (x4)", matched_meter_id=37,
      own=("Irfan 'Abid' (article author)",
           ["ki gaNwaa diye maine hosh bhii mujhe chain aa na sakaa kabhii",
            "terii yaad yuuN hii jawaaN rahii tujhe dil bhulaa na sakaa kabhii"]),
      classic=("Hakeem 'Momin'",
           ["wo jo ham meN tum meN qaraar thaa tumheN yaad ho ke na yaad ho",
            "wahii yaanii waadaa nibaah kaa tumheN yaad ho ke na yaad ho"])),
 dict(n=10, name="Mutadaarik Saalim", arkan=["Faa-i-lun"]*4, weights="2-1-2 (x4)", matched_meter_id=None,
      match_note=("no exact match in the 37-meter catalog; this 4-foot Faa-i-lun x4 form is a "
                   "shortened ('saalim', 4-rukn) usage of meter #12 (mutadārik musamman "
                   "muzā'af sālim, which is normally 8 feet). Pritchett's handbook note on "
                   "meter #12 already remarks it 'is sometimes used with only four feet; in this "
                   "case the muzā'af is dropped from its name' — so this is that 4-foot "
                   "variant, not a distinct catalog entry."),
      own=("Irfan 'Abid' (article author)",
           ["gul chiraaghoN ko kar ham sare shaam deN",
            "kyoN bhalaa aatish-e-dil ko aaraam deN"]),
      classic=("Nida Fazli",
           ["har taraf har jagah be-shumaar aadmii",
            "phir bhii tanhaaiyoN kaa shikaar aadmii"])),
 dict(n=11, name="Mazaar'a Musamman Akhrab", arkan=["Maf-uu-lu","Faa-i-laa-tun","Maf-uu-lu","Faa-i-laa-tun"],
      weights="2-2-1 / 2-1-1-2 (x2)", matched_meter_id=4,
      own=("Irfan 'Abid' (article author)",
           ["maiN beqaraar kyoN huuN dil beqaraar kyoN hai",
            "us bewafaa se ab tak aaKhir yeh pyaar kyoN hai"]),
      classic=("Allama 'Iqbal'",
           ["saare jahaaN se achchhaa HindostaaN hamaaraa",
            "ham bulbuleN haiN iskii yeh gulsitaaN hamaaraa"])),
 dict(n=12, name="Mazaar'a Musamman Akhrab Makfuuf Maqsuur",
      arkan=["Maf-uu-lu","Faa-i-laa-tu","ma-faa-ii-lu","Faa-i-laan"],
      weights="2-2-1 / 2-1-1-1 / 1-2-2-1 / 2-2-2", matched_meter_id=5,
      own=("Irfan 'Abid' (article author)",
           ["kaise kahuuN maiN apnii kahaanii ko baar baar",
            "kyoN kar piyuuNgaa aaNkh ke paanii ko baar baar"]),
      classic=("Daag Dehlvi (with Faa-i-lun as the last rukn)",
           ["Khaatir se yaa lihaaz se maiN maan tau gayaa",
            "jhuutii qasam se aap kaa iimaan tau gayaa"])),
 dict(n=13, name="Mujtas Musamman Makhbuun Maqsuur",
      arkan=["Ma-faa-i-lun","Fa-i-laa-tun","Ma-faa-i-lun","Fa-i-lun"],
      weights="1-2-1-2 / 1-1-2-2 / 1-2-1-2 / 1-1-2", matched_meter_id=34,
      own=("Irfan 'Abid' (article author)",
           ["wafaa ke qaul se ham tau mukar nahiiN sakte",
            "ki dushmanii meN bhii had se guzar nahiiN sakte"]),
      classic=("Faiz Ahmed 'Faiz'",
           ["guloN meN rang bhare baad-e-nau-bahaar chale",
            "chale bhii aao ki gulshan kaa kaar-o-baar chale"])),
]

# ---- 2. urdupoetry.com ASCII -> Pritchett ASCII, character-level. -------------------------
def convert_word(w):
    # nasalization: trailing capital N (leiNge, huuN, meN, ghaboN, ...) -> ;N
    w = re.sub(r'N\b', ';N', w)
    w = w.replace('N', ';N')  # a couple of words have it mid-compound (e.g. hyphenated meN-)
    # w (و) is always v in Pritchett's ASCII, never w
    w = w.replace('w', 'v').replace('W', 'V')
    # Gh/Kh (غ/خ) -> ;G/;x ; lowercase gh/kh (aspirated گھ/کھ) are already correct
    w = re.sub(r'Gh', ';G', w)
    w = re.sub(r'Kh', ';x', w)
    # a bare capital retroflex letter (ٹ/ڈ/ڑ, incl. aspirated ٹھ/ڈھ) -> ;T/;D/;R
    w = re.sub(r'T', ';T', w)
    w = re.sub(r'D', ';D', w)
    w = re.sub(r'R', ';R', w)
    return w

def convert_line(line):
    return ' '.join(convert_word(w) for w in line.split())

if __name__ == '__main__':
    out = {
        "source": {
            "author": "Irfan 'Abid'",
            "title": "Bah'r: The Backbone of Shaayari",
            "site": "Urdu Poetry Archive (urdupoetry.com), Article #5",
            "date": "19 July 2001",
            "url": "https://www.urdupoetry.com/articles/art5.html",
            "saved_copy": "data/sources/urdupoetry_art5.html",
        },
        "notes": ("Weights are the article's own '1/2/3' scale (short/long/overlong), converted "
                  "here to the app's =/- notation: 1->-, 2->=, and the '3' overlong subdivides to "
                  "'-  =' (short+long) per the article's own remark. Bahr names are the article's "
                  "transliteration ('Mazaar'a' = Pritchett's 'muzari'', 'Kaamil' = 'kamil', etc). "
                  "ASCII converted from the article's informal romanization to Pritchett ASCII by "
                  "scripts/build_urdupoetry_bahrs.py; ur/hi/ro regenerated and scan-verified by "
                  "scripts/incorporate_urdupoetry.js."),
        "bahrs": [],
    }
    for b in BAHRS:
        entry = {
            "n": b["n"], "name": b["name"], "arkan": b["arkan"], "weights": b["weights"],
            "matched_meter_id": b["matched_meter_id"],
            "match_note": b.get("match_note") or f"matches app meter #{b['matched_meter_id']}",
        }
        for key, tag in (("own", "own_verse"), ("classic", "classic_verse")):
            poet, lines = b[key]
            entry[tag] = {
                "poet": poet,
                "lines": [{"ascii": convert_line(l)} for l in lines],
            }
        out["bahrs"].append(entry)
    with open('data/urdupoetry_bahrs.json', 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
        f.write('\n')
    print(f"wrote {len(out['bahrs'])} bahrs to data/urdupoetry_bahrs.json (ascii only; "
          f"run node scripts/incorporate_urdupoetry.js next)")
