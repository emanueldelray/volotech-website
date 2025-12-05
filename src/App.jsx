// src/App.jsx
import React, { useState, useEffect } from "react";
import "./site.css";
import volotechLogo from "./assets/volotech-logo.png";
import AboutPage from "./about/AboutPage";   // 👈 add this line

/* ===== Auto-load images ===== */

// Service images (CNC, sheet, welding, assembly, etc.)
const serviceImages = (() => {
  const modules = import.meta.glob("./assets/services/*.{jpg,jpeg,png,webp}", {
    eager: true,
    as: "url",
  });

  const map = {};
  for (const [path, url] of Object.entries(modules)) {
    const file = path.split("/").pop() || "";
    const base = file.replace(/\.[^/.]+$/, ""); // remove extension
    map[base] = url;
  }
  return map;
})();

// One hero image (pick the first if multiple exist)
const heroImage = (() => {
  const modules = import.meta.glob("./assets/hero/*.{jpg,jpeg,png,webp}", {
    eager: true,
    as: "url",
  });
  const first = Object.values(modules)[0];
  return first || "";
})();

/* ===== Brand & Theme ===== */

const BRAND = {
  name: "Volotech",
  tagline: "Custom Metal & Plastic Components — Precision. Quality. Reliability.",
  email: "emanuel.chitic@volotech.de",
  phone: "+49 172 6518119",
  address: "Gersthofen · Bavaria, Germany",
  cta: "Request a Quote",
};

const BMW_BLUE = "#003DA5",
  LIGHT_GRAY = "#f4f6f8",
  MID_GRAY = "#e5e7eb",
  DARK_TEXT = "#111827",
  MID_TEXT = "#4b5563",
  ACCENT = "#ea580c";

/* ===== Force-overrides that beat any global CSS ===== */

function StyleFix() {
  return (
    <style>{`
      /* Keep nav links neutral; never forced blue */
      a.nav-plain { color: inherit !important; text-decoration: none !important; }

      /* Make RFQ CTA text always white */
      .btn-rfq { color: #ffffff !important; }

      /* Prevent any global anchor rules from recoloring CTA text on hover or active */
      .btn-rfq:link, .btn-rfq:visited, .btn-rfq:hover, .btn-rfq:active, .btn-rfq:focus {
        color: #ffffff !important;
      }
    `}</style>
  );
}

/* ===== Tiny hash router ===== */

function useHashRoute() {
  const [route, setRoute] = useState(window.location.hash || "#/");

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || "#/");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return route;
}

/* ===== App root ===== */

export default function App() {
  const route = useHashRoute();

  // 🔹 language state: default German
  const [lang, setLang] = useState("de"); // "de" or "en"

  const isManufacturing = route.startsWith("#/manufacturing");
  const isAssembly = route.startsWith("#/assembly");
  const isDigital = route.startsWith("#/digital");
  const isPortfolio = route.startsWith("#/portfolio");
  const isAbout = route.startsWith("#/about");
  const isImpressum = route.startsWith("#/impressum");
  const isPrivacy = route.startsWith("#/datenschutz");

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [route]);

  // Scroll-reveal: add .visible to .reveal elements when they enter viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          } else {
            entry.target.classList.remove("visible");
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    const els = document.querySelectorAll(".reveal");
    els.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [route]);

  // 🔹 choose page based on route
  let page;
  if (isManufacturing) page = <ManufacturingPage lang={lang} />;
  else if (isAssembly) page = <AssemblyPage lang={lang} />;
  else if (isDigital) page = <DigitalPage lang={lang} />;
  else if (isPortfolio) page = <PortfolioPage lang={lang} />;
  else if (isAbout) page = <AboutPage lang={lang} />;
  else if (isImpressum) page = <ImpressumPage />;
  else if (isPrivacy) page = <PrivacyPage />;
  else page = <HomePage lang={lang} />;

  return (
  <div
    className="min-h-screen"
    style={{ backgroundColor: LIGHT_GRAY, color: DARK_TEXT }}
  >
    <StyleFix />
    <Navbar lang={lang} setLang={setLang} />

    {/* Main content area */}
    <main>
      {page}
    </main>

    <Footer />
  </div>
);

/* ===== Reusable section header ===== */

export const SectionHeader = ({ title, subtitle }) => (

  <div className="reveal">
    <div className="flex items-start gap-3">
      {/* Vertical accent bar */}
      <div
        style={{
          width: "3px",
          borderRadius: "999px",
          backgroundColor: ACCENT,
          minHeight: "2.4rem",
          marginTop: "2px",
        }}
      />
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm sm:text-base" style={{ color: MID_TEXT }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  </div>
);

/* ===== Navbar ===== */

function Navbar({ lang, setLang }) {
  const isDe = lang === "de";

  return (
    <header className="site-header shadow-sm">
      <div className="max-w-6xl mx-auto nav-inner">
        {/* Logo + tagline */}
        <div className="flex items-center gap-3">
          <img
            src={volotechLogo}
            alt="Volotech Logo"
            style={{ height: 32 }}
          />
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Volotech
            </div>
            <div className="text-sm font-semibold text-neutral-900">
              Präzision. Qualität. Zuverlässigkeit.
            </div>
          </div>
        </div>

        {/* Main nav links */}
        <nav className="nav-links text-sm font-medium">
          <a href="#/" className="navlink">Start</a>
          <a href="#/manufacturing" className="navlink">Fertigung</a>
          <a href="#/assembly" className="navlink">Montage</a>
          <a href="#/digital" className="navlink">Digital</a>
          <a href="#/portfolio" className="navlink">Referenzen</a>
          <a href="#/about" className="navlink">Über uns</a>
        </nav>

        {/* Language switch + RFQ button */}
        <div className="nav-right flex items-center gap-3">
          <div className="flex items-center gap-1 border rounded-full px-2 py-[2px] bg-neutral-50">
            <button
              type="button"
              className="navlink"
              onClick={() => setLang("de")}
              style={{ fontWeight: lang === "de" ? 700 : 500 }}
            >
              DE
            </button>
            <span className="text-neutral-400">/</span>
            <button
              type="button"
              className="navlink"
              onClick={() => setLang("en")}
              style={{ fontWeight: lang === "en" ? 700 : 500 }}
            >
              EN
            </button>
          </div>

          <a
            href="#/manufacturing"
            className="btn btn-primary text-xs sm:text-sm"
          >
            Anfrage stellen
          </a>
        </div>
      </div>
    </header>
  );
}

/* =========================================================
   HOME PAGE – simple, less text, 3 main services overview
   ========================================================= */

/* ===== Home page ===== */
function HomePage({ lang }) {
  const isDe = lang === "de";

  return (
    <>
      {/* FULL-WIDTH HERO */}
      <section
        id="top"
        className="relative"
        style={{ minHeight: "60vh", borderBottom: `1px solid ${MID_GRAY}` }}
      >
        <div className="relative overflow-hidden" style={{ minHeight: "60vh" }}>
          {/* Background image + gradients */}
          <div className="absolute inset-0">
            {heroImage ? (
              <div
                className="w-full h-full"
                style={{
                  backgroundImage: `url(${heroImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  filter: "saturate(105%) contrast(102%)",
                }}
              />
            ) : (
              <div
                className="w-full h-full"
                style={{
                  background:
                    "radial-gradient(circle at 0% 0%, #1f2937 0, #020617 55%, #020617 100%)",
                }}
              />
            )}

            {/* Dark fading overlay */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 35%, rgba(0,0,0,0.20) 60%, rgba(0,0,0,0.75) 100%)",
              }}
            />
          </div>

          {/* Content */}
          <div className="relative max-w-6xl mx-auto px-5 py-16 lg:py-24 flex flex-col justify-center min-h-[60vh]">
            <div className="max-w-xl reveal">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-white">
                {isDe
                  ? "Engineering-geführte Fertigung & digitale Unterstützung für Automatisierung und Maschinenbau"
                  : "Engineering-led manufacturing & digital support for automation and machine builders"}
              </h1>
              <p className="mt-5 text-base sm:text-lg text-neutral-200">
                {isDe
                  ? "Volotech kombiniert CNC-Bearbeitung, Blech- und Schweißtechnik mit Montage und digitalen Services – damit Sie von der Zeichnung bis zur eingebauten Komponente mit möglichst wenigen Schnittstellen arbeiten."
                  : "Volotech combines CNC machining, sheet metal and welding capabilities with assembly and digital services — helping you move from drawing to installed components with fewer interfaces."}
              </p>

              <div className="mt-8 flex gap-3 flex-wrap">
                <a
                  href="#/manufacturing"
                  className="btn-rfq inline-flex items-center gap-2 rounded-md px-5 py-3 font-medium shadow-sm hover:opacity-90"
                  style={{ backgroundColor: BMW_BLUE }}
                >
                  {isDe ? "Fertigungsleistungen" : "Manufacturing services"}
                </a>
                <a
                  href="#/digital"
                  className="inline-flex items-center gap-2 rounded-md px-5 py-3 border text-sm sm:text-base"
                  style={{
                    borderColor: "rgba(255,255,255,0.7)",
                    backgroundColor: "rgba(15,23,42,0.4)",
                    color: "#e5e7eb",
                  }}
                >
                  {isDe ? "Digitale & Web-Unterstützung" : "Digital & web support"}
                </a>
              </div>
            </div>

            {/* Small translucent trust tiles */}
            <div className="mt-4 grid sm:grid-cols-3 gap-4 max-w-3xl reveal">
              {[
                isDe ? ["Qualität", "Partner mit ISO 9001"] : ["Quality", "ISO 9001 certified partners"],
                isDe
                  ? ["Netzwerk", "Europäisches Lieferantennetzwerk"]
                  : ["Network", "European supplier network"],
                isDe
                  ? ["Reaktionszeit", "RFQs in 24–48 Stunden beantwortet"]
                  : ["Response", "RFQs answered in 24–48 h"],
              ].map(([k, v], i) => (
                <div
                  key={i}
                  className="rounded-xl border px-4 py-3 text-sm"
                  style={{
                    borderColor: "rgba(148,163,184,0.45)",
                    backgroundColor: "rgba(15,23,42,0.75)",
                    color: "#e5e7eb",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <div className="text-xs uppercase tracking-wide text-sky-200/80">
                    {k}
                  </div>
                  <div className="mt-1 font-medium">{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WHAT WE DO – full-width fading photo rows using .home-row */}
      <section id="services" style={{ backgroundColor: "#fff" }}>
        {/* Section header in normal content width */}
        <div className="max-w-6xl mx-auto px-5 py-12">
          <SectionHeader
            title={isDe ? "Was wir tun" : "What we do"}
            subtitle={
              isDe
                ? "Drei Kernbereiche – Details klären wir auf den Unterseiten oder direkt im RFQ-Gespräch."
                : "Three core service areas — details live on the individual pages or RFQ discussion."
            }
          />
        </div>

        {/* Manufacturing row – image on the LEFT */}
        <div className="home-row reveal home-row-left">
          <div className="home-row-inner">
            <div
              className="home-row-media"
              style={{
                backgroundImage: (() => {
                  const img =
                    serviceImages.machining ||
                    serviceImages.milling ||
                    serviceImages.turning;
                  return img ? `url(${img})` : "linear-gradient(120deg,#0f172a,#1f2937)";
                })(),
              }}
            />
            <div className="home-row-content">
              <div className="text-xs uppercase tracking-wide text-neutral-500">
                {isDe ? "Fertigung" : "Manufacturing"}
              </div>
              <h3 className="mt-1 text-xl sm:text-2xl font-semibold text-neutral-900">
                {isDe
                  ? "CNC-Bearbeitung, Blechbearbeitung & Schweißen"
                  : "CNC machining, sheet metal & welding"}
              </h3>
              <p className="mt-3 text-sm sm:text-base" style={{ color: MID_TEXT }}>
                {isDe
                  ? "Präzisionsbauteile und Metallarbeiten aus Aluminium, Stahl, Edelstahl, Messing und technischen Kunststoffen – von Prototypen und Vorrichtungen bis zu Serien."
                  : "Precision components and metalwork in aluminum, steels, stainless, brass and engineering plastics — from prototypes and fixtures to small and medium series."}
              </p>
              <ul className="mt-3 text-sm" style={{ color: MID_TEXT }}>
                <li>
                  • {isDe
                    ? "CNC-Fräsen & Drehen für industrielle Bauteile"
                    : "CNC milling & turning for industrial components"}
                </li>
                <li>
                  • {isDe
                    ? "Blechzuschnitte und -kantungen"
                    : "Sheet metal cutting and bending"}
                </li>
                <li>
                  • {isDe
                    ? "Einfache geschweißte Rahmen und Halterungen"
                    : "Basic welded frames and brackets"}
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Assembly row – image on the RIGHT */}
        <div className="home-row reveal home-row-right">
          <div className="home-row-inner">
            <div className="home-row-content">
              <div className="text-xs uppercase tracking-wide text-neutral-500">
                {isDe ? "Montage & Integration" : "Assembly & Integration"}
              </div>
              <h3 className="mt-1 text-xl sm:text-2xl font-semibold text-neutral-900">
                {isDe
                  ? "Baugruppen, Kits und einfache Funktionsprüfungen"
                  : "Sub-assemblies, kitting and basic functional checks"}
              </h3>
              <p className="mt-3 text-sm sm:text-base" style={{ color: MID_TEXT }}>
                {isDe
                  ? "Einbaufertige Baugruppen, Kits und vorbereitete Einheiten, damit auf Ihrer Seite weniger Montageaufwand anfällt."
                  : "Ready-to-install sub-assemblies combining machined and sheet metal parts, with kitting, labeling and simple test setups when needed."}
              </p>
              <ul className="mt-3 text-sm" style={{ color: MID_TEXT }}>
                <li>
                  • {isDe
                    ? "Mechanische Baugruppen nach Ihrer Stückliste"
                    : "Mechanical sub-assemblies built to your BOM"}
                </li>
                <li>
                  • {isDe
                    ? "Kitting und Kennzeichnung nach Station / Projekt"
                    : "Kitting and labeling by station or project"}
                </li>
                <li>
                  • {isDe
                    ? "Visuelle und einfache Funktionsprüfungen"
                    : "Visual and basic functional checks"}
                </li>
              </ul>
            </div>
            <div
              className="home-row-media"
              style={{
                backgroundImage: serviceImages.assembly
                  ? `url(${serviceImages.assembly})`
                  : "linear-gradient(240deg,#0f172a,#1f2937)",
              }}
            />
          </div>
        </div>

        {/* Digital row – image LEFT again */}
        <div className="home-row reveal home-row-left">
          <div className="home-row-inner">
            <div
              className="home-row-media"
              style={{
                backgroundImage: (() => {
                  const img =
                    serviceImages.digital1 ||
                    serviceImages.digital2 ||
                    serviceImages.digital3;
                  return img
                    ? `url(${img})`
                    : "linear-gradient(120deg,#020617,#111827)";
                })(),
              }}
            />
            <div className="home-row-content">
              <div className="text-xs uppercase tracking-wide text-neutral-500">
                {isDe ? "Digitale Services" : "Digital Services"}
              </div>
              <h3 className="mt-1 text-xl sm:text-2xl font-semibold text-neutral-900">
                {isDe
                  ? "Web & RFQ-Flows für industrielle Unternehmen"
                  : "Web & RFQ flows for industrial companies"}
              </h3>
              <p className="mt-3 text-sm sm:text-base" style={{ color: MID_TEXT }}>
                {isDe
                  ? "Schlanke Websites und RFQ-Upload-Flows speziell für Fertiger und technische Dienstleister – mit Fokus auf Klarheit, Fähigkeiten und strukturierte Anfragen."
                  : "Lightweight websites and RFQ upload flows tailored for manufacturers and technical service providers — focused on clarity, capabilities and structured requests."}
              </p>
              <ul className="mt-3 text-sm" style={{ color: MID_TEXT }}>
                <li>
                  • {isDe
                    ? "Service-orientierte Websites für technische Zielgruppen"
                    : "Service-oriented websites for technical audiences"}
                </li>
                <li>
                  • {isDe
                    ? "Einfache RFQ- und Datei-Upload-Flows"
                    : "Simple RFQ and file upload flows"}
                </li>
                <li>
                  • {isDe
                    ? "Fokus auf Geschwindigkeit, Klarheit und mobile Nutzung"
                    : "Focus on speed, clarity and mobile usability"}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* WHY Volotech */}
      <section
        style={{
          backgroundColor: "#fff",
          borderTop: `1px solid ${MID_GRAY}`,
        }}
      >
        <div className="max-w-6xl mx-auto px-5 py-12">
          <SectionHeader
            title={isDe ? "Warum Volotech" : "Why Volotech"}
            subtitle={
              isDe
                ? "Kleines, engineering-geführtes Setup mit einem Netzwerk an ISO 9001 Partnern."
                : "A small, engineering-led setup with a network of ISO 9001 partners."
            }
          />
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            <div
              className="rounded-xl border bg-white p-5 shadow-sm reveal"
              style={{ borderColor: MID_GRAY }}
            >
              <div className="text-xs uppercase tracking-wide text-neutral-500">
                {isDe ? "Engineering-Hintergrund" : "Engineering background"}
              </div>
              <p className="mt-2 text-sm" style={{ color: MID_TEXT }}>
                {isDe
                  ? "Sie sprechen direkt mit einem Ingenieur mit Erfahrung in Automatisierungs- und Maschinenbauprojekten – nicht nur mit einem reinen Vertrieb."
                  : "You work directly with an engineer used to automation and machine-building projects — not a pure sales interface."}
              </p>
            </div>
            <div
              className="rounded-xl border bg-white p-5 shadow-sm reveal"
              style={{ borderColor: MID_GRAY }}
            >
              <div className="text-xs uppercase tracking-wide text-neutral-500">
                {isDe ? "Flexibles Netzwerk" : "Flexible network"}
              </div>
              <p className="mt-2 text-sm" style={{ color: MID_TEXT }}>
                {isDe
                  ? "Die Arbeit wird über ein kleines Netzwerk ausgewählter Partner in der EU verteilt, passend zu Bauraum, Material und Terminsituation."
                  : "Work is distributed across a small network of trusted partners in the EU to match envelope, material and lead-time requirements."}
              </p>
            </div>
            <div
              className="rounded-xl border bg-white p-5 shadow-sm reveal"
              style={{ borderColor: MID_GRAY }}
            >
              <div className="text-xs uppercase tracking-wide text-neutral-500">
                {isDe ? "Fokus auf Klarheit" : "Focus on clarity"}
              </div>
              <p className="mt-2 text-sm" style={{ color: MID_TEXT }}>
                {isDe
                  ? "Klare RFQs, realistische Lieferzeiten und frühzeitige Hinweise, wenn etwas kritisch aussieht – um Überraschungen spät im Projekt zu vermeiden."
                  : "Clear RFQs, realistic lead times and early flags if something looks risky — aiming to avoid surprises late in the project."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOME RFQ TEASER */}
      <section
        style={{
          backgroundColor: LIGHT_GRAY,
          borderTop: `1px solid ${MID_GRAY}`,
          borderBottom: `1px solid ${MID_GRAY}`,
        }}
      >
        <div className="max-w-6xl mx-auto px-5 py-10 grid lg:grid-cols-2 gap-8 items-center">
          <div className="reveal">
            <h2 className="text-2xl sm:text-3xl font-bold">
              {isDe
                ? "Haben Sie eine Zeichnung oder ein kleines Paket zu besprechen?"
                : "Have a drawing or small package to discuss?"}
            </h2>
            <p className="mt-3 text-sm sm:text-base" style={{ color: MID_TEXT }}>
              {isDe
                ? "Sie können mit einem Einzelteil, einer kleinen Vorrichtung oder einem gemischten RFQ-Paket starten. Hängen Sie STEP/PDF/DXF-Dateien an und schreiben Sie kurz dazu, was wichtiger ist – Kosten, Lieferzeit oder Flexibilität."
                : "You can start with a single part, a small fixture or a mixed RFQ package. Attach STEP/PDF/DXF files and a short note on priorities — cost, lead time or flexibility."}
            </p>
            <a
              href="#/manufacturing?rfq"
              className="btn-rfq inline-flex items-center gap-2 rounded-md px-5 py-3 mt-5 font-medium shadow-sm hover:opacity-90"
              style={{ backgroundColor: BMW_BLUE }}
            >
              {isDe ? "Zum RFQ-Formular" : "Go to RFQ form"}
            </a>
          </div>
          <div
            className="rounded-xl border bg-white p-5 shadow-sm text-sm reveal"
            style={{ borderColor: MID_GRAY }}
          >
            <div className="font-semibold mb-2">
              {isDe ? "Typische RFQ-Inhalte" : "Typical RFQ contents"}
            </div>
            <ul className="space-y-1" style={{ color: MID_TEXT }}>
              <li>
                • {isDe
                  ? "Zeichnungen (STEP, PDF, DXF/DWG etc.)"
                  : "Drawings (STEP, PDF, DXF/DWG etc.)"}
              </li>
              <li>
                • {isDe
                  ? "Material, Menge und Oberflächenbehandlung"
                  : "Material, quantity and finish"}
              </li>
              <li>
                • {isDe
                  ? "Wunschtermin und Lieferadresse"
                  : "Required date and shipping location"}
              </li>
              <li>
                • {isDe
                  ? "Kritische Toleranzen oder Funktionen"
                  : "Any critical tolerances or functions"}
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}


/* =========================================================
   MANUFACTURING PAGE – 3 subservices + capabilities + process
   ========================================================= */

function ManufacturingPage({ lang }) {
  const isDe = lang === "de";

  // If URL hash contains "&rfq", scroll to the RFQ section after render
  useEffect(() => {
    if (window.location.hash.includes("&rfq")) {
      const el = document.getElementById("rfq");
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth" });
        }, 0);
      }
    }
  }, []);

  const machiningBullets = isDe
    ? [
        "3- und 5-Achs-Fräsen plus CNC-Drehen",
        "Stahl, Edelstahl, Aluminium, Messing und technische Kunststoffe",
        "Typische Toleranz ±0,02 mm (bis 0,01 mm nach Rücksprache möglich)",
        "Prototypen, Vorrichtungen sowie Serienteile für den industriellen Einsatz",
      ]
    : [
        "3- and 5-axis milling plus CNC turning",
        "Steel, stainless, aluminum, brass and engineering plastics",
        "Typical tolerance ±0.02 mm (down to 0.01 mm on request)",
        "Prototypes, fixtures and small/medium series for industrial use",
      ];

  const sheetBullets = isDe
    ? [
        "Laserschneiden, Stanzen und Biegen von Stahl, Edelstahl und Aluminium",
        "Typischer Dickenbereich 1–10 mm für Stahl/Edelstahl, 1–8 mm für Aluminium",
        "Halter, Abdeckungen, Schutzbleche, einfache Gehäuse und Montageplatten",
        "Optionale Oberflächen: Pulverbeschichtung, Verzinken etc.",
      ]
    : [
        "Laser cutting, punching and bending of steel, stainless and aluminum",
        "Typical thickness range 1–10 mm for steel/stainless, 1–8 mm for aluminum",
        "Brackets, covers, guards, simple enclosures and mounting plates",
        "Optional surface treatments: powder coat, zinc, etc.",
      ];

  const weldingBullets = isDe
    ? [
        "WIG/MAG-Schweißen von Haltern, Rahmen und einfachen Konstruktionen",
        "Kleine bis mittelgroße Rahmen für Maschinen- und Automatisierungstechnik",
        "Vorrichtungen, Stützen und andere geschweißte Baugruppen",
        "Grundlegende Bearbeitung nach dem Schweißen (z. B. Planflächen, Bohrungen) auf Anfrage",
      ]
    : [
        "TIG/MIG welding of brackets, frames and simple structures",
        "Small to medium-sized frames for machines and automation equipment",
        "Jigs, supports and other fabricated assemblies",
        "Basic machining after welding (e.g. faces, bores) on request",
      ];

  const capabilityCards = isDe
    ? [
        [
          "Bearbeitungsbereich",
          "Fräsen bis ca. X 2000mm × Y 700mm × Z 700 mm, Drehen bis Ø 1000 mm × 3000 mm.",
        ],
        [
          "Blechbearbeitung",
          "Typische Blechdicken 0,5mm–20mm für Stahl/Edelstahl, 0,5mm–20mm für Aluminium (weitere Bereiche auf Anfrage).",
        ],
        [
          "Toleranzen",
          "±0,02 mm typisch bei gefrästen Teilen (bis 0,01 mm nach Rücksprache, abhängig von Geometrie und Aufspannung).",
        ],
        [
          "Werkstoffe",
          "Aluminium (z. B. 6082 / 7075), Stähle (S235 / S355 / 42CrMo4), Edelstähle (1.4301 / 1.4571), Messing, Kupfer, POM, PA, PET-G, PEEK*.",
        ],
        [
          "Losgrößen",
          "Von Einzelteil und Vorrichtung bis zu Serien. Größere Stückzahlen über Partner möglich.",
        ],
        [
          "Oberflächen",
          "Eloxieren, Verzinken, Brünieren, Pulverbeschichten, Gleitschleifen und Standard-Entgratung.",
        ],
      ]
    : [
        [
          "Machining envelope",
          "Milling up to approx. X 600 × Y 400 × Z 350 mm, turning Ø up to 300 mm × 500 mm.",
        ],
        [
          "Sheet metal envelope",
          "Typical thickness 1–10 mm for steel/stainless, 1–8 mm for aluminum (other ranges on request).",
        ],
        [
          "Tolerance",
          "±0.02 mm typical on machined parts (down to 0.01 mm on request, depending on geometry and setup).",
        ],
        [
          "Materials",
          "Aluminum (e.g. 6082 / 7075), steels (S235 / S355 / 42CrMo4), stainless (1.4301 / 1.4571), brass, copper, POM, PA, PET-G, PEEK*.",
        ],
        [
          "Batch sizes",
          "From 1 pc prototypes and one-off fixtures up to small/medium series. Higher volumes possible via partners.",
        ],
        [
          "Finishes",
          "Anodizing, zinc plating, black oxide, powder coating, vibratory finishing and basic deburring as standard.",
        ],
      ];

  const processSteps = isDe
    ? [
        [
          "RFQ hochladen",
          "Zeichnungen und Spezifikation senden (Werkstoff, Menge, Oberfläche, Termin). STEP, DXF/DWG, PDF, STL sind möglich.",
        ],
        [
          "Machbarkeit & Angebot",
          "Wir prüfen die Fertigbarkeit und senden innerhalb von 24–48 h Preis & Lieferzeit, inkl. Hinweis auf Risiken oder Alternativen.",
        ],
        [
          "Fertigung & Qualitätskontrolle",
          "Teile und Schweißbaugruppen werden bei ISO-9001-zertifizierten Partnern gefertigt und vor Versand geprüft.",
        ],
        [
          "Verpackung & Versand",
          "Sichere Verpackung, beschriftete Sets und nachverfolgbarer Versand an Ihre Adresse in der EU.",
        ],
      ]
    : [
        [
          "Upload RFQ",
          "Send drawings & specs (material, finish, quantity, required date). STEP, DXF/DWG, PDF, STL are all possible.",
        ],
        [
          "Feasibility & quote",
          "We check manufacturability and send pricing & lead time within 24–48 h, highlighting any risks or alternatives.",
        ],
        [
          "Manufacture & QC",
          "Parts or welded assemblies are produced with ISO 9001 certified partners and checked before shipping.",
        ],
        [
          "Packing & delivery",
          "Secure packaging, labeled sets and tracked shipping to your address in the EU.",
        ],
      ];

  return (
    <>
      <section style={{ backgroundColor: "#fff" }}>
        <div className="max-w-6xl mx-auto px-5 py-12">
          <SectionHeader
            title={isDe ? "Fertigungsdienstleistungen" : "Manufacturing services"}
            subtitle={
              isDe
                ? "CNC-Bearbeitung, Blechbearbeitung und Schweißen für industrielle Anwendungen."
                : "CNC machining, sheet metal and welding for industrial applications."
            }
          />

          <p className="mt-4 text-sm sm:text-base reveal" style={{ color: MID_TEXT }}>
            {isDe
              ? "Volotech liefert bearbeitete und gefertigte Teile aus Aluminium, Stählen, Edelstahl, Messing und technischen Kunststoffen – mit Schwerpunkt auf Komponenten für Automatisierung, Maschinenbau, Vorrichtungen und Industriehardware. Einzelteile und Prototypen sind genauso willkommen wie wiederkehrende Serienteile."
              : "Volotech supplies machined and fabricated parts in aluminum, steels, stainless, brass and engineering plastics — focusing on components for automation, machine building, fixtures and industrial hardware. Prototypes and one-off fixtures are just as welcome as recurring small and medium series."}
          </p>

          <div className="mt-8 grid md:grid-cols-3 gap-6">
            <ServiceCard
              title={isDe ? "CNC-Bearbeitung" : "CNC Machining"}
              img={
                serviceImages.machining ||
                serviceImages.milling ||
                serviceImages.turning
              }
              bullets={machiningBullets}
            />

            <ServiceCard
              title={isDe ? "Blechbearbeitung" : "Sheet Metal Fabrication"}
              img={
                serviceImages.sheet ||
                serviceImages["sheet-metal"] ||
                serviceImages.laser
              }
              bullets={sheetBullets}
            />

            <ServiceCard
              title={isDe ? "Schweißen & Metallstrukturen" : "Welding & Metal Structures"}
              img={serviceImages.welding}
              bullets={weldingBullets}
            />
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section
        style={{ backgroundColor: LIGHT_GRAY, borderTop: `1px solid ${MID_GRAY}` }}
      >
        <div className="max-w-6xl mx-auto px-5 py-12">
          <SectionHeader
            title={
              isDe ? "Praktische Bereiche & Fähigkeiten" : "Practical envelope & capabilities"
            }
            subtitle={
              isDe
                ? "Zahlen, die bei der Beurteilung der Machbarkeit helfen – Grenzfälle können Sie jederzeit anfragen."
                : "Numbers to help you judge feasibility — edge cases are always worth asking about."
            }
          />
          <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilityCards.map(([k, v], i) => (
              <div
                key={i}
                className="rounded-xl border bg-white p-5 shadow-sm reveal"
                style={{ borderColor: MID_GRAY }}
              >
                <div className="text-xs uppercase tracking-wide text-neutral-500">
                  {k}
                </div>
                <div className="font-semibold mt-1 text-sm">{v}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-neutral-500 text-xs reveal">
            {isDe
              ? "Messprotokolle, Werkszeugnisse und PPAP-ähnliche Dokumentation sind auf Anfrage für kritische Teile und Vorrichtungen möglich. Alle Fertigungspartner arbeiten nach ISO-9001-Qualitätssystemen. * Hochtemperaturkunststoffe und Sonderlegierungen nach Machbarkeits- und Verfügbarkeitsprüfung."
              : "Measurement reports, material certificates and PPAP-style documentation are available on request for critical parts and fixtures. All manufacturing partners operate under ISO 9001 quality systems. * High-temperature plastics and special alloys subject to feasibility and availability."}
          </p>
        </div>
      </section>

      {/* Process */}
      <section
        style={{
          backgroundColor: "#fff",
          borderTop: `1px solid ${MID_GRAY}`,
          borderBottom: `1px solid ${MID_GRAY}`,
        }}
      >
        <div className="max-w-6xl mx-auto px-5 py-12">
          <SectionHeader
            title={isDe ? "Von der Anfrage bis zur Lieferung" : "From RFQ to delivery"}
            subtitle={
              isDe
                ? "Ein schlanker Ablauf, ausgelegt für vielbeschäftigte Projektingenieure und Einkäufer."
                : "A simple path designed for busy project engineers and buyers."
            }
          />
          <div className="mt-8 grid md:grid-cols-4 gap-6">
            {processSteps.map(([title, desc], i) => (
              <div
                key={i}
                className="relative rounded-xl border bg-white p-5 shadow-sm reveal"
                style={{ borderColor: MID_GRAY }}
              >
                <div className="font-semibold">{title}</div>
                <p className="mt-2 text-sm" style={{ color: MID_TEXT }}>
                  {desc}
                </p>
                <span className="step-dot" style={{ backgroundColor: BMW_BLUE }}>
                  {i + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RFQ for manufacturing */}
      <RFQSection lang={lang} />
    </>
  );
}
/* =========================================================
   ASSEMBLY & INTEGRATION PAGE
   ========================================================= */

function AssemblyPage({ lang }) {
  const isDe = lang === "de";

  return (
    <>
      <section style={{ backgroundColor: "#fff" }}>
        <div className="max-w-6xl mx-auto px-5 py-12">
          <SectionHeader
            title={isDe ? "Montage & Integration" : "Assembly & integration"}
            subtitle={
              isDe
                ? "Von Einzelteilen zu einbaufertigen Baugruppen."
                : "From individual parts to ready-to-install sub-assemblies."
            }
          />
          <p className="mt-4 text-sm sm:text-base reveal" style={{ color: MID_TEXT }}>
            {isDe
              ? "Anstatt nur lose Teile zu erhalten und alles intern zu montieren, können Sie einen Teil der Arbeit auslagern: Volotech koordiniert Bearbeitung, Blech, Schweißen und einfache Montageschritte, sodass Sie einbaufertige Baugruppen, Kits oder Module erhalten."
              : "Instead of receiving loose parts and building everything in-house, you can offload part of the work: Volotech can coordinate machining, sheet metal, welding and basic assembly steps so that you receive ready-to-install sub-assemblies, kitted sets or modules."}
          </p>

          <div className="mt-8 grid md:grid-cols-3 gap-6">
            <div
              className="rounded-xl border bg-white p-5 shadow-sm reveal"
              style={{ borderColor: MID_GRAY }}
            >
              <div className="text-xs uppercase tracking-wide text-neutral-500">
                {isDe ? "Mechanische Baugruppen" : "Mechanical sub-assemblies"}
              </div>
              <div className="font-semibold mt-1 mb-2">
                {isDe ? "Auf Basis Ihrer Stückliste" : "Built from your BOM"}
              </div>
              <p className="text-sm" style={{ color: MID_TEXT }}>
                {isDe
                  ? "Baugruppen aus bearbeiteten Teilen, Blechteilen, Normteilen und Kaufteilen können vormontiert werden, sodass Sie nur noch die Endmontage in Ihrer Linie oder Maschine durchführen."
                  : "Sub-assemblies consisting of machined parts, sheet metal, fasteners and standard components can be pre-assembled so you only need to perform final integration on your line or machine."}
              </p>
              <ul className="mt-3 text-sm" style={{ color: MID_TEXT }}>
                <li>• {isDe ? "Halter & Träger mit montierten Komponenten" : "Brackets & carriers with mounted components"}</li>
                <li>• {isDe ? "Einfache Rahmen mit montierten Blechen oder Schutzblechen" : "Simple frames with attached plates or guards"}</li>
                <li>• {isDe ? "Vorbereitete Module für Automatisierung und Intralogistik" : "Prepared modules for automation and intralogistics"}</li>
              </ul>
            </div>

            <div
              className="rounded-xl border bg-white p-5 shadow-sm reveal"
              style={{ borderColor: MID_GRAY }}
            >
              <div className="text-xs uppercase tracking-wide text-neutral-500">
                {isDe ? "Kitting & Kennzeichnung" : "Kitting & labeling"}
              </div>
              <div className="font-semibold mt-1 mb-2">
                {isDe
                  ? "Bereit für Linie oder Montageort"
                  : "Ready for your assembly line or field install"}
              </div>
              <p className="text-sm" style={{ color: MID_TEXT }}>
                {isDe
                  ? "Komponenten können zu Kits pro Station, pro Maschinenseite oder pro Montageeinheit gruppiert werden – mit Etiketten nach Ihren Teilenummern und Positionen."
                  : "Components can be grouped into kits per station, per side of a machine or per installation unit, with labels referencing your internal part numbers and positions."}
              </p>
              <ul className="mt-3 text-sm" style={{ color: MID_TEXT }}>
                <li>• {isDe ? "Kits passend zu Ihrer Montagereihenfolge" : "Kits matched to your assembly sequence"}</li>
                <li>• {isDe ? "Kennzeichnung nach Ihren Teilenummern" : "Labeling according to your part numbers"}</li>
                <li>• {isDe ? "Übersichtliche Packlisten für den Wareneingang" : "Clear packing lists for incoming inspection"}</li>
              </ul>
            </div>

            <div
              className="rounded-xl border bg-white p-5 shadow-sm reveal"
              style={{ borderColor: MID_GRAY }}
            >
              <div className="text-xs uppercase tracking-wide text-neutral-500">
                {isDe ? "Einfache Funktionsprüfungen" : "Basic functional checks"}
              </div>
              <div className="font-semibold mt-1 mb-2">
                {isDe ? "Wenn einfache Tests sinnvoll sind" : "Simple test setups when useful"}
              </div>
              <p className="text-sm" style={{ color: MID_TEXT }}>
                {isDe
                  ? "Für ausgewählte Baugruppen können einfache mechanische Prüfungen und Passproben vor dem Versand durchgeführt werden, um Überraschungen bei der Montage zu reduzieren."
                  : "For selected assemblies, simple mechanical checks and fit-up tests can be performed before shipping, reducing surprises during installation."}
              </p>
              <ul className="mt-3 text-sm" style={{ color: MID_TEXT }}>
                <li>• {isDe ? "Passproben für Schnittstellen und Fügeflächen" : "Fit-checks for mating parts and interfaces"}</li>
                <li>• {isDe ? "Überprüfung von Grundbewegungen / Freigängen" : "Verification of basic motion / clearance"}</li>
                <li>• {isDe ? "Dokumentation der Prüfungen auf Wunsch" : "Documentation of checks on request"}</li>
              </ul>
            </div>
          </div>

          <div className="mt-10 grid lg:grid-cols-2 gap-8">
            <div
              className="rounded-xl border bg-white p-5 shadow-sm reveal"
              style={{ borderColor: MID_GRAY }}
            >
              <h3 className="font-semibold">
                {isDe
                  ? "Wann lohnt sich Montage & Integration?"
                  : "When does assembly & integration make sense?"}
              </h3>
              <ul className="mt-3 text-sm" style={{ color: MID_TEXT }}>
                <li>
                  •{" "}
                  {isDe
                    ? "Ihr internes Montageteam ist stark ausgelastet mit komplexen Aufgaben."
                    : "Your internal assembly team is busy with complex work."}
                </li>
                <li>
                  •{" "}
                  {isDe
                    ? "Sie möchten weniger Schnittstellen und Bestellungen koordinieren."
                    : "You want fewer interfaces and POs to manage."}
                </li>
                <li>
                  •{" "}
                  {isDe
                    ? "Sie benötigen wiederholbare Kitting- und Etikettierlogik über Projekte hinweg."
                    : "You need repeatable kitting and labeling across projects."}
                </li>
                <li>
                  •{" "}
                  {isDe
                    ? "Prototypen und erste Serien sollen möglichst „plug-and-play“ ankommen."
                    : "You want prototypes and first series to arrive “almost plug-and-play”."}
                </li>
              </ul>
            </div>

            <div
              className="rounded-xl border bg-white p-5 shadow-sm reveal"
              style={{ borderColor: MID_GRAY }}
            >
              <h3 className="font-semibold">
                {isDe ? "Wie passt das zur Fertigung?" : "How it fits with manufacturing"}
              </h3>
              <p className="mt-2 text-sm" style={{ color: MID_TEXT }}>
                {isDe
                  ? "Montage & Integration baut auf denselben Fertigungsmöglichkeiten auf: CNC-Bearbeitung, Blechbearbeitung und Schweißen. Volotech koordiniert, welche Teile wo gefertigt werden und führt diese zu Baugruppen zusammen – Sie erhalten weniger Einzellieferungen und haben weniger Koordinationsaufwand intern."
                  : "Assembly & integration builds on the same manufacturing capabilities: CNC machining, sheet metal and welding. Volotech can coordinate which parts are produced where and bring them together into assemblies — so you receive fewer separate deliveries and have less coordination work in-house."}
              </p>
              <p className="mt-2 text-sm" style={{ color: MID_TEXT }}>
                {isDe
                  ? "Falls Sie bereits eigene Lieferanten für bestimmte Teile haben, können diese ebenfalls eingebunden werden: Ziel ist es, Reibung in Ihren Projekten zu reduzieren – nicht, alles zwingend über einen Kanal abzuwickeln."
                  : "If you already have your own suppliers for some parts, that is also possible: the focus is to reduce friction for your projects, not to force everything into one channel."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* RFQ for assembly */}
      <RFQSection lang={lang} />
    </>
  );
}

/* =========================================================
   DIGITAL SERVICES PAGE
   ========================================================= */

function DigitalPage({ lang }) {
  const isDe = lang === "de";

  return (
    <>
      <section style={{ backgroundColor: "#fff" }}>
        <div className="max-w-6xl mx-auto px-5 py-12">
          <SectionHeader
            title={isDe ? "Digitale Services" : "Digital services"}
            subtitle={
              isDe
                ? "Web- und Tooling-Unterstützung mit Fokus auf Industrie- und Engineering-Unternehmen."
                : "Web and tooling support focused on industrial and engineering businesses."
            }
          />
          <p className="mt-4 text-sm sm:text-base reveal" style={{ color: MID_TEXT }}>
            {isDe
              ? "Viele kleine und mittlere Industrieunternehmen kämpfen mit veralteten Websites, unklaren Leistungsbeschreibungen und fehlenden Anfrage-Workflows. Volotech bietet eine begrenzte Anzahl digitaler Projekte an – mit Fokus auf klare Kommunikation und praktische Werkzeuge statt auf „bunte“ Marketingeffekte."
              : "Many small and mid-sized industrial companies struggle with outdated websites, unclear service descriptions and missing RFQ flows. Volotech offers a limited number of digital projects, focused on clear communication and practical tools rather than fancy marketing."}
          </p>

          <div className="mt-8 grid md:grid-cols-3 gap-6">
            <div
              className="rounded-xl border bg-white p-5 shadow-sm reveal"
              style={{ borderColor: MID_GRAY }}
            >
              <div className="text-xs uppercase tracking-wide text-neutral-500">
                {isDe
                  ? "Service- & Portfolio-Websites"
                  : "Service & portfolio websites"}
              </div>
              <div className="font-semibold mt-1 mb-2">
                {isDe
                  ? "Klare Positionierung für technische Einkäufer"
                  : "Clear positioning for technical buyers"}
              </div>
              <p className="text-sm" style={{ color: MID_TEXT }}>
                {isDe
                  ? "Schlanke, schnelle Websites, die Ihre Leistungen, Fähigkeiten und typische Projekte in einer Sprache erklären, die Ingenieure und Einkäufer tatsächlich verwenden."
                  : "Lightweight, fast websites that explain your services, capabilities and typical projects in a language that engineers and purchasers actually use."}
              </p>
              <ul className="mt-3 text-sm" style={{ color: MID_TEXT }}>
                <li>
                  •{" "}
                  {isDe
                    ? "Struktur & Formulierungen für industrielle Zielgruppen"
                    : "Structure & wording for industrial audiences"}
                </li>
                <li>
                  •{" "}
                  {isDe
                    ? "Fokus auf Leistungen, Fähigkeiten und RFQ-Pfade"
                    : "Focus on services, capabilities and RFQ paths"}
                </li>
                <li>
                  •{" "}
                  {isDe
                    ? "Mobilfreundlich und einfach zu pflegen"
                    : "Mobile-friendly and easy to maintain"}
                </li>
              </ul>
            </div>

            <div
              className="rounded-xl border bg-white p-5 shadow-sm reveal"
              style={{ borderColor: MID_GRAY }}
            >
              <div className="text-xs uppercase tracking-wide text-neutral-500">
                {isDe ? "RFQ- & Upload-Flows" : "RFQ & upload flows"}
              </div>
              <div className="font-semibold mt-1 mb-2">
                {isDe
                  ? "Es einfacher machen, Ihnen Arbeit zu schicken"
                  : "Make it easier to send you work"}
              </div>
              <p className="text-sm" style={{ color: MID_TEXT }}>
                {isDe
                  ? "Einfache Anfrageformulare und Upload-Flows, die Kunden durch die Informationen führen, die Sie benötigen: Materialien, Mengen, Termine, Zeichnungen und Prioritäten."
                  : "Simple RFQ forms and upload flows that guide customers to provide the information you need: materials, quantities, deadlines, drawings and priorities."}
              </p>
              <ul className="mt-3 text-sm" style={{ color: MID_TEXT }}>
                <li>
                  • {isDe ? "Datei-Uploads für STEP, DXF, PDF usw." : "File uploads for STEP, DXF, PDF, etc."}
                </li>
                <li>
                  •{" "}
                  {isDe
                    ? "Strukturierte Fragen, um Rückfragen zu reduzieren"
                    : "Structured questions to avoid back-and-forth"}
                </li>
                <li>
                  •{" "}
                  {isDe
                    ? "E-Mail-basierte Abläufe oder leichte Integrationen"
                    : "Email-based flows or light integrations"}
                </li>
              </ul>
            </div>

            <div
              className="rounded-xl border bg-white p-5 shadow-sm reveal"
              style={{ borderColor: MID_GRAY }}
            >
              <div className="text-xs uppercase tracking-wide text-neutral-500">
                {isDe ? "Einfache interne Tools" : "Simple internal tooling"}
              </div>
              <div className="font-semibold mt-1 mb-2">
                {isDe
                  ? "Dashboards & Helfer für kleine Teams"
                  : "Dashboards & helpers for small teams"}
              </div>
              <p className="text-sm" style={{ color: MID_TEXT }}>
                {isDe
                  ? "In ausgewählten Fällen können schlanke Dashboards oder kleine Tools entstehen, die Angebote, Projektstatus oder Dokumentation in Ihrem Team unterstützen."
                  : "For selected cases, lightweight dashboards or small tools can be built to support quoting, project tracking or documentation inside your team."}
              </p>
              <ul className="mt-3 text-sm" style={{ color: MID_TEXT }}>
                <li>
                  •{" "}
                  {isDe
                    ? "Einfache interne Übersichten zu RFQs oder Projekten"
                    : "Simple internal views on RFQs or projects"}
                </li>
                <li>
                  •{" "}
                  {isDe
                    ? "Pragmatische Lösungen statt großer Systeme"
                    : "Pragmatic solutions instead of big systems"}
                </li>
                <li>
                  •{" "}
                  {isDe
                    ? "Anpassung an Ihre tatsächliche Arbeitsweise"
                    : "Tailored to how your team actually works"}
                </li>
              </ul>
            </div>
          </div>

          <p className="mt-6 text-xs text-neutral-500 reveal">
            {isDe
              ? "Digitale Projekte werden in begrenzter Anzahl parallel zur Fertigung und Montage übernommen, mit Priorität für industrie- und engineering-orientierte Unternehmen."
              : "Digital projects are taken on in limited volume alongside manufacturing and assembly work, with priority given to industrial and engineering-focused companies."}
          </p>
        </div>
      </section>

      {/* RFQ for digital */}
      <RFQSection lang={lang} />
    </>
  );
}

/* =========================================================
   SHARED RFQ SECTION (used on all pages)
   ========================================================= */

function RFQSection(props) {
  const { lang } = props;
  const [files, setFiles] = useState([]);
  const isDe = lang === "de";

  return (
    <section id="rfq">
      <div className="max-w-6xl mx-auto px-5 py-12 grid lg:grid-cols-2 gap-10 items-start">
        <div className="reveal">
          <SectionHeader
            title={isDe ? "Angebot anfordern" : "Request a quote"}
            subtitle={
              isDe
                ? "Zeichnungen anhängen und kurz Ihre Prioritäten nennen: Kosten, Lieferzeit oder Flexibilität."
                : "Attach drawings and tell us your priorities: cost, lead time or flexibility."
            }
          />
          <Dropzone files={files} setFiles={setFiles} />
          <RFQForm
            brandEmail={BRAND.email}
            files={files}
            setFiles={setFiles}
            lang={lang}
          />
        </div>
        <aside
          className="rounded-xl border bg-white p-6 shadow-sm reveal"
          style={{ borderColor: MID_GRAY }}
        >
          <h3 className="font-semibold text-lg">{isDe ? "Kontakt" : "Contact"}</h3>
          <p className="mt-2 text-neutral-600">
            {BRAND.name} — {BRAND.tagline}
          </p>
          <div className="mt-4 space-y-1 text-sm">
            <p>Email: {BRAND.email}</p>
            <p>Phone: {BRAND.phone}</p>
            <p>Address: {BRAND.address}</p>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
            {(isDe
              ? [
                  "Partner mit ISO 9001",
                  "Versand in der EU",
                  "PPAP/Reports auf Anfrage",
                  "NDA möglich",
                ]
              : [
                  "ISO 9001 certified partners",
                  "EU-wide shipping",
                  "PPAP / reports on request",
                  "NDA available",
                ]
            ).map((c, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1"
                style={{ borderColor: MID_GRAY, backgroundColor: "#fff", color: MID_TEXT }}
              >
                {c}
              </span>
            ))}
          </div>
          <p className="mt-4 text-xs text-neutral-500">
            {isDe
              ? "Sie können auch Anforderungen zu digitalen Services oder Montage direkt in der RFQ-Nachricht erwähnen – derselbe Kontakt betreut alle Leistungsbereiche."
              : "You can also mention digital services or assembly requirements directly in your RFQ message — the same contact handles all service areas."}
          </p>
        </aside>
      </div>
    </section>
  );
}

/* =========================================================
   SERVICE CARD – uses your CSS hover effects
   ========================================================= */

function ServiceCard(props) {
  const { title, img, bullets } = props;
  const [broken, setBroken] = useState(false);
  const showImg = img && !broken;

  return (
    <article className="service-card reveal">
      <div className="service-media">
        {showImg ? (
          <img
            src={img}
            alt={title}
            className="service-image"
            onError={() => setBroken(true)}
          />
        ) : (
          <div className="service-placeholder">Image coming soon</div>
        )}
        <div className="service-overlay">
          <div className="service-title">{title}</div>
        </div>
      </div>
      <div className="service-body">
        <ul>
          {bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}

/* =========================================================
   PORTFOLIO PAGE
   ========================================================= */

function PortfolioPage() {
  const modules = import.meta.glob("./portfolio/*.{jpg,jpeg,png,webp}", {
    eager: true,
    as: "url",
  });

  const toTitle = (s) =>
    s
      .replace(/\.[^/.]+$/, "")
      .replace(/^[0-9._-]+/, "")
      .replace(/[-_]+/g, " ")
      .trim()
      .replace(/\b\w/g, (m) => m.toUpperCase());

  const items = Object.entries(modules)
    .map(([path, url]) => {
      const file = path.split("/").pop() || "";
      return { src: url, title: toTitle(file) || "Untitled" };
    })
    .sort((a, b) => a.src.localeCompare(b.src));

  const [active, setActive] = useState(-1);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (active < 0) return;
      if (e.key === "Escape") setActive(-1);
      if (e.key === "ArrowRight") setActive((i) => (i + 1) % items.length);
      if (e.key === "ArrowLeft") setActive((i) => (i - 1 + items.length) % items.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, items.length]);

  return (
    <main id="portfolio-top" className="py-14">
      <div className="max-w-6xl mx-auto px-5">
        <SectionHeader
          title="Portfolio"
          subtitle="Sample parts and assemblies from recent work."
        />

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((it, i) => (
            <article
              key={i}
              className="overflow-hidden rounded-xl border bg-white shadow-sm hover:shadow-md transition reveal"
              style={{ borderColor: MID_GRAY }}
            >
              <button
                onClick={() => setActive(i)}
                title="Open"
                className="relative w-full cursor-zoom-in"
                style={{ paddingTop: "66.66%" }}
              >
                <img
                  src={it.src}
                  alt={it.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.25) 100%)",
                  }}
                />
                <div
                  className="absolute bottom-0 left-0 right-0 p-3 text-white text-sm font-medium"
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,.4)" }}
                >
                  {it.title}
                </div>
              </button>
            </article>
          ))}
        </div>

        {items.length === 0 && (
          <div className="mt-10 text-neutral-600 text-sm reveal">
            No images found. Add files under <code>src/portfolio/</code> (jpg, jpeg, png, webp).
          </div>
        )}
      </div>

      {active >= 0 && (
        <div
          onClick={() => setActive(-1)}
          className="fixed inset-0 z-50"
          style={{ background: "rgba(10,12,16,.85)" }}
        >
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <img
              src={items[active].src}
              alt={items[active].title}
              className="max-h-[86vh] max-w-[92vw] rounded-lg shadow-2xl"
              style={{ boxShadow: "0 20px 60px rgba(0,0,0,.5)" }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setActive((i) => (i - 1 + items.length) % items.length);
            }}
            className="lightbox-btn left"
          >
            ←
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActive((i) => (i + 1) % items.length);
            }}
            className="lightbox-btn right"
          >
            →
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActive(-1);
            }}
            className="lightbox-close"
          >
            ✕
          </button>

          <div className="absolute left-4 bottom-4 right-4 text-center text-white/80 text-sm">
            {items[active].title}
          </div>
        </div>
      )}
    </main>
  );
}

/* =========================================================
   IMPRESSUM PAGE
   ========================================================= */

function ImpressumPage() {
  return (
    <main className="py-14">
      <div className="max-w-4xl mx-auto px-5">
        <SectionHeader
          title="Impressum"
          subtitle="Angaben gemäß § 5 TMG."
        />

        <div className="mt-6 space-y-4 text-sm" style={{ color: MID_TEXT }}>
          <p>
            <strong>{BRAND.name} – Einzelunternehmen</strong>
            <br />
            Inhaber: <strong>Emanuel Gabriel Chitic</strong>
            <br />
            Staudenweg 6
            <br />
            86368 Gersthofen
            <br />
            Deutschland
          </p>

          <p>
            <strong>Kontakt:</strong>
            <br />
            Telefon: +49 172 6518119
            <br />
            E-Mail: emanuel.chitic@volotech.de
          </p>

          <p>
            <strong>Umsatzsteuer-ID:</strong>
            <br />
            Eine Umsatzsteuer-Identifikationsnummer wird nach Registrierung beim Finanzamt ergänzt.
          </p>

          <p>
            <strong>Aufsichtsbehörde:</strong>
            <br />
            Industrie- und Handelskammer Schwaben (IHK Schwaben)
            <br />
            Stettenstraße 1+3
            <br />
            86150 Augsburg
          </p>

          <p>
            <strong>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV:</strong>
            <br />
            Emanuel Gabriel Chitic
            <br />
            Staudenweg 6
            <br />
            86368 Gersthofen
          </p>

          <h3 className="mt-6 font-semibold text-neutral-800">
            Haftung für Inhalte
          </h3>
          <p>
            Als Diensteanbieter bin ich gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den
            allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG bin ich jedoch nicht verpflichtet,
            übermittelte oder gespeicherte fremde Informationen zu überwachen oder Umstände zu erforschen,
            die auf eine rechtswidrige Tätigkeit hinweisen.
          </p>
          <p>
            Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen
            Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt
            der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden
            Rechtsverletzungen werde ich diese Inhalte umgehend entfernen.
          </p>

          <h3 className="mt-6 font-semibold text-neutral-800">
            Haftung für Links
          </h3>
          <p>
            Mein Angebot enthält ggf. Links zu externen Webseiten Tritter, auf deren Inhalte ich keinen
            Einfluss habe. Deshalb kann ich für diese fremden Inhalte auch keine Gewähr übernehmen. Für die
            Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten
            verantwortlich.
          </p>
          <p>
            Bei Bekanntwerden von Rechtsverletzungen werde ich derartige Links umgehend entfernen.
          </p>

          <h3 className="mt-6 font-semibold text-neutral-800">
            Urheberrecht
          </h3>
          <p>
            Die durch den Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem
            deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der
            Verwertung außerhalb der Grenzen des Urheberrechts bedürfen der schriftlichen Zustimmung des
            jeweiligen Autors bzw. Erstellers.
          </p>
          <p>
            Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch
            gestattet.
          </p>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   DATENSCHUTZ PAGE
   ========================================================= */

function PrivacyPage() {
  return (
    <main className="py-14">
      <div className="max-w-4xl mx-auto px-5">
        <SectionHeader
          title="Datenschutzerklärung"
          subtitle="Informationen zur Verarbeitung personenbezogener Daten (DSGVO)."
        />

        <div className="mt-6 space-y-4 text-sm" style={{ color: MID_TEXT }}>
          <h3 className="font-semibold text-neutral-800">1. Verantwortlicher</h3>
          <p>
            Verantwortlich für die Datenverarbeitung auf dieser Website ist:
            <br />
            <strong>{BRAND.name} – Einzelunternehmen</strong>
            <br />
            Inhaber: Emanuel Gabriel Chitic
            <br />
            Staudenweg 6
            <br />
            86368 Gersthofen
            <br />
            Deutschland
            <br />
            Telefon: +49 172 6518119
            <br />
            E-Mail: emanuel.chitic@volotech.de
          </p>

          <h3 className="font-semibold text-neutral-800">2. Allgemeine Hinweise</h3>
          <p>
            Ich nehme den Schutz Ihrer persönlichen Daten sehr ernst. Personenbezogene Daten werden
            vertraulich und entsprechend den gesetzlichen Datenschutzvorschriften sowie dieser
            Datenschutzerklärung behandelt.
          </p>
          <p>
            Auf dieser Website werden keine Cookies, keine Tracking-Tools und keine Social-Media-Plugins
            eingesetzt.
          </p>

          <h3 className="font-semibold text-neutral-800">3. Server-Logfiles</h3>
          <p>
            Beim Aufrufen dieser Website erfasst der Provider automatisch Informationen in sogenannten
            Server-Logfiles, z. B.:
          </p>
          <ul className="list-disc list-inside">
            <li>Browsertyp und Browserversion</li>
            <li>verwendetes Betriebssystem</li>
            <li>Referrer-URL</li>
            <li>Hostname des zugreifenden Rechners</li>
            <li>Uhrzeit der Serveranfrage</li>
            <li>IP-Adresse</li>
          </ul>
          <p>
            Diese Daten sind nicht bestimmten Personen zuordenbar. Eine Zusammenführung dieser Daten mit
            anderen Datenquellen wird nicht vorgenommen.
          </p>
          <p>
            Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem technisch
            fehlerfreien Betrieb der Website).
          </p>

          <h3 className="font-semibold text-neutral-800">4. RFQ-Formular / Kontaktaufnahme</h3>
          <p>
            Wenn Sie mir über das RFQ-Formular oder per E-Mail eine Anfrage senden, werden Ihre Angaben
            einschließlich der von Ihnen dort angegebenen Kontaktdaten zum Zweck der Bearbeitung der
            Anfrage und für den Fall von Anschlussfragen gespeichert.
          </p>
          <p>Verarbeitete Daten können insbesondere sein:</p>
          <ul className="list-disc list-inside">
            <li>Name</li>
            <li>E-Mail-Adresse</li>
            <li>Firmenname (optional)</li>
            <li>Ihre Nachricht / Spezifikation</li>
            <li>Anhänge (z. B. PDF, STEP, DXF, DWG, ZIP, usw.)</li>
          </ul>
          <p>
            Die Übermittlung erfolgt per E-Mail an: <strong>emanuel.chitic@volotech.de</strong>
          </p>
          <p>
            Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahmen) bzw. Art. 6
            Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Bearbeitung von Anfragen).
          </p>
          <p>
            Die Daten werden gelöscht, sobald der Zweck entfällt und keine gesetzlichen
            Aufbewahrungspflichten mehr bestehen.
          </p>

          <h3 className="font-semibold text-neutral-800">5. Verarbeitung von Dateien (RFQ-Anhänge)</h3>
          <p>
            Hochgeladene oder per E-Mail gesendete Dateien werden ausschließlich zur Prüfung der
            Machbarkeit, Angebotserstellung und Kommunikation im Rahmen des Projekts genutzt.
          </p>
          <p>
            Zugriff erhalten nur ich sowie ggf. ausgewählte Fertigungspartner, sofern dies für das
            Angebot oder die Auftragsabwicklung erforderlich ist. Auf Wunsch kann hierfür eine
            Vertraulichkeitsvereinbarung (NDA) abgeschlossen werden.
          </p>

          <h3 className="font-semibold text-neutral-800">6. Weitergabe an Dritte</h3>
          <p>
            Eine Weitergabe Ihrer Daten an Dritte erfolgt nur, wenn dies zur Vertragserfüllung notwendig
            ist, Sie ausdrücklich eingewilligt haben oder eine gesetzliche Verpflichtung besteht.
          </p>

          <h3 className="font-semibold text-neutral-800">7. Google Workspace</h3>
          <p>
            E-Mails und Dokumente können über Dienste von Google Workspace verarbeitet werden. Anbieter
            ist die Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA.
          </p>
          <p>
            Mit Google besteht ein Auftragsverarbeitungsvertrag. Die Übermittlung erfolgt auf Grundlage
            geeigneter Garantien gemäß DSGVO (z. B. EU-US Data Privacy Framework).
          </p>

          <h3 className="font-semibold text-neutral-800">8. Ihre Rechte</h3>
          <p>Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf:</p>
          <ul className="list-disc list-inside">
            <li>Auskunft über Ihre gespeicherten personenbezogenen Daten</li>
            <li>Berichtigung unrichtiger Daten</li>
            <li>Löschung Ihrer Daten</li>
            <li>Einschränkung der Verarbeitung</li>
            <li>Widerspruch gegen die Verarbeitung</li>
            <li>Datenübertragbarkeit</li>
          </ul>
          <p>
            Hierzu sowie zu weiteren Fragen zum Thema personenbezogene Daten können Sie sich jederzeit an
            mich wenden.
          </p>
          <p>
            Zudem haben Sie das Recht, sich bei einer Aufsichtsbehörde zu beschweren, z. B. beim
            Bayerischen Landesamt für Datenschutzaufsicht (BayLDA), Promenade 27, 91522 Ansbach.
          </p>

          <h3 className="font-semibold text-neutral-800">9. Datensicherheit</h3>
          <p>
            Ich treffe angemessene technische und organisatorische Maßnahmen, um Ihre Daten gegen Verlust,
            Zerstörung, unbefugten Zugriff oder unbefugte Veränderung zu schützen.
          </p>

          <h3 className="font-semibold text-neutral-800">10. Änderungen dieser Datenschutzerklärung</h3>
          <p>
            Diese Datenschutzerklärung kann zukünftig angepasst werden, um sie an geänderte rechtliche
            Rahmenbedingungen oder neue Funktionen auf dieser Website anzupassen. Es gilt stets die auf
            dieser Seite veröffentlichte aktuelle Version.
          </p>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   FOOTER – compact, legal + contact only
   ========================================================= */

function Footer() {
  return (
    <footer className="bg-white" style={{ borderTop: `1px solid ${MID_GRAY}` }}>
      <div className="max-w-6xl mx-auto px-5 py-10 grid md:grid-cols-3 gap-6 text-sm text-neutral-600">
        {/* Company / location */}
        <div>
          <div className="font-semibold text-neutral-800">{BRAND.name}</div>
          <p className="mt-2">
            Emanuel Chitic
            <br />
            86368 Gersthofen
            <br />
            Germany
          </p>
        </div>

        {/* Contact */}
        <div>
          <div className="font-semibold text-neutral-800">Kontakt</div>
          <p className="mt-2">
            Telefon: {BRAND.phone}
            <br />
            E-Mail:{" "}
            <a
              href={`mailto:${BRAND.email}`}
              className="hover:underline"
            >
              {BRAND.email}
            </a>
          </p>
        </div>

        {/* Legal */}
        <div className="md:text-right">
          <div className="font-semibold text-neutral-800">Rechtliches</div>
          <div className="mt-2 flex md:flex-col gap-2 md:gap-1 justify-start md:justify-end">
            <a href="#/impressum" className="hover:text-neutral-900">
              Impressum
            </a>
            <a href="#/datenschutz" className="hover:text-neutral-900">
              Datenschutzerklärung
            </a>
          </div>
          <p className="mt-4 text-xs text-neutral-500">
            © {new Date().getFullYear()} {BRAND.name}. Alle Rechte vorbehalten.
          </p>
        </div>
      </div>
    </footer>
  );
}

/* =========================================================
   DROPZONE + RFQ FORM
   ========================================================= */

function Dropzone({ files, setFiles }) {
  const [dragOver, setDragOver] = useState(false);
  const ACCEPTED = ["pdf", "step", "stp", "iges", "igs", "dxf", "dwg", "stl", "zip", "rar"];

  const ext = (n) => (n.split(".").pop() || "").toLowerCase();
  const dedupe = (list) => {
    const m = new Map();
    list.forEach((f) => m.set(`${f.name}-${f.size}-${f.lastModified}`, f));
    return [...m.values()];
  };

  const onPick = (e) => setFiles((p) => dedupe([...p, ...(e.target.files || [])]));
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    setFiles((p) => dedupe([...p, ...(e.dataTransfer.files || [])]));
  };
  const remove = (fx) => setFiles((p) => p.filter((f) => f !== fx));
  const invalid = files.filter((f) => !ACCEPTED.includes(ext(f.name)));

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      className="mt-6 rounded-xl border-2 border-dashed p-8 text-sm reveal"
      style={{
        borderColor: dragOver ? "#93c5fd" : MID_GRAY,
        backgroundColor: dragOver ? "#eaf2ff" : "#fff",
      }}
    >
      <div className="font-medium">Drop files here</div>
      <div className="mt-1 text-neutral-600">
        or click to browse your device (PDF, STEP/IGES, DXF/DWG, STL, ZIP/RAR).
      </div>
      <input
        type="file"
        multiple
        onChange={onPick}
        className="mt-3"
        accept={ACCEPTED.map((e) => "." + e).join(",")}
      />
      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          {files.map((f, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
              style={{
                borderColor: ACCEPTED.includes(ext(f.name)) ? MID_GRAY : "#fca5a5",
                backgroundColor: ACCEPTED.includes(ext(f.name)) ? LIGHT_GRAY : "#fee2e2",
              }}
            >
              <span className="truncate mr-3">
                {f.name}{" "}
                <span className="text-neutral-500">({Math.round(f.size / 1024)} KB)</span>
              </span>
              <div className="flex items-center gap-2">
                {!ACCEPTED.includes(ext(f.name)) && (
                  <span className="text-xs" style={{ color: "#b91c1c" }}>
                    Invalid
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => remove(f)}
                  className="rounded-md border px-2 py-1 hover:bg-neutral-100"
                  style={{ borderColor: MID_GRAY }}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {invalid.length > 0 && (
        <p className="mt-2 text-xs" style={{ color: "#b91c1c" }}>
          Some files are not allowed. Accepted: {ACCEPTED.join(", ")}
        </p>
      )}
    </div>
  );
}

function RFQForm({ brandEmail, files, setFiles, lang }) {
  const isDe = lang === "de";

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [agree, setAgree] = useState(true);

  const [status, setStatus] = useState("idle"); // "idle" | "sending" | "ok" | "error"
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();

    if (!agree) {
      alert(
        isDe
          ? "Bitte akzeptieren Sie zuerst die Hinweise zur Datenverarbeitung."
          : "Please accept the data policy first."
      );
      return;
    }

    try {
      setStatus("sending");
      setError("");

      const formData = new FormData();
      formData.append("name", name);
      formData.append("company", company);
      formData.append("email", email);
      formData.append("message", message);

      (files || []).forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("http://localhost:4000/api/rfq", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      setStatus("ok");

      setName("");
      setCompany("");
      setEmail("");
      setMessage("");
      setAgree(true);
      if (setFiles) setFiles([]);

      alert(
        isDe
          ? "Vielen Dank – Ihre Anfrage wurde erfolgreich versendet."
          : "Thank you – your RFQ was sent successfully."
      );
    } catch (err) {
      console.error(err);
      setStatus("error");
      setError(
        isDe
          ? "Beim Senden Ihrer Anfrage ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut oder kontaktieren Sie uns direkt per E-Mail."
          : "Something went wrong while sending your RFQ. Please try again or contact us directly by email."
      );
    }
  }

  const isSending = status === "sending";

  return (
    <form onSubmit={submit} className="mt-6 space-y-4 reveal">
      {[
        [isDe ? "Ihr Name" : "Your Name", name, setName, "text", true],
        [isDe ? "Firma" : "Company", company, setCompany, "text", false],
        ["Email", email, setEmail, "email", true],
      ].map(([label, val, setter, type, req], i) => (
        <label key={i} className="block text-sm">
          <span className="text-neutral-800">
            {label}
            {req && <span className="text-red-600"> *</span>}
          </span>
          <input
            type={type}
            value={val}
            onChange={(e) => setter(e.target.value)}
            required={req}
            className="mt-1 w-full rounded-md border bg-white px-3 py-2 outline-none focus:ring-1"
            style={{
              borderColor: MID_GRAY,
              caretColor: BMW_BLUE,
              boxShadow: "0 0 0 0 rgba(0,0,0,0)",
            }}
          />
        </label>
      ))}
      <label className="block text-sm">
        <span className="text-neutral-800">
          {isDe ? "Nachricht / Spezifikation" : "Message / Specs"}
        </span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          className="mt-1 w-full rounded-md border bg-white px-3 py-2 outline-none focus:ring-1 resize-y"
          style={{
            borderColor: MID_GRAY,
            caretColor: BMW_BLUE,
            boxShadow: "0 0 0 0 rgba(0,0,0,0)",
          }}
        />
      </label>
      <label className="flex items-start gap-2 text-sm" style={{ color: MID_TEXT }}>
        <input
          type="checkbox"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
          className="mt-1"
        />
        <span>
          {isDe
            ? "Ich bin damit einverstanden, dass meine Daten zur Bearbeitung dieser Anfrage verarbeitet werden. Dateien werden ausschließlich zur Angebotsabgabe verwendet. Eine NDA ist auf Wunsch möglich."
            : "I agree that my data is processed to handle this RFQ. Files are used solely for quoting. NDA available on request."}
        </span>
      </label>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSending}
          className="btn-rfq inline-flex items-center gap-2 rounded-md px-5 py-3 font-medium shadow-sm hover:opacity-90"
          style={{ backgroundColor: BMW_BLUE, opacity: isSending ? 0.7 : 1 }}
        >
          {isSending
            ? isDe
              ? "Sende..."
              : "Sending…"
            : isDe
            ? "Anfrage senden"
            : "Send RFQ"}
        </button>
        <a
          href={`mailto:${brandEmail}`}
          className="inline-flex items-center gap-2 rounded-md px-5 py-3 border"
          style={{ borderColor: MID_GRAY, backgroundColor: "#fff", color: BMW_BLUE }}
        >
          {isDe ? "E-Mail schreiben" : "Email us"}
        </a>
      </div>
      <p className="text-xs text-neutral-500">
        {isDe
          ? "Tipp: Sie können große Dateien auch als Link senden (z. B. Drive, OneDrive, WeTransfer)."
          : "Tip: You can also send large files as a link (Drive, OneDrive, WeTransfer)."}
      </p>
      {status === "error" && (
        <p className="mt-2 text-xs" style={{ color: "#b91c1c" }}>
          {error}
        </p>
      )}
    </form>
  );
}
