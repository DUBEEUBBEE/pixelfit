import type { Metadata } from "next";
import { brand, publicUrl } from "@/config/brand";

export const metadata: Metadata = { title: "이용약관", description: "픽셀핏 이미지 규격 도구 이용 조건과 면책 범위입니다.", alternates: { canonical: publicUrl("/terms") } };

export default function TermsPage() {
  return <div className="page-content site-shell"><article className="prose"><h1>이용약관</h1><p>시행일: 2026년 7월 22일</p><h2>서비스 성격</h2><p>{brand.name}은 사용자가 선택한 이미지를 브라우저에서 규격에 맞게 처리하는 보조 도구입니다. 공공기관, YouTube, Google 또는 다른 제출처가 운영하거나 인증한 서비스가 아닙니다.</p><h2>승인과 제출</h2><p>자동 검사와 안내선은 참고용입니다. 특정 기관의 접수, 심사, 검색결과 노출 또는 승인을 보장하지 않으며 제출 전 공식 출처의 최신 기준을 직접 확인해야 합니다.</p><h2>사용자의 책임</h2><p>사용자는 처리할 이미지에 필요한 권리를 보유해야 하며 불법, 타인의 권리를 침해하는 방식이나 출처 표시·워터마크 우회를 위해 서비스를 사용해서는 안 됩니다.</p><h2>파일과 데이터</h2><p>서비스는 결과 파일의 영구 보관을 제공하지 않습니다. 탭을 닫기 전 필요한 결과를 사용자의 기기에 내려받아야 합니다.</p><h2>변경과 문의</h2><p>규격과 브라우저 지원 변화에 맞춰 약관과 기능이 변경될 수 있습니다. 운영 문의: <a href={`mailto:${brand.contactEmail}`}>{brand.contactEmail}</a></p></article></div>;
}
