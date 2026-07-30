import { env } from "./env";

export const basePath = env.basePath;

const contactHref = `mailto:${env.contactEmail}`;

export const brand = {
  name: "픽셀핏",
  alternateName: "PixelFit",
  legalName: "픽셀핏",
  operatorName: env.operatorName,
  description: "사진을 올리면 용도에 맞는 픽셀, 비율, 여백과 파일 형식을 기기 안에서 맞춰주는 이미지 도구",
  url: env.siteUrl,
  contactEmail: env.contactEmail,
  contactUrl: env.contactUrl,
  contactHref,
  contactLabel: env.contactEmail,
  locale: "ko_KR",
} as const;

/** @deprecated 실제 공개 URL을 기본값으로 사용하므로 항상 false입니다. */
export const isPlaceholderBrandUrl = false;

function normalizePath(path: string): { pathname: string; suffix: string } {
  if (!path) return { pathname: "/", suffix: "" };
  const suffixIndex = path.search(/[?#]/u);
  const pathname = suffixIndex === -1 ? path : path.slice(0, suffixIndex);
  const suffix = suffixIndex === -1 ? "" : path.slice(suffixIndex);
  if (!pathname || pathname === "/") return { pathname: "/", suffix };
  return { pathname: `/${pathname.replace(/^\/+|\/+$/g, "")}`, suffix };
}

function isFilePath(path: string): boolean {
  return /\/[^/]+\.[A-Za-z0-9]+$/u.test(path);
}

export function publicPath(path = "/"): string {
  const { pathname, suffix } = normalizePath(path);
  return `${basePath}${pathname}${suffix}` || "/";
}

export function publicUrl(path = "/"): string {
  const { pathname, suffix } = normalizePath(path);
  if (pathname === "/") return `${brand.url}/${suffix}`;
  if (isFilePath(pathname)) return `${brand.url}${pathname}${suffix}`;
  return `${brand.url}${pathname}/${suffix}`;
}
