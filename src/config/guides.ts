export type GuideSection = {
  id: string;
  title: string;
  paragraphs: readonly string[];
  bullets?: readonly string[];
};

export type GuideExampleTable = {
  title: string;
  caption: string;
  headers: readonly [string, string, string, string];
  rows: readonly (readonly [string, string, string, string])[];
};

export type GuideDefinition = {
  slug: string;
  category: "공식 사진" | "파일 최적화" | "크기·인화" | "채널 디자인" | "웹 자산" | "개인정보";
  title: string;
  summary: string;
  problem: string;
  keywords: readonly string[];
  seo: {
    title: string;
    description: string;
    ogImage: string;
    contentPublishedAt: string;
    contentUpdatedAt: string;
  };
  source: {
    authority: string;
    title: string;
    url: string;
    lastVerifiedAt: string;
  };
  sections: readonly GuideSection[];
  example: GuideExampleTable;
  toolCtas: readonly { href: string; label: string; description: string }[];
  relatedGuideSlugs: readonly string[];
};

const contentPublishedAt = "2026-07-23";
const contentUpdatedAt = "2026-07-24";
const lastVerifiedAt = "2026-07-23";

export const guides = [
  {
    slug: "passport-photo-413x531",
    category: "공식 사진",
    title: "온라인 여권사진 413×531px 만드는 법",
    summary: "413×531px JPEG와 500KB 제한을 맞추되, 배경 합성이나 얼굴 보정 없이 원본 구도를 안전하게 조정하는 순서입니다.",
    problem: "온라인 여권 재발급을 준비하면서 사진의 권장 픽셀, 허용 용량, 배경 편집 범위를 한 번에 확인해야 할 때 읽어보세요.",
    keywords: ["여권사진 413x531", "온라인 여권사진", "여권사진 500KB", "여권사진 픽셀"],
    seo: {
      title: "여권사진 413×531px 만드는 법",
      description: "온라인 여권사진을 413×531px JPEG·500KB 이하로 준비하는 계산, 크롭, 용량 확인 순서를 공식 기준과 함께 설명합니다.",
      ogImage: "/og/guides/passport-photo-413x531.png",
      contentPublishedAt,
      contentUpdatedAt,
    },
    source: {
      authority: "대한민국 외교부 여권안내",
      title: "온라인용 사진파일 안내",
      url: "https://www.passport.go.kr/home/kor/contents.do?menuPos=12",
      lastVerifiedAt,
    },
    sections: [
      {
        id: "requirements",
        title: "먼저 확인할 온라인 파일 기준",
        paragraphs: [
          "외교부 온라인용 사진 안내의 권장 크기는 가로 413px, 세로 531px이며 기본 파일은 JPEG로 준비합니다. 파일 크기는 500KB 이하여야 합니다.",
          "픽셀과 용량을 맞췄다고 접수가 보장되는 것은 아닙니다. 촬영 시점, 표정, 안경, 얼굴 가림, 배경 상태처럼 사진 내용에 관한 기준도 별도로 확인해야 합니다.",
        ],
        bullets: ["가로 413px × 세로 531px", "JPEG(JPG), 500KB 이하", "원본 비율을 유지한 크롭·리사이즈만 사용", "배경 제거·합성·얼굴 비율 변경은 사용하지 않음"],
      },
      {
        id: "crop",
        title: "빈 가장자리 없이 413×531 비율로 자르기",
        paragraphs: [
          "413:531은 약 0.778:1인 세로 비율입니다. 원본을 이 비율로 자를 때는 먼저 사진이 출력 프레임을 완전히 덮도록 확대한 뒤 얼굴을 중앙으로 옮깁니다.",
          "머리 위 여백과 턱 아래 공간은 안내선을 참고해 직접 확인합니다. 자동 얼굴 감지는 시작 위치를 돕는 참고값일 뿐, 정수리나 실제 심사 적합성을 확정하지 못합니다.",
        ],
        bullets: ["회전이 필요하면 크롭 전에 90도 단위로 정리", "원본을 찌그러뜨리지 말고 동일 비율로 확대", "얼굴 중심과 머리 위 여백을 눈으로 재확인"],
      },
      {
        id: "export-check",
        title: "내려받은 파일을 다시 확인하기",
        paragraphs: [
          "결과를 만든 뒤 화면의 예상값이 아니라 실제 Blob의 픽셀과 바이트를 확인해야 합니다. 500KB는 512,000바이트를 기준으로 검사하고, 초과하면 JPEG 품질을 조금 낮춰 다시 인코딩합니다.",
          "최종 파일은 원본을 덮어쓰지 않는 새 이름으로 저장하고, 제출 직전 외교부 안내가 바뀌지 않았는지 다시 확인하세요.",
        ],
      },
    ],
    example: {
      title: "413×531 출력 점검 예시",
      caption: "아래 값은 통과 여부를 판단하는 계산 예시이며 실제 사진 내용의 심사 결과를 뜻하지 않습니다.",
      headers: ["검사 항목", "목표", "확인 방법", "판정 예시"],
      rows: [
        ["픽셀", "413×531px", "내려받은 파일을 다시 읽음", "두 값이 정확히 일치"],
        ["파일 형식", "JPEG", "magic bytes와 MIME 확인", "확장자만 바꾼 파일은 제외"],
        ["파일 용량", "512,000B 이하", "실제 Blob.size 확인", "512,001B이면 다시 압축"],
      ],
    },
    toolCtas: [{ href: "/passport-photo", label: "여권사진 도구 열기", description: "원본 배경을 유지하며 413×531px JPEG를 기기 안에서 만듭니다." }],
    relatedGuideSlugs: ["photo-under-500kb", "id-photo-size", "dpi-vs-pixels"],
  },
  {
    slug: "photo-under-500kb",
    category: "파일 최적화",
    title: "사진을 500KB 이하로 줄이는 순서",
    summary: "무작정 화질을 낮추지 않고 픽셀, 형식, JPEG 품질을 차례로 조정해 실제 파일을 500KB 이하로 만드는 방법입니다.",
    problem: "제출 화면에서 500KB 초과 오류가 나지만 얼굴이나 글자 품질을 지나치게 망가뜨리고 싶지 않을 때 필요한 절차입니다.",
    keywords: ["사진 500KB 이하", "JPG 용량 줄이기", "이미지 압축", "사진 KB 줄이기"],
    seo: {
      title: "사진 500KB 이하로 줄이는 방법",
      description: "사진 픽셀과 JPEG 품질을 순서대로 조절하고 실제 Blob 크기를 재검사해 500KB 이하 파일을 만드는 실전 절차입니다.",
      ogImage: "/og/guides/photo-under-500kb.png",
      contentPublishedAt,
      contentUpdatedAt,
    },
    source: {
      authority: "대한민국 외교부 여권안내",
      title: "온라인용 사진파일 안내의 500KB 기준",
      url: "https://www.passport.go.kr/home/kor/contents.do?menuPos=12",
      lastVerifiedAt,
    },
    sections: [
      {
        id: "bytes-first",
        title: "500KB는 실제 바이트로 확인하기",
        paragraphs: [
          "파일 탐색기의 반올림 표시는 경계값 판단에 충분하지 않습니다. 픽셀핏은 500KB를 500×1024, 즉 512,000바이트로 계산하고 생성된 Blob 자체를 확인합니다.",
          "제출처가 500,000바이트처럼 10진 기준을 명시했다면 그 기준이 우선입니다. 이 가이드의 512,000바이트 기준은 픽셀핏 여권사진 프리셋의 계약입니다.",
        ],
      },
      {
        id: "order",
        title: "크기, 형식, 품질 순서로 줄이기",
        paragraphs: [
          "먼저 제출에 필요한 픽셀로 리사이즈하면 불필요한 화소가 사라집니다. 그다음 사진처럼 색 변화가 많은 이미지는 JPEG를 선택하고, 마지막으로 품질을 조금씩 낮춥니다.",
          "한 번에 최저 품질로 저장하면 얼굴과 글자 경계가 쉽게 무너집니다. 상한과 하한을 둔 이진 탐색으로 목표에 가장 가까운 품질을 찾되, 최소 품질에서도 초과하면 픽셀을 더 줄일지 사용자에게 묻는 방식이 안전합니다.",
        ],
        bullets: ["제출처가 요구한 픽셀을 먼저 고정", "투명이 필요 없으면 사진은 JPEG 우선", "품질을 제한된 횟수로 조정", "최종 Blob이 목표를 만족하는지 재검사"],
      },
      {
        id: "quality-check",
        title: "용량만큼 중요한 육안 검사",
        paragraphs: [
          "목표 용량을 통과해도 얼굴, 작은 글자, 얇은 선에 블록이나 번짐이 생겼다면 좋은 결과가 아닙니다. 100% 배율에서 주요 부분을 확인하고 원본과 비교하세요.",
          "PNG는 품질 슬라이더가 없는 무손실 형식이므로 사진에서는 용량이 크게 남을 수 있습니다. 이런 경우 형식 변경이나 픽셀 축소가 필요합니다.",
        ],
      },
    ],
    example: {
      title: "압축 의사결정 예시",
      caption: "인코더와 사진 내용에 따라 결과 바이트가 달라지므로, 숫자는 작업 순서를 보여주는 조건 예시입니다.",
      headers: ["현재 상태", "다음 조치", "재검사", "멈추는 조건"],
      rows: [
        ["4032×3024 원본", "요구 픽셀로 리사이즈", "출력 치수", "제출 픽셀과 일치"],
        ["JPEG 512,000B 초과", "품질을 단계 조정", "Blob.size", "512,000B 이하"],
        ["최소 품질도 초과", "픽셀 축소 여부 확인", "육안 품질", "품질 훼손 시 중단·경고"],
      ],
    },
    toolCtas: [{ href: "/image-compressor", label: "이미지 압축 도구 열기", description: "목표 KB를 정하고 실제 결과 바이트를 확인합니다." }],
    relatedGuideSlugs: ["passport-photo-413x531", "jpeg-png-webp", "dpi-vs-pixels"],
  },
  {
    slug: "id-photo-size",
    category: "공식 사진",
    title: "증명사진 크기: 3×4cm와 3.5×4.5cm",
    summary: "일반 증명사진 관행과 주민등록증의 공식 물리 크기를 구분하고 300dpi 픽셀값을 계산합니다.",
    problem: "이력서용 3×4와 주민등록증용 3.5×4.5 중 무엇을 골라야 하는지, 센티미터를 몇 픽셀로 바꿔야 하는지 헷갈릴 때 확인하세요.",
    keywords: ["증명사진 크기", "3x4 사진 픽셀", "3.5x4.5 사진", "민증사진 크기"],
    seo: {
      title: "증명사진 3×4·3.5×4.5cm 크기와 픽셀",
      description: "3×4cm 일반 증명사진과 3.5×4.5cm 주민등록증 사진의 차이, 300dpi 환산 픽셀과 제출 전 확인점을 설명합니다.",
      ogImage: "/og/guides/id-photo-size.png",
      contentPublishedAt,
      contentUpdatedAt,
    },
    source: {
      authority: "행정안전부 모바일 신분증",
      title: "모바일 주민등록증 발급 안내",
      url: "https://mobileid.go.kr/mip/hps/issuReqstGuidance/issuReqstGuidanceMrc.do",
      lastVerifiedAt,
    },
    sections: [
      {
        id: "different-sizes",
        title: "두 크기는 같은 규격이 아닙니다",
        paragraphs: [
          "3×4cm는 국내 이력서와 일반 증명사진에서 널리 쓰이는 관행값입니다. 모든 기관에 공통으로 적용되는 법정 온라인 규격은 아닙니다.",
          "3.5×4.5cm는 모바일 주민등록증 안내에서 확인되는 사진의 물리 크기입니다. 다만 온라인 신청 화면이 별도 픽셀·형식·용량을 요구한다면 그 안내가 우선합니다.",
        ],
      },
      {
        id: "conversion",
        title: "300dpi 픽셀값 계산하기",
        paragraphs: [
          "센티미터를 픽셀로 바꿀 때는 cm ÷ 2.54 × dpi를 계산한 뒤 반올림합니다. 3×4cm는 300dpi에서 약 354×472px, 3.5×4.5cm는 약 413×531px입니다.",
          "이 값은 인화 크기와 해상도를 연결한 서비스 기본값입니다. 기관이 공식 온라인 픽셀값을 직접 제시하지 않았다면 환산값을 공식 업로드 규격이라고 부르면 안 됩니다.",
        ],
      },
      {
        id: "submission",
        title: "제출처별 요구를 마지막에 확인하기",
        paragraphs: [
          "사용 목적을 먼저 고르고 제출처의 파일 조건을 확인하세요. 같은 3.5×4.5cm 사진도 방문 제출, 웹 업로드, 모바일 발급에서 파일 형식과 용량이 다를 수 있습니다.",
        ],
        bullets: ["물리 크기와 온라인 픽셀을 구분", "촬영 시점·배경·얼굴 기준 확인", "JPEG/PNG와 최대 파일 크기 확인", "자동 검사는 참고용으로만 사용"],
      },
    ],
    example: {
      title: "300dpi 환산 예시",
      caption: "소수점 픽셀은 저장할 수 없으므로 최종 값은 가장 가까운 정수로 반올림합니다.",
      headers: ["용도", "물리 크기", "계산", "300dpi 결과"],
      rows: [
        ["일반 증명사진", "3×4cm", "3÷2.54×300 / 4÷2.54×300", "354×472px"],
        ["주민등록증 사진", "3.5×4.5cm", "3.5÷2.54×300 / 4.5÷2.54×300", "413×531px"],
        ["주의", "제출처별 상이", "온라인 안내 우선", "환산값은 범용 보장 아님"],
      ],
    },
    toolCtas: [
      { href: "/id-photo", label: "일반 증명사진 만들기", description: "3×4cm 관행값을 300dpi 기준으로 준비합니다." },
      { href: "/resident-id-photo", label: "주민등록증 사진 만들기", description: "3.5×4.5cm 환산값과 원본 배경을 우선 사용합니다." },
    ],
    relatedGuideSlugs: ["passport-photo-413x531", "dpi-vs-pixels", "photo-under-500kb"],
  },
  {
    slug: "dpi-vs-pixels",
    category: "크기·인화",
    title: "DPI와 픽셀의 차이, 인화 크기 계산법",
    summary: "화면의 픽셀 수와 인쇄 밀도인 DPI를 분리해서 이해하고, 같은 이미지가 몇 cm로 인화되는지 계산합니다.",
    problem: "DPI 숫자만 300으로 바꾸면 사진이 선명해지는지, 현재 픽셀로 원하는 센티미터 크기를 인화할 수 있는지 판단해야 할 때 사용하세요.",
    keywords: ["DPI 픽셀 차이", "300dpi 픽셀 계산", "사진 인화 크기", "cm px 변환"],
    seo: {
      title: "DPI와 픽셀 차이·인화 크기 계산법",
      description: "픽셀 수와 DPI가 각각 무엇을 뜻하는지, px÷dpi와 cm÷2.54×dpi 공식으로 인화 크기와 필요한 픽셀을 계산합니다.",
      ogImage: "/og/guides/dpi-vs-pixels.png",
      contentPublishedAt,
      contentUpdatedAt,
    },
    source: {
      authority: "MDN Web Docs",
      title: "CSS <resolution> data type",
      url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/resolution",
      lastVerifiedAt,
    },
    sections: [
      {
        id: "definitions",
        title: "픽셀은 개수, DPI는 출력 밀도입니다",
        paragraphs: [
          "1200×1800px은 이미지가 가진 가로·세로 화소 수입니다. 300dpi는 1인치 길이에 300개의 점을 배치한다는 출력 밀도 정보입니다.",
          "웹 화면에서는 CSS 픽셀과 기기 픽셀이 항상 1:1이 아니므로 DPI 메타데이터만 바꿔도 화면 이미지의 실제 픽셀 수는 늘어나지 않습니다.",
        ],
      },
      {
        id: "formulas",
        title: "두 가지 계산식만 기억하기",
        paragraphs: [
          "필요한 픽셀은 cm ÷ 2.54 × dpi로 구합니다. 반대로 인화 길이는 px ÷ dpi × 2.54cm로 구합니다.",
          "계산 결과가 소수라면 이미지 출력 픽셀은 정수로 반올림합니다. 제출처가 정확한 픽셀을 제시했다면 계산값보다 제출처 숫자를 우선합니다.",
        ],
        bullets: ["필요 px = cm ÷ 2.54 × dpi", "인화 cm = px ÷ dpi × 2.54", "DPI 변경만으로 디테일이 새로 생기지 않음"],
      },
      {
        id: "metadata",
        title: "DPI 메타데이터를 기록한 뒤 재검사하기",
        paragraphs: [
          "JPEG와 PNG는 해상도 정보를 담는 방식이 다릅니다. 도구가 300dpi를 기록했다고 표시한다면 다운로드 결과를 다시 파싱해 실제 기록값이 허용 오차 안에 있는지 확인해야 합니다.",
          "일부 웹 서비스는 DPI 메타데이터를 무시하고 픽셀만 검사합니다. 따라서 픽셀과 DPI를 둘 다 확인하되, 어느 쪽을 요구하는지는 제출처 안내에서 판단하세요.",
        ],
      },
    ],
    example: {
      title: "같은 픽셀의 인화 크기 비교",
      caption: "1200px 너비는 DPI에 따라 인화 길이가 달라지지만 이미지 자체의 가로 픽셀은 그대로입니다.",
      headers: ["가로 픽셀", "출력 밀도", "계산", "인화 너비"],
      rows: [
        ["1200px", "300dpi", "1200÷300×2.54", "10.16cm"],
        ["1200px", "150dpi", "1200÷150×2.54", "20.32cm"],
        ["413px", "300dpi", "413÷300×2.54", "약 3.50cm"],
      ],
    },
    toolCtas: [{ href: "/image-resizer", label: "이미지 크기 조절 도구 열기", description: "가로·세로 또는 긴 변을 기준으로 실제 픽셀을 변경합니다." }],
    relatedGuideSlugs: ["id-photo-size", "passport-photo-413x531", "jpeg-png-webp"],
  },
  {
    slug: "youtube-banner-safe-area",
    category: "채널 디자인",
    title: "유튜브 배너 안전영역 계산과 배치",
    summary: "2560×1440px 전체 캔버스와 기기별 크롭을 구분하고, 텍스트·로고를 중앙 안전영역 안에 배치합니다.",
    problem: "TV에서는 보이던 채널명이나 로고가 모바일에서 잘리는 문제를 피하고, 권장 캔버스 안에서 핵심 요소의 위치를 계산해야 할 때 읽어보세요.",
    keywords: ["유튜브 배너 사이즈", "유튜브 안전영역", "채널아트 2560x1440", "유튜브 로고 위치"],
    seo: {
      title: "유튜브 배너 2560×1440 안전영역 가이드",
      description: "YouTube 공식 최소 크기와 1235×338 안전영역을 2560×1440에 환산하고 텍스트·로고가 잘리지 않게 배치하는 법입니다.",
      ogImage: "/og/guides/youtube-banner-safe-area.png",
      contentPublishedAt,
      contentUpdatedAt,
    },
    source: {
      authority: "YouTube 고객센터",
      title: "채널 브랜딩 관리 — 배너 이미지 가이드라인",
      url: "https://support.google.com/youtube/answer/10456525?hl=ko",
      lastVerifiedAt,
    },
    sections: [
      {
        id: "official-sizes",
        title: "전체 캔버스와 안전영역을 구분하기",
        paragraphs: [
          "YouTube 고객센터는 최소 업로드 크기 2048×1152px(16:9), 그 최소 크기에서 텍스트·로고 안전영역 1235×338px, 권장 크기 2560×1440px을 안내합니다.",
          "전체 배경은 TV처럼 넓은 화면을 채우고, 핵심 텍스트와 로고는 중앙 안전영역 안에 둡니다. 기기별 실제 크롭은 YouTube UI와 화면에 따라 달라질 수 있습니다.",
        ],
      },
      {
        id: "scale-safe-area",
        title: "2560×1440에서 안전영역 환산하기",
        paragraphs: [
          "2048에서 2560으로 가는 배율은 1.25입니다. 같은 비율을 적용하면 1235×338px 안전영역은 약 1544×423px이 됩니다.",
          "이 영역을 캔버스 중앙에 두면 좌우 여백은 약 508px, 위아래 여백은 약 509px입니다. 이 수치는 편집 안내선이며 실제 노출을 보장하지 않습니다.",
        ],
      },
      {
        id: "composition",
        title: "작은 화면부터 읽히는 구성 만들기",
        paragraphs: [
          "채널명, 업로드 일정, 핵심 로고처럼 반드시 보여야 하는 요소는 안전영역 안에서 충분한 대비와 여백을 확보합니다. 배경 사진의 중요한 피사체도 가능하면 중앙에 둡니다.",
          "업로드 전 데스크톱·모바일 예상 크롭을 모두 확인하고, 최종 2560×1440 이미지가 6MB 이하인지 실제 파일로 검사하세요.",
        ],
        bullets: ["핵심 문구는 한두 줄로 제한", "가장자리 장식은 잘릴 수 있다고 가정", "작은 미리보기에서 글자 대비 확인", "2560×1440px·6MB 이하 재검사"],
      },
    ],
    example: {
      title: "안전영역 비율 환산 예시",
      caption: "공식 최소 크기의 안전영역을 권장 크기에 같은 배율로 환산한 안내선 계산입니다.",
      headers: ["항목", "최소 크기 기준", "배율", "2560×1440 환산"],
      rows: [
        ["전체 캔버스", "2048×1152", "×1.25", "2560×1440"],
        ["텍스트·로고 영역", "1235×338", "×1.25", "약 1544×423"],
        ["중앙 여백", "중앙 정렬", "동일 비율", "좌우 약 508 / 상하 약 509"],
      ],
    },
    toolCtas: [{ href: "/youtube-banner", label: "유튜브 배너 도구 열기", description: "공식 크기와 중앙 안전영역을 보며 사진을 배치합니다." }],
    relatedGuideSlugs: ["jpeg-png-webp", "photo-under-500kb", "dpi-vs-pixels"],
  },
  {
    slug: "favicon-files",
    category: "웹 자산",
    title: "파비콘 파일 구성: ICO·PNG·manifest",
    summary: "브라우저 탭, 검색결과, iOS 홈 화면, PWA에 필요한 파비콘 파일과 설치 태그를 목적별로 정리합니다.",
    problem: "favicon.ico 하나만 있으면 충분한지, 16·32·48·180·192·512px 파일을 어디에 쓰는지 몰라 설치가 막혔을 때 확인하세요.",
    keywords: ["파비콘 만들기", "favicon ico", "apple touch icon", "site.webmanifest"],
    seo: {
      title: "파비콘 파일 구성과 설치 방법",
      description: "favicon.ico, 16·32·48px PNG, apple-touch-icon, 192·512px 아이콘과 webmanifest의 역할과 설치 순서를 설명합니다.",
      ogImage: "/og/guides/favicon-files.png",
      contentPublishedAt,
      contentUpdatedAt,
    },
    source: {
      authority: "Google Search Central",
      title: "검색결과에 표시할 파비콘 정의하기",
      url: "https://developers.google.com/search/docs/appearance/favicon-in-search?hl=ko",
      lastVerifiedAt,
    },
    sections: [
      {
        id: "minimum",
        title: "검색 파비콘과 브라우저 아이콘의 기준",
        paragraphs: [
          "Google Search Central은 파비콘이 1:1 정사각형이고 최소 8×8px이어야 하며, 여러 화면에서 잘 보이도록 48×48px보다 큰 이미지를 권장합니다. 조건을 만족해도 검색결과 노출은 보장되지 않습니다.",
          "브라우저와 운영체제는 서로 다른 크기를 선택합니다. 한 장의 큰 원본에서 여러 PNG와 multi-size ICO를 함께 만드는 이유입니다.",
        ],
      },
      {
        id: "package",
        title: "호환 패키지에 넣을 파일",
        paragraphs: [
          "기본 패키지는 favicon.ico, 16·32·48px PNG, 180px Apple touch icon, 192·512px 앱 아이콘, site.webmanifest로 구성할 수 있습니다.",
          "ICO는 단순히 PNG 파일의 확장자를 바꾼 것이 아니라 여러 크기 프레임을 담는 컨테이너여야 합니다. ZIP을 만든 뒤 엔트리와 실제 이미지 치수를 다시 확인하세요.",
        ],
      },
      {
        id: "install",
        title: "안정된 URL로 head에 연결하기",
        paragraphs: [
          "홈 문서의 head에 rel=icon, apple-touch-icon, manifest 링크를 추가하고 파일 URL을 자주 바꾸지 않습니다. 크롤러가 홈과 파비콘 파일에 접근할 수 있어야 합니다.",
          "16px 미리보기에서 형태가 뭉개지면 디테일을 줄이거나 안전 여백을 넓히세요. 래스터 입력을 SVG 벡터로 변환했다고 주장해서는 안 됩니다.",
        ],
      },
    ],
    example: {
      title: "파일별 사용처 예시",
      caption: "실제 브라우저 선택은 환경에 따라 달라질 수 있으므로 여러 크기를 함께 제공합니다.",
      headers: ["파일", "크기", "주요 사용처", "검사"],
      rows: [
        ["favicon.ico", "16·32·48 포함", "브라우저 호환", "ICO 프레임 재파싱"],
        ["apple-touch-icon.png", "180×180", "iOS 홈 화면", "정사각형 PNG"],
        ["icon-192/512.png", "192·512", "webmanifest/PWA", "manifest 경로 일치"],
      ],
    },
    toolCtas: [{ href: "/favicon-maker", label: "파비콘 패키지 만들기", description: "ICO·PNG·manifest·설치 안내를 하나의 ZIP으로 생성합니다." }],
    relatedGuideSlugs: ["jpeg-png-webp", "dpi-vs-pixels", "exif-photo-privacy"],
  },
  {
    slug: "exif-photo-privacy",
    category: "개인정보",
    title: "EXIF 위치정보와 사진 개인정보 지우기",
    summary: "사진에 남을 수 있는 GPS, 촬영일, 기기·렌즈, 작성자 정보를 확인하고 픽셀 재인코딩 없이 가능한 범위에서 정리합니다.",
    problem: "사진을 공개하기 전에 촬영 장소나 기기 정보가 남았는지 확인하고 싶지만, 화질을 바꾸거나 출처 자격 증명을 임의로 지우고 싶지 않을 때 사용하세요.",
    keywords: ["EXIF 삭제", "사진 위치정보 삭제", "GPS 메타데이터", "사진 개인정보"],
    seo: {
      title: "EXIF 위치정보·사진 개인정보 삭제 가이드",
      description: "JPEG·PNG·WebP에 남을 수 있는 GPS, 기기, 촬영일, 작성자 메타데이터를 확인하고 원본을 보존하며 정리하는 방법입니다.",
      ogImage: "/og/guides/exif-photo-privacy.png",
      contentPublishedAt,
      contentUpdatedAt,
    },
    source: {
      authority: "Camera & Imaging Products Association",
      title: "Exif 3.0 Overview",
      url: "https://www.cipa.jp/std/documents/e/Exif3.0-Overview_E.pdf",
      lastVerifiedAt,
    },
    sections: [
      {
        id: "what-is-exif",
        title: "사진 픽셀 밖에도 정보가 있습니다",
        paragraphs: [
          "Exif 같은 메타데이터에는 촬영 조건과 기기 정보를 담을 수 있습니다. 파일에 따라 GPS 좌표, 촬영 시각, 카메라·렌즈 모델, 편집 프로그램, 작성자 설명도 남습니다.",
          "모든 사진에 같은 필드가 있는 것은 아니며, 제조사 전용 정보나 표준 밖 컨테이너를 도구가 전부 식별한다고 보장할 수 없습니다.",
        ],
      },
      {
        id: "selective-removal",
        title: "필요한 항목만 선택해 정리하기",
        paragraphs: [
          "먼저 파일을 기기 안에서 분석하고 발견한 항목을 사람이 이해할 수 있는 이름으로 보여줍니다. 그다음 GPS, 기기, 촬영일, 작성자처럼 공개하고 싶지 않은 범주를 선택합니다.",
          "지원되는 JPEG·PNG·WebP에서는 압축된 픽셀 payload를 다시 인코딩하지 않고 메타데이터 구역만 바꾸는 경로를 우선합니다. 결과를 다시 파싱해 선택 항목이 실제로 사라졌는지 확인해야 합니다.",
        ],
      },
      {
        id: "provenance",
        title: "출처 자격 증명은 제거 대상으로 삼지 않기",
        paragraphs: [
          "C2PA, JUMBF, Content Credentials 같은 출처 정보는 개인정보 삭제 선택지로 제공하지 않습니다. 파일을 조금이라도 수정하면 기존 서명이나 자격 증명이 무효화될 수 있습니다.",
          "정리 결과는 새 파일로 내려받고 원본을 보관하세요. 브라우저 밖의 메신저, 운영체제, 클라우드 동기화가 파일을 어떻게 처리하는지는 별도로 확인해야 합니다.",
        ],
        bullets: ["원본을 덮어쓰지 않기", "결과 파일을 다시 파싱하기", "알 수 없는 필드가 남을 수 있음을 이해하기", "공개 이슈나 게시판에 원본 사진을 올리지 않기"],
      },
    ],
    example: {
      title: "메타데이터 공개 위험 예시",
      caption: "필드 존재 여부와 실제 값은 파일마다 다르므로 분석 결과를 보고 선택합니다.",
      headers: ["범주", "예시 필드", "노출 가능 정보", "권장 행동"],
      rows: [
        ["GPS", "Latitude/Longitude", "촬영 위치", "공개 전 제거 검토"],
        ["기기", "Make/Model/Lens", "카메라·렌즈", "필요 없으면 제거"],
        ["시각·작성자", "DateTime/Artist", "촬영 시점·이름", "용도에 따라 선택"],
      ],
    },
    toolCtas: [{ href: "/photo-privacy-cleaner", label: "사진 개인정보 정리 도구 열기", description: "발견한 메타데이터를 선택해 기기 안에서 정리합니다." }],
    relatedGuideSlugs: ["jpeg-png-webp", "photo-under-500kb", "favicon-files"],
  },
  {
    slug: "jpeg-png-webp",
    category: "파일 최적화",
    title: "JPEG·PNG·WebP, 어떤 형식을 고를까",
    summary: "사진, 투명 로고, 스크린샷, 웹 배포 상황에 따라 JPEG·PNG·WebP의 압축과 호환성 차이를 선택합니다.",
    problem: "사진 용량은 줄여야 하지만 투명 배경이나 작은 글자를 지켜야 하고, 제출처와 브라우저가 받을 수 있는 형식도 함께 판단해야 할 때 읽어보세요.",
    keywords: ["JPEG PNG 차이", "WebP 변환", "이미지 형식 비교", "투명 배경 포맷"],
    seo: {
      title: "JPEG·PNG·WebP 차이와 선택 기준",
      description: "사진·투명 이미지·스크린샷·웹 배포에서 JPEG, PNG, WebP의 손실 압축, 투명도, 용량, 호환성을 비교합니다.",
      ogImage: "/og/guides/jpeg-png-webp.png",
      contentPublishedAt,
      contentUpdatedAt,
    },
    source: {
      authority: "MDN Web Docs",
      title: "Image file type and format guide",
      url: "https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types",
      lastVerifiedAt,
    },
    sections: [
      {
        id: "quick-choice",
        title: "사진은 JPEG, 투명도는 PNG부터 검토하기",
        paragraphs: [
          "JPEG는 사진에 적합한 손실 압축 형식이며 투명 채널을 지원하지 않습니다. PNG는 무손실 압축과 알파 투명도를 지원해 로고, 아이콘, 작은 글자가 있는 스크린샷에 적합합니다.",
          "WebP는 손실·무손실과 투명도를 모두 지원하고 최신 브라우저에서 폭넓게 사용할 수 있습니다. 다만 제출처나 오래된 편집 프로그램이 WebP를 받는지는 별도로 확인해야 합니다.",
        ],
      },
      {
        id: "conversion-effects",
        title: "형식 변환에서 사라질 수 있는 것",
        paragraphs: [
          "투명 PNG를 JPEG로 바꾸면 투명 영역을 채울 배경색이 필요합니다. 지정하지 않으면 브라우저나 도구에 따라 검정 또는 흰색처럼 예상하지 못한 결과가 생길 수 있습니다.",
          "JPEG를 PNG로 바꿔도 이미 생긴 JPEG 압축 손실이 복원되지는 않습니다. 확장자만 바꾸는 것이 아니라 실제 픽셀을 새 형식으로 인코딩하고 MIME과 signature를 확인해야 합니다.",
        ],
      },
      {
        id: "delivery",
        title: "사용처가 요구하는 형식을 우선하기",
        paragraphs: [
          "공공기관 업로드, 앱 스토어, 소셜 플랫폼은 지원 형식을 직접 정합니다. 화질과 용량 비교보다 먼저 제출처가 JPEG·PNG·WebP 중 무엇을 허용하는지 확인하세요.",
          "웹사이트에서는 WebP와 JPEG/PNG fallback을 함께 제공할 수 있습니다. 다운로드 파일은 변환 뒤 다시 열어 치수, MIME, 투명도, 실제 용량을 확인합니다.",
        ],
        bullets: ["사진과 높은 호환성: JPEG", "투명 로고·선명한 글자: PNG", "웹 용량 최적화와 투명도: WebP", "제출처 지원 형식이 항상 우선"],
      },
    ],
    example: {
      title: "사용 사례별 형식 선택",
      caption: "하나의 절대적인 정답이 아니라 호환성, 투명도, 화질과 용량을 함께 보는 출발점입니다.",
      headers: ["사용 사례", "우선 형식", "이유", "확인할 점"],
      rows: [
        ["일반 사진 제출", "JPEG", "사진 압축·높은 호환성", "허용 용량과 품질"],
        ["투명 로고", "PNG 또는 WebP", "알파 투명도", "사용처 WebP 지원"],
        ["글자 있는 스크린샷", "PNG", "경계 보존", "용량이 크면 WebP 비교"],
      ],
    },
    toolCtas: [{ href: "/image-converter", label: "이미지 형식 변환 도구 열기", description: "JPEG·PNG·WebP를 선택하고 투명 영역의 배경을 직접 정합니다." }],
    relatedGuideSlugs: ["photo-under-500kb", "favicon-files", "exif-photo-privacy"],
  },
] as const satisfies readonly GuideDefinition[];

export type GuideSlug = (typeof guides)[number]["slug"];

const guideMap = new Map<string, GuideDefinition>(guides.map((guide) => [guide.slug, guide]));

export function getGuide(slug: string): GuideDefinition | undefined {
  return guideMap.get(slug);
}
