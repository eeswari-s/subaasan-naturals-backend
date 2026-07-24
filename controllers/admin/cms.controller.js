import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import HTTP_STATUS from "../../constants/httpStatusCodes.js";
import CmsPage from "../../models/cmsPage.model.js";

const PAGE_TITLES = {
  "privacy-policy": "Privacy Policy",
  "terms-and-conditions": "Terms & Conditions",
  "contact-us": "Contact Us",
};

export const getAdminCmsPages = asyncHandler(async (req, res) => {
  const pages = await CmsPage.find().sort({ slug: 1 });
  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, pages, "CMS pages fetched"));
});

export const upsertCmsPage = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { title, content } = req.body;

  const page = await CmsPage.findOneAndUpdate(
    { slug },
    { slug, title: title || PAGE_TITLES[slug], content },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, page, "CMS page saved"));
});
