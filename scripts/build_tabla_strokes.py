"""Tabla strokes for the theka (src/js/15c-taal.js): data/tabla/*.mp3 (sources and licences in data/tabla/SOURCES.md)
re-encoded small for the page and written to data/tabla_strokes.json as {name: base64 MP3}.
Ring-outs are cut to what a theka needs (a new stroke damps the drum anyway). Needs ffmpeg.
Usage: uv run python scripts/build_tabla_strokes.py"""
import base64, json, os, subprocess, tempfile

SRC = 'data/tabla'
OUT = 'data/tabla_strokes.json'
SKIP = {'na_open'}                       # not used by any bol
MAXLEN = {'ghe_long1': 1.5, 'ghe_long2': 1.5, 'ghe1': 1.0, 'ghe2': 1.0, 'ghe3': 0.8, 'ghe4': 1.0, 'ghe5': 0.6,
          'tun1': 0.9, 'tun2': 0.9, 'tun3': 0.9, 'tin1': 0.7, 'tin2': 0.7, 'tin3': 0.7, 'na1': 0.5}

def encode(path, maxlen):
    with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp:
        out = tmp.name
    af = f'atrim=0:{maxlen},afade=t=out:st={max(0, maxlen - 0.12):.2f}:d=0.12' if maxlen else 'anull'
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', path, '-ac', '1', '-ar', '44100', '-af', af,
                    '-c:a', 'libmp3lame', '-b:a', '64k', out], check=True)
    with open(out, 'rb') as f:
        data = f.read()
    os.remove(out)
    return base64.b64encode(data).decode('ascii')

strokes = {}
for name in sorted(os.listdir(SRC)):
    if not name.endswith('.mp3') or name[:-4] in SKIP:
        continue
    k = name[:-4]
    strokes[k] = encode(os.path.join(SRC, name), MAXLEN.get(k))
with open(OUT, 'w') as f:
    json.dump(strokes, f, separators=(',', ':'))
print(f'{OUT}: {len(strokes)} strokes, {os.path.getsize(OUT) / 1024:.0f} KB')
