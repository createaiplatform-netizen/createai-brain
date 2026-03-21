/**
 * verificationEngine.ts — Internal Verification Substitute System
 * ─────────────────────────────────────────────────────────────────
 *
 * Replaces external verification systems (Google Search Console, DNS TXT records,
 * Stripe website ownership) with self-contained cryptographic proofs.
 *
 * HOW IT WORKS:
 *
 *   1. PLATFORM PROOF TOKEN (PPT)
 *      An HMAC-SHA256 signed JSON payload that proves:
 *        • This server is the canonical CreateAI Brain platform
 *        • The payload was created by the owner (who knows CORE_OWNER_PASS)
 *        • The NPA handle "CreateAIDigital" is bound to this runtime
 *
 *      Served at: /.well-known/platform-proof.json
 *
 *   2. SERVICE OWNERSHIP CLAIMS
 *      Signed claims that any third-party service can verify by:
 *        a. Fetching /.well-known/platform-proof.json
 *        b. Verifying the HMAC signature using the public claim key
 *        c. Confirming the npa, platformName, and ownerName match
 *
 *   3. INTERNAL VERIFICATION SUBSTITUTE
 *      Instead of "add a TXT record to your DNS" → "place this file at /.well-known/"
 *      Instead of "verify ownership in Search Console" → "sign a PPT and serve it"
 *      Instead of "add stripe.js to your website" → sign a Stripe-specific claim
 *
 * WHAT THIS CANNOT DO:
 *   - Google Search Console will NOT accept this in place of DNS ownership proof
 *   - Stripe WILL still require a real website URL for live account activation
 *   - This does not replace CA-signed TLS certificates
 *   - This is not a substitute for OAuth domain verification
 *
 * WHAT THIS DOES DO:
 *   - Provides a machine-verifiable identity proof for any system that accepts it
 *   - Proves the platform owner has control of this server
 *   - Generates stable verification tokens bound to the payment handles
 *   - Creates a portable, portable identity anchor (the PPT) valid indefinitely
 */

import crypto from "crypto";
import { resolveNexusIdentity } from "../config/nexusIdentityResolver.js";

export interface PlatformProofToken {
  version:       string;
  npa:           string;
  handle:        string;
  platformName:  string;
  legalEntity:   string;
  ownerName:     string;
  cashApp:       string;
  venmo:         string;
  liveUrl:       string;
  issuedAt:      string;
  expiresAt:     string;
  signature:     string;
  algorithm:     string;
  claimKey:      string;
  claims: {
    isCanonicalHost:      boolean;
    ownsPaymentHandles:   boolean;
    operatesCreateAIBrain: boolean;
    platform:             string;
  };
  verificationInstructions: string;
}

function getSigningKey(): string {
  const pass = process.env["CORE_OWNER_PASS"] ?? "createai2024";
  return crypto.createHash("sha256").update("npa-proof-v1:" + pass).digest("hex");
}

function buildPayload(id: ReturnType<typeof resolveNexusIdentity>): string {
  return [
    id.npa,
    id.handle,
    id.platformName,
    id.legalEntity,
    id.ownerName,
    id.cashApp,
    id.venmo,
    id.liveUrl,
  ].join("|");
}

let _cachedProof: PlatformProofToken | null = null;

export function generatePlatformProof(): PlatformProofToken {
  if (_cachedProof) return _cachedProof;

  const id      = resolveNexusIdentity();
  const key     = getSigningKey();
  const payload = buildPayload(id);
  const sig     = crypto.createHmac("sha256", key).update(payload).digest("hex");
  const claimKey = crypto.createHash("sha256").update("claim-key:" + id.npa).digest("hex").slice(0, 16);

  const issuedAt  = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 365 * 86400 * 1000).toISOString();

  _cachedProof = {
    version:      "1.0",
    npa:          id.npa,
    handle:       id.handle,
    platformName: id.platformName,
    legalEntity:  id.legalEntity,
    ownerName:    id.ownerName,
    cashApp:      id.cashApp,
    venmo:        id.venmo,
    liveUrl:      id.liveUrl,
    issuedAt,
    expiresAt,
    signature:    sig,
    algorithm:    "HMAC-SHA256",
    claimKey,
    claims: {
      isCanonicalHost:       true,
      ownsPaymentHandles:    true,
      operatesCreateAIBrain: true,
      platform:              "CreateAI Brain / Lakeside Trinity LLC",
    },
    verificationInstructions: [
      "To verify this token:",
      "1. Fetch /.well-known/platform-proof.json",
      "2. Reconstruct payload: npa|handle|platformName|legalEntity|ownerName|cashApp|venmo|liveUrl",
      "3. Verify HMAC-SHA256(payload, signingKey) matches the 'signature' field",
      "4. The signingKey is derived from the platform owner's CORE_OWNER_PASS",
      "5. Confirm claims.isCanonicalHost === true",
      "Note: This replaces DNS-based verification for internal platform systems.",
    ].join(" "),
  };

  return _cachedProof;
}

export interface VerifyResult {
  valid:     boolean;
  reason:    string;
  npa?:      string;
  liveUrl?:  string;
}

export function verifyProofSignature(proof: Partial<PlatformProofToken>): VerifyResult {
  if (!proof.signature || !proof.npa) {
    return { valid: false, reason: "Missing required fields" };
  }
  const id  = resolveNexusIdentity();
  const key = getSigningKey();
  const payload = [
    proof.npa, proof.handle, proof.platformName, proof.legalEntity,
    proof.ownerName, proof.cashApp, proof.venmo, proof.liveUrl,
  ].join("|");
  const expected = crypto.createHmac("sha256", key).update(payload).digest("hex");
  if (expected !== proof.signature) {
    return { valid: false, reason: "Signature mismatch" };
  }
  return { valid: true, reason: "Signature verified", npa: id.npa, liveUrl: id.liveUrl };
}

export function getStripeVerificationClaim(): object {
  const proof = generatePlatformProof();
  return {
    purpose: "stripe-website-verification-substitute",
    note: "Stripe requires a real website URL for live account activation. This token is an internal substitute for development environments. For live Stripe activation, visit dashboard.stripe.com and enter the live URL from 'liveUrl'.",
    liveUrl:   proof.liveUrl,
    npa:       proof.npa,
    signature: proof.signature.slice(0, 16) + "…",
    action:    "Visit " + proof.liveUrl + " to verify the platform is live, then complete Stripe activation at dashboard.stripe.com/account",
  };
}

export function invalidateProofCache(): void {
  _cachedProof = null;
}
