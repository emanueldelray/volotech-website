#!/usr/bin/env python3
"""Build a standalone copy of the Prospect Radar dashboard with the research data embedded.

Usage: python3 build_standalone.py <export_dir> <output.html>

<export_dir> is a read-back of the dashboard's artifact database, one folder per
collection (prospects/, screening/, runs/, optional status/), each holding
<doc_id>.json files. The output is a single HTML file that works from any web
server or straight from disk. It contains names and contact details of real
people: never commit it or publish it without access protection.
"""
import json
import pathlib
import sys
from datetime import date

HERE = pathlib.Path(__file__).resolve().parent


def load(folder: pathlib.Path, keep_id: bool):
    docs = []
    for f in sorted(folder.glob("*.json")) if folder.is_dir() else []:
        d = json.loads(f.read_text(encoding="utf-8"))
        if keep_id:
            d = {"id": f.stem, **d}
        docs.append((f.stem, d))
    return docs


def main():
    export_dir, out = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
    data = {
        "exported_at": date.today().isoformat(),
        "prospects": [d for _, d in load(export_dir / "prospects", True)],
        "screening": [d for _, d in load(export_dir / "screening", True)],
        "runs": [d for _, d in load(export_dir / "runs", False)],
        "status": {k: d for k, d in load(export_dir / "status", False)},
    }
    # "</" would end the inline <script> early.
    payload = json.dumps(data, ensure_ascii=False).replace("</", "<\\/")
    page = (HERE / "dashboard.html").read_text(encoding="utf-8")
    html = (
        "<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n"
        "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1,viewport-fit=cover\">\n"
        "<meta name=\"robots\" content=\"noindex,nofollow\">\n"
        "<style>:root{color-scheme:light}body{margin:0;font:14px system-ui,sans-serif}"
        "img{max-width:100%}[hidden]{display:none!important}</style>\n</head>\n<body>\n"
        f"<script>window.PROSPECT_DATA = {payload};</script>\n"
        f"{page}\n</body>\n</html>\n"
    )
    out.write_text(html, encoding="utf-8")
    print(f"{out}: {len(data['prospects'])} prospects, {len(data['screening'])} screened, {len(html) // 1024} KB")


if __name__ == "__main__":
    main()
