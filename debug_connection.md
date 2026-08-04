I am facing a database connection pool error on Vercel with Supabase + Prisma + Next.js 16.

Error: (EMAXCONNSESSION) max clients reached in session mode - max clients are limited to pool_size: 15

I need to implement a permanent fix following best practices. Please implement the following solutions step by step:

---

## Fix 1: Implement Prisma Client Singleton Pattern

**Create or update `lib/db.ts`** to ensure only ONE instance of PrismaClient is used across all requests:

```typescript
import { PrismaClient } from "@/prisma/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

**Important:** Remove `prisma.$disconnect()` from anywhere in the codebase. In Serverless environments, you should NOT disconnect after each request.

---

## Fix 2: Update Prisma Schema (If Needed)

**Ensure `prisma/schema.prisma` uses the correct datasource configuration:**

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

---

## Verification Steps After Implementation

1. After implementing these changes, run:
```bash
npm run build
```

2. Deploy to Vercel with the updated `.env` variables (DATABASE_URL and DIRECT_URL).

3. Monitor for connection pool errors.

---

## Additional Note (Optional)

If the problem persists after implementing the above fixes, consider adding Prisma Accelerate:

```bash
npm install @prisma/accelerate
```

But let's try the Connection Pool + Singleton fixes first.

---

Please implement all the above and verify the code is correct.