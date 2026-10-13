"use server";

import { createSurvey } from "@/lib/services/survey";

export interface SurveiActionState {
  ok: boolean;
  message: string;
  ikm?: number;
  mutu?: string;
}

/** Server Action: simpan jawaban survei kepuasan layanan (halaman /survei). */
export async function submitSurveyAction(
  formData: FormData,
): Promise<SurveiActionState> {
  const num = (key: string) => Number(formData.get(key));
  const result = await createSurvey({
    layanan: formData.get("layanan"),
    u1: num("u1"),
    u2: num("u2"),
    u3: num("u3"),
    u4: num("u4"),
    u5: num("u5"),
    u6: num("u6"),
    u7: num("u7"),
    u8: num("u8"),
    u9: num("u9"),
    saran: formData.get("saran") ?? "",
    nama: formData.get("nama") ?? "",
    kontak: formData.get("kontak") ?? "",
  });
  if (result.ok) {
    return {
      ok: true,
      message: "Terima kasih! Penilaian Anda sudah kami terima.",
      ikm: result.ikm,
      mutu: result.mutu,
    };
  }
  return { ok: false, message: result.message };
}
