"""Base list from OpenStreetMap (Overpass): craft=electrician, shop=electrical, names with 'Elektro'."""
from common import CENTERS, db, log_done, add_raw, is_done
from s01_areas import overpass

R = 32000  # a little over 30 km so fringe businesses can be judged on distance later


def main(rnd=1):
    con = db()
    for region, (lat, lon) in CENTERS.items():
        key = f"{region}"
        if is_done(con, "osm", key):
            continue
        a = f"(around:{R},{lat},{lon})"
        q = f"""[out:json][timeout:240];
        (nwr{a}[craft=electrician];
         nwr{a}[shop=electrical];
         nwr{a}[name~"elektr",i][!amenity][!public_transport][!railway][!highway][!power];
        );
        out center tags;"""
        els = overpass(q)
        n = 0
        for e in els:
            t = e.get("tags", {})
            c = e.get("center") or {"lat": e.get("lat"), "lon": e.get("lon")}
            if not t.get("name") or c.get("lat") is None:
                continue
            n += add_raw(con, "osm", f"{e['type']}/{e['id']}", rnd,
                         name=t.get("name"),
                         street=" ".join(x for x in (t.get("addr:street"), t.get("addr:housenumber")) if x) or None,
                         postcode=t.get("addr:postcode"), town=t.get("addr:city"),
                         lat=c["lat"], lon=c["lon"],
                         phone=t.get("phone") or t.get("contact:phone"),
                         email=t.get("email") or t.get("contact:email"),
                         website=t.get("website") or t.get("contact:website") or t.get("url"),
                         source_url=f"https://www.openstreetmap.org/{e['type']}/{e['id']}",
                         extra={k: v for k, v in t.items() if k in ("craft", "shop", "office", "mobile", "contact:mobile", "operator", "description", "opening_hours")})
        log_done(con, "osm", key, n, rnd)
        print(region, len(els), "elements,", n, "new raw")


if __name__ == "__main__":
    main()
