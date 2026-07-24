import { compressToTarget } from "@/lib/image/compression";
import {
  createRasterCanvas,
  encodeCanvasBlob,
  getRasterContext,
  verifyEncodedBlob,
  type ImageOutputFormat,
  type RasterCanvas,
} from "@/lib/image/encode";
import { validateResizeDimensions, type ResizeDimensions } from "@/lib/image/resize";
import type { ImageCompressionOptions, ImageCompressionResult, TargetSizeUnit } from "./types";

export const TARGET_SIZE_PRESETS = [100, 200, 500, 1024, 2048] as const;
const MIN_OUTPUT_EDGE = 32;

export function targetSizeToBytes(value: number, unit: TargetSizeUnit): number {
  if (!Number.isFinite(value) || value <= 0) throw new Error("목표 용량은 0보다 커야 합니다.");
  const bytes = Math.round(value * (unit === "MB" ? 1024 ** 2 : 1024));
  if (bytes < 1024) throw new Error("목표 용량은 1KB 이상이어야 합니다.");
  if (bytes > 25 * 1024 ** 2) throw new Error("목표 용량은 25MB 이하여야 합니다.");
  return bytes;
}

export function nextCompressionDimensions(
  current: ResizeDimensions,
  currentBytes: number,
  targetBytes: number,
): ResizeDimensions {
  if (currentBytes <= 0 || targetBytes <= 0) throw new Error("압축 크기를 계산할 수 없습니다.");
  const suggested = Math.sqrt(targetBytes / currentBytes) * 0.92;
  const scale = Math.min(0.88, Math.max(0.45, suggested));
  const minimumScale = Math.min(
    1,
    Math.max(
      current.width >= MIN_OUTPUT_EDGE ? MIN_OUTPUT_EDGE / current.width : 1,
      current.height >= MIN_OUTPUT_EDGE ? MIN_OUTPUT_EDGE / current.height : 1,
    ),
  );
  const safeScale = Math.min(1, Math.max(scale, minimumScale));
  return { width: Math.max(1, Math.floor(current.width * safeScale)), height: Math.max(1, Math.floor(current.height * safeScale)) };
}

export async function compressImageSource(
  source: CanvasImageSource,
  sourceDimensions: ResizeDimensions,
  options: ImageCompressionOptions,
): Promise<ImageCompressionResult> {
  validateResizeDimensions(sourceDimensions);
  if (!Number.isInteger(options.targetBytes) || options.targetBytes <= 0) throw new Error("목표 바이트가 올바르지 않습니다.");
  throwIfAborted(options.signal);
  const workerResult = await compressInWorker(sourceDimensions, options);
  if (workerResult) return workerResult;
  return compressLocally(source, sourceDimensions, options);
}

async function compressInWorker(
  sourceDimensions: ResizeDimensions,
  options: ImageCompressionOptions,
): Promise<ImageCompressionResult | null> {
  if (!options.sourceFile) return null;
  const workerApi = await import("@/workers/creative-worker-client");
  if (!workerApi.canUseCreativeImageWorker()) return null;
  try {
    const result = await workerApi.runCreativeImageWorker({
      kind: "compress",
      file: options.sourceFile,
      sourceWidth: sourceDimensions.width,
      sourceHeight: sourceDimensions.height,
      format: options.format,
      targetBytes: options.targetBytes,
      allowDownscale: options.allowDownscale,
      backgroundColor: options.backgroundColor,
      minQuality: options.minQuality,
      maxQuality: options.maxQuality,
      maxQualityAttempts: options.maxQualityAttempts,
      maxDownscaleSteps: options.maxDownscaleSteps,
    }, { signal: options.signal, onProgress: options.onProgress });
    if (result.details?.kind !== "compress") throw new Error("압축 워커 결과 정보를 확인할 수 없습니다.");
    throwIfAborted(options.signal);
    const verified = await verifyEncodedBlob(result.blob, { format: options.format, width: result.width, height: result.height });
    throwIfAborted(options.signal);
    options.onProgress?.(100);
    return {
      blob: verified.blob,
      format: options.format,
      width: verified.width,
      height: verified.height,
      quality: result.details.quality,
      attempts: result.details.attempts,
      downscaleSteps: result.details.downscaleSteps,
      reachedTarget: verified.blob.size <= options.targetBytes && result.details.reachedTarget,
      warnings: result.details.warnings,
    };
  } catch (error) {
    if (error instanceof workerApi.CreativeWorkerUnavailableError) return null;
    throw error;
  }
}

async function compressLocally(
  source: CanvasImageSource,
  sourceDimensions: ResizeDimensions,
  options: ImageCompressionOptions,
): Promise<ImageCompressionResult> {
  const maxDownscaleSteps = Math.min(6, Math.max(0, options.maxDownscaleSteps ?? 4));
  let dimensions = sourceDimensions;
  let totalAttempts = 0;
  let final: Awaited<ReturnType<typeof encodeAtDimensions>> | null = null;
  let downscaleSteps = 0;

  for (let step = 0; step <= maxDownscaleSteps; step += 1) {
    throwIfAborted(options.signal);
    options.onProgress?.(Math.min(90, 8 + step * (76 / Math.max(1, maxDownscaleSteps + 1))));
    const encoded = await encodeAtDimensions(source, sourceDimensions, dimensions, options);
    throwIfAborted(options.signal);
    totalAttempts += encoded.attempts;
    final = encoded;
    if (encoded.blob.size <= options.targetBytes) break;
    if (!options.allowDownscale || step === maxDownscaleSteps) break;
    const next = nextCompressionDimensions(dimensions, encoded.blob.size, options.targetBytes);
    if (next.width === dimensions.width && next.height === dimensions.height) break;
    dimensions = next;
    downscaleSteps += 1;
  }

  if (!final) throw new Error("압축 결과를 만들지 못했습니다.");
  const verified = await verifyEncodedBlob(final.blob, { format: options.format, width: dimensions.width, height: dimensions.height });
  throwIfAborted(options.signal);
  const reachedTarget = verified.blob.size <= options.targetBytes;
  const warnings: string[] = [];
  if (downscaleSteps > 0) warnings.push(`목표 용량을 위해 해상도를 ${dimensions.width}×${dimensions.height}px로 줄였습니다.`);
  if (!reachedTarget) warnings.push("최소 품질과 설정된 해상도 축소 범위에서도 목표 용량에 도달하지 못했습니다.");
  if (final.quality !== undefined && final.quality < 0.6) warnings.push("압축 품질이 낮아 확대하면 세부 묘사가 흐려 보일 수 있습니다.");
  options.onProgress?.(100);
  return {
    blob: verified.blob,
    format: options.format,
    width: verified.width,
    height: verified.height,
    quality: final.quality,
    attempts: totalAttempts,
    downscaleSteps,
    reachedTarget,
    warnings,
  };
}

async function encodeAtDimensions(
  source: CanvasImageSource,
  sourceDimensions: ResizeDimensions,
  outputDimensions: ResizeDimensions,
  options: ImageCompressionOptions,
): Promise<{ blob: Blob; quality?: number; attempts: number }> {
  const canvas = drawScaledCanvas(source, sourceDimensions, outputDimensions, options.format, options.backgroundColor);
  if (options.format === "png") {
    const blob = await encodeCanvasBlob(canvas, { format: "png" });
    throwIfAborted(options.signal);
    return {
      blob,
      attempts: 1,
    };
  }
  const compressed = await compressToTarget(
    (quality) => {
      throwIfAborted(options.signal);
      return encodeCanvasBlob(canvas, { format: options.format, quality, backgroundColor: options.backgroundColor, backgroundAlreadyApplied: options.format === "jpeg" });
    },
    options.targetBytes,
    {
      minQuality: options.minQuality ?? 0.42,
      maxQuality: options.maxQuality ?? 0.94,
      maxAttempts: Math.min(10, Math.max(3, options.maxQualityAttempts ?? 8)),
    },
  );
  throwIfAborted(options.signal);
  return compressed;
}

function drawScaledCanvas(
  source: CanvasImageSource,
  sourceDimensions: ResizeDimensions,
  outputDimensions: ResizeDimensions,
  format: ImageOutputFormat,
  backgroundColor?: string,
): RasterCanvas {
  const canvas = createRasterCanvas(outputDimensions.width, outputDimensions.height);
  const context = getRasterContext(canvas);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.clearRect(0, 0, outputDimensions.width, outputDimensions.height);
  if (format === "jpeg") {
    context.fillStyle = backgroundColor ?? "#ffffff";
    context.fillRect(0, 0, outputDimensions.width, outputDimensions.height);
  }
  context.drawImage(source, 0, 0, sourceDimensions.width, sourceDimensions.height, 0, 0, outputDimensions.width, outputDimensions.height);
  return canvas;
}

export function compressionOutputFilename(format: ImageOutputFormat): string {
  return `pixelfit-compressed.${format === "jpeg" ? "jpg" : format}`;
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException("압축이 취소되었습니다.", "AbortError");
}
