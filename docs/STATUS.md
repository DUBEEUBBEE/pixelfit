# 픽셀핏 상태

스냅샷: 2026-07-30 KST

이 문서는 공개 v1, 로컬 v2 RC, 공개 v2를 분리하고 실행한 검사만 `PASS`로 기록한다. 실기기 Safari처럼 실행하지 않은 항목은 `NOT_TESTED`로 남긴다.

## 인스타그램 프로필 사진 릴리스 — 2026-07-30, `DEPLOYED`

공개 v2와 아래 P7 기록 위에 14번째 도구 `/instagram-profile-picture`를 추가했다. 1080×1080은 Instagram의 공식 의무 픽셀값이 아니라 픽셀핏 서비스 출력값이다. 사진을 정사각형으로 cover-crop하지 않고 작은 원 안에 contain 배치하며, 원 크기·사진 크기와 위치·테두리 두께·테두리/원 안/바깥 캔버스 색을 조절할 수 있다. 결과는 PNG 또는 JPEG로 만들고 형식과 1080×1080 크기를 다시 확인한다.

| 검사 | 현재 후보 결과 |
| --- | --- |
| 규격·출처 조사 | `PASS` — 공식 Meta 도움말에서 Instagram 전용 의무 업로드 픽셀값을 확인하지 못해 1080×1080을 `convention` 서비스값으로 표시 |
| 구현 | `PASS` — Registry, editor/preview, 공통 layout, Canvas renderer, PNG/JPEG 결과 검증, 결정적 파일명, 전용 OG와 SEO 콘텐츠 추가 |
| `pnpm lint` | `PASS` — warning 0 |
| `pnpm typecheck` | `PASS` — TypeScript strict, 종료 코드 0 |
| 단위·컴포넌트 테스트 | `PASS` — 50 files, 210/210 |
| `pnpm verify:assets` | `PASS` — sample 22개·압축 썸네일 4개와 OG 15개 생성분의 byte-for-byte 결정성 확인; 가이드 OG를 포함한 전체 정적 OG는 24개 |
| `pnpm check` | `PASS` — lint·typecheck·210/210, 32 static pages, Pages verifier 637 checks, custom verifier 638 checks, sitemap 28 URLs, OG 24 files |
| `pnpm test:e2e` | `PASS` — 52 cases 중 desktop/mobile 50 passed, 중복 viewport 순회를 생략하는 의도된 mobile cases 2 skipped |
| 인스타그램 도구 Playwright | `PASS` — Chromium·iPhone 13 WebKit 각각 파일 선택→라벤더 테마·키보드 slider 조정→1080×1080 PNG 생성·다운로드 검증, 2/2 |
| 접근성 | `PASS` — desktop/mobile의 홈·14개 도구 초기 상태와 기존 대표 편집·결과 상태, axe serious/critical 0, 4/4. 인스타그램 도구의 결과 화면은 전용 키보드 E2E와 수동 QA로 별도 확인 |
| 수동 desktop/mobile 브라우저 QA | `PASS` — 1440×1000과 390×844에서 편집·결과 화면을 직접 확인. `output/playwright/instagram-profile/` PNG 3개, console error 0·warning 0 |
| commit·push | `PASS` — 기능 commit `d885ea8`, CI 안정화 commit `e854551`을 `codex/pixelfit-v2-seo-adsense`와 `main`에 fast-forward push |
| GitHub-hosted CI | `PASS` — 최초 run `30537704253`은 Ubuntu에서 OG 생성기 검사가 Vitest 기본 5초를 1.027초 초과해 실패했다. 검사 timeout을 15초로 명시한 뒤 run `30537929028`의 전체 CI가 성공 |
| GitHub Pages | `PASS` — run `30537929087` 배포 성공 |
| 공개 URL smoke | `PASS` — `https://pixelfit.me/instagram-profile-picture/` HTTP 200, canonical·OG·H1·업로드 버튼·파일 형식·sitemap 28 URL을 확인. 실제 in-app browser에서 console error/warning 0, 가로 overflow 없음, AdSense loader 0 |

알려진 build 경고는 기존 Worker chunk 간 circular-dependency 경고 두 건이며 정적 export와 위 브라우저 검증은 통과했다. 실기기 Instagram 앱 업로드, 앱 자체 리샘플링·원형 마스크와 실기기 Safari는 실행하지 않았으므로 `NOT_TESTED`다.

## P7 사용자 신뢰·탐색·콘텐츠 후보 — 2026-07-26, `WORKTREE_ONLY`

P7 작업 시작일은 2026-07-26이며 정확한 시작 시각은 기록하지 않았다. 이 절은 아래 P6 후보를 기준선으로 삼은 현재 로컬 작업 트리만 설명한다. 공개 이메일 `wodnd0823@gmail.com`과 운영자 표시명 `DUBEEUBBEE`를 환경 기본값과 공통 Organization 데이터에 반영하고, 소개·문의·개인정보·약관·Footer·가이드 작성자/발행자 정보를 실제 운영 주체에 맞췄다. 일반 문의, 기능 오류, 규격 오류, 개인정보 문의를 구분했으며 이메일이나 공개 GitHub Issue에 얼굴·신분증 원본을 첨부하지 않도록 경고한다.

### P7 변경 전 P6 기준선

| 기준선 | 확인된 결과 |
| --- | --- |
| P6 로컬 후보 | `PASS` — Vitest 42 files·144/144, Pages/custom verifier 524/525 checks, E2E 45 passed·1 intended skip, axe 4/4 |
| 공개·외부 상태 | P7 시작 전부터 `pixelfit.me` DNS·TLS·Search Console·sitemap·AdSense `ads.txt` 확인과 검토 요청은 완료됐고, AdSense는 `준비 중`, CMP·광고 제공은 OFF |

- 사진 용량 줄이기·YouTube 썸네일·네컷사진·필름사진·여권사진에 외부 사진이 아닌 자체 제작 본 예시 22개를 추가했다. 본 예시는 full PNG 4개와 SVG 18개이며 압축 갤러리 전용 480×320 PNG 썸네일 4개를 별도로 생성한다. 압축 full PNG의 actual bytes는 `1,045,528` / `279,843` / `110,060` / `34,154`이고 100KB fixture만 900×600이다. 이 파일은 같은 사용자 원본의 실제 압축 결과가 아니라 색 단계와 세부 묘사를 달리 만든 결정적 비교 fixture이며 UI도 그렇게 설명한다.
- sample gallery가 viewport에 들어오기 전 네트워크 요청은 0개다. 진입 뒤에는 현재 route의 자산만 요청하며, 압축 route는 480×320 썸네일만 먼저 받고 큰 full PNG는 `원본 크기로 보기` 클릭 뒤에만 요청한다.
- 홈의 정확한 제목은 `용도를 고르고` / `사진만 올리세요.` 두 줄이다. 자주 쓰는 도구 4개, 새 검색어와 빠른 칩, 카테고리 선택 목록, 검색 결과 0개 대체 링크와 닫힌 전체 13개 목록을 제공한다. 전체 도구는 실제 링크로 서버 HTML에 남고 JavaScript가 꺼져도 기본 `details`를 펼쳐 이동할 수 있다.
- 모바일 헤더는 `픽셀핏 | 도구 | 가이드 | 메뉴`로 줄이고, 메뉴 안에 소개·문의·개인정보·이용약관·GitHub를 배치했다. `aria-expanded`·`aria-controls`, Escape·바깥 클릭·링크 선택 닫기와 320px 가로 overflow 방지를 확인했다. 데스크톱의 기존 네 링크는 유지한다.
- 도구 배지는 공식 규격·공식 권장값·일반 사진 크기·일반 이미지 도구·서비스 권장 크기·웹·개인정보·창작 효과로 세분화했다. 도구와 가이드는 게시일을 보존하면서 실제 문구를 수정한 페이지의 수정일을 독립적으로 `2026-07-26`으로 기록했고, 가이드의 Blob·payload·parse·magic bytes·container·signature 같은 구현 표현을 사진·파일·형식·용량 중심 문장으로 바꿨다.
- 23개 OG 이미지는 한국어 제목 중심의 1200×630 PNG로 다시 만들었다. `NextToolActions`는 같은 사진을 사용자가 누를 때만 현재 탭 메모리로 한 번 전달하고, 네컷·필름 결과는 브라우저가 파일 공유를 지원할 때만 Web Share 버튼을 표시한다. 공유 취소는 오류로 만들지 않고 실패 시 다운로드를 안내한다.
- 초기 브라우저 기준선에서는 정적 preview가 Next Link의 RSC prefetch 요청을 정상 RSC 응답으로 제공하지 못해 console/page-error 가드가 실패했다. 정적 export 내부 링크에 `prefetch={false}`를 적용해 불필요한 RSC 사전 요청을 제거한 뒤 최종 가드에서 예상 밖 console error·warning과 pageerror가 모두 0임을 확인했다.

| 검사 | P7 현재 후보 결과 |
| --- | --- |
| `pnpm install --frozen-lockfile` | `PASS` — pnpm 11.9.0, lockfile 변경 없음 |
| `pnpm generate:assets` | `PASS` — 본 sample 22개, 압축 PNG thumbnail 4개와 OG 23개 생성 |
| `pnpm verify:assets` | `PASS` — sample/thumbnail/OG 결정성·선언·물리 파일 집합 확인 |
| `pnpm lint` | `PASS` — warning 0 |
| `pnpm typecheck` | `PASS` — TypeScript strict, 종료 코드 0 |
| `pnpm test` | `PASS` — 49 files, 206/206 |
| `pnpm build:custom` (`pnpm build` alias) | `PASS` — 최신 `pixelfit.me` root 후보 verifier 618 checks, sitemap 27 URLs, OG 23 files |
| `pnpm build:pages` | `PASS` — 최종 `pnpm check`에서 verifier 617 checks, sitemap 27 URLs, OG 23 files |
| `pnpm build:custom:test` | `PASS` — test root 후보 verifier 618 checks |
| `pnpm check` | `PASS` — lint, typecheck, 49 files·206/206, Pages/custom verifier 617/618 checks |
| `pnpm test:e2e` | `PASS` — 50 cases 중 48 passed, 대표 viewport·JavaScript-off 검사를 중복하지 않는 의도된 mobile-project cases 2 skipped |
| `pnpm test:a11y` | `PASS` — 4/4, axe serious/critical 0 |
| 브라우저 QA 가드 | `PASS` — QA helper가 적용된 E2E 흐름에서 예상 밖 console error 0, warning 0, pageerror 0, 외부 HTTP(S) 요청 0, POST/PUT/PATCH/DELETE 0. 기본 fixture 표식과 테스트가 명시 등록한 일부 파일명이 request URL/body 및 모든 console message에 없음을 확인 |
| 수동 Playwright 화면 | `PASS` — `output/playwright/p7-final/`의 17개 파일을 직접 열어 확인. desktop gallery 5개와 320×568 gallery 5개에서 전체 자체 제작 예시 22개를 확인했고, 정확한 `home-390x844.png`, 390×844 viewport의 `four-cut-390x844.png`, About·Contact·가이드 desktop, 열린 390×844 모바일 메뉴, 실제 압축 결과의 다음 도구 CTA를 추가 확인했다. 추가 상호작용 세션의 console error·warning은 0 |
| 샘플 자산 | `PASS` — 자체 제작 본 예시 22개(full PNG 4개·SVG 18개)와 압축 전용 480×320 PNG thumbnail 4개, 선언·물리 파일 집합 일치, 고아 파일 0개, 결정적 묶음 SHA-256 앞 16자리 `061e0431696e4a31` |
| OG 자산 | `PASS` — 한국어 중심 PNG 23개, 결정적 묶음 SHA-256 앞 16자리 `acc03a7c93bf3d5b` |
| 최종 custom AdSense/account artifact | `PASS` — `CNAME=pixelfit.me`, 실제 publisher와 일치하는 root `ads.txt`, account meta 30 HTML, 광고 OFF의 loader·`adsbygoogle`·slot runtime marker 0 |
| hosted CI·P7 공개 fingerprint | `NOT_TESTED` — 현재 로컬 후보를 commit·push·deploy하지 않음 |
| 외부 계정 | `UNCHANGED` — Search Console 소유권·sitemap을 다시 만지지 않았고 AdSense 검토 상태·광고 OFF 설정도 변경하지 않음 |
| 실기기 Safari | `NOT_TESTED` — 자동 브라우저 검사는 통과했지만 실제 기기 수동 검사는 실행하지 않음 |

### Lighthouse 13.0.1 — P7 production static preview

| 경로 | Mobile Performance | Mobile LCP | Mobile TBT | Desktop Performance | A11y / BP / SEO | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 99 | 2,055ms | 48ms | 100 | 100 / 100 / 100 | 0.000 |
| `/about/` | 99 | 2,064ms | 53ms | 100 | 100 / 100 / 100 | 0.000 |
| `/image-compressor/` | 98 | 2,347ms | 38ms | 100 | 100 / 100 / 100 | 0.000 |
| `/passport-photo/` | 98 | 2,353ms | 42ms | 100 | 100 / 100 / 100 | 0.000 |
| `/youtube-thumbnail/` | 98 | 2,373ms | 55ms | 100 | 100 / 100 / 100 | 0.000 |
| `/four-cut-photo/` | 98 | 2,361ms | 54ms | 100 | 100 / 100 / 100 | 0.000 |

데스크톱 여섯 경로는 Performance 100, LCP 475~519ms, TBT 0ms이며 모바일·데스크톱 12개 모두 Accessibility·Best Practices·SEO 100, CLS 0이다. 원본 JSON은 `output/lighthouse/p7-final-*.json` 12개다. 점수는 로컬 실행 환경과 측정 시점에 따라 달라질 수 있다.

### 공개본 읽기 전용 확인 — P7 배포와 분리

기존 공개본에 대해서만 apex HTTPS `200`, HTTP→HTTPS `301`, `www`의 경로를 보존한 HTTPS apex `301`, 임의 경로 `404`를 읽기 전용으로 확인했다. 이는 현재 P7 작업 트리의 공개 검증이 아니며, 로컬 후보는 배포되지 않았다. Search Console 소유권·sitemap 제출과 AdSense 사이트 검토 상태는 확인·변경 절차를 다시 실행하지 않았고 광고 제공은 계속 OFF다.

### 운영자가 직접 확인할 항목

- `pixelfit.me` 도메인 자동 갱신을 ON으로 바꾸고 결제수단을 확인한다. 마지막 확인 상태는 auto-renew OFF다.
- `wodnd0823@gmail.com` 계정의 2단계 인증이 ON인지 확인한다.
- AdSense 상태가 `준비됨`이 될 때까지 광고 제공을 켜지 않는다.
- 승인 뒤에만 CMP와 동의 흐름을 구성하고, 허용된 광고 위치를 데스크톱·모바일에서 다시 검토한다.

## P6 로컬 보강 후보 — 2026-07-26, `WORKTREE_ONLY`

이 절은 공개 `d054e7c` 뒤의 로컬 작업 트리만 설명한다. 입력 파일 헤더와 픽셀 수를 decode 전에 제한하고, 모든 생성 결과를 다시 파싱하며, SNS 세트·YouTube 썸네일에 Worker 경로를 추가했다. 13개 도구 접근성 범위, 같은 사진 메모리 전달, canonical·OG·JSON-LD URL 일치와 근거 없는 구조화 데이터 차단도 함께 강화했다. 커밋·푸시·배포, Search Console·AdSense·DNS 변경은 수행하지 않았다.

| 검사 | 현재 후보 결과 |
| --- | --- |
| `pnpm lint` | `PASS` — warning 0 |
| `pnpm typecheck` | `PASS` — TypeScript strict, 보존 중인 사용자 `* 2.*` 파일을 포함해 종료 코드 0 |
| `pnpm test` | `PASS` — 42 files, 144/144 |
| `pnpm build:pages` | `PASS` — 31 static pages, verifier 524 checks, sitemap 27 URLs, OG 23 files |
| `pnpm build` | `PASS` — `pixelfit.me` root 후보 31 pages, verifier 525 checks, sitemap 27 URLs, OG 23 files |
| `pnpm build:custom:test` | `PASS` — 고정 테스트 host root 후보 31 pages, verifier 525 checks |
| `pnpm test:e2e` | `PASS` — 46 cases 중 45 passed, 동일 viewport 순회를 중복 실행하지 않는 의도된 mobile-project case 1 skipped |
| `pnpm test:a11y` | `PASS` — 4/4, 13개 도구 초기 상태와 리사이저·변환기 결과 상태의 axe serious/critical 0 |
| 개인정보 네트워크 가드 | `PASS` — 처리되지 않은 page error, POST/PUT/PATCH/DELETE, 외부 HTTP(S) host, fixture 표식·파일명 유출 0 |
| 수동 Playwright 화면 | `PASS` — 1440×900, 768×1024, 390×844, 320×568에서 제목 두 줄·가로 overflow 0, 썸네일 편집/결과와 console error 0 |
| 공개 URL 읽기 전용 smoke | `PASS` — 기존 공개본의 apex HTTPS 200, HTTP→HTTPS 301, `www` 경로 보존 301, 임의 경로 404, robots·sitemap·ads.txt 200, sitemap 27개 고유 URL |
| hosted CI·공개 후보 fingerprint | `NOT_TESTED` — 로컬 보강 후보를 commit·push·deploy하지 않음 |
| 외부 계정 | `NOT_TESTED` — Search Console을 변경하지 않았고 AdSense는 기존 `준비 중`, CMP·광고 제공 OFF |
| 실기기 Safari | `NOT_TESTED` — Playwright WebKit 자동 검사는 통과했지만 실제 기기 수동 검사는 실행하지 않음 |

### Lighthouse 13.4.1 — production static preview

| 경로 | Mobile Performance | Desktop Performance | Accessibility | Best Practices | SEO | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 96 | 100 | 100 | 100 | 100 | 0.000 |
| `/passport-photo/` | 99 | 100 | 100 | 100 | 100 | 0.000 |
| `/image-compressor/` | 99 | 100 | 100 | 100 | 100 | 0.000 |
| `/youtube-thumbnail/` | 99 | 100 | 100 | 100 | 100 | 0.000 |
| `/four-cut-photo/` | 99 | 100 | 100 | 100 | 100 | 0.000 |

모바일·데스크톱 원본 JSON 10개는 `output/lighthouse/final-*-{mobile,desktop}.json`에 보관했다. 로컬 측정은 실행 환경에 따라 달라질 수 있다. Next.js webpack Worker runtime의 순환 chunk 경고는 남지만 build·기능·정적 산출물 검사는 통과했다.

## `pixelfit.me` canonical 전환·공개 등록 — 2026-07-25 16:25~16:55 KST, `www` 보정 2026-07-26

이 절은 새 registrable root의 소스·정적 export 계약, 실제 registrar·GitHub 배포, 공개 응답과 외부 계정 상태를 구분해 기록한다. 검토 대기나 아직 강제되지 않은 HTTPS를 완료로 확대하지 않는다.

- 기본 `pnpm build`와 Pages workflow의 빈 변수 fallback을 `pixelfit.me` HTTPS root canonical·빈 base path로 변경했다.
- Namecheap 계정에서 `pixelfit.me` 등록·소유권과 2027-07-25 만료를 확인했다. 도메인 자동 갱신은 OFF, 개인정보 보호는 ON이다.
- NC.me가 만든 GitHub Pages apex A 레코드 4개를 유지했다. 2026-07-26 Namecheap BasicDNS에서 잘못된 `www → pixelfit.me` CNAME만 `www → dubeeubbee.github.io`로 수정했고, 권한 NS·Google·Cloudflare·Quad9·로컬 resolver의 전파를 확인했다.
- NC.me OAuth가 처음에는 `DUBEEUBBEE.github.io` 루트 Pages에 새 도메인을 잘못 연결했다. 해당 연결을 제거하고 `DUBEEUBBEE/pixelfit` Pages에 `pixelfit.me`를 저장했다.
- repository variable `NEXT_PUBLIC_CUSTOM_DOMAIN=pixelfit.me`를 생성했고 새 URL-prefix 속성이 발급한 Google verification 값으로 인증 변수를 갱신했다. 충돌하는 `CUSTOM_DOMAIN` 변수는 없었다.
- 실제 AdSense 계정의 `NEXT_PUBLIC_ADSENSE_CLIENT`도 repository variable로 추가했다. 이는 account meta와 root `ads.txt`만 만들며, enabled·slot 변수는 두지 않아 광고 loader와 slot은 계속 OFF다.
- 최종 공개 기록 `d054e7c`의 hosted CI `30163705772`, Pages `30163705771`과 deployment `5602429825`가 성공했다. 이전 도메인·Google 인증 반영 run도 성공 기록으로 보존한다.
- 공개 apex는 GitHub Pages A 레코드 4개로 해석되고 유효한 `pixelfit.me` 인증서로 HTTPS `200`을 반환한다. Pages 인증서 승인 후 `https_enforced=true`로 전환했고 HTTP는 HTTPS로 `301` redirect한다.
- `www` CNAME 보정과 공개 DNS 전파를 완료했다. GitHub Pages 4개 IPv4 엣지 모두 `pixelfit.me`과 `www.pixelfit.me`을 포함한 인증서를 제공하며, `www`의 HTTP·strict HTTPS 요청은 모두 `https://pixelfit.me/`로 `301` redirect한다.
- Search Console URL-prefix `https://pixelfit.me/` 소유권을 HTML meta로 확인했다. `/sitemap.xml`은 상태 `성공`, 발견된 페이지 27개다.
- AdSense에서 `pixelfit.me`를 추가하고 공개 root `ads.txt`로 사이트를 확인한 뒤 검토를 요청했다. 계정 상태는 `준비 중`이며 승인이나 광고 게재 완료가 아니다.
- 기존 `pixelfit.o-r.kr` 공개·HTTPS·Search Console 기록은 아래에 보존한다. 한 Pages site의 단일 custom-domain 제한 때문에 이전 주소를 계속 제공하려면 별도 redirect endpoint가 필요하다.

| 확인 | 현재 결과 |
| --- | --- |
| `pnpm check` | `PASS` — lint warning 0, typecheck 성공, Vitest 40 files·132/132, Pages verifier 409 checks, `pixelfit.me` custom verifier 410 checks |
| 정적 route·SEO asset | `PASS` — 두 build 모두 31 static pages, sitemap 27 URLs, OG 23 files |
| custom export host | `PASS` — `out/CNAME=pixelfit.me`, 홈 canonical `https://pixelfit.me/`, robots sitemap `https://pixelfit.me/sitemap.xml` |
| custom export 누출 검사 | `PASS` — `pixelfit.o-r.kr` 0 files, `/pixelfit` custom-root URL/asset pattern 0 files |
| 광고 OFF | `PASS` — custom export의 `pagead2.googlesyndication.com`/`adsbygoogle` 0 files |
| 대표 Playwright smoke | `PASS` — Chromium/mobile에서 도구 탐색·8개 가이드·정보/404 정적 경로 6/6 |
| 도메인 등록·registrar 설정 | `PASS` — Namecheap ACTIVE, apex A 4개 유지, `www → dubeeubbee.github.io` CNAME 저장·전파, auto-renew OFF, privacy ON |
| GitHub repository variable·Pages domain | `PASS` — 변수와 Pages 모두 `pixelfit.me`, 잘못 연결된 루트 Pages에서는 제거 |
| AdSense 계정 확인 입력 | `PASS` — 실제 publisher client 설정, enabled·slot 미설정으로 광고 제공 OFF 유지 |
| GitHub push·Actions·새 artifact 배포 | `PASS` — `d054e7c`, CI `30163705772`, Pages `30163705771`, deployment `5602429825` 성공 |
| 공개 SEO·AdSense 파일 | `PASS` — 홈·`robots.txt`·`sitemap.xml`·`ads.txt` HTTPS `200`, canonical·두 계정 meta 일치, sitemap 27 URLs, 광고 loader 0 |
| 공개 apex DNS·TLS | `PASS` — GitHub Pages A 4개, SAN `pixelfit.me`의 유효한 Let's Encrypt 인증서, strict HTTPS `200` |
| HTTP→HTTPS 강제 | `PASS` — Pages 인증서 승인·`https_enforced=true`, HTTP→HTTPS `301` 확인 |
| `www` DNS·TLS | `PASS` — `www → dubeeubbee.github.io` 전파, 두 호스트 SAN 인증서, HTTP·strict HTTPS `www`→HTTPS apex `301` 확인 |
| 새 Search Console·sitemap | `PASS` — URL-prefix HTML 인증 완료, `/sitemap.xml` 처리 `성공`, 27페이지 발견 |
| AdSense 사이트 확인·검토 | `IN_PROGRESS` — `ads.txt` 소유권 확인과 리뷰 요청 완료, 계정 상태 `준비 중`; 광고 제공은 OFF |
| AdSense 승인·CMP·광고 제공 | `NOT_TESTED` — 계정 승인 전이며 CMP 미구성, enabled·slot 미설정 |

## 공개 v2 custom-domain SEO·AdSense 상태 — 2026-07-25

이 절은 아래 2026-07-23 로컬 RC·구현 기록보다 최신이며, `f7657dc`까지의 GitHub-hosted 배포와 공개 확인 결과를 기록한다.

- production custom host를 `pixelfit.o-r.kr`로 고정하고, 기본 `pnpm build`와 Pages workflow가 HTTPS root canonical·빈 base path 계약을 사용하도록 정리했다. `/pixelfit` mode는 회귀 검사용 `pnpm build:pages`에 남겼다.
- 홈 제목의 의도된 줄을 `용도를 고르고` / `사진만 올리세요.`로 고정했다.
- 구조화 데이터는 홈 `WebSite`, 가이드 허브 `ItemList`, 도구 `BreadcrumbList`, 가이드 상세 `BreadcrumbList`와 `Article`만 남겼다. 실제 price·review·rating 근거가 없는 `WebApplication`/`SoftwareApplication`과 rich-result 오인을 제거했다.
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`과 호환 `GOOGLE_SITE_VERIFICATION`으로 Search Console URL-prefix HTML 확인 meta를 만든다. 실제 토큰을 저장소 변수로 배포해 URL-prefix 소유권을 확인했고 sitemap 처리 결과도 별도로 확인했다.
- 유효한 실제 AdSense client가 있으면 광고 OFF 상태에서도 `google-adsense-account` meta와 custom-root `ads.txt`를 만들 수 있도록 계정 확인을 광고 제공 게이트와 분리했다. 광고 loader와 slot은 enabled/client/slot이 모두 유효한 경우에만 가능하며 production에서는 계속 OFF다.
- 개인정보 문서는 광고가 활성화될 경우의 제3자 cookie·web beacon·IP/식별자, Google 설정 링크와 CMP 전제 조건을 명시하도록 보강했다.

| 확인 | 현재 결과 |
| --- | --- |
| `pnpm lint && pnpm typecheck && pnpm test` | `PASS` — 40 files, 132/132 |
| `pnpm check` project/custom 전체 build | `PASS` — Pages verifier 409 checks, 실제 `pixelfit.o-r.kr` verifier 410 checks, sitemap 27 URLs, OG 23 files |
| `pnpm test:e2e` | `PASS` — 46 cases 중 45 passed, 대표 viewport를 한 Chromium context에서 순회하는 중복 mobile-project case 1 skipped |
| axe serious/critical | `PASS` — Chromium desktop/mobile의 홈·대표 도구·편집 결과에서 0 |
| 제목·모바일 메뉴 화면 | `PASS` — 1440·1024·390·320px에서 지정한 두 줄과 가로 overflow 0, 320px 수동 화면 캡처 확인 |
| GitHub-hosted CI·Pages | `PASS` — `f7657dc`의 CI `30121150418`과 Pages `30121150421` 성공 |
| AdSense 계정 확인 전용 test build | `PASS` — 광고 OFF에서 account meta·custom `ads.txt` 생성, loader·slot marker 0; 테스트 ID 제거 후 실제 OFF 산출물 복원 |
| `pixelfit.o-r.kr` DNS | `PASS` — GitHub Pages를 가리킴 |
| `pixelfit.o-r.kr` strict HTTPS | `PASS` — SAN에 `pixelfit.o-r.kr`이 포함된 Let's Encrypt 인증서, strict TLS 200, HTTP→HTTPS 301, Pages `https_enforced=true` |
| Search Console URL-prefix 소유권·sitemap | `PASS` — HTML meta로 `https://pixelfit.o-r.kr/` 소유권 확인, `/sitemap.xml` 처리 완료, 27페이지 발견 |
| AdSense 사이트 등록 | `BLOCKED` — 라이브 계정에서 `pixelfit.o-r.kr`을 저장하면 올바른 최상위 도메인이 아니라며 `o-r.kr`을 제안한다. 소유하지 않은 상위 도메인은 등록하지 않았고 사이트·광고 제공은 추가하지 않았다. |

Search Console 등록은 완료됐다. AdSense는 별개로 운영자가 제어하는 등록 가능 루트 도메인을 확보한 뒤 그 도메인의 DNS, HTTPS, Search Console, root `ads.txt`, AdSense review와 CMP를 다시 진행해야 한다. 현재 주소나 상위 `o-r.kr`의 소유권을 가장해 등록하지 않으며 광고는 계속 OFF다.

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
- 광고 ON staging, AdSense 최종 승인·CMP와 Naver 외부 등록은 검증하지 않았다. `pixelfit.me`의 공개 DNS·TLS·Search Console·sitemap·`ads.txt` 소유권·AdSense 검토 요청은 완료됐지만 계정은 `준비 중`이고 광고 제공은 OFF다.

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

다음 외부 갱신은 현재 로컬 보강 후보의 commit·GitHub-hosted CI/Pages·공개 fingerprint, 이전 주소 redirect, 실기기 Safari·저메모리 대형 이미지 회복력과 AdSense 승인/CMP 운영 검증을 기록한다.
