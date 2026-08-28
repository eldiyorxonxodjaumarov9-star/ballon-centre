import { execSync, spawn, type ChildProcess } from "node:child_process";
import net from "node:net";
import fs from "node:fs";
import EmbeddedPostgres from "embedded-postgres";
import {
  PG_TEST_DATA_DIR,
  PG_TEST_DB,
  PG_TEST_DEV_PORT,
  PG_TEST_PASSWORD,
  PG_TEST_PORT,
  PG_TEST_USER,
  buildPgTestDatabaseUrl,
} from "./pg-test-config";

const databaseUrl = buildPgTestDatabaseUrl();

let postgres: EmbeddedPostgres | null = null;
let devServer: ChildProcess | null = null;
let shuttingDown = false;

function log(message: string) {
  console.log(`[pg-test] ${message}`);
}

async function assertPortAvailable(port: number) {
  await new Promise<void>((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => {
      server.close(() => resolve());
    });
  });
}

async function ensurePostgres(): Promise<EmbeddedPostgres> {
  if (fs.existsSync(PG_TEST_DATA_DIR)) {
    fs.rmSync(PG_TEST_DATA_DIR, { recursive: true, force: true });
  }

  const pg = new EmbeddedPostgres({
    databaseDir: PG_TEST_DATA_DIR,
    user: PG_TEST_USER,
    password: PG_TEST_PASSWORD,
    port: PG_TEST_PORT,
    persistent: false,
    initdbFlags: ["--encoding=UTF8"],
    onLog: () => undefined,
    onError: () => undefined,
  });

  await pg.initialise();
  await pg.start();
  await pg.createDatabase(PG_TEST_DB);
  postgres = pg;
  log(`PostgreSQL test server listening on port ${PG_TEST_PORT}`);
  return pg;
}

function pushSchema() {
  execSync("npx prisma db push --skip-generate", {
    cwd: process.cwd(),
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      USE_MOCK_DATA: "false",
    },
  });
  log("Prisma schema applied to test database");
}

async function verifyDatabaseConnection() {
  const { resetPrismaClientForTests, isMockMode, prisma } = await import("../lib/db/prisma");
  process.env.DATABASE_URL = databaseUrl;
  process.env.USE_MOCK_DATA = "false";
  resetPrismaClientForTests();

  if (isMockMode()) {
    throw new Error("Expected PostgreSQL mode, but mock mode is active");
  }

  const rows = await prisma.$queryRaw<Array<{ database: string; port: number | null }>>`
    SELECT current_database() AS database, inet_server_port() AS port
  `;
  const info = rows[0];
  if (info?.database !== PG_TEST_DB || info?.port !== PG_TEST_PORT) {
    throw new Error("Database connection does not point to the local test PostgreSQL instance");
  }

  const categoryCount = await prisma.category.count();
  log(`Verified test PostgreSQL (${info.database} @ port ${info.port}), categories=${categoryCount}`);
  resetPrismaClientForTests();
}

function startDevServer(): ChildProcess {
  const child = spawn(
    `npx next dev --turbopack -p ${PG_TEST_DEV_PORT}`,
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        USE_MOCK_DATA: "false",
        DATABASE_URL: databaseUrl,
      },
      stdio: "inherit",
      shell: true,
    },
  );

  child.on("exit", (code) => {
    if (!shuttingDown) {
      log(`Next.js dev server exited with code ${code ?? "unknown"}`);
      void shutdown(code ?? 1);
    }
  });

  return child;
}

async function waitForDevServer(timeoutMs = 90_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(`http://127.0.0.1:${PG_TEST_DEV_PORT}/api/categories`);
      if (response.ok) {
        return;
      }
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Dev server did not become ready on port ${PG_TEST_DEV_PORT}`);
}

async function verifyAppUsesTestDatabase() {
  const response = await fetch(`http://127.0.0.1:${PG_TEST_DEV_PORT}/api/categories`);
  if (!response.ok) {
    throw new Error(`Categories API returned ${response.status}`);
  }

  const { resetPrismaClientForTests, prisma } = await import("../lib/db/prisma");
  process.env.DATABASE_URL = databaseUrl;
  process.env.USE_MOCK_DATA = "false";
  resetPrismaClientForTests();
  const dbCount = await prisma.category.count();
  resetPrismaClientForTests();

  const payload = (await response.json()) as { categories?: unknown[] };
  const apiCount = payload.categories?.length ?? 0;
  if (apiCount !== dbCount) {
    throw new Error("API category count does not match the test PostgreSQL database");
  }

  log(`Verified app API reads from test PostgreSQL (categories=${apiCount})`);
}

function printInstructions() {
  console.log("\n=== Browser test environment ready ===\n");
  console.log(`Shop:      http://127.0.0.1:${PG_TEST_DEV_PORT}/`);
  console.log(`Catalog:   http://127.0.0.1:${PG_TEST_DEV_PORT}/catalog`);
  console.log(`Admin:     http://127.0.0.1:${PG_TEST_DEV_PORT}/admin`);
  console.log(`Login:     http://127.0.0.1:${PG_TEST_DEV_PORT}/admin/login`);
  console.log(`Categories:http://127.0.0.1:${PG_TEST_DEV_PORT}/admin/categories`);
  console.log("\nMode: USE_MOCK_DATA=false");
  console.log(`Database: local test PostgreSQL on port ${PG_TEST_PORT}`);
  console.log("\nAdmin login:");
  console.log("- Use ADMIN_PHONE and ADMIN_PASSWORD from your local .env");
  console.log("- Do not share these credentials outside your machine");
  console.log("\nSuggested manual flow:");
  console.log("1. Admin > Categories: create a category");
  console.log("2. Refresh the page and confirm it persists");
  console.log("3. Admin > Products: create/link a product to that category");
  console.log("4. Shop/Catalog: filter by the category");
  console.log("5. Admin > Categories: edit name and deactivate");
  console.log("\nStop everything:");
  console.log("- Press Ctrl+C in this terminal");
  console.log(`- If needed manually: stop Node on port ${PG_TEST_DEV_PORT} and PostgreSQL on port ${PG_TEST_PORT}`);
  console.log("");
}

async function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  log("Shutting down...");

  if (devServer && !devServer.killed) {
    devServer.kill("SIGTERM");
  }

  if (postgres) {
    try {
      await postgres.stop();
      log("PostgreSQL test server stopped");
    } catch (error) {
      console.error(error);
    }
  }

  process.exit(code);
}

async function main() {
  log("Starting embedded PostgreSQL for browser testing");
  await assertPortAvailable(PG_TEST_DEV_PORT);
  await ensurePostgres();
  pushSchema();
  await verifyDatabaseConnection();

  log(`Starting Next.js dev server on port ${PG_TEST_DEV_PORT}`);
  devServer = startDevServer();
  await waitForDevServer();
  await verifyAppUsesTestDatabase();
  printInstructions();

  process.on("SIGINT", () => void shutdown(0));
  process.on("SIGTERM", () => void shutdown(0));
}

main().catch(async (error) => {
  console.error(error);
  await shutdown(1);
});
