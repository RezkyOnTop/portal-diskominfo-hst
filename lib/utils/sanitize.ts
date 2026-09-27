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
