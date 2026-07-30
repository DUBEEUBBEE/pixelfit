import type { FilmOptions } from "@/features/creative-tools/core";
import type { SocialOutputId } from "@/features/creative-tools/core";
import type { FourCutOrientation, FourCutTone } from "@/features/four-cut-photo/types";
import type { ThumbnailTemplateId, ThumbnailTextAlign } from "@/features/youtube-thumbnail/types";
import type { CropTransform } from "@/lib/image/geometry";
import type { ImageOutputFormat } from "@/lib/image/encode";
import type { ResizeFit } from "@/lib/image/resize";

export type CreativeWorkerFormat = ImageOutputFormat;

export type FilmWorkerRequest = {
  kind: "film";
  file: Blob;
  sourceWidth: number;
  sourceHeight: number;
  outputWidth: number;
  outputHeight: number;
  effects: FilmOptions;
  dateText: string;
  format: "jpeg" | "png";
  quality?: number;
  seed: number;
};

export type FourCutWorkerRequest = {
  kind: "four-cut";
  files: Blob[];
  sourceDimensions: Array<{ width: number; height: number }>;
  orientation: FourCutOrientation;
  tone: FourCutTone;
  frameColor: string;
  dateText: string;
  caption: string;
  order: number[];
  crops: CropTransform[];
  format: "jpeg" | "png";
  quality?: number;
};

export type CompressionWorkerRequest = {
  kind: "compress";
  file: Blob;
  sourceWidth: number;
  sourceHeight: number;
  format: ImageOutputFormat;
  targetBytes: number;
  allowDownscale: boolean;
  backgroundColor?: string;
  minQuality?: number;
  maxQuality?: number;
  maxQualityAttempts?: number;
  maxDownscaleSteps?: number;
};

export type ResizeWorkerRequest = {
  kind: "resize";
  file: Blob;
  sourceWidth: number;
  sourceHeight: number;
  output: { width: number; height: number };
  fit: ResizeFit;
  format: ImageOutputFormat;
  quality?: number;
  backgroundColor?: string;
};

export type ConvertWorkerRequest = {
  kind: "convert";
  file: Blob;
  sourceWidth: number;
  sourceHeight: number;
  inputFormat: ImageOutputFormat;
  outputFormat: ImageOutputFormat;
  quality?: number;
  backgroundColor?: string;
  metadataPolicy: "remove" | "preserve-exact";
};

export type SocialWorkerRequest = {
  kind: "social";
  file: Blob;
  sourceWidth: number;
  sourceHeight: number;
  outputId: SocialOutputId;
  crop: CropTransform;
  format: "jpeg" | "png";
  quality?: number;
};

export type ThumbnailWorkerRequest = {
  kind: "thumbnail";
  file: Blob;
  sourceWidth: number;
  sourceHeight: number;
  template: ThumbnailTemplateId;
  title: string;
  subtitle: string;
  crop: CropTransform;
  titleSize: number;
  accentColor: string;
  align: ThumbnailTextAlign;
  format: "jpeg" | "png";
  quality?: number;
};

export type CreativeWorkerRequest =
  | FilmWorkerRequest
  | FourCutWorkerRequest
  | CompressionWorkerRequest
  | ResizeWorkerRequest
  | ConvertWorkerRequest;

export type CreativeWorkerMessageRequest =
  | CreativeWorkerRequest
  | SocialWorkerRequest
  | ThumbnailWorkerRequest;

export type WorkerResultDetails =
  | { kind: "compress"; quality?: number; attempts: number; downscaleSteps: number; reachedTarget: boolean; warnings: string[] }
  | { kind: "resize" }
  | { kind: "convert"; metadataPolicy: "remove" | "preserve-exact"; metadataRemoved: boolean; metadataPreservedExactly: boolean; warnings: string[] }
  | { kind: "social"; outputId: SocialOutputId }
  | { kind: "thumbnail"; titleLines: string[]; subtitleLines: string[] };

export type CreativeWorkerResponse =
  | { type: "progress"; value: number }
  | { type: "done"; blob: Blob; width: number; height: number; format: CreativeWorkerFormat; details?: WorkerResultDetails }
  | { type: "error"; message: string; code?: "UNSUPPORTED" };

export type CreativeWorkerResult = Extract<CreativeWorkerResponse, { type: "done" }>;
export type CreativeWorkerDonePayload = Omit<CreativeWorkerResult, "type">;
