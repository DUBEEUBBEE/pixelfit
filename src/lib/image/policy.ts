import type { ImagePreset } from "@/lib/presets";

const backgrounds: Record<string, string> = {
  white: "#ffffff",
  gray: "#eef1f4",
  blue: "#e7f2fb",
};

export function resolveBackgroundColor(preset: ImagePreset, variant: string | undefined): string | null {
  if (!variant || variant === "original") return null;
  if (!preset.allowedOperations.includes("background-remove") || !preset.allowedOperations.includes("background-replace")) return null;
  return backgrounds[variant] ?? null;
}
