import { PrismaClient } from "@prisma/client";

// singleton: กัน connection ล้นตอน hot reload ของ Next.js
const g = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = prisma;

export * from "@prisma/client";
