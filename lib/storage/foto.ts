import "server-only";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { FOTO_PEGAWAI_MAX_BYTES, FOTO_PEGAWAI_MIME } from "@/lib/validations/local.schema";

/**
 * Penyimpanan berkas foto pegawai.
 *
 * Berkas TIDAK disimpan di `public/` agar tidak ikut terbawa ke repositori dan
 * agar penyajiannya melewati satu pintu (route handler) — sehingga tipe MIME
 * dan header cache bisa dikendalikan. Lokasi: `<root>/.uploads/pegawai/`
 * (lihat .gitignore).
 */

const DIR_FOTO = path.join(process.cwd(), ".uploads", "pegawai");

/** Ekstensi berkas untuk tiap MIME yang diizinkan. */
const EKSTENSI: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Kebalikan dari EKSTENSI: dipakai saat menyajikan berkas. */
export const MIME_DARI_EKSTENSI: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export type SimpanFotoResult =
  | { ok: true; url: string }
  | { ok: false; message: string };

/** Nama berkas yang aman (id Staff berupa cuid — tetap disaring). */
function namaBerkasAman(id: string, ekstensi: string): string {
  const bersih = id.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!bersih) throw new Error("id tidak valid");
  return `${bersih}.${ekstensi}`;
}

/** Pastikan folder penyimpanan ada. */
async function pastikanFolder(): Promise<void> {
  await mkdir(DIR_FOTO, { recursive: true });
}

/**
 * Simpan foto pegawai. Menimpa berkas lama dengan ekstensi berbeda agar tidak
 * menyisakan dua versi (mis. .jpg lama + .png baru).
 */
export async function simpanFotoPegawai(
  id: string,
  berkas: File,
): Promise<SimpanFotoResult> {
  const tipe = berkas.type;
  if (!(FOTO_PEGAWAI_MIME as readonly string[]).includes(tipe)) {
    return { ok: false, message: "Format foto harus JPG, PNG, atau WEBP." };
  }
  if (berkas.size > FOTO_PEGAWAI_MAX_BYTES) {
    return { ok: false, message: "Ukuran foto maksimal 2 MB." };
  }
  if (berkas.size === 0) {
    return { ok: false, message: "Berkas foto kosong." };
  }

  const ekstensi = EKSTENSI[tipe]!;
  try {
    await pastikanFolder();
    // Buang versi lama dengan ekstensi apa pun sebelum menulis yang baru.
    await hapusSemuaFoto(id);
    const buf = Buffer.from(await berkas.arrayBuffer());
    await writeFile(path.join(DIR_FOTO, namaBerkasAman(id, ekstensi)), buf, {
      mode: 0o644,
    });
    return { ok: true, url: `/api/pegawai/foto/${id}` };
  } catch (err) {
    console.error("[pegawai] gagal menyimpan foto", err);
    return { ok: false, message: "Gagal menyimpan foto. Coba lagi." };
  }
}

/** Hapus seluruh berkas foto milik satu pegawai (semua ekstensi). */
export async function hapusSemuaFoto(id: string): Promise<void> {
  const ekstensi = Object.values(EKSTENSI);
  await Promise.all(
    ekstensi.map(async (ext) => {
      try {
        await unlink(path.join(DIR_FOTO, namaBerkasAman(id, ext)));
      } catch {
        // Berkas tidak ada — abaikan.
      }
    }),
  );
}

export type FotoBaca = { isi: Buffer; mime: string };

/** Baca berkas foto pegawai; null bila tidak ada. */
export async function bacaFotoPegawai(id: string): Promise<FotoBaca | null> {
  for (const ext of Object.values(EKSTENSI)) {
    try {
      const isi = await readFile(path.join(DIR_FOTO, namaBerkasAman(id, ext)));
      return { isi, mime: MIME_DARI_EKSTENSI[ext]! };
    } catch {
      // Coba ekstensi berikutnya.
    }
  }
  return null;
}
