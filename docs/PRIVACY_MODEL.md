# 픽셀핏 개인정보·보안 모델

기준일: 2026-07-23

## 1. 보장 범위

픽셀핏의 이미지 기능은 사용자가 고른 파일과 파생 데이터를 현재 브라우저 메모리에서 처리한다. 앱에는 이미지 업로드 API, 계정, 사용자 작업 데이터베이스나 클라우드 저장 기능이 없다. 다운로드는 브라우저가 만든 Blob 또는 ZIP을 사용자의 기기에 새 파일로 저장하는 동작이다.

“로컬 처리”는 픽셀핏의 정상 이미지 처리 코드가 원본 파일, 픽셀, 얼굴 bbox 또는 metadata를 서버로 보내지 않는다는 뜻이다. 다음까지 통제하거나 완전한 익명성을 보장하지는 않는다.

- 악성 브라우저 확장, 감염된 기기와 운영체제
- 사용자가 선택한 다운로드 폴더와 클라우드 동기화
- 이미지 픽셀 자체에 보이는 얼굴, 주소, 차량번호와 문서 내용
- 명시적으로 활성화한 AdSense/CMP의 별도 네트워크·쿠키 동작

## 2. 상태 구분

- 공개 v1은 2026-07-22에 기존 6개 도구의 개인정보 smoke 기록을 남겼다.
- 2026-07-23 로컬 v2 RC에는 13개 도구, 같은 사진 메모리 전달과 선택적 광고 구성이 추가됐다.

공개 v1의 검사 결과를 재사용하지 않고 v2 privacy E2E를 별도로 실행했다. 이미지 처리 POST/PUT/PATCH 0, 같은 사진 one-shot 전달과 새로고침 소멸, local/session/IndexedDB 이미지 저장 부재, 광고 OFF DOM·초기 JS 부재가 통과했다. 광고 ON staging·CMP·실계정 네트워크 검사는 `NOT_TESTED`이며 상세 수치는 [STATUS.md](./STATUS.md)에 기록한다.

## 3. 데이터 분류

| 데이터 | 예 | 허용 위치 | 앱 영속 저장 |
| --- | --- | --- | --- |
| 원본 파일 | JPEG/PNG/WebP 바이트 | 현재 탭 메모리 | 금지 |
| 파생 픽셀 | bitmap, Canvas, preview | 현재 탭/Worker 메모리 | 금지 |
| 생체 보조 데이터 | 얼굴 bbox와 검출 수 | 현재 작업 메모리 | 금지 |
| 메타데이터 | GPS, 기기, 촬영일, XMP/IPTC | 현재 작업 메모리 | 금지 |
| 편집 상태 | crop, zoom, effect, 텍스트 | React state/ref | 금지 |
| 도구 간 전달 | 사용자가 명시한 `File` 하나와 대상 도구 ID | Provider의 `useRef` | 금지 |
| 결과 | 생성 Blob/ZIP | 메모리, 이후 사용자 지정 다운로드 위치 | 앱 저장 금지 |
| 배포 설정 | URL, 광고 client/slot, 검증 token | build-time 환경과 정적 bundle | 사용자 이미지 아님 |

파일명, EXIF 값, 얼굴 좌표, 원본 bytes를 원격 분석 이벤트나 콘솔 로그에 넣지 않는다. 현재 제품은 사용자 이미지 분석 SDK를 기본 사용하지 않는다.

## 4. 이미지 데이터 생명주기

1. 사용자가 `<input type="file">` 또는 drop으로 로컬 파일을 선택한다.
2. 앱이 byte 크기, MIME, signature와 픽셀 한도를 확인한다.
3. `createImageBitmap`, Canvas 또는 형식별 parser가 메모리에서 처리한다.
4. 미리보기용 Object URL이 필요할 때만 `blob:` URL을 만든다.
5. 결과 Blob/ZIP을 만들고 도구가 약속한 형식·치수·byte를 다시 검사한다.
6. 사용자가 다운로드를 선택하면 원본을 덮어쓰지 않는 새 파일로 저장한다.
7. 새 파일 선택, 초기화, 취소, route 이동 또는 컴포넌트 해제 때 URL을 revoke하고 참조를 버린다.
8. 새로고침 또는 탭 종료 뒤 작업 상태를 복구하지 않는다.

원본 또는 파생 이미지를 `localStorage`, `sessionStorage`, IndexedDB, Cache Storage나 cookie에 저장하지 않는다. 참조를 끊어도 브라우저의 가비지 컬렉션 시점을 강제로 보장할 수는 없다.

## 5. 같은 사진으로 다음 도구

결과 화면의 명시적 CTA를 누르면 동일한 `File`을 현재 탭 안에서 다음 도구로 한 번 전달할 수 있다.

- `ImageTransferProvider`가 `File`과 대상 도구 ID를 React `useRef`에 보관한다.
- 대상 도구 ID가 맞을 때 한 번만 `claim`하고 즉시 ref를 비운다.
- 사용자가 누르지 않으면 전달하지 않으며, 다른 도구는 claim할 수 없다.
- 복제 업로드, 네트워크 전송, local/session storage, IndexedDB 또는 Cache Storage를 사용하지 않는다.
- 새로고침, 탭 종료 또는 Provider 생명주기 종료 시 사라진다.

이 기능은 “브라우저 메모리 전달”이지 저장된 프로젝트나 복구 기능이 아니다. UI도 새로고침 후 사라진다는 점을 알린다.

## 6. 네트워크 모델

네트워크를 이미지 처리와 페이지 제공/광고로 나눠 기록한다.

### A. 항상 가능한 자체 정적 요청

- 같은 origin의 HTML, CSS, JavaScript, 아이콘, manifest, 자체 OG PNG
- sitemap, robots, 404와 route 탐색
- 개발 환경에 한정된 HMR 요청

이 요청은 페이지를 제공하기 위한 것이며 선택한 이미지 bytes를 body로 보내면 안 된다.

### B. 금지된 이미지 처리 요청

- 원본/파생 Blob, 픽셀, metadata 또는 얼굴 bbox를 포함한 POST/PUT/PATCH
- 이미지 변환, 얼굴 분석, 배경 제거, 압축, 생성형 효과용 외부 API
- 사용자의 `blob:` URL을 원격 목적지로 보내는 요청
- 실패한 로컬 기능을 원격 모델이나 HEIC 변환 서버로 자동 대체하는 요청

### C. 조건부 외부 요청

AdSense는 기본 OFF다. `ADSENSE_ENABLED=true`, 유효한 client와 slot, 안전한 placement가 모두 있어야 Google 광고 스크립트/슬롯을 렌더링한다. 활성화 시 광고 도메인 요청, cookie 또는 동의 상태 처리 가능성이 있으므로 “네트워크 요청 0건”을 전체 사이트 보장으로 표현하면 안 된다.

CMP는 현재 코드에 내장된 것으로 간주하지 않는다. AdSense를 실제 운영할 때는 서비스 지역과 계정 정책에 맞는 인증된 CMP, 개인정보 고지, 동의 철회, `ads.txt`와 계정 상태를 운영자가 별도로 구성·검증해야 한다. Search Console/Naver 소유권 확인 요청은 이미지 처리와 무관한 외부 운영 경계다.

## 7. 광고 안전 경계

광고가 켜져도 다음 위치에만 슬롯을 둘 수 있다.

- 홈 콘텐츠 구분
- 가이드 콘텐츠 구분
- 도구의 편집기와 결과가 끝난 뒤 설명 영역

업로드, 편집, 미리보기, 결과, 다운로드 버튼, 내비게이션, privacy, terms, contact에는 광고를 두지 않는다. 이는 오클릭과 파일 작업 혼동을 줄이기 위한 제품 게이트다. 설정이 없거나 형식이 틀리면 스크립트와 슬롯을 모두 렌더링하지 않는다.

광고 OFF privacy 검사는 외부 광고 요청과 광고 DOM이 0인지 확인한다. 광고 ON 검사는 별도 환경에서 safe placement, 사용자 이미지 request body 부재, CMP·동의 흐름과 정책을 확인해야 하며 OFF 결과로 대체하지 않는다.

## 8. 얼굴·배경·창작 효과

- 얼굴 자동 맞춤은 선택적 브라우저 `FaceDetector`의 bbox만 일시적으로 사용한다. 신원을 식별·비교·저장하지 않는다.
- API가 없거나 실패하면 외부 얼굴 모델을 호출하지 않고 수동 crop으로 이어진다.
- 일반 증명사진 배경 분리는 가장자리 색상 표본의 로컬 결정적 계산이다. 여권사진은 이 모듈을 호출할 수 없다.
- 필름, 네컷, SNS, YouTube 템플릿은 Canvas의 로컬 계산이다. 사진 내용을 원격 AI에 보내거나 새 인물·장면을 생성하지 않는다.

## 9. 메타데이터 정리

사용자는 제거할 개인정보성 범주와 알려진 한계를 확인하고 결과를 새 파일로 받는다.

### JPEG

지원되는 구조에서는 entropy-coded scan data를 유지하고 선택된 EXIF/XMP/IPTC APP segment를 제외한다. orientation, density, ICC와 출처 관련 segment는 정책에 따라 보존을 시도하며 실제 결과를 다시 파싱한다.

### PNG

IDAT와 alpha, `iCCP`, `pHYs`를 가능한 범위에서 유지하고 선택된 `eXIf`와 개인정보성 text chunk를 제외한다. 길이와 CRC가 유효한지 재검사한다.

### WebP

VP8/VP8L/VP8X image payload와 alpha/ICC를 가능한 범위에서 유지하고 선택한 EXIF/XMP chunk를 제외한다. RIFF size와 padding을 다시 계산한다.

알 수 없는 vendor metadata가 남을 수 있다. 재인코딩 경로는 픽셀·색상·metadata 보존을 약속하지 않는다. 지원하지 않는 container를 성공 처리하지 않으며 HEIC은 현재 범위 밖이다.

## 10. 출처 자격 증명

SynthID, C2PA, JUMBF, Content Credentials 또는 워터마크를 탐지·제거·우회하는 기능은 없다.

- 알려진 출처 정보를 개인정보 제거 선택지에 넣지 않는다.
- 파일 변경으로 서명이나 자격 증명이 무효화될 수 있음을 경고한다.
- 확인 없이 “완전 보존” 또는 “유효성 유지”를 주장하지 않는다.
- 파서가 모르는 metadata가 남을 수 있음을 알린다.

가짜 촬영일, GPS, 카메라, review, rating 또는 수정일을 새로 만들지 않는다.

## 11. 입력 공격면과 통제

| 위험 | 통제 |
| --- | --- |
| 확장자를 위장한 파일 | MIME과 magic bytes 조합 검사 |
| 압축 폭탄·초대형 이미지 | decode 전 byte/예상 픽셀, decode 후 픽셀 한도 |
| 손상 container | 경계·길이·CRC/RIFF size 검사와 typed failure |
| 악성 SVG | 검증된 sanitizer/rasterizer가 없으므로 입력 거부 |
| 파일명 기반 XSS | React text 출력, 임의 HTML 삽입 금지, 결과명 정규화 |
| 외부 이미지 추적 | URL 입력 금지, 로컬 `File`/Blob만 허용 |
| stale async result | 작업 ID/취소 신호, 새 작업 시 이전 결과 폐기 |
| 메모리 잔류 | Object URL revoke, bitmap close와 참조 해제 |
| 광고 오클릭·혼동 | safe placement allowlist와 편집 표면 금지 |
| dependency 공급망 | lockfile 고정 설치, 직접 dependency와 라이선스 기록 |

## 12. 배포 보안 경계

static export는 앱 코드만으로 임의의 HTTP response header를 보장할 수 없다. CSP, Referrer-Policy, `nosniff`, Permissions-Policy, frame 제한, HTTPS, MIME과 cache는 실제 호스트에서 검사해야 한다. GitHub Pages에서 지원되지 않는 헤더를 적용 완료로 기록하지 않는다.

광고 OFF 후보의 CSP 예시는 자체 자산과 `blob:`/`data:` 미리보기만 허용하도록 최소화할 수 있다. 광고/CMP를 켜면 필요한 Google·CMP 도메인과 script/connect/frame 범위가 달라지므로 실제 provider 문서와 staging 측정을 기반으로 별도 정책을 설계해야 한다. 테스트하지 않은 고정 CSP를 릴리스 증거로 사용하지 않는다.

## 13. 필수 privacy 검증

production-like static preview에서 다음을 기록한다.

- 13개 도구의 파일 선택→결과→다운로드 동안 이미지 처리 POST/PUT/PATCH 0건
- request body와 URL에 fixture bytes, 파일명, EXIF, 얼굴 bbox 부재
- localStorage/sessionStorage/IndexedDB/Cache Storage에 사용자 이미지 부재
- 같은 사진 전달의 대상 제한, one-shot claim, 새로고침 소멸
- 초기화·파일 교체·route 이동 후 이전 Object URL과 preview 해제
- 광고 OFF에서 광고 DOM·외부 광고 request 0건
- 광고 ON은 별도 구성에서 safe placement와 CMP/동의/정책 검증
- 개인정보 정리 결과의 선택 필드 제거와 표시한 보존 속성 재파싱

Playwright는 브라우저 메모리의 즉시 zeroization을 증명하지 못한다. 저장·전송 부재와 참조 해제를 검증하고 그 한계를 명시한다. 실행 결과는 [TEST_PLAN.md](./TEST_PLAN.md)의 절차와 [STATUS.md](./STATUS.md)의 실제 증거를 따른다.

## 14. 남는 위험

- Canvas 인코더와 색상 관리는 브라우저별로 다를 수 있다.
- 비표준 vendor metadata와 알려지지 않은 출처 container는 탐지되지 않을 수 있다.
- 결과 파일에 보이는 개인정보는 EXIF 정리만으로 사라지지 않는다.
- 메모리 해제 시점과 다운로드 폴더 동기화는 앱이 통제하지 못한다.
- 광고를 활성화하면 외부 네트워크·cookie·동의 책임이 생긴다.
- 보안 헤더, DNS, TLS와 `ads.txt`는 실제 호스트 운영에 의존한다.
