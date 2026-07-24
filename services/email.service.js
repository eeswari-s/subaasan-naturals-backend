import brevo from "@getbrevo/brevo";
import apiInstance from "../config/brevo.js";
import env from "../config/env.js";
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
  if (!env.BREVO_API_KEY) {
    console.error(`[EmailService] BREVO_API_KEY missing — skipped email "${subject}" to ${to}`);
    return false;
  }

  try {
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = html;
    sendSmtpEmail.sender = { name: env.BREVO_SENDER_NAME, email: env.BREVO_SENDER_EMAIL };
    sendSmtpEmail.to = [{ email: to }];
    if (attachments.length > 0) sendSmtpEmail.attachment = attachments;

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    return true;
  } catch (error) {
    console.error(`[EmailService] Failed to send "${subject}" to ${to}: ${error.message}`);
    return false;
  }
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
