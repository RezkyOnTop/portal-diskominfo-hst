import "server-only";

/**
 * ============================================================================
 *  lib/api/gambar.ts — pengambil gambar berita dari host Media Center.
 *  SATU-SATUNYA tempat yang boleh memanggil data-mediacenter.hstkab.go.id
 *  untuk gambar. UI tidak pernah fetch ke sana langsung.
 * ============================================================================
 *
 * KENAPA ADA PROXY:
 *   Host gambar `data-mediacenter.hstkab.go.id` mengirim rantai sertifikat
 *   TIDAK LENGKAP (hanya leaf `*.hstkab.go.id`, tanpa intermediate Sectigo).
 *   Akibatnya:
 *     - `next/image` dengan optimizer normal GAGAL verifikasi TLS;
 *     - karena itu dulu dipakai `unoptimized`, sehingga browser mengunduh
 *       foto asli (mis. 1638x2048, ~187 KB) lalu mengecilkannya via CSS.
 *   Berkas intermediate resmi dari AIA sertifikat disimpan di `certs/` dan
 *   dipakai HANYA untuk koneksi keluar ke host ini — bukan melemahkan
 *   verifikasi TLS global.
 *
 * ALUR:
 *   fetch (TLS + intermediate) -> sharp resize -> cache disk -> sajikan.
 *   Ukuran jauh lebih kecil (WebP, lebar maksimal sesuai permintaan), sehingga
 *   halaman berita/beranda tidak lagi mengunduh foto kamera penuh.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { Agent, request } from "undici";

/** Host gambar yang diizinkan (allowlist ketat — cegah SSRF). */
const HOST_DIIZINKAN = new Set([
  "data-mediacenter.hstkab.go.id",
  "mediacenter.hstkab.go.id",
]);

const TIMEOUT_MS = 15_000;
const LEBAR_MAKS = 1600;
const KUALITAS_WEBP = 72;

/** Direktori cache gambar hasil olahan (di luar Git, lihat .gitignore). */
function cacheDir(): string {
  return path.join(process.cwd(), ".cache", "gambar");
}

/**
 * Dispatcher undici dengan CA tambahan (intermediate Sectigo).
 * Bila berkas CA tidak ada (mis. di mesin lain), jatuh ke fetch biasa.
 */
let dispatcher: Agent | null | undefined;

function getDispatcher(): Agent | null {
  if (dispatcher !== undefined) return dispatcher;
  const caPath = path.join(
    process.cwd(),
    "certs",
    "sectigo-pub-server-auth-ca-dv-r36.crt",
  );
  try {
    if (!existsSync(caPath)) {
      dispatcher = null;
      return dispatcher;
    }
    // undici memakai opsi `ca` sebagai PENGGANTI CA bawaan, jadi root sistem
    // harus disertakan eksplisit agar verifikasi rantai penuh tetap lolos.
    const ca: Buffer[] = [];
    const bundleSistem = "/etc/ssl/certs/ca-certificates.crt";
    if (existsSync(bundleSistem)) ca.push(readFileSyncSafe(bundleSistem));
    ca.push(readFileSyncSafe(caPath));
    dispatcher = new Agent({ connect: { ca } });
  } catch {
    dispatcher = null;
  }
  return dispatcher;
}

/** Baca berkas CA secara sinkron (sekali, saat inisialisasi). */
function readFileSyncSafe(p: string): Buffer {
  return readFileSync(p);
}

export interface GambarHasil {
  isi: Buffer;
  mime: string;
}

/** Apakah URL termasuk host gambar yang diizinkan. */
export function hostGambarDiizinkan(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && HOST_DIIZINKAN.has(u.hostname);
  } catch {
    return false;
  }
}

/** Kunci cache stabil dari URL + lebar. */
function kunciCache(url: string, lebar: number): string {
  return createHash("sha256").update(`${url}|${lebar}`).digest("hex").slice(0, 32);
}

/**
 * Ambil gambar dari host Media Center, kecilkan, dan cache di disk.
 * Melempar Error dengan pesan generik bila gagal (tidak membocorkan detail).
 */
export async function ambilGambarBerita(
  url: string,
  lebarDiminta = 800,
): Promise<GambarHasil> {
  if (!hostGambarDiizinkan(url)) {
    throw new Error("URL gambar tidak diizinkan.");
  }
  const lebar = Math.min(Math.max(16, Math.round(lebarDiminta)), LEBAR_MAKS);
  const kunci = kunciCache(url, lebar);
  const dir = cacheDir();
  const berkas = path.join(dir, `${kunci}.webp`);

  // 1) Cache disk.
  try {
    const isi = await readFile(berkas);
    return { isi, mime: "image/webp" };
  } catch {
    /* belum ada -> lanjut unduh */
  }

  // 2) Unduh dengan TLS yang benar (intermediate Sectigo dari AIA).
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let mentah: Buffer;
  try {
    // Catatan: JANGAN pakai `fetch` global dengan opsi `dispatcher` di sini.
    // Node 22 membawa salinan undici INTERNAL sendiri; dispatcher dari paket
    // `undici` proyek ditolak dengan UND_ERR_INVALID_ARG (beda salinan kelas).
    // `request()` dari paket proyek menerima dispatcher-nya dengan benar.
    const dp = getDispatcher();
    const res = await request(url, {
      dispatcher: dp ?? undefined,
      signal: controller.signal,
      headers: { Accept: "image/*" },
    });
    if (res.statusCode < 200 || res.statusCode >= 300) {
      await res.body.dump();
      throw new Error(`HTTP_${res.statusCode}`);
    }
    mentah = Buffer.from(await res.body.arrayBuffer());
  } catch (err) {
    const code =
      err instanceof Error && err.name === "AbortError" ? "TIMEOUT" : "NETWORK";
    console.error(`[gambar] gagal mengambil gambar: ${code}`);
    throw new Error("Gambar tidak dapat dimuat.");
  } finally {
    clearTimeout(timer);
  }

  // 3) Olah dengan sharp -> WebP hemat.
  let olahan: Buffer;
  try {
    olahan = await sharp(mentah)
      .rotate() // hormati orientasi EXIF (foto ponsel)
      .resize({ width: lebar, withoutEnlargement: true })
      .webp({ quality: KUALITAS_WEBP })
      .toBuffer();
  } catch {
    console.error("[gambar] gagal memproses gambar");
    throw new Error("Gambar tidak dapat diproses.");
  }

  // 4) Simpan cache (kegagalan tulis tidak fatal).
  try {
    await mkdir(dir, { recursive: true });
    await writeFile(berkas, olahan);
  } catch {
    /* cache gagal -> tetap sajikan hasil olahan */
  }

  return { isi: olahan, mime: "image/webp" };
}
