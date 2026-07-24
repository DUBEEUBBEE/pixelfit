import type { ImageOutputFormat } from "@/lib/image/encode";
import type { CropTransform } from "@/lib/image/geometry";
import type { ResizeDimensions } from "@/lib/image/resize";

export type FourCutOrientation = "vertical" | "horizontal";
export type FourCutTone = "original" | "mono" | "vintage";

export type FourCutSource = {
  source?: CanvasImageSource;
  dimensions: ResizeDimensions;
  /** Original local file used only for the worker path; never uploaded or persisted. */
  file?: Blob;
};

export type FourCutOptions = {
  orientation: FourCutOrientation;
  tone: FourCutTone;
  frameColor: string;
  dateText: string;
  caption: string;
  order: number[];
  crops: CropTransform[];
  format: Extract<ImageOutputFormat, "jpeg" | "png">;
  quality?: number;
  signal?: AbortSignal;
  onProgress?: (value: number) => void;
};

export type FourCutResult = {
  blob: Blob;
  filename: string;
  format: "jpeg" | "png";
  width: number;
  height: number;
};
