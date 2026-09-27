/**
 * Adapter feed YouTube (RSS, TANPA API key).
 *
 * Ini SATU-SATUNYA berkas yang boleh memanggil `youtube.com/feeds`.
 * Sumber: `https://www.youtube.com/feeds/videos.xml?channel_id=<ID>`
 * (kanal Media Center HST: UCXVJroYPW6e1GhWz501XZ3g).
 *
 * Hasilnya disimpan ke cache lokal (SocialMediaCache) oleh service layer —
 * RSS YouTube tidak punya parameter `limit`, jadi kami batasi sendiri.
 */

import { z } from "zod";

/** ID kanal Media Center HST (diverifikasi dari halaman kanal). */
export const YOUTUBE_CHANNEL_ID = "UCXVJroYPW6e1GhWz501XZ3g";

const REVALIDATE_DETIK = 1800; // 30 menit

export class YoutubeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "YoutubeError";
  }
}

/** Satu video dari feed. */
export interface YoutubeVideo {
  videoId: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  publishedAt: string;
}

/** Skema hasil parse yang sudah dinormalisasi (bukan skema XML mentah). */
const YoutubeVideoSchema = z.object({
  videoId: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url(),
  thumbnailUrl: z.string().url(),
  publishedAt: z.string().min(1),
});

const YoutubeFeedSchema = z.object({
  data: z.array(YoutubeVideoSchema),
});

export function youtubeFeedUrl(channelId = YOUTUBE_CHANNEL_ID): string {
  return `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;
}

/** Buang CDATA & decode entitas XML yang umum. */
function bersihkanTeks(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

/**
 * Parse XML feed YouTube tanpa dependensi eksternal.
 * Struktur feed stabil: satu blok `<entry>` per video, dengan `<yt:videoId>`,
 * `<title>`, `<published>`, dan `<media:thumbnail url="...">`.
 */
export function parseYoutubeFeed(xml: string): YoutubeVideo[] {
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];
  const hasil: YoutubeVideo[] = [];

  for (const entry of entries) {
    const videoId = entry.match(/<yt:videoId>([\s\S]*?)<\/yt:videoId>/)?.[1];
    const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1];
    const published = entry.match(/<published>([\s\S]*?)<\/published>/)?.[1];
    const thumb = entry.match(/<media:thumbnail[^>]*url="([^"]+)"/)?.[1];
    if (!videoId) continue;

    const kandidat = {
      videoId: bersihkanTeks(videoId),
      title: bersihkanTeks(title ?? ""),
      url: `https://www.youtube.com/watch?v=${bersihkanTeks(videoId)}`,
      thumbnailUrl: thumb
        ? bersihkanTeks(thumb)
        : `https://i.ytimg.com/vi/${bersihkanTeks(videoId)}/hqdefault.jpg`,
      publishedAt: bersihkanTeks(published ?? ""),
    };

    const parsed = YoutubeVideoSchema.safeParse(kandidat);
    if (parsed.success) hasil.push(parsed.data);
  }

  return hasil;
}

/** Cache proses sederhana + stale-while-error (pola sama dengan adapter lain). */
let cache: { data: YoutubeVideo[]; at: number } | null = null;
let cacheGagalTerakhir: YoutubeVideo[] | null = null;

/** Ambil video terbaru dari kanal YouTube. Melempar `YoutubeError` bila gagal total. */
export async function getYoutubeVideos(limit = 12): Promise<YoutubeVideo[]> {
  const sekarang = Date.now();
  if (cache && sekarang - cache.at < REVALIDATE_DETIK * 1000) {
    return cache.data.slice(0, limit);
  }

  try {
    const res = await fetch(youtubeFeedUrl(), {
      next: { revalidate: REVALIDATE_DETIK },
      headers: { Accept: "application/xml, text/xml, */*" },
    });
    if (!res.ok) throw new YoutubeError(`YouTube membalas HTTP ${res.status}`);

    const xml = await res.text();
    const data = parseYoutubeFeed(xml);
    const divalidasi = YoutubeFeedSchema.safeParse({ data });
    if (!divalidasi.success) throw new YoutubeError("Struktur feed YouTube tidak dikenal");

    cache = { data: divalidasi.data.data, at: sekarang };
    cacheGagalTerakhir = divalidasi.data.data;
    return divalidasi.data.data.slice(0, limit);
  } catch (err) {
    // Stale-while-error: pakai data terakhir yang pernah berhasil.
    if (cacheGagalTerakhir) {
      console.warn("[youtube] gagal menyegarkan feed, memakai data lama", err);
      return cacheGagalTerakhir.slice(0, limit);
    }
    console.error("[youtube] gagal mengambil feed", err);
    throw err instanceof YoutubeError ? err : new YoutubeError("Gagal mengambil feed YouTube");
  }
}

/** Bersihkan cache proses (untuk pengujian). */
export function __clearYoutubeCache(): void {
  cache = null;
  cacheGagalTerakhir = null;
}
