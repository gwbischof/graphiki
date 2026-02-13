import { defineConfig } from "drizzle-kit";

try { require("dotenv").config({ path: ".env.local" }); } catch {};

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
