import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { Navbar } from "./Navbar";

// Stub navigasi: beranda transparan, path lain solid.
const pathnameMock = vi.fn(() => "/");
vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock(),
  useRouter: () => ({ push: () => undefined }),
}));

vi.mock("./useNavbarHide", () => ({
  useNavbarHide: () => ({ hidden: false, scrolled: false }),
}));

vi.mock("./ThemeProvider", () => ({
  useTheme: () => ({ toggle: () => undefined, theme: "light" as const, setTheme: () => undefined }),
}));

describe("Navbar mengikuti tema", () => {
  afterEach(() => cleanup());

  it("logo selalu ikut tema (hitam di terang, putih di gelap, tukar via CSS)", () => {
    pathnameMock.mockReturnValue("/");
    const { container } = render(<Navbar />);
    const putih = container.querySelector('img[src*="logo-putih"]');
    const hitam = container.querySelector('img[src*="logo-hitam"]');
    expect(putih).not.toBeNull();
    expect(hitam).not.toBeNull();
    // Keduanya dirender; visibilitas diatur kelas dark: — mencegah flash.
    expect(hitam?.className).toContain("dark:hidden");
    expect(putih?.className).toContain("dark:block");
  });

  it("header transparan memakai warna adaptif tema", () => {
    pathnameMock.mockReturnValue("/");
    const { container } = render(<Navbar />);
    const header = container.querySelector("header");
    const cls = header?.className ?? "";
    // Adaptif: teks gelap di terang, putih di gelap — tanpa kelas text-white mandiri.
    expect(cls).toContain("dark:text-white");
    expect(cls.split(/\s+/)).toContain("text-neutral-900");
    expect(cls.split(/\s+/).some((c) => c === "text-white")).toBe(false);
    expect(screen.getByRole("navigation", { name: /Navigasi utama/i })).toBeInTheDocument();
  });

  it("header solid memakai kelas dark: (ikut tema gelap)", () => {
    pathnameMock.mockReturnValue("/berita");
    const { container } = render(<Navbar />);
    const header = container.querySelector("header");
    expect(header?.className).toContain("dark:bg-neutral-950/95");
    expect(screen.getByRole("navigation", { name: /Navigasi utama/i })).toBeInTheDocument();
  });
});
