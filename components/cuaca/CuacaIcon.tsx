import type { CuacaSlot } from "@/lib/types/cuaca";

/**
 * Ikon cuaca inline (SVG) — sengaja TIDAK memakai gambar dari BMKG agar
 * widget tetap tampil walau host ikon BMKG tidak dapat dijangkau, dan agar
 * warnanya konsisten di mode terang maupun gelap.
 *
 * Pemetaan kode cuaca BMKG (weather):
 *   0        Cerah
 *   1,2      Cerah Berawan
 *   3,4      Berawan
 *   5,10,45  Kabut / Udara Kabur / Asap
 *   60,61,63,80,81,82  Hujan
 *   95,97,99 Hujan Petir
 */
type JenisIkon = "cerah" | "cerah-berawan" | "berawan" | "kabut" | "hujan" | "petir";

export function jenisIkon(kode: number): JenisIkon {
  if (kode === 0) return "cerah";
  if (kode === 1 || kode === 2) return "cerah-berawan";
  if (kode === 3 || kode === 4) return "berawan";
  if (kode === 5 || kode === 10 || kode === 45 || kode === 21) return "kabut";
  if (kode >= 95) return "petir";
  if (kode >= 60) return "hujan";
  return "berawan";
}

const PATHS: Record<JenisIkon, React.ReactNode> = {
  cerah: (
    <>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.2 5.2l1.9 1.9M16.9 16.9l1.9 1.9M18.8 5.2l-1.9 1.9M7.1 16.9l-1.9 1.9" />
    </>
  ),
  "cerah-berawan": (
    <>
      <circle cx="8" cy="8" r="3.2" />
      <path d="M8 1.8v1.8M1.8 8h1.8M3.6 3.6l1.3 1.3M12.4 3.6l-1.3 1.3" />
      <path d="M7 19.5h10a3.5 3.5 0 0 0 .2-7 4.8 4.8 0 0 0-9.2-1A3.6 3.6 0 0 0 7 19.5z" />
    </>
  ),
  berawan: (
    <path d="M6.5 19h11a3.8 3.8 0 0 0 .2-7.6 5.2 5.2 0 0 0-10-1.1A3.9 3.9 0 0 0 6.5 19z" />
  ),
  kabut: (
    <>
      <path d="M6 14h11a3.5 3.5 0 0 0 .2-7 4.8 4.8 0 0 0-9.2-1A3.6 3.6 0 0 0 6 14z" />
      <path d="M3 17.5h13M6 21h13" />
    </>
  ),
  hujan: (
    <>
      <path d="M6.5 15h11a3.8 3.8 0 0 0 .2-7.6 5.2 5.2 0 0 0-10-1.1A3.9 3.9 0 0 0 6.5 15z" />
      <path d="M8.5 18l-1 3M12.5 18l-1 3M16.5 18l-1 3" />
    </>
  ),
  petir: (
    <>
      <path d="M6.5 14.5h11a3.8 3.8 0 0 0 .2-7.6 5.2 5.2 0 0 0-10-1.1A3.9 3.9 0 0 0 6.5 14.5z" />
      <path d="M12.6 16.2l-2.4 4h3l-1.6 3.3 4.4-4.6h-2.8l1.2-2.7z" />
    </>
  ),
};

/** Ikon cuaca berbasis kode BMKG. */
export function CuacaIcon({
  kode,
  className,
}: {
  kode: number;
  className?: string;
}) {
  const jenis = jenisIkon(kode);
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role="img"
      aria-label={jenis}
    >
      {PATHS[jenis]}
    </svg>
  );
}

/** Label singkat jenis cuaca (untuk aria/alt teks). */
export function labelJenis(slot: CuacaSlot): string {
  return slot.deskripsi || "Tidak diketahui";
}
