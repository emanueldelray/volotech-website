"""Stadtbranchenbuch muenchen.de, category 'Elektroinstallation: Elektriker' (E/98)."""
import html as H, re
from common import db, get, log_done, is_done, add_raw


def txt(s):
    return " ".join(H.unescape(re.sub(r"<[^>]+>", " ", s or "")).split())


def parse(page):
    out = []
    for it in re.split(r'class="results-item">', page)[1:]:
        mhp = re.search(r'href="(https://(?:branchenbuch\.portal\.muenchen\.de/mhp|orte\.muenchen\.de)/(\d+)[^"]*)"', it)
        name = re.search(r'<h2 class="(?:name|brand)">\s*<a[^>]*>(.*?)<div class="slogan"|<h2 class="(?:name|brand)">\s*<a[^>]*>(.*?)</a>', it, re.S)
        if not mhp or not name:
            continue
        postal = re.search(r'class="postal"[^>]*>(.*?)<div class="zip">(.*?)</div>', it, re.S)
        zipm = re.match(r"(\d{5})\s+(.*)", txt(postal.group(2))) if postal else None
        tel = re.search(r'class="tel"[^>]*>\s*Tel:\s*([^<]+)<', it)
        cat = re.search(r'class="category"[^>]*>(.*?)</a>', it, re.S)
        web = re.search(r'href="([^"]+)" class="link-wrapper homepage"', it)
        mail = re.search(r'href="mailto:([^"]+)"', it)
        desc = re.search(r'class="description"[^>]*>(.*?)</a>', it, re.S)
        stars = it.count("gold-star")
        nrev = re.search(r'review-number">\((\d+)\)', it)
        out.append(dict(key=mhp.group(2), name=txt(name.group(1) or name.group(2)),
                        street=txt(postal.group(1)) if postal else None,
                        postcode=zipm.group(1) if zipm else None, town=zipm.group(2) if zipm else None,
                        phone=tel.group(1).strip() if tel else None, website=web.group(1) if web else None,
                        email=mail.group(1) if mail else None,
                        source_url=mhp.group(1),
                        extra={"description": txt(desc.group(1)) if desc else None, "category": txt(cat.group(1)) if cat else "Elektroinstallation"}))
    return out


# muenchen.de also hosts the directory for the surrounding Landkreise
AREAS = ["", "muenchen-landkreis/", "dachau/", "fuerstenfeldbruck/", "freising/", "erding/", "ebersberg/",
         "starnberg/", "landsberg-am-lech/", "pfaffenhofen-an-der-ilm/", "bad-toelz-wolfratshausen/",
         "miesbach/", "rosenheim-landkreis/", "ingolstadt/", "eichstaett/", "neuburg-schrobenhausen/"]


def main(rnd=1):
    con = db()
    for area in AREAS:
        crawl(con, area, rnd)


def crawl(con, area, rnd):
    page = 1
    while page < 60:
        url = "https://www.muenchen.de/service/branchenbuch/%sE/98%s.html" % (area, "" if page == 1 else f"_{page}")
        if not is_done(con, "muenchen.de", url):
            r = get(url, delay=2)
            if r.status_code != 200:
                print(url, r.status_code)
                break
            rows = parse(r.text)
            n = sum(add_raw(con, "muenchen.de", x.pop("key"), rnd, **x) for x in rows)
            con.commit()
            log_done(con, "muenchen.de", url, n, rnd)
            print(url, len(rows), "+", n, flush=True)
            if not rows or f"98_{page + 1}.html" not in r.text:
                break
        page += 1


if __name__ == "__main__":
    main()
