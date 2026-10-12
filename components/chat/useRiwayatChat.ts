"use client";

import { useCallback, useState } from "react";

export interface PesanChat {
  role: "user" | "assistant";
  content: string;
  gagal?: boolean;
}

const SAPAAN: PesanChat = {
  role: "assistant",
  content:
    "Halo! Saya **Asisten AI Diskominfo SP HST** — tanya apa pun soal layanan kami: reservasi, profil, berita, data terbuka, kontak. Psst, saya juga tahu **cuaca Barabai** terkini. 🙂",
};

/**
 * Kunci penyimpanan riwayat chat di sessionStorage.
 * sessionStorage (bukan localStorage): riwayat bertahan saat refresh/pindah
 * halaman dalam SATU tab, tetapi otomatis hilang saat tab ditutup — seimbang
 * antara kenyamanan dan privasi (tidak ada jejak permanen di perangkat).
 */
export const KUNCI_RIWAYAT_CHAT = "diskominfosp:riwayat-chat";

/** Batas pesan yang disimpan (sapaan + 20 terakhir cukup untuk konteks). */
const BATAS_SIMPAN = 21;

/** Baca riwayat tersimpan; rusak/kosong -> hanya sapaan. */
function muatRiwayat(): PesanChat[] {
  try {
    const mentah = sessionStorage.getItem(KUNCI_RIWAYAT_CHAT);
    if (!mentah) return [SAPAAN];
    const data = JSON.parse(mentah) as unknown;
    if (!Array.isArray(data)) return [SAPAAN];
    const bersih = data.filter(
      (p): p is PesanChat =>
        typeof p === "object" &&
        p !== null &&
        ((p as PesanChat).role === "user" || (p as PesanChat).role === "assistant") &&
        typeof (p as PesanChat).content === "string",
    );
    if (bersih.length === 0) return [SAPAAN];
    // Pesan gagal tidak disimpan (hanya noise sementara).
    const tanpaGagal = bersih.filter((p) => !p.gagal);
    if (tanpaGagal.length === 0) return [SAPAAN];
    // Pastikan sapaan selalu pertama.
    const tanpaSapaan = tanpaGagal.filter((p) => p.content !== SAPAAN.content);
    return [SAPAAN, ...tanpaSapaan].slice(-BATAS_SIMPAN);
  } catch {
    return [SAPAAN];
  }
}

/** Simpan riwayat; hanya sapaan (belum ada pertanyaan) -> kunci dibuang. */
function simpanRiwayat(daftar: PesanChat[]): void {
  try {
    if (daftar.filter((p) => p.role === "user").length === 0) {
      sessionStorage.removeItem(KUNCI_RIWAYAT_CHAT);
      return;
    }
    sessionStorage.setItem(KUNCI_RIWAYAT_CHAT, JSON.stringify(daftar.slice(-BATAS_SIMPAN)));
  } catch {
    // Penyimpanan penuh/diblokir — chat tetap jalan, hanya tidak persisten.
  }
}

/**
 * Hook riwayat chat persisten per tab browser.
 *
 * Lazy init membaca sessionStorage saat mount pertama. Ini aman dari
 * hydration mismatch karena ComboMelayang hanya me-mount PanelChat setelah
 * pengguna mengeklik gelembung — tidak ada render server untuk panel ini.
 * Setiap perubahan disimpan sinkron (bukan lewat efek) sehingga tidak ada
 * kondisi balap antara muat awal dan tulis pertama.
 */
export function useRiwayatChat() {
  const [pesan, setPesan] = useState<PesanChat[]>(() =>
    typeof window === "undefined" ? [SAPAAN] : muatRiwayat(),
  );

  const tambahPesan = useCallback((baru: PesanChat | PesanChat[]) => {
    setPesan((v) => {
      const next = [...v, ...(Array.isArray(baru) ? baru : [baru])];
      simpanRiwayat(next);
      return next;
    });
  }, []);

  const hapusRiwayat = useCallback(() => {
    setPesan([SAPAAN]);
    try {
      sessionStorage.removeItem(KUNCI_RIWAYAT_CHAT);
    } catch {
      // Abaikan — state sudah kembali ke sapaan.
    }
  }, []);

  return { pesan, tambahPesan, hapusRiwayat };
}
