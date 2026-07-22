import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return <div className="page-content site-shell"><article className="prose" style={{ textAlign: "center", maxWidth: "680px", margin: "4rem auto" }}><span className="eyebrow">404</span><h1 style={{ marginTop: "1rem" }}>이 페이지는 규격 밖이에요.</h1><p>주소가 바뀌었거나 존재하지 않는 도구입니다. 홈에서 필요한 용도를 다시 골라 주세요.</p><Link className="button primary" href="/"><ArrowLeft size={17} />홈으로 돌아가기</Link></article></div>;
}
