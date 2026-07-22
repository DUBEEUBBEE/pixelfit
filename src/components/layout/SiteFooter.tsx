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
            <Link href="/#tools">전체 도구</Link>
            <Link href="/privacy">개인정보 안내</Link>
            <Link href="/terms">이용약관</Link>
            <Link href="/guide">사용 가이드</Link>
          </nav>
        </div>
        <div className="footer-bottom">
          <span>© 2026 {brand.legalName}</span>
          <span>사진은 브라우저 메모리에서만 처리됩니다.</span>
        </div>
      </div>
    </footer>
  );
}
