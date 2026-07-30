import type { InstagramProfileLayout } from "./types";

export const INSTAGRAM_PROFILE_SIZE = 1080;

export const INSTAGRAM_PROFILE_DEFAULTS = {
  circleScale: 0.84,
  photoScale: 0.8,
  borderWidth: 32,
  borderColor: "#ff725e",
  canvasColor: "#f7f4ee",
  innerColor: "#ffffff",
  offsetX: 0,
  offsetY: 0,
} as const;

export function calculateInstagramProfileLayout(
  source: { width: number; height: number },
  options: {
    circleScale: number;
    photoScale: number;
    borderWidth: number;
    offsetX: number;
    offsetY: number;
  },
): InstagramProfileLayout {
  if (!Number.isFinite(source.width) || !Number.isFinite(source.height) || source.width <= 0 || source.height <= 0) {
    throw new Error("원본 사진 크기가 올바르지 않습니다.");
  }

  const circleScale = clamp(options.circleScale, 0.64, 0.94);
  const photoScale = clamp(options.photoScale, 0.5, 1);
  const outerRadius = INSTAGRAM_PROFILE_SIZE * circleScale / 2;
  const borderWidth = clamp(options.borderWidth, 0, Math.min(120, outerRadius * 0.3));
  const innerRadius = Math.max(1, outerRadius - borderWidth);
  const containScale = Math.min((innerRadius * 2) / source.width, (innerRadius * 2) / source.height) * photoScale;
  const imageWidth = source.width * containScale;
  const imageHeight = source.height * containScale;
  const travelX = Math.max(0, innerRadius - imageWidth / 2);
  const travelY = Math.max(0, innerRadius - imageHeight / 2);
  const center = INSTAGRAM_PROFILE_SIZE / 2;
  const imageCenterX = center + clamp(options.offsetX, -1, 1) * travelX;
  const imageCenterY = center + clamp(options.offsetY, -1, 1) * travelY;

  return {
    center,
    outerRadius,
    innerRadius,
    borderWidth,
    imageX: imageCenterX - imageWidth / 2,
    imageY: imageCenterY - imageHeight / 2,
    imageWidth,
    imageHeight,
  };
}

function clamp(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.max(minimum, Math.min(maximum, value));
}
