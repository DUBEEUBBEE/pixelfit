import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AboutPage from "./about/page";
import ContactPage from "./contact/page";
import PrivacyPage from "./privacy/page";
import TermsPage from "./terms/page";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { publicUrl } from "@/config/brand";

describe("public trust pages", () => {
  it("explains PixelFit from the user's perspective and publishes one Organization identity", () => {
    const { container } = render(<AboutPage />);

    expect(screen.getByRole("heading", { level: 1, name: "사진 규격을 몰라도 바로 만들 수 있도록" })).toBeInTheDocument();
    expect(screen.getByText(/전문 편집기를 배우지 않아도/)).toBeInTheDocument();
    expect(screen.getByText(/개발·운영:/)).toHaveTextContent("DUBEEUBBEE");
    expect(screen.getByRole("link", { name: "wodnd0823@gmail.com" })).toHaveAttribute("href", "mailto:wodnd0823@gmail.com");
    expect(screen.getByRole("link", { name: "GitHub Issues" })).toHaveAttribute(
      "href",
      "https://github.com/DUBEEUBBEE/pixelfit/issues",
    );
    expect(container).not.toHaveTextContent("AdSense client");
    expect(container).not.toHaveTextContent("광고 feature flag");

    const organizationScript = container.querySelector<HTMLScriptElement>('script[type="application/ld+json"]');
    expect(organizationScript).not.toBeNull();
    expect(JSON.parse(organizationScript?.innerHTML ?? "{}")).toMatchObject({
      "@type": "Organization",
      name: "픽셀핏",
      alternateName: "PixelFit",
      url: publicUrl("/"),
      email: "wodnd0823@gmail.com",
    });
  });

  it("separates email inquiries from the public bug-reporting channel", () => {
    render(<ContactPage />);

    expect(screen.getByRole("heading", { name: "일반 문의" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "기능 오류 제보" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "규격 오류 제보" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "개인정보 관련 문의" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "wodnd0823@gmail.com" })).toHaveAttribute("href", "mailto:wodnd0823@gmail.com");
    expect(screen.getByRole("link", { name: "GitHub Issues에서 기능 오류 제보하기" })).toHaveAttribute(
      "href",
      "https://github.com/DUBEEUBBEE/pixelfit/issues",
    );
    expect(screen.getByText(/여권사진, 주민등록증 사진, 얼굴 사진, 신분증 원본은/)).toBeInTheDocument();
    expect(screen.queryByText(/별도 운영 메일이 설정되지 않아/)).not.toBeInTheDocument();
  });

  it("keeps the real email and sensitive-image warning on policy pages", () => {
    const { unmount } = render(<PrivacyPage />);
    expect(screen.getByRole("link", { name: "wodnd0823@gmail.com" })).toHaveAttribute("href", "mailto:wodnd0823@gmail.com");
    expect(screen.getByText(/이메일과 공개 GitHub Issue 어디에도 첨부하지 마세요/)).toBeInTheDocument();

    unmount();
    render(<TermsPage />);
    expect(screen.getByText(/운영자:/)).toHaveTextContent("DUBEEUBBEE");
    expect(screen.getByRole("link", { name: "wodnd0823@gmail.com" })).toHaveAttribute("href", "mailto:wodnd0823@gmail.com");
    expect(screen.getByText(/문의 이메일이나 공개 GitHub Issue에 첨부하지 마세요/)).toBeInTheDocument();
  });

  it("shows the operator and one direct contact link in the footer", () => {
    render(<SiteFooter />);

    expect(screen.getByText(/© 2026 픽셀핏 · 운영: DUBEEUBBEE/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "wodnd0823@gmail.com" })).toHaveAttribute("href", "mailto:wodnd0823@gmail.com");
    expect(screen.getByRole("link", { name: "개인정보 안내" })).toHaveAttribute("href", "/privacy");
    expect(screen.getByRole("link", { name: "이용약관" })).toHaveAttribute("href", "/terms");
  });
});
