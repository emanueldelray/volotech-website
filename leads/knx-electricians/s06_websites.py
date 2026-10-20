"""Visit each business website: homepage, Impressum, Kontakt and a few service pages.
Extract owner, legal form, phones, emails, contact form, size hints and service keywords.
Respects robots.txt and waits >=1.5 s between requests to the same host."""
import html as H, json, re, sys, threading, urllib.parse
from concurrent.futures import ThreadPoolExecutor
from common import TODAY, db, get, is_mobile, norm_phone

MAX_PAGES = 7
KW = {
    "knx": r"\bknx\b|\beib\b|ets[- ]?(5|6|inside)\b",
    "smart_home": r"smart[- ]?home|smarthome|haussteuerung|hausautomation|gebäudeautomation|gebaeudeautomation|"
                  r"intelligente[sn]? (haus|gebäude|wohnen)|loxone|homematic|gira one|myjung|free@home|digitalstrom|"
                  r"wiser|ekey|smart building",
    "loxone": r"loxone", "gira": r"\bgira\b", "jung": r"\bjung\b", "abb": r"\babb\b|busch-jaeger|busch-jäger",
    "siemens": r"\bsiemens\b", "hager": r"\bhager\b", "schneider": r"schneider electric",
    "pv": r"photovoltaik|pv-anlage|pv anlage|solaranlage|solarstrom|stromspeicher|batteriespeicher",
    "wallbox": r"wallbox|ladestation|ladeinfrastruktur|e-mobilität|elektromobilität|e-mobility|ladesäule",
    "neubau": r"neubau|neubauten|einfamilienh|mehrfamilienh|wohnungsbau|bauträger|rohinstallation",
    "renovation": r"sanierung|altbau|renovierung|modernisierung|umbau",
    "heatpump": r"wärmepumpe|waermepumpe",
    "industry": r"industrie|schaltschrankbau|steuerungsbau|sps\b|anlagenbau|maschinenbau",
    "security": r"alarmanlage|einbruchmeldeanlage|videoüberwachung|brandmelde",
    "network": r"netzwerktechnik|edv-verkabelung|datentechnik|glasfaser",
    "meister": r"meisterbetrieb|elektromeister|elektrotechnikermeister|elektroinstallateurmeister|meister im elektro|"
               r"elektrotechniker-?meister|meisterin",
    "training": r"ausbildungsbetrieb|azubi|ausbildung zum elektroniker|wir bilden aus",
    "hiring": r"stellenangebot|wir suchen|karriere|jobs\b|verstärkung",
}
LINK_HINT = re.compile(r"impressum|kontakt|contact|leistung|service|smart|knx|gebäude|gebaeude|haus|photovolt|"
                       r"e-mobil|elektro|ueber|über|about|team|firma|unternehmen", re.I)
PHONE_RE = re.compile(r"(?:(?:tel(?:efon)?|fon|phone|mobil(?:funk)?|handy|mobile|büro)\.?\s*[:.]?\s*)"
                      r"((?:\+49|0049|0)[\d\s/()\-–.]{6,20}\d)", re.I)
EMAIL_RE = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")
LEGAL = [("GmbH & Co. KG", r"gmbh\s*&\s*co\.?\s*kg"), ("UG (haftungsbeschränkt)", r"\bug\b|haftungsbeschr"),
         ("GmbH", r"\bgmbh\b"), ("e.K.", r"\be\.\s?k(fm|fr)?\.?(?=\W)|eingetragener kaufmann"),
         ("OHG", r"\bohg\b"), ("GbR", r"\bgbr\b")]
TLDS = {"de", "com", "net", "org", "info", "eu", "biz", "bayern", "gmbh", "online", "email", "at", "ch", "io",
        "me", "team", "solutions", "tech", "haus", "energy", "berlin", "digital", "shop", "services", "co", "us"}
OWNER_RE = re.compile(
    r"(?i:inhaber(?:in)?|geschäftsführer(?:in)?|geschaeftsfuehrer(?:in)?|geschäftsführung|vertreten durch(?: den geschäftsführer| die geschäftsführer)?|"
    r"vertretungsberechtigte[r]? (?:geschäftsführer|gesellschafter)|inh\.)\s*[:\-]?\s*"
    r"((?:(?:Dipl\.-Ing\.|Dipl\.|Ing\.|Dr\.|Herr|Frau|Elektromeister|Meister|\(FH\)|B\.\s?Eng\.)\s+)*"
    r"[A-ZÄÖÜ][a-zäöüß]+(?:-[A-ZÄÖÜ][a-zäöüß]+)?(?:\s+[A-ZÄÖÜ]\.)?\s+[A-ZÄÖÜ][a-zäöüß]+(?:-[A-ZÄÖÜ][a-zäöüß]+)?"
    r"(?:\s*(?:,|und|&)\s*[A-ZÄÖÜ][a-zäöüß]+\s+[A-ZÄÖÜ][a-zäöüß]+)?)")
EMP_RE = re.compile(r"(\d{1,3})\s*(?:\+\s*)?(?:mitarbeiter(?:innen)?|mitarbeitende|beschäftigte|angestellte|"
                    r"fachkräfte|elektriker|monteure|kolleg(?:en|innen)|köpfe)", re.I)
TEAM_RE = re.compile(r"team (?:aus|von|mit) (\d{1,3})", re.I)
BAD_MAIL = re.compile(r"\.(png|jpg|jpeg|gif|webp|svg)$|example\.|sentry|wixpress|domain\.|@(?:2x|3x)|"
                      r"datenschutz@.*(?:ionos|strato)|\bnoreply|no-reply", re.I)
NOT_OWNER = re.compile(r"Haftung|Inhalt|Verantwortlich|Datenschutz|Gericht|Register|Steuer|Umsatz|Angaben|"
                       r"Kontakt|Telefon|Anschrift|Straße|Handwerkskammer|Berufsbezeichnung|Elektrotechnik|"
                       r"Elektro|GmbH|Bayern|München|Augsburg|Ulm|Ingolstadt", re.I)


def clean_text(html):
    html = re.sub(r"(?is)<(script|style|noscript|svg)[^>]*>.*?</\1>", " ", html)
    html = re.sub(r"(?i)<br\s*/?>|</(p|div|li|h\d|tr|td)>", "\n", html)
    t = H.unescape(re.sub(r"<[^>]+>", " ", html))
    t = t.replace("\xa0", " ")
    return re.sub(r"[ \t]+", " ", t)


def deobfuscate(t):
    t = re.sub(r"\s*[\(\[\{]\s*(?:at|ät|@)\s*[\)\]\}]\s*", "@", t, flags=re.I)
    t = re.sub(r"\s*[\(\[\{]\s*(?:dot|punkt)\s*[\)\]\}]\s*", ".", t, flags=re.I)
    return t


def fetch(url):
    try:
        r = get(url, delay=1.5, timeout=15, tries=2)
    except PermissionError:
        return None, "robots"
    except Exception as e:
        return None, f"error:{type(e).__name__}"
    if r.status_code != 200 or "html" not in r.headers.get("content-type", "html"):
        return None, f"http{r.status_code}"
    r.encoding = r.apparent_encoding if not r.encoding or r.encoding.lower() == "iso-8859-1" else r.encoding
    return r, "ok"


def crawl(website):
    if not re.match(r"https?://", website):
        website = "http://" + website
    home, status = fetch(website)
    if not home and website.startswith("http://"):
        home, status = fetch("https://" + website[7:])
    if not home:
        return {"status": status, "url": website}
    base = home.url
    host = urllib.parse.urlsplit(base).netloc
    pages = {base: home.text}
    links = []
    for href, label in re.findall(r'<a[^>]+href="([^"#]+)"[^>]*>(.*?)</a>', home.text, re.S | re.I):
        u = urllib.parse.urljoin(base, H.unescape(href))
        if urllib.parse.urlsplit(u).netloc != host or re.search(r"\.(pdf|jpg|png|zip|docx?)$", u, re.I):
            continue
        lab = clean_text(label)
        if LINK_HINT.search(u) or LINK_HINT.search(lab):
            pr = 0 if re.search(r"impressum", u + lab, re.I) else 1 if re.search(r"kontakt|contact", u + lab, re.I) else \
                2 if re.search(r"knx|smart|gebäude|leistung", u + lab, re.I) else 3
            links.append((pr, u))
    # frames / simple sites without nav links
    if not any(p == 0 for p, _ in links):
        links.append((0, urllib.parse.urljoin(base, "/impressum")))
    seen = {base}
    impressum_url = contact_url = form_url = None
    for _, u in sorted(set(links)):
        if len(pages) >= MAX_PAGES:
            break
        if u in seen:
            continue
        seen.add(u)
        r, st = fetch(u)
        if not r:
            continue
        pages[r.url] = r.text
        if re.search(r"impressum", u, re.I) and not impressum_url:
            impressum_url = r.url
        if re.search(r"kontakt|contact", u, re.I) and not contact_url:
            contact_url = r.url
    for u, h in pages.items():
        if re.search(r"<form", h, re.I) and re.search(r'type="email"|name="[^"]*mail|nachricht|message', h, re.I) \
                and not re.search(r"search|suche", u, re.I):
            form_url = form_url or u
    texts = {u: deobfuscate(clean_text(h)) for u, h in pages.items()}
    alltext = "\n".join(texts.values())
    imp = texts.get(impressum_url, "") if impressum_url else ""
    if not imp:  # impressum often on homepage of one-pagers
        imp = next((t for t in texts.values() if re.search(r"impressum", t, re.I) and re.search(r"§\s*5|tmg|ddg|angaben gem", t, re.I)), "")

    emails = []
    for u, h in pages.items():
        for e in re.findall(r'mailto:([^"?\'>\s]+)', h, re.I) + EMAIL_RE.findall(texts[u]):
            e = urllib.parse.unquote(H.unescape(e)).strip(" .;,").lower()
            if EMAIL_RE.fullmatch(e) and not BAD_MAIL.search(e) and e.rsplit(".", 1)[-1] in TLDS and e not in [x["v"] for x in emails]:
                emails.append({"v": e, "src": u})
    phones = []
    for u, t in texts.items():
        for m in PHONE_RE.finditer(t):
            p = re.sub(r"\s+", " ", m.group(1)).strip(" -–/.")
            label = m.group(0)[:12].lower()
            kind = "mobile" if re.search(r"mobil|handy", label) or is_mobile(p) else \
                "fax" if "fax" in label else "landline"
            digits = norm_phone(p) or ""
            if 7 <= len(digits) <= 15 and digits not in [norm_phone(x["v"]) for x in phones]:
                phones.append({"v": p, "kind": kind, "src": u})
    for u, h in pages.items():
        for p in re.findall(r'href="tel:([^"]+)"', h, re.I):
            p = urllib.parse.unquote(p).strip()
            digits = norm_phone(p) or ""
            if 7 <= len(digits) <= 15 and digits not in [norm_phone(x["v"]) for x in phones]:
                phones.append({"v": p, "kind": "mobile" if is_mobile(p) else "landline", "src": u})

    owner = None
    for src in (imp, alltext):
        for m in OWNER_RE.finditer(src):
            cand = " ".join(m.group(1).split())
            if not NOT_OWNER.search(cand):
                owner = cand
                break
        if owner:
            break
    legal = None
    head = (imp or alltext)[:6000].lower()
    for lf, rx in LEGAL:
        if re.search(rx, head):
            legal = lf
            break
    if not legal and re.search(r"inhaber|einzelunternehm|inh\.", head):
        legal = "Einzelunternehmen"

    low = alltext.lower()
    kw = {k: len(re.findall(rx, low)) for k, rx in KW.items()}
    emp = [int(x) for x in EMP_RE.findall(alltext) + TEAM_RE.findall(alltext) if 1 <= int(x) <= 500]
    knx_snip = None
    m = re.search(r"[^.\n]{0,120}\bknx\b[^.\n]{0,120}", alltext, re.I)
    if m:
        knx_snip = " ".join(m.group(0).split())
    title = re.search(r"<title[^>]*>(.*?)</title>", home.text, re.S | re.I)
    desc = re.search(r'<meta[^>]+name="description"[^>]+content="([^"]*)"', home.text, re.I)
    return {"status": "ok", "url": base, "pages": list(pages), "impressum_url": impressum_url,
            "contact_url": contact_url, "form_url": form_url, "emails": emails[:6], "phones": phones[:6],
            "owner": owner, "legal_form": legal, "keywords": kw, "employees": max(emp) if emp else None,
            "knx_snippet": knx_snip, "title": " ".join(H.unescape(title.group(1)).split())[:200] if title else None,
            "meta_description": H.unescape(desc.group(1))[:300] if desc else None, "fetched": TODAY}


def worker(domain, website, lock):
    try:
        data = crawl(website)
    except Exception as e:
        data = {"status": f"error:{type(e).__name__}", "url": website}
    with lock:
        con = db()
        con.execute("INSERT OR REPLACE INTO site VALUES (?,?,?,?)", (domain, data["status"], TODAY, json.dumps(data, ensure_ascii=False)))
        con.commit()
        con.close()
    print(domain, data["status"], flush=True)


def main():
    con = db()
    todo = con.execute("""SELECT domain, MIN(website) FROM business WHERE domain IS NOT NULL
                          AND domain NOT IN (SELECT domain FROM site) GROUP BY domain""").fetchall()
    print(len(todo), "domains to crawl", flush=True)
    lock = threading.Lock()
    with ThreadPoolExecutor(12) as ex:
        for d, w in todo:
            ex.submit(worker, d, w, lock)


if __name__ == "__main__":
    main()
