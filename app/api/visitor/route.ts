import { NextResponse } from "next/server";
import { recordVisit } from "@/lib/services/visitor";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/visitor — catat kunjungan (data lokal: VisitorStat).
 * Rate-limited per IP. Selalu membalas status ramah; analytics tidak boleh
 * memecahkan pengalaman pengguna.
 */
export async function POST(request: Request) {
  const ip = clientIp(request);
  const rl = rateLimit(`visitor:${ip}`, 60, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, message: "Terlalu banyak permintaan." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const result = await recordVisit(body, {
    userAgent: request.headers.get("user-agent"),
  });
  return NextResponse.json({ ok: result.ok }, { status: result.ok ? 202 : 200 });
}
