import Link from "next/link";
import { brand } from "@/config/brand";
import { buildPageMetadata } from "@/config/metadata";

export const metadata = buildPageMetadata({ title: "문의", description: "픽셀핏 오류, 접근성 문제, 규격 출처 정정과 개인정보 관련 문의 방법입니다.", path: "/contact" });

export default function ContactPage() {
  const isEmail = brand.contactHref.startsWith("mailto:");

  return (
    <div className="page-content site-shell">
      <div className="content-layout">
        <article className="prose">
          <h1>픽셀핏에 문의하기</h1>
          <p>오류 재현 방법, 사용한 브라우저, 선택한 도구와 기대한 결과를 알려주면 확인에 도움이 됩니다.</p>

          <h2>연락 경로</h2>
          <p>
            운영자: <strong>{brand.operatorName}</strong><br />
            문의: <a href={brand.contactHref} rel={isEmail ? undefined : "noreferrer"}>{brand.contactLabel}</a>
          </p>
          {!brand.contactEmail && <p>별도 운영 메일이 설정되지 않아 현재는 공개 GitHub Issues를 기본 문의 창구로 사용합니다.</p>}

          <h2>사진을 첨부하지 마세요</h2>
          <p><strong>여권사진, 신분증 사진, 원본 인물 사진과 EXIF 정보가 남은 파일을 공개 이슈에 올리지 마세요.</strong> 재현이 꼭 필요하면 개인정보가 없는 샘플 이미지나 화면의 오류 문구만 공유해 주세요.</p>

          <h2>처리 범위</h2>
          <ul>
            <li>기능 오류와 브라우저 호환성 문제</li>
            <li>키보드·스크린 리더·색 대비 등 접근성 문제</li>
            <li>공식 규격 출처의 변경 또는 잘못된 설명</li>
            <li>개인정보 안내와 로컬 처리 방식에 대한 질문</li>
            <li>광고 배치, 동의 또는 광고 관련 개인정보 안내 문제</li>
          </ul>
          <p>특정 기관의 접수 결과, AdSense 심사, 검색 노출 시점은 픽셀핏이 대신 확인하거나 보장할 수 없습니다.</p>

          <p><Link href="/privacy">개인정보 처리 안내 읽기</Link></p>
        </article>
        <aside className="side-note">
          <h2>공개 문의 주의</h2>
          <p>파일명·얼굴·주소·GPS 등 개인 식별 정보가 없는 내용만 남겨 주세요.</p>
        </aside>
      </div>
    </div>
  );
}
