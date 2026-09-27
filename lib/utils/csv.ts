/**
 * Utilitas CSV untuk ekspor data admin.
 *
 * Dua penyesuaian penting untuk Excel berbahasa Indonesia:
 *  1. BOM UTF-8 di awal berkas — tanpa ini Excel membaca aksen/karakter
 *     non-ASCII sebagai mojibake (mis. "Publikasi & Dokumentasi" rusak).
 *  2. Pemisah default titik-koma (`;`) — Excel dengan locale Indonesia memakai
 *     `;` sebagai list separator, sehingga CSV ber-koma tampil menumpuk di satu
 *     kolom. Pemisah bisa diganti lewat argumen `delimiter`.
 */

/** BOM UTF-8 — ditulis di awal berkas agar Excel mendeteksi encoding dengan benar. */
export const CSV_BOM = "\uFEFF";

/**
 * Escape satu nilai CSV: bungkus dengan tanda kutip bila mengandung pemisah,
 * kutip, atau baris baru; gandakan tanda kutip di dalamnya.
 */
export function escapeCsvValue(value: unknown, delimiter = ";"): string {
  if (value === null || value === undefined) return "";
  const s = value instanceof Date ? value.toISOString() : String(value);
  const perluKutip = s.includes(delimiter) || s.includes('"') || /[\r\n]/.test(s);
  if (!perluKutip) return s;
  return `"${s.replace(/"/g, '""')}"`;
}

/** Susun teks CSV dari header + baris data (dengan BOM, siap diunduh). */
export function toCsv(
  headers: string[],
  rows: unknown[][],
  delimiter = ";",
): string {
  const baris = [headers, ...rows].map((row) =>
    row.map((cell) => escapeCsvValue(cell, delimiter)).join(delimiter),
  );
  return CSV_BOM + baris.join("\r\n") + "\r\n";
}

/** Nama berkas ekspor dengan tanggal, mis. `subscriber-2026-09-28.csv`. */
export function namaBerkasCsv(prefix: string, tanggal = new Date()): string {
  const iso = tanggal.toISOString().slice(0, 10);
  return `${prefix}-${iso}.csv`;
}

/** Header respons HTTP untuk unduhan CSV. */
export function csvHeaders(filename: string): HeadersInit {
  return {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "no-store",
  };
}
