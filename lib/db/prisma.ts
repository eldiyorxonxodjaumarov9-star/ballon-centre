import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export class DatabaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseConfigError";
  }
}

export function isMockMode(): boolean {
  return process.env.USE_MOCK_DATA === "true";
}

export function getDatabaseConfigError(): string | null {
  if (isMockMode()) return null;
  if (!process.env.DATABASE_URL?.trim()) {
    return "DATABASE_URL sozlanmagan. PostgreSQL rejimi uchun DATABASE_URL kiriting yoki lokal/test mock rejimi uchun USE_MOCK_DATA=true qo‘ying.";
  }
  return null;
}

function createPrismaClient(): PrismaClient {
  const configError = getDatabaseConfigError();
  if (configError) {
    throw new DatabaseConfigError(configError);
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export function resetPrismaClientForTests(): void {
  if (globalForPrisma.prisma) {
    void globalForPrisma.prisma.$disconnect();
    globalForPrisma.prisma = undefined;
  }
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const configError = getDatabaseConfigError();
    if (configError) {
      throw new DatabaseConfigError(configError);
    }

    const client = getPrismaClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export function databaseConfigResponse(): Response | null {
  const message = getDatabaseConfigError();
  if (!message) return null;
  return Response.json({ error: message }, { status: 503 });
}
