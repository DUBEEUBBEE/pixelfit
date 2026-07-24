import { wrapCanvasText } from "@/features/creative-tools/core";
import { createRasterCanvas, encodeAndVerifyCanvas, getRasterContext } from "@/lib/image/encode";
import { calculateCoverTransform } from "@/lib/image/geometry";
import type { ResizeDimensions } from "@/lib/image/resize";
import { YOUTUBE_SAFE_MARGIN, YOUTUBE_THUMBNAIL_HEIGHT, YOUTUBE_THUMBNAIL_WIDTH, youtubeThumbnailTemplates } from "./templates";
import type { YoutubeThumbnailOptions, YoutubeThumbnailResult } from "./types";
import { calculateThumbnailTextLayout } from "./layout";

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export async function renderYoutubeThumbnail(
  source: CanvasImageSource,
  sourceDimensions: ResizeDimensions,
  options: YoutubeThumbnailOptions,
): Promise<YoutubeThumbnailResult> {
  throwIfAborted(options.signal);
  const canvas = createRasterCanvas(YOUTUBE_THUMBNAIL_WIDTH, YOUTUBE_THUMBNAIL_HEIGHT);
  const context = getRasterContext(canvas, { alpha: options.format === "png" });
  context.fillStyle = "#10151f";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  const draw = calculateCoverTransform(sourceDimensions.width, sourceDimensions.height, canvas.width, canvas.height, options.crop);
  context.save();
  context.translate(draw.centerX, draw.centerY);
  context.rotate(draw.rotationRadians);
  context.scale(draw.scale, draw.scale);
  context.drawImage(source, -sourceDimensions.width / 2, -sourceDimensions.height / 2, sourceDimensions.width, sourceDimensions.height);
  context.restore();

  const template = youtubeThumbnailTemplates[options.template];
  paintGradient(context, template.gradient);
  const accent = HEX_COLOR.test(options.accentColor) ? options.accentColor : "#ff725e";
  const titleSize = Math.round(Math.max(110, Math.min(300, options.titleSize)));
  const maxTextWidth = options.template === "center-impact" ? 3000 : options.template === "lower-third" ? 3200 : 1840;
  const align = options.align;
  const anchorX = align === "left" ? YOUTUBE_SAFE_MARGIN + 60 : align === "right" ? canvas.width - YOUTUBE_SAFE_MARGIN - 60 : canvas.width / 2;

  context.save();
  context.textAlign = align;
  context.textBaseline = "top";
  context.font = `900 ${titleSize}px Pretendard, Apple SD Gothic Neo, sans-serif`;
  const titleLines = wrapCanvasText(options.title || "제목을 입력하세요", maxTextWidth, (value) => context.measureText(value).width, 2);
  const subtitleSize = Math.max(58, Math.round(titleSize * .4));
  context.font = `700 ${subtitleSize}px Pretendard, Apple SD Gothic Neo, sans-serif`;
  const subtitleLines = wrapCanvasText(options.subtitle, maxTextWidth, (value) => context.measureText(value).width, 1);
  const textLayout = calculateThumbnailTextLayout(options.template, titleSize, titleLines.length, subtitleLines.length > 0);
  const { startY, lineHeight, subtitleY } = textLayout;
  const accentX = align === "right" ? anchorX - Math.min(maxTextWidth, 820) : align === "center" ? anchorX - 120 : anchorX;
  context.fillStyle = accent;
  context.fillRect(accentX, startY - 48, align === "center" ? 240 : Math.min(maxTextWidth, 820), 22);
  context.shadowColor = "rgba(0,0,0,.72)";
  context.shadowBlur = 24;
  context.fillStyle = "#ffffff";
  context.font = `900 ${titleSize}px Pretendard, Apple SD Gothic Neo, sans-serif`;
  titleLines.forEach((line, index) => context.fillText(line, anchorX, startY + index * lineHeight, maxTextWidth));

  context.font = `700 ${subtitleSize}px Pretendard, Apple SD Gothic Neo, sans-serif`;
  context.fillStyle = "rgba(255,255,255,.9)";
  subtitleLines.forEach((line) => context.fillText(line, anchorX, subtitleY, maxTextWidth));
  context.restore();
  throwIfAborted(options.signal);

  const verified = await encodeAndVerifyCanvas(canvas, {
    format: options.format,
    quality: options.quality,
    backgroundAlreadyApplied: options.format === "jpeg",
  });
  throwIfAborted(options.signal);
  return {
    blob: verified.blob,
    filename: `youtube-thumbnail-3840x2160.${options.format === "jpeg" ? "jpg" : "png"}`,
    format: options.format,
    width: YOUTUBE_THUMBNAIL_WIDTH,
    height: YOUTUBE_THUMBNAIL_HEIGHT,
    titleLines,
    subtitleLines,
  };
}

function paintGradient(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, type: "left" | "right" | "bottom" | "frame") {
  if (type === "frame") {
    const gradient = context.createLinearGradient(0, 1180, 0, YOUTUBE_THUMBNAIL_HEIGHT);
    gradient.addColorStop(0, "rgba(8,12,20,0)");
    gradient.addColorStop(1, "rgba(8,12,20,.94)");
    context.fillStyle = gradient;
    context.fillRect(0, 1000, YOUTUBE_THUMBNAIL_WIDTH, 1160);
    return;
  }
  if (type === "bottom") {
    const gradient = context.createLinearGradient(0, 400, 0, YOUTUBE_THUMBNAIL_HEIGHT);
    gradient.addColorStop(0, "rgba(8,12,20,.12)");
    gradient.addColorStop(1, "rgba(8,12,20,.88)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, YOUTUBE_THUMBNAIL_WIDTH, YOUTUBE_THUMBNAIL_HEIGHT);
    return;
  }
  const gradient = context.createLinearGradient(0, 0, YOUTUBE_THUMBNAIL_WIDTH, 0);
  if (type === "left") {
    gradient.addColorStop(0, "rgba(8,12,20,.92)");
    gradient.addColorStop(.58, "rgba(8,12,20,.2)");
    gradient.addColorStop(1, "rgba(8,12,20,0)");
  } else {
    gradient.addColorStop(0, "rgba(8,12,20,0)");
    gradient.addColorStop(.42, "rgba(8,12,20,.2)");
    gradient.addColorStop(1, "rgba(8,12,20,.92)");
  }
  context.fillStyle = gradient;
  context.fillRect(0, 0, YOUTUBE_THUMBNAIL_WIDTH, YOUTUBE_THUMBNAIL_HEIGHT);
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException("썸네일 생성이 취소되었습니다.", "AbortError");
}
