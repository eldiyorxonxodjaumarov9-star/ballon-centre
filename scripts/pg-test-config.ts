import path from "node:path";

export const PG_TEST_PORT = 5433;
export const PG_TEST_USER = "ballon_test";
export const PG_TEST_PASSWORD = "ballon_test";
export const PG_TEST_DB = "ballon_centre_test";
export const PG_TEST_DATA_DIR = path.join(process.cwd(), ".tmp", "pg-test-data");
export const PG_TEST_DEV_PORT = 3020;

export function buildPgTestDatabaseUrl(host = "127.0.0.1"): string {
  return `postgresql://${PG_TEST_USER}:${PG_TEST_PASSWORD}@${host}:${PG_TEST_PORT}/${PG_TEST_DB}?schema=public`;
}
