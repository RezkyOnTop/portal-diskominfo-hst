"use client";

import Link from "next/link";
import { useState } from "react";
import { NAV_LINKS } from "@/lib/config";

/** Menu navigasi mobile dengan toggle aksesibel. */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="menu-mobile"
        aria-label={open ? "Tutup menu" : "Buka menu"}
        onClick={() => setOpen((v) => !v)}
        className="rounded-md border border-neutral-200 p-2 text-neutral-700"
      >
        <span aria-hidden="true" className="block text-lg leading-none">
          {open ? "✕" : "☰"}
        </span>
      </button>
      {open ? (
        <nav
          id="menu-mobile"
          aria-label="Navigasi mobile"
          className="absolute left-0 right-0 top-full border-b border-neutral-200 bg-white shadow-lg"
        >
          <ul className="mx-auto max-w-6xl flex-col px-4 py-2">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-3 text-sm font-medium text-neutral-700 hover:bg-primary-50"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
