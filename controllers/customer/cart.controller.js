import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import HTTP_STATUS from "../../constants/httpStatusCodes.js";
import Cart from "../../models/cart.model.js";
import Product from "../../models/product.model.js";
import Coupon from "../../models/coupon.model.js";
import calculateOrderTotals from "../../utils/calculateOrderTotals.js";
import { validateAndCalculateCoupon } from "../../services/order.service.js";
import { incrementCartCount } from "../../services/product.service.js";

const resolveItemPricing = (product, variantName) => {
  if (variantName) {
    const variant = product.variants.find((v) => v.variantName === variantName);
    if (!variant) throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Variant "${variantName}" not found`);
    return { price: variant.offerPrice || variant.sellingPrice, stock: variant.stock, image: variant.images?.[0]?.url };
  }
  return { price: product.offerPrice || product.sellingPrice, stock: product.stock, image: product.thumbnail?.url };
};

const buildCartResponse = async (cart) => {
  if (!cart || cart.items.length === 0) {
    return { items: [], coupon: null, ...calculateOrderTotals([], null) };
  }

  const productIds = cart.items.map((i) => i.product);
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  const enrichedItems = [];
  for (const item of cart.items) {
    const product = productMap.get(item.product.toString());
    if (!product || product.status !== "active") continue;

    const pricing = resolveItemPricing(product, item.variantName);
    enrichedItems.push({
      product: {
        _id: product._id,
        name: product.name,
        slug: product.slug,
        thumbnail: product.thumbnail,
      },
      variantName: item.variantName,
      quantity: item.quantity,
      price: pricing.price,
      image: pricing.image,
      availableStock: pricing.stock,
      freeShipping: product.freeShipping,
      lineTotal: Number((pricing.price * item.quantity).toFixed(2)),
    });
  }

  let coupon = null;
  if (cart.coupon) {
    coupon = await Coupon.findById(cart.coupon);
  }

  const totals = calculateOrderTotals(
    enrichedItems.map((i) => ({ price: i.price, quantity: i.quantity, freeShipping: i.freeShipping })),
    coupon ? { type: coupon.type, value: coupon.value, maxDiscount: coupon.maxDiscount } : null
  );

  return { items: enrichedItems, coupon: coupon ? { code: coupon.code, type: coupon.type, value: coupon.value } : null, ...totals };
};

export const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  const response = await buildCartResponse(cart);
  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, response, "Cart fetched"));
});

export const addToCart = asyncHandler(async (req, res) => {
  const { productId, variantName = null, quantity = 1 } = req.body;

  const product = await Product.findOne({ _id: productId, status: "active" });
  if (!product) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Product not found");

  const pricing = resolveItemPricing(product, variantName);
  if (pricing.stock < quantity) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Requested quantity exceeds available stock");
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = new Cart({ user: req.user._id, items: [] });

  const existingItem = cart.items.find(
    (i) => i.product.toString() === productId && i.variantName === variantName
  );

  let isNewLine = false;
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.items.push({ product: productId, variantName, quantity });
    isNewLine = true;
  }

  await cart.save();
  if (isNewLine) incrementCartCount(productId, 1).catch(() => {});

  const response = await buildCartResponse(cart);
  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, response, "Item added to cart"));
});

export const updateCartItem = asyncHandler(async (req, res) => {
  const { productId, variantName = null, quantity } = req.body;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Cart not found");

  const item = cart.items.find((i) => i.product.toString() === productId && i.variantName === variantName);
  if (!item) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Item not found in cart");

  const product = await Product.findById(productId);
  const pricing = resolveItemPricing(product, variantName);
  if (pricing.stock < quantity) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Requested quantity exceeds available stock");
  }

  item.quantity = quantity;
  await cart.save();

  const response = await buildCartResponse(cart);
  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, response, "Cart item updated"));
});

export const removeCartItem = asyncHandler(async (req, res) => {
  const { productId, variantName = null } = req.body;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Cart not found");

  const existed = cart.items.some((i) => i.product.toString() === productId && i.variantName === variantName);
  cart.items = cart.items.filter((i) => !(i.product.toString() === productId && i.variantName === variantName));
  await cart.save();

  if (existed) incrementCartCount(productId, -1).catch(() => {});

  const response = await buildCartResponse(cart);
  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, response, "Item removed from cart"));
});

export const applyCoupon = asyncHandler(async (req, res) => {
  const { code } = req.body;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart || cart.items.length === 0) throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Cart is empty");

  const preview = await buildCartResponse(cart);
  const coupon = await validateAndCalculateCoupon(code, req.user._id, preview.subtotal);

  cart.coupon = coupon._id;
  await cart.save();

  const response = await buildCartResponse(cart);
  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, response, "Coupon applied"));
});

export const removeCoupon = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Cart not found");

  cart.coupon = null;
  await cart.save();

  const response = await buildCartResponse(cart);
  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, response, "Coupon removed"));
});

export { buildCartResponse };
