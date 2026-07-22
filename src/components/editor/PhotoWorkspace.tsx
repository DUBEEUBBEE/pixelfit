/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, Download, Focus, RotateCcw, RotateCw, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { copy } from "@/config/copy";
import { detectFaces, suggestTransformFromFace, type FaceDetectionResult } from "@/features/face-detection/adapter";
import { analyzeCanvas, type ImageHeuristics } from "@/features/image-core/analysis";
import { buildPhotoChecks, type ResultCheck } from "@/features/image-core/checks";
import { CheckList } from "@/components/result/CheckList";
import { ToolStepper } from "./ToolStepper";
import { UploadPanel } from "./UploadPanel";
import { createOutputFilename, safeDownload } from "@/lib/files/names";
import { formatBytes, validateImageFile } from "@/lib/files/validation";
import { decodeImage, type DecodedImage } from "@/lib/image/decode";
import { drawImageComposition, replaceEdgeBackground } from "@/lib/image/draw";
import { exportPresetImage, type ExportFormat, type ExportResult } from "@/lib/image/export";
import { defaultCropTransform, type CropTransform } from "@/lib/image/geometry";
import { resolveBackgroundColor } from "@/lib/image/policy";
import { getPreset } from "@/lib/presets";

type Step = 1 | 2 | 3;
type ResultState = ExportResult & { url: string; checks: ResultCheck[] };

const emptyFace: FaceDetectionResult = { status: "unsupported", faces: [], message: "자동 얼굴 맞춤을 준비하고 있습니다." };

export function PhotoWorkspace({ presetId }: { presetId: string }) {
  const preset = getPreset(presetId);
  if (!preset || !preset.output.width || !preset.output.height) throw new Error("사진 프리셋을 찾을 수 없습니다.");
  const [step, setStep] = useState<Step>(1);
  const [file, setFile] = useState<File | null>(null);
  const [decoded, setDecoded] = useState<DecodedImage | null>(null);
  const [transform, setTransform] = useState<CropTransform>(defaultCropTransform);
  const [variant, setVariant] = useState(preset.variants?.[0]?.id);
  const [format, setFormat] = useState<ExportFormat>(preset.output.formats.includes("jpeg") ? "jpeg" : "png");
  const [face, setFace] = useState<FaceDetectionResult>(emptyFace);
  const [heuristics, setHeuristics] = useState<ImageHeuristics>();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ResultState | null>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const taskRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const decodedRef = useRef<DecodedImage | null>(null);
  const resultUrlRef = useRef<string | null>(null);
  const touchedRef = useRef(false);
  const dragRef = useRef<{ pointerId: number; x: number; y: number; startX: number; startY: number } | null>(null);

  const cleanupResult = useCallback(() => {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = null;
    setResult(null);
  }, []);

  useEffect(() => () => {
    decodedRef.current?.close();
    abortRef.current?.abort();
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && busy) abortRef.current?.abort();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [busy]);

  useEffect(() => {
    if (!decoded || !previewRef.current) return;
    const canvas = previewRef.current;
    const maxWidth = preset.id === "youtube-banner" ? 768 : Math.min(520, preset.output.width!);
    canvas.width = maxWidth;
    canvas.height = Math.round(maxWidth * preset.output.height! / preset.output.width!);
    const context = canvas.getContext("2d", { alpha: format === "png", willReadFrequently: true });
    if (!context) return;
    drawImageComposition(context, decoded.source, {
      outputWidth: canvas.width,
      outputHeight: canvas.height,
      sourceWidth: decoded.width,
      sourceHeight: decoded.height,
      transform,
      mode: preset.id === "youtube-banner" ? "banner" : "photo",
      variant,
    });
    const background = resolveBackgroundColor(preset, variant);
    if (background) replaceEdgeBackground(context, canvas.width, canvas.height, background);
    const timer = window.setTimeout(() => setHeuristics(analyzeCanvas(context, canvas.width, canvas.height)), 180);
    return () => window.clearTimeout(timer);
  }, [decoded, format, preset, transform, variant]);

  const chooseFile = async (nextFile: File) => {
    const task = ++taskRef.current;
    abortRef.current?.abort();
    setBusy(true);
    setError(null);
    cleanupResult();
    try {
      await validateImageFile(nextFile, preset.input.maxBytes);
      const nextDecoded = await decodeImage(nextFile, preset.input.maxPixels);
      if (task !== taskRef.current) { nextDecoded.close(); return; }
      decodedRef.current?.close();
      decodedRef.current = nextDecoded;
      setDecoded(nextDecoded);
      setFile(nextFile);
      setTransform(defaultCropTransform);
      touchedRef.current = false;
      setVariant(preset.variants?.[0]?.id);
      setFace({ ...emptyFace, message: "얼굴 검출은 기기 안에서만 시도합니다." });
      setStep(2);
      if (preset.allowedOperations.includes("face-detect")) {
        const controller = new AbortController();
        abortRef.current = controller;
        void detectFaces(nextFile, controller.signal).then((detection) => {
          if (task !== taskRef.current) return;
          setFace(detection);
          if (!touchedRef.current && detection.status === "available" && detection.faces.length === 1) {
            const suggestion = suggestTransformFromFace(detection.faces[0], nextDecoded.width, nextDecoded.height);
            setTransform((current) => ({ ...current, ...suggestion }));
          }
        }).catch(() => undefined);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "사진을 열 수 없습니다. 다른 파일을 선택해 주세요.");
      setStep(1);
    } finally {
      if (task === taskRef.current) setBusy(false);
    }
  };

  const updateTransform = (update: Partial<CropTransform>, touched = true) => {
    if (touched) touchedRef.current = true;
    setTransform((current) => ({ ...current, ...update }));
  };
  const nudge = (x: number, y: number) => updateTransform({ offsetX: clamp(transform.offsetX + x, -1, 1), offsetY: clamp(transform.offsetY + y, -1, 1) });
  const keyboardMove = (event: KeyboardEvent<HTMLDivElement>) => {
    const amount = event.shiftKey ? 0.08 : 0.025;
    if (event.key === "ArrowLeft") nudge(-amount, 0);
    else if (event.key === "ArrowRight") nudge(amount, 0);
    else if (event.key === "ArrowUp") nudge(0, -amount);
    else if (event.key === "ArrowDown") nudge(0, amount);
    else return;
    event.preventDefault();
  };
  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, startX: transform.offsetX, startY: transform.offsetY };
  };
  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const rect = event.currentTarget.getBoundingClientRect();
    updateTransform({ offsetX: clamp(drag.startX + ((event.clientX - drag.x) / rect.width) * 2, -1, 1), offsetY: clamp(drag.startY + ((event.clientY - drag.y) / rect.height) * 2, -1, 1) });
  };
  const pointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
  };

  const autoFit = () => {
    if (!decoded) return;
    if (face.status === "available" && face.faces.length === 1) {
      const suggestion = suggestTransformFromFace(face.faces[0], decoded.width, decoded.height);
      setTransform((current) => ({ ...current, ...suggestion }));
    } else setTransform(defaultCropTransform);
    touchedRef.current = false;
  };

  const createResult = async () => {
    if (!file || !decoded) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setProgress(2);
    setError(null);
    try {
      const output = await exportPresetImage(file, preset, { transform, variant, format }, controller.signal, setProgress);
      const url = URL.createObjectURL(output.blob);
      cleanupResult();
      resultUrlRef.current = url;
      const checks = buildPhotoChecks({
        width: output.width,
        height: output.height,
        expectedWidth: preset.output.width!,
        expectedHeight: preset.output.height!,
        bytes: output.blob.size,
        maxBytes: preset.output.maxBytes,
        sourceWidth: decoded.width,
        sourceHeight: decoded.height,
        faceStatus: face.status,
        faceCount: face.faces.length,
        heuristics,
        official: preset.category === "official",
      });
      setResult({ ...output, url, checks });
      setStep(3);
    } catch (caught) {
      if (!(caught instanceof DOMException && caught.name === "AbortError")) setError(caught instanceof Error ? caught.message : "결과를 만들 수 없습니다. 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    if (!result) return;
    const ok = safeDownload(result.blob, createOutputFilename(preset.id, result.format));
    if (!ok) setError("브라우저가 다운로드를 차단했습니다. 다운로드 허용 후 다시 눌러 주세요.");
  };

  const reset = () => {
    taskRef.current += 1;
    abortRef.current?.abort();
    decodedRef.current?.close();
    decodedRef.current = null;
    setDecoded(null);
    setFile(null);
    cleanupResult();
    setTransform(defaultCropTransform);
    setError(null);
    setProgress(0);
    setStep(1);
  };

  return (
    <section className="workspace" aria-label={`${preset.title} 제작 도구`}>
      <ToolStepper step={step} />
      <div className="workspace-body" aria-live="polite">
        {step === 1 && <UploadPanel onFile={chooseFile} error={error} busy={busy} />}
        {step === 2 && decoded && (
          <div className="editor-grid">
            <div className="preview-column">
              <div
                className="preview-stage"
                tabIndex={0}
                role="application"
                aria-label="사진 위치 조정 영역. 화살표 키로 이동하고 Shift와 함께 누르면 더 크게 이동합니다."
                onKeyDown={keyboardMove}
                onPointerDown={pointerDown}
                onPointerMove={pointerMove}
                onPointerUp={pointerEnd}
                onPointerCancel={pointerEnd}
              >
                <div className="preview-canvas-wrap">
                  <canvas ref={previewRef} className="preview-canvas" aria-label={`${preset.title} 결과 예상 미리보기`} />
                  {preset.id === "youtube-banner" ? <><div className="guide-overlay"><div className="safe-area" /></div><span className="safe-label">텍스트·로고 안전영역</span></> : preset.category === "official" && <div className="guide-overlay"><div className="head-guide" /></div>}
                </div>
              </div>
              <div className="preview-caption"><span>드래그 또는 화살표 키로 위치 이동</span><span>{preset.id === "youtube-banner" ? "기기별 예상 표시" : "안내선은 참고용"}</span></div>
              {preset.id === "passport-photo" && <div className="warning-box" style={{ marginTop: ".8rem" }}>여권사진은 원본 배경을 유지합니다. 배경 제거·합성·얼굴 보정은 실행할 수 없습니다.</div>}
              {preset.id === "resident-id-photo" && variant !== "original" && <div className="warning-box" style={{ marginTop: ".8rem" }}>배경 변경 전 제출처 기준을 확인하세요. 기본 권장값은 원본 배경입니다.</div>}
            </div>
            <div className="control-panel">
              <div className="control-card">
                <h3><SlidersHorizontal size={17} aria-hidden="true" />크기와 위치</h3>
                <div className="range-row"><label htmlFor="zoom">확대 <span>{Math.round(transform.zoom * 100)}%</span></label><input id="zoom" type="range" min="1" max="3" step="0.01" value={transform.zoom} onChange={(event) => updateTransform({ zoom: Number(event.target.value) })} /></div>
                <div className="direction-grid" aria-label="사진 위치 미세 조정" style={{ marginTop: ".8rem" }}>
                  <span className="empty" /><button type="button" onClick={() => nudge(0, -.04)} aria-label="사진 위로 이동"><ArrowUp size={18} /></button><span className="empty" />
                  <button type="button" onClick={() => nudge(-.04, 0)} aria-label="사진 왼쪽으로 이동"><ArrowLeft size={18} /></button><button type="button" onClick={() => updateTransform({ offsetX: 0, offsetY: 0 })} aria-label="사진 가운데 맞춤"><Focus size={18} /></button><button type="button" onClick={() => nudge(.04, 0)} aria-label="사진 오른쪽으로 이동"><ArrowRight size={18} /></button>
                  <span className="empty" /><button type="button" onClick={() => nudge(0, .04)} aria-label="사진 아래로 이동"><ArrowDown size={18} /></button><span className="empty" />
                </div>
              </div>
              {preset.allowedOperations.includes("rotate") && <div className="control-card"><h3><RotateCw size={17} />회전</h3><div className="format-row"><button className="button secondary" type="button" onClick={() => updateTransform({ rotation: ((transform.rotation + 270) % 360) as CropTransform["rotation"] })}><RotateCcw size={16} />왼쪽</button><button className="button secondary" type="button" onClick={() => updateTransform({ rotation: ((transform.rotation + 90) % 360) as CropTransform["rotation"] })}><RotateCw size={16} />오른쪽</button></div></div>}
              {preset.variants && preset.variants.length > 0 && <div className="control-card"><h3><Sparkles size={17} />{preset.id === "youtube-banner" ? "배치 방식" : preset.allowedOperations.includes("background-replace") ? "배경" : "자동 결과 후보"}</h3><div className="variant-grid">{preset.variants.map((item) => <button key={item.id} type="button" className={`variant-button ${variant === item.id ? "selected" : ""}`} onClick={() => { setVariant(item.id); touchedRef.current = true; }} aria-pressed={variant === item.id}><strong>{item.label}</strong><span>{item.description}</span></button>)}</div></div>}
              {preset.output.formats.includes("jpeg") && preset.output.formats.includes("png") && <div className="control-card"><h3>파일 형식</h3><div className="format-row"><button type="button" className={`segmented ${format === "jpeg" ? "selected" : ""}`} onClick={() => setFormat("jpeg")} aria-pressed={format === "jpeg"}>JPG <small>추천</small></button><button type="button" className={`segmented ${format === "png" ? "selected" : ""}`} onClick={() => setFormat("png")} aria-pressed={format === "png"}>PNG</button></div></div>}
              <div className="info-box"><Check size={17} aria-hidden="true" /><div>{face.message}<br />얼굴 좌표는 저장하거나 전송하지 않습니다.</div></div>
              {error && <div className="error-box" role="alert">{error}</div>}
              {busy && <div className="progress-wrap" aria-busy="true"><div className="progress-track"><div className="progress-bar" style={{ width: `${progress}%` }} /></div><div className="progress-label">{copy.common.processing} {progress}%</div><button type="button" className="button ghost" style={{ marginTop: ".5rem" }} onClick={() => abortRef.current?.abort()}><X size={16} />처리 취소</button></div>}
              <div className="editor-actions"><button type="button" className="button ghost" onClick={autoFit}><Focus size={17} />자동 맞춤</button><button type="button" className="button ghost" onClick={() => void chooseFile(file!)}>원본으로 초기화</button><button type="button" className="button primary" disabled={busy} onClick={() => void createResult()}>확인하고 만들기</button></div>
            </div>
          </div>
        )}
        {step === 3 && result && (
          <div className="result-grid">
            <div className="result-preview"><img src={result.url} alt={`${preset.title} 완성 미리보기`} /><dl><div><dt>출력 크기</dt><dd>{result.width}×{result.height}px</dd></div><div><dt>파일 용량</dt><dd>{formatBytes(result.blob.size)}</dd></div><div><dt>파일 형식</dt><dd>{result.format === "jpeg" ? "JPG" : "PNG"}</dd></div><div><dt>DPI</dt><dd>{preset.output.dpi ? `${preset.output.dpi}dpi` : "해당 없음"}</dd></div></dl></div>
            <div className="result-panel"><span className="eyebrow">기기 안에서 완성</span><h2>파일이 준비됐습니다.</h2><p>{copy.common.autoDisclaimer} {preset.category === "official" && copy.common.approvalDisclaimer}</p><CheckList checks={result.checks} />{!result.reachedTarget && <div className="warning-box">목표 용량을 맞추면 화질이 지나치게 낮아질 수 있어 더 줄이지 않았습니다. JPG를 선택하거나 다른 원본을 사용해 주세요.</div>}<div className="result-actions"><button type="button" className="button primary" onClick={download}><Download size={18} />{copy.common.download}</button><button type="button" className="button ghost" onClick={() => setStep(2)}>다시 조정</button><button type="button" className="button ghost" onClick={reset}>{copy.common.reset}</button></div>{preset.source && <div className="source-box"><strong>규격 출처</strong><br />{preset.source.authority} · {preset.source.title}<br />확인일 {preset.source.lastVerifiedAt} · <a href={preset.source.url} target="_blank" rel="noreferrer">공식 출처 열기</a></div>}</div>
          </div>
        )}
      </div>
    </section>
  );
}

function clamp(value: number, min: number, max: number): number { return Math.min(max, Math.max(min, value)); }
