import { createRasterCanvas, encodeAndVerifyCanvas, getRasterContext, normalizeCanvasColor } from "@/lib/image/encode";
import type { ResizeDimensions } from "@/lib/image/resize";
import { calculateInstagramProfileLayout, INSTAGRAM_PROFILE_SIZE } from "./layout";
import type { InstagramProfileOptions, InstagramProfileResult } from "./types";

export async function renderInstagramProfile(
  source: CanvasImageSource,
  sourceDimensions: ResizeDimensions,
  options: InstagramProfileOptions,
): Promise<InstagramProfileResult> {
  throwIfAborted(options.signal);
  const layout = calculateInstagramProfileLayout(sourceDimensions, options);
  const canvas = createRasterCanvas(INSTAGRAM_PROFILE_SIZE, INSTAGRAM_PROFILE_SIZE);
  const context = getRasterContext(canvas, { alpha: false });
  const canvasColor = normalizeCanvasColor(options.canvasColor, "#f7f4ee");
  const borderColor = normalizeCanvasColor(options.borderColor, "#ff725e");
  const innerColor = normalizeCanvasColor(options.innerColor, "#ffffff");

  context.fillStyle = canvasColor;
  context.fillRect(0, 0, INSTAGRAM_PROFILE_SIZE, INSTAGRAM_PROFILE_SIZE);

  context.beginPath();
  context.arc(layout.center, layout.center, layout.outerRadius, 0, Math.PI * 2);
  context.fillStyle = borderColor;
  context.fill();

  context.beginPath();
  context.arc(layout.center, layout.center, layout.innerRadius, 0, Math.PI * 2);
  context.fillStyle = innerColor;
  context.fill();

  context.save();
  context.beginPath();
  context.arc(layout.center, layout.center, layout.innerRadius, 0, Math.PI * 2);
  context.clip();
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(source, layout.imageX, layout.imageY, layout.imageWidth, layout.imageHeight);
  context.restore();

  throwIfAborted(options.signal);
  const verified = await encodeAndVerifyCanvas(canvas, {
    format: options.format,
    quality: options.quality,
    backgroundAlreadyApplied: true,
  });
  throwIfAborted(options.signal);

  return {
    blob: verified.blob,
    filename: instagramProfileFilename(options.format),
    format: options.format,
    width: verified.width,
    height: verified.height,
    layout,
  };
}

export function instagramProfileFilename(format: InstagramProfileOptions["format"]): string {
  return `pixelfit-instagram-profile-1080x1080.${format === "jpeg" ? "jpg" : "png"}`;
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException("인스타그램 프로필 사진 생성이 취소되었습니다.", "AbortError");
}
