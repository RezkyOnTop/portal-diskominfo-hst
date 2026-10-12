/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { Preloader } from "@/components/layout/Preloader";
import { NavProgress } from "@/components/layout/NavProgress";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

describe("Preloader", () => {
  beforeEach(() => {
    sessionStorage.clear();
    document.documentElement.removeAttribute("data-preloader");
  });

  it("menampilkan huruf DISKOMINFOSP berurutan dengan jeda animasi", () => {
    render(<Preloader />);
    const kata = screen.getByRole("status", {
      name: /portal diskominfo/i,
    });
    expect(kata).toBeInTheDocument();
    const huruf = Array.from("DISKOMINFOSP");
    const wadah = kata.querySelector(".preloader__word");
    expect(wadah?.childElementCount).toBe(huruf.length);
    const pertama = wadah?.children[0] as HTMLElement;
    const terakhir = wadah?.children[huruf.length - 1] as HTMLElement;
    expect(Number.parseFloat(pertama.style.animationDelay)).toBeLessThan(
      Number.parseFloat(terakhir.style.animationDelay),
    );
  });

  it("memiliki tagline dinas + penanda sesi + bar progres", () => {
    render(<Preloader />);
    expect(
      screen.getByText(/komunikasi, informatika, statistik/i),
    ).toBeInTheDocument();
    expect(document.querySelector(".preloader__track")).toBeInTheDocument();
    expect(
      document.querySelector('script[src], script:not([src])'),
    ).toBeInTheDocument();
  });
});

describe("NavProgress", () => {
  it("tidak menampilkan bilah sebelum ada navigasi (nol kedipan awal)", () => {
    render(<NavProgress />);
    expect(document.querySelector(".nav-progress")).toBeInTheDocument();
    expect(
      document.querySelector(".nav-progress--tampil"),
    ).not.toBeInTheDocument();
  });
});
