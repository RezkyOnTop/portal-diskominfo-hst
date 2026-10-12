"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { KATEGORI_PENGADUAN } from "@/lib/validations/local.schema";

interface FieldErrors {
  [key: string]: string[];
}

/**
 * Form pengaduan & aspirasi masyarakat.
 * Mengirim ke /api/pengaduan; server membalas kode lacak (PGD-XXXXXX) yang
 * bisa dipakai pengadu untuk mengecek status + tanggapan petugas.
 */
export function PengaduanForm() {
  const [pending, startTransition] = useTransition();
  const [kode, setKode] = useState<string | null>(null);
  const [pesan, setPesan] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isiLen, setIsiLen] = useState(0);

  function onSubmit(formData: FormData) {
    setPesan(null);
    setFieldErrors({});
    startTransition(async () => {
      const payload = {
        nama: formData.get("nama"),
        kontak: formData.get("kontak"),
        kategori: formData.get("kategori"),
        isi: formData.get("isi"),
      };
      try {
        const res = await fetch("/api/pengaduan", {
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
          setPesan(data.message ?? "Pengaduan gagal dikirim.");
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
          ✓ Pengaduan terkirim
        </h3>
        <p className="mt-2 text-sm text-neutral-700 dark:text-slate-300">
          Simpan kode lacak berikut untuk memantau status dan tanggapan petugas:
        </p>
        <p className="mt-3 font-mono text-2xl font-bold tracking-wider text-neutral-900 dark:text-slate-50">
          {kode}
        </p>
        <p className="mt-3 text-xs text-neutral-600 dark:text-slate-400">
          Cek status kapan saja pada kartu &ldquo;Cek Status Pengaduan&rdquo; di
          bawah. Pengaduan akan ditanggapi petugas pada jam kerja.
        </p>
        <button
          type="button"
          onClick={() => setKode(null)}
          className="mt-4 text-sm font-semibold text-primary-700 underline hover:text-primary-800 dark:text-primary-300"
        >
          Kirim pengaduan lain
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
    <form action={onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="pengaduan-nama" className="text-sm font-semibold text-neutral-800 dark:text-slate-200">
            Nama <span className="text-danger-600">*</span>
          </label>
          <input
            id="pengaduan-nama"
            name="nama"
            required
            maxLength={120}
            autoComplete="name"
            className={inputCls}
          />
          {err("nama")}
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="pengaduan-kontak"
            className="text-sm font-semibold text-neutral-800 dark:text-slate-200"
          >
            Kontak (WA / telepon / email) <span className="text-danger-600">*</span>
          </label>
          <input
            id="pengaduan-kontak"
            name="kontak"
            required
            maxLength={160}
            placeholder="0812xxxxxxx atau email@contoh.id"
            className={inputCls}
          />
          {err("kontak")}
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="pengaduan-kategori" className="text-sm font-semibold text-neutral-800 dark:text-slate-200">
          Kategori <span className="text-danger-600">*</span>
        </label>
        <select id="pengaduan-kategori" name="kategori" required defaultValue="" className={inputCls}>
          <option value="" disabled>
            — Pilih kategori —
          </option>
          {KATEGORI_PENGADUAN.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        {err("kategori")}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="pengaduan-isi"
          className="text-sm font-semibold text-neutral-800 dark:text-slate-200"
        >
          Isi pengaduan / aspirasi <span className="text-danger-600">*</span>
        </label>
        <textarea
          id="pengaduan-isi"
          name="isi"
          rows={5}
          required
          minLength={15}
          maxLength={2000}
          onChange={(e) => setIsiLen(e.target.value.length)}
          placeholder="Tuliskan keluhan, laporan, atau aspirasi Anda dengan jelas…"
          className={inputCls}
        />
        <p className="text-xs text-neutral-500 dark:text-slate-400">
          {isiLen}/2000 karakter (minimal 15)
        </p>
        {err("isi")}
      </div>

      <p className="text-xs text-neutral-500 dark:text-slate-400">
        Jangan cantumkan data sensitif (NIK, password, OTP). Pengaduan dibaca
        petugas dan ditanggapi pada jam kerja.
      </p>

      <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Mengirim…" : "Kirim Pengaduan"}
      </Button>

      {pesan ? (
        <p role="status" aria-live="polite" className="text-sm text-danger-600">
          {pesan}
        </p>
      ) : null}
    </form>
  );
}
