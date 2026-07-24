"use client";

import { useId, useState, type ChangeEvent, type DragEvent } from "react";
import { ImagePlus, LockKeyhole } from "lucide-react";

export function UploadPanel({
  onFile,
  error,
  busy = false,
}: {
  onFile: (file: File) => void | Promise<void>;
  error?: string | null;
  busy?: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const inputId = useId();
  const accept = "image/jpeg,image/png,image/webp";
  const select = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void onFile(file);
    event.target.value = "";
  };
  const drop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void onFile(file);
  };
  return (
    <div
      className={`upload-panel ${dragging ? "dragging" : ""}`}
      onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }}
      onDrop={drop}
      aria-busy={busy}
    >
      <div className="upload-inner">
        <span className="upload-icon"><ImagePlus size={31} aria-hidden="true" /></span>
        <h2>사진 한 장을 선택하세요</h2>
        <p>선택 후 위치와 확대 정도만 확인하면 됩니다.</p>
        <div className="upload-actions">
          <input className="file-input" id={inputId} type="file" accept={accept} onChange={select} disabled={busy} />
          <label className="button primary" htmlFor={inputId} aria-disabled={busy}>사진 또는 파일 선택</label>
        </div>
        <div className="upload-meta"><span>JPEG · PNG · WebP</span><span>최대 25MB · 4천만 픽셀</span><span>HEIC·SVG는 현재 미지원</span></div>
        <p className="local-note"><LockKeyhole size={15} aria-hidden="true" />사진은 서버로 전송되지 않습니다.</p>
        {error && <div className="error-box" role="alert" style={{ marginTop: "1rem", textAlign: "left" }}>{error}</div>}
      </div>
    </div>
  );
}
