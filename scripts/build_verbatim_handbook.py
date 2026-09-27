import json, re

chapters = [
    ('ch0', '00_intro.html', '0. Introduction', 'مقدمہ: دیباچہ'),
    ('ch1', '01_genrules.html', '1. General Rules', 'پہلا باب: عام قواعد'),
    ('ch2', '02_flexibility.html', '2. Flexibility', 'دوسرا باب: اختیارات اور لچک'),
    ('ch3', '03_special.html', '3. Special Constructions', 'تیسرا باب: وصل اور اضافت'),
    ('ch4', '04_irregular.html', '4. Irregular Words', 'چوتھا باب: شاذ اور مستثنیٰ الفاظ'),
    ('ch5', '05_feet.html', '5. Metrical Feet', 'پانچواں باب: ارکان اور افاعیل'),
    ('ch6', '06_meters.html', '6. Meters & Bahrs', 'چھٹا باب: اوزان اور بحور'),
    ('ch7', '07_scanning.html', '7. Scanning as Code-Breaking', 'ساتواں باب: تقطیع بحیثیت کشفِ رموز'),
    ('ch8', '08_eyetoear.html', '8. From Eye to Ear', 'آٹھواں باب: سماع: آنکھ سے کان تک')
]

parsed_chapters = []

for cid, fname, title, utitle in chapters:
    with open(f'source_data/{fname}', 'r', encoding='utf-8') as f:
        html = f.read()

    # Exact boundary extraction for unabridged handbook text
    m_start = re.search(r'<td[^>]*width=[\"\']?99%[\"\']?[^>]*>', html, re.I)
    if fname == '00_intro.html':
        m_end = re.search(r'</blockquote>\s*</td>\s*<td\s+bgcolor=[\"\']?#000000[\"\']?', html, re.I)
    else:
        m_end = re.search(r'</blockquote>\s*</td>\s*</tr>', html, re.I)

    if m_start and m_end:
        start_idx = m_start.end()
        end_idx = m_end.start() + len('</blockquote>')
        content = html[start_idx:end_idx]
    else:
        matches = re.findall(r'<blockquote[^>]*>([\s\S]*?)</blockquote>', html, re.I)
        content = max(matches, key=len) if matches else html

    if fname == '00_intro.html':
        cover_note = '<div class="card" style="margin-bottom:16px;background:var(--bg3);border-left:3px solid var(--gold);font-style:italic;">Cover of the 1987 printed version, designed by FWP, based on the cover of the <em>:tilismaat-e ((ajaa))ib</em>, an old book of magic and wonders from the Naval Kishor Press.</div>'
        content = cover_note + content

    # Clean old Netscape styling while preserving text structure
    content = re.sub(r'<img[^>]*graphics/[^>]*>', '', content, flags=re.I)
    content = re.sub(r'<img[^>]*blackbar[^>]*>', '', content, flags=re.I)
    content = re.sub(r'<script.*?</script>', '', content, flags=re.DOTALL | re.I)
    content = re.sub(r'</?font[^>]*>', '', content, flags=re.I)
    content = re.sub(r'face=[\'"][^\'"]*[\'"]', '', content, flags=re.I)
    content = re.sub(r'size=[\'"][^\'"]*[\'"]', '', content, flags=re.I)
    content = re.sub(r'color=[\'"][^\'"]*[\'"]', '', content, flags=re.I)
    content = re.sub(r'nosave(=[\'"][^\'"]*[\'"])?', '', content, flags=re.I)
    content = re.sub(r'bgcolor=[\'"][^\'"]*[\'"]', '', content, flags=re.I)
    content = re.sub(r'background=[\'"][^\'"]*[\'"]', '', content, flags=re.I)
    content = re.sub(r'alink=[\'"][^\'"]*[\'"]', '', content, flags=re.I)
    content = re.sub(r'vlink=[\'"][^\'"]*[\'"]', '', content, flags=re.I)
    content = re.sub(r'link=[\'"][^\'"]*[\'"]', '', content, flags=re.I)
    content = re.sub(r'bordercolor=[\'"][^\'"]*[\'"]', '', content, flags=re.I)

    # Clean spacer tables
    content = re.sub(r'<table[^>]*>\s*(<tbody>)?\s*<tr>\s*<td[^>]*>(&nbsp;|\s)*</td>\s*</tr>\s*(</tbody>)?\s*</table>', '', content, flags=re.I)

    # Clean excess whitespace & blank paragraphs
    content = re.sub(r'<p>\s*(&nbsp;|\s)*</p>', '', content, flags=re.I)
    content = re.sub(r'(&nbsp;\s*){2,}', ' ', content)

    parsed_chapters.append({
        'id': cid,
        'title': title,
        'urdu_title': utitle,
        'filename': fname,
        'html_content': content.strip()
    })
    print(f'Processed {cid} ({fname}): clean verbatim HTML len {len(content.strip())}')

with open('data/handbook_verbatim.json', 'w', encoding='utf-8') as out:
    json.dump(parsed_chapters, out, ensure_ascii=False, indent=2)

print('Saved data/handbook_verbatim.json successfully!')
