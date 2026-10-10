import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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

describe("Navbar logo mengikuti tema", () => {
  it("mode transparan (atas beranda): hanya logo PUTIH yang terlihat", () => {
    pathnameMock.mockReturnValue("/");
    const { container } = render(<Navbar />);
    const putih = container.querySelector('img[src*="logo-putih"]');
    const hitam = container.querySelector('img[src*="logo-hitam"]');
    expect(putih).not.toBeNull();
    expect(hitam).not.toBeNull();
    // Logo putih tanpa 'hidden' saat transparan; logo hitam disembunyikan.
    expect(putih?.className).not.toMatch(/(^|\s)hidden(\s|$)/);
    expect(hitam?.className).toMatch(/(^|\s)hidden(\s|$)/);
  });

  it("mode solid (halaman lain): logo hitam di terang, putih di gelap (tukar via CSS)", () => {
    pathnameMock.mockReturnValue("/berita");
    const { container } = render(<Navbar />);
    const putih = container.querySelector('img[src*="logo-putih"]');
    const hitam = container.querySelector('img[src*="logo-hitam"]');
    // Keduanya dirender; visibilitas diatur kelas dark: — mencegah flash.
    expect(hitam?.className).toContain("dark:hidden");
    expect(putih?.className).toContain("dark:block");
  });

  it("header solid memakai kelas dark: (ikut tema gelap)", () => {
    pathnameMock.mockReturnValue("/berita");
    const { container } = render(<Navbar />);
    const header = container.querySelector("header");
    expect(header?.className).toContain("dark:bg-neutral-950/95");
    expect(screen.getByRole("navigation", { name: /Navigasi utama/i })).toBeInTheDocument();
  });
});
