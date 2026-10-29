"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { tanggapiPengaduan } from "@/lib/services/pengaduan";
import { catatAuditSesi } from "@/lib/services/audit";

export interface TanggapiState {
  ok: boolean;
  message: string;
}

/**
 * Server Action: ubah status + simpan tanggapan pengaduan (hanya admin).
 * Memvalidasi sesi terlebih dahulu — tanpa sesi, aksi ditolak.
 */
export async function tanggapiAction(
  _prev: TanggapiState | null,
  formData: FormData,
): Promise<TanggapiState> {
  const session = await auth();
  if (!session) {
    return { ok: false, message: "Tidak diizinkan. Silakan masuk sebagai admin." };
  }

  const result = await tanggapiPengaduan({
    id: formData.get("id"),
    status: formData.get("status"),
    tanggapan: formData.get("tanggapan") ?? "",
  });

  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  await catatAuditSesi(session, {
    aksi: "UBAH_STATUS_PENGADUAN",
    target: "Pengaduan",
    targetId: String(formData.get("id") ?? ""),
    detail: `Ubah status pengaduan menjadi "${String(formData.get("status") ?? "")}"`,
  });

  revalidatePath("/dashboard/pengaduan");
  revalidatePath("/dashboard");
  return { ok: true, message: "Tanggapan tersimpan." };
}
