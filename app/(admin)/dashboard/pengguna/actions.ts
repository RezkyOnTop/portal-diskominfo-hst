"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { catatAuditSesi } from "@/lib/services/audit";
import {
  changeUserPassword,
  createUser,
  deleteUser,
  updateUser,
} from "@/lib/services/user";

export interface UserActionState {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Kelola user hanya untuk Administrator.
 * Editor boleh masuk dashboard, tetapi tidak boleh menambah/mengubah akun —
 * gerbang ini memeriksa peran di sesi, bukan sekadar ada/tidaknya sesi.
 */
async function sesiAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN" ? session : null;
}

const DITOLAK: UserActionState = {
  ok: false,
  message: "Tidak diizinkan. Hanya Administrator yang dapat mengelola user.",
};

/** Ubah FormData jadi objek sesuai skema Zod service. */
function bacaForm(formData: FormData) {
  return {
    id: String(formData.get("id") ?? "").trim(),
    nama: String(formData.get("nama") ?? ""),
    username: String(formData.get("username") ?? ""),
    password: String(formData.get("password") ?? ""),
    role: String(formData.get("role") ?? ""),
    aktif: String(formData.get("aktif") ?? "true") === "true",
  };
}

/** Server Action: tambah akun pengguna (hanya Administrator). */
export async function createUserAction(
  _prev: UserActionState | null,
  formData: FormData,
): Promise<UserActionState> {
  const session = await sesiAdmin();
  if (!session) return DITOLAK;

  const { nama, username, password, role } = bacaForm(formData);
  const result = await createUser({ nama, username, password, role });
  if (!result.ok) {
    return { ok: false, message: result.message, fieldErrors: result.fieldErrors };
  }

  await catatAuditSesi(session, {
    aksi: "TAMBAH_USER",
    target: "User",
    targetId: result.id,
    detail: `Tambah akun "${username}" sebagai ${role}`,
  });

  revalidatePath("/dashboard/pengguna");
  revalidatePath("/dashboard");
  return { ok: true, message: "Akun pengguna berhasil ditambahkan." };
}

/** Server Action: ubah nama/username/peran/status akun (hanya Administrator). */
export async function updateUserAction(
  _prev: UserActionState | null,
  formData: FormData,
): Promise<UserActionState> {
  const session = await sesiAdmin();
  if (!session) return DITOLAK;

  const { id, nama, username, role, aktif } = bacaForm(formData);
  const result = await updateUser({ id, nama, username, role, aktif });
  if (!result.ok) {
    return { ok: false, message: result.message, fieldErrors: result.fieldErrors };
  }

  await catatAuditSesi(session, {
    aksi: "UBAH_USER",
    target: "User",
    targetId: id,
    detail: `Ubah akun "${username}" → peran ${role}, ${aktif ? "aktif" : "nonaktif"}`,
  });

  revalidatePath("/dashboard/pengguna");
  revalidatePath("/dashboard");
  return { ok: true, message: "Data akun diperbarui." };
}

/** Server Action: ganti password akun (hanya Administrator). */
export async function changePasswordAction(
  _prev: UserActionState | null,
  formData: FormData,
): Promise<UserActionState> {
  const session = await sesiAdmin();
  if (!session) return DITOLAK;

  const { id, password } = bacaForm(formData);
  const result = await changeUserPassword({ id, password });
  if (!result.ok) {
    return { ok: false, message: result.message, fieldErrors: result.fieldErrors };
  }

  await catatAuditSesi(session, {
    aksi: "GANTI_PASSWORD_USER",
    target: "User",
    targetId: id,
    detail: "Ganti password salah satu akun dashboard",
  });

  revalidatePath("/dashboard/pengguna");
  return { ok: true, message: "Password berhasil diganti." };
}

/** Server Action: hapus akun (hanya Administrator). */
export async function deleteUserAction(
  _prev: UserActionState | null,
  formData: FormData,
): Promise<UserActionState> {
  const session = await sesiAdmin();
  if (!session) return DITOLAK;

  const result = await deleteUser({ id: String(formData.get("id") ?? "").trim() });
  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  await catatAuditSesi(session, {
    aksi: "HAPUS_USER",
    target: "User",
    targetId: String(formData.get("id") ?? ""),
    detail: "Hapus satu akun dashboard",
  });

  revalidatePath("/dashboard/pengguna");
  revalidatePath("/dashboard");
  return { ok: true, message: "Akun dihapus." };
}
