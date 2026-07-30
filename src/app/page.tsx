import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, LockKeyhole, ShieldCheck, WifiOff } from "lucide-react";
import { ToolSearch } from "@/components/home/ToolSearch";
import { copy } from "@/config/copy";
import { toToolSearchSummary } from "@/config/client-tools";
import { homeCategories, tools } from "@/config/tools";
import { brand, publicUrl } from "@/config/brand";
import { AdSlot } from "@/components/ads";

const homeTitle = "이미지 크기·용량·사진 규격 자동 맞춤 | 픽셀핏";
const homeDescription = "사진 압축, 크기 조절, JPG·PNG·WebP 변환, SNS 이미지, 공식 사진 규격과 개인정보 정리를 브라우저에서 처리합니다.";
const homeImage = publicUrl("/og/home.png");

export const metadata: Metadata = {
  title: { absolute: homeTitle },
  description: homeDescription,
  alternates: { canonical: publicUrl("/") },
  openGraph: { type: "website", locale: brand.locale, siteName: brand.name, title: homeTitle, description: homeDescription, url: publicUrl("/"), images: [{ url: homeImage, width: 1200, height: 630, alt: "픽셀핏 이미지 도구" }] },
  twitter: { card: "summary_large_image", title: homeTitle, description: homeDescription, images: [homeImage] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
};

export default function HomePage() {
  const toolSearchItems = tools.map(toToolSearchSummary);
  const website = { "@context": "https://schema.org", "@type": "WebSite", name: brand.name, alternateName: brand.alternateName, url: publicUrl("/"), inLanguage: "ko-KR" };
  const webApplication = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: brand.name,
    alternateName: brand.alternateName,
    url: publicUrl("/"),
    description: homeDescription,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "웹 브라우저",
    browserRequirements: "JavaScript와 HTML5 Canvas를 지원하는 최신 웹 브라우저",
    inLanguage: "ko-KR",
    image: homeImage,
    isAccessibleForFree: true,
  };
  return (
    <>
      <section className="hero site-shell">
        <span className="eyebrow"><CheckCircle2 size={15} aria-hidden="true" />{copy.hero.eyebrow}</span>
        <h1>{copy.hero.title}</h1>
        <p className="hero-lead">{copy.hero.description}</p>
        <p className="privacy-pill"><LockKeyhole size={17} aria-hidden="true" />{copy.hero.privacy}</p>
        <div id="tools" className="home-tool-discovery"><ToolSearch presets={toolSearchItems} categories={homeCategories} /></div>
      </section>

      <section className="section site-shell" aria-labelledby="steps-title">
        <div className="section-heading"><span className="eyebrow">딱 세 단계</span><h2 id="steps-title">설정 공부 없이, 바로 완성</h2><p>복잡한 픽셀 입력 대신 지금 필요한 선택만 순서대로 보여드립니다.</p></div>
        <div className="steps-grid">
          {copy.steps.map(([title, description]) => <article className="step-card" key={title}><h3>{title}</h3><p>{description}</p></article>)}
        </div>
      </section>

      <div className="site-shell"><AdSlot placement="home-content-break" /></div>

      <section className="section site-shell">
        <div className="trust-panel">
          <div><span className="eyebrow">로컬 우선 설계</span><h2>사진이 밖으로 나가지 않는 가장 단순한 방법.</h2></div>
          <div className="trust-list">
            <div className="trust-item"><WifiOff size={22} aria-hidden="true" /><div><strong>사진 업로드 없음</strong><span>사진 파일이나 사진에서 찾은 얼굴 위치를 서버로 보내지 않습니다.</span></div></div>
            <div className="trust-item"><ShieldCheck size={22} aria-hidden="true" /><div><strong>브라우저 메모리만 사용</strong><span>새로고침하면 작업이 사라지고 localStorage·IndexedDB에 사진을 저장하지 않습니다.</span></div></div>
            <div className="trust-item"><LockKeyhole size={22} aria-hidden="true" /><div><strong>출처 정보는 우회하지 않음</strong><span>개인정보성 메타데이터만 선택하며 C2PA 같은 출처 표시는 제거 대상으로 제공하지 않습니다.</span></div></div>
            <Link className="card-link" href="/privacy" prefetch={false}>개인정보 처리 방식 자세히 보기 <ArrowRight size={17} /></Link>
          </div>
        </div>
      </section>

      <section className="section site-shell" aria-labelledby="home-faq">
        <div className="section-heading"><h2 id="home-faq">자주 묻는 질문</h2></div>
        <div className="faq-list">
          <details><summary>공식 규격과 일반 규격은 무엇이 다른가요?</summary><p>공식 규격은 기관이 공개한 현재 출처를 연결합니다. 일반 규격은 널리 쓰이는 관행이며, 제출기관이 별도 요구를 할 수 있습니다.</p></details>
          <details><summary>여권사진을 예쁘게 보정해 주나요?</summary><p>아니요. 공식 사진은 회전·원본 비율 크롭·리사이즈·압축만 허용하며 배경 합성이나 얼굴 보정을 실행할 수 없게 막았습니다.</p></details>
          <details><summary>다운로드한 파일은 어디에 저장되나요?</summary><p>브라우저의 다운로드 설정에 따라 사용자의 기기에 저장됩니다. 픽셀핏 서버에는 복사본이 생기지 않습니다.</p></details>
        </div>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(website).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplication).replace(/</g, "\\u003c") }} />
    </>
  );
}
