import type { ImageOutputFormat } from "@/lib/image/encode";
import type { CropTransform } from "@/lib/image/geometry";

export type ThumbnailTemplateId = "editorial-left" | "editorial-right" | "center-impact" | "lower-third";
export type ThumbnailTextAlign = "left" | "center" | "right";

export type YoutubeThumbnailOptions = {
  template: ThumbnailTemplateId;
  title: string;
  subtitle: string;
  crop: CropTransform;
  titleSize: number;
  accentColor: string;
  align: ThumbnailTextAlign;
  format: Extract<ImageOutputFormat, "jpeg" | "png">;
  quality?: number;
  signal?: AbortSignal;
};

export type YoutubeThumbnailResult = {
  blob: Blob;
  filename: string;
  format: "jpeg" | "png";
  width: 3840;
  height: 2160;
  titleLines: string[];
  subtitleLines: string[];
};
