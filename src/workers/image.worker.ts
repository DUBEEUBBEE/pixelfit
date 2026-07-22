/// <reference lib="webworker" />

import { compressToTarget } from "@/lib/image/compression";
import { drawImageComposition, replaceEdgeBackground } from "@/lib/image/draw";
import type { CropTransform } from "@/lib/image/geometry";

type Request = {
  file: File;
  width: number;
  height: number;
  maxBytes?: number;
  mode: "photo" | "banner";
  transform: CropTransform;
  variant?: string;
  background: string | null;
  format: "jpeg" | "png";
};

self.onmessage = async (event: MessageEvent<Request>) => {
  try {
    const request = event.data;
    const bitmap = await createImageBitmap(request.file, { imageOrientation: "from-image" });
    postMessage({ type: "progress", value: 35 });
    const canvas = new OffscreenCanvas(request.width, request.height);
    const context = canvas.getContext("2d", { alpha: request.format === "png" });
    if (!context) throw new Error("OffscreenCanvas를 만들 수 없습니다.");
    drawImageComposition(context, bitmap, {
      outputWidth: request.width,
      outputHeight: request.height,
      sourceWidth: bitmap.width,
      sourceHeight: bitmap.height,
      transform: request.transform,
      mode: request.mode,
      variant: request.variant,
    });
    if (request.background) replaceEdgeBackground(context, request.width, request.height, request.background);
    bitmap.close();
    postMessage({ type: "progress", value: 70 });
    const mime = request.format === "jpeg" ? "image/jpeg" : "image/png";
    let blob: Blob;
    if (request.format === "jpeg" && request.maxBytes) {
      const result = await compressToTarget((quality) => canvas.convertToBlob({ type: mime, quality }), request.maxBytes);
      blob = result.blob;
    } else {
      blob = await canvas.convertToBlob({ type: mime, quality: request.format === "jpeg" ? 0.92 : undefined });
    }
    postMessage({ type: "progress", value: 100 });
    postMessage({ type: "done", blob });
  } catch (error) {
    postMessage({ type: "error", message: error instanceof Error ? error.message : "이미지 처리에 실패했습니다." });
  }
};

export {};
