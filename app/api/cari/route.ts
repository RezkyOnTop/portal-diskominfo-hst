import { NextResponse } from "next/server";
import { z } from "zod";
import { cariGlobal } from "@/lib/services/search";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QuerySchema = z.object({
  q: z.string().trim().min(2, "Kata kunci minimal 2 karakter").max(100),
  jenis: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(",").filter(Boolean) : undefined)),
  kategori: z.string().trim().max(100).optional(),
  dari: z.string().trim().optional(),
  sampai: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

/**
 * GET /api/cari?q=...&jenis=berita,pengumuman,halaman&kategori=...&dari=...&sampai=...
 * Pencarian global. Rate-limited per IP; error upstream tidak pernah bocor.
 */
export async function GET(request: Request) {
  const ip = clientIp(request);
  const rl = rateLimit(`cari:${ip}`, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, message: "Terlalu banyak permintaan pencarian. Coba lagi nanti." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  const url = new URL(request.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: parsed.error.issues[0]?.message ?? "Parameter tidak valid." },
      { status: 422 },
    );
  }

  try {
    const result = await cariGlobal({
      q: parsed.data.q,
      jenis: parsed.data.jenis as ("berita" | "pengumuman" | "halaman")[] | undefined,
      kategori: parsed.data.kategori,
      dari: parsed.data.dari,
      sampai: parsed.data.sampai,
      limit: parsed.data.limit,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[api/cari] gagal:", err);
    return NextResponse.json(
      { ok: false, message: "Pencarian sedang tidak tersedia. Coba lagi sebentar." },
      { status: 502 },
    );
  }
}
