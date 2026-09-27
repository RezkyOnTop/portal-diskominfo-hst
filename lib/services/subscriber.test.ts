import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({
  prisma: {
    radioSubscriber: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";
import {
  createSubscriber,
  listSubscribers,
  countSubscribers,
} from "./subscriber";

const createMock = prisma.radioSubscriber.create as unknown as ReturnType<typeof vi.fn>;
const findManyMock = prisma.radioSubscriber.findMany as unknown as ReturnType<typeof vi.fn>;
const countMock = prisma.radioSubscriber.count as unknown as ReturnType<typeof vi.fn>;

describe("createSubscriber", () => {
  beforeEach(() => vi.clearAllMocks());

  it("menyimpan subscriber valid dan mengembalikan id", async () => {
    createMock.mockResolvedValue({ id: "abc" });
    const res = await createSubscriber({
      name: "Budi",
      email: "BUDI@Example.com",
      phone: "0812345678",
    });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.id).toBe("abc");
    // email dinormalisasi ke lowercase
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: "budi@example.com" }),
      }),
    );
  });

  it("menolak input tidak valid (nama terlalu pendek)", async () => {
    const res = await createSubscriber({ name: "B", email: "b@x.com" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("INVALID");
    expect(createMock).not.toHaveBeenCalled();
  });

  it("menolak email tidak valid", async () => {
    const res = await createSubscriber({ name: "Budi", email: "bukan-email" });
    expect(res.ok).toBe(false);
  });

  it("menandai DUPLICATE saat email sudah terdaftar (P2002)", async () => {
    createMock.mockRejectedValue({ code: "P2002" });
    const res = await createSubscriber({ name: "Budi", email: "a@b.com" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("DUPLICATE");
  });

  it("mengembalikan UNAVAILABLE saat database error", async () => {
    createMock.mockRejectedValue(new Error("db down"));
    const res = await createSubscriber({ name: "Budi", email: "a@b.com" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("UNAVAILABLE");
  });
});

describe("listSubscribers / countSubscribers", () => {
  it("meneruskan ke prisma", async () => {
    findManyMock.mockResolvedValue([{ id: "1" }]);
    countMock.mockResolvedValue(5);
    expect(await listSubscribers()).toHaveLength(1);
    expect(await countSubscribers()).toBe(5);
  });
});
