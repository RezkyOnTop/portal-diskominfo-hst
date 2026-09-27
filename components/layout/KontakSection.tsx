import { SITE, SOSIAL } from "@/lib/config";

/** Section Kontak Kami — alamat, email, telepon, dan media sosial. */
export function KontakSection() {
  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">
            Hubungi
          </p>
          <h2 className="mt-2 font-heading text-2xl font-bold text-neutral-900 sm:text-3xl">
            Kontak Kami
          </h2>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
            <h3 className="font-heading text-base font-bold text-neutral-900">Alamat</h3>
            <address className="mt-2 text-sm not-italic leading-relaxed text-neutral-600">
              {SITE.address}
            </address>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
            <h3 className="font-heading text-base font-bold text-neutral-900">Email</h3>
            <p className="mt-2 text-sm text-neutral-600">
              <a
                href={`mailto:${SITE.email}`}
                className="font-medium text-primary-700 hover:underline"
              >
                {SITE.email}
              </a>
            </p>
            <h3 className="mt-4 font-heading text-base font-bold text-neutral-900">Telepon</h3>
            <p className="mt-2 text-sm text-neutral-600">{SITE.phone}</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
            <h3 className="font-heading text-base font-bold text-neutral-900">Ikuti Kami</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {SOSIAL.map((s) => (
                <li key={s.name}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary-700 hover:underline"
                  >
                    {s.name} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
