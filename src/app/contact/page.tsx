import Link from "next/link";
import { brand } from "@/config/brand";
import { buildPageMetadata } from "@/config/metadata";

export const metadata = buildPageMetadata({ title: "문의", description: "픽셀핏 오류, 접근성 문제, 규격 출처 정정과 개인정보 관련 문의 방법입니다.", path: "/contact" });

export default function ContactPage() {
  return (
    <div className="page-content site-shell">
      <div className="content-layout">
        <article className="prose">
          <h1>픽셀핏에 문의하기</h1>
          <p>문의 종류에 맞는 경로를 이용하면 더 빠르게 내용을 확인할 수 있습니다. 운영자는 <strong>{brand.operatorName}</strong>입니다.</p>

          <h2>일반 문의</h2>
          <p>서비스 이용이나 운영에 관한 일반 문의는 <a href={brand.contactHref}>{brand.contactEmail}</a>로 보내 주세요.</p>

          <h2>기능 오류 제보</h2>
          <p><a href={brand.contactUrl} target="_blank" rel="noreferrer">GitHub Issues에서 기능 오류 제보하기</a></p>
          <p>재현 과정, 브라우저와 운영체제, 사용한 도구, 기대한 결과와 실제 결과를 적어 주세요. GitHub Issues는 공개되는 개발 버그 보조 채널이며 일반 문의를 대신하지 않습니다.</p>

          <h2>규격 오류 제보</h2>
          <ul>
            <li>오류가 있는 페이지 주소</li>
            <li>현재 페이지에 표시된 규격</li>
            <li>최신 공식 출처 URL</li>
            <li>출처를 확인한 날짜</li>
          </ul>
          <p>위 내용을 이메일로 보내거나, 개인 정보가 포함되지 않은 경우 GitHub Issues에 남겨 주세요.</p>

          <h2>개인정보 관련 문의</h2>
          <p>개인정보 안내와 기기 내 처리 방식에 관한 문의는 <a href={brand.contactHref}>이메일</a>을 이용해 주세요. 처리 원칙은 <Link href="/privacy" prefetch={false}>개인정보 처리 안내</Link>에서 먼저 확인할 수 있습니다.</p>

          <h2>민감한 사진을 첨부하지 마세요</h2>
          <p><strong>여권사진, 주민등록증 사진, 얼굴 사진, 신분증 원본은 이메일이나 공개 GitHub Issue에 첨부하지 마세요.</strong> 사진이 필요한 버그라면 개인 정보를 제거한 재현용 이미지나 직접 만든 샘플을 사용하고, 파일명·주소·GPS 같은 식별 정보도 제거해 주세요.</p>
        </article>
        <aside className="side-note">
          <h2>공개 문의 주의</h2>
          <p>GitHub Issues에는 누구나 읽어도 되는 버그 정보만 남겨 주세요.</p>
          <p>페이지 최종 검토<br />2026년 7월 26일</p>
        </aside>
      </div>
    </div>
  );
}
