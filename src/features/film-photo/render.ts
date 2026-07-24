import { createRasterCanvas, encodeAndVerifyCanvas, getRasterContext, verifyEncodedBlob } from "@/lib/image/encode";
import type { ResizeDimensions } from "@/lib/image/resize";
import type { FilmPhotoOptions, FilmPhotoResult } from "./types";

const MAX_FILM_EDGE = 4096;
const MAX_FILM_PIXELS = 16_000_000;

export function planFilmOutputDimensions(source: ResizeDimensions): ResizeDimensions {
  if (source.width <= 0 || source.height <= 0) throw new Error("원본 이미지 크기가 올바르지 않습니다.");
  const edgeScale = Math.min(1, MAX_FILM_EDGE / Math.max(source.width, source.height));
  const pixelScale = Math.min(1, Math.sqrt(MAX_FILM_PIXELS / (source.width * source.height)));
  const scale = Math.min(edgeScale, pixelScale);
  return { width: Math.max(1, Math.round(source.width * scale)), height: Math.max(1, Math.round(source.height * scale)) };
}

export async function renderFilmPhoto(
  source: CanvasImageSource,
  sourceDimensions: ResizeDimensions,
  options: FilmPhotoOptions,
): Promise<FilmPhotoResult> {
  throwIfAborted(options.signal);
  const output = planFilmOutputDimensions(sourceDimensions);
  const workerResult = await renderFilmInWorker(sourceDimensions, output, options);
  if (workerResult) return workerResult;
  return renderFilmLocally(source, sourceDimensions, output, options);
}

async function renderFilmInWorker(
  sourceDimensions: ResizeDimensions,
  output: ResizeDimensions,
  options: FilmPhotoOptions,
): Promise<FilmPhotoResult | null> {
  if (!options.sourceFile) return null;
  const workerApi = await import("@/workers/creative-worker-client");
  if (!workerApi.canUseCreativeImageWorker()) return null;
  try {
    const result = await workerApi.runCreativeImageWorker({
      kind: "film",
      file: options.sourceFile,
      sourceWidth: sourceDimensions.width,
      sourceHeight: sourceDimensions.height,
      outputWidth: output.width,
      outputHeight: output.height,
      effects: {
        mode: options.mode,
        strength: options.strength,
        grain: options.grain,
        vignette: options.vignette,
        lightLeak: options.lightLeak,
      },
      dateText: options.dateText,
      format: options.format,
      quality: options.quality,
      seed: options.seed ?? 73421,
    }, { signal: options.signal, onProgress: options.onProgress });
    throwIfAborted(options.signal);
    const verified = await verifyEncodedBlob(result.blob, {
      format: options.format,
      width: output.width,
      height: output.height,
      maxPixels: MAX_FILM_PIXELS,
    });
    throwIfAborted(options.signal);
    options.onProgress?.(100);
    return {
      blob: verified.blob,
      filename: filmPhotoFilename(options.mode, options.format),
      format: options.format,
      width: output.width,
      height: output.height,
      sourceDownscaled: output.width !== sourceDimensions.width || output.height !== sourceDimensions.height,
    };
  } catch (error) {
    if (error instanceof workerApi.CreativeWorkerUnavailableError) return null;
    throw error;
  }
}

async function renderFilmLocally(
  source: CanvasImageSource,
  sourceDimensions: ResizeDimensions,
  output: ResizeDimensions,
  options: FilmPhotoOptions,
): Promise<FilmPhotoResult> {
  const canvas = createRasterCanvas(output.width, output.height);
  const context = getRasterContext(canvas, { alpha: options.format === "png", willReadFrequently: true });
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, output.width, output.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(source, 0, 0, sourceDimensions.width, sourceDimensions.height, 0, 0, output.width, output.height);
  options.onProgress?.(20);
  throwIfAborted(options.signal);
  const pixels = context.getImageData(0, 0, output.width, output.height);
  const { applyFilmEffects } = await import("@/features/creative-tools/core");
  const effected = applyFilmEffects(pixels, {
    mode: options.mode,
    strength: options.strength,
    grain: options.grain,
    vignette: options.vignette,
    lightLeak: options.lightLeak,
  }, options.seed ?? 73421);
  throwIfAborted(options.signal);
  context.putImageData(effected, 0, 0);
  options.onProgress?.(76);
  if (options.dateText.trim()) paintDateStamp(context, output.width, output.height, options.dateText);
  const verified = await encodeAndVerifyCanvas(canvas, {
    format: options.format,
    quality: options.quality,
    backgroundColor: "#ffffff",
    backgroundAlreadyApplied: options.format === "jpeg",
  });
  options.onProgress?.(100);
  return {
    blob: verified.blob,
    filename: filmPhotoFilename(options.mode, options.format),
    format: options.format,
    width: output.width,
    height: output.height,
    sourceDownscaled: output.width !== sourceDimensions.width || output.height !== sourceDimensions.height,
  };
}

export function filmPhotoFilename(mode: FilmPhotoOptions["mode"], format: FilmPhotoOptions["format"]): string {
  return `film-photo-${mode}.${format === "jpeg" ? "jpg" : "png"}`;
}

function paintDateStamp(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, width: number, height: number, dateText: string) {
  const fontSize = Math.max(18, Math.round(Math.min(width, height) * .038));
  const x = width * .94;
  const y = height * .93;
  context.save();
  context.textAlign = "right";
  context.textBaseline = "bottom";
  context.font = `700 ${fontSize}px ui-monospace, SFMono-Regular, monospace`;
  context.shadowColor = "rgba(40,0,0,.8)";
  context.shadowBlur = fontSize * .14;
  context.fillStyle = "#ff9a61";
  context.fillText(dateText.trim().slice(0, 20), x, y, width * .55);
  context.restore();
}

function throwIfAborted(signal?: AbortSignal): void { if (signal?.aborted) throw new DOMException("필름 효과 생성이 취소되었습니다.", "AbortError"); }
