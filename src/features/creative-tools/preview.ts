import { calculateCoverTransform, type CropTransform } from "@/lib/image/geometry";
import type { ResizeDimensions } from "@/lib/image/resize";

export type CropPreviewLayout = {
  leftPercent: number;
  topPercent: number;
  widthPercent: number;
  heightPercent: number;
  rotationDegrees: CropTransform["rotation"];
};

export function calculateCropPreviewLayout(
  source: ResizeDimensions,
  output: ResizeDimensions,
  crop: CropTransform,
): CropPreviewLayout {
  const draw = calculateCoverTransform(source.width, source.height, output.width, output.height, crop);
  return {
    leftPercent: (draw.centerX / output.width) * 100,
    topPercent: (draw.centerY / output.height) * 100,
    widthPercent: ((source.width * draw.scale) / output.width) * 100,
    heightPercent: ((source.height * draw.scale) / output.height) * 100,
    rotationDegrees: crop.rotation,
  };
}
