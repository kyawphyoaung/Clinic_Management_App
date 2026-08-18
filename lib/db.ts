import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/prisma/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Runtime DATABASE_URL uses Supabase transaction pooler (:6543). A single
// Next.js process routinely runs parallel queries (count + findMany + agents).
// max:1 caused "timeout exceeded when trying to connect" under concurrent RSC
// renders. Keep a small cap so serverless isolates don't open huge pools.
const POOL_MAX = process.env.NODE_ENV === "production" ? 3 : 5;

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max: POOL_MAX,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Reuse across Next.js HMR and warm serverless isolates (including production).
globalForPrisma.prisma = prisma;
