export type CompressionResult = { blob: Blob; quality: number; reachedTarget: boolean; attempts: number };

export async function compressToTarget(
  encode: (quality: number) => Promise<Blob>,
  maxBytes: number,
  options: { minQuality?: number; maxQuality?: number; maxAttempts?: number } = {},
): Promise<CompressionResult> {
  const minQuality = options.minQuality ?? 0.52;
  const maxQuality = options.maxQuality ?? 0.94;
  const maxAttempts = options.maxAttempts ?? 8;
  let low = minQuality;
  let high = maxQuality;
  let best: { blob: Blob; quality: number } | null = null;
  let last = await encode(high);
  let attempts = 1;
  if (last.size <= maxBytes) return { blob: last, quality: high, reachedTarget: true, attempts };

  while (attempts < maxAttempts) {
    const quality = (low + high) / 2;
    last = await encode(quality);
    attempts += 1;
    if (last.size <= maxBytes) {
      best = { blob: last, quality };
      low = quality;
    } else {
      high = quality;
    }
  }
  if (best) return { ...best, reachedTarget: true, attempts };
  const minimum = await encode(minQuality);
  attempts += 1;
  return { blob: minimum, quality: minQuality, reachedTarget: minimum.size <= maxBytes, attempts };
}
