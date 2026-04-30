// scripts/generate-images.mjs
// One-shot script: build OG image and convert PNG/JPG assets to WebP.
// Run: node scripts/generate-images.mjs

import sharp from "sharp";
import { readdir, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

/* ----- 1. Generate OG image (1200x630) ----- */
async function buildOgImage() {
  const W = 1200, H = 630;
  const accent = "#0077b6";
  const logoPath = path.join(ROOT, "src/assets/logo-mark.webp");

  const logoBuf = await sharp(logoPath)
    .resize({ width: 170, height: 170, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // White circular badge behind the dark logo so it's visible against the navy gradient
  const badge = await sharp({
    create: { width: 220, height: 220, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{
      input: Buffer.from(`<svg width="220" height="220"><circle cx="110" cy="110" r="108" fill="#ffffff"/></svg>`),
      top: 0, left: 0,
    }])
    .png()
    .toBuffer();

  const svg = `
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"  stop-color="#1b2d45"/>
          <stop offset="60%" stop-color="#274060"/>
          <stop offset="100%" stop-color="#1b2d45"/>
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#g)"/>
      <rect x="0" y="0" width="12" height="${H}" fill="${accent}"/>
      <rect x="0" y="${H - 8}" width="${W}" height="8" fill="${accent}"/>

      <text x="320" y="248" font-family="DM Sans, Helvetica, Arial, sans-serif" font-size="92" font-weight="700" fill="#ffffff" letter-spacing="-2">VOLOTECH</text>
      <text x="322" y="296" font-family="DM Sans, Helvetica, Arial, sans-serif" font-size="26" font-weight="500" fill="rgba(255,255,255,0.78)" letter-spacing="3">PRÄZISION · QUALITÄT · ZUVERLÄSSIGKEIT</text>

      <line x1="320" y1="340" x2="1000" y2="340" stroke="rgba(255,255,255,0.18)" stroke-width="2"/>

      <text x="320" y="402" font-family="DM Sans, Helvetica, Arial, sans-serif" font-size="38" font-weight="600" fill="#ffffff">CNC-Fertigung &amp; Baugruppen</text>
      <text x="320" y="450" font-family="DM Sans, Helvetica, Arial, sans-serif" font-size="32" font-weight="400" fill="rgba(255,255,255,0.78)">über unser EU-Partnernetzwerk</text>

      <g transform="translate(320, 510)">
        <rect x="0" y="0" width="220" height="44" rx="22" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.25)"/>
        <text x="110" y="29" text-anchor="middle" font-family="DM Sans, Helvetica, Arial, sans-serif" font-size="17" font-weight="600" fill="#ffffff">ISO 9001 zertifiziert</text>

        <rect x="240" y="0" width="220" height="44" rx="22" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.25)"/>
        <text x="350" y="29" text-anchor="middle" font-family="DM Sans, Helvetica, Arial, sans-serif" font-size="17" font-weight="600" fill="#ffffff">Engineering-geführt</text>

        <rect x="480" y="0" width="170" height="44" rx="22" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.25)"/>
        <text x="565" y="29" text-anchor="middle" font-family="DM Sans, Helvetica, Arial, sans-serif" font-size="17" font-weight="600" fill="#ffffff">Made in EU</text>
      </g>

      <text x="${W - 60}" y="${H - 32}" text-anchor="end" font-family="DM Sans, Helvetica, Arial, sans-serif" font-size="20" font-weight="500" fill="rgba(255,255,255,0.55)">volotech.de</text>
    </svg>
  `;

  const outPath = path.join(ROOT, "public/og-image.png");
  await sharp(Buffer.from(svg))
    .composite([
      { input: badge, left: 75, top: 205 },
      { input: logoBuf, left: 100, top: 230 },
    ])
    .png({ quality: 90 })
    .toFile(outPath);

  console.log(`✓ OG image: ${path.relative(ROOT, outPath)}`);
}

/* ----- 2. Convert PNG/JPG to WebP in selected folders ----- */
async function convertFolderToWebP(relDir, opts = {}) {
  const dir = path.join(ROOT, relDir);
  if (!existsSync(dir)) return;
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (!e.isFile()) continue;
    const ext = path.extname(e.name).toLowerCase();
    if (![".png", ".jpg", ".jpeg"].includes(ext)) continue;

    const srcPath = path.join(dir, e.name);
    const baseName = e.name.replace(/\.[^/.]+$/, "");
    const outPath = path.join(dir, `${baseName}.webp`);

    let pipe = sharp(srcPath);
    if (opts.maxWidth) {
      pipe = pipe.resize({ width: opts.maxWidth, withoutEnlargement: true });
    }
    await pipe.webp({ quality: opts.quality ?? 82, effort: 6 }).toFile(outPath);
    console.log(`✓ ${path.relative(ROOT, srcPath)} → ${path.basename(outPath)}`);
  }
}

/* ----- Run ----- */
async function main() {
  await mkdir(path.join(ROOT, "public"), { recursive: true });
  await buildOgImage();

  // Hero image is the LCP element; cap at 2000px wide to keep it light.
  await convertFolderToWebP("src/assets/hero", { maxWidth: 2000, quality: 80 });
  await convertFolderToWebP("src/assets/services", { maxWidth: 1400, quality: 82 });
  await convertFolderToWebP("src/assets/portfolio", { maxWidth: 1400, quality: 82 });

  console.log("\nAll done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
