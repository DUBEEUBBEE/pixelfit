import type { FaviconWebManifest, ManifestOptions } from "./types";

const DEFAULT_NAME = "내 웹사이트";
const DEFAULT_SHORT_NAME = "웹사이트";
const DEFAULT_COLOR = "#ffffff";
const HEX_COLOR = /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i;

function safeName(value: string | undefined, fallback: string, maxLength: number) {
  const withoutControls = (value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const normalized = withoutControls || fallback;
  return Array.from(normalized).slice(0, maxLength).join("");
}

function safeColor(value: string | undefined) {
  const normalized = value?.trim();
  return normalized && HEX_COLOR.test(normalized) ? normalized.toLowerCase() : DEFAULT_COLOR;
}

export function createWebManifest(options: ManifestOptions = {}): FaviconWebManifest {
  return {
    name: safeName(options.name, DEFAULT_NAME, 80),
    short_name: safeName(options.shortName, DEFAULT_SHORT_NAME, 20),
    icons: [
      {
        src: "./icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "./icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    start_url: "./",
    scope: "./",
    display: "standalone",
    background_color: safeColor(options.backgroundColor),
    theme_color: safeColor(options.themeColor),
  };
}

export function serializeWebManifest(manifest: FaviconWebManifest): string {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

export function createInstallationHtml(): string {
  return `<!-- 아래 코드를 웹사이트 <head> 안에 붙여 넣으세요. -->
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
`;
}

export function createReadmeText(manifest: FaviconWebManifest): string {
  return `파비콘 패키지 — ${manifest.name}

설치 방법
1. 이 폴더의 파일을 웹사이트 공개 루트에 업로드합니다.
2. favicon-install.html의 <link> 태그를 웹사이트 <head> 안에 붙여 넣습니다.
3. 배포 후 브라우저 캐시를 비우고 아이콘을 확인합니다.

포함 파일
- favicon.ico (16px, 32px, 48px PNG 이미지 포함)
- favicon-16x16.png, favicon-32x32.png, favicon-48x48.png
- apple-touch-icon.png (180×180)
- icon-192.png, icon-512.png
- site.webmanifest
- favicon-install.html

참고
- 작은 아이콘은 원본이 복잡할수록 형태를 알아보기 어려울 수 있습니다.
- 모든 파일은 업로드한 이미지를 서버로 보내지 않고 이 브라우저에서 생성했습니다.
`;
}
