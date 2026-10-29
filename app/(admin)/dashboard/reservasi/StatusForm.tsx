"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import {
  LABEL_STATUS_RESERVASI,
  STATUS_RESERVASI,
  type StatusReservasi,
} from "@/lib/validations/local.schema";
import { updateStatusAction, type UpdateStatusState } from "./actions";

/**
 * Form ubah status satu permohonan reservasi (dipakai di dashboard admin).
 * Menampilkan pesan hasil aksi lewat useActionState.
 */
export function StatusForm({
  id,
  status,
  catatanAdmin,
}: {
  id: string;
  status: string;
  catatanAdmin: string | null;
}) {
  const [state, formAction, pending] = useActionState<UpdateStatusState | null, FormData>(
    updateStatusAction,
    null,
  );

  const inputCls =
    "rounded-md border border-[var(--adm-rule)] bg-[var(--adm-surface)] px-2.5 py-1.5 text-sm border-[var(--adm-rule)] bg-[var(--adm-surface)] text-[var(--adm-ink)]";

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={`status-${id}`} className="sr-only">
          Status permohonan
        </label>
        <select
          id={`status-${id}`}
          name="status"
          defaultValue={status}
          className={inputCls}
        >
          {STATUS_RESERVASI.map((s) => (
            <option key={s} value={s}>
              {LABEL_STATUS_RESERVASI[s as StatusReservasi]}
            </option>
          ))}
        </select>
        <input
          name="catatanAdmin"
          defaultValue={catatanAdmin ?? ""}
          maxLength={1000}
          placeholder="Catatan (opsional)"
          aria-label="Catatan admin"
          className={`${inputCls} min-w-[12rem] flex-1`}
        />
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan"}
        </Button>
      </div>
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
