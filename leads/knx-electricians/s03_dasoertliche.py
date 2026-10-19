"""Das Örtliche topic pages per municipality x keyword (robots.txt allows everything)."""
import json, re, sys, urllib.parse
from common import db, get, log_done, is_done, add_raw

KEYWORDS = ["Elektriker", "Elektromeister", "KNX"]
BASE = "https://www.dasoertliche.de/Themen/{kw}/{town}{page}.html"


def parse(html):
    m = re.search(r"handlerData =(\[.*?\]\]);", html, re.S)
    rows = json.loads(m.group(1)) if m else []
    geo = {}
    for ld in re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S):
        try:
            d = json.loads(ld)
        except ValueError:
            continue
        for it in d.get("itemListElement", []) if d.get("@type") == "ItemList" else []:
            b = it.get("item", {})
            g = b.get("geo") or {}
            geo[b.get("url")] = (g.get("latitude"), g.get("longitude"))
    out = []
    for r in rows:
        url = r[15]
        lat, lon = geo.get(url, (None, None))
        web = (r[3] or "").strip()
        if web.startswith("http://") and "@" in web:  # "http://info@domain.de" quirk
            web = "http://" + web.split("@", 1)[1]
        out.append(dict(key=r[0], name=r[14], town=r[4], postcode=r[8],
                        street=" ".join(x for x in (r[9], r[10]) if x) or None,
                        phone=r[11] or None, email=r[17] or None, website=web or None,
                        source_url=url, lat=float(lat) if lat else None, lon=float(lon) if lon else None))
    return out, bool(re.search(r"-Seite-\d+\.html", html))


def main(rnd=1, keywords=None, towns=None):
    con = db()
    towns = towns or [r[0] for r in con.execute("SELECT DISTINCT name FROM municipality ORDER BY dist_center")]
    for town in towns:
        for kw in keywords or KEYWORDS:
            key = f"{kw}|{town}"
            if is_done(con, "dasoertliche", key):
                continue
            n, page = 0, 1
            while page <= 60:
                url = BASE.format(kw=kw, town=urllib.parse.quote(town), page="" if page == 1 else f"-Seite-{page}")
                try:
                    r = get(url, delay=1.5)
                except Exception as e:
                    print("ERR", url, e, file=sys.stderr)
                    break
                if r.status_code != 200:
                    break
                rows, has_pages = parse(r.text)
                for x in rows:
                    n += add_raw(con, "dasoertliche", x.pop("key"), rnd, extra={"keyword": kw, "search_town": town}, **x)
                con.commit()
                if not rows or not has_pages or f"-Seite-{page + 1}.html" not in r.text:
                    break
                page += 1
            log_done(con, "dasoertliche", key, n, rnd)
            print(f"{key}: +{n} ({page} p)", flush=True)


if __name__ == "__main__":
    main()
