import { CuacaIcon } from "@/components/cuaca/CuacaIcon";
import { getPrakiraanCuaca, bmkgPageUrl, slotTerdekat } from "@/lib/api/bmkg";
import { OFFICE_COORDS } from "@/lib/config";
import { cn } from "@/lib/utils/cn";

/**
 * Widget cuaca Barabai — data resmi BMKG (api.bmkg.go.id).
 *
 * Server Component: mengambil prakiraan saat render. Gagal upstream TIDAK
 * memecahkan halaman — widget menampilkan kartu fallback berisi tautan BMKG.
 *
 * Catatan wilayah: BMKG belum mendaftarkan kelurahan Benawa Tengah (lokasi
 * kantor). Titik terdekat yang tersedia adalah Barabai Darat (≈1,2 km),
 * dipakai sebagai representasi prakiraan wilayah kantor.
 */
export async function WeatherWidget({ className }: { className?: string } = {}) {
  const { data, degraded } = await getPrakiraanCuaca();

  if (!data || data.hari.length === 0) {
    return <CuacaFallback className={className} />;
  }

  const sekarang = slotTerdekat(data.hari);

  return (
    <section
      aria-labelledby="judul-cuaca"
      className={cn(
        "overflow-hidden rounded-[var(--radius-card)] border border-neutral-200 bg-white shadow-[var(--shadow-card)]",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-200 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">
            Cuaca
          </p>
          <h2
            id="judul-cuaca"
            className="mt-1 font-heading text-lg font-bold text-neutral-900"
          >
            Barabai, {data.kotkab}
          </h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            {data.desa} · Kec. {data.kecamatan}
          </p>
        </div>
        <span
          className="rounded-full bg-secondary-600/10 px-3 py-1 text-xs font-semibold text-secondary-700"
          title="Sumber: Badan Meteorologi, Klimatologi, dan Geofisika"
        >
          Sumber: BMKG
        </span>
      </div>

      {/* Cuaca saat ini (slot BMKG terdekat dengan waktu sekarang). */}
      {sekarang && (
        <div className="flex items-center gap-5 p-5">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-primary-50 text-primary-700">
            <CuacaIcon kode={sekarang.kode} className="h-9 w-9" />
          </span>
          <div className="min-w-0">
            <p className="flex items-baseline gap-1 font-heading text-3xl font-extrabold text-neutral-900">
              {sekarang.suhu}
              <span className="text-lg font-bold text-neutral-500">°C</span>
            </p>
            <p className="truncate text-sm font-semibold text-neutral-800">
              {sekarang.deskripsi}
            </p>
            <p className="mt-0.5 text-xs text-neutral-500">
              <time dateTime={sekarang.iso}>Pukul {sekarang.jam} WITA</time> ·
              Kelembapan {sekarang.kelembapan}%
              {sekarang.arahAnginText
                ? ` · Angin ${sekarang.angin} km/j dari ${sekarang.arahAnginText}`
                : ""}
            </p>
          </div>
        </div>
      )}

      {/* Prakiraan per hari. */}
      <div className="border-t border-neutral-200 px-5 pb-5 pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Prakiraan {data.hari.length} Hari
        </p>
        <ul className="grid gap-3 sm:grid-cols-3">
          {data.hari.map((h) => (
            <li
              key={h.tanggal}
              className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-center"
            >
              <p className="text-sm font-semibold text-neutral-900">{h.label}</p>
              <p className="text-[11px] text-neutral-500">{h.labelTanggal}</p>
              <span className="mx-auto mt-2 grid h-9 w-9 place-items-center text-primary-700">
                <CuacaIcon kode={h.slot[0]!.kode} className="h-7 w-7" />
              </span>
              <p className="mt-1 text-xs font-medium leading-tight text-neutral-700">
                {h.ringkas}
              </p>
              <p className="mt-1 text-sm font-bold text-neutral-900">
                {h.max}°
                <span className="ml-1 font-medium text-neutral-500">{h.min}°</span>
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-200 bg-neutral-50 px-5 py-3">
        <p className="text-[11px] text-neutral-500">
          {degraded
            ? "Menampilkan data terakhir — pembaruan BMKG sedang tidak tersedia."
            : `Prakiraan BMKG${data.analisis ? ` · analisis ${data.analisis.replace("T", " ")} WITA` : ""}`}
        </p>
        <a
          href={bmkgPageUrl(data.adm4)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-primary-700 hover:underline"
        >
          Lihat di BMKG ↗
        </a>
      </div>

      {/* Rujukan koordinat kantor (konsistensi dengan peta lokasi). */}
      <p className="sr-only">
        Prakiraan untuk wilayah kantor Diskominfo SP HST di sekitar koordinat{" "}
        {OFFICE_COORDS.lat}, {OFFICE_COORDS.lng}.
      </p>
    </section>
  );
}

/** Kartu fallback saat BMKG tidak dapat dijangkau. */
function CuacaFallback({ className }: { className?: string }) {
  return (
    <section
      role="alert"
      className={cn(
        "rounded-[var(--radius-card)] border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center",
        className,
      )}
    >
      <h2 className="font-heading text-base font-bold text-neutral-900">
        Informasi Cuaca Barabai
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-600">
        Prakiraan cuaca sedang tidak dapat dimuat. Silakan buka laman resmi BMKG
        untuk informasi terkini wilayah Hulu Sungai Tengah.
      </p>
      <a
        href={bmkgPageUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
      >
        Buka BMKG ↗
      </a>
    </section>
  );
}
