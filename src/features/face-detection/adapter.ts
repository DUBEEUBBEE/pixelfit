import { decodeImage } from "@/lib/image/decode";

export type FaceBox = { x: number; y: number; width: number; height: number; confidence?: number };
export type FaceDetectionResult = {
  status: "available" | "unsupported" | "failed";
  faces: FaceBox[];
  message: string;
};

type NativeFaceDetector = {
  detect(source: CanvasImageSource): Promise<Array<{ boundingBox: DOMRectReadOnly; confidence?: number }>>;
};
type NativeFaceDetectorConstructor = new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => NativeFaceDetector;

export async function detectFaces(file: File, signal?: AbortSignal): Promise<FaceDetectionResult> {
  const constructor = (globalThis as typeof globalThis & { FaceDetector?: NativeFaceDetectorConstructor }).FaceDetector;
  if (!constructor) {
    return { status: "unsupported", faces: [], message: "이 브라우저는 기기 내 얼굴 감지를 지원하지 않습니다. 직접 위치를 맞출 수 있습니다." };
  }
  const decoded = await decodeImage(file);
  try {
    if (signal?.aborted) throw new DOMException("감지가 취소되었습니다.", "AbortError");
    const detector = new constructor({ fastMode: true, maxDetectedFaces: 4 });
    const faces = await detector.detect(decoded.source);
    if (signal?.aborted) throw new DOMException("감지가 취소되었습니다.", "AbortError");
    return {
      status: "available",
      faces: faces.map(({ boundingBox, confidence }) => ({
        x: boundingBox.x,
        y: boundingBox.y,
        width: boundingBox.width,
        height: boundingBox.height,
        confidence,
      })),
      message: faces.length === 0 ? "자동으로 얼굴을 찾지 못했습니다. 직접 위치를 맞출 수 있습니다." : `${faces.length}개의 얼굴 후보를 기기에서 찾았습니다.`,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    return { status: "failed", faces: [], message: "자동 얼굴 맞춤을 사용할 수 없습니다. 직접 위치를 맞춰 계속할 수 있습니다." };
  } finally {
    decoded.close();
  }
}

export function suggestTransformFromFace(
  face: FaceBox,
  imageWidth: number,
  imageHeight: number,
): { offsetX: number; offsetY: number; zoom: number } {
  const faceCenterX = face.x + face.width / 2;
  const faceCenterY = face.y + face.height / 2;
  return {
    offsetX: Math.max(-1, Math.min(1, (imageWidth / 2 - faceCenterX) / (imageWidth / 2))),
    offsetY: Math.max(-1, Math.min(1, (imageHeight * 0.46 - faceCenterY) / (imageHeight / 2))),
    zoom: Math.max(1, Math.min(2.4, imageHeight / Math.max(face.height * 2.45, 1))),
  };
}
