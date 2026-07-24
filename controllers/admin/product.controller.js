import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import HTTP_STATUS from "../../constants/httpStatusCodes.js";
import Product from "../../models/product.model.js";
import { getPagination, buildPaginatedResponse, getSort } from "../../helpers/pagination.helper.js";
import { generateUniqueSlug } from "../../helpers/slugify.helper.js";
import { uploadImage, uploadImages, deleteImage, deleteImages } from "../../utils/cloudinaryUpload.js";

const parseIfJson = (value, fallback) => {
  if (value === undefined) return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
};

export const getAdminProducts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const sort = getSort(req.query);

  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;
  if (req.query.search) filter.$text = { $search: req.query.search };

  const [docs, total] = await Promise.all([
    Product.find(filter).populate("category", "name slug").sort(sort).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, buildPaginatedResponse(docs, total, page, limit), "Products fetched"));
});

export const getAdminProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate("category", "name slug").populate("relatedProducts", "name slug");
  if (!product) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Product not found");

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, product, "Product fetched"));
});

export const createProduct = asyncHandler(async (req, res) => {
  const body = req.body;

  const slug = await generateUniqueSlug(Product, body.name);

  let thumbnail = null;
  if (req.files?.thumbnail?.[0]) {
    thumbnail = await uploadImage(req.files.thumbnail[0].buffer, "products");
  }

  let galleryImages = [];
  if (req.files?.gallery?.length) {
    galleryImages = await uploadImages(req.files.gallery.map((f) => f.buffer), "products");
  }

  const variants = parseIfJson(body.variants, []);
  const highlights = parseIfJson(body.highlights, []);
  const relatedProducts = parseIfJson(body.relatedProducts, []);

  const product = await Product.create({
    name: body.name,
    slug,
    category: body.category,
    brand: body.brand,
    shortDescription: body.shortDescription,
    fullDescription: body.fullDescription,
    thumbnail,
    galleryImages,
    mrp: body.mrp,
    sellingPrice: body.sellingPrice,
    offerPrice: body.offerPrice,
    stock: body.stock,
    variants,
    highlights,
    ingredients: body.ingredients,
    shelfLife: body.shelfLife,
    storageInstructions: body.storageInstructions,
    manufacturer: body.manufacturer,
    countryOfOrigin: body.countryOfOrigin,
    fssaiNumber: body.fssaiNumber,
    netQuantity: body.netQuantity,
    couponApplicable: body.couponApplicable,
    freeShipping: body.freeShipping,
    deliveryCharge: body.deliveryCharge,
    estimatedDeliveryDays: body.estimatedDeliveryDays,
    isFeatured: body.isFeatured,
    isBestSeller: body.isBestSeller,
    isTrending: body.isTrending,
    isNewArrival: body.isNewArrival,
    isTodaysDeal: body.isTodaysDeal,
    relatedProducts,
    displayOrder: body.displayOrder,
    status: body.status,
  });

  return res.status(HTTP_STATUS.CREATED).json(new ApiResponse(HTTP_STATUS.CREATED, product, "Product created"));
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Product not found");

  const body = req.body;

  if (body.name && body.name !== product.name) {
    product.slug = await generateUniqueSlug(Product, body.name, product._id);
    product.name = body.name;
  }

  const directFields = [
    "category",
    "brand",
    "shortDescription",
    "fullDescription",
    "mrp",
    "sellingPrice",
    "offerPrice",
    "stock",
    "ingredients",
    "shelfLife",
    "storageInstructions",
    "manufacturer",
    "countryOfOrigin",
    "fssaiNumber",
    "netQuantity",
    "couponApplicable",
    "freeShipping",
    "deliveryCharge",
    "estimatedDeliveryDays",
    "isFeatured",
    "isBestSeller",
    "isTrending",
    "isNewArrival",
    "isTodaysDeal",
    "displayOrder",
    "status",
  ];
  directFields.forEach((field) => {
    if (body[field] !== undefined) product[field] = body[field];
  });

  if (body.variants !== undefined) product.variants = parseIfJson(body.variants, product.variants);
  if (body.highlights !== undefined) product.highlights = parseIfJson(body.highlights, product.highlights);
  if (body.relatedProducts !== undefined) product.relatedProducts = parseIfJson(body.relatedProducts, product.relatedProducts);

  if (req.files?.thumbnail?.[0]) {
    const oldPublicId = product.thumbnail?.publicId;
    product.thumbnail = await uploadImage(req.files.thumbnail[0].buffer, "products");
    if (oldPublicId) deleteImage(oldPublicId).catch(() => {});
  }

  if (req.files?.gallery?.length) {
    const oldPublicIds = product.galleryImages.map((img) => img.publicId);
    product.galleryImages = await uploadImages(req.files.gallery.map((f) => f.buffer), "products");
    if (oldPublicIds.length) deleteImages(oldPublicIds).catch(() => {});
  }

  await product.save();

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, product, "Product updated"));
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Product not found");

  const publicIds = [
    product.thumbnail?.publicId,
    ...product.galleryImages.map((img) => img.publicId),
    ...product.variants.flatMap((v) => v.images.map((img) => img.publicId)),
  ].filter(Boolean);

  await deleteImages(publicIds);
  await product.deleteOne();

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, "Product deleted"));
});

export const uploadVariantImages = asyncHandler(async (req, res) => {
  const { variantName } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Product not found");

  const variant = product.variants.find((v) => v.variantName === variantName);
  if (!variant) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Variant not found");

  if (!req.files?.length) throw new ApiError(HTTP_STATUS.BAD_REQUEST, "No images provided");

  const uploaded = await uploadImages(req.files.map((f) => f.buffer), "products/variants");
  variant.images.push(...uploaded);

  await product.save();

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, product, "Variant images uploaded"));
});
