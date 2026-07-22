export type ImageHeuristics = {
  brightness: number;
  contrast: number;
  sharpness: number;
  edgeUniformity: number;
};

export function analyzeCanvas(context: CanvasRenderingContext2D, width: number, height: number): ImageHeuristics {
  const sampleWidth = Math.min(width, 160);
  const sampleHeight = Math.min(height, 160);
  const scratch = document.createElement("canvas");
  scratch.width = sampleWidth;
  scratch.height = sampleHeight;
  const sampleContext = scratch.getContext("2d", { willReadFrequently: true });
  if (!sampleContext) return { brightness: 0.5, contrast: 0, sharpness: 0, edgeUniformity: 0 };
  sampleContext.drawImage(context.canvas, 0, 0, width, height, 0, 0, sampleWidth, sampleHeight);
  const pixels = sampleContext.getImageData(0, 0, sampleWidth, sampleHeight).data;
  const luminance = new Float32Array(sampleWidth * sampleHeight);
  let total = 0;
  for (let index = 0, pixel = 0; index < pixels.length; index += 4, pixel += 1) {
    const value = (0.2126 * pixels[index] + 0.7152 * pixels[index + 1] + 0.0722 * pixels[index + 2]) / 255;
    luminance[pixel] = value;
    total += value;
  }
  const brightness = total / luminance.length;
  let variance = 0;
  let laplacian = 0;
  let laplacianCount = 0;
  for (let y = 1; y < sampleHeight - 1; y += 1) {
    for (let x = 1; x < sampleWidth - 1; x += 1) {
      const index = y * sampleWidth + x;
      variance += (luminance[index] - brightness) ** 2;
      laplacian += Math.abs(4 * luminance[index] - luminance[index - 1] - luminance[index + 1] - luminance[index - sampleWidth] - luminance[index + sampleWidth]);
      laplacianCount += 1;
    }
  }
  const edgeValues: number[] = [];
  for (let x = 0; x < sampleWidth; x += 3) edgeValues.push(luminance[x], luminance[(sampleHeight - 1) * sampleWidth + x]);
  for (let y = 0; y < sampleHeight; y += 3) edgeValues.push(luminance[y * sampleWidth], luminance[y * sampleWidth + sampleWidth - 1]);
  const edgeMean = edgeValues.reduce((sum, value) => sum + value, 0) / edgeValues.length;
  const edgeVariance = edgeValues.reduce((sum, value) => sum + (value - edgeMean) ** 2, 0) / edgeValues.length;
  return {
    brightness,
    contrast: Math.sqrt(variance / Math.max(1, laplacianCount)),
    sharpness: laplacian / Math.max(1, laplacianCount),
    edgeUniformity: Math.max(0, 1 - Math.sqrt(edgeVariance) * 4),
  };
}
