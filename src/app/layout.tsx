import type { Metadata, Viewport } from "next";
import "./globals.css";
import { brand, publicPath, publicUrl } from "@/config/brand";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

export const metadata: Metadata = {
  metadataBase: new URL(brand.url),
  title: { default: `${brand.name} — 사진 규격 자동 맞춤`, template: `%s | ${brand.name}` },
  description: brand.description,
  applicationName: brand.name,
  alternates: { canonical: publicUrl() },
  openGraph: { type: "website", locale: brand.locale, siteName: brand.name, title: `${brand.name} — 사진 규격 자동 맞춤`, description: brand.description, url: publicUrl() },
  twitter: { card: "summary", title: `${brand.name} — 사진 규격 자동 맞춤`, description: brand.description },
  icons: { icon: publicPath("/icon.svg") },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#fbfaf7", colorScheme: "light" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const webApplication = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: brand.name,
    url: brand.url,
    description: brand.description,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Any modern web browser",
    inLanguage: "ko",
    offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
  };
  return (
    <html lang="ko">
      <body>
        <a className="skip-link" href="#main-content">본문으로 건너뛰기</a>
        <SiteHeader />
        <main id="main-content" className="page-main">{children}</main>
        <SiteFooter />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplication).replace(/</g, "\\u003c") }} />
      </body>
    </html>
  );
}
