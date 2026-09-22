import { z } from "zod";
const email = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address.")
  .max(254);
const password = z
  .string()
  .min(8, "Use at least 8 characters.")
  .refine(
    (value) => Buffer.byteLength(value, "utf8") <= 72,
    "Password must be at most 72 bytes.",
  );
export const signUpSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(80),
  shopName: z.string().trim().min(1, "Enter your shop name.").max(100),
  email,
  password,
});
export const signInSchema = z.object({
  email,
  password: z
    .string()
    .min(1)
    .max(72)
    .refine((value) => Buffer.byteLength(value, "utf8") <= 72),
});
