import { detectImageType, type SupportedImageType } from "@/lib/files/signatures";
import { decodeImage } from "./decode";

export type ImageOutputFormat = "jpeg" | "png" | "webp";
export type RasterCanvas = HTMLCanvasElement | OffscreenCanvas;
export type RasterContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export type EncodeCanvasOptions = {
  format: ImageOutputFormat;
  quality?: number;
  /** JPEG has no alpha channel, so transparent pixels are composited over this color. */
  backgroundColor?: string;
  /** Internal renderers may set this after they have already filled an opaque JPEG background. */
  backgroundAlreadyApplied?: boolean;
};

export type VerifiedEncodedImage = {
  blob: Blob;
  bytes: Uint8Array;
  format: ImageOutputFormat;
  width: number;
  height: number;
};

const MIME_BY_FORMAT: Record<ImageOutputFormat, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export function mimeForOutputFormat(format: ImageOutputFormat): string {
  return MIME_BY_FORMAT[format];
}

export function extensionForOutputFormat(format: ImageOutputFormat): "jpg" | "png" | "webp" {
  return format === "jpeg" ? "jpg" : format;
}

export function clampEncodeQuality(value: number | undefined, fallback = 0.9): number {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Math.min(1, Math.max(0.05, value));
}

export function normalizeCanvasColor(value: string | undefined, fallback = "#ffffff"): string {
  return value && HEX_COLOR.test(value) ? value.toLowerCase() : fallback;
}

export function assertEncodedSignature(bytes: Uint8Array, expected: ImageOutputFormat): SupportedImageType {
  const detected = detectImageType(bytes);
  if (!detected) throw new Error("생성된 파일의 이미지 서명을 확인할 수 없습니다.");
  if (detected !== expected) {
    throw new Error(`브라우저가 ${expected.toUpperCase()} 대신 ${detected.toUpperCase()} 파일을 만들었습니다. 다른 출력 형식을 선택해 주세요.`);
  }
  return detected;
}

export function createRasterCanvas(width: number, height: number): RasterCanvas {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new Error("출력 이미지 크기가 올바르지 않습니다.");
  }
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(width, height);
  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }
  throw new Error("이 환경에서는 이미지 캔버스를 만들 수 없습니다.");
}

export function getRasterContext(
  canvas: RasterCanvas,
  options?: CanvasRenderingContext2DSettings,
): RasterContext {
  const context = canvas.getContext("2d", options) as RasterContext | null;
  if (!context) throw new Error("2D 이미지 캔버스를 시작할 수 없습니다.");
  return context;
}

export async function encodeCanvasBlob(canvas: RasterCanvas, options: EncodeCanvasOptions): Promise<Blob> {
  const format = options.format;
  const mime = mimeForOutputFormat(format);
  const quality = format === "png" ? undefined : clampEncodeQuality(options.quality);
  const source = format === "jpeg" && !options.backgroundAlreadyApplied
    ? compositeCanvasBackground(canvas, normalizeCanvasColor(options.backgroundColor))
    : canvas;
  return canvasToBlob(source, mime, quality);
}

export async function verifyEncodedBlob(
  blob: Blob,
  expected: { format: ImageOutputFormat; width: number; height: number; maxPixels?: number },
): Promise<VerifiedEncodedImage> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  assertEncodedSignature(bytes, expected.format);
  const declaredMime = blob.type.toLowerCase().split(";", 1)[0];
  const expectedMime = mimeForOutputFormat(expected.format);
  if (declaredMime && declaredMime !== expectedMime) {
    throw new Error(`결과 MIME(${declaredMime})과 실제 요청 형식(${expectedMime})이 일치하지 않습니다.`);
  }

  const decoded = await decodeImage(blob, expected.maxPixels ?? 40_000_000);
  try {
    if (decoded.width !== expected.width || decoded.height !== expected.height) {
      throw new Error(`결과 크기가 ${decoded.width}×${decoded.height}px로 생성되어 요청한 ${expected.width}×${expected.height}px과 다릅니다.`);
    }
  } finally {
    decoded.close();
  }
  return { blob, bytes, format: expected.format, width: expected.width, height: expected.height };
}

export async function encodeAndVerifyCanvas(
  canvas: RasterCanvas,
  options: EncodeCanvasOptions,
): Promise<VerifiedEncodedImage> {
  const blob = await encodeCanvasBlob(canvas, options);
  return verifyEncodedBlob(blob, {
    format: options.format,
    width: canvas.width,
    height: canvas.height,
  });
}

function compositeCanvasBackground(canvas: RasterCanvas, color: string): RasterCanvas {
  const output = createRasterCanvas(canvas.width, canvas.height);
  const context = getRasterContext(output);
  context.fillStyle = color;
  context.fillRect(0, 0, output.width, output.height);
  context.drawImage(canvas as CanvasImageSource, 0, 0);
  return output;
}

function canvasToBlob(canvas: RasterCanvas, mime: string, quality?: number): Promise<Blob> {
  if (typeof HTMLCanvasElement !== "undefined" && canvas instanceof HTMLCanvasElement) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error(`${mime} 이미지 인코딩에 실패했습니다.`));
      }, mime, quality);
    });
  }
  if ("convertToBlob" in canvas) return canvas.convertToBlob({ type: mime, quality });
  throw new Error("이 브라우저에서는 이미지 파일을 인코딩할 수 없습니다.");
}
