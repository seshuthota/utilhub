#!/usr/bin/env node
/**
 * Generates the PWA icons referenced by public/manifest.json
 * (public/icon-192.png, public/icon-512.png) from the app's logo glyph
 * (lucide "Terminal", as used in the header).
 *
 * Usage: node scripts/generate-pwa-icons.mjs
 * Uses `sharp`, which is already installed as a Next.js dependency.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// 24x24 lucide viewBox, scaled into the central safe zone so the icon also
// works as a maskable icon (content inside the inner 80% circle).
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#000000"/>
  <g transform="translate(128 128) scale(10.667)" fill="none" stroke="#3b82f6"
     stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 19h8"/>
    <path d="m4 17 6-6-6-6"/>
  </g>
</svg>`;

for (const size of [192, 512]) {
  const out = path.join(root, "public", `icon-${size}.png`);
  await sharp(Buffer.from(svg)).resize(size, size).png({ compressionLevel: 9 }).toFile(out);
  console.log(`wrote ${path.relative(root, out)}`);
}
