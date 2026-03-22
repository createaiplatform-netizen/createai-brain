// ─── Device Auth Client Utilities ────────────────────────────────────────────
// Manages device tokens in localStorage and WebAuthn passkey operations.
// No secrets are stored — only opaque device tokens and credential IDs.

const DEVICE_TOKEN_KEY = "createai_device_token";
const DEVICE_NAME_KEY = "createai_device_name";

// ── Device Token Management ──────────────────────────────────────────────────

export function getStoredDeviceToken(): string | null {
  try {
    return localStorage.getItem(DEVICE_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function storeDeviceToken(token: string, deviceName: string): void {
  try {
    localStorage.setItem(DEVICE_TOKEN_KEY, token);
    localStorage.setItem(DEVICE_NAME_KEY, deviceName);
  } catch {
    // Storage unavailable — gracefully degrade
  }
}

export function clearDeviceToken(): void {
  try {
    localStorage.removeItem(DEVICE_TOKEN_KEY);
    localStorage.removeItem(DEVICE_NAME_KEY);
  } catch {
    // ignore
  }
}

export function getDeviceName(): string {
  try {
    return localStorage.getItem(DEVICE_NAME_KEY) ?? guessDeviceName();
  } catch {
    return guessDeviceName();
  }
}

export function guessDeviceName(): string {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Android/.test(ua)) return "Android device";
  if (/Mac/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows PC";
  return "This device";
}

// ── Validate device token with server ───────────────────────────────────────

export interface DeviceValidationResult {
  valid: boolean;
  hasBiometric: boolean;
  deviceName: string;
}

export async function validateDeviceToken(token: string): Promise<DeviceValidationResult> {
  try {
    const res = await fetch("/api/trusted-devices/validate", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceToken: token }),
    });
    if (!res.ok) return { valid: false, hasBiometric: false, deviceName: "" };
    const data = (await res.json()) as {
      valid: boolean;
      hasBiometric: boolean;
      deviceName: string;
    };
    return data;
  } catch {
    return { valid: false, hasBiometric: false, deviceName: "" };
  }
}

// ── WebAuthn Passkey Registration ────────────────────────────────────────────

export function isWebAuthnSupported(): boolean {
  return !!(
    window.PublicKeyCredential &&
    typeof navigator.credentials?.create === "function"
  );
}

export async function registerPasskey(deviceToken: string): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;
  try {
    const optRes = await fetch("/api/trusted-devices/webauthn/registration-options", {
      credentials: "include",
    });
    if (!optRes.ok) return false;
    const options = await optRes.json();

    // Import browser library lazily
    const { startRegistration } = await import("@simplewebauthn/browser");
    const regResponse = await startRegistration({ optionsJSON: options });

    const verifyRes = await fetch("/api/trusted-devices/webauthn/register", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceToken, response: regResponse }),
    });

    return verifyRes.ok;
  } catch {
    return false;
  }
}

// ── WebAuthn Passkey Authentication ─────────────────────────────────────────

export async function authenticateWithPasskey(deviceToken: string): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;
  try {
    const optRes = await fetch(
      `/api/trusted-devices/webauthn/auth-options?deviceToken=${encodeURIComponent(deviceToken)}`,
      { credentials: "include" }
    );
    if (!optRes.ok) return false;
    const options = await optRes.json();

    const { startAuthentication } = await import("@simplewebauthn/browser");
    const authResponse = await startAuthentication({ optionsJSON: options });

    const verifyRes = await fetch("/api/trusted-devices/webauthn/verify", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceToken, response: authResponse }),
    });

    return verifyRes.ok;
  } catch {
    return false;
  }
}
