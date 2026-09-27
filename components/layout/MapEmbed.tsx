import {
  SITE,
  googleMapsDirectionsUrl,
  googleMapsEmbedUrl,
  googleMapsPlaceUrl,
} from "@/lib/config";

interface MapEmbedProps {
  /** Tinggi area peta (kelas Tailwind). */
  heightClass?: string;
  /** Tampilkan kartu alamat + tombol petunjuk arah di samping peta. */
  withInfo?: boolean;
  /** Zoom awal Google Maps. */
  zoom?: number;
}

/**
 * Peta lokasi kantor memakai Google Maps embed (tanpa API key) — pola yang
 * sama dengan situs lama. Di-render sebagai iframe biasa sehingga tidak
 * menambah beban JavaScript.
 */
export function MapEmbed({
  heightClass = "min-h-[360px]",
  withInfo = false,
  zoom = 16,
}: MapEmbedProps) {
  const map = (
    <div
      className={`overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[var(--shadow-card)] dark:border-slate-700 dark:bg-slate-900 ${heightClass}`}
    >
      <iframe
        title={`Peta lokasi ${SITE.shortName}`}
        src={googleMapsEmbedUrl(zoom)}
        className="h-full min-h-[320px] w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  );

  if (!withInfo) return map;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[var(--shadow-card)] dark:border-slate-700 dark:bg-slate-900">
        <h2 className="font-heading text-base font-bold text-neutral-900 dark:text-slate-50">
          Lokasi Kantor
        </h2>
        <address className="mt-2 text-sm not-italic leading-relaxed text-neutral-600 dark:text-slate-300">
          {SITE.address}
        </address>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href={googleMapsDirectionsUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
          >
            Petunjuk Arah ↗
          </a>
          <a
            href={googleMapsPlaceUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Buka di Google Maps ↗
          </a>
        </div>
      </div>
      {map}
    </div>
  );
}
