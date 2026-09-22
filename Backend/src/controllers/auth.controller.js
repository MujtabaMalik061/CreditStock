import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import Session from "../models/session.model.js";
import { signUpSchema, signInSchema } from "../schemas/auth.schema.js";
import {
  cookieName,
  cookieOptions,
  hashToken,
  createSession,
  publicUser,
} from "../utils/session.js";
// An absent account still performs a password comparison to avoid a fast-path timing leak.
const dummyHash = bcrypt.hashSync("unused-password-for-timing-only", 12);
export async function signUp(req, res) {
  const parsed = signUpSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ message: parsed.error.issues[0].message });
  const { name, shopName, email, password } = parsed.data;
  if (await User.exists({ email }))
    return res.status(409).json({
      message: "An account with this email already exists. Please sign in.",
    });
  const user = await User.create({
    name,
    shopName,
    email,
    passwordHash: await bcrypt.hash(password, 12),
  });
  const token = await createSession(user, req, res);
  res.status(201).json({ user: publicUser(user, token) });
}
export async function signIn(req, res) {
  const parsed = signInSchema.safeParse(req.body);
  if (!parsed.success)
    return res
      .status(400)
      .json({ message: "Enter a valid email and password." });
  const user = await User.findOne({ email: parsed.data.email }).select(
    "+passwordHash",
  );
  const valid = await bcrypt.compare(
    parsed.data.password,
    user?.passwordHash || dummyHash,
  );
  if (!user || !valid)
    return res.status(401).json({ message: "Email or password is incorrect." });
  const token = await createSession(user, req, res);
  res.json({ user: publicUser(user, token) });
}
export async function signOut(req, res) {
  const token = req.cookies[cookieName];
  if (token) await Session.deleteOne({ tokenHash: hashToken(token) });
  res.clearCookie(cookieName, cookieOptions);
  res.json({ message: "Signed out successfully." });
}
export function me(req, res) {
  res.json({ user: publicUser(req.user, req.cookies[cookieName]) });
}
