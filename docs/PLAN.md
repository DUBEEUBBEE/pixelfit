# 픽셀핏 구현 계획

기준일: 2026-07-30

## v2 확장 마일스톤

현재 v1 계약을 보존하면서 아래 순서로 사이트 신뢰·검색 정보·콘텐츠·도구 범위를 확장한다. 각 우선순위는 구현 직후 관련 검사와 `STATUS.md` 기록까지 끝나야 닫힌다.

- [x] P0: 중앙 환경 검증, URL/trailing-slash 정책, 커스텀 도메인 준비, About/Contact/정책 페이지
- [x] P1: 도구 SEO 레지스트리, OG 이미지, 구조화 데이터, 사이트맵, 8개 독립 가이드
- [x] P2: 기본 비활성 AdSense 구성·검증·안전한 수동 슬롯과 운영 문서
- [x] P3: 압축·리사이즈·형식 변환·소셜 이미지 묶음 도구
- [x] P4: YouTube 썸네일·네컷 사진·필름 사진 도구와 메모리 전용 다음 도구 전달
- [x] P5: 홈 카테고리·별칭 검색·내부 링크, 접근성·성능, 이중 빌드와 최종 QA
- [x] P6: 입력 헤더 방어·모든 결과 재검증·SNS/썸네일 Worker·SEO URL 회귀 검사·13도구 접근성 범위와 현재 문서 동기화
- [x] P7: 실제 운영자·문의·신뢰 정보, 자체 제작 결과 예시, 홈 검색·카테고리·JavaScript-off 전체 링크, 모바일 메뉴, 한국어 OG, 독립 게시/수정일·평이한 가이드 문구, 같은 사진 다음 작업·조건부 Web Share와 최종 QA
- [x] P8: 인스타그램 프로필 사진용 작은 원 contain 배치, 색 테두리·여백·캔버스 편집, 1080×1080 PNG/JPEG 검증과 desktop/mobile QA

커밋·푸시·배포, Search Console 변경, DNS·AdSense 계정·CMP 같은 외부 운영 변경은 이 계획의 로컬 구현 범위에 포함하지 않는다.

이 문서는 작업 순서와 완료 조건을 정의한다. 실제 완료 여부와 실행 결과는 [STATUS.md](./STATUS.md)에만 기록한다. 선행 마일스톤의 필수 검사가 실패하면 다음 마일스톤을 완료 처리하지 않는다.

## 공통 규칙

각 마일스톤은 구현 → 관련 검사 실행 → 실패 원인 수정 → 상태 문서 갱신 순서로 닫는다. `PASS`는 명령·시각·산출물 증거가 있을 때만 사용하고, 실행할 수 없었던 검사는 `NOT_TESTED`로 남긴다.

공통 검증 명령:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm build:pages
pnpm build:custom:test
pnpm verify:export
pnpm test:e2e
pnpm test:a11y
pnpm check
```

`pnpm check`는 lint, typecheck, unit/component test, build를 묶지만 Playwright E2E는 별도 실행한다.

P7 자체 제작 샘플·OG 자산 생성과 결정성 검증 명령:

```bash
pnpm generate:assets
pnpm verify:assets
```

`generate:assets`는 full PNG 4개와 SVG 18개로 구성된 자체 제작 본 샘플 22개, 압축 갤러리 전용 480×320 PNG 썸네일 4개와 한국어 OG PNG 24개를 다시 만든다. 압축 full PNG는 실제 압축 엔진 결과가 아니라 색 단계와 세부 묘사를 조절한 비교 fixture로 표시한다. `verify:assets`는 저장소 파일이 같은 입력에서 다시 만들어지는 결과와 일치하는지 검사하며, 본 샘플·썸네일의 선언·물리 파일 집합 일치와 고아 파일 0개도 확인한다. 개별 확인이 필요하면 `pnpm generate:samples`, `pnpm verify:samples`, `pnpm generate:og`, `node scripts/generate-og.mjs --check`를 사용할 수 있다.

## 공개 v1 구현 계획 — 보존 기록

아래 M0~M10은 2026-07-22 공개 v1의 구현 순서를 보존한다. v2 완료 상태와 현재 수치는 위 P0~P7 및 [STATUS.md](./STATUS.md)를 따른다.

## M0. 저장소 분석과 설계

상태: 완료 — 공개 v1 기록

작업:

- AGENTS.md, package manager, framework·test·build 설정과 기존 소스를 조사한다.
- baseline 설치·검사 결과와 기존 실패를 기록한다.
- 제품, 아키텍처, 출처, 개인정보, 테스트, 출시 문서를 만든다.
- 공식 출처를 재확인하고 seed·관행 값과 구분한다.
- 정적 export, 로컬 처리, preset 정책 게이트를 결정한다.

완료 조건:

- `pnpm install --frozen-lockfile`이 가능하다.
- baseline 명령 결과가 STATUS에 사실대로 기록된다.
- 필수 문서와 여섯 프리셋의 출처/해석이 존재한다.

위험:

- 공공기관 페이지 점검·구조 변경으로 재확인이 어려울 수 있다.
- 초기 저장소에는 제품 코드가 없어 baseline과 구현 후 상태를 분리해야 한다.

## M1. 앱 기반과 디자인 시스템

선행 조건: M0

작업:

- App Router 레이아웃, 한국어 문서, 브랜드 설정, 전역 스타일을 만든다.
- 헤더·푸터·홈·검색·도구 카드·공통 ToolShell을 구현한다.
- 모바일 우선 반응형, 포커스, reduced motion, 오류/상태 패턴을 적용한다.

완료 조건:

- 홈에서 여섯 도구를 검색하고 각 route로 이동할 수 있다.
- 모바일/데스크톱에서 주요 콘텐츠가 겹치거나 잘리지 않는다.
- lint, typecheck, 관련 component test, build가 통과한다.

위험: 좁은 viewport의 고정 버튼과 긴 한국어 문구가 overflow를 만들 수 있다.

## M2. Preset Registry와 SEO route

선행 조건: M1, PRESET_SOURCES 검토

작업:

- Zod schema와 여섯 프리셋, cm→px 유틸리티를 만든다.
- slug·출력값·공식 출처·allow/forbid 충돌 불변식을 검증한다.
- 도구/개인정보/약관/가이드/404, sitemap, robots, metadata와 구조화 데이터를 만든다.
- 화면 FAQ는 유지하되 현재 검색 정책에 실익이 없는 `FAQPage` JSON-LD는 생성하지 않는다.

완료 조건:

- 여권 프리셋에 배경 제거·교체·미화·생성형 작업을 넣으면 테스트가 실패한다.
- 공식 프리셋은 출처·확인일·승인 비보장 값을 가진다.
- 모든 정적 route가 production build에 포함된다.

검증: registry/unit/route test, `pnpm lint`, `pnpm typecheck`, `pnpm build`.

## M3. 이미지 처리 코어

선행 조건: M2

작업:

- 파일 크기·MIME·signature·픽셀 제한과 decode 오류를 처리한다.
- EXIF orientation, cover/contain, crop/rotation, resize/encode를 순수 모듈로 만든다.
- 제한 반복 압축, JPEG/PNG DPI 기록과 parse-back 검증을 구현한다.
- Worker/task 취소, race 방지, Object URL/버퍼 정리를 구현한다.

완료 조건:

- 생성 결과의 픽셀, 형식, 제한 용량, 약속한 DPI를 재파싱해 검증한다.
- 손상·빈 파일·MIME 불일치·대형 이미지에서 앱이 중단되지 않는다.
- cover/contain 및 회전 후에도 빈 가장자리가 생기지 않는다.

검증: 관련 unit test, fixture 출력 재검증, lint/typecheck/build.

위험: 브라우저 Canvas 인코더 차이, 모바일 Safari 메모리, DPI segment 호환성.

## M4. 공통 업로드·편집·결과 흐름

선행 조건: M3

작업:

- 접근 가능한 파일 선택/드롭, 미리보기, 드래그·터치 이동, zoom, rotate, reset을 만든다.
- 키보드 이동, 진행·취소, 자동 후보, 결과 checklist와 다운로드를 만든다.
- 늦게 도착한 자동 분석이 수동 편집을 덮어쓰지 않게 한다.

완료 조건:

- 데스크톱·모바일·키보드만으로 업로드부터 다운로드까지 진행할 수 있다.
- 작업 중 새 파일 선택, 페이지 이탈, background 전환에서 stale result를 노출하지 않는다.
- component/E2E와 콘솔 오류 검사가 통과한다.

## M5. 공식 사진과 얼굴 자동 맞춤

선행 조건: M4

작업:

- 선택적 네이티브 `FaceDetector` adapter와 수동 fallback을 구현한다.
- 여권·주민등록증 초기 맞춤, 얼굴 수·중심·휴리스틱 안내선을 제공한다.
- pass/warning/info 결과와 공식 면책을 제공한다.

완료 조건:

- API 미지원·0명·다중 얼굴에서도 수동 편집으로 계속할 수 있다.
- 여권 출력은 413×531 JPEG, 500KB 이하이며 배경 모듈이 호출되지 않는다.
- 승인 보장 표현이 없고 출처/확인일이 보인다.

검증: adapter mock, 정책 불변식, 여권 출력 parse-back, E2E.

위험: FaceDetector 지원 범위와 검출 품질. 기능 미지원은 제품 실패가 아니라 명시적 수동 fallback이다.

## M6. 일반 증명사진

선행 조건: M4

작업:

- 가장자리 표본 기반 결정적 배경 분리와 배경 테마를 구현한다.
- 얼굴/상반신/여백 후보와 원본 배경 fallback을 제공한다.

완료 조건:

- 354×472px 결과를 생성한다.
- 네 배경 모드 전환과 원본 복구가 가능하다.
- 실패를 숨기지 않고 품질 한계를 안내한다.

검증: segmentation unit test, 테마 component test, 정확한 출력 test, E2E.

위험: 복잡한 배경과 머리카락 경계에서는 결정적 색상 분리가 부정확할 수 있다.

## M7. YouTube 배너

선행 조건: M4

작업:

- 안전영역 스케일링, contain/blur-fill, 좌·중·우 배치를 구현한다.
- TV/데스크톱/모바일 예상 미리보기와 JPG/PNG 출력을 만든다.

완료 조건:

- 2560×1440px 결과 Blob이 6MB 이하다.
- 2048×1152 기준 1235×338 안전영역이 한 계산 경로로 환산된다.
- 실제 표시를 보장하지 않는 안내가 보인다.

검증: safe-area unit, output parse-back, compression, E2E.

## M8. 파비콘 패키지

선행 조건: M3, M4

작업:

- 테마별 정사각형 렌더, 크기별 PNG, multi-size ICO를 만든다.
- webmanifest, 설치 코드, README와 안정된 이름의 ZIP을 만든다.

완료 조건:

- ZIP을 다시 열었을 때 필수 파일이 모두 존재한다.
- PNG/ICO 크기와 manifest JSON이 유효하다.
- 16/32/48px 미리보기와 복잡한 원본의 식별성 경고가 보인다.

검증: ICO/manifest/ZIP unit test, E2E download.

## M9. 사진 개인정보 정리

선행 조건: M3, 개인정보 정책 검토

작업:

- JPEG segment, PNG chunk, WebP RIFF 파서와 선택 UI를 구현한다.
- 가능한 경우 픽셀 payload를 유지한 채 선택 필드를 제거한다.
- 출처 자격 증명 경고, before/after 재파싱, 새 파일 다운로드를 제공한다.

완료 조건:

- fixture에서 선택한 메타데이터 제거가 재파싱으로 확인된다.
- 보존한다고 표시한 orientation/ICC/DPI/payload는 실제 확인된 경우뿐이다.
- C2PA/JUMBF/Content Credentials 제거 옵션이 없다.

검증: 형식별 unit/fixture test, UI test, E2E, 네트워크·스토리지 privacy test.

위험: 제조사별 비표준 metadata와 출처 container를 완전하게 식별할 수 없다.

## M10. 최종 QA와 출시

선행 조건: M1~M9

작업:

- 전체 route와 여섯 end-to-end 다운로드 흐름을 Chromium desktop/mobile에서 검증한다.
- 키보드·axe·시각·콘솔·privacy network/storage 검사를 수행한다.
- security header, 정적 404, sitemap/robots, 공개 URL smoke를 확인한다.
- STATUS, README, notices, release checklist를 실제 결과로 갱신한다.

완료 조건:

- `pnpm check`, `pnpm test:e2e`, `pnpm test:a11y`가 모두 통과한다.
- 주요 페이지 스크린샷을 사람이 열어 overflow·겹침·대비를 확인했다.
- 정적 산출물을 호스팅하고 공개 URL에서 여섯 핵심 경로를 확인했다. 실제 배포가 범위에 포함되지 않았다면 이 항목은 `NOT_TESTED`이며 출시 완료로 표시하지 않는다.

위험: 호스트별 보안 헤더·clean URL·MIME 동작이 로컬 dev 서버와 다를 수 있다.

## 주요 결정 기록

| 결정 | 이유 | 재검토 조건 |
| --- | --- | --- |
| Next.js static export | 사용자 데이터 서버 처리 불필요, Vercel/정적 호스트 이식성 | 서버 기능 요구가 명시적으로 추가될 때 |
| 별도 전역 상태 라이브러리 없음 | 한 페이지의 단일 작업 흐름은 reducer/state로 충분 | 페이지 간 프로젝트 저장이 범위에 들어올 때 |
| 네이티브 FaceDetector + 수동 fallback | 모델·CDN·외부 API 없이 선택적 보조 가능 | self-host 모델의 라이선스·성능·필요성이 검증될 때 |
| 가장자리 색상 기반 배경 분리 | 가볍고 로컬·결정적이며 원본 fallback 가능 | 품질 목표가 이를 넘고 적합한 로컬 모델이 승인될 때 |
| SVG 입력 미지원 우선 | sanitizer/rasterizer가 검증되지 않은 SVG는 보안 경계 확대 | 공격 fixture를 포함한 sanitizer 검증 완료 시 |
| HEIC 미지원 우선 | 안정적 로컬 디코더·라이선스·번들 비용 확인 전 가짜 지원 방지 | 적합한 lazy-load 디코더 검증 시 |
