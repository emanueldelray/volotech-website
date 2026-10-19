"""One full collection round. Each round widens the search (more keywords / sub-localities);
state lives in data/leads.sqlite so any step can be re-run or resumed.

Usage: python3 run_round.py <round>      (1 = base sources, 2+ = widening rounds)
Stop criterion: two consecutive rounds that add < 2 % new businesses."""
import re, sys, threading
from common import TODAY, db
import s06b_discover, s02_osm, s03_dasoertliche, s04_gelbeseiten, s04b_gs_districts, s04c_muenchen_de, s05_merge, s06_websites

ROUNDS = {
    # round: (Das Örtliche keywords, Gelbe Seiten keywords, use sub-localities from collected addresses)
    1: (["Elektriker", "Elektromeister", "KNX"], ["elektriker", "elektroinstallation"], False),
    2: (["Elektrotechnik", "Elektroinstallation", "Smart Home"], ["elektrotechnik", "elektromeister"], True),
    3: (["Elektroanlagen", "Gebäudetechnik", "Elektro"], ["smart home", "elektroanlagen"], True),
    4: (["Photovoltaik", "Wallbox"], ["photovoltaik", "gebäudetechnik"], True),
}


def sub_localities(con):
    """Town names seen in directory addresses that are not yet searched (e.g. 'Gersthofen-Batzenhofen' style)."""
    known = {r[0].lower() for r in con.execute("SELECT name FROM municipality")}
    towns = set()
    for (t,) in con.execute("SELECT DISTINCT town FROM business WHERE town IS NOT NULL"):
        t = re.sub(r"\s*\(.*\)$", "", t).strip()
        if t and t.lower() not in known:
            towns.add(t)
    return sorted(towns)


def main(rnd):
    con = db()
    before = con.execute("SELECT COUNT(*) FROM business").fetchone()[0] if \
        con.execute("SELECT 1 FROM sqlite_master WHERE name='business'").fetchone() else 0
    do_kw, gs_kw, subloc = ROUNDS[min(rnd, max(ROUNDS))]
    if rnd == 1:
        s02_osm.main(rnd)
        s04c_muenchen_de.main(rnd)
    towns = None
    if subloc:
        extra = sub_localities(con)
        towns = [r[0] for r in con.execute("SELECT DISTINCT name FROM municipality ORDER BY dist_center")] + extra
        print(len(extra), "extra sub-localities")
    # different hosts, so both directories can run side by side (each still rate-limited)
    t = threading.Thread(target=s04_gelbeseiten.main, args=(rnd, gs_kw, towns))
    t.start()
    s03_dasoertliche.main(rnd, do_kw, towns)
    t.join()
    if rnd == 1:
        s04b_gs_districts.main(rnd)
    s05_merge.main()
    s06_websites.main()
    s06b_discover.main(rnd)
    s05_merge.main()
    s06_websites.main()
    after = con.execute("SELECT COUNT(*) FROM business").fetchone()[0]
    new = after - before
    con.execute("INSERT OR REPLACE INTO rounds VALUES (?,?,?,?)", (rnd, TODAY, after, new))
    con.commit()
    print(f"ROUND {rnd}: {before} -> {after} businesses (+{new}, {100 * new / max(before, 1):.1f} %)")


if __name__ == "__main__":
    main(int(sys.argv[1]))
