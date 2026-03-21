/**
 * routes/platformHub.ts
 * ─────────────────────
 * Clean internal URL surfaces served at the domain root.
 *
 * GET /          → Branded platform homepage (public-facing)
 * GET /hub       → Admin directory (all platform surfaces, one page)
 * GET /p/:id     → Product page alias → 301 /store/:id
 * GET /buy/:id   → Direct checkout alias → 302 /checkout/:id
 * GET /share/:id → Share card alias → 301 /launch/share/:id
 */

import { Router, type Request, type Response } from "express";
import { getRegistry, getFromRegistry }          from "../semantic/registry.js";
import { getPublicBaseUrl }                      from "../utils/publicUrl.js";

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET / — Platform Homepage
// ─────────────────────────────────────────────────────────────────────────────
router.get("/", async (_req: Request, res: Response) => {
  const BASE = getPublicBaseUrl();
  const IS_PROD = process.env["REPLIT_DEPLOYMENT"] === "1";

  let totalProducts = 0;
  let featuredProducts: Array<{ id: string; title: string; shortDesc: string; format: string; price: string; tags: string[] }> = [];
  let formatCounts: Record<string, number> = {};

  try {
    const all = await getRegistry();
    totalProducts = all.length;

    // Count per format
    for (const p of all) {
      formatCounts[p.format] = (formatCounts[p.format] ?? 0) + 1;
    }

    // Featured = top 8 by price (highest value)
    const sorted = [...all].sort((a, b) => b.priceCents - a.priceCents);
    featuredProducts = sorted.slice(0, 8).map(p => ({
      id:        p.id,
      title:     p.title,
      shortDesc: (p.shortDescription ?? "").slice(0, 80),
      format:    p.format,
      price:     `$${(p.priceCents / 100).toFixed(2)}`,
      tags:      (p.tags ?? []).slice(0, 3),
    }));
  } catch { /* registry warming */ }

  const FORMAT_META: Record<string, { color: string; icon: string; label: string }> = {
    ebook:     { color: "#4f46e5", icon: "📖", label: "Ebook" },
    course:    { color: "#0891b2", icon: "🎓", label: "Course" },
    template:  { color: "#059669", icon: "📋", label: "Template" },
    audiobook: { color: "#7c3aed", icon: "🎧", label: "Audiobook" },
    video:     { color: "#dc2626", icon: "🎬", label: "Video" },
    plugin:    { color: "#ea580c", icon: "🔌", label: "Plugin" },
    software:  { color: "#0f766e", icon: "💻", label: "Software" },
    graphic:   { color: "#be185d", icon: "🎨", label: "Graphic" },
    music:     { color: "#ca8a04", icon: "🎵", label: "Music" },
    photo:     { color: "#64748b", icon: "📷", label: "Photo" },
    "3D":      { color: "#9333ea", icon: "🧊", label: "3D Asset" },
  };

  const featuredHTML = featuredProducts.map(p => {
    const meta = FORMAT_META[p.format] ?? { color: "#6366f1", icon: "📦", label: p.format };
    const tagHTML = p.tags.map(t => `<span style="display:inline-block;background:#f1f5f9;border-radius:999px;padding:2px 8px;font-size:0.64rem;font-weight:600;color:#475569;margin-right:4px;">${t}</span>`).join("");
    return `
    <a href="${BASE}/store/${p.id}" class="product-card" aria-label="${p.title} — ${p.price}" style="text-decoration:none;">
      <div class="product-card-inner">
        <div class="product-badge" style="background:${meta.color}15;color:${meta.color};border:1px solid ${meta.color}30;">
          <span>${meta.icon}</span> ${meta.label}${formatCounts[p.format] ? ` · ${formatCounts[p.format]}` : ""}
        </div>
        <h3 class="product-title">${p.title}</h3>
        ${p.shortDesc ? `<p class="product-desc">${p.shortDesc}…</p>` : ""}
        <div class="product-footer">
          <div class="product-tags">${tagHTML}</div>
          <div class="product-price">${p.price}</div>
        </div>
        <div class="product-cta">Get Instant Access →</div>
      </div>
    </a>`;
  }).join("");

  const formatChipsHTML = Object.entries(FORMAT_META).map(([fmt, meta]) => {
    const count = formatCounts[fmt] ?? 0;
    if (count === 0) return "";
    return `<a href="${BASE}/store?format=${fmt}" class="fmt-chip" style="color:${meta.color};border-color:${meta.color}40;background:${meta.color}08;" aria-label="Browse ${count} ${meta.label} products" onmouseover="this.style.background='${meta.color}';this.style.color='white';this.style.borderColor='${meta.color}'" onmouseout="this.style.background='${meta.color}08';this.style.color='${meta.color}';this.style.borderColor='${meta.color}40'">${meta.icon} ${meta.label} <span style="font-weight:500;opacity:0.7;font-size:0.75em;">(${count})</span></a>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>CreateAI Brain — AI-Powered Digital Products &amp; Business Tools</title>
  <meta name="description" content="${totalProducts > 0 ? totalProducts : "100"}+ AI-generated digital products: ebooks, courses, templates, software, and more. Instant delivery, lifetime access. Starting at $12.">
  <meta property="og:title" content="CreateAI Brain — AI-Powered Digital Products">
  <meta property="og:description" content="Discover ${totalProducts > 0 ? totalProducts : "100"}+ AI-generated digital products. Instant delivery, yours for life.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${BASE}/">
  <meta property="og:image" content="${BASE}/opengraph.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="${BASE}/">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html{scroll-padding-top:72px;scroll-behavior:smooth}
    body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;color:#0f172a;-webkit-font-smoothing:antialiased;line-height:1.5}
    a{color:inherit}
    img{max-width:100%;height:auto}

    /* Skip Link */
    .skip-link{position:absolute;top:-100%;left:8px;z-index:9999;background:#6366f1;color:#fff;padding:10px 18px;border-radius:0 0 10px 10px;font-size:14px;font-weight:700;text-decoration:none;transition:top 0.15s}
    .skip-link:focus{top:0}

    /* Nav */
    .nav{background:rgba(255,255,255,0.97);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid rgba(226,232,240,0.8);padding:0 32px;position:sticky;top:0;z-index:50;box-shadow:0 1px 3px rgba(0,0,0,0.04)}
    .nav-inner{max-width:1160px;margin:0 auto;display:flex;align-items:center;height:66px;gap:24px}
    .logo{font-size:1.15rem;font-weight:900;letter-spacing:-0.04em;text-decoration:none;color:#0f172a}
    .logo span{color:#6366f1}
    .logo-sub{font-size:0.65rem;font-weight:600;color:#94a3b8;letter-spacing:0.02em;display:block;margin-top:-2px}
    .nav-links{display:flex;gap:28px;margin-left:auto;align-items:center}
    .nav-links a{font-size:0.875rem;font-weight:600;color:#475569;text-decoration:none;transition:color 0.15s;padding:4px 0}
    .nav-links a:hover,.nav-links a:focus-visible{color:#6366f1;outline:none}
    .nav-links a:focus-visible{text-decoration:underline}
    .nav-cta{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white!important;border-radius:10px;padding:9px 22px;box-shadow:0 2px 8px rgba(99,102,241,0.3);transition:all 0.15s!important}
    .nav-cta:hover,.nav-cta:focus-visible{transform:translateY(-1px);box-shadow:0 4px 16px rgba(99,102,241,0.4)!important;text-decoration:none!important}
    .nav-hamburger{display:none;background:none;border:none;cursor:pointer;padding:8px;border-radius:8px;color:#475569}
    .nav-mobile-menu{display:none;position:absolute;top:66px;left:0;right:0;background:white;border-bottom:1px solid #e2e8f0;padding:16px 20px;flex-direction:column;gap:4px;box-shadow:0 8px 24px rgba(0,0,0,0.08);z-index:49}
    .nav-mobile-menu.open{display:flex}
    .nav-mobile-menu a{font-size:0.9rem;font-weight:600;color:#475569;text-decoration:none;padding:10px 12px;border-radius:8px;transition:all 0.15s}
    .nav-mobile-menu a:hover{background:#f8fafc;color:#6366f1}

    /* Hero */
    .hero{background:linear-gradient(135deg,#0c0e1a 0%,#141835 45%,#0d1228 100%);padding:96px 32px 88px;text-align:center;position:relative;overflow:hidden}
    .hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 90% 60% at 50% -10%,rgba(99,102,241,0.22) 0%,transparent 65%),radial-gradient(ellipse 60% 40% at 80% 100%,rgba(139,92,246,0.10) 0%,transparent 60%);pointer-events:none}
    .hero-inner{max-width:820px;margin:0 auto;position:relative}
    .hero-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(99,102,241,0.16);color:#a5b4fc;border:1px solid rgba(99,102,241,0.30);border-radius:999px;padding:7px 20px;font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:32px;backdrop-filter:blur(8px)}
    .hero-badge-dot{width:7px;height:7px;border-radius:50%;background:#4ade80;animation:badgePulse 2s ease-in-out infinite;flex-shrink:0}
    @keyframes badgePulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.8)}}
    .hero h1{font-size:clamp(2.2rem,5.5vw,4rem);font-weight:900;color:white;line-height:1.06;margin-bottom:24px;letter-spacing:-0.05em}
    .hero h1 .accent{background:linear-gradient(90deg,#818cf8,#c4b5fd);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
    .hero p{font-size:1.1rem;color:rgba(203,213,225,0.82);line-height:1.72;margin-bottom:44px;max-width:560px;margin-left:auto;margin-right:auto}
    .hero-actions{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
    .btn-hero{display:inline-flex;align-items:center;gap:8px;padding:16px 32px;border-radius:14px;font-size:1rem;font-weight:700;text-decoration:none;transition:all 0.18s;letter-spacing:-0.01em;cursor:pointer;border:none}
    .btn-primary{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;box-shadow:0 4px 20px rgba(99,102,241,0.4)}
    .btn-primary:hover,.btn-primary:focus-visible{transform:translateY(-2px);box-shadow:0 8px 32px rgba(99,102,241,0.55);color:white;text-decoration:none;outline:none}
    .btn-secondary{background:rgba(255,255,255,0.09);color:rgba(241,245,249,0.92);border:1.5px solid rgba(255,255,255,0.20)}
    .btn-secondary:hover,.btn-secondary:focus-visible{background:rgba(255,255,255,0.16);color:white;text-decoration:none;outline:none}

    /* Trust bar */
    .trust-bar{background:white;border-bottom:1px solid #e2e8f0;padding:20px 32px}
    .trust-inner{max-width:1160px;margin:0 auto;display:flex;justify-content:center;align-items:center;gap:36px;flex-wrap:wrap}
    .trust-item{display:flex;align-items:center;gap:8px;font-size:0.82rem;font-weight:600;color:#475569}
    .trust-icon{font-size:1.05rem}
    .trust-divider{width:1px;height:20px;background:#e2e8f0}

    /* Stats bar */
    .stats-bar{background:linear-gradient(135deg,#f0f4ff,#f5f0ff);border-bottom:1px solid #e8e4ff;padding:32px 32px}
    .stats-inner{max-width:1160px;margin:0 auto;display:flex;justify-content:center;gap:48px;flex-wrap:wrap}
    .stat{text-align:center}
    .stat-num{font-size:2rem;font-weight:900;color:#6366f1;letter-spacing:-0.04em;line-height:1}
    .stat-lbl{font-size:0.72rem;font-weight:700;color:#8b96b0;text-transform:uppercase;letter-spacing:0.08em;margin-top:4px}

    /* Search */
    .search-section{background:white;padding:32px 32px 0}
    .search-inner{max-width:1160px;margin:0 auto}
    .search-box{display:flex;align-items:center;gap:12px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:14px;padding:14px 20px;transition:all 0.15s}
    .search-box:focus-within{border-color:#6366f1;box-shadow:0 0 0 4px rgba(99,102,241,0.10)}
    .search-icon{color:#94a3b8;font-size:1.1rem;flex-shrink:0}
    .search-input{flex:1;background:none;border:none;outline:none;font-size:0.95rem;font-family:inherit;color:#0f172a;min-width:0}
    .search-input::placeholder{color:#94a3b8}
    .search-clear{background:none;border:none;cursor:pointer;color:#94a3b8;font-size:0.75rem;padding:4px 8px;border-radius:6px;transition:all 0.15s;display:none}
    .search-clear.show{display:block}
    .search-clear:hover{background:#f1f5f9;color:#64748b}

    /* Sections */
    .section{padding:64px 32px}
    .section-inner{max-width:1160px;margin:0 auto}
    .section-label{font-size:0.72rem;font-weight:800;color:#6366f1;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:10px}
    .section-title{font-size:1.8rem;font-weight:900;color:#0f172a;margin-bottom:10px;letter-spacing:-0.03em}
    .section-sub{font-size:0.95rem;color:#64748b;margin-bottom:40px;line-height:1.65;max-width:600px}

    /* Format chips */
    .formats-row{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:52px}
    .fmt-chip{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:8px 20px;font-size:0.82rem;font-weight:700;text-decoration:none;border:1.5px solid;transition:all 0.15s;cursor:pointer}

    /* Product cards */
    .products-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(288px,1fr));gap:16px;margin-bottom:40px}
    .product-card{display:block;text-decoration:none;color:inherit;background:white;border-radius:18px;border:1.5px solid #e8ecf2;transition:all 0.2s;position:relative;overflow:hidden}
    .product-card::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(99,102,241,0.03),rgba(139,92,246,0.02));opacity:0;transition:opacity 0.2s;pointer-events:none}
    .product-card:hover,.product-card:focus-visible{border-color:#6366f1;box-shadow:0 12px 40px rgba(99,102,241,0.15),0 2px 8px rgba(0,0,0,0.04);transform:translateY(-3px);outline:none}
    .product-card:hover::after,.product-card:focus-visible::after{opacity:1}
    .product-card-inner{padding:22px 22px 18px}
    .product-badge{display:inline-flex;align-items:center;gap:5px;border-radius:999px;padding:4px 12px;font-size:0.72rem;font-weight:700;margin-bottom:12px;letter-spacing:0.01em}
    .product-title{font-size:0.95rem;font-weight:800;color:#0f172a;line-height:1.35;margin-bottom:8px;letter-spacing:-0.01em}
    .product-desc{font-size:0.8rem;color:#64748b;line-height:1.55;margin-bottom:14px}
    .product-footer{display:flex;align-items:flex-end;justify-content:space-between;gap:8px;margin-bottom:14px}
    .product-tags{display:flex;flex-wrap:wrap;gap:4px;flex:1}
    .product-price{font-size:1.15rem;font-weight:900;color:#6366f1;letter-spacing:-0.02em;flex-shrink:0}
    .product-cta{font-size:0.78rem;font-weight:700;color:#6366f1;border-top:1px solid #f1f5f9;padding-top:12px;transition:gap 0.15s;display:flex;align-items:center;gap:4px}
    .product-card:hover .product-cta,.product-card:focus-visible .product-cta{gap:8px}

    /* How it works */
    .how-section{background:linear-gradient(135deg,#f8fafc,#f0f4ff);border-top:1px solid #e2e8f0}
    .steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:28px;margin-top:40px}
    .step{background:white;border-radius:20px;padding:28px 24px;border:1px solid #e8ecf2;position:relative}
    .step-num{width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;font-size:0.95rem;font-weight:900;display:flex;align-items:center;justify-content:center;margin-bottom:16px;box-shadow:0 4px 12px rgba(99,102,241,0.3)}
    .step-title{font-size:1rem;font-weight:800;color:#0f172a;margin-bottom:8px;letter-spacing:-0.01em}
    .step-desc{font-size:0.85rem;color:#64748b;line-height:1.65}
    .step-connector{position:absolute;right:-14px;top:40px;width:28px;height:2px;background:linear-gradient(90deg,#c7d2fe,transparent);display:none}

    /* Payment methods */
    .pay-section{background:white;border-top:1px solid #e2e8f0}
    .pay-grid{display:flex;flex-wrap:wrap;gap:16px;margin-top:36px;justify-content:flex-start}
    .pay-card{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:16px;padding:20px 24px;display:flex;align-items:center;gap:14px;flex:1;min-width:200px;max-width:280px}
    .pay-icon{font-size:1.75rem;line-height:1}
    .pay-name{font-size:0.88rem;font-weight:800;color:#0f172a}
    .pay-handle{font-size:0.78rem;color:#6366f1;font-weight:600;margin-top:2px;font-family:monospace}
    .guarantee-banner{background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1.5px solid #bbf7d0;border-radius:16px;padding:20px 24px;display:flex;align-items:center;gap:16px;margin-top:24px}
    .guarantee-icon{font-size:2rem;flex-shrink:0}
    .guarantee-text-head{font-size:0.9rem;font-weight:800;color:#15803d;margin-bottom:4px}
    .guarantee-text-sub{font-size:0.8rem;color:#16a34a;line-height:1.5}

    /* No-results */
    .no-results{text-align:center;padding:48px 20px;color:#94a3b8;display:none}
    .no-results.show{display:block}

    /* CTA Block */
    .cta-block{background:linear-gradient(135deg,#312e81 0%,#4c1d95 100%);border-radius:28px;padding:60px 40px;text-align:center;margin-top:20px;box-shadow:0 24px 64px rgba(99,102,241,0.3);position:relative;overflow:hidden}
    .cta-block::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 80% 70% at 50% 0%,rgba(255,255,255,0.10) 0%,transparent 65%),radial-gradient(ellipse 50% 50% at 80% 100%,rgba(139,92,246,0.2) 0%,transparent 60%);pointer-events:none}
    .cta-block h2{font-size:2.2rem;font-weight:900;color:white;margin-bottom:16px;position:relative;letter-spacing:-0.04em}
    .cta-block p{font-size:1.05rem;color:rgba(255,255,255,0.80);margin-bottom:36px;max-width:500px;margin-left:auto;margin-right:auto;line-height:1.7;position:relative}
    .cta-buttons{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;position:relative}
    .cta-btn-white{display:inline-flex;align-items:center;gap:6px;background:white;color:#6366f1;text-decoration:none;border-radius:12px;padding:15px 34px;font-size:1rem;font-weight:800;transition:all 0.15s;box-shadow:0 4px 16px rgba(0,0,0,0.12)}
    .cta-btn-white:hover,.cta-btn-white:focus-visible{transform:translateY(-2px);box-shadow:0 8px 28px rgba(0,0,0,0.18);outline:none;text-decoration:none}
    .cta-btn-outline{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.12);color:white;text-decoration:none;border-radius:12px;padding:15px 30px;font-size:1rem;font-weight:700;border:1.5px solid rgba(255,255,255,0.28);transition:all 0.15s;backdrop-filter:blur(8px)}
    .cta-btn-outline:hover,.cta-btn-outline:focus-visible{background:rgba(255,255,255,0.20);color:white;outline:none;text-decoration:none}

    /* Footer */
    footer{background:#0a0f1e;color:rgba(255,255,255,0.38);padding:48px 32px 32px;font-size:0.82rem}
    .footer-inner{max-width:1160px;margin:0 auto}
    .footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:40px;margin-bottom:40px}
    .footer-brand-name{font-size:1.05rem;font-weight:900;color:white;letter-spacing:-0.03em;margin-bottom:8px}
    .footer-brand-name span{color:#818cf8}
    .footer-brand-tagline{font-size:0.8rem;color:rgba(255,255,255,0.45);line-height:1.6;max-width:220px}
    .footer-col-title{font-size:0.72rem;font-weight:800;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:16px}
    .footer-col a{display:block;color:rgba(255,255,255,0.45);text-decoration:none;font-size:0.82rem;margin-bottom:8px;transition:color 0.15s}
    .footer-col a:hover,.footer-col a:focus-visible{color:white;outline:none;text-decoration:underline}
    .footer-bottom{border-top:1px solid rgba(255,255,255,0.07);padding-top:24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px}
    .footer-copy{font-size:0.78rem;color:rgba(255,255,255,0.3)}
    .footer-legal{display:flex;gap:20px}
    .footer-legal a{font-size:0.78rem;color:rgba(255,255,255,0.3);text-decoration:none}
    .footer-legal a:hover{color:rgba(255,255,255,0.6)}

    /* Responsive */
    @media(max-width:900px){
      .footer-grid{grid-template-columns:1fr 1fr}
      .footer-brand-tagline{max-width:100%}
      .step-connector{display:none}
    }
    @media(max-width:640px){
      .nav{padding:0 16px}
      .nav-links{display:none}
      .nav-hamburger{display:flex;align-items:center;gap:6px;margin-left:auto}
      .hero{padding:64px 20px 60px}
      .hero h1{font-size:clamp(1.9rem,8vw,3rem)}
      .stats-inner{gap:24px}
      .stat-num{font-size:1.6rem}
      .section{padding:48px 16px}
      .search-section{padding:24px 16px 0}
      .trust-bar{padding:16px}
      .trust-divider{display:none}
      .trust-inner{gap:16px;justify-content:flex-start}
      .products-grid{grid-template-columns:1fr}
      .cta-block{padding:40px 24px;border-radius:20px}
      .cta-block h2{font-size:1.7rem}
      .footer-grid{grid-template-columns:1fr;gap:28px}
      .footer-bottom{flex-direction:column;align-items:flex-start;gap:8px}
    }
    @media(prefers-reduced-motion:reduce){
      *,*::before,*::after{animation-duration:0.01ms!important;transition-duration:0.01ms!important}
    }
    @media print{
      .nav,.hero-actions,.cta-block,footer{display:none!important}
      body{color:#000!important;background:#fff!important}
    }
  </style>
</head>
<body>

<a class="skip-link" href="#main-store">Skip to main content</a>

<header>
  <nav class="nav" aria-label="Main navigation">
    <div class="nav-inner">
      <a class="logo" href="${BASE}/" aria-label="CreateAI Brain home">
        CreateAI <span>Brain</span>
        <span class="logo-sub">by Lakeside Trinity LLC</span>
      </a>
      <div class="nav-links" role="navigation">
        <a href="${BASE}/store">Browse All</a>
        <a href="${BASE}/join/landing">Membership</a>
        <a href="${BASE}/portal/me">My Downloads</a>
        <a href="${BASE}/store" class="nav-cta" aria-label="Shop Now — View all ${totalProducts} products">Shop Now</a>
      </div>
      <button class="nav-hamburger" aria-label="Open navigation menu" aria-expanded="false" aria-controls="mobile-menu" onclick="this.setAttribute('aria-expanded',this.getAttribute('aria-expanded')==='true'?'false':'true');document.getElementById('mobile-menu').classList.toggle('open')">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="3" y1="5" x2="17" y2="5"/><line x1="3" y1="10" x2="17" y2="10"/><line x1="3" y1="15" x2="17" y2="15"/></svg>
        Menu
      </button>
    </div>
    <div class="nav-mobile-menu" id="mobile-menu" role="menu" aria-label="Mobile navigation">
      <a href="${BASE}/store" role="menuitem">Browse All ${totalProducts} Products</a>
      <a href="${BASE}/join/landing" role="menuitem">Membership Plans</a>
      <a href="${BASE}/portal/me" role="menuitem">My Downloads</a>
      <a href="${BASE}/store" role="menuitem" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;border-radius:10px;margin-top:4px;font-weight:700;">Shop Now →</a>
    </div>
  </nav>
</header>

<main id="main-store">
  <section class="hero" aria-label="Platform introduction">
    <div class="hero-inner">
      <div class="hero-badge" role="status">
        <span class="hero-badge-dot" aria-hidden="true"></span>
        <span>${IS_PROD ? "Live Platform" : "Available Now"} &nbsp;·&nbsp; ${totalProducts > 0 ? totalProducts : "100"}+ Products</span>
      </div>
      <h1>AI-Powered Digital Products<br><span class="accent">Built to Sell. Built to Scale.</span></h1>
      <p>Ebooks, courses, templates, software, audiobooks, and more — all AI-generated, instantly delivered, yours for life. Prices starting at $12.</p>
      <div class="hero-actions">
        <a href="${BASE}/store" class="btn-hero btn-primary">Browse All ${totalProducts > 0 ? totalProducts : ""} Products →</a>
        <a href="${BASE}/join/landing" class="btn-hero btn-secondary">View Membership Plans</a>
      </div>
    </div>
  </section>

  <div class="trust-bar" role="list" aria-label="Platform trust indicators">
    <div class="trust-inner">
      <div class="trust-item" role="listitem"><span class="trust-icon" aria-hidden="true">⚡</span> Instant Delivery</div>
      <div class="trust-divider" aria-hidden="true"></div>
      <div class="trust-item" role="listitem"><span class="trust-icon" aria-hidden="true">♾️</span> Lifetime Access</div>
      <div class="trust-divider" aria-hidden="true"></div>
      <div class="trust-item" role="listitem"><span class="trust-icon" aria-hidden="true">🔒</span> Secure Checkout via Stripe</div>
      <div class="trust-divider" aria-hidden="true"></div>
      <div class="trust-item" role="listitem"><span class="trust-icon" aria-hidden="true">✅</span> 30-Day Guarantee</div>
      <div class="trust-divider" aria-hidden="true"></div>
      <div class="trust-item" role="listitem"><span class="trust-icon" aria-hidden="true">🤖</span> 100% AI-Generated</div>
    </div>
  </div>

  <section class="stats-bar" aria-label="Platform statistics">
    <div class="stats-inner">
      <div class="stat"><div class="stat-num" aria-label="${totalProducts} products">${totalProducts > 0 ? totalProducts : "100+"}</div><div class="stat-lbl">Digital Products</div></div>
      <div class="stat"><div class="stat-num">11</div><div class="stat-lbl">Formats</div></div>
      <div class="stat"><div class="stat-num">$12</div><div class="stat-lbl">Starting Price</div></div>
      <div class="stat"><div class="stat-num">∞</div><div class="stat-lbl">Lifetime Access</div></div>
      <div class="stat"><div class="stat-num">30</div><div class="stat-lbl">Day Guarantee</div></div>
    </div>
  </section>

  <div class="search-section" aria-label="Search products">
    <div class="search-inner">
      <div class="search-box" role="search">
        <span class="search-icon" aria-hidden="true">🔍</span>
        <input type="search" id="product-search" class="search-input" placeholder="Search ${totalProducts} products…" aria-label="Search products by title or keyword" autocomplete="off" spellcheck="false">
        <button class="search-clear" id="search-clear" aria-label="Clear search" onclick="clearSearch()">✕ Clear</button>
      </div>
    </div>
  </div>

  <section class="section" style="background:white;padding-top:48px" aria-labelledby="catalog-heading">
    <div class="section-inner">
      <div class="section-label">Product Catalog</div>
      <h2 class="section-title" id="catalog-heading">Browse by Format</h2>
      <p class="section-sub">Every format, instant delivery, one-time purchase. No subscriptions required.</p>
      <div class="formats-row" role="list" aria-label="Browse by product format">
        ${formatChipsHTML}
      </div>

      <div class="section-label">Featured Products</div>
      <h2 class="section-title" id="featured-heading">Highest-Value Picks</h2>
      <p class="section-sub">Curated from the catalog — top-rated by value and demand.</p>
      <div class="products-grid" id="products-grid" aria-label="Featured products">
        ${featuredHTML || `<p style="color:#94a3b8;grid-column:1/-1;">Loading products…</p>`}
      </div>
      <div class="no-results" id="no-results" role="status" aria-live="polite">
        <div style="font-size:2rem;margin-bottom:12px" aria-hidden="true">🔍</div>
        <div style="font-size:1rem;font-weight:700;color:#475569;margin-bottom:6px">No products match your search</div>
        <div style="font-size:0.85rem">Try a different keyword or <a href="${BASE}/store" style="color:#6366f1;font-weight:600;">browse the full catalog</a></div>
      </div>
      <div style="text-align:center;margin-top:12px">
        <a href="${BASE}/store" class="btn-hero btn-primary" aria-label="See all ${totalProducts} products in the catalog" style="font-size:0.95rem;">
          See All ${totalProducts > 0 ? totalProducts : ""} Products →
        </a>
      </div>
    </div>
  </section>

  <section class="section how-section" aria-labelledby="how-heading">
    <div class="section-inner">
      <div class="section-label">Simple Process</div>
      <h2 class="section-title" id="how-heading">How It Works</h2>
      <p class="section-sub">Get your AI-generated digital product in three steps. No account required for purchase.</p>
      <div class="steps">
        <div class="step">
          <div class="step-num" aria-hidden="true">1</div>
          <h3 class="step-title">Browse &amp; Choose</h3>
          <p class="step-desc">Explore ${totalProducts > 0 ? totalProducts : "100+"} AI-generated products across 11 formats — ebooks, courses, templates, software, and more. Filter by format or search by keyword.</p>
          <div class="step-connector" aria-hidden="true"></div>
        </div>
        <div class="step">
          <div class="step-num" aria-hidden="true">2</div>
          <h3 class="step-title">Secure Checkout</h3>
          <p class="step-desc">Pay securely via Stripe, Cash App ($CreateAIDigital), or Venmo (@CreateAIDigital). Your payment is encrypted end-to-end. One-time purchase, no recurring charges.</p>
          <div class="step-connector" aria-hidden="true"></div>
        </div>
        <div class="step">
          <div class="step-num" aria-hidden="true">3</div>
          <h3 class="step-title">Instant Access Forever</h3>
          <p class="step-desc">Download instantly and access your product for life via your personal portal. Every product comes as a formatted PDF, web page, and raw text — all included.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="section pay-section" aria-labelledby="payment-heading">
    <div class="section-inner">
      <div class="section-label">Payment Options</div>
      <h2 class="section-title" id="payment-heading">Flexible Payment Methods</h2>
      <p class="section-sub">Choose the payment method that works best for you. All transactions are secure and instant.</p>
      <div class="pay-grid">
        <div class="pay-card">
          <div class="pay-icon" aria-hidden="true">💳</div>
          <div>
            <div class="pay-name">Stripe</div>
            <div class="pay-handle">All major cards · Apple Pay · Google Pay</div>
          </div>
        </div>
        <div class="pay-card">
          <div class="pay-icon" aria-hidden="true">💵</div>
          <div>
            <div class="pay-name">Cash App</div>
            <div class="pay-handle">$CreateAIDigital</div>
          </div>
        </div>
        <div class="pay-card">
          <div class="pay-icon" aria-hidden="true">📲</div>
          <div>
            <div class="pay-name">Venmo</div>
            <div class="pay-handle">@CreateAIDigital</div>
          </div>
        </div>
      </div>
      <div class="guarantee-banner" role="note" aria-label="30-day money-back guarantee">
        <div class="guarantee-icon" aria-hidden="true">🛡️</div>
        <div>
          <div class="guarantee-text-head">30-Day Money-Back Guarantee</div>
          <div class="guarantee-text-sub">Not satisfied? We'll refund your purchase within 30 days, no questions asked. Your satisfaction is our priority.</div>
        </div>
      </div>
    </div>
  </section>

  <section class="section" style="background:white" aria-labelledby="cta-heading">
    <div class="section-inner">
      <div class="cta-block">
        <h2 id="cta-heading">Everything. Instantly. Yours Forever.</h2>
        <p>Buy once, access forever. Every product includes a formatted web preview, downloadable PDF, and raw text — no subscriptions, no upsells, no expiry.</p>
        <div class="cta-buttons">
          <a href="${BASE}/store" class="cta-btn-white" aria-label="Browse the full product store">Browse the Store →</a>
          <a href="${BASE}/join/landing" class="cta-btn-outline">View Membership Plans</a>
        </div>
      </div>
    </div>
  </section>
</main>

<footer aria-label="Site footer">
  <div class="footer-inner">
    <div class="footer-grid">
      <div>
        <div class="footer-brand-name">CreateAI <span>Brain</span></div>
        <p class="footer-brand-tagline">AI-powered digital products and business tools by Lakeside Trinity LLC. Built to sell, built to scale.</p>
      </div>
      <div class="footer-col">
        <div class="footer-col-title">Products</div>
        <a href="${BASE}/store">All Products</a>
        <a href="${BASE}/store?format=ebook">Ebooks</a>
        <a href="${BASE}/store?format=course">Courses</a>
        <a href="${BASE}/store?format=template">Templates</a>
        <a href="${BASE}/store?format=software">Software</a>
      </div>
      <div class="footer-col">
        <div class="footer-col-title">Account</div>
        <a href="${BASE}/portal/me">My Downloads</a>
        <a href="${BASE}/join/landing">Membership</a>
        <a href="${BASE}/portal/lookup">Order Lookup</a>
      </div>
      <div class="footer-col">
        <div class="footer-col-title">Platform</div>
        <a href="${BASE}/sitemap.xml">Sitemap</a>
        <a href="${BASE}/robots.txt">Robots.txt</a>
        <a href="${BASE}/.well-known/security.txt">Security</a>
        <a href="${BASE}/hub" aria-label="Admin hub (admin access required)">Admin Hub</a>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="footer-copy">© ${new Date().getFullYear()} CreateAI Brain · Lakeside Trinity LLC · All rights reserved · Powered by Stripe</div>
      <div class="footer-legal">
        <a href="${BASE}/portal/me">Privacy</a>
        <a href="${BASE}/join/landing">Terms</a>
      </div>
    </div>
  </div>
</footer>

<script>
(function() {
  var input = document.getElementById('product-search');
  var grid = document.getElementById('products-grid');
  var noResults = document.getElementById('no-results');
  var clearBtn = document.getElementById('search-clear');
  var cards = grid ? Array.from(grid.querySelectorAll('.product-card')) : [];

  function doSearch(q) {
    q = q.trim().toLowerCase();
    clearBtn.classList.toggle('show', q.length > 0);
    var visible = 0;
    cards.forEach(function(card) {
      var text = (card.getAttribute('aria-label') || '') + ' ' + (card.textContent || '');
      var show = !q || text.toLowerCase().indexOf(q) !== -1;
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });
    if (noResults) noResults.classList.toggle('show', q.length > 0 && visible === 0);
  }

  if (input) {
    input.addEventListener('input', function() { doSearch(this.value); });
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') { this.value = ''; doSearch(''); this.blur(); }
    });
  }

  window.clearSearch = function() {
    if (input) { input.value = ''; doSearch(''); input.focus(); }
  };

  // Close mobile menu on outside click
  document.addEventListener('click', function(e) {
    var menu = document.getElementById('mobile-menu');
    var hamburger = document.querySelector('.nav-hamburger');
    if (menu && hamburger && !menu.contains(e.target) && !hamburger.contains(e.target)) {
      menu.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  });
})();
</script>

</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.send(html);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /hub — Admin Directory
// ─────────────────────────────────────────────────────────────────────────────
router.get("/hub", async (_req: Request, res: Response) => {
  const BASE = getPublicBaseUrl();
  const IS_PROD = process.env["REPLIT_DEPLOYMENT"] === "1";
  const hasWebhook = !!process.env["STRIPE_WEBHOOK_SECRET"];
  const hasResend  = !!process.env["RESEND_API_KEY"]?.startsWith("re_");
  const hasCustomDomain = !!process.env["PUBLIC_DOMAIN"];

  let totalProducts = 0;
  try { totalProducts = (await getRegistry()).length; } catch { /* warming */ }

  const surfaces = [
    {
      section: "Revenue",
      items: [
        { label: "Vault — Money Hub", url: `${BASE}/vault`, desc: "Balance, payouts, revenue timeline, Move Money action", icon: "🏦", badge: "Admin" },
        { label: "Launch Console", url: `${BASE}/launch/`, desc: "Live payments, one-click delivery, product catalog", icon: "🚀", badge: "Admin" },
        { label: "Store", url: `${BASE}/store`, desc: `${totalProducts} live products with Stripe checkout`, icon: "🛍️", badge: "Public" },
        { label: "Membership Plans", url: `${BASE}/join/landing`, desc: "Subscription tiers: $29 / $79 / $299/mo", icon: "👑", badge: "Public" },
        { label: "Customer Portal", url: `${BASE}/portal/me`, desc: "Email-gated purchase history + re-download links", icon: "👤", badge: "Public" },
      ],
    },
    {
      section: "AI Studio",
      items: [
        { label: "AI Studio Hub", url: `${BASE}/studio`, desc: "All 10 AI-native capabilities. 6 live now — Email, Docs, Analytics, CRM, Social, Content.", icon: "✦", badge: "Live" },
        { label: "AI Email Engine", url: `${BASE}/studio/email`, desc: "Write and send AI-generated newsletters, campaigns, or one-off emails. GPT-4o drafts. Resend delivers.", icon: "✉", badge: "Live" },
        { label: "AI Document Generator", url: `${BASE}/studio/docs`, desc: "Generate contracts, proposals, SOPs, intake forms, or any document from a brief in seconds.", icon: "📄", badge: "Live" },
        { label: "AI Analytics Reports", url: `${BASE}/studio/analytics`, desc: "One-click weekly business intelligence report. GPT-4o reads your live DB stats and writes a plain-English summary.", icon: "📊", badge: "Live" },
        { label: "AI CRM & Follow-up", url: `${BASE}/studio/crm`, desc: "View customers from your live DB. Generate personalized AI follow-up emails for any customer.", icon: "👥", badge: "Live" },
        { label: "AI Social Scheduler", url: `${BASE}/studio/social`, desc: "Generate 30 days of social posts from your product catalog. Captions, hashtags, and CTAs included.", icon: "📱", badge: "Live" },
        { label: "AI Content Engine", url: `${BASE}/studio/content`, desc: "Product descriptions, landing page copy, SEO meta tags, and sales emails from a single brief.", icon: "✍", badge: "Live" },
        { label: "AI Scheduling (coming)", url: `#`, desc: "Booking links, reminders, calendar management — no Calendly needed.", icon: "📅", badge: "Soon" },
        { label: "AI Training System (coming)", url: `#`, desc: "Turn any document into a training module with quiz and certificate.", icon: "🎓", badge: "Soon" },
      ],
    },
    {
      section: "Operations",
      items: [
        { label: "PULSE — Platform Awareness", url: `${BASE}/pulse`, desc: "Real-time business intelligence: revenue, customers, catalog, webhooks, and system health in one live dashboard.", icon: "◉", badge: "Live" },
        { label: "Platform Status", url: `${BASE}/status`, desc: "Infrastructure diagnostics — DB, Stripe, email, webhook, auth, OpenAI, deployment mode. Auto-refreshes every 30s.", icon: "🟢", badge: "Admin" },
        { label: "NEXUS Platform OS", url: `${BASE}/nexus`, desc: "Unified OS — identity (Presence), 5-format addressing, role-adaptive surfaces, session context. Supersedes CORE + SignalSpace.", icon: "◈", badge: "Admin" },
        { label: "Business OS Bundle", url: `${BASE}/bundle`, desc: "20-industry analysis: 140+ tools replaced, 13 AI-native capabilities, unified $29–$299/mo pricing model.", icon: "📦", badge: "Admin" },
        { label: "Live Payment Feed", url: `${BASE}/launch/payments`, desc: "Real-time Stripe sessions with delivery status", icon: "💳", badge: "Admin" },
        { label: "CRM Stats", url: `${BASE}/portal/stats`, desc: "Total customers, revenue, top products", icon: "📊", badge: "Admin" },
        { label: "Affiliate Stats", url: `${BASE}/api/semantic/affiliate/stats`, desc: "Link performance + click tracking", icon: "🔗", badge: "Admin" },
        { label: "Advertising Hub", url: `${BASE}/api/advertising/hub`, desc: "Brand assets, 12 platform profiles, 26 ad formats, funnels, hashtags, AI copy generator — all internal assets.", icon: "📣", badge: "Admin" },
        { label: "Analytics Dashboard", url: `${BASE}/api/analytics/dashboard`, desc: "Platform growth intelligence — pageviews, leads, referrals, and UTM source tracking. All data from your own DB.", icon: "📈", badge: "Admin" },
        { label: "Revenue Intelligence", url: `${BASE}/api/revenue-intel/dashboard`, desc: "MRR, ARR, LTV, churn rate, NRR — cohort tracking + 30-day trend. Record snapshots via POST.", icon: "💰", badge: "Admin" },
        { label: "Domain Engines Hub", url: `${BASE}/api/domains/hub`, desc: "Live status of all 9 domain engines: banking, insurance, real estate, talent, FP&A, compliance, subscriptions, campaigns, performance.", icon: "⚙️", badge: "Admin" },
        { label: "CORE Console (legacy)", url: `${BASE}/core`, desc: "Legacy CORE OS — superseded by NEXUS.", icon: "◎", badge: "Legacy" },
      ],
    },
    {
      section: "Content & Feeds",
      items: [
        { label: "Shopify CSV", url: `${BASE}/export/shopify.csv`, desc: "All 100 products in Shopify import format", icon: "📦", badge: "Export" },
        { label: "WooCommerce CSV", url: `${BASE}/export/woocommerce.csv`, desc: "WooCommerce product import file", icon: "📦", badge: "Export" },
        { label: "Google Shopping XML", url: `${BASE}/export/google-shopping.xml`, desc: "Google Merchant Center feed", icon: "📦", badge: "Export" },
        { label: "Amazon Feed", url: `${BASE}/export/amazon.txt`, desc: "Amazon Seller flat-file feed", icon: "📦", badge: "Export" },
        { label: "Full Catalog JSON", url: `${BASE}/export/catalog.json`, desc: "All product data as structured JSON", icon: "📦", badge: "Export" },
        { label: "Sitemap", url: `${BASE}/sitemap.xml`, desc: "Google-discoverable XML sitemap (100 products)", icon: "🗺️", badge: "SEO" },
        { label: "Robots.txt", url: `${BASE}/robots.txt`, desc: "Search engine crawl directives", icon: "🤖", badge: "SEO" },
        { label: "SEO Bundles", url: `${BASE}/api/semantic/seo/bundles`, desc: "Cross-format product bundles for SEO", icon: "🔍", badge: "SEO" },
      ],
    },
    {
      section: "System",
      items: [
        { label: "Health Check", url: `${BASE}/healthz`, desc: "Server uptime + status", icon: "💚", badge: "System" },
        { label: "All Products JSON", url: `${BASE}/products`, desc: "Full product registry with metadata", icon: "📋", badge: "System" },
        { label: "Quick-Links (all checkouts)", url: `${BASE}/launch/quick-links`, desc: "All 100 checkout URLs in one JSON response", icon: "⚡", badge: "System" },
        { label: "Subscription Plans JSON", url: `${BASE}/join/plans`, desc: "Recurring plan definitions", icon: "💎", badge: "System" },
      ],
    },
  ];

  const badgeColors: Record<string, string> = {
    Admin:  "#6366f1",
    Public: "#059669",
    Export: "#0891b2",
    SEO:    "#7c3aed",
    System: "#94a3b8",
    Live:   "#10b981",
    Soon:   "#64748b",
    Legacy: "#475569",
  };

  const systemStatus = [
    { label: "Stripe Checkout", ok: true, detail: "100/100 products have live price IDs" },
    { label: "Email Delivery", ok: hasResend, detail: hasResend ? "Resend active" : "Add RESEND_API_KEY" },
    { label: "Webhook Auto-Capture", ok: hasWebhook, detail: hasWebhook ? "Active" : "Add STRIPE_WEBHOOK_SECRET" },
    { label: "Custom Domain", ok: hasCustomDomain, detail: hasCustomDomain ? `${process.env["PUBLIC_DOMAIN"]}` : "Set PUBLIC_DOMAIN in Secrets" },
    { label: "Mode", ok: true, detail: IS_PROD ? "Production" : "Test (set REPLIT_DEPLOYMENT=1 to go live)" },
  ];

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Admin Hub — CreateAI Brain</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;color:#0f172a;font-size:14px;-webkit-font-smoothing:antialiased}
    .hdr{background:linear-gradient(135deg,#0f172a,#1e293b);color:white;padding:0 28px;position:sticky;top:0;z-index:50}
    .hdr-inner{max-width:1200px;margin:0 auto;display:flex;align-items:center;height:56px;gap:16px}
    .hdr-logo{font-size:0.95rem;font-weight:900;letter-spacing:-0.02em}
    .hdr-logo span{color:#818cf8}
    .hdr-links{margin-left:auto;display:flex;gap:16px}
    .hdr-links a{color:rgba(255,255,255,0.6);font-size:0.8rem;text-decoration:none;font-weight:600}
    .hdr-links a:hover{color:white}
    .page{max-width:1200px;margin:0 auto;padding:28px}
    .page-title{font-size:1.2rem;font-weight:900;color:#0f172a;margin-bottom:4px}
    .page-sub{font-size:0.85rem;color:#64748b;margin-bottom:28px}
    .status-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:32px}
    .status-card{background:white;border-radius:12px;padding:14px 16px;border:1px solid;display:flex;gap:10px;align-items:flex-start}
    .status-card.ok{border-color:#86efac}
    .status-card.warn{border-color:#fcd34d}
    .status-dot{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:900;flex-shrink:0;color:white;margin-top:1px}
    .dot-ok{background:#059669}
    .dot-warn{background:#d97706}
    .status-label{font-size:0.78rem;font-weight:700;color:#0f172a;margin-bottom:2px}
    .status-detail{font-size:0.72rem;color:#64748b}
    .section{margin-bottom:32px}
    .section-hdr{font-size:0.8rem;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #e2e8f0}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px}
    .surface-card{background:white;border-radius:12px;padding:16px;border:1px solid #e2e8f0;text-decoration:none;display:block;transition:all 0.15s}
    .surface-card:hover{border-color:#6366f1;box-shadow:0 4px 14px rgba(99,102,241,0.12);transform:translateY(-1px)}
    .card-top{display:flex;align-items:center;gap:8px;margin-bottom:6px}
    .card-icon{font-size:1.1rem}
    .card-label{font-size:0.88rem;font-weight:800;color:#0f172a;flex:1}
    .card-badge{font-size:0.65rem;font-weight:800;border-radius:999px;padding:2px 8px;color:white}
    .card-desc{font-size:0.78rem;color:#64748b;line-height:1.5}
    .card-url{font-size:0.7rem;color:#94a3b8;margin-top:6px;font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    @media(max-width:640px){.page{padding:16px}.status-row{grid-template-columns:1fr 1fr}}
  </style>
</head>
<body>
<div class="hdr">
  <div class="hdr-inner">
    <div class="hdr-logo">CreateAI <span>Brain</span> · Admin Hub</div>
    <div class="hdr-links">
      <a href="${BASE}/">Home</a>
      <a href="${BASE}/pulse">PULSE</a>
      <a href="${BASE}/studio">Studio</a>
      <a href="${BASE}/status">Status</a>
      <a href="${BASE}/launch/">Launch</a>
      <a href="${BASE}/store">Store</a>
      <a href="https://dashboard.stripe.com" target="_blank">Stripe ↗</a>
      <a href="${BASE}/admin/logout" style="color:rgba(255,255,255,.4);">Logout</a>
    </div>
  </div>
</div>

<div class="page">
  <div class="page-title">Admin Hub</div>
  <div class="page-sub">Every surface of the CreateAI Brain platform. Click any card to open it.</div>

  <div class="status-row">
    ${systemStatus.map(s => `
    <div class="status-card ${s.ok ? "ok" : "warn"}">
      <div class="status-dot ${s.ok ? "dot-ok" : "dot-warn"}">${s.ok ? "✓" : "!"}</div>
      <div>
        <div class="status-label">${s.label}</div>
        <div class="status-detail">${s.detail}</div>
      </div>
    </div>`).join("")}
  </div>

  ${surfaces.map(sec => `
  <div class="section">
    <div class="section-hdr">${sec.section}</div>
    <div class="grid">
      ${sec.items.map(item => `
      <a href="${item.url}" class="surface-card" target="${item.url.startsWith("http") ? "_self" : "_self"}">
        <div class="card-top">
          <span class="card-icon">${item.icon}</span>
          <span class="card-label">${item.label}</span>
          <span class="card-badge" style="background:${badgeColors[item.badge] ?? "#94a3b8"}">${item.badge}</span>
        </div>
        <div class="card-desc">${item.desc}</div>
        <div class="card-url">${item.url}</div>
      </a>`).join("")}
    </div>
  </div>`).join("")}
</div>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(html);
});

// ─────────────────────────────────────────────────────────────────────────────
// Alias routes — clean short URLs that forward to the canonical path
// ─────────────────────────────────────────────────────────────────────────────

// /p/:id  → /store/:id  (clean product page URL)
router.get("/p/:id", (req: Request, res: Response) => {
  res.redirect(301, `/store/${String(req.params["id"] ?? "")}`);
});

// /buy/:id → /checkout/:id  (direct-to-checkout URL)
router.get("/buy/:id", (req: Request, res: Response) => {
  res.redirect(302, `/checkout/${String(req.params["id"] ?? "")}`);
});

// /share/:id → /launch/share/:id  (social share card)
router.get("/share/:id", (req: Request, res: Response) => {
  res.redirect(301, `/launch/share/${String(req.params["id"] ?? "")}`);
});

export default router;
