import { body, param } from "express-validator";

const DOMAIN_REGEX = /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i;
const GA_MEASUREMENT_ID_REGEX = /^G-[A-Z0-9]+$/;
const GTM_ID_REGEX = /^GTM-[A-Z0-9]+$/;
const META_PIXEL_ID_REGEX = /^\d{6,20}$/;

const optionalFieldRules = [
  body("gaMeasurementId")
    .optional({ checkFalsy: true })
    .trim()
    .matches(GA_MEASUREMENT_ID_REGEX)
    .withMessage("Invalid GA4 Measurement ID (expected format: G-XXXXXXX)"),
  body("gtmId")
    .optional({ checkFalsy: true })
    .trim()
    .matches(GTM_ID_REGEX)
    .withMessage("Invalid GTM ID (expected format: GTM-XXXXXXX)"),
  body("metaPixelId")
    .optional({ checkFalsy: true })
    .trim()
    .matches(META_PIXEL_ID_REGEX)
    .withMessage("Invalid Meta Pixel ID"),
  body("gscVerificationCode").optional({ checkFalsy: true }).isString(),
  body("isActive").optional().isBoolean(),
];

export const createClientValidator = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 120 }),
  body("domain")
    .trim()
    .notEmpty()
    .withMessage("Domain is required")
    .toLowerCase()
    .matches(DOMAIN_REGEX)
    .withMessage("Domain must be a bare domain with no protocol or path (e.g. example.com)"),
  ...optionalFieldRules,
];

export const updateClientValidator = [
  param("id").isMongoId().withMessage("Invalid client id"),
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty").isLength({ max: 120 }),
  body("domain")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Domain cannot be empty")
    .toLowerCase()
    .matches(DOMAIN_REGEX)
    .withMessage("Domain must be a bare domain with no protocol or path (e.g. example.com)"),
  ...optionalFieldRules,
];

export const clientIdValidator = [param("id").isMongoId().withMessage("Invalid client id")];
