import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { defineConfig } from "prisma/config";

const envFile = existsSync(".env.local") ? ".env.local" : ".env";
if (existsSync(envFile)) loadEnvFile(envFile);

const migrationUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  ...(migrationUrl ? { datasource: { url: migrationUrl } } : {}),
});
