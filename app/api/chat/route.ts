import { NextResponse } from "next/server";
import { z } from "zod";
import {
  CHAT_MAX_HISTORY,
  CHAT_MAX_INPUT,
  bersihkanInputChat,
  tanyaAI,
} from "@/lib/api/ai-chat";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TurnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000),
});

const BodySchema = z.object({
  pesan: z.string().min(1).max(CHAT_MAX_INPUT * 2),
  riwayat: z.array(TurnSchema).max(CHAT_MAX_HISTORY * 2).optional(),
});

/**
 * POST /api/chat — proxy chatbot AI (Gemini).
 *
 * Keamanan (semua di server, key TIDAK pernah ke browser):
 *  - rate limit 10 permintaan / menit / IP;
 *  - sanitasi input (buang HTML/JS) sebelum dikirim ke AI;
 *  - system prompt ketat (hanya topik Diskominfo SP HST, anti prompt injection);
 *  - error upstream diganti pesan generik.
 */
export async function POST(request: Request) {
  const ip = clientIp(request);
  const rl = rateLimit(`chat:${ip}`, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, message: "Terlalu banyak pesan. Coba lagi sebentar lagi." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Body tidak valid." }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Pesan tidak valid." }, { status: 422 });
  }

  const pesan = bersihkanInputChat(parsed.data.pesan);
  if (pesan.length < 2) {
    return NextResponse.json({ ok: false, message: "Pesan terlalu pendek." }, { status: 422 });
  }

  const riwayat = (parsed.data.riwayat ?? []).map((t) => ({
    role: t.role,
    content: bersihkanInputChat(t.content),
  }));

  try {
    const { balasan, ditolak } = await tanyaAI(pesan, riwayat);
    return NextResponse.json({ ok: true, balasan, ditolak }, { status: 200 });
  } catch (err) {
    const belumAktif =
      err instanceof Error && err.message === "AI belum dikonfigurasi.";
    return NextResponse.json(
      {
        ok: false,
        message: belumAktif
          ? "Asisten AI belum diaktifkan. Hubungi admin untuk mengisi GEMINI_API_KEY."
          : "Maaf, asisten sedang sibuk. Coba lagi sebentar lagi.",
      },
      { status: 503 },
    );
  }
}
