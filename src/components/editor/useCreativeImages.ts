"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { validateImageFile } from "@/lib/files/validation";
import { decodeImage } from "@/lib/image/decode";
import type { ImageOutputFormat } from "@/lib/image/encode";
import { createBoundedPreviewBlob } from "@/lib/image/preview";

export type CreativeImageAsset = {
  id: string;
  file: File;
  format: ImageOutputFormat;
  dimensions: { width: number; height: number };
  previewUrl: string;
};

export const MAX_CREATIVE_TOTAL_PIXELS = 60_000_000;

export function validateCreativeTotalPixels(current: number, next: { width: number; height: number }): number {
  const total = current + next.width * next.height;
  if (!Number.isSafeInteger(total) || total > MAX_CREATIVE_TOTAL_PIXELS) {
    throw new Error("선택한 사진의 합산 해상도가 너무 큽니다. 전체 6천만 픽셀 이하가 되도록 사진 수나 해상도를 줄여 주세요.");
  }
  return total;
}

export function useInitialCreativeFile(initialFile: File | undefined, onFile: (file: File) => void | Promise<void>) {
  const callbackRef = useRef(onFile);
  const handledRef = useRef<File | null>(null);
  const mountedRef = useRef(false);
  useEffect(() => { callbackRef.current = onFile; }, [onFile]);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);
  useEffect(() => {
    if (!initialFile || handledRef.current === initialFile) return;
    queueMicrotask(() => {
      if (!mountedRef.current || handledRef.current === initialFile) return;
      handledRef.current = initialFile;
      void callbackRef.current(initialFile);
    });
  }, [initialFile]);
}

export function useMultiCreativeImages() {
  const [assets, setAssets] = useState<CreativeImageAsset[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const assetsRef = useRef<CreativeImageAsset[]>([]);
  const taskRef = useRef(0);

  const dispose = useCallback((targets: readonly CreativeImageAsset[]) => {
    for (const target of targets) {
      URL.revokeObjectURL(target.previewUrl);
    }
  }, []);

  const reset = useCallback(() => {
    taskRef.current += 1;
    dispose(assetsRef.current);
    assetsRef.current = [];
    setAssets([]);
    setBusy(false);
    setError(null);
  }, [dispose]);

  useEffect(() => () => {
    taskRef.current += 1;
    dispose(assetsRef.current);
    assetsRef.current = [];
  }, [dispose]);

  const chooseFiles = useCallback(async (files: readonly File[]): Promise<CreativeImageAsset[] | null> => {
    const selected = files.slice(0, 4);
    if (selected.length === 0) { setError("사진을 1장 이상 선택해 주세요."); return null; }
    if (files.length > 4) { setError("네컷사진은 최대 4장까지 선택할 수 있습니다."); return null; }
    const totalBytes = selected.reduce((sum, file) => sum + file.size, 0);
    if (totalBytes > 60 * 1024 ** 2) { setError("선택한 사진의 전체 용량은 60MB 이하여야 합니다."); return null; }
    const task = ++taskRef.current;
    setBusy(true);
    setError(null);
    const next: CreativeImageAsset[] = [];
    let totalPixels = 0;
    try {
      for (let index = 0; index < selected.length; index += 1) {
        const file = selected[index];
        const validated = await validateImageFile(file);
        const decoded = await decodeImage(file);
        try {
          const dimensions = { width: decoded.width, height: decoded.height };
          totalPixels = validateCreativeTotalPixels(totalPixels, dimensions);
          const previewBlob = await createBoundedPreviewBlob(decoded.source, dimensions);
          if (task !== taskRef.current) { dispose(next); return null; }
          next.push({
            id: `${task}-${index}`,
            file,
            format: validated.type,
            dimensions,
            previewUrl: URL.createObjectURL(previewBlob),
          });
        } finally {
          decoded.close();
        }
      }
      dispose(assetsRef.current);
      assetsRef.current = next;
      setAssets(next);
      return next;
    } catch (caught) {
      dispose(next);
      if (task === taskRef.current) setError(caught instanceof Error ? caught.message : "사진을 열 수 없습니다.");
      return null;
    } finally {
      if (task === taskRef.current) setBusy(false);
    }
  }, [dispose]);

  return { assets, busy, error, setError, chooseFiles, reset };
}
