/**
 * ShareHelpers — Universal Invitation Engine
 * -------------------------------------------
 * Pure data module — no UI, no React.
 * Returns canonical link, QR data URL, invitation text, share payload,
 * and plain-text SMS/email snippets for any registry surface.
 *
 * Usage:
 *   import { getShareData } from "@/components/invite/ShareHelpers";
 *   const data = await getShareData("broadcast");
 */

import QRCode from "qrcode";
import { getSurface, getVisibleSurfaces, type InviteSurface } from "./registry";

export interface ShareData {
  id:          string;
  title:       string;
  tagline:     string;
  link:        string;        // full canonical URL
  qrDataUrl:   string;        // base64 PNG data URL
  sharePayload: {             // Web Share API compatible
    title: string;
    text:  string;
    url:   string;
  };
  smsText?:    string;        // prefilled SMS body with link substituted
  emailText?:  string;        // prefilled email body with link substituted
}

function canonicalLink(surface: InviteSurface): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://createai.digital";
  return surface.link.startsWith("http") ? surface.link : origin + surface.link;
}

function interpolate(template: string, link: string): string {
  return template.replace(/\{\{link\}\}/g, link);
}

/** Generate full ShareData for a single surface by id. */
export async function getShareData(id: string): Promise<ShareData | null> {
  const surface = getSurface(id);
  if (!surface) return null;
  return buildShareData(surface);
}

/** Generate ShareData for all visible surfaces. */
export async function getAllShareData(): Promise<ShareData[]> {
  const surfaces = getVisibleSurfaces();
  return Promise.all(surfaces.map(buildShareData));
}

async function buildShareData(surface: InviteSurface): Promise<ShareData> {
  const link     = canonicalLink(surface);
  const qrDataUrl = await QRCode.toDataURL(link, { width: 256, margin: 1 }).catch(() => "");

  return {
    id:       surface.id,
    title:    surface.title,
    tagline:  surface.tagline,
    link,
    qrDataUrl,
    sharePayload: {
      title: surface.title,
      text:  surface.tagline,
      url:   link,
    },
    smsText:   surface.shareText?.sms   ? interpolate(surface.shareText.sms,   link) : undefined,
    emailText: surface.shareText?.email ? interpolate(surface.shareText.email, link) : undefined,
  };
}

/**
 * getSharePayload — sync helper used by ShareCard and other UI components.
 * Returns the Web Share API payload for a surface without generating a QR code.
 * Returns a safe fallback object if the surface id is not found.
 */
export function getSharePayload(id: string): { title: string; text: string; url: string } {
  const surface = getSurface(id);
  const origin  = typeof window !== "undefined" ? window.location.origin : "https://createai.digital";
  const url     = surface
    ? (surface.link.startsWith("http") ? surface.link : origin + surface.link)
    : origin;
  return {
    title: surface?.title ?? "CreateAI Brain",
    text:  surface?.tagline ?? "The AI OS for your entire business.",
    url,
  };
}

/** Trigger the Web Share API if available, fallback to clipboard copy. */
export async function shareSurface(id: string): Promise<"shared" | "copied" | "unavailable"> {
  const data = await getShareData(id);
  if (!data) return "unavailable";

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share(data.sharePayload);
      return "shared";
    } catch { /* user cancelled */ }
  }

  if (typeof navigator !== "undefined" && navigator.clipboard) {
    await navigator.clipboard.writeText(data.link).catch(() => {});
    return "copied";
  }

  return "unavailable";
}
