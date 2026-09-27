/**
 * Adapter Media Center Video (YouTube "Media Center HST").
 *
 * Sumber: RSS feed resmi YouTube (tanpa API key, tanpa kuota):
 *   https://www.youtube.com/feeds/videos.xml?channel_id=<CHANNEL_ID>
 *
 * Aturan arsitektur (sama seperti lib/api/media-center.ts):
 * - Ini SATU-SATUNYA tempat yang boleh menyentuh host YouTube.
 * - Setiap respons divalidasi Zod; panggilan dibungkus try-catch.
 * - Error upstream TIDAK pernah bocor ke UI — kembalikan array kosong + log.
 * - Ada cache in-memory agar tidak memanggil ulang tiap request.
 *
 * Channel ID dapat di-override lewat env YOUTUBE_CHANNEL_ID.
 */

import { z } from "zod";

/** Channel resmi "Media Center HST" (dikonfirmasi dari halaman kanal). */
const DEFAULT_CHANNEL_ID = "UCXVJroYPW6e1GhWz501XZ3g";

/** TTL cache (detik) — video baru muncul relatif jarang. */
const REVALIDATE_SECONDS = 1800;

export interface Video {
  id: string;
  title: string;
  /** ISO 8601 */
  publishedAt: string;
  thumbnail: string;
  /** URL tonton di YouTube. */
  watchUrl: string;
  /** URL embed (iframe). */
  embedUrl: string;
  views: number | null;
  description: string;
}

export class MediaCenterVideoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MediaCenterVideoError";
  }
}

function channelId(): string {
  const id = process.env.YOUTUBE_CHANNEL_ID?.trim();
  return id && /^[A-Za-z0-9_-]{10,}$/.test(id) ? id : DEFAULT_CHANNEL_ID;
}

export function feedUrl(): string {
  return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId()}`;
}

export function embedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}

export function watchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/** Thumbnail resolusi tinggi (selalu tersedia untuk video publik). */
export function thumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

// --- Validasi Zod atas entri feed ---
const EntrySchema = z.object({
  id: z.string().regex(/^yt:video:[A-Za-z0-9_-]+$/),
  title: z.string().min(1),
  published: z.string(),
  views: z.number().nullable().optional(),
  description: z.string().optional().default(""),
});

// --- Cache in-memory (stale-while-error) ---
interface CacheEntry {
  data: Video[];
  expiresAt: number;
}
const cache = new Map<string, CacheEntry>();

/** Parser XML sederhana khusus feed YouTube (tanpa dependensi). */
export function parseFeed(xml: string): Video[] {
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];
  const videos: Video[] = [];

  for (const raw of entries) {
    const id = pick(raw, /<yt:videoId>([^<]+)<\/yt:videoId>/);
    const title = pick(raw, /<title>([\s\S]*?)<\/title>/);
    const published = pick(raw, /<published>([^<]+)<\/published>/);
    const viewsRaw = pick(raw, /views="(\d+)"/);
    const description = pick(raw, /<media:description>([\s\S]*?)<\/media:description>/);

    if (!id || !title || !published) continue;

    const parsed = EntrySchema.safeParse({
      id: `yt:video:${id}`,
      title: decodeEntities(title).trim(),
      published,
      views: viewsRaw ? Number(viewsRaw) : null,
      description: decodeEntities(description ?? "").trim(),
    });
    if (!parsed.success) continue;

    videos.push({
      id,
      title: parsed.data.title,
      publishedAt: toIso(parsed.data.published),
      thumbnail: thumbnailUrl(id),
      watchUrl: watchUrl(id),
      embedUrl: embedUrl(id),
      views: parsed.data.views ?? null,
      description: parsed.data.description,
    });
  }

  return videos.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}

function pick(s: string, re: RegExp): string | null {
  const m = s.match(re);
  return m ? m[1] : null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

function toIso(published: string): string {
  const d = new Date(published);
  return Number.isNaN(d.getTime()) ? published : d.toISOString();
}

/** Ambil daftar video (cached). Gagal → [] + log; tidak pernah melempar. */
export async function getVideo(limit = 12): Promise<Video[]> {
  const key = "videos";
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && now < cached.expiresAt) {
    return cached.data.slice(0, limit);
  }

  try {
    const res = await fetch(feedUrl(), {
      headers: { "user-agent": "DiskominfoSPHST/1.0 (+https://diskominfosp.hstkab.go.id)" },
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) {
      throw new MediaCenterVideoError(`feed YouTube membalas ${res.status}`);
    }
    const xml = await res.text();
    const data = parseFeed(xml);
    if (data.length === 0) {
      throw new MediaCenterVideoError("feed YouTube kosong atau format berubah");
    }
    cache.set(key, { data, expiresAt: now + REVALIDATE_SECONDS * 1000 });
    return data.slice(0, limit);
  } catch (err) {
    console.error("[media-center-video] gagal memuat feed:", err);
    // Stale-while-error: pakai cache lama walau kedaluwarsa.
    if (cached) return cached.data.slice(0, limit);
    return [];
  }
}

/** Kosongkan cache (dipakai pengujian). */
export function __clearVideoCache(): void {
  cache.clear();
}
