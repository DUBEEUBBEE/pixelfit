import Link from "next/link";
import { ArrowRight, ChevronRight, ExternalLink } from "lucide-react";
import { brand, publicUrl } from "@/config/brand";
import { getGuide, type GuideDefinition } from "@/config/guides";
import { buildOrganizationStructuredData } from "@/config/organization";
import { AdSlot } from "@/components/ads";

function jsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function guideStructuredData(guide: GuideDefinition) {
  const canonical = publicUrl(`/guide/${guide.slug}`);
  const author = {
    "@type": "Person",
    name: brand.operatorName,
    url: publicUrl("/about"),
  };
  return {
    breadcrumb: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "홈", item: publicUrl("/") },
        { "@type": "ListItem", position: 2, name: "가이드", item: publicUrl("/guide") },
        { "@type": "ListItem", position: 3, name: guide.title, item: canonical },
      ],
    },
    article: {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: guide.title,
      description: guide.seo.description,
      mainEntityOfPage: canonical,
      url: canonical,
      image: {
        "@type": "ImageObject",
        url: publicUrl(guide.seo.ogImage),
        width: 1200,
        height: 630,
      },
      datePublished: guide.seo.contentPublishedAt,
      dateModified: guide.seo.contentUpdatedAt,
      author,
      publisher: buildOrganizationStructuredData(),
      inLanguage: "ko-KR",
      proficiencyLevel: "Beginner",
      keywords: guide.keywords.join(", "),
      citation: guide.source.url,
      isPartOf: { "@type": "WebSite", name: brand.name, url: publicUrl("/") },
    },
  };
}

export function GuideArticle({ guide }: { guide: GuideDefinition }) {
  const relatedGuides = guide.relatedGuideSlugs
    .map((slug) => getGuide(slug))
    .filter((candidate): candidate is GuideDefinition => candidate !== undefined);
  const structuredData = guideStructuredData(guide);

  return (
    <div className="page-content site-shell">
      <nav className="breadcrumbs" aria-label="현재 위치">
        <Link href="/" prefetch={false}>홈</Link>
        <ChevronRight size={14} aria-hidden="true" />
        <Link href="/guide" prefetch={false}>가이드</Link>
        <ChevronRight size={14} aria-hidden="true" />
        <span aria-current="page">{guide.title}</span>
      </nav>

      <div className="content-layout">
        <article className="prose">
          <span className="eyebrow">{guide.category}</span>
          <h1 style={{ marginTop: "1rem" }}>{guide.title}</h1>
          <p style={{ fontSize: "1.08rem", maxWidth: "760px" }}>{guide.summary}</p>

          <div className="info-box" style={{ display: "block", marginTop: "1.4rem" }}>
            <strong>작성·검토: {brand.operatorName}</strong>
            <div style={{ marginTop: ".35rem" }}>
              최초 게시 <time dateTime={guide.seo.contentPublishedAt}>{guide.seo.contentPublishedAt}</time>
              {" · "}
              내용 업데이트 <time dateTime={guide.seo.contentUpdatedAt}>{guide.seo.contentUpdatedAt}</time>
              {" · "}
              출처 확인 <time dateTime={guide.source.lastVerifiedAt}>{guide.source.lastVerifiedAt}</time>
            </div>
          </div>

          <nav aria-labelledby="guide-toc-title" style={{ marginTop: "1.6rem", padding: "1rem 1.2rem", border: "1px solid #dfe5e8", borderRadius: "16px", background: "#fff" }}>
            <h2 id="guide-toc-title" style={{ marginTop: 0, fontSize: "1.15rem" }}>이 글의 순서</h2>
            <ol style={{ marginBottom: 0 }}>
              <li><a href="#problem-situation">이런 상황에서 필요합니다</a></li>
              {guide.sections.map((section) => <li key={section.id}><a href={`#${section.id}`}>{section.title}</a></li>)}
              <li><a href="#worked-example">{guide.example.title}</a></li>
              <li><a href="#source-record">출처와 확인일</a></li>
            </ol>
          </nav>

          <section id="problem-situation" aria-labelledby="problem-situation-title">
            <h2 id="problem-situation-title">이런 상황에서 필요합니다</h2>
            <p>{guide.problem}</p>
          </section>

          {guide.sections.map((section) => (
            <section id={section.id} key={section.id} aria-labelledby={`${section.id}-title`}>
              <h2 id={`${section.id}-title`}>{section.title}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.bullets && <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}
            </section>
          ))}

          <section id="worked-example" aria-labelledby="worked-example-title">
            <h2 id="worked-example-title">{guide.example.title}</h2>
            <div style={{ maxWidth: "100%", overflowX: "auto", border: "1px solid #dfe5e8", borderRadius: "16px", background: "#fff" }}>
              <table style={{ width: "100%", minWidth: "660px", borderCollapse: "collapse", fontSize: ".9rem" }}>
                <caption style={{ textAlign: "left", padding: "1rem", color: "#4f5e72", borderBottom: "1px solid #dfe5e8" }}>{guide.example.caption}</caption>
                <thead>
                  <tr>
                    {guide.example.headers.map((header) => <th key={header} scope="col" style={{ padding: ".8rem", textAlign: "left", background: "#eef7f3", borderBottom: "1px solid #dfe5e8" }}>{header}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {guide.example.rows.map((row) => (
                    <tr key={row.join("|")}>
                      {row.map((cell, index) => index === 0
                        ? <th key={cell} scope="row" style={{ padding: ".8rem", textAlign: "left", borderBottom: "1px solid #edf0f2" }}>{cell}</th>
                        : <td key={`${index}-${cell}`} style={{ padding: ".8rem", color: "#4f5e72", borderBottom: "1px solid #edf0f2" }}>{cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <AdSlot placement="guide-content-break" />

          <section aria-labelledby="guide-tools-title">
            <h2 id="guide-tools-title">사진을 기기 안에서 바로 처리하기</h2>
            <div className="tool-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
              {guide.toolCtas.map((cta) => (
                <article className="tool-card" key={cta.href} style={{ minHeight: "210px" }}>
                  <span className="badge">관련 도구</span>
                  <h3>{cta.label}</h3>
                  <p>{cta.description}</p>
                  <Link className="card-link" href={cta.href} prefetch={false}>도구 열기 <ArrowRight size={17} aria-hidden="true" /></Link>
                </article>
              ))}
            </div>
          </section>

          <section id="source-record" aria-labelledby="source-record-title">
            <h2 id="source-record-title">출처와 확인일</h2>
            <div className="source-box">
              <strong>{guide.source.authority}</strong><br />
              {guide.source.title}<br />
              출처 확인일 <time dateTime={guide.source.lastVerifiedAt}>{guide.source.lastVerifiedAt}</time><br />
              <a href={guide.source.url} target="_blank" rel="noreferrer">원문에서 최신 내용 확인 <ExternalLink size={13} aria-hidden="true" style={{ display: "inline" }} /></a>
            </div>
            <p>출처 확인일은 외부 문서를 마지막으로 확인한 날짜이고, 내용 업데이트일은 이 가이드 본문을 실제로 수정한 날짜입니다. 두 날짜가 같더라도 의미는 다릅니다.</p>
          </section>
        </article>

        <aside className="side-note" aria-labelledby="related-guides-title">
          <h2 id="related-guides-title">관련 가이드</h2>
          <ul style={{ margin: ".75rem 0 0", paddingLeft: "1.1rem" }}>
            {relatedGuides.map((related) => (
              <li key={related.slug} style={{ marginTop: ".65rem" }}>
                <Link href={`/guide/${related.slug}`} prefetch={false}>{related.title}</Link>
              </li>
            ))}
          </ul>
          <Link className="card-link" href="/guide" prefetch={false} style={{ marginTop: "1rem" }}>가이드 전체 보기 <ArrowRight size={15} aria-hidden="true" /></Link>
        </aside>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData.breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData.article) }} />
    </div>
  );
}
