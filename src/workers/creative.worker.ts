/// <reference lib="webworker" />

import { applyFilmEffects, applyFourCutTone, layoutFourCut } from "@/features/creative-tools/core";
import { calculateCoverTransform } from "@/lib/image/geometry";
import type {
  CreativeWorkerFormat,
  CreativeWorkerDonePayload,
  CreativeWorkerMessageRequest,
  CreativeWorkerResponse,
  CompressionWorkerRequest,
  ConvertWorkerRequest,
  FilmWorkerRequest,
  FourCutWorkerRequest,
  ResizeWorkerRequest,
  SocialWorkerRequest,
  ThumbnailWorkerRequest,
} from "./creative-worker-protocol";

const workerScope: DedicatedWorkerGlobalScope = self as DedicatedWorkerGlobalScope;
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

workerScope.onmessage = (event: MessageEvent<CreativeWorkerMessageRequest>) => {
  void renderRequest(event.data);
};

async function renderRequest(request: CreativeWorkerMessageRequest): Promise<void> {
  if (typeof OffscreenCanvas !== "function" || typeof createImageBitmap !== "function") {
    post({ type: "error", code: "UNSUPPORTED", message: "이 브라우저 워커에서는 OffscreenCanvas 이미지 처리를 사용할 수 없습니다." });
    return;
  }
  try {
    const result = request.kind === "film"
      ? await renderFilm(request)
      : request.kind === "four-cut"
        ? await renderFourCut(request)
        : request.kind === "compress"
          ? await renderCompression(request)
          : request.kind === "resize"
            ? await renderResize(request)
            : request.kind === "convert"
              ? await renderConvert(request)
              : request.kind === "social"
                ? await renderSocial(request)
                : await renderThumbnail(request);
    post({ type: "done", ...result });
  } catch (error) {
    post({ type: "error", message: error instanceof Error ? error.message : "이미지 워커 처리에 실패했습니다." });
  }
}

async function renderSocial(request: SocialWorkerRequest): Promise<CreativeWorkerDonePayload> {
  let bitmap: ImageBitmap | undefined;
  try {
    bitmap = await createImageBitmap(request.file, { imageOrientation: "from-image" });
    assertBitmapSize(bitmap, request.sourceWidth, request.sourceHeight);
    postProgress(16);
    const { renderSocialImage } = await import("@/features/social-image-pack/render");
    const result = await renderSocialImage(
      bitmap,
      { width: request.sourceWidth, height: request.sourceHeight },
      request.outputId,
      request.crop,
      { format: request.format, quality: request.quality },
    );
    postProgress(92);
    return {
      blob: result.blob,
      width: result.width,
      height: result.height,
      format: result.format,
      details: { kind: "social", outputId: request.outputId },
    };
  } finally {
    bitmap?.close();
  }
}

async function renderThumbnail(request: ThumbnailWorkerRequest): Promise<CreativeWorkerDonePayload> {
  let bitmap: ImageBitmap | undefined;
  try {
    bitmap = await createImageBitmap(request.file, { imageOrientation: "from-image" });
    assertBitmapSize(bitmap, request.sourceWidth, request.sourceHeight);
    postProgress(12);
    const { renderYoutubeThumbnail } = await import("@/features/youtube-thumbnail/render");
    const result = await renderYoutubeThumbnail(
      bitmap,
      { width: request.sourceWidth, height: request.sourceHeight },
      {
        template: request.template,
        title: request.title,
        subtitle: request.subtitle,
        crop: request.crop,
        titleSize: request.titleSize,
        accentColor: request.accentColor,
        align: request.align,
        format: request.format,
        quality: request.quality,
      },
    );
    postProgress(92);
    return {
      blob: result.blob,
      width: result.width,
      height: result.height,
      format: result.format,
      details: { kind: "thumbnail", titleLines: result.titleLines, subtitleLines: result.subtitleLines },
    };
  } finally {
    bitmap?.close();
  }
}

async function renderCompression(request: CompressionWorkerRequest): Promise<CreativeWorkerDonePayload> {
  let bitmap: ImageBitmap | undefined;
  try {
    bitmap = await createImageBitmap(request.file, { imageOrientation: "from-image" });
    assertBitmapSize(bitmap, request.sourceWidth, request.sourceHeight);
    postProgress(8);
    const { compressImageSource } = await import("@/features/image-compressor/compress");
    const result = await compressImageSource(bitmap, { width: request.sourceWidth, height: request.sourceHeight }, {
      format: request.format,
      targetBytes: request.targetBytes,
      allowDownscale: request.allowDownscale,
      backgroundColor: request.backgroundColor,
      minQuality: request.minQuality,
      maxQuality: request.maxQuality,
      maxQualityAttempts: request.maxQualityAttempts,
      maxDownscaleSteps: request.maxDownscaleSteps,
      onProgress: postProgress,
    });
    return {
      blob: result.blob,
      width: result.width,
      height: result.height,
      format: result.format,
      details: {
        kind: "compress" as const,
        quality: result.quality,
        attempts: result.attempts,
        downscaleSteps: result.downscaleSteps,
        reachedTarget: result.reachedTarget,
        warnings: result.warnings,
      },
    };
  } finally {
    bitmap?.close();
  }
}

async function renderResize(request: ResizeWorkerRequest): Promise<CreativeWorkerDonePayload> {
  let bitmap: ImageBitmap | undefined;
  try {
    bitmap = await createImageBitmap(request.file, { imageOrientation: "from-image" });
    assertBitmapSize(bitmap, request.sourceWidth, request.sourceHeight);
    postProgress(16);
    const { resizeImageSource } = await import("@/features/image-resizer/resize-image");
    const result = await resizeImageSource(bitmap, { width: request.sourceWidth, height: request.sourceHeight }, {
      output: request.output,
      fit: request.fit,
      format: request.format,
      quality: request.quality,
      backgroundColor: request.backgroundColor,
    });
    postProgress(92);
    return { blob: result.blob, width: result.width, height: result.height, format: result.format, details: { kind: "resize" as const } };
  } finally {
    bitmap?.close();
  }
}

async function renderConvert(request: ConvertWorkerRequest): Promise<CreativeWorkerDonePayload> {
  let bitmap: ImageBitmap | undefined;
  try {
    bitmap = await createImageBitmap(request.file, { imageOrientation: "from-image" });
    assertBitmapSize(bitmap, request.sourceWidth, request.sourceHeight);
    postProgress(12);
    const bytes = new Uint8Array(await request.file.arrayBuffer());
    const { convertImageSource } = await import("@/features/image-converter/convert");
    const result = await convertImageSource(bitmap, { width: request.sourceWidth, height: request.sourceHeight }, bytes, request.inputFormat, {
      outputFormat: request.outputFormat,
      quality: request.quality,
      backgroundColor: request.backgroundColor,
      metadataPolicy: request.metadataPolicy,
    });
    postProgress(92);
    return {
      blob: result.blob,
      width: result.width,
      height: result.height,
      format: result.format,
      details: {
        kind: "convert" as const,
        metadataPolicy: result.metadataPolicy,
        metadataRemoved: result.metadataRemoved,
        metadataPreservedExactly: result.metadataPreservedExactly,
        warnings: result.warnings,
      },
    };
  } finally {
    bitmap?.close();
  }
}

async function renderFilm(request: FilmWorkerRequest): Promise<CreativeWorkerDonePayload> {
  let bitmap: ImageBitmap | undefined;
  try {
    bitmap = await createImageBitmap(request.file, { imageOrientation: "from-image" });
    assertBitmapSize(bitmap, request.sourceWidth, request.sourceHeight);
    postProgress(12);
    const canvas = new OffscreenCanvas(request.outputWidth, request.outputHeight);
    const context = getContext(canvas, request.format === "png", true);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, 0, 0, request.sourceWidth, request.sourceHeight, 0, 0, canvas.width, canvas.height);
    postProgress(22);

    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    const effected = applyFilmEffects(pixels, request.effects, request.seed);
    context.putImageData(effected, 0, 0);
    postProgress(76);
    if (request.dateText.trim()) paintDateStamp(context, canvas.width, canvas.height, request.dateText);
    const blob = await encode(canvas, request.format, request.quality);
    postProgress(92);
    return { blob, width: canvas.width, height: canvas.height, format: request.format };
  } finally {
    bitmap?.close();
  }
}

async function renderFourCut(request: FourCutWorkerRequest): Promise<CreativeWorkerDonePayload> {
  if (request.files.length < 1 || request.files.length > 4) throw new Error("네컷사진에는 사진 1~4장이 필요합니다.");
  if (request.sourceDimensions.length !== request.files.length || request.order.length !== 4 || request.crops.length !== 4) {
    throw new Error("네컷사진 입력 정보가 올바르지 않습니다.");
  }
  const bitmaps: ImageBitmap[] = [];
  try {
    for (let index = 0; index < request.files.length; index += 1) {
      const bitmap = await createImageBitmap(request.files[index], { imageOrientation: "from-image" });
      const dimensions = request.sourceDimensions[index];
      assertBitmapSize(bitmap, dimensions.width, dimensions.height);
      bitmaps.push(bitmap);
      postProgress(8 + Math.round(((index + 1) / request.files.length) * 12));
    }

    const spec = request.orientation === "vertical"
      ? { width: 1200, height: 1800, frame: 74, gap: 20 }
      : { width: 1800, height: 1200, frame: 62, gap: 18 };
    const frameColor = HEX_COLOR.test(request.frameColor) ? request.frameColor : "#f8f3e9";
    const canvas = new OffscreenCanvas(spec.width, spec.height);
    const context = getContext(canvas, request.format === "png", request.tone !== "original");
    context.fillStyle = frameColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
    const cells = layoutFourCut(request.orientation, canvas.width, canvas.height, spec.frame, spec.gap);

    for (let index = 0; index < cells.length; index += 1) {
      const sourceIndex = request.order[index];
      const bitmap = bitmaps[sourceIndex];
      const dimensions = request.sourceDimensions[sourceIndex];
      if (!bitmap || !dimensions) throw new Error(`${index + 1}번째 칸의 사진 순서가 올바르지 않습니다.`);
      const cell = cells[index];
      const crop = request.crops[index];
      const draw = calculateCoverTransform(dimensions.width, dimensions.height, cell.width, cell.height, crop);
      context.save();
      context.beginPath();
      context.rect(cell.x, cell.y, cell.width, cell.height);
      context.clip();
      context.translate(cell.x + draw.centerX, cell.y + draw.centerY);
      context.rotate(draw.rotationRadians);
      context.scale(draw.scale, draw.scale);
      context.drawImage(bitmap, -dimensions.width / 2, -dimensions.height / 2, dimensions.width, dimensions.height);
      context.restore();
      if (request.tone !== "original") applyToneToRect(context, cell, request.tone);
      postProgress(24 + Math.round(((index + 1) / cells.length) * 52));
    }

    paintCaption(context, canvas.width, canvas.height, request.caption, request.dateText, frameColor);
    const blob = await encode(canvas, request.format, request.quality);
    postProgress(92);
    return { blob, width: canvas.width, height: canvas.height, format: request.format };
  } finally {
    for (const bitmap of bitmaps) bitmap.close();
  }
}

function applyToneToRect(
  context: OffscreenCanvasRenderingContext2D,
  rect: { x: number; y: number; width: number; height: number },
  tone: "mono" | "vintage",
) {
  const x = Math.max(0, Math.round(rect.x));
  const y = Math.max(0, Math.round(rect.y));
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  const image = context.getImageData(x, y, width, height);
  applyFourCutTone(image.data, tone);
  context.putImageData(image, x, y);
}

function getContext(canvas: OffscreenCanvas, alpha: boolean, willReadFrequently: boolean): OffscreenCanvasRenderingContext2D {
  const context = canvas.getContext("2d", { alpha, willReadFrequently });
  if (!context) throw new Error("워커의 2D 이미지 캔버스를 시작할 수 없습니다.");
  return context;
}

function encode(canvas: OffscreenCanvas, format: CreativeWorkerFormat, quality?: number): Promise<Blob> {
  const type = format === "jpeg" ? "image/jpeg" : format === "webp" ? "image/webp" : "image/png";
  return canvas.convertToBlob({ type, quality: format === "png" ? undefined : clampQuality(quality) });
}

function paintDateStamp(context: OffscreenCanvasRenderingContext2D, width: number, height: number, dateText: string) {
  const fontSize = Math.max(18, Math.round(Math.min(width, height) * .038));
  context.save();
  context.textAlign = "right";
  context.textBaseline = "bottom";
  context.font = `700 ${fontSize}px ui-monospace, SFMono-Regular, monospace`;
  context.shadowColor = "rgba(40,0,0,.8)";
  context.shadowBlur = fontSize * .14;
  context.fillStyle = "#ff9a61";
  context.fillText(dateText.trim().slice(0, 20), width * .94, height * .93, width * .55);
  context.restore();
}

function paintCaption(
  context: OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  caption: string,
  dateText: string,
  frameColor: string,
) {
  if (!caption.trim() && !dateText.trim()) return;
  context.save();
  context.fillStyle = frameColor;
  context.globalAlpha = .94;
  context.fillRect(0, height - 112, width, 112);
  context.globalAlpha = 1;
  context.fillStyle = readableTextColor(frameColor);
  context.textBaseline = "middle";
  context.font = "800 34px Pretendard, Apple SD Gothic Neo, sans-serif";
  context.textAlign = "left";
  context.fillText(caption.trim().slice(0, 40), 62, height - 56, width * .62);
  context.textAlign = "right";
  context.font = "700 28px ui-monospace, SFMono-Regular, monospace";
  context.fillText(dateText.trim().slice(0, 20), width - 62, height - 56, width * .3);
  context.restore();
}

function assertBitmapSize(bitmap: ImageBitmap, width: number, height: number) {
  if (bitmap.width !== width || bitmap.height !== height) {
    throw new Error(`사진 해석 크기가 ${bitmap.width}×${bitmap.height}px로 바뀌어 안전하게 처리하지 못했습니다.`);
  }
}

function readableTextColor(hex: string): string {
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  return red * .299 + green * .587 + blue * .114 > 150 ? "#172033" : "#ffffff";
}

function clampQuality(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return .9;
  return Math.min(1, Math.max(.05, value));
}

function postProgress(value: number) {
  post({ type: "progress", value });
}

function post(message: CreativeWorkerResponse) {
  workerScope.postMessage(message);
}

export {};
