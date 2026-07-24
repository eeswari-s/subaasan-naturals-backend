import baseTemplate from "./baseTemplate.js";

const invoiceTemplate = ({ name, order }) =>
  baseTemplate({
    title: "Your Invoice",
    bodyHtml: `
      <p>Hi ${name || "there"},</p>
      <p>Please find attached the invoice <strong>${order.invoiceNumber}</strong> for your order <strong>${order.orderNumber}</strong>.</p>
      <p>Grand Total: <strong>Rs. ${order.grandTotal?.toFixed(2)}</strong></p>
      <p>Thank you for shopping with us!</p>
    `,
  });

export default invoiceTemplate;
