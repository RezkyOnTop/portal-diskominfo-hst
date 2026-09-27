import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils/format";
import type { Berita } from "@/types/media-center";

function excerpt(b: Berita): string {
  const raw = b.excerpt || b.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const t = raw.trim();
  return t.length > 150 ? `${t.slice(0, 150).trimEnd()}…` : t;
}

/**
 * BentoBerita — grid bento asimetris: satu berita utama besar + kartu kecil.
 * Layout khas yang tidak dipakai situs lama.
 */
export function BentoBerita({ items }: { items: Berita[] }) {
  if (items.length === 0) return null;
  const [lead, ...rest] = items;
  const others = rest.slice(0, 4);

  return (
    <div className="grid gap-5 lg:grid-cols-3 lg:grid-rows-2">
      {/* Kartu utama */}
      <article className="group relative overflow-hidden rounded-[var(--radius-card)] border border-neutral-200 bg-neutral-900 lg:col-span-2 lg:row-span-2">
        <Link href={`/berita/${lead!.slug}`} className="block h-full">
          <div className="relative h-full min-h-[320px] w-full">
            {lead!.imageUrl ? (
              <Image
                src={lead!.imageUrl}
                alt={lead!.title}
                fill
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                priority
                unoptimized
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary-700 to-neutral-900" />
            )}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent"
            />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-primary-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                  Utama
                </span>
                <span className="text-xs text-neutral-300">
                  {formatDate(lead!.publishedAt)}
                </span>
              </div>
              <h3 className="mt-3 font-heading text-xl font-bold leading-snug text-white sm:text-2xl">
                {lead!.title}
              </h3>
              <p className="mt-2 hidden max-w-2xl text-sm text-neutral-300 sm:block">
                {excerpt(lead!)}
              </p>
            </div>
          </div>
        </Link>
      </article>

      {/* Kartu kecil */}
      {others.map((b) => (
        <article
          key={b.id}
          className="group flex gap-4 rounded-[var(--radius-card)] border border-neutral-200 bg-white p-3 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
        >
          <Link
            href={`/berita/${b.slug}`}
            className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-neutral-100"
            aria-label={b.title}
          >
            {b.imageUrl ? (
              <Image
                src={b.imageUrl}
                alt={b.title}
                fill
                sizes="96px"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                unoptimized
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary-600 to-primary-800" />
            )}
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Badge tone="primary">{b.category}</Badge>
            </div>
            <h3 className="mt-1.5 line-clamp-2 text-sm font-semibold leading-snug text-neutral-900">
              <Link href={`/berita/${b.slug}`} className="hover:text-primary-700">
                {b.title}
              </Link>
            </h3>
            <time
              dateTime={b.publishedAt}
              className="mt-1 block text-[11px] text-neutral-500"
            >
              {formatDate(b.publishedAt)}
            </time>
          </div>
        </article>
      ))}
    </div>
  );
}
