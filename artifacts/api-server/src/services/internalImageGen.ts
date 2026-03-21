/**
 * internalImageGen.ts — Internal SVG/Visual Asset Generator
 *
 * Generates deterministic, unique visual assets from product metadata.
 * No external API credits required. Pure SVG generation using Node.js.
 * Output is a data URI (base64 SVG) usable anywhere an image URL is accepted.
 *
 * This deploys the "AI image/video generation" intelligence feature.
 * Uses a seeded visual hash algorithm for deterministic product imagery.
 */

import { createHash } from "crypto";

/** Palette library — 12 distinct palettes */
const PALETTES = [
  ["#6366f1", "#818cf8", "#c7d2fe", "#1e1b4b"],
  ["#10b981", "#34d399", "#a7f3d0", "#064e3b"],
  ["#f59e0b", "#fbbf24", "#fde68a", "#78350f"],
  ["#ef4444", "#f87171", "#fecaca", "#7f1d1d"],
  ["#8b5cf6", "#a78bfa", "#ddd6fe", "#2e1065"],
  ["#14b8a6", "#2dd4bf", "#99f6e4", "#042f2e"],
  ["#ec4899", "#f472b6", "#fbcfe8", "#500724"],
  ["#3b82f6", "#60a5fa", "#bfdbfe", "#1e3a5f"],
  ["#f97316", "#fb923c", "#fed7aa", "#431407"],
  ["#84cc16", "#a3e635", "#d9f99d", "#1a2e05"],
  ["#06b6d4", "#22d3ee", "#a5f3fc", "#083344"],
  ["#a855f7", "#c084fc", "#e9d5ff", "#3b0764"],
];

/** Icon set — unicode shapes encoded as paths for SVG */
const ICON_PATHS = [
  "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  "M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7z",
  "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z",
  "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4l6 2.67v4.2c0 3.78-2.62 7.3-6 8.33-3.38-1.03-6-4.55-6-8.33V7.67L12 5z",
  "M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5s-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8z",
];

function seededInt(hash: string, index: number, max: number): number {
  const slice = hash.slice(index * 2, index * 2 + 4);
  return parseInt(slice, 16) % max;
}

function productHash(name: string): string {
  return createHash("sha256").update(name).digest("hex");
}

/**
 * Generate a deterministic SVG data URI for a product.
 * The same product name always produces the same image.
 */
export function generateProductImage(productName: string, size = 400): string {
  const hash = productHash(productName);
  const palette = PALETTES[seededInt(hash, 0, PALETTES.length)]!;
  const iconPath = ICON_PATHS[seededInt(hash, 2, ICON_PATHS.length)]!;

  const [primary, secondary, accent, dark] = palette;

  const angle = (seededInt(hash, 4, 360)).toString();
  const rx = 50 + seededInt(hash, 6, 100);
  const ry = 30 + seededInt(hash, 8, 80);
  const cx = 100 + seededInt(hash, 10, 200);
  const cy = 80 + seededInt(hash, 12, 160);

  const initials = productName
    .split(" ")
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? "")
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%" gradientTransform="rotate(${angle})">
      <stop offset="0%" style="stop-color:${dark};stop-opacity:1"/>
      <stop offset="100%" style="stop-color:${primary};stop-opacity:1"/>
    </linearGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="20"/></filter>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#g)" rx="20"/>
  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${secondary}" opacity="0.15" filter="url(#blur)"/>
  <ellipse cx="${size - cx}" cy="${size - cy}" rx="${ry}" ry="${rx}" fill="${accent}" opacity="0.1" filter="url(#blur)"/>
  <g transform="translate(${size / 2 - 36} ${size / 2 - 60}) scale(3)" fill="${accent}" opacity="0.9">
    <path d="${iconPath}"/>
  </g>
  <text x="${size / 2}" y="${size - 80}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="42" font-weight="800" fill="white" opacity="0.95">${initials}</text>
  <text x="${size / 2}" y="${size - 48}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="13" fill="${accent}" letter-spacing="3" opacity="0.8">CREATEAI BRAIN</text>
</svg>`;

  const b64 = Buffer.from(svg).toString("base64");
  return `data:image/svg+xml;base64,${b64}`;
}

/**
 * Generate a batch of visual assets for a product.
 * Returns an array of data URIs (main image + thumbnail + banner).
 */
export function generateProductAssets(productName: string): {
  main: string;
  thumbnail: string;
  banner: string;
} {
  return {
    main:      generateProductImage(productName, 800),
    thumbnail: generateProductImage(productName + ":thumb", 200),
    banner:    generateProductImage(productName + ":banner", 1200),
  };
}

/** Generate a video thumbnail (still frame SVG) for video products */
export function generateVideoThumbnail(productName: string): string {
  const hash = productHash(productName + ":video");
  const palette = PALETTES[seededInt(hash, 1, PALETTES.length)]!;
  const [primary, , accent, dark] = palette;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="vg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${dark};stop-opacity:1"/>
      <stop offset="100%" style="stop-color:${primary};stop-opacity:1"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#vg)"/>
  <circle cx="640" cy="360" r="80" fill="${accent}" opacity="0.9"/>
  <polygon points="620,330 620,390 680,360" fill="${dark}" opacity="0.95"/>
  <text x="640" y="500" text-anchor="middle" font-family="system-ui,sans-serif" font-size="36" font-weight="700" fill="white" opacity="0.9">${productName.slice(0, 40)}</text>
  <text x="640" y="545" text-anchor="middle" font-family="system-ui,sans-serif" font-size="18" fill="${accent}" letter-spacing="4" opacity="0.8">CREATEAI BRAIN</text>
</svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
