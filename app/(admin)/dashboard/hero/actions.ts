"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { createHeroSlide, deleteHeroSlide, updateHeroSlide } from "@/lib/services/hero";

export interface HeroActionState {
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
    label: String(formData.get("label") ?? ""),
    urutan: angka(formData.get("urutan"), 0),
    aktif: String(formData.get("aktif") ?? "true") === "true",
  };
}

function segarkan() {
  revalidatePath("/dashboard/hero");
  revalidatePath("/dashboard");
  revalidatePath("/");
}

/** Server Action: tambah slide hero (hanya admin). */
export async function createHeroSlideAction(
  _prev: HeroActionState | null,
  formData: FormData,
): Promise<HeroActionState> {
  const session = await auth();
  if (!session) {
    return { ok: false, message: "Tidak diizinkan. Silakan masuk sebagai admin." };
  }

  const { id: _id, aktif: _aktif, ...input } = bacaForm(formData);
  // id diabaikan (tambah baru selalu membuat id sendiri),
  // aktif diabaikan (slide baru selalu aktif).
  void _id;
  void _aktif;
  const result = await createHeroSlide(input);
  if (!result.ok) {
    return { ok: false, message: result.message, fieldErrors: result.fieldErrors };
  }

  segarkan();
  return { ok: true, message: "Slide ditambahkan. Unggah fotonya lewat formulir di bawah." };
}

/** Server Action: ubah data slide hero (hanya admin). */
export async function updateHeroSlideAction(
  _prev: HeroActionState | null,
  formData: FormData,
): Promise<HeroActionState> {
  const session = await auth();
  if (!session) {
    return { ok: false, message: "Tidak diizinkan. Silakan masuk sebagai admin." };
  }

  const result = await updateHeroSlide(bacaForm(formData));
  if (!result.ok) {
    return { ok: false, message: result.message, fieldErrors: result.fieldErrors };
  }

  segarkan();
  return { ok: true, message: "Slide diperbarui." };
}

/** Server Action: hapus slide hero beserta fotonya (hanya admin). */
export async function deleteHeroSlideAction(
  _prev: HeroActionState | null,
  formData: FormData,
): Promise<HeroActionState> {
  const session = await auth();
  if (!session) {
    return { ok: false, message: "Tidak diizinkan. Silakan masuk sebagai admin." };
  }

  const result = await deleteHeroSlide({ id: String(formData.get("id") ?? "").trim() });
  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  segarkan();
  return { ok: true, message: "Slide dihapus." };
}
