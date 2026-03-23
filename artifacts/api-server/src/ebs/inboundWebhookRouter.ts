/**
 * ebs/inboundWebhookRouter.ts — Generic inbound webhook router
 *
 * Receives webhooks from any external source (Twilio, Zapier, Slack,
 * custom partners). For each inbound request it:
 *   1. Verifies the HMAC signature (if a secret is registered)
 *   2. Checks idempotency (skips duplicates)
 *   3. Appends to the event store
 *   4. Routes to the appropriate source handler
 *   5. Returns a standardised response
 *
 * Stripe webhooks continue to use their own route (semanticWebhooks.ts)
 * because they have special signature handling and business logic.
 */

import { createHmac }    from "crypto";
import { appendEvent }   from "./eventStore.js";
import { checkAndMark }  from "./idempotencyStore.js";
import { routeEvent }    from "./crossSystemRouter.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export type InboundSource = "twilio" | "zapier" | "slack" | "custom";

export interface InboundWebhookRequest {
  source:          InboundSource;
  headers:         Record<string, string | string[] | undefined>;
  body:            Record<string, unknown>;
  rawBody?:        string;
  idempotency_key?: string;
}

export interface InboundWebhookResult {
  ok:              boolean;
  duplicate:       boolean;
  event_id?:       string;
  source:          InboundSource;
  event_type:      string;
  error?:          string;
}

// Per-source secret registry (populated at runtime via registerSourceSecret())
const _secrets = new Map<string, string>();

export function registerSourceSecret(source: InboundSource, secret: string): void {
  _secrets.set(source, secret);
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function handleInboundWebhook(
  req: InboundWebhookRequest
): Promise<InboundWebhookResult> {
  const { source, headers, body, rawBody, idempotency_key } = req;

  // 1. HMAC verification (if secret registered for this source)
  const secret = _secrets.get(source);
  if (secret) {
    const valid = _verifySignature(source, secret, headers, rawBody ?? JSON.stringify(body));
    if (!valid) {
      console.warn(`[EBS:InboundRouter] ⚠️ Signature verification failed — source:${source}`);
      return { ok: false, duplicate: false, source, event_type: "unknown", error: "Invalid signature" };
    }
  }

  // 2. Normalise the event
  const normalised = _normalise(source, body, headers);
  const event_type = normalised.event_type;

  // 3. Idempotency check
  const idemKey = idempotency_key ?? _extractIdempotencyKey(source, body, headers);
  if (idemKey) {
    const isNew = await checkAndMark(idemKey, `inbound:${source}:${event_type}`);
    if (!isNew) {
      console.log(`[EBS:InboundRouter] Duplicate — source:${source} type:${event_type} key:${idemKey}`);
      return { ok: true, duplicate: true, source, event_type };
    }
  }

  // 4. Append to event store
  let event_id: string | undefined;
  try {
    const stored = await appendEvent({
      topic:           "inbound",
      event_type:      `${source}.${event_type}`,
      source:          `inbound:${source}`,
      payload:         normalised.payload,
      idempotency_key: idemKey ?? undefined,
    });
    event_id = stored.event_id;
  } catch (err) {
    console.warn(`[EBS:InboundRouter] EventStore write failed (non-fatal):`, (err as Error).message);
  }

  // 5. Route through cross-system router (SSE broadcast etc.)
  await routeEvent({
    topic:      "inbound",
    event_type: `${source}.${event_type}`,
    source:     `inbound:${source}`,
    payload:    normalised.payload,
  }).catch((err) =>
    console.warn(`[EBS:InboundRouter] CrossRouter error (non-fatal):`, (err as Error).message)
  );

  console.log(`[EBS:InboundRouter] ✅ handled — source:${source} type:${event_type}`);
  return { ok: true, duplicate: false, event_id, source, event_type };
}

// ─── Per-source normalisers ───────────────────────────────────────────────────

function _normalise(
  source:  InboundSource,
  body:    Record<string, unknown>,
  headers: Record<string, string | string[] | undefined>
): { event_type: string; payload: Record<string, unknown> } {
  switch (source) {
    case "twilio": {
      return {
        event_type: String(body["MessageStatus"] ?? body["CallStatus"] ?? "message"),
        payload: {
          from:        String(body["From"] ?? ""),
          to:          String(body["To"] ?? ""),
          body:        String(body["Body"] ?? ""),
          message_sid: String(body["MessageSid"] ?? body["CallSid"] ?? ""),
          status:      String(body["MessageStatus"] ?? body["CallStatus"] ?? ""),
        },
      };
    }

    case "zapier": {
      const trigger = String(body["trigger"] ?? body["event"] ?? "zap.trigger");
      return {
        event_type: trigger,
        payload: { ...body, _source: "zapier" },
      };
    }

    case "slack": {
      const slackType = String(
        (body["event"] as Record<string, unknown>)?.["type"] ?? body["type"] ?? "slack.event"
      );
      return {
        event_type: slackType,
        payload: {
          type:    slackType,
          user:    (body["event"] as Record<string, unknown>)?.["user"] ?? null,
          channel: (body["event"] as Record<string, unknown>)?.["channel"] ?? null,
          text:    (body["event"] as Record<string, unknown>)?.["text"] ?? null,
          raw:     body,
        },
      };
    }

    default: {
      const event_type = String(body["event"] ?? body["type"] ?? body["action"] ?? "webhook");
      return { event_type, payload: { ...body } };
    }
  }
}

// ─── Signature verification ───────────────────────────────────────────────────

function _verifySignature(
  source:  InboundSource,
  secret:  string,
  headers: Record<string, string | string[] | undefined>,
  rawBody: string
): boolean {
  try {
    switch (source) {
      case "slack": {
        const ts  = String(headers["x-slack-request-timestamp"] ?? "");
        const sig = String(headers["x-slack-signature"] ?? "");
        const base = `v0:${ts}:${rawBody}`;
        const computed = `v0=${createHmac("sha256", secret).update(base).digest("hex")}`;
        return computed === sig;
      }

      case "custom":
      default: {
        const sig = String(
          headers["x-cai-signature"] ??
          headers["x-webhook-signature"] ??
          headers["x-hub-signature-256"] ?? ""
        ).replace("sha256=", "");
        const computed = createHmac("sha256", secret).update(rawBody).digest("hex");
        return computed === sig;
      }
    }
  } catch {
    return false;
  }
}

// ─── Idempotency key extraction per source ────────────────────────────────────

function _extractIdempotencyKey(
  source:  InboundSource,
  body:    Record<string, unknown>,
  headers: Record<string, string | string[] | undefined>
): string | null {
  switch (source) {
    case "twilio":
      return String(body["MessageSid"] ?? body["CallSid"] ?? "") || null;
    case "slack":
      return String((body["event"] as Record<string, unknown>)?.["event_ts"] ?? body["event_id"] ?? "") || null;
    case "zapier":
      return String(body["id"] ?? body["zapier_id"] ?? "") || null;
    default:
      return String(
        headers["x-idempotency-key"] ??
        headers["idempotency-key"] ??
        body["idempotency_key"] ??
        ""
      ) || null;
  }
}
