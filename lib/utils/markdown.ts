/**
 * lib/utils/markdown.ts — render Markdown SEBAGAI TEKS AMAN.
 *
 * Pendekatan: ESCAPE seluruh HTML lebih dulu, lalu terapkan penanda markdown
 * terbatas (bold, italic, kode inline, tautan http/https, daftar). Karena
 * HTML sudah di-escape, tidak ada tag mentah dari AI yang bisa dieksekusi —
 * mencegah XSS. Hasilnya string HTML aman untuk dangerouslySetInnerHTML.
 */

/** Escape karakter HTML agar tidak bisa menjadi tag. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Format inline: kode, bold, italic, tautan. Input SUDAH ter-escape. */
function inline(teks: string): string {
  let out = teks;
  // Kode inline `...`
  out = out.replace(/`([^`]+)`/g, '<code class="rounded bg-neutral-100 px-1 py-0.5 text-[0.85em] dark:bg-neutral-800">$1</code>');
  // Bold **...** / __...__
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  // Italic *...* / _..._
  out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  // Tautan markdown [teks](url) — hanya http/https.
  out = out.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="font-medium text-primary-700 underline dark:text-primary-400">$1</a>',
  );
  // Tautan polos http(s) (yang belum menjadi href).
  out = out.replace(
    /(^|[\s(])(https?:\/\/[^\s<)]+)/g,
    '$1<a href="$2" target="_blank" rel="noopener noreferrer" class="font-medium text-primary-700 underline dark:text-primary-400">$2</a>',
  );
  // Rute internal portal (/reservasi dsb.) dijadikan tautan bila berdiri sendiri.
  out = out.replace(
    /(^|\s)(\/(?:reservasi|reservasi\/status|layanan|berita|pengumuman|hoaks|survei|data-terbuka|kontak|radio|cari|profil(?:\/[\w-]+)?))(?=[\s.,)]|$)/g,
    '$1<a href="$2" class="font-medium text-primary-700 underline dark:text-primary-400">$2</a>',
  );
  return out;
}

/**
 * Ubah markdown sederhana menjadi HTML aman.
 * Blok yang didukung: daftar (- / * / 1.), paragraf, baris kosong.
 */
export function markdownAman(md: string | null | undefined): string {
  if (!md) return "";
  const aman = escapeHtml(String(md)).replace(/\r\n/g, "\n");
  const baris = aman.split("\n");
  const keluar: string[] = [];
  let dalamDaftar = false;

  const tutupDaftar = () => {
    if (dalamDaftar) {
      keluar.push("</ul>");
      dalamDaftar = false;
    }
  };

  for (const b of baris) {
    const t = b.trim();
    if (!t) {
      tutupDaftar();
      continue;
    }
    const mBullet = /^[-*]\s+(.*)$/.exec(t);
    const mNomor = /^\d+[.)]\s+(.*)$/.exec(t);
    if (mBullet || mNomor) {
      if (!dalamDaftar) {
        keluar.push('<ul class="ml-4 list-disc space-y-0.5">');
        dalamDaftar = true;
      }
      keluar.push(`<li>${inline((mBullet ?? mNomor)![1]!)}</li>`);
      continue;
    }
    tutupDaftar();
    keluar.push(`<p>${inline(t)}</p>`);
  }
  tutupDaftar();
  return keluar.join("");
}
