// src/pages/ManufacturingPage.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { SectionHeader, BulletCard, CTAButton, ResponseHint, Step, Pill } from "../components/Shared";

const serviceImages = (() => {
  const modules = import.meta.glob("../assets/services/*.{jpg,jpeg,png,webp}", { eager: true, as: "url" });
  const map = {};
  for (const [path, url] of Object.entries(modules)) {
    const file = path.split("/").pop() || "";
    map[file.replace(/\.[^/.]+$/, "")] = url;
  }
  return map;
})();

export default function ManufacturingPage({ lang = "de" }) {
  const isDe = lang === "de";
  const loc = useLocation();

  React.useEffect(() => {
    const params = new URLSearchParams(loc.search);
    if (params.get("rfq") === "1") {
      const el = document.getElementById("rfq");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loc.search]);

  const EMAIL_TO = "emanuel.chitic@volotech.de";
  const mailtoHref = React.useMemo(() => {
    const subject = isDe ? "RFQ / Anfrage – Volotech" : "RFQ / Request – Volotech";
    const body = isDe
      ? ["Hallo Volotech,", "", "ich möchte ein Angebot anfragen:", "- Teile/Projekt:", "- Material:", "- Menge:", "- Toleranzen:", "- Oberfläche:", "- Zieltermin:", "- Lieferadresse:", "", "Dateien: (bitte anhängen oder WeTransfer-Link einfügen)", "", "Viele Grüße"].join("\n")
      : ["Hello Volotech,", "", "I'd like to request a quote:", "- Parts/project:", "- Material:", "- Quantity:", "- Tolerances:", "- Finish:", "- Target date:", "- Delivery address:", "", "Files: (please attach or include link)", "", "Best regards"].join("\n");
    return `mailto:${encodeURIComponent(EMAIL_TO)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [isDe]);

  return (
    <>
      {/* ===== Intro ===== */}
      <section style={{ background: "#fff" }}>
        <div className="section-wrap" style={{ paddingTop: "3rem", paddingBottom: "2rem" }}>
          <div style={{ maxWidth: "62rem" }}>
            <div style={{ color: "var(--subtle)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
              {isDe ? "Leistungen" : "Services"} · {isDe ? "Fertigung" : "Manufacturing"}
            </div>
            <h1>
              {isDe
                ? "CNC-Bearbeitung, Blechbearbeitung & Schweißen — über unser EU-Partnernetzwerk"
                : "CNC machining, sheet metal & welding — via our EU partner network"}
            </h1>
            <p style={{ marginTop: "0.75rem", color: "var(--muted)", lineHeight: 1.65, fontSize: "1.02rem" }}>
              {isDe
                ? "Volotech koordiniert die Fertigung bearbeiteter und gefertigter Teile aus Aluminium, Stählen, Edelstahl, Messing und technischen Kunststoffen. Schwerpunkt: Komponenten für Automatisierung, Maschinenbau, Vorrichtungen und Industriehardware. Einzelteile und Prototypen genauso wie wiederkehrende Serienteile."
                : "Volotech coordinates the manufacturing of machined and fabricated parts in aluminium, steels, stainless, brass, and technical plastics. Focus: components for automation, machine building, fixtures, and industrial hardware. One-offs and prototypes as well as recurring series parts."}
            </p>

            {/* Tiles */}
            <div className="mfg-tiles">
              <MfgTile
                img={serviceImages.turning}
                title={isDe ? "CNC-Bearbeitung" : "CNC machining"}
                desc={isDe
                  ? "3- und 5-Achs-Fräsen + CNC-Drehen. Stahl, Edelstahl, Aluminium, Messing, Kunststoffe. Typische Toleranz ±0,02 mm."
                  : "3- and 5-axis milling + CNC turning. Steel, stainless, aluminium, brass, plastics. Typical tolerance ±0.02 mm."}
              />
              <MfgTile
                img={serviceImages.sheet}
                title={isDe ? "Blechbearbeitung" : "Sheet metal"}
                desc={isDe
                  ? "Laserschneiden, Stanzen, Biegen. Stahl, Edelstahl, Aluminium. Halter, Abdeckungen, Gehäuse, Montageplatten."
                  : "Laser cutting, punching, bending. Steel, stainless, aluminium. Brackets, covers, housings, mounting plates."}
              />
              <MfgTile
                img={serviceImages.welding}
                title={isDe ? "Schweißen & Strukturen" : "Welding & structures"}
                desc={isDe
                  ? "WIG/MAG-Schweißen. Halter, Rahmen, Vorrichtungen. Nachbearbeitung (Planflächen, Bohrungen) auf Anfrage."
                  : "TIG/MIG welding. Brackets, frames, fixtures. Post-weld machining (faces, holes) on request."}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===== Capabilities ===== */}
      <section style={{ background: "var(--bg)", borderTop: "1px solid var(--line)" }}>
        <div className="section-wrap">
          <SectionHeader
            title={isDe ? "Praktische Fähigkeiten" : "Practical capabilities"}
            subtitle={isDe
              ? "Richtwerte für die Machbarkeitsbewertung — Sonderfälle gerne auf Anfrage."
              : "Reference values for feasibility assessment — special cases on request."}
          />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "1rem" }} className="grid-3">
            <TechCard kicker={isDe ? "CNC-Fräsen" : "CNC milling"} title={isDe ? "3- bis 5-Achs, bis ca. 800 × 500 × 400 mm" : "3- to 5-axis, up to approx. 800 × 500 × 400 mm"} />
            <TechCard kicker={isDe ? "CNC-Drehen" : "CNC turning"} title={isDe ? "Bis Ø 300 mm, Länge bis 500 mm" : "Up to Ø 300 mm, length up to 500 mm"} />
            <TechCard kicker={isDe ? "Toleranzen" : "Tolerances"} title={isDe ? "Typisch ±0,02 mm (bis 0,01 mm nach Rücksprache)" : "Typical ±0.02 mm (down to 0.01 mm on request)"} />
            <TechCard kicker={isDe ? "Blechdicke" : "Sheet thickness"} title={isDe ? "1–10 mm Stahl/Edelstahl, 1–8 mm Aluminium" : "1–10 mm steel/stainless, 1–8 mm aluminium"} />
            <TechCard kicker={isDe ? "Schweißen" : "Welding"} title={isDe ? "WIG/MAG — Stahl, Edelstahl, Aluminium" : "TIG/MIG — steel, stainless, aluminium"} />
            <TechCard kicker={isDe ? "Oberflächen" : "Finishes"} title={isDe ? "Eloxal, Verzinken, Pulver, Strahlen (über Partner)" : "Anodizing, zinc, powder coat, blasting (via partners)"} />
          </div>
        </div>
      </section>

      {/* ===== Process ===== */}
      <section style={{ background: "#fff", borderTop: "1px solid var(--line)" }}>
        <div className="section-wrap">
          <SectionHeader
            title={isDe ? "Ablauf" : "Process"}
            subtitle={isDe
              ? "Von der Anfrage bis zur Lieferung — strukturiert und nachvollziehbar."
              : "From request to delivery — structured and transparent."}
          />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "1rem" }} className="grid-3">
            <StepCard n="1" title={isDe ? "Anfrage" : "Request"}
              text={isDe ? "Zeichnung (STEP/PDF) + Material + Menge per E-Mail senden." : "Send drawing (STEP/PDF) + material + quantity via email."} />
            <StepCard n="2" title={isDe ? "Technische Klärung" : "Technical review"}
              text={isDe ? "Machbarkeit, Toleranzen und kritische Punkte werden vorab geprüft." : "Feasibility, tolerances, and critical points reviewed upfront."} />
            <StepCard n="3" title={isDe ? "Angebot" : "Quote"}
              text={isDe ? "Transparentes Angebot mit Lieferzeit und Leistungsumfang." : "Transparent quote with lead time and scope."} />
            <StepCard n="4" title={isDe ? "Fertigung & Lieferung" : "Production & delivery"}
              text={isDe ? "Fertigung, QC-Dokumentation, Lieferung direkt zu Ihnen." : "Production, QC documentation, delivery direct to you."} />
          </div>
        </div>
      </section>

      {/* ===== RFQ ===== */}
      <section id="rfq" style={{ background: "var(--bg)", borderTop: "1px solid var(--line)" }}>
        <div className="section-wrap">
          <SectionHeader
            title={isDe ? "Anfrage stellen" : "Request a quote"}
            subtitle={isDe
              ? "Senden Sie Ihre Anfrage per E-Mail — wir melden uns strukturiert zurück."
              : "Send your request via email — we'll respond with structured next steps."}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }} className="grid-2">
            <div className="v-card">
              <div style={{ fontWeight: 700, marginBottom: "0.75rem" }}>
                {isDe ? "Per E-Mail anfragen" : "Request via email"}
              </div>
              <p style={{ color: "var(--muted)", lineHeight: 1.6, marginBottom: "1rem" }}>
                {isDe
                  ? "Klicken Sie auf den Button — Ihr E-Mail-Programm öffnet sich mit einer vorausgefüllten Vorlage. Zeichnungen als Anhang beifügen."
                  : "Click the button — your email client opens with a pre-filled template. Attach drawings to the email."}
              </p>
              <a href={mailtoHref} className="btn-primary" style={{ textDecoration: "none" }}>
                {isDe ? "E-Mail senden" : "Send email"}
              </a>
            </div>

            <div className="v-card">
              <div className="v-kicker" style={{ marginBottom: "0.75rem" }}>
                {isDe ? "Was wir brauchen" : "What we need"}
              </div>
              <ul style={{ color: "var(--muted)", lineHeight: 1.75, paddingLeft: "1.1rem", margin: 0 }}>
                <li>{isDe ? "Zeichnung / 3D-Modell (STEP, PDF, DXF)" : "Drawing / 3D model (STEP, PDF, DXF)"}</li>
                <li>{isDe ? "Material & Werkstoff" : "Material specification"}</li>
                <li>{isDe ? "Menge (Stückzahl)" : "Quantity"}</li>
                <li>{isDe ? "Toleranzen & Oberfläche (falls relevant)" : "Tolerances & finish (if relevant)"}</li>
                <li>{isDe ? "Gewünschter Liefertermin" : "Target delivery date"}</li>
                <li>{isDe ? "Lieferadresse" : "Delivery address"}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/* ===== Local components ===== */
function MfgTile({ img, title, desc }) {
  return (
    <div className="mfg-tile" tabIndex={0} aria-label={title}>
      {img ? (
        <img src={img} alt={title} loading="lazy" />
      ) : (
        <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #f0f2f5, #e8eaed)", color: "var(--subtle)", fontWeight: 600 }}>
          {title}
        </div>
      )}
      <div className="mfg-tile-desc">{desc}</div>
      <div className="mfg-tile-title">{title}</div>
    </div>
  );
}

function TechCard({ kicker, title }) {
  return (
    <div className="v-card" style={{ minHeight: 100 }}>
      <div className="v-kicker">{kicker}</div>
      <div style={{ marginTop: "0.35rem", fontWeight: 500, fontSize: "0.95rem", color: "var(--ink)", lineHeight: 1.45 }}>{title}</div>
    </div>
  );
}

function StepCard({ n, title, text }) {
  return (
    <div className="v-card">
      <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", marginBottom: "0.5rem" }}>
        <span style={{ width: 28, height: 28, borderRadius: 999, background: "var(--brand)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.85rem" }}>
          {n}
        </span>
        <div style={{ fontWeight: 700, color: "var(--ink)" }}>{title}</div>
      </div>
      <p style={{ color: "var(--muted)", lineHeight: 1.6, fontSize: "0.93rem" }}>{text}</p>
    </div>
  );
}
