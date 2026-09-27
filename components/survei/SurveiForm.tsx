"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import {
  IKM_SKALA,
  IKM_UNSUR,
  LAYANAN_SURVEI,
  labelMutu,
} from "@/lib/validations/local.schema";
import { submitSurveyAction, type SurveiActionState } from "@/app/(public)/survei/actions";

const UNSUR_KEYS = ["u1", "u2", "u3", "u4", "u5", "u6", "u7", "u8", "u9"] as const;

/**
 * Form Survei Kepuasan Masyarakat (IKM).
 * 9 unsur pelayanan × skala 1–4, mengikuti PermenPANRB 14/2017.
 */
export function SurveiForm() {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<SurveiActionState | null>(null);
  const [nilai, setNilai] = useState<Record<string, number>>({});

  const terisi = UNSUR_KEYS.filter((k) => nilai[k]).length;
  const lengkap = terisi === 9;

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await submitSurveyAction(formData);
      setState(result);
      if (result.ok) window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  if (state?.ok) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-[var(--radius-card)] border border-secondary-200 bg-secondary-50 p-6 text-center dark:border-secondary-700 dark:bg-secondary-900/30"
      >
        <p className="font-heading text-lg font-bold text-secondary-800 dark:text-secondary-200">
          ✓ {state.message}
        </p>
        {typeof state.ikm === "number" ? (
          <p className="mt-2 text-sm text-neutral-700 dark:text-slate-300">
            Penilaian Anda menghasilkan nilai IKM{" "}
            <strong>{state.ikm.toFixed(2)}</strong> — mutu{" "}
            <strong>
              {state.mutu} ({labelMutu(state.mutu ?? "")})
            </strong>
            .
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setState(null);
            setNilai({});
          }}
          className="mt-4 text-sm font-semibold text-primary-700 underline hover:text-primary-800 dark:text-primary-300"
        >
          Isi survei lagi
        </button>
      </div>
    );
  }

  return (
    <form action={onSubmit} className="space-y-6">
      {/* Pilih layanan */}
      <div className="space-y-1.5">
        <label
          htmlFor="layanan"
          className="text-sm font-semibold text-neutral-800 dark:text-slate-200"
        >
          Layanan yang dinilai <span className="text-danger-600">*</span>
        </label>
        <select
          id="layanan"
          name="layanan"
          required
          defaultValue=""
          className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="" disabled>
            — Pilih layanan —
          </option>
          {LAYANAN_SURVEI.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      {/* 9 unsur IKM */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-neutral-800 dark:text-slate-200">
          Penilaian 9 unsur pelayanan{" "}
          <span className="font-normal text-neutral-500 dark:text-slate-400">
            ({terisi}/9 terisi)
          </span>
        </legend>

        {IKM_UNSUR.map((unsur, i) => (
          <div
            key={unsur.key}
            className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4 dark:border-slate-700 dark:bg-slate-900/40"
          >
            <p className="text-sm font-medium text-neutral-900 dark:text-slate-100">
              {i + 1}. {unsur.label}
            </p>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-slate-400">
              {unsur.desc}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {IKM_SKALA.map((s) => {
                const aktif = nilai[unsur.key] === s.value;
                return (
                  <label
                    key={s.value}
                    className={`cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                      aktif
                        ? "border-primary-600 bg-primary-600 text-white"
                        : "border-neutral-200 bg-white text-neutral-700 hover:border-primary-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name={unsur.key}
                      value={s.value}
                      required
                      checked={aktif}
                      onChange={() =>
                        setNilai((prev) => ({ ...prev, [unsur.key]: s.value }))
                      }
                      className="sr-only"
                    />
                    {s.value} · {s.label}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </fieldset>

      {/* Saran & identitas opsional */}
      <div className="space-y-1.5">
        <label
          htmlFor="saran"
          className="text-sm font-semibold text-neutral-800 dark:text-slate-200"
        >
          Saran / masukan{" "}
          <span className="font-normal text-neutral-500 dark:text-slate-400">(opsional)</span>
        </label>
        <textarea
          id="saran"
          name="saran"
          rows={4}
          maxLength={1000}
          placeholder="Tulis saran atau masukan Anda untuk perbaikan layanan…"
          className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label
            htmlFor="nama"
            className="text-sm font-semibold text-neutral-800 dark:text-slate-200"
          >
            Nama{" "}
            <span className="font-normal text-neutral-500 dark:text-slate-400">(opsional)</span>
          </label>
          <input
            id="nama"
            name="nama"
            maxLength={120}
            placeholder="Boleh dikosongkan (anonim)"
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="kontak"
            className="text-sm font-semibold text-neutral-800 dark:text-slate-200"
          >
            Email / telepon{" "}
            <span className="font-normal text-neutral-500 dark:text-slate-400">(opsional)</span>
          </label>
          <input
            id="kontak"
            name="kontak"
            maxLength={120}
            placeholder="Untuk tindak lanjut bila perlu"
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      <Button type="submit" size="lg" disabled={pending || !lengkap} className="w-full sm:w-auto">
        {pending ? "Mengirim…" : lengkap ? "Kirim Penilaian" : `Lengkapi dulu (${terisi}/9)`}
      </Button>

      {state && !state.ok ? (
        <p role="status" aria-live="polite" className="text-sm text-danger-600">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
