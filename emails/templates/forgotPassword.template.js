import baseTemplate from "./baseTemplate.js";

const forgotPasswordTemplate = ({ name, otp, resetUrl }) =>
  baseTemplate({
    title: "Reset Your Password",
    bodyHtml: `
      <p>Hi ${name || "there"},</p>
      <p>We received a request to reset your password. Use the OTP below, or click the button to continue:</p>
      <div style="text-align:center;margin:24px 0;">
        <span style="display:inline-block;background-color:#f0f0eb;color:#2f5233;font-size:28px;font-weight:bold;letter-spacing:8px;padding:14px 24px;border-radius:6px;">${otp}</span>
      </div>
      ${
        resetUrl
          ? `<div style="text-align:center;margin:24px 0;">
              <a href="${resetUrl}" style="background-color:#2f5233;color:#ffffff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;">Reset Password</a>
             </div>`
          : ""
      }
      <p>This OTP is valid for 10 minutes. If you did not request a password reset, please ignore this email.</p>
    `,
  });

export default forgotPasswordTemplate;
