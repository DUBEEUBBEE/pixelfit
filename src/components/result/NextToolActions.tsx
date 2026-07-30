"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole, Share2 } from "lucide-react";
import { getClientTool } from "@/config/client-tools";
import { useImageTransfer } from "@/components/session/ImageTransferProvider";

const nextToolDescriptions: Record<string, string> = {
  "image-compressor": "현재 사진으로 제출·전송에 맞는 파일 용량을 만듭니다.",
  "image-resizer": "현재 사진으로 원하는 가로·세로 픽셀을 만듭니다.",
  "image-converter": "현재 사진을 JPG·PNG·WebP 중 다른 형식으로 저장합니다.",
  "social-image-pack": "같은 사진으로 1:1·4:5·9:16 이미지를 준비합니다.",
  "youtube-thumbnail": "같은 사진에 제목을 넣어 16:9 썸네일을 만듭니다.",
  "youtube-banner": "같은 사진을 채널 배너 안전영역에 맞춥니다.",
  "four-cut-photo": "같은 사진을 반복하거나 다른 사진과 섞어 네컷을 만듭니다.",
  "film-photo": "현재 사진에 흑백·입자감·빛샘 효과를 더합니다.",
  "photo-privacy-cleaner": "공유하기 전에 위치·기기·촬영 정보를 확인합니다.",
  "favicon-maker": "같은 이미지를 웹사이트 아이콘 묶음으로 만듭니다.",
  "passport-photo": "공식 안내를 보며 여권사진 픽셀과 용량을 맞춥니다.",
  "id-photo": "현재 사진으로 일반 3×4 비율의 증명사진을 만듭니다.",
  "resident-id-photo": "현재 사진으로 3.5×4.5 비율의 사진을 준비합니다.",
};

type OptionalWebShareNavigator = Omit<Navigator, "share" | "canShare"> & {
  share?: Navigator["share"];
  canShare?: Navigator["canShare"];
};

const subscribeToWebShareAvailability = () => () => {};

export function NextToolActions({ sourceToolId, targetIds, asset, filename }: { sourceToolId: string; targetIds: readonly string[]; asset: File | Blob; filename: string }) {
  const router = useRouter();
  const { offerTransfer } = useImageTransfer();
  const targets = targetIds.map((id) => getClientTool(id)).filter((tool) => tool !== undefined);
  const [shareMessage, setShareMessage] = useState("");
  const shareFile = useMemo(() => {
    const extension = asset.type === "image/png" ? "png" : "jpg";
    return new File([asset], `pixelfit-result.${extension}`, { type: asset.type || `image/${extension === "jpg" ? "jpeg" : extension}` });
  }, [asset]);
  const canShareFile = useSyncExternalStore(
    subscribeToWebShareAvailability,
    () => {
      const shareNavigator = navigator as OptionalWebShareNavigator;
      return Boolean(
        (sourceToolId === "four-cut-photo" || sourceToolId === "film-photo")
        && typeof shareNavigator.share === "function"
        && shareNavigator.canShare?.({ files: [shareFile] }),
      );
    },
    () => false,
  );

  async function shareResult() {
    if (!canShareFile) return;
    const share = (navigator as OptionalWebShareNavigator).share;
    if (!share) return;
    setShareMessage("");
    try {
      await share.call(navigator, { files: [shareFile], title: "픽셀핏 결과 이미지", text: "픽셀핏에서 기기 안에서 만든 이미지입니다." });
      setShareMessage("기기의 공유 화면으로 결과를 전달했습니다.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShareMessage("공유를 완료하지 못했습니다. 위의 결과 다운로드를 이용해 주세요.");
    }
  }

  if (targets.length === 0) return null;
  return (
    <section className="next-tool-actions" aria-labelledby="next-tool-title">
      <div className="next-tool-heading">
        <div><span className="next-tool-kicker">다운로드 다음 단계</span><h3 id="next-tool-title">같은 사진으로 이어서 만들기</h3></div>
        <p><LockKeyhole size={14} aria-hidden="true" />버튼을 누를 때만 현재 탭 메모리로 한 번 전달되며 새로고침하면 사라집니다.</p>
      </div>
      <div className="next-tool-grid">
        {targets.map((target) => (
          <button
            className="next-tool-card"
            type="button"
            key={target.id}
            onClick={() => {
              offerTransfer(sourceToolId, target.id, asset, filename);
              router.push(`/${target.slug}`);
            }}
          >
            <span><strong>{target.title}</strong><small>{nextToolDescriptions[target.id] ?? target.displaySpec}</small></span>
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        ))}
      </div>
      {canShareFile && <button className="button ghost share-result-button" type="button" onClick={() => void shareResult()}><Share2 size={17} aria-hidden="true" />기기 공유 메뉴 열기</button>}
      <p className={shareMessage ? "share-status" : "sr-only"} aria-live="polite">{shareMessage}</p>
    </section>
  );
}
