import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils/format";
import type { Berita } from "@/types/media-center";

/**
 * NewsCard — kartu berita. Data berasal dari API Media Center HST (via adapter).
 * Gambar memakai next/image dengan domain yang diizinkan di next.config.ts.
 */
export function NewsCard({ berita, priority = false }: { berita: Berita; priority?: boolean }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-neutral-200 bg-white shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)]">
      <Link
        href={`/berita/${berita.slug}`}
        className="relative block aspect-[16/9] overflow-hidden bg-neutral-100"
        aria-label={`Baca berita: ${berita.title}`}
      >
        {berita.imageUrl ? (
          <Image
            src={berita.imageUrl}
            alt={berita.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority={priority}
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800 text-3xl font-bold text-white/80">
            HST
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center gap-3">
          <Badge tone="primary">{berita.category}</Badge>
          <time
            dateTime={berita.publishedAt}
            className="text-xs text-neutral-600"
          >
            {formatDate(berita.publishedAt)}
          </time>
        </div>
        <h3 className="text-lg font-semibold leading-snug text-neutral-900">
          <Link href={`/berita/${berita.slug}`} className="hover:text-primary-700">
            {berita.title}
          </Link>
        </h3>
        <p className="line-clamp-3 text-sm text-neutral-600">
          {berita.excerpt || stripContent(berita.content)}
        </p>
        <Link
          href={`/berita/${berita.slug}`}
          className="mt-auto text-sm font-semibold text-primary-700 hover:underline"
        >
          Baca selengkapnya →
        </Link>
      </div>
    </article>
  );
}

function stripContent(html: string): string {
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 160 ? `${text.slice(0, 160).trimEnd()}…` : text;
}
