"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { LAYANAN_RESERVASI } from "@/lib/validations/local.schema";

interface FieldErrors {
  [key: string]: string[];
}

/**
 * Form permohonan reservasi layanan.
 * Mengirim ke /api/reservasi; server membalas kode lacak (RSV-XXXXXX) yang
 * bisa dipakai pemohon untuk mengecek status.
 */
export function ReservasiForm() {
  const [pending, startTransition] = useTransition();
  const [kode, setKode] = useState<string | null>(null);
  const [pesan, setPesan] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [keperluanLen, setKeperluanLen] = useState(0);

  /** Tanggal minimal = besok (permohonan diajukan sebelum kegiatan). */
  function tanggalMin(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }

  function onSubmit(formData: FormData) {
    setPesan(null);
    setFieldErrors({});
    startTransition(async () => {
      const payload = {
        nama: formData.get("nama"),
        instansi: formData.get("instansi") ?? "",
        email: formData.get("email"),
        telepon: formData.get("telepon"),
        layanan: formData.get("layanan"),
        tanggal: formData.get("tanggal"),
        waktuMulai: formData.get("waktuMulai"),
        waktuSelesai: formData.get("waktuSelesai") ?? "",
        jumlahPeserta: Number(formData.get("jumlahPeserta")),
        keperluan: formData.get("keperluan"),
      };
      try {
        const res = await fetch("/api/reservasi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await res.json()) as {
          ok: boolean;
          kode?: string;
          message?: string;
          fieldErrors?: FieldErrors;
        };
        if (data.ok && data.kode) {
          setKode(data.kode);
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          setPesan(data.message ?? "Permohonan gagal dikirim.");
          setFieldErrors(data.fieldErrors ?? {});
        }
      } catch {
        setPesan("Tidak dapat menghubungi server. Periksa koneksi Anda.");
      }
    });
  }

  // Tampilan sukses: tunjukkan kode lacak.
  if (kode) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-[var(--radius-card)] border border-secondary-200 bg-secondary-50 p-6 dark:border-secondary-700 dark:bg-secondary-900/30"
      >
        <h3 className="font-heading text-lg font-bold text-secondary-800 dark:text-secondary-200">
          ✓ Permohonan terkirim
        </h3>
        <p className="mt-2 text-sm text-neutral-700 dark:text-slate-300">
          Simpan kode lacak berikut untuk memantau status permohonan Anda:
        </p>
        <p className="mt-3 font-mono text-2xl font-bold tracking-wider text-neutral-900 dark:text-slate-50">
          {kode}
        </p>
        <p className="mt-3 text-xs text-neutral-600 dark:text-slate-400">
          Cek status kapan saja di halaman{" "}
          <a href="/reservasi/status" className="font-semibold underline">
            Cek Status Reservasi
          </a>
          . Permohonan akan diverifikasi petugas pada jam kerja.
        </p>
        <button
          type="button"
          onClick={() => setKode(null)}
          className="mt-4 text-sm font-semibold text-primary-700 underline hover:text-primary-800 dark:text-primary-300"
        >
          Ajukan permohonan lain
        </button>
      </div>
    );
  }

  const inputCls =
    "w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

  /** Tampilkan pesan error untuk sebuah field. */
  function err(field: string) {
    const list = fieldErrors[field];
    if (!list || list.length === 0) return null;
    return (
      <p className="text-xs text-danger-600 dark:text-danger-400">{list[0]}</p>
    );
  }

  return (
    <form action={onSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="nama" className="text-sm font-semibold text-neutral-800 dark:text-slate-200">
            Nama pemohon <span className="text-danger-600">*</span>
          </label>
          <input id="nama" name="nama" required maxLength={120} className={inputCls} />
          {err("nama")}
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="instansi"
            className="text-sm font-semibold text-neutral-800 dark:text-slate-200"
          >
            Instansi / lembaga{" "}
            <span className="font-normal text-neutral-500 dark:text-slate-400">(opsional)</span>
          </label>
          <input id="instansi" name="instansi" maxLength={160} className={inputCls} />
          {err("instansi")}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-semibold text-neutral-800 dark:text-slate-200">
            Email <span className="text-danger-600">*</span>
          </label>
          <input id="email" name="email" type="email" required className={inputCls} />
          {err("email")}
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="telepon"
            className="text-sm font-semibold text-neutral-800 dark:text-slate-200"
          >
            Telepon / WhatsApp <span className="text-danger-600">*</span>
          </label>
          <input
            id="telepon"
            name="telepon"
            required
            placeholder="0812xxxxxxx"
            className={inputCls}
          />
          {err("telepon")}
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="layanan" className="text-sm font-semibold text-neutral-800 dark:text-slate-200">
          Jenis layanan <span className="text-danger-600">*</span>
        </label>
        <select id="layanan" name="layanan" required defaultValue="" className={inputCls}>
          <option value="" disabled>
            — Pilih jenis layanan —
          </option>
          {LAYANAN_RESERVASI.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        {err("layanan")}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label
            htmlFor="tanggal"
            className="text-sm font-semibold text-neutral-800 dark:text-slate-200"
          >
            Tanggal kegiatan <span className="text-danger-600">*</span>
          </label>
          <input
            id="tanggal"
            name="tanggal"
            type="date"
            required
            min={tanggalMin()}
            className={inputCls}
          />
          {err("tanggal")}
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="waktuMulai"
            className="text-sm font-semibold text-neutral-800 dark:text-slate-200"
          >
            Jam mulai <span className="text-danger-600">*</span>
          </label>
          <input id="waktuMulai" name="waktuMulai" type="time" required className={inputCls} />
          {err("waktuMulai")}
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="waktuSelesai"
            className="text-sm font-semibold text-neutral-800 dark:text-slate-200"
          >
            Jam selesai{" "}
            <span className="font-normal text-neutral-500 dark:text-slate-400">(opsional)</span>
          </label>
          <input id="waktuSelesai" name="waktuSelesai" type="time" className={inputCls} />
          {err("waktuSelesai")}
        </div>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="jumlahPeserta"
          className="text-sm font-semibold text-neutral-800 dark:text-slate-200"
        >
          Perkiraan jumlah peserta <span className="text-danger-600">*</span>
        </label>
        <input
          id="jumlahPeserta"
          name="jumlahPeserta"
          type="number"
          min={1}
          max={2000}
          defaultValue={10}
          required
          className={inputCls}
        />
        {err("jumlahPeserta")}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="keperluan"
          className="text-sm font-semibold text-neutral-800 dark:text-slate-200"
        >
          Uraian keperluan <span className="text-danger-600">*</span>
        </label>
        <textarea
          id="keperluan"
          name="keperluan"
          rows={4}
          required
          minLength={10}
          maxLength={1000}
          onChange={(e) => setKeperluanLen(e.target.value.length)}
          placeholder="Jelaskan maksud kegiatan, mis. kunjungan studi tiru dari instansi X dengan agenda Y…"
          className={inputCls}
        />
        <p className="text-xs text-neutral-500 dark:text-slate-400">
          {keperluanLen}/1000 karakter (minimal 10)
        </p>
        {err("keperluan")}
      </div>

      <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Mengirim…" : "Kirim Permohonan"}
      </Button>

      {pesan ? (
        <p role="status" aria-live="polite" className="text-sm text-danger-600">
          {pesan}
        </p>
      ) : null}
    </form>
  );
}
