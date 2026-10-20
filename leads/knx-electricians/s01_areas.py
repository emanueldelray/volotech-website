"""Municipalities (admin_level 8 + kreisfreie Städte) within RADIUS_KM of each city centre."""
import json, time
from common import CENTERS, RADIUS_KM, db, get, haversine

OVERPASS = "https://maps.mail.ru/osm/tools/overpass/api/interpreter"


def overpass(q, tries=6):
    for i in range(tries):
        r = get(OVERPASS, delay=5, timeout=300, check_robots=False, params={"data": q})
        if r.status_code == 200:
            return r.json()["elements"]
        print("overpass", r.status_code, "retry", i)
        time.sleep(20 * (i + 1))
    r.raise_for_status()


def main():
    con = db()
    for region, (lat, lon) in CENTERS.items():
        if con.execute("SELECT 1 FROM municipality WHERE region=?", (region,)).fetchone():
            continue
        q = f"""[out:json][timeout:240];
        rel(around:{RADIUS_KM * 1000},{lat},{lon})[boundary=administrative][admin_level~"^(6|8)$"][name];
        out center tags;"""
        els = overpass(q)
        n = 0
        for e in els:
            t = e["tags"]
            if t.get("admin_level") == "6" and "Landkreis" in t.get("name", "") or "Kreis" in t.get("name", ""):
                continue
            c = e.get("center")
            if not c:
                continue
            d = haversine((lat, lon), (c["lat"], c["lon"]))
            con.execute("INSERT OR REPLACE INTO municipality VALUES (?,?,?,?,?,?)",
                        (t["name"], region, c["lat"], c["lon"], round(d, 1), str(e["id"])))
            n += 1
        con.commit()
        print(region, len(els), "boundaries ->", n, "municipalities")


if __name__ == "__main__":
    main()
