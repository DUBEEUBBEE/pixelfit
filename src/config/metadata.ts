import type { Metadata } from "next";
import { brand, publicUrl } from "./brand";

export function buildPageMetadata({ title, description, path, image = "/og/home.png" }: { title: string; description: string; path: string; image?: string }): Metadata {
  const canonical = publicUrl(path);
  const imageUrl = publicUrl(image);
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: "website", locale: brand.locale, siteName: brand.name, title, description, url: canonical, images: [{ url: imageUrl, width: 1200, height: 630, alt: `${title} — ${brand.name}` }] },
    twitter: { card: "summary_large_image", title, description, images: [imageUrl] },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  };
}
