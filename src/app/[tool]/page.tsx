import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronRight, ExternalLink, Landmark } from "lucide-react";
import { notFound } from "next/navigation";
import { ToolWorkspace } from "@/components/preset/ToolWorkspace";
import { PresetCard } from "@/components/preset/PresetCard";
import { brand, publicUrl } from "@/config/brand";
import { toToolCardSummary } from "@/config/client-tools";
import { isOfficialBadge, toolBadgeCopy } from "@/config/tool-badges";
import { getTool, tools } from "@/config/tools";
import { AdSlot } from "@/components/ads";
import { SampleGallery } from "@/components/content/SampleGallery";
import { getPreset } from "@/lib/presets";

type Props = { params: Promise<{ tool: string }> };

export function generateStaticParams() {
  return tools.map((tool) => ({ tool: tool.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tool: slug } = await params;
  const tool = getTool(slug);
  if (!tool) return {};
  const title = tool.seo.title;
  const description = tool.seo.description;
  const image = publicUrl(tool.seo.ogImage);
  return {
    title,
    description,
    alternates: { canonical: publicUrl(`/${tool.slug}`) },
    openGraph: { title: tool.seo.ogTitle ?? title, description: tool.seo.ogDescription ?? description, type: "website", url: publicUrl(`/${tool.slug}`), locale: brand.locale, siteName: brand.name, images: [{ url: image, width: 1200, height: 630, alt: `${tool.title} — 픽셀핏 한국어 이미지 도구 안내` }] },
    twitter: { card: "summary_large_image", title: tool.seo.ogTitle ?? title, description: tool.seo.ogDescription ?? description, images: [image] },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  };
}

export default async function ToolPage({ params }: Props) {
  const { tool: slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: publicUrl("/") },
      { "@type": "ListItem", position: 2, name: tool.title, item: publicUrl(`/${tool.slug}`) },
    ],
  };
  const webApplication = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.title,
    url: publicUrl(`/${tool.slug}`),
    description: tool.seo.description,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "웹 브라우저",
    browserRequirements: "JavaScript와 HTML5 Canvas를 지원하는 최신 웹 브라우저",
    inLanguage: "ko-KR",
    image: publicUrl(tool.seo.ogImage),
    datePublished: tool.seo.contentPublishedAt,
    dateModified: tool.seo.contentUpdatedAt,
    isAccessibleForFree: true,
    isPartOf: { "@type": "WebSite", name: brand.name, url: publicUrl("/") },
  };
  const related = tool.nextToolIds.map((id) => getTool(id)).filter((candidate) => candidate !== undefined);
  const photoPreset = tool.workspaceKind === "photo" ? getPreset(tool.id) : undefined;
  if (tool.workspaceKind === "photo" && !photoPreset) throw new Error(`사진 프리셋을 찾을 수 없습니다: ${tool.id}`);

  return (
    <>
      <header className="tool-hero site-shell">
        <div>
          <nav className="breadcrumbs" aria-label="현재 위치"><Link href="/" prefetch={false}>홈</Link><ChevronRight size={14} aria-hidden="true" /><span aria-current="page">{tool.title}</span></nav>
          <span className={`badge ${isOfficialBadge(tool.badgeKind) ? "official" : ""}`}>{isOfficialBadge(tool.badgeKind) && <Landmark size={12} aria-hidden="true" />}{toolBadgeCopy[tool.badgeKind]}</span>
          <h1>{tool.title}</h1>
          <p>{tool.content.intro}</p>
        </div>
        <div className="spec-stack">{tool.heroFacts.map((fact, index) => <div className={index > 0 ? "spec-fact-secondary" : undefined} key={fact.label}><span>{fact.label}</span><strong>{fact.value}</strong></div>)}</div>
      </header>

      <div className="site-shell"><ToolWorkspace presetId={tool.id} workspaceKind={tool.workspaceKind} photoPreset={photoPreset} /></div>

      <div className="section site-shell"><SampleGallery toolId={tool.id} /></div>

      <section className="section site-shell content-sections" aria-labelledby="use-cases-heading">
        <div className="section-heading"><span className="eyebrow">사용 목적부터 확인</span><h2 id="use-cases-heading">이럴 때 사용하세요.</h2></div>
        <div className="content-card-grid">{tool.content.useCases.map((item) => <article className="content-card" key={item.title}><h3>{item.title}</h3><p>{item.description}</p></article>)}</div>
      </section>

      <section className="section site-shell" aria-labelledby="output-heading">
        <div className="tool-info"><div><span className="eyebrow">출력 결과와 규격</span><h2 id="output-heading">숫자의 의미를 알고 저장하세요.</h2></div><div className="stacked-sections">{tool.content.outputExplanation.map((section) => <article key={section.title}><h3>{section.title}</h3><p>{section.body}</p></article>)}</div></div>
      </section>

      <section className="section site-shell" aria-labelledby="how-to-heading">
        <div className="section-heading"><span className="eyebrow">세 단계</span><h2 id="how-to-heading">{tool.title} 사용 방법</h2></div>
        <ol className="numbered-cards">{tool.content.howTo.map((step) => <li key={step}>{step}</li>)}</ol>
      </section>

      <section className="section site-shell" aria-labelledby="mistakes-heading">
        <div className="tool-info"><div><span className="eyebrow">흔한 문제</span><h2 id="mistakes-heading">결과를 쓰기 전에 다시 볼 것</h2></div><div className="stacked-sections">{tool.content.commonMistakes.map((section) => <article key={section.title}><h3>{section.title}</h3><p>{section.body}</p></article>)}<article><h3>자동 확인 범위와 한계</h3><ul className="limitation-list">{tool.content.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul></article></div></div>
      </section>

      <section className="section site-shell" aria-labelledby="checklist-heading">
        <div className="section-heading"><h2 id="checklist-heading">제출·게시 전 체크리스트</h2></div>
        <ul className="checklist-cards">{tool.content.checklist.map((item) => <li key={item}>{item}</li>)}</ul>
        <div className="example-panel">{tool.content.examples.map((example) => <article key={example.title}><h3>{example.title}</h3><p>{example.body}</p></article>)}</div>
      </section>

      <section className="section site-shell" aria-labelledby="source-heading">
        <div className="tool-info">
          <div><span className="eyebrow">기준과 출처</span><h2 id="source-heading">공식값과 서비스값을 구분합니다.</h2></div>
          <div>
            {tool.source ? <div className="source-box"><strong>{tool.source.authority}</strong><br />{tool.source.title}<br />출처 확인일 <time dateTime={tool.source.lastVerifiedAt}>{tool.source.lastVerifiedAt}</time><br /><a href={tool.source.url} target="_blank" rel="noreferrer">공식 출처에서 다시 확인 <ExternalLink size={13} style={{ display: "inline" }} /></a></div> : <div className="source-box"><strong>{toolBadgeCopy[tool.badgeKind]}</strong><br />특정 기관이 보증한 범용 규격이 아니며 실제 제출처·플랫폼의 최신 요구가 우선합니다.</div>}
            <p className="content-dates">최초 게시 <time dateTime={tool.seo.contentPublishedAt}>{tool.seo.contentPublishedAt}</time> · 내용 수정 <time dateTime={tool.seo.contentUpdatedAt}>{tool.seo.contentUpdatedAt}</time></p>
          </div>
        </div>
      </section>

      <section className="section site-shell" aria-labelledby="tool-faq">
        <div className="section-heading"><h2 id="tool-faq">{tool.title} 자주 묻는 질문</h2></div>
        <div className="faq-list">{tool.faqs.map((faq) => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</div>
      </section>

      <div className="site-shell"><AdSlot placement="tool-explainer-end" /></div>

      {tool.content.relatedGuideIds.length > 0 && <section className="section site-shell" aria-labelledby="related-guide-heading"><div className="section-heading"><h2 id="related-guide-heading">결과를 더 잘 쓰는 가이드</h2></div><div className="guide-link-grid">{tool.content.relatedGuideIds.map((guideId) => <Link className="guide-link-card" href={`/guide/${guideId}`} prefetch={false} key={guideId}>{guideAnchor(guideId)} <ArrowRight size={16} aria-hidden="true" /></Link>)}</div></section>}

      <section className="section site-shell" aria-labelledby="related-heading">
        <div className="section-heading"><h2 id="related-heading">같은 사진으로 만들 수 있는 다른 결과</h2><p>아래 관계는 도구 목적에 맞춰 직접 연결했습니다. 편집기 결과 화면의 버튼을 누를 때만 현재 탭 메모리로 사진을 전달합니다.</p></div>
        <div className="tool-grid">{related.map((candidate) => <PresetCard key={candidate.id} preset={toToolCardSummary(candidate)} />)}</div>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplication).replace(/</g, "\\u003c") }} />
    </>
  );
}

function guideAnchor(id: string): string {
  const labels: Record<string, string> = {
    "passport-photo-413x531": "여권사진 413×531px 만드는 방법",
    "photo-under-500kb": "사진을 500KB 이하로 줄이기",
    "id-photo-size": "3×4와 3.5×4.5 증명사진 차이",
    "dpi-vs-pixels": "300dpi와 픽셀 크기 차이",
    "youtube-banner-safe-area": "유튜브 배너 안전영역 이해하기",
    "favicon-files": "파비콘 파일별 역할 알아보기",
    "exif-photo-privacy": "사진 EXIF와 위치정보 확인하기",
    "jpeg-png-webp": "JPEG·PNG·WebP 선택 기준",
  };
  return labels[id] ?? "관련 가이드 읽기";
}
