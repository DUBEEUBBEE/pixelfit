import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { brand } from "@/config/brand";
import { getGuide } from "@/config/guides";
import { GuideArticle } from "./GuideArticle";

vi.mock("@/components/ads", () => ({ AdSlot: () => null }));

describe("GuideArticle", () => {
  it("renders an accessible article, table, CTAs, dates, and supported structured data", () => {
    const guide = getGuide("passport-photo-413x531");
    if (!guide) throw new Error("guide fixture missing");
    const { container } = render(<GuideArticle guide={guide} />);

    expect(screen.getByRole("heading", { level: 1, name: guide.title })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "현재 위치" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "이 글의 순서" })).toBeInTheDocument();
    expect(screen.getAllByText(/내용 업데이트/).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "이런 상황에서 필요합니다" })).toBeInTheDocument();
    expect(screen.getByText(/출처 확인일은 외부 문서를 마지막으로 확인한 날짜/)).toBeInTheDocument();

    const table = screen.getByRole("table", { name: guide.example.caption });
    expect(within(table).getAllByRole("row")).toHaveLength(guide.example.rows.length + 1);
    expect(screen.getByRole("heading", { name: "여권사진 도구 열기" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /원문에서 최신 내용 확인/ })).toHaveAttribute("href", guide.source.url);

    const structuredData = [...container.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]')]
      .map((script) => JSON.parse(script.innerHTML));
    expect(structuredData.map((item) => item["@type"])).toEqual(["BreadcrumbList", "Article"]);
    expect(structuredData[1]).toMatchObject({
      author: { "@type": "Organization", name: "픽셀핏 운영자" },
      publisher: { "@type": "Organization", name: "픽셀핏 운영자" },
    });
    expect(JSON.stringify(structuredData)).not.toContain("FAQPage");
    expect(structuredData[1].dateModified).toBe(guide.seo.contentUpdatedAt);
    expect(structuredData[1].datePublished).toBe(guide.seo.contentPublishedAt);
    expect(structuredData[1].author.name).toBe(brand.operatorName);
    expect(structuredData[1].citation).toBe(guide.source.url);
  });
});
