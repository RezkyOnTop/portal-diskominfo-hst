import "server-only";
import { prisma } from "@/lib/db";
import { getYoutubeVideos, YOUTUBE_CHANNEL_ID } from "@/lib/api/youtube";

export interface SocialItem {
  platform: string;
  title: string;
  url: string;
  imageUrl: string | null;
  date: string;
}

/** Platform feed yang didukung. */
export const PLATFORM_YOUTUBE = "YouTube";

const TTL_DETIK = 1800; // 30 menit

/**
 * Feed media sosial resmi (data lokal: SocialMediaCache).
 *
 * Alur: baca cache → bila kosong/kedaluwarsa, ambil dari adapter YouTube RSS
 * dan simpan ke cache. Cache mencegah pemanggilan YouTube berulang.
 * Kegagalan tidak pernah melempar — UI menampilkan fallback.
 */
export async function getSocialFeed(): Promise<SocialItem[]> {
  const dariCache = await bacaCache();
  if (dariCache.length > 0) return dariCache;

  const baru = await segarkanDariYoutube();
  return baru;
}

/** Baca entri cache yang belum kedaluwarsa. */
async function bacaCache(): Promise<SocialItem[]> {
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
        }))
        .filter((item) => item.title && item.url);
    });
  } catch (err) {
    // Feed sosial bersifat pelengkap: jangan memecahkan halaman.
    console.error("[social] gagal membaca cache", err);
    return [];
  }
}

/**
 * Ambil video terbaru dari YouTube dan simpan ke cache lokal.
 * Mengembalikan item siap tampil; array kosong bila upstream gagal.
 */
export async function segarkanDariYoutube(limit = 9): Promise<SocialItem[]> {
  try {
    const videos = await getYoutubeVideos(limit);
    if (videos.length === 0) return [];

    const items: SocialItem[] = videos.map((v) => ({
      platform: PLATFORM_YOUTUBE,
      title: v.title,
      url: v.url,
      imageUrl: v.thumbnailUrl,
      date: v.publishedAt,
    }));

    await simpanCache(PLATFORM_YOUTUBE, items);
    return items;
  } catch (err) {
    console.error("[social] gagal menyegarkan dari YouTube", err);
    return [];
  }
}

/** Simpan/perbarui cache feed untuk sebuah platform. */
export async function simpanCache(
  platform: string,
  items: SocialItem[],
  ttlSeconds = TTL_DETIK,
): Promise<void> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);
  try {
    // Buang entri lama platform yang sama agar tabel tidak menumpuk.
    await prisma.socialMediaCache.deleteMany({ where: { platform } });
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

/** ID kanal YouTube yang dipakai feed (untuk ditampilkan/diuji). */
export { YOUTUBE_CHANNEL_ID };

/** Kompatibilitas: nama lama yang dipakai pengujian. */
export const saveSocialCache = simpanCache;
