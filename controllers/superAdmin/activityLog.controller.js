import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import HTTP_STATUS from "../../constants/httpStatusCodes.js";
import ActivityLog from "../../models/activityLog.model.js";
import { getPagination, buildPaginatedResponse } from "../../helpers/pagination.helper.js";
import { buildDateRangeFilter } from "../../helpers/filter.helper.js";

export const getActivityLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const filter = { ...buildDateRangeFilter(req.query) };
  if (req.query.actor) filter.actor = req.query.actor;
  if (req.query.actorModel) filter.actorModel = req.query.actorModel;
  if (req.query.action) filter.action = { $regex: req.query.action, $options: "i" };

  const [docs, total] = await Promise.all([
    ActivityLog.find(filter).populate("actor", "name email").sort({ createdAt: -1 }).skip(skip).limit(limit),
    ActivityLog.countDocuments(filter),
  ]);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, buildPaginatedResponse(docs, total, page, limit), "Activity logs fetched"));
});
