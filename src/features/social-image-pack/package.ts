import type { SocialImageResult } from "./types";

export async function buildSocialImageZip(results: readonly SocialImageResult[]): Promise<Blob> {
  if (results.length === 0) throw new Error("ZIP에 넣을 SNS 이미지를 하나 이상 선택해 주세요.");
  const names = new Set<string>();
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  for (const result of results) {
    if (names.has(result.filename)) throw new Error(`중복 파일명입니다: ${result.filename}`);
    if (result.blob.size === 0) throw new Error(`${result.filename} 결과가 비어 있습니다.`);
    names.add(result.filename);
    zip.file(result.filename, result.blob);
  }
  const bytes = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 6 }, platform: "DOS" });
  return new Blob([bytes.slice().buffer], { type: "application/zip" });
}

export const SOCIAL_ZIP_FILENAME = "pixelfit-social-image-pack.zip";
