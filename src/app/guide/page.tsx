import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenCheck } from "lucide-react";
import { brand, publicUrl } from "@/config/brand";
import { guides } from "@/config/guides";

const title = "사진 크기·형식·개인정보 가이드";
const description = "여권사진 픽셀, 500KB 압축, 증명사진 크기, DPI, YouTube 안전영역, 파비콘, EXIF와 이미지 형식을 실제 예시로 설명합니다.";
const ogImage = "/og/guides/index.png";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: publicUrl("/guide") },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: brand.name,
    title,
    description,
    url: publicUrl("/guide"),
    images: [{ url: publicUrl(ogImage), width: 1200, height: 630, alt: "픽셀핏 이미지 가이드 모음" }],
  },
  twitter: { card: "summary_large_image", title, description, images: [publicUrl(ogImage)] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
};

export default function GuidePage() {
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: title,
    itemListElement: guides.map((guide, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: guide.title,
      url: publicUrl(`/guide/${guide.slug}`),
    })),
  };

  return (
    <>
      <header className="tool-hero site-shell">
        <div>
          <span className="eyebrow"><BookOpenCheck size={15} aria-hidden="true" />픽셀핏 가이드</span>
          <h1>숫자를 이해하면 결과를 더 정확히 확인할 수 있습니다.</h1>
          <p>도구를 쓰기 전에 알아둘 크기, 용량, 형식과 개인정보 기준을 계산 예시와 공식 출처로 정리했습니다.</p>
        </div>
        <div className="spec-stack"><span>독립 가이드</span><strong>{guides.length}개</strong><span style={{ marginTop: ".65rem" }}>이미지 처리</span><strong>브라우저 기기 내 처리</strong></div>
      </header>

      <section className="section site-shell" aria-labelledby="guide-list-title">
        <div className="section-heading">
          <h2 id="guide-list-title">필요한 주제부터 읽어보세요.</h2>
          <p>각 글의 내용 업데이트일과 외부 출처 확인일은 서로 구분해 표시합니다.</p>
        </div>
        <div className="tool-grid">
          {guides.map((guide) => (
            <article className="tool-card" key={guide.slug}>
              <div className="card-top"><span className="badge">{guide.category}</span><time dateTime={guide.seo.contentUpdatedAt} aria-label={`내용 업데이트 ${guide.seo.contentUpdatedAt}`} style={{ color: "#667386", fontSize: ".75rem" }}>{guide.seo.contentUpdatedAt}</time></div>
              <h3>{guide.title}</h3>
              <p>{guide.summary}</p>
              <div className="card-spec">출처 확인 <time dateTime={guide.source.lastVerifiedAt}>{guide.source.lastVerifiedAt}</time></div>
              <Link className="card-link" href={`/guide/${guide.slug}`} aria-label={`${guide.title} 읽기`}>가이드 읽기 <ArrowRight size={17} aria-hidden="true" /></Link>
            </article>
          ))}
        </div>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList).replace(/</g, "\\u003c") }} />
    </>
  );
}
