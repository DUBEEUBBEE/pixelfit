import { validatePresetRegistry, type ImagePreset } from "./schema";

const checkedAt = "2026-07-22";
const maxInputBytes = 25 * 1024 * 1024;
const maxPixels = 40_000_000;
const commonInput = { formats: ["jpeg", "png", "webp"] as const, maxBytes: maxInputBytes, maxPixels };

const rawPresets = [
  {
    id: "passport-photo",
    slug: "passport-photo",
    category: "official",
    title: "한국 온라인 여권사진",
    shortDescription: "413×531px·500KB 이하 JPG로 정확하게 맞춥니다.",
    searchTerms: ["여권", "여권사진", "온라인 여권", "passport"],
    sourceKind: "official",
    output: { width: 413, height: 531, dpi: 300, formats: ["jpeg"], maxBytes: 500 * 1024, physicalLabel: "3.5 × 4.5cm 기준" },
    input: commonInput,
    source: { authority: "대한민국 외교부", title: "온라인용 사진파일 안내", url: "https://www.passport.go.kr/home/kor/contents.do?menuPos=12", lastVerifiedAt: checkedAt },
    allowedOperations: ["rotate", "crop", "resize", "compress", "face-detect"],
    forbiddenOperations: ["background-remove", "background-replace", "retouch", "generative-fill"],
    compliance: { approvalGuaranteed: false, disclaimer: "자동 검사는 참고용이며 실제 여권 발급 심사 결과와 다를 수 있습니다." },
    variants: [
      { id: "face", label: "얼굴 중심", description: "얼굴을 가운데에 두는 기본 구도" },
      { id: "roomy", label: "여백 확인", description: "머리 위 여백을 직접 확인하기 좋은 구도" },
    ],
    checks: [
      { id: "dimensions", label: "413×531px 출력", automated: true },
      { id: "filesize", label: "500KB 이하", automated: true },
      { id: "face", label: "얼굴 수와 중심 위치", automated: true, limitation: "지원 브라우저의 감지 결과를 이용한 참고값입니다." },
      { id: "head", label: "머리 길이 3.2~3.6cm", automated: false, limitation: "안내선으로 직접 확인해야 합니다." },
      { id: "capture-date", label: "6개월 이내 촬영", automated: false },
    ],
    faqs: [
      { question: "배경을 흰색으로 바꿔주나요?", answer: "아니요. 외교부 안내에 따라 배경 제거·합성 경로를 여권사진에서 실행할 수 없게 막았습니다." },
      { question: "이 결과면 접수가 보장되나요?", answer: "보장되지 않습니다. 픽셀과 파일 용량을 맞추고 참고 검사를 제공하며, 최종 판단은 접수기관이 합니다." },
      { question: "사진은 서버에 올라가나요?", answer: "아니요. 선택한 파일은 이 브라우저의 메모리에서만 처리됩니다." },
    ],
    limitations: ["표정·렌즈·얼굴 가림·촬영일·실제 승인 여부는 자동 확정할 수 없습니다.", "배경은 원본을 유지하며 합성하지 않습니다."],
  },
  {
    id: "id-photo",
    slug: "id-photo",
    category: "id-photo",
    title: "일반 증명사진 3×4cm",
    shortDescription: "널리 쓰이는 3×4cm 인화 비율과 배경 테마를 만듭니다.",
    searchTerms: ["증명사진", "3x4", "이력서", "사진 배경"],
    sourceKind: "convention",
    output: { width: 354, height: 472, dpi: 300, formats: ["jpeg", "png"], physicalLabel: "3 × 4cm (300dpi)" },
    input: commonInput,
    allowedOperations: ["rotate", "crop", "resize", "face-detect", "background-remove", "background-replace"],
    forbiddenOperations: ["retouch", "generative-fill"],
    compliance: { approvalGuaranteed: false, disclaimer: "국내에서 널리 사용되는 일반 인화 규격입니다. 제출기관의 별도 기준을 확인하세요." },
    variants: [
      { id: "original", label: "원본 배경", description: "배경을 바꾸지 않습니다." },
      { id: "white", label: "흰색", description: "자동 분리 후 흰 배경을 시도합니다." },
      { id: "gray", label: "연한 회색", description: "자동 분리 후 연한 회색 배경을 시도합니다." },
      { id: "blue", label: "연한 파랑", description: "자동 분리 후 연한 파랑 배경을 시도합니다." },
    ],
    checks: [{ id: "dimensions", label: "354×472px 출력", automated: true }, { id: "resolution", label: "원본 해상도", automated: true }],
    faqs: [
      { question: "3×4cm가 모든 기관의 공식 규격인가요?", answer: "아니요. 널리 쓰이는 인화 관행이며 제출기관에 따라 요구가 다릅니다." },
      { question: "배경 정리가 완벽한가요?", answer: "단순한 배경에서 자동 분리를 시도합니다. 가장자리가 어색하면 원본 배경을 선택하세요." },
    ],
    limitations: ["배경 분리는 기기 내 색상 경계 추정이며 복잡한 머리카락과 배경에서는 부정확할 수 있습니다."],
  },
  {
    id: "resident-id-photo",
    slug: "resident-id-photo",
    category: "official",
    title: "주민등록증 사진",
    shortDescription: "3.5×4.5cm를 300dpi 기준 413×531px로 만듭니다.",
    searchTerms: ["주민등록증", "민증", "3.5x4.5", "신분증"],
    sourceKind: "official",
    output: { width: 413, height: 531, dpi: 300, formats: ["jpeg", "png"], physicalLabel: "3.5 × 4.5cm (300dpi 환산)" },
    input: commonInput,
    source: { authority: "행정안전부 모바일 신분증", title: "모바일 주민등록증 발급 안내", url: "https://www.mobileid.go.kr/mip/hps/issuReqstGuidance/issuReqstGuidanceMrc.do", lastVerifiedAt: checkedAt },
    allowedOperations: ["rotate", "crop", "resize", "face-detect", "background-remove", "background-replace"],
    forbiddenOperations: ["retouch", "generative-fill"],
    compliance: { approvalGuaranteed: false, disclaimer: "413×531px은 물리 규격의 300dpi 환산값입니다. 제출 경로에 따라 별도 파일 규격이 있을 수 있습니다." },
    variants: [
      { id: "original", label: "원본 배경 (권장)", description: "제출 기준 확인 전에는 원본을 유지합니다." },
      { id: "white", label: "흰색 배경", description: "제출처 기준을 확인한 경우에만 사용하세요." },
      { id: "gray", label: "연한 회색", description: "제출처 기준을 확인한 경우에만 사용하세요." },
    ],
    checks: [{ id: "dimensions", label: "413×531px 출력", automated: true }, { id: "resolution", label: "원본 해상도", automated: true }, { id: "face", label: "얼굴 중심", automated: true, limitation: "감지 가능한 브라우저에서만 참고값을 제공합니다." }],
    faqs: [
      { question: "413×531px이 공식 온라인 업로드 규격인가요?", answer: "아니요. 3.5×4.5cm를 300dpi로 환산한 서비스 기본값입니다." },
      { question: "배경을 바꿔도 되나요?", answer: "제출처 기준을 먼저 확인하세요. 기본값은 원본 배경 유지입니다." },
    ],
    limitations: ["제출처별 온라인 픽셀·파일 형식 요구는 별도로 확인해야 합니다."],
  },
  {
    id: "youtube-banner",
    slug: "youtube-banner",
    category: "social",
    title: "유튜브 채널 배너",
    shortDescription: "2560×1440px와 텍스트·로고 안전영역을 함께 맞춥니다.",
    searchTerms: ["유튜브", "채널 배너", "채널 아트", "2560x1440"],
    sourceKind: "official",
    output: { width: 2560, height: 1440, formats: ["jpeg", "png"], maxBytes: 6 * 1024 * 1024 },
    input: commonInput,
    source: { authority: "YouTube 고객센터", title: "채널 브랜딩 관리", url: "https://support.google.com/youtube/answer/10456525?hl=ko", lastVerifiedAt: checkedAt },
    allowedOperations: ["crop", "resize", "compress", "face-detect", "blur-fill"],
    forbiddenOperations: ["retouch", "generative-fill"],
    compliance: { approvalGuaranteed: false, disclaimer: "기기별 크롭은 예상 표시입니다. YouTube의 실제 렌더링을 보장하지 않습니다." },
    variants: [
      { id: "fit", label: "원본 맞춤", description: "사진 전체가 보이도록 맞춥니다." },
      { id: "blur", label: "블러 채우기", description: "빈 영역을 같은 사진의 흐림 배경으로 채웁니다." },
      { id: "left", label: "왼쪽 배치", description: "중요 피사체를 안전영역 왼쪽에 둡니다." },
      { id: "center", label: "중앙 배치", description: "중요 피사체를 안전영역 중앙에 둡니다." },
      { id: "right", label: "오른쪽 배치", description: "중요 피사체를 안전영역 오른쪽에 둡니다." },
    ],
    checks: [{ id: "dimensions", label: "2560×1440px 출력", automated: true }, { id: "filesize", label: "6MB 이하", automated: true }, { id: "safe-area", label: "텍스트·로고 안전영역", automated: false }],
    faqs: [
      { question: "모바일에서도 같은 영역이 보이나요?", answer: "화면에 예상 크롭을 보여드리지만 기기와 YouTube UI에 따라 실제 표시가 달라질 수 있습니다." },
      { question: "텍스트를 추가할 수 있나요?", answer: "현재 도구는 업로드한 사진이나 로고 배치에 집중하며 범용 텍스트 편집기는 포함하지 않습니다." },
    ],
    limitations: ["기기별 미리보기는 공식 최소 안전영역을 비율 환산한 예상치입니다."],
  },
  {
    id: "favicon-maker",
    slug: "favicon-maker",
    category: "web",
    title: "파비콘 패키지 생성기",
    shortDescription: "ICO·PNG·manifest·설치 안내를 한 번에 ZIP으로 만듭니다.",
    searchTerms: ["파비콘", "favicon", "ico", "웹 아이콘", "manifest"],
    sourceKind: "official",
    output: { formats: ["png", "ico", "zip"] },
    input: commonInput,
    source: { authority: "Google Search Central", title: "검색결과에 표시할 파비콘 정의하기", url: "https://developers.google.com/search/docs/appearance/favicon-in-search?hl=ko", lastVerifiedAt: checkedAt },
    allowedOperations: ["crop", "resize", "favicon-package", "background-replace"],
    forbiddenOperations: ["retouch", "generative-fill"],
    compliance: { approvalGuaranteed: false, disclaimer: "가이드라인을 충족해도 검색결과 노출은 보장되지 않습니다." },
    variants: [
      { id: "fill", label: "꽉 채우기", description: "정사각형을 가득 채웁니다." },
      { id: "safe", label: "안전 여백", description: "가장자리에 14% 여백을 둡니다." },
      { id: "circle", label: "원형 배경", description: "단색 원 위에 이미지를 올립니다." },
      { id: "rounded", label: "둥근 사각형", description: "둥근 단색 배경을 사용합니다." },
      { id: "transparent", label: "투명 배경", description: "원본의 투명 영역을 유지합니다." },
      { id: "solid", label: "단색 배경", description: "선택한 단색으로 빈 영역을 채웁니다." },
    ],
    checks: [{ id: "square", label: "1:1 정사각형", automated: true }, { id: "zip", label: "필수 파일과 크기", automated: true }],
    faqs: [
      { question: "사진이 벡터 SVG로 바뀌나요?", answer: "아니요. raster 입력을 벡터로 변환했다고 주장하지 않으며 결과 ZIP에는 가짜 SVG를 넣지 않습니다." },
      { question: "ICO 안에 어떤 크기가 들어가나요?", answer: "16, 32, 48px PNG 프레임을 담은 멀티사이즈 ICO를 생성합니다." },
    ],
    limitations: ["복잡한 원본은 16px에서 식별하기 어려울 수 있습니다.", "현재 입력은 안전한 raster JPEG·PNG·WebP로 제한합니다."],
  },
  {
    id: "photo-privacy-cleaner",
    slug: "photo-privacy-cleaner",
    category: "privacy",
    title: "사진 개인정보 메타데이터 정리",
    shortDescription: "위치·기기·촬영일 같은 정보를 선택해 기기 안에서 제거합니다.",
    searchTerms: ["위치정보", "개인정보", "EXIF", "메타데이터", "GPS"],
    sourceKind: "convention",
    output: { formats: ["jpeg", "png", "webp"] },
    input: commonInput,
    allowedOperations: ["metadata-strip"],
    forbiddenOperations: ["retouch", "generative-fill"],
    compliance: { approvalGuaranteed: false, disclaimer: "알려진 개인정보성 메타데이터를 정리합니다. 모든 비식별성을 보장하지는 않습니다." },
    checks: [{ id: "reparse", label: "선택 정보 제거 후 다시 확인", automated: true }, { id: "pixel-payload", label: "실제 사진 내용 유지", automated: true, limitation: "지원되는 JPEG·PNG·WebP 파일에서 확인합니다." }],
    faqs: [
      { question: "사진 화질이 바뀌나요?", answer: "지원 형식에서는 실제 사진 내용을 다시 저장하지 않고 촬영 정보 구역만 정리합니다." },
      { question: "Content Credentials도 지우나요?", answer: "아니요. 알려진 C2PA·JUMBF 등 출처 정보는 제거 대상으로 제공하지 않습니다." },
      { question: "HEIC도 지원하나요?", answer: "현재는 안정성과 번들 크기 때문에 JPEG·PNG·WebP만 지원하며 외부 변환 서버를 사용하지 않습니다." },
    ],
    limitations: ["알 수 없는 제조사 전용 메타데이터를 모두 식별한다고 보장하지 않습니다.", "파일 수정은 기존 콘텐츠 자격 증명의 유효성에 영향을 줄 수 있습니다."],
  },
] as const;

export const presets = validatePresetRegistry(rawPresets) as ImagePreset[];

export const presetBySlug = new Map(presets.map((preset) => [preset.slug, preset]));

export function getPreset(slug: string): ImagePreset | undefined {
  return presetBySlug.get(slug);
}

export function isOperationAllowed(preset: ImagePreset, operation: ImagePreset["allowedOperations"][number]): boolean {
  return preset.allowedOperations.includes(operation) && !preset.forbiddenOperations.includes(operation);
}
