export type ResizeDimensions = { width: number; height: number };
export type ResizeMode = "dimensions" | "long-edge" | "percent";
export type ResizeFit = "contain" | "cover";

export type ResizeRequest =
  | { mode: "dimensions"; width: number; height: number; ratioLocked: boolean; anchor?: "width" | "height" }
  | { mode: "long-edge"; longEdge: number }
  | { mode: "percent"; percent: number };

export type FitPlan = {
  source: { x: number; y: number; width: number; height: number };
  destination: { x: number; y: number; width: number; height: number };
};

export const MAX_OUTPUT_EDGE = 16_384;
export const MAX_OUTPUT_PIXELS = 40_000_000;

export function resolveResizeDimensions(
  source: ResizeDimensions,
  request: ResizeRequest,
): ResizeDimensions {
  assertDimensions(source);
  if (request.mode === "long-edge") {
    const edge = positiveInteger(request.longEdge, "긴 변");
    const scale = edge / Math.max(source.width, source.height);
    return validateResizeDimensions({ width: Math.round(source.width * scale), height: Math.round(source.height * scale) });
  }
  if (request.mode === "percent") {
    if (!Number.isFinite(request.percent) || request.percent <= 0 || request.percent > 1_000) {
      throw new Error("크기 비율은 0보다 크고 1000% 이하여야 합니다.");
    }
    const scale = request.percent / 100;
    return validateResizeDimensions({ width: Math.round(source.width * scale), height: Math.round(source.height * scale) });
  }

  const width = positiveInteger(request.width, "가로");
  const height = positiveInteger(request.height, "세로");
  if (!request.ratioLocked) return validateResizeDimensions({ width, height });
  return request.anchor === "height"
    ? validateResizeDimensions({ width: Math.round(height * source.width / source.height), height })
    : validateResizeDimensions({ width, height: Math.round(width * source.height / source.width) });
}

export function validateResizeDimensions(
  dimensions: ResizeDimensions,
  limits: { maxEdge?: number; maxPixels?: number } = {},
): ResizeDimensions {
  const width = positiveInteger(dimensions.width, "가로");
  const height = positiveInteger(dimensions.height, "세로");
  const maxEdge = limits.maxEdge ?? MAX_OUTPUT_EDGE;
  const maxPixels = limits.maxPixels ?? MAX_OUTPUT_PIXELS;
  if (width > maxEdge || height > maxEdge) throw new Error(`출력 한 변은 ${maxEdge.toLocaleString()}px 이하여야 합니다.`);
  if (width * height > maxPixels) throw new Error(`출력은 ${maxPixels.toLocaleString()}픽셀 이하여야 합니다.`);
  return { width, height };
}

export function calculateFitPlan(
  source: ResizeDimensions,
  output: ResizeDimensions,
  fit: ResizeFit,
): FitPlan {
  assertDimensions(source);
  assertDimensions(output);
  if (fit === "contain") {
    const scale = Math.min(output.width / source.width, output.height / source.height);
    const width = source.width * scale;
    const height = source.height * scale;
    return {
      source: { x: 0, y: 0, width: source.width, height: source.height },
      destination: { x: (output.width - width) / 2, y: (output.height - height) / 2, width, height },
    };
  }
  const sourceRatio = source.width / source.height;
  const outputRatio = output.width / output.height;
  if (sourceRatio > outputRatio) {
    const width = source.height * outputRatio;
    return {
      source: { x: (source.width - width) / 2, y: 0, width, height: source.height },
      destination: { x: 0, y: 0, width: output.width, height: output.height },
    };
  }
  const height = source.width / outputRatio;
  return {
    source: { x: 0, y: (source.height - height) / 2, width: source.width, height },
    destination: { x: 0, y: 0, width: output.width, height: output.height },
  };
}

export function isUpscale(source: ResizeDimensions, output: ResizeDimensions): boolean {
  return output.width > source.width || output.height > source.height;
}

export function estimateResizedBytes(inputBytes: number, source: ResizeDimensions, output: ResizeDimensions): number {
  if (!Number.isFinite(inputBytes) || inputBytes <= 0) return 0;
  const pixelRatio = (output.width * output.height) / (source.width * source.height);
  return Math.max(1, Math.round(inputBytes * Math.min(4, Math.max(0.05, pixelRatio))));
}

function assertDimensions(value: ResizeDimensions): void {
  positiveInteger(value.width, "가로");
  positiveInteger(value.height, "세로");
}

function positiveInteger(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${label} 크기는 1px 이상이어야 합니다.`);
  return Math.max(1, Math.round(value));
}
