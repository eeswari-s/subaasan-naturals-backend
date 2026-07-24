import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import HTTP_STATUS from "../../constants/httpStatusCodes.js";
import Notification from "../../models/notification.model.js";
import { getPagination, buildPaginatedResponse } from "../../helpers/pagination.helper.js";

export const getMyNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { recipient: req.user._id, recipientModel: "User" };
  if (req.query.isRead !== undefined) filter.isRead = req.query.isRead === "true";

  const [docs, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: req.user._id, recipientModel: "User", isRead: false }),
  ]);

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, { ...buildPaginatedResponse(docs, total, page, limit), unreadCount }, "Notifications fetched")
  );
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id, recipientModel: "User" },
    { isRead: true },
    { new: true }
  );
  if (!notification) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Notification not found");

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, notification, "Notification marked as read"));
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, recipientModel: "User", isRead: false }, { isRead: true });
  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, "All notifications marked as read"));
});
