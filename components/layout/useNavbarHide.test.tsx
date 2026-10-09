import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useNavbarHide } from "./useNavbarHide";

/** matchMedia tiruan — default: gerak diizinkan (reduce=false). */
function stubMatchMedia(reduce = false) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: query.includes("reduced-motion") ? reduce : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
}

/** Set scrollY lalu tembak event scroll; RAF dijalankan sinkron. */
function scrollTo(y: number) {
  Object.defineProperty(window, "scrollY", { value: y, configurable: true });
  window.dispatchEvent(new Event("scroll"));
}

describe("useNavbarHide", () => {
  beforeEach(() => {
    stubMatchMedia(false);
    // RAF dijalankan langsung agar tak perlu menunggu frame.
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
    Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("tidak menyembunyikan sebelum melewati threshold 80px", () => {
    const { result } = renderHook(() => useNavbarHide());
    act(() => scrollTo(60));
    expect(result.current.hidden).toBe(false);
  });

  it("menyembunyikan saat scroll ke bawah melewati threshold", () => {
    const { result } = renderHook(() => useNavbarHide());
    act(() => scrollTo(300));
    expect(result.current.hidden).toBe(true);
  });

  it("memunculkan kembali saat scroll ke atas", () => {
    const { result } = renderHook(() => useNavbarHide());
    act(() => scrollTo(400));
    expect(result.current.hidden).toBe(true);
    act(() => scrollTo(200));
    expect(result.current.hidden).toBe(false);
  });

  it("selalu terlihat saat kembali ke paling atas", () => {
    const { result } = renderHook(() => useNavbarHide());
    act(() => scrollTo(500));
    expect(result.current.hidden).toBe(true);
    act(() => scrollTo(0));
    expect(result.current.hidden).toBe(false);
  });

  it("menandai scrolled setelah 24px", () => {
    const { result } = renderHook(() => useNavbarHide());
    act(() => scrollTo(40));
    expect(result.current.scrolled).toBe(true);
  });

  it("frozen=true memaksa navbar terlihat", () => {
    const { result, rerender } = renderHook(
      ({ frozen }) => useNavbarHide(frozen),
      { initialProps: { frozen: false } },
    );
    act(() => scrollTo(400));
    expect(result.current.hidden).toBe(true);
    rerender({ frozen: true });
    expect(result.current.hidden).toBe(false);
  });

  it("prefers-reduced-motion: tidak pernah menyembunyikan", () => {
    stubMatchMedia(true);
    const { result } = renderHook(() => useNavbarHide());
    act(() => scrollTo(500));
    expect(result.current.hidden).toBe(false);
  });
});
