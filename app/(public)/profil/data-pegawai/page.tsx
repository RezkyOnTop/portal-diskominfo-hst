import type { Metadata } from "next";
import Image from "next/image";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/layout/Container";
import { listStaffPublik } from "@/lib/services/staff";
import { UNIT_PEGAWAI } from "@/lib/validations/local.schema";

export const metadata: Metadata = {
  title: "Data Pegawai",
  description:
    "Daftar nama, jabatan, dan foto pegawai Dinas Komunikasi, Informatika, Statistik dan Persandian Kabupaten Hulu Sungai Tengah.",
};

export const revalidate = 3600;

/** Ambil 1–2 huruf awal nama sebagai avatar default. */
function inisial(nama: string): string {
  const kata = nama.replace(/,.*$/, "").trim().split(/\s+/).filter(Boolean);
  if (kata.length === 1) return (kata[0] ?? "?").slice(0, 2).toUpperCase();
  return `${(kata[0] ?? "?")[0]}${(kata[1] ?? "?")[0]}`.toUpperCase();
}

export default async function DataPegawaiPage({
  searchParams,
}: {
  searchParams: Promise<{ cari?: string; unit?: string }>;
}) {
  const sp = await searchParams;
  const cari = (sp.cari ?? "").trim().toLowerCase();
  const unitAktif = UNIT_PEGAWAI.includes(sp.unit as (typeof UNIT_PEGAWAI)[number])
    ? (sp.unit as (typeof UNIT_PEGAWAI)[number])
    : undefined;

  let semua = await listStaffPublik();
  if (unitAktif) semua = semua.filter((p) => p.unit === unitAktif);
  if (cari) {
    semua = semua.filter(
      (p) =>
        p.nama.toLowerCase().includes(cari) ||
        p.jabatan.toLowerCase().includes(cari) ||
        (p.nip ?? "").toLowerCase().includes(cari),
    );
  }
  const total = semua.length;

  return (
    <>
      <PageHeader
        title="Data Pegawai"
        eyebrow="Profil"
        crumbs={[{ label: "Profil" }, { label: "Data Pegawai" }]}
      >
        Kenali aparatur Diskominfo SP HST — nama, jabatan, dan foto seluruh
        pegawai yang melayani masyarakat.
      </PageHeader>
      <Container className="py-12">
        {/* Pencarian + filter unit */}
        <form
          method="get"
          role="search"
          aria-label="Cari pegawai"
          className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-[var(--shadow-card)] sm:flex-row dark:border-neutral-800 dark:bg-neutral-900"
        >
          <label htmlFor="cari-pegawai" className="sr-only">
            Cari nama, jabatan, atau NIP
          </label>
          <input
            id="cari-pegawai"
            name="cari"
            type="search"
            defaultValue={sp.cari ?? ""}
            placeholder="Cari nama, jabatan, atau NIP…"
            className="min-w-0 flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
          />
          <label htmlFor="filter-unit" className="sr-only">
            Saring berdasarkan unit
          </label>
          <select
            id="filter-unit"
            name="unit"
            defaultValue={sp.unit ?? ""}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
          >
            <option value="">Semua unit</option>
            {UNIT_PEGAWAI.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Cari
          </button>
        </form>

        <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400" role="status" aria-live="polite">
          {cari || unitAktif ? (
            <>
              Menampilkan <strong>{total} pegawai</strong>
              {unitAktif ? (
                <>
                  {" "}pada unit <strong>{unitAktif}</strong>
                </>
              ) : null}
              {cari ? (
                <>
                  {" "}untuk pencarian <strong>&ldquo;{sp.cari}&rdquo;</strong>
                </>
              ) : null}
              .{" "}
              <a href="/profil/data-pegawai" className="font-semibold text-primary-700 underline dark:text-primary-300">
                Tampilkan semua
              </a>
            </>
          ) : (
            <>
              Menampilkan <strong>{total} pegawai</strong> pada {UNIT_PEGAWAI.length} kelompok.
            </>
          )}
        </p>

        {UNIT_PEGAWAI.filter((u) => !unitAktif || u === unitAktif).map((unit) => {
          const anggota = semua.filter((p) => p.unit === unit);
          if (anggota.length === 0) return null;
          return (
            <section key={unit} aria-label={unit} className="mt-10">
              <h2 className="font-heading text-xl font-extrabold text-neutral-900 dark:text-white">
                {unit}{" "}
                <span className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                  ({anggota.length} orang)
                </span>
              </h2>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {anggota.map((p) => (
                  <li
                    key={p.id}
                    className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[var(--shadow-card)] dark:border-neutral-800 dark:bg-neutral-900"
                  >
                    <div className="relative aspect-square w-full bg-gradient-to-br from-primary-100 via-primary-50 to-secondary-100 dark:from-primary-900/40 dark:via-neutral-800 dark:to-secondary-900/40">
                      {p.fotoUrl ? (
                        <Image
                          src={p.fotoUrl}
                          alt={`Foto ${p.nama}`}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover"
                        />
                      ) : (
                        <div
                          aria-hidden="true"
                          className="flex h-full w-full items-center justify-center font-heading text-5xl font-extrabold text-primary-700/80 dark:text-primary-300/80"
                        >
                          {inisial(p.nama)}
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="font-heading text-sm font-bold leading-snug text-neutral-900 dark:text-white">
                        {p.nama}
                      </p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-primary-700 dark:text-primary-300">
                        {p.jabatan}
                      </p>
                      {p.nip ? (
                        <p className="mt-1 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                          NIP. {p.nip}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs italic text-neutral-400 dark:text-neutral-500">
                          NIP belum tersedia
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        {total === 0 ? (
          <p className="mt-10 rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
            Tidak ada pegawai yang cocok dengan pencarian.{" "}
            <a href="/profil/data-pegawai" className="font-semibold text-primary-700 underline dark:text-primary-300">
              Tampilkan semua pegawai
            </a>
            .
          </p>
        ) : null}
      </Container>
    </>
  );
}
