# 픽셀핏 v1 상태

스냅샷: 2026-07-22 KST

이 문서는 실행한 검사만 `PASS`로 기록하는 v1 사실 기록이다. 실기기 Safari, Lighthouse처럼 실행하지 않은 항목은 `NOT_TESTED`로 남긴다.

## 현재 마일스톤

M10 최종 QA와 출시 준비 — GitHub Pages 공개 배포 완료

출시 상태: **GitHub Pages 공개 릴리스**. 운영 URL은 `https://dubeeubbee.github.io/pixelfit/`이다.

## 완료 항목

- M0~M10의 제품 문서, 공통 디자인, Preset Registry, 여섯 도구, 로컬 이미지 처리 코어, SEO route, 개인정보/약관/가이드/404를 구현했다.
- 여권·일반 증명·주민등록증·YouTube 출력과 파비콘 ZIP, 개인정보 정리 파일을 실제 브라우저 다운로드로 생성하고 다시 파싱했다.
- 여권 프리셋의 배경 제거·교체·보정·생성형 작업을 schema, operation policy, UI와 E2E에서 차단했다.
- 일반 증명사진의 원본/흰색/회색/파랑 배경을 결정적 가장자리 색상 분리로 로컬 처리하고 원본 fallback을 제공했다.
- JPEG/PNG/WebP 개인정보 metadata를 container 단위로 선택 제거하고, 픽셀 payload·ICC·방향·DPI·알파·감지된 출처 segment의 보존 상태를 결과 보고서와 재파싱으로 확인하도록 구현했다.
- static export `out/`, Vercel 설정, 일반 정적 호스트용 `_headers`, 무비밀 GitHub Actions CI workflow를 추가했다.
- GitHub project Pages용 compile-time base path, trailing slash, `.nojekyll`, 절대 canonical/사이트맵 URL과 공식 Pages Actions 배포 workflow를 추가했다.
- 공식 출처를 2026-07-22에 재확인하고 [PRESET_SOURCES.md](./PRESET_SOURCES.md)에 규격·해석·한계를 기록했다.

## 검증 상태

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

## 도구별 확인 결과

| 도구 | 실제 확인 |
| --- | --- |
| 한국 온라인 여권사진 | 413×531 JPEG, 500KB 이하, 300dpi 기록 로직·parse-back, 금지 작업 비도달 |
| 일반 증명사진 | 354×472 다운로드, 흰색 자동 배경 분리 경로, 원본 fallback |
| 주민등록증 사진 | 413×531 다운로드, JPEG/PNG 선택과 300dpi 서비스 환산 안내 |
| YouTube 채널 배너 | 2560×1440, 6MB 이하, 안전영역/기기 예상 영역, blur/배치 variant |
| 파비콘 | ICO 16/32/48 + 6종 PNG + manifest + 설치 HTML + README ZIP 재개봉 |
| 사진 개인정보 정리 | PNG E2E 선택 제거·재파싱, JPEG/PNG/WebP container unit fixture, 원본 덮어쓰기 없음 |

## 실패 후 해결한 문제

- 최신 TypeScript 7과 ESLint 10 조합이 현재 Next ESLint 생태계와 충돌해 각각 TypeScript 5.9.3, ESLint 9.39.2로 고정했다.
- E2E axe가 비활성 단계 텍스트 대비 3.75:1을 보고해 색상을 조정한 뒤 serious/critical 0을 재확인했다.
- Next 런타임이 자체 sessionStorage 값을 만들 수 있어 “저장소가 비어 있음” 가정 대신 업로드 전후 snapshot 동일성을 검사하도록 수정했다.
- 개발 서버 HMR 로그가 production 결과와 섞이지 않도록 Playwright를 `next build` 후 `serve out`을 쓰는 production-like 경로로 변경했다.
- 320px 편집 화면의 하단 주요 버튼이 좁게 세로 배치되던 문제를 2열 grid와 전체 폭 primary action으로 수정했다.
- 첫 GitHub CI는 Chromium만 설치해 WebKit 모바일 12개가 실행 파일 없음으로 실패했다. workflow에 Chromium과 WebKit 설치를 모두 추가한 뒤 CI `29924220607`에서 24/24를 재확인했다.

현재 남은 실패한 검사는 없다. 위의 `NOT_TESTED` 항목은 실패가 아니라 실행 증거가 없는 검사다.

## 알려진 제한

- 네이티브 `FaceDetector`는 지원 브라우저에서만 선택적으로 사용한다. 테스트 Chromium에서는 미지원 fallback을 확인했으며, 모든 환경에서 수동 위치·확대 조정으로 계속할 수 있다.
- 별도 ML 모델을 포함하지 않았다. 가장자리 색상 기반 배경 분리는 복잡한 배경, 머리카락, 배경과 비슷한 색의 피사체에서 부정확할 수 있다.
- SVG와 HEIC 입력은 sanitizer/로컬 decoder의 보안·라이선스·번들 검증 전이라 v1에서 지원하지 않는다.
- metadata container를 수정하면 C2PA/Content Credentials가 무효화될 수 있다. 알려진 출처 segment는 제거 대상이 아니지만 보존이나 유효성을 보장하지 않는다.
- 정부24 주민등록증 상세 URL은 확인 당시 점검 페이지로 이동해 해당 온라인 제출 규격은 재검증이 필요하다.
- 기본 `https://pixelfit.example`과 `help@pixelfit.example`은 예약 placeholder다. Pages workflow는 실제 `NEXT_PUBLIC_SITE_URL`을 주입하지만 중앙 브랜드 연락처는 운영자 주소로 바꿔야 한다.
- GitHub Pages는 `vercel.json`과 `_headers`를 해석하지 않아 프로젝트가 정의한 사용자 지정 CSP·Permissions-Policy 등을 적용할 수 없다. 해당 헤더가 필수면 지원 호스트를 사용해야 한다.

## 마지막 검증 기록

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

다음 갱신은 실기기 Safari, Lighthouse, 모바일 대형 이미지 회복력, 필요 시 사용자 지정 보안 헤더를 지원하는 호스트 결과를 기록한다.
