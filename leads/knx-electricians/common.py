"""Shared helpers: SQLite state, polite HTTP, normalisation, geo."""
import json, math, re, sqlite3, threading, time, urllib.parse, urllib.robotparser
from datetime import date
from pathlib import Path

import requests

BASE = Path(__file__).resolve().parent
DB_PATH = BASE / "data" / "leads.sqlite"
TODAY = date.today().isoformat()
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"

GERSTHOFEN = (48.4247, 10.8728)
RADIUS_KM = 30
CENTERS = {
    "Augsburg": (48.3705, 10.8978),
    "München": (48.1374, 11.5755),
    "Ingolstadt": (48.7651, 11.4237),
    "Ulm": (48.3984, 9.9916),
}


def haversine(a, b):
    lat1, lon1, lat2, lon2 = map(math.radians, (*a, *b))
    h = math.sin((lat2 - lat1) / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin((lon2 - lon1) / 2) ** 2
    return 6371 * 2 * math.asin(math.sqrt(h))


def nearest_region(lat, lon):
    best = min(CENTERS.items(), key=lambda kv: haversine((lat, lon), kv[1]))
    return best[0], haversine((lat, lon), best[1])


# ---------------------------------------------------------------- database
SCHEMA = """
CREATE TABLE IF NOT EXISTS municipality (
  name TEXT, region TEXT, lat REAL, lon REAL, dist_center REAL, osm_id TEXT,
  PRIMARY KEY (name, region));
CREATE TABLE IF NOT EXISTS source_log (
  source TEXT, key TEXT, status TEXT, n INTEGER, done_at TEXT, round INTEGER,
  PRIMARY KEY (source, key));
CREATE TABLE IF NOT EXISTS raw (
  id INTEGER PRIMARY KEY AUTOINCREMENT, source TEXT, source_key TEXT, source_url TEXT,
  name TEXT, street TEXT, postcode TEXT, town TEXT, lat REAL, lon REAL,
  phone TEXT, email TEXT, website TEXT, extra TEXT, collected TEXT, round INTEGER,
  UNIQUE (source, source_key));
CREATE TABLE IF NOT EXISTS site (
  domain TEXT PRIMARY KEY, status TEXT, fetched TEXT, data TEXT);
CREATE TABLE IF NOT EXISTS rounds (
  round INTEGER PRIMARY KEY, finished TEXT, businesses INTEGER, new INTEGER);
"""


def db():
    DB_PATH.parent.mkdir(exist_ok=True)
    con = sqlite3.connect(DB_PATH, timeout=60)
    con.row_factory = sqlite3.Row
    con.executescript(SCHEMA)
    return con


def log_done(con, source, key, n, rnd, status="done"):
    con.execute("INSERT OR REPLACE INTO source_log VALUES (?,?,?,?,?,?)",
                (source, key, status, n, TODAY, rnd))
    con.commit()


def is_done(con, source, key):
    return con.execute("SELECT 1 FROM source_log WHERE source=? AND key=? AND status IN ('done','robots')",
                       (source, key)).fetchone() is not None


def add_raw(con, source, source_key, rnd, **f):
    extra = f.pop("extra", None)
    cols = ["name", "street", "postcode", "town", "lat", "lon", "phone", "email", "website", "source_url"]
    vals = [f.get(c) for c in cols]
    cur = con.execute(
        f"INSERT OR IGNORE INTO raw (source, source_key, {','.join(cols)}, extra, collected, round) "
        f"VALUES (?,?,{','.join('?' * len(cols))},?,?,?)",
        [source, source_key, *vals, json.dumps(extra or {}, ensure_ascii=False), TODAY, rnd])
    return cur.rowcount


# ---------------------------------------------------------------- polite HTTP
_last_hit = {}
_lock = threading.Lock()
_robots = {}
SESSION = requests.Session()
SESSION.headers.update({"User-Agent": UA, "Accept-Language": "de-DE,de;q=0.9"})


def _wait(host, delay):
    with _lock:
        now = time.monotonic()
        t = max(now, _last_hit.get(host, 0) + delay)
        _last_hit[host] = t
    if t > now:
        time.sleep(t - now)


def robots_ok(url):
    p = urllib.parse.urlsplit(url)
    root = f"{p.scheme}://{p.netloc}"
    if root not in _robots:
        rp = urllib.robotparser.RobotFileParser()
        try:
            r = SESSION.get(root + "/robots.txt", timeout=15)
            rp.parse(r.text.splitlines() if r.status_code == 200 else [])
        except Exception:
            rp.parse([])
        _robots[root] = rp
    return _robots[root].can_fetch("*", url)


def get(url, delay=1.5, timeout=25, check_robots=True, tries=3, **kw):
    if check_robots and not robots_ok(url):
        raise PermissionError(f"robots.txt disallows {url}")
    _wait(urllib.parse.urlsplit(url).netloc, delay)
    for attempt in range(tries):
        try:
            r = SESSION.get(url, timeout=timeout, **kw)
            if r.status_code in (429, 502, 503, 504) and attempt < tries - 1:
                time.sleep(5 * (attempt + 1))
                continue
            return r
        except requests.RequestException:
            if attempt == tries - 1:
                raise
            time.sleep(3 * (attempt + 1))
    return r


# ---------------------------------------------------------------- normalisation
def norm_phone(p):
    if not p:
        return None
    d = re.sub(r"\(0\)", "", p)
    d = re.sub(r"[^\d+]", "", d)
    if d.startswith("+49"):
        d = "0" + d[3:]
    elif d.startswith("0049"):
        d = "0" + d[4:]
    d = d.replace("+", "")
    d = re.sub(r"^0(0)", "0", d)
    return d if len(d) >= 6 else None


def is_mobile(p):
    return bool(re.match(r"^01[5-7]", norm_phone(p) or ""))


def domain_of(url):
    if not url:
        return None
    url = url.strip()
    if "@" in url and "/" not in url.split("@")[-1][:0]:
        url = url.split("@")[-1]
    if not re.match(r"https?://", url):
        url = "http://" + url
    host = urllib.parse.urlsplit(url).netloc.lower().split(":")[0]
    host = re.sub(r"^www\d?\.", "", host)
    return host or None


GENERIC_DOMAINS = {"facebook.com", "instagram.com", "google.com", "gelbeseiten.de", "dasoertliche.de",
                   "11880.com", "myhammer.de", "jimdo.com", "jimdosite.com", "wix.com", "t-online.de",
                   "gmx.de", "web.de", "business.site", "linkedin.com", "xing.com", "meinestadt.de",
                   "golocal.de", "werkenntdenbesten.de", "branchenbuch.de", "cylex.de", "yelp.de"}

STOP = r"\b(gmbh|co|kg|ug|haftungsbeschränkt|e\.?k\.?|ohg|gbr|inh(aber)?|und|&|elektro\w*|technik|meisterbetrieb|installation(en)?|gebäudetechnik|service|der|die|das)\b"


def norm_name(n):
    n = (n or "").lower()
    n = n.replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss")
    n = re.sub(r"[^a-z0-9 ]", " ", n)
    n = re.sub(STOP.replace("ä", "ae").replace("ü", "ue").replace("ö", "oe"), " ", n)
    return " ".join(n.split())
