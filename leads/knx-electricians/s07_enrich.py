"""Combine business + website data into final leads: KNX status, priority, contact advice, opener."""
import hashlib, json, re
from common import TODAY, db, is_mobile, norm_phone

BIG = re.compile(r"spie\b|cegelec|imtech|caverion|bilfinger|engie|equans|vinci|actemium|omexom|"
                 r"elektro-?bau ag|\bag\b$", re.I)
SPECIALIST_NAME = re.compile(r"knx|smart ?home|gebäudeautomation|gebaeudeautomation|automation|loxone|"
                             r"haussteuerung|smarthome", re.I)
ELECTRIC_WORDS = re.compile(r"elektro|elektrik|elektriker|elektroinstallation|elektroanlagen|elektrotechnik", re.I)


def pick(seed, options):
    return options[int(hashlib.md5(seed.encode()).hexdigest(), 16) % len(options)]


def services_list(kw):
    s = []
    if kw.get("neubau"): s.append("Neubau")
    if kw.get("renovation"): s.append("Sanierung/Altbau")
    if kw.get("pv"): s.append("Photovoltaik")
    if kw.get("wallbox"): s.append("Wallbox/E-Mobilität")
    if kw.get("heatpump"): s.append("Wärmepumpe")
    if kw.get("security"): s.append("Sicherheitstechnik")
    if kw.get("network"): s.append("Netzwerk/Daten")
    if kw.get("industry"): s.append("Industrie/Steuerungsbau")
    return s


def brands(kw):
    return [b for b, k in (("Gira", "gira"), ("Jung", "jung"), ("ABB/Busch-Jaeger", "abb"), ("Siemens", "siemens"),
                           ("Hager", "hager"), ("Schneider", "schneider"), ("Loxone", "loxone")) if kw.get(k)]


def opener(L, kw):
    town = L["town"] or "Ihrer Gegend"
    near = L["dist_gersthofen"] <= 25
    where = pick(L["id"] + "w", [f"Ich sitze in Gersthofen, also nicht weit weg von {town}.",
                                  f"Ich bin aus Gersthofen, {town} ist für mich gut erreichbar."]) if near else \
        f"Ich arbeite im Raum {L['region']} und bin regelmäßig in der Gegend um {town}."
    st, br = L["knx_status"], brands(kw)
    if st == "advertises KNX":
        a = pick(L["id"], [
            "Ich habe auf Ihrer Seite gesehen, dass Sie KNX machen. Ich programmiere KNX-Anlagen in der ETS als Subunternehmer für Elektrobetriebe, falls Sie mal mehr Projekte haben als Leute, könnte ich da einspringen.",
            "Sie bieten ja KNX an, deshalb rufe ich an. Ich mache die ETS-Programmierung als Subunternehmer für andere Elektriker und hätte gerade Kapazität frei, wenn bei Ihnen mal Not am Mann ist.",
        ])
        b = "Wäre das grundsätzlich interessant für Sie, wenn es mal eng wird?"
        return f"{a} {b}"
    if st == "smart home but not KNX":
        sys_ = "mit Loxone" if kw.get("loxone") else ("mit " + br[0]) if br else ""
        a = f"Ich habe gesehen, dass Sie Smart Home {sys_} anbieten.".replace("  ", " ")
        b = pick(L["id"], [
            "Ich programmiere KNX in der ETS als Subunternehmer: Sie verbauen die Komponenten, ich mache die Programmierung und die Inbetriebnahme mit Ihnen zusammen. So können Sie Ihren Kunden auch KNX anbieten, ohne erst jemanden schulen zu müssen.",
            "Wenn Kunden bei Ihnen nach KNX fragen, könnte ich die ETS-Programmierung übernehmen, die Installation bleibt komplett bei Ihnen. Dann müssen Sie dafür niemanden extra schulen.",
        ])
        return f"{a} {b}"
    if kw.get("pv") or kw.get("wallbox"):
        what = " und ".join(x for x, k in (("PV-Anlagen", "pv"), ("Wallboxen", "wallbox")) if kw.get(k))
        return (f"Sie machen ja auch {what}. Mit KNX lässt sich das gut ins Haus einbinden, also Überschussladen, "
                f"Verbraucher schalten und Verbrauch anzeigen. Ich mache dafür die ETS-Programmierung als Subunternehmer, "
                f"die Installation bleibt bei Ihnen. {where}")
    if kw.get("neubau"):
        return pick(L["id"], [
            f"Sie sind ja viel im Neubau unterwegs. Da fragen Bauherren inzwischen öfter nach KNX, und ich programmiere die Anlagen in der ETS als Subunternehmer, Sie installieren wie gewohnt. {where}",
            f"Ich habe gesehen, dass Sie Neubauten machen. Wenn da ein Bauherr KNX haben will, könnte ich die ETS-Programmierung übernehmen, Festpreis ab 1.990 Euro fürs Einfamilienhaus, die Installation bleibt bei Ihnen.",
        ])
    return pick(L["id"], [
        f"Ich programmiere KNX-Anlagen in der ETS und suche Elektrobetriebe hier in der Gegend, für die ich das als Subunternehmer übernehmen kann. Sie installieren, ich programmiere und nehme mit Ihnen in Betrieb. Fragen bei Ihnen Kunden ab und zu nach KNX?",
        f"{where} Ich mache KNX-Programmierung in der ETS für Elektriker, die das selbst nicht anbieten wollen oder keine Zeit dafür haben. Kommt bei Ihnen KNX ab und zu vor?",
    ])


def main():
    con = db()
    sites = {r["domain"]: json.loads(r["data"]) for r in con.execute("SELECT * FROM site")}
    leads, excluded = [], []
    for b in con.execute("SELECT * FROM business"):
        L = dict(b)
        phones = json.loads(L.pop("phones"))
        emails = json.loads(L.pop("emails"))
        srcs = json.loads(L.pop("sources"))
        cats = json.loads(L.pop("categories"))
        s = sites.get(L["domain"] or "", {})
        ok_site = s.get("status") == "ok"
        kw = s.get("keywords", {}) if ok_site else {}
        for p in s.get("phones", []) if ok_site else []:
            if p["kind"] != "fax" and norm_phone(p["v"]) not in [norm_phone(x["v"]) for x in phones]:
                phones.append({"v": p["v"], "src": p["src"]})
        site_mails = s.get("emails", []) if ok_site else []
        dom = L["domain"] or ""
        site_mails.sort(key=lambda e: (not e["v"].endswith("@" + dom), not e["v"].startswith(("info@", "kontakt@", "mail@", "office@", "post@"))))
        for e in site_mails:
            if e["v"] not in [x["v"] for x in emails]:
                emails.append(e)
        emails.sort(key=lambda e: not (dom and e["v"].endswith("@" + dom)))
        land = [p for p in phones if not is_mobile(p["v"])]
        mob = [p for p in phones if is_mobile(p["v"])]

        name = L["name"]
        text_ok = ELECTRIC_WORDS.search(name) or kw.get("meister") or any(re.search(r"elektr", c or "", re.I) for c in cats) \
            or (ok_site and re.search(r"elektr", (s.get("title") or "") + (s.get("meta_description") or ""), re.I))
        emp = s.get("employees") if ok_site else None
        reason = None
        if BIG.search(name):
            reason = "large contractor/chain"
        elif emp and emp >= 50:
            reason = f"approx. {emp} employees (>=50)"
        elif not text_ok:
            reason = "no evidence of electrical installation business"
        if reason:
            excluded.append({"id": L["id"], "name": name, "town": L["town"], "reason": reason})
            continue

        if not ok_site:
            knx = "unknown (no website)" if not L["domain"] else \
                "unknown (website not reachable)" if s else "unknown (website not checked yet)"
        elif kw.get("knx"):
            knx = "advertises KNX"
        elif kw.get("smart_home"):
            knx = "smart home but not KNX"
        else:
            knx = "no smart home mentioned"
        if SPECIALIST_NAME.search(name) and knx.startswith("unknown"):
            knx = "advertises KNX" if re.search(r"knx", name, re.I) else "smart home but not KNX"
        specialist = bool(SPECIALIST_NAME.search(name)) or kw.get("knx", 0) >= 15
        meister = "yes" if (kw.get("meister") or re.search(r"meister", name, re.I)) else ("unknown" if not ok_site else "not stated")

        L.update(knx_status=knx, knx_specialist=specialist, meister=meister, employees=emp,
                 owner=s.get("owner") if ok_site else None, legal_form=(s.get("legal_form") if ok_site else None),
                 services=services_list(kw), brands=brands(kw), knx_snippet=s.get("knx_snippet"),
                 phone_landline=land[0]["v"] if land else None, phone_mobile=mob[0]["v"] if mob else None,
                 phone_src=(land or mob or [{}])[0].get("src"), phones_all=[p["v"] for p in phones],
                 email=emails[0]["v"] if emails else None, email_src=emails[0]["src"] if emails else None,
                 emails_all=[e["v"] for e in emails], website=s.get("url") or L["website"],
                 contact_form=s.get("form_url") or s.get("contact_url"), impressum_url=s.get("impressum_url"),
                 website_status=s.get("status") if L["domain"] else "none",
                 google_rating=None, google_reviews=None, sources=srcs, categories=cats, updated=TODAY)
        if not L["legal_form"]:
            for lf, rx in (("GmbH & Co. KG", r"gmbh\s*&\s*co"), ("GmbH", r"gmbh"), ("UG (haftungsbeschränkt)", r"\bug\b"),
                           ("e.K.", r"e\.\s?k\."), ("GbR", r"gbr"), ("OHG", r"ohg"), ("Einzelunternehmen", r"\binh\.|inhaber")):
                if re.search(rx, name, re.I):
                    L["legal_form"] = lf
                    break
        if not L["owner"]:
            m = re.search(r"(?:inh\.?|inhaber(?:in)?)\s*:?\s*([A-ZÄÖÜ][\wäöüß.-]+(?:\s+[A-ZÄÖÜ][\wäöüß-]+)+)", name)
            if m:
                L["owner"] = m.group(1)
        if emp:
            L["size"] = f"~{emp} Mitarbeiter (Website)"
        elif L["legal_form"] in ("Einzelunternehmen", "e.K.", "GbR"):
            L["size"] = "klein (Einzelunternehmen, geschätzt)"
        else:
            L["size"] = "unbekannt"

        has_phone = bool(land or mob)
        L["data_quality"] = "complete" if has_phone and emails else "missing email" if has_phone else \
            "missing phone" if emails else "missing phone+email"

        # priority
        p = 3.0
        if meister == "yes": p += 0.5
        if kw.get("neubau"): p += 0.5
        if knx == "smart home but not KNX": p += 1
        elif knx == "advertises KNX": p -= 0.5
        if specialist: p -= 1.5
        if kw.get("pv") or kw.get("wallbox"): p += 0.25
        if L["dist_gersthofen"] <= 20 or (L["region"] == "München" and L["dist_center"] <= 15): p += 0.75
        elif L["dist_gersthofen"] > 70: p -= 0.5
        if emp and emp > 20: p -= 1
        if kw.get("industry", 0) >= 5 and not kw.get("neubau"): p -= 0.75
        if not has_phone: p -= 1
        if not ok_site: p -= 0.5
        L["priority"] = int(max(1, min(5, round(p))))

        # contact recommendation
        if has_phone:
            L["contact_method"] = "phone"
            L["contact_reason"] = ("Anruf: B2B-Kaltakquise per Telefon bei mutmaßlichem Interesse zulässig, E-Mail erst nach Gespräch (UWG §7)."
                                   if emails else "Anruf: keine E-Mail-Adresse gefunden, Telefon ist ohnehin der direkte Weg.")
            if mob and not land:
                L["best_time"] = "Mobil: 7:00–7:45 oder 16:30–18:00; sonst auf Mailbox sprechen und Rückruf anbieten"
            elif emp and emp > 8 or L["legal_form"] in ("GmbH", "GmbH & Co. KG"):
                L["best_time"] = "Büro 8:00–12:00 nach dem Chef fragen; Chef direkt am besten 7:00–8:00"
            else:
                L["best_time"] = "7:00–8:00 oder nach 16:30 (tagsüber meist auf der Baustelle)"
        elif emails or L["contact_form"]:
            L["contact_method"] = "email" if emails else "contact form"
            L["contact_reason"] = "Keine Telefonnummer gefunden. Kurze, sachliche Anfrage ohne Werbetext; rechtlich vorsichtig (UWG §7)."
            L["best_time"] = "–"
        else:
            L["contact_method"] = "none found"
            L["contact_reason"] = "Weder Telefon noch E-Mail gefunden."
            L["best_time"] = "–"
        L["opener"] = opener(L, kw)
        leads.append(L)

    con.execute("DROP TABLE IF EXISTS lead")
    con.execute("CREATE TABLE lead (id TEXT PRIMARY KEY, data TEXT)")
    con.executemany("INSERT INTO lead VALUES (?,?)", [(l["id"], json.dumps(l, ensure_ascii=False)) for l in leads])
    con.execute("DROP TABLE IF EXISTS excluded")
    con.execute("CREATE TABLE excluded (id TEXT PRIMARY KEY, data TEXT)")
    con.executemany("INSERT INTO excluded VALUES (?,?)", [(x["id"], json.dumps(x, ensure_ascii=False)) for x in excluded])
    con.commit()
    print("leads", len(leads), "excluded", len(excluded))
    return leads


if __name__ == "__main__":
    main()
