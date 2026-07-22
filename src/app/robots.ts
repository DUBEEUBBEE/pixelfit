import type { MetadataRoute } from "next";
import { brand, publicPath, publicUrl } from "@/config/brand";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: publicPath("/") }, sitemap: publicUrl("/sitemap.xml"), host: new URL(brand.url).origin };
}
