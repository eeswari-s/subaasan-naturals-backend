import crypto from "crypto";

const generateOrderNumber = () => {
  const date = new Date();
  const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(
    date.getDate()
  ).padStart(2, "0")}`;
  const randomPart = crypto.randomInt(10000, 99999);
  return `ORD-${datePart}-${randomPart}`;
};

export default generateOrderNumber;
