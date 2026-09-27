"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { updateReservationStatus } from "@/lib/services/reservation";

export interface UpdateStatusState {
  ok: boolean;
  message: string;
}

/**
 * Server Action: ubah status permohonan reservasi (hanya admin).
 * Memvalidasi sesi terlebih dahulu — tanpa sesi, aksi ditolak.
 */
export async function updateStatusAction(
  _prev: UpdateStatusState | null,
  formData: FormData,
): Promise<UpdateStatusState> {
  const session = await auth();
  if (!session) {
    return { ok: false, message: "Tidak diizinkan. Silakan masuk sebagai admin." };
  }

  const result = await updateReservationStatus({
    id: formData.get("id"),
    status: formData.get("status"),
    catatanAdmin: formData.get("catatanAdmin") ?? "",
  });

  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  revalidatePath("/dashboard/reservasi");
  revalidatePath("/dashboard");
  return { ok: true, message: "Status permohonan diperbarui." };
}
