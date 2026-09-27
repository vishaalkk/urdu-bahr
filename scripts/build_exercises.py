import json, re

# Read urdu-meter-trainer 2.html
with open('urdu-meter-trainer 2.html', 'r', encoding='utf-8') as f:
    html = f.read()

idx_start = html.find('const EXERCISES=[')
idx_end = html.find('const SAMPLES', idx_start)
ex_block = html[idx_start:idx_end]

# Extract each exercise block
raw_items = re.findall(r'\{g:(\d+),\s*poet:[\'"]([^\'"]+)[\'"],\s*m:(\[[^\]]+\]),\s*L:`(.*?)`\s*\}', ex_block, re.DOTALL)
print(f'Found {len(raw_items)} existing exercises in trainer html')

# Read 11_exnotes.txt
with open('source_data/11_exnotes.txt', 'r', encoding='utf-8') as f:
    notes_raw = f.read()

gh_notes_blocks = re.split(r'GHAZAL\s+', notes_raw)[1:]
word_to_num = {
    'ONE': 1, 'TWO': 2, 'THREE': 3, 'FOUR': 4, 'FIVE': 5, 'SIX': 6, 'SEVEN': 7, 'EIGHT': 8, 'NINE': 9, 'TEN': 10,
    'ELEVEN': 11, 'TWELVE': 12, 'THIRTEEN': 13, 'FOURTEEN': 14, 'FIFTEEN': 15, 'SIXTEEN': 16,
    'SEVENTEEN': 17, 'EIGHTEEN': 18, 'NINETEEN': 19, 'TWENTY': 20, 'TWENTY-ONE': 21, 'TWENTY-TWO': 22,
    'TWENTY-THREE': 23, 'TWENTY-FOUR': 24
}

notes_by_num = {}
for block in gh_notes_blocks:
    m = re.match(r'([A-Z]+|\d+)\s+by\s+([^,:\n]+)', block)
    if m:
        num_str = m.group(1)
        poet = m.group(2).strip()
        num = word_to_num.get(num_str, int(num_str) if num_str.isdigit() else 0)
        
        meter_match = re.search(r'METER:\s*([^\n]+)', block)
        meter_info = meter_match.group(1).strip() if meter_match else ''
        
        v_notes = re.findall(r'VERSE\s+(\d+):\s*(.*?)(?=(?:VERSE\s+\d+|\[back to top|$))', block, re.DOTALL)
        general_notes = re.search(r'METER:[^\n]+\n(.*?)(?=VERSE|$)', block, re.DOTALL)
        gen_text = general_notes.group(1).strip() if general_notes else ''
        
        notes_by_num[num] = {
            'poet': poet,
            'meter_info': meter_info,
            'intro': ' '.join(gen_text.split()),
            'verses': {int(v[0]): ' '.join(v[1].split()) for v in v_notes}
        }

exercises = {}
for g, poet, m_str, lines_raw in raw_items:
    g = int(g)
    lines = [l.strip() for l in lines_raw.strip().split('\n') if l.strip()]
    m_val = json.loads(m_str.replace("'", '"'))
    exercises[g] = {
        'id': g,
        'poet': poet,
        'meters': m_val,
        'lines': lines,
        'notes': notes_by_num.get(g, {})
    }

# Ghazal 6 (Mus'hafi)
exercises[6] = {
    'id': 6,
    'poet': "Mus'hafi",
    'meters': [37],
    'lines': [
        'نہ وہ راتیں نہ وہ باتیں نہ وہ قصہ کہانی ہے',
        'فقط اک ہم ہیں بستر پر پڑے اور ناتوانی ہے',
        'بھلا میں ہاتھ دھو بیٹھوں نہ اپنی جان سے کیوں کر',
        'خرام اس کے میں اک آبِ رواں کی سی روانی ہے',
        'تو یوں بے پردہ ہو جانے سے مت ڈر غیر کے آگے',
        'تری تصویر کو بھی پردہ داری کرنی آنی ہے',
        'نہ رکھی مصحفیؔ ہم نے کسی سے چشمِ ہمدردی',
        'ہماری داستاں خود اپنی ہی بے خانمانی ہے'
    ],
    'notes': notes_by_num.get(6, {})
}

# Ghazal 7 (Jur'at)
exercises[7] = {
    'id': 7,
    'poet': "Jur'at",
    'meters': [14, 15],
    'lines': [
        'بال سلجھانا ترا کنگھی سے دل الجھائے ہے',
        'اور بکھرے دیکھ کر بس جی ہی بکھرا جائے ہے',
        'سرخ ڈورے دیکھ کیا ہی جال میں پھنستا ہے دل',
        'نکلیں ہیں کیا کیا ادائیں جب کہ تو شرمائے ہے',
        'رنگ پر چہرے کے ہے کیا ہی جوانی کی چمک',
        'تازہ گل کو دیکھ کر منہ پر پسینہ آئے ہے'
    ],
    'notes': notes_by_num.get(7, {})
}

# Ghazal 8 (Jur'at)
exercises[8] = {
    'id': 8,
    'poet': "Jur'at",
    'meters': [18, 19],
    'lines': [
        'بھول گئے تم جن روزوں ہم گھر پہ بلائے جاتے تھے',
        'ہوتے تھے کیا کیا کچھ چرچے عیش منائے جاتے تھے',
        'کیا کیا کچھ تھی خاطر داری کیا کیا پیار کی باتیں تھیں',
        'کس کس ڈھب سے چاہ جتا کر ربط بڑھائے جاتے تھے',
        'کرتے تھے تم ان کی خاطر صدقے جان و دل اپنا',
        'غیروں کو دکھلا دکھلا کر ناز اٹھائے جاتے تھے'
    ],
    'notes': notes_by_num.get(8, {})
}

all_ex = [exercises[i] for i in sorted(exercises.keys())]
print(f'Total exercises assembled: {len(all_ex)}')
with open('data/exercises.json', 'w', encoding='utf-8') as out:
    json.dump(all_ex, out, ensure_ascii=False, indent=2)
print('Successfully saved data/exercises.json!')
