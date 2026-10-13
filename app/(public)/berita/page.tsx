import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { NewsCard } from "@/components/news/NewsCard";
import { Pagination } from "@/components/ui/Pagination";
import { ApiErrorFallback } from "@/components/news/ApiErrorFallback";
import { getBerita, getKategori } from "@/lib/api/media-center";
import type { Berita, PaginatedResponse } from "@/lib/types/media-center";

const PER_PAGE = 9;

export const metadata = {
  title: "Berita",
  description:
    "Berita terbaru Kabupaten Hulu Sungai Tengah, bersumber dari Media Center HST.",
};

export const dynamic = "force-dynamic";

export default async function BeritaPage({ searchParams }: PageProps<"/berita">) {
  const sp = await searchParams;
  const page = Math.max(1, Number(Array.isArray(sp.page) ? sp.page[0] : sp.page) || 1);
  const kategoriRaw = Array.isArray(sp.kategori) ? sp.kategori[0] : sp.kategori;
  const kategori = typeof kategoriRaw === "string" ? kategoriRaw : undefined;

  let result: PaginatedResponse<Berita> | null = null;
  let categories: string[] = [];
  try {
    const [berita, cats] = await Promise.all([
      getBerita({ page, limit: PER_PAGE, category: kategori }),
      getKategori(),
    ]);
    result = berita;
    categories = cats;
  } catch {
    result = null;
  }

  const makeHref = (p: number) => {
    const params = new URLSearchParams();
    if (p > 1) params.set("page", String(p));
    if (kategori) params.set("kategori", kategori);
    const qs = params.toString();
    return qs ? `/berita?${qs}` : "/berita";
  };

  return (
    <>
      <PageHeader
        title="Berita Hulu Sungai Tengah"
        eyebrow="Berita"
        crumbs={[{ label: "Berita" }]}
      >
        {result
          ? `Sumber: Media Center HST. Total ${result.meta.total} berita${
              kategori ? ` dalam kategori “${kategori}”` : ""
            }.`
          : "Sumber: Media Center HST."}
      </PageHeader>
      <Container className="py-10">
      <nav aria-label="Filter kategori" className="flex flex-wrap gap-2">
        <Link
          href="/berita"
          aria-current={!kategori ? "page" : undefined}
          className={`rounded-full px-3 py-1.5 text-sm font-medium ${
            !kategori
              ? "bg-primary-600 text-white"
              : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
          }`}
        >
          Semua
        </Link>
        {categories.map((c) => (
          <Link
            key={c}
            href={`/berita?kategori=${encodeURIComponent(c)}`}
            aria-current={kategori === c ? "page" : undefined}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              kategori === c
                ? "bg-primary-600 text-white"
                : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
            }`}
          >
            {c}
          </Link>
        ))}
      </nav>

      <div className="mt-8">
        {result === null ? (
          <ApiErrorFallback />
        ) : result.data.length === 0 ? (
          <p className="rounded-[var(--radius-card)] border border-dashed border-neutral-200 bg-white p-10 text-center text-neutral-600">
            Tidak ada berita untuk filter ini.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {result.data.map((b, i) => (
              <NewsCard key={b.id} berita={b} priority={i < 3} />
            ))}
          </div>
        )}
      </div>

      {result ? (
        <Pagination
          page={result.meta.page}
          totalPages={result.meta.totalPages}
          makeHref={makeHref}
        />
      ) : null}
      </Container>
    </>
  );
}
