import Link from "next/link";
import { brand, publicUrl } from "@/config/brand";
import { buildPageMetadata } from "@/config/metadata";

export const metadata = buildPageMetadata({ title: "픽셀핏 소개", description: "픽셀핏의 로컬 이미지 처리 원칙, 운영 주체, 규격 정보와 검증 범위를 소개합니다.", path: "/about" });

export default function AboutPage() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand.operatorName,
    alternateName: brand.name,
    url: publicUrl("/about"),
  };

  return (
    <div className="page-content site-shell">
      <div className="content-layout">
        <article className="prose">
          <h1>이미지 작업을 기기 안에서 끝내는 도구</h1>
          <p>{brand.name}은 증명사진, 배너, 파비콘처럼 제출처마다 다른 규격을 브라우저에서 맞추도록 돕는 독립 웹 도구입니다.</p>

          <h2>운영 원칙</h2>
          <ul>
            <li>사용자가 고른 원본과 결과 이미지를 픽셀핏 서버로 업로드하지 않습니다.</li>
            <li>공식 규격과 일반적인 제작 관행을 구분하고, 확인한 출처와 한계를 함께 설명합니다.</li>
            <li>기관 승인, 검색 노출, 광고 승인을 받은 것처럼 표현하지 않습니다.</li>
            <li>실제 코드로 검증하지 않은 보존·삭제·품질 결과를 보장하지 않습니다.</li>
          </ul>

          <h2>운영 주체</h2>
          <p>운영자 표기: <strong>{brand.operatorName}</strong></p>
          <p>제품 오류, 접근성 문제, 규격 출처 정정 요청은 <Link href="/contact">문의 안내</Link>를 통해 접수할 수 있습니다.</p>

          <h2>광고와 서비스 운영</h2>
          <p>AdSense는 기본적으로 꺼져 있으며 실제 계정·슬롯·동의 관리가 준비된 빌드에서만 콘텐츠 구간에 표시할 수 있습니다. 광고는 이미지 처리 정확도나 공식 승인과 무관하고, 업로드·편집·생성·다운로드 조작부에는 배치하지 않습니다.</p>

          <h2>독립 서비스 안내</h2>
          <p>픽셀핏은 여권 발급 기관, YouTube, Google, Naver 또는 그 밖의 제출처가 운영하거나 인증한 서비스가 아닙니다. 제출 전에는 해당 기관의 최신 안내와 생성된 파일을 직접 확인해야 합니다.</p>
        </article>
        <aside className="side-note">
          <h2>확인일</h2>
          <p>페이지 최종 검토<br />2026년 7월 24일</p>
        </aside>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization).replace(/</g, "\\u003c") }}
      />
    </div>
  );
}
