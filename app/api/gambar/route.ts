import { NextResponse } from "next/server";
import { z } from "zod";
import { ambilGambarBerita, hostGambarDiizinkan } from "@/lib/api/gambar";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QuerySchema = z.object({
  /** URL gambar asal (harus host Media Center, https). */
  url: z.string().min(10).max(2000),
  /** Lebar keluaran piksel (16–1600). */
  w: z.coerce.number().int().min(16).max(1600).default(800),
});

/**
 * GET /api/gambar?url=<https...>&w=800
 *
 * Proxy gambar berita: mengambil dari host Media Center (TLS mereka tidak
 * lengkap, diperbaiki di server dengan intermediate resmi), mengecilkan via
 * sharp, dan menyimpan cache disk. Hasil: WebP hemat, Cache-Control panjang.
 *
 * Keamanan: hanya host allowlist (cek ganda di sini + service), lebar
 * dibatasi Zod. Rate-limited per IP.
 */
export async function GET(request: Request) {
  const ip = clientIp(request);
  const rl = rateLimit(`gambar:${ip}`, 120, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, message: "Terlalu banyak permintaan." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  const url = new URL(request.url);
  const parsed = QuerySchema.safeParse({
    url: url.searchParams.get("url"),
    w: url.searchParams.get("w") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Parameter tidak valid." },
      { status: 422 },
    );
  }
  const { url: src, w } = parsed.data;

  // Cek ganda: allowlist host di route sebelum menyentuh service.
  if (!hostGambarDiizinkan(src)) {
    return NextResponse.json(
      { ok: false, message: "Parameter tidak valid." },
      { status: 422 },
    );
  }

  try {
    const { isi, mime } = await ambilGambarBerita(src, w);
    return new NextResponse(new Uint8Array(isi), {
      status: 200,
      headers: {
        "Content-Type": mime,
        // Gambar berita jarang berubah -> cache lama di CDN/browser.
        "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Gambar sedang tidak tersedia." },
      { status: 502 },
    );
  }
}
