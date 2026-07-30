import compressorManifest from "../../public/samples/image-compressor/manifest.json";

export const sampleToolIds = [
  "image-compressor",
  "youtube-thumbnail",
  "four-cut-photo",
  "film-photo",
  "passport-photo",
] as const;

export type SampleToolId = (typeof sampleToolIds)[number];

export type SampleAsset = {
  id: string;
  title: string;
  src: `/samples/${string}.${"png" | "svg"}`;
  thumbnailSrc?: `/samples/${string}.png`;
  thumbnailWidth?: number;
  thumbnailHeight?: number;
  alt: string;
  width: number;
  height: number;
  caption: string;
  displayedBytes?: number;
  actualBytes?: number;
};

export type SampleGalleryDefinition = {
  toolId: SampleToolId;
  eyebrow: string;
  heading: string;
  description: string;
  items: readonly SampleAsset[];
};

function formatSampleBytes(value: number): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/gu, ",");
}

export const sampleGalleries: Readonly<Record<SampleToolId, SampleGalleryDefinition>> = {
  "image-compressor": {
    toolId: "image-compressor",
    eyebrow: "원본과 목표별 결과 4종",
    heading: "목표가 작아질수록 달라지는 부분을 먼저 보세요.",
    description: "같은 자체 제작 장면의 색상 단계와 노이즈 세부 묘사를 줄여 만든 결정적 PNG 비교용 예시입니다. 도구에 올린 실제 사진의 결과는 사진과 출력 형식에 따라 달라집니다. 각 카드의 숫자는 생성 파일을 빌드에서 다시 읽은 실제 바이트이며, 실제 도구에서는 JPG·PNG·WebP 중에서 선택합니다.",
    items: [
      {
        id: "original",
        title: "원본",
        src: "/samples/image-compressor/original.png",
        thumbnailSrc: "/samples/image-compressor/thumbnails/original.png",
        thumbnailWidth: 480,
        thumbnailHeight: 320,
        alt: "그라데이션과 작은 글자, 얇은 선, 노이즈, 단색 도형을 모두 선명하게 넣은 압축 전 자체 제작 원본 도식",
        width: 1200,
        height: 800,
        caption: `${compressorManifest.original.width}×${compressorManifest.original.height}px · 실제 ${formatSampleBytes(compressorManifest.original.actualBytes)}바이트 · PNG · 해상도 축소 없음 · 확인: 작은 글자·얇은 선·색 경계 기준`,
        displayedBytes: compressorManifest.original.actualBytes,
        actualBytes: compressorManifest.original.actualBytes,
      },
      {
        id: "target-500kb",
        title: "500KB 목표",
        src: "/samples/image-compressor/target-500kb.png",
        thumbnailSrc: "/samples/image-compressor/thumbnails/target-500kb.png",
        thumbnailWidth: 480,
        thumbnailHeight: 320,
        alt: "원본 해상도를 유지하면서 그라데이션과 작은 글자, 얇은 선의 차이를 비교하는 500KB 목표 자체 제작 결과 도식",
        width: 1200,
        height: 800,
        caption: `${compressorManifest["target-500kb"].width}×${compressorManifest["target-500kb"].height}px · 실제 ${formatSampleBytes(compressorManifest["target-500kb"].actualBytes)}바이트 · PNG · 해상도 축소 없음 · 확인: 작은 글자와 노이즈`,
        displayedBytes: compressorManifest["target-500kb"].actualBytes,
        actualBytes: compressorManifest["target-500kb"].actualBytes,
      },
      {
        id: "target-200kb",
        title: "200KB 목표",
        src: "/samples/image-compressor/target-200kb.png",
        thumbnailSrc: "/samples/image-compressor/thumbnails/target-200kb.png",
        thumbnailWidth: 480,
        thumbnailHeight: 320,
        alt: "원본 해상도를 유지하되 작은 글자와 노이즈의 단순화가 더 잘 보이는 200KB 목표 자체 제작 결과 도식",
        width: 1200,
        height: 800,
        caption: `${compressorManifest["target-200kb"].width}×${compressorManifest["target-200kb"].height}px · 실제 ${formatSampleBytes(compressorManifest["target-200kb"].actualBytes)}바이트 · PNG · 해상도 축소 없음 · 확인: 그라데이션 띠와 색 경계`,
        displayedBytes: compressorManifest["target-200kb"].actualBytes,
        actualBytes: compressorManifest["target-200kb"].actualBytes,
      },
      {
        id: "target-100kb-downscaled",
        title: "100KB 목표 · 축소 허용",
        src: "/samples/image-compressor/target-100kb-downscaled.png",
        thumbnailSrc: "/samples/image-compressor/thumbnails/target-100kb-downscaled.png",
        thumbnailWidth: 480,
        thumbnailHeight: 320,
        alt: "해상도를 900×600픽셀로 줄이고 얇은 선과 노이즈를 단순화한 100KB 목표 자체 제작 결과 도식",
        width: 900,
        height: 600,
        caption: `${compressorManifest["target-100kb-downscaled"].width}×${compressorManifest["target-100kb-downscaled"].height}px · 실제 ${formatSampleBytes(compressorManifest["target-100kb-downscaled"].actualBytes)}바이트 · PNG · 해상도 축소 적용 · 확인: 작은 글자·얇은 선과 축소 영향`,
        displayedBytes: compressorManifest["target-100kb-downscaled"].actualBytes,
        actualBytes: compressorManifest["target-100kb-downscaled"].actualBytes,
      },
    ],
  },
  "youtube-thumbnail": {
    toolId: "youtube-thumbnail",
    eyebrow: "4가지 템플릿",
    heading: "같은 추상 장면도 제목 배치에 따라 달라집니다.",
    description: "외부 사진 없이 직접 만든 추상 풍경으로 실제 편집기의 네 가지 제목 배치를 비교했습니다.",
    items: [
      {
        id: "editorial-left",
        title: "인물 왼쪽 · 제목 오른쪽",
        src: "/samples/youtube-thumbnail/editorial-left.svg",
        alt: "실제 얼굴 대신 자체 제작 인물 실루엣을 왼쪽에 두고 오늘의 색을 기록하는 법이라는 제목을 오른쪽에 배치한 썸네일 예시",
        width: 1280,
        height: 720,
        caption: "인물 실루엣 왼쪽 · 큰 제목 오른쪽",
      },
      {
        id: "editorial-right",
        title: "인물 오른쪽 · 제목 왼쪽",
        src: "/samples/youtube-thumbnail/editorial-right.svg",
        alt: "실제 얼굴 대신 자체 제작 인물 실루엣을 오른쪽에 두고 한 장으로 완성하는 썸네일이라는 제목을 왼쪽에 배치한 예시",
        width: 1280,
        height: 720,
        caption: "큰 제목 왼쪽 · 인물 실루엣 오른쪽",
      },
      {
        id: "center-impact",
        title: "중앙 임팩트",
        src: "/samples/youtube-thumbnail/center-impact.svg",
        alt: "추상 산 풍경 중앙에 사진 한 장의 힘이라는 큰 제목을 배치한 썸네일 예시",
        width: 1280,
        height: 720,
        caption: "중앙 큰 제목과 하단 그라디언트",
      },
      {
        id: "lower-third",
        title: "로어 서드",
        src: "/samples/youtube-thumbnail/lower-third.svg",
        alt: "추상 산 풍경을 넓게 보이게 두고 아래쪽 제목 바에 사진을 넓게 보여주는 로어 서드라고 적은 썸네일 예시",
        width: 1280,
        height: 720,
        caption: "사진을 넓게 남기는 하단 제목 바",
      },
    ],
  },
  "four-cut-photo": {
    toolId: "four-cut-photo",
    eyebrow: "4가지 결과 예시",
    heading: "세로·가로와 프레임 톤을 비교하세요.",
    description: "직접 만든 추상 풍경 네 장을 실제 도구의 세로·가로 방향과 프레임 톤에 맞춰 배치했습니다.",
    items: [
      {
        id: "vertical-mint",
        title: "세로 민트 프레임",
        src: "/samples/four-cut-photo/vertical-mint.svg",
        alt: "민트색 세로 프레임 안에 추상 풍경 네 장을 위아래로 배치한 네컷사진 예시",
        width: 800,
        height: 1200,
        caption: "세로 스트립 · 원본 톤",
      },
      {
        id: "vertical-mono",
        title: "세로 흑백 프레임",
        src: "/samples/four-cut-photo/vertical-mono.svg",
        alt: "짙은 세로 프레임 안에 흑백 추상 풍경 네 장을 위아래로 배치한 네컷사진 예시",
        width: 800,
        height: 1200,
        caption: "세로 스트립 · 흑백 톤",
      },
      {
        id: "horizontal-coral",
        title: "가로 코랄 프레임",
        src: "/samples/four-cut-photo/horizontal-coral.svg",
        alt: "코랄색 가로 프레임 안에 추상 풍경 네 장을 2열 2행으로 배치한 네컷사진 예시",
        width: 1200,
        height: 800,
        caption: "가로 2×2 · 원본 톤",
      },
      {
        id: "horizontal-vintage",
        title: "가로 빈티지 프레임",
        src: "/samples/four-cut-photo/horizontal-vintage.svg",
        alt: "크림색 가로 프레임 안에 따뜻한 추상 풍경 네 장을 2열 2행으로 배치한 네컷사진 예시",
        width: 1200,
        height: 800,
        caption: "가로 2×2 · 빈티지 톤",
      },
    ],
  },
  "film-photo": {
    toolId: "film-photo",
    eyebrow: "원본과 4가지 모드",
    heading: "같은 장면에서 효과 차이를 확인하세요.",
    description: "동일한 직접 제작 추상 풍경을 원본과 빛샘·흑백·저채도·플래시 모드로 나란히 비교합니다. 효과 카드는 약한 적용과 강한 적용을 한 화면에서 보여줍니다.",
    items: [
      {
        id: "original",
        title: "원본",
        src: "/samples/film-photo/original.svg",
        alt: "필름 효과를 적용하지 않은 파란 하늘과 산, 주황색 들판의 추상 풍경 원본",
        width: 1200,
        height: 800,
        caption: "강도·그레인·비네팅 0",
      },
      {
        id: "light-leak",
        title: "빛샘 효과",
        src: "/samples/film-photo/light-leak.svg",
        alt: "따뜻한 빛샘과 같은 설정에서 같은 무늬가 나오는 그레인, 비네팅을 표현한 추상 풍경 필름 예시",
        width: 1200,
        height: 800,
        caption: "따뜻한 빛샘과 그레인",
      },
      {
        id: "mono",
        title: "흑백 필름",
        src: "/samples/film-photo/mono.svg",
        alt: "색상을 실제로 제거한 흑백 풍경의 왼쪽 약한 톤과 오른쪽 강한 톤을 비교하는 자체 제작 필름 예시",
        width: 1200,
        height: 800,
        caption: "흑백 변환과 같은 설정의 반복 가능한 결과",
      },
      {
        id: "low-saturation",
        title: "저채도 필름",
        src: "/samples/film-photo/low-saturation.svg",
        alt: "차분한 저채도 효과를 왼쪽은 약하게 오른쪽은 강하게 적용하고 같은 무늬의 그레인을 표현한 추상 풍경 필름 예시",
        width: 1200,
        height: 800,
        caption: "차분한 채도의 약한 적용과 강한 적용",
      },
      {
        id: "flash",
        title: "플래시 카메라",
        src: "/samples/film-photo/flash.svg",
        alt: "밝은 중심부 플래시를 왼쪽은 약하게 오른쪽은 강하게 적용하고 같은 무늬의 그레인을 표현한 추상 풍경 예시",
        width: 1200,
        height: 800,
        caption: "밝은 플래시의 약한 적용과 강한 적용",
      },
    ],
  },
  "passport-photo": {
    toolId: "passport-photo",
    eyebrow: "5가지 확인 도식",
    heading: "자동 판정 대신 확인할 배치를 보여드립니다.",
    description: "실제 얼굴 사진이 아닌 추상 인물 도형으로 머리 위 여백·얼굴 크기·좌우 중심·배경 그림자를 비교합니다. 자동 검사는 참고용이며 실제 심사 결과와 다를 수 있습니다.",
    items: [
      {
        id: "top-margin-tight",
        title: "머리 위 여백이 부족한 예",
        src: "/samples/passport-photo/top-margin-tight.svg",
        alt: "실제 얼굴이 아닌 추상 인물 도형의 머리가 위쪽 확인선에 너무 가까워 머리 위 여백을 다시 봐야 하는 배치 도식",
        width: 826,
        height: 1062,
        caption: "확인이 필요한 배치 · 머리 위 여백을 다시 확인",
      },
      {
        id: "face-too-small",
        title: "얼굴이 너무 작은 예",
        src: "/samples/passport-photo/face-too-small.svg",
        alt: "실제 얼굴이 아닌 작은 추상 인물 도형으로 얼굴 크기와 상하 여백을 다시 봐야 하는 배치 도식",
        width: 826,
        height: 1062,
        caption: "확인이 필요한 배치 · 얼굴 크기를 다시 확인",
      },
      {
        id: "off-center",
        title: "좌우로 치우친 예",
        src: "/samples/passport-photo/off-center.svg",
        alt: "실제 얼굴이 아닌 추상 인물 도형이 중앙선 오른쪽으로 치우쳐 좌우 중심을 다시 봐야 하는 배치 도식",
        width: 826,
        height: 1062,
        caption: "확인이 필요한 배치 · 얼굴 중심을 다시 확인",
      },
      {
        id: "background-shadow",
        title: "배경 그림자가 의심되는 예",
        src: "/samples/passport-photo/background-shadow.svg",
        alt: "실제 얼굴이 아닌 추상 인물 도형 뒤에 회색 그림자를 표시해 배경 상태를 직접 확인해야 하는 도식",
        width: 826,
        height: 1062,
        caption: "확인이 필요한 배치 · 배경 그림자를 직접 확인",
      },
      {
        id: "near-recommended",
        title: "권장 범위에 가까운 배치 예",
        src: "/samples/passport-photo/near-recommended.svg",
        alt: "실제 얼굴이 아닌 추상 인물 도형을 중앙과 참고 안내선에 가깝게 배치하되 실제 심사 결과와 다를 수 있다고 표시한 도식",
        width: 826,
        height: 1062,
        caption: "규격 확인 예시 · 실제 심사 결과와 다를 수 있음",
      },
    ],
  },
};

export const allSampleAssets = sampleToolIds.flatMap((toolId) => sampleGalleries[toolId].items);

export function getSampleGallery(toolId: string): SampleGalleryDefinition | undefined {
  return sampleToolIds.includes(toolId as SampleToolId)
    ? sampleGalleries[toolId as SampleToolId]
    : undefined;
}
