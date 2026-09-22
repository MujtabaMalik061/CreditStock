import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";
const backendRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
dotenv.config({
  path: path.join(
    backendRoot,
    ".env." + (process.env.NODE_ENV || "development") + ".local",
  ),
});
export const { NODE_ENV, DB_URI, PORT, CLIENT_ORIGIN } = process.env;
