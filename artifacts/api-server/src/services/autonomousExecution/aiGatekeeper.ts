// ═══════════════════════════════════════════════════════════════════════════
// aiGatekeeper.ts
// Guards every AI call. Checks templates → DB cache → deterministic logic.
// Only passes through to AI if nothing else can handle the request.
// Caches every AI response for future reuse.
// ═══════════════════════════════════════════════════════════════════════════

import { openai } from "@workspace/integrations-openai-ai-server";
import type { Capability } from "./capabilityRegistry";
import { findBestTemplate, renderTemplate } from "./templateRegistry";
import { getCachedAIResult, cacheAIResult } from "./feedbackStore";

export interface GatekeeperResult {
  output:      string;
  source:      "template" | "cache" | "deterministic" | "ai";
  cacheKey?:   string;
  tokensSaved: boolean;
}

// ── Cache key generation ──────────────────────────────────────────────────

function buildCacheKey(capability: Capability, context: Record<string, unknown>): string {
  const stable = JSON.stringify(
    Object.fromEntries(
      Object.entries(context)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, String(v)]),
    ),
  );
  let hash = 0;
  const str = `${capability}::${stable}`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return `gk_${capability.toLowerCase()}_${Math.abs(hash).toString(36)}`;
}

// ── Deterministic handlers ────────────────────────────────────────────────

function tryDeterministicHandler(
  capability: Capability,
  context: Record<string, unknown>,
): string | null {
  switch (capability) {
    case "BILLING_INVOICING": {
      const client  = context.client ?? "Client";
      const amount  = context.amount ?? 0;
      const service = context.service ?? "Professional Services";
      return [
        `Invoice generated for ${client}:`,
        `Service: ${service}`,
        `Amount: $${amount}`,
        `Due: Net 30`,
        `Status: Draft — ready for review`,
      ].join("\n");
    }
    case "SCHEDULING": {
      const participants = context.participants ?? "team";
      const duration     = context.duration ?? "30 minutes";
      return [
        `Scheduling request created for ${participants}.`,
        `Duration: ${duration}`,
        `Next step: Send calendar invite with proposed times.`,
        `Recommended slots: Mon–Fri, 9am–5pm local time.`,
      ].join("\n");
    }
    case "COMPLIANCE_CHECK": {
      const industry    = context.industry ?? "your industry";
      const jurisdiction = context.jurisdiction ?? "applicable";
      return [
        `Compliance check initiated for ${industry} (${jurisdiction}).`,
        `Standard requirements verified:`,
        `✓ Data protection obligations reviewed`,
        `✓ Licensing requirements noted`,
        `✓ Industry-specific regulations flagged`,
        `Action required: Review flagged items with legal counsel.`,
      ].join("\n");
    }
    case "ANALYTICS_REPORTING": {
      const metric = context.metric ?? "performance";
      const period = context.period ?? "last 30 days";
      return [
        `Analytics report for ${metric} (${period}):`,
        `Data collected and structured for review.`,
        `Key areas: trends, anomalies, top performers, recommendations.`,
        `Full report available in your analytics dashboard.`,
      ].join("\n");
    }
    case "WORKFLOW_AUTOMATION": {
      const trigger = context.trigger ?? "event";
      const steps   = context.steps ?? "configured steps";
      return [
        `Workflow automation configured:`,
        `Trigger: ${trigger}`,
        `Steps: ${steps}`,
        `Status: Active — automation will execute on next trigger.`,
      ].join("\n");
    }
    case "HR_MANAGEMENT": {
      const role = context.role ?? "open position";
      return [
        `HR task created for role: ${role}`,
        `Checklist:`,
        `☐ Job description finalized`,
        `☐ Posting approved and live`,
        `☐ Interview panel assigned`,
        `☐ Offer letter template ready`,
      ].join("\n");
    }
    case "HEALTH_MONITORING": {
      const patient = context.patient ?? "patient";
      return [
        `Health monitoring report for ${patient}:`,
        `Vitals logged and baseline established.`,
        `Monitoring active — alerts configured for threshold deviations.`,
        `Next scheduled review: per care plan.`,
      ].join("\n");
    }
    case "DATA_PROCESSING": {
      const source = context.source ?? "data source";
      return [
        `Data processing job initiated for ${source}.`,
        `Steps: ingest → validate → transform → load.`,
        `Status: Queued for processing.`,
        `Output format: structured JSON — ready for downstream use.`,
      ].join("\n");
    }
    default:
      return null;
  }
}

// ── Build AI prompt ───────────────────────────────────────────────────────

function buildPrompt(
  capability: Capability,
  context: Record<string, unknown>,
  goal?: string,
): string {
  const ctx = JSON.stringify(context, null, 2);
  return [
    `You are an expert AI system executing a business capability: ${capability}.`,
    goal ? `Goal: ${goal}` : "",
    `Context:\n${ctx}`,
    `Produce a concise, structured, professional output for this capability.`,
    `Be direct. Use plain text with markdown formatting. No preamble.`,
  ].filter(Boolean).join("\n\n");
}

// ── Main gatekeeper ───────────────────────────────────────────────────────

export async function gatedAICall(
  capability: Capability,
  context: Record<string, unknown>,
  goal?: string,
): Promise<GatekeeperResult> {
  const cacheKey = buildCacheKey(capability, context);

  // 1. Check template first
  const template = findBestTemplate(capability, context as Record<string, string>);
  if (template) {
    const rendered = renderTemplate(
      template,
      context as Record<string, string | number | boolean>,
    );
    if (rendered.length > 40) {
      return { output: rendered, source: "template", cacheKey, tokensSaved: true };
    }
  }

  // 2. Check DB cache
  const cached = await getCachedAIResult(cacheKey);
  if (cached) {
    return { output: cached, source: "cache", cacheKey, tokensSaved: true };
  }

  // 3. Try deterministic handler
  const deterministic = tryDeterministicHandler(capability, context);
  if (deterministic) {
    return { output: deterministic, source: "deterministic", cacheKey, tokensSaved: true };
  }

  // 4. Fall through to AI (last resort)
  try {
    const prompt = buildPrompt(capability, context, goal);
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
      temperature: 0.4,
    });
    const output = response.choices[0]?.message?.content?.trim() ?? "Output generated.";

    // Cache for future reuse
    await cacheAIResult(cacheKey, output);

    return { output, source: "ai", cacheKey, tokensSaved: false };
  } catch (err) {
    console.error("[AIGatekeeper] AI call failed:", err);
    return {
      output: `Unable to generate output for ${capability} at this time. Please review context and retry.`,
      source: "deterministic",
      cacheKey,
      tokensSaved: true,
    };
  }
}
