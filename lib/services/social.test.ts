import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({
  prisma: {
    socialMediaCache: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";
import { getSocialFeed, saveSocialCache } from "./social";

const findManyMock = prisma.socialMediaCache.findMany as unknown as ReturnType<
  typeof vi.fn
>;
const createMock = prisma.socialMediaCache.create as unknown as ReturnType<typeof vi.fn>;

describe("getSocialFeed", () => {
  beforeEach(() => vi.clearAllMocks());

  it("memetakan payload cache menjadi item feed", async () => {
    findManyMock.mockResolvedValue([
      {
        platform: "instagram",
        payload: [{ title: "Post 1", url: "https://ig/1", imageUrl: "x.jpg", date: "2026" }],
      },
    ]);
    const items = await getSocialFeed();
    expect(items).toHaveLength(1);
    expect(items[0]!.platform).toBe("instagram");
    expect(items[0]!.title).toBe("Post 1");
  });

  it("mengembalikan array kosong bila payload bukan array", async () => {
    findManyMock.mockResolvedValue([{ platform: "x", payload: { a: 1 } }]);
    expect(await getSocialFeed()).toEqual([]);
  });

  it("mengembalikan array kosong saat DB error (tidak memecahkan halaman)", async () => {
    findManyMock.mockRejectedValue(new Error("db down"));
    expect(await getSocialFeed()).toEqual([]);
  });
});

describe("saveSocialCache", () => {
  beforeEach(() => vi.clearAllMocks());

  it("menyimpan cache dengan expiresAt di masa depan", async () => {
    createMock.mockResolvedValue({ id: "c1" });
    await saveSocialCache("instagram", [], 900);
    expect(createMock).toHaveBeenCalledOnce();
    const arg = createMock.mock.calls[0]![0] as { data: { expiresAt: Date } };
    expect(arg.data.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("menelan error saat penyimpanan cache gagal", async () => {
    createMock.mockRejectedValue(new Error("db down"));
    await expect(saveSocialCache("x", [], 60)).resolves.toBeUndefined();
  });
});
