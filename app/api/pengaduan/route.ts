import { NextResponse } from "next/server";
import { createPengaduan } from "@/lib/services/pengaduan";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/pengaduan — kirim pengaduan/aspirasi (data lokal: Pengaduan).
 * Rate-limited per IP. Validasi Zod dilakukan di service layer.
 * Membalas kode lacak yang bisa dicek pengadu di /kontak (cek status).
 */
export async function POST(request: Request) {
  const ip = clientIp(request);
  const rl = rateLimit(`pengaduan:${ip}`, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, message: "Terlalu banyak permintaan. Coba lagi nanti." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Body tidak valid." }, { status: 400 });
  }

  const result = await createPengaduan(body);
  if (result.ok) {
    return NextResponse.json({ ok: true, id: result.id, kode: result.kode }, { status: 201 });
  }
  const status = result.reason === "INVALID" ? 422 : 503;
  return NextResponse.json(
    { ok: false, message: result.message, fieldErrors: result.fieldErrors },
    { status },
  );
}
