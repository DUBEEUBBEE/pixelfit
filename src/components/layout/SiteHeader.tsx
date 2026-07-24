import Link from "next/link";
import { brand } from "@/config/brand";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-shell header-inner">
        <Link className="brand" href="/" aria-label={`${brand.name} 홈`}>
          <span className="brand-mark" aria-hidden="true" />
          <span>{brand.name}</span>
        </Link>
        <nav className="nav-links" aria-label="주요 메뉴">
          <Link href="/#tools">도구</Link>
          <Link href="/guide">가이드</Link>
          <Link href="/about">소개</Link>
          <Link href="/contact">문의</Link>
        </nav>
      </div>
    </header>
  );
}
