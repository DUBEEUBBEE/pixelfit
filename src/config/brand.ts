const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
const configuredBasePath = process.env.NEXT_PUBLIC_BASE_PATH;

export const basePath = !configuredBasePath || configuredBasePath === "/"
  ? ""
  : `${configuredBasePath.startsWith("/") ? "" : "/"}${configuredBasePath}`.replace(/\/+$/, "");

export const brand = {
  name: "픽셀핏",
  legalName: "픽셀핏",
  description: "사진을 올리면 용도에 맞는 픽셀, 비율, 여백과 파일 형식을 기기 안에서 맞춰주는 이미지 도구",
  url: configuredUrl ?? "https://pixelfit.example",
  contactEmail: "help@pixelfit.example",
  locale: "ko_KR",
} as const;

export const isPlaceholderBrandUrl = !configuredUrl;

export function publicPath(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${basePath}${normalizedPath}` || "/";
}

export function publicUrl(path = "/") {
  const normalizedPath = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return `${brand.url}${normalizedPath}`;
}
