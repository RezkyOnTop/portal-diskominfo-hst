import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { ApiErrorFallback } from "@/components/news/ApiErrorFallback";
import { getPengumuman } from "@/lib/api/media-center";
import { formatDate } from "@/lib/utils/format";
import { sanitizeHtml } from "@/lib/utils/sanitize";
import type { PaginatedResponse, Pengumuman } from "@/types/media-center";

const PER_PAGE = 10;

export const metadata = {
  title: "Pengumuman",
  description: "Pengumuman resmi Pemerintah Kabupaten Hulu Sungai Tengah.",
};

export const dynamic = "force-dynamic";

export default async function PengumumanPage({
  searchParams,
}: PageProps<"/pengumuman">) {
  const sp = await searchParams;
  const page = Math.max(1, Number(Array.isArray(sp.page) ? sp.page[0] : sp.page) || 1);

  let result: PaginatedResponse<Pengumuman> | null = null;
  try {
    result = await getPengumuman({ page, limit: PER_PAGE });
  } catch {
    result = null;
  }

  return (
    <Container className="py-10">
      <SectionHeading as="h1">Pengumuman Resmi</SectionHeading>
      <p className="mt-1 text-sm text-neutral-600">
        {result
          ? `Sumber: Media Center HST · ${result.meta.total} pengumuman.`
          : "Sumber: Media Center HST."}
      </p>

      {result === null ? (
        <div className="mt-8">
          <ApiErrorFallback />
        </div>
      ) : (
        <>
          <div className="mt-8 space-y-4">
            {result.data.length === 0 ? (
              <p className="rounded-[var(--radius-card)] border border-dashed border-neutral-200 bg-white p-10 text-center text-neutral-600">
                Belum ada pengumuman.
              </p>
            ) : (
              result.data.map((p) => (
                <article
                  key={p.id}
                  id={p.slug}
                  className="scroll-mt-24 rounded-[var(--radius-card)] border border-neutral-200 bg-white p-5 shadow-[var(--shadow-card)]"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge tone="accent">{formatDate(p.publishedAt)}</Badge>
                    {p.link ? <Badge tone="primary">Tautan Eksternal</Badge> : null}
                  </div>
                  <h2 className="mt-3 font-heading text-lg font-semibold text-neutral-900">
                    {p.title}
                  </h2>
                  <div
                    className="prose-berita mt-2 text-sm"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(p.body) }}
                  />
                  {p.link ? (
                    <a
                      href={p.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block text-sm font-semibold text-primary-700 hover:underline"
                    >
                      Buka tautan pengumuman ↗
                    </a>
                  ) : null}
                </article>
              ))
            )}
          </div>

          <Pagination
            page={result.meta.page}
            totalPages={result.meta.totalPages}
            makeHref={(p) => (p > 1 ? `/pengumuman?page=${p}` : "/pengumuman")}
          />
        </>
      )}

      <p className="mt-8 text-center text-xs text-neutral-600">
        Butuh informasi publik lebih lanjut?{" "}
        <Link href="https://ppid.hstkab.go.id/" className="underline">
          Kunjungi PPID HST
        </Link>
        .
      </p>
    </Container>
  );
}
