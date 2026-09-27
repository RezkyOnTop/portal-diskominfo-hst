import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/lib/config";

/** Section Profil Dinas — foto + ringkasan tugas & fungsi. */
export function ProfilSection() {
  return (
    <section className="bg-white py-16">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 lg:grid-cols-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-[var(--shadow-card)]">
          <Image
            src="/brand/profil-dinas.jpg"
            alt="Kantor Dinas Komunikasi, Informatika, Statistik dan Persandian HST"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">
            Profil Dinas
          </p>
          <h2 className="mt-2 font-heading text-2xl font-bold text-neutral-900 sm:text-3xl">
            Dinas Komunikasi, Informatika, Statistik dan Persandian
          </h2>
          <p className="mt-4 text-neutral-600">
            Diskominfo SP adalah perangkat daerah yang menyelenggarakan urusan
            pemerintahan di bidang komunikasi dan informatika, statistik, serta
            persandian di lingkungan Pemerintah Kabupaten Hulu Sungai Tengah.
          </p>
          <p className="mt-3 text-neutral-600">
            Kami berkomitmen menghadirkan layanan informasi publik yang cepat,
            transparan, dan akuntabel melalui kanal digital resmi {SITE.shortName}.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/profil/visi-misi"
              className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
            >
              Visi &amp; Misi
            </Link>
            <Link
              href="/profil/tugas-fungsi"
              className="rounded-lg border border-neutral-200 px-5 py-2.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
            >
              Tugas &amp; Fungsi
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
