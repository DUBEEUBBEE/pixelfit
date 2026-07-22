# 픽셀핏 개인정보·보안 모델

기준일: 2026-07-22

## 1. 보장하려는 경계

픽셀핏은 사용자가 고른 이미지와 그 파생 데이터를 브라우저 메모리 안에서 처리한다. 앱에는 이미지 업로드 API, 계정, 데이터베이스, 사용자 작업 저장 기능이 없다. 다운로드는 브라우저가 생성한 로컬 Blob을 사용자의 기기에 새 파일로 저장하는 동작이다.

이 문서의 “로컬 처리”는 앱의 정상 코드 경로가 파일을 서버로 전송하지 않는다는 뜻이다. 악성 브라우저 확장, 감염된 기기, 운영체제, 사용자가 설치한 다운로드 동기화 소프트웨어까지 통제하거나 완전한 익명성을 보장한다는 뜻은 아니다.

## 2. 데이터 분류

| 데이터 | 예 | 허용 위치 | 영속 저장 |
| --- | --- | --- | --- |
| 원본 파일 | JPEG/PNG/WebP 바이트 | 현재 탭 메모리 | 금지 |
| 파생 픽셀 | decode bitmap, Canvas, preview | 현재 탭/Worker 메모리 | 금지 |
| 생체 보조 데이터 | 얼굴 bbox, 검출 수 | 현재 탭 메모리 | 금지 |
| 메타데이터 | GPS, 기기, 날짜, XMP/IPTC | 현재 탭 메모리 | 금지 |
| 편집 상태 | crop, zoom, rotate, theme | 현재 탭 React state | 금지 |
| 결과 파일 | 생성 Blob | 메모리, 이후 사용자 지정 다운로드 위치 | 앱 저장 금지 |
| 비민감 앱 설정 | 프리셋 정의, 한국어 문구 | 정적 bundle | 해당 없음 |

파일명, byte 크기, 픽셀 크기, EXIF 값, 얼굴 좌표는 분석 이벤트나 원격 로그에 넣지 않는다. v1은 분석 SDK를 기본 사용하지 않는다.

## 3. 데이터 생명주기

1. 사용자가 명시적으로 `<input type="file">` 또는 드롭으로 파일을 선택한다.
2. 앱이 크기·MIME·magic bytes와 안전 한도를 메모리에서 확인한다.
3. `createImageBitmap`/Canvas 또는 형식별 파서가 메모리에서 처리한다.
4. 필요할 때만 Blob URL을 만들어 미리보기에 사용한다. 외부 URL은 이미지 입력으로 허용하지 않는다.
5. 결과는 새 Blob으로 생성하고 규격을 다시 확인한 뒤 다운로드한다.
6. 새 파일 선택, 초기화, 취소, 페이지 이탈, 컴포넌트 해제 때 Object URL을 revoke하고 bitmap/Canvas/ArrayBuffer 참조를 버린다.
7. 새로고침 또는 탭 종료 시 작업 상태는 복구되지 않는다.

원본과 파생 이미지를 `localStorage`, `sessionStorage`, IndexedDB, Cache API, cookie에 저장하지 않는다. 서비스 워커를 도입할 경우 사용자 Blob을 캐시하지 않는지 별도 검토 전에는 출시할 수 없다.

## 4. 네트워크 정책

허용되는 정상 요청은 같은 origin의 HTML, CSS, JavaScript, 아이콘, manifest 등 정적 앱 자산이다. 이미지 처리, 얼굴 분석, 배경 제거, 메타데이터 정리를 위한 POST/PUT/PATCH 또는 외부 API 요청은 금지한다. 외부 모델 CDN과 third-party script도 사용하지 않는다.

검증 시 업로드 이후 모든 request를 기록해 다음을 확인한다.

- 이미지 작업으로 발생한 POST/PUT/PATCH 요청이 0건이다.
- request body에 입력 fixture bytes 또는 Blob이 없다.
- `blob:` URL이 네트워크 목적지로 사용되지 않는다.
- localStorage/sessionStorage/IndexedDB/Cache Storage에 이미지나 파생 데이터가 생기지 않는다.

브라우저 개발 서버의 HMR 요청은 production 개인정보 검사에서 제외한다. 최종 privacy smoke는 production 정적 산출물에서 다시 수행한다.

## 5. 얼굴·배경 보조

얼굴 자동 맞춤은 브라우저가 제공하는 선택적 `FaceDetector`의 bbox만 현재 작업 메모리에서 사용한다. 신원을 추론·비교·저장하지 않는다. API가 없거나 실패하면 네트워크 모델을 대신 호출하지 않고 수동 크롭으로 이어진다.

일반 증명사진 배경 분리는 가장자리 색상 표본 기반의 로컬 결정적 계산이다. 서버와 외부 ML 모델을 사용하지 않는다. 여권사진은 프리셋 작업 정책상 배경 분리 모듈을 호출할 수 없다.

## 6. 메타데이터 정리 정책

사용자는 제거할 개인정보성 필드를 선택하고 다운로드 전에 제거/유지 대상, 픽셀 재인코딩 여부, 품질 변화 가능성과 출처 자격 증명 영향을 확인한다. 원본을 덮어쓰지 않고 별도 ASCII 파일명으로 저장한다.

### JPEG

가능하면 entropy-coded scan data를 복사하고 개인정보성 EXIF/XMP/IPTC APP segment만 제거한다. orientation, JFIF/EXIF density, ICC와 출처 관련 segment는 보존 시도한다. orientation을 제거해야 하는 경로에서는 픽셀 방향을 먼저 정규화하지 않은 채 삭제해서 회전이 달라지는 결과를 만들면 안 된다.

### PNG

IDAT, 색상/alpha, `iCCP`, `pHYs`는 유지하고 선택된 `eXIf`와 개인정보성 text chunk만 제거한다. chunk 제거 뒤 길이와 CRC가 유효한지 다시 파싱한다.

### WebP

VP8/VP8L/VP8X image payload와 alpha/ICC는 유지하고 선택된 EXIF/XMP chunk만 제외한다. RIFF padding과 전체 size를 갱신하고 다시 파싱한다.

지원하지 않는 컨테이너나 무손실 정리가 불가능한 경로는 성공으로 꾸미지 않는다. 재인코딩을 사용한다면 다운로드 전에 명시하고 품질 변화 가능성을 알린다. HEIC은 안정적인 브라우저 전용 디코더, 라이선스와 번들 비용이 검증되기 전까지 지원하지 않는다.

## 7. 콘텐츠 출처 정보

SynthID, C2PA, JUMBF, Content Credentials 또는 워터마크를 제거하거나 우회하는 기능은 없다. 알려진 출처 관련 데이터는 개인정보 제거 선택지에 포함하지 않는다. 출처 데이터가 감지되었거나 확실히 분류할 수 없으면 다음을 지킨다.

- 제거 옵션을 제공하지 않는다.
- 파일이 변경되면 서명·자격 증명이 무효화될 수 있음을 경고한다.
- “완전 보존” 또는 “유효성 유지”를 검증 없이 주장하지 않는다.
- 파서가 모르는 metadata가 남을 수 있음을 알린다.

## 8. 입력 공격면과 통제

| 위험 | 통제 |
| --- | --- |
| 확장자를 위장한 파일 | MIME과 magic bytes를 함께 검사 |
| 압축 폭탄·초대형 이미지 | 입력 byte와 decode 전/후 픽셀 한도, 오류 복구 |
| 손상된 container | 경계·길이·CRC/RIFF size 검사, typed failure |
| 악성 SVG | 안전한 sanitizer가 검증되기 전 입력 거부 |
| 파일명 기반 XSS | React text 출력만 사용, HTML 삽입 금지, 결과명은 ASCII 상수 |
| 외부 이미지 추적 | URL 입력 금지, 로컬 File/Blob만 허용 |
| stale async result | task id/AbortController, 새 작업 시 이전 결과 폐기 |
| 메모리 잔류 | URL revoke, bitmap close 가능 시 호출, 참조·Canvas 해제 |
| iframe embedding | 호스트의 `frame-ancestors 'none'` 또는 X-Frame-Options |
| dependency 공급망 | lockfile 고정 설치, 직접 의존 라이선스 기록, release 전 audit 검토 |

## 9. 배포 보안 헤더

정적 호스트에서 다음 정책을 검토한다. 실제 bundle과 preview/download/Worker가 동작하는지 staging에서 확인한 뒤 적용하며, 테스트하지 않은 CSP를 “적용 완료”로 기록하지 않는다.

```text
Content-Security-Policy: default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; img-src 'self' blob: data:; media-src 'self' blob:; font-src 'self'; connect-src 'self'; worker-src 'self' blob:; manifest-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; form-action 'self'
Referrer-Policy: strict-origin-when-cross-origin
X-Content-Type-Options: nosniff
Permissions-Policy: camera=(), microphone=(), geolocation=()
X-Frame-Options: DENY
```

정적 Next.js hydration 때문에 inline script/style 허용이 필요한지는 실제 export로 확인한다. 가능하면 hash 기반 CSP로 강화하되 빌드마다 hash를 자동 생성·배포하는 경로 없이 수동 값을 고정하지 않는다. HTTPS와 정확한 정적 파일 MIME도 배포 호스트에서 확인한다.

## 10. 개인정보 테스트와 출시 증거

필수 자동 검사는 [TEST_PLAN.md](./TEST_PLAN.md)의 privacy E2E를 따른다. 추가 수동 확인은 다음과 같다.

- production Network 패널에서 로컬 fixture 처리 중 외부/변경 요청이 없는지 확인한다.
- Application 패널에서 모든 브라우저 저장소가 비어 있는지 확인한다.
- 초기화와 route 이동 뒤 이전 Blob URL이 더 이상 사용되지 않는지 확인한다.
- 콘솔에 파일명·메타데이터·얼굴 좌표가 출력되지 않는지 확인한다.
- 정리 결과를 다시 파싱해 선택 필드 제거와 표시한 보존 속성을 비교한다.

결과는 [STATUS.md](./STATUS.md)에 명령, 브라우저, 날짜와 함께 기록한다.

## 11. 남는 위험

- Canvas 색상 관리와 브라우저 인코더는 원본 ICC/픽셀을 완전히 동일하게 보존하지 않을 수 있다.
- 브라우저·OS 다운로드 처리와 클라우드 동기화는 앱의 통제 밖이다.
- 비표준 vendor metadata와 알려지지 않은 출처 container는 탐지되지 않을 수 있다.
- 메모리 해제는 참조를 끊는 것이며 가비지 컬렉션 시점을 강제하지 못한다.
- 보안 헤더는 정적 산출물뿐 아니라 실제 호스팅 설정에 의존한다.

이 한계를 사용자 개인정보 페이지와 관련 결과 화면에 과장 없이 표시한다.
