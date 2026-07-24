# 픽셀핏 상태

스냅샷: 2026-07-24 KST

이 문서는 공개 v1과 로컬 v2 RC를 분리하고, 실행한 검사만 `PASS`로 기록한다. 실기기 Safari, GitHub-hosted v2 workflow, 공개 v2처럼 실행하지 않은 항목은 `NOT_TESTED`로 남긴다.

## v2 custom-domain SEO·AdSense 준비 — 2026-07-24

이 절은 아래 2026-07-23 로컬 RC·구현 기록보다 최신이며, 아직 최종 commit·GitHub-hosted 배포·공개 v2 승인 기록은 아니다.

- production custom host를 `pixelfit.o-r.kr`로 고정하고, 기본 `pnpm build`와 Pages workflow가 HTTPS root canonical·빈 base path 계약을 사용하도록 정리했다. `/pixelfit` mode는 회귀 검사용 `pnpm build:pages`에 남겼다.
- 홈 제목의 의도된 줄을 `용도를 고르고` / `사진만 올리세요.`로 고정했다.
- 구조화 데이터는 홈 `WebSite`, 가이드 허브 `ItemList`, 도구 `BreadcrumbList`, 가이드 상세 `BreadcrumbList`와 `Article`만 남겼다. 실제 price·review·rating 근거가 없는 `WebApplication`/`SoftwareApplication`과 rich-result 오인을 제거했다.
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`과 호환 `GOOGLE_SITE_VERIFICATION`으로 Search Console URL-prefix HTML 확인 meta를 만들 수 있다. 토큰 배포는 소유권 승인이나 sitemap 제출 완료를 뜻하지 않는다.
- 유효한 실제 AdSense client가 있으면 광고 OFF 상태에서도 `google-adsense-account` meta와 custom-root `ads.txt`를 만들 수 있도록 계정 확인을 광고 제공 게이트와 분리했다. 광고 loader와 slot은 enabled/client/slot이 모두 유효한 경우에만 가능하며 production에서는 계속 OFF다.
- 개인정보 문서는 광고가 활성화될 경우의 제3자 cookie·web beacon·IP/식별자, Google 설정 링크와 CMP 전제 조건을 명시하도록 보강했다.

| 확인 | 현재 결과 |
| --- | --- |
| `pnpm lint && pnpm typecheck && pnpm test` | `PASS` — 40 files, 132/132 |
| `pnpm check` project/custom 전체 build | `PASS` — Pages verifier 409 checks, 실제 `pixelfit.o-r.kr` verifier 410 checks, sitemap 27 URLs, OG 23 files |
| `pnpm test:e2e` | `PASS` — 46 cases 중 45 passed, 대표 viewport를 한 Chromium context에서 순회하는 중복 mobile-project case 1 skipped |
| axe serious/critical | `PASS` — Chromium desktop/mobile의 홈·대표 도구·편집 결과에서 0 |
| 제목·모바일 메뉴 화면 | `PASS` — 1440·1024·390·320px에서 지정한 두 줄과 가로 overflow 0, 320px 수동 화면 캡처 확인 |
| AdSense 계정 확인 전용 test build | `PASS` — 광고 OFF에서 account meta·custom `ads.txt` 생성, loader·slot marker 0; 테스트 ID 제거 후 실제 OFF 산출물 복원 |
| `pixelfit.o-r.kr` DNS | `PASS` — GitHub Pages를 가리킴 |
| `pixelfit.o-r.kr` strict HTTPS | `FAIL/PENDING` — 2026-07-24 확인 시 `*.github.io` 인증서만 제공되어 호스트명 검증 실패 |
| Search Console URL-prefix 소유권·sitemap | `NOT_TESTED` — 유효한 HTTPS와 실제 token 배포 후 진행 |
| AdSense 사이트 등록 | `BLOCKED` — `pixelfit.o-r.kr`은 PSL에 등록된 플랫폼 하위 도메인이 아닌 `o-r.kr`의 일반 하위 도메인이고 상위 `o-r.kr/ads.txt` 제어권이 없음 |

Search Console은 GitHub Pages 인증서가 `pixelfit.o-r.kr`에 유효해진 뒤 URL-prefix HTML meta 방식으로 진행한다. AdSense는 별개로 운영자가 제어하는 등록 가능 루트 도메인을 확보해야 하며, 현재 주소나 상위 `o-r.kr`의 소유권을 가장해 등록하지 않는다.

## v2 확장 기준선 — 2026-07-23 01:47~01:49 KST

기존 공개 v1과 이번 로컬 확장을 구분하기 위해 변경 전 기준선을 다시 실행했다. 이 시점의 작업 트리는 깨끗했고 커밋·푸시·배포는 수행하지 않았다.

| 검사 | 기준선 결과 |
| --- | --- |
| `pnpm install --frozen-lockfile` | `PASS` — pnpm 11.9.0, lockfile 변경 없음 |
| `pnpm lint` | `PASS` — warning 0 |
| `pnpm typecheck` | `PASS` — 종료 코드 0 |
| `pnpm test` | `PASS` — 14 files, 44/44 |
| Pages 경로 production build | `PASS` — `/pixelfit`, 정적 페이지 14개 |
| `pnpm test:e2e` | `PASS` — Chromium desktop/mobile 24/24 |
| `pnpm test:a11y` | `PASS` — axe serious/critical 0, 2/2 |

따라서 이후 발생하는 새 실패는 이 확장 변경의 회귀로 분류한다. P0~P5 구현 결과는 아래 기존 v1 기록과 분리해 계속 추가한다.

## v2 P0/P2 로컬 구현 — 2026-07-23

- 중앙 Zod 환경 검증, trailing-slash URL helper, GitHub Pages `/pixelfit`와 커스텀 도메인 root 빌드 모드를 구현했다.
- 가짜 `.example` URL·메일을 제거하고, 미설정 문의는 `DUBEEUBBEE/pixelfit` GitHub Issues와 사진 첨부 금지 안내로 대체했다.
- `/about`, `/contact`, 개인정보, 약관의 운영 주체·수정일·이미지/사이트/광고 데이터 구분을 갱신했다.
- AdSense는 기본 OFF이며 enabled/client/slot이 모두 유효하지 않으면 script와 slot DOM이 0개다. 허용 위치는 콘텐츠 구간 세 곳으로 제한했고 편집·업로드·결과·다운로드·정책 화면 배치는 차단한다.
- 조건부 Naver 인증 meta는 실제 token이 있을 때만 생성한다. Search Console, Naver 등록, DNS, AdSense/CMP 계정 작업은 수행하지 않았다.

검증: env/URL/AdSense/SEO route 단위·컴포넌트 검사 5 files, 16/16 `PASS`. 전체 이중 build와 브라우저 검사는 모든 신규 도구 통합 뒤 실행한다.

## v2 P1 로컬 구현 — 2026-07-23

- 13개 도구의 고유 SEO 제목·설명·검색 별칭·콘텐츠 수정일·명시적 다음 도구 관계를 중앙 카탈로그에 추가했다.
- 홈·13개 도구·가이드 허브·8개 독립 가이드에 자체 제작 1200×630 PNG OG 이미지를 연결했다. 외부 이미지와 사용자 사진은 사용하지 않았다.
- 2026-07-23 당시에는 홈 `WebSite`·`WebApplication`, 도구 `BreadcrumbList`·`SoftwareApplication`, 가이드 상세 `BreadcrumbList`·`TechArticle`를 구성했다. 이 역사적 구성이 2026-07-24 현재 출력은 아니며, 위 최신 절의 `WebSite` / `ItemList` / `BreadcrumbList` / `Article` 계약으로 교체됐다.
- 화면의 FAQ는 유지하고, 2026-07-23에 확인한 Google 문서 변경에 따라 `FAQPage` JSON-LD는 제거했다.
- sitemap은 홈·도구·가이드·신뢰 페이지만 `url`과 실제 `lastModified`로 포함하며 404·테스트 페이지는 제외했다. project path를 잃는 robots `Host` 지시문은 제거했다.

검증: 현재 전체 Vitest 33 files, 112/112 `PASS`; catalog/OG/guide/구조화 데이터/SEO route 단위 검사를 포함한다. 정적 route 이중 build와 렌더된 HTML 검사는 dispatcher 통합 뒤 실행한다.

## v2 P3~P5 통합 및 로컬 RC — 2026-07-23 03:05~03:41 KST

출시 상태: **로컬 release candidate `PASS`, 공개 v2 release는 `NOT_TESTED`**. 커밋·푸시·배포는 수행하지 않았고, 현재 공개 URL은 아래에 보존한 v1이다.

- 압축·크기 조절·형식 변환·SNS 세트·YouTube 썸네일·네컷·필름의 실제 로컬 처리와 다운로드를 완성했다.
- 미리보기와 최종 export를 분리하고, 무거운 렌더는 Worker/OffscreenCanvas 경로와 명시적 폴백을 사용한다. bitmap·Object URL·worker는 작업 종료·취소·이탈 때 정리한다.
- 같은 사진 전달은 명시적 CTA에서만 현재 탭의 React 메모리에 한 번 보관하며 새로고침 때 소멸한다.
- 홈을 6개 카테고리와 별칭 검색으로 개편하고 13개 도구·8개 가이드의 의도 기반 내부 링크를 연결했다.
- 동적 편집기 로딩 골격을 실제 초기 작업영역과 같은 높이로 예약해 대표 도구의 Lighthouse CLS를 0으로 낮췄다.
- Next 16 기본 Turbopack이 두 이미지 Worker 그래프에서 로컬 교착돼 production build는 검증된 `next build --webpack`으로 고정했다.

| 검사 | v2 최종 결과 |
| --- | --- |
| `pnpm install --frozen-lockfile` | `PASS` — pnpm 11.9.0, lockfile 변경 없음 |
| `pnpm lint` | `PASS` — warning 0 |
| `pnpm typecheck` | `PASS` — TypeScript strict, 종료 코드 0 |
| `pnpm test` | `PASS` — 40 files, 131/131 |
| `pnpm check` | `PASS` — lint·typecheck·131 tests·root static export 31 pages, 종료 코드 0 |
| `pnpm build:pages` | `PASS` — Next 정적 31 pages, verifier 112 checks·sitemap 27 URLs·OG 23 files |
| `pnpm build:custom:test` | `PASS` — Next 정적 31 pages, verifier 113 checks·sitemap 27 URLs·OG 23 files·CNAME·root asset·`/pixelfit` 누출 0 |
| `pnpm test:e2e` | `PASS` — Chromium desktop + WebKit iPhone 13, 44/44 |
| `pnpm test:a11y` | `PASS` — axe serious/critical 0, 4/4 |
| privacy network/storage | `PASS` — 이미지 처리 POST/PUT/PATCH 0, 같은 사진 one-shot·새로고침 소멸, 브라우저 이미지 저장 0 |
| 수동 Playwright 화면 | `PASS` — desktop 4화면·Chrome iPhone 13 2화면, console error/warning 0, local/session storage 0 |
| 실기기 Safari | `NOT_TESTED` — Playwright WebKit iPhone 13 자동 검사는 통과했지만 실제 기기·Safari 수동 검사는 실행하지 않음 |
| GitHub-hosted v2 CI/Pages | `NOT_TESTED` — 새 commit·push·workflow 실행 없음 |
| 공개 v2 URL smoke | `NOT_TESTED` — 기존 공개 v1을 덮어쓰지 않음 |

### Lighthouse 13.4.1 — local custom-root static export, 기본 mobile 설정

| 경로 | Performance | Accessibility | Best Practices | SEO | CLS |
| --- | ---: | ---: | ---: | ---: | ---: |
| `/` | 100 | 100 | 100 | 100 | 0 |
| `/passport-photo/` | 99 | 100 | 100 | 100 | 0 |
| `/image-compressor/` | 99 | 100 | 100 | 100 | 0 |
| `/youtube-thumbnail/` | 99 | 100 | 100 | 100 | 0 |
| `/four-cut-photo/` | 99 | 100 | 100 | 100 | 0 |

원본 JSON은 `output/lighthouse/`에 보관했다. 점수는 로컬 환경과 측정 시점에 따라 달라질 수 있다.

## 공개 v1 보존 기록

M10 최종 QA와 출시 준비 — 2026-07-22 GitHub Pages 공개 배포 완료

출시 상태: **GitHub Pages 공개 릴리스**. 운영 URL은 `https://dubeeubbee.github.io/pixelfit/`이다.

## 공개 v1 완료 항목

- M0~M10의 제품 문서, 공통 디자인, Preset Registry, 여섯 도구, 로컬 이미지 처리 코어, SEO route, 개인정보/약관/가이드/404를 구현했다.
- 여권·일반 증명·주민등록증·YouTube 출력과 파비콘 ZIP, 개인정보 정리 파일을 실제 브라우저 다운로드로 생성하고 다시 파싱했다.
- 여권 프리셋의 배경 제거·교체·보정·생성형 작업을 schema, operation policy, UI와 E2E에서 차단했다.
- 일반 증명사진의 원본/흰색/회색/파랑 배경을 결정적 가장자리 색상 분리로 로컬 처리하고 원본 fallback을 제공했다.
- JPEG/PNG/WebP 개인정보 metadata를 container 단위로 선택 제거하고, 픽셀 payload·ICC·방향·DPI·알파·감지된 출처 segment의 보존 상태를 결과 보고서와 재파싱으로 확인하도록 구현했다.
- static export `out/`, Vercel 설정, 일반 정적 호스트용 `_headers`, 무비밀 GitHub Actions CI workflow를 추가했다.
- GitHub project Pages용 compile-time base path, trailing slash, `.nojekyll`, 절대 canonical/사이트맵 URL과 공식 Pages Actions 배포 workflow를 추가했다.
- 공식 출처를 2026-07-22에 재확인하고 [PRESET_SOURCES.md](./PRESET_SOURCES.md)에 규격·해석·한계를 기록했다.

## 공개 v1 검증 상태

| 검사 | 상태 | 근거/메모 |
| --- | --- | --- |
| `pnpm install --frozen-lockfile` | `PASS` | pnpm 11.9.0, lockfile 변경 없이 완료 |
| `pnpm lint` | `PASS` | `pnpm check`의 첫 단계, warning 0 |
| `pnpm typecheck` | `PASS` | TypeScript 5.9.3 strict, `tsc --noEmit` |
| `pnpm test` | `PASS` | Vitest 14 files, 44 tests |
| `pnpm build` | `PASS` | Next.js 16.2.11, 정적 페이지 14개 생성, `out/` 완성 |
| root static export | `PASS` | 환경변수 없는 `/` build, 14개 페이지와 루트 `_next` 자산 생성 |
| GitHub Pages static export | `PASS` | `/pixelfit` base path와 `https://dubeeubbee.github.io/pixelfit` URL로 14개 페이지 생성; 자산·내부 링크·canonical·sitemap·robots 확인 |
| `pnpm check` | `PASS` | lint → typecheck → unit/component → production build, 종료 코드 0 |
| `pnpm test:e2e` | `PASS` | production static preview, Chromium desktop + iPhone 13, 24/24 |
| `pnpm test:a11y` | `PASS` | Chromium desktop/mobile, axe serious/critical 0, 2/2 |
| desktop browser flow | `PASS` | 업로드→키보드 조정→생성→다운로드→parse-back 및 수동 화면 확인 |
| mobile browser flow | `PASS` | iPhone 13 프로젝트에서 같은 여섯 도구 흐름과 다운로드 통과 |
| privacy network/storage | `PASS` | 처리 중 POST/PUT/PATCH 0, local/session/IndexedDB/Cache Storage 전후 동일 |
| visual screenshot inspection | `PASS` | 1440×900, 768×1024, 390×844, 320×568 및 핵심 편집 상태를 직접 열어 확인 |
| browser console | `PASS` | 수동 production preview 확인에서 error 0, warning 0; E2E도 예상 밖 console error 0 |
| Playwright WebKit mobile | `PASS` | iPhone 13 WebKit 프로젝트 12/12; 전체 Chromium + WebKit 24/24 |
| 실기기 Safari smoke | `NOT_TESTED` | 실제 Safari 수동·실기기 검사는 실행하지 않음 |
| Lighthouse/performance | `NOT_TESTED` | 측정값을 생성하지 않음 |
| GitHub-hosted CI/Pages run | `PASS` | commit `522cc79`; CI `29924220607`, Pages `29924220581` 성공 |
| public deployment smoke | `PASS` | 공개 13개 경로 200; 홈→여권사진 업로드→413×531 JPG 생성·다운로드 완료 |
| HTTPS/static MIME/download | `PASS` | GitHub Pages HTTPS에서 HTML·sitemap·robots·SVG 응답과 24,929-byte JPG 다운로드 확인 |
| custom security headers | `HOST_LIMITATION` | GitHub Pages는 `vercel.json`·`_headers`를 해석하지 않아 프로젝트 정의 CSP 등은 적용 불가 |

## 공개 v1 도구별 확인 결과

| 도구 | 실제 확인 |
| --- | --- |
| 한국 온라인 여권사진 | 413×531 JPEG, 500KB 이하, 300dpi 기록 로직·parse-back, 금지 작업 비도달 |
| 일반 증명사진 | 354×472 다운로드, 흰색 자동 배경 분리 경로, 원본 fallback |
| 주민등록증 사진 | 413×531 다운로드, JPEG/PNG 선택과 300dpi 서비스 환산 안내 |
| YouTube 채널 배너 | 2560×1440, 6MB 이하, 안전영역/기기 예상 영역, blur/배치 variant |
| 파비콘 | ICO 16/32/48 + 6종 PNG + manifest + 설치 HTML + README ZIP 재개봉 |
| 사진 개인정보 정리 | PNG E2E 선택 제거·재파싱, JPEG/PNG/WebP container unit fixture, 원본 덮어쓰기 없음 |

## 공개 v1에서 실패 후 해결한 문제

- 최신 TypeScript 7과 ESLint 10 조합이 현재 Next ESLint 생태계와 충돌해 각각 TypeScript 5.9.3, ESLint 9.39.2로 고정했다.
- E2E axe가 비활성 단계 텍스트 대비 3.75:1을 보고해 색상을 조정한 뒤 serious/critical 0을 재확인했다.
- Next 런타임이 자체 sessionStorage 값을 만들 수 있어 “저장소가 비어 있음” 가정 대신 업로드 전후 snapshot 동일성을 검사하도록 수정했다.
- 개발 서버 HMR 로그가 production 결과와 섞이지 않도록 Playwright를 `next build` 후 `serve out`을 쓰는 production-like 경로로 변경했다.
- 320px 편집 화면의 하단 주요 버튼이 좁게 세로 배치되던 문제를 2열 grid와 전체 폭 primary action으로 수정했다.
- 첫 GitHub CI는 Chromium만 설치해 WebKit 모바일 12개가 실행 파일 없음으로 실패했다. workflow에 Chromium과 WebKit 설치를 모두 추가한 뒤 CI `29924220607`에서 24/24를 재확인했다.

공개 v1 당시 남은 실패한 검사는 없었다. v2의 현재 판정과 미실행 항목은 위 로컬 RC 표가 우선한다.

## 알려진 제한

- 네이티브 `FaceDetector`는 지원 브라우저에서만 선택적으로 사용한다. 테스트 Chromium에서는 미지원 fallback을 확인했으며, 모든 환경에서 수동 위치·확대 조정으로 계속할 수 있다.
- 별도 ML 모델을 포함하지 않았다. 가장자리 색상 기반 배경 분리는 복잡한 배경, 머리카락, 배경과 비슷한 색의 피사체에서 부정확할 수 있다.
- SVG와 HEIC 입력은 sanitizer/로컬 decoder의 보안·라이선스·번들 검증 전이라 v1에서 지원하지 않는다.
- metadata container를 수정하면 C2PA/Content Credentials가 무효화될 수 있다. 알려진 출처 segment는 제거 대상이 아니지만 보존이나 유효성을 보장하지 않는다.
- 정부24 주민등록증 상세 URL은 확인 당시 점검 페이지로 이동해 해당 온라인 제출 규격은 재검증이 필요하다.
- v1 공개 기록 당시에는 예약 URL·메일 placeholder가 있었으나 2026-07-23 로컬 v2 RC에서 제거했다. 현재 URL fallback은 실제 Pages 주소이고, 연락처 미설정 시 공개 GitHub Issues 안내와 원본 사진 첨부 금지 경고를 사용한다.
- GitHub Pages는 `vercel.json`과 `_headers`를 해석하지 않아 프로젝트가 정의한 사용자 지정 CSP·Permissions-Policy 등을 적용할 수 없다. 해당 헤더가 필수면 지원 호스트를 사용해야 한다.
- Worker·OffscreenCanvas·createImageBitmap 중 하나라도 없으면 로컬 Canvas 폴백을 사용한다. 폴백의 긴 필름 픽셀 루프는 시작·종료 사이 즉시 취소할 수 없다.
- 네컷 Worker는 합산 6천만 픽셀을 상한으로 순차 decode하지만, 렌더 중 원본 bitmap이 일시적으로 그 상한까지 존재할 수 있어 저메모리 실기기 검증이 남아 있다.
- production webpack build는 성공하지만 Worker runtime 청크 간 순환 의존 경고가 출력된다. 44개 Chromium/WebKit 브라우저 검사는 통과했고 기능 오류는 관찰되지 않았다.
- 광고 ON staging, 실제 AdSense/CMP와 Naver 외부 등록은 로컬 코드로 검증하지 않았다. `pixelfit.o-r.kr` DNS는 확인했지만 TLS 인증서는 2026-07-24 현재 발급 대기 상태이며, 이 일반 하위 도메인은 AdSense 등록 가능 루트 도메인을 대신하지 못한다.

## 공개 v1 마지막 검증 기록

- 검사 시각: 2026-07-22 05:07~05:17 및 22:24~22:35 KST
- 환경: macOS + GitHub Actions Ubuntu, Node.js 22/24.14.1, pnpm 11.9.0, Playwright 1.61.1, Chromium + WebKit
- release source commit: `522cc79`
- `pnpm check`: 종료 코드 0 — 14 test files / 44 tests, 14 static pages
- 환경변수 없는 `pnpm build`: 종료 코드 0 — root-path static export 14 pages
- `NEXT_PUBLIC_BASE_PATH=/pixelfit NEXT_PUBLIC_SITE_URL=https://dubeeubbee.github.io/pixelfit pnpm build`: 종료 코드 0 — Pages-path static export 14 pages, 잘못된 `/_next` 참조 0
- `pnpm test:e2e`: 종료 코드 0 — 24 passed
- `pnpm test:a11y`: 종료 코드 0 — 2 passed
- `pnpm start --listen 4174` + `HEAD /passport-photo`: 정적 preview 200 OK
- Playwright CLI visual QA: home, passport, YouTube, favicon, privacy editor의 desktop/mobile 상태 직접 확인; 마지막 console 0 errors / 0 warnings
- `rg -n "TODO|FIXME" ...`: 제품·테스트·CI 코드에서 미해결 항목 0
- GitHub-hosted CI `29924220607`: 14 test files / 44 tests, 14 static pages, Chromium + WebKit E2E 24/24, 종료 코드 0
- GitHub Pages `29924220581`: build + deploy 성공, `https://dubeeubbee.github.io/pixelfit/`
- 공개 smoke: 13개 경로 HTTP 200, 홈→여권사진 생성→24,929-byte 413×531 JPG 다운로드, console errors 0 / warnings 0

다음 갱신은 v2 최종 QA·commit과 GitHub-hosted CI/Pages run, `pixelfit.o-r.kr` 인증서 발급 후 공개 v2 smoke·Search Console 결과, 실기기 Safari·저메모리 대형 이미지 회복력, 등록 가능 루트 도메인 확보 후 AdSense/CMP 운영 검증을 기록한다.
