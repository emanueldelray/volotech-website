// src/pages/PortfolioPage.jsx
import React from "react";
import { SectionHeader, CTAButton, ResponseHint } from "../components/Shared";

/* ===== Load portfolio images ===== */
const portfolioImages = (() => {
  const modules = import.meta.glob("../assets/portfolio/*.{jpg,jpeg,png,webp}", {
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

export default function PortfolioPage({ lang = "de" }) {
  const isDe = lang === "de";

  const sections = [
    {
      key: "cnc",
      title: isDe ? "CNC-Teile" : "CNC parts",
      subtitle: isDe
        ? "Drehen · Fräsen · Präzisionsteile aus Stahl, Edelstahl und Aluminium"
        : "Turning · Milling · Precision parts in steel, stainless and aluminium",
      items: [
        {
          image: portfolioImages["cnc-flange-aluminium"],
          title: isDe ? "Aluminium-Flansch" : "Aluminium flange",
          meta: isDe ? "Alu · Drehen + Fräsen" : "Al · Turning + milling",
          tags: [isDe ? "Maschinenbau" : "Machine building"],
        },
        {
          image: portfolioImages["cnc-bracket-stainless"],
          title: isDe ? "Edelstahl-Block" : "Stainless block",
          meta: isDe ? "1.4301 · Fräsen + Bohren" : "1.4301 · Milling + drilling",
          tags: [isDe ? "Vorrichtungen" : "Fixtures"],
        },
        {
          image: portfolioImages["cnc-gear-steel"],
          title: isDe ? "Stirnrad" : "Spur gear",
          meta: isDe ? "Stahl · Verzahnung + Bohrungen" : "Steel · Gear cutting + bores",
          tags: [isDe ? "Antriebstechnik" : "Drive technology"],
        },
        {
          image: portfolioImages["cnc-flanges-turned"],
          title: isDe ? "Drehflansche" : "Turned flanges",
          meta: isDe ? "Stahl · Drehen + Bohren" : "Steel · Turning + drilling",
          tags: [isDe ? "Maschinenbau" : "Machine building"],
        },
        {
          image: portfolioImages["cnc-centering-pin"],
          title: isDe ? "Zentrierdorn" : "Centering pin",
          meta: isDe ? "Edelstahl · Drehen + Gewinde" : "Stainless · Turning + thread",
          tags: [isDe ? "Vorrichtungen" : "Fixtures"],
        },
        {
          image: portfolioImages["cnc-shoulder-bolts"],
          title: isDe ? "Sonder-Schulterschrauben" : "Custom shoulder bolts",
          meta: isDe ? "Edelstahl · Drehen, Innensechskant" : "Stainless · Turning, hex socket",
          tags: [isDe ? "Sonderteile" : "Custom parts"],
        },
        {
          image: portfolioImages["cnc-shafts-turned"],
          title: isDe ? "Wellen / Ventilkörper" : "Shafts / valve bodies",
          meta: isDe ? "Stahl · Drehen + Innenbearbeitung" : "Steel · Turning + internal machining",
          tags: [isDe ? "Hydraulik / Pneumatik" : "Hydraulic / pneumatic"],
        },
      ],
    },
    {
      key: "assembly",
      title: isDe ? "Baugruppen & Gehäuse" : "Sub-assemblies & housings",
      subtitle: isDe
        ? "Zusammengeführte CNC-Komponenten — bereit für die Endmontage"
        : "Combined CNC components — ready for final assembly",
      items: [
        {
          image: portfolioImages["assembly-housing-aluminium"],
          title: isDe ? "Aluminium-Gehäuse mit Deckel" : "Aluminium housing with cover",
          meta: isDe ? "Alu · Fräsen + Anschlussbohrungen" : "Al · Milling + connection bores",
          tags: [isDe ? "Hydraulik / Pneumatik" : "Hydraulic / pneumatic"],
        },
        {
          image: portfolioImages["assembly-precision-blocks"],
          title: isDe ? "Präzisionsgehäuse" : "Precision housings",
          meta: isDe ? "Alu · Fräsen, enge Toleranzen" : "Al · Milling, tight tolerances",
          tags: [isDe ? "Automation" : "Automation"],
        },
      ],
    },
  ];

  return (
    <>
      {/* ===== Header ===== */}
      <section style={{ background: "#fff", borderBottom: "1px solid var(--line)" }}>
        <div className="section-wrap" style={{ paddingTop: "2.75rem", paddingBottom: "2.75rem" }}>
          <div style={{ maxWidth: "62rem" }}>
            <div style={{ color: "var(--subtle)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
              {isDe ? "Referenzen" : "Portfolio"}
            </div>
            <h1>
              {isDe ? "Beispielteile & Fertigungsbeispiele" : "Example parts & manufacturing samples"}
            </h1>
            <p style={{ marginTop: "0.9rem", color: "var(--muted)", lineHeight: 1.65, fontSize: "1.02rem" }}>
              {isDe
                ? "Eine Auswahl typischer Teile, Baugruppen und Fertigungsprozesse aus unserem EU-Partnernetzwerk. Sheet-Metal- und Schweißbaugruppen-Beispiele gerne auf Anfrage."
                : "A selection of typical parts, assemblies and processes from our EU partner network. Sheet metal and welded assembly examples available on request."}
            </p>
            <div style={{ marginTop: "1.1rem", display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
              <CTAButton to="/manufacturing?rfq=1">{isDe ? "Anfrage stellen" : "Request a quote"}</CTAButton>
              <ResponseHint isDe={isDe} />
            </div>
          </div>
        </div>
      </section>

      {/* ===== Hero feature image ===== */}
      {portfolioImages["cnc-parts-overview"] && (
        <section style={{ background: "#fff", padding: 0 }}>
          <div className="pf-hero">
            <img
              src={portfolioImages["cnc-parts-overview"]}
              alt={isDe
                ? "Übersicht CNC-gefertigter Teile auf einer technischen Zeichnung"
                : "Overview of CNC-machined parts on a technical drawing"}
              loading="eager"
            />
            <div className="pf-hero-caption">
              {isDe
                ? "Typischer Teilesatz: gefertigte Komponenten nach Kundenzeichnung"
                : "Typical batch: components manufactured to customer drawings"}
            </div>
          </div>
        </section>
      )}

      {/* ===== Sections ===== */}
      <section style={{ background: "var(--bg)" }}>
        <div className="section-wrap">
          {sections.map((sec) => (
            <div key={sec.key} style={{ marginBottom: "2.5rem" }}>
              <SectionHeader title={sec.title} subtitle={sec.subtitle} />
              <div className="pf-grid">
                {sec.items.map((item, idx) => (
                  <PortfolioCard key={`${sec.key}-${idx}`} item={item} isDe={isDe} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section style={{ background: "#fff", borderTop: "1px solid var(--line)" }}>
        <div className="section-wrap">
          <div className="v-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ maxWidth: "48rem" }}>
              <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                {isDe ? "Haben Sie ein ähnliches Teil?" : "Have a similar part?"}
              </div>
              <p style={{ marginTop: "0.35rem", color: "var(--muted)", lineHeight: 1.6 }}>
                {isDe
                  ? "Zeichnung/STEP + Material + Menge senden — wir melden uns strukturiert zurück."
                  : "Send drawing/STEP + material + quantity — we'll respond with structured next steps."}
              </p>
            </div>
            <CTAButton to="/manufacturing?rfq=1">{isDe ? "Anfrage stellen" : "Request a quote"}</CTAButton>
          </div>
        </div>
      </section>
    </>
  );
}

function PortfolioCard({ item, isDe }) {
  const { title, meta, tags, image } = item;
  return (
    <div className="pf-card">
      {image ? (
        <img src={image} alt={title} loading="lazy" />
      ) : (
        <div className="pf-card-placeholder">{title}</div>
      )}
      <div className="pf-card-body">
        <div className="pf-card-title">{title}</div>
        <div className="pf-card-meta">{meta}</div>
        {tags?.length > 0 && (
          <div className="pf-card-tags">
            {tags.map((t) => (
              <span key={t} className="v-pill">{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
