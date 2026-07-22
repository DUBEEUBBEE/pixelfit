import type { ImageHeuristics } from "./analysis";

export type CheckLevel = "pass" | "warning" | "info";
export type ResultCheck = { id: string; level: CheckLevel; label: string; detail: string };

export function buildPhotoChecks(input: {
  width: number;
  height: number;
  expectedWidth: number;
  expectedHeight: number;
  bytes: number;
  maxBytes?: number;
  sourceWidth: number;
  sourceHeight: number;
  faceStatus?: "available" | "unsupported" | "failed";
  faceCount?: number;
  heuristics?: ImageHeuristics;
  official?: boolean;
}): ResultCheck[] {
  const checks: ResultCheck[] = [
    {
      id: "dimensions",
      level: input.width === input.expectedWidth && input.height === input.expectedHeight ? "pass" : "warning",
      label: "출력 픽셀",
      detail: `${input.width}×${input.height}px`,
    },
    {
      id: "filesize",
      level: !input.maxBytes || input.bytes <= input.maxBytes ? "pass" : "warning",
      label: "파일 용량",
      detail: !input.maxBytes || input.bytes <= input.maxBytes ? "기준 안에 들어옵니다." : "목표 용량을 넘었습니다. JPEG로 바꾸거나 다른 사진을 사용해 주세요.",
    },
    {
      id: "resolution",
      level: input.sourceWidth >= input.expectedWidth && input.sourceHeight >= input.expectedHeight ? "pass" : "warning",
      label: "원본 해상도",
      detail: input.sourceWidth >= input.expectedWidth && input.sourceHeight >= input.expectedHeight ? "업스케일 없이 만들 수 있습니다." : "원본이 작아 선명도가 떨어질 수 있습니다.",
    },
  ];
  if (input.official) {
    const count = input.faceCount ?? 0;
    checks.push({
      id: "face",
      level: input.faceStatus === "available" && count === 1 ? "pass" : "warning",
      label: "얼굴 후보",
      detail: input.faceStatus !== "available" ? "자동 판정을 사용할 수 없어 직접 확인이 필요합니다." : count === 1 ? "얼굴 후보 1개를 찾았습니다." : count === 0 ? "얼굴을 찾지 못했습니다. 직접 확인해 주세요." : "여러 얼굴 후보가 보입니다. 공식 사진에는 한 사람만 보여야 합니다.",
    });
  }
  if (input.heuristics) {
    const lightOkay = input.heuristics.brightness >= 0.25 && input.heuristics.brightness <= 0.88;
    checks.push({ id: "light", level: lightOkay ? "pass" : "warning", label: "밝기 추정", detail: lightOkay ? "지나치게 어둡거나 밝지 않습니다." : "밝기가 기준 경계에 있습니다. 원본을 직접 확인해 주세요." });
    checks.push({ id: "sharpness", level: input.heuristics.sharpness >= 0.018 ? "pass" : "warning", label: "흐림 추정", detail: input.heuristics.sharpness >= 0.018 ? "큰 흐림은 감지되지 않았습니다." : "흐릴 가능성이 있습니다. 확대해서 확인해 주세요." });
  }
  checks.push({ id: "human-review", level: "info", label: "직접 확인", detail: "표정, 얼굴 가림, 렌즈, 촬영일과 실제 심사 결과는 자동으로 확정할 수 없습니다." });
  return checks;
}
