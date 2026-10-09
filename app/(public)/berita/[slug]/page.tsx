import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/Badge";
import { getBeritaBySlug } from "@/lib/api/media-center";
import { formatDateTime, readingTimeMinutes } from "@/lib/utils/format";
import { gambarBerita } from "@/lib/utils/gambar";
import { sanitizeHtml } from "@/lib/utils/sanitize";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/berita/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const berita = await getBeritaBySlug(slug);
  if (!berita) return { title: "Berita tidak ditemukan" };
  return {
    title: berita.title,
    description: berita.content.replace(/<[^>]+>/g, " ").slice(0, 160),
    openGraph: {
      title: berita.title,
      type: "article",
      publishedTime: berita.publishedAt,
      images: berita.imageUrl ? [{ url: berita.imageUrl }] : undefined,
    },
  };
}

export default async function BeritaDetailPage({ params }: PageProps<"/berita/[slug]">) {
  const { slug } = await params;
  const berita = await getBeritaBySlug(slug);
  if (!berita) notFound();

  const menit = readingTimeMinutes(berita.content);

  return (
    <Container className="py-10">
      <article className="mx-auto max-w-3xl">
        <nav aria-label="Breadcrumb" className="text-sm text-neutral-600">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link href="/" className="hover:text-primary-700">
                Beranda
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/berita" className="hover:text-primary-700">
                Berita
              </Link>
            </li>
          </ol>
        </nav>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Badge tone="primary">{berita.category}</Badge>
          <time dateTime={berita.publishedAt} className="text-sm text-neutral-600">
            {formatDateTime(berita.publishedAt)}
          </time>
          <span className="text-sm text-neutral-600">· {menit} menit baca</span>
        </div>

        <h1 className="mt-3 font-heading text-3xl font-bold leading-tight text-neutral-900 sm:text-4xl">
          {berita.title}
        </h1>

        {berita.imageUrl ? (
          <figure className="mt-6 overflow-hidden rounded-[var(--radius-card)] border border-neutral-200">
            <Image
              src={gambarBerita(berita.imageUrl, 1200)!}
              alt={berita.title}
              width={1200}
              height={675}
              className="h-auto w-full object-cover"
              priority
              unoptimized
            />
          </figure>
        ) : null}

        <div
          className="prose-berita mt-8"
          // Konten resmi dari Media Center HST; disanitasi sebelum render.
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(berita.content) }}
        />

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-neutral-200 pt-6 text-sm text-neutral-600">
          <span>
            Sumber resmi:{" "}
            <a
              href={berita.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary-700 hover:underline"
            >
              Media Center HST ↗
            </a>
          </span>
          <Link href="/berita" className="font-semibold text-primary-700 hover:underline">
            ← Kembali ke daftar berita
          </Link>
        </footer>
      </article>
    </Container>
  );
}
