"use server";

import { createSubscriber } from "@/lib/services/subscriber";

/** Server Action: pendaftaran subscriber radio (form di halaman /radio). */
export async function subscribeAction(
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const result = await createSubscriber({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? "",
  });
  if (result.ok) {
    return { ok: true, message: "Terima kasih! Anda berhasil berlangganan." };
  }
  return { ok: false, message: result.message };
}
