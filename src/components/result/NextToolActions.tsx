"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getClientTool } from "@/config/client-tools";
import { useImageTransfer } from "@/components/session/ImageTransferProvider";

export function NextToolActions({ sourceToolId, targetIds, asset, filename }: { sourceToolId: string; targetIds: readonly string[]; asset: File | Blob; filename: string }) {
  const router = useRouter();
  const { offerTransfer } = useImageTransfer();
  const targets = targetIds.map((id) => getClientTool(id)).filter((tool) => tool !== undefined);
  if (targets.length === 0) return null;
  return <section className="next-tool-actions" aria-labelledby="next-tool-title"><h3 id="next-tool-title">이 사진으로 다음 결과 만들기</h3><p>선택할 때만 현재 탭의 메모리로 전달하며, 새로고침하면 사라집니다.</p><div>{targets.map((target) => <button className="button secondary" type="button" key={target.id} onClick={() => { offerTransfer(sourceToolId, target.id, asset, filename); router.push(`/${target.slug}`); }}>{target.title} <ArrowRight size={16} aria-hidden="true" /></button>)}</div></section>;
}
