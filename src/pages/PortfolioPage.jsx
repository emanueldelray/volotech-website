// src/pages/PortfolioPage.jsx
import React from "react";
import { SectionHeader, CTAButton, ResponseHint } from "../components/Shared";

export default function PortfolioPage({ lang = "de" }) {
  const isDe = lang === "de";

  const sections = [
    {
      key: "cnc",
      title: isDe ? "CNC-Teile" : "CNC parts",
      subtitle: isDe ? "Drehen · Fräsen · Präzisionsteile" : "Turning · Milling · Precision parts",
      items: [
        { title: isDe ? "Alu-Frästeil" : "Aluminium milled part", meta: isDe ? "Alu 6082 · Kleinserie" : "Al 6082 · Small series", tags: ["Automation"], image: null },
        { title: isDe ? "Stahl-Drehteil" : "Steel turned part", meta: isDe ? "C45 · Prototyp" : "C45 · Prototype", tags: ["Maschinenbau"], image: null },
        { title: isDe ? "Edelstahl-Halter" : "Stainless bracket", meta: isDe ? "1.4301 · Fräsen" : "1.4301 · Milling", tags: ["Intralogistik"], image: null },
        { title: isDe ? "Kunststoffteil" : "Plastic part", meta: isDe ? "POM · Fräsen" : "POM · Milling", tags: ["Vorrichtungen"], image: null },
      ],
    },
    {
      key: "sheet",
      title: isDe ? "Blech & Schweißbaugruppen" : "Sheet & welded assemblies",
      subtitle: isDe ? "Laser · Kanten · Schweißen" : "Laser · Bending · Welding",
      items: [
        { title: isDe ? "Kantteil" : "Bent sheet part", meta: isDe ? "S235 · Kanten" : "S235 · Bending", tags: ["Maschinenbau"], image: null },
        { title: isDe ? "Schweißbaugruppe" : "Welded assembly", meta: isDe ? "S355 · Schweißen" : "S355 · Welding", tags: ["Automation"], image: null },
        { title: isDe ? "Gehäuse / Abdeckung" : "Cover / housing", meta: isDe ? "Blech · Laser" : "Sheet · Laser", tags: ["Intralogistik"], image: null },
        { title: isDe ? "Laserschneidteil" : "Laser cut part", meta: isDe ? "Edelstahl · Laser" : "Stainless · Laser", tags: ["Industrie"], image: null },
      ],
    },
    {
      key: "assembly",
      title: isDe ? "Baugruppen / Montage" : "Assemblies",
      subtitle: isDe ? "Vormontage · Montage · Verpackung" : "Pre-assembly · Assembly · Packaging",
      items: [
        { title: isDe ? "Vormontage-Modul" : "Pre-assembled module", meta: isDe ? "BOM + Anleitung" : "BOM + Instructions", tags: ["Automation"], image: null },
        { title: isDe ? "Einbaufertige Einheit" : "Ready-to-install unit", meta: isDe ? "Montage + Labeling" : "Assembly + Labeling", tags: ["Maschinenbau"], image: null },
        { title: isDe ? "Kitting / Set" : "Kitting / set", meta: isDe ? "Kommissionierung" : "Kitting", tags: ["Intralogistik"], image: null },
        { title: isDe ? "Montage mit Prüfung" : "Assembly with inspection", meta: isDe ? "Prüfplan auf Wunsch" : "Test plan on request", tags: ["Qualität"], image: null },
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
                ? "Nachfolgend finden Sie Beispiele typischer Teile und Baugruppen, die wir über unser Netzwerk fertigen. Weitere Details und Referenzen teilen wir gerne auf Anfrage."
                : "Below you'll find examples of typical parts and assemblies we manufacture via our network. Further details and references are available on request."}
            </p>
            <div style={{ marginTop: "1.1rem", display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
              <CTAButton to="/manufacturing?rfq=1">{isDe ? "Anfrage stellen" : "Request a quote"}</CTAButton>
              <ResponseHint isDe={isDe} />
            </div>
          </div>
        </div>
      </section>

      {/* ===== Sections ===== */}
      <section style={{ background: "var(--bg)" }}>
        <div className="section-wrap">
          {sections.map((sec) => (
            <div key={sec.key} style={{ marginBottom: "2.5rem" }}>
              <SectionHeader title={sec.title} subtitle={sec.subtitle} />
              <div className="pf-grid">
                {sec.items.map((item, idx) => (
                  <PortfolioCard key={`${sec.key}-${idx}`} item={item} />
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

function PortfolioCard({ item }) {
  const { title, meta, tags, image } = item;
  return (
    <div className="v-card" style={{ overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 240, padding: 0 }}>
      {image ? (
        <img src={image} alt={title} style={{ width: "100%", height: 160, objectFit: "cover" }} loading="lazy" />
      ) : (
        <div style={{ height: 160, background: "linear-gradient(135deg, #e8eaed, #f0f2f5)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--subtle)", fontWeight: 600, fontSize: "0.9rem" }}>
          {title}
        </div>
      )}
      <div style={{ padding: "0.85rem 1rem", display: "grid", gap: "0.4rem" }}>
        <div style={{ fontWeight: 700, color: "var(--ink)" }}>{title}</div>
        <div style={{ color: "var(--muted)", fontSize: "0.9rem" }}>{meta}</div>
        {tags?.length > 0 && (
          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginTop: "0.15rem" }}>
            {tags.map((t) => (
              <span key={t} className="v-pill" style={{ fontSize: "0.75rem" }}>{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
