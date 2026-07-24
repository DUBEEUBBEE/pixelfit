import { applyFourCutTone, layoutFourCut } from "@/features/creative-tools/core";
import { createRasterCanvas, encodeAndVerifyCanvas, getRasterContext, verifyEncodedBlob } from "@/lib/image/encode";
import { calculateCoverTransform } from "@/lib/image/geometry";
import { FOUR_CUT_SPECS, fourCutFilename } from "./helpers";
import type { FourCutOptions, FourCutResult, FourCutSource } from "./types";

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export async function renderFourCutPhoto(sources: readonly FourCutSource[], options: FourCutOptions): Promise<FourCutResult> {
  if (sources.length < 1 || sources.length > 4) throw new Error("네컷사진에는 사진 1~4장이 필요합니다.");
  if (options.order.length !== 4 || options.crops.length !== 4) throw new Error("네 칸의 순서와 크롭 정보가 필요합니다.");
  throwIfAborted(options.signal);
  const workerResult = await renderFourCutInWorker(sources, options);
  if (workerResult) return workerResult;
  return renderFourCutLocally(sources, options);
}

async function renderFourCutInWorker(sources: readonly FourCutSource[], options: FourCutOptions): Promise<FourCutResult | null> {
  if (sources.some((item) => !item.file)) return null;
  const workerApi = await import("@/workers/creative-worker-client");
  if (!workerApi.canUseCreativeImageWorker()) return null;
  const spec = FOUR_CUT_SPECS[options.orientation];
  try {
    const result = await workerApi.runCreativeImageWorker({
      kind: "four-cut",
      files: sources.map((item) => item.file as Blob),
      sourceDimensions: sources.map((item) => item.dimensions),
      orientation: options.orientation,
      tone: options.tone,
      frameColor: options.frameColor,
      dateText: options.dateText,
      caption: options.caption,
      order: options.order,
      crops: options.crops,
      format: options.format,
      quality: options.quality,
    }, { signal: options.signal, onProgress: options.onProgress });
    throwIfAborted(options.signal);
    const verified = await verifyEncodedBlob(result.blob, {
      format: options.format,
      width: spec.width,
      height: spec.height,
    });
    throwIfAborted(options.signal);
    options.onProgress?.(100);
    return {
      blob: verified.blob,
      filename: fourCutFilename(options.orientation, options.format),
      format: options.format,
      width: spec.width,
      height: spec.height,
    };
  } catch (error) {
    if (error instanceof workerApi.CreativeWorkerUnavailableError) return null;
    throw error;
  }
}

async function renderFourCutLocally(sources: readonly FourCutSource[], options: FourCutOptions): Promise<FourCutResult> {
  const spec = FOUR_CUT_SPECS[options.orientation];
  const canvas = createRasterCanvas(spec.width, spec.height);
  const context = getRasterContext(canvas, { alpha: options.format === "png" });
  const frameColor = HEX_COLOR.test(options.frameColor) ? options.frameColor : "#f8f3e9";
  context.fillStyle = frameColor;
  context.fillRect(0, 0, spec.width, spec.height);
  const frame = options.orientation === "vertical" ? 74 : 62;
  const gap = options.orientation === "vertical" ? 20 : 18;
  const cells = layoutFourCut(options.orientation, spec.width, spec.height, frame, gap);

  for (let index = 0; index < cells.length; index += 1) {
    throwIfAborted(options.signal);
    const sourceIndex = options.order[index];
    const item = sources[sourceIndex];
    if (!item) throw new Error(`${index + 1}번째 칸의 사진 순서가 올바르지 않습니다.`);
    const cell = cells[index];
    const crop = options.crops[index];
    const decoded = !item.source && item.file ? await import("@/lib/image/decode").then(({ decodeImage }) => decodeImage(item.file as Blob)) : null;
    const source = item.source ?? decoded?.source;
    if (!source) throw new Error(`${index + 1}번째 칸의 사진을 열 수 없습니다.`);
    try {
      const draw = calculateCoverTransform(item.dimensions.width, item.dimensions.height, cell.width, cell.height, crop);
      context.save();
      context.beginPath();
      context.rect(cell.x, cell.y, cell.width, cell.height);
      context.clip();
      context.translate(cell.x + draw.centerX, cell.y + draw.centerY);
      context.rotate(draw.rotationRadians);
      context.scale(draw.scale, draw.scale);
      context.drawImage(source, -item.dimensions.width / 2, -item.dimensions.height / 2, item.dimensions.width, item.dimensions.height);
      context.restore();
    } finally {
      decoded?.close();
    }
    if (options.tone !== "original") applyToneToRect(context, cell, options.tone);
    options.onProgress?.(20 + ((index + 1) / cells.length) * 56);
  }

  paintCaption(context, spec.width, spec.height, options.caption, options.dateText, frameColor);
  throwIfAborted(options.signal);
  const verified = await encodeAndVerifyCanvas(canvas, {
    format: options.format,
    quality: options.quality,
    backgroundColor: frameColor,
    backgroundAlreadyApplied: options.format === "jpeg",
  });
  throwIfAborted(options.signal);
  options.onProgress?.(100);
  return {
    blob: verified.blob,
    filename: fourCutFilename(options.orientation, options.format),
    format: options.format,
    width: spec.width,
    height: spec.height,
  };
}

function applyToneToRect(
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
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

function paintCaption(
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
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

function readableTextColor(hex: string): string {
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  return red * .299 + green * .587 + blue * .114 > 150 ? "#172033" : "#ffffff";
}

function throwIfAborted(signal?: AbortSignal): void { if (signal?.aborted) throw new DOMException("네컷사진 생성이 취소되었습니다.", "AbortError"); }
