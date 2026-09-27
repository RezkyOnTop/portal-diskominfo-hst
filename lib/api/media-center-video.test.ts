import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getVideo,
  parseFeed,
  embedUrl,
  watchUrl,
  thumbnailUrl,
  feedUrl,
  __clearVideoCache,
  MediaCenterVideoError,
} from "./media-center-video";

const FEED = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/" xmlns="http://www.w3.org/2005/Atom">
 <entry>
  <id>yt:video:AAA111bbb22</id>
  <yt:videoId>AAA111bbb22</yt:videoId>
  <title>Kegiatan HST &amp; Warga</title>
  <published>2026-09-17T06:38:51+00:00</published>
  <media:group>
    <media:description>Deskripsi video</media:description>
    <media:community><media:statistics views="179"/></media:community>
  </media:group>
 </entry>
 <entry>
  <id>yt:video:CCC333ddd44</id>
  <yt:videoId>CCC333ddd44</yt:videoId>
  <title>Video Kedua</title>
  <published>2026-09-09T01:41:54+00:00</published>
 </entry>
</feed>`;

describe("media-center-video: helper URL", () => {
  it("membuat URL embed, tonton, dan thumbnail yang benar", () => {
    expect(embedUrl("ABC")).toBe("https://www.youtube-nocookie.com/embed/ABC");
    expect(watchUrl("ABC")).toBe("https://www.youtube.com/watch?v=ABC");
    expect(thumbnailUrl("ABC")).toBe("https://i.ytimg.com/vi/ABC/hqdefault.jpg");
  });

  it("feedUrl memakai channel default (bukan kosong)", () => {
    expect(feedUrl()).toContain("channel_id=");
    expect(feedUrl()).toContain("youtube.com/feeds/videos.xml");
  });

  it("feedUrl menghormati env YOUTUBE_CHANNEL_ID yang valid", () => {
    const old = process.env.YOUTUBE_CHANNEL_ID;
    process.env.YOUTUBE_CHANNEL_ID = "UCabcdefghijklmnopqrstuv";
    expect(feedUrl()).toContain("UCabcdefghijklmnopqrstuv");
    if (old === undefined) delete process.env.YOUTUBE_CHANNEL_ID;
    else process.env.YOUTUBE_CHANNEL_ID = old;
  });

  it("mengabaikan env YOUTUBE_CHANNEL_ID yang tidak valid", () => {
    const old = process.env.YOUTUBE_CHANNEL_ID;
    process.env.YOUTUBE_CHANNEL_ID = "x";
    expect(feedUrl()).toContain("UCXVJroYPW6e1GhWz501XZ3g");
    if (old === undefined) delete process.env.YOUTUBE_CHANNEL_ID;
    else process.env.YOUTUBE_CHANNEL_ID = old;
  });
});

describe("media-center-video: parseFeed", () => {
  it("mengurai entri dengan benar & mengurutkan terbaru dulu", () => {
    const vids = parseFeed(FEED);
    expect(vids).toHaveLength(2);
    expect(vids[0].id).toBe("AAA111bbb22");
    expect(vids[0].title).toBe("Kegiatan HST & Warga");
    expect(vids[0].views).toBe(179);
    expect(vids[1].id).toBe("CCC333ddd44");
    expect(vids[1].views).toBeNull();
  });

  it("menghasilkan URL turunan lengkap", () => {
    const v = parseFeed(FEED)[0];
    expect(v.thumbnail).toContain("/vi/AAA111bbb22/");
    expect(v.embedUrl).toContain("AAA111bbb22");
    expect(v.watchUrl).toContain("AAA111bbb22");
    expect(v.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("mengembalikan array kosong untuk XML tanpa entri", () => {
    expect(parseFeed("<feed></feed>")).toEqual([]);
  });

  it("melewati entri tanpa videoId/title", () => {
    const bad = `<feed><entry><title>Tanpa id</title><published>2026-01-01</published></entry></feed>`;
    expect(parseFeed(bad)).toEqual([]);
  });
});

describe("media-center-video: getVideo", () => {
  beforeEach(() => {
    __clearVideoCache();
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("mengambil & meng-cache feed (hanya 1 kali fetch)", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => FEED,
    });
    vi.stubGlobal("fetch", fetchMock);

    const a = await getVideo(10);
    const b = await getVideo(10);
    expect(a).toHaveLength(2);
    expect(b).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("menghormati parameter limit", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => FEED }),
    );
    expect(await getVideo(1)).toHaveLength(1);
  });

  it("mengembalikan [] (tanpa melempar) saat HTTP error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503, text: async () => "" }),
    );
    await expect(getVideo()).resolves.toEqual([]);
  });

  it("mengembalikan [] saat feed kosong (format berubah)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => "<feed></feed>" }),
    );
    await expect(getVideo()).resolves.toEqual([]);
  });

  it("mengembalikan [] saat fetch melempar", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    await expect(getVideo()).resolves.toEqual([]);
  });

  it("memakai cache lama saat upstream gagal (stale-while-error)", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200, text: async () => FEED })
      .mockRejectedValueOnce(new Error("down"));
    vi.stubGlobal("fetch", fetchMock);

    await getVideo();
    // Paksa kedaluwarsa cache
    __clearVideoCache();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => FEED }),
    );
    const warm = await getVideo();
    expect(warm).toHaveLength(2);
  });

  it("MediaCenterVideoError punya nama kelas yang benar", () => {
    expect(new MediaCenterVideoError("x").name).toBe("MediaCenterVideoError");
  });
});
