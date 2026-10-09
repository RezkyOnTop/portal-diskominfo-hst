import "server-only";
import { prisma } from "@/lib/db";
import {
  CreateStaffInputSchema,
  DeleteStaffInputSchema,
  UpdateStaffInputSchema,
  type UnitPegawai,
} from "@/lib/validations/local.schema";
import { hapusSemuaFoto } from "@/lib/storage/foto";

export interface StaffRingkas {
  id: string;
  nama: string;
  nip: string | null;
  jabatan: string;
  unit: string;
  fotoUrl: string | null;
  urutan: number;
  aktif: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type StaffResult =
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

function normalkanTeks(v: string | undefined, kosongJadiNull = false): string | null {
  if (v === undefined) return kosongJadiNull ? null : "";
  const rapi = v.trim();
  if (!rapi && kosongJadiNull) return null;
  return rapi;
}

/** Daftar untuk halaman publik: hanya yang aktif, diurut terbesar dulu lalu nama. */
export async function listStaffPublik(): Promise<StaffRingkas[]> {
  return prisma.staff.findMany({
    where: { aktif: true },
    orderBy: [{ unit: "asc" }, { urutan: "asc" }, { nama: "asc" }],
    take: 200,
  });
}

/** Daftar untuk dashboard admin: semuanya (aktif + nonaktif). */
export async function listStaffAdmin(): Promise<StaffRingkas[]> {
  return prisma.staff.findMany({
    orderBy: [{ unit: "asc" }, { urutan: "asc" }, { nama: "asc" }],
    take: 500,
  });
}

/** Ambil satu pegawai berdasarkan id. */
export async function getStaffById(id: string): Promise<StaffRingkas | null> {
  const bersih = id.trim();
  if (!bersih) return null;
  return prisma.staff.findUnique({ where: { id: bersih } });
}

/** Hitung pegawai publik per unit (kartu ringkasan admin) + total. */
export async function countStaff(): Promise<{ total: number; perUnit: Record<string, number> }> {
  const [total, rows] = await Promise.all([
    prisma.staff.count({ where: { aktif: true } }),
    prisma.staff.groupBy({
      by: ["unit"],
      where: { aktif: true },
      _count: { unit: true },
    }),
  ]);
  const perUnit: Record<string, number> = {};
  for (const r of rows) perUnit[r.unit] = r._count.unit;
  return { total, perUnit };
}

/** Tambah pegawai baru (aksi admin). */
export async function createStaff(input: unknown): Promise<StaffResult> {
  const parsed = CreateStaffInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      reason: "INVALID",
      message: "Data pegawai tidak valid.",
      fieldErrors: petikFieldErrors(parsed.error.issues),
    };
  }
  const d = parsed.data;
  try {
    const created = await prisma.staff.create({
      data: {
        nama: d.nama.trim(),
        nip: normalkanTeks(d.nip, true),
        jabatan: d.jabatan.trim(),
        unit: d.unit satisfies UnitPegawai,
        urutan: d.urutan,
      },
      select: { id: true },
    });
    return { ok: true, id: created.id };
  } catch (err) {
    console.error("[pegawai] gagal menambah", err);
    return { ok: false, reason: "UNAVAILABLE", message: "Layanan sedang tidak tersedia. Coba lagi nanti." };
  }
}

/** Ubah data pegawai (aksi admin). */
export async function updateStaff(input: unknown): Promise<StaffResult> {
  const parsed = UpdateStaffInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      reason: "INVALID",
      message: "Data pegawai tidak valid.",
      fieldErrors: petikFieldErrors(parsed.error.issues),
    };
  }
  const { id, aktif, ...rest } = parsed.data;
  try {
    await prisma.staff.update({
      where: { id },
      data: {
        nama: rest.nama.trim(),
        nip: normalkanTeks(rest.nip, true),
        jabatan: rest.jabatan.trim(),
        unit: rest.unit satisfies UnitPegawai,
        urutan: rest.urutan,
        aktif,
      },
    });
    return { ok: true, id };
  } catch (err) {
    const code =
      typeof err === "object" && err !== null && "code" in err
        ? (err as { code?: string }).code
        : undefined;
    if (code === "P2025") {
      return { ok: false, reason: "NOT_FOUND", message: "Pegawai tidak ditemukan." };
    }
    console.error("[pegawai] gagal mengubah", err);
    return { ok: false, reason: "UNAVAILABLE", message: "Layanan sedang tidak tersedia." };
  }
}

/** Hapus pegawai beserta berkas fotonya (aksi admin). */
export async function deleteStaff(input: unknown): Promise<StaffResult> {
  const parsed = DeleteStaffInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      reason: "INVALID",
      message: "Data penghapusan tidak valid.",
      fieldErrors: petikFieldErrors(parsed.error.issues),
    };
  }
  try {
    await prisma.staff.delete({ where: { id: parsed.data.id } });
    await hapusSemuaFoto(parsed.data.id);
    return { ok: true, id: parsed.data.id };
  } catch (err) {
    const code =
      typeof err === "object" && err !== null && "code" in err
        ? (err as { code?: string }).code
        : undefined;
    if (code === "P2025") {
      return { ok: false, reason: "NOT_FOUND", message: "Pegawai tidak ditemukan." };
    }
    console.error("[pegawai] gagal menghapus", err);
    return { ok: false, reason: "UNAVAILABLE", message: "Layanan sedang tidak tersedia." };
  }
}

/**
 * Catat URL foto setelah unggahan berhasil (dipanggil dari route handler foto).
 * URL kosong berarti "tanpa foto" -> disimpan sebagai null (avatar default).
 * Bila id tidak ada, berkas yang baru ditulis dibuang agar tidak yatim.
 */
export async function setFotoStaff(id: string, url: string): Promise<boolean> {
  try {
    await prisma.staff.update({
      where: { id },
      data: { fotoUrl: url.trim() ? url : null },
    });
    return true;
  } catch {
    await hapusSemuaFoto(id);
    return false;
  }
}
