import Link from "next/link";
import { brand } from "@/config/brand";
import { buildPageMetadata } from "@/config/metadata";
import { buildOrganizationStructuredData } from "@/config/organization";

export const metadata = buildPageMetadata({
  title: "픽셀핏 소개",
  description: "사진 규격을 몰라도 목적에 맞는 결과를 기기 안에서 만들 수 있도록 돕는 픽셀핏의 운영 원칙을 소개합니다.",
  path: "/about",
});

function jsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</gu, "\\u003c");
}

export default function AboutPage() {
  const organization = buildOrganizationStructuredData({ includeContext: true });

  return (
    <div className="page-content site-shell">
      <div className="content-layout">
        <article className="prose">
          <h1>사진 규격을 몰라도 바로 만들 수 있도록</h1>
          <p>여권사진, 증명사진, 유튜브 배너, 이미지 압축처럼 목적마다 다른 픽셀·비율·용량을 매번 검색해야 하는 불편함에서 {brand.name}을 만들었습니다. 전문 편집기를 배우지 않아도 사진과 목적을 고른 뒤 필요한 위치와 확대 정도만 조절할 수 있습니다.</p>

          <h2>왜 만들었나요?</h2>
          <p>일반 사용자가 픽셀, DPI, 안전영역, 파일 용량을 모두 알아야 사진 한 장을 준비할 수 있다면 도구가 충분히 친절하지 않은 것입니다. 픽셀핏은 선택한 용도에 필요한 항목만 보여주고, 결과 파일에서 직접 확인할 수 있는 값은 다시 검사해 알려줍니다.</p>

          <h2>무엇이 다른가요?</h2>
          <p>픽셀핏은 복잡한 레이어·브러시·마스크를 제공하는 범용 사진 편집기가 아닙니다. 목적별 프리셋을 중심으로 사진을 올린 뒤 필요한 위치와 확대 정도만 조절하도록 작업 흐름을 단순하게 구성했습니다.</p>

          <h2>사진은 어떻게 처리되나요?</h2>
          <ul>
            <li>사진은 현재 탭의 브라우저 메모리에서 처리합니다.</li>
            <li>원본이나 결과 이미지를 받는 서버 업로드 API가 없습니다.</li>
            <li>사진을 localStorage, sessionStorage, IndexedDB 같은 브라우저 저장소에 저장하지 않습니다.</li>
            <li>새로고침하거나 탭을 닫으면 작업이 사라지고, 결과는 사용자가 선택한 기기로 내려받습니다.</li>
          </ul>

          <h2>규격은 어떻게 관리하나요?</h2>
          <p>공식 기관이 공개한 규격과 픽셀핏이 작업 편의를 위해 제안하는 권장값을 구분합니다. 확인할 수 있는 공식 페이지와 확인일을 함께 표시하고, 자동 검사가 판정할 수 없는 사진 내용과 실제 접수 결과도 분명히 안내합니다. 기준이 바뀌면 출처, 구현, 관련 설명을 함께 갱신합니다.</p>

          <h2>누가 운영하나요?</h2>
          <p>
            개발·운영: <strong>{brand.operatorName}</strong><br />
            문의: <a href={brand.contactHref}>{brand.contactEmail}</a><br />
            기능 오류: <a href={brand.contactUrl} target="_blank" rel="noreferrer">GitHub Issues</a>
          </p>
          <p><strong>여권사진, 얼굴 사진, 신분증 원본처럼 민감한 사진은 이메일이나 공개 Issue에 첨부하지 마세요.</strong> 자세한 제보 방법은 <Link href="/contact" prefetch={false}>문의 안내</Link>에서 확인할 수 있습니다.</p>

          <h2>독립 서비스입니다</h2>
          <p>픽셀핏은 여권 발급 기관, YouTube, Google, Naver 또는 그 밖의 제출처가 운영하거나 인증한 서비스가 아닙니다. 제출 전에는 해당 기관의 최신 안내와 생성된 파일을 직접 확인해야 합니다.</p>
          <p>서비스 운영을 위해 향후 콘텐츠 영역에 광고가 표시될 수 있으나 이미지 파일과 얼굴 좌표는 광고 사업자에게 제공하지 않습니다. 자세한 내용은 <Link href="/privacy" prefetch={false}>개인정보 처리 안내</Link>를 확인하세요.</p>
        </article>
        <aside className="side-note">
          <h2>확인일</h2>
          <p>페이지 최종 검토<br />2026년 7월 26일</p>
        </aside>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(organization) }} />
    </div>
  );
}
