# 픽셀핏 출시 체크리스트

기준일: 2026-07-26

표기 규칙:

- `[x]`: 해당 버전과 산출물에서 실행 증거가 있는 완료 항목
- `[ ]`: 미실행, 미완료 또는 현재 후보에 연결할 증거가 없는 항목
- 실행할 수 없으면 지우지 않고 [STATUS.md](./STATUS.md)에 `NOT_TESTED`와 이유를 기록

과거 공개 v1, 현재 공개 v2와 아직 배포하지 않은 작업 트리를 합치지 않는다. 다른 버전의 `PASS`를 복사해 현재 후보 체크박스를 채우는 것은 금지한다.

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

## B. P7 로컬 보강 후보 — 공개 v2 기준과 분리

`d054e7c`까지의 13개 도구·8개 가이드 공개 v2는 아래 C절의 GitHub Actions·Pages·실제 URL 증거가 있다. 2026-07-26 P7 작업 트리는 운영자 정체성, 자체 샘플, 홈 탐색, 모바일 헤더, 한국어 OG, Web Share, Worker, 접근성 및 구조화 데이터 회귀 검사를 추가로 보강한 로컬 후보이며 아직 commit·push·배포하지 않았다. 최종 `pnpm check`, `pnpm build:custom:test`와 custom build는 통과했지만 로컬 `WORKTREE_ONLY` 검사이므로 공개 상태와 현재 로컬 검사 결과를 각각 표시한다.

### 제품·route 계약

- [x] 공개 v2 Registry의 13개 도구와 8개 가이드가 `d054e7c`에 고정됐다.
- [ ] 2026-07-26 로컬 보강 후보를 최종 commit과 hosted CI에 고정했다.
- [x] 홈, 모든 도구·가이드, about/privacy/terms/contact와 404가 두 build mode에서 정적으로 생성된다.
- [x] 모든 도구가 로컬 파일 선택부터 실제 다운로드까지 완료된다.
- [x] 핵심 경로에 mock 결과, 작동하지 않는 버튼, 숨겨진 demo가 없다.
- [x] 사용자 노출 문구와 `lang="ko"`가 확인됐다.
- [x] 공식값, 관행값과 서비스 기본값 badge·문구가 [PRESET_SOURCES.md](./PRESET_SOURCES.md)와 일치한다.
- [x] 운영자 `DUBEEUBBEE`와 실제 Gmail 문의 주소가 About·Contact·footer 및 구조화 데이터에서 일치한다.
- [x] 홈은 정확히 6개 용도 카테고리와 출처·용도 badge taxonomy를 사용하며, 각 도구 hero에는 정확히 2개의 근거 fact가 있다.
- [x] 콘텐츠의 `contentPublishedAt`·`contentUpdatedAt`과 출처의 `lastVerifiedAt` 계약을 분리하고, 수정일이 발행일보다 빠른 값을 거부한다.
- [x] 홈 검색은 여러 검색어를 AND로 결합하고, 카테고리 6개·빠른 검색·JavaScript OFF 전체 도구 링크를 제공한다.
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
- [x] 최종 custom 산출물의 `CNAME=pixelfit.me`, 실제 publisher와 일치하는 root `ads.txt`, account meta 30 HTML을 확인했고 광고 OFF에서 loader·`adsbygoogle`·slot runtime marker는 0이다.
- [x] 홈 콘텐츠 구분, 가이드 콘텐츠 구분, 도구 설명 끝 외 placement가 차단된다.
- [x] upload/editor/preview/result/download/navigation/privacy/terms/contact에 광고가 없다.
- [ ] 광고 ON staging에서 개인정보 고지, CMP·동의·철회와 외부 request를 검증했다.
- [x] 실제 publisher ID의 루트 `ads.txt`를 공개하고 AdSense 소유권 확인을 완료했다.
- [x] AdSense 사이트 검토를 요청하고 실제 계정 상태가 `준비 중`임을 확인했다.
- [ ] AdSense 사이트가 최종 승인돼 광고 제공 가능한 상태인지 확인했다.

### 같은 사진·개인정보

- [x] 사용자의 명시적 CTA에서만 같은 `File`이 현재 탭 메모리로 전달된다.
- [x] 대상 ID 제한, one-shot claim과 새로고침 소멸을 검증했다.
- [x] localStorage/sessionStorage/IndexedDB/Cache Storage에 사용자 이미지가 없다.
- [x] QA helper가 적용된 E2E 흐름에서 외부 HTTP(S) 요청과 POST/PUT/PATCH/DELETE가 0이다.
- [x] 기본 fixture 표식과 테스트가 명시 등록한 일부 파일명이 request URL/body 및 모든 console message에 없음을 확인했다.
- [ ] 모든 파일명·EXIF 값·얼굴 bbox와 13개 도구 전체에 대한 동일한 민감값 유출 검증 — 현재 `NOT_TESTED`; 추가 값은 `protectOutgoingValues`에 명시 등록한 뒤 별도로 검증
- [x] 파일 교체·초기화·route 이동에서 Object URL과 이전 결과 참조가 해제된다.
- [x] Web Share는 네컷사진·필름사진 결과와 native file-share 가능 환경에서만 노출되고, 미지원·취소·실패 시 다운로드 경로를 유지한다.
- [x] C2PA/JUMBF/Content Credentials 제거 옵션과 우회 안내가 없다.
- [x] 개인정보 페이지가 광고/CMP 네트워크와 로컬 이미지 처리 경계를 구분한다.

### SEO·콘텐츠

- [x] 홈·13개 도구·8개 가이드에 고유 title, description, canonical과 OG/Twitter metadata가 있다.
- [x] 자체 OG PNG 23개가 모두 1200×630이며, P7에서 홈과 13개 도구 이미지를 한국어 제목으로 결정적으로 재생성했다.
- [x] 외부 사진이나 얼굴을 쓰지 않은 자체 제작 본 샘플 22개(full PNG 4개·SVG 18개)를 5개 도구에 제공하고, 압축용 480×320 PNG 썸네일 4개와 함께 생성기·byte-for-byte 검증기로 재현한다.
- [x] 압축 full PNG 4개의 actual bytes는 `1,045,528` / `279,843` / `110,060` / `34,154`이며 stat·manifest와 일치한다. 100KB fixture만 900×600이고, UI는 같은 사용자 원본의 실제 압축 결과가 아닌 결정적 비교 fixture라고 명시한다.
- [x] sample 요청은 gallery viewport 진입 전 0개이고 이후 현재 route의 자산만 요청한다. 압축 route는 썸네일 4개만 먼저 받고 full PNG는 사용자의 원본 보기 클릭 뒤에만 요청한다.
- [x] 홈 `WebSite`/일반 `WebApplication`, 도구 `BreadcrumbList`/일반 `WebApplication`, 가이드 허브 `ItemList`, 가이드 상세 `BreadcrumbList`/`Article`을 사용한다.
- [x] About의 `Organization`과 가이드의 `Article` author/publisher가 화면의 운영자명·문의 주소와 일치한다.
- [x] 일반 `WebApplication`에 실제 URL·설명·이미지·수정일만 쓰며 근거 없는 `offers`/`review`/`aggregateRating`과 `SoftwareApplication`은 없다.
- [x] visible FAQ는 존재하지만 `FAQPage` JSON-LD는 0개다.
- [x] 가짜 review, rating, 사용량, 촬영일, 작성·수정 metadata가 없다.
- [x] sitemap, robots, 404, 직접 URL·새로고침이 두 export 계약과 공개 custom root에서 동작한다.

### 자동 검사

- [x] `pnpm install --frozen-lockfile`
- [x] `pnpm generate:assets`
- [x] `pnpm verify:assets`
- [x] `pnpm lint`
- [x] `pnpm typecheck`
- [x] `pnpm test` — P7 unit/component 49 files, 206/206 통과
- [x] production custom-root `pnpm build:custom` — 최신 verifier 618 checks
- [x] project Pages mode `pnpm build:pages` — 최종 `pnpm check`에서 verifier 617 checks
- [x] custom-domain test-root `pnpm build:custom:test` — verifier 618 checks
- [x] `pnpm check` — lint, typecheck, 49 files·206/206, Pages/custom verifier 617/618 checks
- [x] `pnpm test:e2e` — 48 통과, 의도된 capability skip 2개
- [x] `pnpm test:a11y` — axe 시나리오 4/4 통과
- [x] 처리되지 않은 pageerror와 예상 밖 console error·warning 0
- [x] 공개 v2 `d054e7c`의 GitHub-hosted CI 전체 통과
- [ ] 2026-07-26 로컬 보강 후보의 GitHub-hosted CI 실행

### 접근성·시각 QA

- [x] axe critical/serious violation 0
- [x] 키보드만으로 대표 도구의 파일 선택·편집·결과 생성 상태까지 완료
- [x] focus, label, slider value, `aria-live`, `aria-busy`와 색상 외 상태 표시
- [x] crop·안전영역·원형 preview의 텍스트 대안
- [x] desktop/mobile header와 mobile menu의 열기·닫기·focus·`aria` 상태를 확인했다.
- [x] compact home hero와 검색 결과가 390×844 및 320px 화면에서 겹치거나 잘리지 않는다.
- [x] `output/playwright/p7-final/`의 desktop gallery 5개, 정확한 390×844 홈, 390×844 viewport 네컷, 320×568 viewport gallery 5개를 직접 열어 전체 자체 제작 예시 22개를 검토
- [x] About·Contact·가이드 desktop, 열린 390×844 모바일 메뉴, 실제 압축 결과의 다음 도구 CTA를 추가 캡처하고 직접 열어 검토 — P7 최종 수동 증거 17개
- [ ] 200% zoom, reduced motion, 긴 한국어와 mobile touch target
- [x] WebKit smoke
- [ ] 실기기 Safari smoke

### 성능

- [x] 홈에서 무거운 편집 코드·모델·광고가 불필요하게 선로드되지 않는다.
- [ ] 대형 입력에서 취소·새 작업과 메모리 회복을 검사했다.
- [x] Lighthouse 13.0.1 `output/lighthouse/p7-final-*.json`으로 대표 6개 route의 mobile·desktop 원본 report 12개를 보관했다.
- [x] mobile Performance 98~99, desktop Performance 100, 12개 모두 Accessibility·Best Practices·SEO 100과 CLS 0을 확인했다.
- [x] Performance ≥90, Accessibility/Best Practices/SEO ≥95, CLS <0.1 목표를 검토했다.

### 이중 build와 공개 배포

- [x] `/pixelfit`과 custom-domain root build의 검사 결과를 분리해 기록했다.
- [x] 두 build에서 13개 도구·8개 가이드·asset·404·URL 계약을 자동 검증했다.
- [x] 공개 v2 final commit과 GitHub Actions run ID를 기록했다.
- [x] GitHub Pages workflow 성공과 공개 URL의 v2 fingerprint를 확인했다.
- [x] 공개 URL의 HTTPS, OG MIME, 직접 route와 404 응답을 확인했다.
- [x] 기존 GitHub Pages URL이 루트와 중첩 경로·query를 보존해 현재 production host로 redirect하는 공개 동작을 확인했다.
- [ ] 2026-07-26 로컬 보강 후보를 commit·Pages에 배포하고 공개 fingerprint를 다시 확인했다.
- [x] 알려진 제한이 UI, README, STATUS와 일치한다.

### 외부 운영 작업

- [x] 이전 production host `pixelfit.o-r.kr`의 DNS·HTTPS·Search Console·sitemap 결과를 기록했다.
- [x] `pixelfit.me` 등록과 운영자 소유권을 registrar 계정에서 확인했다.
- [x] repository variable과 Pages custom-domain 설정을 `pixelfit.me`로 일치시켰다.
- [x] `pixelfit.me` apex DNS와 `www` 레코드를 적용하고, 공개 전파 전에 해당 hostname을 `DUBEEUBBEE/pixelfit` Pages에 선점했다.
- [x] `pixelfit.me` apex/`www`에 유효한 HTTPS 인증서가 발급되고 HTTP→HTTPS가 정상 적용됐다.
- [ ] production domain의 registrar 자동 갱신을 ON으로 바꾸고 결제수단을 직접 확인했다. 마지막 확인 상태는 auto-renew OFF다.
- [ ] 운영자 Gmail 계정의 2단계 인증이 ON인지 직접 확인했다.
- [x] 새 Google Search Console URL-prefix 속성에 실제 HTML token을 적용하고 소유권을 확인했다.
- [x] `https://pixelfit.me/sitemap.xml`을 제출하고 처리 성공·27페이지 발견을 기록했다.
- [ ] Naver Search Advisor를 사용한다면 token을 발급하고 해당 build를 검증했다.
- [x] `pixelfit.me`를 AdSense 사이트에 추가하고 공개 `ads.txt` 소유권 확인·검토 요청을 완료했다.
- [ ] CMP, AdSense 최종 승인과 실제 광고 제공을 검증했다.
- [ ] 이전 `pixelfit.o-r.kr`을 계속 제공할 경우 별도 redirect endpoint에서 새 canonical로 이동하는 동작을 확인했다.

GitHub Actions Pages가 저장소 `CNAME`만으로 Pages Settings나 인증서 발급을 완료한다고 가정하지 않는다. DNS/TLS, Search Console과 AdSense의 완료 표시는 실제 공개 응답·계정 확인에 근거한다. Naver, CMP, AdSense 최종 승인과 광고 제공은 완료하지 않았다.

## C. 공개 v2 승인 기록

| 항목 | 값 |
| --- | --- |
| release source | `d054e7c` |
| GitHub CI run | `30163705772` — 성공 |
| GitHub Pages run | `30163705771` — 성공 |
| Pages deployment | `5602429825` — 성공 |
| 공개 URL | `https://pixelfit.me/` |
| 공개 확인 | apex/`www` TLS·redirect, 27 sitemap route, 23 OG PNG, robots·sitemap·ads.txt·404 |
| 검색 상태 | Search Console URL-prefix 소유권·sitemap 처리 성공 |
| 광고 상태 | `ads.txt` 소유권·검토 요청 완료, 계정 `준비 중`, loader·slot OFF |

## D. v2 로컬 RC 기록 — 공개 승인 전 역사적 기록

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
