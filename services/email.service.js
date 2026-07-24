import brevo from "@getbrevo/brevo";
import { createBrevoInstance } from "../config/brevo.js";
import { getEmailCredentials } from "./platformConfig.service.js";
import otpTemplate from "../emails/templates/otp.template.js";
import forgotPasswordTemplate from "../emails/templates/forgotPassword.template.js";
import welcomeTemplate from "../emails/templates/welcome.template.js";
import orderConfirmationTemplate from "../emails/templates/orderConfirmation.template.js";
import paymentSuccessTemplate from "../emails/templates/paymentSuccess.template.js";
import invoiceTemplate from "../emails/templates/invoice.template.js";

/**
 * Fire-and-log email sender. Never throws — a failed email must never block
 * order/payment completion. Failures are logged for admin visibility.
 */
const sendEmail = async ({ to, subject, html, attachments = [] }) => {
  const { apiKey, senderEmail, senderName } = await getEmailCredentials();

  if (!apiKey) {
    console.error(`[EmailService] No Brevo API key configured — skipped email "${subject}" to ${to}`);
    return false;
  }

  try {
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = html;
    sendSmtpEmail.sender = { name: senderName, email: senderEmail };
    sendSmtpEmail.to = [{ email: to }];
    if (attachments.length > 0) sendSmtpEmail.attachment = attachments;

    await createBrevoInstance(apiKey).sendTransacEmail(sendSmtpEmail);
    return true;
  } catch (error) {
    console.error(`[EmailService] Failed to send "${subject}" to ${to}: ${error.message}`);
    return false;
  }
};

// Used by the Super Admin "test email config" endpoint. Unlike sendEmail (which
// never throws, for fire-and-forget order/payment flows), this surfaces the real
// Brevo error so the endpoint can report exactly why a test send failed.
export const sendTestEmail = async (to) => {
  const { apiKey, senderEmail, senderName } = await getEmailCredentials();

  if (!apiKey) {
    throw new Error("No Brevo API key is configured (neither in platform settings nor .env)");
  }
  if (!senderEmail) {
    throw new Error("No sender email is configured (neither in platform settings nor .env)");
  }

  const sendSmtpEmail = new brevo.SendSmtpEmail();
  sendSmtpEmail.subject = "Test Email - Subaasan Naturals Platform Settings";
  sendSmtpEmail.htmlContent = "<p>This is a test email confirming your Brevo email configuration is working correctly.</p>";
  sendSmtpEmail.sender = { name: senderName, email: senderEmail };
  sendSmtpEmail.to = [{ email: to }];

  await createBrevoInstance(apiKey).sendTransacEmail(sendSmtpEmail);
  return { senderEmail, senderName };
};

export const sendOtpEmail = (to, name, otp, purpose) =>
  sendEmail({ to, subject: "Your OTP Code - Subaasan Naturals", html: otpTemplate({ name, otp, purpose }) });

export const sendForgotPasswordEmail = (to, name, otp, resetUrl) =>
  sendEmail({
    to,
    subject: "Reset Your Password - Subaasan Naturals",
    html: forgotPasswordTemplate({ name, otp, resetUrl }),
  });

export const sendWelcomeEmail = (to, name, shopUrl) =>
  sendEmail({ to, subject: "Welcome to Subaasan Naturals", html: welcomeTemplate({ name, shopUrl }) });

export const sendOrderConfirmationEmail = (to, name, order) =>
  sendEmail({
    to,
    subject: `Order Confirmed - ${order.orderNumber}`,
    html: orderConfirmationTemplate({ name, order }),
  });

export const sendPaymentSuccessEmail = (to, name, order, payment) =>
  sendEmail({
    to,
    subject: `Payment Successful - ${order.orderNumber}`,
    html: paymentSuccessTemplate({ name, order, payment }),
  });

export const sendInvoiceEmail = (to, name, order, pdfBuffer) =>
  sendEmail({
    to,
    subject: `Invoice - ${order.invoiceNumber || order.orderNumber}`,
    html: invoiceTemplate({ name, order }),
    attachments: [
      {
        content: pdfBuffer.toString("base64"),
        name: `invoice-${order.orderNumber}.pdf`,
      },
    ],
  });
