import Link from "next/link";
import { brand } from "@/config/brand";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-shell">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">{brand.name}</div>
            <p className="footer-note">사진을 서버에 올리지 않고, 필요한 규격과 파일을 사용자의 브라우저에서 직접 만듭니다. 자동 검사는 참고용이며 공식 승인을 보장하지 않습니다.</p>
          </div>
          <nav className="footer-links" aria-label="푸터 메뉴">
            <Link href="/#tools" prefetch={false}>전체 도구</Link>
            <Link href="/privacy" prefetch={false}>개인정보 안내</Link>
            <Link href="/terms" prefetch={false}>이용약관</Link>
            <Link href="/guide" prefetch={false}>사용 가이드</Link>
            <Link href="/about" prefetch={false}>픽셀핏 소개</Link>
            <Link href="/contact" prefetch={false}>문의</Link>
          </nav>
        </div>
        <div className="footer-bottom">
          <span>© 2026 {brand.legalName} · 운영: {brand.operatorName}</span>
          <span>문의: <a href={brand.contactHref}>{brand.contactEmail}</a></span>
        </div>
      </div>
    </footer>
  );
}
