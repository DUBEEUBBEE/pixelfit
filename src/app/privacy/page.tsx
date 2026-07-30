import { adsenseConfig } from "@/config/adsense";
import { brand } from "@/config/brand";
import { buildPageMetadata } from "@/config/metadata";

export const metadata = buildPageMetadata({ title: "개인정보 처리 안내", description: "픽셀핏의 기기 내 이미지 처리, 사이트 요청, 선택적 광고 설정과 문의 방법을 구분해 설명합니다.", path: "/privacy" });

export default function PrivacyPage() {
  return (
    <div className="page-content site-shell">
      <div className="content-layout">
        <article className="prose">
          <h1>사진은 이 기기 안에서 처리됩니다.</h1>
          <p>시행일: 2026년 7월 23일 · 최종 검토일: 2026년 7월 26일</p>

          <h2>1. 사용자가 선택한 이미지</h2>
          <p>선택한 사진, 사진에서 찾은 얼굴 위치와 파일에 들어 있는 촬영 정보는 픽셀핏 서버로 보내지 않습니다. 이미지 작업은 현재 탭의 브라우저 메모리에서 실행됩니다.</p>
          <p>사진을 localStorage, sessionStorage 또는 IndexedDB에 저장하지 않으며, 페이지를 새로고침하거나 탭을 닫으면 작업 참조가 사라집니다. 내려받은 결과 파일은 브라우저 설정에 따라 사용자의 기기에 저장됩니다.</p>

          <h2>2. 사이트를 열 때 발생하는 요청</h2>
          <p>HTML, JavaScript, 글꼴과 정적 자산을 제공하기 위한 일반적인 네트워크 요청은 발생합니다. 이 요청에는 호스팅 사업자가 처리하는 IP 주소, 요청 시각, 브라우저 정보가 포함될 수 있지만 픽셀핏 애플리케이션은 원본 이미지 파일이나 이미지에서 읽은 값을 요청 본문으로 전송하지 않습니다.</p>
          <p>현재 소스에는 이미지 업로드 API와 파일 기반 분석 텔레메트리를 두지 않습니다. 운영 환경의 호스팅 로그 보존 범위는 호스팅 제공자의 정책을 따릅니다.</p>

          <h2>3. 메타데이터 정리</h2>
          <p>JPEG·PNG·WebP에서 사용자가 고른 개인정보성 필드를 가능한 범위에서 정리합니다. ICC 색상 프로필, 방향, DPI와 알려진 C2PA·JUMBF 출처 데이터는 보존을 시도하지만 모든 파일 변형에서 자격 증명 유효성을 보장할 수는 없습니다. 파일을 수정하면 기존 Content Credentials가 유효하지 않게 될 수 있습니다.</p>

          <h2>4. 광고와 제3자 요청</h2>
          {adsenseConfig.ready ? (
            <p>이 빌드에는 운영자가 유효한 설정으로 활성화한 AdSense 코드가 포함될 수 있습니다. 광고 제공 과정에서 Google과 동의 관리 도구가 쿠키, IP 주소, 기기 또는 광고 상호작용 정보를 처리할 수 있습니다. 픽셀핏은 원본 이미지나 편집 결과를 광고 요청 데이터로 전송하지 않습니다.</p>
          ) : (
            <p>현재 빌드에서 AdSense는 비활성화되어 광고 스크립트와 광고 슬롯을 렌더링하지 않습니다. 향후 광고가 활성화되면 실제 동의 관리 방식과 제3자 처리 내용을 이 안내에 반영해야 합니다.</p>
          )}
          <p>광고 코드 준비, AdSense 사이트 승인, 지역별 동의 관리와 법률 준수는 서로 다른 절차이며 코드가 있다는 이유만으로 승인이 완료된 것은 아닙니다.</p>
          <p>광고가 활성화되면 Google을 포함한 제3자 제공업체가 이전 방문 기록을 바탕으로 광고를 제공하기 위해 쿠키를 저장·읽거나 웹 비콘, IP 주소와 기타 식별자를 처리할 수 있습니다. 사용자는 <a href="https://adssettings.google.com/" target="_blank" rel="noreferrer">Google 광고 설정</a>에서 맞춤 광고를 관리할 수 있으며, Google의 처리 방식은 <a href="https://policies.google.com/technologies/partner-sites?hl=ko" target="_blank" rel="noreferrer">Google 파트너 사이트 데이터 사용 안내</a>에서 확인할 수 있습니다.</p>
          <p>EEA·영국·스위스 등 동의가 필요한 지역에는 Google 인증 CMP와 적용되는 동의 흐름을 먼저 구성해야 합니다. 해당 준비와 검증이 끝나기 전에는 광고 송출을 활성화하지 않습니다.</p>

          <h2>5. 브라우저별 차이</h2>
          <p>얼굴 후보 감지는 지원 브라우저에서만 기기 내 기능을 사용합니다. 지원하지 않거나 실패하면 직접 위치를 맞출 수 있습니다. 지원하지 않는 파일 형식은 안전하고 일관된 로컬 처리를 위해 입력 단계에서 제한할 수 있습니다.</p>

          <h2>6. 문의</h2>
          <p>개인정보 관련 문의는 <a href={brand.contactHref}>{brand.contactEmail}</a>로 접수할 수 있습니다. 여권사진, 주민등록증 사진, 얼굴 사진이나 신분증 원본은 이메일과 공개 GitHub Issue 어디에도 첨부하지 마세요.</p>
        </article>
        <aside className="side-note">
          <h2>핵심 요약</h2>
          <p>이미지 서버 업로드 없음<br />브라우저 저장소 사용 없음<br />새로고침 시 작업 소멸<br />광고 기본 비활성화</p>
        </aside>
      </div>
    </div>
  );
}
