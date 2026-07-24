import { createRasterCanvas, encodeCanvasBlob, getRasterContext } from "./encode";
import type { ResizeDimensions } from "./resize";

export const PREVIEW_MAX_EDGE = 1280;
export const PREVIEW_MAX_PIXELS = 1_200_000;

export function planPreviewDimensions(source: ResizeDimensions): ResizeDimensions {
  if (!Number.isFinite(source.width) || !Number.isFinite(source.height) || source.width <= 0 || source.height <= 0) {
    throw new Error("미리보기 크기를 계산할 수 없습니다.");
  }
  const edgeScale = PREVIEW_MAX_EDGE / Math.max(source.width, source.height);
  const pixelScale = Math.sqrt(PREVIEW_MAX_PIXELS / (source.width * source.height));
  const scale = Math.min(1, edgeScale, pixelScale);
  return {
    width: Math.max(1, Math.round(source.width * scale)),
    height: Math.max(1, Math.round(source.height * scale)),
  };
}

export async function createBoundedPreviewBlob(source: CanvasImageSource, dimensions: ResizeDimensions): Promise<Blob> {
  const output = planPreviewDimensions(dimensions);
  const canvas = createRasterCanvas(output.width, output.height);
  const context = getRasterContext(canvas, { alpha: false });
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, output.width, output.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(source, 0, 0, dimensions.width, dimensions.height, 0, 0, output.width, output.height);
  return encodeCanvasBlob(canvas, { format: "jpeg", quality: .82, backgroundAlreadyApplied: true });
}
