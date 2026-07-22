# 픽셀핏 v1 테스트 계획

기준일: 2026-07-22

## 1. 원칙

테스트는 UI 렌더가 아니라 로컬 파일 입력 → 처리 → 실제 Blob/ZIP 생성 → 다운로드까지 검증한다. 생성 파일은 가능한 경우 다시 파싱해 픽셀, 형식, byte 크기, DPI, metadata와 ZIP 엔트리를 확인한다. 실행하지 않은 검사는 `NOT_TESTED`, 실패는 `FAIL`로 [STATUS.md](./STATUS.md)에 남긴다.

개인 얼굴 사진을 fixture로 저장하지 않는다. 테스트용 이미지는 코드로 생성한 기하 패턴·색상 블록 또는 라이선스가 명확한 자료만 사용한다. 얼굴 검출 adapter는 deterministic mock으로 기능 흐름을 검사하고 실제 네이티브 API는 별도 smoke로 분리한다.

## 2. 환경과 명령

최소 환경:

- package manager: package.json에 고정된 pnpm 버전
- Node.js: 22 이상
- unit/component: Vitest + jsdom + React Testing Library
- E2E: Playwright Chromium desktop 및 iPhone 13 profile
- 접근성: `@axe-core/playwright`

명령:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
pnpm test:a11y
pnpm check
```

`pnpm check`에 E2E가 포함되어 있지 않으므로 출시 전에 `pnpm test:e2e`와 `pnpm test:a11y`를 별도로 실행한다.

## 3. fixture 설계

| fixture | 목적 | 개인정보 |
| --- | --- | --- |
| 작은 JPEG/PNG/WebP 색상 패턴 | decode, crop, 정확한 출력 픽셀 | 없음 |
| EXIF orientation 1/3/6/8 JPEG | 방향 정규화와 좌표 | 합성 metadata |
| GPS/기기/날짜/작성자/XMP/IPTC JPEG | 선택 제거와 scan 보존 | 가상 값만 사용 |
| text/eXIf/iCCP/pHYs PNG | chunk 선택 제거·보존 | 가상 값만 사용 |
| EXIF/XMP/ICCP WebP | RIFF 제거·size 갱신 | 가상 값만 사용 |
| 투명 PNG | 배너/파비콘 배경 합성 | 없음 |
| 균일 가장자리 + 전경 도형 | 배경 분리 | 사람이 아닌 도형 |
| 손상·truncated·빈·MIME 위장 파일 | 오류 처리 | 없음 |
| 픽셀/byte 제한 경계 파일 | 메모리 보호 | 생성 fixture |

실제 C2PA fixture를 포함할 때는 재배포 라이선스를 확인하고 출처·해시를 notices에 기록한다. 준비되지 않았다면 해당 검사는 `NOT_TESTED`로 남기며 가짜 fixture로 보존 성공을 주장하지 않는다.

## 4. Unit test

### Registry와 정책

- cm→px: 3×4cm/300dpi = 354×472, 3.5×4.5cm/300dpi = 413×531
- slug 중복, 음수/0 출력 크기, 잘못된 형식 거부
- official source/확인일 필수 및 `approvalGuaranteed: true` 거부
- allowed/forbidden 작업 충돌 거부
- convention 프리셋의 공식 표기 거부
- 여권에 background-remove/replace, retouch, generative 작업 추가 시 실패
- 여권 실행 경계에서 배경 모듈 미호출

### 파일·기하·렌더

- MIME/signature 일치 및 위장/빈/손상 파일 거부
- cover/contain, 경계 clamp, 최소·최대 zoom
- 90/180/270도 회전 좌표와 회전 후 크기
- 얼굴 bbox 기반 초기 crop과 late result 무시
- DPR과 무관한 출력 치수
- 안전영역 2048×1152 → 2560×1440 스케일
- 출력 ASCII 파일명과 크기 formatting

### 인코드·압축·DPI

- 제한 횟수 품질 탐색과 종료 조건
- 달성/미달 시 올바른 결과 상태
- 여권 JPEG 413×531 및 500KB 이하 parse-back
- 배너 2560×1440 및 6MB 이하 parse-back
- JPEG density, PNG pHYs 기록 뒤 300dpi 허용 오차 내 parse-back

### 개인정보 container

- JPEG APP segment 선택 제거, scan data byte 동일성(무손실을 약속한 경로)
- JPEG orientation/ICC/DPI 보존 표시와 실제 결과 일치
- PNG 개인정보성 text/eXIf 제거, IDAT/iCCP/pHYs/alpha 보존
- PNG chunk length/CRC 유효성
- WebP EXIF/XMP 제거, image/alpha/ICC payload 보존, RIFF size/padding 유효성
- 제거 결과 재파싱 시 선택 필드 부재
- 출처 관련 segment가 제거 선택지에 들어가지 않음

### 배경·파비콘

- 가장자리 대표색과 mask가 동일 입력에서 동일 출력
- 원본 fallback과 허용 프리셋 검사
- 16/32/48/180/192/512 PNG dimension
- ICO directory와 16/32/48 entry decode
- manifest JSON 기본 name/short_name 유효성
- ZIP 필수 엔트리, 안정된 이름, 내부 파일 재검증

## 5. Component test

- 홈 검색의 여권/증명사진/주민등록증/유튜브/파비콘/위치정보/개인정보 키워드
- 프리셋 카드의 규격, 공식/일반 배지와 링크
- 업로드 label, 파일 선택, drag/drop, 지원 형식 안내
- 잘못된 파일 오류와 구체적 복구 안내
- crop 이동, zoom label/현재 값, rotate/reset, 키보드 화살표
- stale async 작업이 새 작업 상태를 덮지 않음
- pass/warning/info checklist가 아이콘·상태명·텍스트를 함께 표시
- 공식 출처, 확인일, 승인 비보장 면책
- 일반 증명사진 배경 테마와 원본 복귀
- 배너 안전영역 텍스트 대안
- 파비콘 작은 크기 미리보기와 manifest 기본값
- 개인정보 필드 선택, 제거/유지/재인코드·출처 영향 확인

## 6. E2E 시나리오

각 도구는 desktop과 mobile 중 최소 하나의 완전한 다운로드 흐름을 가진다. 핵심 공통 흐름은 두 viewport 모두 수행한다.

1. 홈에서 검색·카드로 각 도구에 이동한다.
2. fixture를 업로드하고 미리보기가 나타날 때까지 상태 기반으로 기다린다.
3. 위치·확대·회전 또는 해당 도구 테마를 조정한다.
4. 결과를 생성하고 다운로드 이벤트를 확인한다.
5. 저장된 파일을 테스트에서 열어 도구별 계약을 검사한다.
6. 처리 중 콘솔 `error`와 처리되지 않은 page error가 0건인지 확인한다.

도구별 계약:

| 도구 | 필수 E2E assertion |
| --- | --- |
| 여권 | JPEG, 413×531, ≤500KB, 배경 UI/호출 없음, 면책 표시 |
| 일반 증명 | 354×472, 배경 테마 전환, 원본 fallback |
| 주민등록증 | 413×531, 선택 형식, 300dpi 표시/실제 기록 일치 |
| YouTube | 2560×1440, ≤6MB, 안전영역·예상 기기 미리보기 |
| 파비콘 | ZIP 다운로드, 필수 엔트리, PNG/ICO dimension, manifest parse |
| 개인정보 | 선택 metadata 제거, 결과 재파싱, 원본 덮어쓰기 없음 |

추가 오류 E2E는 잘못된 signature, 손상 파일, 너무 큰 입력, decode 실패, 자동 얼굴 미검출, 압축 목표 미달, 다운로드 실패/차단을 가능한 범위에서 주입해 복구 문구를 확인한다.

## 7. 개인정보 E2E

production-like 정적 서버에서 업로드 전후 request를 수집한다.

- 작업 이후 이미지 처리 관련 외부 request가 없는지 확인한다.
- POST/PUT/PATCH가 0건인지 확인한다.
- fixture 고유 byte marker가 어떤 request body에도 없는지 확인한다.
- localStorage와 sessionStorage가 비어 있는지 확인한다.
- IndexedDB database와 Cache Storage에 이미지 데이터가 없는지 확인한다.
- 초기화·route 이동 후 이전 preview가 사라지고 Blob URL 참조가 남지 않는지 확인한다.
- 콘솔 출력에 fixture 파일명, GPS, 기기, 얼굴 bbox가 없는지 확인한다.

Playwright가 브라우저 내부 메모리의 즉시 zeroization을 증명할 수는 없다. 참조 해제와 저장/전송 부재를 검증하고 그 한계를 기록한다.

## 8. 접근성

`@a11y` 태그 시나리오는 홈, 여섯 도구의 초기/편집/결과 상태, privacy, terms, guide, 404를 포함한다.

- axe의 critical/serious violation 0건
- 키보드만으로 파일 선택 이후 핵심 흐름 완료
- focus order/visible, skip link, heading·landmark 구조
- form label, slider 이름·값, 오류 연결
- status `aria-live`, processing `aria-busy`
- 상태가 색상만으로 전달되지 않음
- 안전영역·crop의 텍스트 대안
- 44px 수준의 모바일 터치 타깃 검토
- reduced motion 환경에서 불필요한 애니메이션 없음

자동 axe 통과만으로 접근성 완료를 선언하지 않고 키보드와 스크린리더용 이름을 수동 확인한다.

## 9. 시각·브라우저 QA

권장 viewport:

- desktop: 1440×900
- narrow desktop/tablet: 768×1024
- mobile: 390×844 및 320×568 경계 확인

홈, 각 도구의 업로드/편집/결과, privacy/terms/guide/404 스크린샷을 생성하고 실제로 열어 다음을 확인한다.

- 가로 overflow, 겹침, 잘림, 긴 한국어 줄바꿈
- sticky 다운로드 버튼이 콘텐츠·키보드를 가리지 않음
- Canvas와 안내선 비율/중앙 정렬
- focus ring, 상태 대비, disabled/processing 차이
- 모바일 회전과 safe-area inset

Chromium desktop/mobile을 필수로 하고, Safari/WebKit의 파일·Canvas·메모리 위험 때문에 가능하면 WebKit smoke를 수행한다. 설정에 없는 브라우저를 실행하지 않았다면 `NOT_TESTED`로 남긴다.

## 10. 성능·보안·SEO

- production build route 목록과 bundle 경고 확인
- 홈 초기 로드에서 얼굴/배경 관련 무거운 모듈이나 모델 요청이 없는지 확인
- 대형 입력에서 UI 응답, 취소와 메모리 회복 smoke
- 응답 security header, CSP 위반, 외부 script/request 확인
- canonical, title, description, OG/Twitter, visible FAQ와 JSON-LD 일치
- sitemap/robots/404와 정적 호스트 clean URL 확인
- Lighthouse 또는 동등한 측정을 실제로 실행한 경우에만 수치 기록

## 11. 출시 판정

필수 unit/component/E2E/a11y/build가 모두 PASS이고 privacy 검사가 PASS여야 release candidate가 된다. 실제 호스트 설정이 필요한 항목은 staging 또는 공개 URL에서 확인한다. 실행 결과는 [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md)에 증거와 함께 반영한다.
