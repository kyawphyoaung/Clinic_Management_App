import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/prisma/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // Prisma 7 uses the pg driver adapter for pooling. On Vercel, each warm
  // isolate can open its own pool — default max=10 quickly exhausts Supabase
  // session-mode slots (pool_size ≈ 15 → EMAXCONNSESSION). Cap hard for serverless.
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Reuse across Next.js HMR and warm serverless isolates (including production).
globalForPrisma.prisma = prisma;
