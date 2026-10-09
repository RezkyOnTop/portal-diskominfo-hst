/**
 * Sanitasi HTML konten berita (berasal dari API Media Center HST).
 * Pendekatan ringan tanpa dependensi tambahan: membuang elemen berbahaya dan
 * atribut event. Untuk produksi dengan risiko lebih tinggi, ganti dengan
 * `sanitize-html`/`DOMPurify` (lihat SECURITY.md).
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return "";
  let out = html;
  // Buang blok script/style/iframe/object/embed beserta isinya.
  out = out.replace(/<(script|style|iframe|object|embed|form)[\s\S]*?<\/\1>/gi, "");
  out = out.replace(/<(script|style|iframe|object|embed|form)[^>]*\/?>/gi, "");
  // Buang atribut event (on*) dan atribut berbahaya.
  out = out.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  out = out.replace(/\sstyle\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  // Netralkan protokol berbahaya pada href/src.
  out = out.replace(/(href|src)\s*=\s*("|')?\s*javascript:[^"'>\s]*("|')?/gi, '$1="#"');
  // Tambahkan rel aman untuk tautan keluar.
  out = out.replace(
    /<a\s+([^>]*href="https?:\/\/[^"]*"[^>]*)>/gi,
    (_m, attrs: string) =>
      `<a ${attrs}${/\btarget=/.test(attrs) ? "" : ' target="_blank"'} rel="noopener noreferrer">`,
  );
  return out;
}

/** Batas panjang pesan chat (karakter) — hemat token + tahan penyalahgunaan. */
export const CHAT_MAX_INPUT = 1000;

/**
 * Sanitasi pesan chat: buang blok script/style beserta isi, semua tag HTML,
 * protokol javascript:, lalu runtuhkan whitespace dan batasi panjang.
 *
 * Dipakai di DUA sisi (klien sebelum kirim + server sebelum ke AI) sebagai
 * pertahanan berlapis terhadap XSS dan prompt injection.
 */
export function bersihkanPesanChat(raw: string, maks = CHAT_MAX_INPUT): string {
  let out = String(raw ?? "");
  out = out.replace(/<(script|style)[\s\S]*?<\/\1>/gi, "");
  out = out.replace(/<[^>]*>/g, "");
  out = out.replace(/javascript:/gi, "");
  out = out.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
  if (out.length > maks) out = out.slice(0, maks);
  return out;
}
