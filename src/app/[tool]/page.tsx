import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ExternalLink, Landmark } from "lucide-react";
import { notFound } from "next/navigation";
import { ToolWorkspace } from "@/components/preset/ToolWorkspace";
import { PresetCard } from "@/components/preset/PresetCard";
import { brand, publicUrl } from "@/config/brand";
import { formatBytes } from "@/lib/files/validation";
import { getPreset, presets } from "@/lib/presets";

type Props = { params: Promise<{ tool: string }> };

export function generateStaticParams() {
  return presets.map((preset) => ({ tool: preset.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tool } = await params;
  const preset = getPreset(tool);
  if (!preset) return {};
  const title = `${preset.title} 자동 제작`;
  const description = `${preset.shortDescription} 사진은 서버로 보내지 않고 브라우저에서 처리합니다.`;
  return {
    title,
    description,
    alternates: { canonical: publicUrl(`/${preset.slug}`) },
    openGraph: { title, description, type: "website", url: publicUrl(`/${preset.slug}`), locale: brand.locale },
    twitter: { card: "summary", title, description },
  };
}

export default async function ToolPage({ params }: Props) {
  const { tool } = await params;
  const preset = getPreset(tool);
  if (!preset) notFound();
  const spec = preset.output.width && preset.output.height
    ? `${preset.output.width} × ${preset.output.height}px${preset.output.maxBytes ? ` · ${formatBytes(preset.output.maxBytes)} 이하` : ""}`
    : preset.id === "favicon-maker" ? "ICO · PNG · ZIP 패키지" : "JPEG · PNG · WebP 메타데이터";
  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: preset.faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })),
  };
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: brand.url },
      { "@type": "ListItem", position: 2, name: preset.title, item: publicUrl(`/${preset.slug}`) },
    ],
  };
  const related = presets.filter((candidate) => candidate.id !== preset.id).slice(0, 3);

  return (
    <>
      <header className="tool-hero site-shell">
        <div>
          <nav className="breadcrumbs" aria-label="현재 위치"><Link href="/">홈</Link><ChevronRight size={14} /><span aria-current="page">{preset.title}</span></nav>
          <span className={`badge ${preset.sourceKind === "official" ? "official" : ""}`}>{preset.sourceKind === "official" && <Landmark size={12} />}{preset.sourceKind === "official" ? "공식 출처 기반" : "일반·서비스 규격"}</span>
          <h1>{preset.title}</h1>
          <p>{preset.shortDescription} 복잡한 픽셀 설정 없이 사진 한 장으로 시작하세요.</p>
        </div>
        <div className="spec-stack"><span>기본 출력</span><strong>{spec}</strong>{preset.output.physicalLabel && <><span style={{ marginTop: ".65rem" }}>인화 기준</span><strong>{preset.output.physicalLabel}</strong></>}</div>
      </header>

      <div className="site-shell"><ToolWorkspace presetId={preset.id} /></div>

      <section className="section site-shell" aria-labelledby="source-heading">
        <div className="tool-info">
          <div><span className="eyebrow">기준과 한계</span><h2 id="source-heading">알고 만들면 더 안전합니다.</h2></div>
          <div>
            <p>{preset.compliance.disclaimer}</p>
            <ul className="limitation-list">{preset.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul>
            {preset.source ? <div className="source-box"><strong>{preset.source.authority}</strong><br />{preset.source.title}<br />규격 확인일 {preset.source.lastVerifiedAt}<br /><a href={preset.source.url} target="_blank" rel="noreferrer">공식 출처에서 다시 확인 <ExternalLink size={13} style={{ display: "inline" }} /></a></div> : <div className="source-box"><strong>일반·서비스 규격</strong><br />법정 범용 규격이 아니며 제출처의 별도 요구가 우선합니다.</div>}
          </div>
        </div>
      </section>

      <section className="section site-shell" aria-labelledby="tool-faq">
        <div className="section-heading"><h2 id="tool-faq">{preset.title} 자주 묻는 질문</h2></div>
        <div className="faq-list">{preset.faqs.map((faq) => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</div>
      </section>

      <section className="section site-shell" aria-labelledby="related-heading">
        <div className="section-heading"><h2 id="related-heading">다른 규격도 바로 만들기</h2></div>
        <div className="tool-grid">{related.map((candidate) => <PresetCard key={candidate.id} preset={candidate} />)}</div>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs).replace(/</g, "\\u003c") }} />
    </>
  );
}
