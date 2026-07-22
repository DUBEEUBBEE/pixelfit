import type { MetadataRoute } from "next";
import { publicUrl } from "@/config/brand";
import { presets } from "@/lib/presets";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/privacy", "/terms", "/guide"];
  return [...staticRoutes, ...presets.map((preset) => `/${preset.slug}`)].map((route) => ({ url: publicUrl(route || "/"), changeFrequency: route ? "monthly" : "weekly", priority: route ? 0.8 : 1 }));
}
