// src/pages/QualityPage.jsx
import React from "react";
import { SectionHeader, BulletCard, CTAButton, ResponseHint } from "../components/Shared";

export default function QualityPage({ lang = "de" }) {
  const isDe = lang === "de";

  return (
    <>
      {/* ===== Header ===== */}
      <section style={{ background: "#fff" }}>
        <div className="section-wrap" style={{ paddingTop: "3rem", paddingBottom: "2.75rem" }}>
          <div style={{ maxWidth: "62rem" }}>
            <div style={{ color: "var(--subtle)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
              {isDe ? "Leistungen · Qualität" : "Services · Quality"}
            </div>
            <h1>
              {isDe
                ? "Qualität und Dokumentation, die Audit-fest sind"
                : "Quality and documentation that pass audits"}
            </h1>
            <p style={{ marginTop: "1rem", color: "var(--muted)", fontSize: "1.02rem", lineHeight: 1.65 }}>
              {isDe
                ? "Unsere Fertigungspartner sind ISO 9001 zertifiziert. Wir liefern Materialzertifikate, Maßprüfberichte und Chargenrückverfolgbarkeit auf Anfrage — passend zu den Anforderungen Ihrer Endabnahme oder Ihres Auditors."
                : "Our manufacturing partners are ISO 9001 certified. We provide material certificates, dimensional inspection reports, and batch traceability on request — matched to the requirements of your acceptance or auditor."}
            </p>
            <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
              <CTAButton to="/manufacturing?rfq=1">{isDe ? "Anfrage stellen" : "Request a quote"}</CTAButton>
              <ResponseHint isDe={isDe} />
            </div>
          </div>
        </div>
      </section>

      {/* ===== What we deliver ===== */}
      <section style={{ background: "var(--bg)", borderTop: "1px solid var(--line)" }}>
        <div className="section-wrap">
          <SectionHeader
            title={isDe ? "Was wir liefern können" : "What we can deliver"}
            subtitle={isDe
              ? "Auf Wunsch — entweder als Standardpaket oder kundenspezifisch zusammengestellt."
              : "On request — either as a standard package or assembled to your specification."}
          />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "1.25rem" }} className="grid-3">
            <BulletCard
              title={isDe ? "Materialzertifikate" : "Material certificates"}
              bullets={isDe
                ? [
                    "EN 10204 3.1 (Werkszeugnis)",
                    "Chargenbezogene Werkstoffnachweise",
                    "Auf Wunsch 3.2 (mit unabhängiger Prüfung)",
                  ]
                : [
                    "EN 10204 3.1 (mill test certificate)",
                    "Batch-specific material proof",
                    "3.2 on request (independent verification)",
                  ]}
            />
            <BulletCard
              title={isDe ? "Maßprüfung" : "Dimensional inspection"}
              bullets={isDe
                ? [
                    "Erstmusterprüfbericht (EMPB / FAI)",
                    "Stichprobenprüfung nach AQL",
                    "100 %-Prüfung kritischer Maße",
                    "CMM-Berichte auf Wunsch",
                  ]
                : [
                    "First article inspection report (FAI)",
                    "AQL sampling inspection",
                    "100% inspection of critical dimensions",
                    "CMM reports on request",
                  ]}
            />
            <BulletCard
              title={isDe ? "Rückverfolgbarkeit" : "Traceability"}
              bullets={isDe
                ? [
                    "Chargennummer pro Lieferung",
                    "Zuordnung Material ↔ Charge ↔ Maschine",
                    "Dokumentation archivierbar (PDF)",
                  ]
                : [
                    "Batch number per delivery",
                    "Material ↔ batch ↔ machine traceability",
                    "Documentation archivable (PDF)",
                  ]}
            />
          </div>
        </div>
      </section>

      {/* ===== Standards ===== */}
      <section style={{ background: "#fff", borderTop: "1px solid var(--line)" }}>
        <div className="section-wrap">
          <SectionHeader
            title={isDe ? "Unsere Standards" : "Our standards"}
            subtitle={isDe
              ? "Wonach wir und unsere Partner arbeiten — und was wir auf Wunsch nachweisen."
              : "What we and our partners work to — and what we document on request."}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }} className="grid-2">
            <div className="v-card">
              <div className="v-kicker">{isDe ? "Zertifizierungen" : "Certifications"}</div>
              <ul style={{ marginTop: "0.75rem", color: "var(--muted)", lineHeight: 1.8, paddingLeft: "1.1rem" }}>
                <li>{isDe ? "ISO 9001 — alle Fertigungspartner" : "ISO 9001 — all manufacturing partners"}</li>
                <li>{isDe ? "EN 10204 3.1 / 3.2 Werkszeugnisse" : "EN 10204 3.1 / 3.2 mill test certificates"}</li>
                <li>{isDe ? "Schweißnachweise (auf Anfrage, je nach Partner)" : "Welding qualification (on request, partner-dependent)"}</li>
              </ul>
            </div>
            <div className="v-card-accent">
              <div className="v-kicker">{isDe ? "Auf unserer Seite" : "On our side"}</div>
              <ul style={{ marginTop: "0.75rem", color: "var(--ink)", lineHeight: 1.8, paddingLeft: "1.1rem" }}>
                <li>
                  {isDe
                    ? "DGQ ISO 9001 Internal Auditor (in Ausbildung)"
                    : "DGQ ISO 9001 Internal Auditor (in training)"}
                </li>
                <li>
                  {isDe
                    ? "Erfahrung in mechanischer Standardisierung bei einem Automotive OEM"
                    : "Experience in mechanical standardization at an automotive OEM"}
                </li>
                <li>
                  {isDe
                    ? "Ingenieur-geführte Eingangs- und Endkontrolle der Dokumentation"
                    : "Engineer-led incoming and final documentation review"}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Process ===== */}
      <section style={{ background: "var(--bg)", borderTop: "1px solid var(--line)" }}>
        <div className="section-wrap">
          <SectionHeader
            title={isDe ? "So gelangen Nachweise zu Ihnen" : "How proofs reach you"}
            subtitle={isDe
              ? "Klar getaktet — keine Nachforderungen nach der Lieferung."
              : "Clearly sequenced — no chasing documents after delivery."}
          />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "1rem" }} className="grid-3">
            <QStep n="1" title={isDe ? "Vorab geklärt" : "Clarified upfront"}
              text={isDe ? "Welche Nachweise brauchen Sie? Wir vereinbaren den Umfang vor Auftragsannahme." : "Which proofs do you need? We agree the scope before order acceptance."} />
            <QStep n="2" title={isDe ? "Prüfung im Werk" : "Inspection at the shop"}
              text={isDe ? "Material- und Maßprüfung nach vereinbartem Plan." : "Material and dimensional inspection per agreed plan."} />
            <QStep n="3" title={isDe ? "Eingangskontrolle" : "Incoming review"}
              text={isDe ? "Wir prüfen Vollständigkeit der Dokumentation, bevor Ware das Werk verlässt." : "We check documentation completeness before parts leave the shop."} />
            <QStep n="4" title={isDe ? "Lieferung mit Paket" : "Delivery with package"}
              text={isDe ? "Teile + Dokumentation gemeinsam — als PDF und/oder gedruckt." : "Parts + documentation together — as PDF and/or printed."} />
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section style={{ background: "#fff", borderTop: "1px solid var(--line)" }}>
        <div className="section-wrap">
          <div className="v-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ maxWidth: "48rem" }}>
              <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                {isDe ? "Welche Nachweise brauchen Sie?" : "Which proofs do you need?"}
              </div>
              <p style={{ marginTop: "0.35rem", color: "var(--muted)", lineHeight: 1.6 }}>
                {isDe
                  ? "Sagen Sie uns vorab, was Ihre Endabnahme oder Ihr Auditor erwartet — wir richten das Dokumentationspaket darauf aus."
                  : "Tell us upfront what your acceptance or auditor expects — we'll tailor the documentation package accordingly."}
              </p>
            </div>
            <CTAButton to="/manufacturing?rfq=1">{isDe ? "Anfrage stellen" : "Request a quote"}</CTAButton>
          </div>
        </div>
      </section>
    </>
  );
}

function QStep({ n, title, text }) {
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
