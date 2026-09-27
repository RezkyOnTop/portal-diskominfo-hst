import "server-only";
import { prisma } from "@/lib/db";
import {
  SubscriberInputSchema,
  type SubscriberInput,
} from "@/lib/validations/local.schema";

export type SubscriberResult =
  | { ok: true; id: string }
  | { ok: false; reason: "INVALID" | "DUPLICATE" | "UNAVAILABLE"; message: string };

/**
 * Simpan subscriber radio ke database LOKAL (RadioSubscriber).
 * Data ini spesifik portal baru — bukan bagian dari Media Center HST.
 */
export async function createSubscriber(input: unknown): Promise<SubscriberResult> {
  const parsed = SubscriberInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, reason: "INVALID", message: "Data yang dikirim tidak valid." };
  }
  const data: SubscriberInput = parsed.data;
  try {
    const created = await prisma.radioSubscriber.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone && data.phone.trim() ? data.phone : null,
      },
      select: { id: true },
    });
    return { ok: true, id: created.id };
  } catch (err) {
    // P2002 = unique constraint (email sudah terdaftar).
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: string }).code === "P2002"
    ) {
      return {
        ok: false,
        reason: "DUPLICATE",
        message: "Email ini sudah terdaftar sebagai subscriber.",
      };
    }
    console.error("[subscriber] gagal menyimpan", err);
    return {
      ok: false,
      reason: "UNAVAILABLE",
      message: "Layanan sedang tidak tersedia. Coba lagi nanti.",
    };
  }
}

export async function listSubscribers() {
  return prisma.radioSubscriber.findMany({
    orderBy: { subscribedAt: "desc" },
    take: 200,
  });
}

export async function countSubscribers() {
  return prisma.radioSubscriber.count();
}
