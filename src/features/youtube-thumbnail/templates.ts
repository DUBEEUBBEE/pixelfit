import type { ThumbnailTemplateId } from "./types";

export const youtubeThumbnailTemplates: Record<ThumbnailTemplateId, { label: string; description: string; gradient: "left" | "right" | "bottom" | "frame"; defaultAlign: "left" | "center" | "right" }> = {
  "editorial-left": { label: "왼쪽 에디토리얼", description: "왼쪽 텍스트와 짙은 그라디언트", gradient: "left", defaultAlign: "left" },
  "editorial-right": { label: "오른쪽 에디토리얼", description: "오른쪽 텍스트와 짙은 그라디언트", gradient: "right", defaultAlign: "right" },
  "center-impact": { label: "중앙 임팩트", description: "중앙 큰 제목과 하단 그라디언트", gradient: "bottom", defaultAlign: "center" },
  "lower-third": { label: "로어 서드", description: "사진을 넓게 보이는 하단 제목 바", gradient: "frame", defaultAlign: "left" },
};

export const YOUTUBE_THUMBNAIL_WIDTH = 3840 as const;
export const YOUTUBE_THUMBNAIL_HEIGHT = 2160 as const;
export const YOUTUBE_SAFE_MARGIN = 192;
