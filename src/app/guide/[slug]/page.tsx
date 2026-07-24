import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuideArticle } from "@/components/content/GuideArticle";
import { brand, publicUrl } from "@/config/brand";
import { getGuide, guides } from "@/config/guides";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return guides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};

  const canonical = publicUrl(`/guide/${guide.slug}`);
  const image = publicUrl(guide.seo.ogImage);
  return {
    title: guide.seo.title,
    description: guide.seo.description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      locale: brand.locale,
      siteName: brand.name,
      title: guide.seo.title,
      description: guide.seo.description,
      url: canonical,
      publishedTime: guide.seo.contentPublishedAt,
      modifiedTime: guide.seo.contentUpdatedAt,
      images: [{ url: image, width: 1200, height: 630, alt: `${guide.title} — ${brand.name}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: guide.seo.title,
      description: guide.seo.description,
      images: [image],
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  };
}

export default async function GuideDetailPage({ params }: Props) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();
  return <GuideArticle guide={guide} />;
}
