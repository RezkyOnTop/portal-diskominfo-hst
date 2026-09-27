"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { LABEL_STATUS_RESERVASI, type StatusReservasi } from "@/lib/validations/local.schema";

interface HasilStatus {
  kode: string;
  nama: string;
  layanan: string;
  tanggal: string;
  waktuMulai: string;
  waktuSelesai: string | null;
  jumlahPeserta: number;
  status: string;
  catatanAdmin: string | null;
  createdAt: string;
}

/** Warna badge per status. */
function warnaStatus(status: string): string {
  switch (status) {
    case "DISETUJUI":
      return "bg-secondary-600 text-white";
    case "DITOLAK":
      return "bg-danger-600 text-white";
    case "SELESAI":
      return "bg-neutral-600 text-white";
    default:
      return "bg-warning-600 text-white";
  }
}

/** Format tanggal kegiatan (date-only) dengan acuan UTC — sama dengan server. */
function formatTanggal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Format timestamp asli (mis. waktu pengajuan) memakai zona waktu pengguna. */
function formatWaktu(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Form pencarian status reservasi berdasarkan kode lacak. */
export function CekStatusForm() {
  const [pending, startTransition] = useTransition();
  const [hasil, setHasil] = useState<HasilStatus | null>(null);
  const [pesan, setPesan] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    const kode = String(formData.get("kode") ?? "").trim();
    setPesan(null);
    setHasil(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/reservasi/status?kode=${encodeURIComponent(kode)}`);
        const data = (await res.json()) as {
          ok: boolean;
          data?: HasilStatus;
          message?: string;
        };
        if (data.ok && data.data) {
          setHasil(data.data);
        } else {
          setPesan(data.message ?? "Kode tidak ditemukan.");
        }
      } catch {
        setPesan("Tidak dapat menghubungi server. Periksa koneksi Anda.");
      }
    });
  }

  const inputCls =
    "w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

  return (
    <div className="space-y-6">
      <form action={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="kode" className="text-sm font-semibold text-neutral-800 dark:text-slate-200">
            Kode lacak
          </label>
          <input
            id="kode"
            name="kode"
            required
            placeholder="RSV-7K2M9Q"
            pattern="RSV-[A-Za-z0-9]{6}"
            title="Format: RSV- diikuti 6 karakter, contoh RSV-7K2M9Q"
            className={`${inputCls} font-mono uppercase tracking-wider`}
          />
          <p className="text-xs text-neutral-500 dark:text-slate-400">
            Kode diberikan saat Anda mengirim permohonan (contoh: RSV-7K2M9Q).
          </p>
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Mencari…" : "Cek Status"}
        </Button>
      </form>

      {pesan ? (
        <p role="status" aria-live="polite" className="text-sm text-danger-600">
          {pesan}
        </p>
      ) : null}

      {hasil ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-[var(--radius-card)] border border-neutral-200 bg-white p-6 shadow-[var(--shadow-card)] dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-lg font-bold tracking-wider text-neutral-900 dark:text-slate-50">
              {hasil.kode}
            </p>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${warnaStatus(hasil.status)}`}
            >
              {LABEL_STATUS_RESERVASI[hasil.status as StatusReservasi] ?? hasil.status}
            </span>
          </div>

          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-neutral-500 dark:text-slate-400">Pemohon</dt>
              <dd className="font-medium text-neutral-900 dark:text-slate-100">{hasil.nama}</dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-500 dark:text-slate-400">Jenis layanan</dt>
              <dd className="font-medium text-neutral-900 dark:text-slate-100">{hasil.layanan}</dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-500 dark:text-slate-400">Tanggal kegiatan</dt>
              <dd className="font-medium text-neutral-900 dark:text-slate-100">
                {formatTanggal(hasil.tanggal)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-500 dark:text-slate-400">Waktu</dt>
              <dd className="font-medium text-neutral-900 dark:text-slate-100">
                {hasil.waktuMulai}
                {hasil.waktuSelesai ? `–${hasil.waktuSelesai}` : ""} WITA
              </dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-500 dark:text-slate-400">Jumlah peserta</dt>
              <dd className="font-medium text-neutral-900 dark:text-slate-100">
                {hasil.jumlahPeserta} orang
              </dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-500 dark:text-slate-400">Diajukan</dt>
              <dd className="font-medium text-neutral-900 dark:text-slate-100">
                {formatWaktu(hasil.createdAt)}
              </dd>
            </div>
          </dl>

          {hasil.catatanAdmin ? (
            <div className="mt-5 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
              <p className="text-xs font-semibold text-neutral-700 dark:text-slate-300">
                Catatan petugas
              </p>
              <p className="mt-1 text-sm text-neutral-700 dark:text-slate-300">
                {hasil.catatanAdmin}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
