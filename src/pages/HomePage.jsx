// src/pages/HomePage.jsx
import React from "react";
import { Link } from "react-router-dom";
import { SectionHeader, Card, Pill, CTAButton, ResponseHint } from "../components/Shared";
import heroImage from "../assets/hero/hero.png";

/* ===== Load service images ===== */
const serviceImages = (() => {
  const modules = import.meta.glob("../assets/services/*.{jpg,jpeg,png,webp}", {
    eager: true,
    as: "url",
  });
  const map = {};
  for (const [path, url] of Object.entries(modules)) {
    const file = path.split("/").pop() || "";
    const base = file.replace(/\.[^/.]+$/, "");
    map[base] = url;
  }
  return map;
})();

export default function HomePage({ lang = "de" }) {
  const isDe = lang === "de";

  return (
    <>
      {/* ================= HERO ================= */}
      <section style={{ position: "relative", minHeight: "75vh", padding: 0 }}>
        <div
          style={{
            position: "absolute", inset: 0,
            backgroundImage: `url(${heroImage})`,
            backgroundSize: "cover", backgroundPosition: "center",
          }}
        />
        <div
          style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(100deg, rgba(11,42,92,0.82) 0%, rgba(11,42,92,0.55) 50%, rgba(0,0,0,0.3) 100%)",
          }}
        />

        <div
          style={{
            position: "relative", minHeight: "75vh",
            maxWidth: "72rem", margin: "0 auto", padding: "5rem 1.25rem",
            display: "flex", flexDirection: "column", justifyContent: "center",
          }}
        >
          <div style={{ maxWidth: "42rem", color: "#fff" }}>
            <div style={{ fontSize: "0.85rem", opacity: 0.8, marginBottom: "0.75rem", letterSpacing: "0.03em" }}>
              {isDe
                ? "Für Maschinenbau, Automatisierung & Industrie-OEMs"
                : "For machine builders, automation & industrial OEMs"}
            </div>

            <h1 style={{ fontSize: "clamp(2rem, 3vw, 2.8rem)", fontWeight: 700, lineHeight: 1.15 }}>
              {isDe
                ? "CNC-Fertigung & Baugruppen über unser EU-Netzwerk — mit einem Ingenieur als Ansprechpartner"
                : "CNC manufacturing & assemblies via our EU network — with an engineer as your point of contact"}
            </h1>

            <p style={{ marginTop: "1.1rem", fontSize: "1.05rem", color: "rgba(255,255,255,0.88)", lineHeight: 1.6 }}>
              {isDe
                ? "Volotech verbindet deutsches Engineering-Know-how mit einem Netzwerk ausgewählter, ISO 9001 zertifizierter Fertigungspartner in der EU. Sie sprechen direkt mit einem Ingenieur — wir klären Machbarkeit früh, koordinieren die Fertigung und liefern einbaufertig."
                : "Volotech combines German engineering expertise with a network of selected, ISO 9001 certified manufacturing partners across the EU. You work directly with an engineer — we clarify feasibility early, coordinate production, and deliver ready-to-install."}
            </p>

            <div style={{ marginTop: "2rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <Link to="/manufacturing?rfq=1" className="btn-primary" style={{ fontSize: "1rem", padding: "0.85rem 1.3rem" }}>
                {isDe ? "Anfrage stellen" : "Request a quote"}
              </Link>
              <Link to="/about" className="btn-ghost" style={{ color: "#fff", borderColor: "rgba(255,255,255,0.5)", background: "transparent" }}>
                {isDe ? "Mehr erfahren" : "Learn more"}
              </Link>
            </div>

            <div
              style={{
                marginTop: "2rem",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "0.75rem", maxWidth: "660px",
              }}
            >
              {[
                [isDe ? "QUALITÄT" : "QUALITY", isDe ? "ISO 9001 zertifizierte Partner" : "ISO 9001 certified partners"],
                [isDe ? "NETZWERK" : "NETWORK", isDe ? "Ausgewählte EU-Fertigungspartner" : "Selected EU manufacturing partners"],
                [isDe ? "REAKTIONSZEIT" : "RESPONSE", isDe ? "Angebote in 24–48 h" : "Quotes within 24–48 h"],
              ].map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "var(--radius)", padding: "0.85rem 1rem",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  <div style={{ fontSize: "0.7rem", opacity: 0.7, letterSpacing: "0.08em" }}>{k}</div>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem", marginTop: "0.15rem" }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= WHAT WE DO ================= */}
      <section id="services" className="reveal" style={{ background: "var(--bg)" }}>
        <div className="section-wrap">
          <SectionHeader
            title={isDe ? "Was wir anbieten" : "What we offer"}
            subtitle={isDe
              ? "Drei Kernbereiche — von der Einzelteilfertigung bis zur einbaufertigen Baugruppe."
              : "Three core areas — from single-part manufacturing to ready-to-install assemblies."}
          />

          <div className="services-grid reveal">
            <Link to="/manufacturing" className="service-card" aria-label="Manufacturing">
              {serviceImages.turning ? (
                <img className="service-image" src={serviceImages.turning} alt={isDe ? "CNC-Bearbeitung" : "CNC machining"} />
              ) : (
                <div className="service-placeholder">{isDe ? "Bild: turning.jpg" : "Image: turning.jpg"}</div>
              )}
              <div className="service-overlay">
                <h3>{isDe ? "CNC-Fertigung" : "CNC Manufacturing"}</h3>
                <p>{isDe ? "Drehen · Fräsen · Blech · Laser · Schweißen" : "Turning · Milling · Sheet · Laser · Welding"}</p>
              </div>
            </Link>

            <Link to="/assembly" className="service-card" aria-label="Assembly">
              {serviceImages.assembly ? (
                <img className="service-image" src={serviceImages.assembly} alt={isDe ? "Baugruppen" : "Assemblies"} />
              ) : (
                <div className="service-placeholder">{isDe ? "Bild: assembly.jpg" : "Image: assembly.jpg"}</div>
              )}
              <div className="service-overlay">
                <h3>{isDe ? "Montage & Baugruppen" : "Assembly & Sub-assemblies"}</h3>
                <p>{isDe ? "Vormontage · Endmontage · Prüfung" : "Pre-assembly · Final assembly · Inspection"}</p>
              </div>
            </Link>

            <Link to="/ce" className="service-card" aria-label="CE">
              {serviceImages.ce ? (
                <img className="service-image" src={serviceImages.ce} alt={isDe ? "CE-Konformität" : "CE compliance"} />
              ) : (
                <div className="service-placeholder">{isDe ? "Bild: ce.jpg" : "Image: ce.jpg"}</div>
              )}
              <div className="service-overlay">
                <h3>{isDe ? "CE-Konformität" : "CE Compliance"}</h3>
                <p>{isDe ? "Risikobeurteilung · Dokumentation" : "Risk assessment · Documentation"}</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="reveal" style={{ background: "#fff" }}>
        <div className="section-wrap">
          <SectionHeader
            title={isDe ? "So funktioniert die Zusammenarbeit" : "How it works"}
            subtitle={isDe
              ? "Vom ersten Kontakt bis zur Lieferung — in vier klaren Schritten."
              : "From first contact to delivery — in four clear steps."}
          />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "1rem" }} className="grid-3">
            {[
              {
                n: "1",
                t: isDe ? "Anfrage senden" : "Send request",
                d: isDe
                  ? "Zeichnung (STEP/PDF) + Material + Menge per E-Mail. Kein Registrierungsprozess."
                  : "Drawing (STEP/PDF) + material + quantity via email. No registration needed.",
              },
              {
                n: "2",
                t: isDe ? "Technische Klärung" : "Technical review",
                d: isDe
                  ? "Ein Ingenieur prüft Machbarkeit, klärt Toleranzen und kritische Punkte — bevor sie teuer werden."
                  : "An engineer reviews feasibility, clarifies tolerances and critical points — before they become costly.",
              },
              {
                n: "3",
                t: isDe ? "Angebot & Freigabe" : "Quote & approval",
                d: isDe
                  ? "Transparentes Angebot mit Lieferzeit und klarem Leistungsumfang. Keine versteckten Kosten."
                  : "Transparent quote with lead time and clear scope. No hidden costs.",
              },
              {
                n: "4",
                t: isDe ? "Fertigung & Lieferung" : "Production & delivery",
                d: isDe
                  ? "Fertigung über unser EU-Partnernetzwerk mit QC und Dokumentation. Lieferung direkt zu Ihnen."
                  : "Production via our EU partner network with QC and documentation. Delivery direct to you.",
              },
            ].map((s) => (
              <div key={s.n} className="v-card" style={{ position: "relative" }}>
                <div
                  style={{
                    width: 30, height: 30, borderRadius: 999,
                    background: "var(--brand)", color: "#fff",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.75rem",
                  }}
                >
                  {s.n}
                </div>
                <div style={{ fontWeight: 700, color: "var(--ink)", marginBottom: "0.35rem" }}>{s.t}</div>
                <p style={{ color: "var(--muted)", lineHeight: 1.55, fontSize: "0.93rem" }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FIT CHECK ================= */}
      <section className="reveal" style={{ background: "var(--bg)", borderTop: "1px solid var(--line)" }}>
        <div className="section-wrap">
          <SectionHeader
            title={isDe ? "Passt Volotech zu Ihrem Projekt?" : "Is Volotech right for your project?"}
            subtitle={isDe
              ? "Ein schneller Check: typische Projekte und wie wir Risiken früh abfangen."
              : "A quick check: typical projects and how we de-risk early."}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1.25rem", alignItems: "stretch" }} className="grid-2">
            <div className="v-card">
              <div className="v-kicker">{isDe ? "Typische Projekte" : "Typical projects"}</div>
              <ul style={{ marginTop: "0.75rem", color: "var(--ink)", lineHeight: 1.75, paddingLeft: "1.1rem" }}>
                <li>{isDe ? "Maschinenelemente & Halterungen (Prototyp bis Kleinserie)" : "Machine components & brackets (prototype to small series)"}</li>
                <li>{isDe ? "Automatisierungsteile: Adapter, Träger, Vorrichtungen" : "Automation parts: adapters, fixtures, mounts"}</li>
                <li>{isDe ? "Blech-/Laserteile & geschweißte Baugruppen" : "Sheet/laser parts & welded assemblies"}</li>
                <li>{isDe ? "Baugruppen-Montage inkl. Prüfung & Dokumentation" : "Assembly incl. inspection & documentation"}</li>
              </ul>
              <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <Pill>STEP / PDF / DXF</Pill>
                <Pill>{isDe ? "Stahl · Alu · Edelstahl" : "Steel · Al · Stainless"}</Pill>
                <Pill>{isDe ? "Kunststoffe" : "Plastics"}</Pill>
              </div>
            </div>

            <div className="v-card-accent">
              <div className="v-kicker">{isDe ? "Ihr Vorteil" : "Your advantage"}</div>
              <div style={{ marginTop: "0.9rem", display: "grid", gap: "0.85rem" }}>
                <RiskItem
                  title={isDe ? "Früher Machbarkeits-Check" : "Early feasibility check"}
                  text={isDe
                    ? "Kritische Punkte werden erkannt, bevor sie in der Fertigung Zeit und Geld kosten."
                    : "Critical issues are caught before they cost time and money in production."}
                />
                <RiskItem
                  title={isDe ? "Engineering als Schnittstelle" : "Engineering as your interface"}
                  text={isDe
                    ? "Sie sprechen mit einem Ingenieur mit Erfahrung in Automatisierung und Maschinenbau — nicht mit reinem Vertrieb."
                    : "You talk to an engineer experienced in automation and machine building — not a pure sales interface."}
                />
                <RiskItem
                  title={isDe ? "Wettbewerbsfähige Konditionen" : "Competitive pricing"}
                  text={isDe
                    ? "Durch unser EU-Partnernetzwerk bieten wir attraktive Preise bei gleichbleibend hoher Qualität."
                    : "Our EU partner network delivers attractive pricing without compromising quality."}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= WHY VOLOTECH ================= */}
      <section className="reveal" style={{ background: "#fff", borderTop: "1px solid var(--line)" }}>
        <div className="section-wrap">
          <SectionHeader
            title={isDe ? "Warum Volotech" : "Why Volotech"}
            subtitle={isDe
              ? "Engineering-geführt, schlank organisiert, mit einem Netzwerk das liefert."
              : "Engineering-led, lean operation, backed by a network that delivers."}
          />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "1.25rem" }} className="grid-3 reveal">
            <div className="why-card">
              <div className="v-kicker">{isDe ? "Engineering-Hintergrund" : "Engineering background"}</div>
              <p style={{ marginTop: "0.6rem", color: "var(--muted)", lineHeight: 1.6, fontSize: "0.95rem" }}>
                {isDe
                  ? "Hinter Volotech steht ein Maschinenbauingenieur mit über 10 Jahren Erfahrung in Automatisierung, Intralogistik und der mechanischen Standardisierung bei einem deutschen Automobilhersteller."
                  : "Behind Volotech is a mechanical engineer with over 10 years of experience in automation, intralogistics, and mechanical standardization at a German automotive OEM."}
              </p>
            </div>
            <div className="why-card">
              <div className="v-kicker">{isDe ? "EU-Fertigungsnetzwerk" : "EU manufacturing network"}</div>
              <p style={{ marginTop: "0.6rem", color: "var(--muted)", lineHeight: 1.6, fontSize: "0.95rem" }}>
                {isDe
                  ? "Die Fertigung wird über ausgewählte, ISO 9001 zertifizierte Partner in der EU koordiniert — passend zu Material, Bauraum und Terminsituation."
                  : "Production is coordinated via selected, ISO 9001 certified partners across the EU — matched to material, envelope, and schedule requirements."}
              </p>
            </div>
            <div className="why-card">
              <div className="v-kicker">{isDe ? "Klarheit & Verlässlichkeit" : "Clarity & reliability"}</div>
              <p style={{ marginTop: "0.6rem", color: "var(--muted)", lineHeight: 1.6, fontSize: "0.95rem" }}>
                {isDe
                  ? "Klare Angebote, realistische Lieferzeiten, deutsche Rechnungsstellung. Wenn etwas kritisch aussieht, erfahren Sie es früh — nicht nach Lieferung."
                  : "Clear quotes, realistic lead times, German invoicing. If something looks risky, you hear about it early — not after delivery."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="reveal" style={{ background: "var(--bg)", borderTop: "1px solid var(--line)" }}>
        <div className="section-wrap">
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "2rem", alignItems: "center" }} className="grid-2">
            <div>
              <h2>{isDe ? "Haben Sie eine Zeichnung zu besprechen?" : "Have a drawing to discuss?"}</h2>
              <p style={{ color: "var(--muted)", marginTop: "0.5rem" }}>
                {isDe
                  ? "Senden Sie Ihre Anfrage per E-Mail — Angebote meist innerhalb von 24–48 Stunden."
                  : "Send your request via email — quotes typically within 24–48 hours."}
              </p>
              <div style={{ marginTop: "1.25rem", display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                <CTAButton to="/manufacturing?rfq=1">
                  {isDe ? "Zum Anfrageformular" : "Go to request form"}
                </CTAButton>
                <ResponseHint isDe={isDe} />
              </div>
            </div>

            <div className="v-card">
              <div style={{ fontWeight: 700, marginBottom: "0.5rem" }}>
                {isDe ? "Typische Anfrageinhalte" : "Typical request contents"}
              </div>
              <ul style={{ color: "var(--muted)", paddingLeft: "1.1rem", lineHeight: 1.7 }}>
                <li>{isDe ? "Zeichnungen (STEP, PDF, DXF)" : "Drawings (STEP, PDF, DXF)"}</li>
                <li>{isDe ? "Material & Menge" : "Material & quantity"}</li>
                <li>{isDe ? "Gewünschter Liefertermin" : "Target delivery date"}</li>
                <li>{isDe ? "Besondere Anforderungen (Toleranzen, Oberfläche)" : "Special requirements (tolerances, finish)"}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/* ===== Local helper ===== */
function RiskItem({ title, text }) {
  return (
    <div style={{ padding: "0.75rem 0.85rem", borderRadius: "10px", background: "#fff", border: "1px solid rgba(11,42,92,0.08)" }}>
      <div style={{ fontWeight: 650, fontSize: "0.93rem", color: "var(--ink)", marginBottom: "0.25rem" }}>{title}</div>
      <div style={{ fontSize: "0.9rem", lineHeight: 1.5, color: "var(--muted)" }}>{text}</div>
    </div>
  );
}
