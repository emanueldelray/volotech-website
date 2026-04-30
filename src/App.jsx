// src/App.jsx
import React, { useEffect, useRef, useState } from "react";
import "./site.css";
import volotechLogo from "./assets/logo-mark.webp";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ManufacturingPage from "./pages/ManufacturingPage";
import AssemblyPage from "./pages/AssemblyPage";
import PortfolioPage from "./pages/PortfolioPage";
import AboutPage from "./pages/AboutPage";
import QualityPage from "./pages/QualityPage";
import ImpressumPage from "./pages/ImpressumPage";
import DatenschutzPage from "./pages/DatenschutzPage";
import { ObfuscatedEmail, ObfuscatedPhone } from "./components/Shared";

/* ===== Page metadata: title + description per route, per language ===== */
const PAGE_META = {
  "/": {
    de: {
      title: "Volotech – CNC-Fertigung & Baugruppen über unser EU-Netzwerk",
      desc: "Volotech verbindet deutsches Engineering-Know-how mit einem Netzwerk ausgewählter, ISO 9001 zertifizierter Fertigungspartner in der EU. CNC-Bearbeitung, Blechbearbeitung, Schweißbaugruppen und Montage für Maschinenbau und Automatisierung.",
    },
    en: {
      title: "Volotech – CNC manufacturing & assemblies via our EU network",
      desc: "Volotech combines German engineering expertise with a network of selected, ISO 9001 certified manufacturing partners across the EU. CNC machining, sheet metal, welded assemblies, and assembly for machine builders and automation.",
    },
  },
  "/manufacturing": {
    de: {
      title: "CNC-Bearbeitung, Blech & Schweißen – Volotech",
      desc: "CNC-Fräsen bis 1.700 × 700 × 500 mm, CNC-Drehen bis Ø 320 mm, Laserschneiden, Abkanten, Schweißen. Stahl, Edelstahl, Aluminium, Messing, Kunststoffe. Typische Toleranz ±0,02 mm.",
    },
    en: {
      title: "CNC machining, sheet metal & welding – Volotech",
      desc: "CNC milling up to 1,700 × 700 × 500 mm, CNC turning up to Ø 320 mm, laser cutting, bending, welding. Steel, stainless, aluminium, brass, plastics. Typical tolerance ±0.02 mm.",
    },
  },
  "/assembly": {
    de: {
      title: "Montage & Baugruppen – Volotech",
      desc: "Vormontage und Endmontage von Baugruppen aus CNC- und Blechkomponenten. Prüfung und Dokumentation auf Wunsch. Einbaufertige Lieferung.",
    },
    en: {
      title: "Assembly & sub-assemblies – Volotech",
      desc: "Pre-assembly and final assembly of sub-assemblies from CNC and sheet metal components. Inspection and documentation on request. Ready-to-install delivery.",
    },
  },
  "/portfolio": {
    de: {
      title: "Referenzen & Beispielteile – Volotech",
      desc: "Beispielteile und Baugruppen aus unserem EU-Fertigungsnetzwerk: CNC-Teile, Blech, Schweißbaugruppen, Montage.",
    },
    en: {
      title: "Portfolio & example parts – Volotech",
      desc: "Example parts and assemblies from our EU manufacturing network: CNC parts, sheet metal, welded assemblies, assembly.",
    },
  },
  "/about": {
    de: {
      title: "Über uns – Volotech",
      desc: "Volotech wird von einem Maschinenbauingenieur mit über 10 Jahren Erfahrung in Automatisierung, Intralogistik und Automotive geführt.",
    },
    en: {
      title: "About us – Volotech",
      desc: "Volotech is run by a mechanical engineer with over 10 years of experience in automation, intralogistics, and automotive.",
    },
  },
  "/quality": {
    de: {
      title: "Qualität & Dokumentation – Volotech",
      desc: "ISO 9001 zertifizierte Partner, Materialzertifikate (EN 10204 3.1), dimensionale Prüfberichte, Chargenrückverfolgbarkeit.",
    },
    en: {
      title: "Quality & documentation – Volotech",
      desc: "ISO 9001 certified partners, material certificates (EN 10204 3.1), dimensional inspection reports, batch traceability.",
    },
  },
  "/impressum": {
    de: { title: "Impressum – Volotech", desc: "Impressum nach § 5 TMG." },
    en: { title: "Legal Notice – Volotech", desc: "Legal notice pursuant to § 5 TMG." },
  },
  "/datenschutz": {
    de: { title: "Datenschutzerklärung – Volotech", desc: "Datenschutzerklärung gemäß DSGVO." },
    en: { title: "Privacy Policy – Volotech", desc: "Privacy policy under GDPR." },
  },
};

const SITE_ORIGIN = "https://volotech.de";

function MetadataManager({ lang }) {
  const location = useLocation();
  useEffect(() => {
    const meta = PAGE_META[location.pathname]?.[lang] || PAGE_META["/"][lang];
    const canonicalUrl = SITE_ORIGIN + (location.pathname === "/" ? "/" : location.pathname);

    document.documentElement.lang = lang;
    document.title = meta.title;

    const setMeta = (selector, attr, value) => {
      let tag = document.querySelector(selector);
      if (!tag) {
        tag = document.createElement("meta");
        const [, name] = selector.match(/\[(?:name|property)="([^"]+)"\]/) || [];
        if (name) {
          tag.setAttribute(selector.includes("property=") ? "property" : "name", name);
        }
        document.head.appendChild(tag);
      }
      tag.setAttribute(attr, value);
    };

    setMeta('meta[name="description"]', "content", meta.desc);
    setMeta('meta[property="og:title"]', "content", meta.title);
    setMeta('meta[property="og:description"]', "content", meta.desc);
    setMeta('meta[property="og:url"]', "content", canonicalUrl);
    setMeta('meta[property="og:locale"]', "content", lang === "de" ? "de_DE" : "en_GB");
    setMeta('meta[name="twitter:title"]', "content", meta.title);
    setMeta('meta[name="twitter:description"]', "content", meta.desc);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", canonicalUrl);
  }, [location.pathname, lang]);
  return null;
}

/* ===== Scroll reveal observer ===== */
function ScrollRevealManager() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    const timer = setTimeout(() => {
      const els = Array.from(document.querySelectorAll(".reveal"));
      if (!els.length) return;

      els.forEach((el) => el.classList.remove("visible"));

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
        { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
      );

      els.forEach((el) => observer.observe(el));

      const canScroll = document.documentElement.scrollHeight > window.innerHeight + 50;
      let failsafe = null;
      if (!canScroll) {
        failsafe = setTimeout(() => {
          els.forEach((el) => el.classList.add("visible"));
        }, 300);
      }

      return () => {
        if (failsafe) clearTimeout(failsafe);
        observer.disconnect();
      };
    }, 50);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return null;
}

/* ===== App root ===== */
export default function App() {
  const [lang, setLang] = useState("de");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg)", color: "var(--ink)" }}>
      <MetadataManager lang={lang} />
      <ScrollRevealManager />
      <Navbar lang={lang} setLang={setLang} />

      <main>
        <Routes>
          <Route path="/" element={<HomePage lang={lang} />} />
          <Route path="/manufacturing" element={<ManufacturingPage lang={lang} />} />
          <Route path="/portfolio" element={<PortfolioPage lang={lang} />} />
          <Route path="/about" element={<AboutPage lang={lang} />} />
          <Route path="/assembly" element={<AssemblyPage lang={lang} />} />
          <Route path="/quality" element={<QualityPage lang={lang} />} />
          <Route path="/impressum" element={<ImpressumPage lang={lang} />} />
          <Route path="/datenschutz" element={<DatenschutzPage lang={lang} />} />
          <Route path="*" element={<Placeholder title={lang === "de" ? "Seite nicht gefunden" : "Page not found"} lang={lang} />} />
        </Routes>
      </main>

      <Footer lang={lang} />
    </div>
  );
}

/* ===== Navbar ===== */
function Navbar({ lang, setLang }) {
  const isDe = lang === "de";
  const [ddOpen, setDdOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const ddRef = useRef(null);

  // Close dropdown on outside click + Escape
  useEffect(() => {
    const onDoc = (e) => {
      if (ddRef.current && !ddRef.current.contains(e.target)) setDdOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setDdOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Sticky-shadow on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const closeAll = () => {
    setDdOpen(false);
    setMobileOpen(false);
  };

  return (
    <header className={`site-header ${scrolled ? "site-header--scrolled" : ""}`}>
      <div className="nav-inner">
        <Link to="/" className="nav-brand" onClick={closeAll}>
          <img src={volotechLogo} alt="Volotech" className="nav-brand-logo" />
          <div className="nav-brand-text">
            <div className="nav-brand-title">VOLOTECH</div>
            <div className="nav-brand-tagline">
              {isDe ? "Präzision. Qualität. Zuverlässigkeit." : "Precision. Quality. Reliability."}
            </div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="nav-links" aria-label="Main navigation">
          <Link to="/" className="navlink" onClick={closeAll}>
            {isDe ? "Start" : "Home"}
          </Link>

          <div
            className={`services-dd ${ddOpen ? "is-open" : ""}`}
            ref={ddRef}
          >
            <button
              type="button"
              className="navlink"
              onClick={() => setDdOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={ddOpen}
            >
              {isDe ? "Leistungen" : "Services"} ▾
            </button>

            <div className="dd-menu" role="menu">
              <Link to="/manufacturing" className="dd-item" role="menuitem" onClick={closeAll}>
                <div className="dd-title">{isDe ? "Fertigung" : "Manufacturing"}</div>
                <div className="dd-sub">
                  {isDe ? "Drehen · Fräsen · Blech · Laser · Schweißen" : "Turning · Milling · Sheet · Laser · Welding"}
                </div>
              </Link>

              <Link to="/assembly" className="dd-item" role="menuitem" onClick={closeAll}>
                <div className="dd-title">{isDe ? "Montage" : "Assembly"}</div>
                <div className="dd-sub">
                  {isDe ? "Baugruppen · Vormontage · Prüfung" : "Sub-assemblies · Pre-assembly · Inspection"}
                </div>
              </Link>

              <Link to="/quality" className="dd-item" role="menuitem" onClick={closeAll}>
                <div className="dd-title">{isDe ? "Qualität" : "Quality"}</div>
                <div className="dd-sub">
                  {isDe ? "ISO 9001 · 3.1 Zertifikate · Prüfung" : "ISO 9001 · 3.1 certificates · Inspection"}
                </div>
              </Link>
            </div>
          </div>

          <Link to="/portfolio" className="navlink" onClick={closeAll}>
            {isDe ? "Referenzen" : "Portfolio"}
          </Link>
          <Link to="/about" className="navlink" onClick={closeAll}>
            {isDe ? "Über uns" : "About"}
          </Link>
        </nav>

        {/* Right side: contact + lang + CTA */}
        <div className="nav-actions">
          <div className="nav-contact" aria-label="Direct contact">
            <ObfuscatedPhone className="nav-contact-link" />
            <ObfuscatedEmail className="nav-contact-link" />
          </div>

          <div className="lang-toggle">
            <button
              type="button"
              className="navlink"
              onClick={() => setLang("de")}
              style={{ fontWeight: lang === "de" ? 700 : 400 }}
              aria-pressed={lang === "de"}
            >
              DE
            </button>
            <span style={{ color: "var(--subtle)" }}>/</span>
            <button
              type="button"
              className="navlink"
              onClick={() => setLang("en")}
              style={{ fontWeight: lang === "en" ? 700 : 400 }}
              aria-pressed={lang === "en"}
            >
              EN
            </button>
          </div>

          <Link to="/manufacturing?rfq=1" className="btn-rfq" onClick={closeAll}>
            {isDe ? "Anfrage stellen" : "Request a quote"}
          </Link>

          {/* Mobile menu toggle */}
          <button
            type="button"
            className={`burger ${mobileOpen ? "is-open" : ""}`}
            aria-label={isDe ? "Menü öffnen" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        id="mobile-nav"
        className={`mobile-drawer ${mobileOpen ? "is-open" : ""}`}
        aria-hidden={!mobileOpen}
      >
        <nav className="mobile-nav-links" aria-label="Mobile navigation">
          <div className="mobile-lang">
            <button
              type="button"
              onClick={() => setLang("de")}
              className={lang === "de" ? "is-active" : ""}
              aria-pressed={lang === "de"}
            >DE</button>
            <span>/</span>
            <button
              type="button"
              onClick={() => setLang("en")}
              className={lang === "en" ? "is-active" : ""}
              aria-pressed={lang === "en"}
            >EN</button>
          </div>

          <Link to="/" className="mobile-link" onClick={closeAll}>{isDe ? "Start" : "Home"}</Link>
          <div className="mobile-section-title">{isDe ? "Leistungen" : "Services"}</div>
          <Link to="/manufacturing" className="mobile-link" onClick={closeAll}>{isDe ? "Fertigung" : "Manufacturing"}</Link>
          <Link to="/assembly" className="mobile-link" onClick={closeAll}>{isDe ? "Montage" : "Assembly"}</Link>
          <Link to="/quality" className="mobile-link" onClick={closeAll}>{isDe ? "Qualität" : "Quality"}</Link>
          <Link to="/portfolio" className="mobile-link" onClick={closeAll}>{isDe ? "Referenzen" : "Portfolio"}</Link>
          <Link to="/about" className="mobile-link" onClick={closeAll}>{isDe ? "Über uns" : "About"}</Link>

          <div className="mobile-section-title">{isDe ? "Kontakt" : "Contact"}</div>
          <ObfuscatedPhone className="mobile-link" />
          <ObfuscatedEmail className="mobile-link" />
        </nav>
      </div>
    </header>
  );
}

/* ===== Footer ===== */
function Footer({ lang }) {
  const isDe = lang === "de";
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-col">
          <div className="footer-title">Volotech</div>
          <div>Emanuel Chitic</div>
          <div>86368 Gersthofen</div>
          <div>Germany</div>
        </div>

        <div className="footer-col">
          <div className="footer-title">{isDe ? "Kontakt" : "Contact"}</div>
          <div>
            {isDe ? "Telefon" : "Phone"}: <ObfuscatedPhone className="footer-link" />
          </div>
          <div>
            E-Mail: <ObfuscatedEmail className="footer-link" />
          </div>
        </div>

        <div className="footer-col" style={{ textAlign: "right" }}>
          <div className="footer-title">{isDe ? "Rechtliches" : "Legal"}</div>
          <div><Link className="footer-link" to="/impressum">Impressum</Link></div>
          <div><Link className="footer-link" to="/datenschutz">{isDe ? "Datenschutzerklärung" : "Privacy policy"}</Link></div>
          <div className="footer-copyright">© 2025 Volotech. {isDe ? "Alle Rechte vorbehalten." : "All rights reserved."}</div>
        </div>
      </div>
    </footer>
  );
}

/* ===== Placeholder ===== */
function Placeholder({ title, lang }) {
  return (
    <div className="section-wrap" style={{ paddingTop: "3rem", paddingBottom: "3rem" }}>
      <h1>{title}</h1>
      <p style={{ color: "var(--muted)", marginTop: "0.5rem" }}>
        {lang === "de" ? "Diese Seite wird demnächst eingerichtet." : "This page will be available soon."}
      </p>
    </div>
  );
}
