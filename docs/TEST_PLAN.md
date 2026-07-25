# 픽셀핏 v2 테스트 계획

기준일: 2026-07-24

## 1. 상태와 기록 원칙

이 문서는 총 13개 도구와 8개 가이드가 있는 v2의 검증 계획이다. 과거 공개 v1의 `PASS`는 새 도구, 같은 사진 전달, 광고 게이트, 가이드, OG PNG와 이중 base-path build의 증거가 아니다.

테스트 결과는 이 계획에 미리 채우지 않는다. 실제 실행한 명령, commit 또는 작업 트리 식별자, 시간, 브라우저, base mode와 원본 출력은 [STATUS.md](./STATUS.md)에 기록한다.

- 실행 및 성공: `PASS`
- 실행 및 실패: `FAIL`
- 실행하지 않음, 환경 부재 또는 증거 없음: `NOT_TESTED`

화면 렌더만으로 도구 기능을 `PASS` 처리하지 않는다. 파일 선택→편집→Blob/ZIP 생성→다운로드를 완료하고 결과를 가능한 범위에서 다시 파싱한다.

## 2. 환경과 명령

최소 환경:

- Node.js 22 이상
- package.json의 pnpm 11.9.0
- Vitest + jsdom + React Testing Library
- Playwright Desktop Chrome과 iPhone 13 WebKit
- `@axe-core/playwright`

기본 명령:

```bash
pnpm install --frozen-lockfile
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

`pnpm check`는 lint, typecheck, unit/component test, project Pages build와 `pixelfit.me` production 후보 custom-root build를 포함한다. E2E, 접근성, Lighthouse, 실제 GitHub Actions와 공개 URL 검증은 별도다.

## 3. fixture 정책

| fixture | 목적 | 정책 |
| --- | --- | --- |
| 작은 JPEG/PNG/WebP 기하 패턴 | decode, crop, resize, encode | 코드로 생성, 개인정보 없음 |
| 투명 PNG | JPEG 배경 합성, PNG/WebP alpha | 코드로 생성 |
| orientation 1/3/6/8 JPEG | 방향과 좌표 | 합성 metadata만 사용 |
| GPS/기기/날짜/XMP/IPTC 파일 | metadata 선택 제거 | 실제 개인정보가 아닌 가상 값 |
| PNG text/eXIf/iCCP/pHYs | chunk 제거·보존 | 코드로 생성 |
| WebP EXIF/XMP/ICCP | RIFF 제거·size 갱신 | 코드로 생성 |
| 균일 배경과 전경 도형 | 배경 분리 | 사람 사진 아님 |
| 1~4개 색상/숫자 타일 | SNS·네컷 순서와 crop | 코드로 생성 |
| 손상·빈·MIME 위장 파일 | 오류 경계 | 최소 합성 bytes |
| byte/pixel 경계 파일 | 메모리 보호 | 생성식과 크기 기록 |

개인 신분증·여권·얼굴 사진을 fixture로 commit하지 않는다. 외부 자료는 라이선스와 출처를 고지하기 전 사용하지 않는다. 실제 C2PA fixture가 없으면 보존 성공을 가짜 metadata로 꾸미지 않고 해당 검사를 `NOT_TESTED`로 둔다. HEIC fixture를 JPEG처럼 위장해 지원된다고 주장하지 않는다.

## 4. Unit·component 범위

### Registry와 콘텐츠

- 도구 13개와 가이드 8개의 고유 ID/slug
- 모든 연결 도구·가이드가 실제 Registry 항목을 가리킴
- 공식 도구는 기관, 제목, URL, 확인일 필수
- 관행/서비스 도구는 공식 badge 금지
- 도구·가이드 OG 경로가 고유한 1200×630 PNG를 가리킴
- 콘텐츠 수정일, 출처 확인일과 공개 배포일을 혼용하지 않음
- 화면 FAQ는 존재하되 `FAQPage` JSON-LD는 생성하지 않음
- 가짜 review/rating/사용량/날짜 metadata 부재

### 환경과 URL

- 기본 사이트 URL과 Issues 연락처가 실제 값
- project Pages에서 `/pixelfit`이 canonical·asset·sitemap URL에 한 번만 결합됨
- custom domain이 있으면 canonical은 HTTPS root, base path는 빈 값
- 페이지 URL은 trailing slash, 파일 URL은 확장자 뒤 slash 없음
- 잘못된 URL/custom hostname은 실패하고 선택값 오류는 안전한 경고 처리
- 유효한 Google token일 때만 Search Console URL-prefix 확인 meta 생성
- 유효한 Naver token일 때만 verification meta 생성

### 광고

- 기본값과 불완전 설정에서 script·slot DOM 0
- 유효 client/slot과 enable flag가 모두 있을 때만 렌더 가능
- 광고가 OFF여도 유효한 실제 client가 있으면 account meta와 custom-root `ads.txt`가 생성되며, 광고 loader·slot·request는 여전히 0
- safe placement 3개만 허용
- upload/editor/preview/result/download/navigation/privacy/terms/contact에서 차단
- 광고 OFF 빌드에서 Google 광고 요청이 유발되지 않음

### 이미지 공통

- MIME/signature, 빈·손상·초대형 입력 거부
- cover/contain, ratio lock, crop clamp와 회전 좌표
- stale async 결과가 새 파일·설정을 덮지 않음
- Blob URL 교체·초기화·unmount 해제
- 결과 MIME, signature, dimensions와 byte parse-back

### 기존 6개 도구

- 여권 413×531 JPEG, 실제 500KB 이하, background 작업 호출 차단
- 3×4cm=354×472, 3.5×4.5cm=413×531 환산
- 주민등록증 선택 JPEG/PNG와 DPI 표시/기록 일치
- YouTube 배너 2560×1440, 6MB 이하, 1235×338 최소 안전영역의 비율 환산
- 파비콘 PNG/ICO dimensions, manifest JSON, ZIP 필수 entry
- 개인정보 parser의 선택 제거, checksum/size와 표시한 보존 속성

### v2 추가 7개 도구

- 압축: KB/MB 변환, 제한된 품질 탐색, 최대 축소 횟수, 목표 달성/미달 상태와 actual bytes
- 리사이즈: 직접 치수·긴 변·퍼센트, 비율 잠금, contain/cover, 업스케일 경고
- 변환: JPEG/PNG/WebP signature, 투명→JPEG 배경 합성, 재인코딩·metadata 문구, HEIC 거부
- SNS 팩: 1:1·4:5·9:16 독립 crop, 원형 preview, 개별/ZIP result
- YouTube 썸네일: 3840×2160, 16:9, template text overflow와 작은 preview
- 네컷: 1~4장 순환 배치, 순서·crop·가로/세로·필터·날짜·문구, JPEG/PNG
- 필름: 고정 seed 재현성, grain/vignette/light leak/date/BW/저채도/flash, 비교·reset

### 같은 사진 전달

- 명시적 CTA 이전에는 transfer ref가 비어 있음
- 허용 대상 tool ID만 한 번 claim 가능
- claim 뒤 ref가 지워지고 두 번째 claim은 실패
- 다른 대상 도구는 파일을 얻지 못함
- storage API를 사용하지 않으며 새로고침 후 복구되지 않음

## 5. E2E 공통 절차

각 도구는 최소 한 번의 실제 다운로드 흐름을 가진다. 중요한 공통 도구는 desktop과 mobile 양쪽에서 수행한다.

1. 홈 검색 또는 카드에서 대상 route로 이동한다.
2. 합성 fixture를 선택하고 실제 preview가 나타날 때까지 상태 기반으로 기다린다.
3. 도구별 설정을 변경하고 화면 상태와 접근 가능한 이름을 확인한다.
4. 실제 결과를 생성하고 download event를 수집한다.
5. 저장 파일을 테스트 process에서 열어 형식·픽셀·byte·ZIP entry를 검사한다.
6. 처리되지 않은 page error와 예상 밖 console error가 0인지 확인한다.
7. route 이동, 직접 URL 접근과 새로고침을 확인한다.

## 6. 13개 도구 E2E 계약

| 도구 | 핵심 assertion |
| --- | --- |
| 여권사진 | JPEG 413×531, ≤512,000B, 배경 작업 부재, 승인 면책 |
| 일반 증명사진 | 354×472, 배경 후보와 원본 fallback |
| 주민등록증 사진 | 413×531, 선택 형식, 서비스 환산값 설명 |
| YouTube 배너 | 2560×1440, ≤6MiB, 안전영역·기기별 예상 표시 |
| 파비콘 | ZIP, ICO/PNG dimensions, manifest와 안내문 parse |
| 개인정보 정리 | 선택 metadata 제거, 결과 재파싱, 원본 비덮어쓰기 |
| 사진 용량 줄이기 | 목표 actual bytes, 달성·미달, 해상도 축소 opt-in |
| 이미지 크기 조절 | 설정 치수, ratio/contain/cover, 업스케일 경고 |
| 이미지 형식 변환 | JPEG/PNG/WebP 실제 signature, alpha/background, HEIC 거부 |
| SNS 이미지 세트 | 세 비율의 별도 crop과 individual/ZIP 파일 |
| YouTube 썸네일 | 3840×2160, 16:9, template text와 preview |
| 네컷사진 | 파일 수별 반복 순서, 두 layout, 프레임·필터·텍스트 |
| 필름사진 | effect 변화, 동일 설정 재현, 비교·reset, 다운로드 |

추가 오류 시나리오는 잘못된 signature, 손상, 과대 입력, decode 실패, 얼굴 미검출, 압축 목표 미달, ZIP 실패와 download 차단을 가능한 범위에서 주입한다. 오류를 성공 화면으로 전환하지 않고 복구 문구를 확인한다.

## 7. 8개 가이드·SEO E2E

- `/guide`에 8개 카드가 있고 각 route로 이동 가능
- 8개 상세 route의 title, description, canonical, OG/Twitter 이미지
- 1200×630 OG PNG가 실제로 존재하고 HTTP 200/MIME이 올바름
- 도구 CTA와 관련 가이드 링크가 base path를 존중
- visible FAQ는 읽을 수 있으나 DOM/HTML에 `FAQPage` JSON-LD가 없음
- 홈 `WebSite`, 가이드 허브 `ItemList`, 도구 `BreadcrumbList`, 가이드 상세 `BreadcrumbList`/`Article`만 parse 가능
- 실제 price·review·rating 근거가 없는 `WebApplication`/`SoftwareApplication`이 없음
- sitemap에 13개 도구, 8개 가이드와 정보 페이지가 base mode에 맞게 포함
- robots와 canonical에 잘못된 host·중복 base path·가짜 연락처가 없음

Search Console URL-prefix 확인 meta의 존재는 E2E로 검사할 수 있지만 속성 등록, 소유권 확인, sitemap 제출과 색인은 대신할 수 없다. 공개 HTTPS를 포함한 외부 검증을 실제로 하지 않았다면 `NOT_TESTED`다.

## 8. 개인정보·네트워크 E2E

production-like preview에서 request와 storage를 수집한다.

- 이미지 작업으로 생긴 POST/PUT/PATCH 0건
- fixture marker, 파일명, GPS, 기기명, 얼굴 bbox가 request body/URL/console에 없음
- localStorage/sessionStorage/IndexedDB/Cache Storage에 이미지·파생 데이터 없음
- 같은 사진 전달이 one-shot이며 reload에서 사라짐
- 초기화·파일 교체·route 이동 후 이전 preview와 Object URL 해제
- 광고 OFF: 광고 script, slot DOM, Google 광고 request 0
- 광고 ON: 별도 build에서 safe placement만 사용, 사용자 이미지 body 부재, CMP·동의 흐름은 외부 운영 증거로 분리

브라우저 메모리의 즉시 zeroization은 자동화로 증명할 수 없다. 참조 해제와 저장·전송 부재만 검증하고 한계를 기록한다.

## 9. 접근성

`pnpm test:a11y` 대상은 다음을 포함한다.

- 홈
- 13개 도구의 초기 상태, 대표 upload/edit/result 상태
- 가이드 인덱스와 대표 공식·관행 가이드
- about, privacy, terms, contact, 404

자동·수동 기준:

- axe critical/serious violation 0
- skip link, heading·landmark 구조와 visible focus
- 파일 input, 버튼, slider, color/input의 이름·값·오류 연결
- `aria-live`, `aria-busy`, 색상 외 상태 텍스트
- 키보드만으로 핵심 흐름과 crop/설정 조작
- 안전영역·원형 preview·crop의 텍스트 대안
- 44px 수준의 모바일 touch target 검토
- reduced motion, 200% zoom과 긴 한국어 줄바꿈

axe 통과만으로 완료하지 않는다. 키보드와 VoiceOver 또는 동등한 스크린리더 smoke가 없으면 그 항목은 `NOT_TESTED`다.

## 10. 시각·브라우저 QA

권장 viewport:

- 1440×900 desktop
- 768×1024 tablet
- 390×844 mobile
- 320×568 narrow boundary

홈, 도구의 upload/edit/result, 가이드와 정보 페이지를 실제 스크린샷으로 열어 다음을 확인한다.

- 가로 overflow, 겹침, 잘림, sticky CTA 가림
- Canvas 비율, crop·안전영역과 원형 preview 정렬
- focus ring, disabled/processing 차이와 대비
- 긴 제목·FAQ·표의 모바일 줄바꿈
- 광고 OFF의 빈 공간 부재와 광고 ON safe placement

Desktop Chrome과 iPhone 13 WebKit 자동 검사는 필수다. 별도 Chromium 모바일 emulation과 실기기 Safari를 실행하지 않았다면 각각 `NOT_TESTED`로 기록한다.

## 11. 이중 build·preview

두 mode를 같은 명령의 재실행으로 간주하지 않고 각각 산출물·로그를 남긴다.

### GitHub project Pages mode

```bash
pnpm build:pages
```

검사:

- `out/` route와 `_next` asset이 `/pixelfit`을 정확히 한 번 사용
- canonical, OG, sitemap, robots가 실제 project Pages URL
- `/pixelfit/` 아래 직접 URL과 새로고침
- 정적 asset, OG PNG, manifest와 download MIME

### Custom-domain root mode

```bash
pnpm build:custom:test
```

`build:custom:test`의 host는 로컬 계약 검사용 `.test` 값이며 실제 소유 도메인이나 DNS 적용을 뜻하지 않는다. `pnpm build`는 production 후보 `pixelfit.me`의 custom-root 계약과 verifier를 실행한다. GitHub Actions에서는 repository variable 또는 workflow 기본값을 `pnpm build:deploy`에 전달한 뒤 `pnpm verify:export`를 실행한다.

검사:

- canonical과 sitemap이 root origin이며 `/pixelfit` 잔존 0
- 내부 link와 `_next` asset이 root-relative
- Pages `CNAME` 자동 적용을 성공으로 가정하지 않음
- 실제 소유 도메인의 DNS, Pages Settings, TLS는 외부 검증 전 `NOT_TESTED`
- 기존 `pixelfit.o-r.kr`의 공개 검증 결과를 새 `pixelfit.me`의 DNS·TLS·검색 소유권 증거로 재사용하지 않음

두 build가 모두 성공하고 각 `out/`을 별도로 preview해도 공개 배포 완료를 뜻하지 않는다.

## 12. Lighthouse

production static preview 또는 실제 후보 URL에서 다음 대표 route를 mobile/desktop으로 측정한다.

- 홈
- `/passport-photo`
- `/image-compressor`
- `/youtube-thumbnail`
- `/four-cut-photo`
- 대표 가이드 1개

목표:

| 항목 | 목표 |
| --- | ---: |
| Performance | ≥ 90 |
| Accessibility | ≥ 95 |
| Best Practices | ≥ 95 |
| SEO | ≥ 95 |
| CLS | < 0.1 |

환경, throttling, route, build mode와 실제 숫자를 원본 report와 함께 기록한다. 목표 미달은 숨기지 않고 `FAIL` 또는 승인된 알려진 제한으로 처리한다. 실행하지 않았다면 숫자를 추정하지 않고 `NOT_TESTED`다.

## 13. 출시 판정

로컬 v2 release candidate가 되려면 다음 증거가 필요하다.

- lint, typecheck, unit/component, production build `PASS`
- 13개 도구 실제 다운로드 E2E `PASS`
- 8개 가이드와 SEO route 검사 `PASS`
- privacy·storage·same-photo·광고 OFF 검사 `PASS`
- 접근성 자동 검사와 필수 수동 smoke `PASS`
- project Pages와 custom root build 계약 `PASS`
- Lighthouse 결과와 알려진 제한 기록

공개 v2 release로 승인하려면 로컬 RC에 더해 다음 증거가 필요하다.

- 최종 commit과 GitHub-hosted Actions `PASS`
- GitHub Pages artifact 배포와 실제 공개 URL smoke `PASS`
- 공개 HTTPS, asset MIME, 직접 URL·새로고침과 404 동작 확인

외부 계정 단계인 DNS/TLS, Search Console, Naver, AdSense 승인, CMP와 `ads.txt`는 완료된 것만 별도로 표시한다. 기존 `pixelfit.o-r.kr`은 상위 `o-r.kr/ads.txt`를 제어할 수 없어 AdSense 등록이 차단됐고, 새 후보 `pixelfit.me`는 각각의 공개·계정 검증을 새로 통과해야 한다. 어느 하나라도 증거가 없으면 이전 호스트 기록을 재사용하지 않고 해당 항목을 `NOT_TESTED` 또는 미완료로 둔다.
