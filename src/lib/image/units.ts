export function cmToPixels(cm: number, dpi: number): number {
  if (!Number.isFinite(cm) || cm <= 0 || !Number.isFinite(dpi) || dpi <= 0) {
    throw new RangeError("cm와 dpi는 0보다 큰 유한한 값이어야 합니다.");
  }
  return Math.round((cm / 2.54) * dpi);
}
