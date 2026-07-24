import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import HTTP_STATUS from "../../constants/httpStatusCodes.js";
import Order from "../../models/order.model.js";
import Payment from "../../models/payment.model.js";
import { buildDateRangeFilter } from "../../helpers/filter.helper.js";
import { PAYMENT_STATUS } from "../../constants/paymentStatus.js";
import arrayToCsv from "../../utils/csvGenerator.js";
import { generateReportPdfBuffer } from "../../utils/reportPdfGenerator.js";
import { logActivityFromRequest } from "../../services/activityLog.service.js";

const REPORT_DEFINITIONS = {
  revenue: {
    title: "Revenue Report",
    columns: [
      { key: "date", label: "Date" },
      { key: "orders", label: "Orders" },
      { key: "revenue", label: "Revenue (Rs.)" },
    ],
    fetch: async (dateFilter) => {
      const rows = await Order.aggregate([
        { $match: { paymentStatus: PAYMENT_STATUS.PAID, ...dateFilter } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            orders: { $sum: 1 },
            revenue: { $sum: "$grandTotal" },
          },
        },
        { $sort: { _id: 1 } },
      ]);
      return rows.map((r) => ({ date: r._id, orders: r.orders, revenue: r.revenue.toFixed(2) }));
    },
  },
  orders: {
    title: "Orders Report",
    columns: [
      { key: "orderNumber", label: "Order Number" },
      { key: "date", label: "Date" },
      { key: "customerName", label: "Customer" },
      { key: "customerEmail", label: "Email" },
      { key: "orderStatus", label: "Status" },
      { key: "paymentStatus", label: "Payment Status" },
      { key: "grandTotal", label: "Grand Total (Rs.)" },
    ],
    fetch: async (dateFilter) => {
      const orders = await Order.find(dateFilter).populate("customer", "name email").sort({ createdAt: -1 }).limit(5000);
      return orders.map((o) => ({
        orderNumber: o.orderNumber,
        date: o.createdAt.toISOString().slice(0, 10),
        customerName: o.customer?.name || "-",
        customerEmail: o.customer?.email || "-",
        orderStatus: o.orderStatus,
        paymentStatus: o.paymentStatus,
        grandTotal: o.grandTotal.toFixed(2),
      }));
    },
  },
  payments: {
    title: "Payments Report",
    columns: [
      { key: "date", label: "Date" },
      { key: "orderNumber", label: "Order Number" },
      { key: "customerName", label: "Customer" },
      { key: "method", label: "Method" },
      { key: "status", label: "Status" },
      { key: "amount", label: "Amount (Rs.)" },
    ],
    fetch: async (dateFilter) => {
      const payments = await Payment.find(dateFilter)
        .populate("customer", "name")
        .populate("order", "orderNumber")
        .sort({ createdAt: -1 })
        .limit(5000);
      return payments.map((p) => ({
        date: p.createdAt.toISOString().slice(0, 10),
        orderNumber: p.order?.orderNumber || "-",
        customerName: p.customer?.name || "-",
        method: p.method,
        status: p.status,
        amount: p.amount.toFixed(2),
      }));
    },
  },
};

export const exportReport = asyncHandler(async (req, res) => {
  const { type, format } = req.query;
  const definition = REPORT_DEFINITIONS[type];
  if (!definition) throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Unknown report type");

  const dateFilter = buildDateRangeFilter(req.query);
  const rows = await definition.fetch(dateFilter);

  const fromLabel = req.query.startDate || "start";
  const toLabel = req.query.endDate || "now";
  const filenameBase = `${type}-report-${fromLabel}-to-${toLabel}`;

  logActivityFromRequest(req, "SuperAdmin", "EXPORTED_REPORT", {
    targetType: "Report",
    metadata: { type, format, rowCount: rows.length },
  }).catch(() => {});

  if (format === "csv") {
    const csv = arrayToCsv(definition.columns, rows);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filenameBase}.csv"`);
    return res.status(HTTP_STATUS.OK).send(csv);
  }

  const pdfBuffer = await generateReportPdfBuffer({
    title: definition.title,
    subtitle: `${fromLabel} to ${toLabel} — ${rows.length} record(s)`,
    columns: definition.columns,
    rows,
  });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filenameBase}.pdf"`);
  return res.status(HTTP_STATUS.OK).send(pdfBuffer);
});
