import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import EmbeddedPostgres from "embedded-postgres";

const TEST_PORT = 5433;
const TEST_USER = "ballon_test";
const TEST_PASSWORD = "ballon_test";
const TEST_DB = "ballon_centre_test";
const DATA_DIR = path.join(process.cwd(), ".tmp", "pg-test-data");

type Check = { name: string; pass: boolean; detail?: string };

const checks: Check[] = [];

function record(name: string, pass: boolean, detail?: string) {
  checks.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
}

function runConfigGuardSubprocess() {
  const env = {
    ...process.env,
    USE_MOCK_DATA: "false",
    DATABASE_URL: "",
    DOTENV_CONFIG_OVERRIDE: "false",
  };

  const output = execSync("npx tsx scripts/verify-db-config.ts", {
    cwd: process.cwd(),
    env,
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
  });

  for (const line of output.trim().split(/\r?\n/)) {
    if (!line.startsWith("PASS") && !line.startsWith("FAIL")) continue;
    const pass = line.startsWith("PASS");
    const name = line.replace(/^(PASS|FAIL)\s+/, "");
    record(name, pass);
  }
}

async function assertEmptyDatabase(pg: EmbeddedPostgres) {
  const client = pg.getPgClient(TEST_DB);
  await client.connect();
  const result = await client.query(
    `SELECT COUNT(*)::text AS count
     FROM information_schema.tables
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`,
  );
  await client.end();
  const count = Number(result.rows[0]?.count ?? 0);
  record("test database is empty before schema push", count === 0, `tables=${count}`);
  return count === 0;
}

function pushSchema(databaseUrl: string) {
  const env = { ...process.env, DATABASE_URL: databaseUrl, USE_MOCK_DATA: "false" };
  execSync("npx prisma db push --skip-generate", {
    cwd: process.cwd(),
    stdio: "inherit",
    env,
  });
}

async function runCategoryFlowTests() {
  const { resetPrismaClientForTests } = await import("../lib/db/prisma");
  resetPrismaClientForTests();

  const {
    createCategory,
    getCategoryById,
    getCategoryBySlug,
    listAdminCategories,
    listShopCategories,
    updateCategory,
  } = await import("../lib/services/category.service");
  const { adminCreateProduct } = await import("../lib/services/admin.service");
  const { listProducts } = await import("../lib/services/product.service");

  const created = await createCategory({
    nameUz: `PG Test ${Date.now()}`,
    emoji: "🧪",
    description: "PostgreSQL integration test",
  });
  record("create category", Boolean(created.id));

  const byId = await getCategoryById(created.id);
  record("read category by id", byId?.id === created.id);

  const bySlug = await getCategoryBySlug(created.slug);
  record("read category by slug (shop)", bySlug?.id === created.id);

  const adminList = await listAdminCategories();
  record("admin list includes created category", adminList.some((item) => item.id === created.id));

  const product = await adminCreateProduct({
    name: "PG Test Product",
    model: "T-PG-001",
    brandName: "Michelin",
    categoryId: created.id,
    price: 1_500_000,
    stock: 3,
    width: "205",
    profile: "55",
    diameter: "16",
    season: "SUMMER",
    loadIndex: "91",
    speedIndex: "V",
    country: "France",
    warranty: "2 yil",
    isActive: true,
  });
  record("create product linked to category", product.categoryId === created.id);

  const adminWithCount = await listAdminCategories();
  const counted = adminWithCount.find((item) => item.id === created.id);
  record("admin list shows product count", counted?.productCount === 1, `count=${counted?.productCount ?? 0}`);

  const filtered = await listProducts({ category: created.slug });
  record("shop filter by category slug", filtered.some((item) => item.id === product.id));

  const renamed = await updateCategory(created.id, { nameUz: "PG Test Updated" });
  record("edit category name", renamed?.nameUz === "PG Test Updated");

  const deactivated = await updateCategory(created.id, { isActive: false });
  record("deactivate category", deactivated?.isActive === false);

  const shopList = await listShopCategories();
  record("inactive hidden from shop list", !shopList.some((item) => item.id === created.id));

  const adminStillVisible = await listAdminCategories();
  record("inactive still visible in admin list", adminStillVisible.some((item) => item.id === created.id));
}

async function main() {
  console.log("=== PostgreSQL category integration test ===\n");

  console.log("[config guard]");
  runConfigGuardSubprocess();
  console.log("");

  if (fs.existsSync(DATA_DIR)) {
    fs.rmSync(DATA_DIR, { recursive: true, force: true });
  }

  const pg = new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    user: TEST_USER,
    password: TEST_PASSWORD,
    port: TEST_PORT,
    persistent: false,
    initdbFlags: ["--encoding=UTF8"],
    onLog: () => undefined,
    onError: () => undefined,
  });

  let started = false;
  try {
    await pg.initialise();
    await pg.start();
    started = true;
    await pg.createDatabase(TEST_DB);
    record("embedded PostgreSQL started", true, `port=${TEST_PORT}`);

    const databaseUrl = `postgresql://${TEST_USER}:${TEST_PASSWORD}@127.0.0.1:${TEST_PORT}/${TEST_DB}?schema=public`;
    process.env.DATABASE_URL = databaseUrl;
    process.env.USE_MOCK_DATA = "false";

    const empty = await assertEmptyDatabase(pg);
    if (!empty) {
      throw new Error("Test database is not empty; aborting without destructive reset");
    }

    pushSchema(databaseUrl);
    record("prisma db push applied", true);

    const { isMockMode, getDatabaseConfigError } = await import("../lib/db/prisma");
    record("effective mode is PostgreSQL", isMockMode() === false && getDatabaseConfigError() === null);

    await runCategoryFlowTests();
  } finally {
    if (started) {
      await pg.stop();
      record("embedded PostgreSQL stopped", true);
    }
  }

  const failed = checks.filter((item) => !item.pass);
  console.log(`\n=== Summary: ${checks.length - failed.length}/${checks.length} passed ===`);
  if (failed.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
