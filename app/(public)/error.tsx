"use client";

import { ApiErrorFallback } from "@/components/news/ApiErrorFallback";

/**
 * Error boundary route publik. Kegagalan API Media Center ditangkap di sini dan
 * ditampilkan sebagai ApiErrorFallback — bukan stack trace mentah.
 */
export default function PublicError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <ApiErrorFallback onRetry={reset} />
    </div>
  );
}
