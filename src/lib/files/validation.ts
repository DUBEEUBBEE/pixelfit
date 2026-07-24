import { detectImageType, typeFromMime, type SupportedImageType } from "./signatures";

export const MAX_IMAGE_EDGE = 16_384;

export class ImageValidationError extends Error {
  constructor(
    public readonly code: "empty" | "too-large" | "unsupported" | "mismatch" | "decode" | "too-many-pixels",
    message: string,
  ) {
    super(message);
    this.name = "ImageValidationError";
  }
}

export type ValidatedFile = { type: SupportedImageType; bytes: Uint8Array };

export async function validateImageFile(file: File, maxBytes = 25 * 1024 * 1024): Promise<ValidatedFile> {
  if (file.size === 0) throw new ImageValidationError("empty", "빈 파일입니다. JPEG, PNG 또는 WebP 사진을 다시 선택해 주세요.");
  if (file.size > maxBytes) throw new ImageValidationError("too-large", `파일이 너무 큽니다. ${formatBytes(maxBytes)} 이하 사진을 선택해 주세요.`);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectImageType(bytes);
  if (!type) throw new ImageValidationError("unsupported", "사진을 읽을 수 없습니다. JPEG, PNG 또는 WebP 파일을 다시 선택해 주세요.");
  const declared = file.type ? typeFromMime(file.type) : null;
  if (file.type && (!declared || declared !== type)) {
    throw new ImageValidationError("mismatch", "파일 형식 표시와 실제 내용이 다릅니다. 신뢰할 수 있는 앱에서 다시 저장한 사진을 선택해 주세요.");
  }
  return { type, bytes };
}

export function validatePixelCount(width: number, height: number, maxPixels = 40_000_000): void {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new ImageValidationError("decode", "사진 크기를 확인할 수 없습니다. 다른 파일을 선택해 주세요.");
  }
  if (width > MAX_IMAGE_EDGE || height > MAX_IMAGE_EDGE) {
    throw new ImageValidationError("too-many-pixels", `사진의 한 변이 너무 깁니다. 가로와 세로를 각각 ${MAX_IMAGE_EDGE.toLocaleString("ko-KR")}px 이하로 줄여 다시 선택해 주세요.`);
  }
  if (width * height > maxPixels) {
    throw new ImageValidationError("too-many-pixels", "사진 해상도가 너무 커 기기 메모리가 부족할 수 있습니다. 4천만 픽셀 이하로 줄여 다시 선택해 주세요.");
  }
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${Math.round(bytes)}B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)}KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)}MB`;
}
