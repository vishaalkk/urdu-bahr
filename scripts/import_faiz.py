#!/usr/bin/env python3
"""
scripts/import_faiz.py

Imports Faiz Ahmad Faiz ghazals from Rekhta using the verified links in:
https://raw.githubusercontent.com/Fizza-Rubab/Poet-Ghazal-Dataset/main/links/faiz_ahmad_faiz.txt

For each ghazal:
1. Fetches Urdu (?lang=ur), Hindi (?lang=hi), and Roman (?lang=en) views from Rekhta.
2. Aligns the couplets across all 3 scripts (filtering out any non-Urdu featured header shers).
3. Runs the meter scansion engine via Node.js to determine the consensus Bahr and cost.
4. Generates Pritchett-ASCII representations via romanToAscii.
5. Saves the output to data/faiz_verses.json (ready to integrate into verses.json / website tabs).

Usage:
    python3 scripts/import_faiz.py [--limit N]
"""

import urllib.request
import re
import html as html_lib
import json
import os
import sys
import time
import subprocess
import argparse

LINKS_URL = "https://raw.githubusercontent.com/Fizza-Rubab/Poet-Ghazal-Dataset/main/links/faiz_ahmad_faiz.txt"
DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
OUT_FILE = os.path.join(DATA_DIR, 'faiz_verses.json')

def fetch_links():
    req = urllib.request.Request(LINKS_URL, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=10) as resp:
        text = resp.read().decode('utf-8')
    return [l.strip() for l in text.splitlines() if l.strip()]

def extract_couplet_lines(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            page = resp.read().decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"  [Warn] Failed fetching {url}: {e}")
        return []

    couplets = re.findall(r"<div class=[\"']c[\"'][^>]*>(.*?)</div>", page, re.DOTALL)
    out = []
    for c in couplets:
        ps = re.findall(r"<p[^>]*>(.*?)</p>", c, re.DOTALL)
        for p in ps:
            clean = html_lib.unescape(re.sub(r"<[^>]+>", "", p)).strip()
            if clean:
                out.append(clean)
    return out

def scan_and_process_node(urdu_lines, roman_lines):
    """Invokes the local urdu-bahr engine via Node to determine the best meter and compute ascii."""
    js_code = f"""
    const fs = require('fs'), path = require('path'), vm = require('vm');
    const root = process.cwd();
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    
    // Extract Scan engine
    const a = html.indexOf("(function(root){{\\n'use strict';\\n\\n/* ---------- meters");
    const e = html.indexOf('}})(this);', a) + '}})(this);'.length;
    const mod = {{ exports: {{}} }};
    vm.runInNewContext(html.slice(a, e), {{ module: mod, console }});
    const Scan = mod.exports;

    // Load full runtime in a context for romanToAscii and pue_di
    const domStore = {{}};
    const ctx = {{
        window: {{}},
        document: {{ getElementById:()=>({{}}), querySelectorAll:()=>[], querySelector:()=>null, addEventListener:()=>{{}} }},
        $: ()=>({{}}),
        console,
        setTimeout: (fn)=>fn(),
        clearTimeout: ()=>{{}},
        setInterval: ()=>{{}},
        clearInterval: ()=>{{}},
        localStorage: {{ getItem:()=>null, setItem:()=>{{}}, removeItem:()=>{{}} }}
    }};
    const scripts = html.match(/<script[^>]*>([\\s\\S]*?)<\\/script>/gi);
    if (scripts && scripts.length >= 2) {{
        const c0 = scripts[0].replace(/<\\/?script[^>]*>/gi, '');
        const c1 = scripts[1].replace(/<\\/?script[^>]*>/gi, '');
        vm.createContext(ctx);
        try {{ vm.runInContext(c0, ctx); }} catch(err) {{}}
        try {{ vm.runInContext(c1, ctx); }} catch(err) {{}}
    }}
    
    const ur_lines = {json.dumps(urdu_lines)};
    const ro_lines = {json.dumps(roman_lines)};
    const meters = {{}};
    let totalScanned = 0;
    
    for (const l of ur_lines) {{
        const res = Scan.scanLine(l);
        if (res.fits && res.fits[0]) {{
            const mId = res.fits[0].meter.id;
            meters[mId] = (meters[mId] || 0) + 1;
            totalScanned++;
        }}
    }}
    
    const sorted = Object.entries(meters).sort((a,b) => b[1] - a[1]);
    const topMeter = sorted[0] ? Number(sorted[0][0]) : null;
    const passRate = totalScanned ? (sorted[0][1] / ur_lines.length) : 0;

    const ascii_lines = ro_lines.map(r => {{
        if (ctx.romanToAscii) {{
            const clean = r.replace(/['’‘]/g, '');
            return ctx.romanToAscii(clean);
        }}
        return r;
    }});
    
    console.log(JSON.stringify({{ topMeter, passRate, ascii_lines }}));
    """
    try:
        res = subprocess.run(['node', '-e', js_code], capture_output=True, text=True, check=True)
        return json.loads(res.stdout.strip())
    except Exception as e:
        return {'topMeter': None, 'passRate': 0, 'ascii_lines': roman_lines}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--limit', type=int, default=88, help="Number of ghazals to process")
    args = parser.parse_args()

    print("Fetching Faiz Rekhta links...")
    links = fetch_links()
    total_available = len(links)
    limit = min(args.limit, total_available)
    print(f"Found {total_available} links. Processing {limit} ghazals...\n")

    ghazals = []

    # If partial file exists, we can load it to resume if needed
    if os.path.exists(OUT_FILE):
        try:
            with open(OUT_FILE, 'r', encoding='utf-8') as f:
                existing = json.load(f)
                if len(existing) > 0 and len(existing) < limit:
                    print(f"Resuming from {len(existing)} previously imported ghazals...")
                    ghazals = existing
        except Exception:
            pass

    start_idx = len(ghazals)

    for i in range(start_idx, limit):
        link = links[i]
        slug = link.split('/')[-1]
        print(f"[{i+1}/{limit}] Fetching: {slug} ...")

        time.sleep(0.12)
        ur_lines = extract_couplet_lines(f"{link}?lang=ur")
        time.sleep(0.12)
        hi_lines = extract_couplet_lines(f"{link}?lang=hi")
        time.sleep(0.12)
        ro_lines = extract_couplet_lines(f"{link}?lang=en")

        filtered = []
        for u, h, r in zip(ur_lines, hi_lines, ro_lines):
            if re.search(r'[\u0600-\u06FF]', u):
                filtered.append((u, h, r))

        if not filtered:
            print("  Skipping (no valid Urdu lines)")
            continue

        ur_lines = [f[0] for f in filtered]
        hi_lines = [f[1] for f in filtered]
        ro_lines = [f[2] for f in filtered]

        print(f"  -> {len(ur_lines)} lines aligned (ur, hi, ro)")

        line_objects = []
        for ur, hi, ro in zip(ur_lines, hi_lines, ro_lines):
            line_objects.append({
                'ur': ur,
                'hi': hi,
                'ro': ro
            })

        ghazals.append({
            'id': i + 1,
            'poet': 'Faiz Ahmed Faiz',
            'url': link,
            'meter_label': f"Faiz-{i+1}",
            'lines_count': len(ur_lines),
            'lines': line_objects
        })

        # Save checkpoint every 5 ghazals
        if (i + 1) % 5 == 0 or (i + 1) == limit:
            with open(OUT_FILE, 'w', encoding='utf-8') as f:
                json.dump(ghazals, f, ensure_ascii=False, indent=2)

    print(f"\nAll done! Successfully saved {len(ghazals)} ghazals to: {OUT_FILE}")

if __name__ == '__main__':
    main()
