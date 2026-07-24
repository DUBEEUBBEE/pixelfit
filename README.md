# 픽셀핏

용도를 고르고 사진을 올리면 브라우저 안에서 규격 맞춤, 압축, 변환과 창작 효과를 수행하는 한국어 정적 웹 앱이다. 사용자 이미지의 픽셀과 메타데이터는 이미지 처리 서버로 업로드하지 않는다.

## 현재 상태

| 구분 | 상태 | 의미 |
| --- | --- | --- |
| 공개 v1 | `PASS` 기록 보존 | 2026-07-22 `https://dubeeubbee.github.io/pixelfit/`에 배포한 기존 6개 도구 릴리스 |
| 2026-07-23 로컬 v2 RC | `PASS` 기록 보존 | 13개 도구·8개 가이드, 단위 131개·브라우저 44개·접근성 4개·이중 export·Lighthouse 로컬 검증 완료 |
| 2026-07-24 custom-domain 후보 | `IN_PROGRESS` | SEO·소유권·AdSense 안전 계약 수정 중. DNS는 GitHub Pages를 가리키지만 `pixelfit.o-r.kr` HTTPS 인증서는 아직 유효하지 않고 최종 build·배포·공개 검증은 남음 |

공개 v1의 성공 기록은 v2 RC의 공개 배포 증거가 아니다. 명령별 실제 결과와 미실행 항목은 [현재 상태](./docs/STATUS.md), 출시 경계는 [출시 체크리스트](./docs/RELEASE_CHECKLIST.md)를 기준으로 확인한다.

## 도구 13개

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

### v2 로컬 RC 추가 도구

| 도구 | 경로 | 실제 제공 기능 |
| --- | --- | --- |
| 사진 용량 줄이기 | `/image-compressor` | KB/MB 상한을 지정하고 제한된 품질 탐색과 선택적 축소 후 실제 Blob 용량 검사 |
| 이미지 크기 조절 | `/image-resizer` | 직접 치수·긴 변·퍼센트, 비율 잠금, contain/cover, 확대 경고 |
| 이미지 형식 변환 | `/image-converter` | JPEG/PNG/WebP 변환, 품질·배경·투명도 선택 |
| SNS 이미지 세트 | `/social-image-pack` | 1:1·4:5·9:16 개별 크롭, 원형 미리보기, 개별 또는 ZIP 다운로드 |
| YouTube 썸네일 | `/youtube-thumbnail` | 최신 공식 권장 3840×2160, 16:9 템플릿 편집 |
| 네컷사진 만들기 | `/four-cut-photo` | 1~4장 배치, 세로/가로, 프레임·필터·날짜·문구·순서·크롭 |
| 필름사진 효과 | `/film-photo` | 로컬 결정적 픽셀 효과, grain·vignette·light leak·날짜·흑백 등 |

추가 도구 중 YouTube 썸네일처럼 공식 출처가 있는 값은 `official`로, 압축·리사이즈·변환·SNS 팩·네컷·필름처럼 제품이 정한 값은 서비스 기본값 또는 관행으로 표시한다. AI 생성이나 원격 모델은 사용하지 않는다.

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

배포별 값은 `src/config/env.ts`에서 검증하고, URL과 base path 결합은 `src/config/brand.ts`에서 한 번만 처리한다. 값이 없을 때 사이트 URL은 현재 GitHub project Pages 주소, 연락처는 저장소 Issues, 운영자명은 요청된 중립 표기 `픽셀핏 운영자`를 사용한다. 가짜 도메인이나 가짜 이메일을 출력하지 않는다.

| 환경변수 | 용도 | 기본/실패 동작 |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | canonical 기준 URL | 현재 project Pages URL |
| `NEXT_PUBLIC_BASE_PATH` | `/pixelfit` 같은 하위 경로 | 빈 문자열 |
| `BASE_PATH` | 이전 호환용 base path | 공개 변수보다 후순위 |
| `NEXT_PUBLIC_CUSTOM_DOMAIN` / `CUSTOM_DOMAIN` | 프로토콜 없는 사용자 정의 호스트명 | 있으면 canonical을 HTTPS 루트로 고정하고 base path를 비움 |
| `NEXT_PUBLIC_CONTACT_EMAIL` / `CONTACT_EMAIL` | 선택 이메일 | 유효하지 않으면 사용하지 않음 |
| `NEXT_PUBLIC_CONTACT_URL` / `CONTACT_URL` | 문의 링크 | 저장소 Issues |
| `NEXT_PUBLIC_OPERATOR_NAME` / `OPERATOR_NAME` | 실제 운영 주체명 | 미설정 시 `픽셀핏 운영자` |
| `NEXT_PUBLIC_ADSENSE_ENABLED` / `ADSENSE_ENABLED` | 광고 요청 여부 | 기본 `false` |
| `NEXT_PUBLIC_ADSENSE_CLIENT` / `ADSENSE_CLIENT` | `ca-pub-` client | 유효한 값은 계정 확인 meta와 custom-root `ads.txt`에 사용하며, 광고 게이트는 별도 |
| `NEXT_PUBLIC_ADSENSE_CONTENT_SLOT` / `ADSENSE_CONTENT_SLOT` | 콘텐츠 slot | 유효하지 않으면 광고 차단 |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` / `GOOGLE_SITE_VERIFICATION` | Google Search Console URL-prefix HTML 확인 토큰 | 유효한 값이 있을 때만 `google-site-verification` meta 생성 |
| `NEXT_PUBLIC_NAVER_SITE_VERIFICATION` / `NAVER_SITE_VERIFICATION` | 선택 Naver 확인 토큰 | 유효한 값이 있을 때만 meta 생성 |

환경값 경고가 있으면 임의로 보정해 광고·검증을 성공 처리하지 않는다.

## 이중 빌드와 artifact 검증

GitHub project Pages 후보는 실제 하위 경로와 canonical을 주입하고, 27개 sitemap URL·canonical·자산·23개 OG PNG·광고 OFF·CNAME 부재를 자동 검사한다.

```bash
pnpm build:pages
```

기본 production build는 현재 실제 custom domain인 `pixelfit.o-r.kr`의 HTTPS root 계약으로 빌드하고 export verifier까지 실행한다.

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

`pnpm check`는 lint, typecheck, unit/component test, project Pages build와 실제 `pixelfit.o-r.kr` custom-root build를 실행하며 E2E와 접근성 검사를 포함하지 않는다. 2026-07-23 로컬 RC는 Vitest 131/131, Playwright Chromium/WebKit 44/44, axe 4/4, Pages/custom verifier를 통과했다. Lighthouse mobile 기본 설정의 대표 5경로는 Performance 99~100, 나머지 세 범주 100, CLS 0이었다. 이후 변경의 최종 수치는 [현재 상태](./docs/STATUS.md)에 별도로 기록한다.

`pnpm preview`는 static export인 `out/`을 제공한다. `next start`는 이 프로젝트의 배포 모드가 아니다.

## 광고·검색 소유권 상태

- AdSense 광고 게이트는 기본 OFF다. `ADSENSE_ENABLED=true`, 유효한 client와 slot이 모두 있을 때만 광고 스크립트와 슬롯을 렌더링한다.
- 유효한 실제 publisher client는 광고가 OFF여도 `google-adsense-account` meta와 custom-root `ads.txt`를 생성할 수 있다. 이는 계정·사이트 연결용 기술 표면일 뿐 광고 활성화나 승인을 뜻하지 않는다.
- 허용 위치는 홈 콘텐츠 구분, 가이드 콘텐츠 구분, 도구 설명 끝뿐이다. 업로드·편집·미리보기·결과·다운로드·내비게이션·privacy·terms·contact에는 광고를 두지 않는다.
- `pixelfit.o-r.kr`은 Public Suffix List에 등록된 플랫폼 하위 도메인이 아니라 `o-r.kr` 아래의 일반 하위 도메인이다. Google의 사이트 URL 규칙상 이 주소만으로 AdSense 사이트 등록을 완료할 수 없고, 상위 `o-r.kr/ads.txt`도 이 프로젝트가 제어하지 못한다. AdSense에는 운영자가 소유·제어하는 등록 가능 루트 도메인이 필요하다.
- 동의 관리 플랫폼(CMP), AdSense 계정·사이트 승인, 정책 검토, 루트 `ads.txt` 확인은 외부 운영 작업이다. 저장소가 자동 완료했다고 주장하지 않으며, 완료 전에는 광고 스크립트를 OFF로 유지한다.
- Naver 소유권 meta는 유효한 토큰을 명시한 빌드에서만 생성한다.
- Google Search Console은 유효한 `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` 또는 호환 변수가 있으면 URL-prefix 속성용 HTML meta를 생성한다. 실제 속성 추가, 확인과 sitemap 제출 성공은 공개 HTTPS가 유효한 상태에서 별도로 확인해야 한다.

## SEO 계약

- 홈과 각 도구·가이드에 중앙 URL helper로 canonical을 만든다.
- 홈·도구·가이드용 자체 제작 1200×630 PNG를 Open Graph/Twitter 이미지로 사용한다.
- 홈은 `WebSite`, 가이드 허브는 `ItemList`, 도구는 `BreadcrumbList`, 가이드 상세는 `BreadcrumbList`와 `Article`만 구조화 데이터로 사용한다.
- 화면에 보이는 FAQ는 유지하지만 `FAQPage` 구조화 데이터는 생성하지 않는다.
- 실제 가격·리뷰·평점 근거가 없는 `WebApplication`/`SoftwareApplication` rich-result 표시는 생성하지 않는다. 가짜 리뷰, 별점, 사용량, 촬영일, 수정일이나 검증하지 않은 메타데이터를 만들지 않는다.

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

`.github/workflows/deploy-pages.yml`은 `main` push 또는 수동 실행에서 custom-domain root 모드만 사용한다. repository variable이 비어 있으면 `pixelfit.o-r.kr`을 명시적 기본값으로 사용하고, artifact 업로드 전에 `pnpm verify:export`를 실행한다. project Pages `/pixelfit`은 별도 회귀 build로 유지한다. 배포는 실제 workflow와 공개 URL을 확인해야 완료이며 로컬 빌드 성공만으로 배포 완료라 기록하지 않는다.

2026-07-24 확인 시 `pixelfit.o-r.kr`의 DNS는 GitHub Pages를 가리키지만 HTTPS 인증서는 해당 호스트명에 아직 유효하지 않았다. 인증서 발급과 Pages의 HTTPS 적용이 끝나기 전에는 Search Console/AdSense의 공개 연결을 완료로 표시하지 않는다. GitHub Pages는 프로젝트가 의도한 임의의 CSP·Permissions-Policy 응답 헤더를 저장소 파일만으로 보장하지 않으므로 MIME, 404, clean URL, 직접 새로고침과 실제 응답 헤더도 공개 호스트에서 따로 검증한다.

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
- [제3자 고지](./THIRD_PARTY_NOTICES.md)

## 라이선스

이 저장소의 package는 `UNLICENSED`다. 사용한 오픈소스 의존성과 프로젝트 자체 OG/fixture 정책은 [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)를 확인한다.
