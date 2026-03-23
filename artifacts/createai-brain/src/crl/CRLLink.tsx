/**
 * CRLLink — Drop-in anchor component that resolves CRL URIs
 * ──────────────────────────────────────────────────────────
 * Use instead of <a href="..."> whenever linking between platform surfaces.
 * Resolves instantly for all built-in schemes (no network call).
 *
 * Usage:
 *   <CRLLink crl="os://settings">Settings</CRLLink>
 *   <CRLLink crl="hub://healthcare" className="btn">Healthcare Hub</CRLLink>
 *   <CRLLink crl="family://bank" fallbackHref="/family-hub">Family Bank</CRLLink>
 *
 * Props:
 *   crl          — CRL URI to resolve (e.g. "brain://tools/writer")
 *   fallbackHref — shown while loading or on error (default: "#")
 *   internal     — if true, use wouter <Link> for SPA navigation (default: true for same-origin)
 *   All standard <a> attributes are forwarded.
 */

import React from "react";
import { useCRL } from "./useCRL";

interface CRLLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  crl:          string;
  fallbackHref?: string;
  internal?:    boolean;     // force SPA navigation (default: auto-detected)
}

export function CRLLink({
  crl,
  fallbackHref,
  internal,
  children,
  className,
  ...rest
}: CRLLinkProps) {
  const { url, loading, error } = useCRL(crl);

  const href = url ?? fallbackHref ?? "#";

  // Auto-detect: internal if no protocol in resolved URL
  const isSPA = internal ?? (!href.startsWith("http") || href.includes(window.location.hostname));

  if (loading && !url) {
    return (
      <span className={className} aria-busy="true" {...(rest as React.HTMLAttributes<HTMLSpanElement>)}>
        {children ?? "…"}
      </span>
    );
  }

  if (error && !url && !fallbackHref) {
    return (
      <span className={className} title={`CRL error: ${error}`} {...(rest as React.HTMLAttributes<HTMLSpanElement>)}>
        {children ?? "Invalid link"}
      </span>
    );
  }

  if (isSPA) {
    // Use native navigation — wouter intercepts same-origin links
    return (
      <a href={href} className={className} {...rest}>
        {children ?? href}
      </a>
    );
  }

  return (
    <a href={href} className={className} target="_blank" rel="noreferrer" {...rest}>
      {children ?? href}
    </a>
  );
}

// ── CRLText — resolve CRL to text (non-link) ──────────────────────────────────

export function CRLText({ crl, fallback = "—" }: { crl: string; fallback?: string }) {
  const { url, loading } = useCRL(crl);
  if (loading) return <span className="text-gray-300 animate-pulse">…</span>;
  return <span>{url ?? fallback}</span>;
}
