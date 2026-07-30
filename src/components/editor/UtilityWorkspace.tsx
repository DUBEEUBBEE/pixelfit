/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, Check, Download, FileImage, LockKeyhole, X } from "lucide-react";
import {
  compressImageSource,
  compressionOutputFilename,
  TARGET_SIZE_PRESETS,
  targetSizeToBytes,
  type TargetSizeUnit,
} from "@/features/image-compressor";
import {
  canPreserveMetadataExactly,
  convertImageSource,
  converterOutputFilename,
  type MetadataConversionPolicy,
} from "@/features/image-converter";
import { resizeImageSource, resizerOutputFilename } from "@/features/image-resizer";
import { safeDownload } from "@/lib/files/names";
import { formatBytes } from "@/lib/files/validation";
import type { ImageOutputFormat } from "@/lib/image/encode";
import {
  estimateResizedBytes,
  isUpscale,
  resolveResizeDimensions,
  type ResizeFit,
  type ResizeMode,
} from "@/lib/image/resize";
import { ToolStepper } from "./ToolStepper";
import { UploadPanel } from "./UploadPanel";
import {
  useUtilityImage,
  useUtilityProcessor,
  useUtilityResult,
  type UtilityImageAsset,
  type UtilityResult,
} from "./useUtilityImage";
import { useImageTransfer } from "@/components/session/ImageTransferProvider";
import { NextToolActions } from "@/components/result/NextToolActions";
import { getClientTool } from "@/config/client-tools";

type Step = 1 | 2 | 3;

export function UtilityWorkspace({ presetId }: { presetId: string }) {
  if (presetId === "image-compressor") return <CompressorWorkspace />;
  if (presetId === "image-resizer") return <ResizerWorkspace />;
  if (presetId === "image-converter") return <ConverterWorkspace />;
  throw new Error(`지원하지 않는 유틸리티 도구입니다: ${presetId}`);
}

function CompressorWorkspace() {
  const image = useUtilityImage({ retainBytes: false });
  const generated = useUtilityResult();
  const processor = useUtilityProcessor();
  const [step, setStep] = useState<Step>(1);
  const [targetValue, setTargetValue] = useState(500);
  const [targetUnit, setTargetUnit] = useState<TargetSizeUnit>("KB");
  const [format, setFormat] = useState<ImageOutputFormat>("jpeg");
  const [allowDownscale, setAllowDownscale] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");

  const choose = async (file: File) => {
    processor.cancel();
    generated.clearResult();
    const asset = await image.choose(file);
    if (!asset) return;
    setFormat(asset.format);
    setStep(2);
  };
  useIncomingTransfer("image-compressor", choose);

  const createResult = async () => {
    const asset = image.asset;
    if (!asset) return;
    let targetBytes: number;
    try {
      targetBytes = targetSizeToBytes(targetValue, targetUnit);
    } catch (caught) {
      processor.setError(caught instanceof Error ? caught.message : "목표 용량을 확인해 주세요.");
      return;
    }
    const result = await processor.run((signal, onProgress) => compressImageSource(
      asset.decoded.source,
      { width: asset.decoded.width, height: asset.decoded.height },
      { sourceFile: asset.file, format, targetBytes, allowDownscale, backgroundColor, signal, onProgress },
    ));
    if (!result) return;
    generated.setResult({
      blob: result.blob,
      filename: compressionOutputFilename(result.format),
      width: result.width,
      height: result.height,
      format: result.format,
      warnings: result.warnings,
      facts: [
        { label: "원본 용량", value: formatBytes(asset.file.size) },
        { label: "결과 용량", value: formatBytes(result.blob.size) },
        { label: "목표 확인", value: result.reachedTarget ? `${formatBytes(targetBytes)} 이하 확인` : "목표 초과" },
        { label: "실제 출력", value: `${result.width}×${result.height}px · ${formatLabel(result.format)}` },
        { label: "인코드", value: result.quality === undefined ? `${result.attempts}회` : `품질 ${Math.round(result.quality * 100)}% · ${result.attempts}회` },
        { label: "해상도 축소", value: result.downscaleSteps > 0 ? `${result.downscaleSteps}단계 적용` : "적용 안 함" },
      ],
    });
    setStep(3);
  };

  const reset = () => {
    processor.cancel();
    generated.clearResult();
    image.reset();
    setStep(1);
  };

  return (
    <Workspace title="사진 용량 줄이기" step={step}>
      {step === 1 && <UploadPanel onFile={choose} error={image.error} busy={image.busy} />}
      {step === 2 && image.asset && (
        <EditorLayout asset={image.asset} previewLabel="압축할 원본 사진">
          <div className="control-card">
            <h3>목표 용량</h3>
            <div className="format-row" style={{ flexWrap: "wrap" }}>
              {TARGET_SIZE_PRESETS.map((kilobytes) => (
                <button
                  className="button secondary"
                  type="button"
                  key={kilobytes}
                  onClick={() => {
                    if (kilobytes >= 1024) { setTargetValue(kilobytes / 1024); setTargetUnit("MB"); }
                    else { setTargetValue(kilobytes); setTargetUnit("KB"); }
                  }}
                >
                  {kilobytes >= 1024 ? `${kilobytes / 1024}MB` : `${kilobytes}KB`}
                </button>
              ))}
            </div>
            <div className="format-row" style={{ marginTop: ".75rem" }}>
              <div className="field" style={{ flex: 1 }}>
                <label htmlFor="compress-target">직접 입력</label>
                <input id="compress-target" type="number" min="0.01" step="0.01" value={targetValue} onChange={(event) => setTargetValue(Number(event.target.value))} />
              </div>
              <div className="field" style={{ width: "7rem" }}>
                <label htmlFor="compress-unit">단위</label>
                <select id="compress-unit" value={targetUnit} onChange={(event) => setTargetUnit(event.target.value as TargetSizeUnit)}>
                  <option value="KB">KB</option><option value="MB">MB</option>
                </select>
              </div>
            </div>
          </div>
          <OutputFormatPicker value={format} onChange={setFormat} />
          {format === "jpeg" && <ColorControl id="compress-background" value={backgroundColor} onChange={setBackgroundColor} label="투명 영역의 JPEG 배경색" />}
          <div className="control-card">
            <label className="metadata-option">
              <input type="checkbox" checked={allowDownscale} onChange={(event) => setAllowDownscale(event.target.checked)} />
              <span><strong>필요하면 해상도도 줄이기</strong><span>최소 품질로도 목표에 못 미칠 때만 최대 4단계로 줄입니다. 기본값은 사용 안 함입니다.</span></span>
            </label>
            <p style={{ color: "var(--muted)", fontSize: ".82rem", marginBottom: 0 }}>예상 화질: JPEG·WebP는 목표 이하에서 가능한 높은 품질을 제한된 횟수로 찾습니다. PNG는 품질 슬라이더가 없어 해상도 축소를 선택한 경우에만 더 줄일 수 있습니다.</p>
          </div>
          <ProcessingState {...processor} />
          <div className="editor-actions">
            <button className="button ghost" type="button" onClick={reset}>다른 사진 선택</button>
            <button className="button primary" type="button" disabled={processor.busy} onClick={() => void createResult()}>목표 용량으로 만들기</button>
          </div>
        </EditorLayout>
      )}
      {step === 3 && image.asset && generated.result && (
        <ResultView
          toolId="image-compressor"
          title="압축 결과를 실제 파일로 확인했습니다."
          asset={image.asset}
          result={generated.result}
          onBack={() => setStep(2)}
          onReset={reset}
          onError={processor.setError}
          error={processor.error}
        />
      )}
    </Workspace>
  );
}

function ResizerWorkspace() {
  const image = useUtilityImage({ retainBytes: false });
  const generated = useUtilityResult();
  const processor = useUtilityProcessor();
  const [step, setStep] = useState<Step>(1);
  const [mode, setMode] = useState<ResizeMode>("dimensions");
  const [width, setWidth] = useState(1080);
  const [height, setHeight] = useState(1080);
  const [ratioLocked, setRatioLocked] = useState(true);
  const [anchor, setAnchor] = useState<"width" | "height">("width");
  const [longEdge, setLongEdge] = useState(1920);
  const [percent, setPercent] = useState(50);
  const [fit, setFit] = useState<ResizeFit>("contain");
  const [format, setFormat] = useState<ImageOutputFormat>("jpeg");
  const [quality, setQuality] = useState(0.9);
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");

  const choose = async (file: File) => {
    processor.cancel();
    generated.clearResult();
    const asset = await image.choose(file);
    if (!asset) return;
    setWidth(asset.decoded.width);
    setHeight(asset.decoded.height);
    setLongEdge(Math.max(asset.decoded.width, asset.decoded.height));
    setFormat(asset.format);
    setStep(2);
  };
  useIncomingTransfer("image-resizer", choose);

  const planned = useMemo(() => {
    const asset = image.asset;
    if (!asset) return { dimensions: null, error: null };
    const source = { width: asset.decoded.width, height: asset.decoded.height };
    try {
      const dimensions = mode === "dimensions"
        ? resolveResizeDimensions(source, { mode, width, height, ratioLocked, anchor })
        : mode === "long-edge"
          ? resolveResizeDimensions(source, { mode, longEdge })
          : resolveResizeDimensions(source, { mode, percent });
      return { dimensions, error: null };
    } catch (caught) {
      return { dimensions: null, error: caught instanceof Error ? caught.message : "출력 크기를 확인해 주세요." };
    }
  }, [anchor, height, image.asset, longEdge, mode, percent, ratioLocked, width]);

  const sourceDimensions = image.asset ? { width: image.asset.decoded.width, height: image.asset.decoded.height } : null;
  const estimatedBytes = image.asset && planned.dimensions
    ? estimateResizedBytes(image.asset.file.size, sourceDimensions!, planned.dimensions)
    : 0;

  const changeWidth = (next: number) => {
    setAnchor("width");
    setWidth(next);
    if (ratioLocked && sourceDimensions) setHeight(Math.max(1, Math.round(next * sourceDimensions.height / sourceDimensions.width)));
  };
  const changeHeight = (next: number) => {
    setAnchor("height");
    setHeight(next);
    if (ratioLocked && sourceDimensions) setWidth(Math.max(1, Math.round(next * sourceDimensions.width / sourceDimensions.height)));
  };
  const changeRatioLocked = (next: boolean) => {
    setRatioLocked(next);
    if (!next || !sourceDimensions) return;
    if (anchor === "height") {
      setWidth(Math.max(1, Math.round(height * sourceDimensions.width / sourceDimensions.height)));
      return;
    }
    setHeight(Math.max(1, Math.round(width * sourceDimensions.height / sourceDimensions.width)));
  };

  const createResult = async () => {
    const asset = image.asset;
    const output = planned.dimensions;
    if (!asset || !output) {
      processor.setError(planned.error ?? "출력 크기를 확인해 주세요.");
      return;
    }
    const result = await processor.run((signal, onProgress) => {
      onProgress(20);
      return resizeImageSource(
        asset.decoded.source,
        { width: asset.decoded.width, height: asset.decoded.height },
        { sourceFile: asset.file, output, fit, format, quality, backgroundColor: format === "jpeg" ? backgroundColor : undefined, signal },
      ).then((value) => { onProgress(100); return value; });
    });
    if (!result) return;
    generated.setResult({
      blob: result.blob,
      filename: resizerOutputFilename(result.format),
      width: result.width,
      height: result.height,
      format: result.format,
      warnings: isUpscale({ width: asset.decoded.width, height: asset.decoded.height }, output)
        ? ["원본보다 큰 출력입니다. 새 디테일이 생기지 않아 선명도가 낮아 보일 수 있습니다."]
        : [],
      facts: [
        { label: "원본 크기", value: `${asset.decoded.width}×${asset.decoded.height}px` },
        { label: "출력 크기", value: `${result.width}×${result.height}px` },
        { label: "결과 용량", value: formatBytes(result.blob.size) },
        { label: "파일 형식", value: formatLabel(result.format) },
        { label: "맞춤 방식", value: fit === "contain" ? "전체 포함" : "빈틈없이 채움" },
        { label: "실제 파일", value: "형식·가로·세로 크기 확인 완료" },
      ],
    });
    setStep(3);
  };

  const reset = () => {
    processor.cancel(); generated.clearResult(); image.reset(); setStep(1);
  };

  return (
    <Workspace title="이미지 크기 조절" step={step}>
      {step === 1 && <UploadPanel onFile={choose} error={image.error} busy={image.busy} />}
      {step === 2 && image.asset && (
        <EditorLayout asset={image.asset} previewLabel="크기를 조절할 원본 사진">
          <div className="control-card">
            <h3>크기 지정 방식</h3>
            <div className="format-row">
              {(["dimensions", "long-edge", "percent"] as const).map((item) => (
                <button key={item} type="button" className={`segmented ${mode === item ? "selected" : ""}`} aria-pressed={mode === item} onClick={() => setMode(item)}>
                  {item === "dimensions" ? "가로·세로" : item === "long-edge" ? "긴 변" : "퍼센트"}
                </button>
              ))}
            </div>
            {mode === "dimensions" && <>
              <div className="format-row" style={{ marginTop: ".75rem" }}>
                <NumberField id="resize-width" label="가로(px)" value={width} onChange={changeWidth} />
                <NumberField id="resize-height" label="세로(px)" value={height} onChange={changeHeight} />
              </div>
              <label className="metadata-option" style={{ marginTop: ".65rem" }}><input type="checkbox" checked={ratioLocked} onChange={(event) => changeRatioLocked(event.target.checked)} /><span><strong>원본 비율 잠금</strong><span>기본값으로 비율 왜곡을 막습니다.</span></span></label>
              <div className="format-row" style={{ flexWrap: "wrap", marginTop: ".65rem" }}>
                {[{ w: 640, h: 480 }, { w: 1080, h: 1080 }, { w: 1920, h: 1080 }].map((size) => <button className="button secondary" type="button" key={`${size.w}x${size.h}`} onClick={() => { setAnchor("width"); setWidth(size.w); setHeight(size.h); setRatioLocked(false); }}>{size.w}×{size.h}</button>)}
              </div>
            </>}
            {mode === "long-edge" && <NumberField id="resize-long-edge" label="긴 변(px)" value={longEdge} onChange={setLongEdge} />}
            {mode === "percent" && <NumberField id="resize-percent" label="원본 대비(%)" value={percent} onChange={setPercent} step={1} />}
          </div>
          <div className="control-card">
            <h3>화면에 맞추는 방식</h3>
            <div className="variant-grid">
              <button type="button" className={`variant-button ${fit === "contain" ? "selected" : ""}`} aria-pressed={fit === "contain"} onClick={() => setFit("contain")}><strong>전체 포함</strong><span>사진 전체를 보이고 남는 곳은 배경으로 둡니다.</span></button>
              <button type="button" className={`variant-button ${fit === "cover" ? "selected" : ""}`} aria-pressed={fit === "cover"} onClick={() => setFit("cover")}><strong>빈틈없이 채움</strong><span>비율을 유지하며 넘치는 가장자리를 자릅니다.</span></button>
            </div>
          </div>
          <OutputFormatPicker value={format} onChange={setFormat} />
          {format !== "png" && <QualityControl id="resize-quality" value={quality} onChange={setQuality} />}
          {format === "jpeg" && <ColorControl id="resize-background" value={backgroundColor} onChange={setBackgroundColor} label="빈 영역과 투명 픽셀의 배경색" />}
          {format !== "jpeg" && fit === "contain" && <div className="info-box">PNG·WebP의 남는 영역과 원본 투명도는 투명하게 유지합니다.</div>}
          <div className="info-box" role="status">
            <FileImage size={18} aria-hidden="true" />
            <div>{planned.error ?? <>예상 출력 <strong>{planned.dimensions?.width}×{planned.dimensions?.height}px</strong> · 약 {formatBytes(estimatedBytes)} (실제 인코딩 전 추정)</>}
              {sourceDimensions && planned.dimensions && isUpscale(sourceDimensions, planned.dimensions) && <><br /><strong>업스케일 경고:</strong> 원본보다 커져 선명도가 낮아질 수 있습니다.</>}
            </div>
          </div>
          <ProcessingState {...processor} />
          <div className="editor-actions"><button className="button ghost" type="button" onClick={reset}>다른 사진 선택</button><button className="button primary" type="button" disabled={processor.busy || !planned.dimensions} onClick={() => void createResult()}>새 크기로 만들기</button></div>
        </EditorLayout>
      )}
      {step === 3 && image.asset && generated.result && <ResultView toolId="image-resizer" title="요청한 픽셀 크기로 만들었습니다." asset={image.asset} result={generated.result} onBack={() => setStep(2)} onReset={reset} onError={processor.setError} error={processor.error} />}
    </Workspace>
  );
}

function ConverterWorkspace() {
  const image = useUtilityImage({ retainBytes: true });
  const generated = useUtilityResult();
  const processor = useUtilityProcessor();
  const [step, setStep] = useState<Step>(1);
  const [format, setFormat] = useState<ImageOutputFormat>("webp");
  const [quality, setQuality] = useState(0.9);
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [metadataPolicy, setMetadataPolicy] = useState<MetadataConversionPolicy>("remove");

  const choose = async (file: File) => {
    processor.cancel(); generated.clearResult();
    const asset = await image.choose(file);
    if (!asset) return;
    setFormat(asset.format);
    setMetadataPolicy("remove");
    setStep(2);
  };
  useIncomingTransfer("image-converter", choose);

  const changeFormat = (next: ImageOutputFormat) => {
    setFormat(next);
    if (image.asset && !canPreserveMetadataExactly(image.asset.format, next)) setMetadataPolicy("remove");
  };

  const createResult = async () => {
    const asset = image.asset;
    if (!asset) return;
    const result = await processor.run((signal, onProgress) => {
      onProgress(15);
      return convertImageSource(
        asset.decoded.source,
        { width: asset.decoded.width, height: asset.decoded.height },
        asset.bytes,
        asset.format,
        { sourceFile: asset.file, outputFormat: format, quality, backgroundColor, metadataPolicy, signal },
      ).then((value) => { onProgress(100); return value; });
    });
    if (!result) return;
    generated.setResult({
      blob: result.blob,
      filename: converterOutputFilename(result.format),
      width: result.width,
      height: result.height,
      format: result.format,
      warnings: result.warnings,
      facts: [
        { label: "원본 형식", value: formatLabel(asset.format) },
        { label: "결과 형식", value: formatLabel(result.format) },
        { label: "원본 용량", value: formatBytes(asset.file.size) },
        { label: "결과 용량", value: formatBytes(result.blob.size) },
        { label: "픽셀 크기", value: `${result.width}×${result.height}px` },
        { label: "메타데이터", value: result.metadataPreservedExactly ? "원본 바이트 그대로 보존" : result.metadataRemoved ? "개인정보성 필드 없음 재검사" : "확인 필요" },
      ],
    });
    setStep(3);
  };

  const reset = () => { processor.cancel(); generated.clearResult(); image.reset(); setStep(1); };
  const preserveAvailable = Boolean(image.asset && canPreserveMetadataExactly(image.asset.format, format));

  return (
    <Workspace title="이미지 형식 변환" step={step}>
      {step === 1 && <UploadPanel onFile={choose} error={image.error} busy={image.busy} />}
      {step === 2 && image.asset && (
        <EditorLayout asset={image.asset} previewLabel="형식을 변환할 원본 사진">
          <div className="success-box"><Check size={18} aria-hidden="true" /><div>실제 파일 내용으로 확인한 입력 형식: <strong>{formatLabel(image.asset.format)}</strong> · {image.asset.decoded.width}×{image.asset.decoded.height}px · {formatBytes(image.asset.file.size)}</div></div>
          <OutputFormatPicker value={format} onChange={changeFormat} />
          {format !== "png" && <QualityControl id="converter-quality" value={quality} onChange={setQuality} />}
          {format === "jpeg" && <ColorControl id="converter-background" value={backgroundColor} onChange={setBackgroundColor} label="투명 영역의 JPEG 배경색" />}
          {format !== "jpeg" && <div className="info-box">PNG·WebP 출력은 원본의 투명 픽셀을 유지합니다. JPEG는 투명도를 지원하지 않아 선택한 배경색과 합성합니다.</div>}
          <div className="control-card">
            <h3>메타데이터 처리</h3>
            <div className="metadata-grid">
              <label className="metadata-option"><input type="radio" name="converter-metadata" checked={metadataPolicy === "remove"} onChange={() => setMetadataPolicy("remove")} /><span><strong>개인정보성 촬영 정보 제거 (기본)</strong><span>선택한 형식의 새 파일로 저장한 뒤 결과를 다시 확인합니다.</span></span></label>
              <label className="metadata-option" aria-disabled={!preserveAvailable}><input type="radio" name="converter-metadata" checked={metadataPolicy === "preserve-exact"} disabled={!preserveAvailable} onChange={() => setMetadataPolicy("preserve-exact")} /><span><strong>원본 바이트 그대로 보존</strong><span>{preserveAvailable ? "같은 형식일 때만 가능하며 품질은 바뀌지 않습니다." : "다른 형식 사이에서는 정확한 보존을 지원하지 않습니다."}</span></span></label>
            </div>
          </div>
          <div className="info-box"><LockKeyhole size={18} aria-hidden="true" /><div>HEIC은 기기 안에서 안전하게 읽는 방법을 아직 검증하지 못해 지원하지 않습니다. 외부 변환 서버도 사용하지 않습니다.</div></div>
          <ProcessingState {...processor} />
          <div className="editor-actions"><button className="button ghost" type="button" onClick={reset}>다른 사진 선택</button><button className="button primary" type="button" disabled={processor.busy} onClick={() => void createResult()}>{formatLabel(format)} 파일 만들기</button></div>
        </EditorLayout>
      )}
      {step === 3 && image.asset && generated.result && <ResultView toolId="image-converter" title="변환 결과의 형식과 크기를 확인했습니다." asset={image.asset} result={generated.result} onBack={() => setStep(2)} onReset={reset} onError={processor.setError} error={processor.error} />}
    </Workspace>
  );
}

function Workspace({ title, step, children }: { title: string; step: Step; children: ReactNode }) {
  return <section className="workspace" aria-label={`${title} 도구`}><ToolStepper step={step} /><div className="workspace-body" aria-live="polite">{children}</div></section>;
}

function EditorLayout({ asset, previewLabel, children }: { asset: UtilityImageAsset; previewLabel: string; children: ReactNode }) {
  return <div className="editor-grid">
    <div className="preview-column">
      <div className="result-preview"><img src={asset.previewUrl} alt={previewLabel} /><dl><div><dt>원본 크기</dt><dd>{asset.decoded.width}×{asset.decoded.height}px</dd></div><div><dt>원본 용량</dt><dd>{formatBytes(asset.file.size)}</dd></div><div><dt>실제 형식</dt><dd>{formatLabel(asset.format)}</dd></div><div><dt>처리 위치</dt><dd>현재 브라우저</dd></div></dl></div>
      <p className="local-note"><LockKeyhole size={15} aria-hidden="true" />사진과 결과는 네트워크나 브라우저 저장소에 기록하지 않습니다.</p>
    </div>
    <div className="control-panel">{children}</div>
  </div>;
}

function ResultView({ toolId, title, asset, result, onBack, onReset, onError, error }: {
  toolId: string;
  title: string;
  asset: UtilityImageAsset;
  result: UtilityResult;
  onBack: () => void;
  onReset: () => void;
  onError: (message: string | null) => void;
  error: string | null;
}) {
  const tool = getClientTool(toolId);
  const download = () => {
    if (!safeDownload(result.blob, result.filename)) onError("브라우저가 다운로드를 차단했습니다. 다운로드 허용 후 다시 시도해 주세요.");
  };
  return <div className="result-grid">
    <div className="result-preview">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem", alignItems: "center" }}>
        <figure style={{ margin: 0 }}><img src={asset.previewUrl} alt="원본 비교" /><figcaption style={{ marginTop: ".4rem", fontSize: ".78rem" }}>원본</figcaption></figure>
        <figure style={{ margin: 0 }}><img src={result.url} alt="처리 결과 비교" /><figcaption style={{ marginTop: ".4rem", fontSize: ".78rem" }}>결과</figcaption></figure>
      </div>
      <dl>{result.facts.slice(0, 4).map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>
    </div>
    <div className="result-panel">
      <span className="eyebrow">로컬 처리·실제 파일 재검사</span><h2>{title}</h2>
      <div className="check-list">{result.facts.map((fact) => <div className="check-item pass" key={fact.label}><span className="check-icon"><Check size={14} /></span><div><strong>{fact.label}</strong><span>{fact.value}</span></div></div>)}</div>
      {result.warnings.map((warning) => <div className="warning-box" key={warning} style={{ marginTop: ".55rem" }}><AlertTriangle size={18} aria-hidden="true" /><div>{warning}</div></div>)}
      {error && <div className="error-box" role="alert" style={{ marginTop: ".6rem" }}>{error}</div>}
      <div className="result-actions"><button className="button primary" type="button" onClick={download}><Download size={18} />결과 다운로드</button><button className="button ghost" type="button" onClick={onBack}>설정 다시 조정</button><button className="button ghost" type="button" onClick={onReset}>처음부터 다시</button></div>
      {tool && <NextToolActions sourceToolId={tool.id} targetIds={tool.nextToolIds} asset={result.blob} filename={result.filename} />}
    </div>
  </div>;
}

function OutputFormatPicker({ value, onChange }: { value: ImageOutputFormat; onChange: (format: ImageOutputFormat) => void }) {
  return <div className="control-card"><h3>출력 파일 형식</h3><div className="format-row">{(["jpeg", "png", "webp"] as const).map((format) => <button type="button" className={`segmented ${value === format ? "selected" : ""}`} aria-pressed={value === format} key={format} onClick={() => onChange(format)}>{formatLabel(format)}</button>)}</div></div>;
}

function QualityControl({ id, value, onChange }: { id: string; value: number; onChange: (value: number) => void }) {
  return <div className="control-card"><div className="range-row"><label htmlFor={id}>출력 품질 <span>{Math.round(value * 100)}%</span></label><input id={id} type="range" min="0.4" max="1" step="0.01" value={value} onChange={(event) => onChange(Number(event.target.value))} /></div></div>;
}

function ColorControl({ id, value, onChange, label }: { id: string; value: string; onChange: (value: string) => void; label: string }) {
  return <div className="control-card"><div className="field"><label htmlFor={id}>{label}</label><input id={id} type="color" value={value} onChange={(event) => onChange(event.target.value)} /></div></div>;
}

function NumberField({ id, label, value, onChange, step = 1 }: { id: string; label: string; value: number; onChange: (value: number) => void; step?: number }) {
  return <div className="field" style={{ flex: 1 }}><label htmlFor={id}>{label}</label><input id={id} type="number" min="1" step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /></div>;
}

function ProcessingState({ busy, progress, error, cancel }: { busy: boolean; progress: number; error: string | null; cancel: () => void }) {
  return <>{error && <div className="error-box" role="alert">{error}</div>}{busy && <div className="progress-wrap" aria-busy="true"><div className="progress-track"><div className="progress-bar" style={{ width: `${progress}%` }} /></div><div className="progress-label">기기 안에서 처리하고 실제 파일을 확인하고 있어요… {progress}%</div><button className="button ghost" type="button" onClick={cancel} style={{ marginTop: ".5rem" }}><X size={16} />처리 취소</button></div>}</>;
}

function formatLabel(format: ImageOutputFormat): string {
  if (format === "jpeg") return "JPG";
  return format.toUpperCase();
}

function useIncomingTransfer(toolId: string, choose: (file: File) => Promise<void>) {
  const { claimTransfer } = useImageTransfer();
  const chooseRef = useRef(choose);
  const claimedRef = useRef(false);
  useEffect(() => { chooseRef.current = choose; });
  useEffect(() => {
    if (claimedRef.current) return;
    claimedRef.current = true;
    const transferred = claimTransfer(toolId);
    if (transferred) queueMicrotask(() => void chooseRef.current(transferred));
  }, [claimTransfer, toolId]);
}
