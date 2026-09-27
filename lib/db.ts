import { PrismaClient } from "@prisma/client";

// Singleton Prisma Client untuk data LOKAL saja (VisitorStat, RadioSubscriber,
// SocialMediaCache). Data berita/pengumuman/hoaks TIDAK ada di sini — sumbernya
// API Media Center HST (lihat lib/api/media-center.ts).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
