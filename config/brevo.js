import brevo from "@getbrevo/brevo";
import env from "./env.js";

// Boot-time default instance, built from .env. Real request-time usage goes through
// services/email.service.js, which builds a fresh instance per send using
// services/platformConfig.service.js (DB override with this env config as fallback) —
// so a Super Admin key change takes effect immediately without a restart.
const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, env.BREVO_API_KEY || "");

export const createBrevoInstance = (apiKey) => {
  const instance = new brevo.TransactionalEmailsApi();
  instance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey || "");
  return instance;
};

export default apiInstance;
