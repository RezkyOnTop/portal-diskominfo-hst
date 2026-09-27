import { SectionHeading } from "@/components/ui/SectionHeading";
import { listSurveys, getRingkasanSurvei } from "@/lib/services/survey";
import { formatDateTime } from "@/lib/utils/format";
import { IKM_UNSUR, labelMutu } from "@/lib/validations/local.schema";

export const dynamic = "force-dynamic";
export const metadata = { title: "Survei IKM" };

/** Warna badge mutu pelayanan A/B/C/D. */
function warnaMutu(mutu: string): string {
  switch (mutu) {
    case "A":
      return "bg-secondary-600/10 text-secondary-700 dark:text-secondary-300";
    case "B":
      return "bg-primary-600/10 text-primary-700 dark:text-primary-300";
    case "C":
      return "bg-warning-600/15 text-warning-700 dark:text-warning-300";
    default:
      return "bg-danger-600/10 text-danger-700 dark:text-danger-300";
  }
}

export default async function SurveiAdminPage() {
  const [rows, ringkasan] = await Promise.all([listSurveys(200), getRingkasanSurvei()]);

  return (
    <div className="space-y-6">
      <SectionHeading as="h1">Survei IKM</SectionHeading>
      <p className="text-sm text-neutral-600 dark:text-slate-400">
        Data lokal (ServiceSurvey). Survei diisi warga melalui halaman{" "}
        <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">
          /survei
        </code>
        .
      </p>

      {/* Ringkasan agregat */}
      {ringkasan && ringkasan.responden > 0 ? (
        <div className="rounded-[var(--radius-card)] border border-neutral-200 bg-white p-5 shadow-[var(--shadow-card)] dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-wrap items-baseline gap-4">
            <div>
              <p className="text-xs text-neutral-600 dark:text-slate-400">Nilai IKM</p>
              <p className="font-heading text-3xl font-bold text-neutral-900 dark:text-slate-50">
                {ringkasan.ikm.toFixed(2)}
              </p>
            </div>
            <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${warnaMutu(ringkasan.mutu)}`}>
              Mutu {ringkasan.mutu} · {labelMutu(ringkasan.mutu)}
            </span>
            <p className="text-xs text-neutral-500 dark:text-slate-400">
              dari {ringkasan.responden.toLocaleString("id-ID")} responden
            </p>
          </div>

          {ringkasan.perUnsur.length > 0 ? (
            <ul className="mt-5 space-y-2">
              {ringkasan.perUnsur.map((u, i) => {
                const unsur = IKM_UNSUR[i];
                if (!unsur) return null;
                const pct = Math.min(100, (u.nrr / 4) * 100);
                return (
                  <li key={u.key}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-700 dark:text-slate-300">{unsur.label}</span>
                      <span className="font-semibold text-neutral-900 dark:text-slate-100">
                        {u.nrr.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <a
          href="/api/admin/ekspor?jenis=survei"
          className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          ⬇ Ekspor CSV
        </a>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-[var(--radius-card)] border border-dashed border-neutral-200 bg-white p-6 text-sm text-neutral-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          Belum ada jawaban survei.
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((s) => (
            <li
              key={s.id}
              className="rounded-[var(--radius-card)] border border-neutral-200 bg-white p-5 shadow-[var(--shadow-card)] dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-neutral-900 dark:text-slate-100">{s.layanan}</p>
                  <p className="mt-0.5 text-xs text-neutral-500 dark:text-slate-400">
                    {formatDateTime(s.createdAt)}
                    {s.nama ? ` · ${s.nama}` : " · anonim"}
                    {s.kontak ? ` · ${s.kontak}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-heading text-lg font-bold text-neutral-900 dark:text-slate-50">
                    {s.ikm.toFixed(2)}
                  </span>
                  <span className={`rounded-lg px-2 py-0.5 text-xs font-bold ${warnaMutu(s.mutu)}`}>
                    {s.mutu}
                  </span>
                </div>
              </div>

              {s.saran ? (
                <div className="mt-3 rounded-lg bg-neutral-50 p-3 dark:bg-slate-800/60">
                  <p className="text-xs font-semibold text-neutral-600 dark:text-slate-400">Saran</p>
                  <p className="mt-1 text-sm text-neutral-700 dark:text-slate-300">{s.saran}</p>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
