import { socialOutputSpecs, type SocialOutputId } from "@/features/creative-tools/core";
import { createRasterCanvas, encodeAndVerifyCanvas, getRasterContext } from "@/lib/image/encode";
import { calculateCoverTransform, type CropTransform } from "@/lib/image/geometry";
import type { ResizeDimensions } from "@/lib/image/resize";
import type { SocialImageResult, SocialRenderOptions } from "./types";

export async function renderSocialImage(
  source: CanvasImageSource,
  sourceDimensions: ResizeDimensions,
  id: SocialOutputId,
  crop: CropTransform,
  options: SocialRenderOptions,
): Promise<SocialImageResult> {
  throwIfAborted(options.signal);
  const spec = socialOutputSpecs[id];
  const canvas = createRasterCanvas(spec.width, spec.height);
  const context = getRasterContext(canvas, { alpha: options.format === "png" });
  context.fillStyle = options.format === "jpeg" ? (options.backgroundColor ?? "#ffffff") : "rgba(0,0,0,0)";
  context.fillRect(0, 0, spec.width, spec.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  const draw = calculateCoverTransform(sourceDimensions.width, sourceDimensions.height, spec.width, spec.height, crop);
  context.save();
  context.translate(draw.centerX, draw.centerY);
  context.rotate(draw.rotationRadians);
  context.scale(draw.scale, draw.scale);
  context.drawImage(source, -sourceDimensions.width / 2, -sourceDimensions.height / 2, sourceDimensions.width, sourceDimensions.height);
  context.restore();
  throwIfAborted(options.signal);
  const verified = await encodeAndVerifyCanvas(canvas, {
    format: options.format,
    quality: options.quality,
    backgroundColor: options.backgroundColor,
    backgroundAlreadyApplied: options.format === "jpeg",
  });
  throwIfAborted(options.signal);
  return {
    id,
    label: spec.label,
    filename: socialOutputFilename(id, options.format),
    blob: verified.blob,
    format: verified.format,
    width: verified.width,
    height: verified.height,
  };
}

export function socialOutputFilename(id: SocialOutputId, format: "jpeg" | "png"): string {
  const suffix = id === "square" ? "1x1-1080x1080" : id === "portrait" ? "4x5-1080x1350" : "9x16-1080x1920";
  return `pixelfit-social-${suffix}.${format === "jpeg" ? "jpg" : "png"}`;
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException("SNS 이미지 생성이 취소되었습니다.", "AbortError");
}
