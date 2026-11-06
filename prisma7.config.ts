import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ path: ".env.local" });
config();

export default defineConfig({
  schema: "prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Not needed for `prisma generate`; migrate and studio require it to be set.
    url: process.env.DATABASE_URL ?? "",
  },
});
