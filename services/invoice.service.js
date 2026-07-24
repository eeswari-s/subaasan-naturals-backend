import StoreSettings from "../models/storeSettings.model.js";
import { generateInvoiceBuffer } from "../utils/invoiceGenerator.js";
import { sendInvoiceEmail } from "./email.service.js";
import generateInvoiceNumber from "../utils/generateInvoiceNumber.js";

export const ensureInvoiceNumber = async (order) => {
  if (!order.invoiceNumber) {
    order.invoiceNumber = generateInvoiceNumber();
    await order.save();
  }
  return order.invoiceNumber;
};

export const getInvoiceBuffer = async (order) => {
  const storeSettings = await StoreSettings.findOne().lean();
  return generateInvoiceBuffer(order, storeSettings || {});
};

export const emailInvoiceToCustomer = async (order, user) => {
  await ensureInvoiceNumber(order);
  const buffer = await getInvoiceBuffer(order);
  return sendInvoiceEmail(user.email, user.name, order, buffer);
};
