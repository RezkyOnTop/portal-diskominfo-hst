import { SectionHeading } from "@/components/ui/SectionHeading";
import { countHeroSlide, listHeroSlideAdmin } from "@/lib/services/hero";
import { HeroCreateForm, HeroDirectory } from "./HeroForms";

export const dynamic = "force-dynamic";
export const metadata = { title: "Slideshow Hero" };

export default async function HeroAdminPage() {
  const [rows, counts] = await Promise.all([listHeroSlideAdmin(), countHeroSlide()]);
  const tersembunyi = rows.length - counts.aktif;

  return (
    <div className="space-y-6">
      <SectionHeading as="h1">Slideshow Hero</SectionHeading>
      <p className="text-sm text-neutral-600 dark:text-slate-400">
        Foto-foto slideshow di beranda. Tampil di halaman utama{" "}
        <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">/</code>.
        Slide tanpa foto dilewati di slideshow — unggah fotonya lewat tombol{" "}
        <strong>Ubah</strong>. Foto disarankan lanskap (maksimal 4 MB, JPG/PNG/WEBP).
      </p>

      {/* Kartu ringkasan */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Kartu label="Total slide" nilai={counts.total} />
        <Kartu label="Tampil di beranda" nilai={counts.aktif} />
        <Kartu label="Disembunyikan" nilai={tersembunyi} />
      </div>

      <HeroCreateForm />

      {/* Daftar ringkas + dialog ubah per slide */}
      <section aria-label="Daftar slide hero">
        <HeroDirectory rows={rows} />
      </section>
    </div>
  );
}

function Kartu({ label, nilai }: { label: string; nilai: number }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-neutral-200 bg-white p-4 shadow-[var(--shadow-card)] dark:border-slate-700 dark:bg-slate-900">
      <p className="text-xs text-neutral-600 dark:text-slate-400">{label}</p>
      <p className="mt-1 font-heading text-2xl font-bold text-neutral-900 dark:text-slate-50">
        {nilai.toLocaleString("id-ID")}
      </p>
    </div>
  );
}
