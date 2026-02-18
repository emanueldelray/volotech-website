// src/App.jsx
import React, { useEffect, useState } from "react";
import "./site.css";
import volotechLogo from "./assets/volotech-logo.png";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import HomePage from "./pages/HomePage";
import CePage from "./pages/CePage";
import ManufacturingPage from "./pages/ManufacturingPage";
import AssemblyPage from "./pages/AssemblyPage";
import PortfolioPage from "./pages/PortfolioPage";
import AboutPage from "./pages/AboutPage";
import ImpressumPage from "./pages/ImpressumPage";
import DatenschutzPage from "./pages/DatenschutzPage";

/* ===== Scroll reveal observer ===== */
function ScrollRevealManager() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    // Small delay so DOM is ready after route change
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

      // Fail-safe for short pages that can't scroll
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
      <ScrollRevealManager />
      <Navbar lang={lang} setLang={setLang} />

      <main>
        <Routes>
          <Route path="/" element={<HomePage lang={lang} />} />
          <Route path="/manufacturing" element={<ManufacturingPage lang={lang} />} />
          <Route path="/portfolio" element={<PortfolioPage lang={lang} />} />
          <Route path="/about" element={<AboutPage lang={lang} />} />
          <Route path="/ce" element={<CePage lang={lang} />} />
          <Route path="/assembly" element={<AssemblyPage lang={lang} />} />
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
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onDoc = (e) => {
      if (!(e.target instanceof Element)) return;
      if (!e.target.closest(".services-dd")) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`site-header ${scrolled ? "site-header--scrolled" : ""}`}>
      <div className="nav-inner">
        <Link to="/" className="nav-brand">
          <img src={volotechLogo} alt="Volotech" className="nav-brand-logo" />
          <div className="nav-brand-text">
            <div className="nav-brand-title">VOLOTECH</div>
            <div className="nav-brand-tagline">
              {isDe ? "Präzision. Qualität. Zuverlässigkeit." : "Precision. Quality. Reliability."}
            </div>
          </div>
        </Link>

        <nav className="nav-links" aria-label="Main navigation">
          <Link to="/" className="navlink">{isDe ? "Start" : "Home"}</Link>

          <div
            className={`services-dd ${open ? "is-open" : ""}`}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
          >
            <button
              type="button"
              className="navlink"
              onClick={() => setOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={open}
            >
              {isDe ? "Leistungen" : "Services"} ▾
            </button>

            <div className="dd-menu" role="menu">
              <Link to="/manufacturing" className="dd-item" role="menuitem" onClick={() => setOpen(false)}>
                <div className="dd-title">{isDe ? "Fertigung" : "Manufacturing"}</div>
                <div className="dd-sub">
                  {isDe ? "Drehen · Fräsen · Blech · Laser · Schweißen" : "Turning · Milling · Sheet · Laser · Welding"}
                </div>
              </Link>

              <Link to="/assembly" className="dd-item" role="menuitem" onClick={() => setOpen(false)}>
                <div className="dd-title">{isDe ? "Montage" : "Assembly"}</div>
                <div className="dd-sub">
                  {isDe ? "Baugruppen · Vormontage · Prüfung" : "Sub-assemblies · Pre-assembly · Inspection"}
                </div>
              </Link>

              <Link to="/ce" className="dd-item" role="menuitem" onClick={() => setOpen(false)}>
                <div className="dd-title">{isDe ? "CE-Konformität" : "CE Compliance"}</div>
                <div className="dd-sub">
                  {isDe
                    ? "Risikobeurteilung · Dokumentation · Konformität"
                    : "Risk assessment · Documentation · Conformity"}
                </div>
              </Link>
            </div>
          </div>

          <Link to="/portfolio" className="navlink">{isDe ? "Referenzen" : "Portfolio"}</Link>
          <Link to="/about" className="navlink">{isDe ? "Über uns" : "About"}</Link>
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              display: "flex", alignItems: "center", gap: "0.35rem",
              border: "1px solid var(--line)", borderRadius: "999px",
              padding: "0.25rem 0.5rem", background: "#fff",
            }}
          >
            <button type="button" className="navlink" onClick={() => setLang("de")}
              style={{ fontWeight: lang === "de" ? 700 : 400 }}>DE</button>
            <span style={{ color: "var(--subtle)" }}>/</span>
            <button type="button" className="navlink" onClick={() => setLang("en")}
              style={{ fontWeight: lang === "en" ? 700 : 400 }}>EN</button>
          </div>

          <Link to="/manufacturing?rfq=1" className="btn-rfq">
            {isDe ? "Anfrage stellen" : "Request a quote"}
          </Link>
        </div>
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
            {isDe ? "Telefon" : "Phone"}: <a className="footer-link" href="tel:+491726518119">+49 172 6518119</a>
          </div>
          <div>
            E-Mail:{" "}
            <a className="footer-link" href="mailto:emanuel.chitic@volotech.de">
              emanuel.chitic@volotech.de
            </a>
          </div>
        </div>

        <div className="footer-col" style={{ textAlign: "right" }}>
          <div className="footer-title">{isDe ? "Rechtliches" : "Legal"}</div>
          <div><a className="footer-link" href="/impressum">Impressum</a></div>
          <div><a className="footer-link" href="/datenschutz">{isDe ? "Datenschutzerklärung" : "Privacy policy"}</a></div>
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
