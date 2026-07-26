import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import HTTP_STATUS from "../../constants/httpStatusCodes.js";
import Cart from "../../models/cart.model.js";
import Product from "../../models/product.model.js";
import Combo from "../../models/combo.model.js";
import Coupon from "../../models/coupon.model.js";
import calculateOrderTotals from "../../utils/calculateOrderTotals.js";
import { validateAndCalculateCoupon } from "../../services/order.service.js";
import { incrementCartCount, resolveItemPricing } from "../../services/product.service.js";
import { getComboAvailability, validateComboStock } from "../../services/combo.service.js";
import { getCheckoutSettings } from "../../services/platformConfig.service.js";

const findCartItemIndex = (cart, { productId, variantName = null, comboId }) => {
  if (comboId) return cart.items.findIndex((i) => i.combo && i.combo.toString() === comboId);
  return cart.items.findIndex((i) => i.product && i.product.toString() === productId && i.variantName === variantName);
};

const buildCartResponse = async (cart) => {
  const checkoutSettings = await getCheckoutSettings();

  if (!cart || cart.items.length === 0) {
    return { items: [], coupon: null, ...calculateOrderTotals([], null, checkoutSettings) };
  }

  const productIds = cart.items.filter((i) => i.product).map((i) => i.product);
  const comboIds = cart.items.filter((i) => i.combo).map((i) => i.combo);

  const [products, combos] = await Promise.all([
    Product.find({ _id: { $in: productIds } }),
    Combo.find({ _id: { $in: comboIds } }).populate("items.product", "name slug thumbnail status variants offerPrice sellingPrice stock"),
  ]);
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));
  const comboMap = new Map(combos.map((c) => [c._id.toString(), c]));

  const enrichedItems = [];
  for (const item of cart.items) {
    if (item.combo) {
      const combo = comboMap.get(item.combo.toString());
      if (!combo || combo.status !== "active") continue;

      const { availableStock } = getComboAvailability(combo);
      enrichedItems.push({
        combo: { _id: combo._id, name: combo.name, slug: combo.slug, thumbnail: combo.thumbnail },
        isCombo: true,
        quantity: item.quantity,
        price: combo.comboPrice,
        image: combo.thumbnail?.url,
        availableStock,
        freeShipping: false,
        lineTotal: Number((combo.comboPrice * item.quantity).toFixed(2)),
      });
      continue;
    }

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
      isCombo: false,
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
    coupon ? { type: coupon.type, value: coupon.value, maxDiscount: coupon.maxDiscount } : null,
    checkoutSettings
  );

  return { items: enrichedItems, coupon: coupon ? { code: coupon.code, type: coupon.type, value: coupon.value } : null, ...totals };
};

export const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  const response = await buildCartResponse(cart);
  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, response, "Cart fetched"));
});

export const addToCart = asyncHandler(async (req, res) => {
  const { productId, comboId, variantName = null, quantity = 1 } = req.body;

  if (!productId && !comboId) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Either productId or comboId is required");
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = new Cart({ user: req.user._id, items: [] });

  let isNewLine = false;

  if (comboId) {
    const combo = await Combo.findOne({ _id: comboId, status: "active" }).populate(
      "items.product",
      "name slug thumbnail status variants offerPrice sellingPrice stock"
    );
    if (!combo) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Combo not found");
    validateComboStock(combo, quantity);

    const existingIndex = findCartItemIndex(cart, { comboId });
    if (existingIndex >= 0) {
      cart.items[existingIndex].quantity += quantity;
    } else {
      cart.items.push({ combo: comboId, quantity });
      isNewLine = true;
    }
  } else {
    const product = await Product.findOne({ _id: productId, status: "active" });
    if (!product) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Product not found");

    const pricing = resolveItemPricing(product, variantName);
    if (pricing.stock < quantity) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Requested quantity exceeds available stock");
    }

    const existingIndex = findCartItemIndex(cart, { productId, variantName });
    if (existingIndex >= 0) {
      cart.items[existingIndex].quantity += quantity;
    } else {
      cart.items.push({ product: productId, variantName, quantity });
      isNewLine = true;
    }
  }

  await cart.save();
  if (isNewLine && productId) incrementCartCount(productId, 1).catch(() => {});

  const response = await buildCartResponse(cart);
  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, response, "Item added to cart"));
});

export const updateCartItem = asyncHandler(async (req, res) => {
  const { productId, comboId, variantName = null, quantity } = req.body;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Cart not found");

  const index = findCartItemIndex(cart, { productId, variantName, comboId });
  if (index < 0) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Item not found in cart");

  if (comboId) {
    const combo = await Combo.findById(comboId).populate(
      "items.product",
      "name slug thumbnail status variants offerPrice sellingPrice stock"
    );
    validateComboStock(combo, quantity);
  } else {
    const product = await Product.findById(productId);
    const pricing = resolveItemPricing(product, variantName);
    if (pricing.stock < quantity) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Requested quantity exceeds available stock");
    }
  }

  cart.items[index].quantity = quantity;
  await cart.save();

  const response = await buildCartResponse(cart);
  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, response, "Cart item updated"));
});

export const removeCartItem = asyncHandler(async (req, res) => {
  const { productId, comboId, variantName = null } = req.body;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Cart not found");

  const index = findCartItemIndex(cart, { productId, variantName, comboId });
  if (index < 0) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Item not found in cart");

  cart.items.splice(index, 1);
  await cart.save();

  if (productId) incrementCartCount(productId, -1).catch(() => {});

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
