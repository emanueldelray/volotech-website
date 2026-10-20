"""Gelbe Seiten /branchen/ pages per municipality x keyword. /suche is robots-disallowed, so any
redirect into /suche is skipped and logged as 'robots'."""
import base64, html as H, re, sys, urllib.parse
from common import db, get, log_done, is_done, add_raw, SESSION

KEYWORDS = ["elektriker", "elektroinstallation"]


def b64(s):
    try:
        return base64.b64decode(s).decode("utf-8", "replace")
    except Exception:
        return None


def txt(s):
    return " ".join(H.unescape(re.sub(r"<[^>]+>", " ", s or "")).split())


def parse(page):
    out = []
    for art in re.findall(r'<article class="mod mod-Treffer".*?</article>', page, re.S):
        gid = re.search(r'data-realid="([^"]+)"', art)
        name = re.search(r'mod-Treffer__name"[^>]*>(.*?)</h2>', art, re.S)
        if not gid or not name:
            continue
        addr = re.search(r'mod-AdresseKompakt__adress-text">(.*?)<span class="mod-AdresseKompakt__entfernung', art, re.S) \
            or re.search(r'mod-AdresseKompakt__adress-text">(.*?)</div>', art, re.S)
        a = txt(addr.group(1)) if addr else ""
        m = re.match(r"(.*?),?\s*(\d{5})\s+([^()]+)", a)
        phone = re.search(r'mod-TelefonnummerKompakt__phoneNumber[^>]*>\s*([^<]+)<', art)
        web = re.search(r'data-webseiteLink="([^"]+)"', art)
        cat = re.search(r'mod-Treffer--besteBranche">(.*?)</p>', art, re.S)
        rating = re.search(r'BewertungKompakt__number[^>]*>([\d,]+)', art)
        nrev = re.search(r'BewertungKompakt__text[^>]*>(\d+) Bewertung', art)
        out.append(dict(key=gid.group(1), name=txt(name.group(1)),
                        street=m.group(1).strip(" ,") if m else None, postcode=m.group(2) if m else None,
                        town=m.group(3).strip() if m else None, phone=txt(phone.group(1)) if phone else None,
                        website=b64(web.group(1)) if web else None,
                        source_url=f"https://www.gelbeseiten.de/gsbiz/{gid.group(1)}",
                        extra={"category": txt(cat.group(1)) if cat else None,
                               "gs_rating": rating.group(1).replace(",", ".") if rating else None,
                               "gs_reviews": int(nrev.group(1)) if nrev else None}))
    return out


def main(rnd=1, keywords=None, towns=None):
    con = db()
    towns = towns or [r[0] for r in con.execute("SELECT DISTINCT name FROM municipality ORDER BY dist_center")]
    for town in towns:
        for kw in keywords or KEYWORDS:
            key = f"{kw}|{town}"
            if is_done(con, "gelbeseiten", key):
                continue
            url = f"https://www.gelbeseiten.de/branchen/{kw}/{urllib.parse.quote(town.lower())}"
            try:
                r = get(url, delay=2, allow_redirects=False)
                hops = 0
                while r.is_redirect and hops < 3:
                    nxt = urllib.parse.urljoin(url, r.headers["Location"])
                    if urllib.parse.urlsplit(nxt).path.lower().startswith("/suche"):
                        r = None
                        break
                    url, r, hops = nxt, get(nxt, delay=2, allow_redirects=False), hops + 1
            except Exception as e:
                print("ERR", url, e, file=sys.stderr)
                continue
            if r is None:
                log_done(con, "gelbeseiten", key, 0, rnd, status="robots")
                print(f"{key}: skipped (redirect to /suche)", flush=True)
                continue
            rows = parse(r.text) if r.status_code == 200 else []
            n = 0
            for x in rows:
                n += add_raw(con, "gelbeseiten", x.pop("key"), rnd, **x)
            con.commit()
            log_done(con, "gelbeseiten", key, n, rnd, status="done" if r.status_code == 200 else f"http{r.status_code}")
            print(f"{key}: {len(rows)} hits, +{n}", flush=True)


if __name__ == "__main__":
    main()
