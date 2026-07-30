import type { MetadataRoute } from "next";
import { publicUrl } from "@/config/brand";
import { guides } from "@/config/guides";
import { tools } from "@/config/tools";

export const dynamic = "force-static";

const staticRoutes = [
  { path: "/", updatedAt: "2026-07-26" },
  { path: "/about", updatedAt: "2026-07-26" },
  { path: "/contact", updatedAt: "2026-07-26" },
  { path: "/privacy", updatedAt: "2026-07-26" },
  { path: "/terms", updatedAt: "2026-07-26" },
  { path: "/guide", updatedAt: "2026-07-26" },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...staticRoutes.map((route) => ({ url: publicUrl(route.path), lastModified: route.updatedAt })),
    ...tools.map((tool) => ({ url: publicUrl(`/${tool.slug}`), lastModified: tool.seo.contentUpdatedAt })),
    ...guides.map((guide) => ({ url: publicUrl(`/guide/${guide.slug}`), lastModified: guide.seo.contentUpdatedAt })),
  ];
}
