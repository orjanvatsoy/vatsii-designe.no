import { existsSync } from "node:fs";
import { join } from "node:path";
import { loadEnvFile } from "node:process";
import { spawnSync } from "node:child_process";
import pg from "pg";

const envFile = existsSync(".env.local") ? ".env.local" : ".env";
if (existsSync(envFile)) loadEnvFile(envFile);

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to deploy migrations.");
}

const prismaCli = join(process.cwd(), "node_modules", "prisma", "build", "index.js");

function runPrisma(args) {
  const result = spawnSync(process.execPath, [prismaCli, ...args], {
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const legacyTables = [
  "profiles",
  "carousel_images",
  "products",
  "temperature_data",
];
const client = new pg.Client({ connectionString });

try {
  await client.connect();
  const tableNames = ["_prisma_migrations", ...legacyTables];
  const { rows } = await client.query(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = ANY($1)`,
    [tableNames],
  );
  const existingTables = new Set(rows.map((row) => row.tablename));
  let initialMigrationApplied = false;

  if (existingTables.has("_prisma_migrations")) {
    const migrationResult = await client.query(
      `SELECT 1 FROM "_prisma_migrations" WHERE migration_name = $1 AND finished_at IS NOT NULL AND rolled_back_at IS NULL LIMIT 1`,
      ["20260811000000_init"],
    );
    initialMigrationApplied = migrationResult.rowCount === 1;
  }

  if (!initialMigrationApplied) {
    const existingLegacyTables = legacyTables.filter((table) =>
      existingTables.has(table),
    );

    if (existingLegacyTables.length === legacyTables.length) {
      console.log("Baselining existing database schema...");
      runPrisma([
        "migrate",
        "resolve",
        "--applied",
        "20260811000000_init",
      ]);
    } else if (existingLegacyTables.length > 0) {
      throw new Error(
        `Database is only partially initialized. Found: ${existingLegacyTables.join(", ")}`,
      );
    }
  }
} finally {
  await client.end();
}

runPrisma(["migrate", "deploy"]);