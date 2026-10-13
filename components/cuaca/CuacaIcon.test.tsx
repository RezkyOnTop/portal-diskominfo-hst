import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CuacaIcon, jenisIkon, labelJenis } from "./CuacaIcon";
import type { CuacaSlot } from "@/lib/types/cuaca";

function slot(p: Partial<CuacaSlot> = {}): CuacaSlot {
  return {
    jam: "10:00",
    iso: "2026-09-28T10:00:00+08:00",
    suhu: 30,
    kode: 0,
    deskripsi: "Cerah",
    kelembapan: 60,
    angin: 9,
    arahAngin: "E",
    arahAnginText: "Timur",
    ikon: "",
    ...p,
  };
}

describe("jenisIkon (pemetaan kode cuaca BMKG)", () => {
  it("memetakan kode cuaca ke jenis ikon yang tepat", () => {
    expect(jenisIkon(0)).toBe("cerah");
    expect(jenisIkon(1)).toBe("cerah-berawan");
    expect(jenisIkon(2)).toBe("cerah-berawan");
    expect(jenisIkon(3)).toBe("berawan");
    expect(jenisIkon(4)).toBe("berawan");
    expect(jenisIkon(5)).toBe("kabut");
    expect(jenisIkon(45)).toBe("kabut");
    expect(jenisIkon(60)).toBe("hujan");
    expect(jenisIkon(63)).toBe("hujan");
    expect(jenisIkon(80)).toBe("hujan");
    expect(jenisIkon(95)).toBe("petir");
    expect(jenisIkon(99)).toBe("petir");
  });

  it("kode tak dikenal jatuh ke 'berawan' (aman)", () => {
    expect(jenisIkon(7)).toBe("berawan");
    expect(jenisIkon(-1)).toBe("berawan");
  });
});

describe("CuacaIcon", () => {
  it("merender svg dengan label aksesibilitas sesuai jenis", () => {
    render(<CuacaIcon kode={0} />);
    const svg = screen.getByRole("img", { name: "cerah" });
    expect(svg.tagName.toLowerCase()).toBe("svg");
  });

  it("menggambar ikon hujan untuk kode hujan", () => {
    render(<CuacaIcon kode={61} />);
    expect(screen.getByRole("img", { name: "hujan" })).toBeInTheDocument();
  });

  it("menerima className kustom", () => {
    render(<CuacaIcon kode={3} className="h-9 w-9" />);
    const svg = screen.getByRole("img", { name: "berawan" });
    expect(svg).toHaveAttribute("class", "h-9 w-9");
  });
});

describe("labelJenis", () => {
  it("memakai deskripsi slot bila ada", () => {
    expect(labelJenis(slot({ deskripsi: "Hujan Ringan" }))).toBe("Hujan Ringan");
  });

  it("memberi label cadangan bila deskripsi kosong", () => {
    expect(labelJenis(slot({ deskripsi: "" }))).toBe("Tidak diketahui");
  });
});
