"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { tanggapiPengaduan } from "@/lib/services/pengaduan";

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

  revalidatePath("/dashboard/pengaduan");
  revalidatePath("/dashboard");
  return { ok: true, message: "Tanggapan tersimpan." };
}
