import { randomBytes, createHash } from "node:crypto";
import Session from "../models/session.model.js";
import { NODE_ENV } from "../config/env.js";
export const cookieName = "creditstock_session";
const isProduction = NODE_ENV === "production";
export const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
};
export const hashToken = (token) =>
  createHash("sha256").update(token).digest("hex");
export async function createSession(user, req, res) {
  const token = randomBytes(32).toString("hex");
  const maxAge = 7 * 24 * 60 * 60 * 1000;
  await Session.create({
    user: user._id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + maxAge),
  });
  const previous = req.cookies[cookieName];
  if (previous) await Session.deleteOne({ tokenHash: hashToken(previous) });
  res.cookie(cookieName, token, { ...cookieOptions, maxAge });
  return token;
}
export function publicUser(user, token) {
  return {
    id: String(user._id),
    name: user.name,
    shopName: user.shopName,
    email: user.email,
    token,
  };
}
