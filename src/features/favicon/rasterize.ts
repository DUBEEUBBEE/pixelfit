import {
  FAVICON_SIZES,
  type DrawRect,
  type FaviconDrawPlan,
  type FaviconPngBlobs,
  type FaviconSize,
  type FaviconTheme,
  type RasterizeFaviconOptions,
  type SourceDimensions,
} from "./types";

type FaviconCanvas = HTMLCanvasElement | OffscreenCanvas;
type FaviconContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

const DEFAULT_BACKGROUND = "#ffffff";
const HEX_COLOR = /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i;

const DEFAULT_PADDING: Record<FaviconTheme, number> = {
  fill: 0,
  "safe-padding": 0.16,
  circle: 0.14,
  rounded: 0.1,
  transparent: 0,
  solid: 0.1,
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function readPositiveNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : undefined;
}

export function getCanvasSourceDimensions(source: CanvasImageSource): SourceDimensions {
  const candidate = source as unknown as Record<string, unknown>;
  const possibleDimensions: Array<[unknown, unknown]> = [
    [candidate.naturalWidth, candidate.naturalHeight],
    [candidate.videoWidth, candidate.videoHeight],
    [candidate.displayWidth, candidate.displayHeight],
    [candidate.width, candidate.height],
  ];

  for (const [widthValue, heightValue] of possibleDimensions) {
    const width = readPositiveNumber(widthValue);
    const height = readPositiveNumber(heightValue);
    if (width && height) return { width, height };
  }

  throw new Error("이미지 크기를 확인할 수 없습니다.");
}

function containRect(
  source: SourceDimensions,
  outputSize: number,
  paddingRatio: number,
): DrawRect {
  const available = outputSize * (1 - paddingRatio * 2);
  const scale = Math.min(available / source.width, available / source.height);
  const width = source.width * scale;
  const height = source.height * scale;

  return {
    x: (outputSize - width) / 2,
    y: (outputSize - height) / 2,
    width,
    height,
  };
}

function coverSourceRect(source: SourceDimensions): DrawRect {
  const edge = Math.min(source.width, source.height);
  return {
    x: (source.width - edge) / 2,
    y: (source.height - edge) / 2,
    width: edge,
    height: edge,
  };
}

export function calculateFaviconDrawPlan(
  source: SourceDimensions,
  outputSize: FaviconSize,
  options: Pick<
    RasterizeFaviconOptions,
    "theme" | "paddingRatio" | "cornerRadiusRatio"
  > = {},
): FaviconDrawPlan {
  if (
    !Number.isFinite(source.width) ||
    !Number.isFinite(source.height) ||
    source.width <= 0 ||
    source.height <= 0
  ) {
    throw new Error("원본 이미지 크기가 올바르지 않습니다.");
  }

  const theme = options.theme ?? "safe-padding";
  const paddingRatio = clamp(
    options.paddingRatio ?? DEFAULT_PADDING[theme],
    0,
    0.4,
  );
  const cornerRadiusRatio = clamp(options.cornerRadiusRatio ?? 0.22, 0, 0.5);
  const sourceRect =
    theme === "fill"
      ? coverSourceRect(source)
      : { x: 0, y: 0, width: source.width, height: source.height };
  const destination =
    theme === "fill"
      ? { x: 0, y: 0, width: outputSize, height: outputSize }
      : containRect(source, outputSize, paddingRatio);

  const background =
    theme === "circle"
      ? "circle"
      : theme === "rounded"
        ? "rounded"
        : theme === "solid"
          ? "square"
          : "transparent";
  const clip = theme === "circle" ? "circle" : theme === "rounded" ? "rounded" : "none";

  return {
    background,
    clip,
    cornerRadius: outputSize * cornerRadiusRatio,
    destination,
    source: sourceRect,
  };
}

function createCanvas(size: FaviconSize): FaviconCanvas {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(size, size);
  }

  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    return canvas;
  }

  throw new Error("파비콘은 Canvas를 지원하는 브라우저에서만 만들 수 있습니다.");
}

function beginRoundedRect(
  context: FaviconContext,
  size: number,
  requestedRadius: number,
) {
  const radius = clamp(requestedRadius, 0, size / 2);
  context.beginPath();
  context.moveTo(radius, 0);
  context.lineTo(size - radius, 0);
  context.quadraticCurveTo(size, 0, size, radius);
  context.lineTo(size, size - radius);
  context.quadraticCurveTo(size, size, size - radius, size);
  context.lineTo(radius, size);
  context.quadraticCurveTo(0, size, 0, size - radius);
  context.lineTo(0, radius);
  context.quadraticCurveTo(0, 0, radius, 0);
  context.closePath();
}

function applyBackgroundAndClip(
  context: FaviconContext,
  size: FaviconSize,
  plan: FaviconDrawPlan,
  backgroundColor: string,
) {
  context.clearRect(0, 0, size, size);

  if (plan.background === "transparent") return;

  context.fillStyle = backgroundColor;
  if (plan.background === "square") {
    context.fillRect(0, 0, size, size);
    return;
  }

  if (plan.background === "circle") {
    context.beginPath();
    context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  } else {
    beginRoundedRect(context, size, plan.cornerRadius);
  }
  context.fill();

  if (plan.clip === "circle") {
    context.beginPath();
    context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  } else {
    beginRoundedRect(context, size, plan.cornerRadius);
  }
  context.clip();
}

function canvasToPngBlob(canvas: FaviconCanvas): Promise<Blob> {
  if (
    typeof HTMLCanvasElement !== "undefined" &&
    canvas instanceof HTMLCanvasElement
  ) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("PNG 인코딩에 실패했습니다."));
      }, "image/png");
    });
  }

  return (canvas as OffscreenCanvas).convertToBlob({ type: "image/png" });
}

function throwIfAborted(signal: AbortSignal | undefined) {
  if (signal?.aborted) {
    throw new DOMException("파비콘 생성이 취소되었습니다.", "AbortError");
  }
}

function normalizeBackgroundColor(value: string | undefined) {
  const color = value?.trim();
  return color && HEX_COLOR.test(color) ? color : DEFAULT_BACKGROUND;
}

export async function rasterizeFaviconPng(
  source: CanvasImageSource,
  size: FaviconSize,
  options: RasterizeFaviconOptions = {},
): Promise<Blob> {
  throwIfAborted(options.signal);
  const canvas = createCanvas(size);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("2D Canvas를 시작할 수 없습니다.");

  const sourceDimensions = getCanvasSourceDimensions(source);
  const plan = calculateFaviconDrawPlan(sourceDimensions, size, options);
  context.save();
  applyBackgroundAndClip(
    context,
    size,
    plan,
    normalizeBackgroundColor(options.backgroundColor),
  );
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  const sourceRect = plan.source;
  const destination = plan.destination;
  context.drawImage(
    source,
    sourceRect.x,
    sourceRect.y,
    sourceRect.width,
    sourceRect.height,
    destination.x,
    destination.y,
    destination.width,
    destination.height,
  );
  context.restore();
  throwIfAborted(options.signal);
  const blob = await canvasToPngBlob(canvas);
  throwIfAborted(options.signal);
  return blob;
}

export async function generateFaviconPngs(
  source: CanvasImageSource,
  options: RasterizeFaviconOptions = {},
): Promise<FaviconPngBlobs> {
  const entries = await Promise.all(
    FAVICON_SIZES.map(async (size) => {
      const blob = await rasterizeFaviconPng(source, size, options);
      return [size, blob] as const;
    }),
  );

  return Object.fromEntries(entries) as FaviconPngBlobs;
}
