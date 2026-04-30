# CLAUDE.md — Volotech

## What This Project Is

Volotech (volotech.de) is a CNC manufacturing brokerage connecting German Sondermaschinenbau (special-purpose machinery), Anlagenbau, and automotive Tier 2/3 companies with ISO 9001-certified workshops in Greece, Slovenia, and Romania.

**We are an engineering partner, not a cheap-parts broker.** This distinction matters in every piece of copy, every page, every interaction. The founder has 10+ years of mechanical engineering experience (intralogistics, conveyor systems, project management at Schoenenberger, PSB, Amazon, BMW). Volotech exists because German buyers need reliable overflow capacity with engineering-level communication — not another anonymous parts portal.

Website: https://volotech.de
Deployed on: Vercel
Stack: React 19 + Vite 7 + React Router 6, plain CSS via `src/site.css` (Tailwind 4 is configured but barely used — `index.css` only has `@import "tailwindcss"`).
Languages: German (primary), English (secondary) — site is bilingual via a top-level `lang` state in `App.jsx`. URLs are not language-segmented (one URL serves both languages); `<html lang>`, `<title>`, and meta description are updated client-side by the `MetadataManager` component on each route/lang change.

---

## Supplier Network

### Greece — CNC Machining (Primary)
- CNC milling: up to 1,700 × 700 × 500 mm
- CNC turning: 2–8 axis, up to Ø320 mm
- Wire EDM
- Welding
- Surface treatments
- **ISO 9001 certified**

### Slovenia — Metal Design d.o.o. (Sheet Metal & Fabrication)
- Laser cutting
- Bending
- Robotic welding
- Assembly
- ISO certified
- 95% Western European export focus
- Complements Greek CNC with sheet metal, housings, frames, brackets, welded assemblies

### Romania (Available, Less Defined)
- CNC machining capacity available
- Personal connections of the founder
- Positioning still being developed

---

## Target Market

- **Primary:** Bavarian Sondermaschinenbau and automation companies (20–200 employees)
- **Secondary:** Swiss precision manufacturing firms (higher quality bar, stricter documentation, but structurally better fit due to import dependency and CHF/EUR tailwind)
- **Decision-makers:** Einkauf (procurement), Projektleitung, technische Leitung, Geschäftsführer at smaller firms
- **Critical filter:** Prospects must NOT have in-house CNC capabilities — those are competitors, not customers. Always verify before outreach.

### Confirmed Non-Targets (Have In-House CNC)
- Knoll + Langohr
- Steininger
- KonTec
- ASP Automation

---

## Value Proposition

1. **Single point of contact** — one engineer manages the entire process from drawing review to delivery
2. **Technical review before quoting** — feasibility, tolerances, and critical features checked upfront, not discovered during production
3. **ISO 9001 certified supply chain** — not a marketplace, a curated network with known quality
4. **No MOQ games** — prototype to series, small batches welcome
5. **Engineering-level communication** — the person quoting your parts understands GD&T, tolerances, materials, and manufacturing constraints
6. **EU-based production** — no customs complexity, short transport routes, same timezone, EU regulatory compliance

---

## Tone & Voice Guidelines

- **Language:** Direct, technical, peer-to-peer. Write like an engineer talking to an engineer.
- **Never:** Salesy, buzzwordy, startup-speak, or Silicon Valley tone. No "revolutionizing manufacturing" or "disrupting supply chains."
- **Always:** Concrete, specific, honest. Reference real capabilities (machine sizes, certifications, materials). If something isn't possible, say so.
- **German copy:** Formal Sie, but not stiff. Think experienced Projektleiter, not corporate Pressemitteilung.
- **English copy:** Professional but approachable. No unnecessary jargon, but don't dumb down technical content.

---

## Website Structure

```
/                → Landing page (hero, value prop, how we work, capabilities overview)
/manufacturing   → Manufacturing services (CNC, turning, sheet metal, laser, welding) + RFQ section
/assembly        → Assembly services
/quality         → Quality assurance, ISO 9001, documentation standards
/portfolio       → Example parts and assemblies
/about           → Founder bio, why Volotech exists, how we work
/impressum       → Legal notice (TMG)
/datenschutz     → Privacy policy (GDPR)
```

There is **no `/contact` page** — RFQ flow lives on `/manufacturing#rfq` (mailto-based) and contact details (phone, email) are in the navbar, mobile drawer, and footer.

The site uses:
- React functional components with hooks
- CSS custom properties (`--bg`, `--muted`, `--line`, `--brand`, `--accent`, etc.) defined in `src/site.css`
- Responsive grid layouts via `className="grid-3"` / `grid-2` pattern (collapse to 1-col under 980px)
- `SectionHeader`, `Card`, `BulletCard`, `Pill`, `CTAButton`, `ResponseHint`, `ObfuscatedEmail`, `ObfuscatedPhone` from `src/components/Shared.jsx`
- `lang` state ("de" / "en") in `App.jsx` with `isDe` conditional rendering throughout pages
- Sticky navbar with scroll-shadow, services dropdown (click + Escape + outside-click to close), mobile burger menu (drawer with lang switch + contact)
- `MetadataManager` (in `App.jsx`) syncs `document.documentElement.lang`, `document.title`, meta description, and OG tags to current route + lang
- Email + phone are rendered via `ObfuscatedEmail` / `ObfuscatedPhone` (the `@` is injected by CSS pseudo-element so the literal `user@domain` string never appears in the HTML; mailto/tel hrefs are assembled at click time)

## Build & deployment

```
npm run dev         # vite dev server (localhost:5173)
npm run build       # vite build + prerender each route (production)
npm run build:spa   # vite build only (skip prerender)
npm run prerender   # prerender against existing dist/
npm run preview     # serve dist/ for local checks
npm run images      # regenerate OG image + WebP conversions
```

`scripts/prerender.mjs` spins up `vite preview`, navigates a headless Chromium (Puppeteer) to each route in `ROUTES`, and saves the fully-rendered HTML to `dist/<route>/index.html`. This means crawlers (Google, social previews) see a complete, route-specific HTML page on first byte — including the correct `<title>`, meta description, canonical URL, and OG tags as set by `MetadataManager`. Users with JS see the React SPA hydrate over the prerendered DOM (we use `createRoot`, not `hydrateRoot`, so React just re-renders cleanly without hydration warnings).

The Vercel rewrite in `vercel.json` (`/(.*)` → `/index.html`) only fires when no static file matches — so prerendered route folders are served directly and the rewrite is the SPA fallback for unknown URLs.

`scripts/generate-images.mjs` produces the OG image (`public/og-image.png`) and converts everything in `src/assets/{hero,services,portfolio}` from PNG/JPG to WebP. Re-run whenever new source images are added.

JSON-LD `ProfessionalService` schema lives statically in `index.html` `<head>` and is therefore present on every prerendered page.

---

## Design Principles

- Clean, industrial, professional — not flashy
- White/light backgrounds, subtle borders, generous whitespace
- Typography-driven hierarchy, not decoration-driven
- Mobile-first responsive design
- Fast loading — no heavy animations or unnecessary libraries

---

## When Making Changes

1. **Always maintain bilingual parity.** Every text change needs both German and English versions.
2. **Keep copy concrete.** Replace vague claims with specific capabilities (dimensions, tolerances, certifications).
3. **Test both language versions** after any content change.
4. **Preserve the existing component patterns** (SectionHeader, Card, etc.) — don't introduce new patterns unless there's a clear reason.
5. **SEO matters.** Use semantic HTML, proper heading hierarchy, descriptive alt text (in both languages).
6. **Performance matters.** No unnecessary dependencies. Lazy load images. Keep bundle size small.

---

## Key Messaging Angles (For Copy Updates)

- German Mittelstand companies are under margin pressure and need cost-efficient overflow capacity without sacrificing quality
- Geopolitical supply chain diversification away from China makes EU-based sourcing more attractive
- Volotech eliminates the risk of working with unknown foreign suppliers — the engineering review layer is the differentiator
- Material certificates (3.1 per EN 10204), dimensional reports, and batch traceability are available on request
- Lean structure means faster decisions, shorter communication paths, and direct access to the engineer managing the project

---

## What NOT to Do

- Don't add stock photography of generic factories or handshakes
- Don't add chatbot widgets, popups, or newsletter signup modals
- Don't introduce animation libraries for decorative purposes
- Don't use AI-generated buzzword copy ("leveraging synergies," "end-to-end solutions," "seamless integration")
- Don't break the existing bilingual toggle architecture
