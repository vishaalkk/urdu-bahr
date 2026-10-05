import re

def fix_all():
    with open('src/js/17c-circles.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Fix getMeterResolution for Ramal (Maqtu name vs Mahzuuf name)
    old_ramal_res = """  // 3. Ramal
  if (id === 'ramal') {
    if (isMusamman && isMakhbun && (endMod === 'mahzuuf' || endMod === 'maqtu')) {
      return { isCanonical: true, meterNum: endMod === 'maqtu' ? 18 : 19, handbookNum: 1, nameEn: 'Ramal Mus̱amman Makhbūn Maḥzūf', nameUr: 'بحرِ رمل مثمن مخبون محذوف' };
    }
    if (!isMusamman && isMakhbun && (endMod === 'mahzuuf' || endMod === 'maqtu')) {
      return { isCanonical: true, meterNum: endMod === 'maqtu' ? 16 : 17, handbookNum: 3, nameEn: 'Ramal Musaddas Makhbūn Maḥzūf', nameUr: 'بحرِ رمل مسدس مخبون محذوف' };
    }"""

    new_ramal_res = """  // 3. Ramal
  if (id === 'ramal') {
    if (isMusamman && isMakhbun && (endMod === 'mahzuuf' || endMod === 'maqtu')) {
      const isMaqtu = (endMod === 'maqtu');
      return {
        isCanonical: true,
        meterNum: isMaqtu ? 18 : 19,
        handbookNum: 1,
        nameEn: isMaqtu ? 'Ramal Mus̱amman Makhbūn Maqṭūʿ' : 'Ramal Mus̱amman Makhbūn Maḥzūf',
        nameUr: isMaqtu ? 'بحرِ رمل مثمن مخبون مقطوع' : 'بحرِ رمل مثمن مخبون محذوف'
      };
    }
    if (!isMusamman && isMakhbun && (endMod === 'mahzuuf' || endMod === 'maqtu')) {
      const isMaqtu = (endMod === 'maqtu');
      return {
        isCanonical: true,
        meterNum: isMaqtu ? 16 : 17,
        handbookNum: 3,
        nameEn: isMaqtu ? 'Ramal Musaddas Makhbūn Maqṭūʿ' : 'Ramal Musaddas Makhbūn Maḥzūf',
        nameUr: isMaqtu ? 'بحرِ رمل مسدس مخبون مقطوع' : 'بحرِ رمل مسدس مخبون محذوف'
      };
    }"""

    if old_ramal_res in content:
        content = content.replace(old_ramal_res, new_ramal_res)
        print("Updated Ramal getMeterResolution names!")
    else:
        print("Warning: old_ramal_res not found verbatim, checking regex...")
        # fallback regex replace
        pattern = re.compile(r"if \(id === 'ramal'\) \{\s*if \(isMusamman && isMakhbun && \(endMod === 'mahzuuf' \|\| endMod === 'maqtu'\)\) \{\s*return \{ isCanonical: true, meterNum: endMod === 'maqtu' \? 18 : 19, handbookNum: 1, nameEn: 'Ramal Mus̱amman Makhbūn Maḥzūf', nameUr: 'بحرِ رمل مثمن مخبون محذوف' \};\s*\}\s*if \(!isMusamman && isMakhbun && \(endMod === 'mahzuuf' \|\| endMod === 'maqtu'\)\) \{\s*return \{ isCanonical: true, meterNum: endMod === 'maqtu' \? 16 : 17, handbookNum: 3, nameEn: 'Ramal Musaddas Makhbūn Maḥzūf', nameUr: 'بحرِ رمل مسدس مخبون محذوف' \};\s*\}")
        content = pattern.sub("""if (id === 'ramal') {
    if (isMusamman && isMakhbun && (endMod === 'mahzuuf' || endMod === 'maqtu')) {
      const isMaqtu = (endMod === 'maqtu');
      return {
        isCanonical: true,
        meterNum: isMaqtu ? 18 : 19,
        handbookNum: 1,
        nameEn: isMaqtu ? 'Ramal Mus̱amman Makhbūn Maqṭūʿ' : 'Ramal Mus̱amman Makhbūn Maḥzūf',
        nameUr: isMaqtu ? 'بحرِ رمل مثمن مخبون مقطوع' : 'بحرِ رمل مثمن مخبون محذوف'
      };
    }
    if (!isMusamman && isMakhbun && (endMod === 'mahzuuf' || endMod === 'maqtu')) {
      const isMaqtu = (endMod === 'maqtu');
      return {
        isCanonical: true,
        meterNum: isMaqtu ? 16 : 17,
        handbookNum: 3,
        nameEn: isMaqtu ? 'Ramal Musaddas Makhbūn Maqṭūʿ' : 'Ramal Musaddas Makhbūn Maḥzūf',
        nameUr: isMaqtu ? 'بحرِ رمل مسدس مخبون مقطوع' : 'بحرِ رمل مسدس مخبون محذوف'
      };
    }""", content)

    # 2. Fix Mujtathth getMeterResolution (Musaddas is NOT canonical #22)
    old_mujtathth_res = """    if (!isMusamman && isMakhbun && (endMod === 'maqtu' || endMod === 'mahzuuf')) {
      return { isCanonical: true, meterNum: 22, handbookNum: null, nameEn: 'Mujtathth Musaddas Makhbūn', nameUr: 'بحرِ مجتث مسدس مخبون' };
    }"""
    new_mujtathth_res = """    if (!isMusamman) {
      return {
        isCanonical: false,
        nameEn: `Mujtathth Musaddas ${endMod}`,
        nameUr: `بحرِ مجتث مسدس`,
        theoreticalReason: 'In classical Urdu literature, Baḥr-e-Mujtathth is composed strictly as an 8-foot (Mus̱amman) meter (Meters #33 and #34). The 6-foot Musaddas form is an al-Khalīl circle permutation.',
        canonical: mtr.canonical
      };
    }"""
    if old_mujtathth_res in content:
        content = content.replace(old_mujtathth_res, new_mujtathth_res)
        print("Updated Mujtathth Musaddas resolution (theoretical prototype)!")

    # 3. Replace Ghalib #20 with Ghalib #35 in Ramal musaddas_makhbun_maqtu & musaddas_maqtu
    old_ramal_m35_target = """              'musaddas_makhbun_maqtu': {
                ur: 'یہ نہ تھی ہماری قسمت کہ وصالِ یار ہوتا',
                ro: 'yih nah thī hamārī qismat kih viṣāl-e yār hotā',
                hi: 'ये न थी हमारी क़िस्मत कि विसाल-ए-यार होता',
                ur2: 'اگر اور جیتے رہتے یہی انتظار ہوتا',
                ro2: 'agar aur jīte rahte yahī intizār hotā',
                hi2: 'अगर और जीते रहते यही इंतज़ार होता',
                poet: 'Ghalib',
                syls: [
                  { ro: 'yih', m: 'l' }, { ro: 'nah', m: 's' }, { ro: 'thī', m: 'l' }, { ro: 'ha', m: 'l' },
                  { ro: 'mā', m: 's' }, { ro: 'rī', m: 's' }, { ro: 'qis', m: 'l' }, { ro: 'mat', m: 'l' },
                  { ro: 'ki', m: 'l' }, { ro: 'vi', m: 's' }, { ro: 'ṣā', m: 'l' }, { ro: 'le', m: 'l' },
                  { ro: 'yār', m: 'l' }, { ro: 'ho', m: 'l' }, { ro: 'tā', m: 'l' }
                ]
              },"""

    new_ramal_m35_replacement = """              'musaddas_makhbun_maqtu': {
                ur: 'پھر مجھے دیدۂ تر یاد آیا',
                ro: 'phir mujhe dīdah-e tar yād āyā',
                hi: 'फिर मुझे दीदा-ए-तर याद आया',
                ur2: 'دلِ جگر تشنۂ فریاد آیا',
                ro2: 'dil-e jigar tishnah-e faryād aayā',
                hi2: 'दिल-ए-जिगर तिश्ना-ए-फ़रियाद आया',
                poet: 'Ghalib',
                syls: [
                  { ro: 'phir', m: 'l' }, { ro: 'mu', m: 's' }, { ro: 'jhe', m: 'l' }, { ro: 'dī', m: 'l' },
                  { ro: 'da', m: 's' }, { ro: 'he', m: 's' }, { ro: 'tar', m: 'l' }, { ro: 'yā', m: 'l' },
                  { ro: 'd-ā', m: 'l' }, { ro: 'yā', m: 'l' }
                ]
              },"""

    if old_ramal_m35_target in content:
        content = content.replace(old_ramal_m35_target, new_ramal_m35_replacement)
        print("Updated Ramal musaddas_makhbun_maqtu to Ghalib #35!")

    # Also update musaddas_maqtu in Ramal:
    old_ramal_m35_maqtu = """              'musaddas_maqtu': {
                ur: 'یہ نہ تھی ہماری قسمت کہ وصالِ یار ہوتا',
                ro: 'yih nah thī hamārī qismat kih viṣāl-e yār hotā',
                hi: 'ये न थी हमारी क़िस्मत कि विसाल-ए-याر होता',
                ur2: 'اگر اور جیتے رہتے یہی انتظار ہوتا',
                ro2: 'agar aur jīte rahte yahī intizār hotā',
                hi2: 'اگر اور جیتے رہتے یہی انتظار ہوتا',
                poet: 'Ghalib',
                syls: [
                  { ro: 'yih', m: 'l' }, { ro: 'nah', m: 's' }, { ro: 'thī', m: 'l' }, { ro: 'ha', m: 'l' },
                  { ro: 'mā', m: 's' }, { ro: 'rī', m: 's' }, { ro: 'qis', m: 'l' }, { ro: 'mat', m: 'l' }
                ]
              }"""
    # use regex for musaddas_maqtu in Ramal
    content = re.sub(
        r"'musaddas_maqtu':\s*\{\s*ur:\s*'یہ نہ تھی ہماری قسمت[^}]+poet:\s*'Ghalib',[^}]+syls:\s*\[[^\]]+\]\s*\}",
        """'musaddas_maqtu': {
                ur: 'پھر مجھے دیدۂ تر یاد آیا',
                ro: 'phir mujhe dīdah-e tar yād āyā',
                hi: 'फिर मुझे दीदा-ए-तर याद आया',
                ur2: 'دلِ جگر تشنۂ فریاد آیا',
                ro2: 'dil-e jigar tishnah-e faryād aayā',
                hi2: 'दिल-ए-जिगर तिश्ना-ए-फ़रियाद आया',
                poet: 'Ghalib',
                syls: [
                  { ro: 'phir', m: 'l' }, { ro: 'mu', m: 's' }, { ro: 'jhe', m: 'l' }, { ro: 'dī', m: 'l' },
                  { ro: 'da', m: 's' }, { ro: 'he', m: 's' }, { ro: 'tar', m: 'l' }, { ro: 'yā', m: 'l' },
                  { ro: 'd-ā', m: 'l' }, { ro: 'yā', m: 'l' }
                ]
              }""",
        content
    )

    # 4. In getCircleVerseLinks, map 'پھر مجھے دیدۂ تر' to 16/17 and 'یہ نہ تھی ہماری قسمت' to 36
    old_link_check = """  } else if (ur.includes('یہ نہ تھی ہماری قسمت')) {
    meterNum = 16;
    appGhazal = '#/ghazals/ghalib/20';
    ghazalLabel = 'Ghalib #20';
  } else if (ur.includes('پھر مجھے دیدۂ تر') || ur.includes('پھر مجھے دیدۂ تر')) {
    meterNum = 17;
    appGhazal = '#/ghazals/ghalib/35';
    ghazalLabel = 'Ghalib #35';"""

    new_link_check = """  } else if (ur.includes('پھر مجھے دیدۂ تر') || ur.includes('پھر مجھے دیدۂ تر')) {
    meterNum = (res && res.meterNum) || 16;
    appGhazal = '#/ghazals/ghalib/35';
    ghazalLabel = 'Ghalib #35';
  } else if (ur.includes('یہ نہ تھی ہماری قسمت')) {
    meterNum = 36;
    appGhazal = '#/ghazals/ghalib/20';
    ghazalLabel = 'Ghalib #20';"""

    if old_link_check in content:
        content = content.replace(old_link_check, new_link_check)
        print("Updated getCircleVerseLinks for Ghalib #35 and #20!")

    # 5. Fix buildCircleLineFeet for Hazaj maqtu, Ramal musaddas, Mujtathth musaddas, Kamil maqtu, Mutadarik
    # Let's inspect buildCircleLineFeet:
    build_func_pattern = re.compile(r"function buildCircleLineFeet\(mtr, feetCount\) \{([\s\S]+?)\nfunction updateCircleAssembledBanner")
    m = build_func_pattern.search(content)
    if m:
        body = m.group(1)
        # Add Hazaj custom handling:
        new_hazaj_clause = """  if (mtr.id === 'hazaj') {
    const isMaqtuOrMahzuuf = (curEndMod === 'mahzuuf' || curEndMod === 'maqtu');
    const out = [];
    for (let i = 0; i < feetCount; i++) {
      const isLast = (i === feetCount - 1);
      if (isLast && isMaqtuOrMahzuuf) {
        out.push({ pat: '– = =', ur: 'فعولن', fs: ['fa', 'ʿū', 'lun'] });
      } else {
        out.push({ pat: '– = = =', ur: 'مفاعیلن', fs: ['ma', 'fā', 'ʿī', 'lun'] });
      }
    }
    return out;
  }
"""
        # Add Kamil custom handling:
        new_kamil_clause = """  if (mtr.id === 'kamil') {
    const out = [];
    for (let i = 0; i < feetCount; i++) {
      const isLast = (i === feetCount - 1);
      if (isLast && (curEndMod === 'mahzuuf' || curEndMod === 'maqtu')) {
        out.push({ pat: '– – = =', ur: 'متفاعلن', fs: ['mu', 'ta', 'fā', 'ʿil'] });
      } else {
        out.push({ pat: '– – = – =', ur: 'متفاعلن', fs: ['mu', 'ta', 'fā', 'ʿi', 'lun'] });
      }
    }
    return out;
  }
"""
        # Add Mutadarik custom handling:
        new_mutadarik_clause = """  if (mtr.id === 'mutadarik') {
    const out = [];
    for (let i = 0; i < feetCount; i++) {
      const isLast = (i === feetCount - 1);
      if (isLast && curEndMod === 'mahzuuf') {
        out.push({ pat: '= =', ur: 'فعلن', fs: ['faʿ', 'lūn'] });
      } else if (isLast && curEndMod === 'maqtu') {
        out.push({ pat: '= –', ur: 'فعل', fs: ['fa', 'ʿal'] });
      } else {
        out.push({ pat: '= – =', ur: 'فاعلن', fs: ['fā', 'ʿi', 'lun'] });
      }
    }
    return out;
  }
"""
        # Replace start of buildCircleLineFeet
        old_head = "function buildCircleLineFeet(mtr, feetCount) {\n  const isMusamman = (feetCount === 4);\n  const isMakhbun = (curBodyMod === 'makhbun');"
        new_head = old_head + "\n\n" + new_hazaj_clause + "\n" + new_kamil_clause + "\n" + new_mutadarik_clause
        if old_head in content:
            content = content.replace(old_head, new_head)
            print("Injected specialized foot builders for Hazaj, Kamil, and Mutadarik!")

    # 6. Ensure scansion does not emit orphan feet
    # In updateCircleVerseSection, change:
    #   if (pos < verseObj.syls.length) {
    #     html += `<span class="fgrp" data-f="${feet.length}"><span class="fname"></span>...
    # to:
    #   // Never emit unnamed overflow feet!
    content = re.sub(
        r"if \(pos < verseObj\.syls\.length\) \{\s*html \+= `<span class=\"fgrp\" data-f=\"\$\{feet\.length\}\"><span class=\"fname\"></span>[^`]+`;\s*\}",
        "// Never emit unmapped orphan foot groups\n        if (pos < verseObj.syls.length) {\n          // remaining syllables ignored if verse exceeds line feet count\n        }",
        content
    )

    with open('src/js/17c-circles.js', 'w', encoding='utf-8') as f:
        f.write(content)

    print("Finished updating src/js/17c-circles.js!")

if __name__ == '__main__':
    fix_all()
