import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/services/subscriber", () => ({
  createSubscriber: vi.fn(),
}));

import { subscribeAction } from "@/lib/actions/subscribe";
import { createSubscriber } from "@/lib/services/subscriber";

const mock = createSubscriber as unknown as ReturnType<typeof vi.fn>;

function fd(data: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(data)) f.set(k, v);
  return f;
}

describe("subscribeAction", () => {
  beforeEach(() => vi.clearAllMocks());

  it("mengembalikan pesan sukses saat pendaftaran berhasil", async () => {
    mock.mockResolvedValue({ ok: true, id: "s1" });
    const res = await subscribeAction(
      fd({ name: "Budi", email: "budi@example.com", phone: "0812" }),
    );
    expect(res.ok).toBe(true);
    expect(res.message).toMatch(/berhasil berlangganan/i);
    expect(mock).toHaveBeenCalledWith({
      name: "Budi",
      email: "budi@example.com",
      phone: "0812",
    });
  });

  it("meneruskan pesan kegagalan dari layanan", async () => {
    mock.mockResolvedValue({ ok: false, message: "Email sudah terdaftar." });
    const res = await subscribeAction(fd({ name: "Budi", email: "budi@example.com" }));
    expect(res.ok).toBe(false);
    expect(res.message).toBe("Email sudah terdaftar.");
  });

  it("memakai string kosong bila nomor telepon tidak diisi", async () => {
    mock.mockResolvedValue({ ok: true, id: "s2" });
    await subscribeAction(fd({ name: "Ani", email: "ani@example.com" }));
    expect(mock).toHaveBeenCalledWith(
      expect.objectContaining({ phone: "" }),
    );
  });
});
