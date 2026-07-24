import type { FilmOptions } from "@/features/creative-tools/core";
import type { ImageOutputFormat } from "@/lib/image/encode";

export type FilmPhotoOptions = FilmOptions & {
  /** Original local file used only for the worker path; never uploaded or persisted. */
  sourceFile?: Blob;
  dateText: string;
  format: Extract<ImageOutputFormat, "jpeg" | "png">;
  quality?: number;
  seed?: number;
  signal?: AbortSignal;
  onProgress?: (value: number) => void;
};

export type FilmPhotoResult = {
  blob: Blob;
  filename: string;
  format: "jpeg" | "png";
  width: number;
  height: number;
  sourceDownscaled: boolean;
};
