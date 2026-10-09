/**
 * Helper URL gambar — AMAN dipakai komponen client maupun server.
 * Membentuk URL ke proxy internal `/api/gambar` (tidak pernah memanggil
 * host Media Center langsung dari UI).
 */

/** Host gambar berita yang boleh diproksikan. */
const HOST_GAMBAR = new Set([
  "data-mediacenter.hstkab.go.id",
  "mediacenter.hstkab.go.id",
]);

/**
 * Ubah URL gambar Media Center menjadi URL proxy internal dengan lebar tertentu.
 * URL yang bukan host Media Center (mis. aset lokal `/brand/...` atau thumbnail
 * YouTube) dikembalikan apa adanya agar tidak diproses ulang.
 */
export function gambarBerita(
  url: string | null | undefined,
  lebar: number,
): string | null {
  if (!url || !url.trim()) return null;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" || !HOST_GAMBAR.has(u.hostname)) return url;
  } catch {
    return url; // URL relatif (aset lokal) -> apa adanya
  }
  return `/api/gambar?url=${encodeURIComponent(url)}&w=${Math.round(lebar)}`;
}
