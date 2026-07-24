import crypto from "crypto";

const generateInvoiceNumber = () => {
  const date = new Date();
  const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
  const randomPart = crypto.randomInt(100000, 999999);
  return `INV-${datePart}-${randomPart}`;
};

export default generateInvoiceNumber;
