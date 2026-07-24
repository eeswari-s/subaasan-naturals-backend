import crypto from "crypto";
import env from "../config/env.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

const getKey = () => crypto.createHash("sha256").update(env.CONFIG_ENCRYPTION_KEY).digest();

/**
 * Encrypts a secret for at-rest storage (e.g. a Razorpay key secret or Brevo API key
 * kept in the platform settings collection instead of only in .env).
 * Returns "iv:authTag:ciphertext" (all hex) — safe to store as a single string field.
 */
export const encryptSecret = (plainText) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
};

export const decryptSecret = (payload) => {
  if (!payload) return null;
  const [ivHex, authTagHex, dataHex] = payload.split(":");
  if (!ivHex || !authTagHex || !dataHex) return null;

  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, "hex")), decipher.final()]);
  return decrypted.toString("utf8");
};

// Shows only the last 4 characters, e.g. "••••••••1234" — never return a stored
// secret to the client in full.
export const maskSecret = (plainText) => {
  if (!plainText) return "";
  const visible = plainText.slice(-4);
  return `${"•".repeat(Math.max(plainText.length - 4, 4))}${visible}`;
};
