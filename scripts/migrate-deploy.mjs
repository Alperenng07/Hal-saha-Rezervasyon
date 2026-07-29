import { config } from "dotenv";
import { execSync } from "node:child_process";

config({ path: ".env.local" });
config();

if (process.env.DIRECT_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}

execSync("npx prisma migrate deploy", { stdio: "inherit", env: process.env });
