import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import HTTP_STATUS from "../../constants/httpStatusCodes.js";
import Order from "../../models/order.model.js";
import User from "../../models/user.model.js";
import Product from "../../models/product.model.js";
import Notification from "../../models/notification.model.js";
import { buildDateRangeFilter } from "../../helpers/filter.helper.js";
import { PAYMENT_STATUS } from "../../constants/paymentStatus.js";

const GROUP_FORMATS = {
  day: "%Y-%m-%d",
  month: "%Y-%m",
};

export const getPlatformDashboard = asyncHandler(async (req, res) => {
  const dateFilter = buildDateRangeFilter(req.query);
  const paidFilter = { paymentStatus: PAYMENT_STATUS.PAID, ...dateFilter };
  const trendFormat = GROUP_FORMATS[req.query.groupBy] || GROUP_FORMATS.day;

  const [revenueTrend, topProducts, customerGrowth, totalRevenueAgg, totalCustomers, totalOrders] = await Promise.all([
    Order.aggregate([
      { $match: paidFilter },
      { $group: { _id: { $dateToString: { format: trendFormat, date: "$createdAt" } }, revenue: { $sum: "$grandTotal" } } },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: paidFilter },
      { $unwind: "$items" },
      { $group: { _id: "$items.product", unitsSold: { $sum: "$items.quantity" }, revenue: { $sum: { $multiply: ["$items.priceSnapshot", "$items.quantity"] } } } },
      { $sort: { unitsSold: -1 } },
      { $limit: 10 },
      { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
      { $unwind: "$product" },
      { $project: { unitsSold: 1, revenue: 1, "product.name": 1, "product.slug": 1 } },
    ]),
    User.aggregate([
      { $match: dateFilter },
      { $group: { _id: { $dateToString: { format: trendFormat, date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([{ $match: paidFilter }, { $group: { _id: null, total: { $sum: "$grandTotal" } } }]),
    User.countDocuments({}),
    Order.countDocuments(dateFilter),
  ]);

  const totalProducts = await Product.countDocuments({});

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        totalRevenue: totalRevenueAgg[0]?.total || 0,
        totalCustomers,
        totalProducts,
        totalOrders,
        revenueTrend,
        topProducts,
        customerGrowth,
      },
      "Platform dashboard fetched"
    )
  );
});

export const generateReport = asyncHandler(async (req, res) => {
  const dateFilter = buildDateRangeFilter(req.query);
  const paidFilter = { paymentStatus: PAYMENT_STATUS.PAID, ...dateFilter };

  const [orderSummary, customerCount] = await Promise.all([
    Order.aggregate([
      { $match: paidFilter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$grandTotal" },
          totalOrders: { $sum: 1 },
          totalDiscount: { $sum: "$discount" },
          totalTax: { $sum: "$tax" },
          averageOrderValue: { $avg: "$grandTotal" },
        },
      },
    ]),
    User.countDocuments(dateFilter),
  ]);

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { report: orderSummary[0] || {}, newCustomers: customerCount, period: { startDate: req.query.startDate, endDate: req.query.endDate } },
      "Report generated"
    )
  );
});

export const getSuperAdminNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.superAdmin._id, recipientModel: "SuperAdmin" })
    .sort({ createdAt: -1 })
    .limit(30);

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, notifications, "Notifications fetched"));
});
