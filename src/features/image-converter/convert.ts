import { inspectMetadata } from "@/features/metadata-cleaner";
import {
  createRasterCanvas,
  encodeAndVerifyCanvas,
  getRasterContext,
  mimeForOutputFormat,
  verifyEncodedBlob,
  type ImageOutputFormat,
} from "@/lib/image/encode";
import type { ResizeDimensions } from "@/lib/image/resize";

export type MetadataConversionPolicy = "remove" | "preserve-exact";

export type ConvertImageOptions = {
  /** Original local file used only for the worker path; never uploaded or persisted. */
  sourceFile?: Blob;
  outputFormat: ImageOutputFormat;
  quality?: number;
  backgroundColor?: string;
  metadataPolicy: MetadataConversionPolicy;
  signal?: AbortSignal;
};

export type ConvertedImageResult = {
  blob: Blob;
  format: ImageOutputFormat;
  width: number;
  height: number;
  metadataPolicy: MetadataConversionPolicy;
  metadataRemoved: boolean;
  metadataPreservedExactly: boolean;
  warnings: string[];
};

export function canPreserveMetadataExactly(input: ImageOutputFormat, output: ImageOutputFormat): boolean {
  return input === output;
}

export async function convertImageSource(
  source: CanvasImageSource,
  sourceDimensions: ResizeDimensions,
  sourceBytes: Uint8Array,
  inputFormat: ImageOutputFormat,
  options: ConvertImageOptions,
): Promise<ConvertedImageResult> {
  throwIfAborted(options.signal);
  const sourceInspection = inspectMetadata(sourceBytes, mimeForOutputFormat(inputFormat));
  if (options.metadataPolicy === "preserve-exact") {
    if (!canPreserveMetadataExactly(inputFormat, options.outputFormat)) {
      throw new Error("서로 다른 이미지 컨테이너 사이에서는 메타데이터를 정확히 보존할 수 없습니다. 메타데이터 제거를 선택해 주세요.");
    }
    const blob = new Blob([sourceBytes.slice().buffer], { type: mimeForOutputFormat(inputFormat) });
    const verified = await verifyEncodedBlob(blob, { format: inputFormat, width: sourceDimensions.width, height: sourceDimensions.height });
    throwIfAborted(options.signal);
    return {
      blob: verified.blob,
      format: inputFormat,
      width: verified.width,
      height: verified.height,
      metadataPolicy: "preserve-exact",
      metadataRemoved: false,
      metadataPreservedExactly: true,
      warnings: ["메타데이터와 픽셀을 정확히 유지하기 위해 원본 형식과 바이트를 그대로 복사했습니다. 품질 설정은 적용되지 않았습니다."],
    };
  }

  const workerResult = await convertInWorker(sourceDimensions, inputFormat, options);
  if (workerResult) return workerResult;

  const canvas = createRasterCanvas(sourceDimensions.width, sourceDimensions.height);
  const context = getRasterContext(canvas, { alpha: options.outputFormat !== "jpeg" });
  if (options.outputFormat === "jpeg") {
    context.fillStyle = options.backgroundColor ?? "#ffffff";
    context.fillRect(0, 0, sourceDimensions.width, sourceDimensions.height);
  } else {
    context.clearRect(0, 0, sourceDimensions.width, sourceDimensions.height);
  }
  context.drawImage(source, 0, 0, sourceDimensions.width, sourceDimensions.height);
  throwIfAborted(options.signal);
  const encoded = await encodeAndVerifyCanvas(canvas, {
    format: options.outputFormat,
    quality: options.quality,
    backgroundColor: options.backgroundColor,
    backgroundAlreadyApplied: options.outputFormat === "jpeg",
  });
  throwIfAborted(options.signal);
  const resultInspection = inspectMetadata(encoded.bytes, mimeForOutputFormat(options.outputFormat));
  const metadataRemoved = resultInspection.categories.length === 0;
  if (!metadataRemoved) throw new Error("결과 파일에 개인정보성 메타데이터가 남아 있어 변환을 완료하지 않았습니다.");
  const warnings: string[] = [];
  if (sourceInspection.hasProvenance) warnings.push("형식 변환과 재인코딩으로 기존 Content Credentials의 유효성이 사라질 수 있습니다.");
  return {
    blob: encoded.blob,
    format: encoded.format,
    width: encoded.width,
    height: encoded.height,
    metadataPolicy: "remove",
    metadataRemoved: true,
    metadataPreservedExactly: false,
    warnings,
  };
}

async function convertInWorker(
  sourceDimensions: ResizeDimensions,
  inputFormat: ImageOutputFormat,
  options: ConvertImageOptions,
): Promise<ConvertedImageResult | null> {
  if (!options.sourceFile) return null;
  const workerApi = await import("@/workers/creative-worker-client");
  if (!workerApi.canUseCreativeImageWorker()) return null;
  try {
    const result = await workerApi.runCreativeImageWorker({
      kind: "convert",
      file: options.sourceFile,
      sourceWidth: sourceDimensions.width,
      sourceHeight: sourceDimensions.height,
      inputFormat,
      outputFormat: options.outputFormat,
      quality: options.quality,
      backgroundColor: options.backgroundColor,
      metadataPolicy: options.metadataPolicy,
    }, { signal: options.signal });
    if (result.details?.kind !== "convert") throw new Error("형식 변환 워커 결과 정보를 확인할 수 없습니다.");
    throwIfAborted(options.signal);
    const verified = await verifyEncodedBlob(result.blob, { format: options.outputFormat, width: sourceDimensions.width, height: sourceDimensions.height });
    const inspection = inspectMetadata(await verified.blob.arrayBuffer().then((buffer) => new Uint8Array(buffer)), mimeForOutputFormat(options.outputFormat));
    if (inspection.categories.length > 0) throw new Error("결과 파일에 개인정보성 메타데이터가 남아 있어 변환을 완료하지 않았습니다.");
    throwIfAborted(options.signal);
    return {
      blob: verified.blob,
      format: verified.format,
      width: verified.width,
      height: verified.height,
      metadataPolicy: result.details.metadataPolicy,
      metadataRemoved: result.details.metadataRemoved,
      metadataPreservedExactly: result.details.metadataPreservedExactly,
      warnings: result.details.warnings,
    };
  } catch (error) {
    if (error instanceof workerApi.CreativeWorkerUnavailableError) return null;
    throw error;
  }
}

export function converterOutputFilename(format: ImageOutputFormat): string {
  return `pixelfit-converted.${format === "jpeg" ? "jpg" : format}`;
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException("형식 변환이 취소되었습니다.", "AbortError");
}
