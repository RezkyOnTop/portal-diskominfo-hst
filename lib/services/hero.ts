import "server-only";
import { prisma } from "@/lib/db";
import {
  CreateHeroSlideInputSchema,
  DeleteHeroSlideInputSchema,
  UpdateHeroSlideInputSchema,
} from "@/lib/validations/local.schema";
import { hapusSemuaFotoHero } from "@/lib/storage/foto-hero";

export interface HeroSlideRingkas {
  id: string;
  label: string;
  fotoUrl: string | null;
  urutan: number;
  aktif: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type HeroSlideResult =
  | { ok: true; id: string }
  | {
      ok: false;
      reason: "INVALID" | "NOT_FOUND" | "UNAVAILABLE";
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

function petikFieldErrors(issues: { path: PropertyKey[]; message: string }[]): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "_");
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return fieldErrors;
}

/** Daftar slide untuk halaman publik: hanya yang aktif, urut tampil lalu waktu. */
export async function listHeroSlidePublik(): Promise<HeroSlideRingkas[]> {
  return prisma.heroSlide.findMany({
    where: { aktif: true },
    orderBy: [{ urutan: "asc" }, { createdAt: "asc" }],
    take: 30,
  });
}

/** Daftar slide untuk dashboard admin: semuanya (aktif + nonaktif). */
export async function listHeroSlideAdmin(): Promise<HeroSlideRingkas[]> {
  return prisma.heroSlide.findMany({
    orderBy: [{ urutan: "asc" }, { createdAt: "asc" }],
    take: 100,
  });
}

/** Ambil satu slide berdasarkan id. */
export async function getHeroSlideById(id: string): Promise<HeroSlideRingkas | null> {
  const bersih = id.trim();
  if (!bersih) return null;
  return prisma.heroSlide.findUnique({ where: { id: bersih } });
}

/** Hitung slide (kartu ringkasan admin). */
export async function countHeroSlide(): Promise<{ total: number; aktif: number }> {
  const [total, aktif] = await Promise.all([
    prisma.heroSlide.count(),
    prisma.heroSlide.count({ where: { aktif: true } }),
  ]);
  return { total, aktif };
}

/** Tambah slide baru (aksi admin). */
export async function createHeroSlide(input: unknown): Promise<HeroSlideResult> {
  const parsed = CreateHeroSlideInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      reason: "INVALID",
      message: "Data slide tidak valid.",
      fieldErrors: petikFieldErrors(parsed.error.issues),
    };
  }
  const d = parsed.data;
  try {
    const created = await prisma.heroSlide.create({
      data: { label: d.label.trim(), urutan: d.urutan },
      select: { id: true },
    });
    return { ok: true, id: created.id };
  } catch (err) {
    console.error("[hero] gagal menambah slide", err);
    return { ok: false, reason: "UNAVAILABLE", message: "Layanan sedang tidak tersedia. Coba lagi nanti." };
  }
}

/** Ubah data slide (aksi admin). */
export async function updateHeroSlide(input: unknown): Promise<HeroSlideResult> {
  const parsed = UpdateHeroSlideInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      reason: "INVALID",
      message: "Data slide tidak valid.",
      fieldErrors: petikFieldErrors(parsed.error.issues),
    };
  }
  const { id, label, urutan, aktif } = parsed.data;
  try {
    await prisma.heroSlide.update({
      where: { id },
      data: { label: label.trim(), urutan, aktif },
    });
    return { ok: true, id };
  } catch (err) {
    const code =
      typeof err === "object" && err !== null && "code" in err
        ? (err as { code?: string }).code
        : undefined;
    if (code === "P2025") {
      return { ok: false, reason: "NOT_FOUND", message: "Slide tidak ditemukan." };
    }
    console.error("[hero] gagal mengubah slide", err);
    return { ok: false, reason: "UNAVAILABLE", message: "Layanan sedang tidak tersedia." };
  }
}

/** Hapus slide beserta berkas fotonya (aksi admin). */
export async function deleteHeroSlide(input: unknown): Promise<HeroSlideResult> {
  const parsed = DeleteHeroSlideInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      reason: "INVALID",
      message: "Data penghapusan tidak valid.",
      fieldErrors: petikFieldErrors(parsed.error.issues),
    };
  }
  try {
    await prisma.heroSlide.delete({ where: { id: parsed.data.id } });
    await hapusSemuaFotoHero(parsed.data.id);
    return { ok: true, id: parsed.data.id };
  } catch (err) {
    const code =
      typeof err === "object" && err !== null && "code" in err
        ? (err as { code?: string }).code
        : undefined;
    if (code === "P2025") {
      return { ok: false, reason: "NOT_FOUND", message: "Slide tidak ditemukan." };
    }
    console.error("[hero] gagal menghapus slide", err);
    return { ok: false, reason: "UNAVAILABLE", message: "Layanan sedang tidak tersedia." };
  }
}

/**
 * Catat URL foto setelah unggahan berhasil (dipanggil dari route handler foto).
 * URL kosong berarti "tanpa foto" -> disimpan sebagai null (dilewati di
 * slideshow). Bila id tidak ada, berkas yang baru ditulis dibuang agar tidak
 * yatim.
 */
export async function setFotoHeroSlide(id: string, url: string): Promise<boolean> {
  try {
    await prisma.heroSlide.update({
      where: { id },
      data: { fotoUrl: url.trim() ? url : null },
    });
    return true;
  } catch {
    await hapusSemuaFotoHero(id);
    return false;
  }
}
