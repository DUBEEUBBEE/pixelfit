import type { ImageOutputFormat } from "@/lib/image/encode";

export type InstagramProfileFormat = Extract<ImageOutputFormat, "jpeg" | "png">;

export type InstagramProfileOptions = {
  circleScale: number;
  photoScale: number;
  borderWidth: number;
  borderColor: string;
  canvasColor: string;
  innerColor: string;
  offsetX: number;
  offsetY: number;
  format: InstagramProfileFormat;
  quality?: number;
  signal?: AbortSignal;
};

export type InstagramProfileLayout = {
  center: number;
  outerRadius: number;
  innerRadius: number;
  borderWidth: number;
  imageX: number;
  imageY: number;
  imageWidth: number;
  imageHeight: number;
};

export type InstagramProfileResult = {
  blob: Blob;
  filename: string;
  format: InstagramProfileFormat;
  width: number;
  height: number;
  layout: InstagramProfileLayout;
};
