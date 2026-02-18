// src/components/Shared.jsx
import React from "react";
import { Link } from "react-router-dom";

/* ===== Shared Section Header ===== */
export function SectionHeader({ title, subtitle, align = "left" }) {
  return (
    <div style={{ marginBottom: "1.5rem", textAlign: align }}>
      <h2 style={{ fontWeight: 700 }}>{title}</h2>
      {subtitle && (
        <p style={{ marginTop: "0.5rem", color: "var(--muted)", maxWidth: "65ch", lineHeight: 1.6 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

/* ===== Card with title + body text ===== */
export function Card({ title, text, children }) {
  return (
    <div className="v-card">
      <div style={{ fontWeight: 700, color: "var(--ink)", marginBottom: "0.5rem" }}>{title}</div>
      {text && <p style={{ color: "var(--muted)", lineHeight: 1.6, fontSize: "0.95rem" }}>{text}</p>}
      {children}
    </div>
  );
}

/* ===== Card with title + bullet list ===== */
export function BulletCard({ title, bullets }) {
  return (
    <div className="v-card">
      <div style={{ fontWeight: 700, color: "var(--ink)" }}>{title}</div>
      <ul style={{ marginTop: "0.6rem", color: "var(--muted)", lineHeight: 1.7, paddingLeft: "1.1rem" }}>
        {bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
    </div>
  );
}

/* ===== Accent info card ===== */
export function AccentCard({ kicker, children }) {
  return (
    <div className="v-card-accent">
      {kicker && <div className="v-kicker">{kicker}</div>}
      <div style={{ marginTop: kicker ? "0.75rem" : 0 }}>{children}</div>
    </div>
  );
}

/* ===== Numbered step ===== */
export function Step({ n, title, children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: "0.75rem", marginTop: "0.9rem" }}>
      <div
        style={{
          width: 28, height: 28, borderRadius: 999,
          background: "var(--brand)", color: "#fff",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: "0.85rem",
        }}
      >
        {n}
      </div>
      <div>
        <div style={{ fontWeight: 700, color: "var(--ink)" }}>{title}</div>
        <div style={{ color: "var(--muted)", lineHeight: 1.6, marginTop: "0.2rem", fontSize: "0.95rem" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ===== Pill/tag ===== */
export function Pill({ children }) {
  return <span className="v-pill">{children}</span>;
}

/* ===== CTA button (Link) ===== */
export function CTAButton({ to, children, variant = "primary" }) {
  const cls = variant === "ghost" ? "btn-ghost" : "btn-primary";
  return (
    <Link to={to} className={cls} style={{ textDecoration: "none" }}>
      {children}
    </Link>
  );
}

/* ===== Response time hint ===== */
export function ResponseHint({ isDe }) {
  return (
    <span style={{ color: "var(--subtle)", fontSize: "0.9rem", alignSelf: "center" }}>
      {isDe ? "Rückmeldung in 24–48 h" : "Response within 24–48 h"}
    </span>
  );
}
