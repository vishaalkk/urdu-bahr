import re, json

with open('source_data/06_meters.txt', 'r', encoding='utf-8') as f:
    text = f.read()

# Transliteration helper for meter names
def roman_meter_name(s):
    s = s.replace(';', '').replace('.', '').replace(':', '').replace('((', 'ʻ').replace('))', 'ʼ')
    s = s.replace('aa', 'ā').replace('ii', 'ī').replace('uu', 'ū')
    return s.strip()

# 1. Meters 1 to 37
idx_list = text.find('For practical purposes, we offer a list')
idx_body_62 = text.find('6.2 ==', idx_list)
sub_37 = text[idx_list:idx_body_62]

meter_blocks = re.findall(r'(\d{1,2})\s+([=\-\*\/x\s]+)\s*\{([^}]+)\}(.*?)(?=(?:\n\s*\d{1,2}\s+[=\-\*\/x]|$))', sub_37, re.DOTALL)

meters = []
for num_str, pat_raw, name_raw, extra_raw in meter_blocks:
    num = int(num_str)
    pat = re.sub(r'\s+', ' ', pat_raw).strip()
    # clean pattern
    pat_clean = pat.replace('*', '')
    has_caesura = '//' in pat
    name_clean = roman_meter_name(name_raw)
    extra_clean = ' '.join(extra_raw.split())
    
    # Extract paired meters
    paired = []
    pair_match = re.search(r'May be used with #(\d+)', extra_clean)
    if pair_match:
        paired.append(int(pair_match.group(1)))
    pair_match2 = re.search(r'used together with #(\d+)', extra_clean)
    if pair_match2:
        paired.append(int(pair_match2.group(1)))

    meters.append({
        'id': num,
        'pattern': pat,
        'name': name_clean,
        'raw_name': name_raw.strip(),
        'caesura': has_caesura,
        'paired': paired,
        'notes': extra_clean
    })

print(f'Parsed {len(meters)} standard meters')

# 2. Rubai meters
idx_body_63 = text.find('6.3 ==', idx_body_62)
sub_rubai = text[idx_body_63:]
rubai_matches = re.findall(r'(\d{1,2})\s+([=\-\s\/]+)\s*\.{3}(.*?)\{([^}]+)\}', sub_rubai)
rubai_list = []
for r_num, r_pat, r_dots, r_name in rubai_matches:
    rubai_list.append({
        'id': f'R{r_num}',
        'pattern': re.sub(r'\s+', ' ', r_pat).strip(),
        'name': roman_meter_name(r_name)
    })
print(f'Parsed {len(rubai_list)} Rubai meters')

output_data = {
    'standard': meters,
    'rubai': rubai_list,
    'hindi_info': {
        'description': "Mir's moraic meter based on 16 moras (matras) per hemistich, divided into 8 + 8 by a strong caesura.",
        'feet': ['= =', '= -', '- = =', '- = -', '=']
    }
}

with open('data/meters.json', 'w', encoding='utf-8') as out:
    json.dump(output_data, out, ensure_ascii=False, indent=2)
print('Saved data/meters.json successfully!')
