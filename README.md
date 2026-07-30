# 픽셀핏

용도를 고르고 사진을 올리면 브라우저 안에서 규격 맞춤, 압축, 변환과 창작 효과를 수행하는 한국어 정적 웹 앱이다. 사용자 이미지의 픽셀과 메타데이터는 이미지 처리 서버로 업로드하지 않는다.

## 현재 상태

| 구분 | 상태 | 의미 |
| --- | --- | --- |
| 공개 v1 | `PASS` 기록 보존 | 2026-07-22 `https://dubeeubbee.github.io/pixelfit/`에 배포한 기존 6개 도구 릴리스 |
| 2026-07-23 로컬 v2 RC | `PASS` 기록 보존 | 13개 도구·8개 가이드, 단위 131개·브라우저 44개·접근성 4개·이중 export·Lighthouse 로컬 검증 완료 |
| 2026-07-25 기존 custom domain | `PASS` 기록 보존 | `https://pixelfit.o-r.kr/`의 공개 배포·HTTPS·Search Console 확인 완료. AdSense 사이트 등록은 registrable root가 아니어서 차단 |
| `pixelfit.me` 공개 v2 | `PASS` | DNS·GitHub Pages·apex/`www` TLS·HTTPS 강제·Search Console 소유권·27 URL sitemap과 공개 정적 자산 확인 완료 |
| 2026-07-26 P6 로컬 보강 후보 | `PASS` — `WORKTREE_ONLY` | 단위 144개, 브라우저 45 passed·1 intended skip, 접근성 4개, 이중 export, 모바일·데스크톱 Lighthouse 10개 검증. 미배포 |
| 2026-07-26 P7 콘텐츠·신뢰·모바일 후보 | `PASS` — `WORKTREE_ONLY` | 단위 49 files·206/206, E2E 48 passed·2 intended skips, 접근성 4/4, `pnpm check`의 Pages/custom verifier 617/618 checks와 `build:custom:test` 618 checks, 자체 sample 22개·압축 썸네일 4개·OG 23개를 확인했다. 미배포다. |
| 2026-07-30 인스타그램 프로필 사진 릴리스 | `PASS` — `DEPLOYED` | 1080×1080 서비스 출력, 사진 전체를 작은 원 안에 맞추는 contain 배치와 색 테두리·안쪽 원·바깥 캔버스를 추가했다. 단위 50 files·210/210, Pages/custom verifier 637/638 checks, E2E 50 passed·2 intended skips, axe 4/4와 공개 브라우저 smoke를 통과했다. GitHub Actions CI·Pages 성공 후 `https://pixelfit.me/instagram-profile-picture/`에 배포했다. |
| AdSense 심사 | `IN_PROGRESS` | 루트 `ads.txt` 소유권 확인과 사이트 검토 요청 완료, 계정 표시는 `준비 중`; CMP·광고 제공은 계속 OFF |

공개 v1의 성공 기록은 v2 RC의 공개 배포 증거가 아니다. 명령별 실제 결과와 미실행 항목은 [현재 상태](./docs/STATUS.md), 출시 경계는 [출시 체크리스트](./docs/RELEASE_CHECKLIST.md)를 기준으로 확인한다.

## 도구 14개

### 기존 규격·개인정보 도구

| 도구 | 경로 | 기본 결과 |
| --- | --- | --- |
| 한국 온라인 여권사진 | `/passport-photo` | 413×531px JPEG, 500KB 이하 |
| 일반 증명사진 3×4cm | `/id-photo` | 354×472px, JPEG/PNG |
| 주민등록증 사진 3.5×4.5cm | `/resident-id-photo` | 413×531px, JPEG/PNG |
| YouTube 채널 배너 | `/youtube-banner` | 2560×1440px, 6MB 이하 |
| 파비콘 패키지 | `/favicon-maker` | ICO·PNG·manifest·안내문 ZIP |
| 사진 개인정보 정리 | `/photo-privacy-cleaner` | JPEG/PNG/WebP 메타데이터 정리 |

공식 사진 도구는 크롭·리사이즈·제한적 압축을 돕지만 실제 접수나 승인을 보장하지 않는다. 특히 여권사진은 배경 제거·교체, 얼굴 미화, 생성형 수정 경로를 제공하지 않는다.

### v2 추가 도구

| 도구 | 경로 | 실제 제공 기능 |
| --- | --- | --- |
| 사진 용량 줄이기 | `/image-compressor` | KB/MB 상한을 지정하고 제한된 품질 탐색과 선택적 축소 후 실제 Blob 용량 검사 |
| 이미지 크기 조절 | `/image-resizer` | 직접 치수·긴 변·퍼센트, 비율 잠금, contain/cover, 확대 경고 |
| 이미지 형식 변환 | `/image-converter` | JPEG/PNG/WebP 변환, 품질·배경·투명도 선택 |
| SNS 이미지 세트 | `/social-image-pack` | 1:1·4:5·9:16 개별 크롭, 원형 미리보기, 개별 또는 ZIP 다운로드 |
| 인스타그램 프로필 사진 | `/instagram-profile-picture` | 사진 전체를 작은 원 안에 맞추고 테두리·안쪽 원·캔버스 색, 크기와 위치를 조절해 1080×1080로 저장 |
| YouTube 썸네일 | `/youtube-thumbnail` | 최신 공식 권장 3840×2160, 16:9 템플릿 편집 |
| 네컷사진 만들기 | `/four-cut-photo` | 1~4장 배치, 세로/가로, 프레임·필터·날짜·문구·순서·크롭 |
| 필름사진 효과 | `/film-photo` | 로컬 결정적 픽셀 효과, grain·vignette·light leak·날짜·흑백 등 |

출처 성격을 나타내는 `sourceKind`와 화면 배지인 `badgeKind`는 분리한다. 배지는 공식 출처 기반, 공식 권장값 참고, 일반 인화 규격, 일상 이미지 도구, 픽셀핏 권장 크기, 크리에이터 도구, 감성 프리셋, 개인정보 도구, 웹 자산 도구로 세분화한다. 각 도구 상단에는 도구별로 정확히 2개의 핵심 정보만 표시하며, 최초 게시일과 실제 내용 수정일을 도구마다 독립적으로 관리한다. AI 생성이나 원격 모델은 사용하지 않는다.

## 가이드 8개

가이드 인덱스는 `/guide`, 본문은 `/guide/[slug]`에 정적으로 생성된다.

- `/guide/passport-photo-413x531`
- `/guide/photo-under-500kb`
- `/guide/id-photo-size`
- `/guide/dpi-vs-pixels`
- `/guide/youtube-banner-safe-area`
- `/guide/favicon-files`
- `/guide/exif-photo-privacy`
- `/guide/jpeg-png-webp`

규격의 출처, 공식값과 제품 해석의 경계는 [프리셋 출처 기록](./docs/PRESET_SOURCES.md)에 둔다.

## 자체 제작 결과 예시와 정적 자산

여권사진·이미지 압축·YouTube 썸네일·네컷사진·필름사진에는 외부 사진이나 실제 인물 얼굴을 사용하지 않은 자체 제작 본 예시 22개를 제공한다. 본 예시는 압축 비교용 full PNG 4개와 SVG 18개이며, 압축 갤러리에는 초기 전송량을 줄이기 위한 480×320 PNG 썸네일 4개가 별도로 있다. 압축 full PNG의 actual bytes는 원본부터 차례로 `1,045,528` / `279,843` / `110,060` / `34,154`이고 100KB 목표 fixture만 900×600, 나머지는 1200×800이다. 이 네 파일은 같은 사용자 원본을 실제 압축 엔진에 통과시킨 결과가 아니라 색 단계와 세부 묘사를 달리 만든 결정적 비교 fixture이며, 화면에도 이 경계를 명시한다.

갤러리가 화면에 들어오기 전 sample 요청은 0개다. 화면 진입 뒤에는 현재 route의 예시만 요청하고, 압축 route는 480×320 썸네일만 먼저 받는다. 1MB를 넘는 압축 원본을 포함한 full PNG는 사용자가 `원본 크기로 보기`를 눌렀을 때만 새 창에서 요청한다. 선언은 `src/config/samples.ts`, 화면은 `SampleGallery`, 결정적 생성기는 `scripts/generate-samples.mjs`가 담당한다. 홈·14개 도구·가이드용 OG PNG 24개도 저장소의 결정적 생성 스크립트로 관리한다.

```bash
pnpm generate:assets
pnpm verify:assets
```

`generate:assets`는 sample과 OG를 생성하고 모든 production build가 먼저 실행한다. `verify:assets`는 생성 결과를 다시 쓰지 않고 생성 내용과 digest의 drift를 검사하며, Registry 테스트가 본 예시 22개와 별도 썸네일 4개의 선언·물리 파일 집합이 정확히 일치하고 고아 파일이 0개인지 별도로 확인한다. 현재 sample SHA-256 앞 16자리는 `061e0431696e4a31`이다. 사용자 이미지나 외부 저작권 사진을 fixture로 저장하지 않는다.

## 기술 구성

- Next.js 16 App Router, React 19, strict TypeScript, Tailwind CSS
- Zod 기반 도구·가이드·환경설정 runtime validation
- Canvas, `createImageBitmap`, Blob과 형식별 parser를 이용한 로컬 처리
- JSZip 기반 브라우저 ZIP 생성
- Vitest/React Testing Library, Playwright, axe
- Next.js static export (`out/`)

v2 확장을 위해 직접 runtime 또는 개발 의존성을 추가하지 않았다. 정확한 목록은 [제3자 고지](./THIRD_PARTY_NOTICES.md)에 있다.

## 요구 환경과 로컬 실행

- Node.js 22 이상
- `packageManager`에 고정된 pnpm 11.9.0
- 최신 Chromium 계열 브라우저 권장

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

얼굴 자동 맞춤은 브라우저의 선택적 `FaceDetector`가 있을 때만 보조 기능으로 사용한다. 미지원 또는 실패 시 외부 모델을 호출하지 않고 수동 크롭을 유지한다.

## 중앙 환경설정과 URL

배포별 값은 `src/config/env.ts`에서 검증하고, URL과 base path 결합은 `src/config/brand.ts`에서 한 번만 처리한다. 값이 없을 때 사이트 URL은 `https://pixelfit.me`, 공개 문의 이메일은 `wodnd0823@gmail.com`, 운영자명은 `DUBEEUBBEE`를 사용한다. GitHub Issues는 일반 문의의 대체 수단이 아니라 기능 오류 제보용 보조 채널이다. 가짜 도메인이나 가짜 이메일을 출력하지 않는다.

| 환경변수 | 용도 | 기본/실패 동작 |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | canonical 기준 URL | `https://pixelfit.me` |
| `NEXT_PUBLIC_BASE_PATH` | `/pixelfit` 같은 하위 경로 | 빈 문자열 |
| `BASE_PATH` | 이전 호환용 base path | 공개 변수보다 후순위 |
| `NEXT_PUBLIC_CUSTOM_DOMAIN` / `CUSTOM_DOMAIN` | 프로토콜 없는 사용자 정의 호스트명 | 있으면 canonical을 HTTPS 루트로 고정하고 base path를 비움 |
| `NEXT_PUBLIC_CONTACT_EMAIL` / `CONTACT_EMAIL` | 공개 문의 이메일 | 미설정·유효하지 않으면 `wodnd0823@gmail.com` |
| `NEXT_PUBLIC_CONTACT_URL` / `CONTACT_URL` | 기능 오류 보조 채널 | 저장소 Issues |
| `NEXT_PUBLIC_OPERATOR_NAME` / `OPERATOR_NAME` | 실제 운영 주체명 | 미설정 시 `DUBEEUBBEE` |
| `NEXT_PUBLIC_ADSENSE_ENABLED` / `ADSENSE_ENABLED` | 광고 요청 여부 | 기본 `false` |
| `NEXT_PUBLIC_ADSENSE_CLIENT` / `ADSENSE_CLIENT` | `ca-pub-` client | 유효한 값은 계정 확인 meta와 custom-root `ads.txt`에 사용하며, 광고 게이트는 별도 |
| `NEXT_PUBLIC_ADSENSE_CONTENT_SLOT` / `ADSENSE_CONTENT_SLOT` | 콘텐츠 slot | 유효하지 않으면 광고 차단 |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` / `GOOGLE_SITE_VERIFICATION` | Google Search Console URL-prefix HTML 확인 토큰 | 유효한 값이 있을 때만 `google-site-verification` meta 생성 |
| `NEXT_PUBLIC_NAVER_SITE_VERIFICATION` / `NAVER_SITE_VERIFICATION` | 선택 Naver 확인 토큰 | 유효한 값이 있을 때만 meta 생성 |

환경값 경고가 있으면 임의로 보정해 광고·검증을 성공 처리하지 않는다.

## 이중 빌드와 artifact 검증

GitHub project Pages 후보는 실제 하위 경로와 canonical을 주입하고, 28개 sitemap URL·canonical·자산·24개 OG PNG·광고 OFF·CNAME 부재를 자동 검사한다.

```bash
pnpm build:pages
```

기본 production build는 현재 공개 canonical `pixelfit.me`의 HTTPS root 계약으로 빌드하고 export verifier까지 실행한다. 로컬 성공은 이후 작업 트리가 배포됐다는 증거가 아니며, 공개 변경은 별도 commit·Actions·실제 URL 검증으로 확인한다.

```bash
pnpm build
```

고정된 테스트 호스트로 일반 custom-domain 루트 계약만 확인할 때는 다음 명령을 사용한다. 이 명령은 DNS나 GitHub Pages Settings를 변경하지 않는다.

```bash
pnpm build:custom:test
```

GitHub Actions는 같은 계약을 `pnpm build:deploy`에 환경변수로 전달한다. 다른 실제 소유 도메인으로 이전할 때는 `NEXT_PUBLIC_CUSTOM_DOMAIN`, `NEXT_PUBLIC_SITE_URL`, 빈 `NEXT_PUBLIC_BASE_PATH`를 같은 build와 `pnpm verify:export -- --mode=custom`에 전달한다. 자세한 운영 절차는 [커스텀 도메인 문서](./docs/CUSTOM_DOMAIN.md)를 따른다.

두 빌드 모두 `out/`을 덮어쓰므로 산출물과 검사 로그를 구분해 보관한다. custom-domain 빌드는 코드만으로 DNS, GitHub Pages Settings 또는 TLS를 바꾸지 않는다. GitHub Actions Pages 배포는 저장소의 `CNAME` 파일을 적용하지 않으므로 사용자 정의 도메인은 Pages Settings와 DNS에서 별도로 설정·검증해야 한다.

## 검사와 preview

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
pnpm preview
```

`pnpm check`는 lint, typecheck, unit/component test, project Pages build와 `pixelfit.me` custom-root 후보 build를 실행하며 E2E와 접근성 검사를 포함하지 않는다. 2026-07-26 P6 로컬 후보는 Vitest 144/144, Playwright 45 passed·1 intended skip, axe 4/4, Pages/custom verifier를 통과했다. Lighthouse 대표 5경로의 mobile Performance는 96~99, desktop Performance는 100이며 나머지 세 범주와 CLS는 각각 100과 0이었다. 원시 결과와 미실행 항목은 [현재 상태](./docs/STATUS.md)에 기록한다.

그 뒤의 P7 `WORKTREE_ONLY` 후보는 `pnpm install --frozen-lockfile`, Vitest 49 files·206/206, `pnpm verify:assets`, Playwright 48 passed·2 intended skips, axe 4/4를 통과했다. 최종 `pnpm check`는 Pages/custom verifier 617/618 checks, `pnpm build:custom:test`와 마지막 `pnpm build:custom`은 각각 618 checks를 통과했다. 브라우저 가드는 예상 밖 console error·warning·pageerror 0을 확인했다. 자산 검증은 full PNG 4개와 SVG 18개로 구성된 본 예시 22개, 압축 전용 480×320 PNG 썸네일 4개, 선언·물리 파일 집합 일치와 고아 파일 0개를 확인했다. Lighthouse 13.0.1의 최신 `output/lighthouse/p7-final-*.json` 12개에서는 대표 6경로 mobile Performance 98~99, desktop Performance 100이며 모든 Accessibility·Best Practices·SEO가 100, CLS가 0이었다.

마지막 custom 산출물은 `CNAME=pixelfit.me`, 실제 publisher와 일치하는 root `ads.txt`, `google-adsense-account` meta가 있는 HTML 30개를 확인했다. 광고 제공은 계속 OFF이며 `pagead2` loader·`adsbygoogle`·PixelFit slot runtime marker는 0이다. 위 결과는 로컬 후보 검증이며 commit·push·배포 또는 AdSense 승인의 증거가 아니다.

`pnpm preview`는 static export인 `out/`을 제공한다. `next start`는 이 프로젝트의 배포 모드가 아니다.

## 광고·검색 소유권 상태

- AdSense 광고 게이트는 기본 OFF다. `ADSENSE_ENABLED=true`, 유효한 client와 slot이 모두 있을 때만 광고 스크립트와 슬롯을 렌더링한다.
- 유효한 실제 publisher client는 광고가 OFF여도 `google-adsense-account` meta와 custom-root `ads.txt`를 생성할 수 있다. 이는 계정·사이트 연결용 기술 표면일 뿐 광고 활성화나 승인을 뜻하지 않는다.
- 허용 위치는 홈 콘텐츠 구분, 가이드 콘텐츠 구분, 도구 설명 끝뿐이다. 업로드·편집·미리보기·결과·다운로드·내비게이션·privacy·terms·contact에는 광고를 두지 않는다.
- 기존 `pixelfit.o-r.kr`은 `o-r.kr` 아래의 일반 하위 도메인이어서 AdSense 사이트 등록이 차단됐다. 현재 `pixelfit.me`에서는 registrable root 등록, 공개 root `ads.txt` 소유권 확인과 사이트 검토 요청까지 완료했지만 계정 상태는 `준비 중`이다.
- 동의 관리 플랫폼(CMP), AdSense 최종 승인, 정책 검토와 실제 광고 제공은 별도 외부 운영 작업이다. 완료 전에는 광고 스크립트를 OFF로 유지한다.
- Naver 소유권 meta는 유효한 토큰을 명시한 빌드에서만 생성한다.
- Google Search Console은 유효한 `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` 또는 호환 변수가 있으면 URL-prefix 속성용 HTML meta를 생성한다. 현재 `https://pixelfit.me/` URL-prefix 소유권과 `/sitemap.xml` 처리 성공·27페이지 발견은 외부에서 확인했다.

## SEO 계약

- 홈과 각 도구·가이드에 중앙 URL helper로 canonical을 만든다.
- 홈·도구·가이드용 자체 제작 1200×630 PNG를 Open Graph/Twitter 이미지로 사용한다.
- 홈은 `WebSite`와 사실 기반의 일반 `WebApplication`, About은 실제 연락처를 가진 공통 `Organization`, 도구는 `BreadcrumbList`와 게시·수정일이 있는 일반 `WebApplication`, 가이드 허브는 `ItemList`, 가이드 상세는 `BreadcrumbList`와 `Article`을 사용한다.
- 가이드 `Article` 작성자는 `DUBEEUBBEE` Person, 발행자는 사이트 루트 URL을 쓰는 픽셀핏 Organization이다. Organization identity는 `src/config/organization.ts` 한 곳에서 만든다.
- 화면에 보이는 FAQ는 유지하지만 `FAQPage` 구조화 데이터는 생성하지 않는다.
- `WebApplication`에는 실제 화면과 일치하는 이름·URL·설명·이미지·콘텐츠 수정일만 넣는다. Google 소프트웨어 앱 리치 결과에 필요한 실제 가격·리뷰·평점 근거가 없으므로 `offers`, `review`, `aggregateRating`과 `SoftwareApplication`은 생성하지 않는다.

## 개인정보 동작

- 입력 파일, 픽셀, 얼굴 bbox와 메타데이터를 이미지 처리 서버로 보내지 않는다.
- `localStorage`, `sessionStorage`, IndexedDB에 사용자 이미지를 저장하지 않는다.
- 사용자가 “같은 사진으로 다음 도구”를 누른 경우에만 현재 탭의 React `useRef` 메모리로 `File`을 한 번 전달한다. 새로고침하면 사라진다.
- 결과와 미리보기 Object URL은 교체·초기화·이탈 때 해제한다.
- 정적 자산 요청과 선택적으로 활성화한 광고/CMP 네트워크 요청은 이미지 처리 전송과 구분한다.
- HEIC은 지원하지 않는다. 지원하지 않는 형식이나 메타데이터 보존을 성공처럼 표시하지 않는다.
- SynthID, C2PA, JUMBF, Content Credentials와 워터마크를 제거하거나 우회하지 않는다.

전체 경계와 남는 위험은 [개인정보·보안 모델](./docs/PRIVACY_MODEL.md)에 있다.

## GitHub Pages 배포 주의

`.github/workflows/deploy-pages.yml`은 `main` push 또는 수동 실행에서 custom-domain root 모드만 사용한다. repository variable이 비어 있으면 `pixelfit.me`를 명시적 기본값으로 사용하고, artifact 업로드 전에 `pnpm verify:export`를 실행한다. 기존 repository variable이 `pixelfit.o-r.kr`이면 코드 기본값보다 우선하므로 실제 전환 배포 전에 `NEXT_PUBLIC_CUSTOM_DOMAIN=pixelfit.me`로 갱신해야 한다. project Pages `/pixelfit`은 별도 회귀 build로 유지한다.

기존 `pixelfit.o-r.kr` 공개 배포·HTTPS·Search Console 기록은 보존한다. 현재 `pixelfit.me`의 등록, Pages custom-domain, apex/`www` DNS, 인증서, HTTPS 강제, Search Console 속성·sitemap, AdSense 사이트 추가와 검토 요청까지 확인했으며, AdSense 최종 승인·CMP·광고 제공은 아직 완료하지 않았다. GitHub Pages는 한 저장소에 custom domain 하나만 연결하며 현재 기존 project Pages URL은 그 연결을 따라 `pixelfit.me`로 이동한다. 별개의 이전 custom domain을 계속 제공하려면 별도 redirect host/repository 또는 registrar forwarding 전략이 필요하다.

2026-07-26 읽기 전용 재확인에서는 기존 `dubeeubbee.github.io/pixelfit` URL이 경로와 query를 보존해 `pixelfit.me`로 `301` 이동했다. 현재 공개 동작과 재검증 명령은 [기존 URL 이전 확인](./docs/LEGACY_URL_MIGRATION.md)에 기록하며, 이 사실을 P7 로컬 코드가 배포됐다는 증거로 사용하지 않는다.

## 문서

- [제품 명세](./docs/PRODUCT_SPEC.md)
- [아키텍처](./docs/ARCHITECTURE.md)
- [구현 계획](./docs/PLAN.md)
- [현재 상태](./docs/STATUS.md)
- [프리셋 공식 출처](./docs/PRESET_SOURCES.md)
- [개인정보·보안 모델](./docs/PRIVACY_MODEL.md)
- [테스트 계획](./docs/TEST_PLAN.md)
- [출시 체크리스트](./docs/RELEASE_CHECKLIST.md)
- [커스텀 도메인 운영](./docs/CUSTOM_DOMAIN.md)
- [AdSense 준비](./docs/ADSENSE_READINESS.md)
- [SEO 외부 운영](./docs/SEO_OPERATIONS.md)
- [기존 URL 이전 확인](./docs/LEGACY_URL_MIGRATION.md)
- [제3자 고지](./THIRD_PARTY_NOTICES.md)

## 라이선스

이 저장소의 package는 `UNLICENSED`다. 사용한 오픈소스 의존성과 프로젝트 자체 OG/fixture 정책은 [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)를 확인한다.
