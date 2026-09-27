import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/layout/Container";
import { SurveiForm } from "@/components/survei/SurveiForm";
import { getRingkasanSurvei } from "@/lib/services/survey";
import { IKM_UNSUR, labelMutu } from "@/lib/validations/local.schema";

export const metadata: Metadata = {
  title: "Survei Kepuasan Layanan",
  description:
    "Survei Kepuasan Masyarakat (IKM) Dinas Komunikasi, Informatika, Statistik dan Persandian Kabupaten Hulu Sungai Tengah — 9 unsur pelayanan sesuai PermenPANRB 14/2017.",
};

export const dynamic = "force-dynamic";

/** Warna badge mutu pelayanan A/B/C/D. */
function warnaMutu(mutu: string): string {
  switch (mutu) {
    case "A":
      return "bg-secondary-600 text-white";
    case "B":
      return "bg-primary-600 text-white";
    case "C":
      return "bg-warning-600 text-white";
    default:
      return "bg-danger-600 text-white";
  }
}

export default async function SurveiPage() {
  const ringkasan = await getRingkasanSurvei();
  const adaData = ringkasan !== null && ringkasan.responden > 0;

  return (
    <>
      <PageHeader
        title="Survei Kepuasan Layanan"
        eyebrow="IKM"
        crumbs={[{ label: "Survei Kepuasan" }]}
      >
        Penilaian Anda membantu kami memperbaiki kualitas pelayanan publik. Survei
        mengikuti 9 unsur Indeks Kepuasan Masyarakat (IKM) sesuai PermenPANRB No. 14
        Tahun 2017.
      </PageHeader>

      <Container className="py-10">
        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          {/* Form survei */}
          <section className="rounded-[var(--radius-card)] border border-neutral-200 bg-white p-6 shadow-[var(--shadow-card)] dark:border-slate-700 dark:bg-slate-900">
            <h2 className="font-heading text-xl font-bold text-neutral-900 dark:text-slate-50">
              Formulir Penilaian
            </h2>
            <p className="mt-1 text-sm text-neutral-600 dark:text-slate-300">
              Beri nilai 1–4 pada setiap unsur. Isian identitas bersifat opsional —
              Anda boleh mengisi survei ini secara anonim.
            </p>
            <div className="mt-6">
              <SurveiForm />
            </div>
          </section>

          {/* Ringkasan IKM */}
          <aside className="space-y-5">
            <div className="rounded-[var(--radius-card)] border border-neutral-200 bg-white p-6 shadow-[var(--shadow-card)] dark:border-slate-700 dark:bg-slate-900">
              <h2 className="font-heading text-base font-bold text-neutral-900 dark:text-slate-50">
                Hasil Survei
              </h2>

              {adaData ? (
                <>
                  <div className="mt-4 flex items-baseline gap-3">
                    <p className="font-heading text-4xl font-extrabold text-primary-700 dark:text-primary-300">
                      {ringkasan.ikm.toFixed(2)}
                    </p>
                    <span
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold ${warnaMutu(ringkasan.mutu)}`}
                    >
                      Mutu {ringkasan.mutu} · {labelMutu(ringkasan.mutu)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500 dark:text-slate-400">
                    Nilai IKM dari {ringkasan.responden.toLocaleString("id-ID")} responden
                  </p>

                  {ringkasan.perUnsur.length > 0 ? (
                    <ul className="mt-5 space-y-2.5">
                      {ringkasan.perUnsur.map((u, i) => {
                        const unsur = IKM_UNSUR[i];
                        if (!unsur) return null;
                        const pct = Math.min(100, (u.nrr / 4) * 100);
                        return (
                          <li key={u.key}>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-neutral-700 dark:text-slate-300">
                                {unsur.label}
                              </span>
                              <span className="font-semibold text-neutral-900 dark:text-slate-100">
                                {u.nrr.toFixed(2)}
                              </span>
                            </div>
                            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-slate-800">
                              <div
                                className="h-full rounded-full bg-primary-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </>
              ) : (
                <div className="mt-3 space-y-2 text-sm text-neutral-600 dark:text-slate-300">
                  <p>
                    Belum ada penilaian yang masuk. Jadilah yang pertama mengisi survei
                    ini.
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-slate-400">
                    Nilai IKM akan tampil otomatis setelah responden pertama mengirim
                    penilaian.
                  </p>
                </div>
              )}
            </div>

            {/* Keterangan mutu */}
            <div className="rounded-[var(--radius-card)] border border-neutral-200 bg-neutral-50 p-6 dark:border-slate-700 dark:bg-slate-900/50">
              <h3 className="font-heading text-sm font-bold text-neutral-900 dark:text-slate-50">
                Kategori Mutu Pelayanan
              </h3>
              <ul className="mt-3 space-y-1.5 text-xs text-neutral-600 dark:text-slate-300">
                <li>
                  <strong>A</strong> — Sangat Baik (88,31–100,00)
                </li>
                <li>
                  <strong>B</strong> — Baik (76,61–88,30)
                </li>
                <li>
                  <strong>C</strong> — Kurang Baik (65,00–76,60)
                </li>
                <li>
                  <strong>D</strong> — Tidak Baik (25,00–64,99)
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </Container>
    </>
  );
}
