# PixelFit SEO · AdSense 콘텐츠 감사와 개선

확인일: **2026-10-12 (Asia/Seoul)**. 기준 소스: `main`의 `32ecfac`. 대상: <https://pixelfit.me/>. 이 문서는 공개본의 읽기 전용 감사와 **배포하지 않은 로컬 수정본**을 구분한다. 커밋·푸시·배포, DNS·도메인·Search Console·AdSense 계정 설정 변경은 하지 않았다.

## 1. 판단과 범위

공개본의 28개 정규 URL(홈, 도구 14개, 가이드 상세 8개, 가이드 허브, 정보 4개)은 모두 HTTP 200이며, 독립적인 title/description, H1 하나, 정확한 canonical, 정적 본문과 발견 가능한 내부 링크가 있었다. robots·sitemap·HTTPS/호스트 정규화가 주요 색인 장애라는 증거는 없었다. 이 시스템을 재작성하거나 URL을 삭제하지 않았다.

사용자가 전달한 AdSense의 ‘가치가 낮은 콘텐츠’ 거절은 이번 작업의 출발점이다. 계정 화면과 Search Console 비공개 데이터는 열람하지 않았다. 따라서 거절의 정확한 페이지별 원인, 실제 색인 수, Google이 선택한 canonical, 크롤링·색인 실패 원인은 **미확인**이다. 기술 검사가 정상이라고 AdSense 승인이나 검색 노출을 보장하지 않는다.

확인된 문제는 모바일 WebKit의 크기 조절 입력 영역 잘림, 가이드 표에 따른 모바일 본문 너비 확대, 리사이저 안내와 실제 동작의 불일치, Article의 허용되지 않은 속성이었다. 콘텐츠는 이미 도구별 기능과 계산 예시가 있었으나, 우선순위 페이지에서 **이 서비스가 실제로 만든 파일의 근거**, 실패 조건, 자동 검사의 범위를 더 잘 보여줄 여지가 있었다. 이것을 ‘모든 페이지가 복제 콘텐츠’ 또는 거절의 확정 원인이라고 판정하지 않았다.

작업 전 `AGENTS.md`, `README.md`, `docs/STATUS.md`, SEO·AdSense·규격·테스트 관련 문서, Registry·엔진·공통 컴포넌트·정적 검증 스크립트와 `.github/workflows/`, `next.config.ts`를 확인했다. 기존 샘플/OG 생성기, 브라우저 메모리 처리, 다운로드 검사, 광고 OFF 게이트를 보존했다.

## 2. 문제와 우선순위

| 심각도 | 구분 | 근거와 사용자 영향 | 조치 / 남은 일 |
| --- | --- | --- | --- |
| Critical | 발견 없음 | 전면 접근 불가, 전체 noindex, 원본 업로드 유출 같은 장애는 검사 범위에서 발견되지 않음 | 미검사 환경까지 안전하다는 뜻은 아님 |
| High | 실제 오류 | 모바일 WebKit에서 리사이저 두 숫자 입력의 고유 너비가 제어 그리드를 약 614px로 늘림. 390px 화면에서 `퍼센트` 버튼이 화면 밖으로 밀려 실제 클릭 실패 | 그리드/필드 최소 너비와 숫자 입력 너비를 제한. 강제 클릭 없이 같은 실제 조작으로 회귀 검사 |
| High | 콘텐츠 개선 여지 | 우선 도구에 자체 결과의 측정 근거가 적음. 기존 압축 갤러리는 실제 엔진 결과가 아닌 비교 도식이며 이미 정직하게 표시됨 | 도식 보존. 별도로 실제 편집기 다운로드 8개 결과를 기록하고 5개 우선 페이지에 조건·실패 사례·한계와 함께 표시. AdSense 원인 확정 아님 |
| Medium | 실제 모바일 오류 | 가이드 표의 최소 660px 너비가 부모 article까지 662px로 늘림. 모바일 layout viewport가 674px로 확대되어 글이 작게 표시됨 | content-layout 자식의 min-width를 0으로 제한, 8개 가이드의 문서/본문 너비를 실제 뷰포트와 비교하는 회귀 검사 |
| Medium | 접근성 오류 | 모바일에서 표가 실제 스크롤 영역이 되자 Safari 키보드 접근 불가가 axe serious로 드러남 | 기존 표에도 이름 있는 region·tabindex=0 추가. 8개 가이드에서 방향키 스크롤을 검증하고 axe 범위를 전체 가이드로 확장 |
| Medium | 실제 설명 오류 | 리사이저 FAQ가 비율 잠금 해제 시 사진이 늘어난다고 설명했으나 엔진은 contain/cover로 비율 유지 | 출력 상자, 여백, 가장자리 크롭을 구분하고 1200×800→600×600 계산 예시 추가 |
| Medium | 근거 구분 | 여권 공식 안내의 ‘500KB’와 제품의 500×1024=512,000바이트 해석을 혼동할 여지 | 공식 문구와 제품 계산을 명시적으로 분리. 오류 시 480KB=491,520B로 여유 확보하되 픽셀/JPG 유지 안내 |
| Medium | 콘텐츠 개선 여지 | 형식 가이드가 선택 기준 중심이며 브라우저 인코더·PNG 재저장 증가·손실/투명도 오류의 실제 비교가 부족 | 동일 원본 JPG/PNG/WebP 실측, 네 단계 재현, 형식 기능과 제품 지원 범위, 저장 후 오류 확인 추가 |
| Low | 실제 구조화 데이터 오류 | 8개 가이드의 `Article.proficiencyLevel`. Schema.org는 이 속성의 사용 대상을 TechArticle로 정의 | Article을 유지하고 속성만 제거. export 검사에 회귀 방지 추가. 색인 실패 원인이라는 증거 없음 |
| Low | 탐색 개선 | 홈에서 추천/분류 카드와 전체 14개 카드의 설명·H3가 반복 | 전체 목록만 간결한 실제 링크로 변경. 홈의 전체 카드 수 21→7, 정적 HTML 67,474→51,192바이트로 줄었으며 전체 14개 도구 링크는 유지. 14개 링크와 JS 없는 native details 탐색 보존 |
| Low | 설명 개선 | JS OFF에서도 본문은 읽히지만 편집 영역은 로딩 안내로 남음 | 모든 도구에 JS 필요 noscript 설명 추가. JS ON 초기화 실패는 발견하지 못함 |
| Low | 호스팅 관찰 / 보존 | `/image-compressor/index.html`은 200이나 정규 slash URL canonical. `/404.html` 직접 요청은 200이나 noindex, 실제 없는 경로는 404 | sitemap/내부 링크에 별칭 없음. GitHub Pages 흐름을 바꾸지 않음. GSC에 별칭·soft 404가 보고되는지 확인 |
| 미판정 | 비공개 데이터 | 색인 상태·수동 조치·AdSense 정책센터 상세·실사용 CWV | 운영자가 아래 체크리스트에서 확인 |

## 3. 정상 구현과 공개 감사

### 라우팅·정적 HTML·SEO

- Next.js static export, `trailingSlash: true`, Registry 기반 `generateStaticParams` 구조다. 공통 `publicUrl`/`publicPath`/metadata 함수가 canonical·OG·JSON-LD·sitemap을 함께 만든다.
- 공개 28/28 HTTP 200. 28/28 H1 하나, title/description 존재·각각 고유. canonical은 sitemap의 실제 HTTPS non-www slash URL과 일치한다. `robots=index, follow`, X-Robots-Tag 제한 없음. `robots.txt`는 Allow `/`와 올바른 sitemap을 제공한다.
- sitemap 28개 고유 URL, 중복 0. Registry의 14도구/8가이드와 정보 라우트가 모두 포함됐다. 공개 HTML 내부 링크에서 sitemap 밖의 미확인 페이지 경로 0. 자산·메일·외부 링크는 페이지 누락 판정에서 제외했다.
- JSON-LD는 파싱 가능하고 페이지 URL과 연결된다. 도구는 WebApplication·BreadcrumbList, 가이드는 Article·BreadcrumbList, 홈/소개는 운영자/사이트 정보가 있다. 가짜 평점·리뷰·가격·FAQ 리치 결과 데이터를 추가하지 않았다. 위 속성 수정 외 구조를 보존했다.
- 페이지마다 OG title/description/url이 있고 공개 OG 24개는 모두 200, PNG 1200×630이다. 정보 페이지가 공통 OG를 쓰는 것은 오류로 간주하지 않았다.
- 기존 HTML에 도구 설명·사용 방법·FAQ·관련 가이드가 서버 렌더링된다. JS OFF로 홈과 우선 5페이지의 실제 브라우저 읽기를 별도 확인했다. 편집기 자체는 JS가 필요하며 이를 안내하도록 보강했다.
- 공개/수정본 각각 28페이지를 390×844 Chromium 모바일로 열었다. 초기화, 지속 로딩, console/page 오류, 요청 실패, 정적 H1/H2 보존, 갤러리 이미지 디코드를 검사했다. 최초 overflow 검사는 확대된 innerWidth와 비교해 가이드 문제를 놓쳤다. 실제 390px 뷰포트와 비교하도록 감사 스크립트와 회귀 검사를 수정한 뒤 다시 검사했다. 이 초기 화면 검사는 파일 선택 후 모든 조작 상태를 포괄하지 않으며, 별도 WebKit E2E에서 리사이저 문제를 발견했다.
- 목적이 드러나는 도구 이름/가이드 제목 앵커와 관련 결과 링크를 보존했다. 기존 ‘바로 만들기’는 이름·설명을 포함한 카드 안의 링크이며 전체 디렉터리는 도구 이름을 직접 앵커로 사용한다.

### 실제 리디렉션과 오류 응답

| 요청 | 관찰 결과 |
| --- | --- |
| `http://pixelfit.me/` | 301 → `https://pixelfit.me/` → 200 |
| `http://www.pixelfit.me/`, `https://www.pixelfit.me/` | 301 → HTTPS apex → 200 |
| `https://www.pixelfit.me/image-compressor/?from=audit` | 301, 경로·쿼리 유지. 최종 canonical은 쿼리 없는 정규 URL |
| `https://dubeeubbee.github.io/pixelfit/` 및 여권 경로+쿼리 | 301 → 새 도메인, 경로·쿼리 유지 |
| `http(s)://pixelfit.o-r.kr/`, HTTPS 압축 경로+쿼리 | 301 → 새 도메인, 경로·쿼리 유지 |
| `/image-compressor` | 301 → `/image-compressor/` |
| `/image-compressor/index.html` | 200, canonical `/image-compressor/` |
| 임의 도구·가이드 경로 두 개 | 각각 실제 HTTP 404, noindex, 오류 안내 있음 |
| `/404.html` | 직접 파일 접근은 HTTP 200, noindex. sitemap 없음 |

리디렉션은 위 대표 요청에서 검증했다. 모든 옛 URL 조합을 전수 검사하거나 호스팅 설정을 변경하지 않았다. 실제 없는 두 경로에 soft 404 증거는 없지만 Google의 soft 404 분류는 GSC에서 별도 확인해야 한다.

## 4. 페이지별 콘텐츠 판단

공통 UI·개인정보 문구·규격 경고를 공유한다는 이유만으로 저가치로 판단하지 않았다. 아래는 기능/사례/계산의 고유성과 실제 부족한 근거를 구분한 편집 판단이다. ‘보존’은 추가 글이 불필요하다는 영구 판정이 아니라 이번 작업에서 수정 근거가 충분하지 않았다는 뜻이다.

| 페이지 | 기존의 구별되는 가치 / 위험 | 이번 조치 |
| --- | --- | --- |
| `/` | 용도별 검색·분류·로컬 처리 설명. H1만으로 작업 종류가 덜 명확하고 카드 설명 반복 | 제목/H1에 용량·크기·형식 의도 표시, 전체 목록 간소화 |
| `/image-compressor/` | 목표 바이트 검사, 실패 표시, 해상도 축소 선택. 실측 근거 부족 | 실제 JPEG 성공/PNG 실패, 단위·고정 픽셀·다운로드 품질 확인 |
| `/image-resizer/` | 가로·세로·긴 변·퍼센트, contain/cover. FAQ 동작 불일치 | 설명 수정, 여백/크롭 계산, 픽셀과 파일 크기 분리, 50% 실측 |
| `/passport-photo/` | 공식 출처, 배경 합성 금지, 정확한 파일 재검사. 파일 조건과 사람의 심사 구분 보강 여지 | DPI 계산, KB 해석, 자동/수동 경계, 도형 파일 출력 실측 |
| `/photo-privacy-cleaner/` | 선택적 필드 제거·재파싱, 출처 정보 제외. 완전 삭제로 오해할 여지 | 합성 필드 3개 제거/IDAT 보존 실측, 눈에 보이는 개인정보·클라우드·미지원 형식 한계 |
| `/image-converter/` | 형식 실제 재검사, 투명도, 정확한 원본 바이트 보존 선택 | 기능/설명 보존. 새 형식 가이드의 실제 비교를 관련 링크로 읽을 수 있음 |
| `/id-photo/` | 3×4cm 관행값과 300dpi 환산, 배경 테마를 공식 규격과 구분 | 보존 |
| `/resident-id-photo/` | 공식 물리 크기와 온라인 픽셀 환산 구분, 원본 배경 유지 | 보존. 출처 재확인 날짜를 임의로 바꾸지 않음 |
| `/youtube-banner/` | 전체 크기/중앙 안전영역, 기기별 크롭 안내 | 보존 |
| `/favicon-maker/` | 실제 multi-size ICO·PNG·manifest·설치 안내 ZIP, 16px 미리보기 | 보존 |
| `/social-image-pack/` | 한 사진의 3비율별 독립 크롭·ZIP, 플랫폼 의무값과 서비스값 구분 | 보존 |
| `/instagram-profile-picture/` | 작은 원·사진 크기·테두리·여백 별도 조절, 공식 의무값으로 과장하지 않음 | 보존 |
| `/youtube-thumbnail/` | 제한된 배치·제목·축소 미리보기·서비스 안전 여백 | 보존. 외부 규격 출처 전체를 오늘 재확인한 것으로 표시하지 않음 |
| `/four-cut-photo/` | 1~4장 순환 배치·세로/가로·칸별 위치·날짜 | 보존. 실제 인화 규격 보장 안 함 |
| `/film-photo/` | 결정적 로컬 효과·원본 비교·강도, 생성형 AI/필름 인증 주장 없음 | 보존 |
| `/guide/passport-photo-413x531/` | 파일 조건·촬영 내용·도구 제한의 단계별 안내 | 공식 KB와 서비스 계산, 실제 출처 확인일 보강. 도구 페이지는 실행·결과 중심, 가이드는 제출 판단 중심 |
| `/guide/photo-under-500kb/` | 픽셀→형식→품질의 의사결정, 제품의 512,000B 해석을 이미 명시 | 보존. 압축 도구의 새 실측과 기존 관련 링크 연결 |
| `/guide/id-photo-size/` | 3×4/3.5×4.5 물리 크기와 반올림 환산표 | 보존 |
| `/guide/dpi-vs-pixels/` | 두 계산식, 1200px의 300/150dpi 인화 크기 비교 | 보존. 리사이저가 DPI를 설정하는 도구처럼 연결하지 않음 |
| `/guide/youtube-banner-safe-area/` | 1.25배 환산, 약 1544×423과 중앙 여백 계산 | 보존 |
| `/guide/favicon-files/` | 파일별 역할, 진짜 ICO와 이름 변경 구분, 설치 순서 | 보존 |
| `/guide/exif-photo-privacy/` | 선택 정리·출처 자격 증명·원본 보존·미탐지 한계 | 보존. 제품 도구는 실제 검증 범위를 추가해 역할 분리 |
| `/guide/jpeg-png-webp/` | 기존 3절은 형식 선택의 일반 설명 비중이 높음 | 6절로 보강, 동일 원본 3형식 실측·재현·오류 처리·제품 지원 범위·MDN 출처 추가 |

가이드는 **8개 그대로**다. 관련 도구/가이드의 짧은 사실 설명은 문맥상 필요하므로 일괄 삭제하지 않았다. 기존 예시 수치 중 가정/계산/도식으로 표시된 것을 실제 실험으로 바꾸어 표현하지 않았다.

## 5. 실제 결과와 재현 방법

측정일 2026-10-12, Playwright Chromium **149.0.7827.55**, macOS arm64·Node 24.14.1, 동일한 기존 처리 엔진, 실제 편집기 업로드→생성→다운로드 경로다. 네트워크 외부 쓰기나 원본 전송 없이 실행했다. 읽은 파일의 헤더/픽셀/바이트와 SHA-256을 기록했다. 표는 단일 입력의 한 번 측정이며 압축률 평균, 화질 동등성, 모든 브라우저 결과를 뜻하지 않는다.

| 입력 / 설정 | 실제 다운로드 | 확인 / 한계 |
| --- | --- | --- |
| 자체 PNG 1200×800, 1,045,528B → JPEG 100KB, 축소 OFF | JPEG 1200×800, **101,737B** | 102,400B 목표 달성. 시각 품질 보장은 별도 |
| 같은 원본 → PNG 100KB, 축소 OFF | PNG 1200×800, **1,475,820B** | 목표 초과, 원본보다 증가. UI가 실패를 표시 |
| 같은 원본 → PNG 50%, 전체 포함 | PNG 600×400, **506,342B** | 픽셀 수 25%, 파일 용량은 25%가 아님 |
| 같은 원본 → JPEG 품질 90% | JPEG 1200×800, **284,236B** | 화질 숫자만으로 다른 형식과 동등 비교 불가 |
| 같은 원본 → PNG, 품질값 없음 | PNG 1200×800, **1,475,820B** | 브라우저 재인코딩으로 파일 증가 |
| 같은 원본 → WebP 품질 90% | WebP 1200×800, **274,514B** | 이 입력/인코더에서의 값 |
| 합성 텍스트 3개를 넣은 PNG 320×400, 3,008B | PNG 320×400, **2,896B** | 세 값 제거, IDAT 이미지 데이터 동일. 실제 GPS/인물 데이터 아님 |
| 도형 PNG 640×800, 6,888B → 여권 초기 크롭 | JPEG 413×531, **4,331B** | 파일 출력 검사만 통과. 실제 얼굴·접수 심사 검증 아님 |

- 원본: `public/samples/image-compressor/original.png`. 새 개인정보/여권 입력은 기존 `e2e/helpers/fixture.ts`의 `makePng(320, 400, true)`, `makePng(640, 800)`로 재현한다.
- 근거: `src/config/processing-evidence.json`의 입력/출력 SHA-256, 설정, 바이트. `e2e/processing-evidence.spec.ts`는 실제 UI로 재현하고 다운로드/영수증을 test-results에 저장한다. 같은 버전 Chromium·운영체제·CPU 아키텍처는 게시한 출력 해시까지 대조한다. 다른 실행 환경에 동일 인코딩 바이트를 강요하지 않는다. 다른 브라우저는 실제 형식·픽셀과 정직한 목표 실패 표시를 검사한다.
- 재현: custom export를 `pnpm build`로 만든 후 `pnpm exec playwright test e2e/processing-evidence.spec.ts` 실행. 측정 갱신 후보가 필요할 때만 `PIXELFIT_RECORD_EVIDENCE=1 pnpm exec playwright test e2e/processing-evidence.spec.ts --project=chromium`. 일반 테스트는 게시된 JSON을 덮어쓰지 않는다.
- 기존 샘플 생성기/자산 무결성은 그대로다. 기존 압축 비교 도식 PNG 4개와 새 실제 다운로드 수치를 혼동하지 않도록 본문에서 구분했다. 새로운 실제 결과라고 주장하는 합성 이미지를 만들지 않았다.

## 6. 변경 파일과 이유

| 파일 | 이유 |
| --- | --- |
| `src/config/tools.ts` | 우선 도구 4개의 사례·설정·실패·검증 범위 보강, 실제 동작과 FAQ 일치 |
| `src/config/guides.ts` | 형식 가이드 보강, 여권 가이드 KB 출처 구분, 선택적인 추가 출처 필드 |
| `src/config/processing-evidence.json` (신규) | 실제 다운로드 8개의 재현 가능한 측정 영수증 |
| `src/components/content/ProcessingEvidence.tsx` (신규) | 우선 5페이지의 맥락별 실측 표/방법/한계. 서버 HTML에도 포함 |
| `src/components/content/GuideArticle.tsx` | 실측/추가 출처/목차 표시, 표 키보드 접근 지원, 부적합 proficiencyLevel 제거 |
| `src/app/[tool]/page.tsx` | 우선 도구 실측 배치, 모든 도구 JS OFF 안내 |
| `src/app/page.tsx`, `src/config/copy.ts` | 홈 title/H1에 실제 작업 의도 표시 |
| `src/components/home/ToolSearch.tsx` | 반복된 전체 카드 목록을 짧은 실제 링크로 표시 |
| `src/components/editor/UtilityWorkspace.tsx` | 비율 잠금 설명을 실제 contain/cover 동작과 일치 |
| `src/app/globals.css` | 표/전체 링크의 국소 스타일, 검증된 WebKit 숫자 입력 잘림과 가이드 본문 너비 수정 |
| `src/lib/presets/registry.ts` | 실제 다시 확인한 여권 출처만 확인일 갱신. 규격·허용 엔진 경로 변경 없음 |
| `src/app/sitemap.ts` | 홈의 중요한 문구 수정일만 반영. 도구/가이드는 개별 Registry 수정일 사용 |
| `scripts/verify-static-export.mjs` | Article 속성 회귀 방지. 기존 canonical/자산/광고 검사 보존 |
| `scripts/audit-seo.mjs`, `scripts/audit-rendered.mjs` (신규) | 공개 HTTP/정적 HTML/모바일 렌더링의 읽기 전용 감사 재현 |
| `e2e/processing-evidence.spec.ts` (신규) | 실제 다운로드 8종·개인정보·브라우저 차이·모바일 버튼 회귀 검증 |
| `e2e/navigation-a11y.spec.ts`, 기존 component/config/route 테스트 4개 | 변경한 H1·목록·개별 수정일·구조화 데이터 기대값 갱신 |
| 이 보고서, `docs/STATUS.md`, `docs/ADSENSE_READINESS.md`, `docs/PRESET_SOURCES.md`, `README.md` | 현재 근거/한계/재현 방법을 과거 배포 기록과 분리 |

중요 콘텐츠 수정일은 홈, 우선 도구 4개, 여권/형식 가이드 2개만 2026-10-12다. 게시일·운영자 `DUBEEUBBEE`는 보존했다. 공통 컴포넌트의 문법/JS 안내 수정만으로 다른 글의 편집 날짜를 일괄 갱신하지 않았다. 정적 자산·엔진·lockfile·배포 workflow 변경이나 URL 삭제는 없다.

## 7. AdSense 준비 상태

- 소개: 실제 운영 표시명·서비스 목적·공식 규격과 서비스값·독립 서비스·브라우저 처리 설명이 있다.
- 개인정보: 이미지 메모리 처리와 일반 호스팅 요청을 구분한다. 로컬 저장소에 사진을 저장하지 않는 구조, 광고 OFF 상태, 향후 제3자 광고/CMP 조건을 설명한다.
- 약관: 결과 확인 책임·기관 승인 비보장·권리·원본 보관을 설명한다. 이번 작업으로 법률 준수를 인증했다고 주장하지 않는다.
- 문의: 공개 이메일과 GitHub 보조 오류 채널, 민감한 원본 첨부 금지, 규격 정정 절차가 있다. 실제 메일 송수신은 테스트하지 않았다.
- 공개 28개 HTML의 `google-adsense-account=ca-pub-9401696568580025`, root `ads.txt`의 `pub-9401696568580025`가 일치한다. 코드는 보존했다. 이 일치는 계정 소유권·승인 완료를 증명하지 않는다.
- 공개 28개 HTML에는 google-site-verification meta가 있다(값은 보고서에 복사하지 않음). 로컬 검사용 custom 빌드는 기존 스크립트가 확인용 환경값을 비우며, 실제 workflow는 운영 설정을 사용한다. 태그 존재만으로 현재 계정 소유권을 확정하지 않았다.
- 광고 활성화는 OFF다. 공개/수정본의 loader·`adsbygoogle`·slot runtime 0. 광고 삽입 위치 allowlist와 편집기/다운로드 제어에서 떨어진 배치를 보존했다. 광고에 가려지는 화면이나 오해를 유발하는 새 광고 버튼은 추가하지 않았다.
- Google은 EEA·영국·스위스 사용자에게 광고를 제공하는 경우 인증 CMP 및 TCF 통합 요구를 안내한다. 해당 제공 전에 실제 지역/동의/거부/철회 흐름과 개인정보 문구를 검증해야 한다. 현재 광고 OFF를 유지하며 CMP·광고를 새로 활성화하지 않았다. CMP가 없다는 사실만으로 이번 콘텐츠 거절의 원인이라고 단정하지 않는다.

정책에 도움이 되는 조치는 실제 기능과 일치하는 설명, 재현 가능한 고유 결과, 명확한 한계/출처, 정상 탐색과 모바일 기능이다. 글 수·SEO 점수·날짜·구조화 데이터 양을 늘리면 승인된다는 가정은 채택하지 않았다.

## 8. 테스트와 제한

실행 결과와 모바일 실험실 측정은 아래 최종 검증 표에 기록한다. `out/`은 모든 빌드가 공유하므로 Pages→custom-test→custom을 순서대로 만들고, 최종 custom 파일이 완성된 뒤 브라우저 검사를 했다. 성공한 로컬 빌드를 공개 배포 성공이라고 표시하지 않는다.

초기 실패도 기록한다.

1. 초기 측정 테스트가 모든 브라우저에서 100KB 목표를 달성한다고 가정해 WebKit 결과 109,798B에서 실패했다. 축소 OFF일 때 인코더마다 결과가 다르고 제품은 목표 초과를 정직하게 표시한다. Chromium의 목표 달성 검사는 유지하고 다른 브라우저에서는 실제 결과/실패 표시를 검사하도록 수정했다. 엔진의 목표 기준을 완화하지 않았다.
2. 다음 전체 실행에서 WebKit의 `퍼센트` 클릭이 실제 화면 밖으로 밀려 timeout됐다. 위 CSS 결함을 수정하고 버튼이 뷰포트 안에 있는지도 검사한다. 강제 클릭으로 우회하지 않았다.
3. 최초 전체 E2E 시도는 별도 custom-test 빌드와 시간이 겹쳤으므로 최종 근거에서 제외했다. 이후 검증은 빌드와 E2E를 순차 실행했다.
4. 최종 스크린샷에서 가이드 본문의 모바일 너비 확대를 확인했다. 기존 공개본에서도 재현됐고 국소 min-width 수정으로 674px→390px를 확인했다. 초기 감사의 잘못된 비교 기준을 고쳐 전 페이지를 다시 검사했다.
5. 가이드 너비 수정 후 axe가 기존 표의 Safari 키보드 접근 불가를 serious로 검출했다. 표 region에 이름과 tabindex를 추가하고 8개 가이드의 방향키 조작/axe 검사를 실행했다.
6. 방향키 E2E의 즉시 keyup은 WebKit에서 스크롤을 시작하지 않아 실패했다. Chromium/데스크톱 WebKit/모바일 WebKit에서 포커스와 200ms 키 입력을 각각 확인한 후 실제 키 눌림 시간을 반영했다. 제품의 스크롤 이벤트를 가로채거나 강제 스크롤 코드로 우회하지 않았다.
7. 기준선에도 있었던 webpack Worker chunk circular-dependency 경고와 테스트 환경의 FORCE_COLOR/NO_COLOR 경고를 기록했다. 빌드/실행 실패로 나타나지 않아 이번 콘텐츠 작업에서 Worker 구조를 재작성하지 않았다.

실기기 iOS/Safari·Android, 실제 여권 접수, Google Rich Results Test/Search Console 계정 검사, 실제 광고/CMP 동의 흐름은 실행하지 않았다. 자동 WebKit은 실제 iPhone 수동 검증과 다르다. Lighthouse는 실험실 측정이며 INP나 실제 사용자 CWV의 통과를 증명하지 않는다.

## 9. 운영자가 Search Console에서 직접 확인할 항목

1. `pixelfit.me` 속성의 소유권과 sitemap 처리 상태/마지막 읽은 날짜/발견 URL을 확인한다. 이 감사의 28개는 ‘현재 indexable 정규 URL’이며 ‘Google에 색인된 수’가 아니다.
2. 홈과 우선 5페이지를 URL 검사한다. Google 선택 canonical/사용자 선언 canonical, 마지막 크롤링, 크롤링 허용, 가져오기/렌더링 HTML, JS·이미지 자원 상태를 확인한다.
3. ‘발견됨 - 현재 색인이 생성되지 않음’, ‘크롤링됨 - 현재 색인이 생성되지 않음’, 중복 canonical, 리디렉션, soft 404를 URL별로 분리한다. 숫자/원인을 계정 증거로 기록한다.
4. `www`, HTTP, 옛 `pixelfit.o-r.kr`, GitHub Pages URL 및 `index.html` 별칭이 새 정규 URL로 통합되는지 확인한다. 이전 주소 변경 작업의 상태는 실제 계정에서 확인한다.
5. 보안 문제·수동 조치·Core Web Vitals 보고서와 모바일 실제 사용자 데이터가 있는지 확인한다. 데이터 부족은 통과와 다르다.
6. 변경본을 승인해 실제 배포한 뒤 공개 HTML과 sitemap lastmod를 재확인하고, 중요한 수정 URL만 검사/필요한 색인 요청을 한다. 이번 작업에서는 요청을 보내지 않았다.

## 10. 재심사 전에 남은 위험

- **수정본은 아직 배포되지 않았다.** 현재 공개본에 개선이 반영됐다고 제출하면 안 된다. 배포 후 HTTP/정적 HTML/모바일/다운로드/ads OFF를 다시 확인해야 한다.
- 실제 AdSense 정책센터의 상세 사유·사이트 상태·재검토 가능 시점을 운영자가 확인해야 한다. 기존 7월 문서의 ‘준비 중’은 현재 계정 상태의 증거가 아니다.
- 8개 가이드는 일부 일반 설명을 포함한다. 이번에 형식 가이드와 핵심 도구의 근거를 강화했지만 전체 사이트의 독창성 평가는 Google이 한다. 추가 글 양산보다 사용자 실패 사례와 실제 개선 기록을 쌓는 편이 적절하다.
- 실측은 자체 이미지의 제한된 샘플이다. 사진/투명 로고/색 프로필/특이 메타데이터와 브라우저별 결과는 다를 수 있다. 제품 경고와 원본 비교를 유지해야 한다.
- 다른 도구의 외부 규격은 마지막 기록된 확인일 그대로다. 다시 열지 않은 출처를 오늘 확인했다고 표시하지 않았다. 중요한 제출/플랫폼 변경이 있으면 해당 출처와 도구를 함께 확인한다.
- 실제 모바일 기기, 동의 흐름, 이메일 응답성, 계정 상태는 미확인이다. 광고를 켜기 전에 CMP와 위치를 별도 검증한다.
- 승인 가능성이나 날짜를 보장하지 않는다. SEO 진단 정상·테스트 성공은 AdSense 심사와 별개다.

## 11. 이번에 실제 확인한 공식 자료

확인일은 모두 2026-10-12다. 기존 문서의 다른 외부 링크까지 재확인했다는 뜻은 아니다.

- [Google AdSense: 사이트에 독창적이고 유용한 콘텐츠와 사용자 경험 제공](https://support.google.com/adsense/answer/10015918?hl=ko)
- [Google Search Central: 유용하고 신뢰할 수 있는 사용자 중심 콘텐츠](https://developers.google.com/search/docs/fundamentals/creating-helpful-content?hl=ko)
- [Google AdSense: 유럽 규정 및 CMP 안내](https://support.google.com/adsense/answer/13554116?hl=ko)
- [대한민국 외교부: 여권사진 규격과 온라인용 사진파일](https://www.passport.go.kr/home/kor/contents.do?menuPos=12)
- [MDN: 이미지 파일 형식 안내](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types)
- [MDN: HTMLCanvasElement.toBlob](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob)
- [Schema.org: proficiencyLevel 사용 대상](https://schema.org/proficiencyLevel)

## 부록 A. 수정본의 28개 indexable 정규 URL

모든 행은 공개본에서 HTTP 200을 확인한 동일한 경로다. 아래 title/description/H1은 로컬 최종 HTML 기준이다. 정규 origin은 https://pixelfit.me, canonical과 OG URL은 이 경로와 일치한다. 모든 행의 robots는 index, follow이며 공개 응답의 X-Robots-Tag는 없었다. 헤딩 수는 H1/H2/H3/H4/H5/H6 순서다. 계층별 원문은 감사 JSON에 보존했다.

| 경로 | title | meta description | H1 | 헤딩 수 | lastmod |
| --- | --- | --- | --- | --- | --- |
| / | 사진 용량 줄이기·이미지 크기 조절·형식 변환 &#124; 픽셀핏 | 사진 압축, 크기 조절, JPG·PNG·WebP 변환, SNS 이미지, 공식 사진 규격과 개인정보 정리를 브라우저에서 처리합니다. | 사진 용량 줄이기 크기·형식 조절. | 1/5/11/0/0/0 | 2026-10-12 |
| /about/ | 픽셀핏 소개 &#124; 픽셀핏 | 사진 규격을 몰라도 목적에 맞는 결과를 기기 안에서 만들 수 있도록 돕는 픽셀핏의 운영 원칙을 소개합니다. | 사진 규격을 몰라도 바로 만들 수 있도록 | 1/7/0/0/0/0 | 2026-07-26 |
| /contact/ | 문의 &#124; 픽셀핏 | 픽셀핏 오류, 접근성 문제, 규격 출처 정정과 개인정보 관련 문의 방법입니다. | 픽셀핏에 문의하기 | 1/6/0/0/0/0 | 2026-07-26 |
| /privacy/ | 개인정보 처리 안내 &#124; 픽셀핏 | 픽셀핏의 기기 내 이미지 처리, 사이트 요청, 선택적 광고 설정과 문의 방법을 구분해 설명합니다. | 사진은 이 기기 안에서 처리됩니다. | 1/7/0/0/0/0 | 2026-07-26 |
| /terms/ | 이용약관 &#124; 픽셀핏 | 픽셀핏 이미지 규격 도구의 이용 조건, 결과 확인 책임과 면책 범위입니다. | 이용약관 | 1/7/0/0/0/0 | 2026-07-26 |
| /guide/ | 사진 크기·형식·개인정보 가이드 &#124; 픽셀핏 | 여권사진 픽셀, 500KB 압축, 증명사진 크기, DPI, YouTube 안전영역, 파비콘, EXIF와 이미지 형식을 실제 예시로 설명합니다. | 숫자를 이해하면 결과를 더 정확히 확인할 수 있습니다. | 1/1/8/0/0/0 | 2026-07-26 |
| /passport-photo/ | 여권사진 413×531 만들기·500KB 맞추기 &#124; 픽셀핏 | 한국 온라인 여권사진을 413×531px, JPG 500KB 이하로 만들고 규격 검사를 확인합니다. 배경은 합성하지 않으며 이미지는 업로드하지 않고 현재 브라우저에서 처리합니다. | 한국 온라인 여권사진 | 1/12/14/0/0/0 | 2026-10-12 |
| /id-photo/ | 증명사진 3×4 만들기·배경색 변경 &#124; 픽셀핏 | 일반 증명사진을 3×4cm의 300dpi 환산 크기로 만들고 흰색·회색·파란색 배경 후보를 비교합니다. 이미지는 업로드하지 않고 현재 브라우저에서 처리합니다. | 일반 증명사진 3×4cm | 1/10/12/0/0/0 | 2026-07-26 |
| /resident-id-photo/ | 주민등록증 사진 3.5×4.5 맞추기 &#124; 픽셀핏 | 주민등록증용 3.5×4.5cm 사진을 413×531px 서비스 값으로 맞추고 JPG 또는 PNG로 저장합니다. 이미지는 업로드하지 않고 현재 브라우저에서 처리합니다. | 주민등록증 사진 | 1/10/11/0/0/0 | 2026-07-26 |
| /youtube-banner/ | 유튜브 배너 2560×1440 만들기·안전영역 확인 &#124; 픽셀핏 | 유튜브 채널 배너를 2560×1440px로 만들고 모바일·데스크톱·TV의 텍스트 안전영역을 함께 확인합니다. 이미지는 업로드하지 않고 현재 브라우저에서 처리합니다. | 유튜브 채널 배너 | 1/10/13/0/0/0 | 2026-07-26 |
| /favicon-maker/ | 파비콘 만들기 — ICO·PNG·manifest ZIP 생성 &#124; 픽셀핏 | 한 장의 로고로 favicon.ico, 크기별 PNG, apple-touch-icon, manifest와 설치 안내 ZIP을 생성합니다. 이미지는 업로드하지 않고 현재 브라우저에서 처리합니다. | 파비콘 패키지 생성기 | 1/10/12/0/0/0 | 2026-07-26 |
| /photo-privacy-cleaner/ | 사진 위치정보·EXIF 삭제하기 &#124; 픽셀핏 | 사진의 GPS, 기기명, 촬영일 등 선택한 개인정보성 EXIF를 재검사하며 정리합니다. 원본은 덮어쓰지 않고 이미지는 업로드하지 않고 현재 브라우저에서 처리합니다. | 사진 개인정보 메타데이터 정리 | 1/11/14/0/0/0 | 2026-10-12 |
| /image-compressor/ | 사진 용량 줄이기 — 목표 KB·MB로 이미지 압축 &#124; 픽셀핏 | 100KB, 200KB, 500KB, 1MB, 2MB 또는 직접 입력한 크기에 맞춰 다운로드 파일의 실제 용량을 확인하며 사진을 줄입니다. 이미지는 업로드하지 않고 현재 브라우저에서 처리합니다. | 사진 용량 줄이기 | 1/12/12/0/0/0 | 2026-10-12 |
| /image-resizer/ | 이미지 크기 조절 — 픽셀·긴 변·퍼센트 리사이즈 &#124; 픽셀핏 | 가로·세로 픽셀, 긴 변, 퍼센트와 비율 잠금을 이용해 이미지를 contain 또는 cover 방식으로 조절합니다. 이미지는 업로드하지 않고 현재 브라우저에서 처리합니다. | 이미지 크기 조절 | 1/11/12/0/0/0 | 2026-10-12 |
| /image-converter/ | 이미지 형식 변환 — JPG·PNG·WebP 바꾸기 &#124; 픽셀핏 | JPEG, PNG, WebP 사이에서 품질과 투명 배경 처리 방식을 고르고 실제 출력 형식을 다시 확인해 저장합니다. 이미지는 업로드하지 않고 현재 브라우저에서 처리합니다. | 이미지 형식 변환 | 1/10/10/0/0/0 | 2026-07-26 |
| /social-image-pack/ | SNS 이미지 세트 만들기 — 1:1·4:5·9:16 한 번에 &#124; 픽셀핏 | 사진 한 장을 정사각형, 세로 게시물, 스토리·릴스 비율로 각각 조정해 개별 파일이나 ZIP으로 받습니다. 이미지는 업로드하지 않고 현재 브라우저에서 처리합니다. | SNS 이미지 세트 | 1/10/10/0/0/0 | 2026-07-26 |
| /instagram-profile-picture/ | 인스타그램 프로필 사진 만들기 — 원형 테두리·여백 &#124; 픽셀핏 | 사진을 바로 잘라 채우지 않고 작은 원 안에 먼저 축소 배치한 뒤 테두리 색, 원 크기, 사진 여백과 배경색을 조절해 1080×1080 JPG·PNG로 저장합니다. 이미지는 업로드하지 않고 현재 브라우저에서 처리합니다. | 인스타그램 프로필 사진 | 1/10/12/0/0/0 | 2026-07-30 |
| /youtube-thumbnail/ | 유튜브 썸네일 만들기 — 3840×2160 템플릿 &#124; 픽셀핏 | YouTube 공식 권장 3840×2160, 16:9 기준으로 제목과 사진 위치를 제한된 템플릿에서 조정해 JPG·PNG를 만듭니다. 이미지는 업로드하지 않고 현재 브라우저에서 처리합니다. | 유튜브 썸네일 | 1/11/10/0/0/0 | 2026-07-26 |
| /four-cut-photo/ | 네컷사진 만들기 — 세로·가로 포토부스 프레임 &#124; 픽셀핏 | 사진 1~4장의 순서와 크롭을 조정하고 흑백·빈티지, 프레임, 날짜와 짧은 문구를 넣어 네컷 JPG·PNG를 만듭니다. 이미지는 업로드하지 않고 현재 브라우저에서 처리합니다. | 네컷사진 만들기 | 1/11/10/0/0/0 | 2026-07-26 |
| /film-photo/ | 필름사진 효과 — 그레인·비네팅·빛샘 만들기 &#124; 픽셀핏 | 사진에 필름 그레인, 비네팅, 빛샘, 흑백·저채도·플래시와 날짜 스탬프를 적용해 JPG·PNG로 저장합니다. 이미지는 업로드하지 않고 현재 브라우저에서 처리합니다. | 필름사진 효과 | 1/11/10/0/0/0 | 2026-07-26 |
| /guide/passport-photo-413x531/ | 여권사진 413×531px 만드는 법 &#124; 픽셀핏 | 온라인 여권사진을 413×531px JPEG·500KB 이하로 준비하는 계산, 사진 자르기, 용량 확인 순서를 공식 기준과 함께 설명합니다. | 온라인 여권사진 413×531px 만드는 법 | 1/9/1/0/0/0 | 2026-10-12 |
| /guide/photo-under-500kb/ | 사진 500KB 이하로 줄이는 방법 &#124; 픽셀핏 | 사진 픽셀과 JPEG 품질을 순서대로 조절하고 내려받은 파일의 실제 용량을 다시 확인해 500KB 이하로 만드는 절차입니다. | 사진을 500KB 이하로 줄이는 순서 | 1/9/1/0/0/0 | 2026-07-26 |
| /guide/id-photo-size/ | 증명사진 3×4·3.5×4.5cm 크기와 픽셀 &#124; 픽셀핏 | 3×4cm 일반 증명사진과 3.5×4.5cm 주민등록증 사진의 차이, 300dpi 환산 픽셀과 제출 전 확인점을 설명합니다. | 증명사진 크기: 3×4cm와 3.5×4.5cm | 1/9/2/0/0/0 | 2026-07-26 |
| /guide/dpi-vs-pixels/ | DPI와 픽셀 차이·인화 크기 계산법 &#124; 픽셀핏 | 픽셀 수와 DPI가 각각 무엇을 뜻하는지, px÷dpi와 cm÷2.54×dpi 공식으로 인화 크기와 필요한 픽셀을 계산합니다. | DPI와 픽셀의 차이, 인화 크기 계산법 | 1/9/1/0/0/0 | 2026-07-26 |
| /guide/youtube-banner-safe-area/ | 유튜브 배너 2560×1440 안전영역 가이드 &#124; 픽셀핏 | YouTube 공식 최소 크기와 1235×338 안전영역을 2560×1440에 환산하고 텍스트·로고가 잘리지 않게 배치하는 법입니다. | 유튜브 배너 안전영역 계산과 배치 | 1/9/1/0/0/0 | 2026-07-26 |
| /guide/favicon-files/ | 파비콘 파일 구성과 설치 방법 &#124; 픽셀핏 | favicon.ico, 16·32·48px PNG, apple-touch-icon, 192·512px 아이콘과 webmanifest의 역할과 설치 순서를 설명합니다. | 파비콘 파일 구성: ICO·PNG·manifest | 1/9/1/0/0/0 | 2026-07-26 |
| /guide/exif-photo-privacy/ | EXIF 위치정보·사진 개인정보 삭제 가이드 &#124; 픽셀핏 | JPEG·PNG·WebP에 함께 저장될 수 있는 GPS, 기기, 촬영일, 작성자 정보를 확인하고 원본을 보존하며 정리하는 방법입니다. | EXIF 위치정보와 사진 개인정보 지우기 | 1/9/1/0/0/0 | 2026-07-26 |
| /guide/jpeg-png-webp/ | JPEG·PNG·WebP 차이와 선택 기준 &#124; 픽셀핏 | 사진·투명 이미지·스크린샷·웹 배포에서 JPEG, PNG, WebP의 손실 압축, 투명도, 용량, 호환성을 비교합니다. | JPEG·PNG·WebP, 어떤 형식을 고를까 | 1/13/3/0/0/0 | 2026-10-12 |

원본/수정본 감사 JSON과 HTML, 모바일 스크린샷은 `output/seo-2026-10-12/{public-before,export-before,export-after,rendered-public,rendered-after}/`에 있다. 이 output 경로는 원본 테스트 기록이며 Git 추적 대상은 아니다.

## 부록 B. 최종 실행 결과

| 명령/검사 | 실제 결과 | 근거 로그 |
| --- | --- | --- |
| pnpm lint | PASS, warning 0 | lint-final.log |
| pnpm typecheck | PASS | typecheck-final.log |
| pnpm test | PASS, 50 files·210/210 | check-final.log |
| pnpm check | PASS, lint/typecheck/test/Pages/custom 순차 완료 | check-final.log |
| pnpm build:pages | PASS, 645 checks·28 URL·24 OG | check-final.log |
| pnpm build:custom:test | PASS, 646 checks | custom-test-final.log |
| pnpm build | PASS, custom 646 checks | final-build.log |
| pnpm verify:export | PASS, custom 646 checks | verify-export.log |
| pnpm verify:assets | PASS, 본 sample 22·압축 thumbnail 4·전체 OG 24 | verify-assets.log |
| pnpm test:e2e | PASS, **52 passed·2 intended skips**. 마지막 측정 환경 가드를 반영한 재실행도 52/2 | e2e-final.log, evidence-final.log |
| pnpm test:a11y | PASS, **4/4**, 공개 28페이지 초기 상태/대표 편집·결과 상태의 serious/critical 0 | a11y-final.log |
| 공개 HTTP/HTML | 28/28 HTTP 200, OG 24/24, robots/canonical/내부 링크 확인 | public-before/audit.json |
| 정적 export HTML | 28페이지, metadata/구조화 데이터/수정일 비교 | export-before/, export-after/ |
| 실제 모바일 렌더링 | 수정본 28페이지, 오류/초기화 실패/확대된 viewport/실패 이미지/주요 H1/H2 불일치 0 | rendered-after/audit.json |
| JS OFF 브라우저 | 홈+우선 5페이지의 본문·표·내부 링크와 JS 필요 안내 확인 | rendered-after/audit.json |
| Lighthouse mobile | 공개 대표 2 + 수정본 6, 8 reports 완료 | lighthouse/*.json |
| 공개 수정본 배포/실계정/실기기 | NOT_TESTED, 배포·계정 변경 안 함 | 이 보고서의 제한 사항 |

로그 경로는 모두 `output/seo-2026-10-12/` 아래다. pnpm 실행 버전은 11.25.0, Node 24.14.1이고 lockfile은 변경하지 않았다. 기존 Worker circular-dependency 경고는 최종 빌드에도 남았다. 경고/실패를 제외한 것으로 꾸미지 않았으며, 기능/정적 계약 검사는 통과했다.

### Lighthouse 13.0.1 · 모바일 실험실 측정

2026-10-12, Chrome 149, 기본 모바일 시뮬레이션, 각 경로 1회다. 순차 실행했고 초기 화면의 로딩만 측정했다. 모든 이미지 편집 연산이나 실기기 메모리 성능을 측정한 것은 아니다.

| 대상 | 경로 | Performance | A11y / BP / SEO | LCP ms | TBT ms | CLS |
| --- | --- | ---: | --- | ---: | ---: | ---: |
| 기존 공개본 | / | 99 | 100 / 100 / 100 | 2018 | 35 | 0.000 |
| 기존 공개본 | /guide/jpeg-png-webp/ | 100 | 100 / 100 / 100 | 1658 | 31 | 0.000 |
| 수정본 local | / | 99 | 100 / 100 / 100 | 2056 | 50 | 0.000 |
| 수정본 local | /image-compressor/ | 98 | 100 / 100 / 100 | 2343 | 39 | 0.000 |
| 수정본 local | /image-resizer/ | 98 | 100 / 100 / 100 | 2345 | 39 | 0.000 |
| 수정본 local | /passport-photo/ | 99 | 100 / 100 / 100 | 2196 | 40 | 0.000 |
| 수정본 local | /photo-privacy-cleaner/ | 98 | 100 / 100 / 100 | 2350 | 42 | 0.000 |
| 수정본 local | /guide/jpeg-png-webp/ | 99 | 100 / 100 / 100 | 2050 | 47 | 0.000 |

기존 공개 홈 측정에는 브라우저 캐시 초기화 timeout 경고 1개가 있었다. 그 수치는 냉시작 비교의 확정 근거로 사용하지 않는다. 다른 7개 보고서의 runWarnings는 없었다. 공개 서버와 localhost의 네트워크·캐시 환경이 다르므로 점수 차이를 수정의 인과 효과로 주장하지 않는다.

미사용/레거시 JavaScript, 렌더 차단, 캐시 수명 제안은 남아 있다. localhost 정적 서버의 캐시 경고를 GitHub Pages의 실제 장애로 옮겨 해석하지 않았다. 현 측정만으로 광범위한 프레임워크/번들 리팩터링을 정당화하지 않아 보존했다. 공개 가이드도 Lighthouse 점수는 높았지만 별도 실제 뷰포트 검사에서 너비 문제가 발견됐다. 점수와 실제 기능/독창적 콘텐츠 검증을 함께 봐야 한다.

실사용 INP·CrUX·GSC Core Web Vitals 상태는 NOT_TESTED다. LCP/TBT/CLS의 한 번 실험실 결과로 실제 사용자 CWV 통과를 선언하지 않는다.
