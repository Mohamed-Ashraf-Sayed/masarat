import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Lazy initialization - creates client only when first accessed
function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
}

// Use getter for lazy initialization
export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

// Cache instance to prevent connection pool exhaustion
globalForPrisma.prisma = prisma;

export default prisma;
