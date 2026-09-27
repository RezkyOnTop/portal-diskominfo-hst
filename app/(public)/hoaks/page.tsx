import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { HoaxBadge } from "@/components/news/HoaxBadge";
import { ApiErrorFallback } from "@/components/news/ApiErrorFallback";
import { getHoaks } from "@/lib/api/media-center";
import { formatDate, stripHtml } from "@/lib/utils/format";
import type { Hoaks, PaginatedResponse } from "@/types/media-center";

export const metadata = {
  title: "Klarifikasi Hoaks",
  description:
    "Klarifikasi dan verifikasi informasi hoaks di Kabupaten Hulu Sungai Tengah.",
};

export const dynamic = "force-dynamic";

export default async function HoaksPage() {
  let result: PaginatedResponse<Hoaks> | null = null;
  try {
    result = await getHoaks({ limit: 12 });
  } catch {
    result = null;
  }

  return (
    <Container className="py-10">
      <SectionHeading as="h1">Klarifikasi Hoaks</SectionHeading>
      <p className="mt-1 max-w-2xl text-sm text-neutral-600">
        Verifikasi dan bantahan resmi atas informasi yang beredar di masyarakat.
        Sumber: Media Center HST.
      </p>

      {result === null ? (
        <div className="mt-8">
          <ApiErrorFallback />
        </div>
      ) : result.data.length === 0 ? (
        <div className="mt-8 rounded-[var(--radius-card)] border border-dashed border-neutral-200 bg-white p-10 text-center">
          <p className="font-medium text-neutral-900">
            Belum ada klarifikasi hoaks yang dipublikasikan.
          </p>
          <p className="mt-2 text-sm text-neutral-600">
            Saat ini API Media Center HST belum menyediakan kanal khusus hoaks
            (endpoint <code>/api/hoaks</code>). Halaman ini otomatis menampilkan
            data begitu kanal tersebut tersedia — tanpa perubahan UI.
          </p>
          <Link
            href="/berita"
            className="mt-4 inline-block text-sm font-semibold text-primary-700 hover:underline"
          >
            Lihat berita resmi →
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {result.data.map((h) => (
            <li
              key={h.id}
              className="rounded-[var(--radius-card)] border border-neutral-200 bg-white p-5 shadow-[var(--shadow-card)]"
            >
              <div className="flex items-center gap-3">
                <HoaxBadge status={h.status} />
                <time dateTime={h.publishedAt} className="text-xs text-neutral-600">
                  {formatDate(h.publishedAt)}
                </time>
              </div>
              <h2 className="mt-3 font-heading text-lg font-semibold text-neutral-900">
                <Link href={`/berita/${h.slug}`} className="hover:text-primary-700">
                  {h.title}
                </Link>
              </h2>
              <p className="mt-2 text-sm text-neutral-600">
                {stripHtml(h.clarification, 220)}
              </p>
            </li>
          ))}
        </ul>
      )}
      {result ? (
        <p className="mt-8 text-center text-xs text-neutral-600">
          {result.meta.total} entri klarifikasi.
        </p>
      ) : null}
    </Container>
  );
}
