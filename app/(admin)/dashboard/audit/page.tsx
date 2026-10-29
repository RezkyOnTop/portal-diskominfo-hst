import Link from "next/link";
import { redirect } from "next/navigation";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { auth } from "@/lib/auth";
import {
  AKSI_SENSITIF,
  LABEL_AKSI,
  daftarAktor,
  listAuditLogs,
  ringkasanAudit,
} from "@/lib/services/audit";
import { formatDateTime } from "@/lib/utils/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Jejak Audit" };

const PER_HALAMAN = 50;

interface Props {
  searchParams: Promise<{ aksi?: string; aktor?: string; q?: string; halaman?: string }>;
}

/**
 * Jejak audit aktivitas dashboard, HANYA Administrator.
 * Menampilkan siapa (admin/editor) melakukan apa, kapan, dari IP mana.
 */
export default async function AuditPage({ searchParams }: Props) {
  const session = await auth();
  if (!session) redirect("/masuk?callbackUrl=/dashboard/audit");
  if (session.user?.role !== "ADMIN") {
    return (
      <div className="space-y-4">
        <SectionHeading as="h1">Jejak Audit</SectionHeading>
        <p className="rounded-[var(--radius-card)] border border-[var(--adm-rule)] bg-[var(--adm-surface)] p-6 text-sm text-[var(--adm-ink-2)] border-[var(--adm-rule)] bg-[var(--adm-surface)] text-[var(--adm-ink-2)]">
          Halaman ini hanya dapat dibuka oleh <strong>Administrator</strong>. Akun Anda
          berperan <strong>Editor</strong>.
        </p>
      </div>
    );
  }

  const sp = await searchParams;
  const halaman = Math.min(Math.max(1, Number.parseInt(sp.halaman ?? "1", 10) || 1), 10_000);
  const aksi = sp.aksi?.trim() || undefined;
  const aktor = sp.aktor?.trim() || undefined;
  const q = sp.q?.trim() || undefined;

  const [{ baris, total }, ringkas, aktorList] = await Promise.all([
    listAuditLogs({ aksi, aktor, q, halaman, limit: PER_HALAMAN }),
    ringkasanAudit(),
    daftarAktor(),
  ]);

  const totalHalaman = Math.max(1, Math.ceil(total / PER_HALAMAN));
  const buatUrl = (h: number) => {
    const p = new URLSearchParams();
    if (aksi) p.set("aksi", aksi);
    if (aktor) p.set("aktor", aktor);
    if (q) p.set("q", q);
    if (h > 1) p.set("halaman", String(h));
    const s = p.toString();
    return s ? `/dashboard/audit?${s}` : "/dashboard/audit";
  };

  return (
    <div className="space-y-6">
      <SectionHeading as="h1">Jejak Audit</SectionHeading>
      <p className="text-sm text-[var(--adm-ink-2)] text-[var(--adm-muted)]">
        Catatan aktivitas dashboard: masuk/keluar, ubah data, unggah/hapus foto, dan
        ekspor CSV. Pencatatan bersifat best-effort, kegagalan mencatat tidak
        menggagalkan aksi yang sedang dijalankan.
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        <Kartu label="Aktivitas hari ini" nilai={ringkas.hariIni} />
        <Kartu label="Login gagal hari ini" nilai={ringkas.gagalMasuk} tare={ringkas.gagalMasuk > 0} />
        <Kartu label="Total baris audit" nilai={ringkas.total} />
      </div>

      {/* Filter: form GET biasa supaya bisa di-bookmark & tanpa JavaScript */}
      <form
        method="get"
        className="flex flex-wrap items-end gap-2 rounded-[var(--radius-card)] border border-[var(--adm-rule)] bg-[var(--adm-surface)] p-4 border-[var(--adm-rule)] bg-[var(--adm-surface)]"
      >
        <div>
          <label htmlFor="f-aksi" className="mb-1 block text-xs font-semibold text-[var(--adm-ink-2)] text-[var(--adm-muted)]">
            Jenis aksi
          </label>
          <select
            id="f-aksi"
            name="aksi"
            defaultValue={aksi ?? ""}
            className="rounded-md border border-[var(--adm-rule)] bg-[var(--adm-surface)] px-2.5 py-1.5 text-sm border-[var(--adm-rule)] bg-[var(--adm-surface)] text-[var(--adm-ink)]"
          >
            <option value="">Semua aksi</option>
            {Object.entries(LABEL_AKSI).map(([kode, label]) => (
              <option key={kode} value={kode}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-aktor" className="mb-1 block text-xs font-semibold text-[var(--adm-ink-2)] text-[var(--adm-muted)]">
            Pelaku
          </label>
          <select
            id="f-aktor"
            name="aktor"
            defaultValue={aktor ?? ""}
            className="rounded-md border border-[var(--adm-rule)] bg-[var(--adm-surface)] px-2.5 py-1.5 text-sm border-[var(--adm-rule)] bg-[var(--adm-surface)] text-[var(--adm-ink)]"
          >
            <option value="">Semua pelaku</option>
            {aktorList.map((a) => (
              <option key={a.actorId ?? "anonim"} value={a.actorId ?? ""}>
                {a.actorName}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[12rem] flex-1">
          <label htmlFor="f-q" className="mb-1 block text-xs font-semibold text-[var(--adm-ink-2)] text-[var(--adm-muted)]">
            Cari (nama / detail / IP)
          </label>
          <input
            id="f-q"
            name="q"
            defaultValue={q ?? ""}
            placeholder="mis. pegawai, 43.156."
            className="w-full rounded-md border border-[var(--adm-rule)] bg-[var(--adm-surface)] px-2.5 py-1.5 text-sm border-[var(--adm-rule)] bg-[var(--adm-surface)] text-[var(--adm-ink)]"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-[var(--adm-accent)] px-3 py-1.5 text-sm font-semibold text-[var(--adm-accent-ink)] hover:opacity-90"
        >
          Terapkan
        </button>
        <Link href="/dashboard/audit" className="px-2 py-1.5 text-sm text-[var(--adm-ink-2)] underline text-[var(--adm-muted)]">
          Reset
        </Link>
      </form>

      {baris.length === 0 ? (
        <p className="rounded-[var(--radius-card)] border border-dashed border-[var(--adm-rule)] bg-[var(--adm-surface)] p-6 text-sm text-[var(--adm-ink-2)] border-[var(--adm-rule)] bg-[var(--adm-surface)] text-[var(--adm-muted)]">
          Belum ada catatan audit yang cocok.
        </p>
      ) : (
        <>
          <p className="text-xs text-[var(--adm-muted)]" role="status" aria-live="polite">
            Menampilkan {baris.length} dari {total} baris · halaman {halaman}/{totalHalaman}
          </p>
          <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--adm-rule)] bg-[var(--adm-surface)] border-[var(--adm-rule)] bg-[var(--adm-surface)]">
            <table className="w-full border-collapse text-sm">
              <caption className="sr-only">Jejak audit aktivitas dashboard</caption>
              <thead>
                <tr className="border-b border-[var(--adm-rule)] text-left text-[var(--adm-ink-2)] border-[var(--adm-rule)] text-[var(--adm-muted)]">
                  <th scope="col" className="px-3 py-2">Waktu</th>
                  <th scope="col" className="px-3 py-2">Pelaku</th>
                  <th scope="col" className="px-3 py-2">Aksi</th>
                  <th scope="col" className="px-3 py-2">Detail</th>
                  <th scope="col" className="px-3 py-2">IP</th>
                </tr>
              </thead>
              <tbody>
                {baris.map((b) => {
                  const sensitif = AKSI_SENSITIF.has(b.aksi);
                  return (
                    <tr
                      key={b.id}
                      className={`border-b border-neutral-100 align-top border-[var(--adm-rule)] ${
                        sensitif ? "bg-danger-600/5" : ""
                      }`}
                    >
                      <td className="whitespace-nowrap px-3 py-2 text-xs text-[var(--adm-ink-2)] text-[var(--adm-muted)]">
                        {formatDateTime(b.createdAt)}
                      </td>
                      <td className="px-3 py-2">
                        <span className="block font-medium text-[var(--adm-ink)]">
                          {b.actorName}
                        </span>
                        <span
                          className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            b.actorRole === "ADMIN"
                              ? "bg-[var(--adm-accent)]/10 text-[var(--adm-accent)]"
                              : b.actorRole === "EDITOR"
                                ? "bg-secondary-600/10 text-secondary-700 dark:text-secondary-300"
                                : "bg-neutral-200 text-[var(--adm-ink-2)] text-[var(--adm-ink-2)]"
                          }`}
                        >
                          {b.actorRole}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={sensitif ? "font-semibold text-danger-600" : "text-[var(--adm-ink)] text-[var(--adm-ink-2)]"}>
                          {LABEL_AKSI[b.aksi] ?? b.aksi}
                        </span>
                        {b.target ? (
                          <span className="mt-0.5 block text-[11px] text-[var(--adm-muted)]">
                            {b.target}
                          </span>
                        ) : null}
                      </td>
                      <td className="max-w-[28rem] px-3 py-2 text-[var(--adm-ink-2)]">
                        {b.detail ?? ","}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs text-[var(--adm-ink-2)] text-[var(--adm-muted)]">
                        {b.ip ?? ","}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-2 text-sm">
            {halaman > 1 ? (
              <Link href={buatUrl(halaman - 1)} className="rounded-md border border-[var(--adm-rule)] px-3 py-1.5 font-medium hover:bg-[var(--adm-surface-2)] border-[var(--adm-rule)] text-[var(--adm-ink-2)]">
                Sebelumnya
              </Link>
            ) : (
              <span />
            )}
            {halaman < totalHalaman ? (
              <Link href={buatUrl(halaman + 1)} className="rounded-md border border-[var(--adm-rule)] px-3 py-1.5 font-medium hover:bg-[var(--adm-surface-2)] border-[var(--adm-rule)] text-[var(--adm-ink-2)]">
                Berikutnya
              </Link>
            ) : (
              <span />
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Kartu({ label, nilai, tare = false }: { label: string; nilai: number; tare?: boolean }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--adm-rule)] bg-[var(--adm-surface)] p-4 shadow-[var(--shadow-card)] border-[var(--adm-rule)] bg-[var(--adm-surface)]">
      <p className="text-xs text-[var(--adm-ink-2)] text-[var(--adm-muted)]">{label}</p>
      <p
        className={`mt-1 font-heading text-2xl font-bold ${
          tare ? "text-danger-600" : "text-[var(--adm-ink)]"
        }`}
      >
        {nilai.toLocaleString("id-ID")}
      </p>
    </div>
  );
}
