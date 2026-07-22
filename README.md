# 픽셀핏

용도를 고르고 사진만 올리면 출력 픽셀, 비율, 여백, 안전영역, 형식과 용량을 맞추는 브라우저 전용 이미지 도구다. 사용자 이미지는 이미지 처리 서버로 업로드하지 않고 현재 기기의 브라우저 메모리에서 처리한다.

> 이 README는 제품 계약과 실행 방법을 설명한다. 실제 구현·검증 완료 여부는 [docs/STATUS.md](./docs/STATUS.md)를 기준으로 확인한다.

## v1 도구

| 도구 | 경로 | 기본 출력 |
| --- | --- | --- |
| 한국 온라인 여권사진 | `/passport-photo` | 413×531px JPEG, 500KB 이하 |
| 일반 증명사진 3×4cm | `/id-photo` | 354×472px |
| 주민등록증 사진 3.5×4.5cm | `/resident-id-photo` | 413×531px JPEG/PNG |
| YouTube 채널 배너 | `/youtube-banner` | 2560×1440px, 6MB 이하 |
| 파비콘 패키지 | `/favicon-maker` | ICO/PNG/manifest/안내문 ZIP |
| 사진 개인정보 정리 | `/photo-privacy-cleaner` | 정리된 JPEG/PNG/WebP 새 파일 |

여권과 같은 공식 사진은 규격 맞춤만 제공한다. 배경 제거·합성, 얼굴/피부 보정, 생성형 변경은 할 수 없고 실제 접수나 승인을 보장하지 않는다. 자동 검사는 참고용이다.

## 기술 구성

- Next.js App Router + React + strict TypeScript
- Tailwind CSS
- Zod 기반 preset runtime validation
- Canvas/createImageBitmap와 Worker fallback을 이용한 로컬 처리
- 선택적 네이티브 `FaceDetector`와 상시 수동 크롭 fallback
- JSZip 기반 브라우저 파비콘 패키지 생성
- Vitest/React Testing Library, Playwright, axe
- Next.js static export (`out/`)

상세 설계는 [아키텍처](./docs/ARCHITECTURE.md), 제품 범위는 [제품 명세](./docs/PRODUCT_SPEC.md)를 참고한다.

## 요구 환경

- Node.js 22 이상
- Corepack이 활성화된 pnpm 11.9.0 또는 package.json의 `packageManager`를 존중하는 환경
- 최신 Chromium 계열 브라우저 권장

얼굴 자동 맞춤은 브라우저의 `FaceDetector` 지원 여부에 따라 제공되지 않을 수 있다. 이 경우 수동 위치·확대 조정으로 모든 핵심 흐름을 계속할 수 있어야 한다.

## 설치와 로컬 실행

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

기본 Next.js 개발 주소를 브라우저에서 연다. 개발 서버가 출력한 실제 URL을 사용한다.

브랜드명, 설명과 연락처는 `src/config/brand.ts`에서 관리한다. 공개 URL은 build 시 `NEXT_PUBLIC_SITE_URL`로 주입하며, 값이 없으면 예약 주소 `https://pixelfit.example`이 표시된다. 공개 배포 전 실제 URL과 연락처를 반드시 바꾼다.

## 검사

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
pnpm test:a11y
```

빠른 통합 검사는 다음과 같다.

```bash
pnpm check
```

`pnpm check`는 lint, typecheck, unit/component test와 production build를 실행한다. Playwright E2E/a11y는 포함하지 않으므로 출시 전 별도로 실행해야 한다. 실행하지 않은 검사는 성공으로 간주하지 않는다. 상세 범위와 fixture 정책은 [테스트 계획](./docs/TEST_PLAN.md)을 따른다.

## Production build와 로컬 preview

```bash
pnpm build
pnpm preview
```

`next.config.ts`의 `output: "export"`에 따라 배포 산출물은 `out/`에 생성된다. `pnpm preview`는 이 디렉터리를 정적 서버로 제공한다. preview에서 루트, 여섯 도구, 정보 페이지, 직접 URL 새로고침과 404를 확인한다.

실제 hostname으로 canonical, sitemap과 구조화 데이터를 만들려면 production build 전에 환경 변수를 설정한다.

```bash
NEXT_PUBLIC_SITE_URL=https://images.example.com pnpm build
```

`NEXT_PUBLIC_BASE_PATH`를 함께 주입하면 GitHub project Pages 같은 하위 경로 배포용 자산과 내부 링크를 생성한다.

## GitHub Pages 배포

예정 저장소 `DUBEEUBBEE/pixelfit`은 다음 주소의 project Pages로 배포한다.

```text
https://dubeeubbee.github.io/pixelfit/
```

`.github/workflows/deploy-pages.yml`은 `main` push 또는 수동 실행 시 pnpm frozen install 후 아래 환경으로 정적 export를 만들고, GitHub의 공식 Pages artifact/deploy Actions로 `out/`을 배포한다.

```bash
NEXT_PUBLIC_BASE_PATH=/pixelfit \
NEXT_PUBLIC_SITE_URL=https://dubeeubbee.github.io/pixelfit \
pnpm build
```

최초 1회 GitHub 저장소의 **Settings → Pages → Build and deployment → Source**에서 **GitHub Actions**를 선택한다. 이후 `main`에 workflow를 포함한 소스를 올리거나 Actions 화면에서 `Deploy GitHub Pages`를 수동 실행한다. 별도 branch, `gh-pages` package, 서버, 데이터베이스와 비밀키는 필요하지 않다. `public/.nojekyll`은 `_next` 디렉터리가 Jekyll 처리로 누락되지 않게 한다.

GitHub Pages는 저장소의 `vercel.json`이나 `public/_headers`를 해석하지 않으므로 사용자 정의 CSP·Permissions-Policy 등의 응답 헤더를 적용할 수 없다. HTTPS와 GitHub 기본 헤더는 공개 URL에서 확인하되, 프로젝트의 전체 보안 헤더 정책이 필수라면 Vercel 등 헤더 설정을 지원하는 호스트를 사용한다.

## Vercel 배포

1. 저장소를 Vercel 프로젝트로 가져온다.
2. Framework Preset은 Next.js, Install Command는 `pnpm install --frozen-lockfile`, Build Command는 `pnpm build`를 사용한다.
3. Vercel 설정이 output directory를 요구하면 `out`을 지정한다. Next.js integration이 static export를 자동 인식하는 경우 임의로 중복 설정하지 않는다.
4. 배포 후 실제 URL로 모든 route, 다운로드, CSP/보안 헤더와 브라우저 콘솔을 확인한다.

이미지 처리용 Function, Blob storage, 데이터베이스나 비밀키는 필요하지 않다. 서버 기능을 추가하는 배포 설정은 로컬 처리 개인정보 계약을 바꾸므로 별도 설계 검토가 필요하다.

## CI

`.github/workflows/ci.yml`은 Node.js 22와 pnpm 11.9.0에서 frozen lockfile 설치, `pnpm check`, Chromium 설치와 전체 Playwright E2E를 실행한다. `.github/workflows/deploy-pages.yml`은 같은 runtime으로 Pages 전용 build와 공식 Pages 배포를 수행한다. 두 workflow 모두 비밀키를 사용하지 않는다. 로컬 검사는 통과했지만 실제 GitHub-hosted Actions 실행은 [STATUS.md](./docs/STATUS.md)에 `NOT_TESTED`로 기록되어 있다.

## 일반 정적 호스팅 배포

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm build
```

그 다음 `out/`의 **내용 전체**를 HTTPS 정적 호스트의 document root에 업로드한다.

호스트 설정에서 다음을 확인한다.

- 생성된 route 파일을 clean URL로 제공하고 직접 접근/새로고침이 동작한다.
- `404.html`을 실제 404 상태로 제공하고 모든 경로를 홈으로 강제 rewrite하지 않는다.
- `_next/static` fingerprint 자산은 장기 immutable cache, HTML은 갱신 가능한 cache 정책을 사용한다.
- `.js`, `.css`, `.webmanifest`, `.ico`, 이미지와 ZIP에 올바른 MIME을 보낸다.
- HTTPS와 [개인정보·보안 모델](./docs/PRIVACY_MODEL.md)의 CSP, Referrer-Policy, nosniff, Permissions-Policy, frame 제한을 적용하고 실제 브라우저에서 검증한다.

하위 경로(예: `example.com/tools/pixelfit/`)에 배포할 때는 `NEXT_PUBLIC_BASE_PATH=/tools/pixelfit`과 그 경로를 포함한 `NEXT_PUBLIC_SITE_URL`을 build 전에 주입한다. 환경변수 없이 생성한 산출물을 단순히 하위 폴더로 옮기면 자산 경로가 깨진다.

## 개인정보 동작

- 입력 파일, 픽셀, 얼굴 bbox와 metadata를 서버로 전송하지 않는다.
- localStorage, sessionStorage, IndexedDB에 이미지를 저장하지 않는다.
- 초기화와 페이지 이탈 때 Object URL과 작업 참조를 해제한다.
- SynthID, C2PA, Content Credentials와 워터마크를 제거하거나 우회하지 않는다.
- 메타데이터 정리로 파일이 변경되면 콘텐츠 자격 증명이 무효화될 수 있다.

브라우저 확장, 운영체제, 다운로드 폴더의 클라우드 동기화까지 통제하거나 완전한 익명성을 보장하지는 않는다. 전체 모델과 검증 방법은 [PRIVACY_MODEL.md](./docs/PRIVACY_MODEL.md)에 있다.

## 문서

- [제품 명세](./docs/PRODUCT_SPEC.md)
- [아키텍처](./docs/ARCHITECTURE.md)
- [구현 계획](./docs/PLAN.md)
- [현재 상태](./docs/STATUS.md)
- [프리셋 공식 출처](./docs/PRESET_SOURCES.md)
- [개인정보·보안 모델](./docs/PRIVACY_MODEL.md)
- [테스트 계획](./docs/TEST_PLAN.md)
- [출시 체크리스트](./docs/RELEASE_CHECKLIST.md)
- [제3자 고지](./THIRD_PARTY_NOTICES.md)

## 라이선스

이 저장소의 package는 `UNLICENSED`로 표시되어 있다. 별도 허가 없이 프로젝트 자체 코드를 재배포할 수 있다는 뜻이 아니다. 사용한 오픈소스 의존성은 [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)를 참고한다.
