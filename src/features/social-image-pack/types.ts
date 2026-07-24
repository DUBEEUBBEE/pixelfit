import type { SocialOutputId } from "@/features/creative-tools/core";
import type { ImageOutputFormat } from "@/lib/image/encode";
import type { CropTransform } from "@/lib/image/geometry";

export type SocialCropMap = Record<SocialOutputId, CropTransform>;

export type SocialImageResult = {
  id: SocialOutputId;
  label: string;
  filename: string;
  blob: Blob;
  format: ImageOutputFormat;
  width: number;
  height: number;
};

export type SocialRenderOptions = {
  format: Extract<ImageOutputFormat, "jpeg" | "png">;
  quality?: number;
  backgroundColor?: string;
  signal?: AbortSignal;
};
