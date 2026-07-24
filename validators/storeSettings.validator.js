import { body } from "express-validator";

export const updateStoreSettingsValidator = [
  body("storeName").optional().isString(),
  body("contact.phone").optional().isString(),
  body("contact.email").optional().isEmail(),
  body("contact.address").optional().isString(),
  body("contact.whatsapp").optional().isString(),
];
