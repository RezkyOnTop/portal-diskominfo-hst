import { NextResponse } from "next/server";
import { createSurvey } from "@/lib/services/survey";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/survei — simpan jawaban Survei Kepuasan Masyarakat (IKM).
 * Data LOKAL (ServiceSurvey). Rate-limited per IP (3/menit) karena form ini
 * jarang dikirim berulang oleh satu orang.
 */
export async function POST(request: Request) {
  const ip = clientIp(request);
  const rl = rateLimit(`survei:${ip}`, 3, 60_000);
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

  const result = await createSurvey(body);
  if (result.ok) {
    return NextResponse.json(
      { ok: true, id: result.id, ikm: result.ikm, mutu: result.mutu },
      { status: 201 },
    );
  }
  const status = result.reason === "INVALID" ? 422 : 503;
  return NextResponse.json({ ok: false, message: result.message }, { status });
}
