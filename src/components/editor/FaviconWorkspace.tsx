/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import { Download, PackageCheck, Palette, Sparkles, X } from "lucide-react";
import { generateFaviconPackage, rasterizeFaviconPng, REQUIRED_PACKAGE_FILES, type FaviconTheme, type GeneratedFaviconPackage } from "@/features/favicon";
import { createOutputFilename, safeDownload } from "@/lib/files/names";
import { validateImageFile } from "@/lib/files/validation";
import { decodeImage, type DecodedImage } from "@/lib/image/decode";
import { ToolStepper } from "./ToolStepper";
import { UploadPanel } from "./UploadPanel";
import { useImageTransfer } from "@/components/session/ImageTransferProvider";
import { NextToolActions } from "@/components/result/NextToolActions";
import { getClientTool } from "@/config/client-tools";

const themes: Array<{ id: FaviconTheme; label: string; description: string }> = [
  { id: "fill", label: "꽉 채우기", description: "중앙을 정사각형으로 자릅니다." },
  { id: "safe-padding", label: "안전 여백", description: "가장자리 16% 여백을 둡니다." },
  { id: "circle", label: "원형 배경", description: "단색 원 안에 배치합니다." },
  { id: "rounded", label: "둥근 사각형", description: "둥근 단색 배경을 씁니다." },
  { id: "transparent", label: "투명 배경", description: "원본 투명도를 유지합니다." },
  { id: "solid", label: "단색 배경", description: "빈 곳을 단색으로 채웁니다." },
];

export function FaviconWorkspace() {
  const { claimTransfer } = useImageTransfer();
  const tool = getClientTool("favicon-maker");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [decoded, setDecoded] = useState<DecodedImage | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [theme, setTheme] = useState<FaviconTheme>("safe-padding");
  const [color, setColor] = useState("#14213d");
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [result, setResult] = useState<GeneratedFaviconPackage | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const taskRef = useRef(0);
  const decodedRef = useRef<DecodedImage | null>(null);
  const sourceUrlRef = useRef<string | null>(null);
  const chooseRef = useRef<(file: File) => Promise<void>>(async () => undefined);
  const claimedRef = useRef(false);

  useEffect(() => () => {
    decodedRef.current?.close();
    if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
    abortRef.current?.abort();
  }, []);

  useEffect(() => {
    if (!decoded) return;
    let cancelled = false;
    void Promise.all([16, 32, 48].map(async (size) => {
      const blob = await rasterizeFaviconPng(decoded.source, size as 16 | 32 | 48, { theme, backgroundColor: color });
      const bitmap = await createImageBitmap(blob);
      if (!cancelled) {
        const canvas = document.querySelector<HTMLCanvasElement>(`canvas[data-favicon-size="${size}"]`);
        const context = canvas?.getContext("2d");
        if (canvas && context) { canvas.width = size; canvas.height = size; context.clearRect(0, 0, size, size); context.drawImage(bitmap, 0, 0); }
      }
      bitmap.close();
    })).catch(() => undefined);
    return () => { cancelled = true; };
  }, [color, decoded, theme]);

  const choose = async (nextFile: File) => {
    const task = ++taskRef.current;
    setBusy(true);
    setError(null);
    try {
      await validateImageFile(nextFile);
      const nextDecoded = await decodeImage(nextFile);
      if (task !== taskRef.current) { nextDecoded.close(); return; }
      decodedRef.current?.close();
      if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
      decodedRef.current = nextDecoded;
      const nextUrl = URL.createObjectURL(nextFile);
      sourceUrlRef.current = nextUrl;
      setDecoded(nextDecoded);
      setSourceUrl(nextUrl);
      setFile(nextFile);
      setResult(null);
      setStep(2);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "이미지를 열 수 없습니다.");
    } finally {
      if (task === taskRef.current) setBusy(false);
    }
  };
  useEffect(() => { chooseRef.current = choose; });
  useEffect(() => {
    if (claimedRef.current) return;
    claimedRef.current = true;
    const transferred = claimTransfer("favicon-maker");
    if (transferred) queueMicrotask(() => void chooseRef.current(transferred));
  }, [claimTransfer]);

  const build = async () => {
    if (!decoded) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setError(null);
    try {
      const packageResult = await generateFaviconPackage(decoded.source, { theme, backgroundColor: color, themeColor: color, name, shortName, signal: controller.signal });
      setResult(packageResult);
      setStep(3);
    } catch (caught) {
      if (!(caught instanceof DOMException && caught.name === "AbortError")) setError(caught instanceof Error ? caught.message : "ZIP 패키지를 만들 수 없습니다.");
    } finally { setBusy(false); }
  };

  const reset = () => {
    abortRef.current?.abort();
    decodedRef.current?.close();
    decodedRef.current = null;
    if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
    sourceUrlRef.current = null;
    setDecoded(null); setSourceUrl(null); setFile(null); setResult(null); setError(null); setStep(1);
  };

  return (
    <section className="workspace" aria-label="파비콘 패키지 생성 도구">
      <ToolStepper step={step} />
      <div className="workspace-body" aria-live="polite">
        {step === 1 && <UploadPanel onFile={choose} error={error} busy={busy} />}
        {step === 2 && decoded && sourceUrl && <div className="favicon-layout">
          <div>
            <div className="favicon-source"><img src={sourceUrl} alt="선택한 파비콘 원본" /></div>
            <div className="favicon-previews" aria-label="작은 크기 미리보기" style={{ marginTop: "1rem" }}>{[16,32,48].map((size) => <div className="favicon-preview" key={size}><canvas data-favicon-size={size} style={{ width: `${size}px`, height: `${size}px` }} aria-label={`${size}px 파비콘 예상 미리보기`} />{size}px</div>)}</div>
            <div className="warning-box" style={{ marginTop: "1rem" }}>복잡한 원본은 16px에서 알아보기 어려울 수 있습니다. 위 미리보기를 실제 크기로 확인하세요.</div>
          </div>
          <div className="control-panel">
            <div className="control-card"><h3><Sparkles size={17} />모양</h3><div className="variant-grid">{themes.map((item) => <button key={item.id} type="button" className={`variant-button ${theme === item.id ? "selected" : ""}`} onClick={() => setTheme(item.id)} aria-pressed={theme === item.id}><strong>{item.label}</strong><span>{item.description}</span></button>)}</div></div>
            <div className="control-card"><h3><Palette size={17} />배경과 앱 이름</h3><div className="field"><label htmlFor="favicon-color">배경색</label><input id="favicon-color" type="color" value={color} onChange={(event) => setColor(event.target.value)} /></div><div className="field" style={{ marginTop: ".75rem" }}><label htmlFor="app-name">사이트 이름 (선택)</label><input id="app-name" type="text" maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder="내 웹사이트" /></div><div className="field" style={{ marginTop: ".75rem" }}><label htmlFor="short-name">짧은 이름 (선택)</label><input id="short-name" type="text" maxLength={20} value={shortName} onChange={(event) => setShortName(event.target.value)} placeholder="웹사이트" /></div></div>
            <div className="info-box">SVG 입력은 스크립트·외부 참조 위험 때문에 현재 받지 않습니다. raster 이미지를 벡터로 변환했다고 표시하지 않습니다.</div>
            {error && <div className="error-box" role="alert">{error}</div>}
            {busy && <div className="progress-wrap" aria-busy="true"><div className="progress-track"><div className="progress-bar" style={{ width: "72%" }} /></div><div className="progress-label">PNG 6종과 ICO·ZIP을 기기 안에서 만들고 있어요…</div><button className="button ghost" type="button" onClick={() => abortRef.current?.abort()} style={{ marginTop: ".5rem" }}><X size={16} />처리 취소</button></div>}
            <div className="editor-actions"><button className="button ghost" type="button" onClick={() => file && void choose(file)}>원본으로 초기화</button><button className="button primary" type="button" disabled={busy} onClick={() => void build()}>패키지 만들기</button></div>
          </div>
        </div>}
        {step === 3 && result && <div className="result-grid">
          <div className="result-preview"><span className="icon-well" style={{ margin: "2rem auto" }}><PackageCheck size={28} /></span><h2 style={{ margin: "0" }}>ZIP 패키지</h2><p>{REQUIRED_PACKAGE_FILES.length}개 파일 · {(result.blob.size / 1024).toFixed(1)}KB</p><div className="check-list" style={{ textAlign: "left" }}>{REQUIRED_PACKAGE_FILES.map((filename) => <div className="check-item pass" key={filename}><span className="check-icon"><PackageCheck size={13} /></span><div><strong>{filename}</strong><span>생성 후 ZIP 내부 검증 완료</span></div></div>)}</div></div>
          <div className="result-panel"><span className="eyebrow">브라우저에서 패키징 완료</span><h2>웹사이트에 바로 설치하세요.</h2><p>ICO는 16·32·48px 이미지를 포함하며 PNG, manifest와 설치 안내를 함께 담았습니다.</p><div className="success-box"><PackageCheck size={18} /><div>각 PNG의 실제 치수와 필수 파일 존재 여부를 생성 과정에서 다시 확인했습니다.</div></div><div className="control-card" style={{ marginTop: "1rem" }}><h3>설치 코드</h3><pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontSize: ".75rem", color: "#526176" }}>{result.installationHtml}</pre></div><div className="result-actions"><button className="button primary" type="button" onClick={() => safeDownload(result.blob, createOutputFilename("favicon-maker", "zip"))}><Download size={18} />ZIP 다운로드</button><button className="button ghost" type="button" onClick={() => setStep(2)}>다시 조정</button><button className="button ghost" type="button" onClick={reset}>처음부터 다시</button></div>{file && tool && <NextToolActions sourceToolId={tool.id} targetIds={tool.nextToolIds} asset={file} filename={file.name} />}</div>
        </div>}
      </div>
    </section>
  );
}
