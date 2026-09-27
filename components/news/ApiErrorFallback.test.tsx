import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { ApiErrorFallback } from "./ApiErrorFallback";

describe("ApiErrorFallback", () => {
  it("menampilkan pesan generik, bukan raw error upstream", () => {
    render(<ApiErrorFallback />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/tidak tersedia/i);
    expect(alert).not.toHaveTextContent(/HTTP_|stack|Error:/i);
  });

  it("menampilkan pesan kustom bila diberikan", () => {
    render(<ApiErrorFallback message="Pesan khusus" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Pesan khusus");
  });

  it("memanggil onRetry saat tombol Coba lagi diklik", async () => {
    const onRetry = vi.fn();
    render(<ApiErrorFallback onRetry={onRetry} />);
    await userEvent.click(screen.getByRole("button", { name: /coba lagi/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("menampilkan tautan muat ulang bila tidak ada onRetry", () => {
    render(<ApiErrorFallback />);
    expect(screen.getByText(/muat ulang halaman/i)).toBeInTheDocument();
  });
});
