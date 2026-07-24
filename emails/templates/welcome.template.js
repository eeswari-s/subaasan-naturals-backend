import baseTemplate from "./baseTemplate.js";

const welcomeTemplate = ({ name, shopUrl }) =>
  baseTemplate({
    title: "Welcome to Subaasan Naturals",
    bodyHtml: `
      <p>Hi ${name || "there"},</p>
      <p>Welcome to Subaasan Naturals! We're thrilled to have you with us. Explore our range of natural products crafted with care.</p>
      ${
        shopUrl
          ? `<div style="text-align:center;margin:24px 0;">
              <a href="${shopUrl}" style="background-color:#2f5233;color:#ffffff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;">Start Shopping</a>
             </div>`
          : ""
      }
      <p>Thank you for joining us!</p>
    `,
  });

export default welcomeTemplate;
