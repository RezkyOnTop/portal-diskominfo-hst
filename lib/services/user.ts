import "server-only";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import {
  ChangePasswordInputSchema,
  CreateUserInputSchema,
  DeleteUserInputSchema,
  UpdateUserInputSchema,
  type UserRole,
} from "@/lib/validations/local.schema";

/** Biaya bcrypt — sama dengan scripts/setup-admin.mjs (cost 12). */
const BCRYPT_COST = 12;

/** Bentuk akun yang AMAN ditampilkan ke UI (tanpa passwordHash). */
export interface UserRingkas {
  id: string;
  username: string;
  nama: string;
  role: string;
  aktif: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type UserResult =
  | { ok: true; id: string }
  | {
      ok: false;
      reason: "INVALID" | "NOT_FOUND" | "DUPLICATE" | "TERAKHIR" | "UNAVAILABLE";
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

/** Kolom yang dipilih untuk daftar/detail — SENGAJA tanpa passwordHash. */
const KOLOM_AMAN = {
  id: true,
  username: true,
  nama: true,
  role: true,
  aktif: true,
  createdAt: true,
  updatedAt: true,
} as const;

function petikFieldErrors(
  issues: { path: PropertyKey[]; message: string }[],
): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "_");
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return fieldErrors;
}

/** Kode error Prisma dari sebuah exception (P2002 unik, P2025 tak ditemukan). */
function kodePrisma(err: unknown): string | undefined {
  return typeof err === "object" && err !== null && "code" in err
    ? (err as { code?: string }).code
    : undefined;
}

/** Daftar seluruh akun untuk dashboard admin (Administrator dulu, lalu nama). */
export async function listUsers(): Promise<UserRingkas[]> {
  return prisma.user.findMany({
    select: KOLOM_AMAN,
    orderBy: [{ role: "asc" }, { nama: "asc" }],
    take: 500,
  });
}

/** Ambil satu akun berdasarkan id. */
export async function getUserById(id: string): Promise<UserRingkas | null> {
  const bersih = id.trim();
  if (!bersih) return null;
  return prisma.user.findUnique({ where: { id: bersih }, select: KOLOM_AMAN });
}

/** Ambil satu akun berdasarkan identitas login (username/email, huruf kecil). */
export async function getUserByUsername(username: string): Promise<UserRingkas | null> {
  const bersih = username.trim().toLowerCase();
  if (!bersih) return null;
  return prisma.user.findUnique({ where: { username: bersih }, select: KOLOM_AMAN });
}

/** Hitung akun per peran/status (kartu ringkasan admin). */
export async function countUsers(): Promise<{
  total: number;
  admin: number;
  editor: number;
  aktif: number;
  nonaktif: number;
}> {
  const [total, admin, editor, aktif, nonaktif] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { role: "EDITOR" } }),
    prisma.user.count({ where: { aktif: true } }),
    prisma.user.count({ where: { aktif: false } }),
  ]);
  return { total, admin, editor, aktif, nonaktif };
}

/** Jumlah Administrator yang masih AKTIF — dipakai sebagai pengaman. */
async function countAdminAktif(): Promise<number> {
  return prisma.user.count({ where: { role: "ADMIN", aktif: true } });
}

/**
 * Tambah akun pengguna baru (aksi admin).
 * Password di-hash bcrypt; identitas login unik (P2002 -> DUPLICATE).
 */
export async function createUser(input: unknown): Promise<UserResult> {
  const parsed = CreateUserInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      reason: "INVALID",
      message: "Data pengguna tidak valid.",
      fieldErrors: petikFieldErrors(parsed.error.issues),
    };
  }
  const d = parsed.data;
  try {
    const passwordHash = await bcrypt.hash(d.password, BCRYPT_COST);
    const created = await prisma.user.create({
      data: {
        username: d.username,
        nama: d.nama.trim(),
        passwordHash,
        role: d.role satisfies UserRole,
      },
      select: { id: true },
    });
    return { ok: true, id: created.id };
  } catch (err) {
    if (kodePrisma(err) === "P2002") {
      return {
        ok: false,
        reason: "DUPLICATE",
        message: "Username/email ini sudah dipakai akun lain.",
        fieldErrors: { username: ["Sudah dipakai akun lain"] },
      };
    }
    console.error("[user] gagal menambah akun", err);
    return {
      ok: false,
      reason: "UNAVAILABLE",
      message: "Layanan sedang tidak tersedia. Coba lagi nanti.",
    };
  }
}

/**
 * Ubah nama/username/peran/status akun (aksi admin).
 * Pengaman: tidak boleh menonaktifkan atau menurunkan peran Administrator
 * TERAKHIR yang masih aktif — mencegah portal terkunci dari kelola user.
 */
export async function updateUser(input: unknown): Promise<UserResult> {
  const parsed = UpdateUserInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      reason: "INVALID",
      message: "Data pengguna tidak valid.",
      fieldErrors: petikFieldErrors(parsed.error.issues),
    };
  }
  const { id, nama, username, role, aktif } = parsed.data;

  try {
    const lama = await prisma.user.findUnique({ where: { id }, select: { role: true, aktif: true } });
    if (!lama) {
      return { ok: false, reason: "NOT_FOUND", message: "Akun tidak ditemukan." };
    }

    const kehilanganAdmin =
      lama.role === "ADMIN" && lama.aktif && (role !== "ADMIN" || !aktif);
    if (kehilanganAdmin && (await countAdminAktif()) <= 1) {
      return {
        ok: false,
        reason: "TERAKHIR",
        message:
          "Ini satu-satunya Administrator aktif. Tambahkan Administrator lain sebelum mengubah peran/menonaktifkannya.",
      };
    }

    await prisma.user.update({
      where: { id },
      data: { nama: nama.trim(), username, role: role satisfies UserRole, aktif },
    });
    return { ok: true, id };
  } catch (err) {
    if (kodePrisma(err) === "P2002") {
      return {
        ok: false,
        reason: "DUPLICATE",
        message: "Username/email ini sudah dipakai akun lain.",
        fieldErrors: { username: ["Sudah dipakai akun lain"] },
      };
    }
    if (kodePrisma(err) === "P2025") {
      return { ok: false, reason: "NOT_FOUND", message: "Akun tidak ditemukan." };
    }
    console.error("[user] gagal mengubah akun", err);
    return { ok: false, reason: "UNAVAILABLE", message: "Layanan sedang tidak tersedia." };
  }
}

/** Ganti password akun (aksi admin). Password lama tidak diminta. */
export async function changeUserPassword(input: unknown): Promise<UserResult> {
  const parsed = ChangePasswordInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      reason: "INVALID",
      message: "Password tidak valid.",
      fieldErrors: petikFieldErrors(parsed.error.issues),
    };
  }
  try {
    const passwordHash = await bcrypt.hash(parsed.data.password, BCRYPT_COST);
    await prisma.user.update({ where: { id: parsed.data.id }, data: { passwordHash } });
    return { ok: true, id: parsed.data.id };
  } catch (err) {
    if (kodePrisma(err) === "P2025") {
      return { ok: false, reason: "NOT_FOUND", message: "Akun tidak ditemukan." };
    }
    console.error("[user] gagal mengganti password", err);
    return { ok: false, reason: "UNAVAILABLE", message: "Layanan sedang tidak tersedia." };
  }
}

/**
 * Hapus akun (aksi admin).
 * Pengaman: Administrator aktif TERAKHIR tidak boleh dihapus.
 */
export async function deleteUser(input: unknown): Promise<UserResult> {
  const parsed = DeleteUserInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      reason: "INVALID",
      message: "Data penghapusan tidak valid.",
      fieldErrors: petikFieldErrors(parsed.error.issues),
    };
  }
  try {
    const lama = await prisma.user.findUnique({
      where: { id: parsed.data.id },
      select: { role: true, aktif: true },
    });
    if (!lama) {
      return { ok: false, reason: "NOT_FOUND", message: "Akun tidak ditemukan." };
    }
    if (lama.role === "ADMIN" && lama.aktif && (await countAdminAktif()) <= 1) {
      return {
        ok: false,
        reason: "TERAKHIR",
        message:
          "Ini satu-satunya Administrator aktif. Tambahkan Administrator lain sebelum menghapusnya.",
      };
    }
    await prisma.user.delete({ where: { id: parsed.data.id } });
    return { ok: true, id: parsed.data.id };
  } catch (err) {
    if (kodePrisma(err) === "P2025") {
      return { ok: false, reason: "NOT_FOUND", message: "Akun tidak ditemukan." };
    }
    console.error("[user] gagal menghapus akun", err);
    return { ok: false, reason: "UNAVAILABLE", message: "Layanan sedang tidak tersedia." };
  }
}

/**
 * Verifikasi login akun lokal (dipakai lib/auth.ts).
 * Mengembalikan data aman (tanpa hash) bila identitas & password cocok dan
 * akun aktif; selain itu null. Sengaja tidak membedakan "tidak ada akun" vs
 * "password salah" agar tidak membocorkan keberadaan akun.
 */
export async function verifyUserLogin(
  username: string,
  password: string,
): Promise<{ id: string; username: string; nama: string; role: UserRole } | null> {
  const bersih = username.trim().toLowerCase();
  if (!bersih || !password) return null;
  try {
    const akun = await prisma.user.findUnique({
      where: { username: bersih },
      select: { id: true, username: true, nama: true, role: true, aktif: true, passwordHash: true },
    });
    if (!akun || !akun.aktif) return null;
    const cocok = await bcrypt.compare(password, akun.passwordHash);
    if (!cocok) return null;
    return {
      id: akun.id,
      username: akun.username,
      nama: akun.nama,
      role: akun.role === "ADMIN" ? "ADMIN" : "EDITOR",
    };
  } catch (err) {
    console.error("[user] gagal memverifikasi login", err);
    return null;
  }
}
