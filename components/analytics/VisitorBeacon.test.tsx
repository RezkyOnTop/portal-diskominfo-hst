import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";

// usePathname di-mock agar kita bisa mengendalikan rute yang "dikunjungi".
let mockPathname = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

import { VisitorBeacon } from "./VisitorBeacon";

describe("VisitorBeacon", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = "/";
  });

  it("mengirim POST ke /api/visitor saat halaman publik dibuka", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    render(<VisitorBeacon />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/visitor");
    expect(init.method).toBe("POST");
    expect(init.keepalive).toBe(true);
    vi.unstubAllGlobals();
  });

  it("mengirim path halaman yang sedang dibuka", async () => {
    mockPathname = "/berita/contoh-slug";
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    render(<VisitorBeacon />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toMatchObject({ path: "/berita/contoh-slug" });
    vi.unstubAllGlobals();
  });

  it("TIDAK mencatat halaman admin", async () => {
    mockPathname = "/dashboard";
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    render(<VisitorBeacon />);

    // Beri kesempatan efek berjalan sebelum memastikan tidak ada panggilan.
    await new Promise((r) => setTimeout(r, 20));
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("TIDAK mencatat halaman masuk", async () => {
    mockPathname = "/masuk";
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    render(<VisitorBeacon />);

    await new Promise((r) => setTimeout(r, 20));
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("menelan kegagalan jaringan (tidak melempar)", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);

    expect(() => render(<VisitorBeacon />)).not.toThrow();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    vi.unstubAllGlobals();
  });
});
