import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata = {
  title: "Klarifikasi Hoaks",
  description:
    "Klarifikasi dan verifikasi informasi hoaks di Kabupaten Hulu Sungai Tengah.",
};

// Halaman ini TIDAK mengambil data dari API: kanal khusus hoaks belum ada
// (endpoint `/api/hoaks` tidak tersedia — lihat getHoaks). Mengambil feed
// berita penuh (~3,5 MB, ~4 detik) hanya untuk menampilkan "belum ada" adalah
// pemborosan yang membuat navigasi terasa macet. Begitu kanal tersedia,
// cukup panggil getHoaks() lagi — UI daftar di bawah sudah siap.
export default function HoaksPage() {
  return (
    <>
      <PageHeader
        title="Klarifikasi Hoaks"
        eyebrow="Informasi"
        crumbs={[{ label: "Klarifikasi Hoaks" }]}
      >
        Verifikasi dan bantahan resmi atas informasi yang beredar di masyarakat.
        Sumber: Media Center HST.
      </PageHeader>
      <Container className="py-10">
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
      </Container>
    </>
  );
}
