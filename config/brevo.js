import brevo from "@getbrevo/brevo";
import env from "./env.js";

const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, env.BREVO_API_KEY || "");

export default apiInstance;
