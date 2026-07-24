import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import HTTP_STATUS from "../../constants/httpStatusCodes.js";
import Faq from "../../models/faq.model.js";

export const getPublicFaqs = asyncHandler(async (req, res) => {
  const filter = { status: "active" };
  if (req.query.category) filter.category = req.query.category;

  const faqs = await Faq.find(filter).sort({ displayOrder: 1, createdAt: -1 });

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, faqs, "FAQs fetched"));
});

export const getAdminFaqs = asyncHandler(async (req, res) => {
  const faqs = await Faq.find().sort({ displayOrder: 1, createdAt: -1 });
  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, faqs, "FAQs fetched"));
});

export const createFaq = asyncHandler(async (req, res) => {
  const faq = await Faq.create(req.body);
  return res.status(HTTP_STATUS.CREATED).json(new ApiResponse(HTTP_STATUS.CREATED, faq, "FAQ created"));
});

export const updateFaq = asyncHandler(async (req, res) => {
  const faq = await Faq.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!faq) throw new ApiError(HTTP_STATUS.NOT_FOUND, "FAQ not found");

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, faq, "FAQ updated"));
});

export const deleteFaq = asyncHandler(async (req, res) => {
  const faq = await Faq.findByIdAndDelete(req.params.id);
  if (!faq) throw new ApiError(HTTP_STATUS.NOT_FOUND, "FAQ not found");

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, "FAQ deleted"));
});
