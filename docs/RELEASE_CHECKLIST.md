# 픽셀핏 출시 체크리스트

기준일: 2026-07-24

표기 규칙:

- `[x]`: 해당 버전과 산출물에서 실행 증거가 있는 완료 항목
- `[ ]`: 미실행, 미완료 또는 현재 후보에 연결할 증거가 없는 항목
- 실행할 수 없으면 지우지 않고 [STATUS.md](./STATUS.md)에 `NOT_TESTED`와 이유를 기록

과거 공개 v1과 현재 로컬 v2 후보를 합치지 않는다. v1의 `PASS`를 복사해 v2 체크박스를 채우는 것은 금지한다.

## A. 공개 v1 기록 — 보존

아래는 2026-07-22에 완료된 기존 6개 도구 release의 역사적 기록이다. 당시 소스·빌드·공개 URL에만 적용된다.

| 항목 | 기록 |
| --- | --- |
| release candidate | `pixelfit-v1-pages-1` |
| commit | `522cc79` |
| GitHub CI run | `29924220607` |
| GitHub Pages run | `29924220581` |
| 검사 일시 | 2026-07-22 05:07~05:17 및 22:24~22:35 KST |
| 검사 환경 | macOS + GitHub Actions Ubuntu, Node 22/24.14.1, pnpm 11.9.0, Playwright Chromium/WebKit 1.61.1 |
| 공개 URL | `https://dubeeubbee.github.io/pixelfit/` |
| 당시 판정 | 배포·기능 smoke `PASS`, GitHub Pages 공개 릴리스 완료 |

당시 확인된 범위:

- [x] 기존 6개 도구의 정적 route와 실제 다운로드 흐름
- [x] 여권·증명·주민등록증·배너·파비콘·개인정보 결과 재검사
- [x] 공개 v1 기준 lint, typecheck, unit, build, E2E, 접근성 및 GitHub Actions
- [x] `/pixelfit` project Pages 배포, 직접 URL·새로고침·HTTPS smoke
- [x] 공개 v1 기준 개인정보 네트워크·storage 검사

역사적 한계:

- [ ] 실제 호스트의 사용자 정의 보안 헤더 전체 확인
- [ ] 모바일 대형 이미지 후 메모리 회복 실기기 검사
- [ ] Lighthouse 수치 기록
- [ ] 실기기 Safari smoke

당시 FAQ 구조화 데이터 정책과 route 구성은 v1 구현을 설명할 뿐이다. v2 RC는 visible FAQ만 유지하고 `FAQPage` JSON-LD를 제거하는 새 계약을 따른다.

## B. 2026-07-23 로컬 v2 RC 기반 현재 후보 — 아직 공개 release 아님

현재 후보에는 13개 도구, 8개 가이드, 중앙 환경설정, 자체 OG PNG, 같은 사진 메모리 전달과 2026-07-24 SEO·AdSense 안전 계약이 있다. 2026-07-23에 체크된 실행 증거는 당시 RC에만 적용하며, 새 계약의 최종 전체 QA·commit·GitHub-hosted CI·공개 v2 배포 증거로 확대하지 않는다.

### 제품·route 계약

- [ ] Registry의 13개 도구와 8개 가이드가 최종 후보 commit에 고정됐다.
- [x] 홈, 모든 도구·가이드, about/privacy/terms/contact와 404가 두 build mode에서 정적으로 생성된다.
- [x] 모든 도구가 로컬 파일 선택부터 실제 다운로드까지 완료된다.
- [x] 핵심 경로에 mock 결과, 작동하지 않는 버튼, 숨겨진 demo가 없다.
- [x] 사용자 노출 문구와 `lang="ko"`가 확인됐다.
- [x] 공식값, 관행값과 서비스 기본값 badge·문구가 [PRESET_SOURCES.md](./PRESET_SOURCES.md)와 일치한다.
- [x] 승인·접수·검색 노출·영상 성과를 보장하는 문구가 없다.
- [x] HEIC, SVG 벡터화, metadata 완전 보존을 지원하는 척하지 않는다.

### 기존 6개 도구 실제 출력

- [x] 여권 JPEG가 413×531px이고 실제 Blob이 512,000바이트 이하이며 배경 작업 경로가 차단된다.
- [x] 일반 증명사진 결과가 354×472px이고 원본 배경 fallback이 있다.
- [x] 주민등록증 결과가 413×531px이며 선택한 JPEG/PNG와 300dpi 설명이 일치한다.
- [x] YouTube 배너가 2560×1440px, 6MiB 이하이며 최소 기준 1235×338 안전영역을 올바르게 환산한다.
- [x] 파비콘 ZIP의 ICO·PNG·manifest·안내문을 다시 열어 검사한다.
- [x] 개인정보 정리 결과에서 선택 metadata가 사라지고 표시한 보존 속성이 실제 결과와 일치한다.

### v2 추가 7개 도구 실제 출력

- [x] 사진 용량 줄이기가 목표 actual bytes, 달성/미달과 opt-in 축소를 정확히 표시한다.
- [x] 이미지 크기 조절이 직접 치수·긴 변·퍼센트·비율·contain/cover와 업스케일 경고를 처리한다.
- [x] 이미지 형식 변환이 실제 JPEG/PNG/WebP signature, alpha/background와 재인코딩 정책을 지킨다.
- [x] SNS 이미지 세트가 1:1·4:5·9:16 독립 crop과 개별/ZIP 결과를 만든다.
- [x] YouTube 썸네일이 최신 공식 권장 3840×2160, 16:9 결과를 만든다.
- [x] 네컷사진이 1~4개 파일, 반복 순서, 가로/세로, crop·프레임·필터·날짜·문구를 처리한다.
- [x] 필름사진이 결정적 효과, 원본 비교, reset과 JPEG/PNG 다운로드를 처리한다.

### 중앙 환경설정과 URL

- [x] 기본 사이트 URL, 운영자명과 문의 링크가 실제 값이며 가짜 fallback이 없다.
- [x] project Pages에서 canonical·OG·sitemap·robots·asset URL에 `/pixelfit`이 정확히 한 번 들어간다.
- [x] custom domain에서 canonical은 HTTPS root이고 `/pixelfit` 잔존이 없다.
- [x] 페이지와 파일 trailing slash 정책이 모든 route/asset에서 일관된다.
- [x] 잘못된 URL·base path·custom hostname과 선택 token을 안전하게 실패/무시한다.
- [x] Google Search Console URL-prefix 확인 meta가 유효한 token이 있는 build에서만 존재한다.
- [x] Naver verification meta가 유효한 token이 있는 build에서만 존재한다.

### 광고·동의 안전

- [x] AdSense 기본 OFF와 불완전 설정에서 script·slot DOM·광고 request가 0이다.
- [x] 유효한 enable/client/slot 조합에서만 광고가 렌더링된다.
- [x] 유효한 client를 사용한 account meta와 custom-root `ads.txt` 생성은 광고 enabled/slot과 분리된다.
- [x] 홈 콘텐츠 구분, 가이드 콘텐츠 구분, 도구 설명 끝 외 placement가 차단된다.
- [x] upload/editor/preview/result/download/navigation/privacy/terms/contact에 광고가 없다.
- [ ] 광고 ON staging에서 개인정보 고지, CMP·동의·철회와 외부 request를 검증했다.
- [ ] 승인된 publisher ID로 루트 도메인의 `ads.txt`를 게시하고 AdSense에서 확인했다.
- [ ] AdSense 계정·사이트 정책 review 상태를 실제 계정에서 확인했다.

### 같은 사진·개인정보

- [x] 사용자의 명시적 CTA에서만 같은 `File`이 현재 탭 메모리로 전달된다.
- [x] 대상 ID 제한, one-shot claim과 새로고침 소멸을 검증했다.
- [x] localStorage/sessionStorage/IndexedDB/Cache Storage에 사용자 이미지가 없다.
- [x] 13개 도구 처리 중 이미지 관련 POST/PUT/PATCH가 0이다.
- [x] request·console에 fixture bytes, 파일명, EXIF, 얼굴 bbox가 없다.
- [x] 파일 교체·초기화·route 이동에서 Object URL과 이전 결과 참조가 해제된다.
- [x] C2PA/JUMBF/Content Credentials 제거 옵션과 우회 안내가 없다.
- [x] 개인정보 페이지가 광고/CMP 네트워크와 로컬 이미지 처리 경계를 구분한다.

### SEO·콘텐츠

- [x] 홈·13개 도구·8개 가이드에 고유 title, description, canonical과 OG/Twitter metadata가 있다.
- [ ] 자체 OG PNG가 모두 1200×630이며 실제 route에서 200과 올바른 MIME으로 제공된다. (파일·export 참조는 검증, 공개 HTTP는 `NOT_TESTED`)
- [x] 홈 `WebSite`, 가이드 허브 `ItemList`, 도구 `BreadcrumbList`, 가이드 상세 `BreadcrumbList`/`Article`만 사용한다.
- [x] 실제 price·review·rating 근거가 없는 `WebApplication`/`SoftwareApplication`이 없다.
- [x] visible FAQ는 존재하지만 `FAQPage` JSON-LD는 0개다.
- [x] 가짜 review, rating, 사용량, 촬영일, 작성·수정 metadata가 없다.
- [ ] sitemap, robots, 404, 직접 URL과 새로고침이 각 base mode에서 동작한다. (두 export 계약과 root preview는 검증, Pages-mode 전체 preview는 `NOT_TESTED`)

### 자동 검사

- [x] `pnpm install --frozen-lockfile`
- [x] `pnpm lint`
- [x] `pnpm typecheck`
- [x] `pnpm test`
- [x] project Pages mode `pnpm build:pages`
- [x] custom-domain root mode `pnpm build:custom:test`
- [x] `pnpm check`
- [x] `pnpm test:e2e`
- [x] `pnpm test:a11y`
- [x] 처리되지 않은 page error와 예상 밖 console error 0
- [ ] GitHub-hosted CI 전체 통과

### 접근성·시각 QA

- [x] axe critical/serious violation 0
- [ ] 키보드만으로 대표 도구의 파일 선택 이후 다운로드 완료
- [x] focus, label, slider value, `aria-live`, `aria-busy`와 색상 외 상태 표시
- [x] crop·안전영역·원형 preview의 텍스트 대안
- [ ] 1440×900, 768×1024, 390×844, 320×568 스크린샷 직접 검토
- [ ] 200% zoom, reduced motion, 긴 한국어와 mobile touch target
- [x] WebKit smoke
- [ ] 실기기 Safari smoke

### 성능

- [x] 홈에서 무거운 편집 코드·모델·광고가 불필요하게 선로드되지 않는다.
- [ ] 대형 입력에서 취소·새 작업과 메모리 회복을 검사했다.
- [ ] 대표 route의 mobile/desktop Lighthouse report를 보관했다. (로컬 mobile 5개 route는 완료, desktop Lighthouse는 `NOT_TESTED`)
- [x] Performance ≥90, Accessibility/Best Practices/SEO ≥95, CLS <0.1 목표를 검토했다.

### 이중 build와 공개 배포

- [ ] `/pixelfit` build 산출물과 로그를 별도로 보관했다.
- [ ] custom-domain root build 산출물과 로그를 별도로 보관했다.
- [ ] 두 preview에서 13개 도구·8개 가이드·asset·download·404·새로고침을 확인했다.
- [ ] final commit과 GitHub Actions run ID를 기록했다.
- [ ] GitHub Pages workflow가 성공하고 공개 URL에서 v2 fingerprint를 확인했다.
- [ ] 공개 URL의 HTTPS, MIME, cache와 실제 response header를 확인했다.
- [x] 알려진 제한이 UI, README, STATUS와 일치한다.

### 외부 운영 작업

- [x] production custom host를 `pixelfit.o-r.kr`로 선택했고 DNS가 GitHub Pages를 가리키는 것을 확인했다.
- [ ] `pixelfit.o-r.kr`에 유효한 HTTPS 인증서가 발급되고 HTTP→HTTPS가 정상 적용됐다. (2026-07-24 확인 시 GitHub Pages `*.github.io` 인증서만 보여 호스트명 검증 실패)
- [ ] Google Search Console URL-prefix 속성에 실제 token을 설정하고 소유권을 확인했다.
- [ ] Search Console에 실제 sitemap을 제출하고 처리 상태를 기록했다.
- [ ] Naver Search Advisor를 사용한다면 token을 발급하고 해당 build를 검증했다.
- [ ] AdSense에 사용할, 운영자가 제어하는 등록 가능 루트 도메인을 확보했다. (`pixelfit.o-r.kr`은 PSL 플랫폼 하위 도메인이 아닌 일반 하위 도메인이고 상위 `o-r.kr/ads.txt` 제어권이 없어 현재 차단)
- [ ] 등록 가능 루트 도메인에서 AdSense/CMP/`ads.txt` 운영 준비를 실제 계정과 공개 응답으로 완료했다.

GitHub Actions Pages가 저장소 `CNAME`만으로 Pages Settings나 인증서 발급을 완료한다고 가정하지 않는다. DNS/TLS, Search Console, Naver, AdSense와 CMP는 로컬 코드 검사로 완료 처리할 수 없다. Search Console은 공개 HTTPS가 유효해진 뒤, AdSense는 등록 가능 루트 도메인을 확보한 뒤 진행한다.

## C. v2 로컬 RC 기록 — 공개 승인 기록 아님

| 항목 | 값 |
| --- | --- |
| release candidate | `pixelfit-v2-local-rc-20260723` |
| commit/build identifier | `WORKTREE_ONLY` — v2 commit 없음 |
| 검사 일시 | 2026-07-23 03:05~03:41 KST |
| 검사 환경 | macOS, Node.js 24.14.1, pnpm 11.9.0, Playwright 1.61.1 Chromium/WebKit, Lighthouse 13.4.1 |
| GitHub Actions | `NOT_TESTED` |
| 공개 URL v2 확인 | `NOT_TESTED` |
| 최종 판정 | 로컬 RC `PASS`; 커밋·GitHub CI·공개 release는 보류 |
| 승인자 | 해당 없음 — 외부 출시 승인 전 |

최종 후보 commit, GitHub Actions run과 공개 v2 smoke가 모이면 별도의 공개 승인 기록을 작성한다.
