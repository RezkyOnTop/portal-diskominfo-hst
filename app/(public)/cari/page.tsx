import { Suspense } from "react";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { SearchBar } from "@/components/search/SearchBar";
import { Badge } from "@/components/ui/Badge";
import { cariGlobal } from "@/lib/services/search";
import { getKategori } from "@/lib/api/media-center";
import { formatDate } from "@/lib/utils/format";
import type { HasilCari } from "@/lib/services/search";

export const metadata = {
  title: "Pencarian",
  description:
    "Cari berita, pengumuman, dan halaman di portal Diskominfo SP Kabupaten Hulu Sungai Tengah.",
};

export const dynamic = "force-dynamic";

function kindLabel(k: HasilCari["kind"]): string {
  if (k === "berita") return "Berita";
  if (k === "pengumuman") return "Pengumuman";
  return "Halaman";
}

function kindTone(k: HasilCari["kind"]): "primary" | "accent" | "neutral" {
  if (k === "berita") return "primary";
  if (k === "pengumuman") return "accent";
  return "neutral";
}

export default async function CariPage({ searchParams }: PageProps<"/cari">) {
  const sp = await searchParams;
  const pick = (v: string | string[] | undefined) =>
    typeof v === "string" ? v : Array.isArray(v) ? v[0] : undefined;

  const q = pick(sp.q) ?? "";
  const jenisRaw = pick(sp.jenis);
  const jenis = jenisRaw
    ? (jenisRaw.split(",").filter((j) => ["berita", "pengumuman", "halaman"].includes(j)) as HasilCari["kind"][])
    : undefined;
  const kategori = pick(sp.kategori);
  const dari = pick(sp.dari);
  const sampai = pick(sp.sampai);

  let kategoriList: string[] = [];
  try {
    kategoriList = await getKategori();
  } catch {
    kategoriList = [];
  }

  const result = q.trim().length >= 2
    ? await cariGlobal({ q, jenis, kategori, dari, sampai })
    : null;

  return (
    <>
      <PageHeader
        title="Pencarian"
        eyebrow="Telusuri Portal"
        crumbs={[{ label: "Pencarian" }]}
      >
        {result
          ? `Ditemukan ${result.total} hasil untuk “${q}”${
              result.degraded ? " (sebagian sumber sedang tidak tersedia)" : ""
            }.`
          : "Cari berita, pengumuman, dan halaman dalam satu tempat."}
      </PageHeader>

      <Container className="py-10">
        <Suspense fallback={<div className="h-32 animate-pulse rounded-[var(--radius-card)] bg-neutral-100" />}>
          <SearchBar
            kategoriList={kategoriList}
            initialQ={q}
            initialJenis={jenis ?? []}
            initialKategori={kategori ?? ""}
            initialDari={dari ?? ""}
            initialSampai={sampai ?? ""}
          />
        </Suspense>

        {result && result.total > 0 ? (
          <p className="mt-6 text-sm text-neutral-600">
            {result.counts.berita} berita · {result.counts.pengumuman} pengumuman ·{" "}
            {result.counts.halaman} halaman
          </p>
        ) : null}

        <div className="mt-6">
          {!result ? (
            <p className="rounded-[var(--radius-card)] border border-dashed border-neutral-200 bg-white p-10 text-center text-neutral-600">
              Masukkan kata kunci minimal 2 karakter untuk mulai mencari.
            </p>
          ) : result.total === 0 ? (
            <div className="rounded-[var(--radius-card)] border border-dashed border-neutral-200 bg-white p-10 text-center">
              <p className="font-semibold text-neutral-900">
                Tidak ada hasil untuk “{q}”.
              </p>
              <p className="mt-2 text-sm text-neutral-600">
                Coba kata kunci lain, kurangi filter, atau{" "}
                <Link href="/berita" className="font-semibold text-primary-700 hover:underline">
                  jelajahi semua berita
                </Link>
                .
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {result.data.map((h) => (
                <li key={h.id}>
                  <article className="rounded-[var(--radius-card)] border border-neutral-200 bg-white p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)]">
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge tone={kindTone(h.kind)}>{kindLabel(h.kind)}</Badge>
                      {h.category ? (
                        <span className="text-xs font-medium text-neutral-500">{h.category}</span>
                      ) : null}
                      {h.publishedAt ? (
                        <time dateTime={h.publishedAt} className="text-xs text-neutral-500">
                          {formatDate(h.publishedAt)}
                        </time>
                      ) : null}
                    </div>
                    <h2 className="mt-2 font-heading text-lg font-semibold leading-snug text-neutral-900">
                      <Link href={h.href} className="hover:text-primary-700">
                        {h.title}
                      </Link>
                    </h2>
                    {h.excerpt ? (
                      <p className="mt-1.5 line-clamp-2 text-sm text-neutral-600">{h.excerpt}</p>
                    ) : null}
                  </article>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
    </>
  );
}
