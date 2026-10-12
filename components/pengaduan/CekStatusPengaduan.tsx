"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { LABEL_STATUS_PENGADUAN, type StatusPengaduan } from "@/lib/validations/local.schema";

interface StatusData {
  kode: string;
  kategori: string;
  status: string;
  tanggapan: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Kartu cek status pengaduan: pengadu memasukkan kode lacak (PGD-XXXXXX)
 * lalu melihat status + tanggapan petugas.
 */
export function CekStatusPengaduan() {
  const [pending, startTransition] = useTransition();
  const [hasil, setHasil] = useState<StatusData | null>(null);
  const [pesan, setPesan] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setPesan(null);
    setHasil(null);
    startTransition(async () => {
      const kode = String(formData.get("kode") ?? "").trim();
      if (!kode) {
        setPesan("Masukkan kode lacak pengaduan Anda.");
        return;
      }
      try {
        const res = await fetch(`/api/pengaduan/status?kode=${encodeURIComponent(kode)}`);
        const data = (await res.json()) as {
          ok: boolean;
          pengaduan?: StatusData;
          message?: string;
        };
        if (data.ok && data.pengaduan) {
          setHasil(data.pengaduan);
        } else {
          setPesan(data.message ?? "Pengaduan tidak ditemukan.");
        }
      } catch {
        setPesan("Tidak dapat menghubungi server. Periksa koneksi Anda.");
      }
    });
  }

  const inputCls =
    "w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 font-mono text-sm uppercase text-neutral-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

  return (
    <div>
      <form action={onSubmit} className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="cek-kode-pengaduan" className="sr-only">
            Kode lacak pengaduan
          </label>
          <input
            id="cek-kode-pengaduan"
            name="kode"
            required
            placeholder="PGD-XXXXXX"
            maxLength={20}
            className={inputCls}
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Mengecek…" : "Cek Status"}
        </Button>
      </form>

      {pesan ? (
        <p role="status" aria-live="polite" className="mt-3 text-sm text-danger-600 dark:text-danger-400">
          {pesan}
        </p>
      ) : null}

      {hasil ? (
        <div
          role="status"
          aria-live="polite"
          className="mt-4 rounded-[var(--radius-card)] border border-neutral-200 bg-neutral-50 p-5 dark:border-slate-700 dark:bg-slate-800/60"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-sm font-bold tracking-wider text-neutral-900 dark:text-slate-50">
              {hasil.kode}
            </p>
            <span className="rounded-full bg-primary-600/10 px-2.5 py-1 text-xs font-bold text-primary-700 dark:text-primary-300">
              {LABEL_STATUS_PENGADUAN[hasil.status as StatusPengaduan] ?? hasil.status}
            </span>
          </div>
          <p className="mt-2 text-xs text-neutral-600 dark:text-slate-400">
            {hasil.kategori}
          </p>
          {hasil.tanggapan ? (
            <div className="mt-3 rounded-lg bg-white p-3 dark:bg-slate-900">
              <p className="text-xs font-semibold text-neutral-600 dark:text-slate-400">
                Tanggapan petugas
              </p>
              <p className="mt-1 text-sm text-neutral-800 dark:text-slate-200">
                {hasil.tanggapan}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-neutral-600 dark:text-slate-400">
              Belum ada tanggapan. Pengaduan Anda sedang menunggu petugas.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
