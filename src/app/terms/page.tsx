import { brand } from "@/config/brand";
import { buildPageMetadata } from "@/config/metadata";

export const metadata = buildPageMetadata({ title: "이용약관", description: "픽셀핏 이미지 규격 도구의 이용 조건, 결과 확인 책임과 면책 범위입니다.", path: "/terms" });

export default function TermsPage() {
  return (
    <div className="page-content site-shell">
      <article className="prose">
        <h1>이용약관</h1>
        <p>시행일: 2026년 7월 23일 · 최종 검토일: 2026년 7월 26일</p>

        <h2>1. 서비스 성격</h2>
        <p>{brand.name}은 사용자가 선택한 이미지를 브라우저에서 규격에 맞게 처리하는 보조 도구입니다. 공공기관, YouTube, Google, Naver 또는 다른 제출처가 운영하거나 인증한 서비스가 아닙니다.</p>

        <h2>2. 승인과 제출</h2>
        <p>자동 검사와 안내선은 참고용입니다. 특정 기관의 접수·심사, 검색결과 노출, 광고 승인을 보장하지 않으며 제출 전 공식 출처의 최신 기준과 생성된 파일을 직접 확인해야 합니다.</p>

        <h2>3. 광고</h2>
        <p>광고 기능은 기본 비활성화 상태이며 운영 설정에 따라 설명·가이드 같은 콘텐츠 구간에 표시될 수 있습니다. 광고의 노출, 클릭 또는 AdSense 심사 상태는 이미지 결과의 품질이나 제출 승인을 뜻하지 않습니다.</p>

        <h2>4. 사용자의 책임</h2>
        <p>사용자는 처리할 이미지에 필요한 권리를 보유해야 하며, 불법적인 목적이나 타인의 권리를 침해하는 방식으로 서비스를 사용해서는 안 됩니다. 출처 표시, 워터마크, Content Credentials 또는 권리 관리 정보를 무단으로 우회해서도 안 됩니다.</p>

        <h2>5. 파일과 데이터</h2>
        <p>서비스는 결과 파일의 영구 보관을 제공하지 않습니다. 탭을 닫기 전 필요한 결과를 사용자의 기기에 내려받아야 합니다. 브라우저·운영체제·원본 인코딩 차이로 일부 기능이나 출력이 달라질 수 있습니다.</p>

        <h2>6. 기능 변경과 중단</h2>
        <p>공식 규격, 브라우저 지원, 보안 또는 운영 여건 변화에 따라 기능과 문서가 변경될 수 있습니다. 중요한 작업은 원본을 별도로 보관하고 결과를 직접 검수해야 합니다.</p>

        <h2>7. 문의</h2>
        <p>운영자: {brand.operatorName}<br />운영 문의: <a href={brand.contactHref}>{brand.contactEmail}</a></p>
        <p>여권사진, 얼굴 사진, 신분증 원본처럼 민감한 사진은 문의 이메일이나 공개 GitHub Issue에 첨부하지 마세요.</p>
      </article>
    </div>
  );
}
