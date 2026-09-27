/**
 * Helper format tanggal untuk locale Indonesia (id-ID).
 * Menerima string ISO atau format Media Center "YYYY-MM-DD HH:mm:ss".
 * Mengembalikan "-" bila input tidak valid agar UI tidak menampilkan "Invalid Date".
 */
export function formatDate(input: string | Date | null | undefined): string {
  if (!input) return "-";
  const normalized =
    typeof input === "string" && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(input)
      ? input.replace(" ", "T")
      : input;
  const date = normalized instanceof Date ? normalized : new Date(normalized);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** Format tanggal + waktu (untuk meta halaman detail). */
export function formatDateTime(input: string | Date | null | undefined): string {
  if (!input) return "-";
  const normalized =
    typeof input === "string" && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(input)
      ? input.replace(" ", "T")
      : input;
  const date = normalized instanceof Date ? normalized : new Date(normalized);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Format tanggal kegiatan (date-only) dengan acuan UTC.
 *
 * Tanggal kegiatan disimpan sebagai tengah malam UTC (lihat
 * lib/services/reservation.ts). Memformatnya dengan zona waktu server akan
 * menggeser tanggal saat server ber-offset negatif, jadi paksa timeZone UTC.
 */
export function formatDateUtc(input: string | Date | null | undefined): string {
  if (!input) return "-";
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** Perkiraan waktu baca dari konten HTML (menit). */
export function readingTimeMinutes(html: string | null | undefined): number {
  if (!html) return 1;
  const text = html.replace(/<[^>]+>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Bersihkan HTML dari tag untuk keperluan excerpt/plain text. */
export function stripHtml(html: string | null | undefined, maxLength = 200): string {
  if (!html) return "";
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}…` : text;
}
