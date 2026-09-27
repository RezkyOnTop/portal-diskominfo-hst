import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { GaleriTabs } from "@/components/galeri/GaleriTabs";
import { Pagination } from "@/components/ui/Pagination";
import { getGaleri } from "@/lib/services/galeri";
import { getVideo } from "@/lib/api/media-center-video";

const PER_PAGE = 12;

export const metadata = {
  title: "Galeri Foto & Video",
  description:
    "Galeri foto kegiatan dan video resmi Kabupaten Hulu Sungai Tengah dari Media Center HST.",
};

export const dynamic = "force-dynamic";

export default async function GaleriPage({ searchParams }: PageProps<"/galeri">) {
  const sp = await searchParams;
  const pick = (v: string | string[] | undefined) =>
    typeof v === "string" ? v : Array.isArray(v) ? v[0] : undefined;

  const page = Math.max(1, Number(pick(sp.page)) || 1);
  const album = pick(sp.album);

  const [galeri, video] = await Promise.all([
    getGaleri({ page, limit: PER_PAGE, album }),
    getVideo(12),
  ]);

  const makeHref = (p: number) => {
    const params = new URLSearchParams();
    if (p > 1) params.set("page", String(p));
    if (album) params.set("album", album);
    const qs = params.toString();
    return qs ? `/galeri?${qs}` : "/galeri";
  };

  return (
    <>
      <PageHeader title="Galeri Foto & Video" eyebrow="Galeri" crumbs={[{ label: "Galeri" }]}>
        {`${galeri.meta.total} foto dari arsip Media Center HST dan ${video.length} video resmi dari kanal YouTube Media Center HST.`}
      </PageHeader>

      <Container className="py-10">
        <p className="mb-6 text-sm text-neutral-600">
          Menampilkan {galeri.data.length} dari {galeri.meta.total} foto
          {album ? ` dalam album “${album}”` : ""} · halaman {galeri.meta.page} dari{" "}
          {galeri.meta.totalPages}.
        </p>
        {/* Filter album foto */}
        {galeri.albums.length > 0 ? (
          <nav aria-label="Filter album" className="mb-6 flex flex-wrap gap-2">
            <Link
              href="/galeri"
              aria-current={!album ? "page" : undefined}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                !album
                  ? "bg-primary-600 text-white"
                  : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
              }`}
            >
              Semua Album
            </Link>
            {galeri.albums.map((a) => (
              <Link
                key={a}
                href={`/galeri?album=${encodeURIComponent(a)}`}
                aria-current={album === a ? "page" : undefined}
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                  album === a
                    ? "bg-primary-600 text-white"
                    : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                {a}
              </Link>
            ))}
          </nav>
        ) : null}

        <GaleriTabs foto={galeri.data} video={video} />

        <Pagination page={galeri.meta.page} totalPages={galeri.meta.totalPages} makeHref={makeHref} />
      </Container>
    </>
  );
}
