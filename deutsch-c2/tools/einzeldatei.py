#!/usr/bin/env python3
"""Erzeugt deutsch-c2-einzeldatei.html: die komplette App (CSS, Inhalte, JS) in einer Datei.

Optional – die App läuft auch ohne diesen Schritt direkt aus index.html.
Nur die Einzeldatei kann „App + Lernstand als eine Datei“ exportieren.

Aufruf:  python3 tools/einzeldatei.py [Zielordner]
"""
import os
import re
import sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = sys.argv[1] if len(sys.argv) > 1 else BASE


def read(rel):
    with open(os.path.join(BASE, rel), encoding='utf-8') as f:
        return f.read()


html = read('index.html')
html = html.replace('<link rel="stylesheet" href="css/app.css">', '<style>\n' + read('css/app.css') + '\n</style>')
html = html.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n  <script>window.APP_BUNDLED = true;</script>', 1)
html = re.sub(r'<script src="([^"]+)"></script>',
              lambda m: '<script>\n' + read(m.group(1)).replace('</script', '<\\/script') + '\n</script>', html)

out = os.path.join(OUT_DIR, 'deutsch-c2-einzeldatei.html')
with open(out, 'w', encoding='utf-8') as f:
    f.write(html)
print('geschrieben:', out)
