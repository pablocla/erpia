import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// In development, cap the connection pool to avoid exhausting Supabase limits
// after multiple `next dev` restarts leave stale connections open.
const prismaClientOptions =
  process.env.NODE_ENV !== "production"
    ? {
        datasourceUrl: process.env.DATABASE_URL
          ? `${process.env.DATABASE_URL}${process.env.DATABASE_URL.includes("?") ? "&" : "?"}connection_limit=10&pool_timeout=15`
          : undefined,
      }
    : undefined

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient(prismaClientOptions)

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export default prisma
