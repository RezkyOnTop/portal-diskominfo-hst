"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { subscribeAction } from "@/app/(public)/radio/actions";

/** Form pendaftaran subscriber radio (data lokal: RadioSubscriber). */
export function SubscriberForm() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await subscribeAction(formData);
      setMessage({ ok: result.ok, text: result.message });
    });
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="name" className="text-sm font-medium text-neutral-700">
          Nama lengkap
        </label>
        <input
          id="name"
          name="name"
          required
          minLength={2}
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          placeholder="Nama Anda"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium text-neutral-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          placeholder="nama@email.com"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="phone" className="text-sm font-medium text-neutral-700">
          Nomor telepon <span className="text-neutral-500">(opsional)</span>
        </label>
        <input
          id="phone"
          name="phone"
          inputMode="tel"
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          placeholder="08xxxxxxxxxx"
        />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Mengirim…" : "Berlangganan"}
      </Button>
      {message ? (
        <p
          role="status"
          aria-live="polite"
          className={`text-sm ${message.ok ? "text-secondary-700" : "text-danger-600"}`}
        >
          {message.text}
        </p>
      ) : null}
    </form>
  );
}
