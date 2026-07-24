import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import HTTP_STATUS from "../../constants/httpStatusCodes.js";
import Blog from "../../models/blog.model.js";
import { getPagination, buildPaginatedResponse } from "../../helpers/pagination.helper.js";
import { generateUniqueSlug } from "../../helpers/slugify.helper.js";
import { uploadImage, deleteImage } from "../../utils/cloudinaryUpload.js";

export const getPublicBlogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { status: "published" };
  if (req.query.category) filter.category = req.query.category;

  const [docs, total] = await Promise.all([
    Blog.find(filter).select("-content").sort({ publishedDate: -1 }).skip(skip).limit(limit),
    Blog.countDocuments(filter),
  ]);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, buildPaginatedResponse(docs, total, page, limit), "Blogs fetched"));
});

export const getPublicBlogBySlug = asyncHandler(async (req, res) => {
  const blog = await Blog.findOneAndUpdate(
    { slug: req.params.slug, status: "published" },
    { $inc: { views: 1 } },
    { new: true }
  );
  if (!blog) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Blog post not found");

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, blog, "Blog post fetched"));
});

export const getAdminBlogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) filter.title = { $regex: req.query.search, $options: "i" };

  const [docs, total] = await Promise.all([
    Blog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Blog.countDocuments(filter),
  ]);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, buildPaginatedResponse(docs, total, page, limit), "Blogs fetched"));
});

export const createBlog = asyncHandler(async (req, res) => {
  const { title, category, shortDescription, content, status = "draft" } = req.body;

  const slug = await generateUniqueSlug(Blog, title);

  let thumbnail = null;
  if (req.file) thumbnail = await uploadImage(req.file.buffer, "blog");

  const blog = await Blog.create({
    title,
    slug,
    category,
    shortDescription,
    content,
    status,
    thumbnail,
    publishedDate: status === "published" ? new Date() : null,
  });

  return res.status(HTTP_STATUS.CREATED).json(new ApiResponse(HTTP_STATUS.CREATED, blog, "Blog created"));
});

export const updateBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Blog not found");

  const { title, category, shortDescription, content, status } = req.body;

  if (title && title !== blog.title) {
    blog.slug = await generateUniqueSlug(Blog, title, blog._id);
    blog.title = title;
  }
  if (category !== undefined) blog.category = category;
  if (shortDescription !== undefined) blog.shortDescription = shortDescription;
  if (content !== undefined) blog.content = content;
  if (status !== undefined) {
    if (status === "published" && blog.status !== "published") blog.publishedDate = new Date();
    blog.status = status;
  }

  if (req.file) {
    const oldPublicId = blog.thumbnail?.publicId;
    blog.thumbnail = await uploadImage(req.file.buffer, "blog");
    if (oldPublicId) deleteImage(oldPublicId).catch(() => {});
  }

  await blog.save();

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, blog, "Blog updated"));
});

export const deleteBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findByIdAndDelete(req.params.id);
  if (!blog) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Blog not found");

  if (blog.thumbnail?.publicId) deleteImage(blog.thumbnail.publicId).catch(() => {});

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, "Blog deleted"));
});
