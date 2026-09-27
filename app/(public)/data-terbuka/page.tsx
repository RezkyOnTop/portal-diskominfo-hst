import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { getDatasets, openDataBaseUrl } from "@/lib/api/opendata";

export const metadata: Metadata = {
  title: "Data Terbuka (Open Data)",
  description:
    "Katalog dataset terbuka Kabupaten Hulu Sungai Tengah — terintegrasi langsung dengan portal Open Data HST (opendata.hstkab.go.id).",
};

export const dynamic = "force-dynamic";

const PER_PAGE = 12;

/** Label jenis berkas dataset dengan ikon. */
function labelJenis(jenis: string): string {
  const j = jenis.toLowerCase();
  if (j.includes("xls") || j.includes("excel")) return "XLSX";
  if (j.includes("csv")) return "CSV";
  if (j.includes("pdf")) return "PDF";
  if (j.includes("json")) return "JSON";
  if (j.includes("shp") || j.includes("geojson")) return "GIS";
  return jenis.toUpperCase() || "DATA";
}

export default async function DataTerbukaPage({
  searchParams,
}: PageProps<"/data-terbuka">) {
  const sp = await searchParams;
  const ambil = (k: string) => {
    const v = Array.isArray(sp[k]) ? sp[k][0] : sp[k];
    return typeof v === "string" && v.trim() ? v.trim() : undefined;
  };

  const page = Math.max(1, Number(ambil("page")) || 1);
  const kategori = ambil("kategori");
  const search = ambil("search");
  const tahun = ambil("tahun");

  const result = await getDatasets({
    page,
    limit: PER_PAGE,
    kategori,
    search,
    tahun,
  });

  const makeHref = (p: number) => {
    const params = new URLSearchParams();
    if (p > 1) params.set("page", String(p));
    if (kategori) params.set("kategori", kategori);
    if (search) params.set("search", search);
    if (tahun) params.set("tahun", tahun);
    const qs = params.toString();
    return qs ? `/data-terbuka?${qs}` : "/data-terbuka";
  };

  const kategoriList = result.filters.kategori;

  return (
    <>
      <PageHeader
        title="Data Terbuka Kabupaten HST"
        eyebrow="Open Data"
        crumbs={[{ label: "Data Terbuka" }]}
      >
        Katalog dataset terbuka yang dikelola instansi di lingkungan Pemerintah
        Kabupaten Hulu Sungai Tengah. Data ditarik langsung dari portal resmi{" "}
        <a
          href={openDataBaseUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-white underline decoration-white/40 underline-offset-2 hover:decoration-white"
        >
          opendata.hstkab.go.id ↗
        </a>
        .
      </PageHeader>

      <Container className="py-10">
        {/* Pencarian & filter */}
        <form method="get" className="flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            name="search"
            defaultValue={search ?? ""}
            placeholder="Cari dataset… (mis. penduduk, kesehatan)"
            className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          <select
            name="tahun"
            defaultValue={tahun ?? ""}
            aria-label="Filter tahun"
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="">Semua tahun</option>
            {["2026", "2025", "2024", "2023"].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
          >
            Cari
          </button>
        </form>

        {/* Filter kategori */}
        {kategoriList.length > 0 ? (
          <nav aria-label="Filter kategori" className="mt-5 flex flex-wrap gap-2">
            <Link
              href={search ? `/data-terbuka?search=${encodeURIComponent(search)}` : "/data-terbuka"}
              aria-current={!kategori ? "page" : undefined}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                !kategori
                  ? "bg-primary-600 text-white"
                  : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              }`}
            >
              Semua
            </Link>
            {kategoriList.map((c) => {
              const params = new URLSearchParams();
              params.set("kategori", c);
              if (search) params.set("search", search);
              if (tahun) params.set("tahun", tahun);
              return (
                <Link
                  key={c}
                  href={`/data-terbuka?${params.toString()}`}
                  aria-current={kategori === c ? "page" : undefined}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                    kategori === c
                      ? "bg-primary-600 text-white"
                      : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  }`}
                >
                  {c}
                </Link>
              );
            })}
          </nav>
        ) : null}

        {/* Info hasil */}
        <p className="mt-6 text-sm text-neutral-600 dark:text-slate-400">
          {result.degraded ? (
            <span className="text-danger-600">
              Portal Open Data sedang tidak dapat dihubungi — menampilkan hasil
              terakhir yang tersimpan.
            </span>
          ) : (
            <>
              Menampilkan <strong>{result.data.length}</strong> dari{" "}
              <strong>{result.meta.total.toLocaleString("id-ID")}</strong> dataset
              {kategori ? ` kategori “${kategori}”` : ""}
              {search ? ` untuk “${search}”` : ""}.
            </>
          )}
        </p>

        {/* Grid dataset */}
        <div className="mt-6">
          {result.data.length === 0 ? (
            <div className="rounded-[var(--radius-card)] border border-dashed border-neutral-200 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
              <p className="text-neutral-600 dark:text-slate-300">
                Tidak ada dataset yang cocok dengan pencarian ini.
              </p>
              <a
                href={openDataBaseUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm font-semibold text-primary-700 hover:underline dark:text-primary-300"
              >
                Buka portal Open Data HST ↗
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {result.data.map((d) => (
                <a
                  key={d.id}
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col rounded-[var(--radius-card)] border border-neutral-200 bg-white p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-primary-50 px-2 py-0.5 text-[11px] font-bold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                      {labelJenis(d.jenisData)}
                    </span>
                    <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600 dark:bg-slate-800 dark:text-slate-400">
                      {d.kategori}
                    </span>
                    {d.tahun ? (
                      <span className="text-[11px] font-semibold text-neutral-500 dark:text-slate-400">
                        {d.tahun}
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mt-3 font-heading text-sm font-bold leading-snug text-neutral-900 group-hover:text-primary-700 dark:text-slate-50 dark:group-hover:text-primary-300">
                    {d.judul}
                  </h3>

                  {d.deskripsi ? (
                    <p className="mt-2 line-clamp-3 flex-1 text-xs leading-relaxed text-neutral-600 dark:text-slate-400">
                      {d.deskripsi}
                    </p>
                  ) : (
                    <div className="flex-1" />
                  )}

                  <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3 text-[11px] text-neutral-500 dark:border-slate-800 dark:text-slate-400">
                    <span className="truncate pr-2" title={d.instansi}>
                      {d.instansi}
                    </span>
                    <span className="shrink-0 font-semibold text-primary-700 dark:text-primary-300">
                      Lihat ↗
                    </span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        {!result.degraded && result.meta.totalPages > 1 ? (
          <Pagination
            page={result.meta.page}
            totalPages={result.meta.totalPages}
            makeHref={makeHref}
          />
        ) : null}

        {/* Ajakan ke portal */}
        <div className="mt-10 rounded-[var(--radius-card)] border border-neutral-200 bg-mesh p-6 text-white dark:border-slate-700">
          <h2 className="font-heading text-lg font-bold">
            Butuh data lain atau API resmi?
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-neutral-300">
            Portal Open Data HST menyediakan katalog lengkap, visualisasi, serta
            dokumentasi API publik untuk pengembang.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={openDataBaseUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-primary-700 transition hover:bg-neutral-100"
            >
              Jelajahi Portal Open Data ↗
            </a>
            <a
              href={`${openDataBaseUrl()}/integrasi-api`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-white/30 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Dokumentasi API ↗
            </a>
          </div>
        </div>
      </Container>
    </>
  );
}
