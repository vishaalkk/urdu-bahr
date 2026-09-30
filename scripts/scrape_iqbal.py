"""Scrape Frances Pritchett's Iqbal pages (franpritchett.com/00urdu/iqbal/) into
data/iqbal_corpus.json: her ASCII transcription of every verse line, plus the
meter she gives at the top of the page. The Urdu / Devanagari / Roman forms are
added by scripts/incorporate_iqbal.js (Sean Pue's parsers), and build_app.py folds
the words into WORD_ASCII_MAP, so typed Iqbal lines get her exact spelling.
Run: uv run python scripts/scrape_iqbal.py"""
import html, json, re, time, urllib.request

BASE = 'https://franpritchett.com/00urdu/iqbal/'
def get(url):
    with urllib.request.urlopen(url, timeout=20) as r:
        return r.read().decode('utf-8', 'replace')

def links(page_html):
    out = []
    for h in re.findall(r'href="([^"#]+\.html)"', page_html):
        if '/' in h or h in out or h == 'index.html':
            continue
        out.append(h)
    return out

def text(fragment):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', fragment))).strip()

def parse(page_html, url):
    # verse lines: the right-aligned, size +2 block holding <em class="urdu"> lines
    lines = []
    for block in re.findall(r'<div align="right">\s*<font size="\+2"[^>]*>(.*?)</font>', page_html, re.S | re.I):
        for part in re.split(r'<br\s*/?>', block, flags=re.I):
            t = text(part)
            if t and re.search(r'[a-z]', t) and not re.match(r'^\d+\)', t):
                lines.append(t)
    m = re.search(r'meter\s*</a>\s*\*?\s*:?\s*</?[^>]*>?\s*([-=x/ ]{5,})', page_html, re.I) \
        or re.search(r'meter[^:]{0,80}:\s*(?:<[^>]+>\s*)*([-=x/ ]{5,})', page_html, re.I)
    meter = re.sub(r'\s+', ' ', m.group(1)).strip() if m else ''
    title = text((re.search(r'<title>(.*?)</title>', page_html, re.S | re.I) or [None, ''])[1])
    return {'id': url.rsplit('/', 1)[1].replace('.html', ''), 'title': title, 'url': url, 'meter': meter, 'lines': lines}

def main():
    seen, queue, poems = set(), ['index.html'], []
    while queue:
        h = queue.pop(0)
        if h in seen:
            continue
        seen.add(h)
        page = get(BASE + h)
        time.sleep(0.4)                       # be gentle with her server
        if h == 'index.html' or h.endswith('_index.html'):
            queue += [l for l in links(page) if l not in seen]
            continue
        p = parse(page, BASE + h)
        if p['lines']:
            poems.append(p)
            print(f"{p['id']:24} {len(p['lines']):4} lines  meter: {p['meter'] or '?'}")
    json.dump(poems, open('data/iqbal_corpus.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(len(poems), 'poems,', sum(len(p['lines']) for p in poems), 'lines')

if __name__ == '__main__':
    main()
