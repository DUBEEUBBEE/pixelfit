/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type CSSProperties, type ReactNode } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, Download, ImagePlus, LockKeyhole, Package, RotateCcw, X } from "lucide-react";
import { layoutFourCut, mapFourCutSources, socialOutputSpecs, type SocialOutputId } from "@/features/creative-tools/core";
import { calculateCropPreviewLayout } from "@/features/creative-tools/preview";
import type { FilmPhotoOptions } from "@/features/film-photo/types";
import { FILM_DEFAULT_PRESET, FILM_ORIGINAL_SETTINGS } from "@/features/film-photo/presets";
import { FOUR_CUT_SPECS, moveFourCutOrder } from "@/features/four-cut-photo/helpers";
import type { FourCutOrientation, FourCutTone } from "@/features/four-cut-photo/types";
import { SOCIAL_ZIP_FILENAME } from "@/features/social-image-pack/package";
import type { SocialImageResult } from "@/features/social-image-pack/types";
import { youtubeThumbnailTemplates } from "@/features/youtube-thumbnail/templates";
import type { ThumbnailTemplateId, ThumbnailTextAlign } from "@/features/youtube-thumbnail/types";
import { calculateThumbnailTextLayout } from "@/features/youtube-thumbnail/layout";
import { detectFaces, suggestTransformFromFace } from "@/features/face-detection/adapter";
import { safeDownload } from "@/lib/files/names";
import { formatBytes } from "@/lib/files/validation";
import { defaultCropTransform, type CropTransform } from "@/lib/image/geometry";
import { NextToolActions } from "@/components/result/NextToolActions";
import { useImageTransfer } from "@/components/session/ImageTransferProvider";
import { getClientTool } from "@/config/client-tools";
import { ToolStepper } from "./ToolStepper";
import { UploadPanel } from "./UploadPanel";
import { useInitialCreativeFile, useMultiCreativeImages, type CreativeImageAsset } from "./useCreativeImages";
import { useUtilityImage, useUtilityProcessor, useUtilityResult, type UtilityImageAsset, type UtilityResult } from "./useUtilityImage";

type RasterFormat = "jpeg" | "png";
type Step = 1 | 2 | 3;

export function CreativeWorkspace({ presetId, initialFile }: { presetId: string; initialFile?: File }) {
  const transferredFile = useIncomingCreativeTransfer(presetId, initialFile);
  const file = initialFile ?? transferredFile;
  if (presetId === "social-image-pack") return <SocialWorkspace initialFile={file} />;
  if (presetId === "youtube-thumbnail") return <ThumbnailWorkspace initialFile={file} />;
  if (presetId === "four-cut-photo") return <FourCutWorkspace initialFile={file} />;
  if (presetId === "film-photo") return <FilmWorkspace initialFile={file} />;
  throw new Error(`지원하지 않는 크리에이티브 도구입니다: ${presetId}`);
}

function SocialWorkspace({ initialFile }: { initialFile?: File }) {
  const image = useUtilityImage();
  const processor = useUtilityProcessor();
  const generated = useSocialGenerated();
  const [step, setStep] = useState<Step>(1);
  const [activeId, setActiveId] = useState<SocialOutputId>("square");
  const [selected, setSelected] = useState<Set<SocialOutputId>>(new Set(["square", "portrait", "story"]));
  const [crops, setCrops] = useState<Record<SocialOutputId, CropTransform>>({
    square: { ...defaultCropTransform }, portrait: { ...defaultCropTransform }, story: { ...defaultCropTransform },
  });
  const [format, setFormat] = useState<RasterFormat>("jpeg");
  const [quality, setQuality] = useState(.9);
  const [subjectMessage, setSubjectMessage] = useState("지원 브라우저에서는 한 명의 얼굴 후보를 기기 안에서 찾아 초기 위치를 제안합니다.");
  const subjectTaskRef = useRef(0);
  const cropTouchedRef = useRef(false);

  const choose = async (file: File) => {
    const subjectTask = ++subjectTaskRef.current;
    processor.cancel(); generated.clear();
    const asset = await image.choose(file);
    if (!asset) return;
    cropTouchedRef.current = false;
    setCrops({ square: { ...defaultCropTransform }, portrait: { ...defaultCropTransform }, story: { ...defaultCropTransform } });
    setSubjectMessage("기기 내 얼굴 후보를 확인하고 있습니다…");
    setStep(2);
    void detectFaces(file).then((detection) => {
      if (subjectTask !== subjectTaskRef.current) return;
      setSubjectMessage(detection.message);
      if (!cropTouchedRef.current && detection.status === "available" && detection.faces.length === 1) {
        const suggestion = suggestTransformFromFace(detection.faces[0], asset.decoded.width, asset.decoded.height);
        setCrops({ square: { ...defaultCropTransform, ...suggestion }, portrait: { ...defaultCropTransform, ...suggestion }, story: { ...defaultCropTransform, ...suggestion } });
      }
    }).catch(() => {
      if (subjectTask === subjectTaskRef.current) setSubjectMessage("자동 배치를 사용할 수 없습니다. 비율별로 직접 위치를 맞춰 주세요.");
    });
  };
  useInitialCreativeFile(initialFile, choose);

  const updateCrop = (update: Partial<CropTransform>) => {
    cropTouchedRef.current = true;
    setCrops((current) => ({ ...current, [activeId]: { ...current[activeId], ...update } }));
  };
  const toggleSelected = (id: SocialOutputId) => setSelected((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const createResults = async () => {
    const asset = image.asset;
    const ids = (["square", "portrait", "story"] as const).filter((id) => selected.has(id));
    if (!asset || ids.length === 0) { processor.setError("만들 결과를 하나 이상 선택해 주세요."); return; }
    const results = await processor.run(async (signal, onProgress) => {
      const { renderSocialImage } = await import("@/features/social-image-pack/render");
      const items: SocialImageResult[] = [];
      for (let index = 0; index < ids.length; index += 1) {
        items.push(await renderSocialImage(asset.decoded.source, { width: asset.decoded.width, height: asset.decoded.height }, ids[index], crops[ids[index]], { format, quality, signal }));
        onProgress(((index + 1) / ids.length) * 100);
      }
      return items;
    });
    if (!results) return;
    generated.set(results);
    setStep(3);
  };

  const reset = () => { subjectTaskRef.current += 1; processor.cancel(); generated.clear(); image.reset(); setStep(1); };
  const activeSpec = socialOutputSpecs[activeId];
  const crop = crops[activeId];

  return <Workspace title="SNS 이미지 세트" step={step}>
    {step === 1 && <UploadPanel onFile={choose} error={image.error} busy={image.busy} />}
    {step === 2 && image.asset && <EditorLayout>
      <div className="preview-column">
        <CropPreview asset={image.asset} crop={crop} output={{ width: activeSpec.width, height: activeSpec.height }} label={`${activeSpec.label} 크롭 예상`} safe={activeId === "story"} circle={activeId === "square"} />
        <div className="preview-caption"><span>{activeSpec.width}×{activeSpec.height}px</span><span>{activeSpec.note}</span></div>
      </div>
      <div className="control-panel">
        <div className="control-card"><h3>결과별 독립 크롭</h3><div className="variant-grid">{(["square", "portrait", "story"] as const).map((id) => <button type="button" key={id} className={`variant-button ${activeId === id ? "selected" : ""}`} aria-pressed={activeId === id} onClick={() => setActiveId(id)}><strong>{socialOutputSpecs[id].label}</strong><span>{socialOutputSpecs[id].width}×{socialOutputSpecs[id].height}px</span></button>)}</div></div>
        <CropControls idPrefix="social" crop={crop} onChange={updateCrop} />
        <div className="control-card"><h3>다운로드할 결과 선택</h3>{(["square", "portrait", "story"] as const).map((id) => <label className="metadata-option" key={id} style={{ marginTop: ".4rem" }}><input type="checkbox" checked={selected.has(id)} onChange={() => toggleSelected(id)} /><span><strong>{socialOutputSpecs[id].label}</strong><span>{socialOutputSpecs[id].note}</span></span></label>)}</div>
        <RasterFormatControls format={format} onChange={setFormat} quality={quality} onQuality={setQuality} idPrefix="social" />
        <div className="info-box">{subjectMessage} 자동 후보는 시작점일 뿐이며 각 비율의 잘림을 직접 확인해야 합니다.</div>
        <div className="info-box"><LockKeyhole size={18} aria-hidden="true" /><div>각 결과는 순서대로 생성해 모바일 메모리 사용을 줄입니다. 원형 표시는 프로필 잘림 예상이며 실제 플랫폼 노출을 보장하지 않습니다.</div></div>
        <ProcessingState {...processor} />
        <div className="editor-actions"><button className="button ghost" type="button" onClick={reset}>다른 사진 선택</button><button className="button primary" type="button" disabled={processor.busy || selected.size === 0} onClick={() => void createResults()}>선택 이미지 만들기</button></div>
      </div>
    </EditorLayout>}
    {step === 3 && image.asset && <SocialResultView asset={image.asset} results={generated.results} processor={processor} onBack={() => setStep(2)} onReset={reset} />}
  </Workspace>;
}

function ThumbnailWorkspace({ initialFile }: { initialFile?: File }) {
  const image = useUtilityImage();
  const generated = useUtilityResult();
  const processor = useUtilityProcessor();
  const [step, setStep] = useState<Step>(1);
  const [template, setTemplate] = useState<ThumbnailTemplateId>("editorial-left");
  const [title, setTitle] = useState("한눈에 이해되는 제목");
  const [subtitle, setSubtitle] = useState("짧은 보조 문구를 입력하세요");
  const [crop, setCrop] = useState<CropTransform>({ ...defaultCropTransform });
  const [titleSize, setTitleSize] = useState(210);
  const [accentColor, setAccentColor] = useState("#ff725e");
  const [align, setAlign] = useState<ThumbnailTextAlign>("left");
  const [format, setFormat] = useState<RasterFormat>("jpeg");
  const [quality, setQuality] = useState(.92);

  const choose = async (file: File) => {
    processor.cancel(); generated.clearResult();
    const asset = await image.choose(file);
    if (!asset) return;
    setCrop({ ...defaultCropTransform }); setStep(2);
  };
  useInitialCreativeFile(initialFile, choose);

  const createResult = async () => {
    const asset = image.asset;
    if (!asset) return;
    const result = await processor.run((signal, onProgress) => {
      onProgress(12);
      return import("@/features/youtube-thumbnail/render")
        .then(({ renderYoutubeThumbnail }) => renderYoutubeThumbnail(asset.decoded.source, { width: asset.decoded.width, height: asset.decoded.height }, { template, title, subtitle, crop, titleSize, accentColor, align, format, quality, signal }))
        .then((value) => { onProgress(100); return value; });
    });
    if (!result) return;
    generated.setResult({
      blob: result.blob, filename: result.filename, width: result.width, height: result.height, format: result.format, warnings: [],
      facts: [
        { label: "출력 크기", value: `${result.width}×${result.height}px · 16:9` },
        { label: "실제 용량", value: formatBytes(result.blob.size) },
        { label: "파일 형식", value: formatLabel(result.format) },
        { label: "제목 줄 수", value: `${result.titleLines.length}줄 (최대 2줄)` },
        { label: "템플릿", value: youtubeThumbnailTemplates[template].label },
        { label: "검증", value: "MIME·서명·픽셀 재검사 완료" },
      ],
    });
    setStep(3);
  };
  const reset = () => { processor.cancel(); generated.clearResult(); image.reset(); setStep(1); };

  return <Workspace title="유튜브 썸네일" step={step}>
    {step === 1 && <UploadPanel onFile={choose} error={image.error} busy={image.busy} />}
    {step === 2 && image.asset && <EditorLayout>
      <div className="preview-column"><ThumbnailPreview asset={image.asset} crop={crop} template={template} title={title} subtitle={subtitle} titleSize={titleSize} align={align} accentColor={accentColor} /><div style={{ width: "min(250px, 70%)", margin: "1rem auto 0" }}><ThumbnailPreview asset={image.asset} crop={crop} template={template} title={title} subtitle={subtitle} titleSize={titleSize} align={align} accentColor={accentColor} compact /><p style={{ textAlign: "center", fontSize: ".75rem", color: "var(--muted)" }}>모바일 작은 화면 예상</p></div></div>
      <div className="control-panel">
        <div className="control-card"><h3>완성형 템플릿 4종</h3><div className="variant-grid">{(Object.entries(youtubeThumbnailTemplates) as Array<[ThumbnailTemplateId, (typeof youtubeThumbnailTemplates)[ThumbnailTemplateId]]>).map(([id, item]) => <button type="button" key={id} className={`variant-button ${template === id ? "selected" : ""}`} aria-pressed={template === id} onClick={() => { setTemplate(id); setAlign(item.defaultAlign); }}><strong>{item.label}</strong><span>{item.description}</span></button>)}</div></div>
        <div className="control-card"><div className="field"><label htmlFor="thumbnail-title">제목</label><input id="thumbnail-title" type="text" maxLength={60} value={title} onChange={(event) => setTitle(event.target.value)} /></div><div className="field" style={{ marginTop: ".7rem" }}><label htmlFor="thumbnail-subtitle">짧은 보조 문구</label><input id="thumbnail-subtitle" type="text" maxLength={90} value={subtitle} onChange={(event) => setSubtitle(event.target.value)} /></div></div>
        <CropControls idPrefix="thumbnail" crop={crop} onChange={(update) => setCrop((current) => ({ ...current, ...update }))} />
        <div className="control-card"><h3>사진 빠른 배치</h3><div className="format-row"><button className="button secondary" type="button" onClick={() => setCrop((current) => ({ ...current, offsetX: -.45 }))}>왼쪽</button><button className="button secondary" type="button" onClick={() => setCrop((current) => ({ ...current, offsetX: 0 }))}>중앙</button><button className="button secondary" type="button" onClick={() => setCrop((current) => ({ ...current, offsetX: .45 }))}>오른쪽</button></div></div>
        <div className="control-card"><div className="range-row"><label htmlFor="thumbnail-title-size">제목 크기 <span>{titleSize}px</span></label><input id="thumbnail-title-size" type="range" min="110" max="300" step="5" value={titleSize} onChange={(event) => setTitleSize(Number(event.target.value))} /></div><div className="field" style={{ marginTop: ".8rem" }}><label htmlFor="thumbnail-accent">강조 색상</label><input id="thumbnail-accent" type="color" value={accentColor} onChange={(event) => setAccentColor(event.target.value)} /></div><div className="format-row" style={{ marginTop: ".8rem" }}>{(["left", "center", "right"] as const).map((item) => <button key={item} type="button" className={`segmented ${align === item ? "selected" : ""}`} aria-pressed={align === item} onClick={() => setAlign(item)}>{item === "left" ? "왼쪽" : item === "center" ? "가운데" : "오른쪽"}</button>)}</div></div>
        <RasterFormatControls format={format} onChange={setFormat} quality={quality} onQuality={setQuality} idPrefix="thumbnail" />
        <div className="info-box">노란 점선 안에 핵심 텍스트를 두는 안전영역 예상입니다. 범용 레이어 편집기나 생성형 AI를 사용하지 않습니다.</div>
        <ProcessingState {...processor} />
        <div className="editor-actions"><button className="button ghost" type="button" onClick={reset}>다른 사진 선택</button><button className="button primary" type="button" disabled={processor.busy || !title.trim()} onClick={() => void createResult()}>3840×2160 썸네일 만들기</button></div>
      </div>
    </EditorLayout>}
    {step === 3 && image.asset && generated.result && <SingleResult toolId="youtube-thumbnail" title="4K 16:9 썸네일을 만들었습니다." asset={image.asset} result={generated.result} onBack={() => setStep(2)} onReset={reset} error={processor.error} onError={processor.setError} />}
  </Workspace>;
}

function FourCutWorkspace({ initialFile }: { initialFile?: File }) {
  const images = useMultiCreativeImages();
  const generated = useUtilityResult();
  const processor = useUtilityProcessor();
  const [step, setStep] = useState<Step>(1);
  const [orientation, setOrientation] = useState<FourCutOrientation>("vertical");
  const [tone, setTone] = useState<FourCutTone>("original");
  const [frameColor, setFrameColor] = useState("#f8f3e9");
  const [dateText, setDateText] = useState("");
  const [caption, setCaption] = useState("");
  const [order, setOrder] = useState([0, 0, 0, 0]);
  const [crops, setCrops] = useState<CropTransform[]>(Array.from({ length: 4 }, () => ({ ...defaultCropTransform })));
  const [activeSlot, setActiveSlot] = useState(0);
  const [format, setFormat] = useState<RasterFormat>("jpeg");
  const [quality, setQuality] = useState(.92);

  const chooseFiles = async (files: readonly File[]) => {
    processor.cancel(); generated.clearResult();
    const assets = await images.chooseFiles(files);
    if (!assets) return;
    setOrder(mapFourCutSources(assets.length));
    setCrops(Array.from({ length: 4 }, () => ({ ...defaultCropTransform })));
    setActiveSlot(0); setStep(2);
  };
  useInitialCreativeFile(initialFile, (file) => chooseFiles([file]));

  const updateCrop = (update: Partial<CropTransform>) => setCrops((current) => current.map((crop, index) => index === activeSlot ? { ...crop, ...update } : crop));
  const createResult = async () => {
    if (images.assets.length === 0) return;
    const result = await processor.run(async (signal, onProgress) => {
      onProgress(6);
      const { renderFourCutPhoto } = await import("@/features/four-cut-photo/render");
      return renderFourCutPhoto(images.assets.map((asset) => ({ dimensions: asset.dimensions, file: asset.file })), { orientation, tone, frameColor, dateText, caption, order, crops, format, quality, signal, onProgress });
    });
    if (!result) return;
    generated.setResult({
      blob: result.blob, filename: result.filename, width: result.width, height: result.height, format: result.format,
      warnings: ["이 결과는 공식 제출 규격이 아닌 픽셀핏 디지털 공유용 서비스 프리셋입니다."],
      facts: [
        { label: "서비스 프리셋", value: FOUR_CUT_SPECS[orientation].label },
        { label: "입력 사진", value: `${images.assets.length}장 · 네 칸 순환 배치` },
        { label: "톤", value: tone === "original" ? "원본 색상" : tone === "mono" ? "흑백" : "빈티지 포토부스" },
        { label: "파일 용량", value: formatBytes(result.blob.size) },
        { label: "파일 형식", value: formatLabel(result.format) },
        { label: "실제 파일", value: "서명·MIME·픽셀 재검사 완료" },
      ],
    });
    setStep(3);
  };
  const reset = () => { processor.cancel(); generated.clearResult(); images.reset(); setStep(1); };

  return <Workspace title="네컷사진" step={step}>
    {step === 1 && <MultiImageUpload onFiles={chooseFiles} busy={images.busy} error={images.error} />}
    {step === 2 && images.assets.length > 0 && <EditorLayout>
      <div className="preview-column"><FourCutPreview assets={images.assets} order={order} crops={crops} orientation={orientation} frameColor={frameColor} tone={tone} activeSlot={activeSlot} onActive={setActiveSlot} /><p className="local-note"><LockKeyhole size={15} />사진 {images.assets.length}장은 현재 탭 메모리에서만 네 칸에 순환 배치됩니다.</p></div>
      <div className="control-panel">
        <div className="control-card"><h3>서비스 레이아웃</h3><div className="variant-grid">{(["vertical", "horizontal"] as const).map((item) => <button key={item} type="button" className={`variant-button ${orientation === item ? "selected" : ""}`} aria-pressed={orientation === item} onClick={() => setOrientation(item)}><strong>{item === "vertical" ? "세로 네컷" : "가로 네컷"}</strong><span>{FOUR_CUT_SPECS[item].width}×{FOUR_CUT_SPECS[item].height}px</span></button>)}</div></div>
        <div className="control-card"><h3>조정할 칸</h3><div className="format-row">{order.map((sourceIndex, index) => <button type="button" key={index} className={`segmented ${activeSlot === index ? "selected" : ""}`} aria-pressed={activeSlot === index} onClick={() => setActiveSlot(index)}>{index + 1}칸</button>)}</div><p style={{ fontSize: ".78rem", color: "var(--muted)" }}>현재 {order[activeSlot] + 1}번 사진: {images.assets[order[activeSlot]]?.file.name}</p><div className="format-row"><button className="button secondary" type="button" disabled={activeSlot === 0} onClick={() => setOrder((current) => moveFourCutOrder(current, activeSlot, -1))}><ArrowUp size={16} />앞으로</button><button className="button secondary" type="button" disabled={activeSlot === 3} onClick={() => setOrder((current) => moveFourCutOrder(current, activeSlot, 1))}><ArrowDown size={16} />뒤로</button></div></div>
        <CropControls idPrefix="four-cut" crop={crops[activeSlot]} onChange={updateCrop} />
        <div className="control-card"><h3>포토부스 톤</h3><div className="format-row">{(["original", "mono", "vintage"] as const).map((item) => <button key={item} type="button" className={`segmented ${tone === item ? "selected" : ""}`} aria-pressed={tone === item} onClick={() => setTone(item)}>{item === "original" ? "원본" : item === "mono" ? "흑백" : "빈티지"}</button>)}</div><div className="field" style={{ marginTop: ".7rem" }}><label htmlFor="four-cut-frame">프레임 색상</label><input id="four-cut-frame" type="color" value={frameColor} onChange={(event) => setFrameColor(event.target.value)} /></div></div>
        <div className="control-card"><div className="field"><label htmlFor="four-cut-date">날짜 (선택)</label><input id="four-cut-date" type="date" value={dateText} onChange={(event) => setDateText(event.target.value)} /></div><div className="field" style={{ marginTop: ".7rem" }}><label htmlFor="four-cut-caption">짧은 문구 (선택)</label><input id="four-cut-caption" type="text" maxLength={40} value={caption} onChange={(event) => setCaption(event.target.value)} /></div></div>
        <RasterFormatControls format={format} onChange={setFormat} quality={quality} onQuality={setQuality} idPrefix="four-cut" />
        <div className="info-box">인쇄 승인이나 공식 규격이 아닌 디지털 공유용 서비스 프리셋입니다. 순서 버튼은 키보드로도 사용할 수 있습니다.</div>
        <ProcessingState {...processor} />
        <div className="editor-actions"><button className="button ghost" type="button" onClick={reset}>사진 다시 선택</button><button className="button primary" type="button" disabled={processor.busy} onClick={() => void createResult()}>네컷사진 만들기</button></div>
      </div>
    </EditorLayout>}
    {step === 3 && images.assets[0] && generated.result && <SingleResult toolId="four-cut-photo" title="네 칸을 실제 이미지로 만들었습니다." asset={images.assets[0]} result={generated.result} onBack={() => setStep(2)} onReset={reset} error={processor.error} onError={processor.setError} />}
  </Workspace>;
}

function FilmWorkspace({ initialFile }: { initialFile?: File }) {
  const image = useUtilityImage();
  const generated = useUtilityResult();
  const processor = useUtilityProcessor();
  const [step, setStep] = useState<Step>(1);
  const [mode, setMode] = useState<FilmPhotoOptions["mode"]>(FILM_DEFAULT_PRESET.mode);
  const [strength, setStrength] = useState(FILM_DEFAULT_PRESET.strength);
  const [grain, setGrain] = useState(FILM_DEFAULT_PRESET.grain);
  const [vignette, setVignette] = useState(FILM_DEFAULT_PRESET.vignette);
  const [lightLeak, setLightLeak] = useState(FILM_DEFAULT_PRESET.lightLeak);
  const [dateText, setDateText] = useState("");
  const [format, setFormat] = useState<RasterFormat>("jpeg");
  const [quality, setQuality] = useState(.92);

  const applyDefaultPreset = () => { setMode(FILM_DEFAULT_PRESET.mode); setStrength(FILM_DEFAULT_PRESET.strength); setGrain(FILM_DEFAULT_PRESET.grain); setVignette(FILM_DEFAULT_PRESET.vignette); setLightLeak(FILM_DEFAULT_PRESET.lightLeak); setDateText(FILM_DEFAULT_PRESET.dateText); };
  const resetToOriginal = () => { setMode(FILM_ORIGINAL_SETTINGS.mode); setStrength(FILM_ORIGINAL_SETTINGS.strength); setGrain(FILM_ORIGINAL_SETTINGS.grain); setVignette(FILM_ORIGINAL_SETTINGS.vignette); setLightLeak(FILM_ORIGINAL_SETTINGS.lightLeak); setDateText(FILM_ORIGINAL_SETTINGS.dateText); };
  const choose = async (file: File) => {
    processor.cancel(); generated.clearResult();
    const asset = await image.choose(file);
    if (!asset) return;
    applyDefaultPreset(); setStep(2);
  };
  useInitialCreativeFile(initialFile, choose);

  const createResult = async () => {
    const asset = image.asset;
    if (!asset) return;
    const result = await processor.run(async (signal, onProgress) => {
      const { renderFilmPhoto } = await import("@/features/film-photo/render");
      return renderFilmPhoto(asset.decoded.source, { width: asset.decoded.width, height: asset.decoded.height }, { sourceFile: asset.file, mode, strength, grain, vignette, lightLeak, dateText, format, quality, seed: 73421, signal, onProgress });
    });
    if (!result) return;
    generated.setResult({
      blob: result.blob, filename: result.filename, width: result.width, height: result.height, format: result.format,
      warnings: [
        ...(result.sourceDownscaled ? ["안정적인 로컬 처리를 위해 긴 변과 총 픽셀 상한 안에서 비율을 유지해 축소했습니다."] : []),
        "강한 색상 효과는 피부색이나 사진의 의미를 다르게 보이게 할 수 있으므로 원본과 비교하세요.",
      ],
      facts: [
        { label: "효과 모드", value: filmModeLabel(mode) },
        { label: "출력 크기", value: `${result.width}×${result.height}px` },
        { label: "파일 용량", value: formatBytes(result.blob.size) },
        { label: "결정적 처리", value: "동일 옵션·seed에서 동일 grain" },
        { label: "생성형 AI", value: "사용 안 함" },
        { label: "실제 파일", value: "서명·MIME·픽셀 재검사 완료" },
      ],
    });
    setStep(3);
  };
  const reset = () => { processor.cancel(); generated.clearResult(); image.reset(); setStep(1); };
  const previewFilter = mode === "mono" ? `grayscale(${strength}) contrast(${1 + strength * .08})` : mode === "low-saturation" ? `saturate(${1 - strength * .55}) sepia(${strength * .12})` : mode === "flash" ? `brightness(${1 + strength * .22}) contrast(${1 + strength * .08})` : `sepia(${strength * .08}) saturate(${1 + strength * .05})`;

  return <Workspace title="필름사진" step={step}>
    {step === 1 && <UploadPanel onFile={choose} error={image.error} busy={image.busy} />}
    {step === 2 && image.asset && <EditorLayout>
      <div className="preview-column"><div className="result-preview"><img src={image.asset.previewUrl} alt="필름 효과 예상 미리보기" style={{ filter: previewFilter }} /><p style={{ fontSize: ".78rem", color: "var(--muted)" }}>빠른 색감 예상입니다. grain·비네팅·빛샘은 파일 생성 후 정확히 확인합니다.</p></div></div>
      <div className="control-panel">
        <div className="control-card"><h3>필름 모드</h3><div className="variant-grid">{(["color", "mono", "low-saturation", "flash"] as const).map((item) => <button key={item} type="button" className={`variant-button ${mode === item ? "selected" : ""}`} aria-pressed={mode === item} onClick={() => setMode(item)}><strong>{filmModeLabel(item)}</strong><span>{item === "color" ? "따뜻한 컬러 필름" : item === "mono" ? "결정적 흑백 변환" : item === "low-saturation" ? "차분한 저채도" : "밝은 플래시 카메라"}</span></button>)}</div></div>
        <RangeControl id="film-strength" label="전체 강도" value={strength} onChange={setStrength} />
        <RangeControl id="film-grain" label="필름 그레인" value={grain} onChange={setGrain} />
        <RangeControl id="film-vignette" label="비네팅" value={vignette} onChange={setVignette} />
        <RangeControl id="film-light-leak" label="빛샘" value={lightLeak} onChange={setLightLeak} />
        <div className="control-card"><div className="field"><label htmlFor="film-date">날짜 스탬프 (선택)</label><input id="film-date" type="date" value={dateText} onChange={(event) => setDateText(event.target.value)} /></div></div>
        <RasterFormatControls format={format} onChange={setFormat} quality={quality} onQuality={setQuality} idPrefix="film" />
        <div className="warning-box">생성형 AI를 사용하지 않는 결정적 픽셀 필터입니다. 과도한 효과는 피부색과 장면의 의미를 왜곡할 수 있습니다.</div>
        <ProcessingState {...processor} />
        <div className="editor-actions"><button className="button ghost" type="button" onClick={resetToOriginal}><RotateCcw size={16} />원본으로 초기화</button><button className="button ghost" type="button" onClick={reset}>다른 사진</button><button className="button primary" type="button" disabled={processor.busy} onClick={() => void createResult()}>필름사진 만들기</button></div>
      </div>
    </EditorLayout>}
    {step === 3 && image.asset && generated.result && <SingleResult toolId="film-photo" title="결정적 필름 효과를 적용했습니다." asset={image.asset} result={generated.result} onBack={() => setStep(2)} onReset={reset} error={processor.error} onError={processor.setError} />}
  </Workspace>;
}

function Workspace({ title, step, children }: { title: string; step: Step; children: ReactNode }) { return <section className="workspace" aria-label={`${title} 제작 도구`}><ToolStepper step={step} /><div className="workspace-body" aria-live="polite">{children}</div></section>; }
function EditorLayout({ children }: { children: ReactNode }) { return <div className="editor-grid">{children}</div>; }

function CropControls({ idPrefix, crop, onChange }: { idPrefix: string; crop: CropTransform; onChange: (update: Partial<CropTransform>) => void }) {
  return <div className="control-card"><h3>위치와 확대</h3><div className="range-row"><label htmlFor={`${idPrefix}-zoom`}>확대 <span>{Math.round(crop.zoom * 100)}%</span></label><input id={`${idPrefix}-zoom`} type="range" min="1" max="3" step="0.01" value={crop.zoom} onChange={(event) => onChange({ zoom: Number(event.target.value) })} /></div><div className="range-row" style={{ marginTop: ".7rem" }}><label htmlFor={`${idPrefix}-x`}>가로 위치 <span>{Math.round(crop.offsetX * 100)}</span></label><input id={`${idPrefix}-x`} type="range" min="-1" max="1" step="0.01" value={crop.offsetX} onChange={(event) => onChange({ offsetX: Number(event.target.value) })} /></div><div className="range-row" style={{ marginTop: ".7rem" }}><label htmlFor={`${idPrefix}-y`}>세로 위치 <span>{Math.round(crop.offsetY * 100)}</span></label><input id={`${idPrefix}-y`} type="range" min="-1" max="1" step="0.01" value={crop.offsetY} onChange={(event) => onChange({ offsetY: Number(event.target.value) })} /></div><div className="direction-grid" aria-label="사진 위치 미세 조정" style={{ marginTop: ".7rem" }}><span className="empty" /><button type="button" aria-label="위로 이동" onClick={() => onChange({ offsetY: Math.max(-1, crop.offsetY - .05) })}><ArrowUp size={17} /></button><span className="empty" /><button type="button" aria-label="왼쪽으로 이동" onClick={() => onChange({ offsetX: Math.max(-1, crop.offsetX - .05) })}><ArrowLeft size={17} /></button><button type="button" aria-label="가운데 맞춤" onClick={() => onChange({ offsetX: 0, offsetY: 0 })}><Check size={17} /></button><button type="button" aria-label="오른쪽으로 이동" onClick={() => onChange({ offsetX: Math.min(1, crop.offsetX + .05) })}><ArrowRight size={17} /></button><span className="empty" /><button type="button" aria-label="아래로 이동" onClick={() => onChange({ offsetY: Math.min(1, crop.offsetY + .05) })}><ArrowDown size={17} /></button><span className="empty" /></div></div>;
}

function CropPreview({ asset, crop, output, label, safe = false, circle = false }: { asset: UtilityImageAsset; crop: CropTransform; output: { width: number; height: number }; label: string; safe?: boolean; circle?: boolean }) {
  return <div className="result-preview" style={{ position: "relative", overflow: "hidden", aspectRatio: `${output.width} / ${output.height}`, padding: 0 }}><img src={asset.previewUrl} alt={label} style={{ ...cropPreviewImageStyle({ width: asset.decoded.width, height: asset.decoded.height }, output, crop), boxShadow: "none" }} />{safe && <div aria-hidden="true" style={{ position: "absolute", inset: "12% 6%", border: "2px dashed #ffcf52" }} />}{circle && <div aria-hidden="true" style={{ position: "absolute", inset: "8%", border: "3px solid #ffcf52", borderRadius: "50%", boxShadow: "0 0 0 999px rgba(8,12,20,.2)" }} />}</div>;
}

function ThumbnailPreview({ asset, crop, template, title, subtitle, titleSize, align, accentColor, compact = false }: { asset: UtilityImageAsset; crop: CropTransform; template: ThumbnailTemplateId; title: string; subtitle: string; titleSize: number; align: ThumbnailTextAlign; accentColor: string; compact?: boolean }) {
  const gradient = youtubeThumbnailTemplates[template].gradient;
  const background = gradient === "left" ? "linear-gradient(90deg,rgba(5,10,20,.9),transparent 72%)" : gradient === "right" ? "linear-gradient(270deg,rgba(5,10,20,.9),transparent 72%)" : "linear-gradient(0deg,rgba(5,10,20,.9),transparent 70%)";
  const maxTextWidth = template === "center-impact" ? 3000 : template === "lower-third" ? 3200 : 1840;
  const textLayout = calculateThumbnailTextLayout(template, titleSize, 2, Boolean(subtitle.trim()));
  const textWidthPercent = maxTextWidth / 3840 * 100;
  const anchorPercent = align === "left" ? (192 + 60) / 3840 * 100 : align === "right" ? (3840 - 192 - 60) / 3840 * 100 : 50;
  const leftPercent = align === "left" ? anchorPercent : align === "right" ? anchorPercent - textWidthPercent : anchorPercent - textWidthPercent / 2;
  return <div style={{ position: "relative", overflow: "hidden", aspectRatio: "16 / 9", borderRadius: compact ? 10 : 22, background: "#10151f", containerType: "inline-size" }}>
    <img src={asset.previewUrl} alt={compact ? "모바일 썸네일 예상" : "유튜브 썸네일 예상"} style={cropPreviewImageStyle({ width: asset.decoded.width, height: asset.decoded.height }, { width: 3840, height: 2160 }, crop)} />
    <div aria-hidden="true" style={{ position: "absolute", inset: 0, background }} />
    <div aria-hidden="true" style={{ position: "absolute", inset: "8.89% 5%", border: "1px dashed #ffcf52" }} />
    <div style={{ position: "absolute", left: `${leftPercent}%`, top: `${textLayout.startY / 2160 * 100}%`, width: `${textWidthPercent}%`, color: "white", textAlign: align }}>
      <span aria-hidden="true" style={{ position: "absolute", top: `${-48 / 38.4}cqw`, left: align === "left" ? 0 : align === "center" ? "50%" : undefined, right: align === "right" ? 0 : undefined, transform: align === "center" ? "translateX(-50%)" : undefined, width: align === "center" ? "7.5%" : "44.5%", height: "max(2px, .58cqw)", background: accentColor }} />
      <strong style={{ display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflow: "hidden", fontSize: `${textLayout.titleSize / 38.4}cqw`, lineHeight: 1.08, textShadow: "0 2px 12px #000" }}>{title || "제목을 입력하세요"}</strong>
      {subtitle && <span style={{ display: "block", marginTop: `${38 / 38.4}cqw`, fontSize: `${textLayout.subtitleSize / 38.4}cqw`, lineHeight: 1.12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textShadow: "0 2px 8px #000" }}>{subtitle}</span>}
    </div>
  </div>;
}

function FourCutPreview({ assets, order, crops, orientation, frameColor, tone, activeSlot, onActive }: { assets: CreativeImageAsset[]; order: number[]; crops: CropTransform[]; orientation: FourCutOrientation; frameColor: string; tone: FourCutTone; activeSlot: number; onActive: (index: number) => void }) {
  const spec = FOUR_CUT_SPECS[orientation];
  const frame = orientation === "vertical" ? 74 : 62;
  const gap = orientation === "vertical" ? 20 : 18;
  const cells = layoutFourCut(orientation, spec.width, spec.height, frame, gap);
  return <div role="group" aria-label="네컷 순서와 크롭 예상" style={{ position: "relative", width: "100%", aspectRatio: `${spec.width} / ${spec.height}`, background: frameColor, borderRadius: 18, overflow: "hidden" }}>{order.map((sourceIndex, index) => { const asset = assets[sourceIndex]; const crop = crops[index]; const cell = cells[index]; return <button type="button" aria-label={`${index + 1}번째 칸 조정`} aria-pressed={activeSlot === index} key={index} onClick={() => onActive(index)} style={{ position: "absolute", left: `${cell.x / spec.width * 100}%`, top: `${cell.y / spec.height * 100}%`, width: `${cell.width / spec.width * 100}%`, height: `${cell.height / spec.height * 100}%`, border: 0, outline: activeSlot === index ? "3px solid #ff725e" : 0, outlineOffset: -3, padding: 0, overflow: "hidden", background: "#ddd" }}><img src={asset.previewUrl} alt={`${index + 1}번째 칸: ${asset.file.name}`} style={{ ...cropPreviewImageStyle(asset.dimensions, { width: cell.width, height: cell.height }, crop), filter: tone === "mono" ? "grayscale(1)" : tone === "vintage" ? "sepia(.35) saturate(.72)" : "none" }} /></button>; })}</div>;
}

function cropPreviewImageStyle(source: { width: number; height: number }, output: { width: number; height: number }, crop: CropTransform): CSSProperties {
  const layout = calculateCropPreviewLayout(source, output, crop);
  return {
    position: "absolute",
    left: `${layout.leftPercent}%`,
    top: `${layout.topPercent}%`,
    width: `${layout.widthPercent}%`,
    height: `${layout.heightPercent}%`,
    maxWidth: "none",
    objectFit: "fill",
    transform: `translate(-50%, -50%) rotate(${layout.rotationDegrees}deg)`,
    transformOrigin: "center",
  };
}

function MultiImageUpload({ onFiles, busy, error }: { onFiles: (files: readonly File[]) => void | Promise<void>; busy: boolean; error: string | null }) {
  const select = (event: ChangeEvent<HTMLInputElement>) => { const files = [...(event.target.files ?? [])]; if (files.length) void onFiles(files); event.target.value = ""; };
  return <div className="upload-panel" aria-busy={busy}><div className="upload-inner"><span className="upload-icon"><ImagePlus size={31} /></span><h2>사진 1~4장을 선택하세요</h2><p>한 장은 네 칸에 반복하고, 여러 장은 선택 순서대로 순환 배치합니다.</p><div className="upload-actions"><input className="file-input" id="four-cut-files" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={select} disabled={busy} /><label className="button primary" htmlFor="four-cut-files">사진 1~4장 선택</label></div><div className="upload-meta"><span>JPEG · PNG · WebP</span><span>각 25MB · 전체 60MB 이하</span><span>서버 저장 없음</span></div>{error && <div className="error-box" role="alert" style={{ marginTop: "1rem", textAlign: "left" }}>{error}</div>}</div></div>;
}

function RasterFormatControls({ format, onChange, quality, onQuality, idPrefix }: { format: RasterFormat; onChange: (format: RasterFormat) => void; quality: number; onQuality: (quality: number) => void; idPrefix: string }) {
  return <div className="control-card"><h3>출력 형식</h3><div className="format-row">{(["jpeg", "png"] as const).map((item) => <button key={item} type="button" className={`segmented ${format === item ? "selected" : ""}`} aria-pressed={format === item} onClick={() => onChange(item)}>{formatLabel(item)}</button>)}</div>{format === "jpeg" && <div className="range-row" style={{ marginTop: ".8rem" }}><label htmlFor={`${idPrefix}-quality`}>JPG 품질 <span>{Math.round(quality * 100)}%</span></label><input id={`${idPrefix}-quality`} type="range" min=".5" max="1" step=".01" value={quality} onChange={(event) => onQuality(Number(event.target.value))} /></div>}</div>;
}

function RangeControl({ id, label, value, onChange }: { id: string; label: string; value: number; onChange: (value: number) => void }) { return <div className="control-card"><div className="range-row"><label htmlFor={id}>{label} <span>{Math.round(value * 100)}%</span></label><input id={id} type="range" min="0" max="1" step=".01" value={value} onChange={(event) => onChange(Number(event.target.value))} /></div></div>; }

function ProcessingState({ busy, progress, error, cancel }: { busy: boolean; progress: number; error: string | null; cancel: () => void }) { return <>{error && <div className="error-box" role="alert">{error}</div>}{busy && <div className="progress-wrap" aria-busy="true"><div className="progress-track"><div className="progress-bar" style={{ width: `${progress}%` }} /></div><div className="progress-label">기기 안에서 순서대로 만들고 실제 파일을 확인하고 있어요… {progress}%</div><button type="button" className="button ghost" onClick={cancel} style={{ marginTop: ".5rem" }}><X size={16} />처리 취소</button></div>}</>; }

function SingleResult({ toolId, title, asset, result, onBack, onReset, error, onError }: { toolId: string; title: string; asset: Pick<UtilityImageAsset, "previewUrl">; result: UtilityResult; onBack: () => void; onReset: () => void; error: string | null; onError: (message: string | null) => void }) {
  const tool = getClientTool(toolId);
  return <div className="result-grid"><div className="result-preview"><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".7rem" }}><figure style={{ margin: 0 }}><img src={asset.previewUrl} alt="원본 비교" /><figcaption>원본</figcaption></figure><figure style={{ margin: 0 }}><img src={result.url} alt="완성 결과 비교" /><figcaption>결과</figcaption></figure></div><dl>{result.facts.slice(0, 4).map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl></div><div className="result-panel"><span className="eyebrow">로컬 생성·파일 재검사</span><h2>{title}</h2><div className="check-list">{result.facts.map((fact) => <div className="check-item pass" key={fact.label}><span className="check-icon"><Check size={14} /></span><div><strong>{fact.label}</strong><span>{fact.value}</span></div></div>)}</div>{result.warnings.map((warning) => <div className="warning-box" key={warning} style={{ marginTop: ".5rem" }}>{warning}</div>)}{error && <div className="error-box" role="alert">{error}</div>}<div className="result-actions"><button className="button primary" type="button" onClick={() => { if (!safeDownload(result.blob, result.filename)) onError("다운로드가 차단되었습니다."); }}><Download size={18} />결과 다운로드</button><button className="button ghost" type="button" onClick={onBack}>다시 조정</button><button className="button ghost" type="button" onClick={onReset}>처음부터 다시</button></div>{tool && <NextToolActions sourceToolId={tool.id} targetIds={tool.nextToolIds} asset={result.blob} filename={result.filename} />}</div></div>;
}

function SocialResultView({ asset, results, processor, onBack, onReset }: { asset: UtilityImageAsset; results: Array<SocialImageResult & { url: string }>; processor: ReturnType<typeof useUtilityProcessor>; onBack: () => void; onReset: () => void }) {
  const tool = getClientTool("social-image-pack");
  const downloadZip = async () => { const blob = await processor.run(async (_signal, onProgress) => { onProgress(20); const { buildSocialImageZip } = await import("@/features/social-image-pack/package"); onProgress(30); const zip = await buildSocialImageZip(results); onProgress(100); return zip; }); if (blob && !safeDownload(blob, SOCIAL_ZIP_FILENAME)) processor.setError("ZIP 다운로드가 차단되었습니다."); };
  return <div><div className="section-heading"><span className="eyebrow">선택 결과 {results.length}개</span><h2>SNS 이미지 세트가 준비됐습니다.</h2><p>각 비율의 실제 MIME·서명·픽셀을 다시 확인했습니다.</p></div><div className="tool-grid">{results.map((result) => <article className="tool-card" key={result.id}><img src={result.url} alt={`${result.label} 완성 미리보기`} style={{ width: "100%", maxHeight: 220, objectFit: "contain" }} /><h3>{result.label}</h3><p>{result.width}×{result.height}px · {formatBytes(result.blob.size)}</p><button className="button secondary" type="button" onClick={() => { if (!safeDownload(result.blob, result.filename)) processor.setError("다운로드가 차단되었습니다."); }}><Download size={17} />개별 다운로드</button></article>)}</div>{processor.error && <div className="error-box" role="alert" style={{ marginTop: "1rem" }}>{processor.error}</div>}<ProcessingState {...processor} /><div className="result-actions"><button className="button primary" type="button" disabled={processor.busy} onClick={() => void downloadZip()}><Package size={18} />전체 ZIP 다운로드</button><button className="button ghost" type="button" onClick={onBack}>크롭 다시 조정</button><button className="button ghost" type="button" onClick={onReset}>처음부터 다시</button></div>{tool && results[0] && <NextToolActions sourceToolId={tool.id} targetIds={tool.nextToolIds} asset={results[0].blob} filename={results[0].filename} />}<p className="local-note"><LockKeyhole size={15} />원본 {asset.file.name}과 결과는 현재 탭 메모리에서만 유지됩니다.</p></div>;
}

function useSocialGenerated() {
  const [results, setResults] = useState<Array<SocialImageResult & { url: string }>>([]);
  const resultsRef = useRef<Array<SocialImageResult & { url: string }>>([]);
  const clear = useCallback(() => { for (const item of resultsRef.current) URL.revokeObjectURL(item.url); resultsRef.current = []; setResults([]); }, []);
  const set = useCallback((items: SocialImageResult[]) => { for (const item of resultsRef.current) URL.revokeObjectURL(item.url); const next = items.map((item) => ({ ...item, url: URL.createObjectURL(item.blob) })); resultsRef.current = next; setResults(next); }, []);
  useEffect(() => () => { for (const item of resultsRef.current) URL.revokeObjectURL(item.url); resultsRef.current = []; }, []);
  return { results, clear, set };
}

function useIncomingCreativeTransfer(toolId: string, initialFile: File | undefined): File | undefined {
  const { claimTransfer } = useImageTransfer();
  const [file, setFile] = useState<File>();
  const claimedRef = useRef(false);
  useEffect(() => {
    if (initialFile || claimedRef.current) return;
    claimedRef.current = true;
    const transferred = claimTransfer(toolId);
    if (transferred) queueMicrotask(() => setFile(transferred));
  }, [claimTransfer, initialFile, toolId]);
  return file;
}
function formatLabel(format: "jpeg" | "png"): string { return format === "jpeg" ? "JPG" : "PNG"; }
function filmModeLabel(mode: FilmPhotoOptions["mode"]): string { return mode === "mono" ? "흑백 필름" : mode === "low-saturation" ? "저채도 필름" : mode === "flash" ? "플래시 카메라" : "컬러 필름"; }
