"use client";

import Link from "next/link";
import { useState } from "react";
import { NAV_MENU, SITE } from "@/lib/config";
import { cn } from "@/lib/utils/cn";

/** Menu navigasi mobile dengan submenu akordeon yang aksesibel. */
export function MobileNav({
  solid = true,
  onOpenChange,
}: {
  solid?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [sub, setSub] = useState<string | null>(null);

  function toggle() {
    setOpen((v) => {
      onOpenChange?.(!v);
      return !v;
    });
  }

  function tutup() {
    setOpen(false);
    onOpenChange?.(false);
  }

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="menu-mobile"
        aria-label={open ? "Tutup menu" : "Buka menu"}
        onClick={toggle}
        className={cn(
          "rounded-lg border p-2",
          solid
            ? "border-neutral-200 text-neutral-700"
            : "border-white/30 text-white",
        )}
      >
        <span aria-hidden="true" className="block text-lg leading-none">
          {open ? "✕" : "☰"}
        </span>
      </button>

      {open ? (
        <nav
          id="menu-mobile"
          aria-label="Navigasi mobile"
          className="absolute left-0 right-0 top-full max-h-[80vh] overflow-y-auto border-b border-neutral-200 bg-white text-neutral-900 shadow-xl"
        >
          <ul className="mx-auto max-w-7xl px-4 py-2">
            <li className="border-b border-neutral-100">
              <Link
                href="/cari"
                onClick={tutup}
                className="flex items-center gap-2 px-2 py-3 text-sm font-semibold text-neutral-800 hover:text-primary-700"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3.5-3.5" />
                </svg>
                Pencarian
              </Link>
            </li>
            {NAV_MENU.map((item) => (
              <li key={item.label} className="border-b border-neutral-100 last:border-0">
                {item.children ? (
                  <>
                    <button
                      type="button"
                      aria-expanded={sub === item.label}
                      onClick={() => setSub((v) => (v === item.label ? null : item.label))}
                      className="flex w-full items-center justify-between px-2 py-3 text-sm font-semibold text-neutral-800"
                    >
                      {item.label}
                      <span
                        aria-hidden="true"
                        className={cn("text-xs transition-transform", sub === item.label && "rotate-180")}
                      >
                        ▾
                      </span>
                    </button>
                    {sub === item.label ? (
                      <ul className="pb-2 pl-4">
                        {item.children.map((child) => (
                          <li key={child.label}>
                            {child.external ? (
                              <a
                                href={child.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={tutup}
                                className="block rounded-md px-3 py-2.5 text-sm text-neutral-600 hover:bg-primary-50 hover:text-primary-700"
                              >
                                {child.label} ↗
                              </a>
                            ) : (
                              <Link
                                href={child.href ?? "#"}
                                onClick={tutup}
                                className="block rounded-md px-3 py-2.5 text-sm text-neutral-600 hover:bg-primary-50 hover:text-primary-700"
                              >
                                {child.label}
                              </Link>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </>
                ) : (
                  <Link
                    href={item.href ?? "/"}
                    onClick={tutup}
                    className="block px-2 py-3 text-sm font-semibold text-neutral-800 hover:text-primary-700"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
          <div className="border-t border-neutral-100 px-6 py-3 text-xs text-neutral-500">
            <p>{SITE.email}</p>
            <p>Telp. {SITE.phone}</p>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
