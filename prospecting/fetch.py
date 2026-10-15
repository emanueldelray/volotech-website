#!/usr/bin/env python3
"""Fetch a web page through the session proxy and print it as plain text.
Usage: python3 -I fetch.py URL [max_chars]   (default 12000)
Prints the final URL, then the visible text, then the page's links (same site first)."""
import sys, re, html, subprocess
from urllib.parse import urljoin, urlparse
url = sys.argv[1]; limit = int(sys.argv[2]) if len(sys.argv) > 2 else 12000
r = subprocess.run(["curl", "-sS", "-L", "--max-time", "25", "-A", "Mozilla/5.0 (X11; Linux x86_64)",
                    "-w", "\n__FINAL__%{url_effective} %{http_code}", url], capture_output=True)
raw = r.stdout.decode("utf-8", "replace")
if "__FINAL__" not in raw:
    print("FETCH FAILED:", r.stderr.decode()[:300]); sys.exit(1)
body, final = raw.rsplit("\n__FINAL__", 1)
print("URL:", final)
links = []
for m in re.finditer(r'(?is)<a[^>]+href=["\']([^"\'#]+)["\'][^>]*>(.*?)</a>', body):
    href = urljoin(final.split()[0], m.group(1)); label = re.sub(r"<[^>]+>|\s+", " ", m.group(2)).strip()
    if href.startswith("http") and (href, label) not in links: links.append((href, label))
t = re.sub(r"(?is)<(script|style|noscript|svg).*?</\1>", " ", body)
t = re.sub(r"(?i)<br\s*/?>|</(p|div|li|h\d|tr)>", "\n", t)
t = html.unescape(re.sub(r"<[^>]+>", " ", t))
t = "\n".join(l for l in (re.sub(r"[ \t]+", " ", x).strip() for x in t.splitlines()) if l)
print(t[:limit])
host = urlparse(final.split()[0]).netloc
print("\nLINKS:")
for h, l in sorted(links, key=lambda x: urlparse(x[0]).netloc != host)[:80]:
    print("-", l[:60], "->", h)
