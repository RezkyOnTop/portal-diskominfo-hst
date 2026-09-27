import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HoaxBadge } from "./HoaxBadge";

describe("HoaxBadge", () => {
  it("menampilkan label Hoaks dengan status jelas", () => {
    render(<HoaxBadge status="HOAKS" />);
    const badge = screen.getByRole("status");
    expect(badge).toHaveTextContent(/hoaks/i);
  });

  it("menampilkan label Klarifikasi", () => {
    render(<HoaxBadge status="KLARIFIKASI" />);
    expect(screen.getByRole("status")).toHaveTextContent(/klarifikasi/i);
  });
});
