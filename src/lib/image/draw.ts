import { calculateContainScale, calculateCoverTransform, type CropTransform } from "./geometry";

export type RenderContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export type DrawOptions = {
  outputWidth: number;
  outputHeight: number;
  sourceWidth: number;
  sourceHeight: number;
  transform: CropTransform;
  mode: "photo" | "banner";
  variant?: string;
};

export function drawImageComposition(context: RenderContext, image: CanvasImageSource, options: DrawOptions): void {
  context.save();
  context.clearRect(0, 0, options.outputWidth, options.outputHeight);
  context.fillStyle = options.mode === "banner" ? "#14213d" : "#f4f1eb";
  context.fillRect(0, 0, options.outputWidth, options.outputHeight);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  if (options.mode === "banner") drawBanner(context, image, options);
  else drawCover(context, image, options);
  context.restore();
}

function drawCover(context: RenderContext, image: CanvasImageSource, options: DrawOptions): void {
  const draw = calculateCoverTransform(
    options.sourceWidth,
    options.sourceHeight,
    options.outputWidth,
    options.outputHeight,
    options.transform,
  );
  context.translate(draw.centerX, draw.centerY);
  context.rotate(draw.rotationRadians);
  context.scale(draw.scale, draw.scale);
  context.drawImage(image, -options.sourceWidth / 2, -options.sourceHeight / 2, options.sourceWidth, options.sourceHeight);
}

function drawBanner(context: RenderContext, image: CanvasImageSource, options: DrawOptions): void {
  const variant = options.variant ?? "blur";
  if (variant !== "fit") {
    const cover = calculateCoverTransform(
      options.sourceWidth,
      options.sourceHeight,
      options.outputWidth,
      options.outputHeight,
      { ...options.transform, zoom: Math.max(1, options.transform.zoom) },
    );
    context.save();
    context.filter = `blur(${Math.max(18, Math.round(options.outputWidth / 80))}px) saturate(.88)`;
    context.globalAlpha = 0.72;
    context.translate(cover.centerX, cover.centerY);
    context.rotate(cover.rotationRadians);
    context.scale(cover.scale * 1.08, cover.scale * 1.08);
    context.drawImage(image, -options.sourceWidth / 2, -options.sourceHeight / 2, options.sourceWidth, options.sourceHeight);
    context.restore();
    context.fillStyle = "rgba(6, 13, 30, .18)";
    context.fillRect(0, 0, options.outputWidth, options.outputHeight);
  }

  const baseScale = calculateContainScale(options.sourceWidth, options.sourceHeight, options.outputWidth * 0.82, options.outputHeight * 0.82);
  const scale = baseScale * Math.max(0.8, Math.min(2.2, options.transform.zoom));
  const placement = variant === "left" ? 0.3 : variant === "right" ? 0.7 : 0.5;
  const freeX = Math.max(0, options.outputWidth - options.sourceWidth * scale);
  const centerX = freeX * placement + (options.sourceWidth * scale) / 2 + options.transform.offsetX * freeX * 0.35;
  const centerY = options.outputHeight / 2 + options.transform.offsetY * options.outputHeight * 0.2;
  context.save();
  context.translate(centerX, centerY);
  context.rotate((options.transform.rotation * Math.PI) / 180);
  context.scale(scale, scale);
  context.drawImage(image, -options.sourceWidth / 2, -options.sourceHeight / 2, options.sourceWidth, options.sourceHeight);
  context.restore();
}

export function replaceEdgeBackground(context: RenderContext, width: number, height: number, color: string): void {
  const image = context.getImageData(0, 0, width, height);
  const data = image.data;
  const samples: Array<[number, number, number]> = [];
  const stride = Math.max(1, Math.round(Math.min(width, height) / 90));
  for (let x = 0; x < width; x += stride) {
    samples.push(pixel(data, width, x, 0), pixel(data, width, x, height - 1));
  }
  for (let y = 0; y < height; y += stride) {
    samples.push(pixel(data, width, 0, y), pixel(data, width, width - 1, y));
  }
  const background = medianRgb(samples);
  const fill = parseHex(color);
  for (let index = 0; index < data.length; index += 4) {
    const distance = Math.sqrt(
      (data[index] - background[0]) ** 2 +
      (data[index + 1] - background[1]) ** 2 +
      (data[index + 2] - background[2]) ** 2,
    );
    const subject = smoothstep(24, 74, distance);
    data[index] = Math.round(data[index] * subject + fill[0] * (1 - subject));
    data[index + 1] = Math.round(data[index + 1] * subject + fill[1] * (1 - subject));
    data[index + 2] = Math.round(data[index + 2] * subject + fill[2] * (1 - subject));
    data[index + 3] = 255;
  }
  context.putImageData(image, 0, 0);
}

function pixel(data: Uint8ClampedArray, width: number, x: number, y: number): [number, number, number] {
  const offset = (y * width + x) * 4;
  return [data[offset], data[offset + 1], data[offset + 2]];
}

function medianRgb(values: Array<[number, number, number]>): [number, number, number] {
  const channel = (position: number) => values.map((value) => value[position]).sort((a, b) => a - b)[Math.floor(values.length / 2)] ?? 255;
  return [channel(0), channel(1), channel(2)];
}

function parseHex(color: string): [number, number, number] {
  const normalized = /^#[0-9a-f]{6}$/i.test(color) ? color.slice(1) : "ffffff";
  return [Number.parseInt(normalized.slice(0, 2), 16), Number.parseInt(normalized.slice(2, 4), 16), Number.parseInt(normalized.slice(4, 6), 16)];
}

function smoothstep(start: number, end: number, value: number): number {
  const ratio = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return ratio * ratio * (3 - 2 * ratio);
}
