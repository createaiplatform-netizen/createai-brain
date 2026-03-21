/**
 * generate-icons.js
 * Generates all required PWA/App Store icon sizes from the source 512x512 PNG.
 * Run: node scripts/generate-icons.js
 * Requires: npm install sharp (or pnpm add -D sharp)
 */

import sharp from "sharp";
import { existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, "../public/icons/icon-512.png");
const OUT = join(__dirname, "../public/icons");
const SPLASH = join(__dirname, "../public/splash");

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
if (!existsSync(SPLASH)) mkdirSync(SPLASH, { recursive: true });

// ── App Icon Sizes ────────────────────────────────────────────────────────────
const ICON_SIZES = [
  16, 32, 57, 60, 70, 72, 76, 96, 114, 120, 128, 144, 150, 152, 167, 180, 192, 310, 384, 512
];

// ── Maskable Icon (with safe zone padding — 20% on each side) ─────────────────
const MASKABLE_SIZES = [192, 512];

// ── Apple Splash Screens (portrait) ──────────────────────────────────────────
const SPLASH_SCREENS = [
  { w: 640,  h: 1136 }, // iPhone SE
  { w: 750,  h: 1334 }, // iPhone 6/7/8
  { w: 828,  h: 1792 }, // iPhone XR/11
  { w: 1125, h: 2436 }, // iPhone X/XS/11 Pro
  { w: 1170, h: 2532 }, // iPhone 12/13/14
  { w: 1179, h: 2556 }, // iPhone 14 Pro/15
  { w: 1284, h: 2778 }, // iPhone 14 Plus/15 Plus
  { w: 1290, h: 2796 }, // iPhone 15 Pro Max
  { w: 1536, h: 2048 }, // iPad
  { w: 1668, h: 2388 }, // iPad Pro 11"
  { w: 2048, h: 2732 }, // iPad Pro 12.9"
];

async function main() {
  console.log("📱 Generating CreateAI Brain icon set...\n");

  // Standard icons
  for (const size of ICON_SIZES) {
    const out = join(OUT, `icon-${size}.png`);
    await sharp(SRC).resize(size, size, { fit: "contain", background: "#6366f1" }).png().toFile(out);
    console.log(`  ✅ icon-${size}.png`);
  }

  // Maskable icons (icon centered in safe zone)
  for (const size of MASKABLE_SIZES) {
    const padding = Math.round(size * 0.1);
    const inner = size - padding * 2;
    const out = join(OUT, `icon-maskable-${size}.png`);
    await sharp(SRC)
      .resize(inner, inner, { fit: "contain" })
      .extend({ top: padding, bottom: padding, left: padding, right: padding, background: "#6366f1" })
      .resize(size, size)
      .png()
      .toFile(out);
    console.log(`  ✅ icon-maskable-${size}.png`);
  }

  // Apple splash screens
  console.log("\n🍎 Generating Apple splash screens...\n");
  for (const { w, h } of SPLASH_SCREENS) {
    const iconSize = Math.round(Math.min(w, h) * 0.25);
    const out = join(SPLASH, `splash-${w}x${h}.png`);
    const icon = await sharp(SRC).resize(iconSize, iconSize, { fit: "contain" }).toBuffer();
    await sharp({ create: { width: w, height: h, channels: 4, background: "#020617" } })
      .composite([{ input: icon, gravity: "center" }])
      .png()
      .toFile(out);
    console.log(`  ✅ splash-${w}x${h}.png`);
  }

  console.log("\n✨ All icons and splash screens generated successfully.");
  console.log(`   Icons: ${OUT}`);
  console.log(`   Splash: ${SPLASH}`);
}

main().catch(console.error);
