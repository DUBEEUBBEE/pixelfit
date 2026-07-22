export type CropTransform = {
  zoom: number;
  offsetX: number;
  offsetY: number;
  rotation: 0 | 90 | 180 | 270;
};

export type DrawTransform = {
  scale: number;
  centerX: number;
  centerY: number;
  renderedWidth: number;
  renderedHeight: number;
  maxOffsetX: number;
  maxOffsetY: number;
  rotationRadians: number;
};

export const defaultCropTransform: CropTransform = { zoom: 1, offsetX: 0, offsetY: 0, rotation: 0 };

export function calculateCoverTransform(
  sourceWidth: number,
  sourceHeight: number,
  outputWidth: number,
  outputHeight: number,
  transform: CropTransform,
): DrawTransform {
  const rotated = transform.rotation === 90 || transform.rotation === 270;
  const visualWidth = rotated ? sourceHeight : sourceWidth;
  const visualHeight = rotated ? sourceWidth : sourceHeight;
  const zoom = clamp(transform.zoom, 1, 3);
  const scale = Math.max(outputWidth / visualWidth, outputHeight / visualHeight) * zoom;
  const renderedWidth = visualWidth * scale;
  const renderedHeight = visualHeight * scale;
  const maxOffsetX = Math.max(0, (renderedWidth - outputWidth) / 2);
  const maxOffsetY = Math.max(0, (renderedHeight - outputHeight) / 2);
  return {
    scale,
    centerX: outputWidth / 2 + clamp(transform.offsetX, -1, 1) * maxOffsetX,
    centerY: outputHeight / 2 + clamp(transform.offsetY, -1, 1) * maxOffsetY,
    renderedWidth,
    renderedHeight,
    maxOffsetX,
    maxOffsetY,
    rotationRadians: (transform.rotation * Math.PI) / 180,
  };
}

export function calculateContainScale(sourceWidth: number, sourceHeight: number, outputWidth: number, outputHeight: number): number {
  return Math.min(outputWidth / sourceWidth, outputHeight / sourceHeight);
}

export function rotatePoint(x: number, y: number, width: number, height: number, rotation: CropTransform["rotation"]): { x: number; y: number } {
  if (rotation === 90) return { x: height - y, y: x };
  if (rotation === 180) return { x: width - x, y: height - y };
  if (rotation === 270) return { x: y, y: width - x };
  return { x, y };
}

export function scaleSafeArea(
  outputWidth: number,
  outputHeight: number,
  base = { width: 2048, height: 1152, safeWidth: 1235, safeHeight: 338 },
): { width: number; height: number; left: number; top: number } {
  const scale = Math.min(outputWidth / base.width, outputHeight / base.height);
  const width = Math.round(base.safeWidth * scale);
  const height = Math.round(base.safeHeight * scale);
  return { width, height, left: Math.round((outputWidth - width) / 2), top: Math.round((outputHeight - height) / 2) };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
