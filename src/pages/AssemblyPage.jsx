// src/pages/AssemblyPage.jsx
import React from "react";
import { useLocation } from "react-router-dom";
import { SectionHeader, BulletCard, CTAButton, ResponseHint, Step } from "../components/Shared";

export default function AssemblyPage({ lang = "de" }) {
  const isDe = lang === "de";
  const loc = useLocation();

  React.useEffect(() => {
    const params = new URLSearchParams(loc.search);
    if (params.get("rfq") === "1") {
      const el = document.getElementById("rfq");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loc.search]);

  return (
    <>
      {/* ===== Header ===== */}
      <section style={{ background: "#fff", borderBottom: "1px solid var(--line)" }}>
        <div className="section-wrap" style={{ paddingTop: "2.75rem", paddingBottom: "2.75rem" }}>
          <div style={{ maxWidth: "62rem" }}>
            <div style={{ color: "var(--subtle)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
              {isDe ? "Leistungen" : "Services"} · {isDe ? "Montage" : "Assembly"}
            </div>
            <h1>
              {isDe
                ? "Montage & Baugruppen — einbaufertig geliefert, mit klarer Dokumentation"
                : "Assembly & sub-assemblies — delivered ready to install, with clear documentation"}
            </h1>
            <p style={{ marginTop: "0.9rem", color: "var(--muted)", lineHeight: 1.65, fontSize: "1.02rem" }}>
              {isDe
                ? "Wir koordinieren Vormontage und Montage für Baugruppen aus CNC- und Blechkomponenten — inklusive Prüfung und Dokumentation auf Wunsch. Weniger Aufwand für Sie, saubere Übergabe in Ihre Produktion."
                : "We coordinate pre-assembly and assembly of sub-assemblies from CNC and sheet metal components — with inspection and documentation on request. Less effort for you, clean handover into your production."}
            </p>
            <div style={{ marginTop: "1.25rem", display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
              <CTAButton to="/manufacturing?rfq=1">{isDe ? "Anfrage stellen" : "Request a quote"}</CTAButton>
              <ResponseHint isDe={isDe} />
            </div>
          </div>
        </div>
      </section>

      {/* ===== What we assemble ===== */}
      <section style={{ background: "var(--bg)" }}>
        <div className="section-wrap">
          <SectionHeader
            title={isDe ? "Typische Montageleistungen" : "Typical assembly scope"}
            subtitle={isDe
              ? "Baugruppen für Maschinenbau & Automatisierung — von Vormontage bis einbaufertiger Einheit."
              : "Assemblies for machine building & automation — from pre-assembly to ready-to-install units."}
          />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "1.25rem" }} className="grid-3">
            <BulletCard
              title={isDe ? "Vormontage" : "Pre-assembly"}
              bullets={isDe
                ? ["Unterbaugruppen, Module, Halterungen", "Verschrauben, Einpressen, Einsetzen", "Vorbereitung für Endmontage"]
                : ["Sub-assemblies, modules, brackets", "Screwing, press-fit, inserting", "Preparation for final assembly"]}
            />
            <BulletCard
              title={isDe ? "Endmontage" : "Final assembly"}
              bullets={isDe
                ? ["Komplette Baugruppen (projektabhängig)", "Kennzeichnung & Verpackung", "Einbaufertige Lieferung"]
                : ["Complete assemblies (project-dependent)", "Labeling & packaging", "Ready-to-install delivery"]}
            />
            <BulletCard
              title={isDe ? "Prüfung & Dokumentation" : "Inspection & documentation"}
              bullets={isDe
                ? ["Sichtprüfung & Funktionscheck", "Fotodokumentation auf Wunsch", "Messprotokoll / Prüfplan auf Wunsch"]
                : ["Visual inspection & functional checks", "Photo documentation on request", "Measurement report / test plan on request"]}
            />
          </div>
        </div>
      </section>

      {/* ===== Process ===== */}
      <section style={{ background: "#fff", borderTop: "1px solid var(--line)" }}>
        <div className="section-wrap">
          <SectionHeader
            title={isDe ? "Ablauf" : "Process"}
            subtitle={isDe ? "Klare Stückliste, klare Schnittstellen, saubere Übergabe." : "Clear BOM, clear interfaces, clean handover."}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: "1.25rem" }} className="grid-2">
            <div className="v-card">
              <Step n="1" title={isDe ? "Anfrage + Daten" : "Request + data"}>
                {isDe ? "Stückliste, Zeichnungen/Modelle, Montagehinweise, Zieltermin." : "BOM, drawings/models, assembly notes, target date."}
              </Step>
              <Step n="2" title={isDe ? "Klärung & Annahmen" : "Clarification"}>
                {isDe ? "Schnittstellen, Toleranzen, kritische Merkmale, Prüfanforderungen." : "Interfaces, tolerances, critical features, inspection requirements."}
              </Step>
              <Step n="3" title={isDe ? "Angebot" : "Quote"}>
                {isDe ? "Angebot + Lieferzeit + klarer Leistungsumfang." : "Quote + lead time + clear scope."}
              </Step>
              <Step n="4" title={isDe ? "Montage & Lieferung" : "Assembly & delivery"}>
                {isDe ? "Montage, Prüfung (falls vereinbart), Verpackung & Lieferung." : "Assembly, inspection (if agreed), packaging & delivery."}
              </Step>
            </div>

            <div className="v-card-accent">
              <div className="v-kicker">{isDe ? "Damit es schnell geht" : "To keep it fast"}</div>
              <ul style={{ marginTop: "0.75rem", color: "var(--ink)", lineHeight: 1.75, paddingLeft: "1.1rem" }}>
                <li>{isDe ? "Stückliste (BOM) + Revisionsstand" : "BOM + revision state"}</li>
                <li>{isDe ? "Montageanleitung / Drehmomente (falls relevant)" : "Assembly instructions / torque specs (if relevant)"}</li>
                <li>{isDe ? "Prüfanforderungen klar benennen" : "State inspection requirements clearly"}</li>
                <li>{isDe ? "Verpackung / Labeling-Anforderungen" : "Packaging / labeling requirements"}</li>
              </ul>
              <div style={{ marginTop: "1rem" }}>
                <CTAButton to="/manufacturing?rfq=1">{isDe ? "Anfrage stellen" : "Request a quote"}</CTAButton>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
