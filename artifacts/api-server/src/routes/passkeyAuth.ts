/**
 * routes/passkeyAuth.ts
 * ─────────────────────
 * WebAuthn / Passkey authentication for the Architect.
 * Enables Face ID / Touch ID login on mobile devices.
 *
 * Routes (mounted at /admin/passkey):
 *   GET  /                   — Management UI (list devices, register new)
 *   POST /register/options   — Generate registration options  [admin-only]
 *   POST /register/verify    — Verify + store new credential  [admin-only]
 *   POST /auth/options       — Generate authentication challenge [public]
 *   POST /auth/verify        — Verify response + set session cookie [public]
 */

import { Router, type Request, type Response } from "express";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";

type AuthenticatorTransportFuture = "ble" | "cable" | "hybrid" | "internal" | "nfc" | "smart-card" | "usb";
import { adminAuth, createAdminCookie } from "../middlewares/adminAuth.js";
import { getSql } from "../lib/db.js";

const router = Router();

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path:     "/",
  maxAge:   24 * 60 * 60 * 1000,
  secure:   process.env["REPLIT_DEPLOYMENT"] === "1",
};

// ── In-memory challenge store (5-min TTL, keyed by session ID) ────────────────
const challenges = new Map<string, { challenge: string; expires: number }>();

function storeChallenge(key: string, challenge: string): void {
  challenges.set(key, { challenge, expires: Date.now() + 5 * 60 * 1000 });
}
function consumeChallenge(key: string): string | null {
  const entry = challenges.get(key);
  if (!entry || Date.now() > entry.expires) { challenges.delete(key); return null; }
  challenges.delete(key);
  return entry.challenge;
}

// ── Schema init ───────────────────────────────────────────────────────────────
let tableReady = false;
async function ensureTable(): Promise<void> {
  if (tableReady) return;
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS admin_passkeys (
      id            SERIAL PRIMARY KEY,
      credential_id TEXT UNIQUE NOT NULL,
      public_key_b64 TEXT NOT NULL,
      counter       BIGINT NOT NULL DEFAULT 0,
      transports    TEXT[],
      device_name   TEXT,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  tableReady = true;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getRpId(req: Request): string {
  return process.env["WEBAUTHN_RP_ID"] ?? req.hostname;
}
function getOrigin(req: Request): string {
  if (process.env["WEBAUTHN_ORIGIN"]) return process.env["WEBAUTHN_ORIGIN"]!;
  const proto = req.headers["x-forwarded-proto"] ?? req.protocol;
  const host  = req.headers["host"] ?? req.hostname;
  return `${proto}://${host}`;
}

// ── Management UI ─────────────────────────────────────────────────────────────
router.get("/", adminAuth, async (req: Request, res: Response) => {
  await ensureTable();
  const sql = getSql();
  const rows = await sql`
    SELECT id, device_name, created_at FROM admin_passkeys ORDER BY created_at DESC
  `;
  const deviceList = rows.map((r) =>
    `<li style="padding:10px 14px;background:rgba(6,10,6,.8);border:1px solid rgba(201,168,76,.15);border-radius:8px;margin-bottom:8px;display:flex;align-items:center;gap:12px;">
      <span style="font-size:1.2rem;">🔑</span>
      <span style="flex:1;">
        <strong style="color:#f5e17a;font-size:.85rem;">${String(r.device_name ?? "Unnamed Device")}</strong>
        <span style="display:block;font-size:.68rem;color:rgba(221,216,196,.4);margin-top:2px;font-family:monospace;">${new Date(r.created_at as string).toLocaleString()}</span>
      </span>
      <form method="POST" action="/admin/passkey/delete" style="margin:0;">
        <input type="hidden" name="id" value="${r.id}">
        <button type="submit" style="background:rgba(248,113,113,.12);border:1px solid rgba(248,113,113,.3);color:#f87171;border-radius:6px;padding:5px 10px;font-size:.68rem;cursor:pointer;">Remove</button>
      </form>
    </li>`
  ).join("");

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.send(`<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Passkey Manager — CreateAI Brain</title>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body{min-height:100%;background:#060a06;color:#ddd8c4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;align-items:flex-start;justify-content:center;padding:40px 20px}
  .card{background:rgba(14,20,10,.95);border:1px solid rgba(201,168,76,.3);border-radius:20px;padding:40px 36px;width:100%;max-width:520px}
  h1{font-size:1.4rem;font-weight:900;color:#f5e17a;margin-bottom:6px}
  .sub{font-size:.78rem;color:rgba(221,216,196,.4);margin-bottom:28px;line-height:1.6}
  .sect{font-size:.6rem;font-weight:700;letter-spacing:.18em;color:rgba(201,168,76,.5);text-transform:uppercase;margin-bottom:12px;font-family:monospace}
  ul{list-style:none;padding:0;margin-bottom:28px}
  .empty{font-size:.8rem;color:rgba(221,216,196,.3);padding:16px;text-align:center}
  label{display:block;font-size:.68rem;font-weight:700;letter-spacing:.1em;color:rgba(201,168,76,.55);text-transform:uppercase;margin-bottom:6px}
  input[type=text]{width:100%;background:#020617;border:1.5px solid rgba(201,168,76,.2);border-radius:8px;padding:10px 14px;font-size:.85rem;color:#ddd8c4;outline:none;margin-bottom:14px}
  .btn{width:100%;padding:14px;border:none;border-radius:50px;font-weight:800;font-size:.85rem;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;transition:opacity .15s}
  .btn-gold{background:linear-gradient(135deg,#c9a84c,#e8c96a);color:#1a1000}
  .btn-gold:hover{opacity:.88}
  .btn-gold:disabled{opacity:.5;cursor:not-allowed}
  #status{margin-top:14px;padding:10px 14px;border-radius:8px;font-size:.75rem;display:none;line-height:1.5}
  .ok{background:rgba(61,160,96,.12);border:1px solid rgba(61,160,96,.3);color:#6ee7b7}
  .fail{background:rgba(248,113,113,.1);border:1px solid rgba(248,113,113,.3);color:#f87171}
  .back{display:inline-block;margin-top:20px;font-size:.68rem;color:rgba(201,168,76,.3);text-decoration:none}
  .back:hover{color:rgba(201,168,76,.6)}
</style>
</head><body><div class="card">
  <h1>🔐 Passkey Manager</h1>
  <p class="sub">Register Face ID / Touch ID on this device to unlock the Architect console without a password.</p>
  <p class="sect">Registered Devices</p>
  <ul>${rows.length ? deviceList : '<li class="empty">No passkeys registered yet.</li>'}</ul>
  <p class="sect">Register New Device</p>
  <label for="devName">Device Name</label>
  <input type="text" id="devName" placeholder="e.g. Sara's iPhone 15 Pro" value="">
  <button class="btn btn-gold" id="reg-btn" onclick="doRegister()">Add This Device (Face ID / Touch ID)</button>
  <div id="status"></div>
  <a href="/admin" class="back">← Back to Admin</a>
</div>
<script src="https://unpkg.com/@simplewebauthn/browser@13/dist/bundle/index.umd.min.js"></script>
<script>
const { startRegistration } = SimpleWebAuthnBrowser;
async function doRegister() {
  const btn = document.getElementById('reg-btn');
  const st  = document.getElementById('status');
  const name = document.getElementById('devName').value.trim() || 'My Device';
  btn.disabled = true; btn.textContent = 'Waiting for biometric…';
  st.style.display = 'none';
  try {
    const optsRes = await fetch('/admin/passkey/register/options', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ deviceName: name })
    });
    if (!optsRes.ok) throw new Error(await optsRes.text());
    const opts = await optsRes.json();
    const regResp = await startRegistration({ optionsJSON: opts });
    const verRes = await fetch('/admin/passkey/register/verify', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ response: regResp, deviceName: name })
    });
    const data = await verRes.json();
    if (data.verified) {
      st.className='ok'; st.style.display='block';
      st.textContent = '✓ Passkey registered! You can now sign in with Face ID / Touch ID.';
      setTimeout(() => location.reload(), 1800);
    } else {
      throw new Error(data.error ?? 'Verification failed');
    }
  } catch(e) {
    st.className='fail'; st.style.display='block';
    st.textContent = '✗ ' + e.message;
    btn.disabled = false; btn.textContent = 'Add This Device (Face ID / Touch ID)';
  }
}
</script>
</body></html>`);
});

// ── POST /register/options ────────────────────────────────────────────────────
router.post("/register/options", adminAuth, async (req: Request, res: Response) => {
  await ensureTable();
  const sql = getSql();
  const existing = await sql`SELECT credential_id FROM admin_passkeys`;
  const rpID  = getRpId(req);

  const options = await generateRegistrationOptions({
    rpName:          "Sovereign Nexus",
    rpID:            "createai.digital",
    userID:          Buffer.from("ARCHITECT_01"),
    userName:        "Architect",
    attestationType: "direct",
    authenticatorSelection: {
      residentKey:             "preferred",
      userVerification:        "preferred",
      authenticatorAttachment: "platform",
    },
    excludeCredentials: existing.map((r) => ({
      id:         r.credential_id as string,
      transports: undefined,
    })),
  });

  storeChallenge("register", options.challenge);
  res.json(options);
});

// ── POST /register/verify ─────────────────────────────────────────────────────
router.post("/register/verify", adminAuth, async (req: Request, res: Response) => {
  const { response, deviceName } = req.body as { response: unknown; deviceName?: string };
  const expectedChallenge = consumeChallenge("register");
  if (!expectedChallenge) {
    res.status(400).json({ verified: false, error: "Challenge expired or not found." });
    return;
  }

  const rpID   = getRpId(req);
  const origin = getOrigin(req);

  try {
    const result = await verifyRegistrationResponse({
      response:          response as Parameters<typeof verifyRegistrationResponse>[0]["response"],
      expectedChallenge,
      expectedOrigin:    origin,
      expectedRPID:      rpID,
      requireUserVerification: true,
    });

    if (!result.verified || !result.registrationInfo) {
      res.status(400).json({ verified: false, error: "Verification failed." });
      return;
    }

    const { credential } = result.registrationInfo;
    const credId = Buffer.from(credential.id).toString("base64url");
    const pubKey = Buffer.from(credential.publicKey).toString("base64url");

    await ensureTable();
    const sql = getSql();
    await sql`
      INSERT INTO admin_passkeys (credential_id, public_key_b64, counter, transports, device_name)
      VALUES (
        ${credId},
        ${pubKey},
        ${credential.counter},
        ${(credential.transports ?? []) as AuthenticatorTransportFuture[]},
        ${deviceName ?? "Unnamed Device"}
      )
      ON CONFLICT (credential_id) DO NOTHING
    `;

    console.log(`[Passkey] New credential registered: ${(deviceName ?? "Device").slice(0, 40)} — id:${credId.slice(0, 14)}…`);
    res.json({ verified: true });
  } catch (e) {
    console.error("[Passkey] Register verify error:", (e as Error).message);
    res.status(500).json({ verified: false, error: (e as Error).message });
  }
});

// ── POST /auth/options ────────────────────────────────────────────────────────
router.post("/auth/options", async (req: Request, res: Response) => {
  await ensureTable();
  const sql = getSql();
  const rows = await sql`SELECT credential_id, transports FROM admin_passkeys`;
  const rpID = getRpId(req);

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: rows.map((r) => ({
      id:         r.credential_id as string,
      transports: (r.transports ?? undefined) as AuthenticatorTransportFuture[] | undefined,
    })),
    userVerification: "preferred",
  });

  storeChallenge("auth", options.challenge);
  res.json(options);
});

// ── POST /auth/verify ─────────────────────────────────────────────────────────
router.post("/auth/verify", async (req: Request, res: Response) => {
  const { response } = req.body as { response: { id?: string; rawId?: string } };
  const credId = response?.id ?? response?.rawId;
  if (!credId) { res.status(400).json({ verified: false, error: "Missing credential ID." }); return; }

  const expectedChallenge = consumeChallenge("auth");
  if (!expectedChallenge) { res.status(400).json({ verified: false, error: "Challenge expired." }); return; }

  await ensureTable();
  const sql = getSql();
  const [row] = await sql`
    SELECT credential_id, public_key_b64, counter, transports
    FROM admin_passkeys WHERE credential_id = ${credId}
  `;
  if (!row) { res.status(400).json({ verified: false, error: "Credential not recognised." }); return; }

  const rpID   = getRpId(req);
  const origin = getOrigin(req);

  try {
    const result = await verifyAuthenticationResponse({
      response: response as Parameters<typeof verifyAuthenticationResponse>[0]["response"],
      expectedChallenge,
      expectedOrigin:    origin,
      expectedRPID:      rpID,
      credential: {
        id:         Buffer.from(row.credential_id as string, "base64url"),
        publicKey:  Buffer.from(row.public_key_b64 as string, "base64url"),
        counter:    Number(row.counter),
        transports: (row.transports ?? undefined) as AuthenticatorTransportFuture[] | undefined,
      },
      requireUserVerification: true,
    });

    if (!result.verified) { res.status(400).json({ verified: false, error: "Verification failed." }); return; }

    // Update counter
    await sql`
      UPDATE admin_passkeys SET counter = ${result.authenticationInfo.newCounter}
      WHERE credential_id = ${credId}
    `;

    // Grant architect session
    const rt = (req.query["return"] as string | undefined) ?? "/hub";
    res.cookie("ADMIN_SESSION", createAdminCookie(), COOKIE_OPTS);
    res.json({ verified: true, redirectTo: rt });
  } catch (e) {
    console.error("[Passkey] Auth verify error:", (e as Error).message);
    res.status(500).json({ verified: false, error: (e as Error).message });
  }
});

// ── POST /delete ──────────────────────────────────────────────────────────────
router.post("/delete", adminAuth, async (req: Request, res: Response) => {
  const { id } = req.body as { id?: string };
  if (!id) { res.redirect("/admin/passkey"); return; }
  await ensureTable();
  const sql = getSql();
  await sql`DELETE FROM admin_passkeys WHERE id = ${parseInt(id, 10)}`;
  res.redirect("/admin/passkey");
});

export default router;
