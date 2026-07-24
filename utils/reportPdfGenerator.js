import PDFDocument from "pdfkit";
import { PassThrough } from "stream";

/**
 * Generic tabular report PDF: title, optional summary line, then a simple table.
 * @param {{ title: string, subtitle?: string, columns: {key:string,label:string}[], rows: Object[] }} report
 */
const buildReportContent = (doc, { title, subtitle, columns, rows }) => {
  doc.fontSize(18).font("Helvetica-Bold").text(title);
  if (subtitle) {
    doc.moveDown(0.2);
    doc.fontSize(10).font("Helvetica").fillColor("#555555").text(subtitle);
  }
  doc.fillColor("#000000");
  doc.moveDown(1);

  const colWidth = 495 / columns.length;
  const tableTop = doc.y;

  doc.font("Helvetica-Bold").fontSize(9);
  columns.forEach((col, i) => {
    doc.text(col.label, 50 + i * colWidth, tableTop, { width: colWidth - 5 });
  });
  doc.moveTo(50, tableTop + 14).lineTo(545, tableTop + 14).strokeColor("#cccccc").stroke();

  let y = tableTop + 20;
  doc.font("Helvetica").fontSize(8.5);

  rows.forEach((row) => {
    if (y > 760) {
      doc.addPage();
      y = 50;
    }
    columns.forEach((col, i) => {
      const value = row[col.key] === undefined || row[col.key] === null ? "-" : String(row[col.key]);
      doc.text(value, 50 + i * colWidth, y, { width: colWidth - 5 });
    });
    y += 16;
  });

  doc.fontSize(8).fillColor("#888888").text(`Generated on ${new Date().toLocaleString("en-IN")}`, 50, 780, {
    align: "center",
    width: 495,
  });

  doc.end();
};

export const generateReportPdfBuffer = (report) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50, layout: "landscape" });
    const stream = new PassThrough();
    const chunks = [];

    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);

    doc.pipe(stream);
    buildReportContent(doc, report);
  });
