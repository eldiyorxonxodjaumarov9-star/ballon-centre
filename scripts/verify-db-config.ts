import { isMockMode, getDatabaseConfigError, DatabaseConfigError, prisma } from "../lib/db/prisma";

async function main() {
  const results: Array<[string, boolean]> = [];
  results.push(["isMockMode false when USE_MOCK_DATA=false", isMockMode() === false]);
  results.push(["config error when DATABASE_URL missing", getDatabaseConfigError() !== null]);

  let threw = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    threw = error instanceof DatabaseConfigError;
  }
  results.push(["prisma throws DatabaseConfigError", threw]);

  for (const [name, pass] of results) {
    console.log(`${pass ? "PASS" : "FAIL"} ${name}`);
  }

  if (results.some(([, pass]) => !pass)) {
    process.exit(1);
  }
}

void main();
