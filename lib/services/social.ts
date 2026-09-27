import "server-only";
import { prisma } from "@/lib/db";

export interface SocialItem {
  platform: string;
  title: string;
  url: string;
  imageUrl: string | null;
  date: string;
}

/**
 * Feed media sosial (data lokal: SocialMediaCache).
 * Cache sementara agar tidak memanggil API media sosial berulang kali.
 * Bila cache kosong, kembalikan array kosong (UI menampilkan fallback).
 */
export async function getSocialFeed(): Promise<SocialItem[]> {
  try {
    const now = new Date();
    const rows = await prisma.socialMediaCache.findMany({
      where: { expiresAt: { gt: now } },
      orderBy: { fetchedAt: "desc" },
      take: 12,
    });
    return rows.flatMap((row) => {
      const payload = row.payload as unknown;
      if (!Array.isArray(payload)) return [];
      return payload
        .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
        .map((item) => ({
          platform: row.platform,
          title: String(item.title ?? ""),
          url: String(item.url ?? "#"),
          imageUrl: item.imageUrl ? String(item.imageUrl) : null,
          date: String(item.date ?? ""),
        }));
    });
  } catch (err) {
    // Feed sosial bersifat pelengkap: jangan memecahkan halaman.
    console.error("[social] gagal membaca cache", err);
    return [];
  }
}

/** Simpan/perbarui cache feed media sosial untuk sebuah platform. */
export async function saveSocialCache(
  platform: string,
  items: SocialItem[],
  ttlSeconds = 900,
): Promise<void> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);
  try {
    await prisma.socialMediaCache.create({
      data: {
        platform,
        payload: items as unknown as object,
        fetchedAt: now,
        expiresAt,
      },
    });
  } catch (err) {
    console.error("[social] gagal menyimpan cache", err);
  }
}
