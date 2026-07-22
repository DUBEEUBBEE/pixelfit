import type { Metadata } from "next";
import { brand, publicUrl } from "@/config/brand";

export const metadata: Metadata = { title: "개인정보 처리 안내", description: "픽셀핏이 사진을 서버로 보내지 않고 브라우저 메모리에서 처리하는 방식을 설명합니다.", alternates: { canonical: publicUrl("/privacy") } };

export default function PrivacyPage() {
  return <div className="page-content site-shell"><div className="content-layout"><article className="prose"><h1>사진은 이 기기 안에서 처리됩니다.</h1><p>픽셀핏은 계정이나 이미지 업로드 서버 없이 동작합니다. 선택한 사진, 이미지 Blob, 얼굴 후보 좌표와 발견한 메타데이터는 네트워크로 보내지 않습니다.</p><h2>어디에 저장되나요?</h2><p>작업 중인 파일과 결과는 현재 탭의 브라우저 메모리에만 있습니다. 사진을 localStorage, sessionStorage 또는 IndexedDB에 저장하지 않으며, 페이지를 새로고침하거나 탭을 닫으면 작업 참조가 사라집니다. 내려받은 결과 파일은 브라우저 설정에 따라 사용자의 기기에 저장됩니다.</p><h2>네트워크 사용</h2><p>앱 코드와 정적 자산을 받기 위한 일반 GET 요청은 발생할 수 있지만 이미지 업로드용 API는 없습니다. v1에는 분석 도구를 넣지 않았으며 파일명, 사진 크기, EXIF 값이나 얼굴 좌표를 이벤트로 전송하지 않습니다.</p><h2>메타데이터 정리</h2><p>JPEG·PNG·WebP에서 사용자가 고른 개인정보성 필드를 가능한 한 픽셀 재인코딩 없이 정리합니다. ICC 색상 프로필, 방향, DPI와 알려진 C2PA·JUMBF 출처 데이터는 보존을 시도하지만 모든 파일 변형에서 자격 증명 유효성을 보장할 수는 없습니다. 파일을 수정하면 기존 Content Credentials가 유효하지 않게 될 수 있습니다.</p><h2>브라우저별 차이</h2><p>얼굴 후보 감지는 지원 브라우저에서만 기기 내 기능을 사용합니다. 지원하지 않거나 실패하면 직접 위치를 맞출 수 있습니다. HEIC와 SVG는 안전하고 일관된 로컬 처리를 위해 v1에서 받지 않습니다.</p><h2>문의</h2><p>설정 파일의 운영 연락처는 <a href={`mailto:${brand.contactEmail}`}>{brand.contactEmail}</a>입니다. 실제 배포 전 운영자 주소로 변경해야 합니다.</p></article><aside className="side-note"><h2>핵심 요약</h2><p>서버 업로드 없음<br />브라우저 저장소 사용 없음<br />외부 이미지 API 없음<br />새로고침 시 작업 소멸</p></aside></div></div>;
}
