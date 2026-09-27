import type { MetadataRoute } from "next";
import { getBerita } from "@/lib/api/media-center";
import { SITE } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE.url, changeFrequency: "daily", priority: 1 },
    { url: `${SITE.url}/berita`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE.url}/pengumuman`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE.url}/hoaks`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE.url}/radio`, changeFrequency: "monthly", priority: 0.5 },
  ];

  try {
    const { data } = await getBerita({ limit: 200 });
    const beritaRoutes: MetadataRoute.Sitemap = data.map((b) => ({
      url: `${SITE.url}/berita/${b.slug}`,
      lastModified: b.publishedAt,
      changeFrequency: "weekly",
      priority: 0.6,
    }));
    return [...staticRoutes, ...beritaRoutes];
  } catch {
    // Bila API Media Center tidak tersedia, tetap sajikan rute statis.
    return staticRoutes;
  }
}
