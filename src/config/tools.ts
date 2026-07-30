import { z } from "zod";
import { getPreset, presets } from "@/lib/presets";
import { toolBadgeKinds, type ToolBadgeKind } from "./tool-badges";

export const workspaceKinds = [
  "photo",
  "favicon",
  "privacy",
  "compressor",
  "resizer",
  "converter",
  "social-pack",
  "instagram-profile",
  "youtube-thumbnail",
  "four-cut",
  "film",
] as const;

const sectionSchema = z.object({ title: z.string().min(1), body: z.string().min(1) });
const toolDefinitionSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  workspaceKind: z.enum(workspaceKinds),
  category: z.enum(["popular", "creator", "creative", "official", "web", "privacy"]),
  title: z.string().min(1),
  shortDescription: z.string().min(1),
  displaySpec: z.string().min(1),
  searchTerms: z.array(z.string()).min(2),
  sourceKind: z.enum(["official", "convention"]),
  badgeKind: z.enum(toolBadgeKinds),
  heroFacts: z.array(z.object({
    label: z.string().min(2),
    value: z.string().min(2),
  })).length(2),
  source: z.object({
    authority: z.string().min(1),
    title: z.string().min(1),
    url: z.url(),
    lastVerifiedAt: z.iso.date(),
  }).optional(),
  seo: z.object({
    title: z.string().min(1),
    description: z.string().min(40),
    ogTitle: z.string().min(1).optional(),
    ogDescription: z.string().min(1).optional(),
    ogImage: z.string().regex(/^\/og\/tools\/[a-z0-9-]+\.png$/),
    searchAliases: z.array(z.string()).min(2),
    contentPublishedAt: z.iso.date(),
    contentUpdatedAt: z.iso.date(),
  }),
  content: z.object({
    intro: z.string().min(20),
    useCases: z.array(z.object({
      title: z.string().min(4),
      description: z.string().min(20),
    })).min(2),
    outputExplanation: z.array(sectionSchema).min(1),
    howTo: z.array(z.string()).min(3),
    commonMistakes: z.array(sectionSchema).min(1),
    limitations: z.array(z.string()).min(1),
    checklist: z.array(z.string()).min(2),
    examples: z.array(sectionSchema).min(1),
    relatedGuideIds: z.array(z.string()),
  }),
  faqs: z.array(z.object({ question: z.string().min(1), answer: z.string().min(1) })).min(2),
  nextToolIds: z.array(z.string()),
}).superRefine((tool, context) => {
  if (tool.sourceKind === "official" && !tool.source) {
    context.addIssue({ code: "custom", path: ["source"], message: "공식 기반 도구에는 출처가 필요합니다." });
  }
  if (tool.nextToolIds.includes(tool.id)) {
    context.addIssue({ code: "custom", path: ["nextToolIds"], message: "자기 자신은 다음 도구가 될 수 없습니다." });
  }
  if (tool.seo.contentUpdatedAt < tool.seo.contentPublishedAt) {
    context.addIssue({ code: "custom", path: ["seo", "contentUpdatedAt"], message: "수정일은 게시일보다 빠를 수 없습니다." });
  }
  if (new Set(tool.content.useCases.map((item) => item.description)).size !== tool.content.useCases.length) {
    context.addIssue({ code: "custom", path: ["content", "useCases"], message: "한 도구 안에서 사용 사례 설명을 반복할 수 없습니다." });
  }
  if (tool.content.useCases.some((item) => item.description === tool.shortDescription)) {
    context.addIssue({ code: "custom", path: ["content", "useCases"], message: "사용 사례 설명은 도구의 짧은 설명과 달라야 합니다." });
  }
});

export type ToolDefinition = z.infer<typeof toolDefinitionSchema>;

const localEnding = "이미지는 업로드하지 않고 현재 브라우저에서 처리합니다.";

type ToolSeed = Omit<ToolDefinition, "seo" | "content" | "faqs" | "badgeKind" | "heroFacts"> & {
  seo: Omit<ToolDefinition["seo"], "ogImage" | "contentPublishedAt" | "contentUpdatedAt">;
  content: Omit<ToolDefinition["content"], "limitations"> & { limitations?: string[] };
  faqs?: ToolDefinition["faqs"];
};

type ToolPresentation = {
  badgeKind: ToolBadgeKind;
  heroFacts: ToolDefinition["heroFacts"];
  contentPublishedAt: string;
  contentUpdatedAt: string;
};

const toolPresentation: Record<string, ToolPresentation> = {
  "passport-photo": {
    badgeKind: "official-standard",
    heroFacts: [{ label: "주요 결과", value: "413×531px JPG · 500KB 이하" }, { label: "규격 확인", value: "공식 출처 확인 2026-07-22" }],
    contentPublishedAt: "2026-07-22",
    contentUpdatedAt: "2026-07-26",
  },
  "id-photo": {
    badgeKind: "common-photo-size",
    heroFacts: [{ label: "주요 결과", value: "354×472px · 3×4 비율" }, { label: "지원 형식", value: "JPG · PNG" }],
    contentPublishedAt: "2026-07-22",
    contentUpdatedAt: "2026-07-26",
  },
  "resident-id-photo": {
    badgeKind: "official-standard",
    heroFacts: [{ label: "주요 결과", value: "413×531px · 3.5×4.5 비율" }, { label: "규격 확인", value: "공식 출처 확인 2026-07-22" }],
    contentPublishedAt: "2026-07-22",
    contentUpdatedAt: "2026-07-26",
  },
  "youtube-banner": {
    badgeKind: "official-reference",
    heroFacts: [{ label: "주요 결과", value: "2560×1440px · 6MB 이하" }, { label: "규격 확인", value: "공식 권장값 확인 2026-07-22" }],
    contentPublishedAt: "2026-07-22",
    contentUpdatedAt: "2026-07-26",
  },
  "favicon-maker": {
    badgeKind: "web",
    heroFacts: [{ label: "주요 결과", value: "ICO · PNG · manifest ZIP" }, { label: "입력 형식", value: "JPG · PNG · WebP" }],
    contentPublishedAt: "2026-07-22",
    contentUpdatedAt: "2026-07-26",
  },
  "photo-privacy-cleaner": {
    badgeKind: "privacy",
    heroFacts: [{ label: "처리 대상", value: "GPS · 기기 · 촬영일 정보" }, { label: "지원 형식", value: "JPEG · PNG · WebP" }],
    contentPublishedAt: "2026-07-22",
    contentUpdatedAt: "2026-07-26",
  },
  "image-compressor": {
    badgeKind: "utility",
    heroFacts: [{ label: "주요 결과", value: "100KB~2MB 목표" }, { label: "지원 형식", value: "JPG · PNG · WebP" }],
    contentPublishedAt: "2026-07-23",
    contentUpdatedAt: "2026-07-26",
  },
  "image-resizer": {
    badgeKind: "utility",
    heroFacts: [{ label: "주요 결과", value: "가로 · 세로 · 긴 변 · 퍼센트" }, { label: "지원 형식", value: "JPG · PNG · WebP" }],
    contentPublishedAt: "2026-07-23",
    contentUpdatedAt: "2026-07-26",
  },
  "image-converter": {
    badgeKind: "utility",
    heroFacts: [{ label: "주요 결과", value: "JPG · PNG · WebP 변환" }, { label: "투명 배경", value: "PNG · WebP 지원" }],
    contentPublishedAt: "2026-07-23",
    contentUpdatedAt: "2026-07-26",
  },
  "social-image-pack": {
    badgeKind: "service-size",
    heroFacts: [{ label: "주요 결과", value: "1:1 · 4:5 · 9:16 세트" }, { label: "저장 형식", value: "JPG · PNG · ZIP" }],
    contentPublishedAt: "2026-07-23",
    contentUpdatedAt: "2026-07-26",
  },
  "instagram-profile-picture": {
    badgeKind: "service-size",
    heroFacts: [{ label: "주요 결과", value: "1080×1080px · 작은 원 배치" }, { label: "꾸미기", value: "테두리 · 여백 · 배경색" }],
    contentPublishedAt: "2026-07-30",
    contentUpdatedAt: "2026-07-30",
  },
  "youtube-thumbnail": {
    badgeKind: "official-reference",
    heroFacts: [{ label: "주요 결과", value: "3840×2160px · 16:9" }, { label: "규격 확인", value: "공식 권장값 확인 2026-07-26" }],
    contentPublishedAt: "2026-07-23",
    contentUpdatedAt: "2026-07-26",
  },
  "four-cut-photo": {
    badgeKind: "creative",
    heroFacts: [{ label: "주요 결과", value: "세로 · 가로 네컷" }, { label: "저장 형식", value: "JPG · PNG" }],
    contentPublishedAt: "2026-07-23",
    contentUpdatedAt: "2026-07-26",
  },
  "film-photo": {
    badgeKind: "creative",
    heroFacts: [{ label: "주요 결과", value: "필름 · 흑백 · 빛샘 효과" }, { label: "저장 형식", value: "JPG · PNG" }],
    contentPublishedAt: "2026-07-23",
    contentUpdatedAt: "2026-07-26",
  },
};

function defineTool(seed: ToolSeed): ToolDefinition {
  const preset = getPreset(seed.id);
  const presentation = toolPresentation[seed.id];
  if (!presentation) throw new Error(`${seed.id}의 화면·날짜 정보를 찾을 수 없습니다.`);
  return toolDefinitionSchema.parse({
    ...seed,
    badgeKind: presentation.badgeKind,
    heroFacts: presentation.heroFacts,
    source: seed.source ?? preset?.source,
    seo: {
      ...seed.seo,
      ogImage: `/og/tools/${seed.id}.png`,
      contentPublishedAt: presentation.contentPublishedAt,
      contentUpdatedAt: presentation.contentUpdatedAt,
    },
    content: {
      ...seed.content,
      limitations: seed.content.limitations ?? preset?.limitations ?? ["브라우저와 원본 특성에 따라 결과가 달라질 수 있습니다."],
    },
    faqs: seed.faqs ?? preset?.faqs,
  });
}

const legacyKinds: Record<string, Pick<ToolSeed, "workspaceKind" | "category" | "displaySpec" | "nextToolIds">> = {
  "passport-photo": { workspaceKind: "photo", category: "official", displaySpec: "413×531px JPG · 500KB 이하", nextToolIds: ["id-photo", "resident-id-photo", "image-compressor"] },
  "id-photo": { workspaceKind: "photo", category: "official", displaySpec: "354×472px · JPG/PNG", nextToolIds: ["resident-id-photo", "image-compressor", "image-resizer"] },
  "resident-id-photo": { workspaceKind: "photo", category: "official", displaySpec: "413×531px · JPG/PNG", nextToolIds: ["passport-photo", "id-photo", "image-compressor"] },
  "youtube-banner": { workspaceKind: "photo", category: "creator", displaySpec: "2560×1440px · 6MB 이하", nextToolIds: ["youtube-thumbnail", "social-image-pack", "image-compressor"] },
  "favicon-maker": { workspaceKind: "favicon", category: "web", displaySpec: "ICO·PNG·manifest ZIP", nextToolIds: ["image-resizer", "image-converter"] },
  "photo-privacy-cleaner": { workspaceKind: "privacy", category: "privacy", displaySpec: "JPEG·PNG·WebP 메타데이터", nextToolIds: ["image-converter", "image-compressor"] },
};

const legacySeo: Record<string, { title: string; description: string; aliases: string[] }> = {
  "passport-photo": { title: "여권사진 413×531 만들기·500KB 맞추기", description: `한국 온라인 여권사진을 413×531px, JPG 500KB 이하로 만들고 규격 검사를 확인합니다. 배경은 합성하지 않으며 ${localEnding}`, aliases: ["여권", "여권사진", "413x531", "500KB"] },
  "id-photo": { title: "증명사진 3×4 만들기·배경색 변경", description: `일반 증명사진을 3×4cm의 300dpi 환산 크기로 만들고 흰색·회색·파란색 배경 후보를 비교합니다. ${localEnding}`, aliases: ["증명", "증명사진", "3x4", "사진 배경"] },
  "resident-id-photo": { title: "주민등록증 사진 3.5×4.5 맞추기", description: `주민등록증용 3.5×4.5cm 사진을 413×531px 서비스 값으로 맞추고 JPG 또는 PNG로 저장합니다. ${localEnding}`, aliases: ["주민등록증", "민증", "신분증", "3.5x4.5"] },
  "youtube-banner": { title: "유튜브 배너 2560×1440 만들기·안전영역 확인", description: `유튜브 채널 배너를 2560×1440px로 만들고 모바일·데스크톱·TV의 텍스트 안전영역을 함께 확인합니다. ${localEnding}`, aliases: ["유튜브", "채널아트", "배너", "2560x1440"] },
  "favicon-maker": { title: "파비콘 만들기 — ICO·PNG·manifest ZIP 생성", description: `한 장의 로고로 favicon.ico, 크기별 PNG, apple-touch-icon, manifest와 설치 안내 ZIP을 생성합니다. ${localEnding}`, aliases: ["파비콘", "favicon", "ico", "manifest"] },
  "photo-privacy-cleaner": { title: "사진 위치정보·EXIF 삭제하기", description: `사진의 GPS, 기기명, 촬영일 등 선택한 개인정보성 EXIF를 재검사하며 정리합니다. 원본은 덮어쓰지 않고 ${localEnding}`, aliases: ["EXIF", "위치정보", "GPS", "메타데이터"] },
};

const legacyContentDetails: Record<string, Pick<ToolDefinition["content"], "useCases" | "outputExplanation" | "howTo" | "commonMistakes" | "checklist" | "examples">> = {
  "passport-photo": {
    useCases: [
      { title: "온라인 여권 재발급", description: "온라인 신청에 필요한 413×531px JPEG를 만들고 다운로드 파일이 500KB를 넘지 않는지 확인합니다." },
      { title: "픽셀과 용량 동시 확인", description: "사진 크기만 맞추고 용량을 놓치지 않도록 결과 파일의 픽셀과 실제 저장 크기를 한 화면에서 살펴봅니다." },
      { title: "원본 배경 그대로 배치", description: "배경을 새로 만들거나 얼굴을 보정하지 않고 원본 사진의 얼굴 중심과 머리 위 여백만 조절합니다." },
    ],
    outputExplanation: [
      { title: "413×531px JPEG", body: "외교부 온라인용 사진 안내에서 확인한 권장 픽셀이며 다운로드될 파일을 다시 읽어 픽셀 크기와 JPEG 형식을 확인합니다." },
      { title: "500KB 이하", body: "화면의 예상치가 아니라 실제 결과 파일의 512,000바이트 이하 여부를 확인합니다." },
      { title: "300dpi와 픽셀", body: "DPI는 인화 밀도 정보이고 413×531이라는 실제 픽셀 수를 늘려 주지 않습니다." },
    ],
    howTo: ["최근 촬영한 정면 원본을 선택하고 배경이 이미 기준에 맞는지 확인합니다.", "안내선을 참고해 얼굴 중심과 머리 위 여백을 조정하되 배경·얼굴을 합성하지 않습니다.", "413×531px, JPEG, 500KB 이하 검사 뒤 촬영일·표정·가림을 직접 확인하고 저장합니다."],
    commonMistakes: [
      { title: "흰 배경을 새로 합성하기", body: "여권 도구에는 배경 제거·교체·생성형 채우기·미화 경로가 없으며 원본 배경을 유지합니다." },
      { title: "자동 검사를 촬영일·승인 확인으로 보기", body: "파일의 촬영일이 실제 촬영일임을 확정할 수 없고 머리 길이 추정도 참고값이므로 접수기관 심사를 보장하지 않습니다." },
    ],
    checklist: ["413×531px JPEG와 500KB 이하 실제 파일 확인", "배경 합성·얼굴 보정이 없었는지 확인", "6개월 이내 촬영·표정·안경·가림을 공식 안내와 비교"],
    examples: [{ title: "512,001바이트 결과", body: "픽셀과 JPEG 형식이 맞아도 한도를 1바이트 넘으면 통과로 표시하지 않고 품질을 다시 탐색합니다." }],
  },
  "id-photo": {
    useCases: [
      { title: "이력서와 프로필 사진", description: "별도 온라인 규격이 없는 이력서나 사내 프로필에 널리 쓰이는 3×4 비율의 사진을 준비합니다." },
      { title: "배경색 후보 비교", description: "원본 배경과 흰색·연회색·연파랑 후보를 나란히 보고 머리카락과 옷 경계가 자연스러운 결과를 고릅니다." },
      { title: "일반 증명사진 준비", description: "제출기관이 물리 크기만 안내한 경우 300dpi 환산 픽셀을 시작점으로 삼고 실제 요구를 다시 확인합니다." },
    ],
    outputExplanation: [
      { title: "354×472px", body: "3×4cm를 300dpi로 환산한 서비스·관행값이며 모든 기관의 공식 온라인 픽셀 규격은 아닙니다." },
      { title: "네 가지 배경 방식", body: "원본 유지를 언제든 고를 수 있고, 사진 가장자리의 색을 바탕으로 흰색·회색·파란색 배경 후보를 만듭니다." },
    ],
    howTo: ["제출처가 3×4cm를 요구하는지 먼저 확인하고 원본을 선택합니다.", "위치·확대와 배경 후보를 비교하고 머리카락 경계가 어색하면 원본 배경으로 돌아갑니다.", "354×472px 결과를 JPG 또는 PNG로 저장하고 제출처의 파일 조건을 다시 확인합니다."],
    commonMistakes: [{ title: "3×4를 범용 공식 규격으로 보기", body: "일반 증명사진 관행값이며 기관별로 3.5×4.5cm, 다른 픽셀, 배경색이나 용량을 요구할 수 있습니다." }, { title: "자동 배경 분리를 완벽한 누끼로 보기", body: "복잡한 배경과 머리카락에서는 색상 경계 추정이 부정확할 수 있습니다." }],
    checklist: ["제출기관의 물리 크기·온라인 픽셀 확인", "피사체 경계와 배경색 확인", "JPG/PNG 형식 요구 확인"],
    examples: [{ title: "흰 셔츠와 흰 배경", body: "가장자리 대표색과 피사체 색이 비슷하면 일부가 섞일 수 있으므로 원본 배경과 비교합니다." }],
  },
  "resident-id-photo": {
    useCases: [
      { title: "주민등록증 사진 준비", description: "3.5×4.5cm 안내를 기준으로 얼굴 위치를 조절하고 새 파일로 저장해 신청 경로에 맞게 준비합니다." },
      { title: "인화 크기를 픽셀로 환산", description: "물리 크기를 300dpi 기준 413×531px로 환산하되 온라인 신청 화면이 다른 값을 요구하면 그 값을 우선합니다." },
      { title: "배경 후보 직접 비교", description: "원본 배경을 기본으로 두고 제출처가 허용하는 경우에만 단색 배경 후보의 경계 품질을 비교합니다." },
    ],
    outputExplanation: [
      { title: "3.5×4.5cm와 413×531px", body: "413×531px은 물리 크기를 300dpi로 환산한 픽셀핏 기본값이며 특정 온라인 신청 화면의 공식 픽셀 보장은 아닙니다." },
      { title: "JPG 또는 PNG", body: "결과 형식은 선택할 수 있지만 실제 제출 경로가 요구하는 형식·용량이 우선합니다." },
    ],
    howTo: ["현재 제출 경로의 사진 크기·촬영 시점·배경 요구를 확인합니다.", "원본 배경을 기본으로 위치를 맞추고, 기준을 확인한 경우에만 배경 후보를 사용합니다.", "413×531px 결과와 300dpi 기록을 확인해 새 파일로 저장합니다."],
    commonMistakes: [{ title: "환산값을 온라인 공식 규격으로 단정", body: "방문 제출의 물리 크기와 웹 업로드의 픽셀·용량 조건은 다를 수 있습니다." }],
    checklist: ["3.5×4.5cm 요구와 온라인 파일 조건 구분", "원본 배경 우선 여부 확인", "촬영 시점과 얼굴 기준 직접 확인"],
    examples: [{ title: "별도 400×500px 요구", body: "제출 화면이 직접 픽셀을 명시했다면 413×531 환산값보다 그 화면의 최신 값이 우선합니다." }],
  },
  "youtube-banner": {
    useCases: [
      { title: "채널아트 한 장으로 준비", description: "TV 화면까지 고려한 2560×1440px 캔버스에 채널 사진과 문구를 배치해 업로드용 파일을 만듭니다." },
      { title: "모바일 잘림 미리 확인", description: "채널명과 로고를 중앙 안전영역에 두고 모바일·데스크톱·TV에서 예상되는 잘림을 비교합니다." },
      { title: "세로 사진을 가로 배너로", description: "한 장의 세로 사진을 중앙에 두고 주변을 흐리게 채워 중요한 피사체를 억지로 늘이지 않고 가로 화면에 맞춥니다." },
    ],
    outputExplanation: [
      { title: "전체 2560×1440px", body: "YouTube 권장 캔버스로 TV에서는 넓게 보이지만 데스크톱과 모바일에서는 중앙 위주로 잘립니다." },
      { title: "텍스트·로고 안전영역", body: "공식 최소 2048×1152에서 1235×338인 영역을 2560 캔버스에 약 1544×423으로 비율 환산한 계산값입니다." },
      { title: "6MB 이하", body: "다운로드될 JPG·PNG 파일의 실제 용량을 확인하며 YouTube에 올린 뒤의 최종 표시까지 보장하지는 않습니다." },
    ],
    howTo: ["가로로 쓸 사진이나 로고를 선택합니다.", "중요한 얼굴·글자·로고를 중앙 안전영역 안에 두고 TV·데스크톱·모바일 예상 크롭을 확인합니다.", "2560×1440px와 6MB 이하 결과를 확인해 저장합니다."],
    commonMistakes: [{ title: "전체 캔버스에 글자 펼치기", body: "TV에서는 보이더라도 모바일 중앙 크롭에서 양쪽 글자가 사라질 수 있습니다." }, { title: "예상 미리보기를 실제 UI 보장으로 보기", body: "기기와 YouTube UI 변경에 따라 표시 영역은 달라질 수 있습니다." }],
    checklist: ["핵심 텍스트·로고가 중앙 안전영역 안인지 확인", "모바일·데스크톱·TV 예상 크롭 비교", "2560×1440px·6MB 이하 실제 파일 확인"],
    examples: [{ title: "왼쪽 인물 사진", body: "인물이 안전영역 밖에 있다면 중앙 또는 왼쪽 배치를 조정하고 모바일 예상 화면에서 얼굴 잘림을 다시 봅니다." }],
  },
  "favicon-maker": {
    useCases: [
      { title: "사이트 아이콘 한 번에 준비", description: "로고 한 장으로 브라우저 탭용 favicon.ico와 여러 크기의 PNG를 묶어 빠뜨리지 않고 받습니다." },
      { title: "홈 화면 설치 파일 만들기", description: "apple-touch-icon과 webmanifest, 실제 사이트에 붙여 넣을 설치 안내를 같은 ZIP에 담습니다." },
      { title: "작은 크기 식별성 확인", description: "복잡한 로고가 16px 브라우저 탭에서 뭉개지지 않는지 원형·사각형 배경 후보와 함께 미리 봅니다." },
    ],
    outputExplanation: [
      { title: "favicon.ico", body: "16·32·48px 아이콘을 하나의 ICO 파일에 넣어 오래된 브라우저까지 사용할 수 있는 기본 경로를 제공합니다." },
      { title: "PNG와 apple-touch-icon", body: "16·32·48·180·192·512px 파일은 브라우저 탭, 홈 화면, 설치 아이콘 등 서로 다른 소비처에 사용됩니다." },
      { title: "site.webmanifest와 설치 안내", body: "manifest JSON과 실제 경로를 연결하는 HTML 예시를 ZIP에 포함하고 생성 후 다시 검사합니다." },
    ],
    howTo: ["단순하고 정사각형에 가까운 JPEG·PNG·WebP 로고를 선택합니다.", "여백·원형·둥근 사각형·배경색을 고르고 16·32·48px 미리보기를 봅니다.", "ICO·PNG·manifest·설치 안내가 검증된 ZIP을 저장합니다."],
    commonMistakes: [{ title: "복잡한 로고를 16px에 그대로 사용", body: "작은 크기에서는 가는 글자와 세부 묘사가 뭉개지므로 단순한 표식이 더 잘 보입니다." }, { title: "raster를 SVG로 오해", body: "안전한 raster 입력만 받고 가짜 벡터 변환이나 SVG 출력은 제공하지 않습니다." }],
    checklist: ["16·32·48px에서 식별성 확인", "ZIP의 manifest 이름·색상 확인", "사이트의 실제 base path에 맞게 설치 경로 수정"],
    examples: [{ title: "투명 로고", body: "투명 배경 유지 또는 단색 배경을 선택하고 밝은·어두운 브라우저 UI에서 대비를 확인합니다." }],
  },
  "photo-privacy-cleaner": {
    useCases: [
      { title: "공유 전 위치정보 정리", description: "사진을 공개하기 전에 GPS 좌표와 촬영 기기명이 들어 있는지 살펴보고 선택한 정보만 제거합니다." },
      { title: "촬영 정보 항목 확인", description: "촬영일·작성자·설명처럼 사진 파일 안에 숨어 있는 알려진 정보 항목을 범주별로 확인합니다." },
      { title: "보이는 사진은 그대로 유지", description: "얼굴을 흐리거나 픽셀을 다시 그리지 않고 파일 안의 위치·기기·날짜 정보 영역만 선택해 정리합니다." },
    ],
    outputExplanation: [
      { title: "GPS·기기명·촬영일", body: "JPEG·PNG·WebP에서 발견한 알려진 개인정보 항목을 범주별로 보여 주고 사용자가 고른 항목이 결과에서 사라졌는지 다시 확인합니다." },
      { title: "픽셀 모자이크와 다른 작업", body: "EXIF 제거는 사진에 보이는 얼굴·주소·차량번호를 가리지 않습니다. 화면에 보이는 정보는 별도 픽셀 편집이 필요합니다." },
      { title: "출처 정보와 파일 변경", body: "지원되는 파일은 사진 픽셀을 다시 압축하지 않지만 파일 구조가 바뀌면 C2PA·Content Credentials가 무효화될 가능성은 남습니다." },
    ],
    howTo: ["공유할 JPEG·PNG·WebP를 선택해 발견된 필드 범주를 확인합니다.", "위치·기기·날짜·작성자 중 제거할 항목만 선택하고 출처 정보 경고를 읽습니다.", "결과를 재검사한 보고서를 확인하고 원본과 다른 이름으로 저장합니다."],
    commonMistakes: [{ title: "EXIF 삭제를 완전한 익명화로 보기", body: "사진 픽셀, 파일명, 클라우드 공유 기록, 브라우저·운영체제 정보까지 제거하지는 않습니다." }, { title: "Content Credentials 보존을 보장", body: "알려진 출처 정보 영역을 삭제 선택지로 제공하지 않지만 파일 변경 자체가 자격 증명 유효성에 영향을 줄 수 있습니다." }],
    checklist: ["선택한 개인정보 범주가 결과 재검사에서 사라졌는지 확인", "사진 픽셀에 식별 정보가 보이지 않는지 별도 확인", "공개 문의에 원본 사진을 첨부하지 않기"],
    examples: [{ title: "GPS가 없는 사진", body: "제거할 위치 필드가 없으면 성공 개수를 꾸미지 않고 알려진 위치정보가 발견되지 않았다고 표시합니다." }],
  },
};

const legacyTools = presets.map((preset) => {
  const kind = legacyKinds[preset.id];
  const seo = legacySeo[preset.id];
  const details = legacyContentDetails[preset.id];
  const guideIds: Record<string, string[]> = {
    "passport-photo": ["passport-photo-413x531", "photo-under-500kb", "dpi-vs-pixels"],
    "id-photo": ["id-photo-size", "dpi-vs-pixels"],
    "resident-id-photo": ["id-photo-size", "dpi-vs-pixels"],
    "youtube-banner": ["youtube-banner-safe-area", "jpeg-png-webp"],
    "favicon-maker": ["favicon-files", "jpeg-png-webp"],
    "photo-privacy-cleaner": ["exif-photo-privacy", "jpeg-png-webp"],
  };
  return defineTool({
    id: preset.id,
    slug: preset.slug,
    workspaceKind: kind.workspaceKind,
    category: kind.category,
    title: preset.title,
    shortDescription: preset.shortDescription,
    displaySpec: kind.displaySpec,
    searchTerms: preset.searchTerms,
    sourceKind: preset.sourceKind,
    source: preset.source,
    seo: { title: seo.title, description: seo.description, searchAliases: seo.aliases },
    content: {
      intro: `${preset.shortDescription} 이 페이지는 결과 규격, 자동 확인 범위와 사람이 다시 확인할 부분을 함께 보여줍니다.`,
      useCases: details.useCases,
      outputExplanation: details.outputExplanation,
      howTo: details.howTo,
      commonMistakes: details.commonMistakes,
      limitations: preset.limitations,
      checklist: details.checklist,
      examples: details.examples,
      relatedGuideIds: guideIds[preset.id] ?? [],
    },
    faqs: preset.faqs,
    nextToolIds: kind.nextToolIds,
  });
});

const newTools: ToolDefinition[] = [
  defineTool({
    id: "image-compressor", slug: "image-compressor", workspaceKind: "compressor", category: "popular",
    title: "사진 용량 줄이기", shortDescription: "목표 KB·MB를 정하고 실제 결과 용량을 확인하며 압축합니다.", displaySpec: "100KB~2MB 목표 · JPG/PNG/WebP", searchTerms: ["압축", "용량", "KB", "MB", "사진 줄이기"], sourceKind: "convention",
    seo: { title: "사진 용량 줄이기 — 목표 KB·MB로 이미지 압축", description: `100KB, 200KB, 500KB, 1MB, 2MB 또는 직접 입력한 크기에 맞춰 다운로드 파일의 실제 용량을 확인하며 사진을 줄입니다. ${localEnding}`, searchAliases: ["압축", "용량", "KB", "MB", "500KB"] },
    content: {
      intro: "제출 한도나 메시지 첨부 제한처럼 정확한 파일 크기가 필요할 때 여러 품질을 비교하고 다운로드될 파일의 실제 용량을 확인합니다.",
      useCases: [
        { title: "500KB 이하 사진 제출", description: "공공기관이나 지원서에서 요구하는 파일 상한을 화면의 예상값이 아니라 실제 결과 파일 크기로 확인합니다." },
        { title: "메일과 메신저 첨부", description: "사진의 해상도를 유지할지 함께 줄일지 선택해 전송 시간과 데이터 사용량을 낮춥니다." },
        { title: "웹 게시용 이미지", description: "불필요하게 큰 원본을 가볍게 만들어 블로그와 웹페이지의 로딩 부담을 줄입니다." },
      ],
      outputExplanation: [{ title: "목표 용량은 상한", body: "다운로드될 파일이 목표보다 작거나 같은지 확인하며, 사진이 지나치게 깨질 수 있으면 목표 미달 상태와 이유를 숨기지 않습니다." }],
      howTo: ["사진을 선택하고 원본 용량을 확인합니다.", "KB·MB 목표와 해상도 축소 허용 여부를 선택합니다.", "실제 결과 용량과 품질 경고를 확인해 다운로드합니다."],
      commonMistakes: [{ title: "PNG 품질 슬라이더 기대", body: "PNG는 JPEG처럼 품질 값만으로 크게 줄지 않을 수 있어 해상도 축소나 형식 변환이 필요합니다." }],
      limitations: ["목표가 지나치게 작으면 최소 품질과 최소 해상도 한계 때문에 달성하지 못할 수 있습니다."],
      checklist: ["결과 용량이 실제 한도 이내인지 확인", "글자·얼굴·경계가 알아볼 수 있을 만큼 선명한지 확인"],
      examples: [{ title: "2.4MB → 500KB", body: "먼저 품질을 제한 횟수 안에서 탐색하고, 사용자가 허용한 경우에만 해상도를 단계적으로 줄입니다." }],
      relatedGuideIds: ["photo-under-500kb", "jpeg-png-webp"],
    },
    faqs: [{ question: "무조건 목표 용량이 되나요?", answer: "아니요. 최소 품질과 선택한 해상도 정책 안에서 달성하지 못하면 실제 결과와 이유를 표시합니다." }, { question: "여러 장도 한 번에 되나요?", answer: "현재는 모바일 안정성과 결과 검증을 위해 한 장씩 처리합니다." }],
    nextToolIds: ["image-resizer", "image-converter"],
  }),
  defineTool({
    id: "image-resizer", slug: "image-resizer", workspaceKind: "resizer", category: "popular",
    title: "이미지 크기 조절", shortDescription: "가로·세로·긴 변·퍼센트로 픽셀 크기를 정확히 바꿉니다.", displaySpec: "직접 픽셀·긴 변·퍼센트", searchTerms: ["리사이즈", "크기", "픽셀", "가로", "세로"], sourceKind: "convention",
    seo: { title: "이미지 크기 조절 — 픽셀·긴 변·퍼센트 리사이즈", description: `가로·세로 픽셀, 긴 변, 퍼센트와 비율 잠금을 이용해 이미지를 contain 또는 cover 방식으로 조절합니다. ${localEnding}`, searchAliases: ["리사이즈", "크기", "픽셀", "가로", "세로"] },
    content: {
      intro: "원본 비율을 기본으로 잠그고 필요한 픽셀만 입력해 결과 크기를 계산합니다. 확대가 선명도를 새로 만들지는 않는다는 점도 함께 알립니다.",
      useCases: [
        { title: "웹 업로드 긴 변 제한", description: "쇼핑몰이나 게시판이 긴 변의 최대 픽셀을 안내할 때 원본 비율을 유지하며 그 크기에 맞춥니다." },
        { title: "정확한 가로·세로 만들기", description: "가로와 세로 픽셀이 정해진 화면·문서용 이미지를 만들고 여백 또는 가장자리 잘림을 선택합니다." },
        { title: "원본의 절반으로 축소", description: "퍼센트 방식을 사용해 가로와 세로를 함께 줄이고 작은 화면에 충분한 해상도로 가볍게 저장합니다." },
      ],
      outputExplanation: [{ title: "Contain과 cover", body: "Contain은 사진 전체를 보여 여백이 생길 수 있고, cover는 상자를 채우는 대신 가장자리를 자를 수 있습니다." }],
      howTo: ["사진을 선택해 원본 픽셀을 확인합니다.", "직접 크기·긴 변·퍼센트 중 한 방식을 고르고 비율을 확인합니다.", "맞춤 방식과 출력 형식을 선택해 저장합니다."],
      commonMistakes: [{ title: "작은 사진을 크게 확대", body: "업스케일은 없는 디테일을 복원하지 않으므로 결과가 흐려질 수 있습니다." }],
      limitations: ["브라우저가 사진 크기와 색을 처리하는 방식에는 조금씩 차이가 있을 수 있습니다."],
      checklist: ["비율 잠금 상태 확인", "cover 선택 시 중요한 가장자리 잘림 확인"],
      examples: [{ title: "긴 변 1920px", body: "4000×3000 원본은 비율 잠금 시 1920×1440으로 계산됩니다." }],
      relatedGuideIds: ["dpi-vs-pixels", "jpeg-png-webp"],
    },
    faqs: [{ question: "DPI도 화질을 늘리나요?", answer: "아니요. 화면 이미지의 실제 정보량은 픽셀 수가 결정하며 DPI 표시는 인쇄 크기 해석에 사용됩니다." }, { question: "비율을 일부러 바꿀 수 있나요?", answer: "가능하지만 기본은 잠금이며, 잠금을 풀면 사진이 늘어나 보일 수 있다는 경고가 표시됩니다." }],
    nextToolIds: ["image-compressor", "image-converter", "favicon-maker"],
  }),
  defineTool({
    id: "image-converter", slug: "image-converter", workspaceKind: "converter", category: "popular",
    title: "이미지 형식 변환", shortDescription: "JPEG·PNG·WebP를 선택하고 투명도와 품질을 확인해 변환합니다.", displaySpec: "JPEG ↔ PNG ↔ WebP", searchTerms: ["변환", "JPG", "JPEG", "PNG", "WebP"], sourceKind: "convention",
    seo: { title: "이미지 형식 변환 — JPG·PNG·WebP 바꾸기", description: `JPEG, PNG, WebP 사이에서 품질과 투명 배경 처리 방식을 고르고 실제 출력 형식을 다시 확인해 저장합니다. ${localEnding}`, searchAliases: ["변환", "JPG", "JPEG", "PNG", "WebP"] },
    content: {
      intro: "사진 중심 JPEG, 투명 배경이 가능한 PNG, 웹 전송에 효율적인 WebP의 차이를 보고 목적에 맞는 결과를 만듭니다.",
      useCases: [
        { title: "투명 PNG를 JPEG로", description: "투명 영역에 흰색이나 선택한 배경색을 넣어 사진 제출과 문서 첨부에 널리 쓰이는 JPEG로 저장합니다." },
        { title: "JPEG를 WebP로 저장", description: "웹 게시에 사용할 사진을 WebP로 바꾸고 원본과 결과 파일 크기를 비교해 더 적합한 쪽을 고릅니다." },
        { title: "WebP를 PNG로 변환", description: "WebP를 받지 않는 편집기나 업무 시스템을 위해 투명 영역을 유지할 수 있는 PNG 파일을 만듭니다." },
      ],
      outputExplanation: [{ title: "형식을 바꿀 때 달라지는 정보", body: "형식을 바꾸면 사진 데이터를 새 파일에 다시 담습니다. 원본의 촬영 정보와 색상 정보가 그대로 남는다고 보장하지 않으며 개인정보성 촬영 정보는 기본으로 제외합니다." }],
      howTo: ["사진을 선택해 실제 입력 형식을 확인합니다.", "출력 형식, 품질과 투명 배경 처리 색을 선택합니다.", "결과 형식과 파일 크기를 비교한 뒤 다운로드합니다."],
      commonMistakes: [{ title: "JPEG 투명 배경 기대", body: "JPEG는 투명을 지원하지 않으므로 선택한 배경색으로 합성됩니다." }],
      limitations: ["HEIC는 기기 안에서 안전하게 읽는 방법을 아직 검증하지 못해 제공하지 않습니다.", "형식을 바꿀 때 원본 촬영 정보가 그대로 남는 기능은 지원하지 않습니다."],
      checklist: ["출력 파일의 실제 형식 확인", "투명 영역과 색상 변화 확인"],
      examples: [{ title: "PNG → JPEG", body: "투명 픽셀은 선택한 배경색과 합성되고 JPEG 품질로 인코딩됩니다." }],
      relatedGuideIds: ["jpeg-png-webp", "exif-photo-privacy"],
    },
    faqs: [{ question: "HEIC도 변환되나요?", answer: "아니요. 외부 변환 서버를 쓰지 않으며 현재 기기 안에서 안전하게 읽는 방법을 검증하지 못해 버튼도 제공하지 않습니다." }, { question: "촬영 정보가 그대로 남나요?", answer: "형식을 바꿀 때 새 파일을 만들므로 원본 촬영 정보가 그대로 남는 기능은 지원하지 않습니다." }],
    nextToolIds: ["image-compressor", "image-resizer", "photo-privacy-cleaner"],
  }),
  defineTool({
    id: "social-image-pack", slug: "social-image-pack", workspaceKind: "social-pack", category: "popular",
    title: "SNS 이미지 세트", shortDescription: "한 장으로 1:1·4:5·9:16 이미지를 따로 맞추고 ZIP으로 받습니다.", displaySpec: "1080×1080 · 1080×1350 · 1080×1920", searchTerms: ["SNS", "인스타", "릴스", "스토리", "쇼츠", "소셜"], sourceKind: "convention",
    seo: { title: "SNS 이미지 세트 만들기 — 1:1·4:5·9:16 한 번에", description: `사진 한 장을 정사각형, 세로 게시물, 스토리·릴스 비율로 각각 조정해 개별 파일이나 ZIP으로 받습니다. ${localEnding}`, searchAliases: ["인스타", "릴스", "쇼츠", "스토리", "SNS"] },
    content: {
      intro: "서로 다른 비율에 같은 크롭을 억지로 쓰지 않고, 각 결과의 중심 위치를 따로 조정해 중요한 피사체를 남깁니다.",
      useCases: [
        { title: "피드와 스토리 함께 준비", description: "같은 캠페인 사진을 정사각형 피드와 세로 게시물·스토리 비율에 각각 맞춰 중요한 문구를 남깁니다." },
        { title: "프로필 원형 잘림 확인", description: "정사각형 결과 위에 원형 마스크를 미리 보며 로고나 얼굴이 가장자리에서 잘리지 않는지 확인합니다." },
        { title: "세 가지 비율 ZIP 저장", description: "1:1·4:5·9:16 결과를 개별로 확인한 뒤 선택한 파일을 한 묶음으로 내려받습니다." },
      ],
      outputExplanation: [{ title: "픽셀핏 서비스 권장값", body: "1080px 기반 세 규격은 범용 제작 편의를 위한 서비스 프리셋이며 각 플랫폼의 모든 화면 노출을 보장하지 않습니다." }],
      howTo: ["사진 한 장을 선택합니다.", "1:1·4:5·9:16 탭마다 위치와 확대를 따로 조정합니다.", "필요한 결과를 고르고 개별 파일 또는 ZIP으로 저장합니다."],
      commonMistakes: [{ title: "모든 비율에 같은 크롭 사용", body: "세로 비율에서는 좌우가 더 많이 잘리므로 각 탭에서 얼굴·글자 위치를 다시 확인해야 합니다." }],
      limitations: ["원형 프로필은 예상 미리보기이며 플랫폼의 실제 마스크와 UI는 달라질 수 있습니다."],
      checklist: ["각 비율의 피사체 잘림 확인", "스토리 상하 UI 영역에 중요한 글자가 없는지 확인"],
      examples: [{ title: "한 장, 세 결과", body: "정사각형은 중앙, 4:5는 상반신, 9:16은 전체 인물이 보이도록 각각 위치를 저장할 수 있습니다." }],
      relatedGuideIds: ["jpeg-png-webp"],
    },
    faqs: [{ question: "인스타그램 공식 규격인가요?", answer: "플랫폼별 표시가 자주 바뀌므로 1080px 기반 서비스 권장값으로 제공하며 실제 게시 화면은 다시 확인해야 합니다." }, { question: "사진이 세 번 업로드되나요?", answer: "아니요. 한 장을 현재 브라우저에서 세 비율로 순차 렌더링합니다." }],
    nextToolIds: ["youtube-thumbnail", "film-photo", "image-compressor"],
  }),
  defineTool({
    id: "instagram-profile-picture", slug: "instagram-profile-picture", workspaceKind: "instagram-profile", category: "creator",
    title: "인스타그램 프로필 사진", shortDescription: "사진을 작은 원 안에 축소 배치하고 테두리 색과 여백을 조절합니다.", displaySpec: "1080×1080px · 원형 프로필 미리보기", searchTerms: ["인스타그램", "인스타", "프로필", "프사", "원형", "테두리"], sourceKind: "convention",
    seo: { title: "인스타그램 프로필 사진 만들기 — 원형 테두리·여백", description: `사진을 바로 잘라 채우지 않고 작은 원 안에 먼저 축소 배치한 뒤 테두리 색, 원 크기, 사진 여백과 배경색을 조절해 1080×1080 JPG·PNG로 저장합니다. ${localEnding}`, searchAliases: ["인스타 프사", "인스타그램 프로필 사진", "프로필 원형", "프사 테두리", "원형 사진"] },
    content: {
      intro: "인스타그램의 원형 표시를 미리 보면서 사진을 작은 원 안에 축소 배치합니다. 원본의 중요한 부분을 플랫폼 가장자리 크롭에 맡기지 않고 테두리와 여백까지 한 장에 합성합니다.",
      useCases: [
        { title: "얼굴이 잘리지 않는 프사", description: "가로 또는 세로 사진을 먼저 줄여 원 안쪽에 배치하고 얼굴과 머리카락이 바깥 원에 닿지 않는지 확인합니다." },
        { title: "브랜드 색 테두리 추가", description: "프로필 사진 둘레와 바깥 여백에 브랜드 색을 넣어 작은 목록 화면에서도 계정 이미지를 구분하기 쉽게 만듭니다." },
        { title: "로고와 반려동물 사진 배치", description: "정사각형이 아닌 로고나 전신 사진도 사진 크기와 원 크기를 따로 낮춰 중심 내용이 남도록 조절합니다." },
      ],
      outputExplanation: [
        { title: "1080×1080 픽셀핏 서비스값", body: "Meta 공식 도움말에서 Instagram 전용 업로드 픽셀 크기를 하나의 의무값으로 확인하지 못해, 품질 여유가 있는 1080px 정사각형을 제품 기본값으로 사용합니다." },
        { title: "작은 원과 색 테두리", body: "정사각형 캔버스 안에 별도의 작은 사진 원을 만들기 때문에 Instagram이 바깥 정사각형을 원형으로 표시해도 사진 주변의 여백과 테두리가 함께 남습니다." },
      ],
      howTo: ["사진을 선택해 작은 원 안에 축소된 기본 배치를 확인합니다.", "원 크기와 사진 크기, 테두리 두께·색, 원 안쪽과 바깥 배경색을 조절합니다.", "Instagram 원형 표시 예상과 1080×1080 파일 검사를 확인한 뒤 PNG 또는 JPG로 저장합니다."],
      commonMistakes: [
        { title: "사진 원을 화면 끝까지 키우기", body: "원을 너무 크게 만들면 다시 플랫폼 원형 가장자리에 가까워져 머리카락, 로고 글자와 테두리가 잘려 보일 수 있습니다." },
        { title: "테두리와 배경 대비 부족", body: "비슷한 색만 사용하면 작은 프로필 화면에서 원 경계가 흐려지므로 밝기 차이가 있는 조합을 확인하세요." },
      ],
      limitations: ["Instagram 앱의 실제 압축, 색상 변환, 원형 마스크 크기와 화면별 표시 방식은 바뀔 수 있습니다.", "사진을 원형으로 표시하면 직사각형 원본의 네 모서리는 보이지 않을 수 있으므로 미리보기에서 직접 확인해야 합니다."],
      checklist: ["바깥 점선 원 안에 얼굴·로고·테두리가 모두 들어오는지 확인", "작은 원 미리보기에서도 피사체가 식별되는지 확인", "최종 Instagram 앱에서 한 번 더 배치 확인"],
      examples: [{ title: "전신 사진을 작은 원으로", body: "사진 크기를 낮추고 원 안쪽 배경색을 밝게 두면 전신을 더 많이 남기면서 코랄색 테두리로 계정 이미지를 구분할 수 있습니다." }],
      relatedGuideIds: ["jpeg-png-webp"],
    },
    faqs: [
      { question: "1080×1080이 Instagram의 공식 프로필 규격인가요?", answer: "아니요. Instagram 전용 공식 의무 픽셀값으로 표시하지 않으며, 원형 표시와 재압축을 고려해 픽셀핏이 품질 여유를 둔 서비스 출력값입니다." },
      { question: "사진이 자동으로 꽉 차게 잘리나요?", answer: "기본값은 사진을 먼저 축소해 작은 원 안에 배치합니다. 원과 사진 크기를 직접 조절할 수 있으며 결과 전에 원형 표시를 미리 봅니다." },
      { question: "사진이 서버에 올라가나요?", answer: "아니요. 선택한 사진과 생성 결과는 현재 브라우저의 메모리에서만 처리합니다." },
    ],
    nextToolIds: ["social-image-pack", "image-compressor", "photo-privacy-cleaner"],
  }),
  defineTool({
    id: "youtube-thumbnail", slug: "youtube-thumbnail", workspaceKind: "youtube-thumbnail", category: "creator",
    title: "유튜브 썸네일", shortDescription: "공식 권장 3840×2160과 픽셀핏 자체 안전 여백으로 템플릿 썸네일을 만듭니다.", displaySpec: "3840×2160px · 16:9", searchTerms: ["유튜브", "썸네일", "thumbnail", "16:9"], sourceKind: "official",
    source: { authority: "YouTube 고객센터", title: "Add video thumbnails on YouTube", url: "https://support.google.com/youtube/answer/72431?hl=en", lastVerifiedAt: "2026-07-26" },
    seo: { title: "유튜브 썸네일 만들기 — 3840×2160 템플릿", description: `YouTube 공식 권장 3840×2160, 16:9 기준으로 제목과 사진 위치를 제한된 템플릿에서 조정해 JPG·PNG를 만듭니다. ${localEnding}`, searchAliases: ["유튜브", "썸네일", "thumbnail", "16:9"] },
    content: {
      intro: "범용 디자인 편집기 대신 긴 제목도 넘치지 않도록 제한한 템플릿과 사진 배치만 제공해 빠르게 16:9 결과를 만듭니다.",
      useCases: [
        { title: "영상 업로드용 썸네일", description: "사진과 제목을 네 가지 정해진 배치 중 하나에 넣어 16:9 업로드 파일을 빠르게 준비합니다." },
        { title: "모바일에서도 읽히는 제목", description: "작은 목록 미리보기에서 제목이 두 줄 안에 읽히는지 확인하고 글자 크기와 강조색을 조절합니다." },
        { title: "채널 이미지 이어 쓰기", description: "채널 배너에 쓴 사진을 현재 탭에서 다시 선택해 썸네일의 피사체 위치와 제목 공간을 맞춥니다." },
      ],
      outputExplanation: [{ title: "공식 권장 3840×2160", body: "YouTube 고객센터의 현재 권장값이며 최소 너비 640px, JPG·GIF·PNG와 16:9 권장을 함께 확인했습니다. 업로드 한도는 기기와 콘텐츠 유형에 따라 다릅니다." }],
      howTo: ["사진을 선택하고 피사체 위치를 정합니다.", "템플릿, 제목, 보조 문구와 강조색을 선택합니다.", "작은 미리보기와 실제 파일 규격을 확인해 저장합니다."],
      commonMistakes: [{ title: "작은 글자 많이 넣기", body: "모바일 목록에서는 작게 보이므로 제목은 짧고 굵게 유지하는 편이 안전합니다." }],
      limitations: ["세로 영상의 일부 모바일 화면에서는 자동 생성 4:5 썸네일로 대체될 수 있습니다."],
      checklist: ["모바일 축소 미리보기에서 제목 읽기", "중요한 얼굴과 글자가 가장자리에 닿지 않는지 확인"],
      examples: [{ title: "인물 오른쪽 템플릿", body: "인물을 오른쪽에 두고 왼쪽 어두운 그라데이션 위에 최대 두 줄 제목을 배치합니다." }],
      relatedGuideIds: ["jpeg-png-webp"],
    },
    faqs: [{ question: "1280×720이 최신 권장인가요?", answer: "현재 공식 안내의 권장은 3840×2160입니다. 이 도구는 그 값을 기본으로 사용합니다." }, { question: "Canva처럼 자유롭게 편집할 수 있나요?", answer: "아니요. 텍스트 넘침과 모바일 가독성을 줄이기 위해 네 가지 완성형 템플릿만 제공합니다." }],
    nextToolIds: ["youtube-banner", "social-image-pack", "image-compressor"],
  }),
  defineTool({
    id: "four-cut-photo", slug: "four-cut-photo", workspaceKind: "four-cut", category: "creative",
    title: "네컷사진 만들기", shortDescription: "사진 1~4장을 세로·가로 포토부스 프레임으로 조합합니다.", displaySpec: "세로 1200×1800 · 가로 1800×1200", searchTerms: ["네컷", "포토부스", "인생네컷", "콜라주"], sourceKind: "convention",
    seo: { title: "네컷사진 만들기 — 세로·가로 포토부스 프레임", description: `사진 1~4장의 순서와 크롭을 조정하고 흑백·빈티지, 프레임, 날짜와 짧은 문구를 넣어 네컷 JPG·PNG를 만듭니다. ${localEnding}`, searchAliases: ["네컷", "포토부스", "인생네컷", "콜라주"] },
    content: {
      intro: "공식 제출 규격이 아닌 픽셀핏 디지털 공유용 프리셋입니다. 사진이 부족하면 선택한 사진을 반복 배치한다고 명확히 표시합니다.",
      useCases: [
        { title: "여행 사진 네 장 공유", description: "서로 다른 여행 장면을 세로 또는 가로 한 장에 정리해 메신저와 소셜 피드에 바로 올립니다." },
        { title: "한 장으로 포토부스 구성", description: "사진이 한 장뿐이어도 네 칸에 반복 배치하고 각 칸의 위치를 다르게 조절해 리듬을 만듭니다." },
        { title: "필름 효과 전 레이아웃", description: "먼저 사진 순서와 프레임을 완성한 뒤 같은 결과를 필름사진 도구로 넘겨 색감과 날짜를 더합니다." },
      ],
      outputExplanation: [{ title: "서비스 프리셋", body: "세로 1200×1800과 가로 1800×1200은 디지털 공유를 위한 픽셀핏 값이며 특정 인화 서비스 규격이 아닙니다." }],
      howTo: ["1~4장의 사진을 고르고 순서를 확인합니다.", "세로·가로, 프레임과 필터, 날짜·문구를 정합니다.", "각 칸의 위치를 확인한 뒤 JPG 또는 PNG로 저장합니다."],
      commonMistakes: [{ title: "인쇄 규격으로 오해", body: "결과는 디지털 공유용이며 인화하려면 인쇄소의 실제 종이 크기·여백·DPI 요구를 확인해야 합니다." }],
      limitations: ["자동 얼굴·사물 의미 분석 없이 중앙 크롭을 기본으로 사용합니다."],
      checklist: ["사진 순서와 반복 칸 확인", "문구·날짜 오탈자와 프레임 대비 확인"],
      examples: [{ title: "사진 두 장", body: "1·3번째 칸에는 첫 사진, 2·4번째 칸에는 두 번째 사진을 순환 배치합니다." }],
      relatedGuideIds: ["jpeg-png-webp"],
    },
    faqs: [{ question: "인화소 규격인가요?", answer: "아니요. 디지털 공유용 픽셀핏 서비스 프리셋이며 인화 전 업체 규격을 별도로 확인해야 합니다." }, { question: "사진 한 장만 있어도 되나요?", answer: "네. 같은 사진을 네 칸에 반복하고 각 칸 위치를 조정할 수 있습니다." }],
    nextToolIds: ["film-photo", "social-image-pack", "image-compressor"],
  }),
  defineTool({
    id: "film-photo", slug: "film-photo", workspaceKind: "film", category: "creative",
    title: "필름사진 효과", shortDescription: "그레인·비네팅·빛샘·날짜 스탬프로 필름 느낌을 만듭니다.", displaySpec: "로컬 필름 효과 · JPG/PNG", searchTerms: ["필름", "빈티지", "그레인", "빛샘", "흑백"], sourceKind: "convention",
    seo: { title: "필름사진 효과 — 그레인·비네팅·빛샘 만들기", description: `사진에 필름 그레인, 비네팅, 빛샘, 흑백·저채도·플래시와 날짜 스탬프를 적용해 JPG·PNG로 저장합니다. ${localEnding}`, searchAliases: ["필름", "빈티지", "그레인", "빛샘", "흑백"] },
    content: {
      intro: "생성형 AI나 외부 필터 서비스를 사용하지 않습니다. 같은 사진과 같은 설정을 사용하면 같은 필름 효과가 만들어집니다.",
      useCases: [
        { title: "일상 사진에 필름 분위기", description: "채도와 대비를 부드럽게 조절하고 미세한 입자감을 더해 평범한 일상 사진의 분위기를 바꿉니다." },
        { title: "네컷에 날짜와 그레인", description: "완성한 네컷사진을 이어 받아 필름 입자와 날짜 스탬프를 넣고 포토부스 느낌을 더합니다." },
        { title: "흑백과 컬러 비교", description: "원본과 결과를 나란히 보며 흑백·저채도·플래시 효과가 얼굴과 글자를 지나치게 가리지 않는지 확인합니다." },
      ],
      outputExplanation: [{ title: "사진을 새로 만들지 않는 효과", body: "그레인·비네팅·빛샘은 사진 내용을 새로 생성하지 않고 현재 색과 밝기만 일정한 방식으로 바꿉니다." }],
      howTo: ["사진을 선택합니다.", "필름 유형과 그레인·비네팅·빛샘·강도를 조정합니다.", "원본 비교 뒤 JPG 또는 PNG로 저장합니다."],
      commonMistakes: [{ title: "강도를 너무 높이기", body: "강한 색 변화는 피부색과 사진 의미를 왜곡할 수 있으므로 비교 화면으로 중요한 색을 확인하세요." }],
      limitations: ["필터는 실제 필름·렌즈·현상 공정을 재현하거나 인증하지 않습니다."],
      checklist: ["원본 비교에서 피부색·글자 식별 확인", "날짜 스탬프가 사진 내용을 가리지 않는지 확인"],
      examples: [{ title: "저채도 필름 45%", body: "채도를 낮추고 같은 설정의 미세한 입자감과 약한 가장자리 어둡기를 더합니다." }],
      relatedGuideIds: ["jpeg-png-webp"],
    },
    faqs: [{ question: "생성형 AI를 쓰나요?", answer: "아니요. 사진의 색과 밝기, 입자감을 기기 안에서 정해진 방식으로 바꿉니다." }, { question: "같은 설정이면 결과도 같나요?", answer: "네. 같은 사진과 같은 설정을 사용하면 같은 필름 효과가 만들어집니다." }],
    nextToolIds: ["four-cut-photo", "social-image-pack", "image-compressor"],
  }),
];

export const tools = [...legacyTools, ...newTools];
export const toolBySlug = new Map(tools.map((tool) => [tool.slug, tool]));
export const toolById = new Map(tools.map((tool) => [tool.id, tool]));

for (const tool of tools) {
  for (const targetId of tool.nextToolIds) {
    if (!toolById.has(targetId)) throw new Error(`${tool.id}의 다음 도구가 존재하지 않습니다: ${targetId}`);
  }
}

export function getTool(slugOrId: string): ToolDefinition | undefined {
  return toolBySlug.get(slugOrId) ?? toolById.get(slugOrId);
}

export const homeCategories = [
  { id: "popular", title: "오늘 자주 쓰는 도구", description: "용량·크기·형식을 빠르게 맞춥니다." },
  { id: "creator", title: "SNS·크리에이터", description: "여러 화면에서 중요한 부분이 남도록 만듭니다." },
  { id: "creative", title: "감성 프리셋", description: "네컷사진과 필름 느낌의 사진을 기기 안에서 만듭니다." },
  { id: "official", title: "공식 사진", description: "출처와 자동 확인의 한계를 함께 봅니다." },
  { id: "web", title: "웹·업무", description: "웹 아이콘과 업무용 결과를 묶어 준비합니다." },
  { id: "privacy", title: "개인정보", description: "사진에 남은 위치·기기 정보를 살펴봅니다." },
] as const;
