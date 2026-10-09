/**
 * Helper cuaca yang AMAN dipakai komponen client (tanpa `server-only`).
 * Hanya membentuk URL — tidak pernah memanggil api.bmkg.go.id dari sini.
 * Pemanggilan upstream tetap hanya di lib/api/bmkg.ts (lewat route API).
 */

/** Kode wilayah BMKG default (Barabai Darat, terdekat dari kantor). */
export const BMKG_ADM4_DEFAULT = "63.07.06.1001";

/** Halaman prakiraan BMKG untuk kode wilayah tertentu. */
export function bmkgLampiranUrl(adm4: string = BMKG_ADM4_DEFAULT): string {
  return `https://www.bmkg.go.id/cuaca/prakiraan-cuaca/${adm4}`;
}
