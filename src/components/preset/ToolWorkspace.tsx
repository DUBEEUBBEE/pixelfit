"use client";

import { FaviconWorkspace } from "@/components/editor/FaviconWorkspace";
import { PhotoWorkspace } from "@/components/editor/PhotoWorkspace";
import { PrivacyWorkspace } from "@/components/editor/PrivacyWorkspace";

export function ToolWorkspace({ presetId }: { presetId: string }) {
  if (presetId === "favicon-maker") return <FaviconWorkspace />;
  if (presetId === "photo-privacy-cleaner") return <PrivacyWorkspace />;
  return <PhotoWorkspace presetId={presetId} />;
}
