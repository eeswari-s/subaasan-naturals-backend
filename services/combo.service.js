import ApiError from "../utils/ApiError.js";
import HTTP_STATUS from "../constants/httpStatusCodes.js";
import { resolveItemPricing } from "./product.service.js";

// Flattens a combo's items (× how many combo units) into plain {product, variantName,
// quantity} lines — the same shape order.service.js's stock functions already expect,
// so combo stock reuses that logic instead of duplicating it.
export const flattenComboItems = (comboItems, comboQuantity = 1) =>
  comboItems.map((item) => ({
    product: item.product,
    variantName: item.variantName,
    quantity: item.quantity * comboQuantity,
  }));

// Populates live pricing/stock for each item and computes the combo's available
// stock (bottlenecked by whichever constituent product has the least stock relative
// to how many of it the combo needs) and how much the customer saves vs buying separately.
export const getComboAvailability = (combo) => {
  let availableUnits = Infinity;
  let originalTotal = 0;
  let allActive = true;

  const itemDetails = combo.items.map((item) => {
    const product = item.product;
    if (!product || product.status !== "active") {
      allActive = false;
      return { ...item.toObject?.() ?? item, unitPrice: 0, availableStock: 0 };
    }

    const pricing = resolveItemPricing(product, item.variantName);
    const unitsFromThisItem = Math.floor(pricing.stock / item.quantity);
    availableUnits = Math.min(availableUnits, unitsFromThisItem);
    originalTotal += pricing.price * item.quantity;

    return {
      product: { _id: product._id, name: product.name, slug: product.slug, thumbnail: product.thumbnail },
      variantName: item.variantName,
      quantity: item.quantity,
      unitPrice: pricing.price,
      availableStock: pricing.stock,
    };
  });

  const availableStock = allActive && Number.isFinite(availableUnits) ? availableUnits : 0;
  const savings = Math.max(originalTotal - combo.comboPrice, 0);

  return { itemDetails, availableStock, originalTotal, savings, allActive };
};

export const validateComboStock = (combo, quantity) => {
  const { availableStock, allActive } = getComboAvailability(combo);
  if (!allActive) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, `"${combo.name}" is no longer available (one or more items in it is unavailable)`);
  }
  if (availableStock < quantity) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Only ${availableStock} unit(s) of "${combo.name}" are available`);
  }
};

// Snapshots what's inside the combo at purchase time, for order-item storage —
// later edits to the combo/products must never change historical order records.
export const buildComboItemsSnapshot = (combo) =>
  combo.items.map((item) => ({
    product: item.product._id || item.product,
    variantName: item.variantName,
    productNameSnapshot: item.product.name || "Product",
    quantity: item.quantity,
  }));
