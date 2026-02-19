// src/pages/AboutPage.jsx
import React from "react";
import { SectionHeader, Card, CTAButton, ResponseHint } from "../components/Shared";

export default function AboutPage({ lang = "de" }) {
  const isDe = lang === "de";

  return (
    <>
      {/* ===== Header ===== */}
      <section style={{ background: "#fff", borderBottom: "1px solid var(--line)" }}>
        <div className="section-wrap" style={{ paddingTop: "2.75rem", paddingBottom: "2.75rem" }}>
          <div style={{ maxWidth: "62rem" }}>
            <div style={{ color: "var(--subtle)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
              {isDe ? "Über uns" : "About us"}
            </div>
            <h1>
              {isDe
                ? "Engineering-geführt. Klar strukturiert. Persönlich verantwortlich."
                : "Engineering-led. Clearly structured. Personally accountable."}
            </h1>
            <p style={{ marginTop: "1rem", color: "var(--muted)", fontSize: "1.05rem", lineHeight: 1.65 }}>
              {isDe
                ? "Volotech ist kein klassischer Lohnfertiger und kein anonymes Handelshaus. Hinter dem Unternehmen steht ein Maschinenbauingenieur, der Ihre technischen Anforderungen versteht, weil er aus der gleichen Welt kommt."
                : "Volotech is not a traditional job shop, nor an anonymous trading company. Behind the business is a mechanical engineer who understands your technical requirements because he comes from the same world."}
            </p>
          </div>
        </div>
      </section>

      {/* ===== The person behind Volotech ===== */}
      <section style={{ background: "var(--bg)" }}>
        <div className="section-wrap">
          <SectionHeader
            title={isDe ? "Der Ingenieur hinter Volotech" : "The engineer behind Volotech"}
            subtitle={isDe
              ? "Erfahrung aus Automatisierung, Intralogistik und Automotive — jetzt für Ihre Projekte."
              : "Experience from automation, intralogistics, and automotive — now available for your projects."}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }} className="grid-2">
            <div className="v-card">
              <div style={{ fontWeight: 700, marginBottom: "0.75rem", color: "var(--ink)" }}>
                Emanuel Chitic, B.Eng., MBA
              </div>
              <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>
                {isDe
                  ? "Maschinenbauingenieur mit über 10 Jahren Berufserfahrung in Deutschland. Aktuelle Tätigkeit: Subject Matter Expert in der mechanischen Standardisierung bei einem deutschen Automobilhersteller (OEM). Davor: Projektleitung und Baustellenleitung in der Intralogistik und Fördertechnik."
                  : "Mechanical engineer with over 10 years of professional experience in Germany. Current role: Subject Matter Expert in mechanical standardization at a German automotive OEM. Previously: project management and site management in intralogistics and conveyor systems."}
              </p>
            </div>

            <div className="v-card">
              <div className="v-kicker" style={{ marginBottom: "0.75rem" }}>
                {isDe ? "Beruflicher Hintergrund" : "Professional background"}
              </div>
              <ul style={{ color: "var(--muted)", lineHeight: 1.8, paddingLeft: "1.1rem", margin: 0 }}>
                <li>{isDe ? "Mechanische Standardisierung — Automotive OEM" : "Mechanical standardization — Automotive OEM"}</li>
                <li>{isDe ? "Baustellenleitung — Intralogistik & Fördertechnik" : "Site management — Intralogistics & conveyor systems"}</li>
                <li>{isDe ? "Projektleitung — Hängefördersysteme" : "Project management — Overhead conveyor systems"}</li>
                <li>{isDe ? "Mechanische Montage — Fördertechnik & Automatisierung" : "Mechanical fitting — Conveyor systems & automation"}</li>
                <li>{isDe ? "Studium Maschinenbau (B.Eng.)" : "B.Eng. Mechanical Engineering"}</li>
                <li>MBA</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Why Volotech exists ===== */}
      <section style={{ background: "#fff", borderTop: "1px solid var(--line)" }}>
        <div className="section-wrap">
          <SectionHeader
            title={isDe ? "Warum es Volotech gibt" : "Why Volotech exists"}
            subtitle={isDe
              ? "Die Idee hinter dem Unternehmen."
              : "The idea behind the company."}
          />

          <p style={{ maxWidth: "62rem", color: "var(--muted)", lineHeight: 1.7 }}>
            {isDe
              ? "In der täglichen Arbeit im Maschinenbau und in der Automatisierung erlebe ich immer wieder die gleiche Situation: Unternehmen brauchen zuverlässig gefertigte Teile und Baugruppen, stoßen aber auf lange Lieferzeiten, hohe Stundensätze oder fehlende technische Ansprechpartner beim Lieferanten. Gleichzeitig gibt es in der EU exzellente Fertigungsbetriebe mit modernen Maschinen, ISO-Zertifizierung und Kapazität — aber ohne direkten Zugang zum deutschen Markt. Volotech verbindet beide Seiten: deutsches Engineering-Know-how und Qualitätsanspruch mit einem leistungsfähigen, kosteneffizienten Fertigungsnetzwerk in der EU."
              : "In my daily work in machine building and automation, I keep encountering the same situation: companies need reliably manufactured parts and assemblies but face long lead times, high hourly rates, or a lack of technical contacts at their supplier. At the same time, excellent manufacturing shops exist across the EU with modern equipment, ISO certification, and capacity — but without direct access to the German market. Volotech bridges both sides: German engineering know-how and quality standards with a capable, cost-efficient manufacturing network in the EU."}
          </p>
        </div>
      </section>

      {/* ===== How we work ===== */}
      <section style={{ background: "var(--bg)", borderTop: "1px solid var(--line)" }}>
        <div className="section-wrap">
          <SectionHeader
            title={isDe ? "Wie wir arbeiten" : "How we work"}
            subtitle={isDe
              ? "Drei Prinzipien, die unsere Zusammenarbeit mit Kunden definieren."
              : "Three principles that define how we work with clients."}
          />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "1.25rem" }} className="grid-3">
            <Card
              title={isDe ? "Technische Klärung vor dem Angebot" : "Technical review before quoting"}
              text={isDe
                ? "Machbarkeit, Toleranzen und kritische Merkmale werden vor der Angebotserstellung geprüft — nicht erst in der Fertigung entdeckt."
                : "Feasibility, tolerances, and critical features are reviewed before quoting — not discovered during production."}
            />
            <Card
              title={isDe ? "Klare Verantwortung" : "Clear accountability"}
              text={isDe
                ? "Sie haben einen festen Ansprechpartner für Ihr Projekt. Keine Weiterleitung zwischen Abteilungen, keine unklaren Zuständigkeiten."
                : "You have one point of contact for your project. No being passed between departments, no unclear responsibilities."}
            />
            <Card
              title={isDe ? "Realistische Zusagen" : "Realistic commitments"}
              text={isDe
                ? "Wir versprechen nur, was wir halten können. Wenn etwas nicht machbar ist oder Risiken birgt, erfahren Sie es direkt — nicht nach Lieferung."
                : "We only promise what we can deliver. If something isn't feasible or carries risk, you hear about it upfront — not after delivery."}
            />
          </div>
        </div>
      </section>

      {/* ===== Lean structure ===== */}
      <section style={{ background: "#fff", borderTop: "1px solid var(--line)" }}>
        <div className="section-wrap">
          <SectionHeader
            title={isDe ? "Schlanke Struktur — bewusst gewählt" : "Lean structure — by design"}
          />
          <p style={{ maxWidth: "62rem", color: "var(--muted)", lineHeight: 1.7 }}>
            {isDe
              ? "Volotech ist bewusst schlank organisiert. Weniger Hierarchieebenen bedeuten kürzere Entscheidungswege, weniger Missverständnisse und mehr Verantwortung pro Entscheidung. Sie sprechen nicht mit einem Call-Center, sondern direkt mit dem Ingenieur, der Ihr Projekt betreut."
              : "Volotech is deliberately lean. Fewer layers mean shorter decision paths, fewer misunderstandings, and more accountability per decision. You don't talk to a call center — you talk directly to the engineer managing your project."}
          </p>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section style={{ background: "var(--bg)", borderTop: "1px solid var(--line)" }}>
        <div className="section-wrap">
          <div className="v-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ maxWidth: "48rem" }}>
              <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                {isDe ? "Passt das zu Ihrem Projekt?" : "Does this fit your project?"}
              </div>
              <p style={{ marginTop: "0.35rem", color: "var(--muted)", lineHeight: 1.6 }}>
                {isDe
                  ? "Senden Sie eine kurze Anfrage mit Zeichnung und Eckdaten — wir melden uns strukturiert zurück."
                  : "Send a short request with a drawing and key data — we'll respond with structured next steps."}
              </p>
            </div>
            <CTAButton to="/manufacturing?rfq=1">
              {isDe ? "Anfrage stellen" : "Request a quote"}
            </CTAButton>
          </div>
        </div>
      </section>
    </>
  );
}
