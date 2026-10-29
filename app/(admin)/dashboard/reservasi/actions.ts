"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { updateReservationStatus } from "@/lib/services/reservation";
import { catatAuditSesi } from "@/lib/services/audit";

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

  await catatAuditSesi(session, {
    aksi: "UBAH_STATUS_RESERVASI",
    target: "ServiceReservation",
    targetId: String(formData.get("id") ?? ""),
    detail: `Ubah status reservasi menjadi "${String(formData.get("status") ?? "")}"`,
  });

  revalidatePath("/dashboard/reservasi");
  revalidatePath("/dashboard");
  return { ok: true, message: "Status permohonan diperbarui." };
}
