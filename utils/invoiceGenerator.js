import PDFDocument from "pdfkit";
import { PassThrough } from "stream";

const buildInvoiceContent = (doc, order, storeSettings = {}) => {
  const storeName = storeSettings.storeName || "Subaasan Naturals";
  const address = storeSettings.contact?.address || "";
  const phone = storeSettings.contact?.phone || "";
  const email = storeSettings.contact?.email || "";

  doc.fontSize(20).font("Helvetica-Bold").text(storeName, { align: "left" });
  doc.fontSize(9).font("Helvetica").fillColor("#555555");
  if (address) doc.text(address);
  if (phone) doc.text(`Phone: ${phone}`);
  if (email) doc.text(`Email: ${email}`);
  doc.moveDown(1.5);

  doc.fillColor("#000000").fontSize(16).font("Helvetica-Bold").text("TAX INVOICE", { align: "right" });
  doc.fontSize(10).font("Helvetica");
  doc.text(`Invoice No: ${order.invoiceNumber || "-"}`, { align: "right" });
  doc.text(`Order No: ${order.orderNumber}`, { align: "right" });
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString("en-IN")}`, { align: "right" });
  doc.moveDown(1);

  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#cccccc").stroke();
  doc.moveDown(0.5);

  const addr = order.address || {};
  doc.font("Helvetica-Bold").text("Bill To / Ship To:");
  doc.font("Helvetica").fontSize(10);
  doc.text(addr.fullName || "");
  if (addr.addressLine1) doc.text(addr.addressLine1);
  if (addr.addressLine2) doc.text(addr.addressLine2);
  doc.text(`${addr.city || ""}, ${addr.state || ""} - ${addr.pincode || ""}`);
  if (addr.phone) doc.text(`Phone: ${addr.phone}`);
  doc.moveDown(1);

  const tableTop = doc.y;
  const cols = { name: 50, qty: 300, price: 360, total: 460 };
  doc.font("Helvetica-Bold").fontSize(10);
  doc.text("Item", cols.name, tableTop);
  doc.text("Qty", cols.qty, tableTop);
  doc.text("Price", cols.price, tableTop);
  doc.text("Total", cols.total, tableTop);
  doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).strokeColor("#cccccc").stroke();

  let y = tableTop + 22;
  doc.font("Helvetica").fontSize(9);
  (order.items || []).forEach((item) => {
    const name = `${item.productNameSnapshot}${item.variantName ? " (" + item.variantName + ")" : ""}`;
    const lineTotal = (item.priceSnapshot * item.quantity).toFixed(2);
    doc.text(name, cols.name, y, { width: 230 });
    doc.text(String(item.quantity), cols.qty, y);
    doc.text(`Rs. ${item.priceSnapshot.toFixed(2)}`, cols.price, y);
    doc.text(`Rs. ${lineTotal}`, cols.total, y);
    y += 22;
  });

  doc.moveTo(50, y).lineTo(545, y).strokeColor("#cccccc").stroke();
  y += 10;

  const totalsRow = (label, value, bold = false) => {
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(10);
    doc.text(label, 360, y);
    doc.text(value, 460, y);
    y += 16;
  };

  totalsRow("Subtotal:", `Rs. ${(order.subtotal ?? 0).toFixed(2)}`);
  if (order.discount) totalsRow("Discount:", `- Rs. ${order.discount.toFixed(2)}`);
  totalsRow("Tax:", `Rs. ${(order.tax ?? 0).toFixed(2)}`);
  totalsRow("Shipping:", `Rs. ${(order.shippingCharge ?? 0).toFixed(2)}`);
  y += 4;
  doc.moveTo(360, y).lineTo(545, y).strokeColor("#cccccc").stroke();
  y += 8;
  totalsRow("Grand Total:", `Rs. ${(order.grandTotal ?? 0).toFixed(2)}`, true);

  doc.moveDown(3);
  doc.fontSize(8).fillColor("#888888").text("This is a system-generated invoice and does not require a signature.", 50, 720, {
    align: "center",
    width: 495,
  });

  doc.end();
};

export const generateInvoiceBuffer = (order, storeSettings) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const stream = new PassThrough();
    const chunks = [];

    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);

    doc.pipe(stream);
    buildInvoiceContent(doc, order, storeSettings);
  });

export const streamInvoiceToResponse = (res, order, storeSettings) => {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=invoice-${order.orderNumber}.pdf`);
  doc.pipe(res);
  buildInvoiceContent(doc, order, storeSettings);
};
