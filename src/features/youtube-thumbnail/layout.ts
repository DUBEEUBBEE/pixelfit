import type { ThumbnailTemplateId } from "./types";
import { YOUTUBE_SAFE_MARGIN, YOUTUBE_THUMBNAIL_HEIGHT } from "./templates";

export type ThumbnailTextLayout = {
  titleSize: number;
  lineHeight: number;
  subtitleSize: number;
  startY: number;
  subtitleY: number;
  blockBottom: number;
};

export function calculateThumbnailTextLayout(
  template: ThumbnailTemplateId,
  requestedTitleSize: number,
  titleLineCount: number,
  hasSubtitle: boolean,
): ThumbnailTextLayout {
  const titleSize = Math.round(Math.max(110, Math.min(300, requestedTitleSize)));
  const lines = Math.max(1, Math.min(2, Math.round(titleLineCount)));
  const lineHeight = titleSize * 1.08;
  const subtitleSize = Math.max(58, Math.round(titleSize * .4));
  const subtitleGap = hasSubtitle ? 38 : 0;
  const subtitleHeight = hasSubtitle ? subtitleSize * 1.12 : 0;
  const blockHeight = lines * lineHeight + subtitleGap + subtitleHeight;
  const preferredStart = template === "center-impact" ? 930 : template === "lower-third" ? 1540 : 700;
  const latestStart = YOUTUBE_THUMBNAIL_HEIGHT - YOUTUBE_SAFE_MARGIN - blockHeight;
  const startY = Math.max(YOUTUBE_SAFE_MARGIN + 48, Math.min(preferredStart, latestStart));
  const subtitleY = startY + lines * lineHeight + subtitleGap;
  return {
    titleSize,
    lineHeight,
    subtitleSize,
    startY,
    subtitleY,
    blockBottom: subtitleY + subtitleHeight,
  };
}
