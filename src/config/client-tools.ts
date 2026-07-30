import type { ToolBadgeKind } from "./tool-badges";

export const clientWorkspaceKinds = [
  "photo",
  "favicon",
  "privacy",
  "compressor",
  "resizer",
  "converter",
  "social-pack",
  "instagram-profile",
  "youtube-thumbnail",
  "four-cut",
  "film",
] as const;

export type ClientWorkspaceKind = (typeof clientWorkspaceKinds)[number];

export type ClientToolNavigation = {
  id: string;
  slug: string;
  title: string;
  displaySpec: string;
  workspaceKind: ClientWorkspaceKind;
  nextToolIds: readonly string[];
};

export const clientTools = [
  { id: "passport-photo", slug: "passport-photo", title: "한국 온라인 여권사진", displaySpec: "413×531px JPG · 500KB 이하", workspaceKind: "photo", nextToolIds: ["id-photo", "resident-id-photo", "image-compressor"] },
  { id: "id-photo", slug: "id-photo", title: "일반 증명사진 3×4cm", displaySpec: "354×472px · JPG/PNG", workspaceKind: "photo", nextToolIds: ["resident-id-photo", "image-compressor", "image-resizer"] },
  { id: "resident-id-photo", slug: "resident-id-photo", title: "주민등록증 사진", displaySpec: "413×531px · JPG/PNG", workspaceKind: "photo", nextToolIds: ["passport-photo", "id-photo", "image-compressor"] },
  { id: "youtube-banner", slug: "youtube-banner", title: "유튜브 채널 배너", displaySpec: "2560×1440px · 6MB 이하", workspaceKind: "photo", nextToolIds: ["youtube-thumbnail", "social-image-pack", "image-compressor"] },
  { id: "favicon-maker", slug: "favicon-maker", title: "파비콘 패키지 생성기", displaySpec: "ICO·PNG·manifest ZIP", workspaceKind: "favicon", nextToolIds: ["image-resizer", "image-converter"] },
  { id: "photo-privacy-cleaner", slug: "photo-privacy-cleaner", title: "사진 개인정보 메타데이터 정리", displaySpec: "JPEG·PNG·WebP 메타데이터", workspaceKind: "privacy", nextToolIds: ["image-converter", "image-compressor"] },
  { id: "image-compressor", slug: "image-compressor", title: "사진 용량 줄이기", displaySpec: "100KB~2MB 목표 · JPG/PNG/WebP", workspaceKind: "compressor", nextToolIds: ["image-resizer", "image-converter"] },
  { id: "image-resizer", slug: "image-resizer", title: "이미지 크기 조절", displaySpec: "직접 픽셀·긴 변·퍼센트", workspaceKind: "resizer", nextToolIds: ["image-compressor", "image-converter", "favicon-maker"] },
  { id: "image-converter", slug: "image-converter", title: "이미지 형식 변환", displaySpec: "JPEG ↔ PNG ↔ WebP", workspaceKind: "converter", nextToolIds: ["image-compressor", "image-resizer", "photo-privacy-cleaner"] },
  { id: "social-image-pack", slug: "social-image-pack", title: "SNS 이미지 세트", displaySpec: "1080×1080 · 1080×1350 · 1080×1920", workspaceKind: "social-pack", nextToolIds: ["youtube-thumbnail", "film-photo", "image-compressor"] },
  { id: "instagram-profile-picture", slug: "instagram-profile-picture", title: "인스타그램 프로필 사진", displaySpec: "1080×1080px · 원형 프로필 미리보기", workspaceKind: "instagram-profile", nextToolIds: ["social-image-pack", "image-compressor", "photo-privacy-cleaner"] },
  { id: "youtube-thumbnail", slug: "youtube-thumbnail", title: "유튜브 썸네일", displaySpec: "3840×2160px · 16:9", workspaceKind: "youtube-thumbnail", nextToolIds: ["youtube-banner", "social-image-pack", "image-compressor"] },
  { id: "four-cut-photo", slug: "four-cut-photo", title: "네컷사진 만들기", displaySpec: "세로 1200×1800 · 가로 1800×1200", workspaceKind: "four-cut", nextToolIds: ["film-photo", "social-image-pack", "image-compressor"] },
  { id: "film-photo", slug: "film-photo", title: "필름사진 효과", displaySpec: "로컬 필름 효과 · JPG/PNG", workspaceKind: "film", nextToolIds: ["four-cut-photo", "social-image-pack", "image-compressor"] },
] as const satisfies readonly ClientToolNavigation[];

const clientToolById = new Map<string, ClientToolNavigation>(clientTools.map((tool) => [tool.id, tool]));

export function getClientTool(id: string): ClientToolNavigation | undefined {
  return clientToolById.get(id);
}

export type ToolCardSummary = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  displaySpec: string;
  sourceKind: "official" | "convention";
  badgeKind: ToolBadgeKind;
};

export type ToolSearchSummary = ToolCardSummary & {
  category: string;
  searchTerms: readonly string[];
  searchAliases: readonly string[];
};

export type HomeCategorySummary = {
  id: string;
  title: string;
  description: string;
};

type ToolCardSource = ToolCardSummary;
type ToolSearchSource = ToolCardSource & {
  category: string;
  searchTerms: readonly string[];
  seo: { searchAliases: readonly string[] };
};

export function toToolCardSummary(tool: ToolCardSource): ToolCardSummary {
  return {
    id: tool.id,
    slug: tool.slug,
    title: tool.title,
    shortDescription: tool.shortDescription,
    displaySpec: tool.displaySpec,
    sourceKind: tool.sourceKind,
    badgeKind: tool.badgeKind,
  };
}

export function toToolSearchSummary(tool: ToolSearchSource): ToolSearchSummary {
  return {
    ...toToolCardSummary(tool),
    category: tool.category,
    searchTerms: [...tool.searchTerms],
    searchAliases: [...tool.seo.searchAliases],
  };
}
