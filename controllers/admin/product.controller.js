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

const toBool = (value, fallback = false) => {
  if (value === undefined) return fallback;
  if (typeof value === "boolean") return value;
  return value === "true" || value === "1";
};

const VARIANT_IMAGE_FIELD_RE = /^variantImages_(\d+)$/;

// upload.any() returns a flat array of files instead of the {fieldname: [...]} shape
// upload.fields() gives — group them back out by purpose here.
const groupUploadedFiles = (files = []) => {
  const thumbnail = files.find((f) => f.fieldname === "thumbnail") || null;
  const gallery = files.filter((f) => f.fieldname === "gallery");

  const variantImagesByIndex = new Map();
  files.forEach((f) => {
    const match = f.fieldname.match(VARIANT_IMAGE_FIELD_RE);
    if (!match) return;
    const index = Number(match[1]);
    if (!variantImagesByIndex.has(index)) variantImagesByIndex.set(index, []);
    variantImagesByIndex.get(index).push(f);
  });

  return { thumbnail, gallery, variantImagesByIndex };
};

/**
 * Reconciles a stored {url, publicId}[] image list against the URLs the client says it
 * kept (existingUrlsRaw) plus any newly uploaded files, so edits never silently drop or
 * re-upload images that already exist on Cloudinary.
 * existingUrlsRaw undefined => nothing was removed, just append new uploads.
 */
const mergeImageList = async (currentImages = [], existingUrlsRaw, newFiles = [], folder) => {
  const existingUrls = parseIfJson(existingUrlsRaw, null);

  let kept = currentImages;
  let removedPublicIds = [];

  if (Array.isArray(existingUrls)) {
    kept = currentImages.filter((img) => existingUrls.includes(img.url));
    removedPublicIds = currentImages.filter((img) => !existingUrls.includes(img.url)).map((img) => img.publicId);
  }

  const uploaded = newFiles.length ? await uploadImages(newFiles.map((f) => f.buffer), folder) : [];

  return { images: [...kept, ...uploaded], removedPublicIds };
};

const buildVariantsForSave = async (rawVariants = [], variantImagesByIndex, currentVariants = []) => {
  const variants = [];

  for (let i = 0; i < rawVariants.length; i += 1) {
    const rawVariant = rawVariants[i];
    const currentVariant = currentVariants[i];
    const newFiles = variantImagesByIndex.get(i) || [];

    const { images, removedPublicIds } = await mergeImageList(
      currentVariant?.images || [],
      rawVariant.existingImageUrls,
      newFiles,
      "products/variants"
    );
    if (removedPublicIds.length) deleteImages(removedPublicIds).catch(() => {});

    variants.push({
      variantName: rawVariant.variantName || rawVariant.name,
      mrp: rawVariant.mrp,
      sellingPrice: rawVariant.sellingPrice,
      offerPrice: rawVariant.offerPrice,
      stock: rawVariant.stock,
      totalStock: rawVariant.totalStock ?? rawVariant.stock ?? 0,
      lowStockLimit: rawVariant.lowStockLimit,
      images,
    });
  }

  return variants;
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
  const { thumbnail: thumbnailFile, gallery: galleryFiles, variantImagesByIndex } = groupUploadedFiles(req.files);

  const slug = await generateUniqueSlug(Product, body.name);

  const thumbnail = thumbnailFile ? await uploadImage(thumbnailFile.buffer, "products") : null;

  const { images: galleryImages } = await mergeImageList([], body.existingGalleryUrls, galleryFiles, "products");

  const rawVariants = parseIfJson(body.variants, []);
  const variants = await buildVariantsForSave(rawVariants, variantImagesByIndex, []);

  const highlights = parseIfJson(body.highlights, []);
  const relatedProducts = parseIfJson(body.relatedProducts, []);

  const product = await Product.create({
    name: body.name,
    slug,
    category: body.categoryId || body.category,
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
    storageInstructions: body.storageInstructions || body.storage,
    manufacturer: body.manufacturer,
    countryOfOrigin: body.countryOfOrigin,
    fssaiNumber: body.fssaiNumber,
    netQuantity: body.netQuantity,
    couponApplicable: toBool(body.couponApplicable, true),
    freeShipping: toBool(body.freeShipping, false),
    deliveryCharge: body.deliveryCharge,
    estimatedDeliveryDays: body.estimatedDeliveryDays,
    isFeatured: toBool(body.isFeatured ?? body.featured),
    isBestSeller: toBool(body.isBestSeller ?? body.bestSeller),
    isTrending: toBool(body.isTrending ?? body.trending),
    isNewArrival: toBool(body.isNewArrival ?? body.newArrival),
    isTodaysDeal: toBool(body.isTodaysDeal ?? body.todaysDeal),
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
  const { thumbnail: thumbnailFile, gallery: galleryFiles, variantImagesByIndex } = groupUploadedFiles(req.files);

  if (body.name && body.name !== product.name) {
    product.slug = await generateUniqueSlug(Product, body.name, product._id);
    product.name = body.name;
  }

  const category = body.categoryId || body.category;
  if (category !== undefined) product.category = category;

  const directFieldMap = {
    brand: "brand",
    shortDescription: "shortDescription",
    fullDescription: "fullDescription",
    mrp: "mrp",
    sellingPrice: "sellingPrice",
    offerPrice: "offerPrice",
    stock: "stock",
    ingredients: "ingredients",
    shelfLife: "shelfLife",
    storage: "storageInstructions",
    storageInstructions: "storageInstructions",
    manufacturer: "manufacturer",
    countryOfOrigin: "countryOfOrigin",
    fssaiNumber: "fssaiNumber",
    netQuantity: "netQuantity",
    deliveryCharge: "deliveryCharge",
    estimatedDeliveryDays: "estimatedDeliveryDays",
    displayOrder: "displayOrder",
    status: "status",
  };
  Object.entries(directFieldMap).forEach(([bodyKey, schemaKey]) => {
    if (body[bodyKey] !== undefined) product[schemaKey] = body[bodyKey];
  });

  const booleanFieldMap = {
    couponApplicable: "couponApplicable",
    freeShipping: "freeShipping",
    featured: "isFeatured",
    isFeatured: "isFeatured",
    bestSeller: "isBestSeller",
    isBestSeller: "isBestSeller",
    trending: "isTrending",
    isTrending: "isTrending",
    newArrival: "isNewArrival",
    isNewArrival: "isNewArrival",
    todaysDeal: "isTodaysDeal",
    isTodaysDeal: "isTodaysDeal",
  };
  Object.entries(booleanFieldMap).forEach(([bodyKey, schemaKey]) => {
    if (body[bodyKey] !== undefined) product[schemaKey] = toBool(body[bodyKey]);
  });

  if (body.highlights !== undefined) product.highlights = parseIfJson(body.highlights, product.highlights);
  if (body.relatedProducts !== undefined) product.relatedProducts = parseIfJson(body.relatedProducts, product.relatedProducts);

  if (thumbnailFile) {
    const oldPublicId = product.thumbnail?.publicId;
    product.thumbnail = await uploadImage(thumbnailFile.buffer, "products");
    if (oldPublicId) deleteImage(oldPublicId).catch(() => {});
  }

  if (body.existingGalleryUrls !== undefined || galleryFiles.length) {
    const { images, removedPublicIds } = await mergeImageList(
      product.galleryImages,
      body.existingGalleryUrls,
      galleryFiles,
      "products"
    );
    product.galleryImages = images;
    if (removedPublicIds.length) deleteImages(removedPublicIds).catch(() => {});
  }

  if (body.variants !== undefined) {
    const rawVariants = parseIfJson(body.variants, []);
    product.variants = await buildVariantsForSave(rawVariants, variantImagesByIndex, product.variants);
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
