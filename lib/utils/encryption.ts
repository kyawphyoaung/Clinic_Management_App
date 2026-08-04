import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("ENCRYPTION_KEY is not configured");
  }
  return scryptSync(raw, "revivora-salt", 32);
}

/** AES-256-CBC encrypt; returns base64 `iv:ciphertext`. */
export function encrypt(plaintext: string): string {
  if (!plaintext) return plaintext;

  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  return `${iv.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decrypt(ciphertext: string): string {
  if (!ciphertext || !ciphertext.includes(":")) return ciphertext;

  const key = getEncryptionKey();
  const [ivB64, dataB64] = ciphertext.split(":");
  const iv = Buffer.from(ivB64, "base64");
  const encrypted = Buffer.from(dataB64, "base64");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

export const ENCRYPTED_PATIENT_FIELDS = new Set([
  "passport_number",
  "passport_expiry",
  "mobile_number",
  "whatsapp",
  "line_id",
  "email",
  "street_address",
  "city",
  "state_province",
  "postal_code",
  "emergency_name",
  "emergency_phone",
  "emergency_email",
  "previous_treatment_description",
  "signature_image_url",
]);

export const ENCRYPTED_AGENT_FIELDS = new Set([
  "mobile_number",
  "whatsapp",
  "line_id",
  "email",
  "business_address",
  "signature_image_url",
]);

export function encryptFields(
  data: Record<string, unknown>,
  fieldSet: Set<string>
): Record<string, unknown> {
  const result = { ...data };

  for (const field of fieldSet) {
    const value = result[field];
    if (typeof value === "string" && value.length > 0) {
      result[field] = encrypt(value);
    }
  }

  return result;
}

export function decryptFields(
  data: Record<string, unknown>,
  fieldSet: Set<string>
): Record<string, unknown> {
  const result = { ...data };

  for (const field of fieldSet) {
    const value = result[field];
    if (typeof value === "string" && value.includes(":")) {
      try {
        result[field] = decrypt(value);
      } catch {
        // leave as-is if not valid ciphertext
      }
    }
  }

  return result;
}
