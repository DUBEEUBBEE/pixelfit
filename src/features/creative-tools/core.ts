export type SocialOutputId = "square" | "portrait" | "story";

export const socialOutputSpecs: Record<SocialOutputId, { label: string; width: number; height: number; note: string }> = {
  square: { label: "정사각형 1:1", width: 1080, height: 1080, note: "피드와 프로필 원형 예상" },
  portrait: { label: "세로 게시물 4:5", width: 1080, height: 1350, note: "세로 피드용 서비스 권장값" },
  story: { label: "스토리·릴스 9:16", width: 1080, height: 1920, note: "상하 UI 영역을 피해 배치" },
};

export type FrameRect = { x: number; y: number; width: number; height: number };

export function layoutFourCut(orientation: "vertical" | "horizontal", width: number, height: number, frame: number, gap: number): FrameRect[] {
  if (width <= 0 || height <= 0 || frame < 0 || gap < 0) throw new Error("네컷 레이아웃 값이 올바르지 않습니다.");
  const columns = orientation === "vertical" ? 1 : 4;
  const rows = orientation === "vertical" ? 4 : 1;
  const availableWidth = width - frame * 2 - gap * (columns - 1);
  const availableHeight = height - frame * 2 - gap * (rows - 1);
  if (availableWidth <= 0 || availableHeight <= 0) throw new Error("프레임과 간격이 캔버스보다 큽니다.");
  const cellWidth = availableWidth / columns;
  const cellHeight = availableHeight / rows;
  return Array.from({ length: 4 }, (_, index) => ({
    x: frame + (index % columns) * (cellWidth + gap),
    y: frame + Math.floor(index / columns) * (cellHeight + gap),
    width: cellWidth,
    height: cellHeight,
  }));
}

export function mapFourCutSources(sourceCount: number): number[] {
  if (!Number.isInteger(sourceCount) || sourceCount < 1 || sourceCount > 4) throw new Error("사진은 1~4장이어야 합니다.");
  return Array.from({ length: 4 }, (_, index) => index % sourceCount);
}

export type FilmOptions = {
  mode: "color" | "mono" | "low-saturation" | "flash";
  strength: number;
  grain: number;
  vignette: number;
  lightLeak: number;
};

export function applyFilmEffects(input: ImageData, options: FilmOptions, seed = 73421): ImageData {
  const output = new ImageData(new Uint8ClampedArray(input.data), input.width, input.height);
  const data = output.data;
  const strength = clamp01(options.strength);
  const grain = clamp01(options.grain) * strength;
  const vignette = clamp01(options.vignette) * strength;
  const leak = clamp01(options.lightLeak) * strength;
  let state = seed >>> 0 || 1;
  const random = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4_294_967_295;
  };
  for (let y = 0; y < input.height; y += 1) {
    for (let x = 0; x < input.width; x += 1) {
      const index = (y * input.width + x) * 4;
      let red = data[index];
      let green = data[index + 1];
      let blue = data[index + 2];
      const luminance = red * .299 + green * .587 + blue * .114;
      if (options.mode === "mono") {
        red += (luminance - red) * strength;
        green += (luminance - green) * strength;
        blue += (luminance - blue) * strength;
      } else if (options.mode === "low-saturation") {
        const amount = strength * .58;
        red = red * (1 - amount) + luminance * amount + 7 * strength;
        green = green * (1 - amount) + luminance * amount + 3 * strength;
        blue = blue * (1 - amount) + luminance * amount - 4 * strength;
      } else if (options.mode === "flash") {
        red += 34 * strength;
        green += 28 * strength;
        blue += 22 * strength;
      } else {
        red += 7 * strength;
        green += 2 * strength;
        blue -= 4 * strength;
      }
      const normalizedX = (x / Math.max(1, input.width - 1)) * 2 - 1;
      const normalizedY = (y / Math.max(1, input.height - 1)) * 2 - 1;
      const edge = Math.min(1, Math.sqrt(normalizedX ** 2 + normalizedY ** 2));
      const shade = 1 - edge ** 1.65 * vignette * .62;
      red *= shade;
      green *= shade;
      blue *= shade;
      const leakDistance = Math.sqrt((x / input.width - .92) ** 2 + (y / input.height - .14) ** 2);
      const leakAmount = Math.max(0, 1 - leakDistance * 2.1) * leak;
      red += 92 * leakAmount;
      green += 35 * leakAmount;
      blue += 12 * leakAmount;
      const noise = (random() - .5) * 44 * grain;
      data[index] = clampByte(red + noise);
      data[index + 1] = clampByte(green + noise * .88);
      data[index + 2] = clampByte(blue + noise * .75);
    }
  }
  return output;
}

export function applyFourCutTone(data: Uint8ClampedArray, tone: "mono" | "vintage"): Uint8ClampedArray {
  for (let index = 0; index < data.length; index += 4) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    if (tone === "mono") {
      const luminance = Math.round(red * .299 + green * .587 + blue * .114);
      data[index] = luminance;
      data[index + 1] = luminance;
      data[index + 2] = luminance;
    } else {
      data[index] = clampByte(red * 1.04 + 13);
      data[index + 1] = clampByte(green * .94 + 8);
      data[index + 2] = clampByte(blue * .78 + 3);
    }
  }
  return data;
}

export function wrapCanvasText(text: string, maxWidth: number, measure: (value: string) => number, maxLines = 2): string[] {
  const normalized = text.trim().replace(/\s+/g, " ");
  if (!normalized) return [];
  const units = normalized.includes(" ") ? normalized.split(" ") : Array.from(normalized);
  const separator = normalized.includes(" ") ? " " : "";
  const lines: string[] = [];
  let line = "";
  for (const unit of units) {
    const candidate = line ? `${line}${separator}${unit}` : unit;
    if (measure(candidate) <= maxWidth || !line) line = candidate;
    else {
      lines.push(line);
      line = unit;
      if (lines.length === maxLines) break;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  const consumed = lines.join(separator).replace(/…$/, "").length;
  if (consumed < normalized.length && lines.length > 0) {
    let last = lines[lines.length - 1];
    while (last.length > 1 && measure(`${last}…`) > maxWidth) last = last.slice(0, -1);
    lines[lines.length - 1] = `${last}…`;
  }
  return lines.slice(0, maxLines);
}

function clamp01(value: number): number { return Math.max(0, Math.min(1, value)); }
function clampByte(value: number): number { return Math.max(0, Math.min(255, Math.round(value))); }
