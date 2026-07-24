import type { Metadata, Viewport } from "next";
import "./globals.css";
import { brand, publicPath, publicUrl } from "@/config/brand";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ImageTransferProvider } from "@/components/session/ImageTransferProvider";
import { AdSenseScript } from "@/components/ads";
import { env } from "@/config/env";

const verificationOther: Record<string, string> = {
  ...(env.naverSiteVerification ? { "naver-site-verification": env.naverSiteVerification } : {}),
  ...(env.adsense.client ? { "google-adsense-account": env.adsense.client } : {}),
};

export const metadata: Metadata = {
  metadataBase: new URL(brand.url),
  title: { default: `${brand.name} — 사진 규격 자동 맞춤`, template: `%s | ${brand.name}` },
  description: brand.description,
  applicationName: brand.name,
  alternates: { canonical: publicUrl() },
  openGraph: { type: "website", locale: brand.locale, siteName: brand.name, title: `${brand.name} — 사진 규격 자동 맞춤`, description: brand.description, url: publicUrl() },
  twitter: { card: "summary", title: `${brand.name} — 사진 규격 자동 맞춤`, description: brand.description },
  icons: { icon: publicPath("/icon.svg") },
  verification: env.googleSiteVerification || Object.keys(verificationOther).length > 0
    ? {
        google: env.googleSiteVerification,
        other: Object.keys(verificationOther).length > 0 ? verificationOther : undefined,
      }
    : undefined,
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#fbfaf7", colorScheme: "light" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <a className="skip-link" href="#main-content">본문으로 건너뛰기</a>
        <SiteHeader />
        <main id="main-content" className="page-main"><ImageTransferProvider>{children}</ImageTransferProvider></main>
        <SiteFooter />
        <AdSenseScript />
      </body>
    </html>
  );
}
