"""Gelbe Seiten district (Stadtteil) pages for the big cities, discovered via GS's own sitemaps."""
import gzip, re, sys, urllib.parse
from common import db, get, log_done, is_done, add_raw
from s04_gelbeseiten import parse

CITIES = ("muenchen", "augsburg", "ingolstadt", "ulm", "neu_ulm")


def main(rnd=1):
    con = db()
    idx = get("https://www.gelbeseiten.de/sitemap_index_TrefferlisteStadtteil.xml", delay=2).text
    maps = [u for u in re.findall(r"<loc>([^<]*_alle_[^<]*)</loc>", idx)
            if re.search(r"stadtteile_(%s)_" % "|".join(CITIES), u)]
    for sm in maps:
        if is_done(con, "gs_sitemap", sm):
            continue
        try:
            body = gzip.decompress(get(sm, delay=2).content).decode("utf-8", "replace")
        except Exception as e:
            print("ERR", sm, e, file=sys.stderr)
            continue
        for url in re.findall(r"<loc>([^<]*/branchen/(?:elektriker|elektroinstallation)/[^<]*)</loc>", body):
            key = urllib.parse.unquote(url.split("/branchen/")[1])
            if is_done(con, "gelbeseiten", key):
                continue
            r = get(url, delay=2, allow_redirects=False)
            rows = parse(r.text) if r.status_code == 200 else []
            n = sum(add_raw(con, "gelbeseiten", x.pop("key"), rnd, **x) for x in rows)
            con.commit()
            log_done(con, "gelbeseiten", key, n, rnd, status="done" if r.status_code == 200 else f"http{r.status_code}")
            print(f"{key}: {len(rows)} hits, +{n}", flush=True)
        log_done(con, "gs_sitemap", sm, 0, rnd)


if __name__ == "__main__":
    main()
