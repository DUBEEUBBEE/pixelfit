"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { validateImageFile } from "@/lib/files/validation";
import { decodeImage, type DecodedImage } from "@/lib/image/decode";
import type { ImageOutputFormat } from "@/lib/image/encode";
import { createBoundedPreviewBlob } from "@/lib/image/preview";

export type UtilityImageAsset = {
  file: File;
  bytes: Uint8Array;
  format: ImageOutputFormat;
  decoded: DecodedImage;
  previewUrl: string;
};

export function useUtilityImage() {
  const [asset, setAsset] = useState<UtilityImageAsset | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const assetRef = useRef<UtilityImageAsset | null>(null);
  const taskRef = useRef(0);

  const dispose = useCallback((target: UtilityImageAsset | null) => {
    if (!target) return;
    target.decoded.close();
    URL.revokeObjectURL(target.previewUrl);
  }, []);

  const reset = useCallback(() => {
    taskRef.current += 1;
    dispose(assetRef.current);
    assetRef.current = null;
    setAsset(null);
    setBusy(false);
    setError(null);
  }, [dispose]);

  useEffect(() => () => {
    taskRef.current += 1;
    dispose(assetRef.current);
    assetRef.current = null;
  }, [dispose]);

  const choose = useCallback(async (file: File): Promise<UtilityImageAsset | null> => {
    const task = ++taskRef.current;
    setBusy(true);
    setError(null);
    let decoded: DecodedImage | null = null;
    let previewUrl: string | null = null;
    try {
      const validated = await validateImageFile(file);
      decoded = await decodeImage(file);
      const previewBlob = await createBoundedPreviewBlob(decoded.source, { width: decoded.width, height: decoded.height });
      if (task !== taskRef.current) {
        decoded.close();
        return null;
      }
      previewUrl = URL.createObjectURL(previewBlob);
      const next: UtilityImageAsset = {
        file,
        bytes: validated.bytes,
        format: validated.type,
        decoded,
        previewUrl,
      };
      dispose(assetRef.current);
      assetRef.current = next;
      setAsset(next);
      decoded = null;
      previewUrl = null;
      return next;
    } catch (caught) {
      decoded?.close();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (task === taskRef.current) {
        setError(caught instanceof Error ? caught.message : "이미지를 열 수 없습니다.");
      }
      return null;
    } finally {
      if (task === taskRef.current) setBusy(false);
    }
  }, [dispose]);

  return { asset, busy, error, setError, choose, reset };
}

export type UtilityResult = {
  blob: Blob;
  url: string;
  filename: string;
  width: number;
  height: number;
  format: ImageOutputFormat;
  warnings: string[];
  facts: Array<{ label: string; value: string }>;
};

export function useUtilityResult() {
  const [result, setResultState] = useState<UtilityResult | null>(null);
  const resultRef = useRef<UtilityResult | null>(null);

  const clearResult = useCallback(() => {
    if (resultRef.current) URL.revokeObjectURL(resultRef.current.url);
    resultRef.current = null;
    setResultState(null);
  }, []);

  const setResult = useCallback((value: Omit<UtilityResult, "url">) => {
    if (resultRef.current) URL.revokeObjectURL(resultRef.current.url);
    const next = { ...value, url: URL.createObjectURL(value.blob) };
    resultRef.current = next;
    setResultState(next);
  }, []);

  useEffect(() => () => {
    if (resultRef.current) URL.revokeObjectURL(resultRef.current.url);
    resultRef.current = null;
  }, []);

  return { result, setResult, clearResult };
}

export function useUtilityProcessor() {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => () => {
    mountedRef.current = false;
    controllerRef.current?.abort();
  }, []);

  const cancel = useCallback(() => controllerRef.current?.abort(), []);
  const run = useCallback(async <T,>(task: (signal: AbortSignal, onProgress: (value: number) => void) => Promise<T>): Promise<T | null> => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setBusy(true);
    setProgress(3);
    setError(null);
    try {
      const value = await task(controller.signal, (next) => {
        if (mountedRef.current && !controller.signal.aborted) setProgress(Math.max(0, Math.min(100, Math.round(next))));
      });
      if (!mountedRef.current || controller.signal.aborted || controllerRef.current !== controller) return null;
      return value;
    } catch (caught) {
      if (!(caught instanceof DOMException && caught.name === "AbortError") && mountedRef.current) {
        setError(caught instanceof Error ? caught.message : "이미지를 처리할 수 없습니다.");
      }
      return null;
    } finally {
      if (mountedRef.current && controllerRef.current === controller) {
        setBusy(false);
        controllerRef.current = null;
      }
    }
  }, []);

  return { busy, progress, error, setError, run, cancel };
}
