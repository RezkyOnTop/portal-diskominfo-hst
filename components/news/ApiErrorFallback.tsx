"use client";

import { Button } from "@/components/ui/Button";

interface ApiErrorFallbackProps {
  /** Pesan kustom opsional; default pesan generik (tidak pernah raw error upstream). */
  message?: string;
  /** Callback retry (mis. memicu refetch). */
  onRetry?: () => void;
}

const DEFAULT_MESSAGE =
  "Layanan informasi sedang tidak tersedia. Silakan coba beberapa saat lagi.";

/**
 * ApiErrorFallback — WAJIB dipakai di setiap halaman yang mengambil data dari
 * API Media Center. Menampilkan pesan ramah + tombol "Coba lagi", tidak pernah
 * menampilkan error mentah dari server Media Center.
 */
export function ApiErrorFallback({ message, onRetry }: ApiErrorFallbackProps) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex flex-col items-center gap-4 rounded-[var(--radius-card)] border border-danger-600/20 bg-danger-50 px-6 py-10 text-center"
    >
      <span
        aria-hidden="true"
        className="grid h-12 w-12 place-items-center rounded-full bg-danger-600/10 text-2xl text-danger-600"
      >
        !
      </span>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-neutral-900">
          Gagal memuat konten
        </h2>
        <p className="max-w-md text-sm text-neutral-600">{message ?? DEFAULT_MESSAGE}</p>
      </div>
      {onRetry ? (
        <Button variant="primary" size="md" onClick={onRetry}>
          Coba lagi
        </Button>
      ) : (
        <a
          href=""
          className="text-sm font-semibold text-primary-700 underline underline-offset-4"
        >
          Muat ulang halaman
        </a>
      )}
    </div>
  );
}
