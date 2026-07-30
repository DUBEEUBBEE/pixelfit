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
  /** Original local file used only for the worker path; never uploaded or persisted. */
  sourceFile?: Blob;
  format: Extract<ImageOutputFormat, "jpeg" | "png">;
  quality?: number;
  backgroundColor?: string;
  signal?: AbortSignal;
};
