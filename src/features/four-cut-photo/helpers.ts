import type { FourCutOrientation } from "./types";

export const FOUR_CUT_SPECS = {
  vertical: { width: 1200, height: 1800, label: "세로 네컷 1200×1800" },
  horizontal: { width: 1800, height: 1200, label: "가로 네컷 1800×1200" },
} as const;

export function moveFourCutOrder(order: readonly number[], from: number, direction: -1 | 1): number[] {
  if (order.length !== 4) throw new Error("네 칸 순서가 필요합니다.");
  const to = from + direction;
  if (from < 0 || from >= order.length || to < 0 || to >= order.length) return [...order];
  const next = [...order];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

export function fourCutFilename(orientation: FourCutOrientation, format: "jpeg" | "png"): string {
  const spec = FOUR_CUT_SPECS[orientation];
  return `four-cut-${orientation}-${spec.width}x${spec.height}.${format === "jpeg" ? "jpg" : "png"}`;
}
