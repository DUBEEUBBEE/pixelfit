"use client";

import dynamic from "next/dynamic";
import type { ClientWorkspaceKind } from "@/config/client-tools";
import type { ImagePreset } from "@/lib/presets/schema";
import { ToolStepper } from "@/components/editor/ToolStepper";

const loading = () => (
  <section className="workspace" aria-busy="true" aria-label="이미지 도구 불러오는 중">
    <ToolStepper step={1} />
    <div className="workspace-body">
      <div className="upload-panel" role="status">
        <div className="upload-inner">이미지 도구를 불러오는 중입니다…</div>
      </div>
    </div>
  </section>
);
const FaviconWorkspace = dynamic(() => import("@/components/editor/FaviconWorkspace").then((module) => module.FaviconWorkspace), { loading });
const PhotoWorkspace = dynamic(() => import("@/components/editor/PhotoWorkspace").then((module) => module.PhotoWorkspace), { loading });
const PrivacyWorkspace = dynamic(() => import("@/components/editor/PrivacyWorkspace").then((module) => module.PrivacyWorkspace), { loading });
const UtilityWorkspace = dynamic(() => import("@/components/editor/UtilityWorkspace").then((module) => module.UtilityWorkspace), { loading });
const CreativeWorkspace = dynamic(() => import("@/components/editor/CreativeWorkspace").then((module) => module.CreativeWorkspace), { loading });

type ToolWorkspaceProps = {
  presetId: string;
  workspaceKind: ClientWorkspaceKind;
  photoPreset?: ImagePreset;
};

export function ToolWorkspace({ presetId, workspaceKind, photoPreset }: ToolWorkspaceProps) {
  if (workspaceKind === "photo") {
    if (!photoPreset) throw new Error(`사진 프리셋을 찾을 수 없습니다: ${presetId}`);
    return <PhotoWorkspace preset={photoPreset} />;
  }
  if (workspaceKind === "favicon") return <FaviconWorkspace />;
  if (workspaceKind === "privacy") return <PrivacyWorkspace />;
  if (["compressor", "resizer", "converter"].includes(workspaceKind)) return <UtilityWorkspace presetId={presetId} />;
  return <CreativeWorkspace presetId={presetId} />;
}
