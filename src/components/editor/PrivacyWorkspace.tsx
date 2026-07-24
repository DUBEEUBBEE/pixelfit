"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Download, FileCheck2, Info, LockKeyhole, ShieldAlert, Trash2, X } from "lucide-react";
import { cleanMetadata, inspectMetadata, METADATA_CATEGORIES, type MetadataCategory, type MetadataCleanResult, type MetadataInspection } from "@/features/metadata-cleaner";
import { createOutputFilename, safeDownload } from "@/lib/files/names";
import { formatBytes, validateImageFile } from "@/lib/files/validation";
import { ToolStepper } from "./ToolStepper";
import { UploadPanel } from "./UploadPanel";
import { useImageTransfer } from "@/components/session/ImageTransferProvider";
import { NextToolActions } from "@/components/result/NextToolActions";
import { getClientTool } from "@/config/client-tools";

const categoryCopy: Record<MetadataCategory, { label: string; description: string }> = {
  gps: { label: "GPS 위치", description: "촬영 위치 좌표와 관련 정보" },
  device: { label: "기기 제조사·모델", description: "카메라나 휴대전화 정보" },
  lens: { label: "렌즈 정보", description: "렌즈 제조사·모델·사양" },
  date: { label: "촬영 날짜와 시각", description: "원본 촬영·수정 시각" },
  software: { label: "편집 프로그램", description: "사용된 소프트웨어 이름" },
  author: { label: "작성자", description: "저작자·권리자 입력값" },
  description: { label: "설명·메모", description: "이미지 설명과 사용자 주석" },
  thumbnail: { label: "EXIF 미리보기", description: "파일 안에 포함된 작은 썸네일" },
  xmpIptc: { label: "기타 XMP·IPTC", description: "개인정보성 텍스트 묶음" },
};

type Result = MetadataCleanResult & { blob: Blob };

export function PrivacyWorkspace() {
  const { claimTransfer } = useImageTransfer();
  const tool = getClientTool("photo-privacy-cleaner");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [inspection, setInspection] = useState<MetadataInspection | null>(null);
  const [selected, setSelected] = useState<Set<MetadataCategory>>(new Set());
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const taskRef = useRef(0);
  const chooseRef = useRef<(file: File) => Promise<void>>(async () => undefined);
  const claimedRef = useRef(false);

  useEffect(() => () => { taskRef.current += 1; }, []);

  const choose = async (nextFile: File) => {
    const task = ++taskRef.current;
    setBusy(true); setError(null); setResult(null);
    try {
      const validated = await validateImageFile(nextFile);
      const nextInspection = inspectMetadata(validated.bytes, nextFile.type);
      if (task !== taskRef.current) return;
      setFile(nextFile);
      setBytes(validated.bytes);
      setInspection(nextInspection);
      setSelected(new Set(nextInspection.categories));
      setStep(2);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "메타데이터를 읽을 수 없습니다. 다른 파일을 선택해 주세요.");
    } finally { if (task === taskRef.current) setBusy(false); }
  };
  useEffect(() => { chooseRef.current = choose; });
  useEffect(() => {
    if (claimedRef.current) return;
    claimedRef.current = true;
    const transferred = claimTransfer("photo-privacy-cleaner");
    if (transferred) queueMicrotask(() => void chooseRef.current(transferred));
  }, [claimTransfer]);

  const toggle = (category: MetadataCategory) => setSelected((current) => {
    const next = new Set(current);
    if (next.has(category)) next.delete(category); else next.add(category);
    return next;
  });

  const clean = async () => {
    if (!bytes || !inspection) return;
    const task = ++taskRef.current;
    setBusy(true); setError(null);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    if (task !== taskRef.current) return;
    try {
      const cleaned = cleanMetadata(bytes, inspection.detectedMime, [...selected]);
      const blob = new Blob([cleaned.bytes.slice().buffer], { type: inspection.detectedMime });
      setResult({ ...cleaned, blob });
      setStep(3);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "선택한 메타데이터를 정리할 수 없습니다.");
    } finally { if (task === taskRef.current) setBusy(false); }
  };

  const download = () => {
    if (!result || !inspection) return;
    const format = inspection.format === "jpeg" ? "jpeg" : inspection.format;
    if (!safeDownload(result.blob, createOutputFilename("photo-privacy-cleaner", format))) setError("브라우저가 다운로드를 차단했습니다. 다운로드 허용 후 다시 시도해 주세요.");
  };

  const reset = () => {
    taskRef.current += 1; setFile(null); setBytes(null); setInspection(null); setSelected(new Set()); setResult(null); setError(null); setBusy(false); setStep(1);
  };

  return <section className="workspace" aria-label="사진 개인정보 메타데이터 정리 도구">
    <ToolStepper step={step} />
    <div className="workspace-body" aria-live="polite">
      {step === 1 && <UploadPanel onFile={choose} error={error} busy={busy} />}
      {step === 2 && file && inspection && <div className="privacy-workspace">
        <div className="success-box"><FileCheck2 size={19} /><div><strong>{file.name.replace(/[<>]/g, "")}</strong><br />실제 형식 {inspection.format.toUpperCase()} · {formatBytes(file.size)} · 압축 픽셀은 다시 인코딩하지 않습니다.</div></div>
        {!inspection.mimeMatchesSignature && <div className="error-box" role="alert">MIME 표시와 실제 파일 형식이 다릅니다. 신뢰할 수 있는 앱에서 다시 저장해 주세요.</div>}
        {inspection.hasProvenance && <div className="warning-box"><ShieldAlert size={19} /><div><strong>콘텐츠 출처 정보가 감지되었습니다.</strong><br />{inspection.provenance.map((item) => item.label).join(", ")}은 제거 대상으로 제공하지 않습니다. 파일 바이트가 바뀌면 자격 증명이 유효하지 않게 될 수 있습니다.</div></div>}
        <div className="control-card"><h3><Trash2 size={18} />제거할 개인정보 선택</h3>{inspection.fields.length === 0 ? <div className="info-box"><Info size={18} />알려진 개인정보성 메타데이터를 찾지 못했습니다. 알 수 없는 제조사 전용 정보까지 없다고 보장하지는 않습니다.</div> : <div className="metadata-grid">{METADATA_CATEGORIES.filter((category) => inspection.categories.includes(category)).map((category) => {
          const fields = inspection.fields.filter((field) => field.category === category);
          return <label className="metadata-option" key={category}><input type="checkbox" checked={selected.has(category)} onChange={() => toggle(category)} /><span><strong>{categoryCopy[category].label}</strong><span>{categoryCopy[category].description}</span>{fields.length > 0 && <ul className="found-values">{fields.slice(0, 3).map((field) => <li key={field.id}>{field.label}{field.value ? `: ${field.value}` : ""}</li>)}</ul>}</span></label>;
        })}</div>}</div>
        <div className="control-card"><h3><LockKeyhole size={18} />다운로드 전에 확인</h3><div className="check-list"><div className="check-item pass"><span className="check-icon"><Check size={14} /></span><div><strong>픽셀 재인코딩 없음</strong><span>JPEG scan, PNG IDAT 또는 WebP 이미지 payload를 그대로 유지합니다.</span></div></div><div className="check-item pass"><span className="check-icon"><Check size={14} /></span><div><strong>보존 시도</strong><span>방향·DPI·ICC 색상 프로필·알파와 알려진 출처 데이터는 선택 대상에서 제외합니다.</span></div></div><div className="check-item info"><span className="check-icon"><Info size={14} /></span><div><strong>화질 변화 예상 없음</strong><span>메타데이터 구역만 수정하지만 모든 비식별성과 자격 증명 유효성을 보장하지 않습니다.</span></div></div></div></div>
        {error && <div className="error-box" role="alert">{error}</div>}
        {busy && <div className="progress-wrap" aria-busy="true"><div className="progress-track"><div className="progress-bar" style={{ width: "70%" }} /></div><div className="progress-label">선택 필드를 제거하고 파일을 다시 검사하고 있어요…</div><button className="button ghost" type="button" onClick={() => { taskRef.current += 1; setBusy(false); }} style={{ marginTop: ".5rem" }}><X size={16} />처리 취소</button></div>}
        <div className="editor-actions"><button className="button ghost" type="button" onClick={reset}>다른 사진 선택</button><button className="button primary" type="button" disabled={busy || (inspection.fields.length > 0 && selected.size === 0)} onClick={() => void clean()}>선택 정보 정리</button></div>
      </div>}
      {step === 3 && result && inspection && <div className="result-grid">
        <div className="result-preview"><span className="icon-well" style={{ margin: "2rem auto" }}><FileCheck2 size={28} /></span><h2 style={{ margin: 0 }}>재검사 완료</h2><dl><div><dt>원본</dt><dd>{formatBytes(result.report.inputBytes)}</dd></div><div><dt>결과</dt><dd>{formatBytes(result.report.outputBytes)}</dd></div><div><dt>픽셀 재인코딩</dt><dd>없음</dd></div><div><dt>화질 변화 예상</dt><dd>없음</dd></div></dl></div>
        <div className="result-panel"><span className="eyebrow">선택 항목 재검사</span><h2>{result.report.removedFields.length > 0 ? `${result.report.removedFields.length}개 필드를 정리했습니다.` : "제거할 알려진 필드가 없었습니다."}</h2><p>원본을 덮어쓰지 않고 새 파일로 저장합니다.</p><div className="check-list"><div className="check-item pass"><span className="check-icon"><Check size={14} /></span><div><strong>압축 픽셀 payload 유지</strong><span>파일을 재인코딩하지 않았습니다.</span></div></div><div className={`check-item ${result.report.remainingSelectedCategories.length === 0 ? "pass" : "warning"}`}><span className="check-icon">{result.report.remainingSelectedCategories.length === 0 ? <Check size={14} /> : <ShieldAlert size={14} />}</span><div><strong>선택 항목 재검사</strong><span>{result.report.remainingSelectedCategories.length === 0 ? "선택한 범주의 알려진 필드가 남지 않았습니다." : `${result.report.remainingSelectedCategories.map((item) => categoryCopy[item].label).join(", ")} 일부가 안전상 남아 있습니다.`}</span></div></div><div className="check-item info"><span className="check-icon"><Info size={14} /></span><div><strong>방향·DPI·ICC·알파</strong><span>{result.report.preservation.orientationPreserved && result.report.preservation.densityPreserved && result.report.preservation.colorProfilePreserved && result.report.preservation.alphaPreserved ? "감지된 보존 대상의 바이트 지문이 유지됐습니다." : "일부 보존 항목을 확인하지 못했습니다. 다운로드 후 표시를 확인하세요."}</span></div></div></div>{result.report.provenanceMayBeInvalidated && <div className="warning-box">출처 정보 바이트를 제거하지 않았지만 파일 변경으로 콘텐츠 자격 증명이 유효하지 않게 될 수 있습니다.</div>}{result.report.warnings.map((warning) => <div className="warning-box" key={warning} style={{ marginTop: ".5rem" }}>{warning}</div>)}{error && <div className="error-box" role="alert">{error}</div>}<div className="result-actions"><button className="button primary" type="button" onClick={download}><Download size={18} />정리된 파일 다운로드</button><button className="button ghost" type="button" onClick={() => setStep(2)}>선택 바꾸기</button><button className="button ghost" type="button" onClick={reset}>처음부터 다시</button></div>{tool && <NextToolActions sourceToolId={tool.id} targetIds={tool.nextToolIds} asset={result.blob} filename={createOutputFilename("photo-privacy-cleaner", inspection.format === "jpeg" ? "jpeg" : inspection.format)} />}</div>
      </div>}
    </div>
  </section>;
}
