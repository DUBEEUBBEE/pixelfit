"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { brand } from "@/config/brand";

const githubRepositoryUrl = "https://github.com/DUBEEUBBEE/pixelfit";

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRootRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setIsMenuOpen(false);
      menuButtonRef.current?.focus();
    }

    function handleOutsidePointer(event: PointerEvent) {
      if (menuRootRef.current?.contains(event.target as Node)) return;
      setIsMenuOpen(false);
    }

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("pointerdown", handleOutsidePointer);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("pointerdown", handleOutsidePointer);
    };
  }, [isMenuOpen]);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <header className="site-header">
      <div className="site-shell header-inner">
        <Link className="brand" href="/" prefetch={false} aria-label={`${brand.name} 홈`}>
          <span className="brand-mark" aria-hidden="true" />
          <span>{brand.name}</span>
        </Link>
        <nav className="nav-links desktop-nav" aria-label="주요 메뉴">
          <Link href="/#tools" prefetch={false}>도구</Link>
          <Link href="/guide" prefetch={false}>가이드</Link>
          <Link href="/about" prefetch={false}>소개</Link>
          <Link href="/contact" prefetch={false}>문의</Link>
        </nav>
        <nav className="mobile-primary-nav" aria-label="모바일 주요 메뉴">
          <Link href="/#tools" prefetch={false}>도구</Link>
          <Link href="/guide" prefetch={false}>가이드</Link>
          <div className="mobile-menu" ref={menuRootRef}>
            <button
              className="mobile-menu-button"
              type="button"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-more-menu"
              aria-label={isMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
              ref={menuButtonRef}
              onClick={() => setIsMenuOpen((open) => !open)}
            >
              <span className="mobile-menu-label">메뉴</span>
              {isMenuOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
            </button>
            <div className="mobile-menu-panel" id="mobile-more-menu" role="group" aria-label="더 보기 메뉴" hidden={!isMenuOpen}>
              <Link href="/about" prefetch={false} onClick={closeMenu}>소개</Link>
              <Link href="/contact" prefetch={false} onClick={closeMenu}>문의</Link>
              <Link href="/privacy" prefetch={false} onClick={closeMenu}>개인정보</Link>
              <Link href="/terms" prefetch={false} onClick={closeMenu}>이용약관</Link>
              <a href={githubRepositoryUrl} onClick={closeMenu}>GitHub</a>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
