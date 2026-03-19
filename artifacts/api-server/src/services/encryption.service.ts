// ═══════════════════════════════════════════════════════════════════════════
// ENCRYPTION SERVICE — Constructor-instantiable wrapper for field encryption.
//
// Delegates to the existing free functions in encryption.ts so all crypto
// logic remains in one place. Using a class makes it injectable via the
// ServiceContainer and mockable in tests.
//
// No container import — this class is a pure dependency, not a resolver.
// ═══════════════════════════════════════════════════════════════════════════

import { encrypt, decrypt, isEncrypted } from "./encryption";

export class EncryptionService {
  /** AES-256-GCM encrypt a string. Returns "<iv>:<authTag>:<ciphertext>". */
  encrypt(value: string): string {
    return encrypt(value);
  }

  /** Decrypt a value produced by encrypt(). Returns plaintext. */
  decrypt(value: string): string {
    return decrypt(value);
  }

  /** Returns true if the string looks like an encrypted value. */
  isEncrypted(value: string): boolean {
    return isEncrypted(value);
  }
}
