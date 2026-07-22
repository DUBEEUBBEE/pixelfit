import { validatePixelCount } from "@/lib/files/validation";

export type DecodedImage = {
  source: CanvasImageSource;
  width: number;
  height: number;
  close: () => void;
};

export async function decodeImage(file: Blob, maxPixels = 40_000_000): Promise<DecodedImage> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      validatePixelCount(bitmap.width, bitmap.height, maxPixels);
      return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
    } catch (error) {
      if (error instanceof Error && error.name === "ImageValidationError") throw error;
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.decoding = "async";
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("decode failed"));
      element.src = url;
    });
    validatePixelCount(image.naturalWidth, image.naturalHeight, maxPixels);
    return { source: image, width: image.naturalWidth, height: image.naturalHeight, close: () => URL.revokeObjectURL(url) };
  } catch {
    URL.revokeObjectURL(url);
    throw new Error("사진을 해석할 수 없습니다. 손상되지 않은 JPEG, PNG 또는 WebP 파일을 다시 선택해 주세요.");
  }
}
