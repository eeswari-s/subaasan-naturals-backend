import jwt from "jsonwebtoken";
import crypto from "crypto";
import env from "../config/env.js";
import { ROLES } from "../constants/roles.js";

export const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const accessTokenExpiryForRole = (role) => (role === ROLES.ADMIN ? env.ADMIN_JWT_ACCESS_EXPIRY : env.JWT_ACCESS_EXPIRY);

export const generateAccessToken = ({ id, role }) =>
  jwt.sign({ id, role }, env.JWT_ACCESS_SECRET, { expiresIn: accessTokenExpiryForRole(role) });

export const generateRefreshToken = ({ id, role }) =>
  jwt.sign({ id, role }, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRY });

export const generateTokens = ({ id, role }) => ({
  accessToken: generateAccessToken({ id, role }),
  refreshToken: generateRefreshToken({ id, role }),
});

export const verifyAccessToken = (token) => jwt.verify(token, env.JWT_ACCESS_SECRET);

export const verifyRefreshToken = (token) => jwt.verify(token, env.JWT_REFRESH_SECRET);

export const getTokenExpiryDate = (token) => {
  const decoded = jwt.decode(token);
  return new Date(decoded.exp * 1000);
};
