import PlatformSettings from "../models/platformSettings.model.js";
import env from "../config/env.js";
import { encryptSecret, decryptSecret } from "../utils/encryption.js";

let cachedSettings = null;
let cachedAt = 0;
const CACHE_TTL_MS = 10_000;

const getSettingsDoc = async () => {
  const now = Date.now();
  if (cachedSettings && now - cachedAt < CACHE_TTL_MS) return cachedSettings;

  let settings = await PlatformSettings.findOne();
  if (!settings) settings = await PlatformSettings.create({});

  cachedSettings = settings;
  cachedAt = now;
  return settings;
};

// Called after any write to platformSettings so the next read isn't stale.
export const invalidatePlatformConfigCache = () => {
  cachedSettings = null;
  cachedAt = 0;
};

export const getRazorpayCredentials = async () => {
  const settings = await getSettingsDoc();

  if (settings.payment?.razorpayKeyId && settings.payment?.razorpayKeySecretEncrypted) {
    try {
      return {
        keyId: settings.payment.razorpayKeyId,
        keySecret: decryptSecret(settings.payment.razorpayKeySecretEncrypted),
        source: "db",
      };
    } catch (error) {
      // A stored secret that fails to decrypt (e.g. CONFIG_ENCRYPTION_KEY changed or
      // differs between environments) must never take down live payments — fall back
      // to .env instead of throwing, and log loudly so this gets noticed and fixed.
      console.error(
        `[PlatformConfig] Failed to decrypt stored Razorpay key secret (${error.message}) — falling back to env.RAZORPAY_KEY_SECRET. Re-save the Razorpay config in Super Admin settings to fix this permanently.`
      );
    }
  }

  return { keyId: env.RAZORPAY_KEY_ID, keySecret: env.RAZORPAY_KEY_SECRET, source: "env" };
};

export const setRazorpayCredentials = async (keyId, keySecret) => {
  const settings = await getSettingsDoc();
  settings.payment.razorpayKeyId = keyId;
  settings.payment.razorpayKeySecretEncrypted = encryptSecret(keySecret);
  await settings.save();
  invalidatePlatformConfigCache();
  return settings;
};

export const getEmailCredentials = async () => {
  const settings = await getSettingsDoc();

  if (settings.email?.brevoApiKeyEncrypted) {
    try {
      return {
        apiKey: decryptSecret(settings.email.brevoApiKeyEncrypted),
        senderEmail: settings.email.senderEmail || env.BREVO_SENDER_EMAIL,
        senderName: settings.email.senderName || env.BREVO_SENDER_NAME,
        source: "db",
      };
    } catch (error) {
      console.error(
        `[PlatformConfig] Failed to decrypt stored Brevo API key (${error.message}) — falling back to env.BREVO_API_KEY. Re-save the email config in Super Admin settings to fix this permanently.`
      );
    }
  }

  return {
    apiKey: env.BREVO_API_KEY,
    senderEmail: env.BREVO_SENDER_EMAIL,
    senderName: env.BREVO_SENDER_NAME,
    source: "env",
  };
};

export const setEmailCredentials = async ({ apiKey, senderEmail, senderName }) => {
  const settings = await getSettingsDoc();
  if (apiKey) settings.email.brevoApiKeyEncrypted = encryptSecret(apiKey);
  if (senderEmail !== undefined) settings.email.senderEmail = senderEmail;
  if (senderName !== undefined) settings.email.senderName = senderName;
  await settings.save();
  invalidatePlatformConfigCache();
  return settings;
};

export const getCheckoutSettings = async () => {
  const settings = await getSettingsDoc();
  return {
    currency: settings.currency || "INR",
    taxPercentage: settings.taxPercentage ?? env.TAX_PERCENTAGE,
    shippingCharge: settings.defaultDeliveryCharge ?? env.DEFAULT_SHIPPING_CHARGE,
    freeShippingThreshold: env.FREE_SHIPPING_THRESHOLD,
  };
};
