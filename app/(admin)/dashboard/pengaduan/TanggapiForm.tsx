"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import {
  LABEL_STATUS_PENGADUAN,
  STATUS_PENGADUAN,
  type StatusPengaduan,
} from "@/lib/validations/local.schema";
import { tanggapiAction, type TanggapiState } from "./actions";

/**
 * Form tanggapi satu pengaduan (dipakai di dashboard admin).
 * Menampilkan pesan hasil aksi lewat useActionState.
 */
export function TanggapiForm({
  id,
  status,
  tanggapan,
}: {
  id: string;
  status: string;
  tanggapan: string | null;
}) {
  const [state, formAction, pending] = useActionState<TanggapiState | null, FormData>(
    tanggapiAction,
    null,
  );

  const inputCls =
    "rounded-md border border-[var(--adm-rule)] bg-[var(--adm-surface)] px-2.5 py-1.5 text-sm border-[var(--adm-rule)] bg-[var(--adm-surface)] text-[var(--adm-ink)]";

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={`status-${id}`} className="sr-only">
          Status pengaduan
        </label>
        <select id={`status-${id}`} name="status" defaultValue={status} className={inputCls}>
          {STATUS_PENGADUAN.map((s) => (
            <option key={s} value={s}>
              {LABEL_STATUS_PENGADUAN[s as StatusPengaduan]}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan"}
        </Button>
      </div>
      <label htmlFor={`tanggapan-${id}`} className="sr-only">
        Tanggapan petugas
      </label>
      <textarea
        id={`tanggapan-${id}`}
        name="tanggapan"
        defaultValue={tanggapan ?? ""}
        maxLength={2000}
        rows={2}
        placeholder="Tulis tanggapan untuk pengadu (opsional)…"
        className={`${inputCls} w-full`}
      />
      {state ? (
        <p
          role="status"
          aria-live="polite"
          className={`text-xs ${state.ok ? "text-secondary-700 dark:text-secondary-300" : "text-danger-600"}`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
