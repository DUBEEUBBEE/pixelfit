import type { ImageOutputFormat } from "@/lib/image/encode";

export type TargetSizeUnit = "KB" | "MB";

export type ImageCompressionOptions = {
  /** Original local file used only for the worker path; never uploaded or persisted. */
  sourceFile?: Blob;
  format: ImageOutputFormat;
  targetBytes: number;
  allowDownscale: boolean;
  backgroundColor?: string;
  minQuality?: number;
  maxQuality?: number;
  maxQualityAttempts?: number;
  maxDownscaleSteps?: number;
  signal?: AbortSignal;
  onProgress?: (value: number) => void;
};

export type ImageCompressionResult = {
  blob: Blob;
  format: ImageOutputFormat;
  width: number;
  height: number;
  quality?: number;
  attempts: number;
  downscaleSteps: number;
  reachedTarget: boolean;
  warnings: string[];
};
