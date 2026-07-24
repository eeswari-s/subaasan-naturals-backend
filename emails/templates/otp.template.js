import baseTemplate from "./baseTemplate.js";

const otpTemplate = ({ name, otp, purpose = "verify your account" }) =>
  baseTemplate({
    title: "Your OTP Code",
    bodyHtml: `
      <p>Hi ${name || "there"},</p>
      <p>Use the OTP below to ${purpose}. This code is valid for 10 minutes.</p>
      <div style="text-align:center;margin:24px 0;">
        <span style="display:inline-block;background-color:#f0f0eb;color:#2f5233;font-size:28px;font-weight:bold;letter-spacing:8px;padding:14px 24px;border-radius:6px;">${otp}</span>
      </div>
      <p>If you did not request this, you can safely ignore this email.</p>
    `,
  });

export default otpTemplate;
