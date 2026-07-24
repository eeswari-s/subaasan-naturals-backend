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
  week: "%Y-%U",
  month: "%Y-%m",
};

export const getDashboardOverview = asyncHandler(async (req, res) => {
  const dateFilter = buildDateRangeFilter(req.query);
  const paidFilter = { paymentStatus: PAYMENT_STATUS.PAID, ...dateFilter };

  const [revenueAgg, statusBreakdown, customerCount, productCount, latestOrders] = await Promise.all([
    Order.aggregate([{ $match: paidFilter }, { $group: { _id: null, total: { $sum: "$grandTotal" }, count: { $sum: 1 } } }]),
    Order.aggregate([{ $match: dateFilter }, { $group: { _id: "$orderStatus", count: { $sum: 1 } } }]),
    User.countDocuments({}),
    Product.countDocuments({}),
    Order.find(dateFilter).populate("customer", "name email").sort({ createdAt: -1 }).limit(10),
  ]);

  const totalRevenue = revenueAgg[0]?.total || 0;
  const totalOrders = revenueAgg[0]?.count || 0;

  const orderStatusBreakdown = statusBreakdown.reduce((acc, curr) => {
    acc[curr._id] = curr.count;
    return acc;
  }, {});

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { totalRevenue, totalOrders, orderStatusBreakdown, customerCount, productCount, latestOrders },
      "Dashboard overview fetched"
    )
  );
});

export const getRevenueGraph = asyncHandler(async (req, res) => {
  const groupBy = GROUP_FORMATS[req.query.groupBy] || GROUP_FORMATS.day;
  const dateFilter = buildDateRangeFilter(req.query);

  const data = await Order.aggregate([
    { $match: { paymentStatus: PAYMENT_STATUS.PAID, ...dateFilter } },
    {
      $group: {
        _id: { $dateToString: { format: groupBy, date: "$createdAt" } },
        revenue: { $sum: "$grandTotal" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, data, "Revenue graph data fetched"));
});

export const getAdminNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.admin._id, recipientModel: "Admin" })
    .sort({ createdAt: -1 })
    .limit(30);

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, notifications, "Notifications fetched"));
});
