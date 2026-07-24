import baseTemplate from "./baseTemplate.js";

const orderConfirmationTemplate = ({ name, order }) => {
  const itemsHtml = (order.items || [])
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #eeeeee;">${item.productNameSnapshot}${item.variantName ? ` (${item.variantName})` : ""} x ${item.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eeeeee;text-align:right;">Rs. ${(item.priceSnapshot * item.quantity).toFixed(2)}</td>
        </tr>`
    )
    .join("");

  const addr = order.address || {};

  return baseTemplate({
    title: "Order Confirmation",
    bodyHtml: `
      <p>Hi ${name || "there"},</p>
      <p>Thank you for your order! Your order <strong>${order.orderNumber}</strong> has been confirmed.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
        ${itemsHtml}
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
        <tr><td>Subtotal</td><td style="text-align:right;">Rs. ${order.subtotal?.toFixed(2)}</td></tr>
        <tr><td>Discount</td><td style="text-align:right;">- Rs. ${(order.discount || 0).toFixed(2)}</td></tr>
        <tr><td>Tax</td><td style="text-align:right;">Rs. ${(order.tax || 0).toFixed(2)}</td></tr>
        <tr><td>Shipping</td><td style="text-align:right;">Rs. ${(order.shippingCharge || 0).toFixed(2)}</td></tr>
        <tr><td style="font-weight:bold;padding-top:8px;">Grand Total</td><td style="text-align:right;font-weight:bold;padding-top:8px;">Rs. ${order.grandTotal?.toFixed(2)}</td></tr>
      </table>
      <p style="margin-top:20px;"><strong>Delivery Address:</strong><br/>
      ${addr.fullName}, ${addr.addressLine1}, ${addr.city}, ${addr.state} - ${addr.pincode}</p>
    `,
  });
};

export default orderConfirmationTemplate;
