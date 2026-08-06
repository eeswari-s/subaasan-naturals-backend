import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import HTTP_STATUS from "../../constants/httpStatusCodes.js";
import Client from "../../models/client.model.js";
import { getPagination, buildPaginatedResponse } from "../../helpers/pagination.helper.js";
import { logActivityFromRequest } from "../../services/activityLog.service.js";

const normalizeDomain = (domain) => domain.trim().toLowerCase().replace(/^www\./, "");

export const listClients = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const filter = {};
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: "i" } },
      { domain: { $regex: req.query.search, $options: "i" } },
    ];
  }

  const [docs, total] = await Promise.all([
    Client.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Client.countDocuments(filter),
  ]);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, buildPaginatedResponse(docs, total, page, limit), "Clients fetched"));
});

export const createClient = asyncHandler(async (req, res) => {
  const domain = normalizeDomain(req.body.domain);

  const existing = await Client.findOne({ domain });
  if (existing) {
    throw new ApiError(HTTP_STATUS.CONFLICT, "Domain must be unique", [
      { field: "domain", message: "Domain must be unique" },
    ]);
  }

  const client = await Client.create({ ...req.body, domain });

  logActivityFromRequest(req, "SuperAdmin", "CREATED_CLIENT", { targetType: "Client", targetId: client._id }).catch(() => {});

  return res.status(HTTP_STATUS.CREATED).json(new ApiResponse(HTTP_STATUS.CREATED, client, "Client created"));
});

export const updateClient = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);
  if (!client) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Client not found");

  if (req.body.domain !== undefined) {
    const domain = normalizeDomain(req.body.domain);
    const existing = await Client.findOne({ domain, _id: { $ne: client._id } });
    if (existing) {
      throw new ApiError(HTTP_STATUS.CONFLICT, "Domain must be unique", [
        { field: "domain", message: "Domain must be unique" },
      ]);
    }
    req.body.domain = domain;
  }

  Object.assign(client, req.body);
  await client.save();

  logActivityFromRequest(req, "SuperAdmin", "UPDATED_CLIENT", { targetType: "Client", targetId: client._id }).catch(() => {});

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, client, "Client updated"));
});

export const deleteClient = asyncHandler(async (req, res) => {
  const client = await Client.findByIdAndDelete(req.params.id);
  if (!client) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Client not found");

  logActivityFromRequest(req, "SuperAdmin", "DELETED_CLIENT", { targetType: "Client", targetId: req.params.id }).catch(() => {});

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, "Client deleted"));
});
