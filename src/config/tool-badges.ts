export const toolBadgeKinds = [
  "official-standard",
  "official-reference",
  "common-photo-size",
  "utility",
  "service-size",
  "creator",
  "creative",
  "privacy",
  "web",
] as const;

export type ToolBadgeKind = (typeof toolBadgeKinds)[number];

export const toolBadgeCopy: Record<ToolBadgeKind, string> = {
  "official-standard": "공식 출처 기반",
  "official-reference": "공식 권장값 참고",
  "common-photo-size": "일반 인화 규격",
  utility: "일상 이미지 도구",
  "service-size": "픽셀핏 권장 크기",
  creator: "크리에이터 도구",
  creative: "감성 프리셋",
  privacy: "개인정보 도구",
  web: "웹 자산 도구",
};

export function isOfficialBadge(kind: ToolBadgeKind): boolean {
  return kind === "official-standard" || kind === "official-reference";
}
