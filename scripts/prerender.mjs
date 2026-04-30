// scripts/prerender.mjs
// Spins up `vite preview`, navigates a headless Chromium to each route,
// and saves the fully-rendered HTML to dist/<route>/index.html.
// Run after `vite build`. The original SPA shell still works as a fallback,
// so even if this script fails, the site keeps functioning client-side.

import { preview } from "vite";
import puppeteer from "puppeteer";
import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(__dirname);
const DIST = join(ROOT, "dist");
const PORT = 4173;

const ROUTES = [
  "/",
  "/manufacturing",
  "/assembly",
  "/quality",
  "/portfolio",
  "/about",
  "/impressum",
  "/datenschutz",
];

async function main() {
  if (!existsSync(DIST)) {
    console.error("dist/ not found — run `vite build` first.");
    process.exit(1);
  }

  console.log("Starting vite preview server on port", PORT);
  const server = await preview({
    root: ROOT,
    preview: { port: PORT, strictPort: true },
  });

  console.log("Launching headless Chromium");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  let rendered = 0;
  try {
    for (const route of ROUTES) {
      const page = await browser.newPage();
      const url = `http://localhost:${PORT}${route}`;
      try {
        await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });
        // Give MetadataManager + ScrollRevealManager a tick to settle
        await new Promise((r) => setTimeout(r, 200));

        const html = await page.content();

        const outPath =
          route === "/"
            ? join(DIST, "index.html")
            : join(DIST, route.slice(1), "index.html");

        await mkdir(dirname(outPath), { recursive: true });
        await writeFile(outPath, html, "utf8");
        const rel = outPath.replace(ROOT, ".");
        console.log(`  ✓ ${route.padEnd(15)} → ${rel}`);
        rendered++;
      } catch (err) {
        console.error(`  ✗ ${route} — ${err.message}`);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
    server.httpServer.close();
  }

  console.log(`\n✓ Prerendered ${rendered}/${ROUTES.length} routes.`);
  if (rendered !== ROUTES.length) process.exit(1);
}

main().catch((err) => {
  console.error("Prerender failed:", err);
  process.exit(1);
});
