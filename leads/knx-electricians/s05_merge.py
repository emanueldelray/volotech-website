"""Filter raw directory/OSM rows to relevant electricians, geolocate, deduplicate -> business table."""
import json, re, statistics
from collections import defaultdict
from common import (CENTERS, GENERIC_DOMAINS, GERSTHOFEN, TODAY, db, domain_of, haversine,
                    nearest_region, norm_name, norm_phone)

MAX_KM = 32  # "~30 km" around each centre

POSITIVE = re.compile(r"elektr|electric|elt\b|gebäudetechnik|gebaeudetechnik|smart ?home|knx|haustechnik|"
                      r"licht|strom|e-technik|energietechnik|installation", re.I)
NEGATIVE = re.compile(
    r"großhandel|grosshandel|elektronik|unterhaltungs|fernseh|\btv\b|hifi|computer|\bedv\b|\bit[- ]service|"
    r"media ?markt|saturn|expert\b|euronics|hausgeräte|hausgeraete|haushaltsgeräte|kundendienst|"
    r"elektromotoren|motoren|fahrrad|e-?bike|roller|auto(haus)?\b|kfz|kraftfahrzeug|fahrzeug|"
    r"ingenieurbüro|ingenieurbuero|planungsbüro|\bibh\b|stromspeicher discount|1komma5|enpal|zolar|"
    r"medizin|kälte(?!.*elektro)|schrott|recycling|reparatur.?service|handy|smartphone|telekom|vodafone|o2\b|"
    r"leuchtsysteme|lampen|leuchten|beleuchtung handel|zweirad|apotheke|schule|verein|stadtwerke|"
    r"bayernwerk|swm\b|lew\b|netze|umspann|kraftwerk|bahn|klinik|rewe|edeka|bauhaus|obi\b|hornbach|"
    r"sonepar|rexel|zajadacz|hagemeyer|ffl\b|würth|wuerth|conrad|reichelt|elektro ?maier großhandel|"
    r"spie\b|cegelec|imtech|caverion|bilfinger|yit\b|engie|equans|vinci|actemium|omexom|elektro-?bau ag",
    re.I)
TRUSTED_CATS = re.compile(r"elektr|gebäudetechnik|smart", re.I)


def relevant(r, extra):
    name = r["name"] or ""
    if r["source"] == "website-discovery":
        return bool(r["website"])  # only created for already-relevant businesses
    if NEGATIVE.search(name):
        return False
    src = r["source"]
    if src == "osm":
        if extra.get("craft") == "electrician":
            return True
        return bool(re.search(r"elektr|electric", name, re.I)) and extra.get("shop") in (None, "electrical", "trade", "yes")
    if src == "dasoertliche":
        if extra.get("keyword") in ("Elektriker", "Elektromeister"):
            return True
        return bool(POSITIVE.search(name))
    if src == "gelbeseiten":
        cat = extra.get("category") or ""
        if re.search(r"elektronik|haushalt|großhandel|computer|fernseh", cat, re.I):
            return False
        return bool(TRUSTED_CATS.search(cat)) or bool(POSITIVE.search(name))
    return bool(POSITIVE.search(name))


def main():
    con = db()
    rows = [dict(r) for r in con.execute("SELECT * FROM raw")]
    for r in rows:
        r["extra"] = json.loads(r["extra"] or "{}")

    # postcode / town centroids from geocoded rows, municipality centres as fallback
    pc = defaultdict(list)
    for r in rows:
        if r["lat"] and r["postcode"]:
            pc[r["postcode"]].append((r["lat"], r["lon"]))
    pc_cent = {k: (statistics.median(a for a, _ in v), statistics.median(b for _, b in v)) for k, v in pc.items()}
    town_cent = {m["name"].lower(): (m["lat"], m["lon"]) for m in con.execute("SELECT * FROM municipality")}
    munis = [(m["name"], m["lat"], m["lon"]) for m in con.execute("SELECT * FROM municipality")]

    keep = []
    for r in rows:
        if not relevant(r, r["extra"]):
            continue
        if not r["lat"]:
            loc = pc_cent.get(r["postcode"] or "") or town_cent.get((r["town"] or "").lower().split(" (")[0])
            if not loc:
                continue
            r["lat"], r["lon"], r["geo_approx"] = loc[0], loc[1], True
        region, d = nearest_region(r["lat"], r["lon"])
        if d > MAX_KM:
            continue
        r["region"], r["dist_center"] = region, d
        keep.append(r)

    # union-find dedup on phone, website domain, normalised name + postcode
    parent = list(range(len(keep)))

    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    seen = {}
    for i, r in enumerate(keep):
        keys = []
        p = norm_phone(r["phone"])
        if p:
            keys.append("p:" + p)
        dom = domain_of(r["website"]) or (domain_of(r["email"].split("@")[1]) if r["email"] and "@" in r["email"] else None)
        if dom and dom not in GENERIC_DOMAINS and not any(dom.endswith("." + g) or dom == g for g in GENERIC_DOMAINS):
            keys.append("d:" + dom)
        nn = norm_name(r["name"])
        if nn and r["postcode"]:
            keys.append(f"n:{nn}|{r['postcode']}")
        # same name, no postcode, very close -> also same
        if nn:
            keys.append(f"g:{nn}|{round(r['lat'], 2)}|{round(r['lon'], 2)}")
        for k in keys:
            if k in seen:
                parent[find(i)] = find(seen[k])
            else:
                seen[k] = i

    groups = defaultdict(list)
    for i in range(len(keep)):
        groups[find(i)].append(keep[i])

    rank = {"gelbeseiten": 0, "osm": 1, "dasoertliche": 2}
    con.execute("DROP TABLE IF EXISTS business")
    con.execute("""CREATE TABLE business (id TEXT PRIMARY KEY, name TEXT, street TEXT, postcode TEXT, town TEXT,
        region TEXT, lat REAL, lon REAL, geo_approx INTEGER, dist_center REAL, dist_gersthofen REAL,
        phones TEXT, emails TEXT, website TEXT, domain TEXT, gs_rating REAL, gs_reviews INTEGER,
        categories TEXT, sources TEXT, first_round INTEGER, collected TEXT)""")
    for g in groups.values():
        g.sort(key=lambda r: (rank.get(r["source"], 9), r["name"] is None))
        best = g[0]
        addr = next((r for r in sorted(g, key=lambda r: rank.get(r["source"], 9) if r["street"] else 99)), best)
        geo = next((r for r in g if not r.get("geo_approx")), best)
        phones, emails, webs, cats, srcs = [], [], [], [], []
        for r in sorted(g, key=lambda r: rank.get(r["source"], 9)):
            for p in re.split(r"[;,]", r["phone"] or ""):
                if norm_phone(p) and norm_phone(p) not in [norm_phone(x["v"]) for x in phones]:
                    phones.append({"v": p.strip(), "src": r["source_url"]})
            for m in [r["extra"].get("mobile"), r["extra"].get("contact:mobile")]:
                if m and norm_phone(m) not in [norm_phone(x["v"]) for x in phones]:
                    phones.append({"v": m.strip(), "src": r["source_url"]})
            if r["email"] and r["email"].lower() not in [e["v"] for e in emails]:
                emails.append({"v": r["email"].lower().strip(), "src": r["source_url"]})
            if r["website"] and domain_of(r["website"]) not in GENERIC_DOMAINS:
                webs.append(r["website"])
            for c in (r["extra"].get("category"), r["extra"].get("craft"), r["extra"].get("keyword")):
                if c and c not in cats:
                    cats.append(c)
            srcs.append({"source": r["source"], "url": r["source_url"], "date": r["collected"]})
        web = webs[0] if webs else None
        if web and not re.match(r"https?://", web):
            web = "http://" + web
        gs = next((r["extra"] for r in g if r["extra"].get("gs_rating")), {})
        bid = "b" + str(min(r["id"] for r in g))
        name = re.sub(r"\s*/\s*(Elektriker|Elektroinstallation|Elektro)\b.*$", "", best["name"]).strip()
        town = addr["town"]
        if not town:
            town = min(munis, key=lambda m: haversine((geo["lat"], geo["lon"]), (m[1], m[2])))[0]
        con.execute("INSERT INTO business VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", (
            bid, name, addr["street"], addr["postcode"], town, geo["region"], geo["lat"], geo["lon"],
            int(bool(geo.get("geo_approx"))), round(geo["dist_center"], 1),
            round(haversine(GERSTHOFEN, (geo["lat"], geo["lon"])), 1),
            json.dumps(phones, ensure_ascii=False), json.dumps(emails, ensure_ascii=False), web, domain_of(web),
            float(gs["gs_rating"]) if gs.get("gs_rating") else None, gs.get("gs_reviews"),
            json.dumps(cats, ensure_ascii=False), json.dumps(srcs, ensure_ascii=False),
            min(r["round"] for r in g), min(r["collected"] for r in g)))
    con.commit()
    tot = con.execute("SELECT region, COUNT(*) FROM business GROUP BY region").fetchall()
    print("raw", len(rows), "relevant+in-area", len(keep), "businesses", len(groups), dict(tot))


if __name__ == "__main__":
    main()
