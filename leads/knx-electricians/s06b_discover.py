"""Find websites for businesses that have none in any directory: try a handful of likely domains built
from the name and accept one only if its homepage/Impressum shows the business's own postcode+street
or phone number. Stored as raw rows (source 'website-discovery') so the merge step picks them up."""
import re, socket, sys
from concurrent.futures import ThreadPoolExecutor
from common import db, add_raw, get, norm_phone

GENERIC = {"elektro", "elektrotechnik", "elektroinstallation", "elektroinstallationen", "gmbh", "co", "kg", "inh",
           "inhaber", "und", "service", "meisterbetrieb", "technik", "ek", "e", "k", "gbr", "ug", "ohg", "elektrobau",
           "elektroanlagen", "gebäudetechnik", "haustechnik", "der", "die", "das", "fa", "firma", "installation"}


def slug(s):
    s = s.lower().replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def candidates(name, town):
    words = [w for w in re.findall(r"[A-Za-zÄÖÜäöüß]+", name) if w.lower() not in GENERIC and len(w) > 2]
    if not words:
        return []
    key = [slug(words[0])]
    if len(words) > 1:
        key.append(slug(words[1]))
    out = []
    for k in key:
        out += [f"elektro-{k}.de", f"elektro{k}.de", f"{k}-elektro.de", f"elektrotechnik-{k}.de",
                f"{k}-elektrotechnik.de", f"{k}.de"]
        if town:
            out.append(f"elektro-{k}-{slug(town.split()[0])}.de")
    seen = []
    return [d for d in out if not (d in seen or seen.append(d))]


def verify(domain, b):
    try:
        socket.gethostbyname(domain)
    except OSError:
        return None
    for path in ("/", "/impressum"):
        try:
            r = get(f"http://{domain}{path}", delay=1.5, timeout=12, tries=1)
        except Exception:
            return None
        if r.status_code != 200:
            continue
        t = re.sub(r"\s+", " ", r.text)
        digits = re.sub(r"\D", "", t)
        street = (b["street"] or "").split()[0][:6].lower() if b["street"] else ""
        if b["postcode"] and b["postcode"] in t and (not street or street in t.lower()):
            return r.url
        for p in b["phones"]:
            n = norm_phone(p)
            if n and len(n) >= 8 and n[1:] in digits:
                return r.url
    return None


def work(b):
    for d in candidates(b["name"], b["town"]):
        url = verify(d, b)
        if url:
            return b, url
    return b, None


def main(rnd=1):
    con = db()
    rows = con.execute("""SELECT id, name, street, postcode, town, phones FROM business
                          WHERE domain IS NULL AND id NOT IN
                          (SELECT source_key FROM raw WHERE source='website-discovery')""").fetchall()
    todo = []
    for r in rows:
        import json
        todo.append({**dict(r), "phones": [p["v"] for p in json.loads(r["phones"])]})
    print(len(todo), "businesses without website", flush=True)
    found = 0
    with ThreadPoolExecutor(10) as ex:
        for b, url in ex.map(work, todo):
            add_raw(con, "website-discovery", b["id"], rnd, name=b["name"], street=b["street"], postcode=b["postcode"],
                    town=b["town"], phone=b["phones"][0] if b["phones"] else None, website=url,
                    source_url=url, extra={"verified_by": "postcode/phone on site", "for": b["id"]} if url else {"none": True})
            con.commit()
            if url:
                found += 1
                print(b["name"], "->", url, flush=True)
    print("discovered", found, "of", len(todo))


if __name__ == "__main__":
    main()
