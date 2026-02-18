// src/pages/CePage.jsx
import React from "react";
import { SectionHeader, BulletCard, CTAButton, ResponseHint } from "../components/Shared";

export default function CePage({ lang = "de" }) {
  const isDe = lang === "de";

  return (
    <>
      {/* ===== Header ===== */}
      <section style={{ background: "#fff" }}>
        <div className="section-wrap" style={{ paddingTop: "3rem", paddingBottom: "2.75rem" }}>
          <div style={{ maxWidth: "60rem" }}>
            <div style={{ color: "var(--subtle)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
              {isDe ? "Leistungen · CE-Konformität" : "Services · CE Compliance"}
            </div>
            <h1>
              {isDe
                ? "CE-Unterstützung für Maschinenbau & Automatisierung"
                : "CE support for machine building & automation"}
            </h1>
            <p style={{ marginTop: "1rem", color: "var(--muted)", fontSize: "1.02rem", lineHeight: 1.65 }}>
              {isDe
                ? "Wir unterstützen bei der Strukturierung von CE-Anforderungen, der Risikobeurteilung und dem Aufbau technischer Dokumentation — damit Übergaben an Kunden und Prüfer funktionieren. Dieser Service ergänzt unsere Fertigungsleistungen und richtet sich an Projekte, bei denen Dokumentation und Konformität von Anfang an mitgedacht werden sollen."
                : "We support the structuring of CE requirements, risk assessment, and technical documentation — so handovers to customers and auditors work smoothly. This service complements our manufacturing capabilities and is aimed at projects where documentation and conformity should be considered from the start."}
            </p>
            <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
              <CTAButton to="/manufacturing?rfq=1">{isDe ? "Anfrage stellen" : "Request a quote"}</CTAButton>
              <ResponseHint isDe={isDe} />
            </div>
          </div>
        </div>
      </section>

      {/* ===== Scope ===== */}
      <section style={{ background: "var(--bg)", borderTop: "1px solid var(--line)" }}>
        <div className="section-wrap">
          <SectionHeader
            title={isDe ? "Typischer Leistungsumfang" : "Typical scope"}
            subtitle={isDe
              ? "Je nach Projekt unterstützen wir in folgenden Bereichen. Der genaue Umfang wird vorab abgeklärt."
              : "Depending on the project, we support in the areas below. Exact scope is clarified upfront."}
          />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "1.25rem" }} className="grid-3">
            <BulletCard
              title={isDe ? "Risikobeurteilung" : "Risk assessment"}
              bullets={isDe
                ? ["Scope / Abgrenzung klären", "Risiken identifizieren & bewerten", "Maßnahmen & Nachweise strukturieren"]
                : ["Define scope / limits", "Identify & assess risks", "Structure measures & evidence"]}
            />
            <BulletCard
              title={isDe ? "Technische Dokumentation" : "Technical documentation"}
              bullets={isDe
                ? ["Struktur & Paketaufbau", "Versionierung & saubere Ablage", "Übergabefähige Dokumente"]
                : ["Package structure", "Versioning & clean repository", "Handover-ready documents"]}
            />
            <BulletCard
              title={isDe ? "Konformität & Übergabe" : "Conformity & handover"}
              bullets={isDe
                ? ["Offene Punkte früh sichtbar machen", "Checklisten / Nachweise je nach Projekt", "Saubere Übergabe an Kunde / Prüfer"]
                : ["Surface open points early", "Project-dependent checklists / evidence", "Clean handover to customer / auditor"]}
            />
          </div>
        </div>
      </section>

      {/* ===== What we need ===== */}
      <section style={{ background: "#fff", borderTop: "1px solid var(--line)" }}>
        <div className="section-wrap">
          <SectionHeader
            title={isDe ? "Was wir von Ihnen brauchen" : "What we need from you"}
          />

          <div className="v-card" style={{ maxWidth: "60rem" }}>
            <ul style={{ margin: 0, paddingLeft: "1.1rem", color: "var(--muted)", lineHeight: 1.8 }}>
              <li>{isDe ? "Kurzbeschreibung Produkt & Einsatzzweck" : "Short product / use-case description"}</li>
              <li>{isDe ? "Zeichnungen, Stückliste, Varianten" : "Drawings, BOM, variants"}</li>
              <li>{isDe ? "Abgrenzung: Was gehört zum Lieferumfang?" : "Boundary: what is included in scope?"}</li>
              <li>{isDe ? "Zieltermin / gewünschte Übergabe" : "Target date / handover expectation"}</li>
            </ul>
            <div style={{ marginTop: "1rem" }}>
              <CTAButton to="/manufacturing?rfq=1">{isDe ? "Anfrage stellen" : "Request a quote"}</CTAButton>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
