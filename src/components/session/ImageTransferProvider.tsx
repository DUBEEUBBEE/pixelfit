"use client";

import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from "react";

export type ImageTransfer = {
  id: string;
  sourceToolId: string;
  targetToolId: string;
  file: File;
};

type ImageTransferContextValue = {
  offerTransfer: (sourceToolId: string, targetToolId: string, asset: File | Blob, filename: string) => void;
  claimTransfer: (targetToolId: string) => File | null;
  clearTransfer: () => void;
};

const ImageTransferContext = createContext<ImageTransferContextValue | null>(null);

export function ImageTransferProvider({ children }: { children: ReactNode }) {
  const transferRef = useRef<ImageTransfer | null>(null);

  const offerTransfer = useCallback((sourceToolId: string, targetToolId: string, asset: File | Blob, filename: string) => {
    const file = asset instanceof File ? asset : new File([asset], filename, { type: asset.type, lastModified: Date.now() });
    transferRef.current = { id: `${sourceToolId}:${targetToolId}:${file.lastModified}`, sourceToolId, targetToolId, file };
  }, []);

  const claimTransfer = useCallback((targetToolId: string) => {
    const transfer = transferRef.current;
    if (!transfer || transfer.targetToolId !== targetToolId) return null;
    transferRef.current = null;
    return transfer.file;
  }, []);

  const clearTransfer = useCallback(() => { transferRef.current = null; }, []);
  const value = useMemo(() => ({ offerTransfer, claimTransfer, clearTransfer }), [claimTransfer, clearTransfer, offerTransfer]);
  return <ImageTransferContext.Provider value={value}>{children}</ImageTransferContext.Provider>;
}

export function useImageTransfer(): ImageTransferContextValue {
  const value = useContext(ImageTransferContext);
  if (!value) throw new Error("ImageTransferProvider 안에서만 사진 전달을 사용할 수 있습니다.");
  return value;
}
