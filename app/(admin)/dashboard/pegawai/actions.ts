"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { createStaff, deleteStaff, updateStaff } from "@/lib/services/staff";
import { catatAuditSesi } from "@/lib/services/audit";

export interface StaffActionState {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

/** Ubah FormData jadi objek sesuai skema Zod service. */
function bacaForm(formData: FormData) {
  const angka = (v: FormDataEntryValue | null, fallback: number) => {
    const n = Number(String(v ?? "").trim());
    return Number.isFinite(n) ? n : fallback;
  };
  return {
    id: String(formData.get("id") ?? "").trim(),
    nama: String(formData.get("nama") ?? ""),
    nip: String(formData.get("nip") ?? ""),
    jabatan: String(formData.get("jabatan") ?? ""),
    unit: String(formData.get("unit") ?? ""),
    urutan: angka(formData.get("urutan"), 0),
    aktif: String(formData.get("aktif") ?? "true") === "true",
  };
}

/** Server Action: tambah pegawai (hanya admin). */
export async function createStaffAction(
  _prev: StaffActionState | null,
  formData: FormData,
): Promise<StaffActionState> {
  const session = await auth();
  if (!session) {
    return { ok: false, message: "Tidak diizinkan. Silakan masuk sebagai admin." };
  }

  const { id: _id, aktif: _aktif, ...input } = bacaForm(formData);
  // id diabaikan (tambah baru selalu membuat id sendiri),
  // aktif diabaikan (pegawai baru selalu aktif).
  void _id;
  void _aktif;
  const result = await createStaff(input);
  if (!result.ok) {
    return { ok: false, message: result.message, fieldErrors: result.fieldErrors };
  }

  await catatAuditSesi(session, {
    aksi: "TAMBAH_PEGAWAI",
    target: "Staff",
    targetId: result.id,
    detail: `Tambah pegawai "${input.nama}" (${input.jabatan}, ${input.unit})`,
  });

  revalidatePath("/dashboard/pegawai");
  revalidatePath("/profil/data-pegawai");
  return { ok: true, message: "Pegawai berhasil ditambahkan." };
}

/** Server Action: ubah data pegawai (hanya admin). */
export async function updateStaffAction(
  _prev: StaffActionState | null,
  formData: FormData,
): Promise<StaffActionState> {
  const session = await auth();
  if (!session) {
    return { ok: false, message: "Tidak diizinkan. Silakan masuk sebagai admin." };
  }

  const input = bacaForm(formData);
  const result = await updateStaff(input);
  if (!result.ok) {
    return { ok: false, message: result.message, fieldErrors: result.fieldErrors };
  }

  await catatAuditSesi(session, {
    aksi: "UBAH_PEGAWAI",
    target: "Staff",
    targetId: input.id,
    detail: `Ubah pegawai "${input.nama}" (${input.jabatan}, ${input.unit}) — tampil: ${input.aktif ? "ya" : "tidak"}`,
  });

  revalidatePath("/dashboard/pegawai");
  revalidatePath("/profil/data-pegawai");
  return { ok: true, message: "Data pegawai diperbarui." };
}

/** Server Action: hapus pegawai (hanya admin). */
export async function deleteStaffAction(
  _prev: StaffActionState | null,
  formData: FormData,
): Promise<StaffActionState> {
  const session = await auth();
  if (!session) {
    return { ok: false, message: "Tidak diizinkan. Silakan masuk sebagai admin." };
  }

  const result = await deleteStaff({ id: String(formData.get("id") ?? "").trim() });
  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  await catatAuditSesi(session, {
    aksi: "HAPUS_PEGAWAI",
    target: "Staff",
    targetId: "id" in result ? result.id : null,
    detail: "Hapus satu data pegawai beserta fotonya",
  });

  revalidatePath("/dashboard/pegawai");
  revalidatePath("/profil/data-pegawai");
  return { ok: true, message: "Pegawai dihapus." };
}
