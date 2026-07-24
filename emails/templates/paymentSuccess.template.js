import baseTemplate from "./baseTemplate.js";

const paymentSuccessTemplate = ({ name, order, payment }) =>
  baseTemplate({
    title: "Payment Successful",
    bodyHtml: `
      <p>Hi ${name || "there"},</p>
      <p>We've successfully received your payment for order <strong>${order.orderNumber}</strong>.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
        <tr><td>Amount Paid</td><td style="text-align:right;">Rs. ${payment.amount?.toFixed(2)}</td></tr>
        <tr><td>Payment ID</td><td style="text-align:right;">${payment.razorpayPaymentId || "-"}</td></tr>
        <tr><td>Status</td><td style="text-align:right;text-transform:capitalize;">${payment.status}</td></tr>
      </table>
      <p>Your order is now being processed. We'll notify you as it progresses.</p>
    `,
  });

export default paymentSuccessTemplate;
